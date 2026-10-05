export interface TenantInfo {
  id: string
  slug: string
  name: string
  description?: string | null
  phone?: string | null
  whatsappNumber?: string | null
  address?: string | null
  city?: string | null
  logoUrl?: string | null
  coverUrl?: string | null
  primaryColor: string
  currency: string
  rating?: number
  reviewCount?: number
}

export interface ServiceItem {
  id: string
  tenantId: string
  name: string
  description: string
  price: number
  duration: number // en minutos
  category: string
  imageUrl?: string
  popular?: boolean
}

export interface ProfessionalItem {
  id: string
  tenantId: string
  name: string
  role: string
  bio: string
  avatarUrl: string
  rating: number
  reviewCount: number
  availableToday?: boolean
  nextAvailableSlot?: string
}

export interface ClientDetails {
  name: string
  phone: string
  email: string
  notes: string
}

export interface TimeSlot {
  time: string // "09:00", "09:45"
  available: boolean
  period: 'morning' | 'afternoon'
}

export interface BookingState {
  service: ServiceItem | null
  professional: ProfessionalItem | null
  date: string // YYYY-MM-DD
  time: string // HH:MM
  client: ClientDetails
}
