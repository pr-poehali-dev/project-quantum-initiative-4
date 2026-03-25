import Icon from "@/components/ui/icon";

interface RecalcSectionProps {
  recalcRunning: boolean;
  recalcProgress: string | null;
  checkRunning: boolean;
  onRecalcAll: () => void;
}

export default function RecalcSection({
  recalcRunning,
  recalcProgress,
  checkRunning,
  onRecalcAll,
}: RecalcSectionProps) {
  return (
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
          onClick={onRecalcAll}
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
  );
}
