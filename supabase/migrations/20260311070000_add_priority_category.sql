-- Add priority and category to tasks table
ALTER TABLE tasks ADD COLUMN priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high'));
ALTER TABLE tasks ADD COLUMN category text DEFAULT 'general' CHECK (category IN ('general', 'work', 'personal', 'health', 'education', 'finance'));

-- Create index for priority and category
CREATE INDEX IF NOT EXISTS tasks_priority_idx ON tasks(priority);
CREATE INDEX IF NOT EXISTS tasks_category_idx ON tasks(category);
