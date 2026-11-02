'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface AccordionItem {
  id: string;
  title: string;
  content: string;
  badge?: string;
}

interface AccordionProps {
  items: AccordionItem[];
  defaultOpenId?: string;
  className?: string;
}

export const Accordion: React.FC<AccordionProps> = ({
  items,
  defaultOpenId,
  className = ''
}) => {
  const [openId, setOpenId] = useState<string | null>(defaultOpenId || null);

  const toggle = (id: string) => {
    setOpenId(prev => (prev === id ? null : id));
  };

  return (
    <div className={`divide-y divide-slate-200 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-soft ${className}`}>
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div key={item.id} className="transition-colors">
            <button
              type="button"
              onClick={() => toggle(item.id)}
              aria-expanded={isOpen}
              className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-inset"
            >
              <div className="flex items-center gap-3 pr-4">
                {item.badge && (
                  <span className="shrink-0 px-2.5 py-0.5 text-xs font-semibold rounded-md bg-brand-100 text-brand-900">
                    {item.badge}
                  </span>
                )}
                <span className="font-semibold text-slate-900 text-base sm:text-lg">
                  {item.title}
                </span>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-slate-500 shrink-0 transition-transform duration-200 ${
                  isOpen ? 'rotate-180 text-brand-800' : ''
                }`}
              />
            </button>
            {isOpen && (
              <div className="px-6 pb-6 pt-2 text-slate-600 text-sm sm:text-base leading-relaxed border-t border-slate-100 bg-slate-50/30">
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
