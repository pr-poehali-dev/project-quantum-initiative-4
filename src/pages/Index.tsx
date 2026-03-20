import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Advantages from "@/components/Advantages";
import Fleet from "@/components/Fleet";
import HowToOrder from "@/components/HowToOrder";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <Advantages />
      <Fleet />
      <HowToOrder />
      <Footer />
    </div>
  );
};

export default Index;
