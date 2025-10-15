import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { RecipeCard } from "@/components/RecipeCard";
import { TabBar } from "@/components/TabBar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Recipe {
  id: string;
  title: string;
  image_url: string | null;
  prep_time_minutes: number;
  cook_time_minutes: number;
  nutritional_info: any;
}

const Home = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setRecipes(data || []);
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

  const filteredRecipes = recipes.filter((recipe) =>
    recipe.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="safe-top bg-card border-b border-border sticky top-0 z-40">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold mb-4">Découvrir</h1>
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
      </main>

      <TabBar />
    </div>
  );
};

export default Home;
