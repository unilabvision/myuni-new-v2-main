// components/course/content/MixedContent.tsx
"use client";

import React from 'react';
import { MyUNIVideo } from './MyUNIVideo';

interface MixedContentProps {
  lessonId: string;
  userId?: string;
  onProgress?: (progress: number) => void;
  onComplete?: () => Promise<void>;
}

export function MixedContent({ lessonId, userId, onProgress, onComplete }: MixedContentProps) {
  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-6">
      <MyUNIVideo 
        lessonId={lessonId} 
        userId={userId}
        onProgress={onProgress}
        onComplete={onComplete}
      />
    </div>
  );
}