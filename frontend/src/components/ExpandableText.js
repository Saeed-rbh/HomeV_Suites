'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function ExpandableText({ text, maxLines = 4 }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text) return null;

  // We use CSS line-clamp for a smooth truncation effect
  return (
    <div className="relative">
      <div 
        className={`text-base leading-8 text-[#411F0F] transition-all duration-300 ${
          isExpanded ? "" : "line-clamp-4"
        }`}
        dangerouslySetInnerHTML={{ __html: text.replace(/\n/g, '<br />') }}
      />
      
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-[#411F0F] hover:opacity-80 transition-opacity"
      >
        {isExpanded ? (
          <>
            Show less <ChevronUp className="h-4 w-4" />
          </>
        ) : (
          <>
            See more <ChevronDown className="h-4 w-4" />
          </>
        )}
      </button>
    </div>
  );
}
