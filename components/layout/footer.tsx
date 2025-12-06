import Link from 'next/link'
import { Facebook, Instagram, Twitter } from 'lucide-react'
import { ROUTES } from '@/lib/constants/routes'

interface FooterProps {
  storeName?: string
  contactEmail?: string | null
  contactPhone?: string | null
  socialLinks?: {
    facebook?: string | null
    instagram?: string | null
    twitter?: string | null
  } | null
}

export function Footer({
  storeName = 'Mi Tienda',
  contactEmail,
  contactPhone,
  socialLinks,
}: FooterProps) {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              {storeName}
            </h3>
            <p className="mt-2 max-w-md text-sm text-zinc-600 dark:text-zinc-400">
              Tu tienda online de confianza. Encontrá los mejores productos al mejor precio.
            </p>

            {/* Social Links */}
            {socialLinks && (
              <div className="mt-4 flex gap-3">
                {socialLinks.facebook && (
                  <a
                    href={socialLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
                  >
                    <Facebook className="h-5 w-5" />
                    <span className="sr-only">Facebook</span>
                  </a>
                )}
                {socialLinks.instagram && (
                  <a
                    href={socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
                  >
                    <Instagram className="h-5 w-5" />
                    <span className="sr-only">Instagram</span>
                  </a>
                )}
                {socialLinks.twitter && (
                  <a
                    href={socialLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
                  >
                    <Twitter className="h-5 w-5" />
                    <span className="sr-only">Twitter</span>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Tienda
            </h4>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href={ROUTES.PRODUCTS}
                  className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                >
                  Todos los productos
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.CART}
                  className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                >
                  Mi carrito
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Contacto
            </h4>
            <ul className="mt-3 space-y-2">
              {contactEmail && (
                <li>
                  <a
                    href={`mailto:${contactEmail}`}
                    className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                  >
                    {contactEmail}
                  </a>
                </li>
              )}
              {contactPhone && (
                <li>
                  <a
                    href={`tel:${contactPhone}`}
                    className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                  >
                    {contactPhone}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 border-t border-zinc-200 pt-8 dark:border-zinc-800">
          <p className="text-center text-sm text-zinc-500">
            &copy; {currentYear} {storeName}. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
