INSERT INTO tasks (id, text, done, created_at, updated_at)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'Comprar leche', FALSE, NOW(), NOW()),
    ('22222222-2222-2222-2222-222222222222', 'Estudiar PWA', TRUE, NOW(), NOW()),
    ('33333333-3333-3333-3333-333333333333', 'Preparar backend .NET', FALSE, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
