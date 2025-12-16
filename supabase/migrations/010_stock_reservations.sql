-- =====================================================
-- SISTEMA DE RESERVAS DE STOCK
-- =====================================================
-- Previene overselling cuando múltiples usuarios
-- compran el mismo producto simultáneamente
-- =====================================================

-- =====================================================
-- ENUM: reservation_status
-- =====================================================

DO $$ BEGIN
  CREATE TYPE reservation_status AS ENUM (
    'active',      -- Reserva activa
    'completed',   -- Convertida en orden
    'expired',     -- Expiró por timeout
    'cancelled'    -- Cancelada manualmente
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- TABLA: stock_reservations
-- Reservas temporales de stock durante checkout
-- =====================================================

CREATE TABLE IF NOT EXISTS stock_reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Producto/variante reservado
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,

  -- Cantidad reservada
  quantity INTEGER NOT NULL CHECK (quantity > 0),

  -- Usuario/sesión que hizo la reserva
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id TEXT, -- Para usuarios no autenticados

  -- Estado de la reserva
  status reservation_status DEFAULT 'active',

  -- Referencia a orden (cuando se completa)
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,

  -- Timestamps
  expires_at TIMESTAMPTZ NOT NULL, -- Momento en que expira la reserva
  completed_at TIMESTAMPTZ,        -- Cuando se convirtió en orden
  cancelled_at TIMESTAMPTZ,        -- Cuando se canceló
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Restricciones
  CONSTRAINT check_product_or_variant CHECK (
    (product_id IS NOT NULL AND variant_id IS NULL) OR
    (product_id IS NULL AND variant_id IS NOT NULL)
  ),
  CONSTRAINT check_user_or_session CHECK (
    user_id IS NOT NULL OR session_id IS NOT NULL
  )
);

