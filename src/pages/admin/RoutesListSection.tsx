import Icon from "@/components/ui/icon";
import type { Route } from "./types";

interface RoutesListSectionProps {
  routes: Route[];
  loading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
}

export default function RoutesListSection({
  routes,
  loading,
  search,
  onSearchChange,
}: RoutesListSectionProps) {
  const filtered = routes.filter((r) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return r.from_city.toLowerCase().includes(s) || r.to_city.toLowerCase().includes(s);
  });

  return (
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
            onChange={(e) => onSearchChange(e.target.value)}
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
  );
}
