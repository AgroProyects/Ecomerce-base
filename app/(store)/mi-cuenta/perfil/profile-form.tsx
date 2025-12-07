'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const profileSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  phone: z.string().optional(),
  dni: z.string().optional(),
  birth_date: z.string().optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

interface ProfileFormProps {
  user: {
    id: string
    name: string
    email: string
    phone: string
    dni: string
    birth_date: string
  }
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name,
      phone: user.phone,
      dni: user.dni,
      birth_date: user.birth_date,
    },
  })

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/customer/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Error al guardar')
      }

      toast.success('Datos actualizados')
      router.refresh()
    } catch (error) {
      console.error('Profile error:', error)
      toast.error(error instanceof Error ? error.message : 'Error al guardar')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Input
            label="Nombre completo"
            {...register('name')}
            error={errors.name?.message}
          />
        </div>

        <Input
          label="Teléfono"
          type="tel"
          placeholder="+54 11 1234-5678"
          {...register('phone')}
          error={errors.phone?.message}
        />

        <Input
          label="DNI / CUIT"
          placeholder="12345678"
          {...register('dni')}
          error={errors.dni?.message}
        />

        <div className="sm:col-span-2">
          <Input
            label="Fecha de nacimiento"
            type="date"
            {...register('birth_date')}
            error={errors.birth_date?.message}
          />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isLoading || !isDirty}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Guardar cambios
        </Button>
      </div>
    </form>
  )
}
