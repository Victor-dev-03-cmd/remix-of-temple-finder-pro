
CREATE TABLE languages (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  flag TEXT
);

INSERT INTO languages (name, code, flag) VALUES
('English', 'en', '🇬🇧'),
('Sinhala', 'si', '🇱🇰'),
('Tamil', 'ta', '🇮🇳'),
('Hindi', 'hi', '🇮🇳');
