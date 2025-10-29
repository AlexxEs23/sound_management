"use client";

import { usePathname } from "next/navigation";
import React from "react";
import BottomNav from "@/components/ui/bottom_nav";
import HeaderPage from "./header";
import AIAssistant from "@/components/ui/ai-assistant";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathName = usePathname();
  const hiddenOnRoutes = [
    "/login",
    "/register",
    "/auth/login",
    "/auth/register",
  ];
  const isHidden = hiddenOnRoutes.includes(pathName || "");
  return (
    <>
      {!isHidden && <HeaderPage />}
      <main className={`${!isHidden ? "pb-16" : ""}`}>{children}</main>
      {!isHidden && <BottomNav />}
      {!isHidden && <AIAssistant />}
    </>
  );
}
