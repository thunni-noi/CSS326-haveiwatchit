import axios from "axios";
import { useEffect, useRef, useState } from "react";
import LoadingPlaceHolder from "./LoadingScreen";
import ErrorDisplay from "./ErrorDisplay"
import { Check, LoaderCircle, X } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import SuccessDisplay from "./SuccessDisplay";


function AddWatchlistModal({user, show, initialStatus, onSubmit, onClose}){
    const [selectedStatus, setSelectedStatus] = useState(initialStatus ?? "wishlist");
    const [saving, setSaving] = useState(false);
    const [loading ,setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const navigate = useNavigate();
    const watchlistStatuses = [
    { value: "wishlist", label: "Want to watch" },
    { value: "watching", label: "Watching" },
    { value: "watched", label: "Watched" },
    { value: "rewatching", label: "Rewatching" },
    { value: "on_hold", label: "On hold" },
    { value: "dropped", label: "Dropped" },
];  
    const timer = useRef(null);

    useEffect(() => {
            return () => clearTimeout(timer.current);
        }, []);

    useEffect(() => {
        if (initialStatus != null) return;
        setLoading(true);

        const controller = new AbortController();
        axios.get(`/api/watchlist/${show.id}`, {signal: controller.signal})
        .then((res) => {
            setSelectedStatus(res.data.length > 0 ? res.data[0].status : "wishlist");
    }) .catch((err) => {
            if (!axios.isCancel(err)) setError(err.response?.data?.message ?? "Unable to load your wishlist.");
        })
        .finally(() => {
            if (!controller.signal.aborted) setLoading(false);
        })
    }, [initialStatus, show?.id])

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        await onSubmit(selectedStatus)
        .then(() => {
            setSuccess(true);
            timer.current = setTimeout(() => onClose(), 1000);
        })
        .catch((err) => {
            setError(err.response?.data?.message ?? "Unable to update your wishlist.");
        })
        .finally(() => {
            setSaving(false);
        })
    }

    return (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) onClose();
                    }}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="home-watchlist-title"
                        className="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-sm border border-neutral-700 bg-neutral-900 text-white "
                        >
                        {!user ? (
                            <div className="p-5">
                                <div className="flex flex-col rounded-xl justify-center items-center border border-white/10 bg-black/20 p-4">
                                    <p className="text-sm text-neutral-300">You need to sign in to add title to your watchlist</p>
                                    <button type="button" onClick={() => navigate("/login")} className="mt-4 rounded-lg bg-[#EFAC61] px-4 py-2 font-semibold text-[#171522] transition hover:bg-[#f4bd7c]">
                                        Sign in
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>  
                                <header className="mt-3 flex items-start justify-between gap-4  px-5 py-3">
                                    <div className="min-w-0 flex-1">
                                        <h2 id="home-watchlist-title" className="text-xl font-bold">{show.title}</h2>
                                        <p className="mt-1 wrap-break-word text-sm text-[#c9c2d8]"></p>
                                        <p className="mt-2 text-sm text-neutral-300">Choose one status for this title:</p>
                                    </div>
                                    <button type="button" onClick={() => onClose()} aria-label="Close" className="ml-3 shrink-0 rounded-lg p-2 text-neutral-300 transition hover:bg-white/10 hover:text-white">
                                        <X className="h-5 w-5" />
                                    </button>
                                </header>
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
                                                    disabled={saving}
                                                    onClick={() => {
                                                        setSelectedStatus(status.value);
                                                    }}
                                                    className={`flex min-h-13 items-center gap-3 rounded-2xl border px-4 py-2 text-left text-sm font-medium ${isSelected ? "border-[#EFAC61] bg-[#EFAC61]/30 text-white" : "border-white/0  text-neutral-300 hover:bg-neutral-800"} disabled:cursor-wait disabled:opacity-60`}
                                                >
                                                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${isSelected ? "border-[#EFAC61] bg-[#EFAC61] text-[#171522]" : "border-white/50"}`}>
                                                        {isSelected && <Check className="h-4 w-4" />}
                                                    </span>
                                                    <span className="flex-1 text-base font-semibold">{status.label}</span>
                                                    {isSelected && <span className="text-xs font-medium text-[#EFAC61]">Selected</span>}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    

                                </div>

                                <footer className="flex justify-end gap-2 border-t border-white/10 bg-black/10 px-5 py-3">
                                    <button type="button" onClick={() => onClose()} className="rounded-xl border border-white/15 px-4 py-2 text-sm text-neutral-200 transition hover:bg-white/5">
                                        Cancel
                                    </button>
                                    <button type="button" onClick={handleSubmit} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#EFAC61] px-4 py-2 text-sm font-semibold text-[#171522] transition hover:bg-[#f3bd7f] disabled:cursor-not-allowed disabled:opacity-50">
                                        {saving && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                        Update watchlist
                                    </button>
                                </footer>
                            </>
                        )}
                        {loading && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-neutral-900">
                                <LoadingPlaceHolder />
                            </div>
                        )}
                        {success && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-neutral-900">
                                <SuccessDisplay text="Update watchlist successfully!" />
                            </div>
                        )}
                        {error && 
                            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-neutral-900 text-neutral-300 text-sm md:text-base">
                                <ErrorDisplay text={error} />
                                Click anywhere to exit
                            </div>}
                    </section>
                </div>
            )
}

export default AddWatchlistModal;