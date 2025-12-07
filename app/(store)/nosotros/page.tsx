import { Users, Target, Award, Heart, Truck, Shield, Headphones, Star } from 'lucide-react'
import Image from 'next/image'

export default function NosotrosPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero */}
      <div className="mb-16 text-center">
        <h1 className="text-4xl font-bold md:text-5xl">Sobre Nosotros</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
          Somos más que una tienda online. Somos un equipo apasionado por brindarte
          la mejor experiencia de compra con productos de calidad.
        </p>
      </div>

      {/* Historia */}
      <div className="mb-16 grid items-center gap-12 lg:grid-cols-2">
        <div>
          <h2 className="mb-4 text-3xl font-bold">Nuestra Historia</h2>
          <p className="mb-4 text-zinc-600 dark:text-zinc-400">
            Comenzamos en 2020 con una idea simple: hacer que la compra online sea
            fácil, segura y placentera para todos. Lo que empezó como un pequeño
            emprendimiento familiar, hoy es una comunidad de miles de clientes
            satisfechos.
          </p>
          <p className="mb-4 text-zinc-600 dark:text-zinc-400">
            Trabajamos día a día para seleccionar los mejores productos, garantizar
            precios justos y ofrecer un servicio al cliente excepcional. Cada pedido
            es importante para nosotros.
          </p>
          <p className="text-zinc-600 dark:text-zinc-400">
            Nuestro compromiso es crecer junto a vos, escuchando tus necesidades
            y mejorando constantemente para superar tus expectativas.
          </p>
        </div>
        <div className="relative h-[400px] overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800">
          <div className="flex h-full items-center justify-center">
            <Users className="h-32 w-32 text-zinc-300" />
          </div>
        </div>
      </div>

      {/* Misión y Visión */}
      <div className="mb-16 grid gap-8 md:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900">
            <Target className="h-6 w-6" />
          </div>
          <h3 className="mb-3 text-xl font-bold">Nuestra Misión</h3>
          <p className="text-zinc-600 dark:text-zinc-400">
            Democratizar el acceso a productos de calidad, ofreciendo una experiencia
            de compra online segura, rápida y accesible para todos, con precios justos
            y un servicio al cliente excepcional.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900">
            <Award className="h-6 w-6" />
          </div>
          <h3 className="mb-3 text-xl font-bold">Nuestra Visión</h3>
          <p className="text-zinc-600 dark:text-zinc-400">
            Ser la tienda online de referencia en Argentina, reconocida por la
            confianza de nuestros clientes, la calidad de nuestros productos y
            la excelencia en el servicio.
          </p>
        </div>
      </div>

      {/* Valores */}
      <div className="mb-16">
        <h2 className="mb-8 text-center text-3xl font-bold">Nuestros Valores</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Heart,
              title: 'Pasión',
              description: 'Amamos lo que hacemos y eso se refleja en cada detalle.',
            },
            {
              icon: Shield,
              title: 'Confianza',
              description: 'Transparencia y honestidad en cada transacción.',
            },
            {
              icon: Star,
              title: 'Calidad',
              description: 'Solo ofrecemos productos que superen tus expectativas.',
            },
            {
              icon: Headphones,
              title: 'Servicio',
              description: 'Estamos siempre disponibles para ayudarte.',
            },
          ].map((value) => (
            <div
              key={value.title}
              className="rounded-xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                <value.icon className="h-5 w-5 text-zinc-600" />
              </div>
              <h3 className="mb-2 font-semibold">{value.title}</h3>
              <p className="text-sm text-zinc-500">{value.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Por qué elegirnos */}
      <div className="rounded-2xl bg-zinc-900 px-8 py-12 text-white dark:bg-zinc-100 dark:text-zinc-900">
        <h2 className="mb-8 text-center text-3xl font-bold">¿Por qué elegirnos?</h2>
        <div className="grid gap-8 md:grid-cols-3">
          <div className="text-center">
            <Truck className="mx-auto mb-4 h-12 w-12" />
            <h3 className="mb-2 text-lg font-semibold">Envíos a todo el país</h3>
            <p className="text-zinc-400 dark:text-zinc-600">
              Llegamos a todas las provincias con envío rápido y seguro.
            </p>
          </div>
          <div className="text-center">
            <Shield className="mx-auto mb-4 h-12 w-12" />
            <h3 className="mb-2 text-lg font-semibold">Compra protegida</h3>
            <p className="text-zinc-400 dark:text-zinc-600">
              Tu dinero está seguro. Si hay algún problema, te lo devolvemos.
            </p>
          </div>
          <div className="text-center">
            <Award className="mx-auto mb-4 h-12 w-12" />
            <h3 className="mb-2 text-lg font-semibold">Garantía de calidad</h3>
            <p className="text-zinc-400 dark:text-zinc-600">
              Todos nuestros productos cuentan con garantía oficial.
            </p>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="mt-16 grid gap-8 text-center sm:grid-cols-2 lg:grid-cols-4">
        {[
          { number: '10,000+', label: 'Clientes satisfechos' },
          { number: '500+', label: 'Productos disponibles' },
          { number: '4.9/5', label: 'Calificación promedio' },
          { number: '24hs', label: 'Tiempo de respuesta' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
            <p className="text-3xl font-bold">{stat.number}</p>
            <p className="text-zinc-500">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
