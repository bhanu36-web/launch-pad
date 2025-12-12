import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { FloatingOrbs } from '@/components/FloatingOrbs';
import { Navbar } from '@/components/Navbar';
import { HeroSection } from '@/components/HeroSection';
import { StatsSection } from '@/components/StatsSection';
import { ProblemSection } from '@/components/ProblemSection';
import { FeaturesSection } from '@/components/FeaturesSection';
import { ImpactSection } from '@/components/ImpactSection';
import { Footer } from '@/components/Footer';
import { GetStartedPage } from '@/components/GetStartedPage';
import { LearnMorePage } from '@/components/LearnMorePage';
import { useScrollY, useIntersectionObserver } from '@/hooks/use-scroll';

type PageType = 'home' | 'get-started' | 'learn-more';

const Index = () => {
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const scrollY = useScrollY();
  const isVisible = useIntersectionObserver(0.1);

  const navigateTo = (page: string) => {
    setCurrentPage(page as PageType);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (currentPage === 'get-started') {
    return (
      <>
        <Helmet>
          <title>Get Started - AgriLog | AI Farm Management</title>
          <meta name="description" content="Start your AgriLog journey. Download our mobile app or access the web platform to begin logging your farm activities." />
        </Helmet>
        <div className="min-h-screen gradient-hero">
          <FloatingOrbs scrollY={scrollY} />
          <GetStartedPage onNavigate={navigateTo} />
        </div>
      </>
    );
  }

  if (currentPage === 'learn-more') {
    return (
      <>
        <Helmet>
          <title>How It Works - AgriLog | AI Farm Management</title>
          <meta name="description" content="Learn how AgriLog helps farmers record activities, get AI insights, and access markets with verified farm records." />
        </Helmet>
        <div className="min-h-screen gradient-hero">
          <FloatingOrbs scrollY={scrollY} />
          <LearnMorePage onNavigate={navigateTo} />
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>AgriLog - AI-Powered Farm Management for Smallholder Farmers</title>
        <meta name="description" content="AgriLog is the AI-powered, offline-first Farm Log Agent that transforms how smallholder farmers record, preserve, and utilize agricultural knowledge." />
        <meta name="keywords" content="farm management, agriculture, AI, smallholder farmers, farm records, offline farming app" />
      </Helmet>
      
      <div className="min-h-screen gradient-hero overflow-hidden">
        <FloatingOrbs scrollY={scrollY} />

        <div className="relative z-10">
          <Navbar onNavigate={navigateTo} />
          <HeroSection scrollY={scrollY} onNavigate={navigateTo} />
        </div>

        <StatsSection isVisible={isVisible.stats} />
        <ProblemSection isVisible={isVisible.problem} />
        <FeaturesSection isVisible={isVisible} />
        <ImpactSection isVisible={isVisible.impact} />
        <Footer />
      </div>
    </>
  );
};

export default Index;
