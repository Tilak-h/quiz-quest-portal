
-- 1. Drop the permissive INSERT policy that allows privilege escalation
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;

-- 2. Create a security definer function to safely assign only 'user' role
CREATE OR REPLACE FUNCTION public.assign_user_role(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- 3. Create a separate admin-only function to promote users
CREATE OR REPLACE FUNCTION public.assign_admin_role(_target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can assign admin role';
  END IF;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_target_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;
