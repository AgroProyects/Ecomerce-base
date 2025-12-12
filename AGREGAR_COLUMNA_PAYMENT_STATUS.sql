-- SQL para agregar la columna payment_status a la tabla orders
-- Ejecuta esto en Supabase SQL Editor

-- Agregar la columna payment_status
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_status TEXT;

-- Agregar comentario a la columna
COMMENT ON COLUMN orders.payment_status IS 'Estado del pago en Mercado Pago (approved, pending, rejected, etc.)';

-- Actualizar las órdenes existentes que ya tienen un pago aprobado
UPDATE orders
SET payment_status = 'approved'
WHERE status = 'paid' AND payment_status IS NULL;

-- Actualizar las órdenes pendientes
UPDATE orders
SET payment_status = 'pending'
WHERE status IN ('pending', 'pending_payment') AND payment_status IS NULL;
