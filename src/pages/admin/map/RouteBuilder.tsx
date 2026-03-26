import Icon from "@/components/ui/icon";
import { RouteResult } from "./mapTypes";

interface RouteBuilderProps {
  fromCity: string;
  toCity: string;
  loading: boolean;
  error: string;
  routeResult: RouteResult | null;
  onFromChange: (val: string) => void;
  onToChange: (val: string) => void;
  onBuild: () => void;
}

export default function RouteBuilder({
  fromCity,
  toCity,
  loading,
  error,
  routeResult,
  onFromChange,
  onToChange,
  onBuild,
}: RouteBuilderProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && fromCity && toCity && !loading) {
      onBuild();
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Откуда (город)"
          value={fromCity}
          onChange={(e) => onFromChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="bg-gray-700 text-white px-4 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-yellow flex-1 min-w-[200px]"
        />
        <input
          type="text"
          placeholder="Куда (город)"
          value={toCity}
          onChange={(e) => onToChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="bg-gray-700 text-white px-4 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-yellow flex-1 min-w-[200px]"
        />
        <button
          onClick={onBuild}
          disabled={loading || !fromCity || !toCity}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
        >
          {loading ? (
            <Icon name="Loader2" size={16} className="animate-spin" />
          ) : (
            <Icon name="Route" size={16} />
          )}
          Построить
        </button>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {routeResult && (
        <div className="bg-gray-700/50 rounded-lg p-4 mb-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-gray-400 text-xs mb-1">Всего</div>
            <div className="text-xl font-bold">{routeResult.km_total} км</div>
          </div>
          <div>
            <div className="text-gray-400 text-xs mb-1">Обычный тариф</div>
            <div className="text-xl font-bold text-green-400">{routeResult.km_normal} км</div>
          </div>
          <div>
            <div className="text-gray-400 text-xs mb-1">Повышенный тариф</div>
            <div className="text-xl font-bold text-orange-400">{routeResult.km_special} км</div>
          </div>
          <div>
            <div className="text-gray-400 text-xs mb-1">Время в пути</div>
            <div className="text-xl font-bold">
              {routeResult.duration_hours ? `${routeResult.duration_hours} ч` : "\u2014"}
            </div>
          </div>
          <div className="col-span-2 md:col-span-4 flex flex-wrap gap-4 text-xs text-gray-500">
            <span>
              Источник: <span className="text-gray-300">{routeResult.source}</span>
            </span>
            {routeResult.zone_segments && routeResult.zone_segments.length > 0 && (
              <span>
                Зоны:{" "}
                <span className="text-orange-400">
                  {routeResult.zone_segments.map((s) => s.zone).join(", ")}
                </span>
              </span>
            )}
          </div>
        </div>
      )}
    </>
  );
}
