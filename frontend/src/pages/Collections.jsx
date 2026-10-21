import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import {
    Plus, Trash2, Lock, Globe, Copy, Check,
    BookMarked, ChevronRight, X, Pencil
} from "lucide-react";

const Modal = ({ title, onClose, children }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
        <div className="bg-neutral-800 rounded-2xl w-full max-w-md shadow-2xl">
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

const CollectionCard = ({ col, onDelete, onEdit }) => {
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

    return (
        <div className="group flex flex-col gap-3 rounded-2xl border border-[#66568f] bg-gradient-to-br from-[#211d35] via-[#211d35] to-[#30203f] p-5 shadow-lg shadow-black/20 transition hover:border-[#9596D6] hover:from-[#28213f] hover:to-[#382247]">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
                <button
                    type="button"
                    onClick={() => navigate(`/collections/${col.id}`)}
                    className="line-clamp-2 text-left text-base font-bold text-[#f5f1ff] transition hover:text-[#EFAC61]"
                >
                    {col.name}
                </button>
                <div className="flex gap-1 shrink-0">
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
                </div>
            </div>

            {previewItems.length > 0 ? (
                <div className="flex min-h-[76px] items-center gap-1.5 overflow-hidden" aria-label="Collection movie previews">
                    {previewItems.map((item, index) => {
                        const extraCount = Math.max(0, itemCount - previewItems.length);
                        const showMoreOverlay = index === previewItems.length - 1 && extraCount > 0;

                        return (
                            <div
                                key={item.id}
                                className="relative h-[72px] w-12 shrink-0 overflow-hidden rounded-md border border-white/10 bg-[#171526]"
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
                <div className="flex min-h-[76px] items-center gap-3 rounded-xl border border-dashed border-[#66568f]/70 bg-black/10 px-3 text-sm text-[#aaa3bc]">
                    <BookMarked className="h-5 w-5 shrink-0 text-[#9596D6]" />
                    No movies added yet
                </div>
            )}

            <div className="flex items-center gap-3 text-sm text-[#c9c2d8]">
                <span className="flex items-center gap-1">
                    <BookMarked className="w-4 h-4" />
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
                    onClick={() => navigate(`/collections/${col.id}`)}
                    className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-[#303969] py-2 text-sm font-medium text-white transition hover:bg-[#414b82]"
                >
                    View <ChevronRight className="w-4 h-4" />
                </button>
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
                <div className="sticky top-20 z-40 mx-auto flex max-w-6xl items-center justify-between gap-4 border-b border-white/10 bg-[#141b39]/95 px-4 py-4 backdrop-blur-md">
                    <h1 className="text-3xl font-bold text-white">My Collections</h1>
                    <Link
                        to="/login"
                        className="mr-3 inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#EFAC61] px-4 py-2.5 font-semibold text-[#17152a] shadow-lg shadow-black/20 transition hover:bg-[#f3bd7f]"
                    >
                        <Plus className="h-5 w-5" /> New Collection
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
            <div className="sticky top-20 z-40 mb-8 flex items-center justify-between border-b border-white/10 bg-[#141b39]/95 px-4 py-4 backdrop-blur-md">
                <h1 className="text-3xl font-bold text-white">My Collections</h1>
                <button
                    type="button"
                    onClick={openCreateModal}
                    className="mr-3 flex items-center gap-2 rounded-xl bg-[#EFAC61] px-4 py-2.5 font-semibold text-[#17152a] shadow-lg shadow-black/20 transition hover:bg-[#f3bd7f]"
                >
                    <Plus className="w-5 h-5" /> New Collection
                </button>
            </div>

            {loading ? (
                <p className="text-white text-center text-lg">Loading...</p>
            ) : collections.length === 0 ? (
                <div className="text-center py-20">
                    <BookMarked className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg mb-6">
                        You have no collections yet.
                    </p>
                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="bg-black hover:bg-neutral-800 text-white px-6 py-3 rounded-xl font-medium transition"
                    >
                        Create your first collection
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {collections.map((col) => (
                        <CollectionCard
                            key={col.id}
                            col={col}
                            onDelete={setDeleteTarget}
                            onEdit={openEdit}
                        />
                    ))}
                </div>
            )}

            {showCreate && (
                <Modal title="New Collection" onClose={() => setShowCreate(false)}>
                    <form onSubmit={handleCreate} className="flex flex-col gap-4">
                        <input
                            type="text"
                            placeholder="Collection name"
                            required
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            className="bg-neutral-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                        />
                        <label className="flex items-center gap-3 text-gray-300 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={formPublic}
                                onChange={(e) => setFormPublic(e.target.checked)}
                                className="w-4 h-4 accent-blue-500"
                            />
                            Make public (shareable link)
                        </label>
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-black hover:bg-neutral-800 disabled:opacity-50 text-white py-3 rounded-xl font-medium transition"
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
                            className="bg-neutral-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                        />
                        <label className="flex items-center gap-3 text-gray-300 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={formPublic}
                                onChange={(e) => setFormPublic(e.target.checked)}
                                className="w-4 h-4 accent-blue-500"
                            />
                            Make public (shareable link)
                        </label>
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-black hover:bg-neutral-800 disabled:opacity-50 text-white py-3 rounded-xl font-medium transition"
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
