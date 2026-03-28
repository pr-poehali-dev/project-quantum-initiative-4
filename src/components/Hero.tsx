import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import HeroBackground from "@/components/HeroBackground";
import { FormContent, FormProps } from "@/components/OrderFormContent";
import Icon from "@/components/ui/icon";

const CALCULATE_URL = "https://functions.poehali.dev/5fe1bb49-7cdd-4373-ab29-21772bb638aa";

export default function Hero() {
  const navigate = useNavigate();

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [fromConfirmed, setFromConfirmed] = useState(false);
  const [toConfirmed, setToConfirmed] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+7 ");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [carClass, setCarClass] = useState("standard");
  const [payment, setPayment] = useState("transfer");
  const [stops, setStops] = useState<string[]>([]);
  const [stopsConfirmed, setStopsConfirmed] = useState<boolean[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [price, setPrice] = useState<number | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [allPrices, setAllPrices] = useState<Record<string, number> | null>(null);
  const [hasSpecialZone, setHasSpecialZone] = useState(false);
  const [alternatives, setAlternatives] = useState<Array<{
    variant: string; km_normal: number; km_special: number; km_total: number;
    price: number; all_prices: Record<string,number>; via: string|null; time_hours: number|null; notes: string|null;
  }>>([]);
  const [extras, setExtras] = useState({ childSeat: false, pet: false, booster: false });
  const [geoHint, setGeoHint] = useState(false);
  const [formHeight, setFormHeight] = useState<number | undefined>(undefined);
  const [isYandex, setIsYandex] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addStop = () => { setStops([...stops, ""]); setStopsConfirmed([...stopsConfirmed, false]); };
  const updateStop = (i: number, v: string) => setStops(stops.map((s, idx) => idx === i ? v : s));
  const updateStopConfirmed = (i: number, v: boolean) => setStopsConfirmed(stopsConfirmed.map((c, idx) => idx === i ? v : c));
  const removeStop = (i: number) => { setStops(stops.filter((_, idx) => idx !== i)); setStopsConfirmed(stopsConfirmed.filter((_, idx) => idx !== i)); };

  useEffect(() => {
    const ua = navigator.userAgent || "";
    if (/YaBrowser/i.test(ua)) setIsYandex(true);
  }, []);

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    const shown = sessionStorage.getItem("geoHintShown");
    if (shown) return;
    const t = setTimeout(() => {
      setGeoHint(true);
      sessionStorage.setItem("geoHintShown", "1");
      setTimeout(() => setGeoHint(false), 5000);
    }, 1200);
    return () => clearTimeout(t);
  }, []);

  const dismissHint = useCallback(() => setGeoHint(false), []);

  useEffect(() => {
    const el = formRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setFormHeight(el.offsetHeight));
    ro.observe(el);
    setFormHeight(el.offsetHeight);
    return () => ro.disconnect();
  }, []);

  const confirmedStops = useMemo(
    () => stops.filter((_, i) => stopsConfirmed[i]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stops.join("|"), stopsConfirmed.join("|")]
  );

  useEffect(() => {
    if (!from.trim() || !to.trim() || !fromConfirmed || !toConfirmed) {
      setPrice(null);
      setDistanceKm(null);
      setAlternatives([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setPriceLoading(true);
      try {
        const res = await fetch(CALCULATE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ from, to, carClass, extras, stops: confirmedStops }),
        });
        let data = await res.json();
        if (typeof data === "string") data = JSON.parse(data);
        if (data.price !== undefined) {
          setPrice(data.price);
          setDistanceKm(data.distance_km);
          setAllPrices(data.all_prices ?? null);
          setHasSpecialZone(data.has_special_zone ?? false);
          setAlternatives(data.alternatives ?? []);
        }
      } catch {
        // ignore
      } finally {
        setPriceLoading(false);
      }
    }, 800);
  }, [from, to, fromConfirmed, toConfirmed, carClass, extras, confirmedStops]);

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
    from, setFrom, setFromConfirmed, to, setTo, setToConfirmed,
    date, setDate, time, setTime,
    name, setName, phone, handlePhoneChange,
    carClass, setCarClass,
    payment, setPayment,
    stops, addStop, updateStop, updateStopConfirmed, removeStop,
    errors, handleSubmit,
    defaultDate, defaultTime,
    price, distanceKm, priceLoading, allPrices,
    extras, setExtras,
    hasSpecialZone,
    alternatives,
    compact: true,
    onSelectAlternative: (alt: typeof alternatives[0]) => {
      setAllPrices(alt.all_prices);
      setPrice(alt.price);
      setDistanceKm(alt.km_total);
    },
  };

  return (
    <div className="relative" style={{ height: "100dvh", overflow: "hidden" }}>
      <HeroBackground from={fromConfirmed ? from : ""} to={toConfirmed ? to : ""} stops={confirmedStops} formHeight={formHeight} />

      {/* Подсказка геолокации */}
      <div
        className={`fixed bottom-[calc(85dvh+12px)] sm:bottom-auto sm:top-20 left-1/2 sm:left-auto sm:right-6 -translate-x-1/2 sm:translate-x-0 z-50 transition-all duration-500 ${
          geoHint ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-3 bg-[#1a1a1a] border border-[#c8d44a]/30 rounded-2xl px-4 py-3 shadow-2xl max-w-[280px]">
          <div className="w-9 h-9 rounded-full bg-[#c8d44a]/10 flex items-center justify-center shrink-0 animate-pulse">
            <Icon name="Navigation" size={18} className="text-[#c8d44a]" />
          </div>
          <div className="flex-1">
            <p className="text-white text-xs font-semibold leading-tight">Разрешите геолокацию</p>
            <p className="text-white/50 text-[10px] mt-0.5">Нажмите «Откуда» — мы определим ваше местоположение</p>
          </div>
          <button onClick={dismissHint} className="text-white/30 hover:text-white/70 transition-colors shrink-0">
            <Icon name="X" size={14} />
          </button>
        </div>
      </div>

      {/* MOBILE: форма прилипает к низу */}
      <div className="sm:hidden relative z-10 flex flex-col" style={{ height: "100dvh", overflow: "hidden" }}>
        <div className="flex-1 overflow-hidden" />
        <div ref={formRef} id="order" className={`bg-black/70 backdrop-blur-md border-t border-[#F5A623]/30 rounded-t-3xl px-3 ${isYandex ? "pt-2 pb-[36px]" : "pt-3 pb-[44px]"} w-full overflow-y-auto`} style={{ maxHeight: "78dvh" }}>
          <FormContent {...formProps} />
        </div>
      </div>

      {/* DESKTOP: форма слева, от хедера до низа */}
      <div className="hidden sm:block absolute z-10 top-[90px] bottom-[44px] left-4">
        <div id="order" className="bg-black/70 backdrop-blur-md border border-[#F5A623] rounded-3xl shadow-2xl p-5 w-[380px] h-full overflow-y-auto flex flex-col">
          <FormContent {...formProps} />
        </div>
      </div>

      {/* DESKTOP: бегущая строка внизу, начинается от формы */}
      <div className="hidden sm:block absolute z-10 bottom-0 left-0 right-0 overflow-hidden bg-[#1a1a1a]/95 backdrop-blur-sm border-t border-[#F5A623]/50">
        <div className="animate-marquee-rtl py-2 text-sm text-gray-300 whitespace-nowrap">
          <span>🔥 Такси «Юг-Трансфер»: скидка 10% на первый заказ! Подача от 30 минут. Звоните +7 (995) 614-14-14   ★   ✈️ Встретим в аэропорту с табличкой! Фиксированные цены на трансферы. «Юг-Трансфер» — надёжно.   ★   🚖 Комфортные поездки по Югу. Такси «Юг-Трансфер»: быстро, выгодно, безопасно. Заказывайте!   ★   🔥 Такси «Юг-Трансфер»: скидка 10% на первый заказ! Подача от 30 минут. Звоните +7 (995) 614-14-14   ★   ✈️ Встретим в аэропорту с табличкой! Фиксированные цены на трансферы. «Юг-Трансфер» — надёжно.   ★   🚖 Комфортные поездки по Югу. Такси «Юг-Трансфер»: быстро, выгодно, безопасно. Заказывайте!</span>
        </div>
      </div>


    </div>
  );
}