import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { RecipeCard } from "@/components/RecipeCard";
import { TabBar } from "@/components/TabBar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Recipe {
  id: string;
  title: string;
  image_url: string | null;
  prep_time_minutes: number;
  cook_time_minutes: number;
  nutritional_info: any;
}

const RECIPES_PER_PAGE = 12;

const Home = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [cuisineFilter, setCuisineFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecipes, setTotalRecipes] = useState(0);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, difficultyFilter, cuisineFilter]);

  useEffect(() => {
    fetchRecipes();
  }, [searchQuery, difficultyFilter, cuisineFilter, currentPage]);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      let countQuery = supabase
        .from("recipes")
        .select("*", { count: 'exact', head: true })
        .eq("is_public", true);

      let dataQuery = supabase
        .from("recipes")
        .select("*")
        .eq("is_public", true)
        .order("created_at", { ascending: false });

      if (searchQuery) {
        countQuery = countQuery.ilike("title", `%${searchQuery}%`);
        dataQuery = dataQuery.ilike("title", `%${searchQuery}%`);
      }

      if (difficultyFilter !== "all") {
        countQuery = countQuery.eq("difficulty", difficultyFilter);
        dataQuery = dataQuery.eq("difficulty", difficultyFilter);
      }

      if (cuisineFilter !== "all") {
        countQuery = countQuery.eq("cuisine_type", cuisineFilter);
        dataQuery = dataQuery.eq("cuisine_type", cuisineFilter);
      }

      const from = (currentPage - 1) * RECIPES_PER_PAGE;
      const to = from + RECIPES_PER_PAGE - 1;

      const [{ count }, { data, error }] = await Promise.all([
        countQuery,
        dataQuery.range(from, to)
      ]);

      if (error) throw error;
      setRecipes(data || []);
      setTotalRecipes(count || 0);
    } catch (error) {
      console.error("Error fetching recipes:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les recettes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalRecipes / RECIPES_PER_PAGE);
  const filteredRecipes = recipes;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="safe-top bg-card border-b border-border sticky top-0 z-40">
        <div className="px-4 py-4 space-y-4">
          <h1 className="text-2xl font-bold">Découvrir</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher une recette..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Difficulté" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="easy">Facile</SelectItem>
                <SelectItem value="medium">Moyen</SelectItem>
                <SelectItem value="hard">Difficile</SelectItem>
              </SelectContent>
            </Select>

            <Select value={cuisineFilter} onValueChange={setCuisineFilter}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Cuisine" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="française">Française</SelectItem>
                <SelectItem value="italienne">Italienne</SelectItem>
                <SelectItem value="asiatique">Asiatique</SelectItem>
                <SelectItem value="mexicaine">Mexicaine</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="recipe-card animate-pulse"
              >
                <div className="h-48 bg-muted" />
                <div className="p-4 space-y-2">
                  <div className="h-6 bg-muted rounded" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredRecipes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                id={recipe.id}
                title={recipe.title}
                imageUrl={recipe.image_url || undefined}
                prepTime={recipe.prep_time_minutes}
                cookTime={recipe.cook_time_minutes}
                calories={recipe.nutritional_info?.calories}
                onClick={() => navigate(`/recipe/${recipe.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchQuery
                ? "Aucune recette trouvée"
                : "Aucune recette disponible"}
            </p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="icon"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </main>

      <TabBar />
    </div>
  );
};

export default Home;
