import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  ListVideo,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

const sections = [
  { label: "User", entities: [{ name: "users", label: "Users" }] },
  { label: "Show", entities: [{ name: "shows", label: "Shows" }] },
  { label: "Submission", entities: [{ name: "show_submission", label: "Submissions" }] },
];

const PAGE_SIZE = 50;

const getRecordKey = (row, keys) =>
  Object.fromEntries(keys.map((key) => [key, row[key]]));

const formatDatabaseDateTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Bangkok",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
};

const formatDatabaseDate = (value) => {
  const datePart = String(value).slice(0, 10);
  const date = new Date(`${datePart}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return "Invalid date";

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const displayValue = (value, type) => {
  if (value === null || value === undefined || value === "") return "—";
  if (type === "datetime") return formatDatabaseDateTime(value);
  if (type === "date") return formatDatabaseDate(value);
  if (type === "boolean") {
    if (value === true || value === 1) return "Yes";
    return "No";
  }
  return String(value);
};

const Admin = ({ user }) => {
  const [activeSection, setActiveSection] = useState("User");
  const [entityName, setEntityName] = useState("users");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [records, setRecords] = useState([]);
  const [fields, setFields] = useState([]);
  const [keys, setKeys] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [reload, setReload] = useState(0);
  const [selectedShow, setSelectedShow] = useState(null);
  const [showAssociations, setShowAssociations] = useState(null);
  const [relationForm, setRelationForm] = useState(null);
  const [relationValues, setRelationValues] = useState({});
  const [selectedWatchlistUser, setSelectedWatchlistUser] = useState(null);
  const [watchlistData, setWatchlistData] = useState(null);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [watchlistReload, setWatchlistReload] = useState(0);
  const [newWatchlistShowId, setNewWatchlistShowId] = useState("");
  const [newWatchlistStatus, setNewWatchlistStatus] = useState("wishlist");
  const showDetailsRef = useRef(null);
  const editorRef = useRef(null);

  const activeGroup = sections.find((section) => section.label === activeSection);
  const entities = activeGroup?.entities ?? [];
  const selectedEntity = entities.find((entity) => entity.name === entityName) ?? entities[0];

  useEffect(() => {
    if (!selectedEntity) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const response = await axios.get(`/api/admin/${selectedEntity.name}`, {
          params: { limit: PAGE_SIZE, offset: page * PAGE_SIZE, q: search.trim() },
        });
        if (cancelled) return;
        setRecords(response.data.rows);
        if (selectedEntity.name === "shows") {
          setSelectedShow((current) =>
            current ? response.data.rows.find((row) => row.id === current.id) ?? current : null,
          );
        }
        setFields(response.data.fields);
        setKeys(response.data.keys);
        setTotal(response.data.total);
      } catch (requestError) {
        if (cancelled) return;
        setRecords([]);
        setError(requestError.response?.data?.message ?? "Unable to load admin records.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, search ? 250 : 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [selectedEntity, page, search, reload]);

  useEffect(() => {
    if (!selectedShow) {
      return undefined;
    }

    let cancelled = false;
    axios.get(`/api/admin/shows/${selectedShow.id}/associations`)
      .then((response) => {
        if (!cancelled) setShowAssociations(response.data);
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(requestError.response?.data?.message ?? "Unable to load show details.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedShow, reload]);

  useEffect(() => {
    const target = form
      ? editorRef.current
      : activeSection === "Show" && selectedShow
        ? showDetailsRef.current
        : null;

    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [activeSection, form, selectedShow]);

  useEffect(() => {
    if (!selectedWatchlistUser) {
      return undefined;
    }

    let cancelled = false;
    axios.get(`/api/admin/users/${selectedWatchlistUser.id}/watchlist`)
      .then((response) => {
        if (!cancelled) setWatchlistData(response.data);
      })
      .catch((requestError) => {
        if (!cancelled) {
          setWatchlistData(null);
          setError(requestError.response?.data?.message ?? "Unable to load this user's watchlist.");
        }
      })
      .finally(() => {
        if (!cancelled) setWatchlistLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedWatchlistUser, watchlistReload]);

  const visibleFields = useMemo(
    () => fields.filter((field) => !field.writeOnly),
    [fields],
  );

  const startCreate = () => {
    setNotice("");
    setForm({ mode: "create", record: null });
    setFormValues({});
  };

  const startEdit = (record) => {
    setNotice("");
    setForm({ mode: "edit", record });
    setFormValues(
      Object.fromEntries(
        fields
          .filter((field) => !field.key && !field.readOnly && !field.generated && !field.writeOnly)
          .map((field) => [field.name, record[field.name] ?? ""]),
      ),
    );
  };

  const changeSection = (section) => {
    const nextGroup = sections.find((item) => item.label === section);
    setActiveSection(section);
    setEntityName(nextGroup.entities[0].name);
    setPage(0);
    setSearch("");
    setForm(null);
    setSelectedShow(null);
    setShowAssociations(null);
    setRelationForm(null);
    setSelectedWatchlistUser(null);
    setWatchlistData(null);
    setWatchlistLoading(false);
    setNotice("");
  };

  const changeEntity = (name) => {
    setEntityName(name);
    setPage(0);
    setForm(null);
    setNotice("");
  };

  const saveShowRelation = async (event) => {
    event.preventDefault();
    if (!selectedShow || !relationForm) return;

    setSaving(true);
    setError("");
    setNotice("");
    try {
      if (relationForm.mode === "edit-platform") {
        await axios.put("/api/admin/show_platform", {
          key: { id: relationForm.record.id },
          values: {
            name: relationValues.name,
            logo_url: relationValues.logo_url || null,
            url: relationValues.url || null,
          },
        });
        setNotice("Platform details updated.");
      } else if (relationForm.mode === "edit-person") {
        await axios.put("/api/admin/people", {
          key: { id: relationForm.record.people_id },
          values: {
            name: relationValues.name,
            bio: relationValues.bio || null,
            photo_url: relationValues.photo_url || null,
          },
        });
        await axios.put("/api/admin/show_roles", {
          key: { id: relationForm.record.id },
          values: {
            role: relationValues.role,
            character_name: relationValues.character_name || null,
            character_photo: relationValues.character_photo || null,
          },
        });
        setNotice("Person and show credit updated.");
      } else if (relationForm.type === "platform") {
        const platformId = relationValues.platform_id
          ? Number(relationValues.platform_id)
          : (await axios.post("/api/admin/show_platform", {
            values: {
              name: relationValues.name,
              logo_url: relationValues.logo_url || null,
              url: relationValues.url || null,
            },
          })).data.row.id;

        await axios.post("/api/admin/show_sources", {
          values: { show_id: selectedShow.id, platform_id: platformId },
        });
        setNotice("Platform added to this show.");
      } else {
        const personId = relationValues.people_id
          ? Number(relationValues.people_id)
          : (await axios.post("/api/admin/people", {
            values: {
              name: relationValues.name,
              bio: relationValues.bio || null,
              photo_url: relationValues.photo_url || null,
            },
          })).data.row.id;

        await axios.post("/api/admin/show_roles", {
          values: {
            show_id: selectedShow.id,
            people_id: personId,
            role: relationValues.role,
            character_name: relationValues.character_name || null,
            character_photo: relationValues.character_photo || null,
          },
        });
        setNotice("Cast or crew member added to this show.");
      }
      setRelationForm(null);
      setRelationValues({});
      setReload((value) => value + 1);
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Unable to add this show detail.");
    } finally {
      setSaving(false);
    }
  };

  const removeShowRelation = async (entity, key, label) => {
    if (!window.confirm(`Remove ${label} from this show?`)) return;
    setError("");
    setNotice("");
    try {
      await axios.delete(`/api/admin/${entity}`, { data: { key } });
      setNotice(`${label} removed from this show.`);
      setReload((value) => value + 1);
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? `Unable to remove ${label}.`);
    }
  };

  const submitForm = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    const values = { ...formValues };
    if (form.mode === "edit" && !values.password) delete values.password;

    try {
      if (form.mode === "create") {
        await axios.post(`/api/admin/${selectedEntity.name}`, { values });
        setNotice("Record created.");
      } else {
        const key = getRecordKey(form.record, keys);
        await axios.put(`/api/admin/${selectedEntity.name}`, { key, values });
        setNotice(selectedEntity.name === "users" && values.role === "moderator"
          ? "User saved. Moderator role assigned."
          : "Record updated.");
      }
      setForm(null);
      setPage(0);
      setReload((value) => value + 1);
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Unable to save this record.");
    } finally {
      setSaving(false);
    }
  };

  const removeRecord = async (record) => {
    const key = getRecordKey(record, keys);
    const summary = keys.map((name) => `${name}: ${record[name]}`).join(", ");
    if (!window.confirm(`Delete this record (${summary})? Related records may also be deleted.`)) {
      return;
    }

    setError("");
    setNotice("");
    try {
      await axios.delete(`/api/admin/${selectedEntity.name}`, { data: { key } });
      if (selectedEntity.name === "shows" && selectedShow?.id === record.id) {
        setSelectedShow(null);
      }
      setNotice("Record deleted.");
      setReload((value) => value + 1);
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Unable to delete this record.");
    }
  };

  const addWatchlistItem = async (event) => {
    event.preventDefault();
    if (!selectedWatchlistUser || !newWatchlistShowId) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await axios.post(`/api/admin/users/${selectedWatchlistUser.id}/watchlist`, {
        show_id: Number(newWatchlistShowId),
        status: newWatchlistStatus,
      });
      setNotice("Show added to the user's watchlist.");
      setNewWatchlistShowId("");
      setWatchlistReload((value) => value + 1);
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Unable to add this show to the watchlist.");
    } finally {
      setSaving(false);
    }
  };

  const updateWatchlistStatus = async (showId, status) => {
    if (!selectedWatchlistUser) return;
    setError("");
    setNotice("");
    try {
      await axios.put(`/api/admin/users/${selectedWatchlistUser.id}/watchlist/${showId}`, { status });
      setNotice("Watchlist status updated.");
      setWatchlistReload((value) => value + 1);
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Unable to update this watchlist item.");
    }
  };

  const openWatchlist = (record) => {
    setError("");
    setNotice("");
    setWatchlistData(null);
    setWatchlistLoading(true);
    setNewWatchlistShowId("");
    setNewWatchlistStatus("wishlist");
    setSelectedWatchlistUser(record);
  };

  const removeWatchlistItem = async (item) => {
    if (!selectedWatchlistUser) return;
    if (!window.confirm(`Remove "${item.name}" from ${selectedWatchlistUser.username}'s watchlist?`)) return;
    setError("");
    setNotice("");
    try {
      await axios.delete(
        `/api/admin/users/${selectedWatchlistUser.id}/watchlist/${item.show_id}`,
      );
      setNotice("Show removed from the user's watchlist.");
      setWatchlistReload((value) => value + 1);
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Unable to remove this watchlist item.");
    }
  };

  const renderInput = (field) => {
    const value = formValues[field.name] ?? "";
    const sharedClass =
      "mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white outline-none focus:border-[#9596D6] focus:ring-2 focus:ring-[#9596D6]/30";

    if (field.type === "boolean") {
      return (
        <label key={field.name} className="flex items-center gap-3 rounded-lg bg-neutral-800 p-3 text-sm text-neutral-200">
          <input
            type="checkbox"
            checked={value === true || value === 1 || value === "1"}
            onChange={(event) =>
              setFormValues((current) => ({ ...current, [field.name]: event.target.checked }))
            }
            className="h-4 w-4 accent-fuchsia-600"
          />
          {field.name.replaceAll("_", " ")}
        </label>
      );
    }

    let control;
    if (field.type === "enum") {
      control = (
        <select
          required={field.required}
          value={value}
          onChange={(event) =>
            setFormValues((current) => ({ ...current, [field.name]: event.target.value }))
          }
          className={sharedClass}
        >
          <option value="">Select…</option>
          {field.options.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      );
    } else if (field.type === "longtext") {
      control = (
        <textarea
          value={value}
          onChange={(event) =>
            setFormValues((current) => ({ ...current, [field.name]: event.target.value }))
          }
          className={`${sharedClass} min-h-24`}
        />
      );
    } else {
      const type = {
        integer: "number",
        date: "date",
        password: "password",
        url: "url",
      }[field.type] ?? "text";
      control = (
        <input
          type={type}
          required={(field.required || (field.type === "password" && form.mode === "create"))}
          autoComplete={field.type === "password" ? "new-password" : undefined}
          value={field.type === "date" && value ? String(value).slice(0, 10) : value}
          onChange={(event) =>
            setFormValues((current) => ({
              ...current,
              [field.name]: type === "number" && event.target.value !== ""
                ? Number(event.target.value)
                : event.target.value,
            }))
          }
          className={sharedClass}
        />
      );
    }

    return (
      <label key={field.name} className="block text-sm font-medium capitalize text-neutral-200">
        {field.name === "photo_url" && selectedEntity.name === "shows"
          ? "Poster image URL"
          : field.name.replaceAll("_", " ")}
        {field.nullable && <span className="ml-1 text-xs font-normal text-neutral-400">(optional)</span>}
        {control}
        {field.name === "photo_url" && selectedEntity.name === "shows" && (
          <span className="mt-1 block text-xs font-normal text-neutral-400">
            Paste a direct HTTP or HTTPS link to the movie or show poster.
            {value && /^https?:\/\//i.test(value) && (
              <img src={value} alt="Poster preview" className="mt-2 h-32 w-24 rounded object-cover" />
            )}
          </span>
        )}
      </label>
    );
  };

  const isInlineEdit = (record) =>
    form?.mode === "edit" &&
    record &&
    JSON.stringify(getRecordKey(form.record, keys)) === JSON.stringify(getRecordKey(record, keys));

  const renderEditor = () => form && (
    <form
      ref={editorRef}
      onSubmit={submitForm}
      className="mb-5 scroll-mt-6 rounded-xl border border-white/10 bg-neutral-800 p-4 sm:p-5"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-semibold">
          {form.mode === "create" ? "Add" : "Edit"} {selectedEntity.label.replace(/s$/, "")}
        </h3>
        <button type="button" aria-label="Close form" onClick={() => setForm(null)} className="rounded-full p-1 text-neutral-300 hover:bg-white/10">
          <X size={18} />
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {fields
          .filter((field) => (!field.key || field.createKey) && !field.readOnly && !field.generated)
          .map(renderInput)}
        {selectedEntity.name === "users" && form.mode === "edit" && (
          <p className="text-xs text-neutral-400 sm:col-span-2">
            Leave password blank to keep the current password. Password hashes are never shown.
          </p>
        )}
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={() => setForm(null)} className="rounded-lg px-4 py-2 text-sm text-neutral-300 hover:bg-white/10">
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-purple-600 px-5 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );

  return (
    <main className="min-h-screen px-4 pb-16 pt-8 text-white sm:pt-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col justify-between gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#EFAC61]">Control room</p>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Admin</h1>
            <p className="mt-2 text-sm text-neutral-400">
              Signed in as <span className="font-medium text-neutral-200">{user?.username}</span>
            </p>
          </div>
          <label className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-neutral-900/80 px-4 py-3 shadow-lg sm:max-w-sm">
            <span className="sr-only">Search admin records</span>
            <Search size={18} className="shrink-0 text-neutral-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(0);
              }}
              placeholder={`Search ${selectedEntity?.label.toLowerCase() ?? "records"}`}
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-neutral-500"
            />
          </label>
        </div>

        <nav aria-label="Admin sections" className="mb-6 flex flex-wrap gap-2">
          {sections.map((section) => (
            <button
              key={section.label}
              type="button"
              aria-current={activeSection === section.label ? "page" : undefined}
              onClick={() => changeSection(section.label)}
              className={`min-w-24 rounded-full px-5 py-2 text-sm font-medium transition ${
                activeSection === section.label
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-950/40"
                  : "border border-white/10 bg-neutral-900/80 text-neutral-300 hover:bg-neutral-800 hover:text-white"
              }`}
            >
              {section.label}
            </button>
          ))}
        </nav>

        <section
          aria-label={`${selectedEntity?.label ?? "Admin"} management`}
          className="mx-auto max-w-5xl rounded-2xl border border-white/10 bg-neutral-900/90 p-4 shadow-2xl shadow-black/30 sm:p-7"
        >
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold">
                {selectedWatchlistUser
                  ? `${selectedWatchlistUser.username}'s Watchlist`
                  : selectedEntity?.label}
              </h2>
              {entities.length > 1 && (
                <label className="mt-2 block text-xs font-medium text-neutral-400">
                  Data type
                  <select
                    value={selectedEntity.name}
                    onChange={(event) => changeEntity(event.target.value)}
                    className="ml-2 rounded-md border border-neutral-600 bg-neutral-800 px-2 py-1 text-sm text-white"
                  >
                    {entities.map((entity) => (
                      <option key={entity.name} value={entity.name}>{entity.label}</option>
                    ))}
                  </select>
                </label>
              )}
            </div>
            {selectedWatchlistUser ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedWatchlistUser(null);
                  setWatchlistData(null);
                  setWatchlistLoading(false);
                  setError("");
                  setNotice("");
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-neutral-700 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-600"
              >
                <ChevronLeft size={16} />
                Back to users
              </button>
            ) : (
              <button
                type="button"
                onClick={startCreate}
                className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700"
              >
                <Plus size={16} />
                Add {selectedEntity?.label.replace(/s$/, "")}
              </button>
            )}
          </div>

          {notice && <p role="status" className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-950/70 p-3 text-sm text-emerald-200">{notice}</p>}
          {error && <p role="alert" className="mb-4 rounded-lg border border-rose-500/30 bg-rose-950/70 p-3 text-sm text-rose-200">{error}</p>}

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
                        <option key={status} value={status}>{status.replaceAll("_", " ")}</option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="submit"
                    disabled={saving || !watchlistData.availableShows.length}
                    className="self-end rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
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
                        <label className="w-full text-xs font-medium text-neutral-400 sm:w-44">
                          Watch status
                          <select
                            value={item.status}
                            onChange={(event) => updateWatchlistStatus(item.show_id, event.target.value)}
                            className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-900 px-3 py-2 text-sm text-white"
                          >
                            {watchlistData.statuses.map((status) => (
                              <option key={status} value={status}>{status.replaceAll("_", " ")}</option>
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
          ) : (
          <>
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
                  <section className="rounded-lg border border-white/10 bg-neutral-900 p-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <h4 className="font-semibold">Available on</h4>
                      <button
                        type="button"
                        onClick={() => {
                          setRelationForm({ type: "platform" });
                          setRelationValues({ create_new: false });
                        }}
                        className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-700"
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

                  <section className="rounded-lg border border-white/10 bg-neutral-900 p-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <h4 className="font-semibold">Cast and crew</h4>
                      <button
                        type="button"
                        onClick={() => {
                          setRelationForm({ type: "person" });
                          setRelationValues({ create_new: false });
                        }}
                        className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-700"
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
                      <button type="submit" disabled={saving} className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                        {saving ? "Saving…" : "Add"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </section>
          )}

          {form && !isInlineEdit(form.record) && renderEditor()}

          {loading ? (
            <p role="status" className="rounded-xl border border-white/10 bg-neutral-800 p-8 text-center text-sm text-neutral-400">Loading records…</p>
          ) : records.length ? (
            <div className="space-y-3">
              {records.map((record) => {
                const key = getRecordKey(record, keys);
                return (
                  <article key={JSON.stringify(key)} className="overflow-hidden rounded-xl border border-white/10 bg-neutral-800">
                    <header className="flex items-center gap-3 border-b border-white/10 bg-neutral-800 px-4 py-2">
                      {selectedEntity.name === "users"
                        ? <UserRound aria-hidden="true" size={18} className="fill-slate-950" />
                        : <CircleUserRound aria-hidden="true" size={18} />}
                      <h3 className="min-w-0 flex-1 truncate text-sm font-semibold">
                        {record.username ?? record.name ?? record.email ?? keys.map((name) => `${name} ${record[name]}`).join(" · ")}
                        {record.role === "moderator" && (
                          <span className="ml-2 rounded-full bg-[#EFAC61]/15 px-2 py-0.5 text-xs font-medium text-[#EFAC61]">Moderator</span>
                        )}
                      </h3>
                      {selectedEntity.name === "shows" && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowAssociations(null);
                            setSelectedShow(record);
                          }}
                          className="rounded-lg bg-neutral-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-600"
                        >
                          Details
                        </button>
                      )}
                      {selectedEntity.name === "users" && (
                        <button
                          type="button"
                          onClick={() => openWatchlist(record)}
                          className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-purple-700"
                        >
                          <ListVideo size={16} />
                          Watchlist
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => startEdit(record)}
                        className="rounded-lg bg-[#EFAC61] px-4 py-1.5 text-sm font-semibold text-black hover:bg-[#ec9532]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete record ${JSON.stringify(key)}`}
                        onClick={() => removeRecord(record)}
                        className="rounded-lg bg-rose-950 p-2 text-rose-300 hover:bg-rose-900"
                      >
                        <Trash2 size={15} />
                      </button>
                    </header>
                    {isInlineEdit(record) ? (
                      <div className="p-4">
                        {renderEditor()}
                      </div>
                    ) : (
                      <>
                        {selectedEntity.name === "shows" && record.photo_url && (
                          <div className="px-4 pt-4">
                            <img src={record.photo_url} alt={`${record.name} poster`} className="h-36 w-24 rounded-lg object-cover shadow" />
                          </div>
                        )}
                        <dl className="grid gap-x-5 gap-y-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
                          {visibleFields.map((field) => (
                            <div key={field.name} className="min-w-0">
                              <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                                {field.name.replaceAll("_", " ")}
                              </dt>
                              <dd className="mt-1 break-words text-sm text-neutral-200">
                                {displayValue(record[field.name], field.type)}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="rounded-xl border border-white/10 bg-neutral-800 p-8 text-center text-sm text-neutral-400">
              {search ? `No ${selectedEntity?.label.toLowerCase()} match “${search}”.` : `No ${selectedEntity?.label.toLowerCase()} yet.`}
            </p>
          )}

          <footer className="mt-5 flex items-center justify-between gap-3 text-sm text-neutral-400">
            <span>{total ? `${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, total)} of ${total}` : "0 records"}</span>
            <div className="flex gap-2">
              <button
                type="button"
                aria-label="Previous page"
                disabled={page === 0 || loading}
                onClick={() => setPage((current) => Math.max(0, current - 1))}
                className="rounded-lg bg-neutral-800 p-2 text-white hover:bg-neutral-700 disabled:opacity-40"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                aria-label="Next page"
                disabled={(page + 1) * PAGE_SIZE >= total || loading}
                onClick={() => setPage((current) => current + 1)}
                className="rounded-lg bg-neutral-800 p-2 text-white hover:bg-neutral-700 disabled:opacity-40"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </footer>
          </>
          )}
        </section>
      </div>
    </main>
  );
};

export default Admin;
