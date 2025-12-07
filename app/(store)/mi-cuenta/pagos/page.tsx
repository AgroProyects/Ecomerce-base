import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { CreditCard, Plus, Star, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DeletePaymentMethodButton } from './delete-payment-method-button'

const providerIcons: Record<string, string> = {
  visa: '/icons/visa.svg',
  mastercard: '/icons/mastercard.svg',
  amex: '/icons/amex.svg',
}

const providerColors: Record<string, string> = {
  visa: 'bg-blue-500',
  mastercard: 'bg-orange-500',
  amex: 'bg-blue-700',
  mercadopago: 'bg-sky-500',
}

export default async function PagosPage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  const supabase = createAdminClient()

  const { data: paymentMethods } = await supabase
    .from('customer_payment_methods')
    .select('*')
    .eq('user_id', session.user.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="mb-8">
        <div>
          <h1 className="text-2xl font-bold">Medios de Pago</h1>
          <p className="text-muted-foreground mt-1">
            Gestioná tus métodos de pago guardados
          </p>
        </div>
      </div>

      {!paymentMethods || paymentMethods.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No tenés medios de pago guardados</h3>
            <p className="text-muted-foreground text-center mt-2 max-w-sm">
              Los medios de pago se guardan automáticamente cuando realizás una compra
              y elegís guardar los datos para futuras compras.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {paymentMethods.map((method) => (
            <Card key={method.id} className="relative overflow-hidden">
              <div
                className={`absolute top-0 left-0 w-1 h-full ${
                  providerColors[method.provider || ''] || 'bg-zinc-500'
                }`}
              />
              <CardContent className="pt-6 pl-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium capitalize">
                      {method.provider || method.type}
                    </span>
                    {method.is_default && (
                      <Badge variant="secondary" className="text-xs">
                        <Star className="h-3 w-3 mr-1 fill-current" />
                        Principal
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-1 text-sm">
                  <p className="font-medium">{method.label}</p>
                  {method.last_four && (
                    <p className="text-muted-foreground">
                      •••• •••• •••• {method.last_four}
                    </p>
                  )}
                  {method.expiry_month && method.expiry_year && (
                    <p className="text-muted-foreground text-xs">
                      Vence: {String(method.expiry_month).padStart(2, '0')}/{method.expiry_year}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <DeletePaymentMethodButton methodId={method.id} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="mt-6">
        <CardContent className="py-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-primary/10 p-3">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">¿Cómo agregar un medio de pago?</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Durante el proceso de checkout, podés elegir guardar tu tarjeta para futuras compras.
                Los datos se almacenan de forma segura a través de MercadoPago.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
