'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CreditCard, Lock, CheckCircle2 } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils/cn'

interface MercadoPagoCardFormProps {
  orderId: string
  amount: number
  onSuccess: (paymentId: number) => void
  onError: (error: string) => void
}

// Declarar el tipo de MercadoPago SDK
declare global {
  interface Window {
    MercadoPago: any
  }
}

export function MercadoPagoCardForm({
  orderId,
  amount,
  onSuccess,
  onError,
}: MercadoPagoCardFormProps) {
  const [loading, setLoading] = useState(false)
  const [sdkReady, setSdkReady] = useState(false)
  const [mp, setMp] = useState<any>(null)
  const [error, setError] = useState<string>('')

  // Datos del formulario
  const [cardNumber, setCardNumber] = useState('')
  const [cardholderName, setCardholderName] = useState('')
  const [expirationDate, setExpirationDate] = useState('')
  const [securityCode, setSecurityCode] = useState('')
  const [installments, setInstallments] = useState(1)
  const [identificationType, setIdentificationType] = useState('CI')
  const [identificationNumber, setIdentificationNumber] = useState('')

  // Datos detectados
  const [paymentMethodId, setPaymentMethodId] = useState('')
  const [issuerId, setIssuerId] = useState('')
  const [cardBrand, setCardBrand] = useState<string>('')
  const [cardBrandName, setCardBrandName] = useState<string>('')

  // Cargar SDK de Mercado Pago
  useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY

    if (!publicKey) {
      setError('Public Key de Mercado Pago no configurada')
      return
    }

    // Cargar el SDK
    const script = document.createElement('script')
    script.src = 'https://sdk.mercadopago.com/js/v2'
    script.async = true
    script.onload = () => {
      const mercadopago = new window.MercadoPago(publicKey)
      setMp(mercadopago)
      setSdkReady(true)
      console.log('SDK de Mercado Pago cargado')
    }
    script.onerror = () => {
      setError('Error al cargar el SDK de Mercado Pago')
    }

    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  // Detectar método de pago cuando cambia el número de tarjeta
  useEffect(() => {
    if (!mp || !cardNumber || cardNumber.length < 6) {
      return
    }

    const bin = cardNumber.replace(/\s/g, '').substring(0, 6)

    mp.getPaymentMethods({ bin })
      .then((result: any) => {
        if (result.results && result.results.length > 0) {
          const paymentMethod = result.results[0]
          setPaymentMethodId(paymentMethod.id)
          setCardBrand(paymentMethod.id)
          setCardBrandName(paymentMethod.name)
          console.log('Método de pago detectado:', paymentMethod)

          // Obtener issuer si es necesario
          if (paymentMethod.additional_info_needed.includes('issuer_id')) {
            mp.getIssuers({ paymentMethodId: paymentMethod.id, bin })
              .then((issuerResult: any) => {
                if (issuerResult.length > 0) {
                  setIssuerId(issuerResult[0].id)
                }
              })
              .catch((err: any) => console.error('Error al obtener issuer:', err))
          }
        } else {
          setCardBrand('')
          setCardBrandName('')
        }
      })
      .catch((err: any) => {
        console.error('Error al obtener método de pago:', err)
        setCardBrand('')
        setCardBrandName('')
      })
  }, [mp, cardNumber])

  // Formatear número de tarjeta
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s/g, '')
    const formatted = value.match(/.{1,4}/g)?.join(' ') || value
    setCardNumber(formatted)
  }

  // Formatear fecha de expiración
  const handleExpirationDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '')
    if (value.length <= 2) {
      setExpirationDate(value)
    } else {
      setExpirationDate(`${value.slice(0, 2)}/${value.slice(2, 4)}`)
    }
  }

  // Procesar el pago
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!mp) {
        throw new Error('SDK de Mercado Pago no inicializado')
      }

      console.log('=== CREANDO TOKEN DE TARJETA ===')
      console.log('Datos del formulario:', {
        cardNumber: cardNumber.replace(/\s/g, '').substring(0, 6) + '...',
        cardholderName,
        expirationDate,
        paymentMethodId,
        issuerId,
      })

      // Separar mes y año
      const [expMonth, expYear] = expirationDate.split('/')

      console.log('Mes:', expMonth, 'Año:', `20${expYear}`)

      // Verificar que el SDK tiene el método
      console.log('Métodos disponibles en mp:', Object.keys(mp))

      // Crear token de la tarjeta usando el método correcto del SDK v2
      console.log('Intentando crear token...')
      const cardToken = await mp.createCardToken({
        cardNumber: cardNumber.replace(/\s/g, ''),
        cardholderName,
        cardExpirationMonth: expMonth,
        cardExpirationYear: `20${expYear}`,
        securityCode,
        identificationType,
        identificationNumber,
      })

      console.log('✓ Token creado exitosamente:', cardToken)

      // Enviar el pago al backend
      const response = await fetch('/api/mercadopago/process-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          token: cardToken.id || cardToken,
          installments,
          paymentMethodId,
          issuerId,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al procesar el pago')
      }

      if (result.payment.status === 'approved') {
        onSuccess(result.payment.id)
      } else if (result.payment.status === 'pending' || result.payment.status === 'in_process') {
        onError(`Pago pendiente: ${result.payment.statusDetail}`)
      } else {
        onError(`Pago rechazado: ${result.payment.statusDetail}`)
      }
    } catch (err) {
      console.error('=== ERROR COMPLETO ===')
      console.error('Error:', err)
      console.error('Tipo:', typeof err)
      console.error('Es Error?:', err instanceof Error)

      // Intentar extraer más información
      if (err && typeof err === 'object') {
        console.error('Keys del error:', Object.keys(err))
        console.error('JSON del error:', JSON.stringify(err, null, 2))
      }

      let errorMessage = 'Error desconocido al procesar el pago'

      if (err instanceof Error) {
        errorMessage = err.message
      } else if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = String(err.message)
      } else if (typeof err === 'string') {
        errorMessage = err
      }

      console.error('Mensaje final del error:', errorMessage)
      setError(errorMessage)
      onError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Función para obtener la imagen de la tarjeta
  const getCardImage = () => {
    const brandMap: Record<string, string> = {
      'visa': 'https://http2.mlstatic.com/storage/logos-api-admin/a5f047d0-9be0-11ec-aad4-c3381f368aaf-m.svg',
      'master': 'https://http2.mlstatic.com/storage/logos-api-admin/aa2b8f70-5c85-11ec-ae75-df2bef173be2-m.svg',
      'amex': 'https://http2.mlstatic.com/storage/logos-api-admin/ce454480-445f-11eb-bf78-3b1ee7bf744c-m.svg',
      'oca': 'https://http2.mlstatic.com/storage/logos-api-admin/fec5f230-06ee-11eb-9984-b7076edb0bb7-m.svg',
      'diners': 'https://http2.mlstatic.com/storage/logos-api-admin/c0e5bc50-445f-11eb-bf78-3b1ee7bf744c-m.svg',
      'maestro': 'https://http2.mlstatic.com/storage/logos-api-admin/5b9e5e30-445f-11eb-bf78-3b1ee7bf744c-m.svg',
    }

    return brandMap[cardBrand] || null
  }

  if (!sdkReady) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        <span className="ml-3 text-zinc-600 dark:text-zinc-400">Cargando formulario de pago...</span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
          <AlertDescription className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Visualización de la tarjeta */}
      <div className="relative">
        <div className={cn(
          "relative aspect-[1.586/1] w-full max-w-sm mx-auto rounded-2xl p-6 shadow-2xl transition-all duration-500",
          "bg-gradient-to-br from-zinc-800 via-zinc-900 to-black",
          cardBrand && "ring-2 ring-emerald-500 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900"
        )}>
          {/* Diseño de tarjeta */}
          <div className="relative h-full flex flex-col justify-between text-white">
            {/* Logo de la tarjeta */}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <CreditCard className="h-8 w-8 text-yellow-400" />
              </div>
              {getCardImage() && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <Image
                    src={getCardImage()!}
                    alt={cardBrandName}
                    width={60}
                    height={40}
                    className="object-contain"
                  />
                </div>
              )}
            </div>

            {/* Chip */}
            <div className="w-12 h-9 bg-gradient-to-br from-yellow-200 to-yellow-400 rounded-md opacity-80" />

            {/* Número de tarjeta */}
            <div className="space-y-4">
              <div className="text-xl md:text-2xl font-mono tracking-wider">
                {cardNumber || '•••• •••• •••• ••••'}
              </div>

              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <div className="text-xs text-zinc-400 uppercase">Titular</div>
                  <div className="text-sm font-medium tracking-wide">
                    {cardholderName || 'NOMBRE APELLIDO'}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-zinc-400 uppercase">Vence</div>
                  <div className="text-sm font-medium">
                    {expirationDate || 'MM/AA'}
                  </div>
                </div>
              </div>
            </div>

            {/* Indicador de tarjeta detectada */}
            {cardBrand && (
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 animate-in fade-in zoom-in duration-300">
                <div className="bg-emerald-500 text-white px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg text-xs font-medium">
                  <CheckCircle2 className="h-3 w-3" />
                  {cardBrandName} detectada
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="cardNumber" className="text-sm font-medium flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-zinc-500" />
            Número de tarjeta
          </Label>
          <Input
            id="cardNumber"
            type="text"
            placeholder="0000 0000 0000 0000"
            value={cardNumber}
            onChange={handleCardNumberChange}
            maxLength={19}
            required
            className="text-lg font-mono tracking-wider h-12"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cardholderName" className="text-sm font-medium">
            Nombre del titular
          </Label>
          <Input
            id="cardholderName"
            type="text"
            placeholder="Como aparece en la tarjeta"
            value={cardholderName}
            onChange={(e) => setCardholderName(e.target.value.toUpperCase())}
            required
            className="h-12 uppercase"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="expirationDate" className="text-sm font-medium">
              Vencimiento
            </Label>
            <Input
              id="expirationDate"
              type="text"
              placeholder="MM/AA"
              value={expirationDate}
              onChange={handleExpirationDateChange}
              maxLength={5}
              required
              className="text-center font-mono h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="securityCode" className="text-sm font-medium flex items-center gap-2">
              <Lock className="h-4 w-4 text-zinc-500" />
              CVV
            </Label>
            <Input
              id="securityCode"
              type="text"
              placeholder="123"
              value={securityCode}
              onChange={(e) => setSecurityCode(e.target.value.replace(/\D/g, ''))}
              maxLength={4}
              required
              className="text-center font-mono h-12"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="identificationNumber" className="text-sm font-medium">
            Documento (CI/DNI)
          </Label>
          <Input
            id="identificationNumber"
            type="text"
            placeholder="12345678"
            value={identificationNumber}
            onChange={(e) => setIdentificationNumber(e.target.value.replace(/\D/g, ''))}
            required
            className="h-12"
          />
        </div>
      </div>

      {/* Total y botón */}
      <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-lg font-medium text-zinc-700 dark:text-zinc-300">Total a pagar:</span>
          <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            ${amount.toLocaleString('es-UY')}
          </span>
        </div>

        <Button
          type="submit"
          size="lg"
          className={cn(
            "w-full h-14 text-base font-semibold shadow-lg transition-all duration-300",
            "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700",
            loading && "opacity-50 cursor-not-allowed"
          )}
          disabled={loading || !paymentMethodId}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Procesando pago seguro...
            </>
          ) : (
            <>
              <Lock className="mr-2 h-5 w-5" />
              Pagar ${amount.toLocaleString('es-UY')}
            </>
          )}
        </Button>

        <div className="flex items-center justify-center gap-2 text-xs text-zinc-500">
          <Lock className="h-3 w-3" />
          <span>Pago 100% seguro procesado por Mercado Pago</span>
        </div>
      </div>
    </form>
  )
}
