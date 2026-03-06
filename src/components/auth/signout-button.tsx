"use client";

import { LoaderCircle, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type SignOutButtonProps = {
  className?: string;
  label?: string;
};

export function SignOutButton({
  className,
  label = "Sair",
}: SignOutButtonProps) {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();
  const [isLoading, setIsLoading] = useState(false);

  return (
    <Button
      className={className}
      disabled={isLoading}
      onClick={async () => {
        setIsLoading(true);
        const { error } = await supabase.auth.signOut();
        setIsLoading(false);

        if (error) {
          toast.error(error.message);
          return;
        }

        router.replace("/login");
        router.refresh();
      }}
      type="button"
      variant="outline"
    >
      {isLoading ? (
        <LoaderCircle className="h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="h-4 w-4" />
      )}
      {label}
    </Button>
  );
}
