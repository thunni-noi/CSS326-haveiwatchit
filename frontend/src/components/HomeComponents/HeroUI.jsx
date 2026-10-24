import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Check, Clapperboard as ClapperBoardIcon, LoaderCircle, Plus as AddWatchIcon, Star as StarIcon, X } from "lucide-react";
import ErrorDisplay from "../ErrorDisplay";

const AUTOMOVE_MS = 10000; // 10 sec

const watchlistStatuses = [
    { value: "wishlist", label: "Want to watch" },
    { value: "watching", label: "Watching" },
    { value: "watched", label: "Watched" },
    { value: "rewatching", label: "Rewatching" },
    { value: "on_hold", label: "On hold" },
    { value: "dropped", label: "Dropped" },
];

function HeroUI( { shows =[], error = false, user = null }) {
    const navigate = useNavigate()
    const [showIndex, setShowIndex] = useState(0);
    const showCount = shows.length;
    const [watchlistShow, setWatchlistShow] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState("wishlist");
    const [currentWatchlistItem, setCurrentWatchlistItem] = useState(null);
    const [watchlistLoading, setWatchlistLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [watchlistError, setWatchlistError] = useState("");
    const [savedStatus, setSavedStatus] = useState("");

    const openWatchlistPicker = async (show) => {
        setWatchlistShow(show);
        setWatchlistError("");
        setSavedStatus("");
        setCurrentWatchlistItem(null);
        setSelectedStatus("wishlist");

        if (!user) return;

        setWatchlistLoading(true);
        try {
            const { data } = await axios.get("/api/watchlist");
            const existingItem = data.items.find((item) => Number(item.show_id) === Number(show.id));
            setCurrentWatchlistItem(existingItem || null);
            if (existingItem) setSelectedStatus(existingItem.status);
        } catch (requestError) {
            setWatchlistError(requestError.response?.data?.message || "Unable to load your watchlist.");
        } finally {
            setWatchlistLoading(false);
        }
    };

    const saveWatchlistStatus = async () => {
        if (!watchlistShow || !user) return;

        setSaving(true);
        setWatchlistError("");
        try {
            if (currentWatchlistItem) {
                await axios.put(`/api/watchlist/${watchlistShow.id}`, { status: selectedStatus });
            } else {
                await axios.post("/api/watchlist", { show_id: watchlistShow.id, status: selectedStatus });
            }
            setCurrentWatchlistItem({ show_id: watchlistShow.id, status: selectedStatus });
            setSavedStatus(selectedStatus);
        } catch (requestError) {
            setWatchlistError(requestError.response?.data?.message || "Unable to update your watchlist.");
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        if (!watchlistShow) return undefined;
        const handleKeyDown = (event) => {
            if (event.key === "Escape") setWatchlistShow(null);
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [watchlistShow]);

    // auto rotate shows
    useEffect(() => {
        if (showCount < 2) return;
        const timer = setTimeout(() => setShowIndex((i) => (i + 1) % showCount), AUTOMOVE_MS);
        return () => clearTimeout(timer);
    }, [showIndex, showCount]);

    const heroShow = shows[showIndex];
    if (error || shows.length === 0) {
        console.log("showing error?")
        return (
            <div className="relative w-screen h-screen overflow-hidden bg-neutral-900">
            <ErrorDisplay
                text={error ? "Couldn't load featured shows." : "No featured shows right now."}
                className="relative w-full h-screen bg-neutral-900"
            />
            </div>
        );}
    if (!heroShow) return null;

    return (
            <div className="relative w-screen h-screen overflow-hidden bg-neutral-900">
                {shows.map((show, i) => (
                    <div 
                        key={show.id}
                        aria-hidden="true"
                        className={`absolute inset-0 bg-cover bg-center transition-[opacity,visibility] duration-1000 ease-in-out motion-reduce:transition-none
                            ${i === showIndex ? "opacity-100" : "opacity-0"}`}
                        style={show.backdrop_url ? {backgroundImage: `url("${show.backdrop_url}")`} :undefined}/>
                ))}
                {/* Gradient */}
                <div className="absolute inset-0 bg-linear-to-r from-neutral-900 via-neutral-900/70 to-neutral-900/20">
                    <div className="absolute inset-0 bg-linear-to-r from-neutral-900 to-transparent"/>
                </div>

                {/* Content */}
                {shows.map((show, i) => {
                    const isActive = i === showIndex;
                    return (
                    <div key={show.id}
                        aria-hidden={!isActive}
                        className={`absolute inset-0 flex items-center z-10 container mx-auto px-4 transition-[opacity,visibility] duration-1000 ease-in-out motion-reduce:transition-none
                        ${isActive ? "opacity-100 visible" : "opacity-0 invisible"}`}>
                        <div className="max-w-3xl">
                        {/* Infos */}
                            <div className="transition-all duration-700">
                                <div className="flex items-center space-x-3 mb-4">
                                    <span className="bg-[#EFAC61] text-white text-xs font-semibold px-2 py-1 rounded-sm">
                                        FEATURED
                                    </span>
                                    {/* Avg score */}
                                    {typeof show.avg_score === "number" && (
                                    <div className="flex items-center text-white gap-1">
                                        <StarIcon color="#ffe234" fill="#ffe234" className="size-1/8"/>
                                        <span>{show.avg_score.toFixed(1)}</span>
                                    </div>
                                    )}
                                    {/* Release year */}
                                    {show.release_year && (
                                        <>
                                            <span className="text-neutral-400">{show.type.toUpperCase()}</span>
                                            <span className="text-neutral-300 text-sm">{show.release_year}</span>
                                        </>
                                    )}
                                    {/* Content Rating */}
                                    {show.content_rating && (
                                        <>
                                        <span className="text-neutral-400">RATED</span>
                                        <span className="bg-neutral-700 text-neutral-300 text-xs text-center px-11.5 py-0.5">{show.content_rating}</span>
                                        </>
                                    )}           
                                </div>

                                <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">{show.title}</h1>
                                <p className="text-neutral-300 text-base md:text-lg mb-8 line-clamp-3 md:line-clamp-4 max-w-2xl">{show.synopsis}</p>
                                <div className="flex flex-wrap gap-4">
                                    <button
                                        type="button"
                                        onClick={() => navigate(`/shows/${show.id}`)}
                                        className="bg-[#EFAC61] hover:bg-[#c27f33] text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all"
                                    >
                                        <ClapperBoardIcon/>
                                        View Info
                                    </button>
                                    <button type="button" onClick={() => openWatchlistPicker(show)} className="bg-neutral-800/80 hover:bg-neutral-700/80 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all border border-neutral-600">
                                        <AddWatchIcon/>
                                        Add to Watchlist
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
            );
            })}
            
            {/* Pagination */}
            <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-2 z-20">
                {shows.map((s, i) => (
                    <button 
                        key={s.id}
                        type="button"
                        onClick={() => setShowIndex(i)}
                        aria-label={`Show ${s.title}`}
                        aria-current={i === showIndex}
                        className={`h-2 rounded-full transition-all ${i === showIndex? "w-8 bg-white" : "w-2 bg-white/40 hover:bg-white/70 hover:w-4"}`}></button>
                ))}
                
            </div>

            {watchlistShow && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) setWatchlistShow(null);
                    }}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="home-watchlist-title"
                        className="w-full max-w-md rounded-2xl border border-[#9596D6]/35 bg-[#1d1b2d] p-5 text-white shadow-2xl sm:p-6"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 id="home-watchlist-title" className="mt-1 text-xl font-bold">Add to Watchlist</h2>
                                <p className="mt-1 line-clamp-2 text-sm text-neutral-300">{watchlistShow.title}</p>
                            </div>
                            <button type="button" onClick={() => setWatchlistShow(null)} aria-label="Close" className="rounded-lg p-2 text-neutral-300 transition hover:bg-white/10 hover:text-white">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {!user ? (
                            <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4">
                                <p className="text-sm text-neutral-300">Sign in to add titles to your Watchlist.</p>
                                <button type="button" onClick={() => navigate("/login")} className="mt-4 rounded-lg bg-[#EFAC61] px-4 py-2 font-semibold text-[#171522] transition hover:bg-[#f4bd7c]">
                                    Sign in
                                </button>
                            </div>
                        ) : (
                            <>
                                <p className="mt-1 text-sm text-neutral-300">Choose one status for this title:</p>
                                <div role="radiogroup" aria-label="Watchlist status" className="mt-3 grid gap-2">
                                    {watchlistStatuses.map((status) => {
                                        const isSelected = selectedStatus === status.value;
                                        return (
                                            <button
                                                key={status.value}
                                                type="button"
                                                role="radio"
                                                aria-checked={isSelected}
                                                disabled={watchlistLoading || saving}
                                                onClick={() => {
                                                    setSelectedStatus(status.value);
                                                    setSavedStatus("");
                                                }}
                                                className={`flex min-h-[62px] items-center gap-4 rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${isSelected ? "border-[#7770a8] bg-[#252333] text-white" : "border-white/10 bg-[#17161f] text-neutral-300 hover:border-[#7770a8] hover:bg-[#211f2b]"} disabled:cursor-wait disabled:opacity-60`}
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
                                {savedStatus && <p role="status" className="mt-3 text-sm text-emerald-300">Added to {watchlistStatuses.find((status) => status.value === savedStatus)?.label}.</p>}

                                <div className="mt-5 flex justify-end gap-3">
                                    <button type="button" onClick={() => setWatchlistShow(null)} className="rounded-lg border border-white/15 px-4 py-2.5 text-sm font-semibold text-neutral-200 transition hover:bg-white/5">
                                        Cancel
                                    </button>
                                    <button type="button" onClick={saveWatchlistStatus} disabled={watchlistLoading || saving} className="inline-flex items-center gap-2 rounded-lg bg-[#EFAC61] px-4 py-2.5 text-sm font-semibold text-[#171522] transition hover:bg-[#f4bd7c] disabled:cursor-not-allowed disabled:opacity-60">
                                        {saving && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                        {currentWatchlistItem ? "Save status" : "Add to Watchlist"}
                                    </button>
                                </div>
                            </>
                        )}
                    </section>
                </div>
            )}

    </div>
    )}

export default HeroUI;
