-- Migración: Sistema de Carrito Persistente y Reserva de Stock
-- Fecha: 2025-12-09
-- Descripción: Carritos persistentes, reservas de stock temporal, recuperación de abandonados

-- ============================================
-- TABLA: shopping_carts
-- ============================================
CREATE TABLE IF NOT EXISTS shopping_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Usuario (null para invitados)
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Session ID para invitados
  session_id VARCHAR(255),

  -- Metadata del carrito
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal DECIMAL(10, 2) DEFAULT 0,
  discount DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) DEFAULT 0,

  -- Cupón aplicado
  coupon_id UUID REFERENCES coupons(id) ON DELETE SET NULL,
  coupon_code VARCHAR(50),

  -- Estado
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'abandoned', 'converted', 'expired')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days',

  -- Constraints
  CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

-- Índices para shopping_carts
CREATE INDEX idx_carts_user_id ON shopping_carts(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_carts_session_id ON shopping_carts(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_carts_status ON shopping_carts(status);
CREATE INDEX idx_carts_last_activity ON shopping_carts(last_activity_at DESC);
CREATE INDEX idx_carts_expires_at ON shopping_carts(expires_at);
CREATE UNIQUE INDEX idx_carts_active_user ON shopping_carts(user_id) WHERE status = 'active' AND user_id IS NOT NULL;
CREATE UNIQUE INDEX idx_carts_active_session ON shopping_carts(session_id) WHERE status = 'active' AND session_id IS NOT NULL;

-- ============================================
-- TABLA: stock_reservations
-- ============================================
CREATE TABLE IF NOT EXISTS stock_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Producto y variante
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,

  -- Cantidad reservada
  quantity INTEGER NOT NULL CHECK (quantity > 0),

  -- Asociación
  cart_id UUID REFERENCES shopping_carts(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id VARCHAR(255),

  -- Estado de la reserva
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'released', 'converted')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '15 minutes',
  released_at TIMESTAMPTZ,

  -- Una reserva debe tener cart_id o order_id
  CHECK (cart_id IS NOT NULL OR order_id IS NOT NULL)
);

-- Índices para stock_reservations
CREATE INDEX idx_reservations_product_id ON stock_reservations(product_id);
CREATE INDEX idx_reservations_variant_id ON stock_reservations(variant_id);
CREATE INDEX idx_reservations_cart_id ON stock_reservations(cart_id);
CREATE INDEX idx_reservations_order_id ON stock_reservations(order_id);
CREATE INDEX idx_reservations_status ON stock_reservations(status);
CREATE INDEX idx_reservations_expires_at ON stock_reservations(expires_at) WHERE status = 'active';

-- ============================================
-- TABLA: cart_recovery_emails
-- ============================================
CREATE TABLE IF NOT EXISTS cart_recovery_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Carrito abandonado
  cart_id UUID NOT NULL REFERENCES shopping_carts(id) ON DELETE CASCADE,

  -- Email del usuario
  email VARCHAR(255) NOT NULL,

  -- Token único para recovery
  recovery_token VARCHAR(255) NOT NULL UNIQUE,

  -- Estado
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,

  -- Metadata
  email_subject VARCHAR(500),
  email_sent_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days'
);

-- Índices para cart_recovery_emails
CREATE INDEX idx_recovery_cart_id ON cart_recovery_emails(cart_id);
CREATE INDEX idx_recovery_token ON cart_recovery_emails(recovery_token);
CREATE INDEX idx_recovery_email ON cart_recovery_emails(email);
CREATE INDEX idx_recovery_created_at ON cart_recovery_emails(created_at DESC);

-- ============================================
-- FUNCIÓN: Actualizar timestamp de carrito
-- ============================================
CREATE OR REPLACE FUNCTION update_cart_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  NEW.last_activity_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar timestamp
CREATE TRIGGER trigger_update_cart_timestamp
BEFORE UPDATE ON shopping_carts
FOR EACH ROW
EXECUTE FUNCTION update_cart_timestamp();

-- ============================================
-- FUNCIÓN: Liberar reservas expiradas
-- ============================================
CREATE OR REPLACE FUNCTION release_expired_reservations()
RETURNS INTEGER AS $$
DECLARE
  released_count INTEGER;
BEGIN
  -- Actualizar reservas expiradas
  UPDATE stock_reservations
  SET
    status = 'released',
    released_at = NOW()
  WHERE
    status = 'active'
    AND expires_at < NOW();

  GET DIAGNOSTICS released_count = ROW_COUNT;

  RETURN released_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCIÓN: Marcar carritos abandonados
-- ============================================
CREATE OR REPLACE FUNCTION mark_abandoned_carts()
RETURNS INTEGER AS $$
DECLARE
  abandoned_count INTEGER;
