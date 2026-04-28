/**
 * @file route.ts
 * @author NMFS West Coast Region - Marine Response Application
 * @date 2026-04-27
 * @purpose NextAuth.js API route handler for authentication endpoints.
 */

import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
