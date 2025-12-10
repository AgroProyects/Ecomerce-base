import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { CartDrawer } from '@/components/layout/cart-drawer'
import { PageTransition } from '@/components/layout/page-transition'
import { EmailVerificationBanner } from '@/components/auth/email-verification-banner'
import { getStoreSettings } from '@/actions/settings'
import { getCategories } from '@/actions/categories'
import { getEmailVerificationStatus } from '@/actions/auth/verification'

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Obtener configuración de la tienda y categorías
  const [settings, categories, emailStatus] = await Promise.all([
    getStoreSettings(),
    getCategories(true),
    getEmailVerificationStatus(),
  ])

  // Check if user needs to verify email
  const showVerificationBanner = emailStatus.success && !emailStatus.verified && emailStatus.email

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        storeName={settings?.store_name}
        logoUrl={settings?.logo_url}
        categories={categories.filter((c) => !c.parent_id).slice(0, 5)}
      />

      {showVerificationBanner && (
        <div className="border-b bg-white dark:bg-zinc-950">
          <div className="container mx-auto px-4 py-2">
            <EmailVerificationBanner email={emailStatus.email!} />
          </div>
        </div>
      )}

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
