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
  if (f.includes("PAS"))  return "formula-badge formula-pas";
  if (f.includes("BAB"))  return "formula-badge formula-bab";
  if (f.includes("FAB"))  return "formula-badge formula-fab";
  if (f.includes("PPPP") || f.includes("4P")) return "formula-badge formula-pppp";
  return "formula-badge formula-other";
};

/** Return display-safe value: blank/Unknown → "—" */
const safe = (v) => (!v || v === "Unknown" || v === "AI analysis unavailable" || v.startsWith("AI analysis failed")) ? null : v;
const safeOrDash = (v) => safe(v) ?? "—";

/** A labelled row that always renders (shows "—" when empty). */
const Row = ({ icon: Icon, label, value, multiline, accent }) => (
  <div className="space-y-1.5">
    <div className="flex items-center gap-2">
      <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${accent || "text-muted-foreground"}`} />
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
    </div>
    {multiline ? (
      <p className={`text-sm leading-relaxed whitespace-pre-wrap pl-5 ${value ? "text-foreground" : "text-muted-foreground italic"}`}>
        {value || "—"}
      </p>
    ) : (
      <p className={`text-sm font-medium pl-5 ${value ? "text-foreground" : "text-muted-foreground italic"}`}>
        {value || "—"}
      </p>
    )}
  </div>
);

/** A rich section that is hidden when no value exists (used for 10-point extras). */
const RichSection = ({ icon: Icon, label, value, accent }) => {
  if (!value) return null;
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

/** Try to parse rich JSON stored in extracted_text; fall back to plain string. */
function parseAnalysis(swipe) {
  try {
    const parsed = JSON.parse(swipe.extracted_text);
    if (parsed && typeof parsed === "object") return parsed;
  } catch (_) {}
  return { extracted_text: swipe.extracted_text };
}

export const SwipeDetailModal = ({ swipe, open, onClose }) => {
  if (!swipe) return null;

  const a       = parseAnalysis(swipe);
  const isRich  = !!(safe(a.hook) || safe(a.formula_name) || safe(a.why_it_works));

  const formattedDate = swipe.created_at
    ? new Date(swipe.created_at).toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : "Unknown date";

  // Resolve display values — prefer rich-analysis fields, fall back to DB columns
  const formulaName      = safe(a.formula_name)      ?? safe(swipe.marketing_formula);
  const formulaExp       = safe(a.formula_explanation);
  const industry         = safe(a.industry)           ?? safe(swipe.industry);
  const emotionalHook    = safe(a.primary_emotion)    ?? safe(swipe.emotional_hook);
  const contentType      = safe(a.category)           ?? safe(swipe.category);
  const extractedText    = safe(a.extracted_text)     ?? null;

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
            {formulaName && (
              <div className="absolute bottom-3 left-3">
                <span className={getFormulaClass(formulaName)}>{formulaName}</span>
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
                {contentType    && <span className="tag-chip">{contentType}</span>}
                {industry       && <span className="tag-chip">{industry}</span>}
                {emotionalHook  && <span className="tag-chip">{emotionalHook}</span>}
              </div>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1 px-5 py-4">
              <div className="space-y-4">

                {isRich ? (
                  /* ── RICH 10-point analysis (new uploads with Gemini key) ── */
                  <>
                    <RichSection icon={Eye}         label="Hook (First 3 seconds)"  value={safe(a.hook)}               accent="text-yellow-400" />
                    <RichSection icon={Heart}       label="Primary Emotion"         value={safe(a.primary_emotion)}    accent="text-pink-400" />
                    <RichSection icon={Users}       label="Target Audience"         value={safe(a.target_audience)}    accent="text-blue-400" />
                    <Separator className="bg-border" />
                    <Row icon={Tag}    label="Industry"             value={industry} />
                    <RichSection icon={Target}      label="Marketing Objective"     value={safe(a.marketing_objective)} accent="text-orange-400" />
                    <Separator className="bg-border" />

                    {/* Formula block */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Brain className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                          Copywriting Formula
                        </p>
                      </div>
                      <div className="pl-5 space-y-2">
                        {formulaName
                          ? <span className={getFormulaClass(formulaName)}>{formulaName}</span>
                          : <p className="text-sm text-muted-foreground italic">—</p>
                        }
                        {formulaExp && (
                          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{formulaExp}</p>
                        )}
                      </div>
                    </div>

                    <Separator className="bg-border" />
                    <RichSection icon={TrendingUp}  label="Why This Ad Works"       value={safe(a.why_it_works)}       accent="text-green-400" />
                    <RichSection icon={AlertTriangle} label="Weakness"              value={safe(a.weakness)}           accent="text-red-400" />
                    <Separator className="bg-border" />
                    <RichSection icon={Lightbulb}   label="How to Adapt This Ad"    value={safe(a.how_to_adapt)}       accent="text-yellow-300" />

                    {safe(a.final_summary) && (
                      <div className="p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-primary" />
                          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Key Takeaway</p>
                        </div>
                        <p className="text-sm text-foreground font-medium leading-relaxed pl-5">{a.final_summary}</p>
                      </div>
                    )}

                    <Separator className="bg-border" />
                    <Row icon={FileText} label="Extracted Text" value={extractedText} multiline />
                  </>
                ) : (
                  /* ── LEGACY 5-field layout (always shows all fields, matches Emergent original) ── */
                  <>
                    {/* Formula */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Brain className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                          Marketing Formula
                        </p>
                      </div>
                      <div className="pl-5">
                        {formulaName
                          ? <span className={getFormulaClass(formulaName)}>{formulaName}</span>
                          : <p className="text-sm text-muted-foreground italic">—</p>
                        }
                      </div>
                    </div>

                    <Separator className="bg-border" />
                    <Row icon={Tag}     label="Industry"       value={industry} />
                    <Row icon={Heart}   label="Emotional Hook" value={emotionalHook} />
                    <Row icon={Layers}  label="Content Type"   value={contentType} />
                    <Separator className="bg-border" />
                    <Row icon={FileText} label="Extracted Text" value={extractedText} multiline />
                  </>
                )}

                {/* Date — always shown */}
                <div className="flex gap-3 pt-1">
                  <div className="w-7 h-7 rounded-lg bg-secondary border border-border flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Uploaded</p>
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
