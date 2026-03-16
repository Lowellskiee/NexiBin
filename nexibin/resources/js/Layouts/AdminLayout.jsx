import { useState } from "react";
import { Link, usePage, router } from "@inertiajs/react";
import { Menu, X, Users, LayoutDashboard, Gift, LogOut } from "lucide-react";

export default function AdminLayout({ children }) {
    const { auth } = usePage().props;
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const isActive = (routeName) =>
        route().current(routeName)
            ? "bg-white/20 font-semibold rounded-lg px-3 py-2 block"
            : "hover:bg-white/10 rounded-lg px-3 py-2 block transition";

    const handleLogout = () => {
        if (confirm("Are you sure you want to logout?")) {
            router.post(route("logout"));
        }
    };

    return (
        <div className="min-h-screen flex bg-gray-100">

            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-30 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

                {/* Sidebar */}
                <aside
                className={`fixed md:relative top-0 left-0 z-40 min-h-screen w-64 bg-[#1B1F5E] text-white p-6
                overflow-y-auto transform transition-transform duration-300
                ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
                md:translate-x-0 flex flex-col`}
                >

                {/* Logo + Close button */}
                <div className="flex items-center justify-between mb-10">

                    <div className="flex flex-col items-center w-full">
                        <img
                            src="/images/logoo.png"
                            alt="Nexibin Logo"
                            className="h-12"
                        />
                        <span className="text-xs tracking-widest mt-1">
                            ADMIN
                        </span>
                    </div>

                    {/* Close button (mobile only) */}
                    <button
                        className="absolute right-4 top-6 md:hidden"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X size={20} />
                    </button>

                </div>

                {/* Navigation */}
                <nav className="space-y-3 text-sm">

                    <Link
                        href={route("admin.dashboard")}
                        className={isActive("admin.dashboard")}
                    >
                        <div className="flex items-center gap-2">
                            <LayoutDashboard size={16} />
                            Dashboard
                        </div>
                    </Link>

                    <Link
                        href={route("admin.rewards")}
                        className={isActive("admin.rewards")}
                    >
                        <div className="flex items-center gap-2">
                            <Gift size={16} />
                            Manage Rewards
                        </div>
                    </Link>

                    <Link
                        href={route("admin.users")}
                        className={isActive("admin.users")}
                    >
                        <div className="flex items-center gap-2">
                            <Users size={16} />
                            Manage Users
                        </div>
                    </Link>

                </nav>

                {/* Divider */}
                <div className="border-t border-white/20 my-6"></div>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full hover:bg-red-500/20 rounded-lg px-3 py-2 text-left text-sm transition"
                >
                    <LogOut size={16} />
                    Logout
                </button>

            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">

                {/* Mobile Top Bar */}
                <header className="flex items-center justify-between p-4 bg-white shadow md:hidden">

                    <button onClick={() => setSidebarOpen(true)}>
                        <Menu size={24} />
                    </button>

                    <h1 className="font-semibold">
                        Admin Panel
                    </h1>

                    <div></div>

                </header>

                {/* Desktop Header */}
                <div className="hidden md:block p-6">
                    <h1 className="text-2xl font-bold text-gray-800">
                        Welcome, {auth.user.name}
                    </h1>
                    <p className="text-gray-500 text-sm">
                        Nexi-Bin Admin System Overview & Management
                    </p>
                </div>

                {/* Page Content */}
                <main className="flex-1 p-6 md:p-10">
                    <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
                        {children}
                    </div>
                </main>

            </div>
        </div>
    );
}