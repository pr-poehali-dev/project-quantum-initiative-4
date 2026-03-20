import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Icon from "@/components/ui/icon";

const PHONE = "+7 (995) 614-14-14";
const PHONE_HREF = "tel:+79956141414";
const EMAIL = "info@ug-transfer.ru";
const WHATSAPP_HREF = "https://wa.me/79956141414";
const TELEGRAM_HREF = "https://t.me/ug_transfer_online";

const CONTACTS = [
  {
    icon: "Phone",
    label: "Телефон",
    value: PHONE,
    href: PHONE_HREF,
    color: "bg-blue-50 text-brand-blue",
  },
  {
    icon: "MessageCircle",
    label: "WhatsApp",
    value: "Написать в WhatsApp",
    href: WHATSAPP_HREF,
    color: "bg-green-50 text-green-600",
    external: true,
  },
  {
    icon: "Send",
    label: "Telegram",
    value: "@transfer_service",
    href: TELEGRAM_HREF,
    color: "bg-blue-50 text-blue-500",
    external: true,
  },
  {
    icon: "Mail",
    label: "Email",
    value: EMAIL,
    href: `mailto:${EMAIL}`,
    color: "bg-orange-50 text-orange-500",
  },
  {
    icon: "Clock",
    label: "Режим работы",
    value: "Круглосуточно, 24/7",
    color: "bg-purple-50 text-purple-500",
  },
];

export default function Contacts() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+7 ");
  const [message, setMessage] = useState("");
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

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Введите имя";
    if (phone.replace(/\D/g, "").length < 11) e.phone = "Введите корректный номер";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    navigate("/thanks");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-dark via-blue-900 to-blue-800 pt-28 pb-12 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">Контакты</h1>
          <p className="text-white/70 max-w-lg mx-auto">
            Звоните, пишите — ответим быстро. Работаем 24/7 без выходных.
          </p>
        </div>
      </section>

      <section className="flex-1 bg-gray-50 py-14 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact cards */}
            <div>
              <h2 className="text-xl font-bold text-brand-dark mb-6">Свяжитесь с нами</h2>
              <div className="space-y-3">
                {CONTACTS.map((c, i) => (
                  <motion.div
                    key={c.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.35, delay: i * 0.07 }}
                  >
                    {c.href ? (
                      <a
                        href={c.href}
                        target={c.external ? "_blank" : undefined}
                        rel={c.external ? "noopener noreferrer" : undefined}
                        className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 group"
                      >
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${c.color}`}>
                          <Icon name={c.icon} size={20} />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-medium">{c.label}</p>
                          <p className="text-sm font-semibold text-brand-dark group-hover:text-brand-blue transition-colors">
                            {c.value}
                          </p>
                        </div>
                        <Icon name="ChevronRight" size={16} className="ml-auto text-gray-300 group-hover:text-brand-blue transition-colors" />
                      </a>
                    ) : (
                      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${c.color}`}>
                          <Icon name={c.icon} size={20} />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-medium">{c.label}</p>
                          <p className="text-sm font-semibold text-brand-dark">{c.value}</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Requisites */}
              <div className="mt-6 bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                <h3 className="font-bold text-brand-dark mb-3 text-sm uppercase tracking-wide">Реквизиты</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><span className="text-gray-400">ИП:</span> Иванов Иван Иванович</p>
                  <p><span className="text-gray-400">ИНН:</span> 0000000000</p>
                  <p><span className="text-gray-400">ОГРНИП:</span> 000000000000000</p>
                  <p><span className="text-gray-400">Расчётный счёт:</span> 40802 810 0000 0000 0000</p>
                  <p><span className="text-gray-400">Банк:</span> ПАО Сбербанк</p>
                </div>
              </div>
            </div>

            {/* Callback form */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              <h2 className="text-xl font-bold text-brand-dark mb-2">Обратный звонок</h2>
              <p className="text-sm text-gray-500 mb-6">Оставьте номер — перезвоним в течение 5 минут</p>
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Имя</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ваше имя"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition"
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Телефон</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      if (!e.target.value.startsWith("+7")) return;
                      setPhone(formatPhone(e.target.value));
                    }}
                    placeholder="+7 (___) ___-__-__"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition"
                  />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Сообщение (необязательно)</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ваш вопрос или пожелания"
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-brand-yellow hover:bg-yellow-400 text-brand-dark font-bold py-3 rounded-xl transition-colors"
                >
                  Перезвоните мне →
                </button>
                <p className="text-xs text-gray-400 text-center">
                  Нажимая кнопку, вы соглашаетесь с{" "}
                  <a href="/privacy" className="underline hover:text-gray-600">политикой конфиденциальности</a>
                </p>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}