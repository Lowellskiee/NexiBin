import { useState } from "react";
import { Link, usePage, router } from "@inertiajs/react";
import {
    Menu,
    X,
    Users,
    LayoutDashboard,
    Gift,
    LogOut,
    Lollipop
} from "lucide-react";

export default function AdminLayout({ children }) {
    const { auth } = usePage().props;
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const isActive = (routeName) => route().current(routeName);

    const handleLogout = () => {
        if (confirm("Are you sure you want to logout?")) {
            router.post(route("logout"));
        }
    };

    // 🔥 Reusable NavLink (same as StaffLayout)
    const NavLink = ({ href, routeName, icon: Icon, label }) => (
        <Link
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative group
                ${
                    isActive(routeName)
                        ? "bg-white/15 text-white"
                        : "text-white/50 hover:bg-white/8 hover:text-white/80"
                }`}
        >
            {isActive(routeName) && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-indigo-400 rounded-r-full" />
            )}
            <Icon size={15} strokeWidth={isActive(routeName) ? 2.5 : 2} />
            {label}
        </Link>
    );

    return (
        <div className="min-h-screen flex bg-slate-100 font-sans">

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* ── Sidebar ── */}
            <aside
                className={`fixed md:sticky top-0 left-0 z-40 h-screen w-[200px] flex-shrink-0
                    bg-[#1B1F5E] text-white flex flex-col
                    transform transition-transform duration-300
                    ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
            >
                {/* Glow */}
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-indigo-500/10 to-transparent" />

                {/* Logo */}
                <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
                    <div className="flex flex-col items-center mx-auto">
                        <img
                            src="/images/logoo.png"
                            className="h-9"
                        />
                        <span className="text-[9px] tracking-widest text-indigo-300 uppercase mt-1">
                            ADMIN
                        </span>
                    </div>

                    <button
                        className="md:hidden text-white/50"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-5 space-y-1">
                    <p className="text-[9px] text-white/25 uppercase px-3 mb-2">
                        Management
                    </p>

                    <NavLink
                        href={route("admin.dashboard")}
                        routeName="admin.dashboard"
                        icon={LayoutDashboard}
                        label="Dashboard"
                    />

                    <NavLink
                        href={route("admin.rewards")}
                        routeName="admin.rewards"
                        icon={Gift}
                        label="Rewards"
                    />

                    <NavLink
                        href={route("admin.users")}
                        routeName="admin.users"
                        icon={Users}
                        label="Users"
                    />

                    <NavLink
                        href={route("admin.redemptions.index")}
                        routeName="admin.redemptions.index"
                        icon={Lollipop}
                        label="Redemptions"
                    />
                </nav>

                {/* User + logout */}
                <div className="px-3 py-4 border-t border-white/10 space-y-2">
                    <div className="flex items-center gap-2 px-3">
                        <div className="w-7 h-7 rounded-full bg-indigo-400/20 flex items-center justify-center text-xs font-bold">
                            {auth.user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-xs">
                            <p className="font-semibold">{auth.user.name}</p>
                            <p className="text-white/40">{auth.user.email}</p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-white/40 hover:bg-red-500/20 hover:text-red-300"
                    >
                        <LogOut size={15} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* ── Main ── */}
            <main className="flex-1 flex flex-col">

                {/* Mobile Topbar */}
                <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b">
                    <button onClick={() => setSidebarOpen(true)}>
                        <Menu size={18} />
                    </button>
                    <span className="font-bold text-sm">
                        Nexi-Bin Admin
                    </span>
                    <div className="w-8" />
                </div>

                {/* Page content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {children}
                </div>
            </main>
        </div>
    );
}