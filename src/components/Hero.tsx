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
      <div className="hidden sm:block absolute z-10 top-[130px] bottom-[44px] left-4">
        <div id="order" className="bg-black/70 backdrop-blur-md border border-[#F5A623] rounded-3xl shadow-2xl p-5 w-[380px] h-full overflow-y-auto flex flex-col">
          <FormContent {...formProps} />
        </div>
      </div>

      {/* DESKTOP: плашка контактов справа над бегущей строкой */}
      <div className="hidden sm:flex absolute z-10 bottom-[44px] right-4 bg-black/70 backdrop-blur-md border border-[#F5A623] rounded-xl px-3 py-2 flex-col gap-1 shadow-2xl">
        <div className="flex items-center gap-2">
          <a href="tel:+79843348724" className="text-white text-sm font-bold hover:text-[#c8d44a] transition">
            +7 (984) 334-87-24
          </a>
          <div className="flex items-center gap-1.5">
            <a href="https://t.me/ug_transfer_online" target="_blank" rel="noopener noreferrer" className="w-6 h-6 rounded-lg bg-[#26A5E4] flex items-center justify-center hover:scale-110 transition-transform">
              <svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.03-1.99 1.27-5.62 3.72-.53.36-1.01.54-1.44.53-.47-.01-1.38-.27-2.06-.49-.83-.27-1.49-.42-1.43-.88.03-.24.37-.49 1.02-.75 4-1.73 6.67-2.88 8.02-3.45 3.81-1.58 4.6-1.86 5.12-1.87.11 0 .37.03.54.17.14.12.18.28.2.47-.01.06.01.24 0 .38z"/></svg>
            </a>
            <a href="https://wa.me/79843348724" target="_blank" rel="noopener noreferrer" className="w-6 h-6 rounded-lg bg-[#25D366] flex items-center justify-center hover:scale-110 transition-transform">
              <svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </a>
            <a href="https://max.ru/u/f9LHodD0cOLfcwdQZmP_TA1hXG1fSHf_rVVPptGTy_7FmQh-zvIFpGfU_lg" target="_blank" rel="noopener noreferrer" className="w-6 h-6 rounded-lg bg-[#5856D6] flex items-center justify-center hover:scale-110 transition-transform">
              <span className="text-white font-bold text-[10px]">M</span>
            </a>
          </div>
        </div>
        <p className="text-gray-500 text-[11px]">Закажите трансфер по телефону или в мессенджере</p>
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