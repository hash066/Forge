import { Hero } from '@/components/sections/hero';
import { Features } from '@/components/sections/features';
import { HowItWorks } from '@/components/sections/how-it-works';
import { Modes } from '@/components/sections/modes';
import { TechStack } from '@/components/sections/tech-stack';
import { CTASection } from '@/components/sections/cta';
import { TopNav } from '@/components/nav/top-nav';
import { Footer } from '@/components/nav/footer';
import { PageRail } from '@/components/nav/page-rail';

export default function HomePage() {
  return (
    <>
      <TopNav />
      <PageRail />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Modes />
        <TechStack />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