-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_reservations_product ON stock_reservations(product_id);
CREATE INDEX IF NOT EXISTS idx_reservations_variant ON stock_reservations(variant_id);
CREATE INDEX IF NOT EXISTS idx_reservations_user ON stock_reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_session ON stock_reservations(session_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON stock_reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_expires ON stock_reservations(expires_at);
CREATE INDEX IF NOT EXISTS idx_reservations_order ON stock_reservations(order_id);

-- Índice compuesto para búsqueda eficiente de reservas activas
DROP INDEX IF EXISTS idx_reservations_active;
CREATE INDEX idx_reservations_active ON stock_reservations(status, expires_at)
  WHERE status = 'active';

-- =====================================================
-- FUNCIÓN: get_available_stock
-- Obtiene stock disponible (stock total - reservas activas)
-- =====================================================

DROP FUNCTION IF EXISTS get_available_stock(UUID, UUID);

CREATE OR REPLACE FUNCTION get_available_stock(
  p_product_id UUID DEFAULT NULL,
  p_variant_id UUID DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  v_total_stock INTEGER;
  v_reserved_stock INTEGER;
BEGIN
  -- Validar parámetros
  IF p_product_id IS NULL AND p_variant_id IS NULL THEN
    RAISE EXCEPTION 'Debe proporcionar product_id o variant_id';
  END IF;

  IF p_product_id IS NOT NULL AND p_variant_id IS NOT NULL THEN
    RAISE EXCEPTION 'Solo puede proporcionar product_id O variant_id, no ambos';
  END IF;

  -- Obtener stock total
  IF p_product_id IS NOT NULL THEN
    SELECT stock INTO v_total_stock
    FROM products
    WHERE id = p_product_id;
  ELSE
    SELECT stock INTO v_total_stock
    FROM product_variants
    WHERE id = p_variant_id;
  END IF;

  -- Si no existe el producto/variante, retornar 0
  IF v_total_stock IS NULL THEN
    RETURN 0;
  END IF;

  -- Calcular stock reservado (solo reservas activas y no expiradas)
  SELECT COALESCE(SUM(quantity), 0) INTO v_reserved_stock
  FROM stock_reservations
  WHERE status = 'active'
    AND expires_at > NOW()
    AND (
      (p_product_id IS NOT NULL AND product_id = p_product_id) OR
      (p_variant_id IS NOT NULL AND variant_id = p_variant_id)
    );

  -- Retornar stock disponible
  RETURN GREATEST(v_total_stock - v_reserved_stock, 0);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN: reserve_stock
-- Reserva stock para un producto/variante
-- =====================================================

DROP FUNCTION IF EXISTS reserve_stock(UUID, UUID, INTEGER, UUID, TEXT, INTEGER);

CREATE OR REPLACE FUNCTION reserve_stock(
  p_product_id UUID DEFAULT NULL,
  p_variant_id UUID DEFAULT NULL,
  p_quantity INTEGER DEFAULT 1,
  p_user_id UUID DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_expires_in_minutes INTEGER DEFAULT 15
) RETURNS UUID AS $$
DECLARE
  v_available_stock INTEGER;
  v_reservation_id UUID;
BEGIN
  -- Validar parámetros
  IF p_product_id IS NULL AND p_variant_id IS NULL THEN
    RAISE EXCEPTION 'Debe proporcionar product_id o variant_id';
  END IF;

  IF p_user_id IS NULL AND p_session_id IS NULL THEN
    RAISE EXCEPTION 'Debe proporcionar user_id o session_id';
  END IF;

  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'La cantidad debe ser mayor a 0';
  END IF;

  -- Verificar stock disponible
  v_available_stock := get_available_stock(p_product_id, p_variant_id);

  IF v_available_stock < p_quantity THEN
    RAISE EXCEPTION 'Stock insuficiente. Disponible: %, Solicitado: %', v_available_stock, p_quantity;
  END IF;

  -- Crear reserva
  INSERT INTO stock_reservations (
    product_id,
    variant_id,
    quantity,
    user_id,
    session_id,
    status,
    expires_at
  ) VALUES (
    p_product_id,
    p_variant_id,
    p_quantity,
    p_user_id,
    p_session_id,
    'active',
    NOW() + (p_expires_in_minutes || ' minutes')::INTERVAL
  )
  RETURNING id INTO v_reservation_id;

  RETURN v_reservation_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN: release_reservation
-- Libera una reserva (cambio de cantidad o cancelación)
-- =====================================================

DROP FUNCTION IF EXISTS release_reservation(UUID, TEXT);

CREATE OR REPLACE FUNCTION release_reservation(
  p_reservation_id UUID,
  p_reason TEXT DEFAULT 'cancelled'
) RETURNS BOOLEAN AS $$
DECLARE
  v_status reservation_status;
BEGIN
  -- Obtener estado actual
  SELECT status INTO v_status
  FROM stock_reservations
  WHERE id = p_reservation_id;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Reserva no encontrada';
  END IF;

  IF v_status != 'active' THEN
    RAISE EXCEPTION 'La reserva ya no está activa (estado: %)', v_status;
  END IF;

  -- Actualizar reserva
  UPDATE stock_reservations
  SET
    status = CASE
      WHEN p_reason = 'expired' THEN 'expired'::reservation_status
      ELSE 'cancelled'::reservation_status
    END,
    cancelled_at = CASE WHEN p_reason != 'expired' THEN NOW() ELSE NULL END,
    updated_at = NOW()
  WHERE id = p_reservation_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN: complete_reservation
-- Completa una reserva (asociándola a una orden)
-- =====================================================

DROP FUNCTION IF EXISTS complete_reservation(UUID, UUID);

CREATE OR REPLACE FUNCTION complete_reservation(
  p_reservation_id UUID,
  p_order_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_status reservation_status;
  v_product_id UUID;
  v_variant_id UUID;
  v_quantity INTEGER;
BEGIN
  -- Obtener detalles de la reserva
  SELECT status, product_id, variant_id, quantity
  INTO v_status, v_product_id, v_variant_id, v_quantity
  FROM stock_reservations
  WHERE id = p_reservation_id;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Reserva no encontrada';
  END IF;

  IF v_status != 'active' THEN
    RAISE EXCEPTION 'La reserva ya no está activa (estado: %)', v_status;
  END IF;

  -- Actualizar reserva
  UPDATE stock_reservations
  SET
    status = 'completed',
    order_id = p_order_id,
    completed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_reservation_id;

  -- Decrementar stock real
  IF v_product_id IS NOT NULL THEN
    UPDATE products
    SET stock = stock - v_quantity
    WHERE id = v_product_id;
  ELSE
    UPDATE product_variants
    SET stock = stock - v_quantity
    WHERE id = v_variant_id;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN: cleanup_expired_reservations
-- Limpia reservas expiradas (ejecutar periódicamente)
-- =====================================================

DROP FUNCTION IF EXISTS cleanup_expired_reservations();

CREATE OR REPLACE FUNCTION cleanup_expired_reservations()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Marcar reservas expiradas
  UPDATE stock_reservations
  SET
    status = 'expired',
    updated_at = NOW()
  WHERE status = 'active'
    AND expires_at < NOW();

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER: update_updated_at
-- Actualiza updated_at automáticamente
-- =====================================================

DROP FUNCTION IF EXISTS update_reservations_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION update_reservations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_reservations_updated_at ON stock_reservations;
CREATE TRIGGER trigger_update_reservations_updated_at
  BEFORE UPDATE ON stock_reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_reservations_updated_at();

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista: Reservas activas con detalles
CREATE OR REPLACE VIEW active_reservations AS
SELECT
  r.id,
  r.product_id,
  r.variant_id,
  COALESCE(p.name, pv.name) as product_name,
  p.slug as product_slug,
  r.quantity,
  r.user_id,
  u.email as user_email,
  r.session_id,
  r.expires_at,
  EXTRACT(EPOCH FROM (r.expires_at - NOW())) as seconds_until_expiration,
  r.created_at
FROM stock_reservations r
LEFT JOIN products p ON r.product_id = p.id
LEFT JOIN product_variants pv ON r.variant_id = pv.id
LEFT JOIN users u ON r.user_id = u.id
WHERE r.status = 'active'
  AND r.expires_at > NOW()
ORDER BY r.expires_at ASC;

-- Vista: Stock disponible por producto
CREATE OR REPLACE VIEW product_stock_availability AS
SELECT
  p.id,
  p.name,
  p.slug,
  p.stock as total_stock,
  COALESCE(SUM(r.quantity) FILTER (WHERE r.status = 'active' AND r.expires_at > NOW()), 0)::INTEGER as reserved_stock,
  get_available_stock(p.id, NULL) as available_stock,
  p.low_stock_threshold,
  CASE
    WHEN get_available_stock(p.id, NULL) = 0 THEN 'out_of_stock'
    WHEN get_available_stock(p.id, NULL) <= p.low_stock_threshold THEN 'low_stock'
    ELSE 'in_stock'
  END as stock_status
FROM products p
LEFT JOIN stock_reservations r ON r.product_id = p.id
WHERE p.track_inventory = true
GROUP BY p.id, p.name, p.slug, p.stock, p.low_stock_threshold
ORDER BY p.name;

-- =====================================================
-- POLÍTICAS RLS (Row Level Security)
-- =====================================================

ALTER TABLE stock_reservations ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can view own reservations" ON stock_reservations;
DROP POLICY IF EXISTS "Admins can view all reservations" ON stock_reservations;
DROP POLICY IF EXISTS "Service role can manage reservations" ON stock_reservations;

-- Los usuarios solo pueden ver sus propias reservas
CREATE POLICY "Users can view own reservations"
  ON stock_reservations
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    auth.role() = 'service_role'
  );

-- Los admins pueden ver todas las reservas
CREATE POLICY "Admins can view all reservations"
  ON stock_reservations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Solo el sistema puede crear/modificar reservas
CREATE POLICY "Service role can manage reservations"
  ON stock_reservations
  FOR ALL
  USING (auth.role() = 'service_role');

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON TABLE stock_reservations IS 'Reservas temporales de stock durante el proceso de checkout';
COMMENT ON FUNCTION get_available_stock IS 'Calcula el stock disponible (total - reservado)';
COMMENT ON FUNCTION reserve_stock IS 'Crea una reserva de stock temporal';
COMMENT ON FUNCTION release_reservation IS 'Libera una reserva (cancelación)';
COMMENT ON FUNCTION complete_reservation IS 'Completa una reserva (asocia a orden y decrementa stock)';
COMMENT ON FUNCTION cleanup_expired_reservations IS 'Marca reservas expiradas como expired';
