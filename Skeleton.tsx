import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => (
  <div className={`bg-stone-200 animate-pulse rounded-sm ${className}`}></div>
);

export const ProductCardSkeleton = () => (
  <div className="flex flex-col">
    <Skeleton className="aspect-square w-full mb-6" />
    <Skeleton className="h-6 w-3/4 mb-2" />
    <Skeleton className="h-4 w-1/4" />
  </div>
);

export const AdminRowSkeleton = () => (
  <div className="p-4 flex items-center gap-6 border-b border-stone-50">
    <Skeleton className="w-18 h-18 flex-shrink-0" />
    <div className="flex-grow space-y-2">
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-3 w-1/4" />
    </div>
    <Skeleton className="h-8 w-24" />
  </div>
);
