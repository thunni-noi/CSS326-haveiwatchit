import { useState } from "react";
import axios from "axios";
import {    Trash as RemoveIcon, Pencil as EditIcon, CircleCheck as VerifiedIcon, 
            UserRoundX as BanUserIcon, UserPlus as UnbanUserIcon,
            ShieldUser as AdminBadge, UserKey as ModBadge } from "lucide-react";
import UserProfile from "../UserProfile";

function formatDate(dateVal){
    if (!dateVal) return "N/A";
    return new Date(dateVal).toLocaleDateString("en-GB", {day: "2-digit", month: "2-digit", year: "numeric"});
}

function ReviewCard( {curUser, curShowId, review, isMine, onEdit, onRemove }) {

    const [removeConfirm, setRemoveConfirm] = useState(false);
    const [removing, setRemoving] = useState(false);
    const [banConfirm, setBanConfirm] = useState(false);
    const [banning, setBanning] = useState(false);
    const [unbanConfirm, setUnbanConfirm] = useState(false);
    const [unBanning, setUnbanning] = useState(false);
    const [error, setError] = useState("");

    const isMod = ["moderator", "admin"].includes(curUser?.role)

    const handleRemove = async(e) => {
        console.log("removing");
        e.preventDefault()
        setRemoving(true);
        setError("");

        try {
            await onRemove(review)
        } catch (err) {
            setError("Cannot remove this review, Please try again");
            setRemoving(false);
            setRemoveConfirm(false);
        }
    };

    const handleBan = async(e) => {
        e.preventDefault();
        setBanning(true);
        setError("");
        console.log("yes")

        axios.post(`/api/admin/ban/${review.user_id}`)
        .then(() => {review.is_suspended = 1})
        .catch((err) => setError(error))
        .finally(() => {
            setBanning(false)
            setBanConfirm(false)});
    }

    const handleUnban = async(e) => {
        e.preventDefault();
        setUnbanning(true);
        setError("");
        console.log("yes")

        axios.post(`/api/admin/unban/${review.user_id}`)
        .then(() => {review.is_suspended = 0})
        .catch((err) => setError(error))
        .finally(() => {
            setUnbanning(false)
            setUnbanConfirm(false)});
    }

    return(
        <article className={`p-4 bg-neutral-700 ${isMine && "border-2 border-[#EFAC61] shadow-md transition-all"} ${review.is_suspended ? ("opacity-50"): ("hover:bg-[#302e2c]")}`}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center justify-left gap-5">
                    <UserProfile user={ review.is_suspended && !isMine ? null : {username: review.username, avatar_url: review.avatar_url}}
                    className="flex size-9 items-center justify-center rounded-full object-cover overflow-hidden" />
                    <span className={`flex gap-1 items-center text-sm font-medium ${review.is_suspended && !isMine? "text-neutral-300 line-through" : "text-white"}`}>{`${review.username} ${review.is_suspended ? "(suspended)" : ""} `}
                        {!!review.is_verified && !review.is_suspended && <span title="This user is verified!"> <VerifiedIcon color="#EFAC61" className="size-4" /> </span>}
                        {review.role === "moderator" && !review.is_suspended && <span title="This user is a moderator!"> <ModBadge color="#EFAC61" className="size-4" /> </span>}
                        {review.role === "admin" && !review.is_suspended && <span title="This user is an admin!"> <AdminBadge color="#EFAC61" className="size-4" /> </span>}
                        {isMine && !review.is_suspended && <span className="text-gray-300">(you) </span>}
                        {isMine && !!review.is_suspended && <span className="text-red-300">(You are currently suspended - cannot edit or delete reviews) </span>}
                    </span>
                </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                            {/* Edit */}
                            {isMine && !review.is_suspended && (
                                <button type="button" onClick={onEdit} title="Edit your review" className="rounded-full px-2 py-2 hover:bg-neutral-800">
                                    <EditIcon color="#ffffff" className="size-5"/>
                                </button>
                            )}

                            {/* Ban button */}
                            {isMod && !isMine && !review.is_suspended && !removeConfirm && (
                                banConfirm ? (
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="text-neutral-400">Confirm user suspension?</span>
                                        <button type="button" onClick={handleBan} disabled={banning}
                                        className="rounded-mg bg-red-800 px-2 py-1 font-semibold text-white transition-all hover:bg-red-950 disabled:opacity-60">
                                            {removing ? "Suspending..." : "Confirm"}
                                        </button>
                                        <button onClick={() => setBanConfirm(false)} disabled={banning}
                                        className="rounded-md bg-neutral-700 px-2 py-1 text-white transition-all hover:bg-neutral-600 disabled:opacity-60">
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <button type="button" onClick={() => setBanConfirm(true)}
                                    title="Suspend This User"
                                    className="flex items-center gap-1 rounded-full px-2 py-2 text-xs text-red-400 transition-all hover:bg-red-600/20">
                                        <BanUserIcon color="#ff5757" className="size-5"/>
                                    </button>
                                ))}

                            {/* Unban button */}
                            {isMod && !isMine && !!review.is_suspended && !removeConfirm && (
                                unbanConfirm ? (
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="text-neutral-400">Confirm user un-suspension?</span>
                                        <button type="button" onClick={handleUnban} disabled={unBanning}
                                        className="rounded-mg bg-green-800 px-2 py-1 font-semibold text-white transition-all hover:bg-green-950 disabled:opacity-60">
                                            {unBanning ? "Un-suspending..." : "Confirm"}
                                        </button>
                                        <button onClick={() => setUnbanConfirm(false)} disabled={unBanning}
                                        className="rounded-md bg-neutral-700 px-2 py-1 text-white transition-all hover:bg-neutral-600 disabled:opacity-60">
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <button type="button" onClick={() => setUnbanConfirm(true)}
                                    title="Un-suspense This User"
                                    className="flex items-center gap-1 rounded-full px-2 py-2 text-xs text-red-400 transition-all hover:bg-green-900/50">
                                        <UnbanUserIcon color="#34fe8c" className="size-5"/>
                                    </button>
                                ))}

                            {/* Delete button */}
                            {(isMod || isMine) && !(banConfirm || unbanConfirm) && (
                            (removeConfirm) ? (
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="text-neutral-400">Confirm removal?</span>
                                    <button type="button" onClick={handleRemove} disabled={removing}
                                    className="rounded-mg bg-red-800 px-2 py-1 font-semibold text-white transition-all hover:bg-red-950 disabled:opacity-60">
                                        {removing ? "Removing..." : "Confirm"}
                                    </button>
                                    <button onClick={() => setRemoveConfirm(false)} disabled={removing}
                                    className="rounded-md bg-neutral-700 px-2 py-1 text-white transition-all hover:bg-neutral-600 disabled:opacity-60">
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <button type="button" onClick={() => setRemoveConfirm(true)}
                                title="Remove this review"
                                className="flex items-center gap-1 rounded-full px-2 py-2 text-xs text-red-400 transition-all hover:bg-red-600/20">
                                    <RemoveIcon color="#ff5757" className="size-5"/>
                                </button>
                            ))}
                        </div>
                    </div>

            </div>
            <span className="inline-flex items-center gap-3 font-semibold text-yellow-400">
                {review.score}/10
                <p className="text-xs text-neutral-500">{formatDate(review.created_at)}</p>
            </span>
            {review.text && (
                <p className="mt-1 whitespace-pre-line wrap-break-word text-sm leading-relaxed text-neutral-300">{review.text}</p>
            )}
        </article>
    )
}

export default ReviewCard;