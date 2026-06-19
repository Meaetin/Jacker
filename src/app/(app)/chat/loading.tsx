import { Skeleton } from "@/components/ui/skeleton";

export default function ChatLoading() {
  return (
    <div className="chat-loading max-w-4xl mx-auto flex flex-col h-[calc(100vh-3rem)]">
      {/* Header skeleton */}
      <div className="chat-loading-header flex items-center justify-between py-3 border-b border-border">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-8 w-52 rounded-lg" />
      </div>

      {/* Messages area skeleton */}
      <div className="chat-loading-messages flex-1 flex flex-col items-center justify-center py-12 space-y-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-64" />
        <div className="space-y-2 w-full max-w-md mt-4">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>

      {/* Input bar skeleton */}
      <div className="chat-loading-input border-t border-border p-3">
        <div className="flex items-end gap-2">
          <Skeleton className="h-10 flex-1 rounded-lg" />
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
