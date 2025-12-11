-- Migration: Shipping Costs by Department
-- Sistema de costos de envío por departamento para Uruguay

-- Crear tabla de costos de envío
CREATE TABLE IF NOT EXISTS shipping_costs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department VARCHAR(100) NOT NULL UNIQUE,
    cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
    free_shipping_threshold DECIMAL(10, 2) DEFAULT NULL,
    estimated_days_min INTEGER DEFAULT 1,
    estimated_days_max INTEGER DEFAULT 3,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índice para búsqueda por departamento
CREATE INDEX IF NOT EXISTS idx_shipping_costs_department ON shipping_costs(department);
CREATE INDEX IF NOT EXISTS idx_shipping_costs_is_active ON shipping_costs(is_active);

-- Insertar todos los departamentos de Uruguay con costos por defecto
-- Montevideo y alrededores tienen menores costos
-- Departamentos más lejanos tienen mayores costos
INSERT INTO shipping_costs (department, cost, estimated_days_min, estimated_days_max) VALUES
    ('Montevideo', 150, 1, 2),
    ('Canelones', 200, 1, 2),
    ('San José', 220, 1, 2),
    ('Florida', 250, 2, 3),
    ('Maldonado', 280, 2, 3),
    ('Colonia', 280, 2, 3),
    ('Lavalleja', 280, 2, 3),
    ('Rocha', 320, 2, 4),
    ('Soriano', 320, 2, 4),
    ('Durazno', 320, 2, 4),
    ('Flores', 320, 2, 4),
    ('Treinta y Tres', 350, 3, 5),
    ('Cerro Largo', 350, 3, 5),
    ('Río Negro', 350, 3, 5),
    ('Paysandú', 380, 3, 5),
    ('Tacuarembó', 380, 3, 5),
    ('Rivera', 400, 3, 5),
    ('Salto', 400, 3, 5),
    ('Artigas', 420, 4, 6)
ON CONFLICT (department) DO NOTHING;

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_shipping_costs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_shipping_costs_updated_at ON shipping_costs;
CREATE TRIGGER trigger_shipping_costs_updated_at
    BEFORE UPDATE ON shipping_costs
    FOR EACH ROW
    EXECUTE FUNCTION update_shipping_costs_updated_at();

-- Habilitar RLS
ALTER TABLE shipping_costs ENABLE ROW LEVEL SECURITY;

-- Política: Cualquiera puede leer los costos de envío
CREATE POLICY "Anyone can read shipping costs"
    ON shipping_costs
    FOR SELECT
    USING (true);

-- Política: Solo admins pueden modificar costos de envío
CREATE POLICY "Admins can manage shipping costs"
    ON shipping_costs
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'super_admin')
        )
    );

-- Comentarios
COMMENT ON TABLE shipping_costs IS 'Costos de envío por departamento de Uruguay';
COMMENT ON COLUMN shipping_costs.department IS 'Nombre del departamento';
COMMENT ON COLUMN shipping_costs.cost IS 'Costo base de envío en pesos uruguayos';
COMMENT ON COLUMN shipping_costs.free_shipping_threshold IS 'Monto mínimo de compra para envío gratis (null = sin envío gratis)';
COMMENT ON COLUMN shipping_costs.estimated_days_min IS 'Días mínimos estimados de entrega';
COMMENT ON COLUMN shipping_costs.estimated_days_max IS 'Días máximos estimados de entrega';
COMMENT ON COLUMN shipping_costs.is_active IS 'Si el envío está disponible para este departamento';
