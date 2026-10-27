/**
 * Genera el cliente Prisma con el esquema correcto:
 *  - Vercel / DATABASE_URL postgres -> prisma/schema.postgresql.prisma (Supabase)
 *  - Desarrollo local con SQLite   -> prisma/schema.prisma
 */
const { execSync } = require('child_process')

const url = process.env.DATABASE_URL || ''
const usePostgresSchema = !!process.env.VERCEL || /^postgres(ql)?:\/\//.test(url)
const schema = usePostgresSchema ? 'prisma/schema.postgresql.prisma' : 'prisma/schema.prisma'

console.log(`[prisma-generate] usando ${schema}`)
execSync(`npx prisma generate --schema ${schema}`, { stdio: 'inherit' })
