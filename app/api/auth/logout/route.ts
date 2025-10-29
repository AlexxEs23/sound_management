import { CookieDelete } from "@/lib/cookies";
import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ message: "Logout Succesful" });
  CookieDelete(response);
  return response;
}
