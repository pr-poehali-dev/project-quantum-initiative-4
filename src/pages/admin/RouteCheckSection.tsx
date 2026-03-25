import Icon from "@/components/ui/icon";
import type { DailyReport, CheckProblem, FixResult } from "./types";

interface RouteCheckSectionProps {
  checkRunning: boolean;
  checkProgress: string | null;
  report: DailyReport[];
  problems: CheckProblem[];
  fixingIds: Set<number>;
  fixResults: Record<number, FixResult>;
  fixingAll: boolean;
  fixAllProgress: string | null;
  onRunCheck: () => void;
  onFixRoute: (routeId: number) => void;
  onFixAll: () => void;
}

export default function RouteCheckSection({
  checkRunning,
  checkProgress,
  report,
  problems,
  fixingIds,
  fixResults,
  fixingAll,
  fixAllProgress,
  onRunCheck,
  onFixRoute,
  onFixAll,
}: RouteCheckSectionProps) {
  return (
    <div className="bg-gray-800 rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Icon name="ScanSearch" size={20} className="text-blue-400" />
          Проверка маршрутов
        </h2>
        <button
          onClick={onRunCheck}
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
              onClick={onFixAll}
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
                            onClick={() => onFixRoute(rid)}
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
  );
}
