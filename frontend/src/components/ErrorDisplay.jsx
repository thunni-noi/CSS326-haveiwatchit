function ErrorDisplay( {text="Failed", className = ""}){
    return(
        <div className= {`flex flex-col items-center justify-center gap-4 ${className}`}>
            <img src="https://media.tenor.com/AdKjpwcZ6nQAAAAi/arknights-amiya.gif" className="w-24 h-24 object-contain motion-reduce:hidden" />
            <p className="text-neutral-300 text-sm md:text-base">{text}</p>
        </div>
    )
}

export default ErrorDisplay;