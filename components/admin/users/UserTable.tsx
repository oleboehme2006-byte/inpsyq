
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Search, X } from 'lucide-react';
import { inviteUser, deleteUser } from '@/actions/admin-users';

interface User {
    user_id: string;
    email: string;
    name: string | null;
    clerk_id: string | null;
    is_active: boolean;
    team_name: string | null;
    team_id: string | null;
    role: string | null;
    created_at: Date;
}

interface Team {
    team_id: string;
    name: string;
}

export function UserTable({ users, teams }: { users: User[], teams: Team[] }) {
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const filteredUsers = users.filter(u =>
        (u.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (u.name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    async function handleInvite(formData: FormData) {
        setMessage(null);
        const res = await inviteUser(null, formData);

        if (res?.success) {
            setMessage({ type: 'success', text: 'Invitation sent!' });
            setIsInviteOpen(false);
            setTimeout(() => setMessage(null), 3000);
        } else {
            setMessage({ type: 'error', text: res?.message || 'Failed' });
        }
    }

    async function handleDelete(userId: string) {
        if (!confirm('Are you sure?')) return;
        const res = await deleteUser(userId);
        if (res.success) setMessage({ type: 'success', text: 'User deleted.' });
        else setMessage({ type: 'error', text: 'Failed to delete.' });
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-[#0A0A0A] p-4 rounded-xl border border-white/5">
                <div className="relative w-64">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 p-2 text-sm text-white"
                    />
                </div>
                <button
                    onClick={() => setIsInviteOpen(true)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                >
                    <Plus className="w-4 h-4" />
                    Invite User
                </button>
            </div>

            {message && (
                <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    {message.text}
                </div>
            )}

            <div className="bg-[#0A0A0A] border border-white/5 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm text-gray-400">
                    <thead className="bg-white/5 text-gray-200 uppercase text-xs">
                        <tr>
                            <th className="p-4">User</th>
                            <th className="p-4">Role</th>
                            <th className="p-4">Team</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredUsers.map(user => (
                            <tr key={user.user_id} className="hover:bg-white/5 transition-colors">
                                <td className="p-4 font-medium text-white">
                                    {user.name || 'No Name'}
                                    <div className="text-xs text-gray-500 font-normal">{user.email}</div>
                                </td>
                                <td className="p-4">
                                    <span className="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs">
                                        {user.role || 'GUEST'}
                                    </span>
                                </td>
                                <td className="p-4">{user.team_name || '-'}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs ${user.clerk_id ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                                        {user.clerk_id ? 'Active' : 'Pending'}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    <button onClick={() => handleDelete(user.user_id)} className="text-gray-500 hover:text-red-400 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredUsers.length === 0 && <tr><td colSpan={5} className="p-8 text-center opacity-50">No users found</td></tr>}
                    </tbody>
                </table>
            </div>

            <AnimatePresence>
                {isInviteOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={() => setIsInviteOpen(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6 w-full max-w-md relative z-10 shadow-2xl"
                        >
                            <h3 className="text-lg font-medium text-white mb-4">Invite User</h3>
                            <button onClick={() => setIsInviteOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                            <form action={handleInvite} className="space-y-4">
                                <input name="name" required placeholder="Name" className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white" />
                                <input name="email" type="email" required placeholder="Email" className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white" />
                                <div className="grid grid-cols-2 gap-4">
                                    <select name="teamId" required className="bg-white/5 border border-white/10 rounded-lg p-2 text-white">
                                        {teams.map(t => <option key={t.team_id} value={t.team_id}>{t.name}</option>)}
                                    </select>
                                    <select name="role" required className="bg-white/5 border border-white/10 rounded-lg p-2 text-white">
                                        <option value="EMPLOYEE">Employee</option>
                                        <option value="TEAMLEAD">Team Lead</option>
                                        <option value="EXECUTIVE">Executive</option>
                                        <option value="ADMIN">Admin</option>
                                    </select>
                                </div>
                                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg transition-colors">
                                    Send Invite
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
