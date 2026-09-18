-- Step 7 -- Person A: Users, Profiles, and Interview History tables.
-- Defines the core authentication and user-state tables for the AI Interview Simulator.

-- 1. Users table for core authentication
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast user lookups during login
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. User Profiles table for personalized mock interview targeting
CREATE TABLE IF NOT EXISTS profiles (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    display_name TEXT,
    target_role TEXT,
    experience_level TEXT,
    bio TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for profile lookups by user_id
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- 3. Interview History table to persist past mock interview runs and scores
CREATE TABLE IF NOT EXISTS interview_history (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company TEXT NOT NULL,
    role TEXT NOT NULL,
    round_type TEXT NOT NULL,
    session_transcript JSONB,
    feedback_result JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index for user interview history queries
CREATE INDEX IF NOT EXISTS idx_interview_history_user_id ON interview_history(user_id);
