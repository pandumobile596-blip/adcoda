import { useState } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Crown, Zap, X, Check, Infinity } from "lucide-react";
import { toast } from "sonner";

const PRO_FEATURES = [
  "Unlimited swipe uploads",
  "Advanced AI analysis with deeper insights",
  "Export your library as CSV / JSON",
  "Priority processing queue",
  "Team collaboration (coming soon)",
  "API access (coming soon)",
];

export const ProUpgradeBanner = ({ uploadCount, onClose }) => {
  const [showModal, setShowModal] = useState(false);
  const freeLeft = Math.max(0, 15 - uploadCount);
  const pct = Math.round((uploadCount / 15) * 100);

  const handleUpgrade = () => {
    toast.info("Stripe integration coming soon! Thank you for your interest.");
    setShowModal(false);
  };

  return (
    <>
      {/* Inline banner */}
      <div className="mb-6 p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center flex-shrink-0">
            <Crown className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium text-foreground">
                {freeLeft === 0
                  ? "Free limit reached"
                  : `${freeLeft} free uploads remaining`}
              </p>
              {freeLeft === 0 && (
                <span className="text-xs font-medium text-destructive bg-destructive/10 border border-destructive/20 px-2 py-0.5 rounded-full">
                  Limit reached
                </span>
              )}
            </div>
            {/* Progress bar */}
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex-1 max-w-32 h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(pct, 100)}%`,
                    background:
                      freeLeft === 0
                        ? "hsl(var(--destructive))"
                        : freeLeft <= 3
                        ? "hsl(var(--warning))"
                        : "hsl(var(--primary))",
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {uploadCount}/15
              </span>
            </div>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => setShowModal(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 flex-shrink-0 text-xs h-8"
          style={{ transition: "background 0.2s" }}
        >
          <Crown className="w-3.5 h-3.5" />
          Upgrade to Pro
        </Button>
      </div>

      {/* Pro upgrade modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-popover border border-border shadow-elevated max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center">
                <Crown className="w-5 h-5 text-primary" />
              </div>
              <DialogTitle className="text-xl font-display font-semibold text-foreground">
                Upgrade to Pro
              </DialogTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              Unlock unlimited uploads and advanced AI features.
            </p>
          </DialogHeader>

          <div className="mt-4">
            {/* Pricing */}
            <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 mb-5">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-display font-bold text-foreground">
                  $12
                </span>
                <span className="text-muted-foreground text-sm">/month</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Or $99/year (save 31%)
              </p>
            </div>

            {/* Features */}
            <ul className="space-y-2.5 mb-6">
              {PRO_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-success/15 border border-success/25 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-2.5 h-2.5 text-success" />
                  </div>
                  <span className="text-sm text-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              onClick={handleUpgrade}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2 h-10 font-medium"
              style={{ transition: "background 0.2s" }}
            >
              <Zap className="w-4 h-4" />
              Get Pro access
            </Button>
            <p className="text-center text-xs text-muted-foreground mt-3">
              Cancel anytime · Secure checkout via Stripe
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
