"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { apiClient } from "@/lib/axios";
import { toast } from "sonner";
import SmartLoader from "@/components/ui/loader";
import {
  HiUser,
  HiMail,
  HiPhone,
  HiPencil,
  HiCamera,
  HiSave,
  HiX,
  HiShieldCheck,
} from "react-icons/hi";
import { useRouter } from "next/navigation";

interface User {
  id: number;
  name: string;
  email: string;
  noWa: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    noWa: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Fetch user data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get("/auth/me");
        if (res.status === 200) {
          const userData = res.data.data;
          setUser(userData);
          setFormData({
            name: userData.name,
            email: userData.email,
            noWa: userData.noWa,
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Gagal memuat data profile");
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password if changing
    if (formData.newPassword) {
      if (!formData.currentPassword) {
        toast.error("Masukkan password lama untuk mengubah password");
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        toast.error("Password baru dan konfirmasi tidak cocok");
        return;
      }
      if (formData.newPassword.length < 6) {
        toast.error("Password baru minimal 6 karakter");
        return;
      }
    }

    try {
      setSubmitting(true);
      const updateData: {
        name: string;
        email: string;
        noWa: string;
        currentPassword?: string;
        newPassword?: string;
      } = {
        name: formData.name,
        email: formData.email,
        noWa: formData.noWa,
      };

      // Add password fields if changing password
      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      const res = await apiClient.put("/auth/profile", updateData);

      if (res.status === 200) {
        setUser(res.data.data);
        setFormData({
          ...formData,
          name: res.data.data.name,
          email: res.data.data.email,
          noWa: res.data.data.noWa,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setIsEditing(false);
        toast.success("Profile berhasil diperbarui");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      const err = error as { response?: { data?: { message?: string } } };
      const errorMessage =
        err.response?.data?.message || "Gagal memperbarui profile";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Cancel edit
  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        noWa: user.noWa,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }
    setIsEditing(false);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return <SmartLoader />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Profile
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Kelola informasi personal Anda
          </p>
        </div>

        {/* Profile Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                {isEditing && (
                  <button className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 shadow-lg transition-colors">
                    <HiCamera className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {user.name}
                </h2>
                <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                      user.role === "admin"
                        ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                        : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                    }`}
                  >
                    <HiShieldCheck className="w-4 h-4" />
                    {user.role === "admin" ? "Administrator" : "User"}
                  </span>
                </div>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <HiMail className="w-4 h-4" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <HiPhone className="w-4 h-4" />
                    <span>{user.noWa}</span>
                  </div>
                </div>
                <p className="mt-4 text-xs text-gray-500 dark:text-gray-500">
                  Bergabung sejak {formatDate(user.createdAt)}
                </p>
              </div>

              {/* Edit Button */}
              {!isEditing && (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <HiPencil className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Edit Form */}
        {isEditing && (
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Informasi Personal
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Name */}
                    <div>
                      <Label htmlFor="name">
                        <HiUser className="inline w-4 h-4 mr-1" />
                        Nama Lengkap
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        disabled={submitting}
                        required
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <Label htmlFor="email">
                        <HiMail className="inline w-4 h-4 mr-1" />
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        disabled={submitting}
                        required
                      />
                    </div>

                    {/* Phone */}
                    <div className="md:col-span-2">
                      <Label htmlFor="noWa">
                        <HiPhone className="inline w-4 h-4 mr-1" />
                        Nomor WhatsApp
                      </Label>
                      <Input
                        id="noWa"
                        type="text"
                        value={formData.noWa}
                        onChange={(e) =>
                          setFormData({ ...formData, noWa: e.target.value })
                        }
                        disabled={submitting}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Change Password Section */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Ubah Password (Opsional)
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    {/* Current Password */}
                    <div>
                      <Label htmlFor="currentPassword">Password Lama</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={formData.currentPassword}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            currentPassword: e.target.value,
                          })
                        }
                        disabled={submitting}
                        placeholder="Kosongkan jika tidak ingin mengubah password"
                      />
                    </div>

                    {/* New Password */}
                    <div>
                      <Label htmlFor="newPassword">Password Baru</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={formData.newPassword}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            newPassword: e.target.value,
                          })
                        }
                        disabled={submitting}
                        placeholder="Minimal 6 karakter"
                      />
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <Label htmlFor="confirmPassword">
                        Konfirmasi Password Baru
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            confirmPassword: e.target.value,
                          })
                        }
                        disabled={submitting}
                        placeholder="Ulangi password baru"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    <HiSave className="w-4 h-4 mr-2" />
                    {submitting ? "Menyimpan..." : "Simpan Perubahan"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={submitting}
                    className="flex-1"
                  >
                    <HiX className="w-4 h-4 mr-2" />
                    Batal
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Statistics Card */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Statistik Akun
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {user.id}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  User ID
                </p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  Aktif
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Status
                </p>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {formatDate(user.updatedAt)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Update Terakhir
                </p>
              </div>
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {user.role}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Role
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
