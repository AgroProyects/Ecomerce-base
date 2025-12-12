import { MercadoPagoConfig } from 'mercadopago'

// Cliente de Mercado Pago - solo usar en el servidor
let mpClient: MercadoPagoConfig | null = null

export function getMercadoPagoClient(): MercadoPagoConfig {
  const accessToken = process.env.MP_ACCESS_TOKEN

  if (!accessToken) {
    console.error('❌ MP_ACCESS_TOKEN no está configurado en las variables de entorno')
    throw new Error('MP_ACCESS_TOKEN no está configurado')
  }

  if (!mpClient) {
    console.log('🔑 Inicializando cliente de Mercado Pago')
    console.log('Access Token (primeros 20 chars):', accessToken.substring(0, 20) + '...')
    console.log('Tipo de credenciales:', accessToken.startsWith('TEST-') ? 'TEST (Sandbox)' : 'PRODUCCIÓN')

    mpClient = new MercadoPagoConfig({
      accessToken,
      options: {
        timeout: 5000,
      },
    })

    console.log('✓ Cliente de Mercado Pago inicializado')
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
