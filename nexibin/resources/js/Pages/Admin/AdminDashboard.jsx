import { Head, usePage } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";

export default function AdminDashboard() {
    const { totalUsers, totalStaff, totalAdmins } = usePage().props;

    return (
        <>
            <Head title="Admin Dashboard" />

            <AdminLayout>

                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">

                    <div className="bg-white p-6 rounded-2xl shadow">
                        <h3 className="text-sm text-gray-500">Total Users</h3>
                        <p className="text-3xl font-bold text-[#1B1F5E] mt-2">
                            {totalUsers}
                        </p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow">
                        <h3 className="text-sm text-gray-500">Total Staff</h3>
                        <p className="text-3xl font-bold text-[#1B1F5E] mt-2">
                            {totalStaff}
                        </p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow">
                        <h3 className="text-sm text-gray-500">Total Admins</h3>
                        <p className="text-3xl font-bold text-[#1B1F5E] mt-2">
                            {totalAdmins}
                        </p>
                    </div>

                </div>

                {/* Activity Section */}
                <div className="bg-white p-6 rounded-2xl shadow">
                    <h2 className="text-lg font-semibold mb-4">
                        Recent Activity
                    </h2>

                    <div className="text-sm text-gray-600">
                        No activity data yet.
                    </div>
                </div>

            </AdminLayout>
        </>
    );
}