
CREATE POLICY "Quiz creators can view attempts on their quizzes"
ON public.attempts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.quizzes
    WHERE quizzes.id = attempts.quiz_id
    AND quizzes.created_by = auth.uid()
  )
);
