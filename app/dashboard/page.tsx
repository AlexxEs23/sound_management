"use client";

import { apiClient } from "@/lib/axios";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import SmartLoader from "@/components/ui/loader";
import Link from "next/link";
import { HiCube, HiCalendar, HiUsers, HiExclamation } from "react-icons/hi";

interface User {
  name: string;
  email: string;
  id: number;
  role: string;
}

interface DashboardStats {
  totalEquipments: number;
  totalStock: number;
  lowStockItems: number;
  outOfStockItems: number;
  damagedItems: number;
  pendingRepairs: number;
  totalEvents: number;
  upcomingEvents: number;
  pastEvents: number;
  unreadNotifications: number;
}

interface RecentEvent {
  id: string;
  title: string;
  date: string;
  location: string;
}

interface RecentEquipment {
  id: string;
  name: string;
  category: string;
  stock: number;
}

interface DamagedEquipment {
  id: string;
  equipmentId: string;
  quantity: number;
  description?: string;
  repairStatus: string;
  reportedAt: string;
  repairedAt?: string;
}

export default function DashboardPage() {
  const [me, setMe] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [recentEquipments, setRecentEquipments] = useState<RecentEquipment[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch user data
        const userRes = await apiClient.get("/auth/me");
        if (userRes.status === 200) {
          setMe(userRes.data.data);
        }

        // Fetch equipments
        const equipmentsRes = await apiClient.get("/equipments");
        const equipments = equipmentsRes.data.data || [];

        // Fetch damaged equipments
        const damagedRes = await apiClient.get("/damaged-equipments");
        const damagedEquipments: DamagedEquipment[] =
          damagedRes.data.data || [];

        // Calculate equipment stats
        const equipmentStats = {
          totalEquipments: equipments.length,
          totalStock: equipments.reduce(
            (sum: number, eq: RecentEquipment) => sum + (eq.stock || 0),
            0
          ),
          lowStockItems: equipments.filter(
            (eq: RecentEquipment) => eq.stock > 0 && eq.stock < 3
          ).length,
          outOfStockItems: equipments.filter(
            (eq: RecentEquipment) => eq.stock === 0
          ).length,
          damagedItems: damagedEquipments.reduce(
            (sum: number, damaged: DamagedEquipment) => sum + damaged.quantity,
            0
          ),
          pendingRepairs: damagedEquipments.filter(
            (damaged: DamagedEquipment) =>
              damaged.repairStatus === "pending" ||
              damaged.repairStatus === "in_progress"
          ).length,
        };

        // Get recent equipments (last 5)
        setRecentEquipments(equipments.slice(0, 5));

        // Fetch events
        const eventsRes = await apiClient.get("/events");
        const events = eventsRes.data.data || [];

        // Calculate event stats
        const now = new Date();
        const eventStats = {
          totalEvents: events.length,
          upcomingEvents: events.filter(
            (event: RecentEvent) => new Date(event.date) >= now
          ).length,
          pastEvents: events.filter(
            (event: RecentEvent) => new Date(event.date) < now
          ).length,
        };

        // Get recent events (upcoming, limited to 5)
        const upcomingEventsList = events
          .filter((event: RecentEvent) => new Date(event.date) >= now)
          .sort(
            (a: RecentEvent, b: RecentEvent) =>
              new Date(a.date).getTime() - new Date(b.date).getTime()
          )
          .slice(0, 5);
        setRecentEvents(upcomingEventsList);

        // Combine all stats
        setStats({
          ...equipmentStats,
          ...eventStats,
          unreadNotifications: 0, // This would come from notifications API
        });
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get stock badge
  const getStockBadge = (stock: number) => {
    if (stock === 0) {
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    } else if (stock < 3) {
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
    } else {
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    }
  };

  // Get stock text
  const getStockText = (stock: number) => {
    if (stock === 0) {
      return "Habis";
    } else if (stock < 3) {
      return "Stok Rendah";
    } else {
      return `Stok: ${stock}`;
    }
  };

  if (loading) {
    return <SmartLoader />;
  }

  if (!me) {
    return (
      <div className="p-4">
        <p>Loading user data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Dashboard
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Selamat datang kembali,{" "}
            <span className="font-semibold">{me.name}</span>!
          </p>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {/* Total Equipment */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Total Equipment
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.totalEquipments}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <HiCube className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="mt-2 flex items-center text-xs">
                  <span className="text-blue-600 dark:text-blue-400">
                    {stats.totalStock} unit total
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Total Stock */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Total Stok
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.totalStock}
                    </p>
                  </div>
                  <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
                    📦
                  </div>
                </div>
                <div className="mt-2 flex items-center text-xs">
                  {stats.outOfStockItems > 0 && (
                    <span className="text-red-600 dark:text-red-400 mr-1">
                      {stats.outOfStockItems} habis
                    </span>
                  )}
                  {stats.lowStockItems > 0 && (
                    <span className="text-orange-600 dark:text-orange-400">
                      • {stats.lowStockItems} stok rendah
                    </span>
                  )}
                  {stats.outOfStockItems === 0 && stats.lowStockItems === 0 && (
                    <span className="text-green-600 dark:text-green-400">
                      Stok aman
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Total Events */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Total Events
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.totalEvents}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                    <HiCalendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <div className="mt-2 flex items-center text-xs">
                  <span className="text-purple-600 dark:text-purple-400 mr-1">
                    {stats.upcomingEvents} akan datang
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Damaged Equipment */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Equipment Rusak
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.damagedItems}
                    </p>
                  </div>
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                    <HiExclamation className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                </div>
                <div className="mt-2 flex items-center text-xs">
                  <span className="text-red-600 dark:text-red-400">
                    {stats.pendingRepairs} pending repair
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Stock & Damage Warning */}
        {stats &&
          (stats.outOfStockItems > 0 ||
            stats.lowStockItems > 0 ||
            stats.pendingRepairs > 0) && (
            <div className="mb-6">
              <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg shrink-0">
                      <HiExclamation className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        ⚠️ Peringatan Inventory
                      </h3>
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        {stats.outOfStockItems > 0 && (
                          <p className="mb-1">
                            •{" "}
                            <span className="font-medium text-red-600 dark:text-red-400">
                              {stats.outOfStockItems} equipment
                            </span>{" "}
                            habis stok
                          </p>
                        )}
                        {stats.lowStockItems > 0 && (
                          <p className="mb-1">
                            •{" "}
                            <span className="font-medium text-orange-600 dark:text-orange-400">
                              {stats.lowStockItems} equipment
                            </span>{" "}
                            stok rendah (&lt;3 unit)
                          </p>
                        )}
                        {stats.pendingRepairs > 0 && (
                          <p>
                            •{" "}
                            <span className="font-medium text-red-600 dark:text-red-400">
                              {stats.pendingRepairs} equipment
                            </span>{" "}
                            menunggu perbaikan
                          </p>
                        )}
                      </div>
                      <Link
                        href="/equipments"
                        className="inline-block mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Lihat Equipment →
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Link href="/equipments">
            <Card className="hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <HiCube className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Kelola Equipment
                    </p>
                    <p className="text-xs text-gray-500">
                      Lihat dan kelola peralatan
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/events">
            <Card className="hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <HiCalendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Kelola Events
                    </p>
                    <p className="text-xs text-gray-500">
                      Lihat dan kelola acara
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/profile">
            <Card className="hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <HiUsers className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Profile Saya
                    </p>
                    <p className="text-xs text-gray-500">
                      Lihat dan edit profile
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Data Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Events */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <HiCalendar className="w-5 h-5 text-purple-600" />
                  Event Mendatang
                </h2>
                <Link
                  href="/events"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Lihat semua
                </Link>
              </div>

              {recentEvents.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                  Belum ada event mendatang
                </p>
              ) : (
                <div className="space-y-3">
                  {recentEvents.map((event) => (
                    <div
                      key={event.id}
                      className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                        {event.title}
                      </h3>
                      <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <HiCalendar className="w-3.5 h-3.5" />
                          {formatDate(event.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <HiCube className="w-3.5 h-3.5" />
                          {event.location}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Equipment */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <HiCube className="w-5 h-5 text-blue-600" />
                  Equipment Terbaru
                </h2>
                <Link
                  href="/equipments"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Lihat semua
                </Link>
              </div>

              {recentEquipments.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                  Belum ada equipment
                </p>
              ) : (
                <div className="space-y-3">
                  {recentEquipments.map((equipment) => (
                    <div
                      key={equipment.id}
                      className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                            {equipment.name}
                          </h3>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {equipment.category}
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${getStockBadge(
                            equipment.stock
                          )}`}
                        >
                          {getStockText(equipment.stock)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* User Info Card */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                  {me.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {me.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {me.email}
                  </p>
                  <span
                    className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                      me.role === "admin"
                        ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                        : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                    }`}
                  >
                    {me.role === "admin" ? "Administrator" : "User"}
                  </span>
                </div>
              </div>
              <Link href="/profile">
                <button className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                  Lihat Profile
                </button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
