import { useRef } from 'react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';
import { Transition } from '@headlessui/react';

export default function UpdatePasswordForm({ className = '' }) {

    const passwordInput = useRef();
    const currentPasswordInput = useRef();

    const { data, setData, errors, put, reset, processing, recentlySuccessful } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword = (e) => {
        e.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errors) => {

                if (errors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current.focus();
                }

                if (errors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current.focus();
                }
            },
        });
    };

    return (

        <section className={`bg-white shadow rounded-2xl p-6 ${className}`}>

            {/* HEADER */}

            <header className="mb-6">

                <h2 className="text-xl font-bold text-[#1B1F5E]">
                    Update Password
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                    Ensure your account is using a strong password to keep it secure.
                </p>

            </header>


            {/* FORM */}

            <form onSubmit={updatePassword} className="space-y-5">


                {/* CURRENT PASSWORD */}

                <div>

                    <InputLabel htmlFor="current_password" value="Current Password" />

                    <TextInput
                        id="current_password"
                        ref={currentPasswordInput}
                        value={data.current_password}
                        onChange={(e) => setData('current_password', e.target.value)}
                        type="password"
                        className="mt-1 block w-full rounded-xl border-gray-300 focus:border-[#1B1F5E] focus:ring-[#1B1F5E]"
                        autoComplete="current-password"
                    />

                    <InputError message={errors.current_password} className="mt-2" />

                </div>


                {/* NEW PASSWORD */}

                <div>

                    <InputLabel htmlFor="password" value="New Password" />

                    <TextInput
                        id="password"
                        ref={passwordInput}
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        type="password"
                        className="mt-1 block w-full rounded-xl border-gray-300 focus:border-[#1B1F5E] focus:ring-[#1B1F5E]"
                        autoComplete="new-password"
                    />

                    <InputError message={errors.password} className="mt-2" />

                </div>


                {/* CONFIRM PASSWORD */}

                <div>

                    <InputLabel htmlFor="password_confirmation" value="Confirm Password" />

                    <TextInput
                        id="password_confirmation"
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        type="password"
                        className="mt-1 block w-full rounded-xl border-gray-300 focus:border-[#1B1F5E] focus:ring-[#1B1F5E]"
                        autoComplete="new-password"
                    />

                    <InputError message={errors.password_confirmation} className="mt-2" />

                </div>


                {/* BUTTON */}

                <div className="flex items-center gap-4 pt-2">

                    <button
                        disabled={processing}
                        className="bg-[#1B1F5E] hover:bg-[#14174a] text-white px-5 py-2 rounded-xl font-medium transition"
                    >
                        Save Password
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
                            Password updated successfully.
                        </p>
                    </Transition>

                </div>

            </form>

        </section>

    );
}
