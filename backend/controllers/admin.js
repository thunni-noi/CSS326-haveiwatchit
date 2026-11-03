// this file is redundant(supposed to be an export hub, but adminRecords.js already take care of that)

export {
    createRecord,
    deleteRecord,
    listRecords,
    updateRecord,
} from "./adminRecords.js";
export {
    addUserCollectionItem,
    addUserWatchlistItem,
    deleteUserCollectionItem,
    deleteUserWatchlistItem,
    followUserCollection,
    getUserCollection,
    getUserCollections,
    getUserFollowedCollections,
    getUserWatchlist,
    receiveUserAvatar,
    suspendUser,
    unfollowUserCollection,
    unsuspendUser,
    updateUserAvatar,
    updateUserCollection,
    updateUserWatchlistItem,
} from "./adminUsers.js";
export { getShowAssociations } from "./adminShows.js";
export { listUserOptions } from "./adminSubmissions.js";
