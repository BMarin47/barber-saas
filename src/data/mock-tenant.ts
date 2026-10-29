import { TenantInfo, ServiceItem } from '@/types/booking'

export const mockTenant: TenantInfo = {
  id: 'tenant-golden-blade',
  slug: 'golden-blade',
  name: 'The Golden Blade Barber Club',
  description: 'Barbería de alta gama especializada en cortes clásicos, fades quirúrgicos y ritual tradicional de barba a navaja con toallas calientes.',
  phone: '+54 9 260 465-4255',
  whatsappNumber: '5492604654255',
  address: 'Av. Ballofet y Quiroga, San Rafael',
  city: 'Mendoza',
  logoUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=160&auto=format&fit=crop&q=80',
  coverUrl: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1200&auto=format&fit=crop&q=80',
  primaryColor: '#F59E0B',
  currency: 'ARS',
  rating: 4.96,
  reviewCount: 382,
}

export const mockServices: ServiceItem[] = [
  {
    id: 'srv-corte',
    tenantId: 'tenant-golden-blade',
    name: 'Corte de Pelo',
    description: 'Corte clásico o degradé moderno con tijera y máquina, lavado capilar y peinado con cera importada.',
    price: 15000,
    duration: 30,
    category: 'Clásicos',
    popular: false,
    imageUrl: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'srv-corte-barba',
    tenantId: 'tenant-golden-blade',
    name: 'Corte y Barba',
    description: 'Experiencia completa: corte de cabello + perfilado y arreglo tradicional de barba con toalla caliente y navaja.',
    price: 18000,
    duration: 60,
    category: 'Combos',
    popular: true,
    imageUrl: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'srv-solo-barba',
    tenantId: 'tenant-golden-blade',
    name: 'Solo Barba',
    description: 'Perfilado simétrico con navaja tradicional, doble toalla vaporizada con esencias y aceites nutritivos.',
    price: 10000,
    duration: 30,
    category: 'Barba',
    popular: false,
    imageUrl: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=600&auto=format&fit=crop&q=80',
  },
]
