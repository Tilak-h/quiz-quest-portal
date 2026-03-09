
-- Add join_code to quizzes
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS join_code TEXT UNIQUE;

-- Allow authenticated users to insert their own role (one-time)
CREATE POLICY "Users can insert own role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
