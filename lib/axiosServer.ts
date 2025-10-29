import axios from "axios";
import { cookies } from "next/headers";

/**
 * Server-side API client (untuk Server Components dan API routes)
 * Hanya bisa digunakan di server-side code
 */
export const createApiClient = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get("jwt-access-token");

  const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api",
  });

  api.interceptors.request.use((config) => {
    if (token) {
      config.headers.Authorization = `Bearer ${token.value}`;
    }
    return config;
  });

  return api;
};
