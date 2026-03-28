import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";

const Index = () => {
  return (
    <div className="flex flex-col" style={{ height: "100dvh", overflow: "hidden" }}>
      <Header />
      <div className="flex-1 relative overflow-hidden">
        <Hero />
      </div>
      <Marquee />
    </div>
  );
};

export default Index;