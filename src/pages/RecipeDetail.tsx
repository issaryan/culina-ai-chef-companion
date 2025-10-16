import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Clock, Flame, Users, ChefHat, ArrowLeft, Globe, Lock, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const commentSchema = z.object({
  comment: z.string().trim().min(1, "Le commentaire ne peut pas être vide").max(500, "Le commentaire doit faire moins de 500 caractères")
});

const RecipeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [recipe, setRecipe] = useState<any>(null);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [steps, setSteps] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isTogglingPublic, setIsTogglingPublic] = useState(false);

  useEffect(() => {
    fetchRecipe();
    fetchComments();
    getCurrentUser();
  }, [id]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

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

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from("recipe_comments")
        .select(`
          *,
          profiles:user_id (full_name, email)
        `)
        .eq("recipe_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const handleSubmitComment = async () => {
    if (!currentUser) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour commenter",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    try {
      const validated = commentSchema.parse({ comment: newComment });
      setIsSubmittingComment(true);

      const { error } = await supabase
        .from("recipe_comments")
        .insert({
          recipe_id: id,
          user_id: currentUser.id,
          comment: validated.comment,
        });

      if (error) throw error;

      setNewComment("");
      fetchComments();
      toast({
        title: "Commentaire ajouté",
        description: "Votre commentaire a été publié",
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Erreur de validation",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de publier le commentaire",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleTogglePublic = async () => {
    if (!currentUser || recipe.user_id !== currentUser.id) {
      toast({
        title: "Non autorisé",
        description: "Seul le créateur peut publier cette recette",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsTogglingPublic(true);
      const { error } = await supabase
        .from("recipes")
        .update({ is_public: !recipe.is_public })
        .eq("id", id);

      if (error) throw error;

      setRecipe({ ...recipe, is_public: !recipe.is_public });
      toast({
        title: recipe.is_public ? "Recette privée" : "Recette publique",
        description: recipe.is_public 
          ? "Votre recette est maintenant privée" 
          : "Votre recette est maintenant visible par tous",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier la visibilité",
        variant: "destructive",
      });
    } finally {
      setIsTogglingPublic(false);
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

  const isOwner = currentUser && recipe?.user_id === currentUser.id;

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
        {isOwner && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 bg-card/80 backdrop-blur-sm"
            onClick={handleTogglePublic}
            disabled={isTogglingPublic}
          >
            {recipe.is_public ? (
              <Globe className="h-5 w-5 text-primary" />
            ) : (
              <Lock className="h-5 w-5" />
            )}
          </Button>
        )}
      </div>

      <div className="px-4 py-6 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold">{recipe.title}</h1>
            {recipe.is_public && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full flex items-center gap-1">
                <Globe className="h-3 w-3" />
                Public
              </span>
            )}
          </div>
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ingredients">Ingrédients</TabsTrigger>
            <TabsTrigger value="steps">Instructions</TabsTrigger>
            <TabsTrigger value="comments">
              Commentaires ({comments.length})
            </TabsTrigger>
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

          <TabsContent value="comments" className="space-y-4">
            {recipe.is_public ? (
              <>
                {currentUser && (
                  <Card className="p-4">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Partagez votre avis sur cette recette..."
                      className="mb-3"
                      maxLength={500}
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        {newComment.length}/500
                      </span>
                      <Button
                        onClick={handleSubmitComment}
                        disabled={!newComment.trim() || isSubmittingComment}
                        size="sm"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Publier
                      </Button>
                    </div>
                  </Card>
                )}

                {comments.length > 0 ? (
                  <div className="space-y-3">
                    {comments.map((comment) => (
                      <Card key={comment.id} className="p-4">
                        <div className="flex gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {comment.profiles?.full_name?.[0] || 
                               comment.profiles?.email?.[0]?.toUpperCase() || 
                               "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-sm">
                                {comment.profiles?.full_name || "Utilisateur"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(comment.created_at).toLocaleDateString("fr-FR")}
                              </span>
                            </div>
                            <p className="text-sm">{comment.comment}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Aucun commentaire pour le moment.</p>
                    {currentUser && <p className="text-sm">Soyez le premier à commenter !</p>}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Lock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Les commentaires sont disponibles uniquement sur les recettes publiques.</p>
                {isOwner && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={handleTogglePublic}
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    Rendre cette recette publique
                  </Button>
                )}
              </div>
            )}
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
