import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Camera,
    UserRound,
    Mail,
    Save,
    ShieldCheck,
    CheckCircle2,
    AlertCircle,
    LoaderCircle,
    ImagePlus,
} from "lucide-react";

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 2 * 1024 * 1024;

function Account({ user, setUser }) {
    const navigate = useNavigate();
    const fileRef = useRef(null);

    const [username, setUsername] = useState(user?.username ?? "");
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [avatarError, setAvatarError] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({
        type: "",
        text: "",
    });

    useEffect(() => {
        setUsername(user?.username ?? "");
    }, [user]);

    useEffect(() => {
        setAvatarError(false);

        if (!file) {
            setPreview(null);
            return;
        }

        const url = URL.createObjectURL(file);
        setPreview(url);

        return () => URL.revokeObjectURL(url);
    }, [file]);
    console.log("account user:", user);
    if (!user) return null;

    const avatarSrc = preview || user.avatar_url || null;

    const changed =
        username.trim() !== (user.username ?? "") || file !== null;

    const onPick = (e) => {
        const selected = e.target.files?.[0];

        if (!selected) return;

        if (!ALLOWED.includes(selected.type)) {
            setMessage({
                type: "error",
                text: "Please choose a JPG, PNG or WebP image.",
            });
            e.target.value = "";
            return;
        }

        if (selected.size > MAX_SIZE) {
            setMessage({
                type: "error",
                text: "Image must be smaller than 2 MB.",
            });
            e.target.value = "";
            return;
        }

        setFile(selected);
        setMessage({ type: "", text: "" });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!username.trim()) {
            setMessage({
                type: "error",
                text: "Display name cannot be empty.",
            });
            return;
        }

        if (!changed || saving) return;

        setSaving(true);
        setMessage({ type: "", text: "" });

        try {
            const data = new FormData();
            data.append("username", username.trim());

            if (file) {
                data.append("avatar", file);
            }

            const res = await axios.put("/api/account", data);

            setUser((prev) => ({
                ...prev,
                ...res.data.user,
                avatar_url:
                    res.data.user.avatar_url ?? prev?.avatar_url
            }));
        } catch (err) {
            setMessage({
                type: "error",
                text:
                    err.response?.data?.message ||
                    "Unable to update your profile. Please try again.",
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-neutral-900 via-neutral-950 to-black px-4 pb-16 pt-24 text-white sm:px-6">
            {/* Background decoration */}
            <div
                className="pointer-events-none absolute -left-40 top-32 h-80 w-80 rounded-full bg-[#30204a]/40 blur-[120px]"
                aria-hidden="true"
            />
            <div
                className="pointer-events-none absolute -right-40 top-96 h-80 w-80 rounded-full bg-[#4a214b]/25 blur-[120px]"
                aria-hidden="true"
            />
            <div
                className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-[#EFAC61]/[0.04] blur-[120px]"
                aria-hidden="true"
            />

            <div className="relative mx-auto max-w-5xl">
                {/* Back button */}
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="mb-8 inline-flex items-center gap-2 rounded-xl border border-white/5 px-3 py-2 text-sm text-neutral-400 transition hover:border-[#9596D6]/20 hover:bg-[#9596D6]/[0.08] hover:text-white"
                >
                    <ArrowLeft size={18} />
                    Back
                </button>

                {/* Page heading */}
                <div className="mb-8">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#EFAC61]">
                        Your profile
                    </p>

                    <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                        Manage Account
                    </h1>

                    <p className="mt-3 max-w-xl text-sm leading-6 text-neutral-400 sm:text-base">
                        Customize your profile and keep your account
                        information up to date.
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
                        {/* Profile card */}
                        <section className="h-fit overflow-hidden rounded-2xl border border-[#9596D6]/15 bg-gradient-to-br from-[#251329]/95 via-[#30204a]/95 to-[#4a214b]/90 p-6 shadow-xl shadow-black/30 backdrop-blur-xl">
                            <div className="mb-6">
                                <h2 className="text-lg font-semibold">
                                    Profile photo
                                </h2>

                                <p className="mt-1 text-sm text-neutral-400">
                                    Make your profile recognizable.
                                </p>
                            </div>

                            <div className="flex flex-col items-center">
                                <div className="relative">
                                    <div className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-full border-4 border-[#30204a] bg-[#1c1c20] ring-2 ring-[#9596D6]/40 shadow-lg shadow-black/30">
                                        {avatarSrc && !avatarError ? (
                                            <img
                                                src={avatarSrc}
                                                alt="Profile"
                                                className="h-full w-full rounded-full object-cover"
                                                onError={() => setAvatarError(true)}
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-[#9596D6] to-[#4a214b] text-4xl font-bold text-white">
                                                {(user?.username || "U").trim().charAt(0)}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            fileRef.current?.click()
                                        }
                                        aria-label="Change profile photo"
                                        className="absolute bottom-1 right-1 flex h-11 w-11 items-center justify-center rounded-full border-4 border-[#30204a] bg-[#EFAC61] text-[#251329] shadow-lg transition hover:scale-105 hover:bg-[#f5c184]"
                                    >
                                        <Camera size={18} />
                                    </button>
                                </div>

                                <p className="mt-5 max-w-full break-words text-center text-base font-semibold text-white">
                                    {user.username || "Your display name"}
                                </p>

                                <p className="mt-1 text-sm text-[#b7add1]">
                                    JPG, PNG or WebP
                                </p>

                                <p className="mt-1 text-xs text-neutral-500">
                                    Maximum file size: 2 MB
                                </p>

                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={onPick}
                                    className="hidden"
                                />

                                <button
                                    type="button"
                                    onClick={() => fileRef.current?.click()}
                                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#9596D6]/25 bg-[#303969]/60 px-4 py-3 text-sm font-medium text-[#eee9fb] transition hover:border-[#9596D6]/50 hover:bg-[#303969]"
                                >
                                    <ImagePlus size={17} />
                                    Choose a photo
                                </button>
                            </div>
                        </section>

                        {/* Account information */}
                        <section className="rounded-2xl border border-white/[0.08] bg-[#1c1c20]/90 p-6 shadow-xl shadow-black/20 backdrop-blur-xl sm:p-8">
                            <div className="mb-7 flex items-start gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#9596D6]/15 bg-[#9596D6]/10 text-[#9596D6]">
                                    <UserRound size={21} />
                                </div>

                                <div>
                                    <h2 className="text-lg font-semibold">
                                        Personal information
                                    </h2>

                                    <p className="mt-1 text-sm text-neutral-500">
                                        Manage your account details.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* Display name */}
                                <div>
                                    <label
                                        htmlFor="username"
                                        className="mb-2 block text-sm font-medium text-neutral-300"
                                    >
                                        Display name
                                    </label>

                                    <div className="relative">
                                        <UserRound
                                            size={18}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9596D6]"
                                        />

                                        <input
                                            id="username"
                                            type="text"
                                            value={username}
                                            onChange={(e) => {
                                                setUsername(e.target.value);
                                                setMessage({
                                                    type: "",
                                                    text: "",
                                                });
                                            }}
                                            maxLength={50}
                                            required
                                            placeholder="Enter your display name"
                                            className="w-full rounded-xl border border-white/10 bg-black/25 py-3.5 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-[#EFAC61]/70 focus:bg-black/35 focus:ring-2 focus:ring-[#EFAC61]/10"
                                        />
                                    </div>

                                    <p className="mt-2 text-xs text-neutral-500">
                                        This is the name displayed on your
                                        profile.
                                    </p>
                                </div>

                                {/* Email */}
                                <div>
                                    <label
                                        htmlFor="email"
                                        className="mb-2 block text-sm font-medium text-neutral-300"
                                    >
                                        Email address
                                    </label>

                                    <div className="relative">
                                        <Mail
                                            size={18}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500"
                                        />

                                        <input
                                            id="email"
                                            type="email"
                                            value={user.email ?? ""}
                                            disabled
                                            className="w-full cursor-not-allowed rounded-xl border border-white/5 bg-white/[0.03] py-3.5 pl-11 pr-4 text-sm text-neutral-500 outline-none"
                                        />
                                    </div>

                                    <p className="mt-2 text-xs text-neutral-500">
                                        Your email address cannot be changed
                                        here.
                                    </p>
                                </div>
                            </div>

                            {/* Account status */}
                            <div className="mt-8 flex items-start gap-3 rounded-xl border border-[#9596D6]/10 bg-[#303969]/20 p-4">
                                <ShieldCheck
                                    size={20}
                                    className="mt-0.5 shrink-0 text-[#9596D6]"
                                />

                                <div>
                                    <p className="text-sm font-medium text-neutral-200">
                                        Account information
                                    </p>

                                    <p className="mt-1 text-xs leading-5 text-neutral-400">
                                        Your profile changes will be saved
                                        to your account when you select
                                        Save Changes.
                                    </p>
                                </div>
                            </div>

                            {/* Feedback message */}
                            {message.text && (
                                <div
                                    role="status"
                                    className={`mt-5 flex items-start gap-2 rounded-xl border p-3 text-sm ${
                                        message.type === "success"
                                            ? "border-[#9596D6]/25 bg-[#9596D6]/10 text-[#c8c9ff]"
                                            : "border-red-400/20 bg-red-400/10 text-red-300"
                                    }`}
                                >
                                    {message.type === "success" ? (
                                        <CheckCircle2
                                            size={18}
                                            className="mt-0.5 shrink-0"
                                        />
                                    ) : (
                                        <AlertCircle
                                            size={18}
                                            className="mt-0.5 shrink-0"
                                        />
                                    )}

                                    <span>{message.text}</span>
                                </div>
                            )}

                            {/* Save button */}
                            <div className="mt-7 flex flex-col-reverse gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-xs text-neutral-500">
                                    {changed
                                        ? "You have unsaved changes."
                                        : "Your profile is up to date."}
                                </p>

                                <button
                                    type="submit"
                                    disabled={!changed || saving}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#EFAC61] px-6 py-3 text-sm font-semibold text-[#251329] shadow-lg shadow-[#EFAC61]/10 transition hover:bg-[#f5c184] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                                >
                                    {saving ? (
                                        <>
                                            <LoaderCircle
                                                size={17}
                                                className="animate-spin"
                                            />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={17} />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </section>
                    </div>
                </form>
            </div>
        </main>
    );
}

export default Account;