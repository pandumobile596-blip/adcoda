import { useState } from "react";
import { supabase } from "../lib/supabase";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Zap, Upload, LogOut, User, Crown, ChevronDown, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export const Navbar = ({ session, uploadCount, isPro, onUpload, onUpgrade }) => {
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    toast.success("Signed out");
    setSigningOut(false);
  };

  const userInitial = session?.user?.email?.charAt(0)?.toUpperCase() || "U";
  const userEmail = session?.user?.email || "";

  const freeSwipesLeft = Math.max(0, 15 - uploadCount);

  return (
    <header className="h-14 border-b border-border bg-background/80 sticky top-0 z-50 glass">
      <div className="max-w-screen-2xl mx-auto h-full px-4 md:px-6 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-sm font-display font-semibold text-foreground tracking-tight">
            AdCoda
          </span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Free tier counter */}
          {!isPro && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary border border-border">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  background:
                    freeSwipesLeft > 5
                      ? "hsl(var(--success))"
                      : freeSwipesLeft > 0
                      ? "hsl(var(--warning))"
                      : "hsl(var(--destructive))",
                }}
              />
              <span className="text-xs text-muted-foreground font-medium">
                {freeSwipesLeft} free swipes left
              </span>
            </div>
          )}

          {/* Pro badge */}
          {isPro && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
              <Crown className="w-3 h-3 text-primary" />
              <span className="text-xs text-primary font-semibold">Pro</span>
            </div>
          )}

          {/* Upload button */}
          <Button
            onClick={onUpload}
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 font-medium h-8 px-3 text-xs"
            style={{ transition: "background 0.2s" }}
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Upload</span>
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-1.5 h-8 px-2 rounded-lg hover:bg-secondary border border-transparent hover:border-border"
                style={{ transition: "background 0.15s, border-color 0.15s" }}
              >
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                    {userInitial}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-52 bg-popover border border-border shadow-elevated"
            >
              <div className="px-3 py-2">
                <p className="text-xs font-medium text-foreground truncate">
                  {userEmail}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isPro ? "Pro Plan" : `Free · ${freeSwipesLeft}/15 left`}
                </p>
              </div>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem
                className="text-sm text-foreground cursor-pointer focus:bg-secondary"
              >
                <User className="w-4 h-4 mr-2 text-muted-foreground" />
                Account
              </DropdownMenuItem>
              {!isPro && (
                <DropdownMenuItem
                  onClick={onUpgrade}
                  className="text-sm text-primary cursor-pointer focus:bg-primary/10"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Critique & Suggestion
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem
                onClick={handleSignOut}
                disabled={signingOut}
                className="text-sm text-muted-foreground cursor-pointer focus:bg-secondary focus:text-foreground"
              >
                <LogOut className="w-4 h-4 mr-2" />
                {signingOut ? "Signing out..." : "Sign out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
