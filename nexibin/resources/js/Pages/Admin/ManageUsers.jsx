import { Head, router, usePage, useForm } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import { useState } from "react";

export default function ManageUsers() {
    const { users } = usePage().props;

    const [search, setSearch] = useState("");
    const [editingUser, setEditingUser] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const { data, setData, post, put, reset, processing } = useForm({
        name: "",
        email: "",
        password: "",
        role: "user",
    });

    /* ================= FILTER + SORT ================= */

    const roleOrder = { admin: 1, staff: 2, user: 3 };

    const filteredUsers = users
        .filter(user =>
            user.name.toLowerCase().includes(search.toLowerCase()) ||
            user.email.toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => {
            if (roleOrder[a.role] !== roleOrder[b.role]) {
                return roleOrder[a.role] - roleOrder[b.role];
            }
            return a.name.localeCompare(b.name);
        });

    /* ================= GROUP BY ROLE ================= */

    const admins = filteredUsers.filter(u => u.role === "admin");
    const staff = filteredUsers.filter(u => u.role === "staff");
    const regularUsers = filteredUsers.filter(u => u.role === "user");

    /* ================= FORM HANDLING ================= */

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
        });
        setShowForm(true);
    };

    const submit = (e) => {
        e.preventDefault();

        if (editingUser) {
            put(route("admin.users.update", editingUser.id), {
                onSuccess: () => {
                    setShowForm(false);
                    reset();
                },
            });
        } else {
            post(route("admin.users.store"), {
                onSuccess: () => {
                    setShowForm(false);
                    reset();
                },
            });
        }
    };

    const deleteUser = (id) => {
        if (confirm("Delete this user?")) {
            router.delete(route("admin.users.delete", id));
        }
    };

    const roleBadge = (role) => {
        return `px-2 py-1 text-xs rounded-full font-semibold ${
            role === "admin"
                ? "bg-red-100 text-red-600"
                : role === "staff"
                ? "bg-blue-100 text-blue-600"
                : "bg-green-100 text-green-600"
        }`;
    };

    /* ================= RENDER ROLE SECTION ================= */

    const renderDesktopRows = (groupTitle, groupUsers) => {
        if (groupUsers.length === 0) return null;

        return (
            <>
                <tr className="bg-gray-100">
                    <td colSpan="4" className="px-6 py-3 font-bold text-center underline">
                        {groupTitle}
                    </td>
                </tr>

                {groupUsers.map(user => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">

                        <td className="px-6 py-4 font-medium">
                            {user.name}
                        </td>

                        <td>{user.email}</td>

                        <td>
                            <span className={roleBadge(user.role)}>
                                {user.role.toUpperCase()}
                            </span>
                        </td>

                        <td className="text-center space-x-3">
                            <button
                                onClick={() => openEdit(user)}
                                className="text-yellow-600 hover:underline"
                            >
                                Edit
                            </button>

                            <button
                                onClick={() => deleteUser(user.id)}
                                className="text-red-600 hover:underline"
                            >
                                Delete
                            </button>
                        </td>

                    </tr>
                ))}
            </>
        );
    };

    const renderMobileCards = (groupTitle, groupUsers) => {
        if (groupUsers.length === 0) return null;

        return (
            <div className="space-y-4">
                <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">
                    {groupTitle}
                </h3>

                {groupUsers.map(user => (
                    <div key={user.id} className="bg-white p-4 rounded-xl shadow">

                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-gray-800">
                                {user.name}
                            </h3>

                            <span className={roleBadge(user.role)}>
                                {user.role.toUpperCase()}
                            </span>
                        </div>

                        <p className="text-sm text-gray-500 mt-1">
                            {user.email}
                        </p>

                        <div className="flex gap-4 mt-4 text-sm">
                            <button
                                onClick={() => openEdit(user)}
                                className="text-yellow-600 font-medium"
                            >
                                Edit
                            </button>

                            <button
                                onClick={() => deleteUser(user.id)}
                                className="text-red-600 font-medium"
                            >
                                Delete
                            </button>
                        </div>

                    </div>
                ))}
            </div>
        );
    };

    return (
        <>
            <Head title="Manage Users" />

            <AdminLayout>

                {/* ================= HEADER ================= */}

                <div className="mb-6">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                        <h2 className="text-xl font-semibold">
                            Manage Users
                        </h2>

                        <button
                            onClick={openCreate}
                            className="bg-yellow-400 hover:bg-yellow-500 px-4 py-2 rounded-lg font-semibold text-sm"
                        >
                            + New User
                        </button>
                    </div>

                    <input
                        type="text"
                        placeholder="Search user..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="border px-4 py-2 rounded-lg w-full md:w-1/3 mt-4"
                    />
                </div>

                {/* ================= FORM ================= */}

                {showForm && (
                    <div className="bg-white p-6 rounded-2xl shadow mb-6">
                        <h3 className="font-semibold mb-4">
                            {editingUser ? "Edit User" : "Create User"}
                        </h3>

                        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-4 gap-4">

                            <input
                                type="text"
                                placeholder="Name"
                                value={data.name}
                                onChange={(e) => setData("name", e.target.value)}
                                className="border p-2 rounded"
                                required
                            />

                            <input
                                type="email"
                                placeholder="Email"
                                value={data.email}
                                onChange={(e) => setData("email", e.target.value)}
                                className="border p-2 rounded"
                                required
                            />

                            {!editingUser && (
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={data.password}
                                    onChange={(e) => setData("password", e.target.value)}
                                    className="border p-2 rounded"
                                    required
                                />
                            )}

                            <select
                                value={data.role}
                                onChange={(e) => setData("role", e.target.value)}
                                className="border p-2 rounded"
                            >
                                <option value="user">User</option>
                                <option value="staff">Staff</option>
                                <option value="admin">Admin</option>
                            </select>

                            <button
                                type="submit"
                                disabled={processing}
                                className="bg-[#1B1F5E] text-white px-4 py-2 rounded md:col-span-4"
                            >
                                {editingUser ? "Update User" : "Create User"}
                            </button>

                        </form>
                    </div>
                )}

                {/* ================= DESKTOP TABLE ================= */}

                <div className="hidden md:block bg-white rounded-2xl shadow">
                    <table className="w-full text-sm">

                        <thead className="bg-[#1B1F5E] text-white text-left">
                            <tr>
                                <th className="px-6 py-3">Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th className="text-center">Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {renderDesktopRows("ADMINISTRATORS", admins)}
                            {renderDesktopRows("STAFF", staff)}
                            {renderDesktopRows("USERS", regularUsers)}
                        </tbody>

                    </table>
                </div>

                {/* ================= MOBILE CARDS ================= */}

                <div className="md:hidden space-y-6">
                    {renderMobileCards("Administrators", admins)}
                    {renderMobileCards("Staff", staff)}
                    {renderMobileCards("Users", regularUsers)}
                </div>

            </AdminLayout>
        </>
    );
}