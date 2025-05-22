// components/Loader.tsx
import { Loader2 } from "lucide-react";

export default function Loader({ className }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center h-full ${className}`}>
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}
