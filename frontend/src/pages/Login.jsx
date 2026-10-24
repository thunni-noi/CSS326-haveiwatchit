import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Login = ({ setUser }) => {
    const [form, setForm] = useState({
        email: "",
        password: ""
    });

    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const res = await axios.post("/api/auth/login", form);
            setUser(res.data.user);
            navigate("/");
        } catch {
            setError("Invalid email or password");
        }
    };

    return (
        <div className="relative min-h-[80vh] flex items-center justify-center overflow-hidden p-4 pt-24 bg-gradient-to-b from-[#171717] via-[#17121f] to-[#0A0A0A]">
            {/* Background glow */}
            <div className="pointer-events-none absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-[#9596D6]/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 right-1/4 h-72 w-72 rounded-full bg-[#EFAC61]/10 blur-3xl" />

            <form
                onSubmit={handleSubmit}
                className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-[#1C1C20]/90 p-8 text-center shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-10"
            >
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    aria-label="Go back"
                    className="absolute left-4 top-4 rounded-full p-2 text-[#9596D6] transition hover:bg-[#9596D6]/10 hover:text-[#EFAC61]"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>

                <div className="mb-6">
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-[#EFAC61]">
                        Have I Watched It?
                    </p>

                    <h2 className="mb-3 text-3xl font-bold text-white sm:text-4xl">
                        Welcome Back
                    </h2>

                    <p className="text-sm leading-relaxed text-gray-400">
                        Sign in to keep track of your movies and shows.
                    </p>
                </div>

                {error && (
                    <p
                        role="alert"
                        className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
                    >
                        {error}
                    </p>
                )}

                <div className="space-y-4 text-left">
                    <div>
                        <label
                            htmlFor="login-email"
                            className="mb-2 block text-sm font-medium text-gray-300"
                        >
                            Email
                        </label>

                        <input
                            id="login-email"
                            type="email"
                            placeholder="Enter your email"
                            autoComplete="email"
                            required
                            className="w-full rounded-xl border border-white/10 bg-[#0F0F12] p-3.5 text-white placeholder:text-gray-600 transition focus:border-[#EFAC61] focus:outline-none focus:ring-2 focus:ring-[#EFAC61]/20"
                            value={form.email}
                            onChange={(e) =>
                                setForm({ ...form, email: e.target.value })
                            }
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="login-password"
                            className="mb-2 block text-sm font-medium text-gray-300"
                        >
                            Password
                        </label>

                        <input
                            id="login-password"
                            type="password"
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            required
                            className="w-full rounded-xl border border-white/10 bg-[#0F0F12] p-3.5 text-white placeholder:text-gray-600 transition focus:border-[#EFAC61] focus:outline-none focus:ring-2 focus:ring-[#EFAC61]/20"
                            value={form.password}
                            onChange={(e) =>
                                setForm({ ...form, password: e.target.value })
                            }
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    className="mt-6 w-full rounded-xl bg-[#EFAC61] p-3.5 font-bold text-[#251329] shadow-lg shadow-[#EFAC61]/10 transition hover:bg-[#F4BC7C] active:scale-[0.98]"
                >
                    Login
                </button>

                <div className="my-6 flex items-center gap-3">
                    <div className="h-px flex-1 bg-white/10" />
                    <span className="whitespace-nowrap text-xs font-medium tracking-wider text-gray-500">
                        OR CONTINUE WITH
                    </span>
                    <div className="h-px flex-1 bg-white/10" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#111114] py-3 text-sm font-medium text-gray-200 transition hover:border-[#9596D6]/50 hover:bg-[#9596D6]/10"
                    >
                        <img
                            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                            alt=""
                            className="h-5 w-5"
                        />
                        Google
                    </button>

                    <button
                        type="button"
                        className="flex items-center justify-center gap-2 rounded-xl bg-[#1877F2] py-3 text-sm font-medium text-white transition hover:bg-[#166FE5]"
                    >
                        <span className="text-xl font-bold">f</span>
                        Facebook
                    </button>
                </div>

                <p className="mt-7 text-sm text-gray-400">
                    Don't have an account?{" "}
                    <button
                        type="button"
                        onClick={() => navigate("/register")}
                        className="font-semibold text-[#EFAC61] transition hover:text-[#F4BC7C] hover:underline"
                    >
                        Register
                    </button>
                </p>
            </form>
        </div>
    );
};

export default Login;