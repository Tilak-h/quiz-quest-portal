import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const Login = () => {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (session) navigate("/", { replace: true });
  }, [session, navigate]);

  const handleGoogleLogin = async () => {
    setSigningIn(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google");
      if (result.error) {
        toast.error("Login failed. Please try again.");
      }
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setSigningIn(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground">
            QuizFlow
          </h1>
          <p className="text-muted-foreground">
            Test your knowledge with interactive quizzes
          </p>
        </div>

        <div className="rounded-xl border bg-card p-8 shadow-sm">
          <Button
            onClick={handleGoogleLogin}
            disabled={signingIn}
            className="w-full gap-2"
            size="lg"
          >
            {signingIn ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            Login with Google
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Login;
