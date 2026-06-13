'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { AdminUser } from '../types';
import { fetchUsers, updateUserRole, deleteUser } from '../lib/api';
import { 
  Users, 
  Search, 
  Shield, 
  Trash2, 
  UserCheck, 
  UserMinus, 
  Mail, 
  Calendar, 
  FolderKanban,
  AlertTriangle,
  Eye
} from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';

interface AdminViewProps {
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export function AdminView({ onShowToast }: AdminViewProps) {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  
  // States for role change confirmation
  const [confirmingRoleChange, setConfirmingRoleChange] = useState<{
    user: AdminUser;
    targetRole: 'USER' | 'ADMIN';
  } | null>(null);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  // States for user delete confirmation
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
      onShowToast(err.message || 'Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async () => {
    if (!confirmingRoleChange) return;
    const { user, targetRole } = confirmingRoleChange;
    setIsUpdatingRole(true);
    try {
      const updatedUser = await updateUserRole(user.id, targetRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: updatedUser.role } : u))
      );
      onShowToast(`Successfully updated ${user.name || user.email}'s role to ${targetRole}`, 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Failed to update user role', 'error');
    } finally {
      setIsUpdatingRole(false);
      setConfirmingRoleChange(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    setIsDeleting(true);
    try {
      await deleteUser(deletingUser.id);
      setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id));
      onShowToast(`Successfully deleted user ${deletingUser.name || deletingUser.email} and all their tasks`, 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Failed to delete user', 'error');
    } finally {
      setIsDeleting(false);
      setDeletingUser(null);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.name && u.name.toLowerCase().includes(search.toLowerCase()))
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 100, damping: 15 }
    }
  } as const;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Title & Info */}
      <motion.div variants={itemVariants} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-black dark:text-white uppercase tracking-wider">System User Directory</h2>
          <p className="text-xs font-bold text-neutral-500 dark:text-zinc-400 mt-1 uppercase tracking-wider">
            Manage user roles, monitor task contributions, and administer system access.
          </p>
        </div>

        {/* Total stats */}
        <div className="flex items-center gap-2.5 rounded-none border-2 border-black bg-white px-4.5 py-3 shadow-[4px_4px_0px_0px_#000000] dark:border-white dark:bg-zinc-950 dark:shadow-[4px_4px_0px_0px_#ffffff]">
          <div className="flex size-9 items-center justify-center rounded-none border border-black bg-neutral-50 text-black dark:border-white dark:bg-zinc-900 dark:text-white">
            <Users className="size-4.5" />
          </div>
          <div>
            <span className="block text-[10px] font-black uppercase tracking-wider text-neutral-450 dark:text-zinc-400">Total Users</span>
            <span className="text-sm font-black text-black dark:text-white mt-0.5 block uppercase tracking-wider">{users.length} registered</span>
          </div>
        </div>
      </motion.div>

      {/* Control bar */}
      <motion.div variants={itemVariants} className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-black dark:text-white pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email address..."
            className="w-full rounded-none border-2 border-black bg-white py-3 pl-11 pr-4 text-xs font-bold text-black placeholder-neutral-450 transition-colors focus:outline-none dark:border-white dark:bg-zinc-950 dark:text-white dark:placeholder-zinc-500 shadow-[3px_3px_0px_0px_#000000] dark:shadow-[3px_3px_0px_0px_#ffffff]"
          />
        </div>
      </motion.div>

      {/* Main Table view */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-12 bg-neutral-205 dark:bg-zinc-800 rounded-none border border-black dark:border-white" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-neutral-205 dark:bg-zinc-800 rounded-none border border-black dark:border-white" />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-white dark:bg-zinc-950 rounded-none border-2 border-black dark:border-white p-6 shadow-[4px_4px_0px_0px_#000000] dark:shadow-[4px_4px_0px_0px_#ffffff]">
          <AlertTriangle className="size-8 text-red-500 mb-3" />
          <h3 className="text-sm font-bold text-black dark:text-white uppercase tracking-wider">Failed to load users</h3>
          <p className="text-xs text-neutral-500 dark:text-zinc-400 mt-1 uppercase tracking-wider">{error}</p>
          <button
            onClick={loadUsers}
            className="mt-4 rounded-none border-2 border-black bg-white px-4 py-2 text-xs font-black text-black hover:bg-black hover:text-white dark:border-white dark:bg-zinc-950 dark:text-white dark:hover:bg-white dark:hover:text-black transition uppercase tracking-wider"
          >
            Retry Fetching
          </button>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white dark:bg-zinc-950 rounded-none border-2 border-black dark:border-white p-6 shadow-[4px_4px_0px_0px_#000000] dark:shadow-[4px_4px_0px_0px_#ffffff]">
          <Users className="size-8 text-neutral-400 dark:text-zinc-650 mb-3" />
          <h3 className="text-sm font-bold text-black dark:text-white uppercase tracking-wider">No users found</h3>
          <p className="text-xs text-neutral-500 dark:text-zinc-400 mt-1 uppercase tracking-wider">Try adjusting your search criteria.</p>
        </div>
      ) : (
        <motion.div variants={itemVariants} className="overflow-hidden rounded-none border-2 border-black bg-white shadow-[4px_4px_0px_0px_#000000] dark:border-white dark:bg-zinc-950 dark:shadow-[4px_4px_0px_0px_#ffffff]">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b-2 border-black bg-neutral-50 text-[10px] font-black uppercase tracking-wider text-black dark:border-white dark:bg-zinc-900 dark:text-white">
                  <th className="px-6 py-4.5">User Identity</th>
                  <th className="px-6 py-4.5">Account Role</th>
                  <th className="px-6 py-4.5 text-center">Tasks Created</th>
                  <th className="px-6 py-4.5">Joined Date</th>
                  <th className="px-6 py-4.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black dark:divide-white text-xs">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="group hover:bg-neutral-50 dark:hover:bg-zinc-900 transition-colors"
                  >
                    {/* User Identity */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-none border border-black bg-white text-black dark:border-white dark:bg-zinc-950 dark:text-white font-black uppercase">
                          {user.name ? user.name.charAt(0) : user.email.charAt(0)}
                        </div>
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-800 dark:text-zinc-150 block">
                            {user.name || 'Anonymous User'}
                          </span>
                          <span className="text-[10px] font-semibold text-neutral-450 dark:text-zinc-400 flex items-center gap-1">
                            <Mail className="size-3 text-neutral-400" />
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Role Badge */}
                    <td className="px-6 py-4">
                      {user.role === 'ADMIN' ? (
                        <span className="inline-flex items-center gap-1 rounded-none border border-black bg-white px-2 py-1 text-[9px] font-black uppercase tracking-wider text-black dark:border-white dark:bg-zinc-950 dark:text-white">
                          <Shield className="size-3" />
                          System Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-none border border-black bg-white px-2 py-1 text-[9px] font-black uppercase tracking-wider text-black dark:border-white dark:bg-zinc-950 dark:text-white">
                          Standard User
                        </span>
                      )}
                    </td>

                    {/* Task Count */}
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-1 text-[11px] font-black text-black dark:text-white">
                        <FolderKanban className="size-3.5" />
                        <span>{user._count?.tasks || 0}</span>
                      </div>
                    </td>

                    {/* Joined Date */}
                    <td className="px-6 py-4 text-neutral-550 dark:text-zinc-400 font-bold uppercase tracking-wider">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="size-3.5 text-black dark:text-white" />
                        <span>{new Date(user.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}</span>
                      </div>
                    </td>

                    {/* Action buttons */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-90 group-hover:opacity-100 transition-opacity">
                        {/* View User Detail */}
                        <Link
                          href={`/admin/users/${user.id}`}
                          title="View user detail page"
                          className="flex size-8.5 items-center justify-center rounded-none border border-black bg-white text-black hover:bg-black hover:text-white dark:border-white dark:bg-zinc-950 dark:text-white dark:hover:bg-white dark:hover:text-black transition shadow-[1px_1px_0px_0px_#000000] dark:shadow-[1px_1px_0px_0px_#ffffff]"
                        >
                          <Eye className="size-4" />
                        </Link>

                        {/* Toggle Role (Hide if demoting oneself) */}
                        {user.id !== currentUser?.id && (
                          user.role === 'ADMIN' ? (
                            <button
                              onClick={() =>
                                setConfirmingRoleChange({ user, targetRole: 'USER' })
                              }
                              title="Demote to standard user"
                              className="flex size-8.5 items-center justify-center rounded-none border border-black bg-white text-black hover:bg-black hover:text-white dark:border-white dark:bg-zinc-950 dark:text-white dark:hover:bg-white dark:hover:text-black transition shadow-[1px_1px_0px_0px_#000000] dark:shadow-[1px_1px_0px_0px_#ffffff]"
                            >
                              <UserMinus className="size-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                setConfirmingRoleChange({ user, targetRole: 'ADMIN' })
                              }
                              title="Promote to admin role"
                              className="flex size-8.5 items-center justify-center rounded-none border border-black bg-white text-black hover:bg-black hover:text-white dark:border-white dark:bg-zinc-950 dark:text-white dark:hover:bg-white dark:hover:text-black transition shadow-[1px_1px_0px_0px_#000000] dark:shadow-[1px_1px_0px_0px_#ffffff]"
                            >
                              <UserCheck className="size-4" />
                            </button>
                          )
                        )}

                        {/* Delete User (Hide if deleting oneself) */}
                        {user.id !== currentUser?.id && (
                          <button
                            onClick={() => setDeletingUser(user)}
                            title="Delete user account and all tasks"
                            className="flex size-8.5 items-center justify-center rounded-none border border-black bg-white text-black hover:bg-black hover:text-white dark:border-white dark:bg-zinc-950 dark:text-white dark:hover:bg-white dark:hover:text-black transition shadow-[1px_1px_0px_0px_#000000] dark:shadow-[1px_1px_0px_0px_#ffffff]"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Role Change Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmingRoleChange !== null}
        onCancel={() => setConfirmingRoleChange(null)}
        onConfirm={handleRoleChange}
        title="Change User Role?"
        message={
          confirmingRoleChange
            ? `Are you sure you want to change the role of ${
                confirmingRoleChange.user.name || confirmingRoleChange.user.email
              } to ${confirmingRoleChange.targetRole}?`
            : ''
        }
        confirmLabel={isUpdatingRole ? 'Updating...' : 'Confirm'}
      />

      {/* Delete User Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deletingUser !== null}
        onCancel={() => setDeletingUser(null)}
        onConfirm={handleDeleteUser}
        title="Permanently Delete User?"
        message={
          deletingUser
            ? `Warning: This will permanently delete the user account (${
                deletingUser.name || deletingUser.email
              }) and all ${
                deletingUser._count?.tasks || 0
              } of their created tasks. This action is irreversible.`
            : ''
        }
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete Permanently'}
      />
    </motion.div>
  );
}
