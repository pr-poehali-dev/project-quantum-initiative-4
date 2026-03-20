import { motion, MotionValue } from "framer-motion";

export default function HeroBackground({ y }: { y: MotionValue<string> }) {
  return (
    <motion.div style={{ y }} className="absolute inset-0 w-full h-full">
      <div className="w-full h-full bg-gradient-to-br from-brand-dark via-blue-900 to-blue-800" />
      <div className="absolute inset-0 bg-black/40" />
    </motion.div>
  );
}
