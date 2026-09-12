-- Run this in the Supabase SQL Editor

-- 1. Create Users Table
CREATE TABLE public.users (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar TEXT,
    level INTEGER DEFAULT 1,
    total_xp INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    disclaimer_accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Attributes Table
CREATE TABLE public.attributes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    attribute_name TEXT NOT NULL, -- e.g., 'Intellect', 'Strength', 'Discipline', 'Focus'
    level INTEGER DEFAULT 1,
    attribute_xp INTEGER DEFAULT 0,
    UNIQUE(user_id, attribute_name)
);

-- 3. Create Tasks Table
CREATE TABLE public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    attribute_type TEXT NOT NULL, -- references attribute_name
    status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
    timer_duration INTEGER NOT NULL, -- in seconds
    timer_started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Users can read their own data, and read public profile data of others
CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
-- If you need user search later:
-- CREATE POLICY "Users can view all usernames" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Attributes policies
CREATE POLICY "Users can view their own attributes" ON public.attributes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own attributes" ON public.attributes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own attributes" ON public.attributes FOR UPDATE USING (auth.uid() = user_id);

-- Tasks policies
CREATE POLICY "Users can view their own tasks" ON public.tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tasks" ON public.tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tasks" ON public.tasks FOR DELETE USING (auth.uid() = user_id);

-- 6. Trigger to create default attributes when a user is created
CREATE OR REPLACE FUNCTION public.handle_new_user_attributes()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.attributes (user_id, attribute_name, level, attribute_xp)
  VALUES 
    (NEW.id, 'Intellect', 1, 0),
    (NEW.id, 'Strength', 1, 0),
    (NEW.id, 'Discipline', 1, 0),
    (NEW.id, 'Focus', 1, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_created
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_attributes();