BEGIN
  -- Marcar carritos sin actividad en 24h como abandonados
  UPDATE shopping_carts
  SET status = 'abandoned'
  WHERE
    status = 'active'
    AND last_activity_at < NOW() - INTERVAL '24 hours'
    AND jsonb_array_length(items) > 0;

  GET DIAGNOSTICS abandoned_count = ROW_COUNT;

  RETURN abandoned_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCIÓN: Limpiar carritos expirados
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_expired_carts()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Eliminar carritos expirados
  DELETE FROM shopping_carts
  WHERE expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCIÓN: Crear o actualizar carrito
-- ============================================
CREATE OR REPLACE FUNCTION upsert_cart(
  p_user_id UUID DEFAULT NULL,
  p_session_id VARCHAR DEFAULT NULL,
  p_items JSONB DEFAULT '[]'::jsonb,
  p_subtotal DECIMAL DEFAULT 0,
  p_discount DECIMAL DEFAULT 0,
  p_total DECIMAL DEFAULT 0,
  p_coupon_id UUID DEFAULT NULL,
  p_coupon_code VARCHAR DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_cart_id UUID;
BEGIN
  -- Buscar carrito activo existente
  IF p_user_id IS NOT NULL THEN
    SELECT id INTO v_cart_id
    FROM shopping_carts
    WHERE user_id = p_user_id
      AND status = 'active'
    LIMIT 1;
  ELSIF p_session_id IS NOT NULL THEN
    SELECT id INTO v_cart_id
    FROM shopping_carts
    WHERE session_id = p_session_id
      AND status = 'active'
    LIMIT 1;
  END IF;

  -- Si existe, actualizar
  IF v_cart_id IS NOT NULL THEN
    UPDATE shopping_carts
    SET
      items = p_items,
      subtotal = p_subtotal,
      discount = p_discount,
      total = p_total,
      coupon_id = p_coupon_id,
      coupon_code = p_coupon_code,
      last_activity_at = NOW()
    WHERE id = v_cart_id;
  ELSE
    -- Si no existe, crear
    INSERT INTO shopping_carts (
      user_id,
      session_id,
      items,
      subtotal,
      discount,
      total,
      coupon_id,
      coupon_code
    ) VALUES (
      p_user_id,
      p_session_id,
      p_items,
      p_subtotal,
      p_discount,
      p_total,
      p_coupon_id,
      p_coupon_code
    )
    RETURNING id INTO v_cart_id;
  END IF;

  RETURN v_cart_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCIÓN: Merge de carritos al login
-- ============================================
CREATE OR REPLACE FUNCTION merge_carts(
  p_user_id UUID,
  p_session_id VARCHAR
)
RETURNS UUID AS $$
DECLARE
  v_user_cart_id UUID;
  v_session_cart_id UUID;
  v_user_items JSONB;
  v_session_items JSONB;
  v_merged_items JSONB;
BEGIN
  -- Obtener carrito del usuario
  SELECT id, items INTO v_user_cart_id, v_user_items
  FROM shopping_carts
  WHERE user_id = p_user_id
    AND status = 'active'
  LIMIT 1;

  -- Obtener carrito de la sesión
  SELECT id, items INTO v_session_cart_id, v_session_items
  FROM shopping_carts
  WHERE session_id = p_session_id
    AND status = 'active'
  LIMIT 1;

  -- Si no hay carrito de sesión, retornar el del usuario
  IF v_session_cart_id IS NULL THEN
    RETURN v_user_cart_id;
  END IF;

  -- Si no hay carrito de usuario, transferir el de sesión
  IF v_user_cart_id IS NULL THEN
    UPDATE shopping_carts
    SET user_id = p_user_id,
        session_id = NULL
    WHERE id = v_session_cart_id;

    RETURN v_session_cart_id;
  END IF;

  -- Merge de items (lógica simplificada: agregar items de sesión al usuario)
  -- En producción, esto debería ser más sofisticado
  v_merged_items := v_user_items || v_session_items;

  UPDATE shopping_carts
  SET items = v_merged_items,
      last_activity_at = NOW()
  WHERE id = v_user_cart_id;

  -- Marcar carrito de sesión como convertido
  UPDATE shopping_carts
  SET status = 'converted'
  WHERE id = v_session_cart_id;

  RETURN v_user_cart_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCIÓN: Reservar stock
-- ============================================
CREATE OR REPLACE FUNCTION reserve_stock(
  p_product_id UUID,
  p_variant_id UUID,
  p_quantity INTEGER,
  p_cart_id UUID DEFAULT NULL,
  p_order_id UUID DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_session_id VARCHAR DEFAULT NULL,
  p_duration_minutes INTEGER DEFAULT 15
)
RETURNS BOOLEAN AS $$
DECLARE
  v_available_stock INTEGER;
  v_reserved_stock INTEGER;
  v_product_stock INTEGER;
  v_variant_stock INTEGER;
BEGIN
  -- Obtener stock del producto o variante
  IF p_variant_id IS NOT NULL THEN
    SELECT stock INTO v_variant_stock
    FROM product_variants
    WHERE id = p_variant_id;

    v_available_stock := v_variant_stock;
  ELSE
    SELECT stock INTO v_product_stock
    FROM products
    WHERE id = p_product_id;

    v_available_stock := v_product_stock;
  END IF;

  -- Calcular stock ya reservado (activo)
  SELECT COALESCE(SUM(quantity), 0) INTO v_reserved_stock
  FROM stock_reservations
  WHERE product_id = p_product_id
    AND (p_variant_id IS NULL OR variant_id = p_variant_id)
    AND status = 'active'
    AND expires_at > NOW();

  -- Verificar disponibilidad
  IF (v_available_stock - v_reserved_stock) < p_quantity THEN
    RETURN FALSE;
  END IF;

  -- Crear reserva
  INSERT INTO stock_reservations (
    product_id,
    variant_id,
    quantity,
    cart_id,
    order_id,
    user_id,
    session_id,
    expires_at
  ) VALUES (
    p_product_id,
    p_variant_id,
    p_quantity,
    p_cart_id,
    p_order_id,
    p_user_id,
    p_session_id,
    NOW() + (p_duration_minutes || ' minutes')::INTERVAL
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCIÓN: Obtener stock disponible (con reservas)
-- ============================================
CREATE OR REPLACE FUNCTION get_available_stock(
  p_product_id UUID,
  p_variant_id UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_total_stock INTEGER;
  v_reserved_stock INTEGER;
BEGIN
  -- Obtener stock total
  IF p_variant_id IS NOT NULL THEN
    SELECT stock INTO v_total_stock
    FROM product_variants
    WHERE id = p_variant_id;
  ELSE
    SELECT stock INTO v_total_stock
    FROM products
    WHERE id = p_product_id;
  END IF;

  -- Calcular stock reservado
  SELECT COALESCE(SUM(quantity), 0) INTO v_reserved_stock
  FROM stock_reservations
  WHERE product_id = p_product_id
    AND (p_variant_id IS NULL OR variant_id = p_variant_id)
    AND status = 'active'
    AND expires_at > NOW();

  RETURN GREATEST(v_total_stock - v_reserved_stock, 0);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS
ALTER TABLE shopping_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_recovery_emails ENABLE ROW LEVEL SECURITY;

-- Políticas para shopping_carts

-- Usuarios pueden ver su propio carrito
CREATE POLICY "Users can view their own cart"
  ON shopping_carts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Usuarios pueden actualizar su propio carrito
CREATE POLICY "Users can update their own cart"
  ON shopping_carts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Usuarios pueden insertar su propio carrito
CREATE POLICY "Users can insert their own cart"
  ON shopping_carts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Admins pueden ver todos los carritos
CREATE POLICY "Admins can view all carts"
  ON shopping_carts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'super_admin')
    )
  );

