
'use server';

import { query } from '@/db/client';
import { resend, EMAIL_FROM } from '@/services/email/client';
import InviteEmail from '@/services/email/templates/InviteEmail';
import { render } from '@react-email/components';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

// --- Validation Schemas ---
const InviteSchema = z.object({
    email: z.string().email(),
    teamId: z.string().uuid(),
    name: z.string().min(1),
    role: z.enum(['ADMIN', 'EXECUTIVE', 'TEAMLEAD', 'EMPLOYEE']),
});

// --- Actions ---

export async function getUsers() {
    const sql = `
        SELECT 
            u.user_id, 
            u.email, 
            u.name, 
            u.clerk_id, 
            u.is_active,
            t.name as team_name,
            t.team_id,
            m.role,
            u.created_at
        FROM users u
        LEFT JOIN teams t ON u.team_id = t.team_id
        LEFT JOIN memberships m ON u.user_id = m.user_id
        ORDER BY u.created_at DESC
    `;
    const res = await query(sql);
    return res.rows;
}

export async function getTeams() {
    const res = await query('SELECT team_id, name FROM teams ORDER BY name ASC');
    return res.rows;
}

export async function inviteUser(prevState: any, formData: FormData) {
    const rawData = {
        email: formData.get('email'),
        teamId: formData.get('teamId'),
        name: formData.get('name'),
        role: formData.get('role'),
    };

    const validated = InviteSchema.safeParse(rawData);

    if (!validated.success) {
        return { message: 'Invalid input', errors: validated.error.flatten().fieldErrors };
    }

    const { email, teamId, name, role } = validated.data;

    try {
        await query('BEGIN');

        // 1. Check if user exists
        const existing = await query('SELECT user_id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            await query('ROLLBACK');
            return { message: 'User with this email already exists' };
        }

        // 2. Insert into users (pre-seed for Clerk Webhook linking)
        // We need an org_id. Assuming single org or fetching from team.
        const teamRes = await query('SELECT org_id, name FROM teams WHERE team_id = $1', [teamId]);
        if (teamRes.rows.length === 0) throw new Error('Team not found');
        const { org_id, name: teamName } = teamRes.rows[0];

        const insertUser = await query(
            'INSERT INTO users (email, name, team_id, org_id) VALUES ($1, $2, $3, $4) RETURNING user_id',
            [email, name, teamId, org_id]
        );
        const userId = insertUser.rows[0].user_id;

        // 3. Insert Membership
        await query(
            'INSERT INTO memberships (user_id, team_id, org_id, role) VALUES ($1, $2, $3, $4)',
            [userId, teamId, org_id, role]
        );

        await query('COMMIT');

        // 4. Send Email
        const emailHtml = await render(InviteEmail({
            teamName: teamName,
            inviteLink: 'http://localhost:3001' // TODO: Env var
        }));

        await resend.emails.send({
            from: EMAIL_FROM,
            to: email,
            subject: `Join ${teamName} on InPsyq`,
            html: emailHtml,
        });

        revalidatePath('/admin/users');
        return { message: 'Invitation sent!', success: true };

    } catch (e: any) {
        await query('ROLLBACK');
        console.error('Invite Error:', e);
        return { message: 'Failed to invite user: ' + e.message };
    }
}

export async function deleteUser(userId: string) {
    try {
        await query('BEGIN');
        await query('DELETE FROM memberships WHERE user_id = $1', [userId]);
        await query('DELETE FROM users WHERE user_id = $1', [userId]);
        await query('COMMIT');
        revalidatePath('/admin/users');
        return { success: true };
    } catch (e) {
        await query('ROLLBACK');
        return { success: false, error: 'Database error' };
    }
}
