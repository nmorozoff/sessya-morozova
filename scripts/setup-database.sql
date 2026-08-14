-- Выполните в phpMyAdmin на Timeweb (вкладка SQL)

CREATE TABLE IF NOT EXISTS form_submissions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  contact VARCHAR(255) NOT NULL,
  message TEXT NULL,
  utm_source VARCHAR(64) NULL,
  utm_campaign VARCHAR(128) NULL,
  utm_medium VARCHAR(64) NULL,
  landing_path VARCHAR(512) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
