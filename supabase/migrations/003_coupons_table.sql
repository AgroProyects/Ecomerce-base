-- =============================================
-- Tabla de cupones de descuento
-- =============================================

-- Crear enum para tipo de descuento
CREATE TYPE discount_type AS ENUM ('percentage', 'fixed');

-- Crear tabla de cupones
CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    discount_type discount_type NOT NULL DEFAULT 'percentage',
    discount_value DECIMAL(10, 2) NOT NULL,
    min_purchase_amount DECIMAL(10, 2) DEFAULT 0,
    max_discount_amount DECIMAL(10, 2), -- Límite máximo de descuento (para porcentajes)
    usage_limit INTEGER, -- Límite total de usos
    usage_count INTEGER DEFAULT 0,
    usage_limit_per_user INTEGER DEFAULT 1, -- Límite de usos por usuario
    is_active BOOLEAN DEFAULT true,
    starts_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    applicable_categories UUID[], -- IDs de categorías donde aplica (null = todas)
    applicable_products UUID[], -- IDs de productos donde aplica (null = todos)
    excluded_products UUID[], -- IDs de productos excluidos
    first_purchase_only BOOLEAN DEFAULT false, -- Solo para primera compra
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para rastrear uso de cupones por usuario
CREATE TABLE coupon_usages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_email VARCHAR(255) NOT NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    discount_applied DECIMAL(10, 2) NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agregar columna de cupón a la tabla orders
ALTER TABLE orders
ADD COLUMN coupon_id UUID REFERENCES coupons(id) ON DELETE SET NULL,
ADD COLUMN coupon_code VARCHAR(50);

