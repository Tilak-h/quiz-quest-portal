import { useEffect, useState } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Loader2, Save, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface QuestionForm {
  id?: string;
  question_text: string;
  options: string[];
  correct_answer_index: number;
}

const EditQuiz = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [timeLimit, setTimeLimit] = useState(10);
  const [questions, setQuestions] = useState<QuestionForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const [quizRes, questionsRes] = await Promise.all([
          supabase.from("quizzes").select("*").eq("id", id!).single(),
          supabase.from("questions").select("*").eq("quiz_id", id!),
        ]);

        if (quizRes.error) throw quizRes.error;

        const quiz = quizRes.data;
        if (quiz.created_by !== user?.id) {
          navigate("/");
          return;
        }

        setTitle(quiz.title);
        setDescription(quiz.description ?? "");
        setCategory(quiz.category ?? "General");
        setTimeLimit(quiz.time_limit);

        const qs = questionsRes.data ?? [];
        setQuestions(
          qs.map((q) => ({
            id: q.id,
            question_text: q.question_text,
            options: q.options as string[],
            correct_answer_index: q.correct_answer_index,
          }))
        );
      } catch {
        toast.error("Failed to load quiz");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchQuiz();
  }, [id, user, navigate]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      { question_text: "", options: ["", "", "", ""], correct_answer_index: 0 },
    ]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length === 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: string, value: string | number) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, [field]: value } : q))
    );
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIndex
          ? { ...q, options: q.options.map((o, j) => (j === oIndex ? value : o)) }
          : q
      )
    );
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Please enter a quiz title");
      return;
    }
    if (questions.some((q) => !q.question_text.trim() || q.options.some((o) => !o.trim()))) {
      toast.error("Please fill in all questions and options");
      return;
    }

    setSaving(true);
    try {
      // Update quiz details
      const { error: quizErr } = await supabase
        .from("quizzes")
        .update({ title, description, category, time_limit: timeLimit })
        .eq("id", id!);

      if (quizErr) throw quizErr;

      // Delete existing questions and re-insert
      const { error: delErr } = await supabase
        .from("questions")
        .delete()
        .eq("quiz_id", id!);

      if (delErr) throw delErr;

      const { error: insertErr } = await supabase.from("questions").insert(
        questions.map((q) => ({
          quiz_id: id!,
          question_text: q.question_text,
          options: q.options,
          correct_answer_index: q.correct_answer_index,
        }))
      );

      if (insertErr) throw insertErr;

      toast.success("Quiz updated successfully!");
      navigate("/");
    } catch {
      toast.error("Failed to update quiz");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="mb-4 gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Button>

        <h1 className="mb-8 font-heading text-3xl font-bold text-foreground">Edit Quiz</h1>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading">Quiz Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter quiz title" />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Enter quiz description" />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {["General", "Science", "Math", "History", "Technology", "Language", "Art"].map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="time">Time Limit (minutes)</Label>
                <Input id="time" type="number" min={1} value={timeLimit} onChange={(e) => setTimeLimit(parseInt(e.target.value) || 1)} />
              </div>
            </CardContent>
          </Card>

          {questions.map((q, qi) => (
            <Card key={qi}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-heading text-base">Question {qi + 1}</CardTitle>
                {questions.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => removeQuestion(qi)} className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Question Text</Label>
                  <Input value={q.question_text} onChange={(e) => updateQuestion(qi, "question_text", e.target.value)} placeholder="Enter question" />
                </div>
                {q.options.map((option, oi) => (
                  <div key={oi} className="flex items-center gap-3">
                    <input type="radio" name={`correct-${qi}`} checked={q.correct_answer_index === oi} onChange={() => updateQuestion(qi, "correct_answer_index", oi)} className="accent-primary" />
                    <Input value={option} onChange={(e) => updateOption(qi, oi, e.target.value)} placeholder={`Option ${String.fromCharCode(65 + oi)}`} className="flex-1" />
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">Select the radio button next to the correct answer</p>
              </CardContent>
            </Card>
          ))}

          <div className="flex items-center justify-between gap-3">
            <Button variant="outline" onClick={addQuestion} className="gap-2">
              <Plus className="h-4 w-4" /> Add Question
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EditQuiz;
