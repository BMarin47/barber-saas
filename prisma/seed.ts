import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed para BarberSaaS Multi-Tenant...')

  // 1. Crear Tenant Principal
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'golden-blade' },
    update: {},
    create: {
      slug: 'golden-blade',
      name: 'The Golden Blade Barber Club',
      description: 'Barbería de alta gama especializada en cortes clásicos, fades quirúrgicos y ritual tradicional de barba a navaja con toallas calientes.',
      phone: '+54 9 11 4820-9988',
      whatsappNumber: '5491148209988',
      address: 'Av. Libertador 2450, Recoleta',
      city: 'Buenos Aires',
      primaryColor: '#F59E0B',
      currency: 'ARS',
    },
  })

  console.log(`✅ Tenant creado: ${tenant.name} (${tenant.slug})`)

  // 2. Crear Categorías
  const catCortes = await prisma.serviceCategory.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: 'Cortes' } },
    update: {},
    create: { tenantId: tenant.id, name: 'Cortes', order: 1 },
  })

  const catBarba = await prisma.serviceCategory.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: 'Barba' } },
    update: {},
    create: { tenantId: tenant.id, name: 'Barba', order: 2 },
  })

  const catCombos = await prisma.serviceCategory.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: 'Combos VIP' } },
    update: {},
    create: { tenantId: tenant.id, name: 'Combos VIP', order: 3 },
  })

  // 3. Crear Servicios Clásicos
  await prisma.service.createMany({
    data: [
      {
        tenantId: tenant.id,
        categoryId: catCortes.id,
        name: 'Corte de Pelo',
        description: 'Corte clásico o degradé moderno con tijera y máquina, lavado capilar y peinado con cera importada.',
        price: 15000,
        duration: 30,
      },
      {
        tenantId: tenant.id,
        categoryId: catCombos.id,
        name: 'Corte y Barba',
        description: 'Experiencia completa: corte de cabello + perfilado y arreglo tradicional de barba con toalla caliente y navaja.',
        price: 18000,
        duration: 60,
      },
      {
        tenantId: tenant.id,
        categoryId: catBarba.id,
        name: 'Solo Barba',
        description: 'Perfilado simétrico con navaja tradicional, doble toalla vaporizada con esencias y aceites nutritivos.',
        price: 10000,
        duration: 30,
      },
    ],
    skipDuplicates: true,
  })

  console.log('✅ Servicios de catálogo creados.')

  // 4. Crear Profesionales
  await prisma.professional.createMany({
    data: [
      {
        tenantId: tenant.id,
        name: 'Facundo "El Maestro" Rossi',
        role: 'Master Barber & Fundador',
        bio: 'Más de 10 años de trayectoria esculpiendo estilos clásicos y degradés al milímetro.',
        rating: 5.0,
      },
      {
        tenantId: tenant.id,
        name: 'Mateo "Fade King" Benítez',
        role: 'Especialista en Skin Fade',
        bio: 'Experto en cortes urbanos modernos, líneas definidas y freestyle.',
        rating: 4.96,
      },
      {
        tenantId: tenant.id,
        name: 'Lucas "Beard Boss" Silva',
        role: 'Especialista en Barbas Tradicionales',
        bio: 'Dedicado al afeitado clásico a navaja abierta y cuidado integral de la piel.',
        rating: 4.94,
      },
    ],
    skipDuplicates: true,
  })

  console.log('✅ Profesionales creados.')
  console.log('🎉 Seed completado con éxito.')
}

main()
  .catch((e) => {
    console.error('Error durante el seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
