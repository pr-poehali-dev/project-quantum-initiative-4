UPDATE routes_reference SET km_normal = 380, km_special = 100, notes = 'fix: Краснодар-Донецк ~480км', updated_at = NOW()
WHERE id IN (29, 216);

UPDATE routes_reference SET km_normal = 870, km_special = 90, notes = 'fix: Москва-Донецк ~960км', updated_at = NOW()
WHERE id IN (24, 217);

UPDATE routes_reference SET km_normal = 125, km_special = 230, notes = 'fix: Ялта-Мелитополь через Крым', updated_at = NOW()
WHERE id IN (100, 139);

UPDATE routes_reference SET km_normal = 125, km_special = 290, notes = 'fix: Ялта-Энергодар через Крым', updated_at = NOW()
WHERE id IN (102, 606);
