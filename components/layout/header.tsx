"use client";

import {
  Package,
  Menu,
  User,
  Home,
  LogOut,
  Package2,
  Calendar,
  X,
  AlertTriangle,
} from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { apiClient } from "@/lib/axios";

interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function HeaderPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await apiClient.get("/auth/me");
        if (res.status === 200) {
          setUser(res.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    };
    fetchUser();
  }, []);

  // 🧭 Menu header dinamis
  const menus = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Equipment", href: "/equipments", icon: Package2 },
    { name: "Events", href: "/events", icon: Calendar },
    { name: "Barang Rusak", href: "/damaged-equipments", icon: AlertTriangle },
    { name: "Profile", href: "/profile", icon: User },
    { name: "Keluar", href: "/logout", icon: LogOut, isDanger: true },
  ];

  return (
    <header className="flex justify-between items-center bg-white border-b shadow-sm px-4 py-3 relative">
      {/* Kiri: Logo / Icon */}
      <Link
        href="/dashboard"
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        <div className="bg-linear-to-br from-blue-500 to-blue-600 p-1.5 rounded-md shadow-sm">
          <Package className="text-white w-7 h-7" />
        </div>
        <div className="hidden sm:block">
          <span className="font-bold text-gray-800 text-lg block leading-none">
            Sound Mgmt
          </span>
          <span className="text-[10px] text-gray-500">Management System</span>
        </div>
      </Link>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex gap-1">
        {menus.map((menu) => {
          const Icon = menu.icon;
          const isActive = pathname === menu.href;
          return (
            <Link
              key={menu.name}
              href={menu.href}
              className={`flex gap-2 items-center px-4 py-2 text-sm rounded-lg transition-colors ${
                menu.isDanger
                  ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  : isActive
                  ? "text-blue-600 bg-blue-50 font-medium dark:text-blue-400 dark:bg-blue-900/20"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{menu.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Desktop user info */}
      <div className="hidden md:flex items-center gap-3">
        <div className="text-right">
          <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
            {user?.name || "Loading..."}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {user?.role === "admin" ? "Administrator" : "User"}
          </div>
        </div>
        <Link href="/profile">
          <div className="bg-linear-to-br from-blue-500 to-purple-600 p-2 rounded-full cursor-pointer hover:shadow-md transition-shadow">
            <User className="w-5 h-5 text-white" />
          </div>
        </Link>
      </div>

      {/* Mobile menu button */}
      <button
        className="md:hidden p-2 hover:bg-gray-100 rounded-md transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-gray-700" />
        ) : (
          <Menu className="w-6 h-6 text-gray-700" />
        )}
      </button>

      {/* Dropdown menu (mobile) */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/20 md:hidden z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-16 right-4 bg-white shadow-xl rounded-lg border py-2 w-56 md:hidden animate-in fade-in slide-in-from-top-2 z-50">
            {/* User info in mobile menu */}
            {user && (
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="bg-linear-to-br from-blue-500 to-purple-600 p-2 rounded-full">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800">
                      {user.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {user.role === "admin" ? "Administrator" : "User"}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {menus.map((menu) => {
              const Icon = menu.icon;
              const isActive = pathname === menu.href;
              return (
                <Link
                  key={menu.name}
                  href={menu.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                    menu.isDanger
                      ? "text-red-600 hover:bg-red-50"
                      : isActive
                      ? "text-blue-600 bg-blue-50 font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{menu.name}</span>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </header>
  );
}
