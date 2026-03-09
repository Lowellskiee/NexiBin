import { Head, Link, useForm } from "@inertiajs/react";

export default function Register() {

    const { data, setData, post, processing, errors, reset } = useForm({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
    });

    const submit = (e) => {
        e.preventDefault();

        post(route("register"), {
            onFinish: () => reset("password", "password_confirmation"),
        });
    };

    return (
        <>
            <Head title="Register" />

            <div className="min-h-screen flex items-center justify-center bg-gray-200 py-10">

                <div className="w-[390px] max-w-full bg-white rounded-[45px] shadow-[0_30px_80px_rgba(0,0,0,0.25)] overflow-hidden">

                    <div className="px-10 py-14">

                        {/* Header */}
                        <div className="text-center mb-10">
                            <h1 className="text-[11px] font-semibold text-gray-500 tracking-widest">
                                WELCOME TO
                            </h1>

                            <img
                                src="/images/logo1.png"
                                alt="NexiBin Logo"
                                className="mx-auto mt-3 w-40"
                            />

                            <p className="text-xs text-gray-400 mt-3">
                                Sign up to get started.
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={submit} className="space-y-5">

                            {/* Username */}
                            <div>
                                <label className="text-xs text-gray-600">
                                    Username
                                </label>

                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData("name", e.target.value)}
                                    required
                                    placeholder="Enter Username"
                                    className="w-full mt-2 px-4 py-3 rounded-xl bg-gray-100 border border-gray-300 focus:outline-none focus:border-[#1B1F5E]"
                                />

                                {errors.name && (
                                    <div className="mt-1 text-xs text-red-500">
                                        {errors.name}
                                    </div>
                                )}
                            </div>

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
                                    placeholder="Enter Email"
                                    className="w-full mt-2 px-4 py-3 rounded-xl bg-gray-100 border border-gray-300 focus:outline-none focus:border-[#1B1F5E]"
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
                                    placeholder="Enter Password"
                                    className="w-full mt-2 px-4 py-3 rounded-xl bg-gray-100 border border-gray-300 focus:outline-none focus:border-[#1B1F5E]"
                                />

                                {errors.password && (
                                    <div className="mt-1 text-xs text-red-500">
                                        {errors.password}
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="text-xs text-gray-600">
                                    Confirm Password
                                </label>

                                <input
                                    type="password"
                                    value={data.password_confirmation}
                                    onChange={(e) =>
                                        setData("password_confirmation", e.target.value)
                                    }
                                    required
                                    placeholder="Confirm Password"
                                    className="w-full mt-2 px-4 py-3 rounded-xl bg-gray-100 border border-gray-300 focus:outline-none focus:border-[#1B1F5E]"
                                />
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full py-3 rounded-full bg-[#1B1F5E] text-white text-sm font-semibold hover:opacity-90 transition mt-4"
                            >
                                SIGN UP
                            </button>

                            {/* Login Link */}
                            <div className="text-center mt-6">
                                <p className="text-xs text-gray-400">
                                    Already have an account?
                                </p>

                                <Link
                                    href={route("login")}
                                    className="inline-block mt-3 px-6 py-2 rounded-full border-2 border-[#1B1F5E] text-[#1B1F5E] text-sm font-semibold hover:bg-[#1B1F5E] hover:text-white transition"
                                >
                                    LOGIN
                                </Link>
                            </div>

                        </form>

                    </div>
                </div>
            </div>
        </>
    );
}