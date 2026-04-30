import { useState, useEffect, useCallback, useRef } from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import { Eye, EyeOff, AlertTriangle } from "lucide-react";
import { courses } from "@/data/courses";

/* ─── PASSWORD UTILITIES ───────────────────────────────── */

const RULES = [
    { key: "length",    label: "Minimum 8 characters",      test: (p) => p.length >= 8 },
    { key: "uppercase", label: "One uppercase letter (A-Z)", test: (p) => /[A-Z]/.test(p) },
    { key: "lowercase", label: "One lowercase letter (a-z)", test: (p) => /[a-z]/.test(p) },
    { key: "number",    label: "One number (0-9)",           test: (p) => /[0-9]/.test(p) },
    { key: "special",   label: "One special character",      test: (p) => /[!@#$%^&*()\-_=+{}|:;"'<>,.?/~`\\[\]]/.test(p) },
];

const STRENGTH_CONFIG = [
    { label: "Very Weak",  color: "bg-red-500",    text: "text-red-500"    },
    { label: "Weak",       color: "bg-red-400",    text: "text-red-400"    },
    { label: "Fair",       color: "bg-amber-400",  text: "text-amber-500"  },
    { label: "Good",       color: "bg-yellow-400", text: "text-yellow-600" },
    { label: "Strong",     color: "bg-emerald-400",text: "text-emerald-500"},
    { label: "Very Strong",color: "bg-emerald-500",text: "text-emerald-600"},
];

function evaluatePassword(password) {
    const passed = RULES.map((r) => ({ ...r, passed: r.test(password) }));
    const score  = passed.filter((r) => r.passed).length;
    return { rules: passed, score, strength: STRENGTH_CONFIG[score] ?? STRENGTH_CONFIG[0] };
}

/* ─── SUB-COMPONENTS ───────────────────────────────────── */

function InputField({ label, error, children }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                {label}
            </label>
            {children}
            {error && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <span>⚠</span> {error}
                </p>
            )}
        </div>
    );
}

function TextInput({ className = "", ...props }) {
    return (
        <input
            className={`w-full px-4 py-3 rounded-xl bg-gray-100 border border-gray-300
                focus:outline-none focus:ring-2 focus:ring-[#1B1F5E]/30 focus:border-[#1B1F5E]
                transition-all duration-200 text-sm placeholder:text-gray-400 ${className}`}
            {...props}
        />
    );
}

function StrengthBar({ score, strength, password }) {
    if (!password) return null;
    return (
        <div className="mt-2.5 space-y-1.5">
            <div className="flex gap-1">
                {STRENGTH_CONFIG.map((s, i) => (
                    <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                            i < score + 1 ? s.color : "bg-gray-200"
                        }`}
                    />
                ))}
            </div>
            <div className="flex items-center justify-between">
                <p className={`text-xs font-semibold ${strength.text}`}>
                    {strength.label}
                </p>
                <p className="text-[10px] text-gray-400">{score}/5 rules met</p>
            </div>
        </div>
    );
}

function RulesList({ rules, visible }) {
    if (!visible) return null;
    return (
        <div className="mt-2 bg-gray-50 rounded-xl p-3 border border-gray-100 space-y-1.5">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                Password requirements
            </p>
            {rules.map((rule) => (
                <div
                    key={rule.key}
                    className={`flex items-center gap-2 text-xs transition-colors duration-200 ${
                        rule.passed ? "text-emerald-600" : "text-gray-400"
                    }`}
                >
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 transition-all duration-200 ${
                        rule.passed
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-gray-200 text-gray-400"
                    }`}>
                        {rule.passed ? "✔" : "•"}
                    </span>
                    <span className={rule.passed ? "line-through decoration-emerald-400/60" : ""}>
                        {rule.label}
                    </span>
                </div>
            ))}
        </div>
    );
}

