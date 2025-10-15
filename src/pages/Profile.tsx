import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User as UserIcon,
  LogOut,
  Settings,
  Crown,
  Mail,
  ChefHat,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { TabBar } from "@/components/TabBar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      const { data: subData } = await supabase
        .from("user_subscription")
        .select("*")
        .eq("user_id", user.id)
        .single();

      setProfile(profileData);
      setSubscription(subData);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({ title: "Déconnexion réussie" });
      navigate("/auth");
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin">
          <ChefHat className="h-12 w-12 text-primary" />
        </div>
      </div>
    );
  }

  const isPro = subscription?.subscription_tier === "pro";

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="safe-top bg-card border-b border-border px-4 py-4">
        <h1 className="text-2xl font-bold">Profil</h1>
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* User Info Card */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {profile?.full_name?.[0] || profile?.email?.[0] || "U"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <h2 className="text-xl font-semibold">
                {profile?.full_name || "Utilisateur"}
              </h2>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span className="text-sm">{profile?.email}</span>
              </div>
            </div>
          </div>

          {isPro && (
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg border border-primary/20">
              <Crown className="h-5 w-5 text-primary" />
              <span className="font-semibold text-primary">Membre Pro</span>
            </div>
          )}
        </Card>

        {/* Upgrade to Pro (for free users) */}
        {!isPro && (
          <Card className="p-6 bg-gradient-to-br from-primary/10 via-background to-accent/10 border-2 border-primary/20">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Crown className="h-8 w-8 text-primary" />
                <h3 className="text-xl font-bold">Passer à Culina AI Pro</h3>
              </div>

              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Générations de recettes par IA illimitées
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Sauvegarde de recettes illimitée
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Accès aux collections exclusives
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Expérience sans publicité
                </li>
              </ul>

              <Button
                className="w-full btn-hero"
                size="lg"
                onClick={() => navigate("/paywall")}
              >
                Débloquer toutes les fonctionnalités
              </Button>
            </div>
          </Card>
        )}

        {/* Menu Options */}
        <Card className="divide-y divide-border">
          <button
            className="w-full px-6 py-4 flex items-center gap-3 hover:bg-muted/50 transition-colors"
            onClick={() => navigate("/onboarding")}
          >
            <Settings className="h-5 w-5 text-muted-foreground" />
            <span>Préférences alimentaires</span>
          </button>

          <button
            className="w-full px-6 py-4 flex items-center gap-3 hover:bg-muted/50 transition-colors text-destructive"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5" />
            <span>Se déconnecter</span>
          </button>
        </Card>
      </main>

      <TabBar />
    </div>
  );
};

export default Profile;
