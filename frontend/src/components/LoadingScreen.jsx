import React from "react";
import loadingGif from "../assets/loading-amiya.gif"

function LoadingPlaceHolder( {className = ""}){
    return(
        <div className= {`flex flex-col items-center justify-center gap-4 ${className}`}>
            <img src="https://media.tenor.com/PSgb2iKBBY8AAAAi/arknights-amiya.gif" className="w-24 h-24 object-contain motion-reduce:hidden" />
            <p className="text-neutral-300 text-sm md:text-base">Loading....</p>
        </div>
    )
}

export default LoadingPlaceHolder;