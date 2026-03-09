-- Recreate view with security_invoker to fix security definer warning
DROP VIEW IF EXISTS public.leaderboard;
CREATE VIEW public.leaderboard WITH (security_invoker=on) AS
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