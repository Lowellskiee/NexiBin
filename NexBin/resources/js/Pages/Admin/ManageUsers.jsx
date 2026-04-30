import { Head, router, usePage, useForm } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";

const ITEMS_PER_PAGE = 8;

const ROLE_CONFIG = {
    admin: {
        label: "Admins",
        color: "#1B1F5E",
        badge: "bg-[#1B1F5E]/10 text-[#1B1F5E] ring-1 ring-[#1B1F5E]/20",
        dot: "bg-[#1B1F5E]",
        tabActive: "bg-[#1B1F5E] text-white shadow",
        tabInactive: "bg-white text-[#1B1F5E] border border-[#1B1F5E]/20 hover:bg-[#1B1F5E]/5",
    },
    staff: {
        label: "Staff",
        color: "#D97706",
        badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
        dot: "bg-amber-500",
        tabActive: "bg-amber-500 text-white shadow",
        tabInactive: "bg-white text-amber-700 border border-amber-200 hover:bg-amber-50",
    },
    user: {
        label: "Users",
        color: "#4B5563",
        badge: "bg-gray-100 text-gray-600 ring-1 ring-gray-200",
        dot: "bg-gray-400",
        tabActive: "bg-gray-700 text-white shadow",
        tabInactive: "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50",
    },
};

const FIELDS = [
    { key: "name",           label: "Full Name",     type: "text",  col: "col-span-2" },
    { key: "email",          label: "Email",         type: "email", col: "col-span-2" },
    { key: "student_number", label: "Student No.",   type: "text",  col: "col-span-1" },
    { key: "course",         label: "Course",        type: "text",  col: "col-span-1" },
    { key: "year_level",     label: "Year Level",    type: "text",  col: "col-span-1" },
    { key: "section",        label: "Section",       type: "text",  col: "col-span-1" },
];

