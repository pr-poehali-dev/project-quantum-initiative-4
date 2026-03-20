import { useScroll, useTransform, motion } from "framer-motion";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const CITIES = [
  "Москва", "Ростов-на-Дону", "Краснодар", "Анапа", "Новороссийск",
  "Сочи", "Ставрополь", "Воронеж", "Донецк", "Ясиноватая",
  "Горловка", "Макеевка", "Луганск", "Белгород", "Курск",
  "Харьков", "Запорожье", "Геленджик", "Темрюк", "Тамань",
];

const CAR_CLASSES = [
  { id: "urgent",   label: "Срочный",  emoji: "🚖", sub: "-" },
  { id: "standard", label: "Стандарт", emoji: "🚕", sub: "-" },
  { id: "comfort",  label: "Комфорт",  emoji: "🚗", sub: "-" },
  { id: "minivan",  label: "Минивэн",  emoji: "🚐", sub: "-" },
];

function CityInput({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [focused, setFocused] = useState(false);

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

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => handleInput(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        placeholder={placeholder}
        className="w-full px-5 py-3 bg-[#2a2a2a] rounded-full text-white placeholder-gray-400 text-base focus:outline-none focus:ring-2 focus:ring-[#9aab2a]/60 transition"
      />
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

const PAYMENT_METHODS = [
  { id: "cash",     label: "Наличные" },
  { id: "transfer", label: "Перевод" },
  { id: "invoice",  label: "По номеру счета" },
];

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
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

interface ExtrasState {
  childSeat: boolean;
  pet: boolean;
  booster: boolean;
  passengers: number;
  luggage: number;
  comment: string;
}

function ExtrasSheet({ onClose, extras, setExtras }: {
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

        {/* Счётчики */}
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

        {/* Комментарий */}
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

function PaymentSheet({ onClose, selected, setSelected }: {
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

interface FormProps {
  from: string; setFrom: (v: string) => void;
  to: string; setTo: (v: string) => void;
  date: string; setDate: (v: string) => void;
  time: string; setTime: (v: string) => void;
  name: string; setName: (v: string) => void;
  phone: string; handlePhoneChange: (v: string) => void;
  carClass: string; setCarClass: (v: string) => void;
  payment: string; setPayment: (v: string) => void;
  errors: Record<string, string>;
  handleSubmit: (e: React.FormEvent) => void;
  defaultDate: string;
  defaultTime: string;
}

function FormContent(p: FormProps) {
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [extrasOpen, setExtrasOpen] = useState(false);
  const [extras, setExtras] = useState<ExtrasState>({
    childSeat: false, pet: false, booster: false,
    passengers: 2, luggage: 3, comment: "",
  });

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
        setExtras={setExtras}
      />
    )}
    <form onSubmit={p.handleSubmit} noValidate className="flex flex-col gap-2">
      {/* Откуда */}
      <div>
        <CityInput placeholder="Откуда?" value={p.from} onChange={p.setFrom} />
        {p.errors.from && <p className="text-red-400 text-xs mt-1 pl-4">{p.errors.from}</p>}
      </div>

      {/* Куда */}
      <div>
        <CityInput placeholder="Куда?" value={p.to} onChange={p.setTo} />
        {p.errors.to && <p className="text-red-400 text-xs mt-1 pl-4">{p.errors.to}</p>}
      </div>

      {/* Дата + Время */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="bg-[#2a2a2a] rounded-full px-5 py-2 flex flex-col">
            <span className="text-gray-400 text-xs">Дата поездки</span>
            <input
              type="date"
              value={p.date}
              onChange={(e) => p.setDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              placeholder={p.defaultDate}
              className="bg-transparent text-white text-sm font-semibold focus:outline-none w-full mt-0.5 [color-scheme:dark]"
            />
          </div>
          {p.errors.date && <p className="text-red-400 text-xs mt-1 pl-4">{p.errors.date}</p>}
        </div>
        <div>
          <div className="bg-[#2a2a2a] rounded-full px-5 py-2 flex flex-col">
            <span className="text-gray-400 text-xs">Во сколько?</span>
            <input
              type="time"
              value={p.time}
              onChange={(e) => p.setTime(e.target.value)}
              placeholder={p.defaultTime}
              className="bg-transparent text-white text-sm font-semibold focus:outline-none w-full mt-0.5 [color-scheme:dark]"
            />
          </div>
          {p.errors.time && <p className="text-red-400 text-xs mt-1 pl-4">{p.errors.time}</p>}
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
            className="w-full px-5 py-3 bg-[#2a2a2a] rounded-full text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#9aab2a]/60 transition"
          />
          {p.errors.name && <p className="text-red-400 text-xs mt-1 pl-4">{p.errors.name}</p>}
        </div>
        <div>
          <input
            type="tel"
            value={p.phone}
            onChange={(e) => p.handlePhoneChange(e.target.value)}
            placeholder="Номер телефона"
            className="w-full px-5 py-3 bg-[#2a2a2a] rounded-full text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#9aab2a]/60 transition"
          />
          {p.errors.phone && <p className="text-red-400 text-xs mt-1 pl-4">{p.errors.phone}</p>}
        </div>
      </div>

      {/* Класс авто */}
      <div className="overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {CAR_CLASSES.map((cls) => (
            <button
              key={cls.id}
              type="button"
              onClick={() => p.setCarClass(cls.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl transition-all min-w-[72px] ${
                p.carClass === cls.id
                  ? "bg-[#3a3a2a] border-2 border-[#9aab2a]"
                  : "bg-[#2a2a2a] border-2 border-transparent"
              }`}
            >
              <span className="text-xl">{cls.emoji}</span>
              <span className={`text-xs font-semibold ${p.carClass === cls.id ? "text-[#c8d44a]" : "text-gray-300"}`}>
                {cls.label}
              </span>
              <span className="text-[10px] text-gray-500">{cls.sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-2 mt-1">
        <button
          type="button"
          onClick={() => setPaymentOpen(true)}
          className="w-11 h-11 flex items-center justify-center bg-[#2a2a2a] rounded-full shrink-0"
          title="Способ оплаты"
        >
          <Icon name="Wallet" size={18} className="text-[#c8d44a]" />
        </button>
        <button
          type="submit"
          className="flex-1 bg-[#9aab2a] hover:bg-[#b0c430] text-black font-bold text-base py-3 rounded-full transition-colors duration-200 shadow-lg"
        >
          Отправить
        </button>
        <button
          type="button"
          onClick={() => setExtrasOpen(true)}
          className="w-11 h-11 flex items-center justify-center bg-[#2a2a2a] rounded-full shrink-0"
          title="Доп. услуги"
        >
          <Icon name="SlidersHorizontal" size={18} className="text-[#c8d44a]" />
        </button>
      </div>

      {/* Agreement */}
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          id="agreement"
          required
          className="mt-0.5 w-4 h-4 accent-[#9aab2a] shrink-0"
        />
        <label htmlFor="agreement" className="text-xs text-gray-500 leading-snug">
          Нажимая кнопку, я соглашаюсь с{" "}
          <a href="/privacy" className="underline hover:text-gray-300">политикой обработки персональных данных</a>
        </label>
      </div>
    </form>
    </div>
  );
}

export default function Hero() {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0vh", "40vh"]);
  const navigate = useNavigate();

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+7 ");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [carClass, setCarClass] = useState("standard");
  const [payment, setPayment] = useState("transfer");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const today = new Date();
  const defaultDate = today.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
  const defaultTime = today.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

  const formatPhone = (v: string) => {
    const digits = v.replace(/\D/g, "");
    let result = "+7";
    if (digits.length > 1) result += " (" + digits.slice(1, 4);
    if (digits.length >= 4) result += ") " + digits.slice(4, 7);
    if (digits.length >= 7) result += "-" + digits.slice(7, 9);
    if (digits.length >= 9) result += "-" + digits.slice(9, 11);
    return result;
  };

  const handlePhoneChange = (v: string) => {
    if (!v.startsWith("+7")) return;
    setPhone(formatPhone(v));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!from.trim()) e.from = "Укажите откуда";
    if (!to.trim()) e.to = "Укажите куда";
    if (!name.trim()) e.name = "Введите имя";
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 11) e.phone = "Введите корректный номер";
    if (!date) e.date = "Выберите дату";
    if (!time) e.time = "Выберите время";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    navigate("/thanks");
  };

  const formProps: FormProps = {
    from, setFrom, to, setTo,
    date, setDate, time, setTime,
    name, setName, phone, handlePhoneChange,
    carClass, setCarClass,
    payment, setPayment,
    errors, handleSubmit,
    defaultDate, defaultTime,
  };

  return (
    <div
      ref={container}
      className="relative overflow-hidden"
      style={{ minHeight: "100dvh" }}
    >
      {/* Parallax background */}
      <motion.div style={{ y }} className="absolute inset-0 w-full h-full">
        <div className="w-full h-full bg-gradient-to-br from-brand-dark via-blue-900 to-blue-800" />
        <div className="absolute inset-0 bg-black/40" />
      </motion.div>

      {/* MOBILE: фон сверху, форма прилипает к низу */}
      <div
        className="sm:hidden relative z-10 flex flex-col"
        style={{ minHeight: "100dvh" }}
      >
        <div className="flex-1" />
        <div id="order" className="bg-[#1a1a1a] rounded-t-3xl px-4 pt-5 pb-8 w-full">
          <FormContent {...formProps} />
        </div>
      </div>

      {/* DESKTOP: всё по центру */}
      <div className="hidden sm:flex relative z-10 w-full max-w-6xl mx-auto px-4 pt-24 pb-12 flex-col items-center">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight mb-3">
            Такси межгород<br />
            <span className="text-brand-yellow">по России</span>
          </h1>
          <p className="text-white/80 text-base sm:text-lg max-w-xl mx-auto mb-4">
            Комфортные трансферы от двери до двери. Фиксированная цена, подача 24/7.
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-sm text-white/90">
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">✅ Фиксированная цена</span>
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">✅ Подача 24/7</span>
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">✅ Детские кресла бесплатно</span>
          </div>
        </div>
        <div id="order" className="bg-[#1a1a1a] rounded-3xl shadow-2xl p-6 w-full max-w-lg">
          <FormContent {...formProps} />
        </div>
      </div>
    </div>
  );
}