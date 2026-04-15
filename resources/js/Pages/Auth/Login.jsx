import { Head, Link, useForm } from "@inertiajs/react";

export default function Login({ status }) {

    const { data, setData, post, processing, errors, reset } = useForm({
        email: "",
        password: "",
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("login"), {
            onFinish: () => reset("password"),
        });
    };

    return (
        <>
            <Head title="Login" />

            <div className="min-h-screen flex items-center justify-center bg-gray-200 py-10">

                {/* Phone Frame */}
                <div className="w-[390px] max-w-full bg-white rounded-[45px] shadow-[0_30px_80px_rgba(0,0,0,0.25)] overflow-hidden">

                    <div className="px-10 py-14">

                        {/* Header */}
                        <div className="text-center mb-10">

                            <h1 className="text-[11px] font-semibold text-gray-500 tracking-widest">
                                WELCOME TO
                            </h1>

                            <img
                                src="/images/logo1.png"
                                alt="NexiBin Logo"s
                                className="mx-auto mt-3 w-40"
                            />

                            <p className="text-xs text-gray-400 mt-3">
                                Smart Waste Monitoring & Management System
                            </p>

                        </div>

                        {/* Session Status */}
                        {status && (
                            <div className="text-center text-green-600 text-xs mb-4">
                                {status}
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={submit} className="space-y-5">

                            {/* Email */}
                            <div>
                                <label className="text-xs text-gray-600">
                                    Email
                                </label>

                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData("email", e.target.value)}
                                    required
                                    autoFocus
                                    placeholder="Enter your Email Address"
                                    className="w-full mt-2 px-4 py-3 rounded-xl bg-gray-100 border border-gray-300 focus:outline-none focus:border-[#1B1F5E] transition"
                                />

                                {errors.email && (
                                    <div className="mt-1 text-xs text-red-500">
                                        {errors.email}
                                    </div>
                                )}
                            </div>

                            {/* Password */}
                            <div>
                                <label className="text-xs text-gray-600">
                                    Password
                                </label>

                                <input
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData("password", e.target.value)}
                                    required
                                    placeholder="Enter your Password"
                                    className="w-full mt-2 px-4 py-3 rounded-xl bg-gray-100 border border-gray-300 focus:outline-none focus:border-[#1B1F5E] transition"
                                />

                                {errors.password && (
                                    <div className="mt-1 text-xs text-red-500">
                                        {errors.password}
                                    </div>
                                )}
                            </div>

                            {/* Remember + Forgot */}
                            <div className="flex items-center justify-between text-xs text-gray-500">

                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={data.remember}
                                        onChange={(e) => setData("remember", e.target.checked)}
                                        className="mr-2"
                                    />
                                    Remember me
                                </label>

                                <Link
                                    href={route("password.request")}
                                    className="hover:text-[#1B1F5E]"
                                >
                                    Forgot Password?
                                </Link>
                            </div>

                            {/* Login Button */}
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full py-3 rounded-full bg-[#1B1F5E] text-white text-sm font-semibold hover:opacity-90 transition mt-4"
                            >
                                LOG IN
                            </button>

                            {/* Register */}
                            <div className="text-center mt-6">
                                <p className="text-xs text-gray-400">
                                    Don’t have an account?
                                </p>

                                <Link
                                    href={route("register")}
                                    className="inline-block mt-3 px-6 py-2 rounded-full border-2 border-[#1B1F5E] text-[#1B1F5E] text-sm font-semibold hover:bg-[#1B1F5E] hover:text-white transition"
                                >
                                    REGISTER
                                </Link>
                            </div>

                            <p className="text-[10px] text-gray-400 text-center mt-6">
                                By continuing, you agree to our Terms of Service and Privacy Policy.
                            </p>

                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}