import axios from "axios";
import { useEffect, useState } from "react";
import LoadingPlaceHolder from "../components/LoadingScreen";
import { Link, useParams } from "react-router-dom";
import PlaceholderCover from "../assets/placeholder_image.jpg"
import RoleCard from "../components/DetailComponents/RoleCard";

const statusColor = {
    "completed": "green-700",
    "airing": "[#9596D6]",
}

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

    const isStaff=  user?.role === "moderator" || user?.role === "admin";

    useEffect(() => {
        //setLoading(true);

        const controller = new AbortController();

        const fetchApi = async() => {
            axios.get(`/api/shows/${showId}`,{
                signal: controller.signal
            })
            .then((res) => {
                console.log(res.data)
                setShowInfo(res.data);
            })
            .catch((err) => {
                if(!axios.isCancel(err)) setError(true);
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            })
        }
        fetchApi();
        console.log(showInfo)

        return () => controller.abort();
    }, [showId]);

    if (isLoading) {
        return (
            <LoadingPlaceHolder className="relative w-full h-screen bg-neutral-900"/>
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
                                className="flex w-full items-center justify-center gap-2 rounded-md bg-gray-700 py-2 text-sm font-semibold text-white transition-all hover:bg-gray-900">
                                Add To Lists
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
                            <section className="relative overflow-hidden min-h-50 flex flex-wrap items-center gap-x-8 gap-y-3 rounded-md bg-neutral-800 p-4">
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
                        </div>
                    </div>
                </div>
            </div>
        </main>
        </>
    )
}

export default ShowDetails;

function InfoRow({ label, children }) {
    return (
        <p className="text-sm text-neutral-300">
            <span className="text-neutral-500">{label}: </span>
            {children}
        </p>
    );
}