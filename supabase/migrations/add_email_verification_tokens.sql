-- Tabla para tokens de verificación de email
CREATE TABLE IF NOT EXISTS public.email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON public.email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON public.email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_expires_at ON public.email_verification_tokens(expires_at);

-- Función para limpiar tokens expirados (ejecutar periódicamente)
CREATE OR REPLACE FUNCTION clean_expired_verification_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM public.email_verification_tokens
  WHERE expires_at < NOW() AND verified_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_email_verification_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_email_verification_tokens_updated_at
  BEFORE UPDATE ON public.email_verification_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_email_verification_tokens_updated_at();

-- Políticas RLS (Row Level Security)
ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;

-- Los usuarios solo pueden ver sus propios tokens
CREATE POLICY "Users can view own tokens"
  ON public.email_verification_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

-- Solo el sistema puede insertar tokens (via service role)
CREATE POLICY "Service role can insert tokens"
  ON public.email_verification_tokens
  FOR INSERT
  WITH CHECK (true);

-- Solo el sistema puede actualizar tokens (via service role)
CREATE POLICY "Service role can update tokens"
  ON public.email_verification_tokens
  FOR UPDATE
  USING (true);

-- Comentarios
COMMENT ON TABLE public.email_verification_tokens IS 'Tokens de verificación de email para nuevos usuarios';
COMMENT ON COLUMN public.email_verification_tokens.token IS 'Token único para verificar el email';
COMMENT ON COLUMN public.email_verification_tokens.expires_at IS 'Fecha de expiración del token (24 horas después de creación)';
COMMENT ON COLUMN public.email_verification_tokens.verified_at IS 'Fecha en que se verificó el token (NULL si no verificado)';
