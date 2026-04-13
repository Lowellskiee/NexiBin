import { useRef, useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Transition } from '@headlessui/react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';

/* ─── HELPERS ─────────────────────────────────────────────── */

function initials(name = '') {
    return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

/* ─── SECTION WRAPPER ─────────────────────────────────────── */

function Section({ title, subtitle, icon, children, danger = false }) {
    return (
        <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden
            ${danger ? 'border-red-100' : 'border-slate-100'}`}>
            <div className={`px-6 py-4 border-b flex items-center gap-3
                ${danger ? 'border-red-100 bg-red-50/50' : 'border-slate-100 bg-slate-50/60'}`}>
                <span className="text-xl">{icon}</span>
                <div>
                    <h2 className={`font-extrabold text-base ${danger ? 'text-red-700' : 'text-[#1B1F5E]'}`}>
                        {title}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
                </div>
            </div>
            <div className="px-6 py-6">{children}</div>
        </div>
    );
}

/* ─── FIELD ───────────────────────────────────────────────── */

function Field({ label, error, children }) {
    return (
        <div>
            <InputLabel value={label} className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1" />
            {children}
            {error && <InputError message={error} className="mt-1.5" />}
        </div>
    );
}

/* ─── STYLED INPUT ────────────────────────────────────────── */

const inputClass =
    'mt-1 block w-full rounded-xl border-slate-200 text-sm focus:border-[#1B1F5E] focus:ring-[#1B1F5E] transition-colors';
const disabledClass =
    'mt-1 block w-full rounded-xl border-slate-100 bg-slate-50 text-slate-400 text-sm cursor-not-allowed';

/* ─── SAVE BUTTON ─────────────────────────────────────────── */

function SaveButton({ processing, label = 'Save Changes', danger = false }) {
    return (
        <div className="flex items-center gap-4 pt-2">
            <button
                disabled={processing}
                className={`px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all active:scale-[.98] disabled:opacity-60
                    ${danger
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-[#1B1F5E] hover:bg-[#2d3494] shadow-sm'}`}
            >
                {processing ? (
                    <span className="flex items-center gap-2">
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"
                                strokeDasharray="31.4" strokeDashoffset="10" />
                        </svg>
                        Saving…
                    </span>
                ) : label}
            </button>
        </div>
    );
}

/* ─── SUCCESS FLASH ───────────────────────────────────────── */

function SuccessFlash({ show, message }) {
    return (
        <Transition
            show={show}
            enter="transition-all duration-300"
            enterFrom="opacity-0 translate-y-1"
            leave="transition-all duration-300"
            leaveTo="opacity-0"
        >
            <p className="text-sm text-emerald-600 font-semibold flex items-center gap-1.5">
                <span>✓</span>{message}
            </p>
        </Transition>
    );
}

/* ═══════════════════════════════════════════════════════════
   SECTION 1 — UPDATE PROFILE INFORMATION
══════════════════════════════════════════════════════════ */

function ProfileInfoSection({ mustVerifyEmail, status }) {
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
        <Section title="Profile Information" subtitle="Update your name and email address." icon="👤">
            <form onSubmit={submit} className="space-y-4">

                <Field label="Full Name" error={errors.name}>
                    <TextInput
                        id="name"
                        className={inputClass}
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        autoComplete="name"
                    />
                </Field>

                <Field label="Email Address" error={errors.email}>
                    <TextInput
                        id="email"
                        type="email"
                        className={inputClass}
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        autoComplete="username"
                    />
                </Field>

                {/* Student Info — read only */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Student Information</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                            { label: 'Student Number', value: user.student_number },
                            { label: 'Course',         value: user.course },
                            { label: 'Year Level',     value: user.year_level },
                            { label: 'Section',        value: user.section },
                        ].map(({ label, value }) => (
                            <div key={label}>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">{label}</p>
                                <p className="text-sm font-semibold text-slate-600 bg-white border border-slate-100 rounded-lg px-3 py-2">
                                    {value || 'N/A'}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Email verification */}
                {mustVerifyEmail && user.email_verified_at === null && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <p className="text-sm text-amber-800 font-semibold mb-2">⚠️ Your email is unverified.</p>
                        <Link
                            href={route('verification.send')}
                            method="post"
                            as="button"
                            className="text-xs font-bold text-[#1B1F5E] underline underline-offset-2"
                        >
                            Re-send verification email
                        </Link>
                        {status === 'verification-link-sent' && (
                            <p className="mt-2 text-xs text-emerald-600 font-semibold">✓ Verification email sent.</p>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-4 pt-1">
                    <SaveButton processing={processing} label="Save Changes" />
                    <SuccessFlash show={recentlySuccessful} message="Profile updated." />
                </div>
            </form>
        </Section>
    );
}

/* ═══════════════════════════════════════════════════════════
   SECTION 2 — UPDATE PASSWORD
══════════════════════════════════════════════════════════ */

function PasswordSection() {
    const passwordInput       = useRef();
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
            onError: (errs) => {
                if (errs.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current.focus();
                }
                if (errs.current_password) {
                    reset('current_password');
                    currentPasswordInput.current.focus();
                }
            },
        });
    };

    return (
        <Section title="Update Password" subtitle="Use a long, random password to keep your account secure." icon="🔒">
            <form onSubmit={updatePassword} className="space-y-4">

                <Field label="Current Password" error={errors.current_password}>
                    <TextInput
                        id="current_password"
                        ref={currentPasswordInput}
                        type="password"
                        className={inputClass}
                        value={data.current_password}
                        onChange={(e) => setData('current_password', e.target.value)}
                        autoComplete="current-password"
                    />
                </Field>

                <Field label="New Password" error={errors.password}>
                    <TextInput
                        id="password"
                        ref={passwordInput}
                        type="password"
                        className={inputClass}
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        autoComplete="new-password"
                    />
                </Field>

                <Field label="Confirm New Password" error={errors.password_confirmation}>
                    <TextInput
                        id="password_confirmation"
                        type="password"
                        className={inputClass}
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        autoComplete="new-password"
                    />
                </Field>

                <div className="flex items-center gap-4 pt-1">
                    <SaveButton processing={processing} label="Save Password" />
                    <SuccessFlash show={recentlySuccessful} message="Password updated." />
                </div>
            </form>
        </Section>
    );
}

/* ═══════════════════════════════════════════════════════════
   SECTION 3 — DELETE ACCOUNT
══════════════════════════════════════════════════════════ */

function DeleteAccountSection() {
    const [confirming, setConfirming] = useState(false);
    const passwordInput = useRef();

    const { data, setData, delete: destroy, processing, reset, errors } = useForm({ password: '' });

    const deleteUser = (e) => {
        e.preventDefault();
        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => setConfirming(false),
            onError:   () => passwordInput.current.focus(),
            onFinish:  () => reset(),
        });
    };

    return (
        <Section
            title="Delete Account"
            subtitle="Permanently delete your account and all associated data."
            icon="🗑️"
            danger
        >
            <p className="text-sm text-slate-500 mb-4">
                Once deleted, all your data — points, redemptions, and scans — will be permanently removed and cannot be recovered.
            </p>

            {!confirming ? (
                <button
                    onClick={() => setConfirming(true)}
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-all active:scale-[.98]"
                >
                    Delete My Account
                </button>
            ) : (
                <div className="bg-red-50 border border-red-200 rounded-xl p-5 space-y-4"
                    style={{ animation: 'fadeIn .2s ease' }}>
                    <p className="text-sm font-bold text-red-700">
                        ⚠️ This action is irreversible. Enter your password to confirm.
                    </p>

                    <form onSubmit={deleteUser} className="space-y-4">
                        <Field label="Your Password" error={errors.password}>
                            <TextInput
                                id="delete_password"
                                type="password"
                                ref={passwordInput}
                                className={inputClass}
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="Enter your password"
                                isFocused
                            />
                        </Field>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => { setConfirming(false); reset(); }}
                                className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-all"
                            >
                                Cancel
                            </button>
                            <SaveButton processing={processing} label="Yes, Delete My Account" danger />
                        </div>
                    </form>
                </div>
            )}
        </Section>
    );
}

