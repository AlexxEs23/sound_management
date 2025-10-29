"use client";

import { Home, User, Package2, Calendar, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  const menus = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Equipment", href: "/equipments", icon: Package2 },
    { name: "Events", href: "/events", icon: Calendar },
    { name: "Rusak", href: "/damaged-equipments", icon: AlertTriangle },
    { name: "Profile", href: "/profile", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-gray-200 shadow-lg flex justify-around items-center py-2 md:hidden z-50 backdrop-blur-sm bg-white/95 dark:bg-gray-900/95 dark:border-gray-700">
      {menus.map((menu) => {
        const Icon = menu.icon;
        const isActive = pathname === menu.href;

        return (
          <Link
            key={menu.name}
            href={menu.href}
            className={`flex flex-col items-center text-xs min-w-[70px] py-1 px-2 rounded-lg transition-all ${
              isActive
                ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 font-medium scale-105"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <Icon
              size={22}
              strokeWidth={isActive ? 2.5 : 2}
              className="mb-0.5"
            />
            <span className="text-[10px]">{menu.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
