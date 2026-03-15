import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ChevronLeft, ChevronRight, CheckCircle2, XCircle, ArrowLeft, BookOpen } from "lucide-react";
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
}

const PracticePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState<(boolean | null)[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const [quizRes, questionsRes] = await Promise.all([
          supabase.from("quizzes").select("id, title").eq("id", id!).single(),
          supabase.rpc("get_quiz_questions_full", { _quiz_id: id! }),
        ]);
        if (quizRes.error) throw quizRes.error;
        if (questionsRes.error) throw questionsRes.error;

        setQuiz(quizRes.data);
        setQuestions(questionsRes.data);
        setResults(new Array(questionsRes.data.length).fill(null));
      } catch {
        toast.error("Failed to load quiz");
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [id, navigate]);

  const handleSelect = (optionIndex: number) => {
    if (revealed) return;
    setSelectedAnswer(optionIndex);
  };

  const handleReveal = () => {
    if (selectedAnswer === null) {
      toast.error("Please select an answer first");
      return;
    }
    setRevealed(true);
    const isCorrect = selectedAnswer === questions[currentIndex].correct_answer_index;
    setResults((prev) => {
      const updated = [...prev];
      updated[currentIndex] = isCorrect;
      return updated;
    });
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setRevealed(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setSelectedAnswer(null);
      setRevealed(false);
    }
  };

  const correctCount = results.filter((r) => r === true).length;
  const answeredCount = results.filter((r) => r !== null).length;
  const isComplete = answeredCount === questions.length;

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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h1 className="font-heading text-xl font-bold text-foreground">
              Practice: {quiz.title}
            </h1>
          </div>
          <div className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground">
            {correctCount}/{answeredCount} correct
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
                  : results[i] === true
                  ? "bg-green-500"
                  : results[i] === false
                  ? "bg-destructive"
                  : "bg-border"
              )}
            />
          ))}
        </div>

        {/* Question */}
        <Card>
          <CardHeader>
            <p className="text-xs text-muted-foreground">
              Question {currentIndex + 1} of {questions.length}
            </p>
            <CardTitle className="font-heading text-xl leading-relaxed">
              {currentQuestion.question_text}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {currentQuestion.options.map((option, i) => {
              const isCorrectOption = i === currentQuestion.correct_answer_index;
              const isSelected = selectedAnswer === i;

              return (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  disabled={revealed}
                  className={cn(
                    "w-full rounded-lg border px-4 py-3 text-left text-sm transition-all",
                    revealed && isCorrectOption
                      ? "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400 ring-1 ring-green-500"
                      : revealed && isSelected && !isCorrectOption
                      ? "border-destructive bg-destructive/10 text-destructive ring-1 ring-destructive"
                      : isSelected
                      ? "border-primary bg-accent text-accent-foreground ring-1 ring-primary"
                      : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-accent/50",
                    revealed && "cursor-default"
                  )}
                >
                  <span className="mr-3 inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs font-medium">
                    {String.fromCharCode(65 + i)}
                  </span>
                  {option}
                  {revealed && isCorrectOption && (
                    <CheckCircle2 className="ml-2 inline h-4 w-4 text-green-500" />
                  )}
                  {revealed && isSelected && !isCorrectOption && (
                    <XCircle className="ml-2 inline h-4 w-4 text-destructive" />
                  )}
                </button>
              );
            })}

            {revealed && (
              <div className="mt-4 rounded-lg border bg-accent/50 p-4 text-sm text-foreground">
                <p className="font-medium">
                  {selectedAnswer === currentQuestion.correct_answer_index
                    ? "✅ Correct!"
                    : `❌ Incorrect. The correct answer is ${String.fromCharCode(65 + currentQuestion.correct_answer_index)}.`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>

          <div className="flex gap-2">
            {!revealed && (
              <Button onClick={handleReveal} className="gap-1">
                Check Answer
              </Button>
            )}
            {revealed && currentIndex < questions.length - 1 && (
              <Button onClick={handleNext} className="gap-1">
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            )}
            {revealed && isComplete && (
              <Button onClick={() => navigate("/dashboard")} variant="outline" className="gap-1">
                <ArrowLeft className="h-4 w-4" /> Back to Dashboard
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PracticePage;
