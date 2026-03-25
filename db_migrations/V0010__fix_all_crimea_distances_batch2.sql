-- Воронеж ↔ Симферополь: 800/850 → 1240
UPDATE routes_reference SET km_normal = 1240, notes = 'Воронеж→Симферополь через Крымский мост (исправлено)' WHERE id = 200;
UPDATE routes_reference SET km_normal = 1240, notes = 'Симферополь→Воронеж через Крымский мост (исправлено)' WHERE id = 293;

-- Воронеж ↔ Ялта: 930 → 1320
UPDATE routes_reference SET km_normal = 1320, notes = 'Воронеж→Ялта через Крымский мост (исправлено)' WHERE id = 287;
UPDATE routes_reference SET km_normal = 1320, notes = 'Ялта→Воронеж через Крымский мост (исправлено)' WHERE id = 294;

-- Воронеж ↔ Севастополь: 950 → 1320
UPDATE routes_reference SET km_normal = 1320, notes = 'Воронеж→Севастополь через Крымский мост (исправлено)' WHERE id = 288;

-- Белгород ↔ Симферополь: 840 → 1370
UPDATE routes_reference SET km_normal = 1370, notes = 'Белгород→Симферополь через Крымский мост (исправлено)' WHERE id = 258;
UPDATE routes_reference SET km_normal = 1370, notes = 'Симферополь→Белгород через Крымский мост (исправлено)' WHERE id = 265;

-- Белгород ↔ Ялта: 920 → 1450
UPDATE routes_reference SET km_normal = 1450, notes = 'Белгород→Ялта через Крымский мост (исправлено)' WHERE id = 259;
UPDATE routes_reference SET km_normal = 1450, notes = 'Ялта→Белгород через Крымский мост (исправлено)' WHERE id = 266;

-- Белгород ↔ Севастополь: 940 → 1450
UPDATE routes_reference SET km_normal = 1450, notes = 'Белгород→Севастополь через Крымский мост (исправлено)' WHERE id = 260;

-- Курск ↔ Симферополь: 920 → 1480 (Курск дальше Белгорода от Крыма)
UPDATE routes_reference SET km_normal = 1480, notes = 'Курск→Симферополь через Крымский мост (исправлено)' WHERE id = 272;
UPDATE routes_reference SET km_normal = 1480, notes = 'Симферополь→Курск через Крымский мост (исправлено)' WHERE id = 277;

-- Курск ↔ Ялта: 1000 → 1560
UPDATE routes_reference SET km_normal = 1560, notes = 'Курск→Ялта через Крымский мост (исправлено)' WHERE id = 273;

-- Тула ↔ Симферополь: 1300 → 1520 (Тула: 180км от Москвы, Москва→Симферополь=1700, Тула ближе через Воронеж: ~1520)
UPDATE routes_reference SET km_normal = 1520, notes = 'Тула→Симферополь через Крымский мост (исправлено)' WHERE id = 298;
UPDATE routes_reference SET km_normal = 1520, notes = 'Симферополь→Тула через Крымский мост (исправлено)' WHERE id = 303;

-- Тула ↔ Ялта: 1380 → 1600
UPDATE routes_reference SET km_normal = 1600, notes = 'Тула→Ялта через Крымский мост (исправлено)' WHERE id = 299;
UPDATE routes_reference SET km_normal = 1600, notes = 'Ялта→Тула через Крымский мост (исправлено)' WHERE id = 304;

-- Рязань ↔ Симферополь: 1380 → 1660 (Рязань: ~200км от Москвы на восток, маршрут длиннее)
UPDATE routes_reference SET km_normal = 1660, notes = 'Рязань→Симферополь через Крымский мост (исправлено)' WHERE id = 307;
UPDATE routes_reference SET km_normal = 1660, notes = 'Симферополь→Рязань через Крымский мост (исправлено)' WHERE id = 311;

-- Рязань ↔ Ялта: 1460 → 1740
UPDATE routes_reference SET km_normal = 1740, notes = 'Рязань→Ялта через Крымский мост (исправлено)' WHERE id = 308;

-- Липецк ↔ Симферополь: 1160 → 1380 (Липецк через Воронеж: ~300км до Воронежа + 1240 = ~1380, но маршрут напрямую ~1380)
UPDATE routes_reference SET km_normal = 1380, notes = 'Липецк→Симферополь через Крымский мост (исправлено)' WHERE id = 315;
UPDATE routes_reference SET km_normal = 1380, notes = 'Симферополь→Липецк через Крымский мост (исправлено)' WHERE id = 319;

-- Липецк ↔ Ялта: 1240 → 1460
UPDATE routes_reference SET km_normal = 1460, notes = 'Липецк→Ялта через Крымский мост (исправлено)' WHERE id = 316;

-- Тамбов ↔ Симферополь: 1180 → 1480
UPDATE routes_reference SET km_normal = 1480, notes = 'Тамбов→Симферополь через Крымский мост (исправлено)' WHERE id = 322;

-- Тамбов ↔ Ялта: 1260 → 1560
UPDATE routes_reference SET km_normal = 1560, notes = 'Тамбов→Ялта через Крымский мост (исправлено)' WHERE id = 323;

-- Орёл ↔ Симферополь: 990 → 1430
UPDATE routes_reference SET km_normal = 1430, notes = 'Орёл→Симферополь через Крымский мост (исправлено)' WHERE id = 329;
UPDATE routes_reference SET km_normal = 1430, notes = 'Симферополь→Орёл через Крымский мост (исправлено)' WHERE id = 333;

-- Орёл ↔ Ялта: 1070 → 1510
UPDATE routes_reference SET km_normal = 1510, notes = 'Орёл→Ялта через Крымский мост (исправлено)' WHERE id = 330;

-- Брянск ↔ Симферополь: 1080 → 1580
UPDATE routes_reference SET km_normal = 1580, notes = 'Брянск→Симферополь через Крымский мост (исправлено)' WHERE id = 336;

-- Брянск ↔ Ялта: 1160 → 1660
UPDATE routes_reference SET km_normal = 1660, notes = 'Брянск→Ялта через Крымский мост (исправлено)' WHERE id = 337;

-- СПб ↔ Симферополь: 2260 → 2400 (СПб→Москва 710 + Москва→Симферополь 1700 = 2410, но напрямую через Тулу ~2400)
UPDATE routes_reference SET km_normal = 2400, notes = 'Санкт-Петербург→Симферополь через Крымский мост (исправлено)' WHERE id = 203;

-- Ростов → Краснодар: 290 → 275
UPDATE routes_reference SET km_normal = 275, notes = 'Ростов→Краснодар (исправлено)' WHERE id = 48;