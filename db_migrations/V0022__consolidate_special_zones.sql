
UPDATE special_zones SET name = 'Спецзона', zone_type = 'special' WHERE id = 2;

UPDATE special_zones SET is_active = false WHERE id IN (1, 3, 4);
