import { Clock, Flame, Heart } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RecipeCardProps {
  id: string;
  title: string;
  imageUrl?: string;
  prepTime: number;
  cookTime: number;
  calories?: number;
  isFavorite?: boolean;
  onClick?: () => void;
}

export const RecipeCard = ({
  id,
  title,
  imageUrl,
  prepTime,
  cookTime,
  calories,
  isFavorite: initialFavorite = false,
  onClick,
}: RecipeCardProps) => {
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const { toast } = useToast();
  const totalTime = prepTime + cookTime;

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Connexion requise",
          description: "Veuillez vous connecter pour sauvegarder des recettes",
          variant: "destructive",
        });
        return;
      }

      if (isFavorite) {
        await supabase
          .from("user_favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("recipe_id", id);
        setIsFavorite(false);
        toast({ title: "Recette retirée des favoris" });
      } else {
        await supabase
          .from("user_favorites")
          .insert({ user_id: user.id, recipe_id: id });
        setIsFavorite(true);
        toast({ title: "Recette ajoutée aux favoris" });
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier les favoris",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="recipe-card cursor-pointer" onClick={onClick}>
      <div className="relative h-48 bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Flame className="h-12 w-12" />
          </div>
        )}
        <button
          onClick={handleFavoriteClick}
          className="absolute top-2 right-2 p-2 rounded-full bg-card/90 backdrop-blur-sm hover:scale-110 transition-transform"
        >
          <Heart
            className={`h-5 w-5 ${
              isFavorite ? "fill-primary text-primary" : "text-muted-foreground"
            }`}
          />
        </button>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">{title}</h3>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{totalTime} min</span>
          </div>
          {calories && (
            <div className="flex items-center gap-1">
              <Flame className="h-4 w-4" />
              <span>{calories} kcal</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
