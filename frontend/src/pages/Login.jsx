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
    <div className="min-h-[80vh] flex items-center justify-center p-4 pt-20 bg-gradient-to-b from-[#1A1A1A] to-[#0D0D0D]">
        <form
            className="relative bg-white p-8 rounded-xl shadow-xl shadow-blue-500/20 w-full max-w-md text-center"
            onSubmit={handleSubmit}
        >
            <button
                type="button"
                onClick={() => navigate(-1)}
                aria-label="Go back"
                className="absolute left-4 top-4 rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
            >
                <ArrowLeft className="h-5 w-5" />
            </button>
            <h2 className="text-3xl mb-2 font-bold text-gray-800">
                Welcome Back
            </h2>

            <p className="text-gray-500 mb-6">
                Sign in to keep track of your movies and shows.
            </p>

            {error && (
                <p className="text-red-500 text-sm mb-4">
                    {error}
                </p>
            )}

            <input
                type="email"
                placeholder="Email"
                autoComplete="email"
                required
                className="border border-gray-300 rounded-lg p-3 w-full mb-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={form.email}
                onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                }
            />

            <input
                type="password"
                placeholder="Password"
                autoComplete="current-password"
                required
                className="border border-gray-300 rounded-lg p-3 w-full mb-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={form.password}
                onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                }
            />

            <button
                type="submit"
                className="bg-blue-500 text-white font-semibold p-3 w-full rounded-lg hover:bg-blue-600 transition"
            >
                Login
            </button>

            <div className="flex items-center gap-3 my-6">
                <div className="flex-1 border-t border-gray-300" />
                <span className="text-sm text-gray-500 whitespace-nowrap">
                    OR CONTINUE WITH
                </span>
                <div className="flex-1 border-t border-gray-300" />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <button
                    type="button"
                    className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white py-3 text-gray-800 hover:bg-gray-100 transition"
                >
                    <img
                        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                        alt="Google"
                        className="h-5 w-5"
                    />
                    Google
                </button>

                <button
                    type="button"
                    className="flex items-center justify-center gap-2 rounded-lg bg-[#1877F2] py-3 text-white hover:bg-[#166FE5] transition"
                >
                    <span className="text-xl font-bold">f</span>
                    Facebook
                </button>
            </div>

            <p className="text-sm text-gray-500 mt-6">
                Don't have an account?{" "}
                <button
                    type="button"
                    onClick={() => navigate("/register")}
                    className="text-blue-500 font-semibold hover:underline"
                >
                    Register
                </button>
            </p>
        </form>
    </div>
);
};

export default Login;