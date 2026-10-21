import React , { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star as StarIcon, Clapperboard as ClapperBoardIcon, SquarePlus as AddWatchIcon } from "lucide-react";

const AUTOMOVE_MS = 10000; // 10 sec

function HeroUI( { shows =[], loading = false }) {
    const navigate = useNavigate()
    const [showIndex, setShowIndex] = useState(0);

    // auto rotate shows
    useEffect(() => {
        const timer = setTimeout(() => setShowIndex((i) => (i + 1) % shows.length), AUTOMOVE_MS);
        console.log(shows[showIndex]);
        return () => clearTimeout(timer);
    }, [showIndex, shows.length]);

    const heroShow = shows[showIndex];
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
                                    <button className="bg-[#EFAC61] hover:bg-[#c27f33] text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all">
                                        <ClapperBoardIcon/>
                                        View Info
                                    </button>
                                    <button className="bg-neutral-800/80 hover:bg-neutral-700/80 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all border border-neutral-600">
                                        <AddWatchIcon/>
                                        Add to Watch List
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

    </div>
    )}

export default HeroUI;