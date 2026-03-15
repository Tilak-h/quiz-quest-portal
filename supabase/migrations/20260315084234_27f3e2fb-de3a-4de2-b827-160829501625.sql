
-- =============================================
-- FIX 1: PROFILES - Restrict email visibility
-- =============================================
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Quiz creators can view profiles of users who attempted their quizzes
CREATE POLICY "Quiz creators can view student profiles"
ON public.profiles FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.attempts a
    JOIN public.quizzes q ON q.id = a.quiz_id
    WHERE a.user_id = profiles.user_id
      AND q.created_by = auth.uid()
  )
);

-- =============================================
-- FIX 2: QUESTIONS - Hide correct_answer_index
-- =============================================
DROP POLICY IF EXISTS "Anyone authenticated can view questions" ON public.questions;

-- Quiz creators can view full questions (including answers)
CREATE POLICY "Quiz creators can view own questions"
ON public.questions FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.quizzes
    WHERE quizzes.id = questions.quiz_id
      AND quizzes.created_by = auth.uid()
  )
);

-- Users who have submitted an attempt can view full questions (for result review)
CREATE POLICY "Users with attempts can view questions"
ON public.questions FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.attempts
    WHERE attempts.quiz_id = questions.quiz_id
      AND attempts.user_id = auth.uid()
  )
);

-- =============================================
-- RPC: Get quiz questions WITHOUT correct answers (for active quiz taking)
-- =============================================
CREATE OR REPLACE FUNCTION public.get_quiz_questions_safe(_quiz_id uuid)
RETURNS TABLE(id uuid, quiz_id uuid, question_text text, options text[], created_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT q.id, q.quiz_id, q.question_text, q.options, q.created_at
  FROM public.questions q
  WHERE q.quiz_id = _quiz_id;
$$;

-- =============================================
-- RPC: Get quiz questions WITH correct answers (for practice mode)
-- =============================================
CREATE OR REPLACE FUNCTION public.get_quiz_questions_full(_quiz_id uuid)
RETURNS TABLE(id uuid, quiz_id uuid, question_text text, options text[], correct_answer_index int, created_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT q.id, q.quiz_id, q.question_text, q.options, q.correct_answer_index, q.created_at
  FROM public.questions q
  WHERE q.quiz_id = _quiz_id;
$$;
