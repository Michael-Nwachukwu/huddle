import HeroGeometric from "@/components/hero-geometric";
import { Navbar } from "./_components/navbar";
import { FeaturesSection } from "./_components/bento-features";
import Interlude from "./_components/interlude";
import { Steps } from "./_components/steps";
import CTA from "./_components/cta";
import Footer from "./_components/footer";

export default function Home() {
  return (
    <main>
      <Navbar />
      <HeroGeometric />
      <FeaturesSection />
      <Interlude />
      <Steps />
      <CTA />
      <Footer />
    </main>
  );
}
