'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Share2, Check, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  candidateIds: string[];
}

export function ShareComparisonButton({ candidateIds }: Props) {
  const [copied, setCopied] = useState(false);
  const pathname = usePathname(); // e.g. /en/compare

  const handleShare = async () => {
    const url = `${window.location.origin}${pathname}?ids=${candidateIds.join(',')}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Candidate Comparison — KYC Nigeria', url });
        return;
      } catch {
        /* user cancelled — fall through to clipboard */
      }
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
      disabled={candidateIds.length < 2}
      className="gap-2"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-green-600" />
          <span className="text-green-700">Link copied!</span>
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4" />
          Share comparison
        </>
      )}
    </Button>
  );
}
