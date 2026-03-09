import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Loader2, Save, Copy, Check } from "lucide-react";
import { AIQuizGenerator } from "@/components/AIQuizGenerator";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";

interface QuestionForm {
  question_text: string;
  options: string[];
  correct_answer_index: number;
}

function generateJoinCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const AdminPage = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [timeLimit, setTimeLimit] = useState(10);
  const [questions, setQuestions] = useState<QuestionForm[]>([
    { question_text: "", options: ["", "", "", ""], correct_answer_index: 0 },
  ]);
  const [saving, setSaving] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (loading) return null;
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

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
    const joinCode = generateJoinCode();

    try {
      const { data: quiz, error: quizErr } = await supabase
        .from("quizzes")
        .insert({
          title,
          description,
          category,
          time_limit: timeLimit,
          created_by: user!.id,
          join_code: joinCode,
        })
        .select("id, join_code")
        .single();

      if (quizErr) throw quizErr;

      const { error: questionsErr } = await supabase.from("questions").insert(
        questions.map((q) => ({
          quiz_id: quiz.id,
          question_text: q.question_text,
          options: q.options,
          correct_answer_index: q.correct_answer_index,
        }))
      );

      if (questionsErr) throw questionsErr;

      setCreatedCode(quiz.join_code);
      toast.success("Quiz created successfully!");
    } catch {
      toast.error("Failed to save quiz");
    } finally {
      setSaving(false);
    }
  };

  // Show success screen with join code
  if (createdCode) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-lg px-4 py-16 text-center">
          <div className="rounded-xl border bg-card p-8 shadow-sm space-y-6">
            <div className="space-y-2">
              <h1 className="font-heading text-2xl font-bold text-foreground">Quiz Created! 🎉</h1>
              <p className="text-muted-foreground">Share this code with your students</p>
            </div>

            <div className="space-y-3">
              <div className="rounded-lg bg-accent p-6">
                <p className="font-mono text-4xl font-bold tracking-[0.3em] text-foreground">
                  {createdCode}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => copyCode(createdCode)}
                className="gap-2"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied!" : "Copy Code"}
              </Button>
            </div>

            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate("/")}>
                Go to Dashboard
              </Button>
              <Button onClick={() => {
                setCreatedCode(null);
                setTitle("");
                setDescription("");
                setQuestions([{ question_text: "", options: ["", "", "", ""], correct_answer_index: 0 }]);
              }}>
                Create Another
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-8 font-heading text-3xl font-bold text-foreground">
          Create Quiz
        </h1>

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

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              <Button variant="outline" onClick={addQuestion} className="gap-2">
                <Plus className="h-4 w-4" /> Add Question
              </Button>
              <AIQuizGenerator
                onGenerated={(generated) =>
                  setQuestions(generated.map((q) => ({
                    question_text: q.question_text,
                    options: q.options.slice(0, 4),
                    correct_answer_index: q.correct_answer_index,
                  })))
                }
              />
            </div>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Quiz
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminPage;
