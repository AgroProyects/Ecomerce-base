'use client'

import { User, MapPin, FileText, Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ReviewStepProps {
  formData: {
    name: string
    email: string
    phone: string
    address: {
      street: string
      number: string
      apartment?: string
      floor?: string
      city: string
      state: string
      postal_code?: string
    }
    notes?: string
  }
  onEdit: (step: number) => void
}

export function ReviewStep({ formData, onEdit }: ReviewStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
          Revisa tu información
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400">
          Verifica que todos los datos sean correctos antes de continuar
        </p>
      </div>

      {/* Contact Information */}
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
              Información de contacto
            </h3>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onEdit(0)}
            className="gap-2"
          >
            <Edit2 className="h-4 w-4" />
            Editar
          </Button>
        </div>
        <div className="p-4 space-y-2">
          <div className="grid grid-cols-[100px_1fr] gap-2">
            <span className="text-sm text-zinc-500">Nombre:</span>
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {formData.name}
            </span>
          </div>
          <div className="grid grid-cols-[100px_1fr] gap-2">
            <span className="text-sm text-zinc-500">Email:</span>
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {formData.email}
            </span>
          </div>
          <div className="grid grid-cols-[100px_1fr] gap-2">
            <span className="text-sm text-zinc-500">Teléfono:</span>
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {formData.phone}
            </span>
          </div>
        </div>
      </div>

      {/* Shipping Address */}
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
              Dirección de envío
            </h3>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onEdit(1)}
            className="gap-2"
          >
            <Edit2 className="h-4 w-4" />
            Editar
          </Button>
        </div>
        <div className="p-4">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            {formData.address.street} {formData.address.number}
            {formData.address.apartment && `, Apto ${formData.address.apartment}`}
            {formData.address.floor && `, Piso ${formData.address.floor}`}
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            {formData.address.city}, {formData.address.state}
            {formData.address.postal_code && ` - CP: ${formData.address.postal_code}`}
          </p>
        </div>
      </div>

      {/* Notes */}
      {formData.notes && (
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900/50 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
            <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
              Notas adicionales
            </h3>
          </div>
          <div className="p-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {formData.notes}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
