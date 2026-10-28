function SuccessDisplay( {text="Success", className = ""}){
    return(
        <div className= {`flex flex-col items-center justify-center gap-4 ${className}`}>
            <img src="https://cdn.discordapp.com/emojis/1389060663653175376.webp?size=96&animated=true" className="w-24 h-24 object-contain motion-reduce:hidden" />
            <p className="text-neutral-300 text-sm md:text-base">{text}</p>
        </div>
    )
}

export default SuccessDisplay;