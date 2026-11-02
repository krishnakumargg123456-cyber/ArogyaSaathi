import { HomepageExperience } from '@/components/marketing/HomepageExperience';
import { SiteFooter } from '@/components/navigation/SiteFooter';
import { SiteHeader } from '@/components/navigation/SiteHeader';
import { LanguageProvider } from '@/context/LanguageContext';

export default function HomePage() {
  return (
    <LanguageProvider>
      <SiteHeader />
      <HomepageExperience />
      <SiteFooter />
    </LanguageProvider>
  );
}