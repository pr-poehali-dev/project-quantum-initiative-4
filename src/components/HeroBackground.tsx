import { motion, MotionValue } from "framer-motion";

export default function HeroBackground({ y }: { y: MotionValue<string> }) {
  return (
    <motion.div style={{ y }} className="absolute inset-0 w-full h-full">
      <iframe
        src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d4000000!2d55.751244!3d55.751244!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sru!2sru!4v1700000000000!5m2!1sru!2sru&style=feature:all|element:labels|visibility:off"
        className="w-full h-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="map"
      />
      <div className="absolute inset-0 bg-black/30" />
    </motion.div>
  );
}