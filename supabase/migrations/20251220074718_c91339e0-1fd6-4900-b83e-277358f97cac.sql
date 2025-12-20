-- Create a table for storing destination history
CREATE TABLE public.destinations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  coordinates JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;

-- Allow public access for this app (no auth required)
CREATE POLICY "Anyone can view destinations" 
ON public.destinations 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert destinations" 
ON public.destinations 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can delete destinations" 
ON public.destinations 
FOR DELETE 
USING (true);