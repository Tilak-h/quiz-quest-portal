import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, Target, BarChart3, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

interface Attempt {
  id: string;
  quiz_id: string;
  score: number;
  submitted_at: string;
  user_id: string;
}

interface Quiz {
  id: string;
  title: string;
  category: string | null;
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--destructive))", "hsl(var(--accent))", "#fbbf24", "#34d399", "#a78bfa"];

const Analytics = () => {
  const { user, isAdmin } = useAuth();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      if (isAdmin) {
        // Admin: fetch their quizzes and all attempts on those quizzes
        const { data: myQuizzes } = await supabase
          .from("quizzes")
          .select("id, title, category")
          .eq("created_by", user.id);

        if (myQuizzes && myQuizzes.length > 0) {
          setQuizzes(myQuizzes);
          const quizIds = myQuizzes.map((q) => q.id);
          const { data: attData } = await supabase
            .from("attempts")
            .select("*")
            .in("quiz_id", quizIds)
            .order("submitted_at", { ascending: true });
          if (attData) setAttempts(attData);
        }
      } else {
        // Student: personal analytics
        const [attRes, quizRes] = await Promise.all([
          supabase.from("attempts").select("*").eq("user_id", user.id).order("submitted_at", { ascending: true }),
          supabase.from("quizzes").select("id, title, category"),
        ]);
        if (attRes.data) setAttempts(attRes.data);
        if (quizRes.data) setQuizzes(quizRes.data);
      }
      setLoading(false);
    };
    fetchData();
  }, [user, isAdmin]);

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

  const avgScore = attempts.length
    ? Math.round(attempts.reduce((s, a) => s + a.score, 0) / attempts.length)
    : 0;

  const bestScore = attempts.length ? Math.max(...attempts.map((a) => a.score)) : 0;
  const uniqueStudents = new Set(attempts.map((a) => a.user_id)).size;

  // Score trend over time
  const trendData = attempts.map((a, i) => ({
    attempt: i + 1,
    score: a.score,
    date: new Date(a.submitted_at).toLocaleDateString(),
  }));

  // Per-quiz scores
  const quizScores = quizzes
    .map((q) => {
      const quizAttempts = attempts.filter((a) => a.quiz_id === q.id);
      if (quizAttempts.length === 0) return null;
      return {
        name: q.title.length > 15 ? q.title.slice(0, 15) + "…" : q.title,
        best: Math.max(...quizAttempts.map((a) => a.score)),
        avg: Math.round(quizAttempts.reduce((s, a) => s + a.score, 0) / quizAttempts.length),
        attempts: quizAttempts.length,
      };
    })
    .filter(Boolean) as { name: string; best: number; avg: number; attempts: number }[];

  // Category distribution
  const categoryData = quizzes.reduce<Record<string, number>>((acc, q) => {
    const cat = q.category ?? "General";
    const catAttempts = attempts.filter((a) => a.quiz_id === q.id);
    if (catAttempts.length > 0) {
      acc[cat] = (acc[cat] ?? 0) + catAttempts.length;
    }
    return acc;
  }, {});

  const pieData = Object.entries(categoryData).map(([name, value]) => ({ name, value }));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="mb-8 font-heading text-3xl font-bold text-foreground flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-primary" />
          {isAdmin ? "Quiz Analytics" : "My Analytics"}
        </h1>

        {attempts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {isAdmin ? "No students have taken your quizzes yet." : "No quiz attempts yet. Take a quiz to see your analytics!"}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Summary Cards */}
            <div className={`mb-8 grid gap-4 ${isAdmin ? "sm:grid-cols-4" : "sm:grid-cols-3"}`}>
              {isAdmin && (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <Users className="mx-auto mb-2 h-8 w-8 text-primary" />
                    <p className="font-heading text-3xl font-bold text-foreground">{uniqueStudents}</p>
                    <p className="text-sm text-muted-foreground">Total Students</p>
                  </CardContent>
                </Card>
              )}
              <Card>
                <CardContent className="pt-6 text-center">
                  <Target className="mx-auto mb-2 h-8 w-8 text-primary" />
                  <p className="font-heading text-3xl font-bold text-foreground">{avgScore}%</p>
                  <p className="text-sm text-muted-foreground">Average Score</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <TrendingUp className="mx-auto mb-2 h-8 w-8 text-primary" />
                  <p className="font-heading text-3xl font-bold text-foreground">{bestScore}%</p>
                  <p className="text-sm text-muted-foreground">Best Score</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <BarChart3 className="mx-auto mb-2 h-8 w-8 text-primary" />
                  <p className="font-heading text-3xl font-bold text-foreground">{attempts.length}</p>
                  <p className="text-sm text-muted-foreground">Total Attempts</p>
                </CardContent>
              </Card>
            </div>

            {/* Score Trend */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="font-heading">{isAdmin ? "Score Distribution Over Time" : "Score Trend"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="attempt" className="text-xs" />
                      <YAxis domain={[0, 100]} className="text-xs" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          color: "hsl(var(--foreground))",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ fill: "hsl(var(--primary))" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              {quizScores.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading">{isAdmin ? "Average Scores by Quiz" : "Best Scores by Quiz"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={quizScores}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="name" className="text-xs" />
                          <YAxis domain={[0, 100]} className="text-xs" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                              color: "hsl(var(--foreground))",
                            }}
                          />
                          <Bar dataKey={isAdmin ? "avg" : "best"} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              {pieData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading">Attempts by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={90}
                            paddingAngle={3}
                            dataKey="value"
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          >
                            {pieData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Analytics;
