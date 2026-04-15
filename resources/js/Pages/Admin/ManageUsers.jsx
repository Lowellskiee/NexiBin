import { Head, router, usePage, useForm } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";

const ITEMS_PER_PAGE = 5;

export default function ManageUsers() {
    const { users } = usePage().props;

    const [search, setSearch] = useState("");
    const [editingUser, setEditingUser] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

    // Desktop collapsible sections
    const [openSections, setOpenSections] = useState({
        admin: true,
        staff: true,
        user: true,
    });

    // Mobile role tab + per-tab pagination
    const [activeTab, setActiveTab] = useState("admin");
    const [pages, setPages] = useState({ admin: 1, staff: 1, user: 1 });

    const toggleSection = (role) => {
        setOpenSections((prev) => ({ ...prev, [role]: !prev[role] }));
    };

    const { data, setData, post, put, reset } = useForm({
        name: "",
        email: "",
        password: "",
        role: "user",
        student_number: "",
        course: "",
        year_level: "",
        section: "",
    });

    /* ================= FILTER ================= */

    const roleOrder = { admin: 1, staff: 2, user: 3 };

    const filteredUsers = users
        .filter(
            (user) =>
                user.name.toLowerCase().includes(search.toLowerCase()) ||
                user.email.toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => {
            if (roleOrder[a.role] !== roleOrder[b.role])
                return roleOrder[a.role] - roleOrder[b.role];
            return a.name.localeCompare(b.name);
        });

    const groupedUsers = {
        admin: filteredUsers.filter((u) => u.role === "admin"),
        staff: filteredUsers.filter((u) => u.role === "staff"),
        user: filteredUsers.filter((u) => u.role === "user"),
    };

    /* ================= ACTIONS ================= */

    const openCreate = () => {
        reset();
        setEditingUser(null);
        setShowForm(true);
    };

    const openEdit = (user) => {
        setEditingUser(user);
        setData({
            name: user.name,
            email: user.email,
            password: "",
            role: user.role,
            student_number: user.student_number || "",
            course: user.course || "",
            year_level: user.year_level || "",
            section: user.section || "",
        });
        setShowForm(true);
    };

    const submit = (e) => {
        e.preventDefault();
        if (editingUser) {
            put(route("admin.users.update", editingUser.id), {
                onSuccess: () => {
                    toast.success("User updated!");
                    setShowForm(false);
                    reset();
                },
            });
        } else {
            post(route("admin.users.store"), {
                onSuccess: () => {
                    toast.success("User created!");
                    setShowForm(false);
                    reset();
                },
            });
        }
    };

    const confirmDelete = () => {
        router.delete(route("admin.users.delete", deleteId), {
            onSuccess: () => {
                toast.success("User deleted!");
                setDeleteId(null);
            },
        });
    };

    /* ================= MOBILE ================= */

    const tabLabels = { admin: "Admin", staff: "Staff", user: "User" };
    const tabColors = {
        admin: {
            active: "bg-[#1B1F5E] text-white border-[#1B1F5E]",
            inactive: "bg-white text-[#1B1F5E] border-gray-200",
            badge: "bg-[#1B1F5E] text-white",
        },
        staff: {
            active: "bg-yellow-400 text-gray-900 border-yellow-400",
            inactive: "bg-white text-gray-700 border-gray-200",
            badge: "bg-yellow-400 text-gray-900",
        },
        user: {
            active: "bg-gray-700 text-white border-gray-700",
            inactive: "bg-white text-gray-700 border-gray-200",
            badge: "bg-gray-700 text-white",
        },
    };

    const currentList = groupedUsers[activeTab];
    const currentPage = pages[activeTab];
    const totalPages = Math.ceil(currentList.length / ITEMS_PER_PAGE);
    const paginatedList = currentList.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const goToPage = (role, page) => {
        setPages((prev) => ({ ...prev, [role]: page }));
    };

    const renderMobileCards = () => {
        if (paginatedList.length === 0) {
            return (
                <p className="text-center text-gray-400 py-10 text-sm">
                    No {tabLabels[activeTab].toLowerCase()}s found.
                </p>
            );
        }

        return paginatedList.map((user) => (
            <div
                key={user.id}
                className="bg-white p-4 rounded-xl shadow-sm border border-gray-100"
            >
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-semibold text-gray-900">{user.name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
                    </div>
                    <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${tabColors[activeTab].badge}`}
                    >
                        {user.role}
                    </span>
                </div>

                <div className="mt-3 text-sm text-gray-600 grid grid-cols-3 gap-2">
                    <div>
                        <p className="text-xs text-gray-400">Course</p>
                        <p className="font-medium">{user.course || "—"}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400">Year</p>
                        <p className="font-medium">{user.year_level || "—"}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400">Section</p>
                        <p className="font-medium">{user.section || "—"}</p>
                    </div>
                </div>

                <div className="flex gap-4 mt-4 pt-3 border-t border-gray-100 text-sm">
                    <button
                        onClick={() => openEdit(user)}
                        className="text-yellow-600 font-medium hover:underline"
                    >
                        Edit
                    </button>
                    <button
                        onClick={() => setDeleteId(user.id)}
                        className="text-red-600 font-medium hover:underline"
                    >
                        Delete
                    </button>
                </div>
            </div>
        ));
    };

    const renderMobilePagination = () => {
        if (totalPages <= 1) return null;
        return (
            <div className="flex items-center justify-center gap-1 mt-4">
                <button
                    disabled={currentPage === 1}
                    onClick={() => goToPage(activeTab, currentPage - 1)}
                    className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 disabled:opacity-30 bg-white"
                >
                    ‹
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                        key={p}
                        onClick={() => goToPage(activeTab, p)}
                        className={`px-3 py-1.5 rounded-lg text-sm border ${
                            p === currentPage
                                ? "bg-[#1B1F5E] text-white border-[#1B1F5E]"
                                : "bg-white border-gray-200 text-gray-600"
                        }`}
                    >
                        {p}
                    </button>
                ))}
                <button
                    disabled={currentPage === totalPages}
                    onClick={() => goToPage(activeTab, currentPage + 1)}
                    className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 disabled:opacity-30 bg-white"
                >
                    ›
                </button>
            </div>
        );
    };

    /* ================= DESKTOP ================= */

    const renderSection = (title, roleKey, usersList) => {
        if (usersList.length === 0) return null;

        return (
            <>
                <tr
                    className="bg-gray-100 cursor-pointer select-none"
                    onClick={() => toggleSection(roleKey)}
                >
                    <td
                        colSpan="7"
                        className="px-8 py-4 font-bold text-base tracking-wide text-gray-700"
                    >
                        {openSections[roleKey] ? "▼" : "▶"} {title}
                        <span className="ml-2 text-sm font-normal text-gray-400">
                            ({usersList.length})
                        </span>
                    </td>
                </tr>

                {openSections[roleKey] &&
                    usersList.map((user) => (
                        <tr
                            key={user.id}
                            className="border-b border-gray-100 hover:bg-blue-50/40 transition-colors"
                        >
                            <td className="px-8 py-4 text-center font-medium text-gray-800">
                                {user.name}
                            </td>
                            <td className="px-8 py-4 text-center text-gray-600">
                                {user.email}
                            </td>
                            <td className="px-8 py-4 text-center text-gray-600">
                                {user.course || "—"}
                            </td>
                            <td className="px-8 py-4 text-center text-gray-600">
                                {user.year_level || "—"}
                            </td>
                            <td className="px-8 py-4 text-center text-gray-600">
                                {user.section || "—"}
                            </td>
                            <td className="px-8 py-4 text-center">
                                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                                    {user.role}
                                </span>
                            </td>
                            <td className="px-8 py-4 text-center">
                                <div className="flex justify-center gap-4">
                                    <button
                                        onClick={() => openEdit(user)}
                                        className="text-yellow-600 font-semibold hover:underline text-sm"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => setDeleteId(user.id)}
                                        className="text-red-600 font-semibold hover:underline text-sm"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
            </>
        );
    };

    /* ================= RENDER ================= */

    return (
        <>
            <Head title="Manage Users" />
            <AdminLayout>
                <Toaster position="top-right" />

                {/* HEADER */}
                <div className="mb-6 flex flex-col sm:flex-row justify-between gap-3">
                    <h2 className="text-2xl font-bold text-gray-900">Manage Users</h2>
                    <button
                        onClick={openCreate}
                        className="bg-yellow-400 hover:bg-yellow-500 transition-colors px-5 py-2.5 rounded-lg font-semibold w-full sm:w-auto"
                    >
                        + New User
                    </button>
                </div>

                {/* SEARCH */}
                <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPages({ admin: 1, staff: 1, user: 1 });
                    }}
                    className="border px-4 py-2.5 rounded-lg mb-6 w-full sm:w-1/3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B1F5E]/30"
                />

                {/* ── DESKTOP TABLE ── */}
                <div className="hidden md:block bg-white rounded-2xl shadow overflow-x-auto">
                    <table className="w-full text-base">
                        <thead className="bg-[#1B1F5E] text-white">
                            <tr>
                                {["Name", "Email", "Course", "Year", "Section", "Role", "Actions"].map(
                                    (h) => (
                                        <th
                                            key={h}
                                            className="px-8 py-5 text-center font-semibold tracking-wide text-sm uppercase"
                                        >
                                            {h}
                                        </th>
                                    )
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {renderSection("ADMINISTRATORS", "admin", groupedUsers.admin)}
                            {renderSection("STAFF", "staff", groupedUsers.staff)}
                            {renderSection("USERS", "user", groupedUsers.user)}
                        </tbody>
                    </table>
                </div>

                {/* ── MOBILE VIEW ── */}
                <div className="md:hidden">
                    {/* Role tabs */}
                    <div className="flex gap-2 mb-4">
                        {["admin", "staff", "user"].map((role) => (
                            <button
                                key={role}
                                onClick={() => {
                                    setActiveTab(role);
                                }}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                                    activeTab === role
                                        ? tabColors[role].active
                                        : tabColors[role].inactive
                                }`}
                            >
                                {tabLabels[role]}
                                <span
                                    className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                                        activeTab === role
                                            ? "bg-white/20"
                                            : "bg-gray-100 text-gray-500"
                                    }`}
                                >
                                    {groupedUsers[role].length}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Cards */}
                    <div className="space-y-3">{renderMobileCards()}</div>

                    {/* Pagination */}
                    {renderMobilePagination()}
                </div>

                {/* ── CREATE / EDIT MODAL ── */}
                {showForm && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                        <div className="bg-white p-4 sm:p-6 rounded-xl w-full max-w-lg mx-2 max-h-[90vh] overflow-y-auto">
                            <h3 className="mb-4 font-semibold text-lg">
                                {editingUser ? "Edit User" : "Create User"}
                            </h3>

                            <form
                                onSubmit={submit}
                                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                            >
                                <input
                                    className="border p-2.5 rounded-lg"
                                    placeholder="Name"
                                    value={data.name}
                                    onChange={(e) => setData("name", e.target.value)}
                                />
                                <input
                                    className="border p-2.5 rounded-lg"
                                    placeholder="Email"
                                    value={data.email}
                                    onChange={(e) => setData("email", e.target.value)}
                                />
                                <input
                                    className="border p-2.5 rounded-lg"
                                    placeholder="Student Number"
                                    value={data.student_number}
                                    onChange={(e) =>
                                        setData("student_number", e.target.value)
                                    }
                                />
                                <input
                                    className="border p-2.5 rounded-lg"
                                    placeholder="Course"
                                    value={data.course}
                                    onChange={(e) => setData("course", e.target.value)}
                                />
                                <input
                                    className="border p-2.5 rounded-lg"
                                    placeholder="Year Level"
                                    value={data.year_level}
                                    onChange={(e) =>
                                        setData("year_level", e.target.value)
                                    }
                                />
                                <input
                                    className="border p-2.5 rounded-lg"
                                    placeholder="Section"
                                    value={data.section}
                                    onChange={(e) => setData("section", e.target.value)}
                                />

                                {!editingUser && (
                                    <input
                                        type="password"
                                        placeholder="Password"
                                        className="border p-2.5 rounded-lg sm:col-span-2"
                                        value={data.password}
                                        onChange={(e) =>
                                            setData("password", e.target.value)
                                        }
                                    />
                                )}

                                <select
                                    className="border p-2.5 rounded-lg sm:col-span-2"
                                    value={data.role}
                                    onChange={(e) => setData("role", e.target.value)}
                                >
                                    <option value="user">User</option>
                                    <option value="staff">Staff</option>
                                    <option value="admin">Admin</option>
                                </select>

                                <div className="sm:col-span-2 flex justify-end gap-3 mt-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg text-sm font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button className="bg-[#1B1F5E] hover:bg-[#14185a] text-white px-4 py-2 rounded-lg text-sm font-medium">
                                        Save
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ── DELETE MODAL ── */}
                {deleteId && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-xl w-80 text-center shadow-xl">
                            <div className="text-red-500 text-4xl mb-3">⚠️</div>
                            <h3 className="font-semibold text-lg mb-1">Delete User?</h3>
                            <p className="text-sm text-gray-500 mb-5">
                                This action cannot be undone.
                            </p>
                            <div className="flex justify-center gap-3">
                                <button
                                    onClick={() => setDeleteId(null)}
                                    className="bg-gray-200 hover:bg-gray-300 px-5 py-2 rounded-lg text-sm font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg text-sm font-medium"
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