-- Service role full access
CREATE POLICY "Service role full access carts"
  ON shopping_carts FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Políticas para stock_reservations (solo lectura para usuarios)

CREATE POLICY "Users can view active reservations"
  ON stock_reservations FOR SELECT
  USING (status = 'active' AND expires_at > NOW());

CREATE POLICY "Service role full access reservations"
  ON stock_reservations FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Políticas para cart_recovery_emails (solo admins)

CREATE POLICY "Admins can view recovery emails"
  ON cart_recovery_emails FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Service role full access recovery"
  ON cart_recovery_emails FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- COMENTARIOS
-- ============================================

COMMENT ON TABLE shopping_carts IS 'Carritos de compra persistentes para usuarios y sesiones';
COMMENT ON TABLE stock_reservations IS 'Reservas temporales de stock para evitar sobreventa';
COMMENT ON TABLE cart_recovery_emails IS 'Emails de recuperación de carritos abandonados';

COMMENT ON FUNCTION release_expired_reservations() IS 'Libera automáticamente reservas de stock expiradas';
COMMENT ON FUNCTION mark_abandoned_carts() IS 'Marca carritos sin actividad como abandonados';
COMMENT ON FUNCTION cleanup_expired_carts() IS 'Elimina carritos que excedieron su tiempo de vida';
COMMENT ON FUNCTION merge_carts(UUID, VARCHAR) IS 'Combina carrito de sesión con carrito de usuario al login';
COMMENT ON FUNCTION reserve_stock(UUID, UUID, INTEGER, UUID, UUID, UUID, VARCHAR, INTEGER) IS 'Reserva stock temporalmente';
COMMENT ON FUNCTION get_available_stock(UUID, UUID) IS 'Calcula stock disponible considerando reservas activas';
