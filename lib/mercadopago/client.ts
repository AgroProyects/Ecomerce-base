import { MercadoPagoConfig } from 'mercadopago'

// Cliente de Mercado Pago - solo usar en el servidor
let mpClient: MercadoPagoConfig | null = null

export function getMercadoPagoClient(): MercadoPagoConfig {
  const accessToken = process.env.MP_ACCESS_TOKEN

  if (!accessToken) {
    throw new Error('MP_ACCESS_TOKEN no está configurado')
  }

  if (!mpClient) {
    mpClient = new MercadoPagoConfig({
      accessToken,
      options: {
        timeout: 5000,
      },
    })
  }

  return mpClient
}

// Información del entorno
export function isMPSandbox(): boolean {
  const accessToken = process.env.MP_ACCESS_TOKEN || ''
  return accessToken.startsWith('TEST-')
}

export function getMPPublicKey(): string {
  return process.env.NEXT_PUBLIC_MP_PUBLIC_KEY || ''
}
