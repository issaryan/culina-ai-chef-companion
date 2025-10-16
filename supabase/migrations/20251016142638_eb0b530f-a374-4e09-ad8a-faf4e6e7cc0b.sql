-- Create recipe_comments table
CREATE TABLE public.recipe_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.recipe_comments ENABLE ROW LEVEL SECURITY;

-- Create policies for recipe_comments
CREATE POLICY "Comments viewable for public recipes or by recipe owner" 
ON public.recipe_comments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.recipes 
    WHERE recipes.id = recipe_comments.recipe_id 
    AND (recipes.is_public = true OR recipes.user_id = auth.uid())
  )
);

CREATE POLICY "Users can insert comments on public recipes" 
ON public.recipe_comments 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM public.recipes 
    WHERE recipes.id = recipe_comments.recipe_id 
    AND recipes.is_public = true
  )
);

CREATE POLICY "Users can update their own comments" 
ON public.recipe_comments 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" 
ON public.recipe_comments 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_recipe_comments_updated_at
BEFORE UPDATE ON public.recipe_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();