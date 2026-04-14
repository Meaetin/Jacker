import { cn } from "@/utils/cn";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function Textarea({
  label,
  className,
  id,
  ...props
}: TextareaProps) {
  return (
    <div className="textarea-group">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-text-primary">
          {label}
        </label>
      )}
      <textarea id={id} className={cn("input-field", className)} {...props} />
    </div>
  );
}
