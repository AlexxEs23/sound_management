"use client";

import { useState } from "react";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import SmartLoader from "@/components/ui/loader";
import { apiClient } from "@/lib/axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AxiosError } from "axios";

// Skema validasi pakai Zod
const RegisterSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  email: z.string().email("Email tidak valid"),
  noWa: z.string().min(9, "Nomor WhatsApp tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

type RegisterData = z.infer<typeof RegisterSchema>;

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState<RegisterData>({
    name: "",
    email: "",
    noWa: "",
    password: "",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof RegisterData, string>>
  >({});
  const [loading, setLoading] = useState(false);

  // Handle perubahan input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
    setErrors({ ...errors, [e.target.id]: "" }); // hapus error saat user mengetik ulang
  };

  // Handle submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi client-side
    const parsed = RegisterSchema.safeParse(formData);
    if (!parsed.success) {
      const newErrors: Partial<Record<keyof RegisterData, string>> = {};
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof RegisterData;
        newErrors[field] = issue.message;
      });
      setErrors(newErrors);
      toast.error("Mohon lengkapi form dengan benar");
      return;
    }

    try {
      setLoading(true);
      const res = await apiClient.post("/auth/register", formData);

      if (res.status === 201) {
        toast.success("Registrasi berhasil! Silakan login.", {
          duration: 3000,
        });
        router.push("/login");
      }
    } catch (err) {
      console.error("Registration error:", err);

      if (err instanceof AxiosError && err.response) {
        const errorData = err.response.data;

        if (errorData.errors && Array.isArray(errorData.errors)) {
          const newErrors: Partial<Record<keyof RegisterData, string>> = {};
          errorData.errors.forEach(
            (error: { field: string; message: string }) => {
              newErrors[error.field as keyof RegisterData] = error.message;
            }
          );
          setErrors(newErrors);
          toast.error(errorData.message || "Validasi gagal");
        }
        // Handle duplicate/Prisma errors
        else if (errorData.message) {
          toast.error(errorData.message, {
            description: errorData.field
              ? `Field: ${errorData.field}`
              : undefined,
            duration: 5000,
          });

          // Set error pada field yang bermasalah
          if (errorData.field) {
            setErrors({
              [errorData.field as keyof RegisterData]: errorData.message,
            });
          }
        } else {
          toast.error("Registrasi gagal. Silakan coba lagi.");
        }
      } else {
        toast.error("Terjadi kesalahan jaringan. Silakan coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 relative">
      {loading ? (
        <SmartLoader />
      ) : (
        <Card className="w-full max-w-md shadow-md border border-gray-200 bg-white">
          <CardHeader className="text-center space-y-1 pt-6">
            <CardTitle className="text-2xl font-semibold text-gray-900">
              Create an Account
            </CardTitle>
            <CardDescription className="text-gray-500">
              Start managing your equipment efficiently.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5 px-6 pb-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              {/* WhatsApp */}
              <div className="space-y-1">
                <Label htmlFor="noWa">WhatsApp Number</Label>
                <Input
                  id="noWa"
                  type="tel"
                  value={formData.noWa}
                  onChange={handleChange}
                  placeholder="+62 812 3456 7890"
                  className={errors.noWa ? "border-red-500" : ""}
                />
                {errors.noWa && (
                  <p className="text-red-500 text-sm mt-1">{errors.noWa}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={errors.password ? "border-red-500" : ""}
                />
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                )}
              </div>

              <Button className="w-full mt-4" type="submit" disabled={loading}>
                {loading ? "Registering..." : "Register"}
              </Button>
            </form>

            <p className="text-sm text-center text-gray-500">
              Already have an account?{" "}
              <a
                href="/login"
                className="text-blue-600 hover:underline font-medium"
              >
                Log in
              </a>
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