-- Crear índices
CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_active ON coupons(is_active) WHERE is_active = true;
CREATE INDEX idx_coupons_expires ON coupons(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_coupon_usages_coupon ON coupon_usages(coupon_id);
CREATE INDEX idx_coupon_usages_user ON coupon_usages(user_email);
CREATE INDEX idx_orders_coupon ON orders(coupon_id) WHERE coupon_id IS NOT NULL;

-- Trigger para actualizar updated_at
CREATE TRIGGER update_coupons_updated_at
    BEFORE UPDATE ON coupons
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Función para validar y aplicar cupón
CREATE OR REPLACE FUNCTION validate_coupon(
    p_code VARCHAR(50),
    p_user_email VARCHAR(255),
    p_subtotal DECIMAL(10, 2),
    p_product_ids UUID[] DEFAULT NULL,
    p_category_ids UUID[] DEFAULT NULL
) RETURNS TABLE (
    is_valid BOOLEAN,
    coupon_id UUID,
    discount_type discount_type,
    discount_value DECIMAL(10, 2),
    calculated_discount DECIMAL(10, 2),
    error_message TEXT
) AS $$
DECLARE
    v_coupon RECORD;
    v_user_usage_count INTEGER;
    v_calculated_discount DECIMAL(10, 2);
BEGIN
    -- Buscar el cupón
    SELECT * INTO v_coupon
    FROM coupons c
    WHERE UPPER(c.code) = UPPER(p_code)
    AND c.is_active = true;

    -- Verificar si existe
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::discount_type, NULL::DECIMAL, NULL::DECIMAL, 'Cupón no válido'::TEXT;
        RETURN;
    END IF;

    -- Verificar fechas
    IF v_coupon.starts_at IS NOT NULL AND v_coupon.starts_at > NOW() THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::discount_type, NULL::DECIMAL, NULL::DECIMAL, 'El cupón aún no está activo'::TEXT;
        RETURN;
    END IF;

    IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < NOW() THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::discount_type, NULL::DECIMAL, NULL::DECIMAL, 'El cupón ha expirado'::TEXT;
        RETURN;
    END IF;

    -- Verificar límite total de usos
    IF v_coupon.usage_limit IS NOT NULL AND v_coupon.usage_count >= v_coupon.usage_limit THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::discount_type, NULL::DECIMAL, NULL::DECIMAL, 'El cupón ha alcanzado su límite de uso'::TEXT;
        RETURN;
    END IF;

    -- Verificar límite por usuario
    SELECT COUNT(*) INTO v_user_usage_count
    FROM coupon_usages
    WHERE coupon_id = v_coupon.id AND user_email = p_user_email;

    IF v_coupon.usage_limit_per_user IS NOT NULL AND v_user_usage_count >= v_coupon.usage_limit_per_user THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::discount_type, NULL::DECIMAL, NULL::DECIMAL, 'Ya has utilizado este cupón'::TEXT;
        RETURN;
    END IF;

    -- Verificar monto mínimo de compra
    IF v_coupon.min_purchase_amount IS NOT NULL AND p_subtotal < v_coupon.min_purchase_amount THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::discount_type, NULL::DECIMAL, NULL::DECIMAL,
            'El monto mínimo de compra es $' || v_coupon.min_purchase_amount::TEXT;
        RETURN;
    END IF;

    -- Verificar primera compra
    IF v_coupon.first_purchase_only THEN
        IF EXISTS (SELECT 1 FROM orders WHERE customer_email = p_user_email AND status NOT IN ('cancelled', 'refunded')) THEN
            RETURN QUERY SELECT false, NULL::UUID, NULL::discount_type, NULL::DECIMAL, NULL::DECIMAL, 'Este cupón es solo para primera compra'::TEXT;
            RETURN;
        END IF;
    END IF;

    -- Calcular descuento
    IF v_coupon.discount_type = 'percentage' THEN
        v_calculated_discount := p_subtotal * (v_coupon.discount_value / 100);
        -- Aplicar límite máximo si existe
        IF v_coupon.max_discount_amount IS NOT NULL AND v_calculated_discount > v_coupon.max_discount_amount THEN
            v_calculated_discount := v_coupon.max_discount_amount;
        END IF;
    ELSE
        v_calculated_discount := v_coupon.discount_value;
    END IF;

    -- El descuento no puede ser mayor que el subtotal
    IF v_calculated_discount > p_subtotal THEN
        v_calculated_discount := p_subtotal;
    END IF;

    RETURN QUERY SELECT
        true,
        v_coupon.id,
        v_coupon.discount_type,
        v_coupon.discount_value,
        v_calculated_discount,
        NULL::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Función para registrar uso de cupón
CREATE OR REPLACE FUNCTION use_coupon(
    p_coupon_id UUID,
    p_user_id UUID,
    p_user_email VARCHAR(255),
    p_order_id UUID,
    p_discount_applied DECIMAL(10, 2)
) RETURNS BOOLEAN AS $$
BEGIN
    -- Registrar uso
    INSERT INTO coupon_usages (coupon_id, user_id, user_email, order_id, discount_applied)
    VALUES (p_coupon_id, p_user_id, p_user_email, p_order_id, p_discount_applied);

    -- Incrementar contador
    UPDATE coupons
    SET usage_count = usage_count + 1
    WHERE id = p_coupon_id;

    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usages ENABLE ROW LEVEL SECURITY;

-- Políticas para coupons (solo admins pueden gestionar)
CREATE POLICY "Admins can manage coupons" ON coupons
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('super_admin', 'admin')
        )
    );

-- Permitir lectura pública de cupones activos (para validación)
CREATE POLICY "Anyone can read active coupons" ON coupons
    FOR SELECT
    TO anon, authenticated
    USING (is_active = true);

-- Políticas para coupon_usages
CREATE POLICY "Users can see their own coupon usages" ON coupon_usages
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Admins can see all coupon usages" ON coupon_usages
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('super_admin', 'admin')
        )
    );

CREATE POLICY "System can insert coupon usages" ON coupon_usages
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Insertar algunos cupones de ejemplo
INSERT INTO coupons (code, description, discount_type, discount_value, min_purchase_amount, usage_limit, expires_at) VALUES
    ('BIENVENIDO10', 'Descuento de bienvenida del 10%', 'percentage', 10, 5000, NULL, NOW() + INTERVAL '1 year'),
    ('PROMO20', 'Promoción especial 20% de descuento', 'percentage', 20, 10000, 100, NOW() + INTERVAL '3 months'),
    ('ENVIOGRATIS', 'Descuento fijo de $2000', 'fixed', 2000, 15000, 50, NOW() + INTERVAL '1 month');
