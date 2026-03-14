-- Ejecuta este SQL en el editor SQL de tu proyecto Supabase (Table Editor > SQL)
-- para poder guardar la visibilidad de las secciones (Descripción, Tamaño, etc.) desde el admin.

ALTER TABLE productos
ADD COLUMN IF NOT EXISTS section_visibility jsonb DEFAULT '{"showDescription":true,"showShortDescription":true,"showSize":true,"showIngredients":true,"showHowToUse":true}';

-- Opcional: actualizar filas existentes para que todas las secciones sigan visibles
-- UPDATE productos SET section_visibility = '{"showDescription":true,"showShortDescription":true,"showSize":true,"showIngredients":true,"showHowToUse":true}' WHERE section_visibility IS NULL;
