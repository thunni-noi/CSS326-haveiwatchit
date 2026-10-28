import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { X, LoaderCircle, BookMarked, Globe, Check, Plus, Lock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import LoadingPlaceHolder from "./LoadingScreen";
import ErrorDisplay from "./ErrorDisplay";
import SuccessDisplay from "./SuccessDisplay";

function AddCollectionModal( {showInfo, user, onClose}){
    const [userCollections, setUserCollections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [saving, setSaving] = useState(false);

    const timer = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        return () => clearTimeout(timer.current);
    }, []);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        };
        const controller = new AbortController();

        axios.get(`/api/collections/shows/${showInfo.id}`, {signal: controller.signal})
        .then((res) => {
            setUserCollections(res.data);
        })
        .catch((err) => {
            if (err.response.status === 404) setUserCollections([]);
            else if (!axios.isCancel(err))setError(err.response?.data?.message ?? "Unable to load your collections.");
        })
        .finally(() => {
            if (!controller.signal.aborted) setLoading(false);
        })
        
        return () => {
            controller.abort();
        }

    }, [user, showInfo.id])


    const handleSubmit = async (e) => {
        e.preventDefault();

        const updated = new Set(new FormData(e.currentTarget).getAll("collection").map(Number));
        console.log(updated);

        // Delta
        const added = userCollections.filter(c => updated.has(c.id) && !c.has_show).map(c => c.id);
        const removed = userCollections.filter(c => !updated.has(c.id) && c.has_show).map(c => c.id);

        if (!added.length && !removed.length) return onClose();

        setSaving(true);
        setError("");
        axios.post(`/api/collections/shows/${showInfo.id}`, {
            added: added, removed: removed
        })
        .then(() => {
            setSuccess(true);
            timer.current = setTimeout(() => onClose(), 2000);
        })
        .catch((err) => {
            if (!axios.isCancel(err)) setError(err.response?.data?.message ?? "Unable to update collections.");
        })
        .finally(() => {
            setSaving(false);
            //onClose();
        })
    }


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>

            <section 
                role="dialog" 
                aria-modal="true" 
                aria-labelledby="collection-title" 
                aria-busy={loading}
                className="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-sm border border-neutral-700 bg-neutral-900 text-white"
                >
                {!user ? (
                    <div className="p-5">
                        <div className="flex flex-col rounded-xl justify-center items-center border border-white/10 bg-black/20 p-4">
                            <p className="text-sm text-neutral-300">You need to sign in to add title to your collections</p>
                            <button type="button" onClick={() => navigate("/login")} className="mt-4 rounded-lg bg-[#EFAC61] px-4 py-2 font-semibold text-[#171522] transition hover:bg-[#f4bd7c]">
                                Sign in
                            </button>
                        </div>
                    </div>
                    ) : (
                    <>
                    <header className="mt-3 flex items-start justify-between gap-4  px-5 py-3">
                        <div className="min-w-0 flex-1">
                            <h2 id="collection-title" className="text-xl font-bold">{showInfo.title}</h2>
                            <p className="mt-2 text-sm text-neutral-300">Choose collections for this title:</p>
                        </div>
                        <button type="button" onClick={() => onClose()} aria-label="Close" className="ml-3 shrink-0 rounded-lg p-2 text-neutral-300 transition hover:bg-white/10 hover:text-white">
                                    <X className="h-5 w-5" />
                        </button>
                    </header>

                    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                        <div className="min-h-0 flex-1 overflow-y-auto p-4">
                            {!loading && userCollections.length === 0 ? (
                                <p className="py-6 text-center text-neutral-300">
                                    You do not have any collection.
                                </p>
                            ) : (
                                <div className="grid gap-2">
                                    {userCollections.map((c) => (
                                    <label
                                        key={c.id}
                                        className="group flex min-h-13 cursor-pointer items-center gap-3 rounded-2xl border border-white/0 px-4 py-2 text-left text-sm font-medium text-neutral-300 transition hover:bg-neutral-800 has-checked:border-[#EFAC61] has-checked:bg-[#EFAC61]/30 has-checked:text-white has-focus-visible:ring-2 has-focus-visible:ring-[#EFAC61]/60"
                                    >
                                        <input
                                            type="checkbox"
                                            name="collection"
                                            value={c.id}
                                            defaultChecked={c.has_show}
                                            className="sr-only"
                                        />

                                        {/* indicator */}
                                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/50 text-[#171522] group-has-checked:border-[#EFAC61] group-has-checked:bg-[#EFAC61]">
                                            <Check className="hidden h-4 w-4 group-has-checked:block" />
                                        </span>

                                        <span className="min-w-0 flex-1 truncate text-base font-semibold">{c.name}</span>

                                        {c.visibility
                                            ? <Globe className="h-3.5 w-3.5 shrink-0 text-green-400" aria-label="Public" />
                                            : <Lock className="h-3.5 w-3.5 shrink-0 text-[#9596D6]" aria-label="Private" />}
                                    </label>
                                ))}
                                </div>
                            )}
                        
                        </div>

                        <footer className="flex justify-between gap-2 border-t border-white/10 bg-black/10 px-5 py-3">
                            <button type="button" onClick={() => navigate("/collections")} className="inline-flex items-center gap-2 rounded-xl bg-[#EFAC61] px-4 py-2 text-sm font-semibold text-[#171522] transition hover:bg-[#f3bd7f] disabled:cursor-not-allowed disabled:opacity-50">
                            Create new
                            </button>
                            <div className="flex gap-2">
                                <button type="button" onClick={onClose} className="rounded-xl border border-white/15 px-4 py-2 text-sm text-neutral-200 transition hover:bg-white/5">Cancel</button>
                                <button type="submit" disabled={loading || saving} className="inline-flex items-center gap-2 rounded-xl bg-[#EFAC61] px-4 py-2 text-sm font-semibold text-[#171522] transition hover:bg-[#f3bd7f] disabled:cursor-not-allowed disabled:opacity-50">
                                    {saving && <LoaderCircle className="h-4 w-4 animate-spin" />} Save
                                </button>
                            </div>
                        </footer>
                    </form>
                    </>
                )}
            {loading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-neutral-900">
                        <LoadingPlaceHolder />
                    </div>
                )}
            {success && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-neutral-900">
                        <SuccessDisplay text="Added to collection successfully!" />
                    </div>
                )}
            {error  && 
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-neutral-900 text-neutral-300 text-sm md:text-base">
                    <ErrorDisplay text={error} />
                    Click anywhere to exit
                </div>}
            </section>
        </div>
    );
}

export default AddCollectionModal;