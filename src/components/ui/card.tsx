import { cn } from "@/utils/cn";

interface CardProps {
  className?: string;
  children: React.ReactNode;
  raised?: boolean;
}

export function Card({ className, children, raised }: CardProps) {
  return (
    <div className={cn(raised ? "card-raised" : "card", className)}>
      {children}
    </div>
  );
}