/* ═══════════════════════════════════════════════════════════
   MAIN — Profile Page
══════════════════════════════════════════════════════════ */

export default function Profile({ auth, mustVerifyEmail, status }) {
    const user = auth.user;
    const [activeTab, setActiveTab] = useState('profile');

    const tabs = [
        { id: 'profile',  label: 'Profile',  icon: '👤' },
        { id: 'password', label: 'Password', icon: '🔒' },
        { id: 'danger',   label: 'Account',  icon: '⚙️' },
    ];

    return (
        <>
            <Head title="Profile" />

            <style>{`
                @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
                .fade-in { animation: fadeIn .3s ease both; }
            `}</style>

            <div className="min-h-screen bg-slate-50">

                {/* ── TOP HEADER ── */}
                <div className="bg-[#1B1F5E]">
                    <div className="max-w-2xl mx-auto px-4 pt-8 pb-6">

                        <Link
                            href={route('dashboard')}
                            className="inline-flex items-center gap-1.5 text-blue-300 hover:text-white text-xs font-semibold mb-6 transition-colors"
                        >
                            ← Back to Dashboard
                        </Link>

                        {/* Avatar + name */}
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-white font-extrabold text-xl">
                                {initials(user.name)}
                            </div>
                            <div>
                                <h1 className="text-white font-extrabold text-xl leading-tight">{user.name}</h1>
                                <p className="text-blue-300 text-sm mt-0.5">{user.email}</p>
                                {user.student_number && (
                                    <p className="text-blue-400 text-xs mt-0.5 font-mono">{user.student_number}</p>
                                )}
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-1 mt-6 bg-white/10 rounded-xl p-1">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5
                                        ${activeTab === tab.id
                                            ? 'bg-white text-[#1B1F5E] shadow-sm'
                                            : 'text-blue-200 hover:text-white'}`}
                                >
                                    <span>{tab.icon}</span>{tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── CONTENT ── */}
                <div className="max-w-2xl mx-auto px-4 py-6">
                    <div className="fade-in" key={activeTab}>
                        {activeTab === 'profile'  && <ProfileInfoSection mustVerifyEmail={mustVerifyEmail} status={status} />}
                        {activeTab === 'password' && <PasswordSection />}
                        {activeTab === 'danger'   && <DeleteAccountSection />}
                    </div>
                </div>
            </div>
        </>
    );
}
