-- Выполните в phpMyAdmin (Timeweb) после setup-database.sql
-- Добавляет UTM-поля для отслеживания источника заявок

ALTER TABLE form_submissions
  ADD COLUMN utm_source VARCHAR(64) NULL AFTER message,
  ADD COLUMN utm_campaign VARCHAR(128) NULL AFTER utm_source,
  ADD COLUMN utm_medium VARCHAR(64) NULL AFTER utm_campaign,
  ADD COLUMN landing_path VARCHAR(512) NULL AFTER utm_medium;

-- Если колонки уже есть — phpMyAdmin покажет ошибку «Duplicate column» — это нормально.
