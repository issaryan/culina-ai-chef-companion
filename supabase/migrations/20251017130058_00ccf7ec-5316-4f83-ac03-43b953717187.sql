-- Améliorer le système d'abonnement et de quotas

-- Ajouter une colonne pour limiter le nombre de recettes sauvegardées
ALTER TABLE user_subscription 
ADD COLUMN IF NOT EXISTS max_saved_recipes INTEGER DEFAULT 10;

-- Mettre à jour les utilisateurs existants en fonction de leur tier
UPDATE user_subscription 
SET max_saved_recipes = CASE 
  WHEN subscription_tier = 'free' THEN 10
  WHEN subscription_tier = 'pro' THEN 999999
  ELSE 10
END;

-- Ajouter une colonne pour le quota mensuel de générations IA
ALTER TABLE user_ai_usage 
ADD COLUMN IF NOT EXISTS monthly_limit INTEGER DEFAULT 5;

-- Mettre à jour les quotas en fonction du tier d'abonnement
UPDATE user_ai_usage uau
SET monthly_limit = CASE 
  WHEN (SELECT subscription_tier FROM user_subscription WHERE user_id = uau.user_id) = 'pro' THEN 999999
  ELSE 5
END;

-- Créer une fonction pour vérifier si un utilisateur peut générer une recette
CREATE OR REPLACE FUNCTION public.can_generate_recipe(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription_tier TEXT;
  v_generation_count INTEGER;
  v_monthly_limit INTEGER;
  v_current_month TEXT;
BEGIN
  SELECT subscription_tier INTO v_subscription_tier
  FROM user_subscription
  WHERE user_id = p_user_id;
  
  IF v_subscription_tier = 'pro' THEN
    RETURN TRUE;
  END IF;
  
  v_current_month := TO_CHAR(NOW(), 'YYYY-MM');
  
  SELECT generation_count, monthly_limit INTO v_generation_count, v_monthly_limit
  FROM user_ai_usage
  WHERE user_id = p_user_id AND month = v_current_month;
  
  IF NOT FOUND THEN
    INSERT INTO user_ai_usage (user_id, month, generation_count, monthly_limit)
    VALUES (p_user_id, v_current_month, 0, 5)
    RETURNING generation_count, monthly_limit INTO v_generation_count, v_monthly_limit;
  END IF;
  
  RETURN v_generation_count < v_monthly_limit;
END;
$$;

-- Créer une fonction pour vérifier si un utilisateur peut sauvegarder une recette
CREATE OR REPLACE FUNCTION public.can_save_recipe(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max_saved INTEGER;
  v_current_count INTEGER;
BEGIN
  SELECT max_saved_recipes INTO v_max_saved
  FROM user_subscription
  WHERE user_id = p_user_id;
  
  SELECT COUNT(*) INTO v_current_count
  FROM recipes
  WHERE user_id = p_user_id;
  
  RETURN v_current_count < v_max_saved;
END;
$$;