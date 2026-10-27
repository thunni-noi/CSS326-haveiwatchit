import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Register = ({ setUser }) => {
    const [form, setForm] = useState({
        username: "",
        email: "",
        password: ""
    });

    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const res = await axios.post("/api/auth/register", form);
            setUser(res.data.user);
            navigate("/");
        } catch (err) {
            setError(
                err.response?.data?.message ?? "Registration Failed!"
            );
        }
    };

    return (
        <main className="container mx-auto px-4 py-6">
            <div className="flex py-24 mx-auto min-h-screen items-center justify-center bg-black/50 backdrop-blur-lg text-white">
            
            <form
                onSubmit={handleSubmit}
                className="relative z-10 w-full max-w-md rounded-2xl border border-gray-500/20 bg-neutral-800 p-8 text-center shadow-2xl shadow-black/30"
            >
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    aria-label="Go back"
                    className="absolute left-4 top-4 rounded-full p-2 text-[#9596D6] transition hover:bg-[#9596D6]/10 hover:text-[#EFAC61]"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>

                <div className="mb-6 mt-5">
                        <span className="text-[#EFAC61] font-bold text-2xl sm:text-4xl inline-block px-2 py-1 rounded-md">
                                <span className="text-[#9596D6]">CREATE</span> ACCOUNT
                        </span>


                        <p className="text-sm leading-relaxed text-gray-400">
                            Create account to keep track of your shows!
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
                            htmlFor="register-username"
                            className="mb-2 block text-sm font-medium text-gray-300"
                        >
                            Username
                        </label>

                        <input
                            id="register-username"
                            type="text"
                            placeholder="Choose a username"
                            autoComplete="username"
                            required
                            className="w-full rounded-xl border border-white/10 bg-neutral-800/80 p-3.5 text-white placeholder:text-neutral-500 transition focus:border-[#9596D6] focus:outline-none"
                            value={form.username}
                            onChange={(e) =>
                                setForm({ ...form, username: e.target.value })
                            }
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="register-email"
                            className="mb-2 block text-sm font-medium text-gray-300"
                        >
                            Email
                        </label>

                        <input
                            id="register-email"
                            type="email"
                            placeholder="Enter your email"
                            autoComplete="email"
                            required
                            className="w-full rounded-xl border border-white/10 bg-neutral-800/80 p-3.5 text-white placeholder:text-neutral-500 transition focus:border-[#9596D6] focus:outline-none"
                            value={form.email}
                            onChange={(e) =>
                                setForm({ ...form, email: e.target.value })
                            }
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="register-password"
                            className="mb-2 block text-sm font-medium text-gray-300"
                        >
                            Password
                        </label>

                        <input
                            id="register-password"
                            type="password"
                            placeholder="Create a password"
                            autoComplete="new-password"
                            required
                            minLength={6}
                            className="w-full rounded-xl border border-white/10 bg-neutral-800/80 p-3.5 text-white placeholder:text-neutral-500 transition focus:border-[#9596D6] focus:outline-none"
                            value={form.password}
                            onChange={(e) =>
                                setForm({ ...form, password: e.target.value })
                            }
                        />
                        <p className="mt-2 text-xs text-gray-500">
                            Password must be at least 6 characters.
                        </p>
                    </div>
                    </div>

                    <button
                        type="submit"
                        className="mt-6 w-full rounded-xl bg-[#303969] p-3.5 font-bold text-white transition hover:bg-[#414b82] active:scale-[0.98]"
                    >
                        Create Account
                    </button>
                    
                    <p className="mt-6 text-sm text-gray-400">
                        Already have an account?{" "}
                        <button
                            type="button"
                            onClick={() => navigate("/login")}
                            className="font-semibold text-[#EFAC61] transition hover:text-[#c27f33] hover:underline"
                        >
                            Login
                        </button>
                    </p>
                </form>
            </div>
        </main>
    );
};

export default Register;