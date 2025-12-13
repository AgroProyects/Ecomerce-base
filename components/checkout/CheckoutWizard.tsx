'use client'

import { ReactNode } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils/cn'

interface CheckoutWizardProps {
  currentStep: number
  totalSteps: number
  onNext: () => void
  onBack: () => void
  isNextDisabled?: boolean
  isLoading?: boolean
  children: ReactNode
  hideNavigation?: boolean
  nextButtonText?: string
}

export function CheckoutWizard({
  currentStep,
  totalSteps,
  onNext,
  onBack,
  isNextDisabled = false,
  isLoading = false,
  children,
  hideNavigation = false,
  nextButtonText = 'Continuar',
}: CheckoutWizardProps) {
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === totalSteps - 1

  return (
    <div className="space-y-6">
      {/* Content */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
        <CardContent className="p-6 md:p-8">
          {children}
        </CardContent>
      </Card>

      {/* Navigation */}
      {!hideNavigation && (
        <div className="flex items-center justify-between gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isFirstStep || isLoading}
            className={cn(
              "gap-2",
              isFirstStep && "invisible"
            )}
          >
            <ArrowLeft className="h-4 w-4" />
            Atrás
          </Button>

          <Button
            type="button"
            onClick={onNext}
            disabled={isNextDisabled || isLoading}
            className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
          >
            {nextButtonText}
            {!isLastStep && <ArrowRight className="h-4 w-4" />}
          </Button>
        </div>
      )}
    </div>
  )
}
