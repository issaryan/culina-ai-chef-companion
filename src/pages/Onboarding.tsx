import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChefHat, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const DIETARY_OPTIONS = [
  "Végétarien",
  "Végétalien",
  "Sans gluten",
  "Sans lactose",
  "Keto",
  "Paleo",
  "Halal",
  "Casher",
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedDiets, setSelectedDiets] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [allergyInput, setAllergyInput] = useState("");

  const toggleDiet = (diet: string) => {
    setSelectedDiets((prev) =>
      prev.includes(diet) ? prev.filter((d) => d !== diet) : [...prev, diet]
    );
  };

  const addAllergy = () => {
    if (allergyInput.trim() && !allergies.includes(allergyInput.trim())) {
      setAllergies([...allergies, allergyInput.trim()]);
      setAllergyInput("");
    }
  };

  const removeAllergy = (allergy: string) => {
    setAllergies(allergies.filter((a) => a !== allergy));
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      const { error } = await supabase.from("user_preferences").insert({
        user_id: user.id,
        dietary_restrictions: selectedDiets,
        allergies: allergies,
      });

      if (error) throw error;

      toast({ title: "Préférences enregistrées !" });
      navigate("/home");
    } catch (error: any) {
      console.error("Error saving preferences:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer vos préférences",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 animate-fade-in-up">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <ChefHat className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Dites-nous en plus sur vous</h1>
          <p className="text-muted-foreground">
            Personnalisez vos recommandations
          </p>
        </div>

        <div className="glass-card p-6 rounded-2xl space-y-6">
          {/* Dietary Restrictions */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              Régimes alimentaires
            </Label>
            <div className="flex flex-wrap gap-2">
              {DIETARY_OPTIONS.map((diet) => (
                <Badge
                  key={diet}
                  variant={
                    selectedDiets.includes(diet) ? "default" : "outline"
                  }
                  className="cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => toggleDiet(diet)}
                >
                  {diet}
                </Badge>
              ))}
            </div>
          </div>

          {/* Allergies */}
          <div className="space-y-3">
            <Label htmlFor="allergy" className="text-base font-semibold">
              Allergies
            </Label>
            <div className="flex gap-2">
              <Input
                id="allergy"
                value={allergyInput}
                onChange={(e) => setAllergyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addAllergy();
                  }
                }}
                placeholder="Ex: Arachides, Fruits de mer..."
              />
              <Button
                type="button"
                onClick={addAllergy}
                disabled={!allergyInput.trim()}
              >
                Ajouter
              </Button>
            </div>

            {allergies.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {allergies.map((allergy) => (
                  <Badge
                    key={allergy}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {allergy}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeAllergy(allergy)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Button
            onClick={handleSubmit}
            className="w-full btn-hero"
            disabled={loading}
            size="lg"
          >
            {loading ? "Enregistrement..." : "Commencer à cuisiner"}
          </Button>

          <Button
            onClick={() => navigate("/home")}
            variant="ghost"
            className="w-full"
          >
            Passer cette étape
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
