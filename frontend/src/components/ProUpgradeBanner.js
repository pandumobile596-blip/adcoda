import { useState } from "react";
import { Button } from "./ui/button";
import { Crown } from "lucide-react";
import { CritiqueSuggestionModal } from "./CritiqueSuggestionModal";
import { MessageSquare } from "lucide-react";

export const ProUpgradeBanner = ({ uploadCount, onClose }) => {
  const [showModal, setShowModal] = useState(false);
  const freeLeft = Math.max(0, 15 - uploadCount);
  const pct = Math.round((uploadCount / 15) * 100);

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
          <MessageSquare className="w-3.5 h-3.5" />
          Critique & Suggestion
        </Button>
      </div>

      {/* Critique & Suggestion modal */}
      <CritiqueSuggestionModal open={showModal} onOpenChange={setShowModal} />
    </>
  );
};
