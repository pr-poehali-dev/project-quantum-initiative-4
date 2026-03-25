import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import funcUrls from "../../backend/func2url.json";

const CREDENTIALS = { login: "Yaltataran", password: "Taran220577" };

interface Route {
  id: number;
  from_city: string;
  to_city: string;
  km_normal: number;
  km_special: number;
  km_total: number;
  notes: string;
}

interface CheckResult {
  total_routes: number;
  offset: number;
  limit: number;
  checked: number;
  ok: number;
  deviations: number;
  errors: number;
  has_more: boolean;
  next_offset: number | null;
  problems: Array<{
    id: number;
    route_id?: number;
    from: string;
    to: string;
    ref_km?: number;
    calc_km?: number;
    deviation?: number;
    status?: string;
    error?: string;
    detail?: string;
  }>;
}

interface DailyReport {
  date: string;
  total: number;
  ok: number;
  deviations: number;
  errors: number;
}

function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login === CREDENTIALS.login && password === CREDENTIALS.password) {
      sessionStorage.setItem("admin_auth", "1");
      onLogin();
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-gray-800 rounded-2xl p-8 w-full max-w-sm shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <Icon name="Shield" size={28} className="text-brand-yellow" />
          <h1 className="text-2xl font-bold text-white">Admin</h1>
        </div>
        {error && (
          <div className="bg-red-500/20 text-red-300 text-sm px-4 py-2 rounded-lg mb-4">
            Неверный логин или пароль
          </div>
        )}
        <input
          type="text"
          placeholder="Логин"
          value={login}
          onChange={(e) => { setLogin(e.target.value); setError(false); }}
          className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg mb-3 outline-none focus:ring-2 focus:ring-brand-yellow"
        />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(false); }}
          className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg mb-4 outline-none focus:ring-2 focus:ring-brand-yellow"
        />
        <button type="submit" className="w-full bg-brand-yellow text-gray-900 font-bold py-3 rounded-lg hover:bg-yellow-400 transition-colors">
          Войти
        </button>
      </form>
    </div>
  );
}

interface FixResult {
  route_id: number;
  status: string;
  from: string;
  to: string;
  old_total?: number;
  new_total?: number;
  message?: string;
  error?: string;
}

