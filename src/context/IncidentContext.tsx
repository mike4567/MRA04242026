"use client";

// Incident context using NextAuth.js session (replaces Firebase Auth)

import {
    createContext,
    useContext,
    useState,
    ReactNode,
    useEffect,
    useCallback,
} from "react";
import { useSession } from "next-auth/react";
import type { Incident, PublicIncident } from "@/lib/types";
import type { SpecificResponderInfo } from "@/app/actions";
import {
    getAdminIncidents,
    getPublicIncidents,
    updateIncidentDB,
} from "@/app/actions/db-actions";

interface IncidentContextType {
    setIncidentDataForConfirmation: (
        incidentId: string,
        responderInfo: SpecificResponderInfo | null
    ) => void;
    incidentIdForConfirmation: string | null;
    responderInfoForConfirmation: SpecificResponderInfo | null;
    resetConfirmationData: () => void;
    incidents: Incident[];
    publicIncidents: PublicIncident[];
    loading: boolean;
    updateIncident: (updatedIncident: Incident) => Promise<void>;
    refreshIncidents: () => Promise<void>;
}

const IncidentContext = createContext<IncidentContextType | undefined>(
    undefined
);

export function IncidentProvider({ children }: { children: ReactNode }) {
    const [incidentIdForConfirmation, setIncidentIdForConfirmation] = useState<
        string | null
    >(null);
    const [responderInfoForConfirmation, setResponderInfoForConfirmation] =
        useState<SpecificResponderInfo | null>(null);
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [publicIncidents, setPublicIncidents] = useState<PublicIncident[]>(
        []
    );
    const [loading, setLoading] = useState(true);

    // Use NextAuth.js session instead of Firebase Auth
    const { data: session, status } = useSession();
    const isAuthenticated = status === "authenticated";

    // Fetch Data (SQL Implementation)
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Always fetch public data
            const publicData = await getPublicIncidents();
            setPublicIncidents(publicData);

            // Only fetch admin data if logged in
            if (isAuthenticated) {
                const adminData = await getAdminIncidents();
                setIncidents(adminData);
            } else {
                setIncidents([]);
            }
        } catch (error) {
            console.error("Error fetching incidents:", error);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    // Initial Fetch on load or auth change
    useEffect(() => {
        // Wait for session status to be determined
        if (status !== "loading") {
            fetchData();
        }
    }, [fetchData, status]);

    // Update Data
    const updateIncident = async (updatedIncident: Incident) => {
        try {
            // Write to SQL
            await updateIncidentDB(updatedIncident);

            // Refresh local state to show changes immediately
            await fetchData();
        } catch (error) {
            console.error("Error updating incident: ", error);
            throw error;
        }
    };

    const setIncidentDataForConfirmation = (
        incidentId: string,
        responderInfo: SpecificResponderInfo | null
    ) => {
        setIncidentIdForConfirmation(incidentId);
        setResponderInfoForConfirmation(responderInfo);
    };

    const resetConfirmationData = () => {
        setIncidentIdForConfirmation(null);
        setResponderInfoForConfirmation(null);
    };

    return (
        <IncidentContext.Provider
            value={{
                incidentIdForConfirmation,
                responderInfoForConfirmation,
                setIncidentDataForConfirmation,
                resetConfirmationData,
                incidents,
                publicIncidents,
                loading,
                updateIncident,
                refreshIncidents: fetchData,
            }}
        >
            {children}
        </IncidentContext.Provider>
    );
}

export function useIncident() {
    const context = useContext(IncidentContext);
    if (context === undefined) {
        throw new Error("useIncident must be used within an IncidentProvider");
    }
    return context;
}
