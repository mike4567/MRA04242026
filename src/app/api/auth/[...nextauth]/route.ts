// NextAuth.js API Route Handler
// This file exposes the authentication endpoints at /api/auth/*

import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
