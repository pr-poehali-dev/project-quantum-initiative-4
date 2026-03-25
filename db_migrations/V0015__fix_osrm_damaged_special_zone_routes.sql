UPDATE routes_reference SET km_normal = 0, km_special = 80, notes = 'fix: OSRM объезд исправлен', updated_at = NOW()
WHERE id IN (607, 608);

UPDATE routes_reference SET km_normal = 0, km_special = 110, notes = 'fix: восстановлен эталон', updated_at = NOW()
WHERE id IN (1, 3);

UPDATE routes_reference SET km_normal = 0, km_special = 135, notes = 'fix: восстановлен эталон', updated_at = NOW()
WHERE id IN (2, 4);
