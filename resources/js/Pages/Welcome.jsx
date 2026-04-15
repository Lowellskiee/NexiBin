import { Link } from "@inertiajs/react";

export default function Welcome() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-200">

            {/* Phone Frame */}
            <div className="w-[360px] bg-white rounded-[35px] shadow-2xl px-8 py-10">

                {/* Welcome Content */}
                <div className="text-center">

                    <h1 className="text-sm font-semibold text-gray-500 tracking-widest">
                        WELCOME TO
                    </h1>
                    
                    <img
                        src="/images/logo1.png"
                        alt="NexiBin Logo"
                        className="mx-auto mt-3 w-40"
                    />

                    <p className="text-xs text-gray-400 mt-4">
                        Smart Waste Monitoring & Management System
                    </p>

                </div>

                {/* Buttons */}
                <div className="mt-16">

                    {/* Login Button */}
                    <Link
                        href={route('login')}
                        className="block w-full text-center py-3 rounded-full bg-[#1B1F5E] text-white font-semibold hover:opacity-90 transition"
                    >
                        LOG IN
                    </Link>

                    {/* Register Button */}
                    <Link
                        href={route('register')}
                        className="block w-full text-center mt-5 py-3 rounded-full border-2 border-[#1B1F5E] text-[#1B1F5E] font-semibold hover:bg-[#1B1F5E] hover:text-white transition"
                    >
                        REGISTER
                    </Link>

                </div>

            </div>
        </div>
    );
}