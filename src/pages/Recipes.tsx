import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RecipeCard } from "@/components/RecipeCard";
import { TabBar } from "@/components/TabBar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Recipe {
  id: string;
  title: string;
  image_url: string | null;
  prep_time_minutes: number;
  cook_time_minutes: number;
  nutritional_info: any;
}

const Recipes = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [myCreations, setMyCreations] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    fetchUserRecipes();
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("user_subscription")
        .select("*")
        .eq("user_id", user.id)
        .single();

      setSubscription(data);
    } catch (error) {
      console.error("Error fetching subscription:", error);
    }
  };

  const fetchUserRecipes = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Fetch favorites
      const { data: favData, error: favError } = await supabase
        .from("user_favorites")
        .select("recipe_id, recipes(*)")
        .eq("user_id", user.id);

      if (favError) throw favError;

      const favRecipes = favData
        ?.map((f: any) => f.recipes)
        .filter(Boolean) as Recipe[];
      setFavorites(favRecipes || []);

      // Fetch user's created recipes
      const { data: createdData, error: createdError } = await supabase
        .from("recipes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (createdError) throw createdError;
      setMyCreations(createdData || []);
    } catch (error) {
      console.error("Error fetching recipes:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos recettes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const showFavoritesLimit =
    subscription?.subscription_tier === "free" && favorites.length >= 10;

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="safe-top bg-card border-b border-border px-4 py-4">
        <h1 className="text-2xl font-bold">Mes Recettes</h1>
      </header>

      <main className="px-4 py-6">
        {showFavoritesLimit && (
          <Alert className="mb-4 border-primary">
            <Crown className="h-4 w-4 text-primary" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                Vous avez atteint votre limite de 10 recettes sauvegardées.
              </span>
              <Button
                size="sm"
                className="btn-hero"
                onClick={() => navigate("/paywall")}
              >
                Passer à Pro
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="favorites" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="favorites">
              Favoris ({favorites.length})
            </TabsTrigger>
            <TabsTrigger value="created">
              Mes Créations ({myCreations.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="favorites" className="mt-6">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="recipe-card animate-pulse">
                    <div className="h-48 bg-muted" />
                    <div className="p-4 space-y-2">
                      <div className="h-6 bg-muted rounded" />
                      <div className="h-4 bg-muted rounded w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : favorites.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {favorites.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    id={recipe.id}
                    title={recipe.title}
                    imageUrl={recipe.image_url || undefined}
                    prepTime={recipe.prep_time_minutes}
                    cookTime={recipe.cook_time_minutes}
                    calories={recipe.nutritional_info?.calories}
                    isFavorite={true}
                    onClick={() => navigate(`/recipe/${recipe.id}`)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Aucune recette favorite. Commencez à explorer !
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="created" className="mt-6">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="recipe-card animate-pulse">
                    <div className="h-48 bg-muted" />
                    <div className="p-4 space-y-2">
                      <div className="h-6 bg-muted rounded" />
                      <div className="h-4 bg-muted rounded w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : myCreations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myCreations.map((recipe) => (
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
                  Aucune recette créée. Essayez Culina AI !
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <TabBar />
    </div>
  );
};

export default Recipes;
