import { useEffect, useState } from "react";
import { Pagination, paginateItems } from "@/components/Pagination";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Clock, PlayCircle, Loader2, Trophy, Search, BookOpen, KeyRound, Users, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  time_limit: number;
  category: string | null;
  join_code: string | null;
  created_at: string;
}

interface Attempt {
  id: string;
  quiz_id: string;
  score: number;
  submitted_at: string;
}

const Dashboard = () => {
  const { profile, user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [quizPage, setQuizPage] = useState(1);
  const [attemptPage, setAttemptPage] = useState(1);
  const PAGE_SIZE = 6;

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isAdmin) {
          // Admin sees their own quizzes
          const { data, error } = await supabase
            .from("quizzes")
            .select("*")
            .eq("created_by", user!.id)
            .order("created_at", { ascending: false });
          if (error) throw error;
          setQuizzes(data);
        } else {
          // Student sees quizzes they've attempted
          const { data: attemptData, error: attemptErr } = await supabase
            .from("attempts")
            .select("*")
            .eq("user_id", user!.id)
            .order("submitted_at", { ascending: false });
          if (attemptErr) throw attemptErr;
          setAttempts(attemptData);

          const quizIds = [...new Set(attemptData.map((a) => a.quiz_id))];
          if (quizIds.length > 0) {
            const { data: quizData, error: quizErr } = await supabase
              .from("quizzes")
              .select("*")
              .in("id", quizIds);
            if (quizErr) throw quizErr;
            setQuizzes(quizData);
          }
        }
      } catch {
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchData();
  }, [user, isAdmin]);

  const handleJoinQuiz = async () => {
    if (!joinCode.trim()) {
      toast.error("Please enter a quiz code");
      return;
    }
    setJoining(true);
    try {
      const { data, error } = await supabase
        .from("quizzes")
        .select("id")
        .eq("join_code", joinCode.trim().toUpperCase())
        .single();

      if (error || !data) {
        toast.error("Invalid quiz code. Please check and try again.");
        return;
      }

      navigate(`/quiz/${data.id}`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setJoining(false);
    }
  };

  const getAttemptForQuiz = (quizId: string) =>
    attempts.find((a) => a.quiz_id === quizId);

  const handleDeleteQuiz = async (quizId: string) => {
    try {
      // Delete questions first, then the quiz
      await supabase.from("questions").delete().eq("quiz_id", quizId);
      const { error } = await supabase.from("quizzes").delete().eq("id", quizId);
      if (error) throw error;
      setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
      toast.success("Quiz deleted successfully");
    } catch {
      toast.error("Failed to delete quiz");
    }
  };
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
            <p className="text-sm text-muted-foreground">
              {profile?.email} · <Badge variant="secondary">{isAdmin ? "Admin" : "Student"}</Badge>
            </p>
          </div>
        </div>

        {/* Student: Join Quiz by Code */}
        {!isAdmin && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="font-heading flex items-center gap-2">
                <KeyRound className="h-5 w-5" />
                Join a Quiz
              </CardTitle>
              <CardDescription>Enter the unique code shared by your teacher</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Input
                  placeholder="Enter quiz code (e.g. ABC123)"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleJoinQuiz()}
                  className="font-mono text-lg tracking-widest uppercase"
                  maxLength={8}
                />
                <Button onClick={handleJoinQuiz} disabled={joining} className="gap-2 shrink-0">
                  {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
                  Join
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Admin: My Quizzes */}
        {isAdmin && (
          <>
            <div className="mb-6 flex items-center justify-between">
              <h3 className="font-heading text-2xl font-bold text-foreground">My Quizzes</h3>
              <Button asChild>
                <Link to="/admin">+ Create Quiz</Link>
              </Button>
            </div>

          {quizzes.length === 0 ? (
              <div className="rounded-xl border bg-card p-12 text-center">
                <p className="text-muted-foreground">
                  You haven't created any quizzes yet.
                </p>
                <Button asChild className="mt-4">
                  <Link to="/admin">Create your first quiz</Link>
                </Button>
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {paginateItems(quizzes, quizPage, PAGE_SIZE).map((quiz) => (
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
                      <CardContent className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{quiz.time_limit} minutes</span>
                        </div>
                        {quiz.join_code && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Code:</span>
                            <Badge variant="outline" className="font-mono tracking-widest">
                              {quiz.join_code}
                            </Badge>
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="flex gap-2">
                        <Button variant="outline" size="sm" asChild className="flex-1 gap-1">
                          <Link to={`/admin/quiz/${quiz.id}`}>
                            <Users className="h-4 w-4" /> Results
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild className="gap-1">
                          <Link to={`/admin/edit/${quiz.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-1 text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete "{quiz.title}"?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the quiz and all its questions. Student attempts will remain but won't be linked to this quiz. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteQuiz(quiz.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
                <Pagination
                  currentPage={quizPage}
                  totalPages={Math.ceil(quizzes.length / PAGE_SIZE)}
                  onPageChange={setQuizPage}
                />
              </>
            )}
          </>
        )}

        {/* Student: Previous Attempts */}
        {!isAdmin && attempts.length > 0 && (
          <div className="mt-4">
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

        {!isAdmin && attempts.length === 0 && (
          <div className="rounded-xl border bg-card p-12 text-center">
            <p className="text-muted-foreground">
              No quiz attempts yet. Enter a quiz code above to get started!
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
