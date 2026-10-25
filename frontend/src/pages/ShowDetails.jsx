import axios from "axios";
import { useEffect, useState } from "react";
import LoadingPlaceHolder from "../components/LoadingScreen";
import { Link, useParams } from "react-router-dom";
import PlaceholderCover from "../assets/placeholder_image.jpg"
import RoleCard from "../components/DetailComponents/RoleCard";
import { BookMarked, Check, Globe, Lock, LoaderCircle, Plus, X } from "lucide-react";
import ReviewSection from "../components/DetailComponents/ReviewSection";



const watchlistStatuses = [
    { value: "wishlist", label: "Want to watch" },
    { value: "watching", label: "Watching" },
    { value: "watched", label: "Watched" },
    { value: "rewatching", label: "Rewatching" },
    { value: "on_hold", label: "On hold" },
    { value: "dropped", label: "Dropped" },
];

function captitalizeText(text){
    if(!text || typeof text !== "string")  return "N/A";
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatDate(dateVal){
    if (!dateVal) return "N/A";
    return new Date(dateVal).toLocaleDateString("en-US", {year: "numeric", month: "short", "day": "numeric"});
}

function formatDuration( duration, episodeCount ){
    if (!duration) return "N/A";
    return episodeCount > 1 ? `${duration} minute per ep. (Total ${duration * episodeCount} minutes)` : `${duration} minutes`;
}

function ShowDetails( {user} ) {

    const { showId } = useParams();
    const [showInfo, setShowInfo ] = useState({});
    const [isLoading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [refresh, setRefresh] = useState(false);
    const [collectionPickerOpen, setCollectionPickerOpen] = useState(false);
    const [userCollections, setUserCollections] = useState([]);
    const [selectedCollectionIds, setSelectedCollectionIds] = useState([]);
    const [collectionsLoading, setCollectionsLoading] = useState(false);
    const [savingToCollections, setSavingToCollections] = useState(false);
    const [collectionError, setCollectionError] = useState("");
    const [collectionSuccess, setCollectionSuccess] = useState("");
    const [watchlistPickerOpen, setWatchlistPickerOpen] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState("wishlist");
    const [currentWatchlistItem, setCurrentWatchlistItem] = useState(null);
    const [watchlistLoading, setWatchlistLoading] = useState(false);
    const [savingWatchlist, setSavingWatchlist] = useState(false);
    const [watchlistError, setWatchlistError] = useState("");
    const [savedWatchlistStatus, setSavedWatchlistStatus] = useState("");

    const openWatchlistSelection = async () => {
        setWatchlistPickerOpen(true);
        setWatchlistError("");
        setSavedWatchlistStatus("");
        setCurrentWatchlistItem(null);
        setSelectedStatus("wishlist");

        if (!user) return;

        setWatchlistLoading(true);
        try {
            const { data } = await axios.get("/api/watchlist");
            const items = Array.isArray(data?.items) ? data.items : [];
            const existingItem = items.find((item) => Number(item.show_id) === Number(showId));
            setCurrentWatchlistItem(existingItem || null);
            if (existingItem) setSelectedStatus(existingItem.status);
        } catch (requestError) {
            setWatchlistError(requestError.response?.data?.message || "Unable to load your watchlist.");
        } finally {
            setWatchlistLoading(false);
        }
    };

    const saveWatchlistStatus = async () => {
        if (!user) return;

        setSavingWatchlist(true);
        setWatchlistError("");
        try {
            if (currentWatchlistItem) {
                await axios.put(`/api/watchlist/${showId}`, { status: selectedStatus });
            } else {
                await axios.post("/api/watchlist", { show_id: Number(showId), status: selectedStatus });
            }
            setCurrentWatchlistItem({ show_id: Number(showId), status: selectedStatus });
            setSavedWatchlistStatus(selectedStatus);
        } catch (requestError) {
            setWatchlistError(requestError.response?.data?.message || "Unable to update your watchlist.");
        } finally {
            setSavingWatchlist(false);
        }
    };

    const openCollectionSelection = async () => {
        setCollectionPickerOpen(true);
        setSelectedCollectionIds([]);
        setCollectionError("");
        setCollectionSuccess("");
        if (!user) {
            setCollectionError("Please log in to add this title to a collection.");
            return;
        }

        setCollectionsLoading(true);
        try {
            const { data } = await axios.get("/api/collections");
            const collections = Array.isArray(data?.collections) ? data.collections : Array.isArray(data) ? data : [];
            setUserCollections(collections);
        } catch (requestError) {
            setCollectionError(requestError.response?.data?.message || "Unable to load your collections.");
            setUserCollections([]);
        } finally {
            setCollectionsLoading(false);
        }
    };

    const toggleSelectedCollection = (collectionId) => {
        setSelectedCollectionIds((current) => current.includes(collectionId)
            ? current.filter((id) => id !== collectionId)
            : [...current, collectionId]);
    };

    const addShowToSelectedCollections = async () => {
        if (!selectedCollectionIds.length) {
            setCollectionError("Choose at least one collection.");
            return;
        }

        setSavingToCollections(true);
        setCollectionError("");
        setCollectionSuccess("");
        const results = await Promise.allSettled(selectedCollectionIds.map((collectionId) =>
            axios.post(`/api/collections/${collectionId}/items`, { show_id: Number(showId) })
        ));
        const addedCount = results.filter((result) => result.status === "fulfilled").length;
        const duplicateCount = results.filter((result) => result.status === "rejected" && result.reason?.response?.status === 409).length;
        const failedCount = results.length - addedCount - duplicateCount;

        if (addedCount) {
            const noun = addedCount === 1 ? "collection" : "collections";
            setCollectionSuccess(`Added to ${addedCount} ${noun}.`);
        }
        if (duplicateCount || failedCount) {
            const messages = [];
            if (duplicateCount) messages.push(`${duplicateCount} already contained this title`);
            if (failedCount) messages.push(`${failedCount} could not be updated`);
            setCollectionError(`${messages.join("; ")}.`);
        }
        if (!addedCount && !duplicateCount && !failedCount) {
            setCollectionError("Unable to add this title to the selected collections.");
        }
        setSavingToCollections(false);
    };

    const refreshPage = () => setRefresh((refresh) => !refresh);

    useEffect(() => {
        let active = true;
        const controller = new AbortController();
        axios.get(`/api/shows/${showId}`, { signal: controller.signal })
            .then((res) => {
                if (active) setShowInfo(res.data);
            })
            .catch((requestError) => {
                if (!axios.isCancel(requestError) && active) setError(true);
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
            controller.abort();
        };
    }, [showId, refresh]);

    useEffect(() => {
        if (!watchlistPickerOpen) return undefined;
        const handleKeyDown = (event) => {
            if (event.key === "Escape") setWatchlistPickerOpen(false);
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [watchlistPickerOpen]);

    if (isLoading) {
        return (
            <LoadingPlaceHolder className="relative w-full h-screen bg-neutral-900"/>
        );
    }

    if (error) {
        return (
            <main className="container mx-auto flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center text-white">
                <p className="text-xl font-semibold">Unable to load this title.</p>
                <Link to="/" className="font-medium text-[#EFAC61] hover:underline">Return home</Link>
            </main>
        );
    }

    return (
        <>
        <main className="container mx-auto px-4 py-6">
            <div className="pt-24 px-2 bg-neutral-900/95">
                <div className="overflow-hidden w-full h-full rounded-lg ">
                    <header className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                        <div>
                            <p className="text-xd text-neutral-500 mb-1">{showInfo.type.toUpperCase() ?? showInfo.title}</p>
                            <h1 className="text-2xl md:text-3xl font-bold text-white">{showInfo.title}</h1>
                        </div>
                    </header>

                    <div className="grid gap-6 p-5 md:grid-cols-[14rem_1fr]">
                        {/* Sidebar */}
                        <aside className="space-y-6 ">
                            <div className="space-y-2">
                                <img src={showInfo.poster_url ?? PlaceholderCover} alt={showInfo.title} loading="lazy"
                                className="object-cover w-full aspect-2/3"/>
                                <button type="button"
                                onClick={openWatchlistSelection}
                                className="flex w-full items-center justify-center gap-2 rounded-md bg-[#303969] py-2 text-sm font-semibold text-white transition-all hover:bg-[#414b82]">
                                <Plus className="h-4 w-4" /> Add to Watchlist
                                </button>
                                <button type="button"
                                onClick={openCollectionSelection}
                                className="flex w-full items-center justify-center gap-2 rounded-md bg-[#303969] py-2 text-sm font-semibold text-white transition-all hover:bg-[#414b82]">
                                <Plus className="h-4 w-4" /> Add to Collection
                                </button>
                            </div>

                            <section>
                                <div className="flex items-end justify-between border-b border-neutral-700 pb-1 mb-3 text-white">
                                    Informations
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-sm text-neutral-300">
                                        <span className="text-neutral-500">Type: </span>
                                        {captitalizeText(showInfo.type)}
                                    </p>
                                    <p className="text-sm text-neutral-300">
                                        <span className="text-neutral-500">Episodes: </span>
                                        {showInfo.episode_count?? "N/A"}
                                    </p>
                                    <p className="text-sm text-neutral-300">
                                        <span className="text-neutral-500">Status: </span>
                                        {captitalizeText(showInfo.status)}
                                    </p>
                                    <p className="text-sm text-neutral-300">
                                        <span className="text-neutral-500">Released: </span>
                                        {formatDate(showInfo.release_date)}
                                    </p>
                                    <p className="text-sm text-neutral-300">
                                        <span className="text-neutral-500">Duration: </span>
                                        {formatDuration(showInfo.duration, showInfo.episode_count)}
                                    </p>
                                </div>
                            </section>

                            <section>
                                <div className="flex items-end justify-between border-b border-neutral-700 pb-1 mb-3 text-white">
                                    Available On
                                </div>
                                {showInfo.platforms.length > 0 ? 
                                    (
                                        <ul className="space-y-2">
                                            {showInfo.platforms.map((p) => (
                                                <li key={p.id}>
                                                    <a href={p.url} target="_blank" rel="noreferred"
                                                    className="flex items-center gap-2 text-sm text-neutral-300">
                                                        <img src={p.logo_url ?? PlaceholderCover} alt={showInfo.title} loading="lazy"
                                                        className="object-cover size-6"/>
                                                        <span className={`flex-1 truncate ${p.url ? "underline" : ""}`}>{p.name}</span>
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-neural-500">Not listed in database yet!</p>
                                    )}
                            </section>
                        </aside>
                        {/* Main */}
                        <div className="min-w-0 space-y-8">
                            <section className="relative overflow-hidden min-h-100 flex flex-wrap items-center gap-x-8 gap-y-3 rounded-md bg-neutral-800 p-4">
                            {showInfo.backdrop_url && (
                                <div className="absolute inset-y-0 right-0 w-3/4 overflow-hidden">
                                    <img src={showInfo.backdrop_url} className="h-full w-full object-cover object-center" />
                                    <div className="absolute inset-0 bg-linear-to-r from-neutral-800 from-10% to-transparent to-75%" />

                                </div>
                            )}
                                <div className="relative w-1/3 flex flex-wrap items-center justify-left gap-x-10 gap-y-5">
                                    <div className="relative z-10 flex flex-col items-center justify-between">
                                        <p className="text-m font-semibold text-white bg-[#EFAC61] px-3 py-1">SCORE</p>
                                        <p className="flex item-center gap-1 text-3xl pt-1 font-bold text-white">{showInfo.avg_score ?? "N/A"}</p>
                                        <p className="text-m text-white">{showInfo.review_count} reviews</p>
                                    </div>
                                    <div className="relative z-10 flex flex-col items-center">
                                        <p className="text-m font-semibold text-white bg-[#303969] px-3 py-1">RATING</p>
                                        <p className="flex item-center gap-1 text-3xl pt-1 font-bold text-white mb-6">{showInfo.content_rating ?? "N/A"}</p>
                                    </div>
                                </div>
                            </section>
                                <div className="flex items-end justify-between border-b border-neutral-700 pb-1 mb-3 text-white">
                                    Synopsis
                                </div>
                                <p className="max-w-3xl text-sm leading-relaxed text-neutral-300">
                                    {showInfo.synopsis ?? "No synopsis found for this shows!"}
                                </p>

                            <section>
                                <div className="flex items-end justify-between border-b border-neutral-700 pb-1 mb-3 text-white">
                                    Casts
                                </div>
                                <div className="space-y-5">
                                    {showInfo.cast.length > 0 && (
                                        <div className="grid gap-2 lg:grid-cols-2">
                                            {showInfo.cast.map((c) => <RoleCard key={c.role_id} role={c}/>)}
                                        </div>
                                    )}
                                </div>
                            </section>

                            <section>
                                <div className="flex items-end justify-between border-b border-neutral-700 pb-1 mb-3 text-white">
                                    Crews
                                </div>
                                <div className="space-y-5">
                                    {showInfo.crew.length > 0 && (
                                        <div className="grid gap-2 lg:grid-cols-2">
                                            {showInfo.crew.map((c) => <RoleCard key={c.role_id} role={c}/>)}
                                        </div>
                                    )}
                                </div>
                            </section>
                                <div className="flex items-end justify-between border-b border-neutral-700 pb-1 mb-3 text-white">
                                    Reviews
                                </div>
                                <ReviewSection showId={showId} user={user} onUpdated={refreshPage} />
                            <section>

                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </main>
        {collectionPickerOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
                <section role="dialog" aria-modal="true" aria-labelledby="collection-picker-title" className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[#66568f] bg-[#1c1a2b] shadow-2xl shadow-black/50">
                    <header className="flex items-start justify-between gap-4 border-b border-white/10 bg-linear-to-r from-[#251329] via-[#30204a] to-[#4a214b] px-5 py-4">
                        <div className="min-w-0 flex-1">
                            <h2 id="collection-picker-title" className="text-xl font-bold text-white">Add to Collection</h2>
                            <p className="mt-1 break-words text-sm text-[#c9c2d8]">Choose one or more collections for {showInfo.title}.</p>
                        </div>
                        <button type="button" onClick={() => setCollectionPickerOpen(false)} aria-label="Close" className="mt-0.5 ml-3 shrink-0 rounded-lg p-2 text-neutral-300 transition hover:bg-white/10 hover:text-white">
                            <X className="h-5 w-5" />
                        </button>
                    </header>

                    <div className="min-h-0 flex-1 overflow-y-auto p-5">
                        {collectionsLoading ? (
                            <p className="flex items-center justify-center gap-2 py-10 text-neutral-300"><LoaderCircle className="h-5 w-5 animate-spin" /> Loading collections...</p>
                        ) : !user ? (
                            <p className="py-6 text-center text-neutral-300">Please <Link to="/login" onClick={() => setCollectionPickerOpen(false)} className="font-semibold text-[#EFAC61] hover:underline">log in</Link> to add this title to your collections.</p>
                        ) : userCollections.length === 0 ? (
                            <div className="py-6 text-center">
                                <BookMarked className="mx-auto h-9 w-9 text-[#9596D6]" />
                                <p className="mt-3 text-neutral-300">You have no collections yet.</p>
                                <Link to="/collections" onClick={() => setCollectionPickerOpen(false)} className="mt-3 inline-block font-semibold text-[#EFAC61] hover:underline">Create a collection</Link>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {userCollections.map((collection) => {
                                    const selected = selectedCollectionIds.includes(collection.id);
                                    return (
                                        <label key={collection.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${selected ? "border-[#EFAC61]/70 bg-[#EFAC61]/10" : "border-white/10 bg-black/15 hover:border-[#66568f] hover:bg-white/5"}`}>
                                            <input type="checkbox" checked={selected} onChange={() => toggleSelectedCollection(collection.id)} className="h-4 w-4 accent-[#EFAC61]" />
                                            <span className="min-w-0 flex-1 truncate font-medium text-white">{collection.name}</span>
                                            <span className="flex shrink-0 items-center gap-1 text-xs text-[#c9c2d8]">
                                                {collection.is_public ? <Globe className="h-3.5 w-3.5 text-green-400" /> : <Lock className="h-3.5 w-3.5 text-[#9596D6]" />}
                                                {collection.is_public ? "Public" : "Private"}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                        {collectionError && <p role="alert" className="mt-4 rounded-lg border border-red-400/20 bg-red-950/40 p-3 text-sm text-red-200">{collectionError}</p>}
                        {collectionSuccess && <p role="status" className="mt-4 flex items-center gap-2 rounded-lg border border-green-400/20 bg-green-950/30 p-3 text-sm text-green-200"><Check className="h-4 w-4" />{collectionSuccess}</p>}
                    </div>

                    {user && userCollections.length > 0 && !collectionsLoading && (
                        <footer className="flex items-center justify-between gap-3 border-t border-white/10 bg-black/10 px-5 py-4">
                            <span className="text-sm text-neutral-400">{selectedCollectionIds.length} selected</span>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setCollectionPickerOpen(false)} className="rounded-xl border border-white/15 px-4 py-2 text-sm text-neutral-200 transition hover:bg-white/5">Close</button>
                                <button type="button" onClick={addShowToSelectedCollections} disabled={savingToCollections || !selectedCollectionIds.length} className="inline-flex items-center gap-2 rounded-xl bg-[#EFAC61] px-4 py-2 text-sm font-semibold text-[#17152a] transition hover:bg-[#f3bd7f] disabled:cursor-not-allowed disabled:opacity-50">
                                    {savingToCollections ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                    Add to selected
                                </button>
                            </div>
                        </footer>
                    )}
                </section>
            </div>
        )}
        {watchlistPickerOpen && (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
                onMouseDown={(event) => {
                    if (event.target === event.currentTarget) setWatchlistPickerOpen(false);
                }}
            >
                <section
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="details-watchlist-title"
                    className="flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-[#66568f] bg-[#1c1a2b] text-white shadow-2xl shadow-black/50"
                >
                    <header className="flex items-start justify-between gap-4 border-b border-white/10 bg-linear-to-r from-[#251329] via-[#30204a] to-[#4a214b] px-5 py-3">
                        <div className="min-w-0 flex-1">
                            <h2 id="details-watchlist-title" className="text-xl font-bold">Add to Watchlist</h2>
                            <p className="mt-1 break-words text-sm text-[#c9c2d8]">{showInfo.title}</p>
                            <p className="mt-2 text-sm text-neutral-300">Choose one status for this title:</p>
                        </div>
                        <button type="button" onClick={() => setWatchlistPickerOpen(false)} aria-label="Close" className="ml-3 shrink-0 rounded-lg p-2 text-neutral-300 transition hover:bg-white/10 hover:text-white">
                            <X className="h-5 w-5" />
                        </button>
                    </header>

                    {!user ? (
                        <div className="p-5">
                            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                                <p className="text-sm text-neutral-300">Sign in to add titles to your Watchlist.</p>
                                <Link to="/login" onClick={() => setWatchlistPickerOpen(false)} className="mt-4 inline-block rounded-lg bg-[#EFAC61] px-4 py-2 font-semibold text-[#171522] transition hover:bg-[#f4bd7c]">
                                    Sign in
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="min-h-0 flex-1 p-4">
                                <div role="radiogroup" aria-label="Watchlist status" className="grid gap-2">
                                    {watchlistStatuses.map((status) => {
                                        const isSelected = selectedStatus === status.value;
                                        return (
                                            <button
                                                key={status.value}
                                                type="button"
                                                role="radio"
                                                aria-checked={isSelected}
                                                disabled={watchlistLoading || savingWatchlist}
                                                onClick={() => {
                                                    setSelectedStatus(status.value);
                                                    setSavedWatchlistStatus("");
                                                }}
                                                className={`flex min-h-[52px] items-center gap-3 rounded-2xl border px-4 py-2 text-left text-sm font-medium transition ${isSelected ? "border-[#7770a8] bg-[#252333] text-white" : "border-white/10 bg-[#17161f] text-neutral-300 hover:border-[#7770a8] hover:bg-[#211f2b]"} disabled:cursor-wait disabled:opacity-60`}
                                            >
                                                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border ${isSelected ? "border-[#EFAC61] bg-[#EFAC61] text-[#171522]" : "border-white/50 bg-white"}`}>
                                                    {isSelected && <Check className="h-4 w-4" />}
                                                </span>
                                                <span className="flex-1 text-base font-semibold">{status.label}</span>
                                                {isSelected && <span className="text-xs font-medium text-[#c7c4dc]">Selected</span>}
                                            </button>
                                        );
                                    })}
                                </div>

                                {watchlistLoading && <p className="mt-3 text-sm text-neutral-400">Checking your Watchlist…</p>}
                                {watchlistError && <p role="alert" className="mt-3 text-sm text-red-300">{watchlistError}</p>}
                                {savedWatchlistStatus && <p role="status" className="mt-3 text-sm text-emerald-300">Added to {watchlistStatuses.find((status) => status.value === savedWatchlistStatus)?.label}.</p>}
                            </div>

                            <footer className="flex justify-end gap-2 border-t border-white/10 bg-black/10 px-5 py-3">
                                <button type="button" onClick={() => setWatchlistPickerOpen(false)} className="rounded-xl border border-white/15 px-4 py-2 text-sm text-neutral-200 transition hover:bg-white/5">
                                    Cancel
                                </button>
                                <button type="button" onClick={saveWatchlistStatus} disabled={watchlistLoading || savingWatchlist} className="inline-flex items-center gap-2 rounded-xl bg-[#EFAC61] px-4 py-2 text-sm font-semibold text-[#171522] transition hover:bg-[#f3bd7f] disabled:cursor-not-allowed disabled:opacity-50">
                                    {savingWatchlist && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                    {currentWatchlistItem ? "Save status" : "Add to Watchlist"}
                                </button>
                            </footer>
                        </>
                    )}
                </section>
            </div>
        )}
        </>
    )
}

export default ShowDetails;
