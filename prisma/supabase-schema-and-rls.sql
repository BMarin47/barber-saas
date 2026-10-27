-- =========================================================================
-- BARBERSAAS - CONFIGURACIÓN SUPABASE POSTGRESQL & ROW LEVEL SECURITY (RLS)
-- =========================================================================
-- Copia y pega este script en el "SQL Editor" de tu panel de Supabase
-- para crear las tablas, índices y políticas de seguridad a nivel de fila (RLS).

-- 1. CREACIÓN DE LA TABLA "Booking"
CREATE TABLE IF NOT EXISTS "Booking" (
    "id" TEXT PRIMARY KEY,
    "tenantId" TEXT NOT NULL DEFAULT 'tenant-golden-blade',
    "clientName" TEXT NOT NULL,
    "clientPhone" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "professionalName" TEXT DEFAULT 'Facundo "El Maestro" Rossi',
    "date" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "totalPrice" DOUBLE PRECISION DEFAULT 0,
    "paymentMethod" TEXT DEFAULT 'Efectivo / Transferencia en el local',
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentId" TEXT,
    "preferenceId" TEXT,
    "clientEmail" TEXT,
    "clientNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. ÍNDICES DE ALTO RENDIMIENTO
CREATE INDEX IF NOT EXISTS "Booking_tenantId_date_idx" ON "Booking"("tenantId", "date");
CREATE INDEX IF NOT EXISTS "Booking_date_idx" ON "Booking"("date");
CREATE INDEX IF NOT EXISTS "Booking_status_idx" ON "Booking"("status");
CREATE INDEX IF NOT EXISTS "Booking_paymentStatus_idx" ON "Booking"("paymentStatus");

-- 3. HABILITACIÓN DE SEGURIDAD A NIVEL DE FILA (RLS)
ALTER TABLE "Booking" ENABLE ROW LEVEL SECURITY;

-- 4. POLITICAS RLS: ver prisma/supabase-hardening.sql (ejecutarlo a continuacion de este script).
--    Elimina el acceso publico (anon), restringe por tenant con app_metadata y agrega el
--    indice unico parcial que garantiza 1 reserva activa por barbero/fecha/hora.
DROP POLICY IF EXISTS "Service role full access on Booking" ON "Booking";
CREATE POLICY "Service role full access on Booking" ON "Booking" FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 5. TRIGGER DE ACTUALIZACIÓN AUTOMÁTICA DE updatedAt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_booking_updated_at ON "Booking";
CREATE TRIGGER update_booking_updated_at
BEFORE UPDATE ON "Booking"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
