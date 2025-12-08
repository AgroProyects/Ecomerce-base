import { useState } from 'react';
import { useFileUpload } from './useFileUpload';
import { uploadPaymentProof } from '@/actions/orders';
import { STORAGE_BUCKETS } from '@/lib/storage/constants';
import { toast } from 'sonner';

interface UsePaymentProofUploadProps {
  orderId: string;
  onSuccess?: () => void;
}

export function usePaymentProofUpload({ orderId, onSuccess }: UsePaymentProofUploadProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    upload: uploadToStorage,
    isUploading,
    progress,
    error: uploadError,
  } = useFileUpload({
    bucket: STORAGE_BUCKETS.PAYMENT_PROOFS,
    maxSize: 5, // 5MB max
    allowedTypes: ['image/*', 'application/pdf'],
    onSuccess: async (result) => {
      if (!result.publicUrl) {
        toast.error('Error al obtener URL del comprobante');
        return;
      }

      // Actualizar la orden con el comprobante
      setIsSubmitting(true);
      const updateResult = await uploadPaymentProof({
        order_id: orderId,
        payment_proof_url: result.publicUrl,
      });

      setIsSubmitting(false);

      if (updateResult.success) {
        toast.success('Comprobante de pago subido exitosamente');
        onSuccess?.();
      } else {
        toast.error(updateResult.error || 'Error al actualizar la orden');
      }
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  const handleFileUpload = async (file: File) => {
    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${orderId}/${timestamp}-${sanitizedFileName}`;

    await uploadToStorage(file, fileName);
  };

  return {
    upload: handleFileUpload,
    isUploading: isUploading || isSubmitting,
    progress,
    error: uploadError,
  };
}
