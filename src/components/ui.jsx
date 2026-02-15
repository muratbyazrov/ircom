import { sortModes } from "../utils/constants";

export function Section({ children }) {
  return <section className="section">{children}</section>;
}

export function SectionHeader({ title, subtitle, actionLabel, onAction }) {
  return (
    <Section>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h2>{title}</h2>
        {actionLabel ? (
          <button className="primary-btn" type="button" onClick={onAction}>
            {actionLabel}
          </button>
        ) : null}
      </div>
      {subtitle ? <p className="small">{subtitle}</p> : null}
    </Section>
  );
}

export function CategoryTabs({ list, value, onChange }) {
  return (
    <div className="category-tabs">
      {list.map((item) => (
        <button key={item} className={`category-tab ${value === item ? "active" : ""}`} type="button" onClick={() => onChange(item)}>
          {item}
        </button>
      ))}
    </div>
  );
}

export function SortSelect({ value, onChange }) {
  return (
    <div style={{ marginTop: 10 }}>
      <label className="label">Сортировка</label>
      <select className="select" value={value} onChange={(e) => onChange(e.target.value)}>
        {sortModes.map(([v, l]) => (
          <option value={v} key={v}>{l}</option>
        ))}
      </select>
    </div>
  );
}

export function Modal({ open, onClose, children, variant = "sheet" }) {
  if (!open) return null;

  if (variant === "full") {
    return (
      <section className="modal" aria-hidden="false">
        <article className="modal-card modal-card-full">
          <button className="modal-close-inline" type="button" onClick={onClose}>
            Закрыть
          </button>
          {children}
        </article>
      </section>
    );
  }

  return (
    <section className="modal" aria-hidden="false">
      <div className="modal-backdrop" onClick={onClose} />
      <article className="modal-card">{children}</article>
    </section>
  );
}

export function Field({ label, children }) {
  return (
    <div>
      <div className="label">{label}</div>
      {children}
    </div>
  );
}

export function FormActions({ onClose, submitDisabled = false, submitLabel = "Сохранить" }) {
  return (
    <div className="actions">
      <button className="primary-btn" type="submit" disabled={submitDisabled}>{submitLabel}</button>
      <button className="ghost-btn" type="button" onClick={onClose}>Отмена</button>
    </div>
  );
}

export function StatCard({ title, caption }) {
  return (
    <div className="section" style={{ padding: 10 }}>
      <h4>{title}</h4>
      <p className="small">{caption}</p>
    </div>
  );
}

export function Empty({ text }) {
  return (
    <div className="section">
      <p className="small">{text}</p>
    </div>
  );
}

export function Icon({ name }) {
  const paths = {
    ads: <path d="M6 3h9l3 3v15H6zM15 3v3h3M9 11h6M9 15h6M9 19h4" />,
    services: <path d="M14 4l6 6-2 2-1-1-3 3 1 1-2 2-6-6 7-7zM4 20l5-5" />,
    taxi: <path d="M5 13h14l-1-4a3 3 0 0 0-3-2H9a3 3 0 0 0-3 2l-1 4zM7 17h0M17 17h0M6 13v4M18 13v4" />,
    food: <path d="M7 3v8M10 3v8M7 7h3M15 3v18M19 3c0 3-2 5-4 5" />,
    profile: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0" />,
    all: <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />,
    auto: <path d="M5 13h14l-1-4a3 3 0 0 0-3-2H9a3 3 0 0 0-3 2l-1 4zM7 17h0M17 17h0" />,
    realty: <path d="M4 11l8-7 8 7M6 10v10h12V10M10 20v-6h4v6" />,
    electronics: <path d="M7 4h10a2 2 0 0 1 2 2v12H5V6a2 2 0 0 1 2-2zM9 20h6" />,
    appliance: <path d="M7 3h10v18H7zM7 8h10M12 12a2.5 2.5 0 1 0 0 .01" />,
    furniture: <path d="M5 12h14v5H5zM7 12V9h10v3M7 17v3M17 17v3" />,
    misc: <path d="M12 3v18M3 12h18" />,
    mine: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0" />,
    pastry: <path d="M6 12a6 6 0 1 1 12 0v7H6zM9 9h0M15 9h0" />,
    tutor: <path d="M3 7l9-4 9 4-9 4-9-4zM7 10v5c0 1.7 2.2 3 5 3s5-1.3 5-3v-5" />,
    beauty: <path d="M6 4h12l-2 7H8L6 4zM10 11v9M14 11v9" />,
    carservice: <path d="M12 3v4M12 17v4M4 12h4M16 12h4M7 7l3 3M14 14l3 3M17 7l-3 3M10 14l-3 3" />,
    foodall: <path d="M7 3v8M10 3v8M7 7h3M15 3v18M19 3c0 3-2 5-4 5" />,
    caucasus: <path d="M3 19h18M5 19l4-8 3 5 2-3 3 6" />,
    sushi: <path d="M4 8h16v8H4zM8 8v8M12 8v8M16 8v8" />,
    pie: <path d="M4 16h16M6 16l2-8h8l2 8M10 8V6M14 8V6" />,
    burger: <path d="M5 10a7 7 0 0 1 14 0H5zM4 13h16M6 17h12" />,
    route: <path d="M6 18a2 2 0 1 1 0-4 2 2 0 0 1 0 4zM18 10a2 2 0 1 1 0-4 2 2 0 0 1 0 4zM8 15h5a3 3 0 0 0 3-3V10" />,
    "taxi-city": <path d="M5 14h14l-1.1-4A3 3 0 0 0 15 8H9a3 3 0 0 0-2.9 2L5 14zM7 17h0M17 17h0M6 14v3M18 14v3M12 4v2M10 5h4" />,
    "route-fw": <path d="M5 17a2 2 0 1 0 0 .01M19 7a2 2 0 1 0 0 .01M7 17h5a4 4 0 0 0 4-4V9M13 9l3-3m0 0 3 3m-3-3v8" />,
    "route-bw": <path d="M19 17a2 2 0 1 0 0 .01M5 7a2 2 0 1 0 0 .01M17 17h-5a4 4 0 0 1-4-4V9M11 9 8 6m0 0-3 3m3-3v8" />,
    open: <path d="M14 4h6v6M10 14l10-10M5 8v11h11" />,
    heart: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.6-7 10-7 10z" />,
    "heart-fill": <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.6-7 10-7 10z" fill="currentColor" stroke="none" />,
  };

  return (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name] || null}
    </svg>
  );
}
