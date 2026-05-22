// NextAuth.js Configuration for MRA Application
// Replaces Firebase Authentication with PostgreSQL-backed credentials

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { query } from "./db";

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                // Validate input
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const email = credentials.email as string;
                const password = credentials.password as string;

                try {
                    // Query user from PostgreSQL users table
                    const result = await query(
                        `SELECT id, email, password_hash, name, role 
                         FROM users 
                         WHERE email = $1 AND active = true`,
                        [email]
                    );

                    if (result.rows.length === 0) {
                        // User not found
                        return null;
                    }

                    const user = result.rows[0];

                    // Verify password using bcrypt
                    const passwordMatch = await bcrypt.compare(
                        password,
                        user.password_hash
                    );

                    if (!passwordMatch) {
                        // Invalid password
                        return null;
                    }

                    // Return user object (will be encoded in JWT)
                    return {
                        id: user.id.toString(),
                        email: user.email,
                        name: user.name,
                        role: user.role,
                    };
                } catch (error) {
                    console.error("Auth error:", error);
                    return null;
                }
            },
        }),
    ],
    callbacks: {
        // Include custom fields in JWT token
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
            }
            return token;
        },
        // Include custom fields in session
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                (session.user as any).role = token.role;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.AUTH_SECRET,
});
