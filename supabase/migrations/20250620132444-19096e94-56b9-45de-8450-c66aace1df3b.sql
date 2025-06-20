
-- Update the existing user to be confirmed and set correct metadata
UPDATE auth.users 
SET 
  email_confirmed_at = NOW(),
  raw_user_meta_data = '{"username": "Test User"}'::jsonb
WHERE email = 'dietestmail@gmail.com';

-- Insert or update the profile for this user
INSERT INTO public.profiles (id, username, created_at, updated_at)
SELECT 
  id,
  'Test User',
  NOW(),
  NOW()
FROM auth.users 
WHERE email = 'dietestmail@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  username = 'Test User',
  updated_at = NOW();
