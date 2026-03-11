/*
  # Smart Task Reminder - Database Schema

  ## Overview
  Creates the core tasks table for the Smart Task Reminder application.

  ## New Tables
  - `tasks`
    - `id` (uuid, primary key) - Unique identifier for each task
    - `user_id` (uuid, foreign key) - References the authenticated user
    - `title` (text, required) - Task title/name
    - `description` (text, optional) - Detailed task description
    - `scheduled_date` (date, required) - Date when task is scheduled
    - `scheduled_time` (time, required) - Time when task is scheduled
    - `is_completed` (boolean, default false) - Completion status
    - `is_notified` (boolean, default false) - Whether notification was sent
    - `created_at` (timestamptz, default now()) - Task creation timestamp
    - `updated_at` (timestamptz, default now()) - Last update timestamp

  ## Security
  - Enable Row Level Security (RLS) on tasks table
  - Users can only view their own tasks
  - Users can only insert their own tasks
  - Users can only update their own tasks
  - Users can only delete their own tasks

  ## Important Notes
  1. All task data is private to each user
  2. The scheduled_date and scheduled_time fields are used to trigger reminders
  3. The is_notified flag prevents duplicate notifications
*/

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  scheduled_date date NOT NULL,
  scheduled_time time NOT NULL,
  is_completed boolean DEFAULT false,
  is_notified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own tasks
CREATE POLICY "Users can view own tasks"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own tasks
CREATE POLICY "Users can create own tasks"
  ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own tasks
CREATE POLICY "Users can update own tasks"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own tasks
CREATE POLICY "Users can delete own tasks"
  ON tasks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS tasks_user_id_idx ON tasks(user_id);
CREATE INDEX IF NOT EXISTS tasks_scheduled_idx ON tasks(scheduled_date, scheduled_time);
CREATE INDEX IF NOT EXISTS tasks_notified_idx ON tasks(is_notified, is_completed);