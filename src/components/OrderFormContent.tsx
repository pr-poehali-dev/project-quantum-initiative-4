import { useState } from "react";
import Icon from "@/components/ui/icon";
import { ExtrasState, ExtrasSheet, PaymentSheet } from "@/components/OrderFormSheets";

export const CITIES = [
  "Москва", "Ростов-на-Дону", "Краснодар", "Анапа", "Новороссийск",
  "Сочи", "Ставрополь", "Воронеж", "Донецк", "Ясиноватая",
  "Горловка", "Макеевка", "Луганск", "Белгород", "Курск",
  "Харьков", "Запорожье", "Геленджик", "Темрюк", "Тамань",
];

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

  const handleInput = (v: string) => {
    onChange(v);
    if (v.length >= 2) {
      setSuggestions(
        CITIES.filter((c) => c.toLowerCase().startsWith(v.toLowerCase())).slice(0, 6)
      );
    } else {
      setSuggestions([]);
    }
  };

  const handleGeo = () => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `https://geocode-maps.yandex.ru/1.x/?apikey=40d1649f-0493-4b70-98ba-98533de7710b&geocode=${coords.longitude},${coords.latitude}&results=1&format=json&lang=ru_RU`
          );
          const data = await res.json();
          const address =
            data?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject
              ?.metaDataProperty?.GeocoderMetaData?.text || "";
          if (address) onChange(address);
        } catch {
          // ignore
        } finally {
          setGeoLoading(false);
        }
      },
      () => setGeoLoading(false),
      { timeout: 8000 }
    );
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => handleInput(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        placeholder={placeholder}
        className={`w-full px-4 py-2 bg-[#2a2a2a] rounded-full text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#9aab2a]/60 transition ${showGeo ? "pr-10" : ""}`}
      />
      {showGeo && (
        <button
          type="button"
          onClick={handleGeo}
          disabled={geoLoading}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-md hover:bg-gray-100 transition active:scale-95"
          title="Определить моё местоположение"
        >
          {geoLoading ? (
            <span className="w-4 h-4 border-2 border-gray-400 border-t-[#9aab2a] rounded-full animate-spin block" />
          ) : (
            <Icon name="Navigation" size={16} className="text-gray-700" />
          )}
        </button>
      )}
      {focused && suggestions.length > 0 && (
        <ul className="absolute z-50 top-full left-0 right-0 mt-1 bg-[#2a2a2a] border border-white/10 rounded-2xl shadow-xl overflow-hidden">
          {suggestions.map((city) => (
            <li
              key={city}
              onMouseDown={() => { onChange(city); setSuggestions([]); }}
              className="px-5 py-3 text-sm text-gray-200 hover:bg-white/10 cursor-pointer"
            >
              {city}
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
            {CAR_CLASSES.map((cls) => (
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
              </button>
            ))}
          </div>
        </div>

        {/* Стоимость */}
        {(p.priceLoading || p.price != null) && (
          <div className="flex items-center justify-between bg-[#2a2a2a] rounded-full px-4 py-2">
            <span className="text-gray-400 text-xs">
              {p.distanceKm ? `${p.distanceKm} км` : "Считаем..."}
            </span>
            {p.priceLoading ? (
              <span className="w-4 h-4 border-2 border-gray-500 border-t-[#c8d44a] rounded-full animate-spin block" />
            ) : (
              <span className="text-[#c8d44a] font-bold text-sm">
                {p.price?.toLocaleString("ru-RU")} ₽
              </span>
            )}
          </div>
        )}

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
            className="flex-1 bg-[#9aab2a] hover:bg-[#b0c430] text-black font-bold text-sm py-2.5 rounded-full transition-colors duration-200 shadow-lg"
          >
            Отправить
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