/* ─── MAIN REGISTER PAGE ───────────────────────────────── */

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
        student_number: "",
        year_level: "",
        course: "",
        section: "",
    });

    const [showPassword,        setShowPassword]        = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showRules,           setShowRules]           = useState(false);
    const [capsLock,            setCapsLock]            = useState(false);
    const [searchCourse,        setSearchCourse]        = useState("");
    const [showDropdown,        setShowDropdown]        = useState(false);
    const dropdownRef = useRef(null);

    /* Password analysis */
    const { rules, score, strength } = evaluatePassword(data.password);
    const allRulesMet    = score === 5;
    const passwordMatch  = data.password.length > 0 && data.password === data.password_confirmation;
    const confirmTouched = data.password_confirmation.length > 0;
    const canSubmit      = allRulesMet && passwordMatch && !processing;

    /* Caps Lock detection */
    const handleKeyUp = useCallback((e) => {
        setCapsLock(e.getModifierState?.("CapsLock") ?? false);
    }, []);

    useEffect(() => {
        window.addEventListener("keyup", handleKeyUp);
        return () => window.removeEventListener("keyup", handleKeyUp);
    }, [handleKeyUp]);

    /* Close course dropdown on outside click */
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    /* Student number formatter */
    const handleStudentNumber = (e) => {
        const digits    = e.target.value.replace(/\D/g, "").slice(0, 8);
        const formatted = digits.length > 2 ? `${digits.slice(0, 2)}-${digits.slice(2)}` : digits;
        setData("student_number", formatted);
    };

    const handleStudentNumberPaste = (e) => {
        e.preventDefault();
        const digits    = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 8);
        const formatted = digits.length > 2 ? `${digits.slice(0, 2)}-${digits.slice(2)}` : digits;
        setData("student_number", formatted);
    };

    /* Form submit */
    const submit = (e) => {
        e.preventDefault();
        if (!canSubmit) return;
        post(route("register"), {
            onFinish: () => reset("password", "password_confirmation"),
        });
    };

    /* Course filter */
    const filteredCourses = courses.filter((c) =>
        c.label.toLowerCase().includes(searchCourse.toLowerCase())
    );

    const baseInput = `w-full px-4 py-3 rounded-xl bg-gray-100 border border-gray-300
        focus:outline-none focus:ring-2 focus:ring-[#1B1F5E]/30 focus:border-[#1B1F5E]
        transition-all duration-200 text-sm placeholder:text-gray-400`;

    return (
        <>
            <Head title="Register" />

            <div className="min-h-screen flex items-center justify-center bg-gray-200 p-4 py-10">
                <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl overflow-hidden">
                    <div className="px-8 py-10">

                        {/* Header */}
                        <div className="text-center mb-8">
                            <p className="text-xs font-semibold text-gray-500 tracking-widest">
                                WELCOME TO
                            </p>
                            <img
                                src="/images/logo1.png"
                                alt="NexiBin"
                                className="mx-auto mt-3 w-36"
                            />
                            <p className="text-xs text-gray-400 mt-3">
                                Create your account
                            </p>
                        </div>

                        <form onSubmit={submit} className="space-y-5">

                            {/* Username */}
                            <InputField label="Username" error={errors.name}>
                                <TextInput
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData("name", e.target.value)}
                                    placeholder="Enter username"
                                    autoComplete="username"
                                />
                            </InputField>

                            {/* Email */}
                            <InputField label="Email" error={errors.email}>
                                <TextInput
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData("email", e.target.value)}
                                    placeholder="Enter email"
                                    autoComplete="email"
                                />
                            </InputField>

                            {/* Student Number */}
                            <InputField label="Student Number" error={errors.student_number}>
                                <TextInput
                                    type="text"
                                    value={data.student_number}
                                    onChange={handleStudentNumber}
                                    onPaste={handleStudentNumberPaste}
                                    inputMode="numeric"
                                    maxLength={9}
                                    placeholder="00-000000"
                                    className={errors.student_number ? "border-red-400 bg-red-50" : ""}
                                />
                            </InputField>

                            {/* Year Level */}
                            <InputField label="Year Level" error={errors.year_level}>
                                <select
                                    value={data.year_level}
                                    onChange={(e) => setData("year_level", e.target.value)}
                                    className={baseInput}
                                >
                                    <option value="">Select year level</option>
                                    <option value="1">1st Year</option>
                                    <option value="2">2nd Year</option>
                                    <option value="3">3rd Year</option>
                                    <option value="4">4th Year</option>
                                </select>
                            </InputField>

                            {/* Course */}
                            <InputField label="Course" error={errors.course}>
                                <div className="relative" ref={dropdownRef}>
                                    <TextInput
                                        type="text"
                                        value={searchCourse}
                                        onChange={(e) => {
                                            setSearchCourse(e.target.value);
                                            setShowDropdown(true);
                                        }}
                                        onFocus={() => setShowDropdown(true)}
                                        placeholder="Search course..."
                                        autoComplete="off"
                                    />
                                    {showDropdown && searchCourse && (
                                        <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-xl mt-1 max-h-40 overflow-y-auto shadow-lg">
                                            {filteredCourses.length > 0 ? (
                                                filteredCourses.map((c) => (
                                                    <div
                                                        key={c.value}
                                                        onMouseDown={() => {
                                                            setSearchCourse(c.label);
                                                            setData("course", c.value);
                                                            setShowDropdown(false);
                                                        }}
                                                        className="px-4 py-2.5 hover:bg-[#1B1F5E]/5 cursor-pointer text-sm transition-colors"
                                                    >
                                                        {c.label}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="px-4 py-3 text-gray-400 text-sm">
                                                    No results found
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </InputField>

                            {/* Section */}
                            <InputField label="Section" error={errors.section}>
                                <TextInput
                                    type="text"
                                    value={data.section}
                                    onChange={(e) => setData("section", e.target.value)}
                                    placeholder="e.g. BSCS 3A"
                                />
                            </InputField>

                            {/* ── Password ── */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                    Password
                                </label>

                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={data.password}
                                        onChange={(e) => setData("password", e.target.value)}
                                        onFocus={() => setShowRules(true)}
                                        placeholder="Enter password"
                                        autoComplete="new-password"
                                        className={`${baseInput} pr-20`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-gray-400 hover:text-gray-700 transition-colors"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        <span className="text-[10px] font-medium hidden sm:inline">
                                            {showPassword ? "Hide" : "Show"}
                                        </span>
                                    </button>
                                </div>

                                {/* Caps Lock warning */}
                                {capsLock && (
                                    <div className="flex items-center gap-1.5 mt-1.5 text-amber-500">
                                        <AlertTriangle size={12} />
                                        <p className="text-xs font-medium">Caps Lock is on</p>
                                    </div>
                                )}

                                {/* Strength bar */}
                                <StrengthBar
                                    score={score}
                                    strength={strength}
                                    password={data.password}
                                />

                                {/* Rules checklist */}
                                <RulesList
                                    rules={rules}
                                    visible={showRules && data.password.length > 0}
                                />

                                {/* Tip */}
                                {showRules && !allRulesMet && data.password.length > 0 && (
                                    <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">
                                        💡 Tip: Try something like{" "}
                                        <span className="font-mono font-semibold">NexiBin@2026</span>
                                        {" "}— mix words, numbers &amp; symbols.
                                    </p>
                                )}

                                {errors.password && (
                                    <p className="text-xs text-red-500 mt-1">⚠ {errors.password}</p>
                                )}
                            </div>

                            {/* ── Confirm Password ── */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                    Confirm Password
                                </label>

                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={data.password_confirmation}
                                        onChange={(e) => setData("password_confirmation", e.target.value)}
                                        placeholder="Re-enter password"
                                        autoComplete="new-password"
                                        className={`${baseInput} pr-20 ${
                                            confirmTouched
                                                ? passwordMatch
                                                    ? "border-emerald-400 focus:ring-emerald-200 focus:border-emerald-500"
                                                    : "border-red-400 focus:ring-red-200 focus:border-red-500 bg-red-50"
                                                : ""
                                        }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword((v) => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-gray-400 hover:text-gray-700 transition-colors"
                                        aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                                    >
                                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        <span className="text-[10px] font-medium hidden sm:inline">
                                            {showConfirmPassword ? "Hide" : "Show"}
                                        </span>
                                    </button>
                                </div>

                                {/* Match feedback */}
                                {confirmTouched && (
                                    <p className={`text-xs mt-1.5 flex items-center gap-1 font-medium ${
                                        passwordMatch ? "text-emerald-600" : "text-red-500"
                                    }`}>
                                        {passwordMatch
                                            ? <><span>✔</span> Passwords match</>
                                            : <><span>✖</span> Passwords do not match</>
                                        }
                                    </p>
                                )}
                            </div>

                            {/* ── Submit ── */}
                            <div className="pt-2 space-y-3">
                                <button
                                    type="submit"
                                    disabled={!canSubmit}
                                    className={`w-full py-3 rounded-full text-sm font-bold tracking-wide transition-all duration-200 ${
                                        canSubmit
                                            ? "bg-[#1B1F5E] text-white hover:bg-[#252a7a] active:scale-[0.98] shadow-md shadow-[#1B1F5E]/20"
                                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                    }`}
                                >
                                    {processing ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                            </svg>
                                            Creating account...
                                        </span>
                                    ) : "SIGN UP"}
                                </button>

                                {/* Hint when disabled */}
                                {!canSubmit && !processing && data.password.length > 0 && (
                                    <p className="text-center text-[10px] text-gray-400">
                                        {!allRulesMet
                                            ? "Meet all password requirements to continue"
                                            : !passwordMatch
                                                ? "Passwords must match to continue"
                                                : ""
                                        }
                                    </p>
                                )}

                                <div className="text-center pt-1">
                                    <p className="text-xs text-gray-400">Already have an account?</p>
                                    <Link
                                        href={route("login")}
                                        className="inline-block mt-3 px-6 py-2 rounded-full border-2 border-[#1B1F5E] text-[#1B1F5E] text-sm font-semibold hover:bg-[#1B1F5E] hover:text-white transition-all duration-200"
                                    >
                                        LOGIN
                                    </Link>
                                </div>
                            </div>

                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
