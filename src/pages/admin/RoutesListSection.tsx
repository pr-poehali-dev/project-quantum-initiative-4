import { useState } from "react";
import Icon from "@/components/ui/icon";
import type { Route } from "./types";

interface RoutesListSectionProps {
  routes: Route[];
  loading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onRouteUpdated: () => void;
}

export default function RoutesListSection({
  routes,
  loading,
  search,
  onSearchChange,
  onRouteUpdated,
}: RoutesListSectionProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNormal, setEditNormal] = useState("");
  const [editSpecial, setEditSpecial] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ id: number; ok: boolean; text: string } | null>(null);

  const filtered = routes.filter((r) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return r.from_city.toLowerCase().includes(s) || r.to_city.toLowerCase().includes(s);
  });

  const startEdit = (r: Route) => {
    setEditingId(r.id);
    setEditNormal(String(r.km_normal));
    setEditSpecial(String(r.km_special));
    setSaveMsg(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setSaveMsg(null);
  };

  const saveEdit = async (id: number) => {
    setSaving(true);
    try {
      const funcUrls = (await import("../../../backend/func2url.json")).default;
      const res = await fetch(funcUrls["route-logs"] + "?action=update_route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, km_normal: parseInt(editNormal), km_special: parseInt(editSpecial) }),
      });
      const data = await res.json();
      if (data.ok) {
        setSaveMsg({ id, ok: true, text: `${data.km_total} км` });
        setEditingId(null);
        onRouteUpdated();
      } else {
        setSaveMsg({ id, ok: false, text: data.error || "Ошибка" });
      }
    } catch {
      setSaveMsg({ id, ok: false, text: "Сетевая ошибка" });
    }
    setSaving(false);
  };

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
                <th className="text-left py-2 px-3">Действие</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const isEditing = editingId === r.id;
                const msg = saveMsg?.id === r.id ? saveMsg : null;
                return (
                  <tr key={r.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    <td className="py-2 px-3 text-gray-500">{r.id}</td>
                    <td className="py-2 px-3">{r.from_city}</td>
                    <td className="py-2 px-3">{r.to_city}</td>
                    <td className="text-right py-2 px-3">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editNormal}
                          onChange={(e) => setEditNormal(e.target.value)}
                          className="w-16 bg-gray-600 text-white text-right px-2 py-1 rounded text-sm outline-none focus:ring-1 focus:ring-brand-yellow"
                        />
                      ) : (
                        r.km_normal
                      )}
                    </td>
                    <td className="text-right py-2 px-3 text-orange-400">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editSpecial}
                          onChange={(e) => setEditSpecial(e.target.value)}
                          className="w-16 bg-gray-600 text-orange-400 text-right px-2 py-1 rounded text-sm outline-none focus:ring-1 focus:ring-brand-yellow"
                        />
                      ) : (
                        r.km_special > 0 ? r.km_special : "—"
                      )}
                    </td>
                    <td className="text-right py-2 px-3 font-medium">
                      {isEditing
                        ? (parseInt(editNormal) || 0) + (parseInt(editSpecial) || 0)
                        : r.km_total}
                    </td>
                    <td className="py-2 px-3">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => saveEdit(r.id)}
                            disabled={saving}
                            className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-xs px-2 py-1 rounded flex items-center gap-1 transition-colors"
                          >
                            {saving ? <Icon name="Loader2" size={12} className="animate-spin" /> : <Icon name="Check" size={12} />}
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="bg-gray-600 hover:bg-gray-500 text-white text-xs px-2 py-1 rounded transition-colors"
                          >
                            <Icon name="X" size={12} />
                          </button>
                        </div>
                      ) : msg ? (
                        <span className={`text-xs ${msg.ok ? "text-green-400" : "text-red-400"}`}>{msg.text}</span>
                      ) : (
                        <button
                          onClick={() => startEdit(r)}
                          className="text-gray-400 hover:text-brand-yellow transition-colors"
                          title="Редактировать"
                        >
                          <Icon name="Pencil" size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
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
