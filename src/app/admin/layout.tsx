"use client";

// Admin layout using NextAuth.js session (replaces Firebase Auth)

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { EntanglementLogo } from "@/components/EntanglementLogo";
import { LogOut, Siren } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const { data: session, status } = useSession();

    // Redirect to login if not authenticated
    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    const handleSignOut = async () => {
        await signOut({ redirect: false });
        router.push("/login");
    };

    // Show loading skeleton while checking authentication
    if (status === "loading") {
        return (
            <div className="flex items-center justify-center h-screen bg-background">
                <Skeleton className="w-[90vw] h-[90vh] rounded-lg" />
            </div>
        );
    }

    // Don't render admin content if not authenticated
    if (status === "unauthenticated") {
        return null;
    }

    return (
        <div>
            <div className="border-b bg-card">
                <div className="px-6 py-4">
                    <div className="flex h-16 items-center justify-between">
                        <EntanglementLogo />
                        <div className="flex items-center gap-4">
                            {session?.user?.email && (
                                <span className="text-sm text-muted-foreground hidden sm:block">
                                    {session.user.email}
                                </span>
                            )}
                            <Button
                                variant="ghost"
                                onClick={handleSignOut}
                                className="shrink-0"
                            >
                                <LogOut className="mr-2 h-4 w-4" /> Sign Out
                            </Button>
                        </div>
                    </div>
                    <div className="mt-4">
                        <Link href="/admin">
                            <Button
                                variant={
                                    pathname === "/admin" ||
                                    pathname.startsWith("/admin/incidents")
                                        ? "default"
                                        : "secondary"
                                }
                            >
                                <Siren className="mr-2 h-4 w-4" />
                                Incidents
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
            <div className="p-6">{children}</div>
        </div>
    );
}