function RoutesTable() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [checkRunning, setCheckRunning] = useState(false);
  const [checkProgress, setCheckProgress] = useState<string | null>(null);
  const [report, setReport] = useState<DailyReport[]>([]);
  const [problems, setProblems] = useState<CheckResult["problems"]>([]);
  const [fixingIds, setFixingIds] = useState<Set<number>>(new Set());
  const [fixResults, setFixResults] = useState<Record<number, FixResult>>({});
  const [fixingAll, setFixingAll] = useState(false);
  const [fixAllProgress, setFixAllProgress] = useState<string | null>(null);
  const [recalcRunning, setRecalcRunning] = useState(false);
  const [recalcProgress, setRecalcProgress] = useState<string | null>(null);

  const loadRoutes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(funcUrls["route-logs"] + "?action=routes&limit=1000");
      const data = await res.json();
      if (Array.isArray(data.routes)) {
        setRoutes(data.routes);
      }
    } catch {
      // fallback
    }
    setLoading(false);
  }, []);

  const loadReport = useCallback(async () => {
    try {
      const res = await fetch(funcUrls["check-routes"] + "?report=1");
      const data = await res.json();
      if (data.daily_summary) setReport(data.daily_summary);
      if (data.today_problems) setProblems(data.today_problems);
    } catch {
      // ignore
    }
  }, []);

  const fixRoute = async (routeId: number) => {
    setFixingIds((prev) => new Set(prev).add(routeId));
    try {
      const res = await fetch(funcUrls["check-routes"] + "?action=fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ route_id: routeId }),
      });
      const data: FixResult = await res.json();
      setFixResults((prev) => ({ ...prev, [routeId]: data }));
      if (data.status === "fixed") {
        loadRoutes();
        loadReport();
      }
    } catch {
      setFixResults((prev) => ({
        ...prev,
        [routeId]: { route_id: routeId, status: "error", from: "", to: "", error: "Сетевая ошибка" },
      }));
    }
    setFixingIds((prev) => {
      const next = new Set(prev);
      next.delete(routeId);
      return next;
    });
  };

  const recalcAll = async () => {
    setRecalcRunning(true);
    setRecalcProgress("Пересчёт маршрутов...");
    let offset = 0;
    const limit = 30;
    let totalUpdated = 0;
    let totalUnchanged = 0;
    let totalErrors = 0;
    let totalProcessed = 0;
    let totalRoutes = 0;

    while (true) {
      try {
        setRecalcProgress(`Пересчёт маршрутов ${offset + 1}–${offset + limit}...`);
        const res = await fetch(funcUrls["check-routes"] + "?action=recalc_all", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ offset, limit }),
        });
        const data = await res.json();
        totalRoutes = data.total;
        totalUpdated += data.updated;
        totalUnchanged += data.unchanged;
        totalErrors += data.errors;
        totalProcessed += data.processed;
        setRecalcProgress(`Обработано ${totalProcessed}/${totalRoutes}. Обновлено: ${totalUpdated}, без изменений: ${totalUnchanged}, ошибок: ${totalErrors}`);
        if (!data.has_more) break;
        offset = data.next_offset;
      } catch {
        setRecalcProgress(`Ошибка на смещении ${offset}. Обновлено: ${totalUpdated}, ошибок: ${totalErrors}`);
        break;
      }
    }

    setRecalcProgress(`Готово! Всего: ${totalProcessed}. Обновлено: ${totalUpdated}, без изменений: ${totalUnchanged}, ошибок: ${totalErrors}`);
    setRecalcRunning(false);
    loadRoutes();
    loadReport();
  };

  const fixAllProblems = async () => {
    setFixingAll(true);
    setFixAllProgress("Исправление маршрутов...");
    try {
      const res = await fetch(funcUrls["check-routes"] + "?action=fix_all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const data = await res.json();
      setFixAllProgress(
        `Готово: исправлено ${data.fixed}, пропущено ${data.skipped}, ошибок ${data.errors}`
      );
      loadRoutes();
      loadReport();
    } catch {
      setFixAllProgress("Ошибка при исправлении");
    }
    setFixingAll(false);
  };

  useEffect(() => {
    loadRoutes();
    loadReport();
  }, [loadRoutes, loadReport]);

  const runCheck = async () => {
    setCheckRunning(true);
    setCheckProgress("Запуск проверки...");
    let offset = 0;
    const limit = 20;
    let totalOk = 0;
    let totalDev = 0;
    let totalErr = 0;
    let totalChecked = 0;

     
    while (true) {
      try {
        setCheckProgress(`Проверка маршрутов ${offset + 1}–${offset + limit}...`);
        const res = await fetch(funcUrls["check-routes"] + `?offset=${offset}&limit=${limit}`);
        const data: CheckResult = await res.json();
        totalOk += data.ok;
        totalDev += data.deviations;
        totalErr += data.errors;
        totalChecked += data.checked;

        if (!data.has_more) break;
        offset = data.next_offset!;
      } catch {
        setCheckProgress("Ошибка при проверке");
        break;
      }
    }

    setCheckProgress(`Готово: ${totalChecked} маршрутов. OK: ${totalOk}, Отклонений: ${totalDev}, Ошибок: ${totalErr}`);
    setCheckRunning(false);
    loadReport();
  };

  const filtered = routes.filter((r) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return r.from_city.toLowerCase().includes(s) || r.to_city.toLowerCase().includes(s);
  });

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Icon name="Shield" size={24} className="text-brand-yellow" />
            <h1 className="text-2xl font-bold">Админ-панель</h1>
          </div>
          <button
            onClick={() => { sessionStorage.removeItem("admin_auth"); window.location.reload(); }}
            className="text-sm text-gray-400 hover:text-white flex items-center gap-1"
          >
            <Icon name="LogOut" size={16} /> Выйти
          </button>
        </div>

        {/* Check section */}
        <div className="bg-gray-800 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Icon name="ScanSearch" size={20} className="text-blue-400" />
              Проверка маршрутов
            </h2>
            <button
              onClick={runCheck}
              disabled={checkRunning}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:opacity-50 text-white font-medium px-5 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              {checkRunning ? (
                <Icon name="Loader2" size={18} className="animate-spin" />
              ) : (
                <Icon name="Play" size={18} />
              )}
              {checkRunning ? "Проверка..." : "Запустить проверку"}
            </button>
          </div>
          {checkProgress && (
            <div className={`text-sm px-4 py-2 rounded-lg mb-4 ${checkRunning ? "bg-blue-500/20 text-blue-300" : "bg-green-500/20 text-green-300"}`}>
              {checkProgress}
            </div>
          )}

          {report.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-gray-400 mb-2">Последние проверки:</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-700">
                      <th className="text-left py-2 px-3">Дата</th>
                      <th className="text-right py-2 px-3">Всего</th>
                      <th className="text-right py-2 px-3">OK</th>
                      <th className="text-right py-2 px-3">Отклонения</th>
                      <th className="text-right py-2 px-3">Ошибки</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.slice(0, 7).map((d) => (
                      <tr key={d.date} className="border-b border-gray-700/50">
                        <td className="py-2 px-3">{d.date}</td>
                        <td className="text-right py-2 px-3">{d.total}</td>
                        <td className="text-right py-2 px-3 text-green-400">{d.ok}</td>
                        <td className="text-right py-2 px-3 text-yellow-400">{d.deviations}</td>
                        <td className="text-right py-2 px-3 text-red-400">{d.errors}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {problems.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-400">Проблемные маршруты сегодня ({problems.length}):</p>
                <button
                  onClick={fixAllProblems}
                  disabled={fixingAll || checkRunning}
                  className="bg-orange-600 hover:bg-orange-500 disabled:bg-orange-800 disabled:opacity-50 text-white text-sm font-medium px-4 py-1.5 rounded-lg flex items-center gap-2 transition-colors"
                >
                  {fixingAll ? (
                    <Icon name="Loader2" size={14} className="animate-spin" />
                  ) : (
                    <Icon name="Wrench" size={14} />
                  )}
                  {fixingAll ? "Исправляю..." : "Исправить все"}
                </button>
              </div>
              {fixAllProgress && (
                <div className={`text-sm px-4 py-2 rounded-lg mb-3 ${fixingAll ? "bg-orange-500/20 text-orange-300" : "bg-green-500/20 text-green-300"}`}>
                  {fixAllProgress}
                </div>
              )}
              <div className="overflow-x-auto max-h-80 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-800">
                    <tr className="text-gray-400 border-b border-gray-700">
                      <th className="text-left py-2 px-3">Маршрут</th>
                      <th className="text-right py-2 px-3">Эталон</th>
                      <th className="text-right py-2 px-3">Расчёт</th>
                      <th className="text-right py-2 px-3">Откл. %</th>
                      <th className="text-right py-2 px-3">Действие</th>
                    </tr>
                  </thead>
                  <tbody>
                    {problems.map((p, i) => {
                      const rid = p.route_id ?? p.id;
                      const fixing = fixingIds.has(rid);
                      const result = fixResults[rid];
                      return (
                        <tr key={i} className="border-b border-gray-700/50">
                          <td className="py-2 px-3">{p.from} → {p.to}</td>
                          <td className="text-right py-2 px-3">{p.ref_km} км</td>
                          <td className="text-right py-2 px-3">{p.calc_km ?? "—"} км</td>
                          <td className="text-right py-2 px-3 text-yellow-400">{p.deviation ?? "err"}%</td>
                          <td className="text-right py-2 px-3">
                            {result?.status === "fixed" ? (
                              <span className="text-green-400 text-xs flex items-center justify-end gap-1">
                                <Icon name="Check" size={12} /> {result.new_total} км
                              </span>
                            ) : result?.status === "ok" ? (
                              <span className="text-gray-400 text-xs">В норме</span>
                            ) : result?.status === "error" ? (
                              <span className="text-red-400 text-xs">Ошибка</span>
                            ) : (
                              <button
                                onClick={() => fixRoute(rid)}
                                disabled={fixing || fixingAll}
                                className="bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs px-3 py-1 rounded flex items-center gap-1 ml-auto transition-colors"
                              >
                                {fixing ? (
                                  <Icon name="Loader2" size={12} className="animate-spin" />
                                ) : (
                                  <Icon name="Wrench" size={12} />
                                )}
                                {fixing ? "..." : "Исправить"}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Recalc all section */}
        <div className="bg-gray-800 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Icon name="RefreshCw" size={20} className="text-purple-400" />
                Пересчёт всех маршрутов
              </h2>
              <p className="text-sm text-gray-400 mt-1">Принудительно пересчитать все эталонные расстояния через OSRM</p>
            </div>
            <button
              onClick={recalcAll}
              disabled={recalcRunning || checkRunning}
              className="bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 disabled:opacity-50 text-white font-medium px-5 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              {recalcRunning ? (
                <Icon name="Loader2" size={18} className="animate-spin" />
              ) : (
                <Icon name="RefreshCw" size={18} />
              )}
              {recalcRunning ? "Пересчёт..." : "Пересчитать все"}
            </button>
          </div>
          {recalcProgress && (
            <div className={`text-sm px-4 py-2 rounded-lg ${recalcRunning ? "bg-purple-500/20 text-purple-300" : "bg-green-500/20 text-green-300"}`}>
              {recalcProgress}
            </div>
          )}
        </div>

        {/* Routes table */}
        <div className="bg-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Icon name="Route" size={20} className="text-green-400" />
              База маршрутов ({routes.length})
            </h2>
            <div className="relative">
              <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск города..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-gray-700 text-white pl-9 pr-4 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-yellow w-64"
              />
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
                    <th className="text-left py-2 px-3">ID</th>
                    <th className="text-left py-2 px-3">Откуда</th>
                    <th className="text-left py-2 px-3">Куда</th>
                    <th className="text-right py-2 px-3">Обычн. км</th>
                    <th className="text-right py-2 px-3">Спец. км</th>
                    <th className="text-right py-2 px-3">Всего км</th>
                    <th className="text-left py-2 px-3">Заметка</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                      <td className="py-2 px-3 text-gray-500">{r.id}</td>
                      <td className="py-2 px-3">{r.from_city}</td>
                      <td className="py-2 px-3">{r.to_city}</td>
                      <td className="text-right py-2 px-3">{r.km_normal}</td>
                      <td className="text-right py-2 px-3 text-orange-400">{r.km_special > 0 ? r.km_special : "—"}</td>
                      <td className="text-right py-2 px-3 font-medium">{r.km_total}</td>
                      <td className="py-2 px-3 text-gray-400 text-xs max-w-[200px] truncate">{r.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <p className="text-center text-gray-500 py-8">Маршруты не найдены</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Admin() {
  const [authed, setAuthed] = useState(sessionStorage.getItem("admin_auth") === "1");

  if (!authed) return <LoginForm onLogin={() => setAuthed(true)} />;
  return <RoutesTable />;
}