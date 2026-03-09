-- Add category column to quizzes
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS category text DEFAULT 'General';

-- Create leaderboard view: top scores per quiz (best attempt per user)
CREATE OR REPLACE VIEW public.leaderboard AS
SELECT DISTINCT ON (a.quiz_id, a.user_id)
  a.quiz_id,
  a.user_id,
  a.score,
  a.submitted_at,
  p.name AS user_name,
  p.photo_url AS user_photo,
  q.title AS quiz_title,
  q.category AS quiz_category
FROM public.attempts a
JOIN public.profiles p ON p.user_id = a.user_id
JOIN public.quizzes q ON q.id = a.quiz_id
ORDER BY a.quiz_id, a.user_id, a.score DESC, a.submitted_at ASC;
