import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Loader2, ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TabBar } from "@/components/TabBar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const CulinaAI = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Bonjour ! Que souhaitez-vous cuisiner aujourd'hui ? Essayez 'un plat de pâtes au poulet rapide' ou 'une salade végétalienne avec de l'avocat'.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [quotaInfo, setQuotaInfo] = useState<{
    remaining: number;
    limit: number;
    isPro: boolean;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchQuotaInfo();
  }, []);

  const fetchQuotaInfo = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const currentMonth = new Date().toISOString().slice(0, 7);

      const { data: subscription } = await supabase
        .from("user_subscription")
        .select("subscription_tier")
        .eq("user_id", user.id)
        .single();

      const { data: usage } = await supabase
        .from("user_ai_usage")
        .select("generation_count, monthly_limit")
        .eq("user_id", user.id)
        .eq("month", currentMonth)
        .maybeSingle();

      const isPro = subscription?.subscription_tier === "pro";
      const limit = isPro ? 999999 : 5;
      const used = usage?.generation_count || 0;

      setQuotaInfo({
        remaining: limit - used,
        limit: limit,
        isPro: isPro,
      });
    } catch (error) {
      console.error("Error fetching quota:", error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsGenerating(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Connexion requise",
          description:
            "Veuillez vous connecter pour générer des recettes",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      // Call AI recipe generator function
      const { data, error } = await supabase.functions.invoke(
        "generate-recipe",
        {
          body: { prompt: input, userId: user.id },
        }
      );

      if (error) throw error;

      if (data.error) {
        // Handle quota exceeded
        if (data.error.includes("quota")) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content:
                "Vous avez utilisé vos 5 générations de recettes gratuites pour ce mois-ci. Passez à Pro pour des générations illimitées !",
            },
          ]);
        } else {
          throw new Error(data.error);
        }
      } else if (data.recipeId) {
        // Refresh quota info
        fetchQuotaInfo();
        
        // Show success message
        toast({
          title: "Recette créée ! 🎉",
          description: "Votre recette a été ajoutée à 'Mes Créations'",
        });
        
        // Navigate to the new recipe
        setTimeout(() => {
          navigate(`/recipe/${data.recipeId}`);
        }, 800);
      }
    } catch (error: any) {
      console.error("Error generating recipe:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Désolé, une erreur est survenue. Veuillez réessayer.",
        },
      ]);
      toast({
        title: "Erreur",
        description: "Impossible de générer la recette",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="safe-top bg-card border-b border-border px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ChefHat className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Assistant Culina AI</h1>
          </div>
          {quotaInfo && !quotaInfo.isPro && (
            <div className="text-sm text-muted-foreground">
              {quotaInfo.remaining}/{quotaInfo.limit}
            </div>
          )}
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 pb-32">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            } animate-fade-in-up`}
          >
            <div
              className={
                message.role === "user"
                  ? "chat-bubble-user"
                  : "chat-bubble-ai"
              }
            >
              <p className="text-sm whitespace-pre-wrap">
                {message.content}
              </p>
            </div>
          </div>
        ))}

        {isGenerating && (
          <div className="flex justify-start animate-fade-in-up">
            <div className="chat-bubble-ai flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Culina réfléchit...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="safe-bottom fixed bottom-16 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border px-4 py-4">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Décrivez la recette que vous voulez..."
            className="resize-none min-h-[44px] max-h-32"
            rows={1}
            disabled={isGenerating}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isGenerating}
            size="icon"
            className="min-h-[44px] min-w-[44px] btn-hero"
          >
            {isGenerating ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      <TabBar />
    </div>
  );
};

export default CulinaAI;
