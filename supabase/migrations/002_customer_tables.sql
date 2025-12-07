-- Agregar rol customer al enum si no existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'customer' AND enumtypid = 'user_role'::regtype) THEN
    ALTER TYPE user_role ADD VALUE 'customer';
  END IF;
END $$;

-- Tabla de direcciones de clientes
CREATE TABLE IF NOT EXISTS customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label VARCHAR(50) NOT NULL DEFAULT 'Casa', -- Casa, Trabajo, Otro
  recipient_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  street VARCHAR(255) NOT NULL,
  number VARCHAR(20) NOT NULL,
  floor VARCHAR(20),
  apartment VARCHAR(20),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  country VARCHAR(100) NOT NULL DEFAULT 'Argentina',
  additional_info TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de métodos de pago guardados (solo referencias, no datos sensibles)
CREATE TABLE IF NOT EXISTS customer_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'card', 'mercadopago', 'bank_transfer'
  label VARCHAR(100) NOT NULL, -- Nombre descriptivo: "Visa terminada en 4242"
  provider VARCHAR(50), -- 'visa', 'mastercard', 'amex', 'mercadopago'
  last_four VARCHAR(4), -- Últimos 4 dígitos de la tarjeta
  expiry_month INTEGER,
  expiry_year INTEGER,
  mp_customer_id VARCHAR(255), -- ID del cliente en MercadoPago
  mp_card_id VARCHAR(255), -- ID de la tarjeta en MercadoPago
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agregar campos adicionales a la tabla users para el perfil
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS dni VARCHAR(20);

-- Índices
CREATE INDEX IF NOT EXISTS idx_customer_addresses_user_id ON customer_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_payment_methods_user_id ON customer_payment_methods(user_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_customer_addresses_updated_at ON customer_addresses;
CREATE TRIGGER update_customer_addresses_updated_at
  BEFORE UPDATE ON customer_addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customer_payment_methods_updated_at ON customer_payment_methods;
CREATE TRIGGER update_customer_payment_methods_updated_at
  BEFORE UPDATE ON customer_payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_payment_methods ENABLE ROW LEVEL SECURITY;

-- Políticas para direcciones - usuarios pueden ver/editar sus propias direcciones
CREATE POLICY "Users can view own addresses" ON customer_addresses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own addresses" ON customer_addresses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own addresses" ON customer_addresses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own addresses" ON customer_addresses
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para métodos de pago
CREATE POLICY "Users can view own payment methods" ON customer_payment_methods
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment methods" ON customer_payment_methods
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payment methods" ON customer_payment_methods
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own payment methods" ON customer_payment_methods
  FOR DELETE USING (auth.uid() = user_id);

-- Service role puede hacer todo
CREATE POLICY "Service role full access addresses" ON customer_addresses
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role full access payment methods" ON customer_payment_methods
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');
