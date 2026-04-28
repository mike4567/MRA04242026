/**
 * @file auth.ts
 * @author NMFS West Coast Region - Marine Response Application
 * @date 2026-04-27
 * @purpose NextAuth.js configuration for credential-based authentication.
 *          Replaces Firebase Authentication with PostgreSQL-backed sessions.
 * 
 * Environment Variables:
 * - AUTH_SECRET: Secret key for JWT signing (required in production)
 * - DATABASE_URL: PostgreSQL connection string
 */

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const email = credentials.email as string;
                const password = credentials.password as string;

                try {
                    // Query user from PostgreSQL
                    const result = await query(
                        "SELECT id, email, password_hash, role FROM users WHERE email = $1",
                        [email]
                    );

                    if (result.rows.length === 0) {
                        console.log("[Auth] User not found:", email);
                        return null;
                    }

                    const user = result.rows[0];

                    // Verify password
                    const isValidPassword = await bcrypt.compare(
                        password,
                        user.password_hash
                    );

                    if (!isValidPassword) {
                        console.log("[Auth] Invalid password for:", email);
                        return null;
                    }

                    console.log("[Auth] Successful login:", email);
                    return {
                        id: user.id,
                        email: user.email,
                        role: user.role,
                    };
                } catch (error) {
                    console.error("[Auth] Database error:", error);
                    return null;
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            // Add role to JWT token on initial sign-in
            if (user) {
                token.role = user.role ?? "USER";
                token.id = user.id ?? "";
            }
            return token;
        },
        async session({ session, token }) {
            // Add role to session for client-side access
            if (session.user) {
                session.user.role = token.role ?? "USER";
                session.user.id = token.id ?? "";
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
        maxAge: 24 * 60 * 60, // 24 hours
    },
    trustHost: true,
});
