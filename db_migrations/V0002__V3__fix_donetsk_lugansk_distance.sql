-- Обновляем эталон Донецк→Луганск (реальное расстояние ~135 км по дорогам через Горловку)
UPDATE routes_reference 
SET km_special = 135, notes = 'ДНР→ЛНР через Горловку, реальный маршрут ~135км'
WHERE from_city = 'Донецк' AND to_city = 'Луганск';

UPDATE routes_reference 
SET km_special = 135, notes = 'ЛНР→ДНР через Горловку, реальный маршрут ~135км'
WHERE from_city = 'Луганск' AND to_city = 'Донецк';
