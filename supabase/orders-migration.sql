-- Migración para extender el sistema de pedidos con métodos de pago

-- 1. Añadir nuevo estado 'pending_payment' al enum
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'pending_payment' AFTER 'pending';

-- 2. Añadir campos de método de pago y comprobante a la tabla orders
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('mercadopago', 'bank_transfer', 'cash_on_delivery')),
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT,
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- 3. Actualizar índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders(payment_method);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- 4. Crear bucket de storage para comprobantes de pago (ejecutar solo si no existe)
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('payment-proofs', 'payment-proofs', false)
-- ON CONFLICT (id) DO NOTHING;

-- 5. Política RLS para payment-proofs bucket
-- Permitir upload autenticado
-- CREATE POLICY "Allow authenticated uploads" ON storage.objects
-- FOR INSERT TO authenticated
-- WITH CHECK (bucket_id = 'payment-proofs');

-- Permitir lectura a admins
-- CREATE POLICY "Allow admin reads" ON storage.objects
-- FOR SELECT TO authenticated
-- USING (bucket_id = 'payment-proofs');

-- Permitir eliminación a admins
-- CREATE POLICY "Allow admin deletes" ON storage.objects
-- FOR DELETE TO authenticated
-- USING (bucket_id = 'payment-proofs');

-- 6. Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Trigger para actualizar updated_at en orders
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Comentarios en las columnas para documentación
COMMENT ON COLUMN orders.payment_method IS 'Método de pago: mercadopago, bank_transfer, cash_on_delivery';
COMMENT ON COLUMN orders.payment_proof_url IS 'URL del comprobante de pago (para transferencias bancarias)';
COMMENT ON COLUMN orders.admin_notes IS 'Notas internas del administrador';
COMMENT ON COLUMN orders.status IS 'Estado del pedido: pending, pending_payment, paid, processing, shipped, delivered, cancelled, refunded';

-- 9. Vista para reportes de pedidos (opcional)
CREATE OR REPLACE VIEW order_statistics AS
SELECT
    DATE_TRUNC('day', created_at) as date,
    status,
    payment_method,
    COUNT(*) as order_count,
    SUM(total) as total_amount,
    AVG(total) as average_order_value
FROM orders
GROUP BY DATE_TRUNC('day', created_at), status, payment_method
ORDER BY date DESC;
