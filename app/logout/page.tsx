"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/axios";
import SmartLoader from "@/components/ui/loader";
import { toast } from "sonner";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        await apiClient.post("/auth/logout");
        toast.success("Berhasil logout");
        router.push("/login");
      } catch (error) {
        console.error("Logout error:", error);
        toast.error("Gagal logout");
        router.push("/login");
      }
    };

    handleLogout();
  }, [router]);

  return <SmartLoader />;
}
