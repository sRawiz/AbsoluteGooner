CREATE TABLE public.user_library (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_id TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('anime', 'vn')),
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'playing', 'completed', 'dropped')),
  score INTEGER CHECK (score >= 0 AND score <= 10),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, item_id, item_type)
);

ALTER TABLE public.user_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own library items."
  ON public.user_library FOR SELECT
  TO authenticated
  USING ( (select auth.uid()) = user_id );

CREATE POLICY "Users can insert their own library items."
  ON public.user_library FOR INSERT
  TO authenticated
  WITH CHECK ( (select auth.uid()) = user_id );

CREATE POLICY "Users can update their own library items."
  ON public.user_library FOR UPDATE
  TO authenticated
  USING ( (select auth.uid()) = user_id )
  WITH CHECK ( (select auth.uid()) = user_id );

CREATE POLICY "Users can delete their own library items."
  ON public.user_library FOR DELETE
  TO authenticated
  USING ( (select auth.uid()) = user_id );
