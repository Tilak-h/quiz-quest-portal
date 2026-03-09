import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Users, Trophy, Target, Eye } from "lucide-react";
import { Navigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface AttemptWithProfile {
  id: string;
  user_id: string;
  score: number;
  answers: number[];
  submitted_at: string;
  profile?: {
    name: string | null;
    email: string | null;
    photo_url: string | null;
  };
}

interface QuizInfo {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  join_code: string | null;
  time_limit: number;
}

interface Question {
  id: string;
  question_text: string;
  options: string[];
  correct_answer_index: number;
}

const AdminQuizResults = () => {
  const { id } = useParams<{ id: string }>();
  const { isAdmin, loading: authLoading } = useAuth();
  const [quiz, setQuiz] = useState<QuizInfo | null>(null);
  const [attempts, setAttempts] = useState<AttemptWithProfile[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAttempt, setSelectedAttempt] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [quizRes, attemptsRes, questionsRes] = await Promise.all([
          supabase.from("quizzes").select("*").eq("id", id!).single(),
          supabase.from("attempts").select("*").eq("quiz_id", id!).order("score", { ascending: false }),
          supabase.from("questions").select("*").eq("quiz_id", id!),
        ]);

        if (quizRes.error) throw quizRes.error;
        setQuiz(quizRes.data);
        setQuestions(questionsRes.data ?? []);

        // Fetch profiles for each attempt
        const attData = attemptsRes.data ?? [];
        const userIds = [...new Set(attData.map((a) => a.user_id))];
        
        let profileMap: Record<string, { name: string | null; email: string | null; photo_url: string | null }> = {};
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, name, email, photo_url")
            .in("user_id", userIds);
          
          profiles?.forEach((p) => {
            profileMap[p.user_id] = { name: p.name, email: p.email, photo_url: p.photo_url };
          });
        }

        setAttempts(
          attData.map((a) => ({
            ...a,
            profile: profileMap[a.user_id],
          }))
        );
      } catch {
        // error handled
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (authLoading) return null;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!quiz) return <Navigate to="/dashboard" replace />;

  const avgScore = attempts.length
    ? Math.round(attempts.reduce((s, a) => s + a.score, 0) / attempts.length)
    : 0;
  const bestScore = attempts.length ? Math.max(...attempts.map((a) => a.score)) : 0;

  const selectedAttemptData = attempts.find((a) => a.id === selectedAttempt);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Button variant="ghost" size="sm" asChild className="mb-4 gap-1">
          <Link to="/dashboard"><ArrowLeft className="h-4 w-4" /> Back to Dashboard</Link>
        </Button>

        {/* Quiz Header */}
        <div className="mb-8 rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-heading text-2xl font-bold text-foreground">{quiz.title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{quiz.description ?? "No description"}</p>
              <div className="mt-3 flex items-center gap-3">
                <Badge variant="secondary">{quiz.category}</Badge>
                {quiz.join_code && (
                  <Badge variant="outline" className="font-mono tracking-widest">
                    {quiz.join_code}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6 text-center">
              <Users className="mx-auto mb-2 h-8 w-8 text-primary" />
              <p className="font-heading text-3xl font-bold text-foreground">{attempts.length}</p>
              <p className="text-sm text-muted-foreground">Students Attempted</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Target className="mx-auto mb-2 h-8 w-8 text-primary" />
              <p className="font-heading text-3xl font-bold text-foreground">{avgScore}%</p>
              <p className="text-sm text-muted-foreground">Average Score</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Trophy className="mx-auto mb-2 h-8 w-8 text-primary" />
              <p className="font-heading text-3xl font-bold text-foreground">{bestScore}%</p>
              <p className="text-sm text-muted-foreground">Best Score</p>
            </CardContent>
          </Card>
        </div>

        {/* Student Results List */}
        <h2 className="mb-4 font-heading text-xl font-bold text-foreground">Student Results</h2>
        {attempts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No students have taken this quiz yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {attempts.map((attempt, index) => (
              <div key={attempt.id}>
                <div
                  className={cn(
                    "flex items-center gap-4 rounded-xl border bg-card px-4 py-3 cursor-pointer transition-colors hover:bg-accent/50",
                    selectedAttempt === attempt.id && "border-primary ring-1 ring-primary"
                  )}
                  onClick={() => setSelectedAttempt(selectedAttempt === attempt.id ? null : attempt.id)}
                >
                  <span className="flex h-8 w-8 items-center justify-center text-sm font-bold text-muted-foreground">
                    #{index + 1}
                  </span>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={attempt.profile?.photo_url ?? ""} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {attempt.profile?.name?.charAt(0)?.toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{attempt.profile?.name ?? "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">
                      {attempt.profile?.email} · {new Date(attempt.submitted_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "font-heading text-xl font-bold",
                      attempt.score >= 70 ? "text-primary" : attempt.score >= 40 ? "text-yellow-500" : "text-destructive"
                    )}>
                      {attempt.score}%
                    </span>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                {/* Expanded answer review */}
                {selectedAttempt === attempt.id && selectedAttemptData && (
                  <div className="mt-2 ml-12 space-y-3 pb-2">
                    {questions.map((q, qi) => {
                      const userAnswer = selectedAttemptData.answers[qi];
                      const isCorrect = userAnswer === q.correct_answer_index;
                      return (
                        <div key={q.id} className="rounded-lg border bg-card p-4">
                          <div className="flex items-start gap-2 mb-2">
                            <span className={cn(
                              "mt-0.5 text-sm font-bold",
                              isCorrect ? "text-primary" : "text-destructive"
                            )}>
                              {isCorrect ? "✓" : "✗"}
                            </span>
                            <p className="text-sm font-medium text-foreground">{q.question_text}</p>
                          </div>
                          <div className="ml-5 space-y-1">
                            {q.options.map((opt, oi) => (
                              <p key={oi} className={cn(
                                "text-xs",
                                oi === q.correct_answer_index ? "text-primary font-medium" : 
                                oi === userAnswer && !isCorrect ? "text-destructive" : "text-muted-foreground"
                              )}>
                                {String.fromCharCode(65 + oi)}. {opt}
                                {oi === q.correct_answer_index && " ✓"}
                                {oi === userAnswer && !isCorrect && " (student's answer)"}
                              </p>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminQuizResults;
