import { useState, useRef } from "react";
import Icon from "@/components/ui/icon";
import { ExtrasState, ExtrasSheet, PaymentSheet } from "@/components/OrderFormSheets";

function GeoPermissionModal({ onAllow, onCancel, blocked }: { onAllow: () => void; onCancel: () => void; blocked: boolean }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-[#1e1e1e] rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-white/10">
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[#c8d44a]/15 mx-auto mb-4">
          <Icon name="MapPin" size={28} className="text-[#c8d44a]" />
        </div>
        <h3 className="text-white text-lg font-semibold text-center mb-2">Доступ к геолокации</h3>
        {blocked ? (
          <p className="text-gray-400 text-sm text-center mb-6">
            Доступ заблокирован. Нажмите на значок 🔒 в адресной строке браузера, разрешите геолокацию и попробуйте снова.
          </p>
        ) : (
          <p className="text-gray-400 text-sm text-center mb-6">
            Нажмите «Разрешить» — браузер запросит доступ к вашему местоположению и автоматически заполнит адрес.
          </p>
        )}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-full border border-white/20 text-gray-400 text-sm hover:bg-white/5 transition"
          >
            Отмена
          </button>
          {!blocked && (
            <button
              onClick={onAllow}
              className="flex-1 py-2.5 rounded-full bg-[#c8d44a] text-black text-sm font-semibold hover:bg-[#d4e050] transition"
            >
              Разрешить
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const SUGGEST_URL = "https://functions.poehali.dev/dc36ae61-2640-4aae-a1f2-4b07623e0311";

async function fetchSuggestions(query: string): Promise<string[]> {
  if (query.length < 2) return [];
  try {
    const res = await fetch(`${SUGGEST_URL}?action=suggest&q=${encodeURIComponent(query)}`);
    const data = await res.json();
    return data.results || [];
  } catch {
    return [];
  }
}

export const CAR_CLASSES = [
  { id: "urgent",   label: "Срочный",  emoji: "🚖", sub: "-" },
  { id: "standard", label: "Стандарт", emoji: "🚕", sub: "-" },
  { id: "comfort",  label: "Комфорт",  emoji: "🚗", sub: "-" },
  { id: "minivan",  label: "Минивэн",  emoji: "🚐", sub: "-" },
  { id: "business", label: "Бизнес",   emoji: "🚙", sub: "-" },
];

export interface FormProps {
  from: string; setFrom: (v: string) => void;
  to: string; setTo: (v: string) => void;
  date: string; setDate: (v: string) => void;
  time: string; setTime: (v: string) => void;
  name: string; setName: (v: string) => void;
  phone: string; handlePhoneChange: (v: string) => void;
  carClass: string; setCarClass: (v: string) => void;
  payment: string; setPayment: (v: string) => void;
  stops: string[]; addStop: () => void; updateStop: (i: number, v: string) => void; removeStop: (i: number) => void;
  errors: Record<string, string>;
  handleSubmit: (e: React.FormEvent) => void;
  defaultDate: string;
  defaultTime: string;
  price?: number | null;
  distanceKm?: number | null;
  priceLoading?: boolean;
  allPrices?: Record<string, number> | null;
  extras?: { childSeat: boolean; pet: boolean; booster: boolean };
  setExtras?: (v: { childSeat: boolean; pet: boolean; booster: boolean }) => void;
}

function CityInput({
  placeholder,
  value,
  onChange,
  showGeo,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  showGeo?: boolean;
}) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [focused, setFocused] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [showGeoModal, setShowGeoModal] = useState(false);
  const [geoBlocked, setGeoBlocked] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleInput = (v: string) => {
    onChange(v);
    setActiveIdx(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (v.length >= 2) {
      debounceRef.current = setTimeout(async () => {
        const results = await fetchSuggestions(v);
        setSuggestions(results);
      }, 300);
    } else {
      setSuggestions([]);
    }
  };

  const selectSuggestion = (city: string) => {
    onChange(city);
    setSuggestions([]);
    setActiveIdx(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!suggestions.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggestions.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)); }
    if (e.key === "Enter" && activeIdx >= 0) { e.preventDefault(); selectSuggestion(suggestions[activeIdx]); }
    if (e.key === "Escape") setSuggestions([]);
  };

  const requestGeo = () => {
    if (!navigator.geolocation) return;
    setShowGeoModal(false);
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `${SUGGEST_URL}?action=geocode&lon=${coords.longitude}&lat=${coords.latitude}`
          );
          const data = await res.json();
          if (data.address) onChange(data.address);
        } catch {
          // ignore
        } finally {
          setGeoLoading(false);
        }
      },
      (err) => {
        setGeoLoading(false);
        setGeoBlocked(err.code === 1);
        setShowGeoModal(true);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleGeo = () => {
    setGeoBlocked(false);
    setShowGeoModal(true);
  };

  const handleFocus = () => {
    setFocused(true);
  };

  return (
    <div className="relative">
      {showGeoModal && (
        <GeoPermissionModal
          blocked={geoBlocked}
          onAllow={requestGeo}
          onCancel={() => setShowGeoModal(false)}
        />
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => handleInput(e.target.value)}
        onFocus={handleFocus}
        onBlur={() => setTimeout(() => { setFocused(false); setSuggestions([]); }, 200)}
        onKeyDown={handleKeyDown}
        placeholder={geoLoading ? "Определяем местоположение..." : placeholder}
        className={`w-full px-4 py-2 bg-[#2a2a2a] rounded-full text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#9aab2a]/60 transition ${showGeo ? "pr-10" : ""}`}
      />
      {showGeo && (
        <button
          type="button"
          onClick={handleGeo}
          disabled={geoLoading}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center bg-white rounded-full shadow-md hover:bg-gray-100 transition active:scale-95"
          title="Определить моё местоположение"
        >
          {geoLoading ? (
            <span className="w-3.5 h-3.5 border-2 border-gray-400 border-t-[#9aab2a] rounded-full animate-spin block" />
          ) : (
            <Icon name="Navigation" size={14} className="text-gray-700" />
          )}
        </button>
      )}
      {focused && suggestions.length > 0 && (
        <ul className="absolute z-50 top-full left-0 right-0 mt-1 bg-[#222] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          {suggestions.map((city, idx) => (
            <li
              key={city}
              onMouseDown={() => selectSuggestion(city)}
              className={`flex items-center gap-2.5 px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                idx === activeIdx ? "bg-[#9aab2a]/20 text-[#c8d44a]" : "text-gray-200 hover:bg-white/8"
              }`}
            >
              <Icon name="MapPin" size={13} className={idx === activeIdx ? "text-[#c8d44a]" : "text-gray-500"} />
              <span className="truncate">{city}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function FormContent(p: FormProps) {
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [extrasOpen, setExtrasOpen] = useState(false);
  const [extras, setExtras] = useState<ExtrasState>({
    childSeat: p.extras?.childSeat ?? false,
    pet: p.extras?.pet ?? false,
    booster: p.extras?.booster ?? false,
    passengers: 2, luggage: 3, comment: "",
  });

  const handleExtrasChange = (v: ExtrasState) => {
    setExtras(v);
    if (p.setExtras) p.setExtras({ childSeat: v.childSeat, pet: v.pet, booster: v.booster });
  };

  return (
    <div className="relative">
      {paymentOpen && (
        <PaymentSheet
          onClose={() => setPaymentOpen(false)}
          selected={p.payment}
          setSelected={p.setPayment}
        />
      )}
      {extrasOpen && (
        <ExtrasSheet
          onClose={() => setExtrasOpen(false)}
          extras={extras}
          setExtras={handleExtrasChange}
        />
      )}
      <form onSubmit={p.handleSubmit} noValidate className="flex flex-col gap-1.5">
        {/* Откуда */}
        <div>
          <CityInput placeholder="Откуда?" value={p.from} onChange={p.setFrom} showGeo />
          {p.errors.from && <p className="text-red-400 text-xs mt-0.5 pl-4">{p.errors.from}</p>}
        </div>

        {/* Промежуточные адреса */}
        {p.stops.map((stop, i) => (
          <div key={i} className="relative">
            <CityInput placeholder="Промежуточный адрес" value={stop} onChange={(v) => p.updateStop(i, v)} />
            <button
              type="button"
              onClick={() => p.removeStop(i)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
            >
              <Icon name="X" size={14} />
            </button>
          </div>
        ))}

        {/* Добавить промежуточный */}
        <button
          type="button"
          onClick={p.addStop}
          className="flex items-center gap-1.5 text-gray-400 hover:text-white text-xs transition pl-2"
        >
          <span className="w-4 h-4 rounded-full border border-gray-500 flex items-center justify-center text-gray-400 text-sm leading-none">+</span>
          промежуточный адрес
        </button>

        {/* Куда */}
        <div>
          <CityInput placeholder="Куда?" value={p.to} onChange={p.setTo} showGeo />
          {p.errors.to && <p className="text-red-400 text-xs mt-0.5 pl-4">{p.errors.to}</p>}
        </div>

        {/* Дата + Время */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="bg-[#2a2a2a] rounded-full px-4 py-1.5 flex flex-col">
              <span className="text-gray-400 text-[10px]">Дата поездки</span>
              <input
                type="date"
                value={p.date}
                onChange={(e) => p.setDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                placeholder={p.defaultDate}
                className="bg-transparent text-white text-sm font-semibold focus:outline-none w-full [color-scheme:dark]"
              />
            </div>
            {p.errors.date && <p className="text-red-400 text-xs mt-0.5 pl-4">{p.errors.date}</p>}
          </div>
          <div>
            <div className="bg-[#2a2a2a] rounded-full px-4 py-1.5 flex flex-col">
              <span className="text-gray-400 text-[10px]">Во сколько?</span>
              <input
                type="time"
                value={p.time}
                onChange={(e) => p.setTime(e.target.value)}
                placeholder={p.defaultTime}
                className="bg-transparent text-white text-sm font-semibold focus:outline-none w-full [color-scheme:dark]"
              />
            </div>
            {p.errors.time && <p className="text-red-400 text-xs mt-0.5 pl-4">{p.errors.time}</p>}
          </div>
        </div>

        {/* Имя + Телефон */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <input
              type="text"
              value={p.name}
              onChange={(e) => p.setName(e.target.value)}
              placeholder="Ваше имя"
              className="w-full px-4 py-2 bg-[#2a2a2a] rounded-full text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#9aab2a]/60 transition"
            />
            {p.errors.name && <p className="text-red-400 text-xs mt-0.5 pl-4">{p.errors.name}</p>}
          </div>
          <div>
            <input
              type="tel"
              value={p.phone}
              onChange={(e) => p.handlePhoneChange(e.target.value)}
              placeholder="Номер телефона"
              className="w-full px-4 py-2 bg-[#2a2a2a] rounded-full text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#9aab2a]/60 transition"
            />
            {p.errors.phone && <p className="text-red-400 text-xs mt-0.5 pl-4">{p.errors.phone}</p>}
          </div>
        </div>

        {/* Класс авто */}
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-1.5 min-w-max">
            {CAR_CLASSES.map((cls) => {
              const clsPrice = p.allPrices?.[cls.id];
              return (
                <button
                  key={cls.id}
                  type="button"
                  onClick={() => p.setCarClass(cls.id)}
                  className={`flex flex-col items-center gap-0 px-2.5 py-1.5 rounded-xl transition-all min-w-[60px] ${
                    p.carClass === cls.id
                      ? "bg-[#3a3a2a] border-2 border-[#9aab2a]"
                      : "bg-[#2a2a2a] border-2 border-transparent"
                  }`}
                >
                  <span className="text-base">{cls.emoji}</span>
                  <span className={`text-[10px] font-semibold ${p.carClass === cls.id ? "text-[#c8d44a]" : "text-gray-300"}`}>
                    {cls.label}
                  </span>
                  {clsPrice != null ? (
                    <span className="text-[9px] text-[#9aab2a] font-bold leading-tight">
                      {clsPrice.toLocaleString("ru-RU")}₽
                    </span>
                  ) : p.priceLoading ? (
                    <span className="text-[9px] text-gray-500">...</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-2 mt-1">
          <button
            type="button"
            onClick={() => setPaymentOpen(true)}
            className="w-9 h-9 flex items-center justify-center bg-[#2a2a2a] rounded-full shrink-0"
            title="Способ оплаты"
          >
            <Icon name="Wallet" size={16} className="text-[#c8d44a]" />
          </button>
          <button
            type="submit"
            className="flex-1 bg-[#9aab2a] hover:bg-[#b0c430] text-black font-bold text-sm py-2 rounded-full transition-colors duration-200 shadow-lg flex flex-col items-center leading-tight"
          >
            {p.priceLoading ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin block" />
                Считаем...
              </span>
            ) : p.price != null ? (
              <>
                <span>Заказать</span>
                <span className="text-[11px] font-black opacity-80">{p.price.toLocaleString("ru-RU")} ₽ · {p.distanceKm} км</span>
              </>
            ) : (
              <span>Отправить заявку</span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setExtrasOpen(true)}
            className="w-9 h-9 flex items-center justify-center bg-[#2a2a2a] rounded-full shrink-0"
            title="Доп. услуги"
          >
            <Icon name="SlidersHorizontal" size={16} className="text-[#c8d44a]" />
          </button>
        </div>


      </form>
    </div>
  );
}