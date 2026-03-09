import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { QuizHintButton } from "@/components/QuizHintButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ChevronLeft, ChevronRight, Clock, Send } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Question {
  id: string;
  question_text: string;
  options: string[];
  correct_answer_index: number;
}

interface QuizData {
  id: string;
  title: string;
  time_limit: number;
}

const QuizPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const submittedRef = useRef(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const [quizRes, questionsRes] = await Promise.all([
          supabase.from("quizzes").select("id, title, time_limit").eq("id", id!).single(),
          supabase.from("questions").select("*").eq("quiz_id", id!),
        ]);

        if (quizRes.error) throw quizRes.error;
        if (questionsRes.error) throw questionsRes.error;

        setQuiz(quizRes.data);
        setQuestions(questionsRes.data);
        setAnswers(new Array(questionsRes.data.length).fill(null));
        setTimeLeft(quizRes.data.time_limit * 60);
      } catch {
        toast.error("Failed to load quiz");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [id, navigate]);

  const handleSubmit = useCallback(async () => {
    if (submittedRef.current || !user || !quiz) return;
    submittedRef.current = true;
    setSubmitting(true);

    const correctCount = questions.reduce(
      (acc, q, i) => acc + (answers[i] === q.correct_answer_index ? 1 : 0),
      0
    );
    const score = Math.round((correctCount / questions.length) * 100);

    try {
      const { data, error } = await supabase
        .from("attempts")
        .insert({
          quiz_id: quiz.id,
          user_id: user.id,
          answers: answers.map((a) => a ?? -1),
          score,
        })
        .select("id")
        .single();

      if (error) throw error;
      navigate(`/result/${data.id}`, { replace: true });
    } catch {
      toast.error("Failed to submit quiz");
      submittedRef.current = false;
      setSubmitting(false);
    }
  }, [answers, navigate, questions, quiz, user]);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0 && quiz) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, quiz, handleSubmit]);

  const selectOption = (optionIndex: number) => {
    setAnswers((prev) => {
      const updated = [...prev];
      updated[currentIndex] = optionIndex;
      return updated;
    });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
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

  if (!quiz || questions.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <p className="text-muted-foreground">No questions found for this quiz.</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const isUrgent = timeLeft < 60;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-heading text-xl font-bold text-foreground">{quiz.title}</h1>
          <div
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-2 font-heading text-sm font-semibold",
              isUrgent
                ? "bg-destructive/10 text-destructive"
                : "bg-accent text-accent-foreground"
            )}
          >
            <Clock className="h-4 w-4" />
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6 flex gap-1">
          {questions.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i === currentIndex
                  ? "bg-primary"
                  : answers[i] !== null
                  ? "bg-primary/40"
                  : "bg-border"
              )}
            />
          ))}
        </div>

        {/* Question */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <p className="text-xs text-muted-foreground">
                Question {currentIndex + 1} of {questions.length}
              </p>
              <QuizHintButton
                questionText={currentQuestion.question_text}
                options={currentQuestion.options}
              />
            </div>
            <CardTitle className="font-heading text-xl leading-relaxed">
              {currentQuestion.question_text}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {currentQuestion.options.map((option, i) => (
              <button
                key={i}
                onClick={() => selectOption(i)}
                className={cn(
                  "w-full rounded-lg border px-4 py-3 text-left text-sm transition-all",
                  answers[currentIndex] === i
                    ? "border-primary bg-accent text-accent-foreground ring-1 ring-primary"
                    : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-accent/50"
                )}
              >
                <span className="mr-3 inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs font-medium">
                  {String.fromCharCode(65 + i)}
                </span>
                {option}
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentIndex((i) => i - 1)}
            disabled={currentIndex === 0}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>

          {currentIndex === questions.length - 1 ? (
            <Button onClick={handleSubmit} disabled={submitting} className="gap-1">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Submit Quiz
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentIndex((i) => i + 1)}
              className="gap-1"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </main>
    </div>
  );
};

export default QuizPage;
