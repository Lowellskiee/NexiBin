import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import { Head, Link, useForm } from '@inertiajs/react';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

export default function Login({ status, canResetPassword }) {

    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="Log in" />

            <div className="min-h-screen flex items-center justify-center bg-gray-200 py-10">

                {/* Phone Frame */}
                <div className="w-[390px] max-w-full bg-white rounded-[45px] shadow-[0_30px_80px_rgba(0,0,0,0.25)] overflow-hidden">

                    <div className="px-10 py-14">

                        {/* Header */}
                        <div className="text-center mb-10">

                            <h1 className="text-[11px] font-semibold text-gray-500 tracking-widest">
                                STAFF LOGIN
                            </h1>

                            <img
                                src="/images/logo1.png"
                                alt="Logo"
                                className="mx-auto mt-3 w-40"
                            />

                            <p className="text-xs text-gray-400 mt-3">
                                Smart Waste Monitoring & Management System
                            </p>

                        </div>

                        {/* Status */}
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
                                    onChange={(e) => setData('email', e.target.value)}
                                    required
                                    autoFocus
                                    placeholder="Enter your Email Address"
                                    className="w-full mt-2 px-4 py-3 rounded-xl bg-gray-100 border border-gray-300 focus:outline-none focus:border-[#1B1F5E] transition"
                                />

                                <InputError message={errors.email} className="mt-1 text-xs" />
                            </div>

                            {/* Password */}
                            <div>
                                <label className="text-xs text-gray-600">
                                    Password
                                </label>

                                <div className="relative">

                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        required
                                        placeholder="Enter your Password"
                                        className="w-full mt-2 px-4 py-3 pr-12 rounded-xl bg-gray-100 border border-gray-300 focus:outline-none focus:border-[#1B1F5E] transition"
                                    />

                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>

                                </div>

                                <InputError message={errors.password} className="mt-1 text-xs" />
                            </div>

                            {/* Remember + Forgot */}
                            <div className="flex items-center justify-between text-xs text-gray-500">

                                <label className="flex items-center">
                                    <Checkbox
                                        name="remember"
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                        className="mr-2"
                                    />
                                    Remember me
                                </label>

                                {canResetPassword && (
                                    <Link
                                        href={route('password.request')}
                                        className="hover:text-[#1B1F5E]"
                                    >
                                        Forgot Password?
                                    </Link>
                                )}
                            </div>

                            {/* Login Button */}
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full py-3 rounded-full bg-[#1B1F5E] text-white text-sm font-semibold hover:opacity-90 transition mt-4"
                            >
                                LOG IN
                            </button>

                            {/* Optional Register */}
                            <div className="text-center mt-6">
                                <p className="text-xs text-gray-400">
                                    Don’t have an account?
                                </p>

                                <Link
                                    href={route('register')}
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