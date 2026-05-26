'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { Search } from 'lucide-react';

interface Props {
  defaultValue: string;
}

export function CandidateSearchInput({ defaultValue }: Props) {
  const router   = useRouter();
  const pathname = usePathname();
  const params   = useSearchParams();
  const [, startT] = useTransition();

  const handleChange = (value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value.trim()) {
      next.set('q', value.trim());
    } else {
      next.delete('q');
    }
    next.delete('page');
    startT(() => router.push(`${pathname}?${next.toString()}`));
  };

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        defaultValue={defaultValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Search by name, position, or keyword…"
        className="w-full rounded-lg border bg-background py-2.5 pl-9 pr-4 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring md:max-w-md"
      />
    </div>
  );
}
