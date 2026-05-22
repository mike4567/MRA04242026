"use client";

// NextAuth.js SessionProvider wrapper
// This must wrap the app to enable useSession() hooks

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

export function SessionProvider({ children }: { children: React.ReactNode }) {
    return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
