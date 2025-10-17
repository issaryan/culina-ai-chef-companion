import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, userId } = await req.json();

    if (!prompt || !userId) {
      throw new Error("Missing prompt or userId");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if user can generate recipe using the database function
    const { data: canGenerate, error: checkError } = await supabase
      .rpc("can_generate_recipe", { p_user_id: userId });

    if (checkError) {
      console.error("Error checking quota:", checkError);
      throw new Error("Failed to check generation quota");
    }

    if (!canGenerate) {
      return new Response(
        JSON.stringify({
          error:
            "Quota de génération gratuit dépassé. Passez à Pro pour des générations illimitées.",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get user preferences
    const { data: preferences } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    // Build AI prompt with preferences
    let systemPrompt = `Tu es un chef cuisinier expert qui génère des recettes détaillées au format JSON. 
    
Génère une recette complète et appétissante basée sur la demande de l'utilisateur.`;

    if (preferences) {
      if (preferences.dietary_restrictions?.length > 0) {
        systemPrompt += `\n\nRégimes alimentaires à respecter: ${preferences.dietary_restrictions.join(", ")}`;
      }
      if (preferences.allergies?.length > 0) {
        systemPrompt += `\n\nAllergies à éviter: ${preferences.allergies.join(", ")}`;
      }
    }

    systemPrompt += `\n\nRéponds UNIQUEMENT avec un objet JSON valide (pas de markdown, pas de texte avant ou après) avec cette structure exacte:
{
  "title": "Nom de la recette",
  "description": "Description appétissante",
  "prep_time_minutes": 15,
  "cook_time_minutes": 30,
  "servings": 4,
  "difficulty": "easy|medium|hard",
  "cuisine_type": "Type de cuisine",
  "chef_tip": "Conseil du chef",
  "nutritional_info": {
    "calories": 450,
    "protein": 25,
    "carbs": 35,
    "fat": 15
  },
  "ingredients": [
    {
      "name": "Ingrédient",
      "quantity": 200,
      "unit": "g",
      "order_index": 0
    }
  ],
  "steps": [
    {
      "step_number": 1,
      "instruction": "Première étape détaillée"
    }
  ]
}`;

    // Call Lovable AI
    console.log("Calling Lovable AI...");
    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
        }),
      }
    );

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0].message.content;
    console.log("AI Response:", aiContent);

    // Parse AI response
    let recipeData;
    try {
      // Remove markdown code blocks if present
      let cleanContent = aiContent.trim();
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent.slice(7);
      }
      if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith("```")) {
        cleanContent = cleanContent.slice(0, -3);
      }
      recipeData = JSON.parse(cleanContent.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", aiContent);
      throw new Error("Invalid AI response format");
    }

    // Insert recipe
    const { data: recipe, error: recipeError } = await supabase
      .from("recipes")
      .insert({
        user_id: userId,
        title: recipeData.title,
        description: recipeData.description,
        prep_time_minutes: recipeData.prep_time_minutes,
        cook_time_minutes: recipeData.cook_time_minutes,
        servings: recipeData.servings,
        difficulty: recipeData.difficulty,
        cuisine_type: recipeData.cuisine_type,
        chef_tip: recipeData.chef_tip,
        nutritional_info: recipeData.nutritional_info,
        is_public: false,
      })
      .select()
      .single();

    if (recipeError) throw recipeError;

    // Insert ingredients
    if (recipeData.ingredients?.length > 0) {
      const ingredients = recipeData.ingredients.map((ing: any) => ({
        recipe_id: recipe.id,
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        order_index: ing.order_index,
      }));

      const { error: ingredientsError } = await supabase
        .from("recipe_ingredients")
        .insert(ingredients);

      if (ingredientsError) console.error("Ingredients error:", ingredientsError);
    }

    // Insert steps
    if (recipeData.steps?.length > 0) {
      const steps = recipeData.steps.map((step: any) => ({
        recipe_id: recipe.id,
        step_number: step.step_number,
        instruction: step.instruction,
      }));

      const { error: stepsError } = await supabase
        .from("recipe_steps")
        .insert(steps);

      if (stepsError) console.error("Steps error:", stepsError);
    }

    // Update AI usage counter
    const currentMonth = new Date().toISOString().slice(0, 7);

    const { data: existingUsage } = await supabase
      .from("user_ai_usage")
      .select("*")
      .eq("user_id", userId)
      .eq("month", currentMonth)
      .single();

    if (existingUsage) {
      await supabase
        .from("user_ai_usage")
        .update({
          generation_count: existingUsage.generation_count + 1,
        })
        .eq("id", existingUsage.id);
    } else {
      // Get user subscription tier to set appropriate limit
      const { data: subscription } = await supabase
        .from("user_subscription")
        .select("subscription_tier")
        .eq("user_id", userId)
        .single();

      const monthlyLimit =
        subscription?.subscription_tier === "pro" ? 999999 : 5;

      await supabase.from("user_ai_usage").insert({
        user_id: userId,
        month: currentMonth,
        generation_count: 1,
        monthly_limit: monthlyLimit,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        recipeId: recipe.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in generate-recipe:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
