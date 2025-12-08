'use client';

import { useState } from 'react';
import { CreditCard, Building2, Banknote, Receipt, Upload, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePaymentProofUpload } from '@/hooks/usePaymentProofUpload';
import type { PaymentMethod } from '@/schemas/order.schema';

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod | null;
  onSelectMethod: (method: PaymentMethod) => void;
  onPaymentProofUrl?: (url: string | null) => void;
  orderId?: string; // Solo necesario si ya se creó la orden
}

const PAYMENT_METHODS = [
  {
    id: 'mercadopago' as const,
    name: 'Mercado Pago',
    description: 'Paga con tarjeta de crédito, débito o dinero en cuenta',
    icon: CreditCard,
    color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  },
  {
    id: 'bank_transfer' as const,
    name: 'Transferencia Bancaria',
    description: 'Transferí a nuestra cuenta y subí el comprobante',
    icon: Building2,
    color: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
  },
  {
    id: 'cash_on_delivery' as const,
    name: 'Efectivo contra Entrega',
    description: 'Pagá en efectivo cuando recibás tu pedido',
    icon: Banknote,
    color: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
  },
];

export function PaymentMethodSelector({
  selectedMethod,
  onSelectMethod,
  onPaymentProofUrl,
  orderId,
}: PaymentMethodSelectorProps) {
  const [uploadedProof, setUploadedProof] = useState<string | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Aquí se subiría el archivo al storage
      // Por ahora solo guardamos el preview
      // En el checkout real, se subirá cuando se confirme el pedido
      onPaymentProofUrl?.(file.name); // Placeholder
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Método de Pago</h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Seleccioná cómo querés pagar tu pedido
        </p>
      </div>

      {/* Métodos de pago */}
      <div className="grid gap-4">
        {PAYMENT_METHODS.map((method) => {
          const Icon = method.icon;
          const isSelected = selectedMethod === method.id;

          return (
            <Card
              key={method.id}
              className={`cursor-pointer transition-all ${
                isSelected
                  ? `${method.color} border-2`
                  : 'hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
              onClick={() => {
                onSelectMethod(method.id);
                if (method.id !== 'bank_transfer') {
                  onPaymentProofUrl?.(null);
                  setFilePreview(null);
                }
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div
                    className={`p-3 rounded-lg ${
                      isSelected ? 'bg-white dark:bg-zinc-800' : 'bg-zinc-100 dark:bg-zinc-900'
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold">{method.name}</h4>
                      {isSelected && (
                        <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {method.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Información de transferencia */}
      {selectedMethod === 'bank_transfer' && (
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start gap-3">
              <Receipt className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="flex-1 space-y-3">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                  Datos para Transferencia Bancaria
                </h4>

                <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-zinc-600 dark:text-zinc-400">Banco:</span>
                    <span className="font-medium">Banco Nación</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-zinc-600 dark:text-zinc-400">Titular:</span>
                    <span className="font-medium">Tu Empresa SRL</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-zinc-600 dark:text-zinc-400">CUIT:</span>
                    <span className="font-medium">XX-XXXXXXXX-X</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-zinc-600 dark:text-zinc-400">CBU:</span>
                    <span className="font-mono font-medium">XXXX XXXX XXXX XXXX XXXX XX</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-zinc-600 dark:text-zinc-400">Alias:</span>
                    <span className="font-medium">TU.EMPRESA.MERCADO</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="payment-proof" className="text-sm font-medium">
                    Subir Comprobante de Pago *
                  </Label>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Una vez realizada la transferencia, subí el comprobante (imagen o PDF)
                  </p>

                  <Input
                    id="payment-proof"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />

                  {filePreview && (
                    <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-medium text-green-900 dark:text-green-100">
                          Comprobante adjuntado exitosamente
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-xs text-blue-700 dark:text-blue-300">
                  ℹ️ Tu pedido quedará en estado "Esperando Pago" hasta que verifiquemos la transferencia
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Información de Mercado Pago */}
      {selectedMethod === 'mercadopago' && (
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              Serás redirigido a Mercado Pago para completar el pago de forma segura
            </p>
          </CardContent>
        </Card>
      )}

      {/* Información de Efectivo */}
      {selectedMethod === 'cash_on_delivery' && (
        <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
          <CardContent className="p-4">
            <p className="text-sm text-amber-900 dark:text-amber-100">
              Prepará el monto exacto para cuando llegue el repartidor. Solo aceptamos efectivo.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
