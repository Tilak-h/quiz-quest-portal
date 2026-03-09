import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  user_id: string;
  name: string | null;
  email: string | null;
  photo_url: string | null;
}

type UserRole = "admin" | "user" | null;

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  role: UserRole;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  isAdmin: false,
  role: null,
  loading: true,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = useCallback(async (userId: string) => {
    try {
      const [profileRes, roleRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .eq("user_id", userId)
          .single(),
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId),
      ]);

      setProfile(profileRes.data);
      const roles = roleRes.data as { role: string }[] | null;
      if (roles && roles.length > 0) {
        // Prefer admin role if user has multiple
        const adminRole = roles.find(r => r.role === "admin");
        setRole((adminRole?.role ?? roles[0].role) as UserRole);
      } else {
        setRole(null);
      }
    } catch {
      setProfile(null);
      setRole(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Keep loading true until fetchUserData completes
          setTimeout(() => fetchUserData(session.user.id), 0);
        } else {
          setProfile(null);
          setRole(null);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchUserData]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, isAdmin: role === "admin", role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
