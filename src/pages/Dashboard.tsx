import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Clock, PlayCircle, Loader2, Trophy, Search, BookOpen } from "lucide-react";
import { toast } from "sonner";

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  time_limit: number;
  category: string | null;
  created_at: string;
}

interface Attempt {
  id: string;
  quiz_id: string;
  score: number;
  submitted_at: string;
}

const CATEGORIES = ["All", "General", "Science", "Math", "History", "Technology", "Language", "Art"];

const Dashboard = () => {
  const { profile, user } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

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

  const filteredQuizzes = quizzes.filter((quiz) => {
    const matchesSearch =
      quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (quiz.description ?? "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || (quiz.category ?? "General") === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = CATEGORIES.filter(
    (cat) => cat === "All" || quizzes.some((q) => (q.category ?? "General") === cat)
  );

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

        {/* Search & Filter */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search quizzes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className="rounded-full"
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {/* Quizzes */}
        <h3 className="mb-6 font-heading text-2xl font-bold text-foreground">
          Available Quizzes
        </h3>

        {filteredQuizzes.length === 0 ? (
          <div className="rounded-xl border bg-card p-12 text-center">
            <p className="text-muted-foreground">
              {quizzes.length === 0 ? "No quizzes available yet." : "No quizzes match your search."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredQuizzes.map((quiz) => {
              const attempt = getAttemptForQuiz(quiz.id);
              return (
                <Card key={quiz.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="font-heading text-lg">{quiz.title}</CardTitle>
                      <Badge variant="secondary" className="shrink-0 text-xs">
                        {quiz.category ?? "General"}
                      </Badge>
                    </div>
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
                      <div className="mt-2 flex items-center gap-2 text-sm text-primary">
                        <Trophy className="h-4 w-4" />
                        <span>Score: {attempt.score}%</span>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="gap-2">
                    <Button asChild className="flex-1 gap-2">
                      <Link to={`/quiz/${quiz.id}`}>
                        <PlayCircle className="h-4 w-4" />
                        {attempt ? "Retake" : "Start"}
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="gap-2">
                      <Link to={`/practice/${quiz.id}`}>
                        <BookOpen className="h-4 w-4" />
                        Practice
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
