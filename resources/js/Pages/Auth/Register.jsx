import { useState } from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import { Eye, EyeOff } from "lucide-react";
import { courses } from "@/data/courses";
import Select from "react-select";

export default function Register() {

    const { data, setData, post, processing, errors, reset } = useForm({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
        student_number: "",
        course: "",
        section: "",
    });

    const [showRules, setShowRules] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [searchCourse, setSearchCourse] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);

    const submit = (e) => {
        e.preventDefault();

        post(route("register"), {
            onFinish: () => reset("password", "password_confirmation"),
        });
    };

    /* PASSWORD VALIDATION RULES */

    const hasLength = data.password.length >= 8;
    const hasUppercase = /[A-Z]/.test(data.password);
    const hasNumber = /[0-9]/.test(data.password);
    const hasSpecial = /[!@#$%^&*()_+-={}|\:;"'<>,.?/~`]/.test(data.password);

    const passwordMatch =
        data.password && data.password === data.password_confirmation;

    /* PASSWORD STRENGTH */

    const strengthScore =
        [hasLength, hasUppercase, hasNumber, hasSpecial].filter(Boolean).length;

    const strengthLabel = ["Weak", "Weak", "Medium", "Strong", "Very Strong"][
        strengthScore
    ];

    const strengthWidth = (strengthScore / 4) * 100;

    const filteredCourses = courses.filter((course) =>
        course.label.toLowerCase().includes(searchCourse.toLowerCase())
    );

    return (
        <>
            <Head title="Register" />

            <div className="min-h-screen flex items-center justify-center bg-gray-200 p-4">

                <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl overflow-hidden">

                    <div className="px-8 py-10">

                        {/* HEADER */}

                        <div className="text-center mb-8">
                            <h1 className="text-xs font-semibold text-gray-500 tracking-widest">
                                WELCOME TO
                            </h1>

                            <img
                                src="/images/logo1.png"
                                alt="NexiBin"
                                className="mx-auto mt-3 w-36"
                            />

                            <p className="text-xs text-gray-400 mt-3">
                                Create your account
                            </p>
                        </div>

                        {/* FORM */}

                        <form onSubmit={submit} className="space-y-5">

                            {/* USERNAME */}

                            <div>
                                <label className="text-xs text-gray-600">
                                    Username
                                </label>

                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData("name", e.target.value)
                                    }
                                    placeholder="Enter Username"
                                    className="w-full mt-2 px-4 py-3 rounded-xl bg-gray-100 border border-gray-300 focus:ring-2 focus:ring-[#1B1F5E] transition"
                                />

                                {errors.name && (
                                    <p className="text-xs text-red-500 mt-1">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            {/* EMAIL */}

                            <div>
                                <label className="text-xs text-gray-600">
                                    Email
                                </label>

                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) =>
                                        setData("email", e.target.value)
                                    }
                                    placeholder="Enter Email"
                                    className="w-full mt-2 px-4 py-3 rounded-xl bg-gray-100 border border-gray-300 focus:ring-2 focus:ring-[#1B1F5E] transition"
                                />

                                {errors.email && (
                                    <p className="text-xs text-red-500 mt-1">
                                        {errors.email}
                                    </p>
                                )}
                            </div>
                            
                            {/* STUDENT NUMBER */}
                            <div>
                                <label className="text-xs text-gray-600 font-semibold">
                                    Student Number
                                </label>

                                <input
                                    type="text"
                                    value={data.student_number || ""}
                                    onChange={(e) => {
                                        let raw = e.target.value;

                                        // 🔥 Remove non-numeric characters
                                        let digits = raw.replace(/\D/g, "");

                                        // 🔥 Limit to 8 digits
                                        digits = digits.slice(0, 8);

                                        // 🔥 Format into 00-000000
                                        let formatted = digits;
                                        if (digits.length > 2) {
                                            formatted = digits.slice(0, 2) + "-" + digits.slice(2);
                                        }

                                        setData("student_number", formatted);
                                    }}
                                    onPaste={(e) => {
                                        e.preventDefault();

                                        let pasted = e.clipboardData.getData("text");

                                        let digits = pasted.replace(/\D/g, "").slice(0, 8);

                                        let formatted = digits;
                                        if (digits.length > 2) {
                                            formatted = digits.slice(0, 2) + "-" + digits.slice(2);
                                        }

                                        setData("student_number", formatted);
                                    }}
                                    inputMode="numeric"
                                    maxLength={9}
                                    placeholder="00-000000"
                                    className={`w-full mt-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all
                                        ${errors.student_number 
                                            ? "border-red-500 bg-red-50 focus:ring-2 focus:ring-red-300" 
                                            : "border-gray-300 bg-gray-100 focus:ring-2 focus:ring-blue-300"}
                                    `}
                                />


                                {/* Error Message */}
                                {errors.student_number && (
                                    <p className="text-xs text-red-500 mt-1 font-medium">
                                        {errors.student_number}
                                    </p>
                                )}
                            </div>

                            {/* YEAR LEVEL */}

                            <div>
                                <label className="text-xs text-gray-600">Year Level</label>

                                <select
                                    value={data.year_level}
                                    onChange={(e) => setData("year_level", e.target.value)}
                                    className="w-full mt-2 px-4 py-3 rounded-xl bg-gray-100 border border-gray-300"
                                >
                                    <option value="">Select Year</option>
                                    <option value="1">1st Year</option>
                                    <option value="2">2nd Year</option>
                                    <option value="3">3rd Year</option>
                                    <option value="4">4th Year</option>
                                </select>
                            </div>

                            {/* COURSE */}
                            <div>
                                <div className="relative">
                                    <label className="text-xs text-gray-600">Course</label>

                                    <input
                                        type="text"
                                        value={searchCourse}
                                        onChange={(e) => {
                                            setSearchCourse(e.target.value);
                                            setShowDropdown(true);
                                        }}
                                        onFocus={() => setShowDropdown(true)}
                                        placeholder="Search course..."
                                        className="w-full mt-2 px-4 py-3 rounded-xl bg-gray-100 border border-gray-300"
                                    />

                                    {/* DROPDOWN */}
                                    {showDropdown && searchCourse && (
                                        <div className="absolute z-10 w-full bg-white border rounded-xl mt-1 max-h-40 overflow-y-auto shadow">
                                            {filteredCourses.length > 0 ? (
                                                filteredCourses.map((course) => (
                                                    <div
                                                        key={course.value}
                                                        onClick={() => {
                                                            setSearchCourse(course.label);
                                                            setData("course", course.value);
                                                            setShowDropdown(false);
                                                        }}
                                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                                    >
                                                        {course.label}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="px-4 py-2 text-gray-400 text-sm">
                                                    No results found
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {errors.course && (
                                    <p className="text-xs text-red-500 mt-1">
                                        {errors.course}
                                    </p>
                                )}
                            </div>

                            {/* SECTION */}

                            <div>
                                <label className="text-xs text-gray-600">Section</label>

                                <input
                                    type="text"
                                    value={data.section}
                                    onChange={(e) => setData("section", e.target.value)}
                                    placeholder="e.g. BSCS 3A"
                                    className="w-full mt-2 px-4 py-3 rounded-xl bg-gray-100 border border-gray-300"
                                />
                            </div>


                            {/* PASSWORD */}

                            <div>
                                <label className="text-xs text-gray-600">
                                    Password
                                </label>

                                <div className="relative">

                                    <input
                                        type={
                                            showPassword ? "text" : "password"
                                        }
                                        value={data.password}
                                        onChange={(e) =>
                                            setData("password", e.target.value)
                                        }
                                        onFocus={() => setShowRules(true)}
                                        placeholder="Enter Password"
                                        className="w-full mt-2 px-4 py-3 pr-12 rounded-xl bg-gray-100 border border-gray-300 focus:ring-2 focus:ring-[#1B1F5E] transition"
                                    />

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                                    >
                                        {showPassword ? (
                                            <EyeOff size={18} />
                                        ) : (
                                            <Eye size={18} />
                                        )}
                                    </button>

                                </div>

                                {/* PASSWORD STRENGTH */}

                                {data.password && (
                                    <div className="mt-2">

                                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-2 bg-indigo-600 transition-all duration-300"
                                                style={{
                                                    width: `${strengthWidth}%`,
                                                }}
                                            />
                                        </div>

                                        <p className="text-xs text-gray-500 mt-1">
                                            Strength: {strengthLabel}
                                        </p>

                                    </div>
                                )}

                                {/* PASSWORD RULES */}

                                {showRules && (
                                    <div className="mt-2 text-xs space-y-1">

                                        <p
                                            className={
                                                hasLength
                                                    ? "text-green-500"
                                                    : "text-gray-500"
                                            }
                                        >
                                            {hasLength ? "✔" : "•"} Minimum 8
                                            characters
                                        </p>

                                        <p
                                            className={
                                                hasUppercase
                                                    ? "text-green-500"
                                                    : "text-gray-500"
                                            }
                                        >
                                            {hasUppercase ? "✔" : "•"} One
                                            uppercase letter
                                        </p>

                                        <p
                                            className={
                                                hasNumber
                                                    ? "text-green-500"
                                                    : "text-gray-500"
                                            }
                                        >
                                            {hasNumber ? "✔" : "•"} One number
                                        </p>

                                        <p
                                            className={
                                                hasSpecial
                                                    ? "text-green-500"
                                                    : "text-gray-500"
                                            }
                                        >
                                            {hasSpecial ? "✔" : "•"} One special
                                            character
                                        </p>

                                    </div>
                                )}

                                {errors.password && (
                                    <p className="text-xs text-red-500 mt-1">
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            {/* CONFIRM PASSWORD */}

                            <div>
                                <label className="text-xs text-gray-600">
                                    Confirm Password
                                </label>

                                <div className="relative">

                                    <input
                                        type={
                                            showConfirmPassword
                                                ? "text"
                                                : "password"
                                        }
                                        value={data.password_confirmation}
                                        onChange={(e) =>
                                            setData(
                                                "password_confirmation",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Confirm Password"
                                        className="w-full mt-2 px-4 py-3 pr-12 rounded-xl bg-gray-100 border border-gray-300 focus:ring-2 focus:ring-[#1B1F5E] transition"
                                    />

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowConfirmPassword(
                                                !showConfirmPassword
                                            )
                                        }
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff size={18} />
                                        ) : (
                                            <Eye size={18} />
                                        )}
                                    </button>

                                </div>

                                {data.password_confirmation && (
                                    <p
                                        className={`text-xs mt-1 ${
                                            passwordMatch
                                                ? "text-green-500"
                                                : "text-red-500"
                                        }`}
                                    >
                                        {passwordMatch
                                            ? "✔ Passwords match"
                                            : "✖ Passwords do not match"}
                                    </p>
                                )}
                            </div>

                            {/* SIGN UP BUTTON */}

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full py-3 rounded-full bg-[#1B1F5E] text-white text-sm font-semibold hover:opacity-90 transition"
                            >
                                SIGN UP
                            </button>

                            {/* LOGIN */}

                            <div className="text-center mt-4">
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