/* ─── Ellipsis Pagination ─────────────────────────────────── */
function Pagination({ current, total, onChange }) {
    if (total <= 1) return null;

    const pages = [];
    const delta = 1;
    const left  = Math.max(2, current - delta);
    const right = Math.min(total - 1, current + delta);

    pages.push(1);
    if (left > 2) pages.push("...");
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < total - 1) pages.push("...");
    if (total > 1) pages.push(total);

    return (
        <div className="flex items-center justify-center gap-1 pt-3 flex-wrap">
            <button
                disabled={current === 1}
                onClick={() => onChange(current - 1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-sm border border-gray-200 bg-white disabled:opacity-30 hover:bg-gray-50 transition-colors"
            >‹</button>

            {pages.map((p, i) =>
                p === "..." ? (
                    <span key={`e-${i}`} className="w-8 h-8 flex items-center justify-center text-gray-400 text-sm">…</span>
                ) : (
                    <button
                        key={p}
                        onClick={() => onChange(p)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm border transition-colors ${
                            p === current
                                ? "bg-[#1B1F5E] text-white border-[#1B1F5E]"
                                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                    >{p}</button>
                )
            )}

            <button
                disabled={current === total}
                onClick={() => onChange(current + 1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-sm border border-gray-200 bg-white disabled:opacity-30 hover:bg-gray-50 transition-colors"
            >›</button>
        </div>
    );
}

/* ─── Form Field ──────────────────────────────────────────── */
function Field({ label, col, error, children }) {
    return (
        <div className={`flex flex-col gap-1 ${col}`}>
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{label}</label>
            {children}
            {error && <p className="text-red-500 text-xs mt-0.5">{error}</p>}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════ */
export default function ManageUsers() {
    const { users } = usePage().props;

    const [search,       setSearch]       = useState("");
    const [editingUser,  setEditingUser]  = useState(null);
    const [showForm,     setShowForm]     = useState(false);
    const [deleteId,     setDeleteId]     = useState(null);
    const [openSections, setOpenSections] = useState({ admin: true, staff: true, user: true });
    const [activeTab,    setActiveTab]    = useState("user");
    const [pages,        setPages]        = useState({ admin: 1, staff: 1, user: 1 });

    const { data, setData, post, put, reset, processing, errors, clearErrors } = useForm({
        name: "", email: "", password: "", role: "user",
        student_number: "", course: "", year_level: "", section: "",
    });

    /* ── Filtering & grouping ─── */
    const roleOrder = { admin: 1, staff: 2, user: 3 };

    const filtered = users
        .filter(u =>
            u.name.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => {
            if (roleOrder[a.role] !== roleOrder[b.role]) return roleOrder[a.role] - roleOrder[b.role];
            return a.name.localeCompare(b.name);
        });

    const grouped = {
        admin: filtered.filter(u => u.role === "admin"),
        staff: filtered.filter(u => u.role === "staff"),
        user:  filtered.filter(u => u.role === "user"),
    };

    /* ── Modal helpers ─── */
    const openCreate = () => { clearErrors(); reset(); setEditingUser(null); setShowForm(true); };
    const openEdit   = (user) => {
        clearErrors();
        setEditingUser(user);
        setData({
            name: user.name, email: user.email, password: "", role: user.role,
            student_number: user.student_number || "",
            course:     user.course      || "",
            year_level: user.year_level  || "",
            section:    user.section     || "",
        });
        setShowForm(true);
    };
    const closeForm = () => { setShowForm(false); clearErrors(); reset(); };

    const submit = (e) => {
        e.preventDefault();
        if (processing) return;
        const opts = {
            preserveScroll: true,
            onSuccess: () => { toast.success(editingUser ? "User updated!" : "User created!"); closeForm(); },
            onError:   () => toast.error("Please fix the errors below."),
        };
        editingUser
            ? put(route("admin.users.update", editingUser.id), opts)
            : post(route("admin.users.store"), opts);
    };

    const confirmDelete = () => {
        router.delete(route("admin.users.delete", deleteId), {
            preserveScroll: true,
            onSuccess: () => { toast.success("User deleted."); setDeleteId(null); },
            onError:   () => toast.error("Failed to delete user."),
        });
    };

    /* ── Mobile pagination ─── */
    const currentList = grouped[activeTab];
    const currentPage = pages[activeTab];
    const totalPages  = Math.ceil(currentList.length / ITEMS_PER_PAGE);
    const paginated   = currentList.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    const goToPage    = (role, page) => setPages(p => ({ ...p, [role]: page }));

    /* ── Desktop section rows ─── */
    const renderSection = (roleKey, list) => {
        if (!list.length) return null;
        const cfg = ROLE_CONFIG[roleKey];
        return (
            <>
                <tr
                    className="cursor-pointer select-none group"
                    onClick={() => setOpenSections(p => ({ ...p, [roleKey]: !p[roleKey] }))}
                >
                    <td colSpan="7" className="px-6 py-2.5 bg-gray-50/80 border-y border-gray-100">
                        <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                            <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">{cfg.label}</span>
                            <span className="text-[11px] text-gray-400">({list.length})</span>
                            <span className="ml-auto text-gray-300 text-xs group-hover:text-gray-500 transition-colors">
                                {openSections[roleKey] ? "▲" : "▼"}
                            </span>
                        </div>
                    </td>
                </tr>
                {openSections[roleKey] && list.map(user => (
                    <tr key={user.id} className="border-b border-gray-50 hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-3">
                            <p className="font-medium text-gray-900 text-sm leading-tight">{user.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{user.student_number || "—"}</p>
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-500">{user.email}</td>
                        <td className="px-6 py-3 text-sm text-gray-500 text-center">{user.course     || "—"}</td>
                        <td className="px-6 py-3 text-sm text-gray-500 text-center">{user.year_level || "—"}</td>
                        <td className="px-6 py-3 text-sm text-gray-500 text-center">{user.section    || "—"}</td>
                        <td className="px-6 py-3 text-center">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.badge}`}>
                                {user.role}
                            </span>
                        </td>
                        <td className="px-6 py-3">
                            <div className="flex items-center justify-center gap-3">
                                <button onClick={() => openEdit(user)}       className="text-xs font-semibold text-amber-600 hover:text-amber-700 hover:underline underline-offset-2 transition-colors">Edit</button>
                                <span className="text-gray-200">|</span>
                                <button onClick={() => setDeleteId(user.id)} className="text-xs font-semibold text-red-500 hover:text-red-600 hover:underline underline-offset-2 transition-colors">Delete</button>
                            </div>
                        </td>
                    </tr>
                ))}
            </>
        );
    };

    /* ════════════════════════════════════════════════════════ */
    return (
        <>
            <Head title="Manage Users" />
            <AdminLayout>
                <Toaster
                    position="top-right"
                    toastOptions={{
                        style: { fontSize: "13px", borderRadius: "10px" },
                        success: { iconTheme: { primary: "#1B1F5E", secondary: "#fff" } },
                    }}
                />

                {/* ── PAGE HEADER ── */}
                <div className="mb-5">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Manage Users</h2>
                            <p className="text-xs text-gray-400 mt-0.5">
                                {users.length} total &middot; {grouped.admin.length} admin &middot; {grouped.staff.length} staff &middot; {grouped.user.length} users
                            </p>
                        </div>
                        <button
                            onClick={openCreate}
                            className="flex-shrink-0 inline-flex items-center gap-1.5 bg-[#1B1F5E] hover:bg-[#14185a] text-white text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-colors shadow-sm"
                        >
                            <span className="text-sm leading-none">+</span> New User
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative mt-4">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">🔍</span>
                        <input
                            type="text"
                            placeholder="Search name or email..."
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPages({ admin: 1, staff: 1, user: 1 }); }}
                            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B1F5E]/20 focus:border-[#1B1F5E]/50 bg-white transition-all"
                        />
                    </div>
                </div>

                {/* ── DESKTOP TABLE ── */}
                <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-[#1B1F5E] text-white">
                                {[
                                    { h: "Name",    align: "left"   },
                                    { h: "Email",   align: "left"   },
                                    { h: "Course",  align: "center" },
                                    { h: "Year",    align: "center" },
                                    { h: "Section", align: "center" },
                                    { h: "Role",    align: "center" },
                                    { h: "Actions", align: "center" },
                                ].map(({ h, align }) => (
                                    <th key={h} className={`px-6 py-4 font-semibold text-xs uppercase tracking-wider text-${align}`}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {renderSection("admin", grouped.admin)}
                            {renderSection("staff", grouped.staff)}
                            {renderSection("user",  grouped.user)}
                            {!filtered.length && (
                                <tr>
                                    <td colSpan="7" className="px-6 py-16 text-center text-gray-400 text-sm">
                                        No users match your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ── MOBILE VIEW ── */}
                <div className="md:hidden">

                    {/* Role tabs */}
                    <div className="flex gap-2 mb-4">
                        {["admin", "staff", "user"].map(role => {
                            const cfg = ROLE_CONFIG[role];
                            const isActive = activeTab === role;
                            return (
                                <button
                                    key={role}
                                    onClick={() => setActiveTab(role)}
                                    className={`flex-1 flex flex-col items-center py-2.5 px-1 rounded-xl text-[11px] font-bold transition-all ${
                                        isActive ? cfg.tabActive : cfg.tabInactive
                                    }`}
                                >
                                    <span>{cfg.label}</span>
                                    <span className={`mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                                        isActive ? "bg-white/25" : "bg-gray-100 text-gray-500"
                                    }`}>
                                        {grouped[role].length}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Cards */}
                    {paginated.length === 0 ? (
                        <div className="text-center py-16 text-gray-400 text-sm">
                            No {ROLE_CONFIG[activeTab].label.toLowerCase()} found.
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {paginated.map(user => {
                                const cfg = ROLE_CONFIG[activeTab];
                                return (
                                    <div key={user.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                                        {/* Card top accent */}
                                        <div className="h-0.5 w-full" style={{ backgroundColor: cfg.color }} />

                                        <div className="p-4">
                                            {/* Name + badge row */}
                                            <div className="flex items-start justify-between gap-2 mb-3">
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-gray-900 text-sm leading-tight truncate">{user.name}</p>
                                                    <p className="text-xs text-gray-400 truncate mt-0.5">{user.email}</p>
                                                    {user.student_number && (
                                                        <p className="text-xs text-gray-400 mt-0.5">#{user.student_number}</p>
                                                    )}
                                                </div>
                                                <span className={`flex-shrink-0 text-[11px] px-2.5 py-1 rounded-full font-semibold ${cfg.badge}`}>
                                                    {user.role}
                                                </span>
                                            </div>

                                            {/* Info grid */}
                                            <div className="grid grid-cols-3 gap-2 mb-3">
                                                {[
                                                    { label: "Course",  val: user.course     },
                                                    { label: "Year",    val: user.year_level  },
                                                    { label: "Section", val: user.section     },
                                                ].map(({ label, val }) => (
                                                    <div key={label} className="bg-gray-50 rounded-lg px-2.5 py-2">
                                                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-0.5">{label}</p>
                                                        <p className="text-xs font-semibold text-gray-700 truncate">{val || "—"}</p>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex gap-2 pt-2 border-t border-gray-100">
                                                <button
                                                    onClick={() => openEdit(user)}
                                                    className="flex-1 py-2 rounded-lg text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => setDeleteId(user.id)}
                                                    className="flex-1 py-2 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Smart pagination */}
                    <Pagination
                        current={currentPage}
                        total={totalPages}
                        onChange={(p) => goToPage(activeTab, p)}
                    />
                </div>

                {/* ── CREATE / EDIT MODAL ── */}
                {showForm && (
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
                        onClick={e => e.target === e.currentTarget && closeForm()}
                    >
                        {/* Sheet on mobile, centered modal on desktop */}
                        <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-xl overflow-hidden">
                            {/* Drag handle (mobile only) */}
                            <div className="flex justify-center pt-3 pb-1 sm:hidden">
                                <div className="w-10 h-1 bg-gray-200 rounded-full" />
                            </div>

                            {/* Header */}
                            <div className="bg-[#1B1F5E] px-5 py-4 flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-white text-base">{editingUser ? "Edit User" : "New User"}</h3>
                                    <p className="text-[#8b93d4] text-xs mt-0.5">
                                        {editingUser ? `Editing ${editingUser.name}` : "Fill in the details below"}
                                    </p>
                                </div>
                                <button onClick={closeForm} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors text-lg leading-none">
                                    ×
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-5 max-h-[75vh] overflow-y-auto overscroll-contain">
                                <form onSubmit={submit}>
                                    <div className="grid grid-cols-2 gap-3">
                                        {FIELDS.map(({ key, label, type, col }) => (
                                            <Field key={key} label={label} col={col} error={errors[key]}>
                                                <input
                                                    type={type}
                                                    value={data[key]}
                                                    onChange={e => setData(key, e.target.value)}
                                                    className={`border rounded-xl px-3 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 ${
                                                        errors[key]
                                                            ? "border-red-300 focus:ring-red-200 bg-red-50"
                                                            : "border-gray-200 focus:ring-[#1B1F5E]/20 focus:border-[#1B1F5E]/50 bg-white"
                                                    }`}
                                                />
                                            </Field>
                                        ))}

                                        {!editingUser && (
                                            <Field label="Password" col="col-span-2" error={errors.password}>
                                                <input
                                                    type="password"
                                                    value={data.password}
                                                    onChange={e => setData("password", e.target.value)}
                                                    className={`border rounded-xl px-3 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 ${
                                                        errors.password
                                                            ? "border-red-300 focus:ring-red-200 bg-red-50"
                                                            : "border-gray-200 focus:ring-[#1B1F5E]/20 focus:border-[#1B1F5E]/50 bg-white"
                                                    }`}
                                                />
                                            </Field>
                                        )}

                                        <Field label="Role" col="col-span-2">
                                            <select
                                                value={data.role}
                                                onChange={e => setData("role", e.target.value)}
                                                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B1F5E]/20 focus:border-[#1B1F5E]/50 bg-white"
                                            >
                                                <option value="user">User</option>
                                                <option value="staff">Staff</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </Field>
                                    </div>

                                    <div className="flex gap-2.5 mt-5 pt-4 border-t border-gray-100">
                                        <button
                                            type="button"
                                            onClick={closeForm}
                                            className="flex-1 py-3 rounded-xl text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="flex-1 py-3 rounded-xl text-sm font-semibold bg-[#1B1F5E] hover:bg-[#14185a] text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {processing && (
                                                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                                </svg>
                                            )}
                                            {processing ? "Saving..." : "Save User"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── DELETE MODAL ── */}
                {deleteId && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl w-full max-w-xs shadow-xl overflow-hidden">
                            <div className="px-6 pt-6 pb-4 text-center">
                                <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-2xl">🗑️</span>
                                </div>
                                <h3 className="font-bold text-gray-900 text-base">Delete this user?</h3>
                                <p className="text-sm text-gray-400 mt-1">This action cannot be undone.</p>
                            </div>
                            <div className="flex gap-2 px-4 pb-5">
                                <button
                                    onClick={() => setDeleteId(null)}
                                    className="flex-1 py-3 rounded-xl text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 py-3 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </AdminLayout>
        </>
    );
}
