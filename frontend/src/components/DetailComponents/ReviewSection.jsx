import { useEffect, useState } from "react";
import LoadingPlaceHolder from "../LoadingScreen";
import ErrorDisplay from "../ErrorDisplay";
import axios from "axios";
import ReviewCard from "./ReviewCard";
import ReviewForm from "./ReviewForm";


// API CALLS
const fetchAllReview = async (showId, signal) => {
    const res = await axios.get(`/api/shows/${showId}/reviews`, {
                params: {
                    limit: 5,
                    offset: 0
                }, signal: signal});
    return res.data;
}

const fetchUserReview = async (showId, userId, signal) => {
    try {
        const res = await axios.get(`/api/shows/${showId}/reviews/${userId}`, {
            signal: signal})
        return res.data;
    } catch (err) {
        if (err.response?.status === 404) return null;
        throw err
    }    
}

const postReview = async (showId, score, text) => {
    const res = await axios.post(`/api/shows/${showId}/reviews`, {
            score: score,
            text: text
        });
    return res.data;
}

const removeReview = async (showId, userId) => {
    const res = await axios.delete(`/api/shows/${showId}/reviews/${userId}`);
    return res.data;
}

function ReviewSection( {showId, user, onUpdated }) {
    
    const [reviews, setReviews] = useState([]);
    const [myReview, setMyReview] = useState(null);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [reviewFormOpen, setReviewFormOpen] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const [moreError, setMoreError] = useState(false);


    useEffect(() => {
        const controller = new AbortController();
        //setLoading(true);
        //setLoadError(false);

        Promise.all([
            fetchAllReview(showId, controller.signal),
            user ? fetchUserReview(showId, user.id, controller.signal) : Promise.resolve(null)
        ])
        .then(([fullReview, myReview]) => {
            if (controller.signal.aborted) return;
            setReviews(fullReview.reviews);
            setHasMore(fullReview.still_more);
            setMyReview(myReview?.reviews?.[0] ?? null);

            setLoading(false);
        })
        .catch((err) => {
            if (axios.isCancel(err)) return;
            setLoadError(true);
        })
        .finally(() => {
            if (!controller.signal.aborted) setLoading(false)
        })

        return () =>
            controller.abort();

    }, [showId, user]);

    const fetchMore = async () => {
        const controller = new AbortController();
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
        setMoreError(false);

        axios.get(`/api/shows/${showId}/reviews`, {
            params: {
                limit: 20,
                offset: reviews.length
            },
            signal: controller.signal
        })
        .then((res) => {
            if (controller.signal.aborted) return;
            setReviews((prev) => {
                const oldReview = new Set(prev.map((r) => r.username));
                return [...prev, ...res.data.reviews.filter((r) => !oldReview.has(r.username))]
            });
            setHasMore(res.data.still_more)
        })
        .catch((err) => {
            if (axios.isCancel(err)) return;
            setMoreError(true);
        })
        .finally(() => {
            if(!controller.signal.aborted) setLoadingMore(false);
        })
    };

    const handlePost = async ( {score, text} ) => {
        await postReview(showId, score, text);
        setMyReview({
            user_id: user.id,
            username: user.username,
            score: score,
            text: text,
            created_at: new Date().toISOString().slice(0, 10)
            });
            setReviewFormOpen(false);
        onUpdated?.();
        }
        

    const handleRemove = async (review) => {
        console.log(review)
        const isMine = Boolean(user) && review.user_id === user.id
        await removeReview(showId, review.user_id);

        setReviews((prev) => prev.filter((r) => r.user_id !== review.user_id))
        if (isMine) setMyReview(null);
        onUpdated?.();
    }

    // Not included user's review
    const reviewList = reviews.filter((r) => !user || (r.username !== user.username));
    const isMod = user?.role === "moderator" || user?.role === "admin";

    return(
        <div>
            {loading && <LoadingPlaceHolder className="relative w-full h-40 bg-neutral-800/60"/>}
            {!user && (
                <p className="mb-4 text-sm text-neutral-400">Log in to write a reviews</p>
            )}
            {user && !myReview && !reviewFormOpen && !loading && (
                <button type="button" onClick={() => setReviewFormOpen(true)}
                className="mb-4 flex items-center gap-2 rounded-md bg-neutral-900 px-4 py-2 text-sm text-white transition-all">
                    Write a review
                </button>
            )}
            {user && !loading && reviewFormOpen && (
                <div className="mb-4">
                    <ReviewForm current={myReview} onSubmit={handlePost} onCancel={() => setReviewFormOpen(false)} />
                </div>
            )}
            {!loading && loadError && <ErrorDisplay text="Couldn't load reviews, Please try again" className="relative w-full h-40 bg-neutral-800/60" />}
            {!loading && !loadError && reviews.length === 0 && (
                <p className="text-sm text-neutral-500">No reviews yet.</p>
            )}
            {!loading && !loadError && reviews.length !== 0 && (
                <>
                    <div className="space-y-3">
                        {myReview && !reviewFormOpen && (
                            <ReviewCard 
                                review={myReview}
                                isMine={true}
                                canRemove={true}
                                onRemove={() => handleRemove(myReview)}
                                onEdit={() => setReviewFormOpen(true)}
                            />
                        )}
                        {reviewList.map((r) => (
                            <ReviewCard 
                                key={r.username}
                                review={r}
                                isMine={false}
                                canRemove={isMod}
                                onRemove={() => handleRemove(r)}
                                onEdit={() => setReviewFormOpen(true)}
                                />
                        ))}
                    </div>
                </>
            )}
            {!loading && !loadError && hasMore && (
                <div className="mt-5 flex flex-col items-center gap-2">
                    <button type="button" onClick={fetchMore} disabled={loadingMore}
                    className="rounded-md bg-neutral-800 px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-60"> 
                        {loadingMore? "Loading..." : "Load more"}
                    </button>
                    {moreError && <ErrorDisplay text="Couldn't fetch more reviews. Try again later" className="relative w-full h-40 bg-neutral-800/60"/>}
                </div>
            )

            }
        </div>
    );

}

export default ReviewSection;