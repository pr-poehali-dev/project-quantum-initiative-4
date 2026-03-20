import Icon from "@/components/ui/icon";

export const PAYMENT_METHODS = [
  { id: "cash",     label: "Наличные" },
  { id: "transfer", label: "Перевод" },
  { id: "invoice",  label: "По номеру счета" },
];

export interface ExtrasState {
  childSeat: boolean;
  pet: boolean;
  booster: boolean;
  passengers: number;
  luggage: number;
  comment: string;
}

export function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative w-14 h-8 rounded-full transition-colors duration-200 ${on ? "bg-[#2a2a2a]" : "bg-[#3a3a3a]"}`}
    >
      <span className={`absolute top-1 w-6 h-6 rounded-full transition-all duration-200 ${on ? "left-7 bg-[#c8d44a]" : "left-1 bg-gray-500"}`} />
    </button>
  );
}

export function ExtrasSheet({ onClose, extras, setExtras }: {
  onClose: () => void;
  extras: ExtrasState;
  setExtras: (v: ExtrasState) => void;
}) {
  const toggle = (key: keyof ExtrasState) =>
    setExtras({ ...extras, [key]: !extras[key as keyof ExtrasState] });

  const counter = (key: "passengers" | "luggage", delta: number) =>
    setExtras({ ...extras, [key]: Math.max(1, (extras[key] as number) + delta) });

  return (
    <div className="absolute inset-0 z-50 bg-[#1a1a1a] rounded-t-3xl flex flex-col overflow-y-auto">
      <div className="flex items-center gap-3 px-4 pt-5 pb-4">
        <button onClick={onClose} className="text-white flex items-center gap-2 text-base font-medium">
          <Icon name="ArrowLeft" size={22} className="text-white" />
          Назад
        </button>
      </div>
      <div className="px-4 flex flex-col gap-0">
        {[
          { key: "childSeat", label: "Детское кресло" },
          { key: "pet",       label: "С домашним животным" },
          { key: "booster",   label: "Бустер" },
        ].map(({ key, label }, i, arr) => (
          <div key={key}>
            <div className="flex items-center justify-between py-5">
              <span className="text-white text-xl">{label}</span>
              <Toggle on={extras[key as keyof ExtrasState] as boolean} onToggle={() => toggle(key as keyof ExtrasState)} />
            </div>
            {i < arr.length - 1 && <div className="h-px bg-white/10" />}
          </div>
        ))}

        <div className="grid grid-cols-2 gap-3 mt-3">
          {(["passengers", "luggage"] as const).map((key) => (
            <div key={key} className="bg-[#2a2a2a] rounded-full px-4 py-3 flex flex-col items-center">
              <span className="text-gray-400 text-xs">{key === "passengers" ? "Количество человек" : "Количество багажа"}</span>
              <div className="flex items-center gap-4 mt-1">
                <button type="button" onClick={() => counter(key, -1)} className="text-gray-400 text-xl font-bold leading-none">−</button>
                <span className="text-white text-xl font-bold">{extras[key]}</span>
                <button type="button" onClick={() => counter(key, +1)} className="text-gray-400 text-xl font-bold leading-none">+</button>
              </div>
            </div>
          ))}
        </div>

        <textarea
          value={extras.comment}
          onChange={(e) => setExtras({ ...extras, comment: e.target.value })}
          placeholder="Комментарий водителю"
          rows={4}
          className="mt-3 w-full bg-[#2a2a2a] rounded-2xl px-5 py-4 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#9aab2a]/60 resize-none"
        />
      </div>
    </div>
  );
}

export function PaymentSheet({ onClose, selected, setSelected }: {
  onClose: () => void;
  selected: string;
  setSelected: (v: string) => void;
}) {
  return (
    <div className="absolute inset-0 z-50 bg-[#1a1a1a] rounded-t-3xl flex flex-col">
      <div className="flex items-center gap-3 px-4 pt-5 pb-4">
        <button onClick={onClose} className="text-white flex items-center gap-2 text-base font-medium">
          <Icon name="ArrowLeft" size={22} className="text-white" />
          Назад
        </button>
      </div>
      <div className="flex-1 px-4">
        {PAYMENT_METHODS.map((m, i) => (
          <div key={m.id}>
            <div className="flex items-center justify-between py-5">
              <span className="text-white text-xl">{m.label}</span>
              <Toggle on={selected === m.id} onToggle={() => setSelected(m.id)} />
            </div>
            {i < PAYMENT_METHODS.length - 1 && <div className="h-px bg-white/10" />}
          </div>
        ))}
      </div>
    </div>
  );
}
