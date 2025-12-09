import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { CartDrawer } from '@/components/layout/cart-drawer'
import { PageTransition } from '@/components/layout/page-transition'
import { getStoreSettings } from '@/actions/settings'
import { getCategories } from '@/actions/categories'

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Obtener configuración de la tienda y categorías
  const [settings, categories] = await Promise.all([
    getStoreSettings(),
    getCategories(true),
  ])

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        storeName={settings?.store_name}
        logoUrl={settings?.logo_url}
        categories={categories.filter((c) => !c.parent_id).slice(0, 5)}
      />

      <main className="flex-1">
        <PageTransition>{children}</PageTransition>
      </main>

      <Footer
        storeName={settings?.store_name}
        contactEmail={settings?.contact_email}
        contactPhone={settings?.contact_phone}
        socialLinks={settings?.social_links as any}
      />

      <CartDrawer />
    </div>
  )
}
