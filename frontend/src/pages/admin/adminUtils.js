//Shared toolbox(things) used by Admin UI

export const PAGE_SIZE = 50;

// labels used when showing watchlist statuses in the admin UI.
export const WATCHLIST_STATUS_LABELS = {
  wishlist: "Want to watch",
  watching: "Watching",
  watched: "Watched",
  rewatching: "Rewatching",
  on_hold: "On hold",
  dropped: "Dropped",
};

// Pick only the primary-key fields needed to identify a record in API requests.
export const getRecordKey = (row, keys) =>
  Object.fromEntries(keys.map((key) => [key, row[key]]));

// Format database timestamps consistently in the application's Bangkok timezone.
export const formatDatabaseDateTime = (value) => {
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

// Format date-only values in UTC so local timezone offsets cannot change the day.
export const formatDatabaseDate = (value) => {
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

// Convert database values into readable text for record detail views.
export const displayValue = (value, type) => {
  if (value === null || value === undefined || value === "") return "—";
  if (type === "datetime") return formatDatabaseDateTime(value);
  if (type === "date") return formatDatabaseDate(value);
  if (type === "boolean") {
    if (value === true || value === 1) return "Yes";
    return "No";
  }
  return String(value);
};
