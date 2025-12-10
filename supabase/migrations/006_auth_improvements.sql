-- Migración: Mejoras de Autenticación y Seguridad
-- Fecha: 2025-12-09
-- Descripción: Password reset, 2FA, email verification, security audit log

-- ============================================
-- TABLA: password_reset_tokens
-- ============================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Usuario
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,

  -- Token único y seguro
  token VARCHAR(255) NOT NULL UNIQUE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 hour',
  used_at TIMESTAMPTZ,

  -- IP de quien solicitó el reset
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX idx_password_reset_token ON password_reset_tokens(token) WHERE used_at IS NULL;
CREATE INDEX idx_password_reset_user ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_expires ON password_reset_tokens(expires_at);

-- ============================================
-- TABLA: email_verification_tokens
-- ============================================
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Usuario
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,

  -- Token único
  token VARCHAR(255) NOT NULL UNIQUE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
  verified_at TIMESTAMPTZ,

  ip_address INET
);

CREATE INDEX idx_email_verification_token ON email_verification_tokens(token) WHERE verified_at IS NULL;
CREATE INDEX idx_email_verification_user ON email_verification_tokens(user_id);

-- ============================================
-- TABLA: two_factor_auth
-- ============================================
CREATE TABLE IF NOT EXISTS two_factor_auth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Usuario (solo para admins)
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,

  -- Secret para TOTP (Time-based One-Time Password)
  secret VARCHAR(255) NOT NULL,

  -- Backup codes (encriptados)
  backup_codes JSONB DEFAULT '[]'::jsonb,

  -- Estado
  is_enabled BOOLEAN DEFAULT FALSE,

  -- Timestamps
  enabled_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_2fa_user ON two_factor_auth(user_id);
CREATE INDEX idx_2fa_enabled ON two_factor_auth(is_enabled) WHERE is_enabled = TRUE;

-- ============================================
-- TABLA: security_audit_log
-- ============================================
CREATE TABLE IF NOT EXISTS security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Usuario (puede ser null para intentos fallidos)
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  email VARCHAR(255),

  -- Tipo de evento
  event_type VARCHAR(100) NOT NULL CHECK (event_type IN (
    'login_success',
    'login_failed',
    'logout',
    'password_reset_requested',
    'password_reset_completed',
    'password_changed',
    'email_verified',
    '2fa_enabled',
    '2fa_disabled',
    '2fa_success',
    '2fa_failed',
    'role_changed',
    'account_locked',
    'account_unlocked',
    'suspicious_activity'
  )),

  -- Detalles del evento
  details JSONB,

  -- Información de la sesión
  ip_address INET,
  user_agent TEXT,
  location VARCHAR(255), -- Ciudad, País

  -- Severity
  severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_user_id ON security_audit_log(user_id);
CREATE INDEX idx_audit_email ON security_audit_log(email);
CREATE INDEX idx_audit_event_type ON security_audit_log(event_type);
CREATE INDEX idx_audit_created_at ON security_audit_log(created_at DESC);
CREATE INDEX idx_audit_severity ON security_audit_log(severity);
CREATE INDEX idx_audit_ip ON security_audit_log(ip_address);

-- ============================================
-- TABLA: login_attempts
-- ============================================
CREATE TABLE IF NOT EXISTS login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Email intentado
  email VARCHAR(255) NOT NULL,

  -- Éxito o fallo
  success BOOLEAN DEFAULT FALSE,

  -- Información
  ip_address INET,
  user_agent TEXT,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_login_attempts_email ON login_attempts(email);
CREATE INDEX idx_login_attempts_ip ON login_attempts(ip_address);
CREATE INDEX idx_login_attempts_created_at ON login_attempts(created_at DESC);

-- ============================================
-- TABLA: admin_whitelist (lista blanca de admins)
-- ============================================
CREATE TABLE IF NOT EXISTS admin_whitelist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Email autorizado
  email VARCHAR(255) NOT NULL UNIQUE,

  -- Rol permitido
  allowed_role VARCHAR(50) NOT NULL CHECK (allowed_role IN ('admin', 'super_admin', 'editor')),

  -- Quién lo agregó
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Estado
  is_active BOOLEAN DEFAULT TRUE,

  -- Notas
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  used_at TIMESTAMPTZ
);

CREATE INDEX idx_whitelist_email ON admin_whitelist(email) WHERE is_active = TRUE;

-- ============================================
-- MODIFICAR TABLA USERS
-- ============================================

-- Agregar campos de seguridad a users
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_ip INET;
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS require_password_change BOOLEAN DEFAULT FALSE;

