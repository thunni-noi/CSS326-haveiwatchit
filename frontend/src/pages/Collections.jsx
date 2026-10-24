import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import {
    Plus, Trash2, Lock, Globe, Copy, Check,
    BookMarked, Bookmark, ChevronRight, X, Pencil, Search, BookmarkCheck, BookmarkPlus
} from "lucide-react";

const Modal = ({ title, onClose, children }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1c1c20] shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
                <h2 className="text-white font-bold text-lg">{title}</h2>
                <button
                    type="button"
                    onClick={onClose}
                    className="text-gray-400 hover:text-white transition"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
            <div className="p-5">{children}</div>
        </div>
    </div>
);

const CollectionCard = ({ col, onDelete, onEdit, shared = false, currentUsername = "", isFollowed = false, onToggleFollow }) => {
    const navigate = useNavigate();
    const [copied, setCopied] = useState(false);

    const shareUrl = `${window.location.origin}/collections/share/${col.share_uuid || col.id}`;

    const handleCopy = async (e) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy link:", err);
        }
    };

    const itemCount = col.item_count ?? 0;
    const previewItems = Array.isArray(col.preview_items) ? col.preview_items : [];
    const collectionPath = shared
        ? `/collections/share/${col.share_uuid}`
        : `/collections/${col.id}`;

    return (
        <div className="group flex flex-col gap-3 rounded-2xl border border-white/10 bg-neutral-950/75 p-5 shadow-lg shadow-black/20 transition hover:border-[#66568f] hover:bg-[#1c1c20]">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
                <button
                    type="button"
                    onClick={() => navigate(collectionPath)}
                    className="line-clamp-2 text-left text-base font-bold text-[#f5f1ff] transition hover:text-[#EFAC61]"
                >
                    {col.name}
                </button>
                {!shared && <div className="flex shrink-0 gap-1">
                    <button
                        type="button"
                        onClick={() => onEdit(col)}
                        className="rounded-lg p-1.5 text-[#b7add1] transition hover:bg-white/10 hover:text-white"
                    >
                        <Pencil className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => onDelete(col)}
                        className="rounded-lg p-1.5 text-[#b7add1] transition hover:bg-red-500/10 hover:text-red-300"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>}
            </div>

            <p className="text-sm text-neutral-400">
                Created by <span className="font-medium text-[#EFAC61]">{col.owner || currentUsername || "Unknown"}</span>
            </p>

            {previewItems.length > 0 ? (
                <div className="flex min-h-[76px] items-center gap-1.5 overflow-hidden" aria-label="Collection movie previews">
                    {previewItems.map((item, index) => {
                        const extraCount = Math.max(0, itemCount - previewItems.length);
                        const showMoreOverlay = index === previewItems.length - 1 && extraCount > 0;

                        return (
                            <div
                                key={item.id}
                                className="relative h-[72px] w-12 shrink-0 overflow-hidden rounded-md border border-white/10 bg-neutral-900"
                                title={item.name}
                            >
                                {item.photo_url ? (
                                    <img
                                        src={item.photo_url}
                                        alt={item.name}
                                        loading="lazy"
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full items-center justify-center px-1 text-center text-[9px] text-[#b7add1]">
                                        {item.name}
                                    </div>
                                )}
                                {showMoreOverlay && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/65 text-sm font-bold text-white">
                                        +{extraCount}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex min-h-[76px] items-center gap-3 rounded-xl border border-dashed border-white/15 bg-neutral-900/70 px-3 text-sm text-neutral-400">
                    <BookMarked className="h-5 w-5 shrink-0 text-[#9596D6]" />
                    No movies added yet
                </div>
            )}

            <div className="flex items-center gap-3 text-sm text-[#c9c2d8]">
                <span className="flex items-center gap-1">
                    <Bookmark className="w-4 h-4" />
                    {itemCount} movie{itemCount !== 1 ? "s" : ""}
                </span>
                <span className="flex items-center gap-1">
                    {col.is_public ? (
                        <Globe className="w-4 h-4 text-green-400" />
                    ) : (
                        <Lock className="w-4 h-4 text-[#9596D6]" />
                    )}
                    {col.is_public ? "Public" : "Private"}
                </span>
            </div>

            <div className="flex gap-2 mt-auto">
                <button
                    type="button"
                    onClick={() => navigate(collectionPath)}
                    className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-[#303969] py-2 text-sm font-medium text-white transition hover:bg-[#414b82]"
                >
                    View <ChevronRight className="w-4 h-4" />
                </button>
                {shared && onToggleFollow && (
                    <button
                        type="button"
                        onClick={() => onToggleFollow(col)}
                        className={`flex items-center justify-center gap-1 rounded-xl border px-3 py-2 text-sm transition ${isFollowed ? "border-green-500/40 bg-green-500/10 text-green-300 hover:bg-red-500/10 hover:text-red-300" : "border-[#66568f] bg-[#29243b] text-[#eee9fb] hover:border-[#9596D6]"}`}
                        title={isFollowed ? "Unfollow collection" : "Follow collection"}
                    >
                        {isFollowed ? <BookmarkCheck className="h-4 w-4" /> : <BookmarkPlus className="h-4 w-4" />}
                        <span>{isFollowed ? "Following" : "Follow"}</span>
                    </button>
                )}
                {Boolean(col.is_public) && (
                    <button
                        type="button"
                        onClick={handleCopy}
                        className="flex items-center gap-1 rounded-xl border border-[#66568f] bg-[#29243b] px-3 py-2 text-sm text-[#eee9fb] transition hover:border-[#9596D6] hover:bg-[#39304e]"
                        title="Copy share link"
                    >
                        {copied ? (
                            <Check className="w-4 h-4 text-green-400" />
                        ) : (
                            <Copy className="w-4 h-4" />
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};

const CollectionsPage = ({ user }) => {
    const [collections, setCollections] = useState([]);
    const [loading, setLoading] = useState(Boolean(user));
    const [followedCollections, setFollowedCollections] = useState([]);
    const [followedLoading, setFollowedLoading] = useState(Boolean(user));
    const [followedError, setFollowedError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState("");
    const searchRequestId = useRef(0);
    const [activeTab, setActiveTab] = useState("mine");

    const [showCreate, setShowCreate] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const [formName, setFormName] = useState("");
    const [formPublic, setFormPublic] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!user) return;

        let isMounted = true;

        const loadCollections = async () => {
            try {
                const res = await axios.get("/api/collections");
                if (isMounted) {
                    const list = Array.isArray(res.data)
                        ? res.data
                        : res.data?.collections || [];
                    setCollections(list);
                }
            } catch (err) {
                console.error("Error fetching collections:", err);
                if (isMounted) {
                    setCollections([]);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadCollections();

        return () => {
            isMounted = false;
        };
    }, [user]);

    useEffect(() => {
        if (!user) return undefined;

        const controller = new AbortController();
        axios.get("/api/collections/followed", { signal: controller.signal })
            .then(({ data }) => {
                setFollowedError("");
                setFollowedCollections(Array.isArray(data?.collections) ? data.collections : []);
            })
            .catch((error) => {
                if (!axios.isCancel(error)) {
                    setFollowedError(error.response?.data?.message || "Unable to load followed collections.");
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) setFollowedLoading(false);
            });

        return () => controller.abort();
    }, [user]);

    const handleSearch = async (event) => {
        event?.preventDefault();
        const query = searchQuery.trim();
        if (query.length < 2) {
            setSearchError("Enter at least 2 characters, or paste a public collection link.");
            setSearchResults([]);
            return;
        }
        setSearchLoading(true);
        setSearchError("");
        const requestId = ++searchRequestId.current;
        try {
            const { data } = await axios.get("/api/collections/search-public", { params: { q: query } });
            if (requestId === searchRequestId.current) {
                setSearchResults(Array.isArray(data?.collections) ? data.collections : []);
                if (!data?.collections?.length) setSearchError("No public collections found for that user or link.");
            }
        } catch (error) {
            if (requestId === searchRequestId.current) {
                setSearchError(error.response?.data?.message || "Unable to search public collections.");
                setSearchResults([]);
            }
        } finally {
            if (requestId === searchRequestId.current) setSearchLoading(false);
        }
    };

    const handleToggleFollow = async (col) => {
        const isFollowed = Boolean(col.is_followed) || followedCollections.some((item) => item.id === col.id);
        try {
            if (isFollowed) {
                await axios.delete(`/api/collections/${col.id}/follow`);
                setFollowedCollections((prev) => prev.filter((item) => item.id !== col.id));
                setSearchResults((prev) => prev.map((item) => item.id === col.id ? { ...item, is_followed: false } : item));
            } else {
                await axios.post(`/api/collections/${col.id}/follow`);
                const followed = { ...col, is_followed: true };
                setFollowedCollections((prev) => [followed, ...prev.filter((item) => item.id !== col.id)]);
                setSearchResults((prev) => prev.map((item) => item.id === col.id ? { ...item, is_followed: true } : item));
            }
        } catch (error) {
            alert(error.response?.data?.message || "Unable to update followed collections.");
        }
    };

    const openCreateModal = () => {
        setFormName("");
        setFormPublic(false);
        setShowCreate(true);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!formName.trim()) return;
        setSaving(true);
        try {
            const res = await axios.post("/api/collections", {
                name: formName.trim(),
                is_public: formPublic,
            });
            const createdCol = res.data?.collection ?? res.data;
            if (createdCol && createdCol.id) {
                setCollections((prev) => [
                    { item_count: 0, ...createdCol },
                    ...prev,
                ]);
            } else {
                const refreshRes = await axios.get("/api/collections");
                const list = Array.isArray(refreshRes.data)
                    ? refreshRes.data
                    : refreshRes.data?.collections || [];
                setCollections(list);
            }
            setShowCreate(false);
            setFormName("");
            setFormPublic(false);
        } catch (err) {
            alert(err.response?.data?.message ?? "Failed to create collection.");
        } finally {
            setSaving(false);
        }
    };

    const openEdit = (col) => {
        setEditTarget(col);
        setFormName(col.name || "");
        setFormPublic(Boolean(col.is_public));
    };

    const handleEdit = async (e) => {
        e.preventDefault();
        if (!editTarget || !formName.trim()) return;
        setSaving(true);
        try {
            const res = await axios.patch(`/api/collections/${editTarget.id}`, {
                name: formName.trim(),
                is_public: formPublic,
            });
            const updatedData = res.data?.collection ?? res.data;
            setCollections((prev) =>
                prev.map((c) =>
                    c.id === editTarget.id
                        ? {
                              ...c,
                              ...(typeof updatedData === "object" ? updatedData : {}),
                              name: formName.trim(),
                              is_public: formPublic,
                          }
                        : c
                )
            );
            setEditTarget(null);
        } catch (err) {
            alert(err.response?.data?.message ?? "Failed to update.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setSaving(true);
        try {
            await axios.delete(`/api/collections/${deleteTarget.id}`);
            setCollections((prev) => prev.filter((c) => c.id !== deleteTarget.id));
            setDeleteTarget(null);
        } catch (err) {
            alert(err.response?.data?.message ?? "Failed to delete.");
        } finally {
            setSaving(false);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen px-4 pt-24">
                <div className="sticky top-20 z-40 mx-auto flex max-w-6xl items-center justify-between gap-4 border-y border-white/10 bg-linear-to-r from-[#251329]/95 via-[#30204a]/95 to-[#4a214b]/90 px-4 py-4 backdrop-blur-md">
                    <h1 className="text-3xl font-bold text-white">My Collections</h1>
                    <Link
                        to="/login"
                        className="mr-3 inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#EFAC61] px-4 py-2.5 font-semibold text-[#17152a] shadow-lg shadow-black/20 transition hover:bg-[#f3bd7f]"
                    >
                        <Plus className="h-5 w-5" /> Add Collection
                    </Link>
                </div>
                <div className="mt-16 flex justify-center">
                    <div className="text-center">
                    <p className="text-white text-xl mb-4">
                        Please log in to view your collections.
                    </p>
                    <Link
                        to="/login"
                        className="bg-black text-white px-6 py-3 rounded-xl hover:bg-neutral-800 transition font-medium inline-block"
                    >
                        Login
                    </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 max-w-6xl mx-auto">
            <div className="sticky top-20 z-40 mb-5 flex items-center justify-between border-y border-white/10 bg-linear-to-r from-[#251329]/95 via-[#30204a]/95 to-[#4a214b]/90 px-4 py-4 backdrop-blur-md">
                <h1 className="text-3xl font-bold text-white">{activeTab === "mine" ? "My Collections" : "Followed Collections"}</h1>
                {activeTab === "mine" && <button
                    type="button"
                    onClick={openCreateModal}
                    className="mr-3 flex items-center gap-2 rounded-xl bg-[#EFAC61] px-4 py-2.5 font-semibold text-[#17152a] shadow-lg shadow-black/20 transition hover:bg-[#f3bd7f]"
                >
                    <Plus className="w-5 h-5" /> Add Collection
                </button>}
            </div>

            <div className="mb-8 flex gap-2 border-b border-white/10">
                <button type="button" onClick={() => setActiveTab("mine")} className={`border-b-2 px-4 py-3 text-sm font-semibold transition ${activeTab === "mine" ? "border-[#EFAC61] text-white" : "border-transparent text-neutral-400 hover:text-white"}`}>
                    My Collections
                </button>
                <button type="button" onClick={() => setActiveTab("followed")} className={`border-b-2 px-4 py-3 text-sm font-semibold transition ${activeTab === "followed" ? "border-[#EFAC61] text-white" : "border-transparent text-neutral-400 hover:text-white"}`}>
                    Followed Collections
                </button>
            </div>

            {activeTab === "followed" && (
                <section className="mb-8 rounded-2xl border border-white/10 bg-neutral-950/60 p-4 sm:p-5">
                    <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
                        <label className="relative flex-1">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
                            <input
                                value={searchQuery}
                                onChange={(event) => {
                                    searchRequestId.current += 1;
                                    setSearchQuery(event.target.value);
                                    setSearchResults([]);
                                    setSearchError("");
                                    setSearchLoading(false);
                                }}
                                placeholder="Search username or paste a public collection link"
                                className="w-full rounded-xl border border-white/10 bg-neutral-900 py-3 pl-10 pr-4 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#9596D6]"
                            />
                        </label>
                        <button type="submit" disabled={searchLoading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#303969] px-5 py-3 font-medium text-white transition hover:bg-[#414b82] disabled:opacity-60">
                            <Search className="h-4 w-4" /> {searchLoading ? "Searching..." : "Find Collections"}
                        </button>
                    </form>
                    {searchError && <p role="status" className="mt-3 text-sm text-neutral-300">{searchError}</p>}
                    {searchResults.length > 0 && (
                        <div className="mt-5">
                            <h2 className="mb-3 text-lg font-semibold text-white">Search results</h2>
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                {searchResults.map((col) => (
                                    <CollectionCard key={col.id} col={col} shared currentUsername={user.username} isFollowed={Boolean(col.is_followed)} onToggleFollow={handleToggleFollow} />
                                ))}
                            </div>
                        </div>
                    )}
                </section>
            )}

            {(activeTab === "mine" ? loading : followedLoading) ? (
                <p className="text-white text-center text-lg">Loading...</p>
            ) : (activeTab === "mine" ? collections : followedCollections).length === 0 ? (
                <div className="text-center py-20">
                    <BookMarked className="mx-auto mb-4 h-16 w-16 text-neutral-500" />
                    <p className="mb-6 text-lg text-neutral-400">
                        {activeTab === "mine" ? "You have no collections yet." : "You are not following any collections yet. Search for a user or paste a public collection link above."}
                    </p>
                    {activeTab === "mine" && <button
                        type="button"
                        onClick={openCreateModal}
                        className="rounded-xl bg-[#303969] px-6 py-3 font-medium text-white transition hover:bg-[#414b82]"
                    >
                        Create your first collection
                    </button>}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {(activeTab === "mine" ? collections : followedCollections).map((col) => (
                        <CollectionCard
                            key={col.id}
                            col={col}
                            shared={activeTab === "followed"}
                            isFollowed={activeTab === "followed"}
                            onToggleFollow={activeTab === "followed" ? handleToggleFollow : undefined}
                            currentUsername={user.username}
                            onDelete={activeTab === "mine" ? setDeleteTarget : undefined}
                            onEdit={activeTab === "mine" ? openEdit : undefined}
                        />
                    ))}
                </div>
            )}
            {activeTab === "followed" && followedError && <p role="alert" className="mt-4 rounded-lg bg-red-950/50 p-3 text-sm text-red-200">{followedError}</p>}

            {showCreate && (
                <Modal title="Add Collection" onClose={() => setShowCreate(false)}>
                    <form onSubmit={handleCreate} className="flex flex-col gap-4">
                        <input
                            type="text"
                            placeholder="Collection name"
                            required
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            className="rounded-xl border border-white/10 bg-neutral-900 px-4 py-3 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#9596D6]"
                        />
                        <label className="flex items-center gap-3 text-gray-300 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={formPublic}
                                onChange={(e) => setFormPublic(e.target.checked)}
                            className="h-4 w-4 accent-[#9596D6]"
                            />
                            Make public (shareable link)
                        </label>
                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-xl bg-[#303969] py-3 font-medium text-white transition hover:bg-[#414b82] disabled:opacity-50"
                        >
                            {saving ? "Creating..." : "Create"}
                        </button>
                    </form>
                </Modal>
            )}

            {editTarget && (
                <Modal title="Edit Collection" onClose={() => setEditTarget(null)}>
                    <form onSubmit={handleEdit} className="flex flex-col gap-4">
                        <input
                            type="text"
                            placeholder="Collection name"
                            required
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            className="rounded-xl border border-white/10 bg-neutral-900 px-4 py-3 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#9596D6]"
                        />
                        <label className="flex items-center gap-3 text-gray-300 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={formPublic}
                                onChange={(e) => setFormPublic(e.target.checked)}
                            className="h-4 w-4 accent-[#9596D6]"
                            />
                            Make public (shareable link)
                        </label>
                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-xl bg-[#303969] py-3 font-medium text-white transition hover:bg-[#414b82] disabled:opacity-50"
                        >
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </form>
                </Modal>
            )}

            {deleteTarget && (
                <Modal title="Delete Collection" onClose={() => setDeleteTarget(null)}>
                    <p className="text-gray-300 mb-6">
                        Are you sure you want to delete{" "}
                        <span className="text-white font-semibold">
                            "{deleteTarget.name}"
                        </span>
                        ? This cannot be undone.
                    </p>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => setDeleteTarget(null)}
                            className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-medium transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={saving}
                            onClick={handleDelete}
                            className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white py-3 rounded-xl font-medium transition"
                        >
                            {saving ? "Deleting..." : "Delete"}
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default CollectionsPage;
