import { NextResponse } from "next/server";

// Fungsi untuk set cookie JWT
export function CookieSet(token: string, response: NextResponse) {
  response.cookies.set({
    name: "jwt-access-token",
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 1, // 1 hari
  });

  return response;
}

// Fungsi untuk hapus cookie
export function CookieDelete(response: NextResponse) {
  response.cookies.set({
    name: "jwt-access-token",
    value: "",
    path: "/",
    maxAge: 0,
  });
  return response;
}

import { cookies } from "next/headers";

export async function getTokenFromCookie(): Promise<string | null> {
  const cookieStore = cookies();
  const token = (await cookieStore).get("jwt-access-token");
  return token?.value || null;
}
