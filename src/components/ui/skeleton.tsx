import { cn } from "@/utils/cn";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "skeleton-block animate-pulse rounded-md bg-surface-raised",
        className,
      )}
    />
  );
}
