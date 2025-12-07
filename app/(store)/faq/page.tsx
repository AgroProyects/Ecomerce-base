'use client'

import { useState } from 'react'
import { ChevronDown, Search, Package, Truck, CreditCard, RefreshCw, HelpCircle, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

interface FAQ {
  question: string
  answer: string
}

interface FAQCategory {
  id: string
  title: string
  icon: React.ElementType
  faqs: FAQ[]
}

const faqCategories: FAQCategory[] = [
  {
    id: 'pedidos',
    title: 'Pedidos y Compras',
    icon: Package,
    faqs: [
      {
        question: '¿Cómo puedo hacer un pedido?',
        answer: 'Navega por nuestra tienda, agrega los productos que desees al carrito y finaliza tu compra siguiendo los pasos del checkout. Necesitarás crear una cuenta o ingresar como invitado.',
      },
      {
        question: '¿Puedo modificar mi pedido después de realizarlo?',
        answer: 'Si tu pedido aún no fue despachado, contactanos lo antes posible y haremos lo posible por modificarlo. Una vez despachado, no es posible realizar cambios.',
      },
      {
        question: '¿Cómo puedo cancelar mi pedido?',
        answer: 'Podés cancelar tu pedido contactándonos antes de que sea despachado. Si ya fue enviado, deberás esperar a recibirlo y luego solicitar una devolución.',
      },
      {
        question: '¿Recibiré una confirmación de mi pedido?',
        answer: 'Sí, una vez completada tu compra recibirás un email con la confirmación y los detalles de tu pedido. También podrás ver el estado en "Mi Cuenta".',
      },
    ],
  },
  {
    id: 'envios',
    title: 'Envíos y Entregas',
    icon: Truck,
    faqs: [
      {
        question: '¿Cuánto tarda en llegar mi pedido?',
        answer: 'Los tiempos de entrega varían según tu ubicación. En CABA y GBA: 2-4 días hábiles. Interior: 5-10 días hábiles. Recibirás un código de seguimiento por email.',
      },
      {
        question: '¿Cuánto cuesta el envío?',
        answer: 'El costo de envío se calcula según tu ubicación y el peso del paquete. Podés ver el costo exacto en el checkout antes de confirmar tu compra. Envío gratis en compras mayores a $50,000.',
      },
      {
        question: '¿Hacen envíos a todo el país?',
        answer: 'Sí, realizamos envíos a todas las provincias de Argentina a través de las principales empresas de correo.',
      },
      {
        question: '¿Cómo puedo rastrear mi pedido?',
        answer: 'Una vez despachado tu pedido, recibirás un email con el número de seguimiento. También podés consultar el estado en la sección "Mis Pedidos" de tu cuenta o en nuestra página de seguimiento.',
      },
    ],
  },
  {
    id: 'pagos',
    title: 'Pagos y Facturación',
    icon: CreditCard,
    faqs: [
      {
        question: '¿Qué medios de pago aceptan?',
        answer: 'Aceptamos tarjetas de crédito y débito (Visa, Mastercard, American Express), Mercado Pago, transferencia bancaria y pago en efectivo en puntos de pago.',
      },
      {
        question: '¿Puedo pagar en cuotas?',
        answer: 'Sí, ofrecemos cuotas sin interés con las principales tarjetas de crédito. Las opciones disponibles se muestran al momento del pago.',
      },
      {
        question: '¿El sitio es seguro para comprar?',
        answer: 'Absolutamente. Utilizamos encriptación SSL y procesamos todos los pagos a través de Mercado Pago, una plataforma segura y confiable.',
      },
      {
        question: '¿Cómo obtengo mi factura?',
        answer: 'La factura se envía automáticamente a tu email después de la compra. También podés descargarla desde "Mi Cuenta > Mis Pedidos".',
      },
    ],
  },
  {
    id: 'devoluciones',
    title: 'Devoluciones y Cambios',
    icon: RefreshCw,
    faqs: [
      {
        question: '¿Cuál es la política de devoluciones?',
        answer: 'Tenés 30 días desde la recepción para devolver productos sin uso y en su empaque original. Aplicamos el reembolso completo una vez verificado el estado del producto.',
      },
      {
        question: '¿Cómo inicio una devolución?',
        answer: 'Contactanos por email o WhatsApp indicando tu número de pedido y el motivo de la devolución. Te enviaremos las instrucciones para el envío del producto.',
      },
      {
        question: '¿Quién paga el envío de devolución?',
        answer: 'Si el producto tiene algún defecto o enviamos algo incorrecto, nosotros cubrimos el envío. Para devoluciones por otros motivos, el costo corre por cuenta del cliente.',
      },
      {
        question: '¿Cuánto tarda el reembolso?',
        answer: 'Una vez recibido y verificado el producto, procesamos el reembolso en 5-10 días hábiles. El tiempo de acreditación depende de tu banco o medio de pago.',
      },
    ],
  },
  {
    id: 'cuenta',
    title: 'Mi Cuenta',
    icon: ShieldCheck,
    faqs: [
      {
        question: '¿Cómo creo una cuenta?',
        answer: 'Hacé clic en "Registrarse" en el menú superior, completá tus datos y confirmá tu email. También podés registrarte con tu cuenta de Google.',
      },
      {
        question: '¿Olvidé mi contraseña, qué hago?',
        answer: 'En la página de inicio de sesión, hacé clic en "¿Olvidaste tu contraseña?" e ingresá tu email. Recibirás un enlace para crear una nueva contraseña.',
      },
      {
        question: '¿Cómo actualizo mis datos?',
        answer: 'Ingresá a tu cuenta y andá a "Mi Perfil". Desde ahí podés actualizar tu información personal, direcciones de envío y más.',
      },
      {
        question: '¿Cómo elimino mi cuenta?',
        answer: 'Contactanos para solicitar la eliminación de tu cuenta. Procesaremos tu solicitud en un plazo de 48 horas.',
      },
    ],
  },
]

function FAQItem({ faq, isOpen, onToggle }: { faq: FAQ; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-zinc-200 dark:border-zinc-800">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between py-4 text-left"
      >
        <span className="font-medium">{faq.question}</span>
        <ChevronDown
          className={cn(
            'h-5 w-5 shrink-0 text-zinc-500 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      <div
        className={cn(
          'overflow-hidden transition-all',
          isOpen ? 'max-h-96 pb-4' : 'max-h-0'
        )}
      >
        <p className="text-zinc-600 dark:text-zinc-400">{faq.answer}</p>
      </div>
    </div>
  )
}

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({})
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const toggleItem = (key: string) => {
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const filteredCategories = faqCategories
    .map((category) => ({
      ...category,
      faqs: category.faqs.filter(
        (faq) =>
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((category) => category.faqs.length > 0)
    .filter((category) => !selectedCategory || category.id === selectedCategory)

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold">Preguntas Frecuentes</h1>
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
          Encontrá respuestas a las preguntas más comunes
        </p>
      </div>

      {/* Búsqueda */}
      <div className="mx-auto mb-12 max-w-xl">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Buscar en preguntas frecuentes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 py-6 text-lg"
          />
        </div>
      </div>

      {/* Categorías */}
      <div className="mb-8 flex flex-wrap justify-center gap-3">
        <button
          onClick={() => setSelectedCategory(null)}
          className={cn(
            'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors',
            !selectedCategory
              ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900'
              : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700'
          )}
        >
          <HelpCircle className="h-4 w-4" />
          Todas
        </button>
        {faqCategories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={cn(
              'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors',
              selectedCategory === category.id
                ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900'
                : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700'
            )}
          >
            <category.icon className="h-4 w-4" />
            {category.title}
          </button>
        ))}
      </div>

      {/* FAQs */}
      <div className="mx-auto max-w-3xl">
        {filteredCategories.length === 0 ? (
          <div className="py-12 text-center">
            <HelpCircle className="mx-auto mb-4 h-12 w-12 text-zinc-300" />
            <p className="text-lg text-zinc-500">No encontramos resultados</p>
            <p className="text-sm text-zinc-400">Intentá con otras palabras</p>
          </div>
        ) : (
          filteredCategories.map((category) => (
            <div key={category.id} className="mb-8">
              <div className="mb-4 flex items-center gap-3">
                <category.icon className="h-5 w-5 text-zinc-600" />
                <h2 className="text-xl font-bold">{category.title}</h2>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white px-6 dark:border-zinc-800 dark:bg-zinc-900">
                {category.faqs.map((faq, index) => (
                  <FAQItem
                    key={`${category.id}-${index}`}
                    faq={faq}
                    isOpen={openItems[`${category.id}-${index}`] || false}
                    onToggle={() => toggleItem(`${category.id}-${index}`)}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* CTA */}
      <div className="mt-16 rounded-2xl bg-zinc-100 px-8 py-12 text-center dark:bg-zinc-900">
        <h2 className="mb-4 text-2xl font-bold">¿No encontraste lo que buscabas?</h2>
        <p className="mb-6 text-zinc-600 dark:text-zinc-400">
          Nuestro equipo de atención al cliente está disponible para ayudarte.
        </p>
        <Link
          href="/contacto"
          className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-6 py-3 font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Contactanos
        </Link>
      </div>
    </div>
  )
}
