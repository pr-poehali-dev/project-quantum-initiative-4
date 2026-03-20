import { motion, MotionValue } from "framer-motion";

export default function HeroBackground({ y }: { y: MotionValue<string> }) {
  return (
    <motion.div style={{ y }} className="absolute inset-0 w-full h-full">
      <iframe
        src="https://yandex.ru/map-widget/v1/?ll=44.516781%2C56.326797&z=7&l=map&pt=&scroll=true"
        className="w-full h-full border-0"
        allowFullScreen
        title="map"
      />
      <div className="absolute inset-0 bg-black/30" />
    </motion.div>
  );
}