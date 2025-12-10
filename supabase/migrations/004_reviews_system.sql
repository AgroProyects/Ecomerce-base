-- Migración: Sistema de Reviews y Calificaciones
-- Fecha: 2025-12-09
-- Descripción: Tabla de reviews, ratings, y funciones auxiliares

-- ============================================
-- TABLA: product_reviews
-- ============================================
CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relaciones
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,

  -- Información del reviewer
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,

  -- Contenido del review
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  comment TEXT,

  -- Imágenes opcionales del review
  images JSONB DEFAULT '[]'::jsonb,

  -- Estado y moderación
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'spam')),
  is_verified_purchase BOOLEAN DEFAULT FALSE,

  -- Metadata
  helpful_count INTEGER DEFAULT 0,
  reported_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,

  -- Índices implícitos
  CONSTRAINT valid_rating CHECK (rating BETWEEN 1 AND 5)
);

-- ============================================
-- ÍNDICES para mejorar performance
-- ============================================
CREATE INDEX idx_reviews_product_id ON product_reviews(product_id);
CREATE INDEX idx_reviews_user_id ON product_reviews(user_id);
CREATE INDEX idx_reviews_status ON product_reviews(status);
CREATE INDEX idx_reviews_created_at ON product_reviews(created_at DESC);
CREATE INDEX idx_reviews_rating ON product_reviews(rating);
CREATE INDEX idx_reviews_product_status ON product_reviews(product_id, status) WHERE status = 'approved';
CREATE INDEX idx_reviews_verified ON product_reviews(is_verified_purchase) WHERE is_verified_purchase = TRUE;

-- ============================================
-- TABLA: review_helpful_votes
-- ============================================
CREATE TABLE IF NOT EXISTS review_helpful_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES product_reviews(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Evitar votos duplicados
  UNIQUE(review_id, user_id),
  UNIQUE(review_id, ip_address)
);

CREATE INDEX idx_helpful_votes_review_id ON review_helpful_votes(review_id);

-- ============================================
-- TABLA: review_reports (para moderación)
-- ============================================
CREATE TABLE IF NOT EXISTS review_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES product_reviews(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reason VARCHAR(100) NOT NULL CHECK (reason IN ('spam', 'inappropriate', 'fake', 'offensive', 'other')),
  details TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_review_reports_review_id ON review_reports(review_id);
CREATE INDEX idx_review_reports_created_at ON review_reports(created_at DESC);

-- ============================================
-- FUNCIÓN: Actualizar contador de helpful
-- ============================================
CREATE OR REPLACE FUNCTION update_review_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE product_reviews
    SET helpful_count = helpful_count + 1
    WHERE id = NEW.review_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE product_reviews
    SET helpful_count = GREATEST(helpful_count - 1, 0)
    WHERE id = OLD.review_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para helpful votes
CREATE TRIGGER trigger_update_helpful_count
AFTER INSERT OR DELETE ON review_helpful_votes
FOR EACH ROW
EXECUTE FUNCTION update_review_helpful_count();

-- ============================================
-- FUNCIÓN: Actualizar contador de reportes
-- ============================================
CREATE OR REPLACE FUNCTION update_review_report_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE product_reviews
    SET reported_count = reported_count + 1
    WHERE id = NEW.review_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para reports
CREATE TRIGGER trigger_update_report_count
AFTER INSERT ON review_reports
FOR EACH ROW
EXECUTE FUNCTION update_review_report_count();

-- ============================================
-- FUNCIÓN: Calcular rating promedio de producto
-- ============================================
CREATE OR REPLACE FUNCTION calculate_product_rating(p_product_id UUID)
RETURNS TABLE (
  average_rating NUMERIC,
  total_reviews BIGINT,
  rating_distribution JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(ROUND(AVG(rating)::numeric, 2), 0) as average_rating,
    COUNT(*) as total_reviews,
    jsonb_build_object(
      '5', COUNT(*) FILTER (WHERE rating = 5),
      '4', COUNT(*) FILTER (WHERE rating = 4),
      '3', COUNT(*) FILTER (WHERE rating = 3),
      '2', COUNT(*) FILTER (WHERE rating = 2),
      '1', COUNT(*) FILTER (WHERE rating = 1)
    ) as rating_distribution
  FROM product_reviews
  WHERE product_id = p_product_id
    AND status = 'approved';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCIÓN: Verificar si usuario puede dejar review
-- ============================================
CREATE OR REPLACE FUNCTION can_user_review_product(
  p_user_id UUID,
  p_product_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  has_purchased BOOLEAN;
  has_reviewed BOOLEAN;
BEGIN
  -- Verificar si el usuario compró el producto
  SELECT EXISTS(
    SELECT 1
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.customer_email = (SELECT email FROM users WHERE id = p_user_id)
      AND oi.product_id = p_product_id
      AND o.status IN ('paid', 'completed', 'shipped', 'delivered')
  ) INTO has_purchased;

  -- Verificar si ya dejó review
  SELECT EXISTS(
    SELECT 1
    FROM product_reviews
    WHERE user_id = p_user_id
      AND product_id = p_product_id
  ) INTO has_reviewed;

  RETURN has_purchased AND NOT has_reviewed;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCIÓN: Marcar review como verified purchase
-- ============================================
CREATE OR REPLACE FUNCTION mark_verified_purchase()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el review está asociado a una orden, marcarlo como verified
  IF NEW.order_id IS NOT NULL THEN
    NEW.is_verified_purchase := TRUE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para verified purchase
CREATE TRIGGER trigger_mark_verified_purchase
BEFORE INSERT ON product_reviews
FOR EACH ROW
EXECUTE FUNCTION mark_verified_purchase();

-- ============================================
-- FUNCIÓN: Auto-aprobar reviews de usuarios verificados
-- ============================================
CREATE OR REPLACE FUNCTION auto_approve_trusted_reviews()
RETURNS TRIGGER AS $$
DECLARE
  user_review_count INTEGER;
BEGIN
  -- Contar reviews aprobados del usuario
  SELECT COUNT(*)
  INTO user_review_count
  FROM product_reviews
  WHERE user_id = NEW.user_id
    AND status = 'approved';

  -- Si el usuario tiene 3+ reviews aprobados, auto-aprobar
  IF user_review_count >= 3 THEN
    NEW.status := 'approved';
    NEW.approved_at := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para auto-aprobar
CREATE TRIGGER trigger_auto_approve_trusted
BEFORE INSERT ON product_reviews
FOR EACH ROW
EXECUTE FUNCTION auto_approve_trusted_reviews();

-- ============================================
-- FUNCIÓN: Actualizar updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
CREATE TRIGGER trigger_update_reviews_timestamp
BEFORE UPDATE ON product_reviews
FOR EACH ROW
EXECUTE FUNCTION update_reviews_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_helpful_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_reports ENABLE ROW LEVEL SECURITY;

-- Políticas para product_reviews

-- Lectura: Todos pueden ver reviews aprobados
CREATE POLICY "Public can view approved reviews"
  ON product_reviews FOR SELECT
  USING (status = 'approved');

-- Lectura: Admins pueden ver todos
CREATE POLICY "Admins can view all reviews"
  ON product_reviews FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'super_admin')
    )
  );

