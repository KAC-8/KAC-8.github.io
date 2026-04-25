-- Add a priority column for ordering projects within the same status group.
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS priority integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS projects_priority_idx ON projects (priority);
