import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import HeroBackground from "@/components/HeroBackground";
import { FormContent, FormProps } from "@/components/OrderFormContent";
import { useMotionValue } from "framer-motion";
import Icon from "@/components/ui/icon";

const CALCULATE_URL = "https://functions.poehali.dev/5fe1bb49-7cdd-4373-ab29-21772bb638aa";

export default function Hero() {
  const navigate = useNavigate();
  const y = useMotionValue("0vh");

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+7 ");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [carClass, setCarClass] = useState("standard");
  const [payment, setPayment] = useState("transfer");
  const [stops, setStops] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [price, setPrice] = useState<number | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [allPrices, setAllPrices] = useState<Record<string, number> | null>(null);
  const [extras, setExtras] = useState({ childSeat: false, pet: false, booster: false });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addStop = () => setStops([...stops, ""]);
  const updateStop = (i: number, v: string) => setStops(stops.map((s, idx) => idx === i ? v : s));
  const removeStop = (i: number) => setStops(stops.filter((_, idx) => idx !== i));

  useEffect(() => {
    if (!from.trim() || !to.trim()) {
      setPrice(null);
      setDistanceKm(null);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setPriceLoading(true);
      try {
        const res = await fetch(CALCULATE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ from, to, carClass, extras, stops }),
        });
        const data = await res.json();
        if (data.price !== undefined) {
          setPrice(data.price);
          setDistanceKm(data.distance_km);
          setAllPrices(data.all_prices ?? null);
        }
      } catch {
        // ignore
      } finally {
        setPriceLoading(false);
      }
    }, 800);
  }, [from, to, carClass, extras, stops]);

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
    stops, addStop, updateStop, removeStop,
    errors, handleSubmit,
    defaultDate, defaultTime,
    price, distanceKm, priceLoading, allPrices,
    extras, setExtras,
  };

  return (
    <div className="relative" style={{ height: "100dvh", overflow: "hidden" }}>
      <HeroBackground y={y} />

      {/* MOBILE: форма прилипает к низу */}
      <div className="sm:hidden relative z-10 flex flex-col" style={{ height: "100dvh", overflow: "hidden" }}>
        <div className="flex-1 overflow-hidden" />
        <div id="order" className="bg-[#1a1a1a] rounded-t-3xl px-4 pt-5 pb-[52px] w-full overflow-y-auto" style={{ maxHeight: "85dvh" }}>
          <FormContent {...formProps} />
        </div>
      </div>

      {/* DESKTOP: форма в левом нижнем углу */}
      <div className="hidden sm:block absolute z-10 bottom-0 left-0">
        <div id="order" className="bg-[#1a1a1a] rounded-tr-3xl shadow-2xl p-4 w-[380px] overflow-y-auto" style={{ maxHeight: "calc(100dvh - 56px)" }}>
          <FormContent {...formProps} />
        </div>
      </div>

      {/* DESKTOP: контакты в правом нижнем углу */}
      <div className="hidden sm:block absolute z-10 bottom-6 right-6">
        <div className="bg-[#1a1a1a]/80 backdrop-blur-md rounded-2xl px-5 py-4 shadow-2xl">
          <div className="flex items-center justify-between gap-6">
            <div>
              <a href="tel:+79956141414" className="text-white font-bold text-lg hover:text-brand-yellow transition-colors">
                +7 (995) 614-14-14
              </a>
              <p className="text-white/60 text-sm mt-0.5">Закажите трансфер<br />по телефону или в мессенджере</p>
            </div>
            <div className="flex items-center gap-2">
              <a href="https://t.me/ug_transfer_online" target="_blank" rel="noopener noreferrer"
                className="w-11 h-11 rounded-xl bg-blue-500/20 hover:bg-blue-500/40 flex items-center justify-center transition-colors">
                <Icon name="Send" size={20} className="text-blue-400" />
              </a>
              <a href="https://max.ru/u/f9LHodD0cOLfcwdQZmP_TA1hXG1fSHf_rVVPptGTy_7FmQh-zvIFpGfU_lg" target="_blank" rel="noopener noreferrer"
                className="w-11 h-11 rounded-xl bg-purple-500/20 hover:bg-purple-500/40 flex items-center justify-center transition-colors">
                <Icon name="MessageSquare" size={20} className="text-purple-400" />
              </a>
              <a href="tel:+79956141414"
                className="w-11 h-11 rounded-xl bg-green-500/20 hover:bg-green-500/40 flex items-center justify-center transition-colors">
                <Icon name="Phone" size={20} className="text-green-400" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}