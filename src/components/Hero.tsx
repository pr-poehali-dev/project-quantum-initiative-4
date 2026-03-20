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
  { id: "economy", label: "Эконом", sub: "Solaris, Rio, Polo", icon: "Car" },
  { id: "comfort", label: "Комфорт", sub: "Camry, Octavia, K5", icon: "Car" },
  { id: "minivan", label: "Минивэн", sub: "Vito, 7 мест", icon: "Bus" },
  { id: "business", label: "Бизнес", sub: "E-Class, 5 Series", icon: "Car" },
];

const CHILD_SEAT_AGES = [
  { id: "0plus", label: "0+" },
  { id: "1-4", label: "1–4 года" },
  { id: "5-12", label: "5–12 лет" },
];

const PAYMENT_OPTIONS = [
  { id: "cash", label: "Наличные", icon: "Banknote" },
  { id: "card", label: "Карта", icon: "CreditCard" },
  { id: "invoice", label: "Безнал", icon: "Receipt" },
];

function CityInput({
  label,
  value,
  onChange,
  icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  icon: string;
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
      <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
        {label}
      </label>
      <div className="relative">
        <Icon name={icon} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-blue" />
        <input
          type="text"
          value={value}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder={label}
          className="w-full pl-9 pr-3 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition"
        />
      </div>
      {focused && suggestions.length > 0 && (
        <ul className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {suggestions.map((city) => (
            <li
              key={city}
              onMouseDown={() => { onChange(city); setSuggestions([]); }}
              className="px-4 py-2 text-sm hover:bg-blue-50 cursor-pointer"
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
  const [carClass, setCarClass] = useState("comfort");
  const [childSeat, setChildSeat] = useState(false);
  const [childSeatAge, setChildSeatAge] = useState("1-4");
  const [luggage, setLuggage] = useState(false);
  const [pet, setPet] = useState(false);
  const [payment, setPayment] = useState("cash");
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    if (!from.trim()) e.from = "Укажите город отправления";
    if (!to.trim()) e.to = "Укажите город назначения";
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
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 pt-24 pb-12">
        {/* Hero text */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight mb-3">
            Межгородской трансфер<br />
            <span className="text-brand-yellow">Юг России и Донбасс</span>
          </h1>
          <p className="text-white/80 text-base sm:text-lg max-w-xl mx-auto">
            Комфортные поездки по всему югу России. Профессиональные водители, фиксированные цены.
          </p>
        </div>

        {/* Order form card */}
        <div id="order" className="bg-white rounded-2xl shadow-2xl p-5 sm:p-7 max-w-4xl mx-auto">
          <h2 className="text-lg font-bold text-brand-dark mb-5">Оформить заказ</h2>
          <form onSubmit={handleSubmit} noValidate>
            {/* Row 1: from, to, name, phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <CityInput label="Откуда" value={from} onChange={setFrom} icon="MapPin" />
                {errors.from && <p className="text-red-500 text-xs mt-1">{errors.from}</p>}
              </div>
              <div>
                <CityInput label="Куда" value={to} onChange={setTo} icon="Navigation" />
                {errors.to && <p className="text-red-500 text-xs mt-1">{errors.to}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Имя</label>
                <div className="relative">
                  <Icon name="User" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-blue" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ваше имя"
                    className="w-full pl-9 pr-3 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition"
                  />
                </div>
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Телефон</label>
                <div className="relative">
                  <Icon name="Phone" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-blue" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="+7 (___) ___-__-__"
                    className="w-full pl-9 pr-3 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition"
                  />
                </div>
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>
            </div>

            {/* Row 2: date, time */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Дата</label>
                <div className="relative">
                  <Icon name="Calendar" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-blue" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full pl-9 pr-3 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition"
                  />
                </div>
                {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Время</label>
                <div className="relative">
                  <Icon name="Clock" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-blue" />
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full pl-9 pr-3 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition"
                  />
                </div>
                {errors.time && <p className="text-red-500 text-xs mt-1">{errors.time}</p>}
              </div>
            </div>

            {/* Car class */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Класс автомобиля</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CAR_CLASSES.map((cls) => (
                  <label
                    key={cls.id}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      carClass === cls.id
                        ? "border-brand-blue bg-blue-50"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="carClass"
                      value={cls.id}
                      checked={carClass === cls.id}
                      onChange={() => setCarClass(cls.id)}
                      className="sr-only"
                    />
                    <Icon name={cls.icon} size={20} className={carClass === cls.id ? "text-brand-blue" : "text-gray-400"} />
                    <span className={`text-sm font-semibold ${carClass === cls.id ? "text-brand-blue" : "text-gray-700"}`}>
                      {cls.label}
                    </span>
                    <span className="text-xs text-gray-400 text-center leading-tight">{cls.sub}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Options */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Дополнительно</p>
              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={childSeat}
                    onChange={(e) => setChildSeat(e.target.checked)}
                    className="w-4 h-4 accent-brand-blue"
                  />
                  <span className="text-sm text-gray-700">Детское кресло</span>
                </label>
                {childSeat && (
                  <div className="flex gap-2 ml-2">
                    {CHILD_SEAT_AGES.map((age) => (
                      <label key={age.id} className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="childSeatAge"
                          value={age.id}
                          checked={childSeatAge === age.id}
                          onChange={() => setChildSeatAge(age.id)}
                          className="accent-brand-blue"
                        />
                        <span className="text-xs text-gray-600">{age.label}</span>
                      </label>
                    ))}
                  </div>
                )}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={luggage}
                    onChange={(e) => setLuggage(e.target.checked)}
                    className="w-4 h-4 accent-brand-blue"
                  />
                  <span className="text-sm text-gray-700">Много багажа</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={pet}
                    onChange={(e) => setPet(e.target.checked)}
                    className="w-4 h-4 accent-brand-blue"
                  />
                  <span className="text-sm text-gray-700">Животное в переноске</span>
                </label>
              </div>
            </div>

            {/* Payment + submit */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Оплата</p>
                <div className="flex gap-2 flex-wrap">
                  {PAYMENT_OPTIONS.map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 cursor-pointer transition-all text-sm ${
                        payment === opt.id
                          ? "border-brand-blue bg-blue-50 text-brand-blue font-semibold"
                          : "border-gray-200 text-gray-600 hover:border-blue-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={opt.id}
                        checked={payment === opt.id}
                        onChange={() => setPayment(opt.id)}
                        className="sr-only"
                      />
                      <Icon name={opt.icon} size={15} />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto bg-brand-yellow hover:bg-yellow-400 text-brand-dark font-bold text-base px-8 py-3 rounded-xl transition-colors duration-200 whitespace-nowrap shadow-lg"
              >
                Заказать →
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
