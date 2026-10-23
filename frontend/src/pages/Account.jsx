import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera } from "lucide-react";

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

const Account = ({ user, setUser }) => {
    const navigate = useNavigate();
    const fileRef = useRef(null);

    const [username, setUsername] = useState(user?.username ?? "");
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    useEffect(() => {
        setUsername(user?.username ?? "");
    }, [user]);

    // สร้างรูปตัวอย่างจากไฟล์ที่เลือก และคืนหน่วยความจำเมื่อเปลี่ยนไฟล์
    useEffect(() => {
        if (!file) return;
        const url = URL.createObjectURL(file);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    if (!user) return null; // ยังไม่ล็อกอิน (ควรมี route guard พาไปหน้า login)

    const onPick = (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        if (!ALLOWED.includes(f.type)) {
            setMessage({ type: "error", text: "Please choose a JPG, PNG or WebP image" });
            return;
        }
        if (f.size > 2 * 1024 * 1024) {
            setMessage({ type: "error", text: "Image must be under 2 MB" });
            return;
        }
        setMessage({ type: "", text: "" });
        setFile(f);
    };

    const changed = username.trim() !== user.username || file !== null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: "", text: "" });
        setSaving(true);

        try {
            const data = new FormData();
            data.append("username", username.trim());
            if (file) data.append("avatar", file);

            const res = await axios.put("/api/account", data);
            setUser(res.data.user);
            setFile(null);
            setPreview(null);
            setMessage({ type: "success", text: "Profile updated" });
        } catch (err) {
            setMessage({
                type: "error",
                text: err.response?.data?.message || "Something went wrong",
            });
        } finally {
            setSaving(false);
        }
    };

    const avatarSrc = preview || user.avatar_url;

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

                <h2 className="text-3xl mb-2 font-bold text-gray-800">Manage Account</h2>
                <p className="text-gray-500 mb-6">Update your photo and display name.</p>

                {/* Avatar */}
                <div className="relative mx-auto mb-6 h-28 w-28">
                    {avatarSrc ? (
                        <img
                            src={avatarSrc}
                            alt="Your avatar"
                            className="h-28 w-28 rounded-full object-cover border-4 border-white shadow-md"
                        />
                    ) : (
                        <div className="h-28 w-28 rounded-full bg-[#9596D6] text-white text-4xl font-bold flex items-center justify-center shadow-md">
                            {user.username?.[0]?.toUpperCase()}
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        aria-label="Change photo"
                        className="absolute bottom-0 right-0 rounded-full bg-blue-500 p-2 text-white shadow hover:bg-blue-600 transition"
                    >
                        <Camera className="h-4 w-4" />
                    </button>
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={onPick}
                    />
                </div>

                {message.text && (
                    <p className={`text-sm mb-4 ${message.type === "error" ? "text-red-500" : "text-green-600"}`}>
                        {message.text}
                    </p>
                )}

                <label className="block text-left text-sm text-gray-500 mb-1" htmlFor="username">
                    Display name
                </label>
                <input
                    id="username"
                    type="text"
                    required
                    minLength={3}
                    maxLength={30}
                    className="border border-gray-300 rounded-lg p-3 w-full mb-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />

                <label className="block text-left text-sm text-gray-500 mb-1" htmlFor="email">
                    Email
                </label>
                <input
                    id="email"
                    type="email"
                    disabled
                    className="border border-gray-200 bg-gray-100 rounded-lg p-3 w-full mb-5 text-gray-500"
                    value={user.email ?? ""}
                />

                <button
                    type="submit"
                    disabled={!changed || saving}
                    className="bg-blue-500 text-white font-semibold p-3 w-full rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving ? "Saving..." : "Save changes"}
                </button>
            </form>
        </div>
    );
};

export default Account;