import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import funcUrls from "../../backend/func2url.json";
import LoginForm from "./admin/LoginForm";
import RouteCheckSection from "./admin/RouteCheckSection";
import RecalcSection from "./admin/RecalcSection";
import RoutesListSection from "./admin/RoutesListSection";
import type { Route, CheckResult, DailyReport, FixResult } from "./admin/types";

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

        <RecalcSection
          recalcRunning={recalcRunning}
          recalcProgress={recalcProgress}
          checkRunning={checkRunning}
          onRecalcAll={recalcAll}
        />

        <RoutesListSection
          routes={routes}
          loading={loading}
          search={search}
          onSearchChange={setSearch}
        />
      </div>
    </div>
  );
}

export default function Admin() {
  const [authed, setAuthed] = useState(sessionStorage.getItem("admin_auth") === "1");

  if (!authed) return <LoginForm onLogin={() => setAuthed(true)} />;
  return <RoutesTable />;
}
