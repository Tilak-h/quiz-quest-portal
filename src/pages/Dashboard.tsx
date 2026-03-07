import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, PlayCircle, Loader2, Trophy } from "lucide-react";
import { toast } from "sonner";

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  time_limit: number;
  created_at: string;
}

interface Attempt {
  id: string;
  quiz_id: string;
  score: number;
  submitted_at: string;
}

const Dashboard = () => {
  const { profile, user } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [quizRes, attemptRes] = await Promise.all([
          supabase.from("quizzes").select("*").order("created_at", { ascending: false }),
          supabase.from("attempts").select("*").eq("user_id", user!.id).order("submitted_at", { ascending: false }),
        ]);

        if (quizRes.error) throw quizRes.error;
        if (attemptRes.error) throw attemptRes.error;

        setQuizzes(quizRes.data);
        setAttempts(attemptRes.data);
      } catch {
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchData();
  }, [user]);

  const getAttemptForQuiz = (quizId: string) =>
    attempts.find((a) => a.quiz_id === quizId);

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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* Profile Section */}
        <div className="mb-10 flex items-center gap-4 rounded-xl border bg-card p-6 shadow-sm">
          <Avatar className="h-14 w-14">
            <AvatarImage src={profile?.photo_url ?? ""} />
            <AvatarFallback className="bg-primary text-primary-foreground text-lg">
              {profile?.name?.charAt(0)?.toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-heading text-xl font-semibold text-foreground">
              {profile?.name ?? "User"}
            </h2>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
          </div>
        </div>

        {/* Quizzes */}
        <h3 className="mb-6 font-heading text-2xl font-bold text-foreground">
          Available Quizzes
        </h3>

        {quizzes.length === 0 ? (
          <div className="rounded-xl border bg-card p-12 text-center">
            <p className="text-muted-foreground">No quizzes available yet.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quizzes.map((quiz) => {
              const attempt = getAttemptForQuiz(quiz.id);
              return (
                <Card key={quiz.id} className="flex flex-col">
                  <CardHeader>
                    <CardTitle className="font-heading text-lg">{quiz.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {quiz.description ?? "No description"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{quiz.time_limit} minutes</span>
                    </div>
                    {attempt && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-success">
                        <Trophy className="h-4 w-4" />
                        <span>Score: {attempt.score}%</span>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button asChild className="w-full gap-2">
                      <Link to={`/quiz/${quiz.id}`}>
                        <PlayCircle className="h-4 w-4" />
                        {attempt ? "Retake Quiz" : "Start Quiz"}
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}

        {/* Previous Attempts */}
        {attempts.length > 0 && (
          <div className="mt-12">
            <h3 className="mb-4 font-heading text-2xl font-bold text-foreground">
              Your Attempts
            </h3>
            <div className="space-y-3">
              {attempts.map((attempt) => {
                const quiz = quizzes.find((q) => q.id === attempt.quiz_id);
                return (
                  <div
                    key={attempt.id}
                    className="flex items-center justify-between rounded-lg border bg-card px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {quiz?.title ?? "Unknown Quiz"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(attempt.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-heading text-lg font-semibold text-primary">
                        {attempt.score}%
                      </span>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/result/${attempt.id}`}>Review</Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
