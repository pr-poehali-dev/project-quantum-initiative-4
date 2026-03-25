import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import funcUrls from "../../../backend/func2url.json";

interface CalcLog {
  id: number;
  from_city: string;
  to_city: string;
  stops: string[];
  car_class: string;
  km_normal: number;
  km_special: number;
  km_total: number;
  price: number;
  source: string;
  is_error: boolean;
  error_reason: string | null;
  deviation_pct: number | null;
  created_at: string;
}

const CAR_LABELS: Record<string, string> = {
  standard: "Стандарт",
  comfort: "Комфорт",
  business: "Бизнес",
  minivan: "Минивэн",
  urgent: "Срочный",
};

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  osrm: { label: "OSRM", color: "text-green-400" },
  reference: { label: "Эталон", color: "text-blue-400" },
  reference_override: { label: "Эталон ⚠", color: "text-yellow-400" },
  fallback: { label: "Fallback", color: "text-red-400" },
};

export default function CalcLogsSection() {
  const [logs, setLogs] = useState<CalcLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [errorsCount, setErrorsCount] = useState(0);
  const [errorsOnly, setErrorsOnly] = useState(false);
  const [limit, setLimit] = useState(50);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (errorsOnly) params.set("errors", "1");
      params.set("limit", String(limit));
      const res = await fetch(funcUrls["route-logs"] + "?" + params.toString());
      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
      setErrorsCount(data.errors_count || 0);
    } catch {
      // ignore
    }
    setLoading(false);
  }, [errorsOnly, limit]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  };

  const formatPrice = (p: number) => p.toLocaleString("ru-RU") + " ₽";

  return (
    <div className="bg-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Icon name="ScrollText" size={20} className="text-cyan-400" />
            Логи расчётов
          </h2>
          <span className="text-sm text-gray-400">Всего: {total}</span>
          {errorsCount > 0 && (
            <span className="text-sm text-yellow-400">Ошибок: {errorsCount}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setErrorsOnly(!errorsOnly)}
            className={`text-sm px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              errorsOnly
                ? "bg-yellow-500/20 text-yellow-400"
                : "bg-gray-700 text-gray-400 hover:text-white"
            }`}
          >
            <Icon name="AlertTriangle" size={14} />
            {errorsOnly ? "Только ошибки" : "Все записи"}
          </button>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="bg-gray-700 text-white text-sm px-3 py-1.5 rounded-lg outline-none"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
          </select>
          <button
            onClick={loadLogs}
            disabled={loading}
            className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
          >
            <Icon name={loading ? "Loader2" : "RefreshCw"} size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-gray-400">
          <Icon name="Loader2" size={24} className="animate-spin mr-2" /> Загрузка...
        </div>
      ) : (
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-800">
              <tr className="text-gray-400 border-b border-gray-700">
                <th className="text-left py-2 px-3">Дата</th>
                <th className="text-left py-2 px-3">Маршрут</th>
                <th className="text-left py-2 px-3">Класс</th>
                <th className="text-right py-2 px-3">Км</th>
                <th className="text-right py-2 px-3">Спец</th>
                <th className="text-right py-2 px-3">Цена</th>
                <th className="text-center py-2 px-3">Источник</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const src = SOURCE_LABELS[log.source] || { label: log.source, color: "text-gray-400" };
                return (
                  <tr
                    key={log.id}
                    className={`border-b border-gray-700/50 hover:bg-gray-700/30 ${log.is_error ? "bg-red-500/5" : ""}`}
                  >
                    <td className="py-2 px-3 text-gray-500 whitespace-nowrap">{formatDate(log.created_at)}</td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1">
                        <span>{log.from_city}</span>
                        <Icon name="ArrowRight" size={12} className="text-gray-600 shrink-0" />
                        <span>{log.to_city}</span>
                      </div>
                      {log.stops.length > 0 && (
                        <div className="text-xs text-gray-500 mt-0.5">через: {log.stops.join(", ")}</div>
                      )}
                      {log.is_error && log.error_reason && (
                        <div className="text-xs text-red-400 mt-0.5">{log.error_reason}</div>
                      )}
                    </td>
                    <td className="py-2 px-3 text-gray-400">{CAR_LABELS[log.car_class] || log.car_class}</td>
                    <td className="text-right py-2 px-3">{log.km_total}</td>
                    <td className="text-right py-2 px-3 text-orange-400">{log.km_special > 0 ? log.km_special : "—"}</td>
                    <td className="text-right py-2 px-3 font-medium whitespace-nowrap">{formatPrice(log.price)}</td>
                    <td className="text-center py-2 px-3">
                      <span className={`text-xs ${src.color}`}>{src.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {logs.length === 0 && (
            <p className="text-center text-gray-500 py-8">Нет записей</p>
          )}
        </div>
      )}
    </div>
  );
}
