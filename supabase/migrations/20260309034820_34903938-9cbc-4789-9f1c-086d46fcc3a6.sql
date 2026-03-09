
-- Allow quiz creators to delete their questions
CREATE POLICY "Quiz creators can delete questions"
ON public.questions
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.quizzes
    WHERE quizzes.id = questions.quiz_id
    AND quizzes.created_by = auth.uid()
  )
);

-- Allow quiz creators to update their questions
CREATE POLICY "Quiz creators can update questions"
ON public.questions
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.quizzes
    WHERE quizzes.id = questions.quiz_id
    AND quizzes.created_by = auth.uid()
  )
);
