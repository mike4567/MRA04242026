"use client";

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { getAuth, onAuthStateChanged, type User } from 'firebase/auth';
import { app } from '@/lib/firebase'; // Keep for Auth
import type { Incident, PublicIncident } from '@/lib/types';
import type { ResponderInfo } from '@/app/actions';
import { getAdminIncidents, getPublicIncidents, updateIncidentDB } from '@/app/actions/db-actions';

interface IncidentContextType {
  setIncidentDataForConfirmation: (incidentId: string, responderInfo: ResponderInfo | null) => void;
  incidentIdForConfirmation: string | null;
  responderInfoForConfirmation: ResponderInfo | null;
  resetConfirmationData: () => void;
  incidents: Incident[];
  publicIncidents: PublicIncident[];
  loading: boolean;
  updateIncident: (updatedIncident: Incident) => Promise<void>;
  refreshIncidents: () => Promise<void>; // New: Manual refresh capability
}

const IncidentContext = createContext<IncidentContextType | undefined>(undefined);

export function IncidentProvider({ children }: { children: ReactNode }) {
  const [incidentIdForConfirmation, setIncidentIdForConfirmation] = useState<string | null>(null);
  const [responderInfoForConfirmation, setResponderInfoForConfirmation] = useState<ResponderInfo | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [publicIncidents, setPublicIncidents] = useState<PublicIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const auth = getAuth(app);

  // 1. Monitor Authentication State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
    });
    return () => unsubscribe();
  }, [auth]);

  // 2. Fetch Data (SQL Implementation)
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
        // Always fetch public data
        const publicData = await getPublicIncidents();
        setPublicIncidents(publicData);

        // Only fetch admin data if logged in
        if (user) {
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
  }, [user]);

  // Initial Fetch on load or auth change
  useEffect(() => {
      fetchData();
  }, [fetchData]);

  // 3. Update Data
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
  }

  const setIncidentDataForConfirmation = (incidentId: string, responderInfo: ResponderInfo | null) => {
    setIncidentIdForConfirmation(incidentId);
    setResponderInfoForConfirmation(responderInfo);
  }

  const resetConfirmationData = () => {
    setIncidentIdForConfirmation(null);
    setResponderInfoForConfirmation(null);
  }

  return (
    <IncidentContext.Provider value={{ 
        incidentIdForConfirmation,
        responderInfoForConfirmation,
        setIncidentDataForConfirmation,
        resetConfirmationData,
        incidents, 
        publicIncidents, 
        loading, 
        updateIncident,
        refreshIncidents: fetchData
    }}>
      {children}
    </IncidentContext.Provider>
  );
}

export function useIncident() {
  const context = useContext(IncidentContext);
  if (context === undefined) {
    throw new Error('useIncident must be used within an IncidentProvider');
  }
  return context;
}