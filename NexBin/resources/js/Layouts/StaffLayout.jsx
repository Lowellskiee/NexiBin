import { useState } from "react";
import { Link, usePage, router } from "@inertiajs/react";
import { Menu, X, LayoutDashboard, FileText, LogOut, Wifi } from "lucide-react";

export default function StaffLayout({ children }) {
    const { auth } = usePage().props;
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const isActive = (routeName) => route().current(routeName);

    const handleLogout = () => {
        if (confirm("Are you sure you want to logout?")) {
            router.post(route("logout"));
        }
    };

    const NavLink = ({ href, routeName, icon: Icon, label }) => (
        <Link
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative group
                ${isActive(routeName)
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
                className={`
                    fixed md:sticky top-0 left-0 z-40 h-screen w-[200px] flex-shrink-0
                    bg-[#1B1F5E] text-white flex flex-col
                    transform transition-transform duration-300 ease-out
                    ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
                `}
            >
                {/* Subtle top glow */}
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />

                {/* Logo */}
                <div className="flex items-center justify-between px-5 py-5 border-b border-white/8 flex-shrink-0">
                    <div className="flex flex-col items-center mx-auto">
                        <img
                            src="/images/logoo.png"
                            alt="Nexi-Bin"
                            className="h-9 object-contain"
                            onError={(e) => {
                                e.target.style.display = "none";
                                e.target.nextSibling.style.display = "flex";
                            }}
                        />
                        {/* Fallback logo */}
                        <div className="hidden items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-indigo-400/20 border border-indigo-400/30 flex items-center justify-center">
                                <div className="flex gap-[2px] items-end h-3">
                                    <div className="w-[3px] h-[6px] bg-blue-400 rounded-sm" />
                                    <div className="w-[3px] h-[9px] bg-green-400 rounded-sm" />
                                    <div className="w-[3px] h-[12px] bg-red-400 rounded-sm" />
                                </div>
                            </div>
                            <span className="text-white font-bold text-sm tracking-tight">Nexi-Bin</span>
                        </div>
                        <span className="text-[9px] tracking-[0.18em] text-indigo-300/70 uppercase font-semibold mt-1.5">Staff</span>
                    </div>
                    <button className="md:hidden text-white/50 hover:text-white" onClick={() => setSidebarOpen(false)}>
                        <X size={18} />
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
                    <p className="text-[9px] font-bold text-white/25 uppercase tracking-[0.14em] px-3 mb-3">Menu</p>

                    <NavLink
                        href={route("staff.dashboard")}
                        routeName="staff.dashboard"
                        icon={LayoutDashboard}
                        label="Dashboard"
                    />
                    <NavLink
                        href={route("staff.report")}
                        routeName="staff.report"
                        icon={FileText}
                        label="Report"
                    />
                </nav>

                {/* User + logout */}
                <div className="px-3 py-4 border-t border-white/8 flex-shrink-0 space-y-1">
                    <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
                        <div className="w-7 h-7 rounded-full bg-indigo-400/20 border border-indigo-400/30 flex items-center justify-center text-[11px] font-bold text-indigo-300 flex-shrink-0">
                            {auth.user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className="text-[12px] font-semibold text-white/80 truncate">{auth.user.name}</p>
                            <p className="text-[10px] text-white/35 truncate">{auth.user.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:bg-red-500/15 hover:text-red-300 transition-all duration-150"
                    >
                        <LogOut size={15} strokeWidth={2} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* ── Main ── */}
            <main className="flex-1 min-w-0 flex flex-col">

                {/* Mobile topbar */}
                <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-20">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600"
                    >
                        <Menu size={18} />
                    </button>
                    <span className="font-bold text-slate-800 text-sm">Nexi-Bin Staff</span>
                    <div className="w-8" />
                </div>

                {/* Page content */}
                <div className="flex-1 overflow-y-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
