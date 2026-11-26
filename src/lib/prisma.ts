import { PrismaClient } from '@prisma/client'

function resolveDatabaseUrl(): string | undefined {
  const raw = process.env.DATABASE_URL?.trim()
  if (!raw) return undefined

  // En Supabase Transaction Pooler (puerto 6543 o pooler.supabase.com),
  // Prisma requiere ?pgbouncer=true para desactivar prepared statements y evitar errores 42P05 en Vercel Serverless.
  if (
    /^postgres(ql)?:\/\//i.test(raw) &&
    (raw.includes(':6543') || raw.includes('pooler.supabase.com')) &&
    !raw.includes('pgbouncer=true')
  ) {
    const separator = raw.includes('?') ? '&' : '?'
    return `${raw}${separator}pgbouncer=true&connection_limit=1`
  }

  return raw
}

const prismaClientSingleton = () => {
  const url = resolveDatabaseUrl()
  return new PrismaClient(
    url
      ? {
          datasources: {
            db: { url },
          },
        }
      : undefined
  )
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton> | undefined
} & typeof global

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma

export default prisma
