import { Dialog, DialogContent } from "./ui/dialog";
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
  Target,
  Zap,
  Users,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Sparkles,
  Eye,
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

const Section = ({ icon: Icon, label, value, accent }) => {
  if (!value || value === "Unknown" || value === "AI analysis unavailable") return null;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${accent || "text-primary"}`} />
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
      </div>
      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap pl-5">
        {value}
      </p>
    </div>
  );
};

// Try to parse the rich JSON stored in extracted_text, fall back to plain string
function parseAnalysis(swipe) {
  try {
    const parsed = JSON.parse(swipe.extracted_text);
    if (parsed && typeof parsed === "object") return parsed;
  } catch (_) {}
  // Legacy plain-text record
  return { extracted_text: swipe.extracted_text };
}

export const SwipeDetailModal = ({ swipe, open, onClose }) => {
  if (!swipe) return null;

  const a = parseAnalysis(swipe);
  const isRich = !!(a.hook || a.formula_name || a.why_it_works);

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

          {/* ── Left: Image ── */}
          <div className="md:w-[45%] bg-muted border-b md:border-b-0 md:border-r border-border relative flex items-center justify-center overflow-hidden flex-shrink-0">
            <img
              src={swipe.image_url}
              alt={swipe.title || "Swipe"}
              className="w-full h-full object-contain"
              style={{ maxHeight: "420px" }}
            />
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-7 h-7 rounded-full bg-background/80 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
            {swipe.marketing_formula && swipe.marketing_formula !== "Unknown" && (
              <div className="absolute bottom-3 left-3">
                <span className={getFormulaClass(swipe.marketing_formula)}>
                  {swipe.marketing_formula}
                </span>
              </div>
            )}
            <a
              href={swipe.image_url}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-3 left-3 w-7 h-7 rounded-full bg-background/80 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* ── Right: Analysis ── */}
          <div className="md:w-[55%] flex flex-col overflow-hidden">
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
                {swipe.emotional_hook && swipe.emotional_hook !== "Unknown" && (
                  <span className="tag-chip">{swipe.emotional_hook}</span>
                )}
              </div>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1 px-5 py-4">
              <div className="space-y-4">

                {isRich ? (
                  <>
                    {/* 1. Hook */}
                    <Section icon={Eye} label="Hook (First 3 seconds)" value={a.hook} accent="text-yellow-400" />

                    {/* 2. Primary Emotion */}
                    <Section icon={Heart} label="Primary Emotion" value={a.primary_emotion} accent="text-pink-400" />

                    {/* 3. Target Audience */}
                    <Section icon={Users} label="Target Audience" value={a.target_audience} accent="text-blue-400" />

                    <Separator className="bg-border" />

                    {/* 4. Industry + 5. Objective */}
                    <Section icon={Tag} label="Industry" value={swipe.industry} />
                    <Section icon={Target} label="Marketing Objective" value={a.marketing_objective} accent="text-orange-400" />

                    <Separator className="bg-border" />

                    {/* 6. Formula */}
                    {(a.formula_name || swipe.marketing_formula) && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Brain className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                            Copywriting Formula
                          </p>
                        </div>
                        <div className="pl-5 space-y-1">
                          <span className={getFormulaClass(a.formula_name || swipe.marketing_formula)}>
                            {a.formula_name || swipe.marketing_formula}
                          </span>
                          {a.formula_explanation && (
                            <p className="text-sm text-foreground leading-relaxed mt-2 whitespace-pre-wrap">
                              {a.formula_explanation}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    <Separator className="bg-border" />

                    {/* 7. Why it works */}
                    <Section icon={TrendingUp} label="Why This Ad Works" value={a.why_it_works} accent="text-green-400" />

                    {/* 8. Weakness */}
                    <Section icon={AlertTriangle} label="Weakness" value={a.weakness} accent="text-red-400" />

                    <Separator className="bg-border" />

                    {/* 9. How to Adapt */}
                    <Section icon={Lightbulb} label="How to Adapt This Ad" value={a.how_to_adapt} accent="text-yellow-300" />

                    {/* 10. Final Summary */}
                    {a.final_summary && (
                      <div className="p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-primary" />
                          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                            Key Takeaway
                          </p>
                        </div>
                        <p className="text-sm text-foreground font-medium leading-relaxed pl-5">
                          {a.final_summary}
                        </p>
                      </div>
                    )}

                    <Separator className="bg-border" />

                    {/* Extracted text */}
                    <Section icon={FileText} label="Extracted Text" value={a.extracted_text} />
                  </>
                ) : (
                  /* Legacy plain-text fallback */
                  <>
                    <Section icon={Brain} label="Marketing Formula" value={swipe.marketing_formula} />
                    <Separator className="bg-border" />
                    <Section icon={Tag} label="Industry" value={swipe.industry} />
                    <Section icon={Heart} label="Emotional Hook" value={swipe.emotional_hook} />
                    <Section icon={Layers} label="Content Type" value={swipe.category} />
                    <Separator className="bg-border" />
                    <Section icon={FileText} label="Extracted Text" value={a.extracted_text} />
                  </>
                )}

                {/* Date — always shown */}
                <div className="flex gap-3 pt-1">
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
