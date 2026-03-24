import json
import os
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def handler(event: dict, context) -> dict:
    """
    Возвращает логи расчётов маршрутов.
    ?errors=1 — только ошибочные расчёты (отклонение >20% от эталона).
    ?limit=50 — лимит записей (макс 200).
    """
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    params = event.get("queryStringParameters") or {}
    errors_only = params.get("errors", "0") == "1"
    limit = min(int(params.get("limit", 50)), 200)

    conn = get_db()
    cur = conn.cursor()

    where = "WHERE is_error = TRUE" if errors_only else ""
    cur.execute(
        f"""SELECT id, from_city, to_city, stops, car_class,
                   km_normal, km_special, km_total, price,
                   reference_id, ref_km_total, deviation_pct,
                   is_error, error_reason, source, created_at
            FROM route_calculations_log
            {where}
            ORDER BY created_at DESC
            LIMIT {limit}"""
    )
    rows = cur.fetchall()

    cur.execute(f"SELECT COUNT(*) FROM route_calculations_log {where}")
    total = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM route_calculations_log WHERE is_error = TRUE")
    errors_count = cur.fetchone()[0]

    cur.execute("SELECT COUNT(*) FROM routes_reference")
    ref_count = cur.fetchone()[0]

    conn.close()

    logs = []
    for r in rows:
        logs.append({
            "id": r[0],
            "from_city":    r[1],
            "to_city":      r[2],
            "stops":        list(r[3]) if r[3] else [],
            "car_class":    r[4],
            "km_normal":    r[5],
            "km_special":   r[6],
            "km_total":     r[7],
            "price":        r[8],
            "reference_id": r[9],
            "ref_km_total": r[10],
            "deviation_pct": float(r[11]) if r[11] is not None else None,
            "is_error":     r[12],
            "error_reason": r[13],
            "source":       r[14],
            "created_at":   r[15].isoformat() if r[15] else None,
        })

    return {
        "statusCode": 200,
        "headers": CORS,
        "body": json.dumps({
            "total": total,
            "errors_count": errors_count,
            "reference_routes_count": ref_count,
            "logs": logs,
        }),
    }
