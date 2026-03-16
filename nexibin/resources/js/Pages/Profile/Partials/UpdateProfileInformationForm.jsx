import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import { Link, useForm, usePage } from '@inertiajs/react';
import { Transition } from '@headlessui/react';

export default function UpdateProfileInformation({ mustVerifyEmail, status, className = '' }) {

    const user = usePage().props.auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        name: user.name,
        email: user.email,
    });

    const submit = (e) => {
        e.preventDefault();
        patch(route('profile.update'));
    };

    return (
        <section className={`bg-white shadow rounded-2xl p-6 ${className}`}>

            {/* ================= HEADER ================= */}

            <header className="mb-6">
                <h2 className="text-xl font-bold text-[#1B1F5E]">
                    Profile Information
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                    Update your account's profile information and email address.
                </p>
            </header>

            {/* ================= FORM ================= */}

            <form onSubmit={submit} className="space-y-5">

                {/* NAME */}

                <div>
                    <InputLabel htmlFor="name" value="Name" />

                    <TextInput
                        id="name"
                        className="mt-1 block w-full rounded-xl border-gray-300 focus:border-[#1B1F5E] focus:ring-[#1B1F5E]"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        autoComplete="name"
                    />

                    <InputError className="mt-2" message={errors.name} />
                </div>


                {/* EMAIL */}

                <div>
                    <InputLabel htmlFor="email" value="Email" />

                    <TextInput
                        id="email"
                        type="email"
                        className="mt-1 block w-full rounded-xl border-gray-300 focus:border-[#1B1F5E] focus:ring-[#1B1F5E]"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        autoComplete="username"
                    />

                    <InputError className="mt-2" message={errors.email} />
                </div>


                {/* EMAIL VERIFICATION */}

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">

                        <p className="text-sm text-yellow-800">
                            Your email address is unverified.
                        </p>

                        <Link
                            href={route('verification.send')}
                            method="post"
                            as="button"
                            className="mt-2 text-sm font-medium text-[#1B1F5E] underline"
                        >
                            Re-send verification email
                        </Link>

                        {status === 'verification-link-sent' && (
                            <p className="mt-2 text-sm text-green-600 font-medium">
                                Verification email sent.
                            </p>
                        )}

                    </div>
                )}


                {/* SAVE BUTTON */}

                <div className="flex items-center gap-4 pt-2">

                    <button
                        disabled={processing}
                        className="bg-[#1B1F5E] hover:bg-[#14174a] text-white px-5 py-2 rounded-xl font-medium transition"
                    >
                        Save Changes
                    </button>


                    {/* SUCCESS MESSAGE */}

                    <Transition
                        show={recentlySuccessful}
                        enter="transition-opacity duration-300"
                        enterFrom="opacity-0"
                        leave="transition-opacity duration-300"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-green-600 font-medium">
                            Profile updated successfully.
                        </p>
                    </Transition>

                </div>

            </form>

        </section>
    );
}
