import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, User, Loader2 } from "lucide-react";
import { toast } from "sonner";

const RoleSelection = () => {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [selecting, setSelecting] = useState(false);

  // Redirect if user already has a role
  useEffect(() => {
    if (!loading && role) {
      navigate("/", { replace: true });
    }
  }, [loading, role, navigate]);

  const selectRole = async (selectedRole: "admin" | "user") => {
    if (!user) return;
    setSelecting(true);
    try {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: user.id, role: selectedRole });

      if (error) {
        // Handle duplicate - user already has a role
        if (error.code === "23505") {
          window.location.href = "/";
          return;
        }
        throw error;
      }

      toast.success(`You're now signed in as ${selectedRole === "admin" ? "an Admin" : "a User"}`);
      window.location.href = "/";
    } catch {
      toast.error("Failed to set role. Please try again.");
      setSelecting(false);
    }
  };

  if (loading || role) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
            onClick={() => !selecting && selectRole("admin")}
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
            onClick={() => !selecting && selectRole("user")}
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

        {selecting && (
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Setting up your account...
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleSelection;
