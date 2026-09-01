import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Sparkles,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Beaker,
  Clock,
  Mail,
  Phone,
  Receipt,
  Check,
  Copy,
  Key,
  Lock,
  Eye,
  EyeOff,
  Edit3,
  Share2,
  AtSign,
  Award,
  X,
} from 'lucide-react';
import { UserProfile } from '../types';
import {
  subscribeToUsers,
  fetchAllUsersList,
  calculateUserMetrics,
  setTesterAccess,
  toggleUserPremiumStatus,
  createNewTesterAccount,
  updateTesterCredentials,
  deleteUserAccount,
  bulkDeleteTesterAccounts,
  generateRandomPassword,
  UserStatistics,
} from '../services/userService';

interface UserManagementViewProps {
  currentAdminEmail?: string;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({ currentAdminEmail }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PREMIUM' | 'TESTER' | 'FREE'>('ALL');

  // Notification banner
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal States
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Edit / Reset Credentials Modal
  const [showEditCredentialsModal, setShowEditCredentialsModal] = useState<boolean>(false);
  const [userToEdit, setUserToEdit] = useState<UserProfile | null>(null);
  const [editUsername, setEditUsername] = useState<string>('');
  const [editPassword, setEditPassword] = useState<string>('');
  const [editDisplayName, setEditDisplayName] = useState<string>('');
  const [editNote, setEditNote] = useState<string>('');
  const [showEditPassword, setShowEditPassword] = useState<boolean>(false);
  const [isUpdatingCredentials, setIsUpdatingCredentials] = useState<boolean>(false);

  // Success Credentials Card Modal (after creating a tester)
  const [createdCredentials, setCreatedCredentials] = useState<{
    username: string;
    email: string;
    password: string;
    displayName?: string;
    category?: string;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Bulk Selection States
  const [selectedUids, setSelectedUids] = useState<string[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState<boolean>(false);

  // Add Tester Form States
  const [newTesterUsername, setNewTesterUsername] = useState<string>('');
  const [newTesterPassword, setNewTesterPassword] = useState<string>('');
  const [newTesterEmail, setNewTesterEmail] = useState<string>('');
  const [newTesterName, setNewTesterName] = useState<string>('');
  const [newTesterCategory, setNewTesterCategory] = useState<string>('Beta Tester');
  const [newTesterNote, setNewTesterNote] = useState<string>('');
  const [newTesterPhone, setNewTesterPhone] = useState<string>('');
  const [showTesterPassword, setShowTesterPassword] = useState<boolean>(false);
  const [isSubmittingTester, setIsSubmittingTester] = useState<boolean>(false);

  // Real-time Firestore sync
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToUsers(
      (updatedUsers) => {
        setUsers(updatedUsers);
        setIsLoading(false);
        setIsRefreshing(false);
      },
      (err) => {
        console.warn('Fallback loading users manually:', err);
        fetchAllUsersList().then((data) => {
          setUsers(data);
          setIsLoading(false);
          setIsRefreshing(false);
        });
      }
    );

    return () => unsubscribe();
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const freshUsers = await fetchAllUsersList();
      if (freshUsers.length > 0) {
        setUsers(freshUsers);
      }
      showFeedback('success', `Synchronized ${freshUsers.length} user accounts with Firestore.`);
    } catch {
      showFeedback('error', 'Failed to refresh users from cloud database.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => {
      setStatusMessage((current) => (current?.text === text ? null : current));
    }, 5000);
  };

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2200);
  };

  // Metrics calculation
  const metrics: UserStatistics = useMemo(() => calculateUserMetrics(users), [users]);

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (u.username && u.username.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.displayName && u.displayName.toLowerCase().includes(q)) ||
        (u.mpesaReceiptNumber && u.mpesaReceiptNumber.toLowerCase().includes(q)) ||
        (u.phoneNumber && u.phoneNumber.includes(q)) ||
        (u.testAccountNote && u.testAccountNote.toLowerCase().includes(q)) ||
        u.uid.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // Status filter
      if (statusFilter === 'PREMIUM') return u.isPremium && !u.isTester;
      if (statusFilter === 'TESTER') return Boolean(u.isTester);
      if (statusFilter === 'FREE') return !u.isPremium && !u.isTester;
      return true;
    });
  }, [users, searchQuery, statusFilter]);

  // Quick Action: Grant or Revoke Testing Access
  const handleToggleTesterAccess = async (user: UserProfile, grant: boolean) => {
    const defaultNote = grant ? `Testing access granted by Admin` : undefined;
    const res = await setTesterAccess(user.uid, grant, defaultNote, currentAdminEmail || 'Admin');
    if (res.success) {
      showFeedback(
        'success',
        grant
          ? `Free testing access granted to ${user.username ? '@' + user.username : user.email || user.displayName}.`
          : `Testing access revoked for ${user.username ? '@' + user.username : user.email || user.displayName}.`
      );
      setUsers((prev) =>
        prev.map((u) =>
          u.uid === user.uid
            ? {
                ...u,
                isTester: grant,
                isPremium: grant ? true : u.isPremium,
                role: grant ? 'tester' : 'user',
                testAccountNote: grant ? defaultNote : undefined,
              }
            : u
        )
      );
    } else {
      showFeedback('error', res.error || 'Failed to update testing access.');
    }
  };

  // Generate random password in form
  const handleGeneratePassword = () => {
    const pw = generateRandomPassword();
    setNewTesterPassword(pw);
    setShowTesterPassword(true);
  };

  // Add new tester account with username and password
  const handleCreateTester = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = newTesterUsername.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
    const cleanEmail = newTesterEmail.trim().toLowerCase();

    if (!cleanUsername && !cleanEmail) {
      showFeedback('error', 'Please provide at least a username or an email address.');
      return;
    }

    setIsSubmittingTester(true);
    const combinedNote = newTesterNote
      ? `${newTesterCategory} • ${newTesterNote}`
      : newTesterCategory;

    const res = await createNewTesterAccount({
      username: cleanUsername || cleanEmail.split('@')[0],
      password: newTesterPassword || undefined,
      email: cleanEmail || `${cleanUsername}@radmed.org`,
      displayName: newTesterName || undefined,
      roleCategory: newTesterCategory,
      note: newTesterNote,
      phoneNumber: newTesterPhone || undefined,
      grantedBy: currentAdminEmail || 'Admin Portal',
    });

    setIsSubmittingTester(false);

    if (res.success && res.user && res.credentials) {
      showFeedback('success', `Tester account "@${res.credentials.username}" created successfully with full free access.`);
      setUsers((prev) => [res.user!, ...prev.filter((u) => u.uid !== res.user!.uid)]);
      setShowAddModal(false);

      // Open credentials summary card
      setCreatedCredentials({
        username: res.credentials.username,
        email: res.credentials.email,
        password: res.credentials.password,
        displayName: res.user.displayName,
        category: newTesterCategory,
      });

      // Reset form
      setNewTesterUsername('');
      setNewTesterPassword('');
      setNewTesterEmail('');
      setNewTesterName('');
      setNewTesterNote('');
      setNewTesterPhone('');
      setNewTesterCategory('Beta Tester');
    } else {
      showFeedback('error', res.error || 'Failed to create tester account.');
    }
  };

  // Open Edit Credentials Modal
  const handleOpenEditCredentials = (user: UserProfile) => {
    setUserToEdit(user);
    setEditUsername(user.username || user.email?.split('@')[0] || '');
    setEditPassword(user.temporaryPassword || '');
    setEditDisplayName(user.displayName || '');
    setEditNote(user.testAccountNote || '');
    setShowEditPassword(false);
    setShowEditCredentialsModal(true);
  };

  // Save Edited Credentials
  const handleSaveEditedCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToEdit) return;

    setIsUpdatingCredentials(true);
    const res = await updateTesterCredentials(userToEdit.uid, {
      username: editUsername,
      password: editPassword || undefined,
      displayName: editDisplayName || undefined,
      note: editNote,
    });
    setIsUpdatingCredentials(false);

    if (res.success) {
      showFeedback('success', `Credentials updated for ${editUsername || userToEdit.email}.`);
      setUsers((prev) =>
        prev.map((u) =>
          u.uid === userToEdit.uid
            ? {
                ...u,
                username: editUsername || u.username,
                displayName: editDisplayName || u.displayName,
                temporaryPassword: editPassword || u.temporaryPassword,
                testAccountNote: editNote,
              }
            : u
        )
      );
      setShowEditCredentialsModal(false);
      setUserToEdit(null);
    } else {
      showFeedback('error', res.error || 'Failed to update credentials.');
    }
  };

  // Confirm delete user account
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);

    const res = await deleteUserAccount(userToDelete.uid);
    setIsDeleting(false);

    if (res.success) {
      showFeedback('success', `Account for ${userToDelete.username ? '@' + userToDelete.username : userToDelete.email || userToDelete.displayName} permanently deleted.`);
      setUsers((prev) => prev.filter((u) => u.uid !== userToDelete.uid));
      setSelectedUids((prev) => prev.filter((id) => id !== userToDelete.uid));
      setShowDeleteModal(false);
      setUserToDelete(null);
    } else {
      showFeedback('error', res.error || 'Failed to delete account.');
    }
  };

  // Bulk delete selected testing accounts
  const handleConfirmBulkDelete = async () => {
    if (selectedUids.length === 0) return;
    setIsDeleting(true);

    const res = await bulkDeleteTesterAccounts(selectedUids);
    setIsDeleting(false);

    if (res.success) {
      showFeedback('success', `Deleted ${res.deletedCount} selected accounts from Firestore.`);
      setUsers((prev) => prev.filter((u) => !selectedUids.includes(u.uid)));
      setSelectedUids([]);
      setShowBulkDeleteModal(false);
    } else {
      showFeedback('error', res.error || 'Failed to delete some selected accounts.');
    }
  };

  // Toggle selection for bulk actions
  const handleToggleSelectUser = (uid: string) => {
    setSelectedUids((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const handleSelectAllTesters = () => {
    const allTesterUids = filteredUsers.filter((u) => u.isTester).map((u) => u.uid);
    const allSelected = allTesterUids.length > 0 && allTesterUids.every((id) => selectedUids.includes(id));
    if (allSelected) {
      setSelectedUids((prev) => prev.filter((id) => !allTesterUids.includes(id)));
    } else {
      setSelectedUids((prev) => Array.from(new Set([...prev, ...allTesterUids])));
    }
  };

  // Generate invitation message for clipboard
  const getTesterInviteMessage = (creds: { username: string; email: string; password: string; displayName?: string }) => {
    return `🩺 RadMed Medical Imaging - Clinical Testing Access
Hello ${creds.displayName || 'Clinician'},
You have been granted complimentary full testing access to RadMed.

Login Credentials:
• Username: ${creds.username}
• Email: ${creds.email}
• Password: ${creds.password}
• Access Level: Unrestricted Testing (All Chest X-rays, Head CTs & Reporting Tools)

Sign in at: ${window.location.origin}`;
  };

  return (
    <div id="users-management-container" className="space-y-6">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Users & Tester Management
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                  Username & Password Access
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Provision tester accounts with custom usernames & passwords, grant complimentary free access, and monitor premium memberships.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            id="refresh-users-btn"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Refresh from Firestore"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>Sync DB</span>
          </button>

          <button
            id="add-tester-user-btn"
            onClick={() => {
              setShowAddModal(true);
              if (!newTesterPassword) {
                setNewTesterPassword(generateRandomPassword());
              }
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white transition-all shadow-xs hover:shadow flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Testing Account</span>
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-medium ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Total Registered Users */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Clinicians</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {isLoading ? '...' : metrics.totalUsers}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Registered account profiles in cloud
          </p>
        </div>

        {/* Paid Premium Accounts */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Paid Premium Users
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {isLoading ? '...' : metrics.premiumUsersCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Lifetime Pro members (KES 1,000 paid)
          </p>
        </div>

        {/* Free Testing Access Accounts */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              Testing Accounts
            </span>
            <Beaker className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {isLoading ? '...' : metrics.testerUsersCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Complimentary full access for testers
          </p>
        </div>

        {/* Standard Free Users */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Free Tier</span>
            <Award className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">
            {isLoading ? '...' : metrics.standardFreeCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Standard trial tier (5 CXR / 2 CT)
          </p>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Filter and Search Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by username, email, name..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                &times;
              </button>
            )}
          </div>

          {/* Status Filter Tabs & Bulk Actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap justify-end">
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 text-xs font-semibold">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  statusFilter === 'ALL'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                All ({users.length})
              </button>
              <button
                onClick={() => setStatusFilter('TESTER')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  statusFilter === 'TESTER'
                    ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Testers ({metrics.testerUsersCount})
              </button>
              <button
                onClick={() => setStatusFilter('PREMIUM')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  statusFilter === 'PREMIUM'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Paid Pro ({metrics.premiumUsersCount})
              </button>
              <button
                onClick={() => setStatusFilter('FREE')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  statusFilter === 'FREE'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Free ({metrics.standardFreeCount})
              </button>
            </div>

            {selectedUids.length > 0 && (
              <button
                onClick={() => setShowBulkDeleteModal(true)}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected ({selectedUids.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50/75 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="p-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filteredUsers.length > 0 &&
                      filteredUsers.every((u) => selectedUids.includes(u.uid))
                    }
                    onChange={() => {
                      const allUids = filteredUsers.map((u) => u.uid);
                      const allSelected = allUids.every((id) => selectedUids.includes(id));
                      if (allSelected) {
                        setSelectedUids((prev) => prev.filter((id) => !allUids.includes(id)));
                      } else {
                        setSelectedUids((prev) => Array.from(new Set([...prev, ...allUids])));
                      }
                    }}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    title="Select all in view"
                  />
                </th>
                <th className="p-3.5 font-semibold">Clinician Account</th>
                <th className="p-3.5 font-semibold">Access Level</th>
                <th className="p-3.5 font-semibold">Credentials / Password</th>
                <th className="p-3.5 font-semibold">Testing Note / Details</th>
                <th className="p-3.5 font-semibold">Joined Date</th>
                <th className="p-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
                      <span>Loading user profiles from Firestore...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <Users className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                      <p className="font-semibold text-slate-700 dark:text-slate-300">
                        No user accounts found
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {searchQuery
                          ? 'Try clearing your search query or changing filters.'
                          : 'Click "Create Testing Account" to generate username & password credentials for beta testers.'}
                      </p>
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="mt-2 text-xs text-blue-600 hover:underline cursor-pointer"
                        >
                          Clear Search
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isPaidPro = user.isPremium && !user.isTester;
                  const isTester = Boolean(user.isTester);
                  const isSelected = selectedUids.includes(user.uid);
                  const usernameDisplay = user.username || (user.email ? user.email.split('@')[0] : null);

                  return (
                    <tr
                      key={user.uid}
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                        isSelected ? 'bg-purple-50/40 dark:bg-purple-950/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectUser(user.uid)}
                          className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                        />
                      </td>

                      {/* Clinician Info */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                              isPaidPro
                                ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                                : isTester
                                ? 'bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {(user.displayName || user.username || user.email || 'U').substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                              <span className="truncate">{user.displayName || usernameDisplay || 'Clinician'}</span>
                              {user.username && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-mono">
                                  @{user.username}
                                </span>
                              )}
                              {isTester && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 text-[10px] font-bold">
                                  <Beaker className="w-2.5 h-2.5" /> Tester
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5 truncate">
                              {user.email && (
                                <span className="flex items-center gap-1 truncate">
                                  <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                  <span className="truncate">{user.email}</span>
                                </span>
                              )}
                              {user.phoneNumber && (
                                <span className="hidden sm:flex items-center gap-1 text-slate-400">
                                  • <Phone className="w-2.5 h-2.5" /> {user.phoneNumber}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Access Status Badge */}
                      <td className="p-3.5">
                        {isPaidPro ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Lifetime Pro (Paid)</span>
                          </div>
                        ) : isTester ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                            <span>Free Testing Access</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            <span>Free Tier (5 CXR / 2 CT)</span>
                          </div>
                        )}
                      </td>

                      {/* Credentials / Password for Testing Accounts */}
                      <td className="p-3.5">
                        {isTester ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-[11px] font-mono text-purple-900 dark:text-purple-300">
                              <AtSign className="w-3 h-3 text-purple-500" />
                              <span className="font-semibold">{user.username || user.email?.split('@')[0]}</span>
                            </div>
                            {user.temporaryPassword ? (
                              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 w-fit">
                                <Key className="w-3 h-3 text-slate-400" />
                                <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 select-all">
                                  {user.temporaryPassword}
                                </span>
                                <button
                                  onClick={() => copyToClipboard(user.temporaryPassword!, `pw-${user.uid}`)}
                                  className="text-slate-400 hover:text-purple-600 ml-1 cursor-pointer"
                                  title="Copy password"
                                >
                                  {copiedField === `pw-${user.uid}` ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">Password configured</span>
                            )}
                          </div>
                        ) : user.provider ? (
                          <span className="text-[11px] text-slate-500 font-mono">
                            Provider: {user.provider}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">—</span>
                        )}
                      </td>

                      {/* Notes / M-Pesa Receipt / Testing Category */}
                      <td className="p-3.5">
                        {isTester ? (
                          <div className="text-[11px] text-purple-900 dark:text-purple-300 bg-purple-50/60 dark:bg-purple-950/30 px-2 py-1 rounded-lg border border-purple-100 dark:border-purple-900 max-w-xs truncate">
                            {user.testAccountNote || 'Complimentary testing access'}
                          </div>
                        ) : user.mpesaReceiptNumber ? (
                          <div className="text-[11px] font-mono text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                            <Receipt className="w-3 h-3 text-emerald-500" />
                            <span>{user.mpesaReceiptNumber}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">—</span>
                        )}
                      </td>

                      {/* Created Date */}
                      <td className="p-3.5 text-[11px] text-slate-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          <span>
                            {user.createdAt
                              ? new Date(user.createdAt).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : 'Recent'}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Share Invitation / Copy Details */}
                          {isTester && (
                            <button
                              onClick={() => {
                                const msg = getTesterInviteMessage({
                                  username: user.username || user.email?.split('@')[0] || 'tester',
                                  email: user.email || `${user.username}@radmed.org`,
                                  password: user.temporaryPassword || '(Provided previously)',
                                  displayName: user.displayName,
                                });
                                copyToClipboard(msg, `invite-${user.uid}`);
                                showFeedback('success', `Copied login invitation message for ${user.displayName || user.username}.`);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors cursor-pointer"
                              title="Copy login invitation credentials"
                            >
                              {copiedField === `invite-${user.uid}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Share2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}

                          {/* Edit Credentials */}
                          <button
                            onClick={() => handleOpenEditCredentials(user)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                            title="Edit username, password or profile details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Toggle Free Testing Access Button */}
                          {isTester ? (
                            <button
                              onClick={() => handleToggleTesterAccess(user, false)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950 transition-colors cursor-pointer"
                              title="Revoke testing privileges"
                            >
                              Revoke Tester
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleTesterAccess(user, true)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 transition-colors flex items-center gap-1 cursor-pointer"
                              title="Grant unrestricted free access for testing"
                            >
                              <Beaker className="w-3 h-3 text-purple-600" />
                              <span>Grant Test Access</span>
                            </button>
                          )}

                          {/* Delete Action */}
                          <button
                            onClick={() => {
                              setUserToDelete(user);
                              setShowDeleteModal(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Delete user account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info bar */}
        <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>
            Showing <strong className="text-slate-700 dark:text-slate-300">{filteredUsers.length}</strong> of {users.length} accounts
          </span>
          <div className="flex items-center gap-4 text-[11px] flex-wrap">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Paid Pro: {metrics.premiumUsersCount}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-purple-500" /> Testers: {metrics.testerUsersCount}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-400" /> Free Tier: {metrics.standardFreeCount}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: CREATE TESTER ACCOUNT (WITH USERNAME & PASSWORD) */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Create Testing Account
                  </h3>
                  <p className="text-xs text-slate-500">
                    Assign a username, password, and complimentary full access.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer text-lg leading-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTester} className="space-y-4 pt-4">
              {/* Username & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Tester Username <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">@</span>
                    <input
                      type="text"
                      required
                      value={newTesterUsername}
                      onChange={(e) => setNewTesterUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ''))}
                      placeholder="dr_sarah"
                      className="w-full pl-8 pr-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Password <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-0.5 cursor-pointer font-medium"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Random</span>
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showTesterPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={newTesterPassword}
                      onChange={(e) => setNewTesterPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-8 pr-8 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowTesterPassword(!showTesterPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showTesterPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Clinician Email Address (Optional, defaults to @radmed.org)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={newTesterEmail}
                    onChange={(e) => setNewTesterEmail(e.target.value)}
                    placeholder={newTesterUsername ? `${newTesterUsername}@radmed.org` : 'doctor@hospital.org'}
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
              </div>

              {/* Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Clinician Full Name / Title
                  </label>
                  <input
                    type="text"
                    value={newTesterName}
                    onChange={(e) => setNewTesterName(e.target.value)}
                    placeholder="Dr. Sarah Kimani"
                    className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Tester Category
                  </label>
                  <select
                    value={newTesterCategory}
                    onChange={(e) => setNewTesterCategory(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                  >
                    <option value="Beta Tester">Beta Tester</option>
                    <option value="Radiology Resident">Radiology Resident</option>
                    <option value="Consultant Radiologist">Consultant Radiologist</option>
                    <option value="Medical Student">Medical Student</option>
                    <option value="QA / Clinical Reviewer">QA / Clinical Reviewer</option>
                    <option value="Academic Staff">Academic Staff</option>
                  </select>
                </div>
              </div>

              {/* Testing Purpose & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Testing Purpose / Note
                  </label>
                  <input
                    type="text"
                    value={newTesterNote}
                    onChange={(e) => setNewTesterNote(e.target.value)}
                    placeholder="e.g. Evaluating CXR cases..."
                    className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Phone (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={newTesterPhone}
                      onChange={(e) => setNewTesterPhone(e.target.value)}
                      placeholder="254712345678"
                      className="w-full pl-8 pr-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Info banner */}
              <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-100 dark:border-purple-900 text-[11px] text-purple-800 dark:text-purple-300 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                <span>
                  This account will instantly be provisioned in Auth and Firestore with <strong>unrestricted free testing access</strong> to all cases. The clinician can log in using either their username or email.
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTester}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingTester ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Create Account & Credentials</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATED CREDENTIALS SUCCESS POPUP */}
      {/* ========================================================================= */}
      {createdCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400 mx-auto mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Tester Account Ready!
              </h3>
              <p className="text-xs text-slate-500">
                Share these login credentials with the clinician for testing access.
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Username:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    @{createdCredentials.username}
                  </span>
                  <button
                    onClick={() => copyToClipboard(createdCredentials.username, 'modal-u')}
                    className="text-slate-400 hover:text-purple-600 cursor-pointer"
                  >
                    {copiedField === 'modal-u' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Email:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {createdCredentials.email}
                  </span>
                  <button
                    onClick={() => copyToClipboard(createdCredentials.email, 'modal-e')}
                    className="text-slate-400 hover:text-purple-600 cursor-pointer"
                  >
                    {copiedField === 'modal-e' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Password:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-purple-700 dark:text-purple-300 bg-purple-100/70 dark:bg-purple-950/60 px-2 py-0.5 rounded">
                    {createdCredentials.password}
                  </span>
                  <button
                    onClick={() => copyToClipboard(createdCredentials.password, 'modal-p')}
                    className="text-slate-400 hover:text-purple-600 cursor-pointer"
                  >
                    {copiedField === 'modal-p' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Access Level:</span>
                <span className="font-bold text-purple-600 dark:text-purple-400">
                  Full Unrestricted (Free)
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={() => {
                  const msg = getTesterInviteMessage(createdCredentials);
                  copyToClipboard(msg, 'full-invite');
                  showFeedback('success', 'Full invitation message copied to clipboard.');
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
              >
                {copiedField === 'full-invite' ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                <span>{copiedField === 'full-invite' ? 'Copied to Clipboard!' : 'Copy Full Invitation Message'}</span>
              </button>

              <button
                type="button"
                onClick={() => setCreatedCredentials(null)}
                className="w-full py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT / RESET CREDENTIALS */}
      {/* ========================================================================= */}
      {showEditCredentialsModal && userToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Edit Account & Credentials
                  </h3>
                  <p className="text-xs text-slate-500">
                    Update username, password, or testing profile details.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEditCredentialsModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer text-lg leading-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedCredentials} className="space-y-3.5 pt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">@</span>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ''))}
                    placeholder="username"
                    className="w-full pl-8 pr-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Password / Reset Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setEditPassword(generateRandomPassword());
                      setShowEditPassword(true);
                    }}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer font-medium"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Generate New</span>
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Enter new password (min. 6 chars)"
                    className="w-full pl-8 pr-8 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showEditPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Display Name
                </label>
                <input
                  type="text"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  placeholder="Dr. Full Name"
                  className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Testing Note / Clinical Assignment
                </label>
                <input
                  type="text"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="e.g. CXR evaluation..."
                  className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditCredentialsModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingCredentials}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isUpdatingCredentials ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SINGLE USER DELETE CONFIRMATION */}
      {/* ========================================================================= */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Delete User Account
                </h3>
                <p className="text-xs text-slate-500">
                  Permanently remove this account from Firestore database.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 my-4 text-xs space-y-1.5">
              <div className="text-slate-900 dark:text-white font-bold flex items-center gap-1.5">
                <span>{userToDelete.displayName || 'Clinician'}</span>
                {userToDelete.username && (
                  <span className="font-mono text-purple-600 font-normal">@{userToDelete.username}</span>
                )}
              </div>
              <div className="text-slate-500 text-[11px]">
                Email: {userToDelete.email || 'None'}
              </div>
              <div className="text-slate-500 text-[11px]">
                Status: {userToDelete.isTester ? 'Testing Account (Free Access)' : userToDelete.isPremium ? 'Paid Pro' : 'Free Tier'}
              </div>
              {userToDelete.testAccountNote && (
                <div className="text-purple-600 dark:text-purple-400 text-[11px]">
                  Note: {userToDelete.testAccountNote}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setUserToDelete(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Delete Account</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BULK DELETE TESTERS CONFIRMATION */}
      {/* ========================================================================= */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Bulk Delete {selectedUids.length} Accounts
                </h3>
                <p className="text-xs text-slate-500">
                  Permanently remove selected accounts from the Firestore database.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 my-4 leading-relaxed">
              This action will remove <strong>{selectedUids.length}</strong> selected accounts. Any test accounts will lose free access immediately.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowBulkDeleteModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Delete {selectedUids.length} Accounts</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
