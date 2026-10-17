'use client';

import { useEffect, useState } from 'react';
import { Building2, Lock, Scissors } from 'lucide-react';
import { defaultHomeFeatures, HomeFeaturesContent } from '@/lib/site-content';

const icons = { Scissors, Building2, Lock };
const tiers = ['border-t-black', 'border-t-neutral-500', 'border-t-neutral-300'];

export default function HomeFeaturesGrid() {
  const [content, setContent] = useState<HomeFeaturesContent>(defaultHomeFeatures);
  useEffect(() => {
    fetch('/api/public/site-content', { cache: 'no-store' }).then((response) => response.json()).then((json) => {
      if (json.success && json.data?.homeFeatures) setContent({ ...defaultHomeFeatures, ...json.data.homeFeatures });
    }).catch(() => undefined);
  }, []);

  return <section className="py-24 sm:py-32 bg-white border-t border-neutral-200">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 className="reveal font-serif text-4xl sm:text-5xl lg:text-6xl font-normal text-black tracking-tight leading-[1.05] max-w-3xl mb-16">{content.title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 border-t border-l border-neutral-200">
        {content.cards.map((item, idx) => {
          const Icon = icons[item.icon as keyof typeof icons] ?? Scissors;
          return <div key={`${item.title}-${idx}`} className={`reveal group border-r border-b border-neutral-200 border-t-2 ${tiers[idx % tiers.length]} p-8 sm:p-10 transition-colors duration-200 hover:bg-neutral-50`} style={{ '--reveal-delay': `${idx * 100}ms` } as React.CSSProperties}>
            <div className="flex items-center gap-3 mb-6"><Icon className="w-5 h-5 text-black" strokeWidth={1.75}/><h3 className="font-serif text-xl font-medium text-black">{item.title}</h3></div>
            <p className="text-[15px] text-neutral-500 leading-relaxed">{item.body}</p>
          </div>;
        })}
      </div>
    </div>
  </section>;
}
