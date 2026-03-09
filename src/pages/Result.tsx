import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, ArrowLeft, Trophy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Question {
  id: string;
  question_text: string;
  options: string[];
  correct_answer_index: number;
}

const ResultPage = () => {
  const { id } = useParams<{ id: string }>();
  const [attempt, setAttempt] = useState<{
    score: number;
    answers: number[];
    quiz_id: string;
  } | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizTitle, setQuizTitle] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const { data: attemptData, error: attemptErr } = await supabase
          .from("attempts")
          .select("score, answers, quiz_id")
          .eq("id", id!)
          .single();

        if (attemptErr) throw attemptErr;
        setAttempt(attemptData);

        const [quizRes, questionsRes] = await Promise.all([
          supabase.from("quizzes").select("title").eq("id", attemptData.quiz_id).single(),
          supabase.from("questions").select("*").eq("quiz_id", attemptData.quiz_id),
        ]);

        if (quizRes.error) throw quizRes.error;
        if (questionsRes.error) throw questionsRes.error;

        setQuizTitle(quizRes.data.title);
        setQuestions(questionsRes.data);
      } catch {
        toast.error("Failed to load results");
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [id]);

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

  if (!attempt) return null;

  const correctCount = questions.filter(
    (q, i) => attempt.answers[i] === q.correct_answer_index
  ).length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8">
        {/* Score Card */}
        <div className="mb-8 rounded-xl border bg-card p-8 text-center shadow-sm">
          <Trophy className="mx-auto mb-3 h-12 w-12 text-primary" />
          <h1 className="font-heading text-3xl font-bold text-foreground">{quizTitle}</h1>
          <p className="mt-2 text-muted-foreground">Quiz Completed!</p>
          <div className="mt-4 font-heading text-5xl font-bold text-primary">
            {attempt.score}%
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {correctCount} of {questions.length} correct
          </p>
        </div>

        {/* Review */}
        <h2 className="mb-4 font-heading text-xl font-bold text-foreground">Answer Review</h2>
        <div className="space-y-4">
          {questions.map((q, i) => {
            const userAnswer = attempt.answers[i];
            const isCorrect = userAnswer === q.correct_answer_index;

            return (
              <Card key={q.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-2">
                    {isCorrect ? (
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                    ) : (
                      <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                    )}
                    <CardTitle className="text-base leading-relaxed">
                      {q.question_text}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {q.options.map((option, oi) => (
                    <div
                      key={oi}
                      className={cn(
                        "rounded-lg px-4 py-2 text-sm",
                        oi === q.correct_answer_index
                          ? "bg-success/10 text-success font-medium"
                          : oi === userAnswer && !isCorrect
                          ? "bg-destructive/10 text-destructive"
                          : "text-muted-foreground"
                      )}
                    >
                      <span className="mr-2 font-medium">
                        {String.fromCharCode(65 + oi)}.
                      </span>
                      {option}
                      {oi === q.correct_answer_index && " ✓"}
                      {oi === userAnswer && !isCorrect && " (your answer)"}
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8">
          <Button asChild variant="outline" className="gap-2">
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
};

export default ResultPage;
