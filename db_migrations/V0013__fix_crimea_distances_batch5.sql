-- Волгоград ↔ Симферополь: 1160 → 1200
UPDATE routes_reference SET km_normal = 1200, notes = 'Волгоград→Симферополь через Крымский мост (исправлено)' WHERE id = 345;
UPDATE routes_reference SET km_normal = 1200, notes = 'Симферополь→Волгоград через Крымский мост (исправлено)' WHERE id = 351;
UPDATE routes_reference SET km_normal = 1280, notes = 'Волгоград→Ялта через Крымский мост (исправлено)' WHERE id = 346;

-- Астрахань
UPDATE routes_reference SET km_normal = 1490, notes = 'Астрахань→Симферополь через Крымский мост (исправлено)' WHERE id = 354;
UPDATE routes_reference SET km_normal = 1570, notes = 'Астрахань→Ялта через Крымский мост (исправлено)' WHERE id = 355;

-- Саратов
UPDATE routes_reference SET km_normal = 1560, notes = 'Саратов→Симферополь через Крымский мост (исправлено)' WHERE id = 447;
UPDATE routes_reference SET km_normal = 1640, notes = 'Саратов→Ялта через Крымский мост (исправлено)' WHERE id = 448;

-- Пенза
UPDATE routes_reference SET km_normal = 1700, notes = 'Пенза→Симферополь через Крымский мост (исправлено)' WHERE id = 453;
UPDATE routes_reference SET km_normal = 1780, notes = 'Пенза→Ялта через Крымский мост (исправлено)' WHERE id = 454;

-- Самара
UPDATE routes_reference SET km_normal = 1930, notes = 'Самара→Симферополь через Крымский мост (исправлено)' WHERE id = 458;
UPDATE routes_reference SET km_normal = 2010, notes = 'Самара→Ялта через Крымский мост (исправлено)' WHERE id = 459;

-- Казань
UPDATE routes_reference SET km_normal = 2100, notes = 'Казань→Симферополь через Крымский мост (исправлено)' WHERE id = 465;
UPDATE routes_reference SET km_normal = 2180, notes = 'Казань→Ялта через Крымский мост (исправлено)' WHERE id = 466;

-- Уфа
UPDATE routes_reference SET km_normal = 2400, notes = 'Уфа→Симферополь через Крымский мост (исправлено)' WHERE id = 472;
UPDATE routes_reference SET km_normal = 2480, notes = 'Уфа→Ялта через Крымский мост (исправлено)' WHERE id = 473;

-- Нижний Новгород
UPDATE routes_reference SET km_normal = 1880, notes = 'Нижний Новгород→Симферополь через Крымский мост (исправлено)' WHERE id = 479;
UPDATE routes_reference SET km_normal = 1960, notes = 'Нижний Новгород→Ялта через Крымский мост (исправлено)' WHERE id = 480;
UPDATE routes_reference SET km_normal = 1880, notes = 'Симферополь→Нижний Новгород через Крымский мост (исправлено)' WHERE id = 484;

-- Смоленск
UPDATE routes_reference SET km_normal = 1700, notes = 'Смоленск→Симферополь через Крымский мост (исправлено)' WHERE id = 487;
UPDATE routes_reference SET km_normal = 1780, notes = 'Смоленск→Ялта через Крымский мост (исправлено)' WHERE id = 488;

-- Ярославль
UPDATE routes_reference SET km_normal = 1960, notes = 'Ярославль→Симферополь через Крымский мост (исправлено)' WHERE id = 493;
UPDATE routes_reference SET km_normal = 2040, notes = 'Ярославль→Ялта через Крымский мост (исправлено)' WHERE id = 494;

-- Владимир
UPDATE routes_reference SET km_normal = 1880, notes = 'Владимир→Симферополь через Крымский мост (исправлено)' WHERE id = 499;
UPDATE routes_reference SET km_normal = 1960, notes = 'Владимир→Ялта через Крымский мост (исправлено)' WHERE id = 500;

-- Калуга
UPDATE routes_reference SET km_normal = 1560, notes = 'Калуга→Симферополь через Крымский мост (исправлено)' WHERE id = 505;
UPDATE routes_reference SET km_normal = 1640, notes = 'Калуга→Ялта через Крымский мост (исправлено)' WHERE id = 506;

-- Рубановка (некорректные маршруты с 0 км — ставим отметку)
UPDATE routes_reference SET km_normal = 1, notes = 'НЕКОРРЕКТНЫЙ МАРШРУТ — требует удаления' WHERE id IN (569, 570);