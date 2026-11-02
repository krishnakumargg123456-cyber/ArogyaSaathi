'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/Button';
import { 
  Heart, 
  Menu, 
  X, 
  Globe, 
  ChevronDown, 
  LogIn, 
  UserPlus, 
  ShieldCheck,
  Stethoscope
} from 'lucide-react';

export const SiteHeader: React.FC = () => {
  const pathname = usePathname();
  const { language, setLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { href: '/', label: t.nav.home },
    { href: '/saathi', label: language === 'hi' ? 'सेहत साथी' : 'Health Chat' },
    { href: '/features', label: t.nav.features },
    { href: '/how-it-works', label: t.nav.howItWorks },
    { href: '/about', label: t.nav.about },
    { href: '/resources', label: t.nav.resources },
    { href: '/contact', label: t.nav.contact },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-200 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200/80 py-2.5'
          : 'bg-white/90 backdrop-blur-sm border-b border-slate-100 py-3.5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo & Brand */}
          <Link 
            href="/" 
            className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 rounded-lg p-1"
            aria-label="ArogyaSaathi Home"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-900 to-brand-700 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <Heart className="w-5 h-5 fill-white/20 text-white" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-brand-900 transition-colors">
                  Arogya<span className="text-brand-700">Saathi</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-brand-50 text-brand-800 border border-brand-200">
                  Rural Care
                </span>
              </div>
              <span className="text-xs text-slate-500 font-medium hidden sm:inline-block">
                {language === 'hi' ? 'हर गाँव, हर घर, स्वस्थ भारत' : 'Health for Every Indian'}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2" aria-label="Main Navigation">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'text-brand-900 bg-mint-100/70 font-semibold'
                      : 'text-slate-600 hover:text-brand-900 hover:bg-slate-50'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Bar: Language + Auth Actions */}
          <div className="hidden sm:flex items-center gap-3">
            
            {/* Language Switcher Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-brand-900 hover:bg-slate-100 border border-slate-200 transition-colors"
                aria-expanded={langDropdownOpen}
                aria-label="Change Language"
              >
                <Globe className="w-3.5 h-3.5 text-brand-700" />
                <span>{language === 'en' ? 'English' : 'हिंदी'}</span>
                <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform ${langDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {langDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setLangDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-1 w-44 rounded-xl bg-white border border-slate-200 shadow-premium py-1 z-20">
                    <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      Select Language
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setLanguage('en');
                        setLangDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 ${
                        language === 'en' ? 'font-bold text-brand-900 bg-brand-50/50' : 'text-slate-700'
                      }`}
                    >
                      <span>English</span>
                      {language === 'en' && <span className="text-brand-700">✓</span>}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLanguage('hi');
                        setLangDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 ${
                        language === 'hi' ? 'font-bold text-brand-900 bg-brand-50/50' : 'text-slate-700'
                      }`}
                    >
                      <span>हिंदी (Hindi)</span>
                      {language === 'hi' && <span className="text-brand-700">✓</span>}
                    </button>
                    <div className="border-t border-slate-100 mt-1 px-3 py-1.5 text-[10px] text-slate-400">
                      Regional languages planned in Phase 2/3
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Login Link */}
            <Link
              href="/login"
              className="text-sm font-semibold text-slate-700 hover:text-brand-900 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5"
            >
              <LogIn className="w-4 h-4 text-brand-700" />
              <span>{t.nav.login}</span>
            </Link>

            <Link
              href="/login?portal=admin"
              aria-label={language === 'hi' ? 'एडमिन लॉगिन' : 'Administrator sign in'}
              title={language === 'hi' ? 'एडमिन लॉगिन' : 'Administrator sign in'}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 transition-colors hover:border-emerald-400 hover:bg-emerald-100"
            >
              <ShieldCheck className="h-5 w-5" />
            </Link>

            {/* Request Access Button */}
            <Button
              href="/request-access"
              variant="primary"
              size="sm"
              leftIcon={<ShieldCheck className="w-4 h-4 text-emerald-300" />}
            >
              {t.nav.requestAccess}
            </Button>
          </div>

          {/* Mobile Menu Hamburger Button */}
          <div className="flex items-center gap-2 lg:hidden">
            {/* Quick Lang toggle on mobile */}
            <button
              type="button"
              onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              className="p-2 rounded-lg text-xs font-semibold text-brand-900 bg-brand-50 border border-brand-200"
              aria-label="Toggle language"
            >
              {language === 'en' ? 'हिं' : 'EN'}
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-700 hover:text-brand-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-700"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-[61px] bg-white border-b border-slate-200 shadow-xl px-4 pt-3 pb-6 max-h-[calc(100vh-65px)] overflow-y-auto">
          <div className="space-y-1 pb-4 border-b border-slate-100">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                    active
                      ? 'text-brand-900 bg-mint-100/80 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="pt-4 space-y-3">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Language / भाषा</span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1 text-xs rounded-md ${
                    language === 'en' ? 'bg-brand-900 text-white font-semibold' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('hi')}
                  className={`px-3 py-1 text-xs rounded-md ${
                    language === 'hi' ? 'bg-brand-900 text-white font-semibold' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  हिंदी
                </button>
              </div>
            </div>

            <Link
              href="/login?portal=admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex min-h-11 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-bold text-emerald-950"
            >
              <ShieldCheck className="h-4 w-4" />
              {language === 'hi' ? 'एडमिन लॉगिन' : 'Administrator sign in'}
            </Link>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button
                href="/login"
                variant="outline"
                size="md"
                className="w-full justify-center"
                leftIcon={<LogIn className="w-4 h-4" />}
              >
                {t.nav.login}
              </Button>
              <Button
                href="/request-access"
                variant="primary"
                size="md"
                className="w-full justify-center"
                leftIcon={<UserPlus className="w-4 h-4" />}
              >
                {t.nav.requestAccess}
              </Button>
            </div>

            <p className="text-[11px] text-center text-slate-400 pt-2">
              Har Gaon, Har Ghar, Swasth Bharat · Health for Every Indian
            </p>
          </div>
        </div>
      )}
    </header>
  );
};
