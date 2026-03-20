import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";

const PHONE = "+7 (995) 614-14-14";
const PHONE_HREF = "tel:+79956141414";

export default function Thanks() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-blue to-blue-900 flex items-center justify-center px-4 py-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-white rounded-2xl shadow-2xl p-10 sm:p-14 max-w-md w-full text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2, type: "spring", stiffness: 200 }}
          className="text-7xl mb-5"
        >
          ✅
        </motion.div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-blue mb-4">
          Заказ принят!
        </h1>
        <p className="text-gray-500 text-lg mb-8 leading-relaxed">
          Мы свяжемся с вами в течение <strong>5 минут</strong> для подтверждения деталей поездки.
        </p>

        <a
          href={PHONE_HREF}
          className="inline-block bg-brand-yellow hover:bg-yellow-400 text-brand-dark font-bold text-lg px-8 py-4 rounded-xl transition-colors mb-6 w-full"
        >
          📞 {PHONE}
        </a>

        <Link
          to="/"
          className="inline-flex items-center gap-2 text-brand-blue hover:text-blue-700 font-medium transition-colors"
        >
          <Icon name="ArrowLeft" size={16} />
          Вернуться на главную
        </Link>
      </motion.div>
    </div>
  );
}
