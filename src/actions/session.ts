"use server";

import { signIn, signOut } from "@/auth";

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}

export async function signInWithGoogleAction() {
  await signIn("google", { redirectTo: "/dashboard" });
}
