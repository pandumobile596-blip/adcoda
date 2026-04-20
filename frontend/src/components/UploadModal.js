import { useState, useRef, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Progress } from "./ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  Brain,
  FileText,
  Tag,
  Heart,
  Layers,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { analyzeMarketingImage } from "../lib/gemini";

const CATEGORIES = [
  "Social Ad",
  "Email Newsletter",
  "Landing Page",
  "Banner Ad",
  "Print Ad",
  "Video Script",
  "Sales Page",
  "Other",
];

const ANALYSIS_STEPS = [
  "Uploading image to cloud storage...",
  "Extracting text with OCR...",
  "Identifying marketing formula...",
  "Tagging industry & emotional hook...",
  "Finalizing AI analysis...",
];

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

export const UploadModal = ({ open, onClose, session, onUploadComplete, uploadCount }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [stage, setStage] = useState("idle"); // idle | uploading | analyzing | complete | error
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [analysis, setAnalysis] = useState(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  const MAX_FREE = 15;
  const isAtLimit = uploadCount >= MAX_FREE;

  const handleClose = () => {
    if (stage === "uploading" || stage === "analyzing") return;
    setFile(null);
    setPreview(null);
    setStage("idle");
    setUploadProgress(0);
    setAnalysisStep(0);
    setAnalysis(null);
    setTitle("");
    setCategory("");
    setErrorMsg("");
    onClose();
  };

  const validateFile = (f) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(f.type)) {
      toast.error("Please upload a JPG, PNG, WebP, or GIF image.");
      return false;
    }
    if (f.size > 20 * 1024 * 1024) {
      toast.error("File size must be under 20MB.");
      return false;
    }
    return true;
  };

  const selectFile = (f) => {
    if (!validateFile(f)) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setStage("idle");
    setAnalysis(null);
    setTitle(f.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) selectFile(droppedFile);
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const cycleAnalysisSteps = () => {
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setAnalysisStep((s) => Math.min(s + 1, ANALYSIS_STEPS.length - 1));
      if (step >= ANALYSIS_STEPS.length - 1) clearInterval(interval);
    }, 800);
    return interval;
  };

  const handleUpload = async () => {
    if (!file || !session) return;

    setStage("uploading");
    setUploadProgress(0);
    setErrorMsg("");

    // #region agent log
    const _dbgUpload = (msg, data) => {
      console.log(`[Upload] ${msg}`, data ?? "");
      fetch('http://127.0.0.1:7311/ingest/f5827246-f5c5-4bb6-9521-5c6a1f81f80c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c4c027'},body:JSON.stringify({sessionId:'c4c027',location:'UploadModal.js',message:msg,data:data??null,timestamp:Date.now()})}).catch(()=>{});
    };
    // #endregion

    try {
      // 1. Upload to Supabase Storage
      const ext = file.name.split(".").pop();
      const filePath = `${session.user.id}/${Date.now()}.${ext}`;

      // #region agent log
      _dbgUpload('Starting Supabase upload', { filePath, fileSize: file.size, fileType: file.type, userId: session.user.id });
      // #endregion

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((p) => Math.min(p + 15, 85));
      }, 200);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("swipes")
        .upload(filePath, file, { cacheControl: "3600", upsert: false });

      clearInterval(progressInterval);

      // #region agent log
      _dbgUpload('Supabase upload result', { error: uploadError ? { message: uploadError.message, status: uploadError.status, statusCode: uploadError.statusCode, error: uploadError.error } : null, data: uploadData ?? null });
      // #endregion

      if (uploadError) throw new Error(`[Storage] ${uploadError.message} (status: ${uploadError.statusCode ?? uploadError.status ?? 'unknown'})`);

      setUploadProgress(100);

      // 2. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("swipes")
        .getPublicUrl(filePath);

      // 3. Analyze with Gemini
      setStage("analyzing");
      setAnalysisStep(0);
      const stepInterval = cycleAnalysisSteps();

      let analysisResult = null;
      try {
        const raw = await analyzeMarketingImage(publicUrl);
        // Normalise to both old + new field names so the rest of the app works
        analysisResult = {
          // Legacy fields (used by DB columns)
          extracted_text: raw.extracted_text || "",
          marketing_formula: raw.formula_name || "Unknown",
          industry: raw.industry || "Unknown",
          emotional_hook: raw.primary_emotion || "Unknown",
          category: raw.category || "Other",
          // New rich fields
          hook: raw.hook || "",
          primary_emotion: raw.primary_emotion || "",
          target_audience: raw.target_audience || "",
          marketing_objective: raw.marketing_objective || "",
          formula_name: raw.formula_name || "",
          formula_explanation: raw.formula_explanation || "",
          why_it_works: raw.why_it_works || "",
          weakness: raw.weakness || "",
          how_to_adapt: raw.how_to_adapt || "",
          final_summary: raw.final_summary || "",
        };
      } catch (err) {
        console.warn("AI analysis failed:", err.message);
        analysisResult = {
          extracted_text: "AI analysis unavailable",
          marketing_formula: "Unknown",
          industry: "Unknown",
          emotional_hook: "Unknown",
          category: "Unknown",
        };
      } finally {
        clearInterval(stepInterval);
      }

      if (!category && analysisResult.category !== "Unknown") {
        setCategory(analysisResult.category);
      }

      setAnalysis({ ...analysisResult, publicUrl, filePath });
      setStage("complete");
    } catch (err) {
      console.error("Upload error:", err);
      setErrorMsg(err.message || "Upload failed. Please try again.");
      setStage("error");
    }
  };

  const handleSave = async () => {
    if (!analysis || !session) return;
    setIsSaving(true);

    try {
      // Store the full rich analysis as JSON in extracted_text so the detail modal can render it
      const fullAnalysisJson = JSON.stringify({
        extracted_text: analysis.extracted_text,
        hook: analysis.hook,
        primary_emotion: analysis.primary_emotion,
        target_audience: analysis.target_audience,
        marketing_objective: analysis.marketing_objective,
        formula_name: analysis.formula_name,
        formula_explanation: analysis.formula_explanation,
        why_it_works: analysis.why_it_works,
        weakness: analysis.weakness,
        how_to_adapt: analysis.how_to_adapt,
        final_summary: analysis.final_summary,
      });

      const { error } = await supabase.from("swipes").insert({
        user_id: session.user.id,
        image_url: analysis.publicUrl,
        file_path: analysis.filePath,
        extracted_text: fullAnalysisJson,
        marketing_formula: analysis.marketing_formula,
        industry: analysis.industry,
        emotional_hook: analysis.emotional_hook,
        category: category || analysis.category || "Other",
        title: title || "Untitled Swipe",
      });

      if (error) throw new Error(error.message);

      toast.success("Swipe saved to your library!");
      onUploadComplete({
        id: Date.now().toString(),
        user_id: session.user.id,
        image_url: analysis.publicUrl,
        file_path: analysis.filePath,
        extracted_text: analysis.extracted_text,
        marketing_formula: analysis.marketing_formula,
        industry: analysis.industry,
        emotional_hook: analysis.emotional_hook,
        category: category || analysis.category || "Other",
        title: title || "Untitled Swipe",
        created_at: new Date().toISOString(),
      });
      handleClose();
    } catch (err) {
      toast.error(`Failed to save: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-popover border border-border shadow-elevated max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Upload New Swipe
          </DialogTitle>
        </DialogHeader>

        {/* Limit warning */}
        {isAtLimit && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              You've reached the 15-upload free limit. Please upgrade to Pro to
              continue uploading.
            </span>
          </div>
        )}

        {/* Drop zone */}
        {stage === "idle" && (
          <div
            className={`dropzone flex flex-col items-center justify-center p-8 text-center mt-2 ${
              isDragOver ? "drag-over" : ""
            } ${isAtLimit ? "opacity-50 pointer-events-none" : ""}`}
            onClick={() => !isAtLimit && fileInputRef.current?.click()}
            onDrop={isAtLimit ? undefined : handleDrop}
            onDragOver={isAtLimit ? undefined : handleDragOver}
            onDragLeave={isAtLimit ? undefined : handleDragLeave}
          >
            {preview ? (
              <div className="relative w-full">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full max-h-48 object-contain rounded-lg"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setPreview(null);
                  }}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-secondary border border-border flex items-center justify-center mb-4">
                  <ImageIcon className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1.5">
                  Drop image here or{" "}
                  <span className="text-primary">browse files</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports JPG, PNG, WebP · Max 20MB
                </p>
              </>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => e.target.files[0] && selectFile(e.target.files[0])}
            />
          </div>
        )}

        {/* Uploading state */}
        {stage === "uploading" && (
          <div className="py-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
              <Upload className="w-6 h-6 text-primary animate-bounce" style={{ animationDuration: "1s" }} />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground mb-3">Uploading to cloud...</p>
              <Progress
                value={uploadProgress}
                className="h-1.5 bg-secondary"
              />
              <p className="text-xs text-muted-foreground mt-2">{uploadProgress}%</p>
            </div>
          </div>
        )}

        {/* Analyzing state */}
        {stage === "analyzing" && (
          <div className="py-8 text-center space-y-5">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 border-2 border-primary/20 rounded-full" />
              <div className="absolute inset-0 border-2 border-transparent border-t-primary rounded-full animate-spin" />
              <div className="absolute inset-2 bg-primary/10 rounded-full flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary animate-analysis-pulse" />
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground mb-1.5">
                AI is analyzing your image
              </p>
              <p className="text-xs text-primary animate-analysis-pulse">
                {ANALYSIS_STEPS[analysisStep]}
              </p>
            </div>
            <div className="flex justify-center gap-1.5">
              {ANALYSIS_STEPS.map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background:
                      i <= analysisStep
                        ? "hsl(var(--primary))"
                        : "hsl(var(--border))",
                    transition: "background 0.3s",
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Error state */}
        {stage === "error" && (
          <div className="py-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Upload failed</p>
              <p className="text-xs text-muted-foreground">{errorMsg}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStage("idle");
                setErrorMsg("");
              }}
              className="border-border text-foreground"
            >
              Try again
            </Button>
          </div>
        )}

        {/* Complete state - show analysis + title input */}
        {stage === "complete" && analysis && (
          <div className="space-y-4 mt-2">
            {/* Analysis results */}
            <div className="p-4 rounded-xl border border-border bg-secondary/50">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <p className="text-xs font-semibold text-success uppercase tracking-wide">
                  AI Analysis Complete
                </p>
              </div>
              <div className="space-y-2.5">
                {[
                  { icon: Brain, label: "Formula", value: analysis.marketing_formula, type: "formula" },
                  { icon: Tag, label: "Industry", value: analysis.industry },
                  { icon: Heart, label: "Hook", value: analysis.emotional_hook },
                  { icon: Layers, label: "Type", value: analysis.category },
                ].filter(item => item.value && item.value !== "Unknown").map(({ icon: Icon, label, value, type }) => (
                  <div key={label} className="flex items-center gap-2.5">
                    <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs text-muted-foreground w-14 flex-shrink-0">{label}</span>
                    {type === "formula" ? (
                      <span className={getFormulaClass(value)}>{value}</span>
                    ) : (
                      <span className="text-xs font-medium text-foreground">{value}</span>
                    )}
                  </div>
                ))}
                {analysis.extracted_text && analysis.extracted_text !== "Unknown" && (
                  <div className="flex gap-2.5 mt-1 pt-2 border-t border-border">
                    <FileText className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {analysis.extracted_text}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Title input */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give this swipe a memorable title"
                className="bg-input border-border text-foreground placeholder:text-muted-foreground h-9 text-sm"
              />
            </div>

            {/* Category select */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">
                Category{" "}
                <span className="text-muted-foreground font-normal">(optional override)</span>
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-input border-border text-foreground h-9 text-sm">
                  <SelectValue placeholder="AI-detected or choose manually" />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border">
                  {CATEGORIES.map((c) => (
                    <SelectItem
                      key={c}
                      value={c}
                      className="text-sm text-foreground focus:bg-secondary"
                    >
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Actions */}
            <div className="flex gap-2.5 pt-1">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1 border-border text-muted-foreground hover:text-foreground"
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                style={{ transition: "background 0.2s" }}
              >
                {isSaving ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Saving...
                  </div>
                ) : (
                  "Save to Library"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Analyze button (idle + file selected) */}
        {stage === "idle" && file && !isAtLimit && (
          <div className="mt-2">
            <Button
              onClick={handleUpload}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
              style={{ transition: "background 0.2s" }}
            >
              <Brain className="w-4 h-4" />
              Analyze with Gemini AI
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
