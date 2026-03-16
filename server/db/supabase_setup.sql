-- Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    avatar_url TEXT,
    height_cm NUMERIC,
    weight_kg NUMERIC,
    target_weight_kg NUMERIC,
    body_fat_pct NUMERIC,
    active_goal TEXT,
    language TEXT DEFAULT 'id',
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Exercises Table
CREATE TABLE IF NOT EXISTS exercises (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    muscle_group TEXT NOT NULL,
    difficulty TEXT DEFAULT 'Intermediate',
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Schedules Table
CREATE TABLE IF NOT EXISTS schedules (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    time_minutes INTEGER,
    estimated_calories INTEGER,
    exercises_list JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Nutrition Logs Table
CREATE TABLE IF NOT EXISTS nutrition_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    protein_g NUMERIC DEFAULT 0,
    carbs_g NUMERIC DEFAULT 0,
    fat_g NUMERIC DEFAULT 0,
    calories NUMERIC DEFAULT 0,
    water_ml NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Create Body Stats Table
CREATE TABLE IF NOT EXISTS body_stats (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    weight_kg NUMERIC NOT NULL,
    body_fat_pct NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Workout Sessions Table
CREATE TABLE IF NOT EXISTS workout_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    schedule_id INTEGER REFERENCES schedules(id) ON DELETE SET NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    duration_seconds INTEGER DEFAULT 0,
    total_volume_kg NUMERIC DEFAULT 0,
    calories_burned INTEGER DEFAULT 0,
    notes TEXT
);

-- Create Set Logs Table
CREATE TABLE IF NOT EXISTS set_logs (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES workout_sessions(id) ON DELETE CASCADE,
    exercise_id INTEGER REFERENCES exercises(id) ON DELETE CASCADE,
    set_number INTEGER NOT NULL,
    weight_kg NUMERIC DEFAULT 0,
    reps INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Personal Records Table
CREATE TABLE IF NOT EXISTS personal_records (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    exercise_id INTEGER REFERENCES exercises(id) ON DELETE CASCADE,
    max_weight_kg NUMERIC NOT NULL,
    achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    badge TEXT DEFAULT 'gold',
    UNIQUE(user_id, exercise_id)
);
