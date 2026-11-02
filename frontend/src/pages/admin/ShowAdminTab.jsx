// Renders the show records list and manages the selected show's details and associations.
import { Pencil, Trash2, X } from "lucide-react";
import AdminRecords from "./AdminRecords";
import { displayValue, formatDatabaseDate } from "./adminUtils";

const ShowAdminTab = ({ showProps, recordsProps }) => {
  const {
    activeSection,
    selectedShow,
    showDetailsRef,
    startEdit,
    setSelectedShow,
    fields,
    showAssociations,
    relationValues,
    setRelationForm,
    setRelationValues,
    removeShowRelation,
    relationForm,
    saveShowRelation,
    saving,
  } = showProps;

  return (
    <>
          {/* Selected show details, including platform and cast/crew associations. */}
          {activeSection === "Show" && selectedShow && (
            <section
              ref={showDetailsRef}
              className="mb-6 scroll-mt-6 overflow-hidden rounded-xl border border-white/10 bg-neutral-800"
            >
              <header className="flex flex-wrap items-center gap-3 border-b border-white/10 bg-neutral-800 px-4 py-3">
                {selectedShow.photo_url ? (
                  <img
                    src={selectedShow.photo_url}
                    alt={`${selectedShow.name} poster`}
                    className="h-20 w-14 rounded-md object-cover shadow"
                  />
                ) : (
                  <div className="flex h-20 w-14 items-center justify-center rounded-md bg-neutral-700 text-center text-[10px] text-neutral-400">
                    No poster
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="font-serif text-xl">{selectedShow.name}</h3>
                  <p className="text-sm capitalize text-neutral-400">
                    {selectedShow.type} · {selectedShow.status}
                    {selectedShow.release_date ? ` · ${formatDatabaseDate(selectedShow.release_date)}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => startEdit(selectedShow)}
                  className="rounded-lg bg-[#EFAC61] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#ec9532]"
                >
                  Edit show
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedShow(null)}
                  aria-label="Close show details"
                  className="rounded-full p-2 text-neutral-300 hover:bg-white/10"
                >
                  <X size={18} />
                </button>
              </header>

              <div className="grid gap-5 p-4 sm:p-5">
                <div>
                  <h4 className="mb-2 font-semibold">Show details</h4>
                  <dl className="grid gap-3 rounded-lg bg-neutral-900 p-4 sm:grid-cols-2">
                    {fields
                      .filter((field) => !field.key && !field.readOnly)
                      .map((field) => (
                        <div key={field.name} className="min-w-0">
                          <dt className="text-xs font-semibold uppercase text-neutral-400">
                            {field.name.replaceAll("_", " ")}
                          </dt>
                          <dd className="mt-1 break-words text-sm">
                            {field.name === "photo_url" && selectedShow.photo_url ? (
                              <a
                                href={selectedShow.photo_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#9596D6] underline"
                              >
                                Open poster URL
                              </a>
                            ) : displayValue(selectedShow[field.name], field.type)}
                          </dd>
                        </div>
                      ))}
                  </dl>
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  {/* List and edit the streaming platforms associated with this show. */}
                  <section className="rounded-lg border border-white/10 bg-neutral-900 p-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <h4 className="font-semibold">Available on</h4>
                      <button
                        type="button"
                        onClick={() => {
                          setRelationForm({ type: "platform" });
                          setRelationValues({ create_new: false });
                        }}
                        className="rounded-lg bg-bg-[#3336cc] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#060863]"
                      >
                        + Add platform
                      </button>
                    </div>
                    {showAssociations?.platforms?.length ? (
                      <ul className="space-y-2">
                        {showAssociations.platforms.map((platform) => (
                          <li key={platform.id} className="flex items-center gap-3 rounded-lg bg-neutral-800 p-2">
                            {platform.logo_url && (
                              <img src={platform.logo_url} alt="" className="h-8 w-8 rounded object-contain" />
                            )}
                            <span className="min-w-0 flex-1 truncate text-sm font-medium">{platform.name}</span>
                            {platform.url && (
                              <a href={platform.url} target="_blank" rel="noreferrer" className="text-xs text-[#9596D6] underline">
                                Visit
                              </a>
                            )}
                            <button
                              type="button"
                              aria-label={`Edit ${platform.name}`}
                              onClick={() => {
                                setRelationForm({ type: "platform", mode: "edit-platform", record: platform });
                                setRelationValues({
                                  create_new: true,
                                  name: platform.name,
                                  logo_url: platform.logo_url ?? "",
                                  url: platform.url ?? "",
                                });
                              }}
                              className="rounded-lg bg-neutral-700 p-1.5 text-[#EFAC61] hover:bg-neutral-600"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              aria-label={`Remove ${platform.name}`}
                              onClick={() => removeShowRelation(
                                "show_sources",
                                { show_id: selectedShow.id, platform_id: platform.id },
                                platform.name,
                              )}
                              className="rounded-lg bg-rose-950 p-1.5 text-rose-300 hover:bg-rose-900"
                            >
                              <Trash2 size={14} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-neutral-400">No platforms linked yet.</p>
                    )}
                  </section>

                  {/* List and edit the cast and crew credits associated with this show. */}
                  <section className="rounded-lg border border-white/10 bg-neutral-900 p-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <h4 className="font-semibold">Cast and crew</h4>
                      <button
                        type="button"
                        onClick={() => {
                          setRelationForm({ type: "person" });
                          setRelationValues({ create_new: false });
                        }}
                        className="rounded-lg bg-bg-[#3336cc] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#060863]"
                      >
                        + Add person
                      </button>
                    </div>
                    {showAssociations?.cast?.length ? (
                      <ul className="space-y-2">
                        {showAssociations.cast.map((credit) => (
                          <li key={credit.id} className="flex items-center gap-3 rounded-lg bg-neutral-800 p-2">
                            {credit.person_photo_url && (
                              <img src={credit.person_photo_url} alt="" className="h-9 w-9 rounded-full object-cover" />
                            )}
                            <span className="min-w-0 flex-1 text-sm">
                              <span className="block truncate font-medium">{credit.person_name}</span>
                              <span className="block truncate text-xs text-neutral-400">
                                {credit.role}{credit.character_name ? ` · ${credit.character_name}` : ""}
                              </span>
                            </span>
                            <button
                              type="button"
                              aria-label={`Edit ${credit.person_name}`}
                              onClick={() => {
                                setRelationForm({ type: "person", mode: "edit-person", record: credit });
                                setRelationValues({
                                  create_new: true,
                                  name: credit.person_name,
                                  bio: credit.person_bio ?? "",
                                  photo_url: credit.person_photo_url ?? "",
                                  role: credit.role,
                                  character_name: credit.character_name ?? "",
                                  character_photo: credit.character_photo ?? "",
                                });
                              }}
                              className="rounded-lg bg-neutral-700 p-1.5 text-[#EFAC61] hover:bg-neutral-600"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              aria-label={`Remove ${credit.person_name}`}
                              onClick={() => removeShowRelation(
                                "show_roles",
                                { id: credit.id },
                                credit.person_name,
                              )}
                              className="rounded-lg bg-rose-950 p-1.5 text-rose-300 hover:bg-rose-900"
                            >
                              <Trash2 size={14} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-neutral-400">No cast or crew linked yet.</p>
                    )}
                  </section>
                </div>

                {/* Reuse one form to add or edit a platform or cast/crew association. */}
                {relationForm && (
                  <form onSubmit={saveShowRelation} className="rounded-lg border border-white/10 bg-neutral-950 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="font-semibold">
                        {relationForm.mode ? "Edit" : "Add"} {relationForm.type === "platform" ? "platform" : "cast or crew member"}
                      </h4>
                      <button type="button" aria-label="Cancel adding relation" onClick={() => setRelationForm(null)}>
                        <X size={18} />
                      </button>
                    </div>
                    {!relationForm.mode && (
                      <label className="mb-4 flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={Boolean(relationValues.create_new)}
                          onChange={(event) => setRelationValues({ create_new: event.target.checked })}
                        />
                        Create a new {relationForm.type === "platform" ? "platform" : "person"}
                      </label>
                    )}

                    {relationForm.type === "platform" ? (
                      relationValues.create_new ? (
                        <div className="grid gap-3 sm:grid-cols-3">
                          <input required placeholder="Platform name" value={relationValues.name ?? ""} onChange={(event) => setRelationValues((current) => ({ ...current, name: event.target.value }))} className="rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500" />
                          <input type="url" placeholder="Logo URL (optional)" value={relationValues.logo_url ?? ""} onChange={(event) => setRelationValues((current) => ({ ...current, logo_url: event.target.value }))} className="rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500" />
                          <input type="url" placeholder="Platform URL (optional)" value={relationValues.url ?? ""} onChange={(event) => setRelationValues((current) => ({ ...current, url: event.target.value }))} className="rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500" />
                        </div>
                      ) : (
                        <select required value={relationValues.platform_id ?? ""} onChange={(event) => setRelationValues((current) => ({ ...current, platform_id: event.target.value }))} className="w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white">
                          <option value="">Choose a platform</option>
                          {showAssociations?.platformOptions
                            ?.filter((option) => !showAssociations.platforms.some((item) => item.id === option.id))
                            .map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
                        </select>
                      )
                    ) : (
                      <>
                        {relationValues.create_new ? (
                          <div className="mb-3 grid gap-3 sm:grid-cols-3">
                            <input required placeholder="Person name" value={relationValues.name ?? ""} onChange={(event) => setRelationValues((current) => ({ ...current, name: event.target.value }))} className="rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500" />
                            <input placeholder="Bio (optional)" value={relationValues.bio ?? ""} onChange={(event) => setRelationValues((current) => ({ ...current, bio: event.target.value }))} className="rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500" />
                            <input type="url" placeholder="Photo URL (optional)" value={relationValues.photo_url ?? ""} onChange={(event) => setRelationValues((current) => ({ ...current, photo_url: event.target.value }))} className="rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500" />
                          </div>
                        ) : (
                          <select required value={relationValues.people_id ?? ""} onChange={(event) => setRelationValues((current) => ({ ...current, people_id: event.target.value }))} className="mb-3 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white">
                            <option value="">Choose a person</option>
                            {showAssociations?.peopleOptions?.map((option) => (
                              <option key={option.id} value={option.id}>{option.name}</option>
                            ))}
                          </select>
                        )}
                        <div className="grid gap-3 sm:grid-cols-2">
                          <input required placeholder="Credit (e.g. actor, director)" value={relationValues.role ?? ""} onChange={(event) => setRelationValues((current) => ({ ...current, role: event.target.value }))} className="rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500" />
                          <input placeholder="Character name (optional)" value={relationValues.character_name ?? ""} onChange={(event) => setRelationValues((current) => ({ ...current, character_name: event.target.value }))} className="rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500" />
                        </div>
                      </>
                    )}
                    <div className="mt-4 flex justify-end gap-2">
                      <button type="button" onClick={() => setRelationForm(null)} className="rounded-lg px-4 py-2 text-sm text-neutral-300 hover:bg-white/10">Cancel</button>
                      <button type="submit" disabled={saving} className="rounded-lg bg-bg-[#3336cc] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                        {saving ? "Saving…" : "Add"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </section>
          )}
      {/* Keep the shared show list available below the selected show's detail panel. */}
      <AdminRecords recordsProps={recordsProps} />
    </>
  );
};

export default ShowAdminTab;
