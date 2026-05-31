'use server';

import { query } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

/**
 * Fetches all unique organization names from the ArcGIS service and
 * inserts them into the responder_organizations table.
 * 
 * NOTE: This function pulls `hotline`, `response_type`, `address`, and `website` from the ArcGIS service.
 * The field `response_area` requested for import is not
 * available in the ArcGIS data source and will not be updated by this function.
 * - `hotline` is mapped from `LivePhone`, `DeadPhone`, or `LivePhone2`.
 * - `response_type` is mapped from `MMType_Live`, `MMType_Dead`, or `MMType_Live2`.
 */
export async function syncOrganizations() {
  const baseUrl = 'https://services2.arcgis.com/C8EMgrsFcRFL6LrL/arcgis/rest/services/Live_Marine_Mammal_Stranding_Network_Live/FeatureServer/2/query';
  const params = new URLSearchParams({
    f: 'json',
    where: '1=1', // Get all features
    outFields: 'LiveOrg,DeadOrg,LiveStranding2,LivePhone,DeadPhone,LivePhone2,MMType_Live,MMType_Dead,MMType_Live2,Address,Website',
    returnGeometry: 'false',
  });

  const url = `${baseUrl}?${params.toString()}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`ArcGIS API request failed: ${response.status}`);
    }

    const data = await response.json();
    if (!data.features) {
      return { success: false, message: 'No features found in ArcGIS response.' };
    }

    const orgs = new Map<string, Partial<OrganizationDetails>>();

    data.features.forEach((feature: any) => {
      const attrs = feature.attributes;
      
      const processOrg = (name: string, phone?: string, type?: string, address?: string, website?: string) => {
        if (!name) return;
        if (!orgs.has(name)) orgs.set(name, { name });
        const orgData = orgs.get(name)!;
        if (phone && !orgData.hotline) orgData.hotline = phone.trim();
        if (type && !orgData.response_type) orgData.response_type = type.trim();
        if (address && !orgData.address) orgData.address = address.trim();
        if (website && !orgData.website) orgData.website = website.trim();
      };

      processOrg(attrs.LiveOrg?.trim(), attrs.LivePhone, attrs.MMType_Live, attrs.Address, attrs.Website);
      processOrg(attrs.DeadOrg?.replace('Dead Strandings: ', '').trim(), attrs.DeadPhone, attrs.MMType_Dead, attrs.Address, attrs.Website);
      processOrg(attrs.LiveStranding2?.replace(/ - .*$/, '').trim(), attrs.LivePhone2, attrs.MMType_Live2, attrs.Address, attrs.Website);
    });

    if (orgs.size === 0) {
      return { success: true, message: 'No organization names to import.' };
    }
    
    const orgValues = Array.from(orgs.values());
    const values: (string | null)[] = [];
    const valueStrings: string[] = [];
    let i = 1;

    for (const org of orgValues) {
        if (!org.name) continue;
        valueStrings.push(`($${i++}, $${i++}, $${i++}, $${i++}, $${i++})`);
        values.push(org.name);
        values.push(org.hotline || null);
        values.push(org.response_type || null);
        values.push(org.address || null);
        values.push(org.website || null);
    }

    if (valueStrings.length === 0) {
        return { success: true, message: 'No valid organization data to import.' };
    }

    const insertQuery = `
      INSERT INTO responder_organizations (name, hotline, response_type, address, website)
      VALUES ${valueStrings.join(', ')}
      ON CONFLICT (name) DO UPDATE SET
        hotline = COALESCE(responder_organizations.hotline, EXCLUDED.hotline),
        response_type = COALESCE(responder_organizations.response_type, EXCLUDED.response_type),
        address = COALESCE(responder_organizations.address, EXCLUDED.address),
        website = COALESCE(responder_organizations.website, EXCLUDED.website)
      RETURNING id;
    `;

    const result = await query(insertQuery, values);
    
    revalidatePath('/admin');
    
    return { 
      success: true, 
      message: `Sync complete. Found ${orgs.size} unique organizations. ${result.rowCount ?? 0} organizations were updated or inserted.` 
    };

  } catch (error) {
    console.error('Failed to sync organizations:', error);
    return { success: false, message: error instanceof Error ? error.message : 'An unknown error occurred.' };
  }
}

export interface OrganizationDetails {
    id: number;
    name?: string;
    emails?: string[];
    sms_numbers?: string[];
    hotline?: string;
    address?: string;
    contact_name?: string;
    website?: string;
    response_area?: string;
    response_type?: string;
}

/**
 * Updates details for a specific responder organization.
 */
export async function updateOrganizationDetails(details: OrganizationDetails) {
  const { id, ...fields } = details;

  if (!id) {
    return { success: false, message: 'Organization ID is required.' };
  }
  
  const fieldEntries = Object.entries(fields).filter(([, value]) => value !== undefined);
  
  if (fieldEntries.length === 0) {
    return { success: false, message: 'No fields to update.' };
  }

  const setClause = fieldEntries.map(([key], i) => `${key} = $${i + 2}`).join(', ');
  const values = fieldEntries.map(([, value]) => value);

  const updateQuery = `
    UPDATE responder_organizations
    SET ${setClause}
    WHERE id = $1;
  `;

  try {
    await query(updateQuery, [id, ...values]);
    revalidatePath('/admin');
    return { success: true, message: `Organization ${id} updated successfully.` };
  } catch (error) {
    console.error(`Failed to update organization ${id}:`, error);
    return { success: false, message: error instanceof Error ? error.message : 'An unknown error occurred.' };
  }
}

/**
 * Deletes an organization from the database.
 */
export async function deleteOrganization(id: number) {
  if (!id) {
    return { success: false, message: 'Organization ID is required.' };
  }

  const deleteQuery = 'DELETE FROM responder_organizations WHERE id = $1;';

  try {
    await query(deleteQuery, [id]);
    revalidatePath('/admin');
    return { success: true, message: `Organization ${id} deleted successfully.` };
  } catch (error) {
    console.error(`Failed to delete organization ${id}:`, error);
    return { success: false, message: error instanceof Error ? error.message : 'An unknown error occurred.' };
  }
}

// ============================================================================
// USER MANAGEMENT ACTIONS
// ============================================================================

/**
 * User data interface for CRUD operations.
 * Represents a user record in the database.
 */
export interface UserData {
    id: string;
    email: string;
    name: string | null;
    role: 'USER' | 'ADMIN';
    active: boolean;
    created_at: string;
    updated_at: string;
}

/**
 * Input interface for creating a new user.
 * Password will be hashed before storage.
 */
export interface CreateUserInput {
    email: string;
    password: string;
    name?: string;
    role?: 'USER' | 'ADMIN';
}

/**
 * Input interface for updating an existing user.
 * All fields are optional except id.
 */
export interface UpdateUserInput {
    id: string;
    email?: string;
    name?: string;
    role?: 'USER' | 'ADMIN';
    active?: boolean;
}

/**
 * Fetches all users from the database.
 * Returns users sorted by created_at descending.
 */
export async function getUsers(): Promise<{ success: boolean; users?: UserData[]; message?: string }> {
    try {
        const result = await query(`
            SELECT id, email, name, role, active, created_at, updated_at
            FROM users
            ORDER BY created_at DESC
        `);

        const users = result.rows.map(row => ({
            ...row,
            created_at: row.created_at?.toISOString() || null,
            updated_at: row.updated_at?.toISOString() || null,
        }));

        return { success: true, users };
    } catch (error) {
        console.error('Failed to fetch users:', error);
        return { success: false, message: error instanceof Error ? error.message : 'An unknown error occurred.' };
    }
}

/**
 * Creates a new user with a hashed password.
 * Uses bcrypt with 12 salt rounds for password hashing.
 */
export async function createUser(input: CreateUserInput): Promise<{ success: boolean; user?: UserData; message?: string }> {
    const { email, password, name, role = 'USER' } = input;

    // Validate required fields
    if (!email || !password) {
        return { success: false, message: 'Email and password are required.' };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { success: false, message: 'Invalid email format.' };
    }

    // Validate password strength (minimum 8 characters)
    if (password.length < 8) {
        return { success: false, message: 'Password must be at least 8 characters long.' };
    }

    try {
        // Hash the password with bcrypt (12 salt rounds for NIST compliance)
        const passwordHash = await bcrypt.hash(password, 12);

        // Generate a UUID for the user ID
        const result = await query(`
            INSERT INTO users (id, email, password_hash, name, role, active, created_at, updated_at)
            VALUES (gen_random_uuid()::text, $1, $2, $3, $4, true, NOW(), NOW())
            RETURNING id, email, name, role, active, created_at, updated_at
        `, [email, passwordHash, name || null, role]);

        if (result.rows.length === 0) {
            return { success: false, message: 'Failed to create user.' };
        }

        const user = {
            ...result.rows[0],
            created_at: result.rows[0].created_at?.toISOString() || null,
            updated_at: result.rows[0].updated_at?.toISOString() || null,
        };

        revalidatePath('/admin/users');
        return { success: true, user, message: 'User created successfully.' };

    } catch (error: any) {
        console.error('Failed to create user:', error);
        
        // Handle unique constraint violation
        if (error.code === '23505') {
            return { success: false, message: 'A user with this email already exists.' };
        }
        
        return { success: false, message: error instanceof Error ? error.message : 'An unknown error occurred.' };
    }
}

/**
 * Updates an existing user's details.
 * Does not update password - use resetUserPassword for that.
 */
export async function updateUser(input: UpdateUserInput): Promise<{ success: boolean; user?: UserData; message?: string }> {
    const { id, ...fields } = input;

    if (!id) {
        return { success: false, message: 'User ID is required.' };
    }

    const fieldEntries = Object.entries(fields).filter(([, value]) => value !== undefined);

    if (fieldEntries.length === 0) {
        return { success: false, message: 'No fields to update.' };
    }

    // Build dynamic SET clause
    const setClause = fieldEntries.map(([key], i) => `${key} = $${i + 2}`).join(', ');
    const values = fieldEntries.map(([, value]) => value);

    try {
        const result = await query(`
            UPDATE users
            SET ${setClause}, updated_at = NOW()
            WHERE id = $1
            RETURNING id, email, name, role, active, created_at, updated_at
        `, [id, ...values]);

        if (result.rows.length === 0) {
            return { success: false, message: 'User not found.' };
        }

        const user = {
            ...result.rows[0],
            created_at: result.rows[0].created_at?.toISOString() || null,
            updated_at: result.rows[0].updated_at?.toISOString() || null,
        };

        revalidatePath('/admin/users');
        return { success: true, user, message: 'User updated successfully.' };

    } catch (error: any) {
        console.error(`Failed to update user ${id}:`, error);
        
        // Handle unique constraint violation
        if (error.code === '23505') {
            return { success: false, message: 'A user with this email already exists.' };
        }
        
        return { success: false, message: error instanceof Error ? error.message : 'An unknown error occurred.' };
    }
}

/**
 * Resets a user's password to a new value.
 * The new password will be hashed before storage.
 */
export async function resetUserPassword(userId: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    if (!userId) {
        return { success: false, message: 'User ID is required.' };
    }

    if (!newPassword || newPassword.length < 8) {
        return { success: false, message: 'Password must be at least 8 characters long.' };
    }

    try {
        // Hash the new password
        const passwordHash = await bcrypt.hash(newPassword, 12);

        const result = await query(`
            UPDATE users
            SET password_hash = $2, updated_at = NOW()
            WHERE id = $1
            RETURNING id
        `, [userId, passwordHash]);

        if (result.rows.length === 0) {
            return { success: false, message: 'User not found.' };
        }

        revalidatePath('/admin/users');
        return { success: true, message: 'Password reset successfully.' };

    } catch (error) {
        console.error(`Failed to reset password for user ${userId}:`, error);
        return { success: false, message: error instanceof Error ? error.message : 'An unknown error occurred.' };
    }
}

/**
 * Toggles a user's active status (soft delete/restore).
 * Deactivated users cannot log in.
 */
export async function toggleUserActive(userId: string): Promise<{ success: boolean; active?: boolean; message: string }> {
    if (!userId) {
        return { success: false, message: 'User ID is required.' };
    }

    try {
        const result = await query(`
            UPDATE users
            SET active = NOT active, updated_at = NOW()
            WHERE id = $1
            RETURNING id, active
        `, [userId]);

        if (result.rows.length === 0) {
            return { success: false, message: 'User not found.' };
        }

        const newStatus = result.rows[0].active;
        revalidatePath('/admin/users');
        return { 
            success: true, 
            active: newStatus,
            message: newStatus ? 'User activated successfully.' : 'User deactivated successfully.' 
        };

    } catch (error) {
        console.error(`Failed to toggle active status for user ${userId}:`, error);
        return { success: false, message: error instanceof Error ? error.message : 'An unknown error occurred.' };
    }
}

/**
 * Permanently deletes a user from the database.
 * Use toggleUserActive for soft delete instead.
 */
export async function deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
    if (!userId) {
        return { success: false, message: 'User ID is required.' };
    }

    try {
        const result = await query(`
            DELETE FROM users
            WHERE id = $1
            RETURNING id
        `, [userId]);

        if (result.rows.length === 0) {
            return { success: false, message: 'User not found.' };
        }

        revalidatePath('/admin/users');
        return { success: true, message: 'User deleted permanently.' };

    } catch (error) {
        console.error(`Failed to delete user ${userId}:`, error);
        return { success: false, message: error instanceof Error ? error.message : 'An unknown error occurred.' };
    }
}
