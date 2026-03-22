import { useState } from "react";
import { useNavigate } from "react-router-dom";
import HeroBackground from "@/components/HeroBackground";
import { FormContent, FormProps } from "@/components/OrderFormContent";
import { useMotionValue } from "framer-motion";

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
  const addStop = () => setStops([...stops, ""]);
  const updateStop = (i: number, v: string) => setStops(stops.map((s, idx) => idx === i ? v : s));
  const removeStop = (i: number) => setStops(stops.filter((_, idx) => idx !== i));
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
    stops, addStop, updateStop, removeStop,
    errors, handleSubmit,
    defaultDate, defaultTime,
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
        <div id="order" className="bg-[#1a1a1a] rounded-tr-3xl shadow-2xl p-6 w-[420px] overflow-y-auto" style={{ maxHeight: "calc(100dvh - 64px)" }}>
          <FormContent {...formProps} />
        </div>
      </div>
    </div>
  );
}