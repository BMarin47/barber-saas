-- =========================================================================
-- BARBERSAAS - HARDENING DE PRODUCCIÓN (idempotente, seguro de re-ejecutar)
-- =========================================================================
-- Ejecutar en Supabase > SQL Editor sobre la base de producción.
-- Qué resuelve:
--   1) Cupo estricto: 1 sola reserva ACTIVA por barbero + fecha + hora (barrera real
--      contra reservas dobles simultáneas, independiente del código de la app).
--   2) RLS: se eliminan las políticas públicas (anon) que exponían nombres, teléfonos y
--      emails de TODOS los clientes y permitían insertar/modificar reservas saltándose la
--      validación de horarios y de precio. Toda lectura/escritura pasa por el servidor Next.js.
--   3) El aislamiento por barbería ya no confía en user_metadata (editable por el propio usuario).
--   4) Restricciones de integridad (estados válidos, montos >= 0).
-- NOTA: Prisma se conecta con el rol "postgres" (DATABASE_URL), que NO está sujeto a RLS;
--       por eso la app sigue funcionando. RLS protege el acceso vía API REST de Supabase (anon key).

-- 1) CUPO ESTRICTO ---------------------------------------------------------
DO $$
DECLARE dup_count integer;
BEGIN
  SELECT count(*) INTO dup_count FROM (
    SELECT 1 FROM "Booking"
    WHERE "status" <> 'CANCELLED'
    GROUP BY "tenantId", "professionalName", "date", "time"
    HAVING count(*) > 1
  ) d;

  IF dup_count > 0 THEN
    RAISE EXCEPTION
      'Hay % horario(s) con reservas activas duplicadas. Cancelá los duplicados antes de crear el índice único: SELECT "tenantId","professionalName","date","time",array_agg("id") FROM "Booking" WHERE "status"<>''CANCELLED'' GROUP BY 1,2,3,4 HAVING count(*)>1;',
      dup_count;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "Booking_unique_active_slot"
ON "Booking" ("tenantId", "professionalName", "date", "time")
WHERE "status" <> 'CANCELLED';

-- 2) RLS: ELIMINAR ACCESO PÚBLICO -----------------------------------------
ALTER TABLE "Booking" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public anonymous insert booking" ON "Booking";
DROP POLICY IF EXISTS "Public can view single booking for cancellation" ON "Booking";
DROP POLICY IF EXISTS "Public can cancel own booking by id" ON "Booking";

REVOKE ALL ON TABLE "Booking" FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE "Booking" FROM authenticated;

DROP POLICY IF EXISTS "Service role full access on Booking" ON "Booking";
CREATE POLICY "Service role full access on Booking"
ON "Booking" FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- 3) AISLAMIENTO POR BARBERÍA (sólo app_metadata, que el usuario NO puede modificar)
DROP POLICY IF EXISTS "Tenant isolation policy on Booking" ON "Booking";
CREATE POLICY "Tenant isolation policy on Booking"
ON "Booking" FOR SELECT TO authenticated
USING ("tenantId" = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));

-- 4) INTEGRIDAD ------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Booking_status_check') THEN
    ALTER TABLE "Booking" ADD CONSTRAINT "Booking_status_check"
      CHECK ("status" IN ('PENDING','CONFIRMED','CANCELLED')) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Booking_paymentStatus_check') THEN
    ALTER TABLE "Booking" ADD CONSTRAINT "Booking_paymentStatus_check"
      CHECK ("paymentStatus" IN ('PENDING','PAID','REJECTED','CANCELLED')) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Booking_totalPrice_check') THEN
    ALTER TABLE "Booking" ADD CONSTRAINT "Booking_totalPrice_check"
      CHECK ("totalPrice" IS NULL OR "totalPrice" >= 0) NOT VALID;
  END IF;
END $$;

-- 5) Unificar texto del método de pago presencial en reservas existentes
ALTER TABLE "Booking" ALTER COLUMN "paymentMethod" SET DEFAULT 'Efectivo o transferencia en local';
UPDATE "Booking"
SET "paymentMethod" = 'Efectivo o transferencia en local'
WHERE "paymentMethod" = 'Efectivo / Transferencia en el local';

-- Verificación rápida (debería listar sólo service_role y la política por tenant):
-- SELECT policyname, roles, cmd FROM pg_policies WHERE tablename = 'Booking';
