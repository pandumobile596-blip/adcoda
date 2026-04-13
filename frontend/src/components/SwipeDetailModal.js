import { Dialog, DialogContent } from "./ui/dialog";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import {
  X,
  Brain,
  Tag,
  Heart,
  FileText,
  Layers,
  Calendar,
  ExternalLink,
} from "lucide-react";

const getFormulaClass = (formula) => {
  if (!formula) return "formula-badge formula-other";
  const f = formula.toUpperCase();
  if (f.includes("AIDA")) return "formula-badge formula-aida";
  if (f.includes("PAS")) return "formula-badge formula-pas";
  if (f.includes("BAB")) return "formula-badge formula-bab";
  if (f.includes("FAB")) return "formula-badge formula-fab";
  if (f.includes("PPPP") || f.includes("4P")) return "formula-badge formula-pppp";
  return "formula-badge formula-other";
};

const DetailRow = ({ icon: Icon, label, value, multiline }) => {
  if (!value || value === "Unknown") return null;
  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-lg bg-secondary border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
          {label}
        </p>
        {multiline ? (
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words">
            {value}
          </p>
        ) : (
          <p className="text-sm text-foreground font-medium">{value}</p>
        )}
      </div>
    </div>
  );
};

export const SwipeDetailModal = ({ swipe, open, onClose }) => {
  if (!swipe) return null;

  const formattedDate = swipe.created_at
    ? new Date(swipe.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Unknown date";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-popover border border-border shadow-elevated max-w-4xl w-full max-h-[90vh] p-0 overflow-hidden">
        <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
          {/* Image panel */}
          <div className="md:w-1/2 bg-muted border-b md:border-b-0 md:border-r border-border relative flex items-center justify-center overflow-hidden">
            <img
              src={swipe.image_url}
              alt={swipe.title || "Swipe"}
              className="w-full h-full object-contain"
              style={{ maxHeight: "420px" }}
            />
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-7 h-7 rounded-full bg-background/80 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground"
              style={{ transition: "background 0.15s, color 0.15s" }}
            >
              <X className="w-4 h-4" />
            </button>
            {/* Formula badge */}
            {swipe.marketing_formula && swipe.marketing_formula !== "Unknown" && (
              <div className="absolute bottom-3 left-3">
                <span className={getFormulaClass(swipe.marketing_formula)}>
                  {swipe.marketing_formula}
                </span>
              </div>
            )}
            {/* View original */}
            <a
              href={swipe.image_url}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-3 left-3 w-7 h-7 rounded-full bg-background/80 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground"
              style={{ transition: "background 0.15s, color 0.15s" }}
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Analysis panel */}
          <div className="md:w-1/2 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-border flex-shrink-0">
              <h2 className="text-base font-display font-semibold text-foreground leading-snug">
                {swipe.title || "Untitled Swipe"}
              </h2>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {swipe.category && swipe.category !== "Unknown" && (
                  <span className="tag-chip">{swipe.category}</span>
                )}
                {swipe.industry && swipe.industry !== "Unknown" && (
                  <span className="tag-chip">{swipe.industry}</span>
                )}
              </div>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1 px-5 py-4">
              <div className="space-y-4">
                <DetailRow
                  icon={Brain}
                  label="Marketing Formula"
                  value={swipe.marketing_formula}
                />

                <Separator className="bg-border" />

                <DetailRow
                  icon={Tag}
                  label="Industry"
                  value={swipe.industry}
                />

                <DetailRow
                  icon={Heart}
                  label="Emotional Hook"
                  value={swipe.emotional_hook}
                />

                <DetailRow
                  icon={Layers}
                  label="Content Type"
                  value={swipe.category}
                />

                <Separator className="bg-border" />

                <DetailRow
                  icon={FileText}
                  label="Extracted Text"
                  value={swipe.extracted_text}
                  multiline
                />

                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-lg bg-secondary border border-border flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
                      Uploaded
                    </p>
                    <p className="text-sm text-muted-foreground">{formattedDate}</p>
                  </div>
                </div>
              </div>

              <div className="h-4" />
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
