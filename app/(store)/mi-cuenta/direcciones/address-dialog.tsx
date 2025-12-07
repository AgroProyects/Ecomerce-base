'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select } from '@/components/ui/select'

const addressSchema = z.object({
  label: z.string().min(1, 'Requerido'),
  recipient_name: z.string().min(2, 'Nombre requerido'),
  phone: z.string().optional(),
  street: z.string().min(1, 'Calle requerida'),
  number: z.string().min(1, 'Número requerido'),
  floor: z.string().optional(),
  apartment: z.string().optional(),
  city: z.string().min(1, 'Ciudad requerida'),
  state: z.string().min(1, 'Provincia requerida'),
  postal_code: z.string().min(1, 'Código postal requerido'),
  additional_info: z.string().optional(),
  is_default: z.boolean(),
})

type AddressFormData = z.infer<typeof addressSchema>

interface AddressDialogProps {
  children: React.ReactNode
  userId: string
  address?: {
    id: string
    label: string
    recipient_name: string
    phone: string | null
    street: string
    number: string
    floor: string | null
    apartment: string | null
    city: string
    state: string
    postal_code: string
    additional_info: string | null
    is_default: boolean
  }
}

export function AddressDialog({ children, userId, address }: AddressDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: address ? {
      label: address.label,
      recipient_name: address.recipient_name,
      phone: address.phone || '',
      street: address.street,
      number: address.number,
      floor: address.floor || '',
      apartment: address.apartment || '',
      city: address.city,
      state: address.state,
      postal_code: address.postal_code,
      additional_info: address.additional_info || '',
      is_default: address.is_default,
    } : {
      label: 'Casa',
      is_default: false,
    },
  })

  const onSubmit = async (data: AddressFormData) => {
    setIsLoading(true)

    try {
      const url = address
        ? `/api/customer/addresses/${address.id}`
        : '/api/customer/addresses'

      const response = await fetch(url, {
        method: address ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, user_id: userId }),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Error al guardar')
      }

      toast.success(address ? 'Dirección actualizada' : 'Dirección agregada')
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Address error:', error)
      toast.error(error instanceof Error ? error.message : 'Error al guardar')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {address ? 'Editar dirección' : 'Nueva dirección'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Select
                label="Etiqueta"
                options={[
                  { value: 'Casa', label: 'Casa' },
                  { value: 'Trabajo', label: 'Trabajo' },
                  { value: 'Otro', label: 'Otro' },
                ]}
                defaultValue={watch('label')}
                {...register('label')}
              />
            </div>

            <div className="col-span-2">
              <Input
                label="Nombre del destinatario"
                {...register('recipient_name')}
                error={errors.recipient_name?.message}
              />
            </div>

            <div className="col-span-2">
              <Input
                label="Teléfono"
                type="tel"
                {...register('phone')}
                error={errors.phone?.message}
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <Input
                label="Calle"
                {...register('street')}
                error={errors.street?.message}
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <Input
                label="Número"
                {...register('number')}
                error={errors.number?.message}
              />
            </div>

            <div>
              <Input
                label="Piso"
                placeholder="Opcional"
                {...register('floor')}
              />
            </div>

            <div>
              <Input
                label="Depto"
                placeholder="Opcional"
                {...register('apartment')}
              />
            </div>

            <div className="col-span-2">
              <Input
                label="Ciudad"
                {...register('city')}
                error={errors.city?.message}
              />
            </div>

            <div>
              <Input
                label="Provincia"
                {...register('state')}
                error={errors.state?.message}
              />
            </div>

            <div>
              <Input
                label="Código Postal"
                {...register('postal_code')}
                error={errors.postal_code?.message}
              />
            </div>

            <div className="col-span-2">
              <Input
                label="Información adicional"
                placeholder="Entre calles, indicaciones, etc."
                {...register('additional_info')}
              />
            </div>

            <div className="col-span-2 flex items-center space-x-2">
              <Checkbox
                id="is_default"
                checked={watch('is_default')}
                onCheckedChange={(checked) => setValue('is_default', !!checked)}
              />
              <Label htmlFor="is_default" className="text-sm font-normal">
                Usar como dirección principal
              </Label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {address ? 'Guardar cambios' : 'Agregar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
