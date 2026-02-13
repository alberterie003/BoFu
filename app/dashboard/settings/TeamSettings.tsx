'use client'

import { useState } from 'react'
import { inviteTeamMember, removeTeamMember } from './actions'
import { Plus, Trash2, Mail, Shield, User } from 'lucide-react'

type Member = {
    user_id: string
    role: string
    email?: string
    last_sign_in_at?: string
}

export default function TeamSettings({ initialMembers, currentUserId }: { initialMembers: Member[], currentUserId: string }) {
    const [isInviting, setIsInviting] = useState(false)
    const [loading, setLoading] = useState(false)

    async function handleInvite(formData: FormData) {
        setLoading(true)
        const res = await inviteTeamMember(formData)
        setLoading(false)
        if (res?.error) {
            alert(res.error)
        } else {
            setIsInviting(false)
            // Ideally we optimistically update UI or fully refresh
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Team Members</h3>
                    <p className="text-sm text-muted-foreground">Manage who has access to your agency dashboard.</p>
                </div>
                <button
                    onClick={() => setIsInviting(true)}
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90"
                >
                    <Plus size={16} />
                    Invite Member
                </button>
            </div>

            {isInviting && (
                <div className="p-4 bg-secondary/20 border border-border rounded-lg animate-in fade-in slide-in-from-top-2">
                    <form action={handleInvite} className="flex flex-col md:flex-row gap-3 items-end">
                        <div className="flex-1 w-full">
                            <label className="text-xs font-medium mb-1 block">Email Address</label>
                            <input name="email" type="email" required placeholder="colleague@agency.com" className="w-full p-2 rounded border border-input bg-background" />
                        </div>
                        <div className="w-full md:w-32">
                            <label className="text-xs font-medium mb-1 block">Role</label>
                            <select name="role" className="w-full p-2 rounded border border-input bg-background">
                                <option value="member">Member</option>
                                <option value="owner">Owner</option>
                            </select>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <button disabled={loading} type="submit" className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90">
                                {loading ? 'Sending...' : 'Send Invite'}
                            </button>
                            <button type="button" onClick={() => setIsInviting(false)} className="px-4 py-2 border rounded hover:bg-secondary">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="border border-border rounded-xl overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-secondary/50 text-muted-foreground">
                        <tr>
                            <th className="px-6 py-3 font-medium">User</th>
                            <th className="px-6 py-3 font-medium">Role</th>
                            <th className="px-6 py-3 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {initialMembers.map((member) => (
                            <tr key={member.user_id} className="hover:bg-secondary/10">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                            <User size={16} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{member.email}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {member.last_sign_in_at ? `Last login: ${new Date(member.last_sign_in_at).toLocaleDateString()}` : 'Never logged in'}
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border ${member.role === 'owner' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                                        {member.role === 'owner' && <Shield size={10} />}
                                        {member.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {member.user_id !== currentUserId && (
                                        <button
                                            onClick={() => removeTeamMember(member.user_id)}
                                            className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                            title="Remove User"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
