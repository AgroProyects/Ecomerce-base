'use client'

import { useState, useEffect } from 'react'
import { X, MapPin, Search, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils/cn'
import { getDepartmentNames, getLocalitiesByDepartment } from '@/lib/constants/uruguay-locations'

interface LocationSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (department: string, city: string) => void
  selectedDepartment?: string
  selectedCity?: string
}

export function LocationSelectorModal({
  isOpen,
  onClose,
  onSelect,
  selectedDepartment = '',
  selectedCity = '',
}: LocationSelectorModalProps) {
  const [step, setStep] = useState<'department' | 'city'>('department')
  const [tempDepartment, setTempDepartment] = useState(selectedDepartment)
  const [tempCity, setTempCity] = useState(selectedCity)
  const [searchQuery, setSearchQuery] = useState('')

  const departments = getDepartmentNames()
  const cities = tempDepartment ? getLocalitiesByDepartment(tempDepartment) : []

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setTempDepartment(selectedDepartment)
      setTempCity(selectedCity)
      setStep(selectedDepartment ? 'city' : 'department')
      setSearchQuery('')
    }
  }, [isOpen, selectedDepartment, selectedCity])

  const filteredDepartments = departments.filter((dept) =>
    dept.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredCities = cities.filter((city) =>
    city.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDepartmentSelect = (dept: string) => {
    setTempDepartment(dept)
    setTempCity('')
    setSearchQuery('')
    setStep('city')
  }

  const handleCitySelect = (city: string) => {
    setTempCity(city)
    onSelect(tempDepartment, city)
    onClose()
  }

  const handleBack = () => {
    setSearchQuery('')
    setStep('department')
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-lg mx-auto animate-in zoom-in-95 fade-in duration-200">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="relative border-b border-zinc-200 dark:border-zinc-800 bg-gradient-to-r from-violet-500 to-purple-500 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-white">
                  {step === 'department' ? 'Selecciona tu departamento' : 'Selecciona tu ciudad'}
                </h2>
                {step === 'city' && tempDepartment && (
                  <p className="text-sm text-white/80">{tempDepartment}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/20 transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>

            {/* Search */}
            <div className="mt-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={step === 'department' ? 'Buscar departamento...' : 'Buscar ciudad...'}
                className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-white/60 focus-visible:ring-white/50"
              />
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[60vh] overflow-y-auto">
            {step === 'department' ? (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filteredDepartments.length === 0 ? (
                  <div className="px-6 py-12 text-center text-zinc-500">
                    No se encontraron departamentos
                  </div>
                ) : (
                  filteredDepartments.map((dept) => (
                    <button
                      key={dept}
                      onClick={() => handleDepartmentSelect(dept)}
                      className={cn(
                        'w-full px-6 py-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors',
                        tempDepartment === dept && 'bg-violet-50 dark:bg-violet-900/20'
                      )}
                    >
                      <span className="font-medium text-zinc-900 dark:text-zinc-50">
                        {dept}
                      </span>
                      <ChevronRight className="h-5 w-5 text-zinc-400" />
                    </button>
                  ))
                )}
              </div>
            ) : (
              <div>
                {/* Back button */}
                <button
                  onClick={handleBack}
                  className="w-full px-6 py-3 flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 border-b border-zinc-100 dark:border-zinc-800"
                >
                  <ChevronRight className="h-4 w-4 rotate-180" />
                  Cambiar departamento
                </button>

                {/* Cities list */}
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {filteredCities.length === 0 ? (
                    <div className="px-6 py-12 text-center text-zinc-500">
                      No se encontraron ciudades
                    </div>
                  ) : (
                    filteredCities.map((city) => (
                      <button
                        key={city}
                        onClick={() => handleCitySelect(city)}
                        className={cn(
                          'w-full px-6 py-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left',
                          tempCity === city && 'bg-violet-50 dark:bg-violet-900/20'
                        )}
                      >
                        <span className="font-medium text-zinc-900 dark:text-zinc-50">
                          {city}
                        </span>
                        {tempCity === city && (
                          <div className="h-2 w-2 rounded-full bg-violet-500" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
