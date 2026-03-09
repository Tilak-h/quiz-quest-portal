import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Lightbulb, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface QuizHintButtonProps {
  questionText: string;
  options: string[];
}

export const QuizHintButton = ({ questionText, options }: QuizHintButtonProps) => {
  const [open, setOpen] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchHint = async () => {
    if (hint) {
      setOpen(true);
      return;
    }

    setOpen(true);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("quiz-hint", {
        body: { questionText, options },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setHint(data.hint);
    } catch (e: any) {
      toast.error(e.message || "Failed to get hint");
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={fetchHint}
        className="gap-1.5 text-muted-foreground hover:text-primary"
      >
        <Lightbulb className="h-4 w-4" />
        Hint
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              AI Hint
            </DialogTitle>
            <DialogDescription>
              Here's a nudge in the right direction
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border bg-accent/50 p-4 text-sm leading-relaxed text-foreground">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Thinking…</span>
              </div>
            ) : (
              hint
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
