"use client";

/**
 * @file SessionProvider.tsx
 * @author NMFS West Coast Region - Marine Response Application
 * @date 2026-04-27
 * @purpose NextAuth.js SessionProvider wrapper for client-side session access.
 */

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { ReactNode } from "react";

interface Props {
    children: ReactNode;
}

export function SessionProvider({ children }: Props) {
    return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
