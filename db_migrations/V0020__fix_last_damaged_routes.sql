UPDATE routes_reference SET km_normal = 50, km_special = 120, notes = 'Крым-Геническ через Армянск', updated_at = NOW() WHERE id IN (116, 136);
UPDATE routes_reference SET km_normal = 0, km_special = 75, notes = 'Запорожская спецзона', updated_at = NOW() WHERE id = 159;
UPDATE routes_reference SET km_normal = 30, km_special = 0, notes = 'Крым обычный тариф', updated_at = NOW() WHERE id = 239;
