CREATE TABLE route_check_logs (
    id SERIAL PRIMARY KEY,
    check_date DATE NOT NULL DEFAULT CURRENT_DATE,
    route_id INTEGER NOT NULL,
    from_city TEXT NOT NULL,
    to_city TEXT NOT NULL,
    ref_km_normal INTEGER NOT NULL,
    ref_km_special INTEGER NOT NULL,
    calc_km_normal INTEGER,
    calc_km_special INTEGER,
    deviation_pct NUMERIC(5,1),
    status TEXT NOT NULL DEFAULT 'ok',
    error_detail TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_route_check_date ON route_check_logs(check_date);
CREATE INDEX idx_route_check_status ON route_check_logs(status);