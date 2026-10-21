import React from "react";
import { Star as StarIcon } from "lucide-react";

function ShowTypeSelect() {
    const showType = [
        { value: "movies", "title": "Movies" },
        { value: "series", "title": "Series" },
        { value: "tv_shows", "title": "TV Shows" },
        
    ]


    return(
        <section className="py-12 bg-neutral-900/50 relative z-10" id="">
            <div className="container mx-auto px-4">
                <h2 className="text-2xl md:text-3xl">Browse by Type</h2>

                {/* Type */}
                <div className="mb-8 overflow-x-auto pb-2">
                    <div className="flex space-x-2 min-w-max">
                        {/* Conditional */}
                        <button className="px-4 py-2 rounded-md transition-colors text-sm">Types</button>
                    </div>
                </div>
                <div className="h-64 flex items-center justify-center">
                    <div className="animate-pulse">
                        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin">

                        </div>
                    </div>
                </div>
                {/* Else */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {/* Map Here */}
                    <div className="group cursor-pointer">
                        <div className="relative aspect-2/3 rounded-lg overflow-hidden bg-neutral-800">
                            <img src="" alt="" className="w-full h-full object-cover transition-all duration-300 group-hover:scale-110 group-hover:opacity-35"/>
                            <div className="absolute inset-0 bg-linear-to-t from-neutral-900/90 via-neutral-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-1">
                                        <span className="text-yellow-400 text-sm font-medium">Score</span>
                                    </div>
                                    <span className="text-neutral-400 text-sm">
                                        Release year
                                    </span>
                                </div>
                                <button className="w-full bg-purple-600 hover:bg-purple-700 text-white mt-2 py-3 rounded-md flex items-center justify-center gap-1 transition-all text-sm">
                                    View Details
                                </button>
                            </div>
                        </div>
                        {/* Shows Info */}
                        <div className="mt-3">
                            <h3 className="text-white text-sm font-medium truncate">
                                This is title
                            </h3>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-1">
                                    <StarIcon color="#ffe234" fill="#ffe234" className="size-1/6"/>
                                    <span className="text-neutral-400 text-xs">Score</span>
                                </div>
                                <span className="text-neutral-500 text-xs">Release Data</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default ShowTypeSelect;