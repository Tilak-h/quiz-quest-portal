import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface GeneratedQuestion {
  question_text: string;
  options: string[];
  correct_answer_index: number;
}

interface AIQuizGeneratorProps {
  onGenerated: (questions: GeneratedQuestion[]) => void;
}

export const AIQuizGenerator = ({ onGenerated }: AIQuizGeneratorProps) => {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-quiz", {
        body: { topic: topic.trim(), numQuestions },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (!data?.questions?.length) {
        throw new Error("No questions generated");
      }

      onGenerated(data.questions);
      toast.success(`Generated ${data.questions.length} questions!`);
      setOpen(false);
      setTopic("");
    } catch (e: any) {
      toast.error(e.message || "Failed to generate questions");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <Sparkles className="h-4 w-4" />
        AI Generate
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Quiz Generator
            </DialogTitle>
            <DialogDescription>
              Enter a topic and we'll generate quiz questions automatically
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="ai-topic">Topic</Label>
              <Input
                id="ai-topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. World War II, Python basics, Solar System"
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="ai-count">Number of Questions</Label>
              <Input
                id="ai-count"
                type="number"
                min={1}
                max={20}
                value={numQuestions}
                onChange={(e) => setNumQuestions(parseInt(e.target.value) || 5)}
                disabled={loading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleGenerate} disabled={loading} className="gap-2">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
