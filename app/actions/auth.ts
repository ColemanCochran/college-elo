"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { computeToken } from "@/lib/admin-auth";

export async function adminSignIn(
  email: string,
  password: string
): Promise<{ error: string } | void> {
  const expectedEmail = (process.env.ADMIN_EMAIL ?? "").toLowerCase();
  const expectedPassword = process.env.ADMIN_PASSWORD ?? "";

  if (
    email.trim().toLowerCase() !== expectedEmail ||
    password !== expectedPassword
  ) {
    return { error: "Invalid email or password." };
  }

  const cookieStore = await cookies();
  cookieStore.set("admin_session", computeToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: "/",
  });

  redirect("/dashboard");
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_session");
  redirect("/");
}
