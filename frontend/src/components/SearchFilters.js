import { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Search, X, ChevronDown, SlidersHorizontal } from "lucide-react";

const CATEGORIES = [
  "All",
  "Social Ad",
  "Email Newsletter",
  "Landing Page",
  "Banner Ad",
  "Print Ad",
  "Video Script",
  "Sales Page",
];

const FORMULAS = [
  "All Formulas",
  "AIDA",
  "PAS",
  "BAB",
  "FAB",
  "PPPP",
  "4Ps",
  "Other",
];

const SORT_OPTIONS = [
  { label: "Newest first", value: "newest" },
  { label: "Oldest first", value: "oldest" },
];

export const SearchFilters = ({
  searchTerm,
  onSearch,
  selectedCategory,
  onCategoryChange,
  selectedFormula,
  onFormulaChange,
  sortOrder,
  onSortChange,
  total,
}) => {
  const [focused, setFocused] = useState(false);

  const hasActiveFilters =
    searchTerm || selectedCategory !== "All" || selectedFormula !== "All Formulas";

  const clearAll = () => {
    onSearch("");
    onCategoryChange("All");
    onFormulaChange("All Formulas");
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Top row: Search + Sort */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div
          className="relative flex-1 max-w-md"
          style={{
            filter: focused ? "drop-shadow(0 0 12px hsl(243 75% 59% / 0.15))" : "none",
            transition: "filter 0.2s",
          }}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search by title, formula, industry..."
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="pl-9 pr-8 h-9 bg-secondary border-border text-sm text-foreground placeholder:text-muted-foreground"
          />
          {searchTerm && (
            <button
              onClick={() => onSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              style={{ transition: "color 0.15s" }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 border-border bg-secondary text-muted-foreground hover:text-foreground gap-1.5 text-xs"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {sortOrder === "newest" ? "Newest" : "Oldest"}
              </span>
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-popover border border-border shadow-elevated w-36"
          >
            {SORT_OPTIONS.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => onSortChange(opt.value)}
                className={`text-sm cursor-pointer ${
                  sortOrder === opt.value
                    ? "text-primary font-medium"
                    : "text-muted-foreground"
                } focus:bg-secondary focus:text-foreground`}
              >
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Result count */}
        {typeof total === "number" && (
          <span className="text-xs text-muted-foreground hidden md:block">
            {total} {total === 1 ? "swipe" : "swipes"}
          </span>
        )}

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            style={{ transition: "color 0.15s" }}
          >
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {/* Category filter chips */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border ${
              selectedCategory === cat
                ? "bg-primary/10 border-primary/30 text-primary"
                : "bg-secondary border-border text-muted-foreground hover:text-foreground hover:border-border"
            }`}
            style={{ transition: "background 0.15s, color 0.15s, border-color 0.15s" }}
          >
            {cat}
          </button>
        ))}

        <div className="w-px h-6 bg-border self-center mx-1" />

        {/* Formula filter chips */}
        {FORMULAS.slice(1).map((formula) => (
          <button
            key={formula}
            onClick={() =>
              onFormulaChange(
                selectedFormula === formula ? "All Formulas" : formula
              )
            }
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border uppercase tracking-wide formula-badge ${
              selectedFormula === formula
                ? `formula-${formula.toLowerCase()}`
                : "bg-secondary border-border text-muted-foreground hover:text-foreground"
            }`}
            style={{ transition: "background 0.15s, color 0.15s, border-color 0.15s" }}
          >
            {formula}
          </button>
        ))}
      </div>
    </div>
  );
};
