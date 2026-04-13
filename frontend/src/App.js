import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import { Toaster } from "./components/ui/sonner";
import "./App.css";

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Force dark mode
    document.documentElement.classList.add("dark");

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 border-2 border-primary/20 rounded-full" />
            <div className="absolute inset-0 border-2 border-transparent border-t-primary rounded-full animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground font-display font-medium tracking-wide">
            Loading SwipeFlow...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {session ? <Dashboard session={session} /> : <AuthPage />}
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: "hsl(222 40% 9%)",
            border: "1px solid hsl(222 27% 18%)",
            color: "hsl(213 31% 91%)",
          },
        }}
      />
    </>
  );
}

export default App;
