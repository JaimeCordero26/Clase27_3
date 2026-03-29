-- Conéctese a la base todo_app_db y ejecute este script.

CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY,
    text TEXT NOT NULL,
    done BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tasks_updated_at ON tasks (updated_at DESC);
