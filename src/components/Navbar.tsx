import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Shield, Trophy, BarChart3, ArrowLeftRight } from "lucide-react";

export const Navbar = () => {
  const { profile, isAdmin, signOut } = useAuth();

  return (
    <nav className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="font-heading text-xl font-bold text-foreground">
            QuizFlow
          </Link>
          <div className="hidden sm:flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/leaderboard" className="flex items-center gap-1.5">
                <Trophy className="h-4 w-4" />
                Leaderboard
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/analytics" className="flex items-center gap-1.5">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin" className="flex items-center gap-1.5">
                <Shield className="h-4 w-4" />
                Admin
              </Link>
            </Button>
          )}
          <ThemeToggle />
          {profile && (
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile.photo_url ?? ""} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {profile.name?.charAt(0)?.toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="icon" onClick={signOut} className="rounded-full">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
