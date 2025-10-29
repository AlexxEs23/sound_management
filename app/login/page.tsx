"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import SmartLoader from "@/components/ui/loader";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState } from "react";
import z from "zod";
import { apiClient } from "@/lib/axios";
import { toast } from "sonner";
import { AxiosError } from "axios";

const LoginSchema = z.object({
  email: z.string().email("Email tidak valid").min(1, "Email wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
});

type LoginData = z.infer<typeof LoginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [formData, setFormData] = useState<LoginData>({
    email: "",
    password: "",
  });

  const [errors, setError] = useState<Partial<Record<keyof LoginData, string>>>(
    {}
  );
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
    setError({ ...errors, [e.target.id]: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = LoginSchema.safeParse(formData);
    if (!parsed.success) {
      const newErrors: Partial<Record<keyof LoginData, string>> = {};
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof LoginData;
        newErrors[field] = issue.message;
      });
      setError(newErrors);
      toast.error("Mohon lengkapi form dengan benar");
      return;
    }

    try {
      setLoading(true);
      const res = await apiClient.post("/auth/login", formData);

      if (res.status === 200) {
        toast.success("Login berhasil!", {
          duration: 2000,
        });

        // Redirect ke halaman yang diminta atau dashboard
        setTimeout(() => {
          router.push(callbackUrl);
        }, 1000);
      }
    } catch (err) {
      console.error("Login error:", err);

      if (err instanceof AxiosError && err.response) {
        const errorData = err.response.data;

        // Handle validation errors
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const newErrors: Partial<Record<keyof LoginData, string>> = {};
          errorData.errors.forEach(
            (error: { field: string; message: string }) => {
              newErrors[error.field as keyof LoginData] = error.message;
            }
          );
          setError(newErrors);
          toast.error(errorData.message || "Validasi gagal");
        }
        // Handle authentication errors
        else if (errorData.message) {
          toast.error(errorData.message, {
            duration: 4000,
          });
        } else {
          toast.error("Login gagal. Silakan coba lagi.");
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
                {loading ? "Login...." : "Login"}
              </Button>
            </form>

            <p className="text-sm text-center text-gray-500">
              Belum Punya Akun?{" "}
              <a
                href="/register"
                className="text-blue-600 hover:underline font-medium"
              >
                Register
              </a>
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
