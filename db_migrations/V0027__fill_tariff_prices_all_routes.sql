UPDATE t_p16381115_project_quantum_init.routes_reference
SET 
  price_urgent   = (30 * km_normal + 80 * km_special + 1500),
  price_standard = (30 * km_normal + 80 * km_special + 700),
  price_comfort  = (40 * km_normal + 90 * km_special + 700),
  price_minivan  = (60 * km_normal + 100 * km_special + 700),
  price_business = (80 * km_normal + 180 * km_special + 700);