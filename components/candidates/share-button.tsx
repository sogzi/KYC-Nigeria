'use client';

import { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ShareButton() {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: document.title, url });
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
      {copied ? (
        <>
          <Check className="h-4 w-4 text-green-600" />
          <span className="text-green-700">Link copied!</span>
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4" />
          Share profile
        </>
      )}
    </Button>
  );
}
