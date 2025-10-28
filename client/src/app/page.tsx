import HeroGeometric from "@/components/hero-geometric";
import { Navbar } from "./_components/navbar";
import { FeaturesSection } from "./_components/bento-features";
import { Steps } from "./_components/steps";
import CTA from "./_components/cta";
import Footer from "./_components/footer";

export default function Home() {
  return (
    <main>
      <Navbar />
      <HeroGeometric />
      <FeaturesSection />
      <Steps />
      <CTA />
      <Footer />
    </main>
  );
}
