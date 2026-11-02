// MAIN Admin controller(handles actions such as saving & deleting, renders the page header, tab navigation, search, and shared controls.)
// fetch backend data, create recordsProps
import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  ChevronLeft,
  Camera,
  Plus,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { PAGE_SIZE, getRecordKey } from "./admin/adminUtils";
import UserAdminTab from "./admin/UserAdminTab";
import ShowAdminTab from "./admin/ShowAdminTab";
import SubmissionAdminTab from "./admin/SubmissionAdminTab";

// This file controls the admin dashboard. It lets staff switch between entity groups,
// browse table data, search/filter records, and create, edit, or delete entries.
const sections = [
  { label: "User", entities: [{ name: "users", label: "Users" }] },
  { label: "Show", entities: [{ name: "shows", label: "Shows" }] },
  { label: "Submission", entities: [{ name: "show_submission", label: "Submissions" }] },
];

// Shared constant for paginated admin queries.
const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
// Main admin page component. It loads data from /api/admin, manages the active entity,
// and renders the table, search bar, create/edit modal form, and show details.
const Admin = ({ user }) => {
  // Track the selected table, its records, paging, and request feedback.
  const [activeSection, setActiveSection] = useState("User");
  const [entityName, setEntityName] = useState("users");
  const [search, setSearch] = useState("");
  const [submissionStatusFilter, setSubmissionStatusFilter] = useState("pending");
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
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [reload, setReload] = useState(0);
  // Track the selected show and the form for managing its platform and cast links.
  const [selectedShow, setSelectedShow] = useState(null);
  const [showAssociations, setShowAssociations] = useState(null);
  const [relationForm, setRelationForm] = useState(null);
  const [relationValues, setRelationValues] = useState({});
  // Track the selected user's watchlist and collection management views.
  const [selectedWatchlistUser, setSelectedWatchlistUser] = useState(null);
  const [watchlistData, setWatchlistData] = useState(null);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [watchlistReload, setWatchlistReload] = useState(0);
  const [newWatchlistShowId, setNewWatchlistShowId] = useState("");
  const [newWatchlistStatus, setNewWatchlistStatus] = useState("wishlist");
  const [selectedCollectionUser, setSelectedCollectionUser] = useState(null);
  const [userCollections, setUserCollections] = useState(null);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [selectedUserCollection, setSelectedUserCollection] = useState(null);
  const [userCollectionData, setUserCollectionData] = useState(null);
  const [collectionLoading, setCollectionLoading] = useState(false);
  const [collectionReload, setCollectionReload] = useState(0);
  const [newCollectionShowId, setNewCollectionShowId] = useState("");
  const [followedCollectionData, setFollowedCollectionData] = useState(null);
  const [followedCollectionLoading, setFollowedCollectionLoading] = useState(false);
  const [selectedFollowCollectionId, setSelectedFollowCollectionId] = useState("");
  const showDetailsRef = useRef(null);
  const editorRef = useRef(null);
  const avatarInputRef = useRef(null);

  // Release temporary object URLs used to preview a selected avatar image.
  useEffect(() => () => {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
  }, [avatarPreview]);

  const activeGroup = sections.find((section) => section.label === activeSection);
  const entities = activeGroup?.entities ?? [];
  const selectedEntity = entities.find((entity) => entity.name === entityName) ?? entities[0];

  // Fetch the currently selected table data (rows, fields, primary keys, etc.) from the backend.
  useEffect(() => {
    if (!selectedEntity) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const response = await axios.get(`/api/admin/${selectedEntity.name}`, {
          params: {
            limit: PAGE_SIZE,
            offset: page * PAGE_SIZE,
            q: search.trim(),
            ...(selectedEntity.name === "show_submission"
              ? { submission_status: submissionStatusFilter }
              : {}),
          },
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
  }, [selectedEntity, page, search, submissionStatusFilter, reload]);

  // Load detailed relations for the selected show, such as platforms, cast members, and crew credits.
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

  // Bring the active editor or selected show's detail panel into view.
  useEffect(() => {
    const target = form
      ? editorRef.current
      : activeSection === "Show" && selectedShow
        ? showDetailsRef.current
        : null;

    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [activeSection, form, selectedShow]);

  // Load the selected user's watchlist so it can be managed in the admin panel.
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

  // Load the selected user's owned collections.
  useEffect(() => {
    if (!selectedCollectionUser) {
      return undefined;
    }

    let cancelled = false;
    axios.get(`/api/admin/users/${selectedCollectionUser.id}/collections`)
      .then((response) => {
        if (!cancelled) setUserCollections(response.data.collections);
      })
      .catch((requestError) => {
        if (!cancelled) {
          setUserCollections(null);
          setError(requestError.response?.data?.message ?? "Unable to load this user's collections.");
        }
      })
      .finally(() => {
        if (!cancelled) setCollectionsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCollectionUser, collectionReload]);

  // Load the public collections this user follows and the ones they may follow.
  useEffect(() => {
    if (!selectedCollectionUser) {
      return undefined;
    }

    let cancelled = false;
    axios.get(`/api/admin/users/${selectedCollectionUser.id}/followed-collections`)
      .then((response) => {
        if (!cancelled) setFollowedCollectionData(response.data);
      })
      .catch((requestError) => {
        if (!cancelled) {
          setFollowedCollectionData(null);
          setError(requestError.response?.data?.message ?? "Unable to load followed collections.");
        }
      })
      .finally(() => {
        if (!cancelled) setFollowedCollectionLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCollectionUser, collectionReload]);

  // Load the selected collection's items and the shows available to add.
  useEffect(() => {
    if (!selectedCollectionUser || !selectedUserCollection) {
      return undefined;
    }

    let cancelled = false;
    axios.get(`/api/admin/users/${selectedCollectionUser.id}/collections/${selectedUserCollection.id}`)
      .then((response) => {
        if (!cancelled) setUserCollectionData(response.data);
      })
      .catch((requestError) => {
        if (!cancelled) {
          setUserCollectionData(null);
          setError(requestError.response?.data?.message ?? "Unable to load this collection.");
        }
      })
      .finally(() => {
        if (!cancelled) setCollectionLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCollectionUser, selectedUserCollection, collectionReload]);

  const visibleFields = useMemo(
    () => fields.filter((field) => !field.writeOnly),
    [fields],
  );

  // Initialize a blank form for creating a record.
  const startCreate = () => {
    setNotice("");
    setForm({ mode: "create", record: null });
    setFormValues({});
    setAvatarFile(null);
    setAvatarPreview(null);
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  };

  // Populate the editor from a record while excluding fields that cannot be edited.
  const startEdit = (record) => {
    setNotice("");
    setForm({ mode: "edit", record });
    setAvatarFile(null);
    setAvatarPreview(null);
    if (avatarInputRef.current) avatarInputRef.current.value = "";
    setFormValues(
      Object.fromEntries(
        fields
          .filter((field) => !field.key && !field.readOnly && !field.generated && !field.writeOnly)
          .map((field) => [field.name, record[field.name] ?? ""]),
      ),
    );
  };

  // Close the editor and clear any selected avatar upload or preview.
  const closeEditor = () => {
    setForm(null);
    setAvatarFile(null);
    setAvatarPreview(null);
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  };

  // Switch dashboard sections and clear state belonging to the previous section.
  const changeSection = (section) => {
    const nextGroup = sections.find((item) => item.label === section);
    setActiveSection(section);
    setEntityName(nextGroup.entities[0].name);
    setPage(0);
    setSearch("");
    closeEditor();
    setSelectedShow(null);
    setShowAssociations(null);
    setRelationForm(null);
    setSelectedWatchlistUser(null);
    setWatchlistData(null);
    setWatchlistLoading(false);
    setSelectedCollectionUser(null);
    setUserCollections(null);
    setSelectedUserCollection(null);
    setUserCollectionData(null);
    setCollectionLoading(false);
    setFollowedCollectionData(null);
    setFollowedCollectionLoading(false);
    setNotice("");
  };

  // Change the selected entity table and reset its pagination and editor.
  const changeEntity = (name) => {
    setEntityName(name);
    setPage(0);
    closeEditor();
    setNotice("");
  };

  // Create or update a show's platform or cast/crew association.
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

  // Remove a platform or cast/crew association after confirmation.
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

  // Submit the record editor and, when selected, upload a new user avatar.
  const submitForm = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    const values = { ...formValues };
    if (form.mode === "edit" && !values.password) delete values.password;
    if (avatarFile) delete values.avatar_url;

    try {
      if (form.mode === "create") {
        await axios.post(`/api/admin/${selectedEntity.name}`, { values });
        setNotice("Record created.");
      } else {
        const key = getRecordKey(form.record, keys);
        await axios.put(`/api/admin/${selectedEntity.name}`, { key, values });
        if (avatarFile && selectedEntity.name === "users") {
          const data = new FormData();
          data.append("avatar", avatarFile);
          await axios.put(`/api/admin/users/${form.record.id}/avatar`, data);
        }
        setNotice(selectedEntity.name === "users" && values.role === "moderator"
          ? "User saved. Moderator role assigned."
          : "Record updated.");
      }
      setForm(null);
      setAvatarFile(null);
      setAvatarPreview(null);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
      setPage(0);
      setReload((value) => value + 1);
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Unable to save this record.");
    } finally {
      setSaving(false);
    }
  };

  // Delete a record after confirmation and refresh the current admin list.
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

  // Add a selected show to the selected user's watchlist.
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

  // Update a watchlist item's status and reload the user's watchlist.
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

  // Open a user's watchlist and reset stale data from other user-management views.
  const openWatchlist = (record) => {
    setError("");
    setNotice("");
    setCollectionsLoading(false);
    setCollectionLoading(false);
    setSelectedCollectionUser(null);
    setSelectedUserCollection(null);
    setUserCollectionData(null);
    setFollowedCollectionData(null);
    setFollowedCollectionLoading(false);
    setWatchlistData(null);
    setWatchlistLoading(true);
    setNewWatchlistShowId("");
    setNewWatchlistStatus("wishlist");
    setSelectedWatchlistUser(record);
  };

  // Open a user's collections and reset stale watchlist or collection detail state.
  const openCollections = (record) => {
    setError("");
    setNotice("");
    setWatchlistLoading(false);
    setSelectedWatchlistUser(null);
    setWatchlistData(null);
    setSelectedCollectionUser(record);
    setCollectionsLoading(true);
    setUserCollections(null);
    setSelectedUserCollection(null);
    setUserCollectionData(null);
    setFollowedCollectionData(null);
    setFollowedCollectionLoading(true);
    setCollectionLoading(false);
    setNewCollectionShowId("");
  };

  // Follow or unfollow a collection on behalf of the selected user.
  const changeFollowedCollection = async (action, collectionId) => {
    if (!selectedCollectionUser || !collectionId) return;
    setError("");
    setNotice("");
    setSaving(true);
    try {
      if (action === "follow") {
        await axios.post(
          `/api/admin/users/${selectedCollectionUser.id}/followed-collections/${collectionId}`,
        );
        setNotice("Collection followed for this user.");
      } else {
        await axios.delete(
          `/api/admin/users/${selectedCollectionUser.id}/followed-collections/${collectionId}`,
        );
        setNotice("Collection unfollowed for this user.");
      }
      setSelectedFollowCollectionId("");
      setCollectionReload((value) => value + 1);
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Unable to update followed collections.");
    } finally {
      setSaving(false);
    }
  };

  // Select a collection and load its detail view.
  const openUserCollection = (collection) => {
    setError("");
    setNotice("");
    setUserCollectionData(null);
    setCollectionLoading(true);
    setNewCollectionShowId("");
    setSelectedUserCollection(collection);
  };

  // Save changes to the selected collection's name and visibility.
  const updateCollectionDetails = async (event) => {
    event.preventDefault();
    if (!selectedCollectionUser || !userCollectionData) return;
    const { collection } = userCollectionData;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await axios.put(
        `/api/admin/users/${selectedCollectionUser.id}/collections/${collection.id}`,
        { name: collection.name, is_public: Boolean(collection.is_public) },
      );
      setUserCollectionData((current) => ({ ...current, collection: response.data.collection }));
      setSelectedUserCollection((current) => current
        ? { ...current, ...response.data.collection }
        : current);
      setCollectionReload((value) => value + 1);
      setNotice("Collection details updated.");
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Unable to update this collection.");
    } finally {
      setSaving(false);
    }
  };

  // Add a show to the selected collection.
  const addUserCollectionItem = async (event) => {
    event.preventDefault();
    if (!selectedCollectionUser || !selectedUserCollection || !newCollectionShowId) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await axios.post(
        `/api/admin/users/${selectedCollectionUser.id}/collections/${selectedUserCollection.id}/items`,
        { show_id: Number(newCollectionShowId) },
      );
      setNewCollectionShowId("");
      setCollectionReload((value) => value + 1);
      setNotice("Show added to the collection.");
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Unable to add this show to the collection.");
    } finally {
      setSaving(false);
    }
  };

  // Remove a show from the selected collection after confirmation.
  const removeUserCollectionItem = async (item) => {
    if (!selectedCollectionUser || !selectedUserCollection) return;
    if (!window.confirm(`Remove "${item.name}" from "${selectedUserCollection.name}"?`)) return;
    setError("");
    setNotice("");
    try {
      await axios.delete(
        `/api/admin/users/${selectedCollectionUser.id}/collections/${selectedUserCollection.id}/items/${item.id}`,
      );
      setCollectionReload((value) => value + 1);
      setNotice("Show removed from the collection.");
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Unable to remove this show from the collection.");
    }
  };

  // Remove a show from the selected user's watchlist after confirmation.
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

  // Build the form controls for each database field based on its type and metadata.
  const renderInput = (field) => {
    const value = formValues[field.name] ?? "";
    const sharedClass =
      "mt-1 box-border h-12 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white outline-none focus:border-[#9596D6] focus:ring-2 focus:ring-[#9596D6]/30";

    if (field.name === "avatar_url" && selectedEntity.name === "users") {
      const previewable = value.startsWith("/") || /^https?:\/\//i.test(value);
      const avatarSrc = avatarPreview || value;

      return (
        <label key={field.name} className="block text-sm font-medium text-neutral-200 sm:col-span-2">
          Profile picture
          {field.nullable && <span className="ml-1 text-xs font-normal text-neutral-400">(optional)</span>}
          <div className="mt-2 flex flex-wrap items-center gap-3 rounded-lg border border-white/10 bg-neutral-900/40 p-3">
            {avatarSrc && (avatarPreview || previewable) ? (
              <img
                src={avatarSrc}
                alt="User profile picture preview"
                className="h-14 w-14 rounded-full border border-white/10 object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-700 text-neutral-300">
                <UserRound size={24} aria-hidden="true" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <input
                type="text"
                value={value}
                onChange={(event) => {
                  setAvatarFile(null);
                  setAvatarPreview(null);
                  if (avatarInputRef.current) avatarInputRef.current.value = "";
                  setFormValues((current) => ({ ...current, [field.name]: event.target.value }));
                }}
                placeholder="https://example.com/avatar.jpg or /uploads/avatars/..."
                className={`${sharedClass} mt-0 w-full`}
              />
              {form.mode === "edit" && (
                <>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => {
                      const selected = event.target.files?.[0];
                      if (!selected) return;
                      if (!ALLOWED_AVATAR_TYPES.includes(selected.type)) {
                        setError("Choose a JPG, PNG or WebP image.");
                        event.target.value = "";
                        return;
                      }
                      if (selected.size > MAX_AVATAR_SIZE) {
                        setError("Profile picture must be smaller than 2 MB.");
                        event.target.value = "";
                        return;
                      }
                      setError("");
                      setAvatarPreview(URL.createObjectURL(selected));
                      setAvatarFile(selected);
                    }}
                    className="sr-only"
                  />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="mt-2 inline-flex items-center gap-2 rounded-lg bg-neutral-700 px-3 py-2 text-xs font-medium text-white hover:bg-neutral-600"
                  >
                    <Camera size={15} aria-hidden="true" />
                    Choose from PC
                  </button>
                  {avatarFile && (
                    <span className="ml-2 text-xs text-neutral-400">{avatarFile.name}</span>
                  )}
                </>
              )}
            </div>
            <button
              type="button"
              disabled={!value && !avatarFile}
              onClick={() => {
                setAvatarFile(null);
                setAvatarPreview(null);
                if (avatarInputRef.current) avatarInputRef.current.value = "";
                setFormValues((current) => ({ ...current, [field.name]: "" }));
              }}
              className="rounded-lg border border-rose-500/30 bg-rose-950 px-3 py-2 text-xs font-medium text-rose-200 hover:bg-rose-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Remove picture
            </button>
          </div>
        </label>
      );
    }

    if (field.type === "boolean") {
      return (
        <label key={field.name} className="flex items-center gap-3 rounded-lg bg-neutral-800 p-3 text-sm text-neutral-200">
          <input
            type="checkbox"
            checked={value === true || value === 1 || value === "1"}
            onChange={(event) =>
              setFormValues((current) => ({ ...current, [field.name]: event.target.checked }))
            }
            className="h-4 w-4 accent-blue-500"
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
          className={`${sharedClass} h-auto min-h-24`}
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
          : field.name === "cover_url" && selectedEntity.name === "shows"
          ? "Backdrop image URL"
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
        {field.name === "cover_url" && selectedEntity.name === "shows" && (
          <span className="mt-1 block text-xs font-normal text-neutral-400">
            Paste a direct HTTP or HTTPS link to the movie or show backdrop.
          </span>
        )}
      </label>
    );
  };

  // Identify whether this record's inline edit form is currently open.
  const isInlineEdit = (record) =>
    form?.mode === "edit" &&
    record &&
    JSON.stringify(getRecordKey(form.record, keys)) === JSON.stringify(getRecordKey(record, keys));

  // Render the create/edit form for the selected entity.
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
        <button type="button" aria-label="Close form" onClick={closeEditor} className="rounded-full p-1 text-neutral-300 hover:bg-white/10">
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
        <button type="button" onClick={closeEditor} className="rounded-lg px-4 py-2 text-sm text-neutral-300 hover:bg-white/10">
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-500 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );

  const recordsProps = {
    form,
    isInlineEdit,
    renderEditor,
    loading,
    records,
    keys,
    selectedEntity,
    setShowAssociations,
    setSelectedShow,
    openWatchlist,
    openCollections,
    startEdit,
    removeRecord,
    visibleFields,
    search,
    page,
    setPage,
    total,
  };
  const userProps = {
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
  };
  const showProps = {
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
  };

  // Main dashboard layout: page header, entity switcher, records table, and related detail panels.
  return (
    <main className="min-h-screen px-4 pb-16 pt-26 text-white sm:pt-30">
      <div className="mx-auto max-w-6xl">
        {/* Dashboard title, record search, and top-level admin sections. */}
        <header className="mb-8 flex flex-col justify-between gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Admin Page</h1>
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
        </header>

        <nav aria-label="Admin sections" className="mb-6 flex flex-wrap gap-2">
          {sections.map((section) => (
            <button
              key={section.label}
              type="button"
              aria-current={activeSection === section.label ? "page" : undefined}
              onClick={() => changeSection(section.label)}
              className={`min-w-24 rounded-xs px-5 py-2 text-sm font-medium transition ${
                activeSection === section.label
                  ? "bg-[#3336cc] text-white"
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
          {/* Current view title and actions for adding records or returning to users. */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold">
                {selectedWatchlistUser
                  ? `${selectedWatchlistUser.username}'s Watchlist`
                  : selectedCollectionUser
                    ? selectedUserCollection
                      ? `${selectedCollectionUser.username}'s Collections · ${selectedUserCollection.name}`
                      : `${selectedCollectionUser.username}'s Collections`
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
            <div className="flex flex-wrap items-center gap-3">
              {selectedEntity?.name === "show_submission" && (
                <label className="text-sm text-neutral-300">
                  Submissions
                  <select
                    value={submissionStatusFilter}
                    onChange={(event) => {
                      setSubmissionStatusFilter(event.target.value);
                      setPage(0);
                    }}
                    className="ml-2 rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white"
                  >
                    <option value="pending">Pending</option>
                    <option value="all">All statuses</option>
                  </select>
                </label>
              )}
              {selectedWatchlistUser || selectedCollectionUser ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedWatchlistUser(null);
                    setWatchlistData(null);
                    setWatchlistLoading(false);
                    setSelectedCollectionUser(null);
                    setUserCollections(null);
                    setSelectedUserCollection(null);
                    setUserCollectionData(null);
                    setCollectionsLoading(false);
                    setCollectionLoading(false);
                    setFollowedCollectionData(null);
                    setFollowedCollectionLoading(false);
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
                  className="inline-flex items-center gap-2 rounded-lg bg-[#3336cc] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#060863]"
                >
                  <Plus size={16} />
                  Add {selectedEntity?.label.replace(/s$/, "")}
                </button>
              )}
            </div>
          </div>

          {notice && <p role="status" className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-950/70 p-3 text-sm text-emerald-200">{notice}</p>}
          {error && <p role="alert" className="mb-4 rounded-lg border border-rose-500/30 bg-rose-950/70 p-3 text-sm text-rose-200">{error}</p>}

          {activeSection === "User" ? (
            <UserAdminTab userProps={userProps} recordsProps={recordsProps} /> // send recordProps to UserAdminTab
          ) : activeSection === "Show" ? (
            <ShowAdminTab showProps={showProps} recordsProps={recordsProps} /> // same here
          ) : (
            <SubmissionAdminTab recordsProps={recordsProps} /> // same here
          )}
        </section>
      </div>
    </main>
  );
};

export default Admin;
