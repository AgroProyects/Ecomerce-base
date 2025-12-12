'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

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
          console.log('Método de pago detectado:', paymentMethod.id)

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
        }
      })
      .catch((err: any) => {
        console.error('Error al obtener método de pago:', err)
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

  if (!sdkReady) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando formulario de pago...</span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="cardNumber">Número de tarjeta</Label>
        <Input
          id="cardNumber"
          type="text"
          placeholder="0000 0000 0000 0000"
          value={cardNumber}
          onChange={handleCardNumberChange}
          maxLength={19}
          required
        />
        {paymentMethodId && (
          <p className="text-sm text-muted-foreground">
            {paymentMethodId.toUpperCase()} detectado
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="cardholderName">Nombre del titular</Label>
        <Input
          id="cardholderName"
          type="text"
          placeholder="NOMBRE APELLIDO"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value.toUpperCase())}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="expirationDate">Vencimiento</Label>
          <Input
            id="expirationDate"
            type="text"
            placeholder="MM/AA"
            value={expirationDate}
            onChange={handleExpirationDateChange}
            maxLength={5}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="securityCode">CVV</Label>
          <Input
            id="securityCode"
            type="text"
            placeholder="123"
            value={securityCode}
            onChange={(e) => setSecurityCode(e.target.value.replace(/\D/g, ''))}
            maxLength={4}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="identificationNumber">Documento (CI/DNI)</Label>
        <Input
          id="identificationNumber"
          type="text"
          placeholder="12345678"
          value={identificationNumber}
          onChange={(e) => setIdentificationNumber(e.target.value.replace(/\D/g, ''))}
          required
        />
      </div>

      <div className="pt-4 border-t">
        <div className="flex justify-between items-center mb-4">
          <span className="font-semibold">Total a pagar:</span>
          <span className="text-2xl font-bold">${amount.toLocaleString('es-UY')}</span>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={loading || !paymentMethodId}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Procesando pago...
            </>
          ) : (
            'Pagar ahora'
          )}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Pago seguro procesado por Mercado Pago
      </p>
    </form>
  )
}
