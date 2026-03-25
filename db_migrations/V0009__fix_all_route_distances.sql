-- Москва ↔ Симферополь: 1550 → 1700
UPDATE routes_reference SET km_normal = 1700, notes = 'Москва→Симферополь через Крымский мост (исправлено)' WHERE id = 34;
UPDATE routes_reference SET km_normal = 1700, notes = 'Симферополь→Москва через Крымский мост (исправлено)' WHERE id = 206;

-- Москва ↔ Ялта: 1650 → 1780
UPDATE routes_reference SET km_normal = 1780, notes = 'Москва→Ялта через Крымский мост (исправлено)' WHERE id = 35;
UPDATE routes_reference SET km_normal = 1780, notes = 'Ялта→Москва через Крымский мост (исправлено)' WHERE id = 209;

-- Москва ↔ Севастополь: 1700 → 1820
UPDATE routes_reference SET km_normal = 1820, notes = 'Москва→Севастополь через Крымский мост (исправлено)' WHERE id = 36;
UPDATE routes_reference SET km_normal = 1820, notes = 'Севастополь→Москва через Крымский мост (исправлено)' WHERE id = 212;

-- Ростов ↔ Симферополь: 620 → 670
UPDATE routes_reference SET km_normal = 670, notes = 'Ростов→Симферополь через Крымский мост (исправлено)' WHERE id = 37;
UPDATE routes_reference SET km_normal = 670, notes = 'Симферополь→Ростов через Крымский мост (исправлено)' WHERE id = 208;

-- Краснодар ↔ Симферополь: 300 → 440
UPDATE routes_reference SET km_normal = 440, notes = 'Краснодар→Симферополь через Крымский мост (исправлено)' WHERE id = 38;
UPDATE routes_reference SET km_normal = 440, notes = 'Симферополь→Краснодар через Крымский мост (исправлено)' WHERE id = 207;

-- Симферополь → Ялта: 75 → 82
UPDATE routes_reference SET km_normal = 82, notes = 'Симферополь→Ялта (исправлено)' WHERE id = 39;

-- Ялта → Севастополь: 90 → 82
UPDATE routes_reference SET km_normal = 82, notes = 'Ялта→Севастополь (исправлено)' WHERE id = 43;

-- Ростов ↔ Ялта: 700 → 750
UPDATE routes_reference SET km_normal = 750, notes = 'Ростов→Ялта через Крымский мост (исправлено)' WHERE id = 167;
UPDATE routes_reference SET km_normal = 750, notes = 'Ялта→Ростов через Крымский мост (исправлено)' WHERE id = 211;

-- Ростов ↔ Севастополь: 720 → 760
UPDATE routes_reference SET km_normal = 760, notes = 'Ростов→Севастополь через Крымский мост (исправлено)' WHERE id = 168;
UPDATE routes_reference SET km_normal = 760, notes = 'Севастополь→Ростов через Крымский мост (исправлено)' WHERE id = 214;

-- Краснодар ↔ Ялта: 490 → 510
UPDATE routes_reference SET km_normal = 510, notes = 'Краснодар→Ялта через Крымский мост (исправлено)' WHERE id = 173;
UPDATE routes_reference SET km_normal = 510, notes = 'Ялта→Краснодар через Крымский мост (исправлено)' WHERE id = 210;

-- Краснодар ↔ Севастополь: 370 → 510
UPDATE routes_reference SET km_normal = 510, notes = 'Краснодар→Севастополь через Крымский мост (исправлено)' WHERE id = 174;
UPDATE routes_reference SET km_normal = 510, notes = 'Севастополь→Краснодар через Крымский мост (исправлено)' WHERE id = 213;

-- Ростов ↔ Краснодар: 290 → 275
UPDATE routes_reference SET km_normal = 275, notes = 'Ростов→Краснодар (исправлено)' WHERE id = 48;