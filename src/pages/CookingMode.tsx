import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, X, CheckCircle2, ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const CookingMode = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [recipe, setRecipe] = useState<any>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
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

      const { data: stepsData } = await supabase
        .from("recipe_steps")
        .select("*")
        .eq("recipe_id", id)
        .order("step_number");

      const { data: ingredientsData } = await supabase
        .from("recipe_ingredients")
        .select("*")
        .eq("recipe_id", id)
        .order("order_index");

      setRecipe(recipeData);
      setSteps(stepsData || []);
      setIngredients(ingredientsData || []);
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

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCompletedSteps(new Set(completedSteps).add(currentStep));
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setCompletedSteps(new Set(completedSteps).add(currentStep));
    toast({
      title: "Félicitations ! 🎉",
      description: "Vous avez terminé cette recette",
    });
  };

  const progress = steps.length > 0 ? ((completedSteps.size + 1) / steps.length) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <ChefHat className="h-12 w-12 text-primary animate-pulse" />
      </div>
    );
  }

  if (!recipe || steps.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Aucune étape disponible</p>
          <Button onClick={() => navigate(-1)}>Retour</Button>
        </div>
      </div>
    );
  }

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const allStepsCompleted = completedSteps.size === steps.length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="glass-card sticky top-0 z-10 p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <X className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold flex-1 text-center mx-4 truncate">
            {recipe.title}
          </h1>
          <div className="w-10" />
        </div>
        <Progress value={progress} className="h-2" />
        <p className="text-sm text-muted-foreground text-center mt-2">
          Étape {currentStep + 1} sur {steps.length}
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-6 overflow-auto">
        {/* Step Number Badge */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold shadow-lg">
            {currentStepData.step_number}
          </div>
        </div>

        {/* Step Instruction */}
        <div className="flex-1 flex items-center justify-center">
          <p className="text-2xl text-center leading-relaxed max-w-2xl">
            {currentStepData.instruction}
          </p>
        </div>

        {/* Chef Tip for current step if exists */}
        {currentStep === 0 && recipe.chef_tip && (
          <div className="glass-card p-4 rounded-xl mt-6">
            <div className="flex items-start gap-3">
              <ChefHat className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold mb-1">Conseil du Chef</h3>
                <p className="text-sm text-muted-foreground">{recipe.chef_tip}</p>
              </div>
            </div>
          </div>
        )}

        {/* Ingredients reminder on first step */}
        {currentStep === 0 && ingredients.length > 0 && (
          <div className="glass-card p-4 rounded-xl mt-4">
            <h3 className="font-semibold mb-3">Ingrédients nécessaires</h3>
            <div className="space-y-2 text-sm">
              {ingredients.map((ing) => (
                <div key={ing.id} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>
                    {ing.quantity} {ing.unit} {ing.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="glass-card p-6 border-t space-y-3">
        {!allStepsCompleted && isLastStep && (
          <Button
            className="w-full btn-hero"
            size="lg"
            onClick={handleComplete}
          >
            <CheckCircle2 className="mr-2 h-5 w-5" />
            Terminer la Recette
          </Button>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="mr-2 h-5 w-5" />
            Précédent
          </Button>
          <Button
            variant="default"
            size="lg"
            onClick={handleNext}
            disabled={isLastStep}
          >
            Suivant
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CookingMode;
