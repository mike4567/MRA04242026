/**
 * @file next-auth.d.ts
 * @author NMFS West Coast Region - Marine Response Application
 * @date 2026-04-27
 * @purpose TypeScript type extensions for NextAuth.js to include custom user properties.
 */

import { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role: string;
        } & DefaultSession["user"];
    }

    interface User extends DefaultUser {
        role: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT extends DefaultJWT {
        id: string;
        role: string;
    }
}
