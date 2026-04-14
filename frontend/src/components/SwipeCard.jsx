import { useState } from "react";
import { Button } from "./ui/button";
import { Trash2, Eye } from "lucide-react";

const getFormulaClass = (formula) => {
  if (!formula) return "formula-badge formula-other";
  const f = formula.toUpperCase();
  if (f.includes("AIDA")) return "formula-badge formula-aida";
  if (f.includes("PAS")) return "formula-badge formula-pas";
  if (f.includes("BAB")) return "formula-badge formula-bab";
  if (f.includes("FAB")) return "formula-badge formula-fab";
  if (f.includes("PPPP") || f.includes("4P")) return "formula-badge formula-pppp";
  if (f.includes("4PS")) return "formula-badge formula-4ps";
  return "formula-badge formula-other";
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export const SwipeCard = ({ swipe, index, onView, onDelete }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="masonry-item card-animate"
      style={{ animationDelay: `${Math.min(index * 0.04, 0.5)}s` }}
    >
      <div
        className="swipe-card rounded-xl overflow-hidden bg-card cursor-pointer group relative"
        onClick={() => onView(swipe)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image area */}
        <div className="relative overflow-hidden bg-muted">
          {/* Skeleton loader */}
          {!imgLoaded && !imgError && (
            <div className="absolute inset-0 animate-shimmer" style={{ minHeight: "160px" }} />
          )}

          {imgError ? (
            <div
              className="flex items-center justify-center bg-secondary text-muted-foreground text-xs"
              style={{ minHeight: "160px" }}
            >
              Image unavailable
            </div>
          ) : (
            <img
              src={swipe.image_url}
              alt={swipe.title || "Swipe"}
              className="w-full object-cover block"
              style={{
                opacity: imgLoaded ? 1 : 0,
                transition: "opacity 0.3s ease",
              }}
              onLoad={() => setImgLoaded(true)}
              onError={() => {
                setImgLoaded(true);
                setImgError(true);
              }}
              loading="lazy"
            />
          )}

          {/* Hover overlay */}
          <div
            className="absolute inset-0 flex items-end justify-end p-2 gap-1.5"
            style={{
              background: "linear-gradient(to top, hsl(224 71% 4% / 0.85) 0%, transparent 50%)",
              opacity: isHovered ? 1 : 0,
              transition: "opacity 0.2s",
            }}
          >
            <Button
              size="icon"
              variant="secondary"
              className="w-7 h-7 bg-background/80 border border-border hover:bg-background"
              onClick={(e) => {
                e.stopPropagation();
                onView(swipe);
              }}
            >
              <Eye className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="w-7 h-7 bg-destructive/80 border border-destructive/50 hover:bg-destructive text-destructive-foreground"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(swipe.id);
              }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Formula badge (top left) */}
          {swipe.marketing_formula &&
            swipe.marketing_formula !== "Unknown" && (
              <div className="absolute top-2 left-2">
                <span className={getFormulaClass(swipe.marketing_formula)}>
                  {swipe.marketing_formula}
                </span>
              </div>
            )}
        </div>

        {/* Card body */}
        <div className="p-3.5">
          <h3 className="text-sm font-display font-semibold text-foreground truncate leading-snug">
            {swipe.title || "Untitled Swipe"}
          </h3>

          <div className="flex flex-wrap gap-1.5 mt-2">
            {swipe.industry && swipe.industry !== "Unknown" && (
              <span className="tag-chip">{swipe.industry}</span>
            )}
            {swipe.category && swipe.category !== "Unknown" && (
              <span className="tag-chip">{swipe.category}</span>
            )}
          </div>

          {swipe.emotional_hook && swipe.emotional_hook !== "Unknown" && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
              <span className="text-muted-foreground/60">Hook:</span>{" "}
              {swipe.emotional_hook}
            </p>
          )}

          <p className="text-xs text-muted-foreground/50 mt-2">
            {formatDate(swipe.created_at)}
          </p>
        </div>
      </div>
    </div>
  );
};
