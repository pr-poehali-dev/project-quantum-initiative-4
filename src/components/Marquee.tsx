const messages = [
  "🔥 Такси «Юг-Трансфер»: скидка 10% на первый заказ! Подача от 30 минут. Звоните +7 (995) 614-14-14",
  "✈️ Встретим в аэропорту с табличкой! Фиксированные цены на трансферы. «Юг-Трансфер» — надёжно.",
];

const separator = "   ★   ";
const text = messages.join(separator);
const repeated = `${text}${separator}${text}${separator}`;

const Marquee = () => {
  return (
    <div className="w-full bg-[#111] border-t border-white/10 overflow-hidden whitespace-nowrap">
      <div className="inline-block animate-marquee py-2 text-sm text-gray-300">
        <span>{repeated}</span>
      </div>
    </div>
  );
};

export default Marquee;
