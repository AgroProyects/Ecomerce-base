-- Migration: Email Verification System (Complete)
-- Description: Creates customers table and adds email verification tracking

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create customers table if it doesn't exist
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  phone TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  -- Email verification fields
  email_verified BOOLEAN DEFAULT false,
  email_verified_at TIMESTAMP,
  verification_token TEXT,
  verification_token_expires_at TIMESTAMP
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_email_verified ON customers(email_verified);
CREATE INDEX IF NOT EXISTS idx_customers_verification_token ON customers(verification_token);

-- Enable RLS on customers table
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- RLS policies for customers
CREATE POLICY "Users can view their own customer data"
  ON customers
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own customer data"
  ON customers
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Anyone can insert customer data"
  ON customers
  FOR INSERT
  WITH CHECK (true);

-- Function to check if user email is verified
CREATE OR REPLACE FUNCTION is_user_email_verified(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM customers
    WHERE id = user_id AND email_verified = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark email as verified
CREATE OR REPLACE FUNCTION verify_user_email(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE customers
  SET
    email_verified = true,
    email_verified_at = NOW(),
    verification_token = NULL,
    verification_token_expires_at = NULL
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_user_email_verified(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_user_email(UUID) TO authenticated;

-- Create table for email verification attempts
CREATE TABLE IF NOT EXISTS email_verification_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  sent_at TIMESTAMP DEFAULT NOW(),
  verified_at TIMESTAMP,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_verification_attempts_customer ON email_verification_attempts(customer_id);
CREATE INDEX IF NOT EXISTS idx_verification_attempts_email ON email_verification_attempts(email);

-- Enable RLS on verification attempts
ALTER TABLE email_verification_attempts ENABLE ROW LEVEL SECURITY;

-- RLS policies for verification attempts
CREATE POLICY "Users can view their own verification attempts"
  ON email_verification_attempts
  FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "System can insert verification attempts"
  ON email_verification_attempts
  FOR INSERT
  WITH CHECK (true);

-- Grant permissions
GRANT SELECT, INSERT ON email_verification_attempts TO authenticated;
GRANT SELECT, INSERT, UPDATE ON customers TO authenticated;

-- Comments
COMMENT ON TABLE customers IS 'Stores customer information including email verification status';
COMMENT ON TABLE email_verification_attempts IS 'Tracks email verification attempts for audit and security';
COMMENT ON COLUMN customers.email_verified IS 'Whether the user has verified their email address';
COMMENT ON COLUMN customers.email_verified_at IS 'When the email was verified';

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
