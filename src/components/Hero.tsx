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
  { id: "urgent",   label: "Срочный",  emoji: "🚖", sub: "Ближайший" },
  { id: "standard", label: "Стандарт", emoji: "🚕", sub: "Эконом" },
  { id: "comfort",  label: "Комфорт",  emoji: "🚗", sub: "Бизнес" },
  { id: "minivan",  label: "Минивэн",  emoji: "🚐", sub: "7 мест" },
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
        className="w-full px-5 py-4 bg-[#2a2a2a] rounded-full text-white placeholder-gray-400 text-base focus:outline-none focus:ring-2 focus:ring-[#9aab2a]/60 transition"
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

  return (
    <div
      ref={container}
      className="relative min-h-screen flex items-start justify-center overflow-hidden"
    >
      {/* Parallax background */}
      <motion.div style={{ y }} className="absolute inset-0 w-full h-full">
        <div className="w-full h-full bg-gradient-to-br from-brand-dark via-blue-900 to-blue-800" />
        <div className="absolute inset-0 bg-black/40" />
      </motion.div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 pt-16 pb-6">
        {/* Hero text — скрыто на мобильном */}
        <div className="hidden sm:block text-center mb-8">
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

        {/* Заголовок только на мобильном — компактный */}
        <div className="sm:hidden text-center mb-4">
          <h1 className="text-2xl font-extrabold text-white leading-tight">
            Такси межгород <span className="text-brand-yellow">по России</span>
          </h1>
        </div>

        {/* Order form — dark card */}
        <div id="order" className="bg-[#1a1a1a] rounded-3xl shadow-2xl p-4 sm:p-6 max-w-lg mx-auto">
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">

            {/* Откуда */}
            <div>
              <CityInput placeholder="Откуда?" value={from} onChange={setFrom} />
              {errors.from && <p className="text-red-400 text-xs mt-1 pl-4">{errors.from}</p>}
            </div>

            {/* Куда */}
            <div>
              <CityInput placeholder="Куда?" value={to} onChange={setTo} />
              {errors.to && <p className="text-red-400 text-xs mt-1 pl-4">{errors.to}</p>}
            </div>

            {/* Дата + Время */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="bg-[#2a2a2a] rounded-full px-5 py-3 flex flex-col">
                  <span className="text-gray-400 text-xs">Дата поездки</span>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    placeholder={defaultDate}
                    className="bg-transparent text-white text-sm font-semibold focus:outline-none w-full mt-0.5 [color-scheme:dark]"
                  />
                </div>
                {errors.date && <p className="text-red-400 text-xs mt-1 pl-4">{errors.date}</p>}
              </div>
              <div>
                <div className="bg-[#2a2a2a] rounded-full px-5 py-3 flex flex-col">
                  <span className="text-gray-400 text-xs">Во сколько?</span>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder={defaultTime}
                    className="bg-transparent text-white text-sm font-semibold focus:outline-none w-full mt-0.5 [color-scheme:dark]"
                  />
                </div>
                {errors.time && <p className="text-red-400 text-xs mt-1 pl-4">{errors.time}</p>}
              </div>
            </div>

            {/* Имя + Телефон */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ваше имя"
                  className="w-full px-5 py-4 bg-[#2a2a2a] rounded-full text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#9aab2a]/60 transition"
                />
                {errors.name && <p className="text-red-400 text-xs mt-1 pl-4">{errors.name}</p>}
              </div>
              <div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="+7 (___) ___-__-__"
                  className="w-full px-5 py-4 bg-[#2a2a2a] rounded-full text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#9aab2a]/60 transition"
                />
                {errors.phone && <p className="text-red-400 text-xs mt-1 pl-4">{errors.phone}</p>}
              </div>
            </div>

            {/* Класс авто */}
            <div className="overflow-x-auto -mx-1 px-1">
              <div className="flex gap-2 min-w-max">
                {CAR_CLASSES.map((cls) => (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() => setCarClass(cls.id)}
                    className={`flex flex-col items-center gap-1 px-4 py-3 rounded-2xl transition-all min-w-[80px] ${
                      carClass === cls.id
                        ? "bg-[#3a3a2a] border-2 border-[#9aab2a]"
                        : "bg-[#2a2a2a] border-2 border-transparent"
                    }`}
                  >
                    <span className="text-2xl">{cls.emoji}</span>
                    <span className={`text-xs font-semibold ${carClass === cls.id ? "text-[#c8d44a]" : "text-gray-300"}`}>
                      {cls.label}
                    </span>
                    <span className="text-[10px] text-gray-500">{cls.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit row */}
            <div className="flex items-center gap-3 mt-1">
              <button
                type="button"
                className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-[#2a2a2a] rounded-full shrink-0"
                title="Оплата"
              >
                <Icon name="Wallet" size={18} className="text-gray-400" />
              </button>
              <button
                type="submit"
                className="flex-1 bg-[#9aab2a] hover:bg-[#b0c430] text-black font-bold text-base py-3 sm:py-4 rounded-full transition-colors duration-200 shadow-lg"
              >
                Отправить
              </button>
              <button
                type="button"
                className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-[#2a2a2a] rounded-full shrink-0"
                title="Фильтры"
              >
                <Icon name="SlidersHorizontal" size={18} className="text-gray-400" />
              </button>
            </div>

            {/* Agreement */}
            <div className="flex items-start gap-2 mt-1">
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

            <p className="text-xs text-gray-500 text-center">
              Или звоните:{" "}
              <a href="tel:+79956141414" className="font-semibold text-[#c8d44a]">+7 (995) 614-14-14</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}