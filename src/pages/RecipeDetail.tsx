import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Clock, Flame, Users, ChefHat, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const RecipeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [recipe, setRecipe] = useState<any>(null);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [steps, setSteps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecipe();
  }, [id]);

  const fetchRecipe = async () => {
    try {
      const { data: recipeData, error: recipeError } = await supabase
        .from("recipes")
        .select("*")
        .eq("id", id)
        .single();

      if (recipeError) throw recipeError;

      const { data: ingredientsData } = await supabase
        .from("recipe_ingredients")
        .select("*")
        .eq("recipe_id", id)
        .order("order_index");

      const { data: stepsData } = await supabase
        .from("recipe_steps")
        .select("*")
        .eq("recipe_id", id)
        .order("step_number");

      setRecipe(recipeData);
      setIngredients(ingredientsData || []);
      setSteps(stepsData || []);
    } catch (error) {
      console.error("Error fetching recipe:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger la recette",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ChefHat className="h-12 w-12 text-primary animate-pulse" />
      </div>
    );
  }

  if (!recipe) return null;

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="relative h-64 bg-muted">
        {recipe.image_url && (
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
        )}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 bg-card/80 backdrop-blur-sm"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      <div className="px-4 py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">{recipe.title}</h1>
          <p className="text-muted-foreground">{recipe.description}</p>
        </div>

        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{recipe.prep_time_minutes + recipe.cook_time_minutes} min</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>{recipe.servings} portions</span>
          </div>
          {recipe.nutritional_info?.calories && (
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4" />
              <span>{recipe.nutritional_info.calories} kcal</span>
            </div>
          )}
        </div>

        <Tabs defaultValue="ingredients">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ingredients">Ingrédients</TabsTrigger>
            <TabsTrigger value="steps">Instructions</TabsTrigger>
          </TabsList>

          <TabsContent value="ingredients" className="space-y-2">
            {ingredients.map((ing) => (
              <div key={ing.id} className="flex items-center gap-2">
                <Checkbox />
                <span>
                  {ing.quantity} {ing.unit} {ing.name}
                </span>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="steps" className="space-y-4">
            {steps.map((step) => (
              <div key={step.id} className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  {step.step_number}
                </div>
                <p className="flex-1 pt-1">{step.instruction}</p>
              </div>
            ))}
          </TabsContent>
        </Tabs>

        {recipe.chef_tip && (
          <div className="glass-card p-4 rounded-xl">
            <div className="flex items-start gap-3">
              <ChefHat className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold mb-1">Conseil du Chef</h3>
                <p className="text-sm text-muted-foreground">{recipe.chef_tip}</p>
              </div>
            </div>
          </div>
        )}

        <Button
          className="w-full btn-hero"
          size="lg"
          onClick={() => navigate(`/cooking/${id}`)}
        >
          Passer en Mode Cuisine
        </Button>
      </div>
    </div>
  );
};

export default RecipeDetail;
