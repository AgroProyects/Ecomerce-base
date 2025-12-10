-- Migration: Sync Auth Users with Customers Table
-- Description: Automatically creates customer record when user signs up

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into customers table when a new user is created in auth.users
  INSERT INTO public.customers (id, email, name, email_verified, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', NULL),
    NEW.email_confirmed_at IS NOT NULL,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, customers.name),
    email_verified = NEW.email_confirmed_at IS NOT NULL,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to avoid duplicates
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Sync existing auth users to customers table (one-time)
INSERT INTO public.customers (id, email, name, email_verified, created_at, updated_at)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'name', raw_user_meta_data->>'full_name', NULL),
  email_confirmed_at IS NOT NULL,
  created_at,
  updated_at
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = COALESCE(EXCLUDED.name, customers.name),
  email_verified = EXCLUDED.email_verified,
  updated_at = NOW();

-- Comment
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically syncs auth.users with public.customers table';
