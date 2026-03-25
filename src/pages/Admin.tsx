import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import funcUrls from "../../backend/func2url.json";
import LoginForm from "./admin/LoginForm";
import RouteCheckSection from "./admin/RouteCheckSection";
import RecalcSection from "./admin/RecalcSection";
import RoutesListSection from "./admin/RoutesListSection";
import CalcLogsSection from "./admin/CalcLogsSection";
import type { Route, CheckResult, DailyReport, FixResult } from "./admin/types";

type Section = "routes" | "check" | "recalc" | "logs";

const MENU_ITEMS: { key: Section; icon: string; label: string; desc: string }[] = [
  { key: "routes", icon: "Route", label: "Маршруты", desc: "База эталонных маршрутов" },
  { key: "logs", icon: "ScrollText", label: "Логи расчётов", desc: "История запросов клиентов" },
  { key: "check", icon: "ScanSearch", label: "Проверка", desc: "Проверка и исправление маршрутов" },
  { key: "recalc", icon: "RefreshCw", label: "Пересчёт", desc: "Пересчёт расстояний через OSRM" },
];

function AdminPanel() {
  const [section, setSection] = useState<Section | null>(null);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(false);
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
  const [routeCount, setRouteCount] = useState(0);
  const [logsCount, setLogsCount] = useState(0);

  const loadRoutes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(funcUrls["route-logs"] + "?action=routes&limit=1000");
      const data = await res.json();
      if (Array.isArray(data.routes)) {
        setRoutes(data.routes);
        setRouteCount(data.routes.length);
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

  const loadLogsCount = useCallback(async () => {
    try {
      const res = await fetch(funcUrls["route-logs"] + "?limit=1");
      const data = await res.json();
      setLogsCount(data.total || 0);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadRoutes();
    loadReport();
    loadLogsCount();
  }, [loadRoutes, loadReport, loadLogsCount]);

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

  const problemsCount = problems.length;
  const lastCheck = report.length > 0 ? report[0] : null;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            {section ? (
              <button
                onClick={() => setSection(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Icon name="ArrowLeft" size={24} />
              </button>
            ) : (
              <Icon name="Shield" size={24} className="text-brand-yellow" />
            )}
            <h1 className="text-2xl font-bold">
              {section ? MENU_ITEMS.find((m) => m.key === section)?.label : "Админ-панель"}
            </h1>
          </div>
          <button
            onClick={() => { sessionStorage.removeItem("admin_auth"); window.location.reload(); }}
            className="text-sm text-gray-400 hover:text-white flex items-center gap-1"
          >
            <Icon name="LogOut" size={16} /> Выйти
          </button>
        </div>

        {!section && (
          <div className="grid gap-3">
            {MENU_ITEMS.map((item) => (
              <button
                key={item.key}
                onClick={() => setSection(item.key)}
                className="bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-gray-600 rounded-xl p-5 flex items-center gap-4 transition-all text-left group"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  item.key === "routes" ? "bg-green-500/15 text-green-400" :
                  item.key === "logs" ? "bg-cyan-500/15 text-cyan-400" :
                  item.key === "check" ? "bg-blue-500/15 text-blue-400" :
                  "bg-purple-500/15 text-purple-400"
                }`}>
                  <Icon name={item.icon} size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white group-hover:text-brand-yellow transition-colors">
                    {item.label}
                  </div>
                  <div className="text-sm text-gray-400">{item.desc}</div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {item.key === "routes" && routeCount > 0 && (
                    <span className="text-sm text-gray-500">{routeCount} шт.</span>
                  )}
                  {item.key === "logs" && logsCount > 0 && (
                    <span className="text-sm text-gray-500">{logsCount} шт.</span>
                  )}
                  {item.key === "check" && problemsCount > 0 && (
                    <span className="bg-yellow-500/20 text-yellow-400 text-xs font-medium px-2.5 py-1 rounded-full">
                      {problemsCount}
                    </span>
                  )}
                  {item.key === "check" && lastCheck && (
                    <span className="text-xs text-gray-500 hidden sm:block">
                      {lastCheck.date}
                    </span>
                  )}
                  <Icon name="ChevronRight" size={20} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
                </div>
              </button>
            ))}
          </div>
        )}

        {section === "routes" && (
          <RoutesListSection
            routes={routes}
            loading={loading}
            search={search}
            onSearchChange={setSearch}
            onRouteUpdated={loadRoutes}
          />
        )}

        {section === "logs" && (
          <CalcLogsSection />
        )}

        {section === "check" && (
          <RouteCheckSection
            checkRunning={checkRunning}
            checkProgress={checkProgress}
            report={report}
            problems={problems}
            fixingIds={fixingIds}
            fixResults={fixResults}
            fixingAll={fixingAll}
            fixAllProgress={fixAllProgress}
            onRunCheck={runCheck}
            onFixRoute={fixRoute}
            onFixAll={fixAllProblems}
          />
        )}

        {section === "recalc" && (
          <RecalcSection
            recalcRunning={recalcRunning}
            recalcProgress={recalcProgress}
            checkRunning={checkRunning}
            onRecalcAll={recalcAll}
          />
        )}
      </div>
    </div>
  );
}

export default function Admin() {
  const [authed, setAuthed] = useState(sessionStorage.getItem("admin_auth") === "1");

  if (!authed) return <LoginForm onLogin={() => setAuthed(true)} />;
  return <AdminPanel />;
}