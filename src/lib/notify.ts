import { toast } from "@/components/ui/use-toast";

export const notify = {
  success: (title: string, description?: string) =>
    toast({ title, description, variant: "success" }),
  error: (title: string, description?: string) =>
    toast({ title, description, variant: "destructive" }),
  info: (title: string, description?: string) => toast({ title, description }),
} as const;

