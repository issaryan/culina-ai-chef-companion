import { useNavigate } from "react-router-dom";
import { Crown, Check, ArrowLeft, Sparkles, Heart, ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Paywall = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const features = [
    {
      icon: Sparkles,
      title: "Générations IA illimitées",
      description: "Créez autant de recettes que vous le souhaitez avec notre IA",
    },
    {
      icon: Heart,
      title: "Recettes illimitées",
      description: "Sauvegardez toutes vos recettes préférées sans limite",
    },
    {
      icon: ChefHat,
      title: "Collections exclusives",
      description: "Accédez à des recettes premium de chefs renommés",
    },
  ];

  const handleUpgrade = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Pour l'instant, simuler le passage à Pro
      // Dans une vraie implémentation, cela appellerait RevenueCat ou Stripe
      const { error } = await supabase
        .from("user_subscription")
        .update({
          subscription_tier: "pro",
          max_saved_recipes: 999999,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      // Mettre à jour la limite mensuelle d'IA
      const currentMonth = new Date().toISOString().slice(0, 7);
      await supabase
        .from("user_ai_usage")
        .upsert({
          user_id: user.id,
          month: currentMonth,
          monthly_limit: 999999,
        });

      toast({
        title: "Bienvenue dans Culina AI Pro ! 🎉",
        description: "Vous avez maintenant accès à toutes les fonctionnalités premium.",
      });

      navigate("/profile");
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      <header className="safe-top px-4 py-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
      </header>

      <main className="px-4 py-8 max-w-2xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-4 rounded-full bg-gradient-to-br from-primary to-accent mb-4">
            <Crown className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Culina AI Pro
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Libérez tout le potentiel de votre cuisine avec l'intelligence
            artificielle
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid gap-4">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="p-6 hover:shadow-lg transition-shadow border-2"
            >
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">
                    {feature.description}
                  </p>
                </div>
                <Check className="h-6 w-6 text-primary flex-shrink-0 ml-auto" />
              </div>
            </Card>
          ))}
        </div>

        {/* Pricing Card */}
        <Card className="p-8 border-2 border-primary shadow-xl bg-gradient-to-br from-card to-primary/5">
          <div className="text-center space-y-6">
            <div>
              <div className="text-5xl font-bold mb-2">Gratuit</div>
              <p className="text-muted-foreground">
                Pour le développement - Démo uniquement
              </p>
            </div>

            <Button
              size="lg"
              className="w-full btn-hero text-lg py-6"
              onClick={handleUpgrade}
            >
              <Crown className="h-5 w-5 mr-2" />
              Activer Pro (Démo)
            </Button>

            <p className="text-xs text-muted-foreground">
              Dans une version production, l'intégration RevenueCat gérerait les
              paiements réels
            </p>
          </div>
        </Card>

        {/* Benefits List */}
        <Card className="p-6 bg-muted/50">
          <h3 className="font-semibold mb-4">Inclus dans votre abonnement :</h3>
          <ul className="space-y-3">
            {[
              "Accès instantané à toutes les fonctionnalités",
              "Mises à jour et nouvelles fonctionnalités incluses",
              "Support prioritaire",
              "Aucune publicité",
            ].map((benefit, index) => (
              <li key={index} className="flex items-center gap-3">
                <Check className="h-5 w-5 text-primary flex-shrink-0" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </Card>
      </main>
    </div>
  );
};

export default Paywall;
