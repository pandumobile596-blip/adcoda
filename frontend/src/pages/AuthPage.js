import { useState } from "react";
import { supabase } from "../lib/supabase";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { Zap, CheckCircle2, Eye, EyeOff, ArrowRight, Layers, Search, Brain } from "lucide-react";

const FEATURES = [
  { icon: Brain, text: "AI-powered marketing formula extraction" },
  { icon: Search, text: "OCR text extraction from any image" },
  { icon: Layers, text: "Masonry swipe file with smart tagging" },
];

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setError("Please fill in all fields.");
      setIsLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) {
          const msg = (signUpError.message || "").toLowerCase();
          if (msg.includes("already registered") || msg.includes("already exists")) {
            setError("An account with this email already exists. Please sign in instead.");
          } else {
            setError(signUpError.message || "Sign up failed. Please try again.");
          }
          return;
        }

        // identities.length === 0 means the email already exists (Supabase quirk)
        if (data?.user?.identities?.length === 0) {
          setError("An account with this email already exists. Please sign in instead.");
          return;
        }

        // Email confirmation is disabled → user is auto-confirmed and logged in
        if (data?.session) {
          toast.success("Account created! Welcome to SwipeFlow.");
        } else {
          setSuccessMsg(
            "Account created! Check your email for a confirmation link, then sign in."
          );
          toast.success("Account created successfully!");
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          const msg = (signInError.message || "").toLowerCase();
          const code = (signInError.code || signInError.status || "").toString().toLowerCase();

          // Handle safeFetch JSON parse errors (usually means invalid credentials)
          if (msg.includes("safefetch") || msg.includes("failed to parse json")) {
            setError("Invalid email or password. Please check your credentials and try again.");
            return;
          }

          if (
            msg.includes("email not confirmed") ||
            msg.includes("not confirmed") ||
            code.includes("email_not_confirmed")
          ) {
            setError(
              "Your email address hasn't been confirmed yet. Check your inbox, or go to Supabase → Authentication → Settings and disable 'Email Confirmations'."
            );
          } else if (
            msg.includes("invalid login") ||
            msg.includes("invalid credentials") ||
            msg.includes("invalid email or password") ||
            signInError.status === 400
          ) {
            setError("Invalid email or password. Please check your credentials and try again.");
          } else {
            setError(signInError.message || "Sign in failed. Please try again.");
          }
          return;
        }

        if (data?.session) {
          toast.success("Welcome back!");
        }
      }
    } catch (err) {
      // Catch any unexpected SDK-level throws (e.g. network errors)
      const raw = String(err?.message || err || "");
      if (raw.includes("body stream") || raw.includes("json") || raw.includes("stream")) {
        setError(
          "A browser error occurred reading the auth response. Please hard-refresh (Ctrl+Shift+R) and try again."
        );
      } else if (raw) {
        setError(raw);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel - Branding */}
      <div className="hidden lg:flex flex-col w-[520px] flex-shrink-0 relative overflow-hidden border-r border-border">
        {/* Grid background */}
        <div className="absolute inset-0 auth-grid-bg opacity-100" />
        {/* Radial glow */}
        <div
          className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 20% 20%, hsl(243 75% 59% / 0.12), transparent 60%)",
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 80% 80%, hsl(257 70% 54% / 0.08), transparent 60%)",
          }}
        />

        <div className="relative z-10 flex flex-col h-full p-12">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-16">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-glow">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-display font-semibold text-foreground tracking-tight">
              SwipeFlow
            </span>
          </div>

          {/* Headline */}
          <div className="flex-1">
            <h1 className="text-4xl font-display font-bold text-foreground leading-tight mb-4">
              Your AI-powered
              <br />
              <span className="gradient-text-brand">swipe file engine</span>
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed mb-12 max-w-xs">
              Upload marketing materials and let Gemini AI extract formulas,
              hooks, and industry tags instantly.
            </p>

            {/* Features */}
            <div className="space-y-5">
              {FEATURES.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed pt-1">
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom stats */}
          <div className="mt-12 pt-8 border-t border-border">
            <div className="flex gap-8">
              {[
                { label: "Marketing formulas", value: "12+" },
                { label: "Industries tagged", value: "50+" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-2xl font-display font-bold text-foreground">
                    {value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm fade-in">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-base font-display font-semibold text-foreground">
              SwipeFlow
            </span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-display font-semibold text-foreground tracking-tight">
              {isSignUp ? "Create your account" : "Welcome back"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1.5">
              {isSignUp
                ? "Start building your AI-powered swipe file today"
                : "Sign in to access your swipe library"}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Success */}
          {successMsg && (
            <div className="mb-4 p-3 rounded-lg bg-success/10 border border-success/20 text-sm text-success flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">
                Email address
              </Label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-input border-border text-foreground placeholder:text-muted-foreground h-10 focus:ring-1 focus:ring-primary"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">
                Password
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground h-10 pr-10 focus:ring-1 focus:ring-primary"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  style={{ transition: "color 0.15s" }}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 bg-primary text-primary-foreground font-medium hover:bg-primary/90 mt-2"
              style={{ transition: "background 0.2s, opacity 0.2s" }}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  <span>{isSignUp ? "Creating account..." : "Signing in..."}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>{isSignUp ? "Create account" : "Sign in"}</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="text-primary font-medium hover:underline"
                style={{ transition: "opacity 0.15s" }}
              >
                {isSignUp ? "Sign in" : "Sign up free"}
              </button>
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
