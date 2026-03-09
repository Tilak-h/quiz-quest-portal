import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, User, Loader2 } from "lucide-react";

const RoleSelection = () => {
  const { session, role, loading } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (session && role) {
      navigate("/dashboard", { replace: true });
    } else if (session && !role) {
      navigate("/login", { replace: true });
    }
  }, [loading, session, role, navigate]);

  if (loading || (session && (role || !role))) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleSelectRole = (selectedRole: "admin" | "user") => {
    setSelected(true);
    sessionStorage.setItem("pending_role", selectedRole);
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground">
            Welcome to QuizFlow
          </h1>
          <p className="text-muted-foreground">
            Choose how you'd like to use the platform
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card
            className="cursor-pointer border-2 transition-all hover:border-primary hover:shadow-md"
            onClick={() => !selected && handleSelectRole("admin")}
          >
            <CardHeader className="items-center pb-2">
              <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Shield className="h-7 w-7 text-primary" />
              </div>
              <CardTitle className="font-heading text-lg">Admin</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Create quizzes, manage questions, and share unique codes with your students
              </CardDescription>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer border-2 transition-all hover:border-primary hover:shadow-md"
            onClick={() => !selected && handleSelectRole("user")}
          >
            <CardHeader className="items-center pb-2">
              <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-accent">
                <User className="h-7 w-7 text-accent-foreground" />
              </div>
              <CardTitle className="font-heading text-lg">Student</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center">
                Enter a quiz code to take tests, practice, and track your progress
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
