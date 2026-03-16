import { Icon } from "./ui";

function toSourceLabel(source) {
  const text = String(source || "").trim();
  if (!text) return "";

  return text
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\p{L}/gu, (match) => match.toUpperCase());
}

function formatImportDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function ListingImportMeta({ importMeta, mode = "card" }) {
  const sourceLabel = toSourceLabel(importMeta?.source);
  const importedAt = formatImportDate(importMeta?.date);
  const permalink = String(importMeta?.permalink || "").trim();

  if (!sourceLabel && !importedAt && !permalink) return null;

  const content = (
    <>
      <span className="listing-import-meta-icon" aria-hidden="true">
        <Icon name="open" />
      </span>
      <span className="listing-import-meta-copy">
        <span className="listing-import-meta-kicker">Источник</span>
        <span className="listing-import-meta-title">{sourceLabel || "Внешний импорт"}</span>
      </span>
      {importedAt ? <span className="listing-import-meta-date">{importedAt}</span> : null}
      {permalink ? (
        <span className="listing-import-meta-link">
          Открыть
          <Icon name="open" />
        </span>
      ) : null}
    </>
  );

  if (permalink) {
    return (
      <a
        className={`listing-import-meta listing-import-meta-${mode}`}
        href={permalink}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        {content}
      </a>
    );
  }

  return (
    <div className={`listing-import-meta listing-import-meta-${mode}`}>
      {content}
    </div>
  );
}
