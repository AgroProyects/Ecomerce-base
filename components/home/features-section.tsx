import { Truck, Shield, CreditCard, Headphones } from 'lucide-react'
import { FeatureCard } from './feature-card'

const features = [
  {
    icon: Truck,
    title: 'Envío rápido',
    description: 'Entrega a todo el país en 24-72hs. Envío gratis en compras mayores a $50.000',
  },
  {
    icon: Shield,
    title: 'Compra segura',
    description: 'Todos tus datos están protegidos. Pagá con la tranquilidad que merecés',
  },
  {
    icon: CreditCard,
    title: 'Múltiples pagos',
    description: 'Aceptamos todas las tarjetas, Mercado Pago y transferencia bancaria',
  },
  {
    icon: Headphones,
    title: 'Atención 24/7',
    description: 'Nuestro equipo está disponible para ayudarte cuando lo necesites',
  },
]

export function FeaturesSection() {
  return (
    <section className="border-y border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="container mx-auto px-4 py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