-- Lectura: Usuarios pueden ver sus propios reviews
CREATE POLICY "Users can view their own reviews"
  ON product_reviews FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Inserción: Usuarios autenticados pueden crear reviews
CREATE POLICY "Authenticated users can create reviews"
  ON product_reviews FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Actualización: Usuarios pueden editar sus reviews (solo si pending)
CREATE POLICY "Users can update their pending reviews"
  ON product_reviews FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (user_id = auth.uid() AND status = 'pending');

-- Actualización: Admins pueden moderar reviews
CREATE POLICY "Admins can moderate reviews"
  ON product_reviews FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'super_admin')
    )
  );

-- Eliminación: Usuarios pueden borrar sus reviews
CREATE POLICY "Users can delete their own reviews"
  ON product_reviews FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Eliminación: Admins pueden borrar cualquier review
CREATE POLICY "Admins can delete any review"
  ON product_reviews FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'super_admin')
    )
  );

-- Políticas para review_helpful_votes

-- Lectura: Todos pueden ver
CREATE POLICY "Public can view helpful votes"
  ON review_helpful_votes FOR SELECT
  USING (true);

-- Inserción: Usuarios pueden votar
CREATE POLICY "Users can vote helpful"
  ON review_helpful_votes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Eliminación: Usuarios pueden quitar su voto
CREATE POLICY "Users can remove their vote"
  ON review_helpful_votes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Políticas para review_reports

-- Inserción: Usuarios pueden reportar
CREATE POLICY "Users can report reviews"
  ON review_reports FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Lectura: Solo admins pueden ver reportes
CREATE POLICY "Admins can view reports"
  ON review_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'super_admin')
    )
  );

-- ============================================
-- COMENTARIOS
-- ============================================

COMMENT ON TABLE product_reviews IS 'Reviews y calificaciones de productos';
COMMENT ON COLUMN product_reviews.rating IS 'Calificación de 1 a 5 estrellas';
COMMENT ON COLUMN product_reviews.status IS 'Estado de moderación: pending, approved, rejected, spam';
COMMENT ON COLUMN product_reviews.is_verified_purchase IS 'Indica si el review es de una compra verificada';
COMMENT ON COLUMN product_reviews.helpful_count IS 'Cantidad de votos "útil"';
COMMENT ON COLUMN product_reviews.reported_count IS 'Cantidad de reportes recibidos';
