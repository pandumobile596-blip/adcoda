import { Button } from "./ui/button";
import { Upload, Sparkles, Layers } from "lucide-react";

export const EmptyState = ({ onUpload, hasFilters }) => {
  if (hasFilters) {
    return (
      <div className="flex flex-col items-center justify-center py-24 fade-in">
        <div className="w-14 h-14 rounded-2xl bg-secondary border border-border flex items-center justify-center mb-5">
          <Layers className="w-6 h-6 text-muted-foreground" />
        </div>
        <h3 className="text-base font-display font-semibold text-foreground mb-2">
          No results found
        </h3>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          Try adjusting your search or filter to find what you&apos;re looking for.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 fade-in">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Upload className="w-9 h-9 text-primary" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
          <Sparkles className="w-3 h-3 text-primary" />
        </div>
      </div>
      <h3 className="text-lg font-display font-semibold text-foreground mb-2">
        Your swipe file is empty
      </h3>
      <p className="text-sm text-muted-foreground text-center max-w-xs mb-6">
        Upload your first marketing image to start building your AI-analyzed
        swipe file library.
      </p>
      <Button
        onClick={onUpload}
        className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
        style={{ transition: "background 0.2s" }}
      >
        <Upload className="w-4 h-4" />
        Upload first swipe
      </Button>
    </div>
  );
};
