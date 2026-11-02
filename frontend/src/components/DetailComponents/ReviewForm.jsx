import { useRef, useState, useEffect } from "react";
import SuccessDisplay from "../SuccessDisplay";
import ErrorDisplay from "../ErrorDisplay";

function ReviewForm( {current, onSubmit, onClose} ){
    const[score, setScore] = useState(current?.score ?? 0);
    //const[text, setText] = useState(current?.text ?? "");
    const[posting, setPosting] = useState(false);
    const[success, setSuccess] = useState("");
    const[warning, setWarning] = useState("");
    const[error, setError] = useState("");

    const timer = useRef(null);

    useEffect(() => {
            return () => clearTimeout(timer.current);
        }, []);

    const scoreList = {
        1: "Appaling",
        2: "Horrible",
        3: "Very Bad",
        4: "Bad",
        5: "Average",
        6: "Fine",
        7: "Good",
        8: "Very Good",
        9: "Great",
        10: "Masterpiece"
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formText = document.getElementById("review_text").value.trim();
        //setText(formText);

        if (formText === "") {
            timer.current = setTimeout(() => {setError("")}, 3000);
            return setError("Review text must not be empty!");
        }

        if (score < 1 || score > 10) {
            timer.current = setTimeout(() => {setError("")}, 3000);
            return setError("Score must be in range 0 to 10!");
        }

        setPosting(true);
        setError("");
        try{
            await onSubmit({score: score, text: formText});
            setSuccess("Your review has been saved");
            timer.current = setTimeout(() => onClose(), 1500);
        } catch (err) {
            setError("Could not save your review, Please try again later.")
            timer.current = setTimeout(() => {setError("")}, 3000);
            setPosting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="relative space-y-3 rounded-md border border-neutral-700 bg-neutral-800/60 p-4">
            <h3 className="text-lg font-semibold text-white">
                {current ? "Edit your review" : "Write a review"}
            </h3>

            <div className="flex flex-col justify justify-left gap-y-1">
                <span className="text-white inline-block">Review Text <span className="text-red-400 text-xs"> (required) </span></span>
                <textarea id="review_text" defaultValue={current?.text?? ""} placeholder="Write your review..."
                className="field-sizing-fixed text-sm w-full h-30 bg-neutral-900 text-white px-3 py-3 mb-3">
                </textarea>

                <span className="text-white inline-block"> Overall Rating <span className="text-red-400 text-xs"> (required) </span></span>

                <div className="flex flex-row gap-2 mt-1 mb-3">{
                    Object.keys(scoreList).toReversed().map((s) => (
                        <button type="button" onClick={() => setScore(Number(s))} key={s}
                        className={`border-2 text-xs border-neutral-700 w-10 py-1 rounded-lg hover:bg-neutral-700
                        ${score === Number(s) ? "text-blue-500 bg-neutral-700" : "text-white "}`}>
                            {s}
                        </button>
                    ))
                }
                {!!score && (<span className="text-blue-400"> - {scoreList[score]}</span>)}
                </div>

                <div className="flex flex-row gap-2 justify-start">
                    <button type="button" onClick={() => onClose()}
                    className="text-white border-2 border-neutral-700 rounded-md py-1 w-40 hover:bg-neutral-700">
                        Cancel
                    </button>
                    <button type="submit"
                    className="text-white bg-blue-500  rounded-md py-1 w-40 hover:bg-blue-800">
                        {posting? "Submitting..." : "Submit"}
                    </button>
                </div>
            </div>
            
            {success && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-neutral-900">
                        <SuccessDisplay text={success} />
                    </div>
                )}
            {error  && 
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-neutral-900 text-neutral-300 text-sm md:text-base">
                    <ErrorDisplay text={error} />
                </div>}

        </form>
    )
}

export default ReviewForm;