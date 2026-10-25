import { useEffect, useState } from "react";
import LoadingPlaceHolder from "../LoadingScreen";
import ErrorDisplay from "../ErrorDisplay";
import axios from "axios";
import ReviewCard from "./ReviewCard";
import ReviewForm from "./ReviewForm";

const fetchAllReview = async (showId, signal) => {
    const res = await axios.get(`/api/shows/${showId}/reviews`, {
                params: {
                    limit: 20,
                    offset: 0
                }, signal: signal});
    return res.data;
}

const fetchUserReview = async (showId, userId, signal) => {
    try {
        const res = await axios.get(`/api/shows/${showId}/reviews/${userId}`, {
                    params: {
                        limit: 20,
                        offset: 0
                    }, signal: signal})
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

const removeReview = async (showId, userId, signal) => {
    const res = await axios.delete(`api/shows/${showId}/reviews/${userId}`);
    return res.data;
}

function ReviewSection( {showId, user, onSaved, onRemoved }) {
    
    const [reviews, setReviews] = useState([]);
    const [myReview, setMyReview] = useState(null);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [reviewFormOpen, setReviewFormOpen] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(false);

    const isStaff = (user?.role === "admin" || user?.role === "moderator")

    useEffect(() => {
        const controller = new AbortController();

        Promise.all([
            fetchAllReview(showId, controller.signal),
            user ? fetchUserReview(showId, user.id, controller.signal) : Promise.resolve(null)
        ])
        .then(([fullReview, myReview]) => {
            if (controller.signal.aborted) return;
            
            console.log(myReview)
            setReviews(fullReview.reviews);
            setHasMore(fullReview.still_more);
            setMyReview(myReview?.reviews?.[0] ?? null);

            setLoading(false);
        })
        .catch((err) => {
            if (axios.isCancel(err)) return;
            console.log(err);
            setError(true);
        });

        return () =>
            controller.abort();

    }, [showId, user]);

    const fetchMore = async () => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
        setError(false);

        const controller = new AbortController();

        axios.get(`/api/shows/${showId}/reviews`, {
            params: {
                limit: 20,
                offset: reviews.length
            },
            signal: controller.signal
        })
        .then((res) => {
            setReviews((prev) => {
                const oldReview = new Set(prev.map((r) => r.username));
                return [...prev, ...res.data.reviews.filter((r) => !oldReview.has(r.username))]
            });
            setHasMore(res.data.still_more)
        })
        .catch((err) => {
            if (axios.isCancel(err)) return;
            setError(true);
        })
        .finally(() => {
            if(!controller.signal.aborted) setLoadingMore(false);
        })
    };

    const handlePost = async ( {score, text} ) => {
        console.log(score);
        console.log(text);
        await postReview(showId, score, text);
        setMyReview({
            user_id: user.id,
            username: user.username,
            score: score,
            text: text,
            created_at: new Date().toISOString().slice(0, 10)
            });
            setReviewFormOpen(false);
        }

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
            {!loading && error && <ErrorDisplay text="Couldn't load reviews, Please try again" className="relative w-full h-40 bg-neutral-800/60" />}
            {!loading && !error && (
                <>
                    <div className="space-y-3">
                        {myReview && (
                            <ReviewCard 
                                review={myReview}
                                isMine={true}
                                canRemove={isStaff}
                            />
                        )}
                        {reviews.map((r) => (
                            <ReviewCard 
                                key={r.username}
                                review={r}
                                isMine={false}
                                canRemove={isStaff}
                                />
                        ))}
                    </div>
                </>
            )}
        </div>
    );

}

export default ReviewSection;