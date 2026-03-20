import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";

const PHONE = "+7 (995) 614-14-14";
const PHONE_HREF = "tel:+79956141414";
const WHATSAPP_HREF = "https://wa.me/79956141414";
const TELEGRAM_HREF = "https://t.me/ug_transfer_online";

export default function Thanks() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-dark via-blue-900 to-blue-800 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-white rounded-3xl shadow-2xl p-8 sm:p-12 max-w-lg w-full text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <Icon name="CheckCircle" size={40} className="text-green-500" />
        </motion.div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark mb-3">
          Заявка принята!
        </h1>
        <p className="text-gray-500 text-base mb-8 leading-relaxed">
          Наш менеджер свяжется с вами в течение <strong>5 минут</strong> для подтверждения заказа.
          Пожалуйста, будьте на связи.
        </p>

        <div className="bg-gray-50 rounded-2xl p-5 mb-8">
          <p className="text-sm font-semibold text-gray-700 mb-4">Если хотите — свяжитесь сами:</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={PHONE_HREF}
              className="flex items-center justify-center gap-2 bg-brand-blue hover:bg-blue-700 text-white font-semibold px-5 py-3 rounded-xl transition-colors text-sm"
            >
              <Icon name="Phone" size={16} />
              {PHONE}
            </a>
            <div className="flex gap-2 justify-center">
              <a
                href={WHATSAPP_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-3 rounded-xl transition-colors text-sm"
              >
                <Icon name="MessageCircle" size={16} />
                WhatsApp
              </a>
              <a
                href={TELEGRAM_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-3 rounded-xl transition-colors text-sm"
              >
                <Icon name="Send" size={16} />
                Telegram
              </a>
            </div>
          </div>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-2 text-brand-blue hover:text-blue-700 text-sm font-medium transition-colors"
        >
          <Icon name="ArrowLeft" size={16} />
          Вернуться на главную
        </Link>
      </motion.div>
    </div>
  );
}