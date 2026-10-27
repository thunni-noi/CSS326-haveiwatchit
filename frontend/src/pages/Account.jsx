import axios from "axios";
import LoadingPlaceHolder from "../components/LoadingScreen";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Camera,
    Mail,
    Pencil,
    Plus,
    UserRound,
    CheckCircle2,
    AlertCircle,
    LoaderCircle,
} from "lucide-react";

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 2 * 1024 * 1024;

const statusLabel = {
    wishlist: "Want to watch",
    watching: "Watching",
    watched: "Watched",
    rewatching: "Rewatching",
    on_hold: "On hold",
    dropped: "Dropped",
};

const tabs = [
    { key: "board", label: "Board" },
    { key: "activity", label: "Activity" },
    { key: "edit", label: "Edit" },
];

function Widget({ title, items }) {
    const shown = items.slice(0, 3);

    return (
        <Link
            to="/watchlist"
            className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-netural-900/80 p-4 text-center transition hover:border-[#EFAC61]/30 hover:bg-neutral-800"
        >
            {shown.length > 0 ? (
                <div className="flex -space-x-4">
                    {shown.map((item) => (
                        <div
                            key={item.show_id}
                            className="h-24 w-16 overflow-hidden rounded-lg border-2 border-neutral-900 bg-neutral-800 shadow-lg"
                        >
                            {item.poster_url && (
                                <img src={item.poster_url} alt="" className="h-full w-full object-cover" />
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white">
                    <Plus size={18} />
                </span>
            )}
            <span className="text-sm font-semibold">{title}</span>
            {shown.length > 0 && (
                <span className="-mt-2 text-xs text-neutral-500">
                    {items.length} {items.length === 1 ? "title" : "titles"}
                </span>
            )}
        </Link>
    );
}

function Account({ user, setUser }) {
    const navigate = useNavigate();
    const fileRef = useRef(null);
    const userId = user?.id;

    const [loading, setLoading] = useState(true);

    const [tab, setTab] = useState("board");
    const [items, setItems] = useState([]);
    const [username, setUsername] = useState(user?.username ?? "");
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [avatarError, setAvatarError] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    useEffect(() => {
        setUsername(user?.username ?? "");
    }, [user]);

    useEffect(() => {
        setAvatarError(false);
    }, [user?.avatar_url]);

    useEffect(() => {
        setAvatarError(false);

        if (!file) {
            setPreview(null);
            return undefined;
        }

        const url = URL.createObjectURL(file);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    useEffect(() => {
        if (!userId) return navigate("/");
        const controller = new AbortController();
        axios.get("/api/watchlist", { signal: controller.signal })
            .then(({ data }) => setItems(data.items))
            .catch(() => setItems([]))
            .finally(() => setLoading(false));
        return () => controller.abort();
    }, [userId]);

    const groups = useMemo(() => ({
        watching: items.filter((i) => i.status === "watching" || i.status === "rewatching"),
        wishlist: items.filter((i) => i.status === "wishlist"),
        watched: items.filter((i) => i.status === "watched"),
        topRated: items
            .filter((i) => Number(i.avg_score) > 0)
            .sort((a, b) => Number(b.avg_score) - Number(a.avg_score) || Number(b.review_count || 0) - Number(a.review_count || 0)),
    }), [items]);

    const activity = useMemo(
        () => items.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)).slice(0, 10),
        [items]
    );

    if (!user) return null;

    const avatarSrc = preview || user.avatar_url || null;
    const changed = username.trim() !== (user.username ?? "") || file !== null;
    const memberSince = user.created_at
        ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
        : null;

    const onPick = (e) => {
        const selected = e.target.files?.[0];
        if (!selected) return;

        if (!ALLOWED.includes(selected.type)) {
            setMessage({ type: "error", text: "Please choose a JPG, PNG or WebP image." });
            e.target.value = "";
            return;
        }

        if (selected.size > MAX_SIZE) {
            setMessage({ type: "error", text: "Image must be smaller than 2 MB." });
            e.target.value = "";
            return;
        }

        setFile(selected);
        setMessage({ type: "", text: "" });
    };

    const handleReset = () => {
        setUsername(user.username ?? "");
        setFile(null);
        if (fileRef.current) fileRef.current.value = "";
        setMessage({ type: "", text: "" });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!username.trim()) {
            setMessage({ type: "error", text: "Display name cannot be empty." });
            setTab("edit");
            return;
        }

        if (!changed || saving) return;

        setSaving(true);
        setMessage({ type: "", text: "" });

        try {
            const data = new FormData();
            data.append("username", username.trim());
            if (file) data.append("avatar", file);

            const res = await axios.put("/api/account", data);
            const saved = res.data.user;

            if (file && saved.avatar_url === user.avatar_url) {
                setMessage({
                    type: "error",
                    text: "The server did not save the photo. Check the backend terminal.",
                });
                return;
            }

            setUser((prev) => ({ ...prev, ...saved }));
            setFile(null);
            if (fileRef.current) fileRef.current.value = "";
            setMessage({ type: "success", text: "Profile updated." });
        } catch (err) {
            setMessage({
                type: "error",
                text: err.response?.data?.message || "Unable to update your profile. Please try again.",
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <main className="relative min-h-screen px-4 pb-32 pt-24 text-white sm:px-6">
            <div className="mx-auto max-w-5xl">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="mb-6 inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-neutral-400 transition hover:border-[#9596D6]/20 hover:bg-[#9596D6]/[0.08] hover:text-white"
                >
                    <ArrowLeft size={18} />
                    Back
                </button>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 rounded-3xl border border-white/10 bg-neutral-950/65 p-3 shadow-2xl shadow-black/40 lg:grid-cols-[380px_minmax(0,1fr)]">
                        {/* Left: profile card (Centering contents) */}
                        <aside className="h-fit overflow-hidden rounded-2xl bg-[#2b2b31]">
                            <div className="h-28 bg-[#9596D6]" />

                            <div className="px-5 pb-6 text-center">
                                <div className="relative -mt-14 mx-auto w-fit">
                                    <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-[6px] border-neutral-900 bg-neutral-800">
                                        {avatarSrc && !avatarError ? (
                                            <img
                                                src={avatarSrc}
                                                alt="Profile"
                                                onError={() => setAvatarError(true)}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#9596D6] to-[#303969] text-4xl font-bold">
                                                {(user.username || "U").trim().charAt(0)}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => fileRef.current?.click()}
                                        aria-label="Change profile photo"
                                        className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border-4 border-neutral-900 bg-[#EFAC61] text-white shadow-lg transition hover:scale-105 hover:bg-[#c27f33]"
                                    >
                                        <Camera size={15} />
                                    </button>

                                    <input
                                        ref={fileRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={onPick}
                                        className="hidden"
                                    />
                                </div>

                                <h1 className="mt-4 break-all text-2xl font-bold">{user.username}</h1>
                                <p className="text-sm capitalize text-neutral-400">{user.role}</p>

                                <button
                                    type="button"
                                    onClick={() => setTab("edit")}
                                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#303969] px-4 py-2 text-sm font-semibold transition hover:bg-[#414b82] mx-auto"
                                >
                                    <Pencil size={15} />
                                    Edit Profile
                                </button>

                                <p className="mt-5 text-sm leading-6 text-neutral-300">
                                    {user.bio || "No bio yet."}
                                </p>

                                {memberSince && (
                                    <div className="mt-5">
                                        <p className="text-xs font-bold text-neutral-300">Member Since</p>
                                        <p className="mt-1 text-sm text-neutral-400">{memberSince}</p>
                                    </div>
                                )}
                            </div>
                        </aside>

                        {/* Right: tabs */}
                        <section className="min-w-0 p-3 sm:p-5">
                            <div className="flex gap-6 border-b border-white/10">
                                {tabs.map((t) => (
                                    <button
                                        key={t.key}
                                        type="button"
                                        onClick={() => setTab(t.key)}
                                        className={`-mb-px border-b-2 pb-2 text-sm font-semibold transition ${
                                            tab === t.key
                                                ? "border-white text-white"
                                                : "border-transparent text-neutral-400 hover:text-white"
                                        }`}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>

                            {message.text && (
                                <div
                                    role="status"
                                    className={`mt-4 flex items-start gap-2 rounded-xl border p-3 text-sm ${
                                        message.type === "success"
                                            ? "border-[#9596D6]/25 bg-[#9596D6]/10 text-[#9596D6]"
                                            : "border-red-400/20 bg-red-400/10 text-red-300"
                                    }`}
                                >
                                    {message.type === "success" ? (
                                        <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                                    ) : (
                                        <AlertCircle size={18} className="mt-0.5 shrink-0" />
                                    )}
                                    <span>{message.text}</span>
                                </div>
                            )}

                            {tab === "board" && (
                                <>
                                    <div className="mt-8 text-center">
                                        <h2 className="text-base font-semibold">Your movie board</h2>
                                        <p className="mx-auto mt-1 max-w-xs text-sm text-neutral-400">
                                            A quick look at what you're watching and what's next.
                                        </p>
                                    </div>

                                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                                        <Widget title="Currently watching" items={groups.watching} />
                                        <Widget title="Want to watch" items={groups.wishlist} />
                                        <Widget title="Watched" items={groups.watched} />
                                        <Widget title="Top rated" items={groups.topRated} />
                                    </div>
                                </>
                            )}

                            {tab === "activity" && (
                                <div className="mt-5 space-y-2">
                                    {activity.length === 0 ? (
                                        <p className="py-12 text-center text-sm text-neutral-500">No activity yet.</p>
                                    ) : (
                                        activity.map((item) => (
                                            <div
                                                key={item.show_id}
                                                className="flex items-center gap-3 rounded-xl bg-neutral-900/80 p-3"
                                            >
                                                <div className="h-14 w-10 shrink-0 overflow-hidden rounded bg-neutral-800">
                                                    {item.poster_url && (
                                                        <img src={item.poster_url} alt="" className="h-full w-full object-cover" />
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-medium">{item.title}</p>
                                                    <p className="text-xs text-[#9596D6]">
                                                        {statusLabel[item.status] || item.status}
                                                    </p>
                                                </div>
                                                <span className="shrink-0 text-xs text-neutral-500">
                                                    {new Date(item.updated_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {tab === "edit" && (
                                <div className="mt-6 space-y-6">
                                    <div>
                                        <div className="mb-2 flex items-center justify-between">
                                            <label htmlFor="username" className="text-sm font-medium text-neutral-300">
                                                Display name
                                            </label>
                                            <span className="text-xs text-neutral-500">{username.length}/50</span>
                                        </div>
                                        <div className="relative">
                                            <UserRound size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9596D6]" />
                                            <input
                                                id="username"
                                                type="text"
                                                value={username}
                                                onChange={(e) => {
                                                    setUsername(e.target.value);
                                                    setMessage({ type: "", text: "" });
                                                }}
                                                maxLength={50}
                                                required
                                                placeholder="Enter your display name"
                                                className="w-full rounded-xl border border-white/10 bg-neutral-900/80 py-3.5 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-neutral-500 focus:border-[#9596D6]"
                                            />
                                        </div>
                                        <p className="mt-2 text-xs text-neutral-500">This is the name displayed on your profile.</p>
                                    </div>

                                    <div>
                                        <label htmlFor="email" className="mb-2 block text-sm font-medium text-neutral-300">
                                            Email address
                                        </label>
                                        <div className="relative">
                                            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                                            <input
                                                id="email"
                                                type="email"
                                                value={user.email ?? ""}
                                                disabled
                                                className="w-full cursor-not-allowed rounded-xl border border-white/5 bg-neutral-900/70 py-3.5 pl-11 pr-4 text-sm text-neutral-500 outline-none"
                                            />
                                        </div>
                                        <p className="mt-2 text-xs text-neutral-500">Your email address cannot be changed here.</p>
                                    </div>

                                    <div>
                                        <p className="mb-2 text-sm font-medium text-neutral-300">Profile photo</p>
                                        <button
                                            type="button"
                                            onClick={() => fileRef.current?.click()}
                                            className="inline-flex items-center gap-2 rounded-xl bg-[#303969] px-4 py-2.5 text-white hover:bg-[#414b82]"
                                        >
                                            <Camera size={16} />
                                            Choose a photo
                                        </button>
                                        <p className="mt-2 text-xs text-neutral-500">JPG, PNG or WebP · max 2 MB</p>
                                    </div>
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Unsaved changes bar */}
                    {changed && (
                        <div className="fixed inset-x-0 bottom-4 z-40 px-4">
                            <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 rounded-2xl border border-white/10 bg-neutral-900/95 px-4 py-3 shadow-2xl shadow-black/50 backdrop-blur-xl">
                                <p className="text-sm text-neutral-200">Careful — you have unsaved changes!</p>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleReset}
                                        disabled={saving}
                                        className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-300 transition hover:underline disabled:opacity-50"
                                    >
                                        Reset
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="inline-flex items-center gap-2 rounded-lg bg-[#EFAC61] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#c27f33] disabled:opacity-50"
                                    >
                                        {saving ? (
                                            <>
                                                <LoaderCircle size={16} className="animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            "Save Changes"
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </form>
            </div>
            {loading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-neutral-900">
                    <LoadingPlaceHolder />
                </div>
            )}
        </main>
    );
}

export default Account;