-- Índices adicionales
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);
CREATE INDEX IF NOT EXISTS idx_users_account_locked ON users(account_locked_until) WHERE account_locked_until IS NOT NULL;

-- ============================================
-- FUNCIÓN: Generar token seguro
-- ============================================
CREATE OR REPLACE FUNCTION generate_secure_token()
RETURNS VARCHAR AS $$
DECLARE
  token VARCHAR;
BEGIN
  -- Generar token de 32 bytes (64 caracteres hex)
  token := encode(gen_random_bytes(32), 'hex');
  RETURN token;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCIÓN: Crear token de password reset
-- ============================================
CREATE OR REPLACE FUNCTION create_password_reset_token(
  p_email VARCHAR,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS TABLE (
  token VARCHAR,
  expires_at TIMESTAMPTZ
) AS $$
DECLARE
  v_user_id UUID;
  v_token VARCHAR;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Buscar usuario
  SELECT id INTO v_user_id
  FROM users
  WHERE email = p_email
    AND is_active = TRUE;

  IF v_user_id IS NULL THEN
    -- No revelar si el email existe o no (seguridad)
    RETURN;
  END IF;

  -- Generar token
  v_token := generate_secure_token();
  v_expires_at := NOW() + INTERVAL '1 hour';

  -- Invalidar tokens anteriores del mismo usuario
  UPDATE password_reset_tokens
  SET used_at = NOW()
  WHERE user_id = v_user_id
    AND used_at IS NULL;

  -- Crear nuevo token
  INSERT INTO password_reset_tokens (
    user_id,
    email,
    token,
    expires_at,
    ip_address,
    user_agent
  ) VALUES (
    v_user_id,
    p_email,
    v_token,
    v_expires_at,
    p_ip_address,
    p_user_agent
  );

  -- Registrar en audit log
  INSERT INTO security_audit_log (
    user_id,
    email,
    event_type,
    ip_address,
    user_agent,
    severity
  ) VALUES (
    v_user_id,
    p_email,
    'password_reset_requested',
    p_ip_address,
    p_user_agent,
    'warning'
  );

  RETURN QUERY SELECT v_token, v_expires_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCIÓN: Validar y usar token de reset
-- ============================================
CREATE OR REPLACE FUNCTION validate_password_reset_token(
  p_token VARCHAR
)
RETURNS TABLE (
  valid BOOLEAN,
  user_id UUID,
  email VARCHAR
) AS $$
DECLARE
  v_token_data RECORD;
BEGIN
  -- Buscar token
  SELECT * INTO v_token_data
  FROM password_reset_tokens
  WHERE token = p_token
    AND used_at IS NULL
    AND expires_at > NOW();

  IF v_token_data IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::VARCHAR;
    RETURN;
  END IF;

  -- Token válido
  RETURN QUERY SELECT TRUE, v_token_data.user_id, v_token_data.email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCIÓN: Marcar token como usado
-- ============================================
CREATE OR REPLACE FUNCTION mark_reset_token_used(
  p_token VARCHAR,
  p_ip_address INET DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_email VARCHAR;
BEGIN
  UPDATE password_reset_tokens
  SET used_at = NOW()
  WHERE token = p_token
    AND used_at IS NULL
  RETURNING user_id, email INTO v_user_id, v_email;

  IF v_user_id IS NOT NULL THEN
    -- Actualizar timestamp de cambio de contraseña
    UPDATE users
    SET password_changed_at = NOW()
    WHERE id = v_user_id;

    -- Registrar en audit log
    INSERT INTO security_audit_log (
      user_id,
      email,
      event_type,
      ip_address,
      severity
    ) VALUES (
      v_user_id,
      v_email,
      'password_reset_completed',
      p_ip_address,
      'warning'
    );

    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCIÓN: Registrar intento de login
-- ============================================
CREATE OR REPLACE FUNCTION log_login_attempt(
  p_email VARCHAR,
  p_success BOOLEAN,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
  v_failed_attempts INTEGER;
BEGIN
  -- Registrar intento
  INSERT INTO login_attempts (
    email,
    success,
    ip_address,
    user_agent
  ) VALUES (
    p_email,
    p_success,
    p_ip_address,
    p_user_agent
  );

  -- Buscar usuario
  SELECT id INTO v_user_id
  FROM users
  WHERE email = p_email;

  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  IF p_success THEN
    -- Login exitoso: resetear contador y actualizar last_login
    UPDATE users
    SET
      failed_login_attempts = 0,
      last_login_at = NOW(),
      last_login_ip = p_ip_address,
      account_locked_until = NULL
    WHERE id = v_user_id;

    -- Audit log
    INSERT INTO security_audit_log (
      user_id,
      email,
      event_type,
      ip_address,
      user_agent,
      severity
    ) VALUES (
      v_user_id,
      p_email,
      'login_success',
      p_ip_address,
      p_user_agent,
      'info'
    );
  ELSE
    -- Login fallido: incrementar contador
    UPDATE users
    SET failed_login_attempts = failed_login_attempts + 1
    WHERE id = v_user_id
    RETURNING failed_login_attempts INTO v_failed_attempts;

    -- Bloquear cuenta después de 5 intentos fallidos
    IF v_failed_attempts >= 5 THEN
      UPDATE users
      SET account_locked_until = NOW() + INTERVAL '30 minutes'
      WHERE id = v_user_id;

      -- Audit log crítico
      INSERT INTO security_audit_log (
        user_id,
        email,
        event_type,
        ip_address,
        user_agent,
        severity,
        details
      ) VALUES (
        v_user_id,
        p_email,
        'account_locked',
        p_ip_address,
        p_user_agent,
        'critical',
        jsonb_build_object('reason', 'multiple_failed_attempts', 'attempts', v_failed_attempts)
      );
    ELSE
      -- Audit log warning
      INSERT INTO security_audit_log (
        user_id,
        email,
        event_type,
        ip_address,
        user_agent,
        severity,
        details
      ) VALUES (
        v_user_id,
        p_email,
        'login_failed',
        p_ip_address,
        p_user_agent,
        'warning',
        jsonb_build_object('attempts', v_failed_attempts)
      );
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCIÓN: Verificar si usuario está bloqueado
-- ============================================
CREATE OR REPLACE FUNCTION is_account_locked(p_email VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  v_locked_until TIMESTAMPTZ;
BEGIN
  SELECT account_locked_until INTO v_locked_until
  FROM users
  WHERE email = p_email;

  IF v_locked_until IS NOT NULL AND v_locked_until > NOW() THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCIÓN: Determinar rol inicial de usuario
-- ============================================
CREATE OR REPLACE FUNCTION determine_initial_role(p_email VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
  v_super_admin_count INTEGER;
  v_whitelist_role VARCHAR;
BEGIN
  -- Verificar si está en whitelist
  SELECT allowed_role INTO v_whitelist_role
  FROM admin_whitelist
  WHERE email = p_email
    AND is_active = TRUE;

  IF v_whitelist_role IS NOT NULL THEN
    RETURN v_whitelist_role;
  END IF;

  -- Si no hay super_admin, el primero lo será
  SELECT COUNT(*) INTO v_super_admin_count
  FROM users
  WHERE role = 'super_admin';

  IF v_super_admin_count = 0 THEN
    RETURN 'super_admin';
  END IF;

  -- Por defecto, customer
  RETURN 'customer';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS en nuevas tablas
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE two_factor_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_whitelist ENABLE ROW LEVEL SECURITY;

-- Políticas: Solo service role y admins

CREATE POLICY "Service role full access password_reset"
  ON password_reset_tokens FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role full access email_verification"
  ON email_verification_tokens FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Users can view their own 2FA"
  ON two_factor_auth FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role full access 2FA"
  ON two_factor_auth FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Admins can view audit log"
  ON security_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Service role full access audit"
  ON security_audit_log FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Admins can view login attempts"
  ON login_attempts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage whitelist"
  ON admin_whitelist FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'super_admin'
    )
  );

-- ============================================
-- COMENTARIOS
-- ============================================

COMMENT ON TABLE password_reset_tokens IS 'Tokens para recuperación de contraseña';
COMMENT ON TABLE email_verification_tokens IS 'Tokens para verificación de email';
COMMENT ON TABLE two_factor_auth IS 'Configuración de autenticación de dos factores para admins';
COMMENT ON TABLE security_audit_log IS 'Registro de auditoría de eventos de seguridad';
COMMENT ON TABLE login_attempts IS 'Registro de todos los intentos de login';
COMMENT ON TABLE admin_whitelist IS 'Lista blanca de emails autorizados como admin';

COMMENT ON FUNCTION create_password_reset_token IS 'Crea token de reset y registra en audit log';
COMMENT ON FUNCTION log_login_attempt IS 'Registra intento de login y bloquea cuenta si hay muchos fallos';
COMMENT ON FUNCTION determine_initial_role IS 'Determina rol inicial basado en whitelist y si es primer usuario';
