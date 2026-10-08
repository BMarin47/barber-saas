import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding turnos de demostración...')
  const today = new Date().toISOString().split('T')[0]

  const count = await prisma.booking.count()
  if (count === 0) {
    await prisma.booking.createMany({
      data: [
        {
          clientName: 'Lucas González',
          clientPhone: '5492604654255',
          serviceName: 'Corte y Barba',
          professionalName: 'Facundo "El Maestro" Rossi',
          date: today,
          time: '16:00',
          totalPrice: 18000,
          status: 'CONFIRMED',
          paymentMethod: 'Efectivo / Transferencia en el local',
          clientNotes: 'Degradé medio y toalla caliente',
        },
        {
          clientName: 'Martín Morales',
          clientPhone: '5492604889911',
          serviceName: 'Corte de Pelo',
          professionalName: 'Mateo "Fade King" Benítez',
          date: today,
          time: '17:30',
          totalPrice: 15000,
          status: 'CONFIRMED',
          paymentMethod: 'Mercado Pago',
          clientNotes: 'Skin fade al ras',
        },
        {
          clientName: 'Alejandro Domínguez',
          clientPhone: '5492604332211',
          serviceName: 'Solo Barba',
          professionalName: 'Lucas "Beard Boss" Silva',
          date: today,
          time: '19:00',
          totalPrice: 10000,
          status: 'CONFIRMED',
          paymentMethod: 'Efectivo / Transferencia en el local',
        },
      ],
    })
    console.log('✅ Turnos de demostración insertados con éxito.')
  } else {
    console.log(`ℹ️ La base de datos ya contiene ${count} reservas.`)
  }
}

main()
  .catch((e) => {
    console.error('Error durante el seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
