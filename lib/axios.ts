import axios from "axios";

// Client-side API client (untuk client components)
export const apiClient = axios.create({
  baseURL:
    typeof window !== "undefined"
      ? "/api"
      : process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api",
});

// Interceptor untuk client-side (akan mengambil token dari cookie secara otomatis)
apiClient.interceptors.request.use((config) => {
  // Token akan otomatis dikirim via cookie oleh browser
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect ke login jika unauthorized
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
