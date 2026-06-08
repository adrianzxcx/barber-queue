"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { resendConfirmation } from "./actions";

export function ResendEmailButton({ email }: { email: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleResend() {
    if (!email) return;
    setIsSubmitting(true);
    const result = await resendConfirmation(email);
    setIsSubmitting(false);

    if (result.success) {
      toast.success("Confirmation email resent. Please check your inbox.");
    } else {
      toast.error(result.error || "Failed to resend confirmation email.");
    }
  }

  return (
    <Button
      variant="outline"
      className="w-full max-w-[280px]"
      onClick={handleResend}
      disabled={isSubmitting || !email}
    >
      {isSubmitting ? "Sending..." : "Resend Confirmation Email"}
    </Button>
  );
}
