import { useEffect, useState } from "react";
import { Pagination, paginateItems } from "@/components/Pagination";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Trophy, Medal } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
  quiz_id: string;
  user_id: string;
  score: number;
  submitted_at: string;
  user_name: string;
  user_photo: string;
  quiz_title: string;
  quiz_category: string;
}

const Leaderboard = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState<string>("all");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase
        .from("leaderboard")
        .select("*");

      if (!error && data) {
        setEntries(data as unknown as LeaderboardEntry[]);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  // Get unique quizzes
  const quizzes = Array.from(
    new Map(entries.map((e) => [e.quiz_id, { id: e.quiz_id, title: e.quiz_title }])).values()
  );

  // Global leaderboard: best score per user across all quizzes
  const getGlobalLeaderboard = () => {
    const userBest = new Map<string, LeaderboardEntry>();
    entries.forEach((e) => {
      const existing = userBest.get(e.user_id);
      if (!existing || e.score > existing.score) {
        userBest.set(e.user_id, e);
      }
    });
    return Array.from(userBest.values()).sort((a, b) => b.score - a.score);
  };

  // Per-quiz leaderboard
  const getQuizLeaderboard = (quizId: string) => {
    return entries
      .filter((e) => e.quiz_id === quizId)
      .sort((a, b) => b.score - a.score);
  };

  const leaderboard =
    selectedQuiz === "all"
      ? getGlobalLeaderboard()
      : getQuizLeaderboard(selectedQuiz);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Medal className="h-5 w-5 text-amber-700" />;
    return <span className="flex h-5 w-5 items-center justify-center text-xs font-bold text-muted-foreground">{index + 1}</span>;
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
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-6 font-heading text-3xl font-bold text-foreground flex items-center gap-3">
          <Trophy className="h-8 w-8 text-primary" />
          Leaderboard
        </h1>

        {/* Quiz filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          <Button
            variant={selectedQuiz === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedQuiz("all")}
            className="rounded-full"
          >
            Global
          </Button>
          {quizzes.map((q) => (
            <Button
              key={q.id}
              variant={selectedQuiz === q.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedQuiz(q.id)}
              className="rounded-full"
            >
              {q.title}
            </Button>
          ))}
        </div>

        {leaderboard.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No scores yet. Be the first to take a quiz!
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry, index) => (
              <div
                key={`${entry.user_id}-${entry.quiz_id}`}
                className={cn(
                  "flex items-center gap-4 rounded-xl border bg-card px-4 py-3 transition-colors",
                  index === 0 && "border-yellow-500/30 bg-yellow-500/5"
                )}
              >
                <div className="flex h-8 w-8 items-center justify-center">
                  {getRankIcon(index)}
                </div>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={entry.user_photo ?? ""} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {entry.user_name?.charAt(0)?.toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{entry.user_name ?? "Anonymous"}</p>
                  {selectedQuiz === "all" && (
                    <p className="text-xs text-muted-foreground">{entry.quiz_title}</p>
                  )}
                </div>
                <div className="text-right">
                  <span className="font-heading text-xl font-bold text-primary">{entry.score}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Leaderboard;
