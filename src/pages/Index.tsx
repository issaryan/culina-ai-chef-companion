import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChefHat } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      navigate("/home");
    } else {
      navigate("/auth");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted">
      <div className="animate-pulse">
        <ChefHat className="h-16 w-16 text-primary" />
      </div>
    </div>
  );
};

export default Index;
