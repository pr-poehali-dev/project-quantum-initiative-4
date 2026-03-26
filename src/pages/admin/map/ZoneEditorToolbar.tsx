import Icon from "@/components/ui/icon";
import { Zone } from "./mapTypes";

interface ZoneEditorToolbarProps {
  editMode: boolean;
  editingZoneIdx: number | null;
  zones: Zone[];
  saving: boolean;
  hasChanges: boolean;
  saveMsg: string;
  onSave: () => void;
  onCancel: () => void;
  onStartEdit: () => void;
  onSelectZone: (idx: number) => void;
}

export default function ZoneEditorToolbar({
  editMode,
  editingZoneIdx,
  zones,
  saving,
  hasChanges,
  saveMsg,
  onSave,
  onCancel,
  onStartEdit,
  onSelectZone,
}: ZoneEditorToolbarProps) {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Icon name="Map" size={20} className="text-blue-400" />
          Карта зон повышенного тарифа
        </h2>
        <div className="flex items-center gap-2">
          {editMode ? (
            <>
              {saveMsg && (
                <span className={`text-sm ${saveMsg.includes("Ошибка") ? "text-red-400" : "text-green-400"}`}>
                  {saveMsg}
                </span>
              )}
              <button
                onClick={onSave}
                disabled={saving || !hasChanges}
                className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors"
              >
                {saving ? (
                  <Icon name="Loader2" size={14} className="animate-spin" />
                ) : (
                  <Icon name="Save" size={14} />
                )}
                Сохранить
              </button>
              <button
                onClick={onCancel}
                className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors"
              >
                <Icon name="X" size={14} />
                Отмена
              </button>
            </>
          ) : (
            <button
              onClick={onStartEdit}
              className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors"
            >
              <Icon name="PenTool" size={14} />
              Редактировать зоны
            </button>
          )}
        </div>
      </div>

      {editMode && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <Icon name="Info" size={16} className="text-orange-400 mt-0.5 shrink-0" />
            <div className="text-sm text-orange-200">
              {editingZoneIdx !== null ? (
                <>
                  <strong>{zones[editingZoneIdx]?.name}</strong> — перетаскивайте точки для изменения границ.
                  Клик на середину ребра добавит новую точку. ПКМ на точку — удалить.
                </>
              ) : (
                <>Кликните на зону для редактирования.</>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {zones.map((z, idx) => (
              <button
                key={z.name}
                onClick={() => onSelectZone(idx)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  editingZoneIdx === idx
                    ? "bg-white text-gray-900"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                {z.name} ({z.polygon.length} точек)
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
