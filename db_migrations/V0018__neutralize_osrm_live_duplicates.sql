UPDATE routes_reference SET km_normal = 0, km_special = 0, notes = 'ДУБЛЬ — не использовать', updated_at = NOW() WHERE id IN (587, 588, 625, 626);

UPDATE routes_reference SET km_normal = 1077, km_special = 0, notes = 'Россия — обычный тариф (OSRM)', updated_at = NOW() WHERE id = 45;
