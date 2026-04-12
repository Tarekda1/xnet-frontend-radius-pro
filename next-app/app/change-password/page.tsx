"use client";

import { useAuth } from "@/context/AuthContext";
import ChangePasswordPage from "@/screens/ChangePassword";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ChangePasswordRoutePage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) router.replace("/login");
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;
  return <ChangePasswordPage />;
}
