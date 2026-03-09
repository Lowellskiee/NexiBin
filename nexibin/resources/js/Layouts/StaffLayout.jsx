import { useState } from "react";
import { Link, usePage, router } from "@inertiajs/react";
import { Menu, X, LayoutDashboard, Wrench, FileText, LogOut } from "lucide-react";

export default function StaffLayout({ children }) {
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
                className={`fixed md:static min-h-screen z-40 top-0 left-0 h-full w-64 bg-[#1B1F5E] text-white p-6 transform transition-transform duration-300
                ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
                md:translate-x-0 flex flex-col`}
            >

                {/* Header */}
                <div className="flex justify-between items-start mb-10">

                    <div className="flex flex-col items-center w-full">
                        <img
                            src="/images/logoo.png"
                            alt="Nexibin Logo"
                            className="h-12"
                        />
                        <span className="text-xs tracking-widest mt-1">
                            STAFF
                        </span>
                    </div>

                    {/* Close button (mobile) */}
                    <button
                        className="md:hidden"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X size={20} />
                    </button>

                </div>

                {/* Navigation */}
                <nav className="space-y-3 text-sm">

                    <Link
                        href={route("staff.dashboard")}
                        className={isActive("staff.dashboard")}
                    >
                        <div className="flex items-center gap-2">
                            <LayoutDashboard size={16} />
                            Dashboard
                        </div>
                    </Link>

                    <Link
                        href={route('staff.report')}
                        className={isActive("staff.report")}
                    >
                        <div className="flex items-center gap-2">
                            <Wrench size={16} />
                            Report
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
            <main className="flex-1 w-full p-6 md:p-10">

                {/* Mobile Header */}
                <div className="flex items-center justify-between md:hidden mb-6">
                    <button onClick={() => setSidebarOpen(true)}>
                        <Menu size={24} />
                    </button>

                    <h1 className="text-lg font-bold">
                        Staff Panel
                    </h1>
                </div>

                {/* Desktop Header */}
                <div className="hidden md:block mb-8">
                    <h1 className="text-2xl font-bold text-gray-800">
                        Welcome, {auth.user.name}
                    </h1>

                    <p className="text-gray-500 text-sm">
                        Nexi-Bin Staff System Monitoring & Overview
                    </p>
                </div>

                {/* Page Content */}
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm">
                    {children}
                </div>

            </main>

        </div>
    );
}