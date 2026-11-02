// renders user-management views, including watchlists and collections.
// wrapper for user
import { ChevronLeft, Pencil, Plus, Trash2 } from "lucide-react";
import AdminRecords from "./AdminRecords";
import { formatDatabaseDateTime, WATCHLIST_STATUS_LABELS } from "./adminUtils";

const UserAdminTab = ({ userProps, recordsProps }) => {
  const {
    selectedWatchlistUser,
    watchlistLoading,
    addWatchlistItem,
    newWatchlistShowId,
    setNewWatchlistShowId,
    watchlistData,
    newWatchlistStatus,
    setNewWatchlistStatus,
    saving,
    updateWatchlistStatus,
    removeWatchlistItem,
    selectedCollectionUser,
    selectedUserCollection,
    collectionsLoading,
    userCollections,
    openUserCollection,
    followedCollectionLoading,
    followedCollectionData,
    selectedFollowCollectionId,
    setSelectedFollowCollectionId,
    changeFollowedCollection,
    collectionLoading,
    userCollectionData,
    setSelectedUserCollection,
    setUserCollectionData,
    setError,
    setNotice,
    updateCollectionDetails,
    addUserCollectionItem,
    newCollectionShowId,
    setNewCollectionShowId,
    removeUserCollectionItem,
  } = userProps;

  return (
    <>
{selectedWatchlistUser ? (
            watchlistLoading ? (
              <p role="status" className="rounded-xl border border-white/10 bg-neutral-800 p-8 text-center text-sm text-neutral-400">
                Loading {selectedWatchlistUser.username}&apos;s watchlist…
              </p>
            ) : watchlistData ? (
              <div className="space-y-5">
                <form onSubmit={addWatchlistItem} className="grid gap-3 rounded-xl border border-white/10 bg-neutral-800 p-4 sm:grid-cols-[minmax(0,1fr)_180px_auto]">
                  <label className="text-sm font-medium text-neutral-200">
                    Add a show
                    <select
                      required
                      value={newWatchlistShowId}
                      onChange={(event) => setNewWatchlistShowId(event.target.value)}
                      className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-900 px-3 py-2 text-sm text-white"
                    >
                      <option value="">Choose a show</option>
                      {watchlistData.availableShows.map((show) => (
                        <option key={show.id} value={show.id}>{show.name} ({show.type})</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-medium text-neutral-200">
                    Status
                    <select
                      value={newWatchlistStatus}
                      onChange={(event) => setNewWatchlistStatus(event.target.value)}
                      className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-900 px-3 py-2 text-sm text-white"
                    >
                      {watchlistData.statuses.map((status) => (
                        <option key={status} value={status}>{WATCHLIST_STATUS_LABELS[status] ?? status}</option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="submit"
                    disabled={saving || !watchlistData.availableShows.length}
                    className="self-end rounded-lg bg-bg-[#3336cc] px-4 py-2 text-sm font-semibold text-white hover:bg-[#060863] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="inline-flex items-center gap-2"><Plus size={16} /> Add to watchlist</span>
                  </button>
                  {!watchlistData.availableShows.length && (
                    <p className="text-xs text-neutral-400 sm:col-span-3">Every show is already on this user&apos;s watchlist.</p>
                  )}
                </form>

                {watchlistData.items.length ? (
                  <ul className="space-y-3">
                    {watchlistData.items.map((item) => (
                      <li key={item.show_id} className="flex flex-wrap items-center gap-4 rounded-xl border border-white/10 bg-neutral-800 p-3 sm:flex-nowrap">
                        {item.photo_url ? (
                          <img src={item.photo_url} alt={`${item.name} poster`} className="h-20 w-14 rounded-md object-cover" />
                        ) : (
                          <div className="flex h-20 w-14 items-center justify-center rounded-md bg-neutral-700 text-center text-[10px] text-neutral-400">No poster</div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate font-semibold text-white">{item.name}</h3>
                          <p className="mt-1 text-sm capitalize text-neutral-400">
                            {item.type} · Updated {formatDatabaseDateTime(item.updated_at)}
                          </p>
                        </div>
                        <label className="inline-flex items-center gap-1.5 text-[#9596D6]">
                          <span className="sr-only">Status for {item.name}</span>
                          <select
                            value={item.status}
                            onChange={(event) => updateWatchlistStatus(item.show_id, event.target.value)}
                            className="max-w-40 rounded bg-transparent py-1 text-sm outline-none focus:ring-1 focus:ring-[#9596D6]"
                          >
                            {watchlistData.statuses.map((status) => (
                              <option key={status} value={status} className="bg-neutral-900">{WATCHLIST_STATUS_LABELS[status] ?? status}</option>
                            ))}
                          </select>
                        </label>
                        <button
                          type="button"
                          aria-label={`Remove ${item.name} from watchlist`}
                          onClick={() => removeWatchlistItem(item)}
                          className="rounded-lg bg-rose-950 p-2 text-rose-300 hover:bg-rose-900"
                        >
                          <Trash2 size={16} />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="rounded-xl border border-white/10 bg-neutral-800 p-8 text-center text-sm text-neutral-400">
                    This user&apos;s watchlist is empty.
                  </p>
                )}
              </div>
            ) : null
            ) : selectedCollectionUser && !selectedUserCollection ? (
              /* User collection overview and followed-collection management. */
              <div className="space-y-8">
                <section className="space-y-3">
                  <h3 className="text-lg font-semibold">User collections</h3>
                  {collectionsLoading ? (
                    <p role="status" className="rounded-xl border border-white/10 bg-neutral-800 p-8 text-center text-sm text-neutral-400">
                      Loading {selectedCollectionUser.username}&apos;s collections…
                    </p>
                  ) : userCollections?.length ? (
                    <ul className="space-y-3">
                      {userCollections.map((collection) => (
                        <li key={collection.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-white/10 bg-neutral-800 p-4">
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate font-semibold text-white">{collection.name}</h3>
                            <p className="mt-1 text-sm text-neutral-400">
                              {Number(collection.item_count)} {Number(collection.item_count) === 1 ? "title" : "titles"}
                              {" · "}
                              {collection.is_public ? "Public" : "Private"}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => openUserCollection(collection)}
                            className="inline-flex items-center gap-2 rounded-lg bg-[#3336cc] px-4 py-2 text-sm font-semibold text-white hover:bg-[#060863]"
                          >
                            <Pencil size={16} />
                            Edit collection
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : userCollections ? (
                    <p className="rounded-xl border border-white/10 bg-neutral-800 p-8 text-center text-sm text-neutral-400">
                      This user has no collections.
                    </p>
                  ) : null}
                </section>

                <section className="space-y-3">
                  <h3 className="text-lg font-semibold">Followed collections</h3>
                  {followedCollectionLoading ? (
                    <p role="status" className="rounded-xl border border-white/10 bg-neutral-800 p-8 text-center text-sm text-neutral-400">
                      Loading {selectedCollectionUser.username}&apos;s followed collections…
                    </p>
                  ) : followedCollectionData ? (
                    <div className="space-y-5">
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      changeFollowedCollection("follow", selectedFollowCollectionId);
                    }}
                    className="grid gap-3 rounded-xl border border-white/10 bg-neutral-800 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
                  >
                    <label className="text-sm font-medium text-neutral-200">
                      Follow a public collection
                      <select
                        required
                        value={selectedFollowCollectionId}
                        onChange={(event) => setSelectedFollowCollectionId(event.target.value)}
                        className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-900 px-3 py-2 text-sm text-white"
                      >
                        <option value="">Choose a public collection</option>
                        {followedCollectionData.availableCollections.map((collection) => (
                          <option key={collection.id} value={collection.id}>
                            {collection.name} · {collection.owner}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="submit"
                      disabled={saving || !selectedFollowCollectionId}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#3336cc] px-4 py-2 text-sm font-semibold text-white hover:bg-[#060863] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Plus size={16} />
                      Follow collection
                    </button>
                    {!followedCollectionData.availableCollections.length && (
                      <p className="text-xs text-neutral-400 sm:col-span-2">
                        No other public collections are available to follow.
                      </p>
                    )}
                  </form>

                  {followedCollectionData.collections.length ? (
                    <ul className="space-y-3">
                      {followedCollectionData.collections.map((collection) => (
                        <li key={collection.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-white/10 bg-neutral-800 p-4">
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate font-semibold text-white">{collection.name}</h3>
                            <p className="mt-1 text-sm text-neutral-400">
                              By {collection.owner} · {collection.is_public ? "Public" : "Private"} ·{" "}
                              {Number(collection.item_count)} {Number(collection.item_count) === 1 ? "title" : "titles"}
                            </p>
                          </div>
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => changeFollowedCollection("unfollow", collection.id)}
                            className="rounded-lg bg-rose-950 px-3 py-2 text-sm font-semibold text-rose-300 hover:bg-rose-900 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Unfollow
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="rounded-xl border border-white/10 bg-neutral-800 p-8 text-center text-sm text-neutral-400">
                      This user has no followed collections.
                    </p>
                  )}
                  </div>
                ) : null}
              </section>
            </div>
            ) : selectedCollectionUser ? (
              /* Selected collection editor, including its details and show items. */
              collectionsLoading ? (
                <p role="status" className="rounded-xl border border-white/10 bg-neutral-800 p-8 text-center text-sm text-neutral-400">
                  Loading {selectedCollectionUser.username}&apos;s collections…
                </p>
              ) : selectedUserCollection ? (
                collectionLoading ? (
                  <p role="status" className="rounded-xl border border-white/10 bg-neutral-800 p-8 text-center text-sm text-neutral-400">
                    Loading collection…
                  </p>
                ) : userCollectionData ? (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-lg font-semibold">Edit collection</h3>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedUserCollection(null);
                          setUserCollectionData(null);
                          setError("");
                          setNotice("");
                        }}
                        className="inline-flex items-center gap-2 rounded-lg bg-neutral-700 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-600"
                      >
                        <ChevronLeft size={16} />
                        Back to collections
                      </button>
                    </div>

                    <form onSubmit={updateCollectionDetails} className="grid gap-3 rounded-xl border border-white/10 bg-neutral-800 p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
                      <label className="text-sm font-medium text-neutral-200">
                        Collection name
                        <input
                          required
                          maxLength={255}
                          value={userCollectionData.collection.name}
                          onChange={(event) => setUserCollectionData((current) => ({
                            ...current,
                            collection: { ...current.collection, name: event.target.value },
                          }))}
                          className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-900 px-3 py-2 text-sm text-white"
                        />
                      </label>
                      <label className="flex items-center gap-2 rounded-lg border border-neutral-600 bg-neutral-900 px-3 py-2 text-sm text-neutral-200">
                        <input
                          type="checkbox"
                          checked={Boolean(userCollectionData.collection.is_public)}
                          onChange={(event) => setUserCollectionData((current) => ({
                            ...current,
                            collection: { ...current.collection, is_public: event.target.checked },
                          }))}
                          className="accent-[#EFAC61]"
                        />
                        Public collection
                      </label>
                      <button
                        type="submit"
                        disabled={saving}
                        className="rounded-lg bg-[#EFAC61] px-4 py-2 text-sm font-semibold text-black hover:bg-[#ec9532] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {saving ? "Saving…" : "Save details"}
                      </button>
                    </form>

                    <form onSubmit={addUserCollectionItem} className="grid gap-3 rounded-xl border border-white/10 bg-neutral-800 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                      <label className="text-sm font-medium text-neutral-200">
                        Add a show
                        <select
                          required
                          value={newCollectionShowId}
                          onChange={(event) => setNewCollectionShowId(event.target.value)}
                          className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-900 px-3 py-2 text-sm text-white"
                        >
                          <option value="">Choose a show</option>
                          {userCollectionData.availableShows.map((show) => (
                            <option key={show.id} value={show.id}>{show.name} ({show.type})</option>
                          ))}
                        </select>
                      </label>
                      <button
                        type="submit"
                        disabled={saving || !userCollectionData.availableShows.length}
                        className="rounded-lg bg-[#3336cc] px-4 py-2 text-sm font-semibold text-white hover:bg-[#060863] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <span className="inline-flex items-center gap-2"><Plus size={16} /> Add to collection</span>
                      </button>
                      {!userCollectionData.availableShows.length && (
                        <p className="text-xs text-neutral-400 sm:col-span-2">Every show is already in this collection.</p>
                      )}
                    </form>

                    {userCollectionData.items.length ? (
                      <ul className="space-y-3">
                        {userCollectionData.items.map((item) => (
                          <li key={item.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-white/10 bg-neutral-800 p-3 sm:flex-nowrap">
                            {item.photo_url ? (
                              <img src={item.photo_url} alt={`${item.name} poster`} className="h-20 w-14 rounded-md object-cover" />
                            ) : (
                              <div className="flex h-20 w-14 items-center justify-center rounded-md bg-neutral-700 text-center text-[10px] text-neutral-400">No poster</div>
                            )}
                            <div className="min-w-0 flex-1">
                              <h4 className="truncate font-semibold text-white">{item.name}</h4>
                              <p className="mt-1 text-sm capitalize text-neutral-400">{item.type}</p>
                            </div>
                            <button
                              type="button"
                              aria-label={`Remove ${item.name} from collection`}
                              onClick={() => removeUserCollectionItem(item)}
                              className="rounded-lg bg-rose-950 p-2 text-rose-300 hover:bg-rose-900"
                            >
                              <Trash2 size={16} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="rounded-xl border border-white/10 bg-neutral-800 p-8 text-center text-sm text-neutral-400">
                        This collection is empty.
                      </p>
                    )}
                  </div>
                ) : null
              ) : userCollections?.length ? (
                <ul className="space-y-3">
                  {userCollections.map((collection) => (
                    <li key={collection.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-white/10 bg-neutral-800 p-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-semibold text-white">{collection.name}</h3>
                        <p className="mt-1 text-sm text-neutral-400">
                          {Number(collection.item_count)} {Number(collection.item_count) === 1 ? "title" : "titles"}
                          {" · "}
                          {collection.is_public ? "Public" : "Private"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => openUserCollection(collection)}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#3336cc] px-4 py-2 text-sm font-semibold text-white hover:bg-[#060863]"
                      >
                        <Pencil size={16} />
                        Edit collection
                      </button>
                    </li>
                  ))}
                </ul>
              ) : userCollections ? (
                <p className="rounded-xl border border-white/10 bg-neutral-800 p-8 text-center text-sm text-neutral-400">
                  This user has no collections.
                </p>
              ) : null
            ) : <AdminRecords recordsProps={recordsProps} />}
    </>
  );
};

export default UserAdminTab;
