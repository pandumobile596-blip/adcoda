import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { Navbar } from "../components/Navbar";
import { UploadModal } from "../components/UploadModal";
import { MasonryGrid } from "../components/MasonryGrid";
import { SearchFilters } from "../components/SearchFilters";
import { EmptyState } from "../components/EmptyState";
import { ProUpgradeBanner } from "../components/ProUpgradeBanner";
import { SwipeDetailModal } from "../components/SwipeDetailModal";
import { Skeleton } from "../components/ui/skeleton";
import { Button } from "../components/ui/button";
import {
  Zap,
  Layers,
  Brain,
  Building2,
} from "lucide-react";
import { toast } from "sonner";

const MOCK_SWIPES = [
  {
    id: "demo-1",
    user_id: "demo-user-id",
    image_url: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400&q=80",
    title: "Dropbox — Simplicity Ad",
    marketing_formula: "AIDA",
    industry: "SaaS",
    emotional_hook: "Simplicity & Ease",
    category: "Banner Ad",
    extracted_text: "Access your files anywhere. Try Dropbox for free.",
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "demo-2",
    user_id: "demo-user-id",
    image_url: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&q=80",
    title: "Nike — Just Do It Campaign",
    marketing_formula: "PAS",
    industry: "Fashion & Apparel",
    emotional_hook: "Aspirational Identity",
    category: "Social Ad",
    extracted_text: "Stop hesitating. Just do it. Your potential is limitless.",
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: "demo-3",
    user_id: "demo-user-id",
    image_url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80",
    title: "Shopify — Start Selling",
    marketing_formula: "BAB",
    industry: "E-commerce",
    emotional_hook: "FOMO",
    category: "Landing Page",
    extracted_text: "Before: struggling with sales. After: 3x your revenue. Join 1M+ merchants.",
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  {
    id: "demo-4",
    user_id: "demo-user-id",
    image_url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80",
    title: "Peloton — Transform Your Body",
    marketing_formula: "PAS",
    industry: "Health & Wellness",
    emotional_hook: "Transformation",
    category: "Social Ad",
    extracted_text: "Feeling stuck in your fitness routine? Peloton changes everything. 14-day free trial.",
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    id: "demo-5",
    user_id: "demo-user-id",
    image_url: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&q=80",
    title: "Stripe — Payments Infrastructure",
    marketing_formula: "FAB",
    industry: "Fintech",
    emotional_hook: "Trust & Authority",
    category: "Landing Page",
    extracted_text: "Millions of businesses use Stripe. Accept payments online. Start for free.",
    created_at: new Date(Date.now() - 86400000 * 14).toISOString(),
  },
  {
    id: "demo-6",
    user_id: "demo-user-id",
    image_url: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&q=80",
    title: "Headspace — Calm Your Mind",
    marketing_formula: "BAB",
    industry: "Health & Wellness",
    emotional_hook: "Pain Point Relief",
    category: "Email Newsletter",
    extracted_text: "Overwhelmed? Anxiety keeping you up? Headspace guided meditations. Try free 30 days.",
    created_at: new Date(Date.now() - 86400000 * 18).toISOString(),
];

const StatCard = ({ icon: Icon, label, value, accent }) => (
  <div className="p-4 rounded-xl border border-border bg-card flex items-center gap-3">
    <div
      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
      style={{
        background: accent ? "hsl(var(--primary) / 0.1)" : "hsl(var(--secondary))",
        border: accent
          ? "1px solid hsl(var(--primary) / 0.2)"
          : "1px solid hsl(var(--border))",
      }}
    >
      <Icon
        className="w-4 h-4"
        style={{ color: accent ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}
      />
    </div>
    <div>
      <p className="text-xl font-display font-bold text-foreground leading-none">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  </div>
);

const LoadingSkeleton = () => (
  <div className="masonry-grid">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="masonry-item">
        <div className="rounded-xl overflow-hidden border border-border bg-card">
          <Skeleton
            className="w-full animate-shimmer"
            style={{ height: `${140 + (i % 4) * 40}px` }}
          />
          <div className="p-3.5 space-y-2">
            <Skeleton className="h-4 w-3/4 animate-shimmer" />
            <Skeleton className="h-3 w-1/2 animate-shimmer" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default function Dashboard({ session }) {
  const isDemoMode = session?.isDemo === true;
  const [swipes, setSwipes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedSwipe, setSelectedSwipe] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedFormula, setSelectedFormula] = useState("All Formulas");
  const [sortOrder, setSortOrder] = useState("newest");
  const [isPro] = useState(false); // Pro status — extend later with Stripe

  const fetchSwipes = useCallback(async () => {
    setIsLoading(true);

    // Use mock data in demo mode
    if (isDemoMode) {
      await new Promise((r) => setTimeout(r, 800));
      setSwipes(MOCK_SWIPES);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("swipes")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: sortOrder === "oldest" });

      if (error) {
        toast.error(`Failed to load swipes: ${error.message}`);
        setSwipes([]);
        return;
      }

      setSwipes(data || []);
    } catch (err) {
      toast.error("Connection error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [session.user.id, sortOrder]);

  useEffect(() => {
    fetchSwipes();
  }, [fetchSwipes]);

  const handleDelete = async (swipeId) => {
    // Demo mode - just remove from local state
    if (isDemoMode) {
      setSwipes((prev) => prev.filter((s) => s.id !== swipeId));
      if (selectedSwipe?.id === swipeId) setSelectedSwipe(null);
      toast.success("Swipe removed (demo mode)");
      return;
    }

    const swipe = swipes.find((s) => s.id === swipeId);
    if (!swipe) return;

    try {
      // Delete from DB
      const { error } = await supabase
        .from("swipes")
        .delete()
        .eq("id", swipeId);

      if (error) throw new Error(error.message);

      // Delete from storage
      if (swipe.file_path) {
        await supabase.storage.from("swipes").remove([swipe.file_path]);
      }

      setSwipes((prev) => prev.filter((s) => s.id !== swipeId));
      if (selectedSwipe?.id === swipeId) setSelectedSwipe(null);
      toast.success("Swipe deleted");
    } catch (err) {
      toast.error(`Delete failed: ${err.message}`);
    }
  };

  const handleUploadComplete = (newSwipe) => {
    setSwipes((prev) =>
      sortOrder === "newest" ? [newSwipe, ...prev] : [...prev, newSwipe]
    );
  };

  // Filter + search
  const filteredSwipes = swipes.filter((swipe) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      (swipe.title || "").toLowerCase().includes(search) ||
      (swipe.marketing_formula || "").toLowerCase().includes(search) ||
      (swipe.industry || "").toLowerCase().includes(search) ||
      (swipe.emotional_hook || "").toLowerCase().includes(search) ||
      (swipe.extracted_text || "").toLowerCase().includes(search);

    const matchesCategory =
      selectedCategory === "All" ||
      (swipe.category || "")
        .toLowerCase()
        .includes(selectedCategory.toLowerCase());

    const matchesFormula =
      selectedFormula === "All Formulas" ||
      (swipe.marketing_formula || "")
        .toUpperCase()
        .includes(selectedFormula.toUpperCase());

    return matchesSearch && matchesCategory && matchesFormula;
  });

  const uploadCount = swipes.length;
  const uniqueFormulas = [
    ...new Set(
      swipes
        .map((s) => s.marketing_formula)
        .filter((f) => f && f !== "Unknown")
    ),
  ].length;
  const uniqueIndustries = [
    ...new Set(
      swipes.map((s) => s.industry).filter((i) => i && i !== "Unknown")
    ),
  ].length;
  const freeLeft = Math.max(0, 15 - uploadCount);

  const hasFilters =
    !!searchTerm ||
    selectedCategory !== "All" ||
    selectedFormula !== "All Formulas";

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        session={session}
        uploadCount={uploadCount}
        isPro={isPro}
        onUpload={() => setShowUpload(true)}
        onUpgrade={() => {}}
      />

      <main className="max-w-screen-2xl mx-auto px-4 md:px-6 py-8">
        {/* Page header */}
        <div className="mb-8 slide-up">
          <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">
            Swipe Library
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {swipes.length > 0
              ? `${swipes.length} marketing ${swipes.length === 1 ? "asset" : "assets"} analyzed`
              : "Upload marketing materials to start building your AI-analyzed library"}
          </p>
        </div>

        {/* Demo mode banner */}
        {isDemoMode && (
          <div className="mb-6 p-3 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-primary">Preview mode</span>{" "}
              — You're viewing AdCoda with demo data. Sign up to start your real swipe library.
            </p>
            <a href="/" className="text-xs font-medium text-primary hover:underline flex-shrink-0">
              Sign up free →
            </a>
          </div>
        )}

        {/* Setup banner - removed as user has already run SQL */}

        {/* Pro upgrade banner */}
        {!isPro && swipes.length > 0 && (
          <ProUpgradeBanner uploadCount={uploadCount} />
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8 fade-in">
            <StatCard
              icon={Layers}
              label="Total Swipes"
              value={uploadCount}
              accent
            />
            <StatCard
              icon={Brain}
              label="Formulas Found"
              value={uniqueFormulas}
            />
            <StatCard
              icon={Building2}
              label="Industries"
              value={uniqueIndustries}
            />
            <StatCard
              icon={Zap}
              label={isPro ? "Unlimited" : "Free Slots Left"}
              value={isPro ? "∞" : freeLeft}
              accent={!isPro && freeLeft <= 3}
            />
          </div>

        {/* Search + filters */}
        {swipes.length > 0 && (
          <SearchFilters
            searchTerm={searchTerm}
            onSearch={setSearchTerm}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedFormula={selectedFormula}
            onFormulaChange={setSelectedFormula}
            sortOrder={sortOrder}
            onSortChange={setSortOrder}
            total={filteredSwipes.length}
          />
        )}

        {/* Content area */}
        {isLoading ? (
          <LoadingSkeleton />
        ) : filteredSwipes.length === 0 ? (
          <EmptyState
            onUpload={() => setShowUpload(true)}
            hasFilters={hasFilters}
          />
        ) : (
          <MasonryGrid
            swipes={filteredSwipes}
            onView={setSelectedSwipe}
            onDelete={handleDelete}
          />
        )}
      </main>

      {/* Modals */}
      <UploadModal
        open={showUpload}
        onClose={() => setShowUpload(false)}
        session={session}
        onUploadComplete={handleUploadComplete}
        uploadCount={uploadCount}
      />

      <SwipeDetailModal
        swipe={selectedSwipe}
        open={!!selectedSwipe}
        onClose={() => setSelectedSwipe(null)}
      />
    </div>
  );
}
