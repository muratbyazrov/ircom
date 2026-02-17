import { sortModes } from "../utils/constants";
import {
  CakeSlice,
  Car,
  CarFront,
  Circle,
  ExternalLink,
  FileText,
  Fish,
  GraduationCap,
  Grid2x2,
  Hamburger,
  Hammer,
  Heart,
  House,
  Mountain,
  MoveLeft,
  MoveRight,
  Pizza,
  Plus,
  Route,
  Sofa,
  Smartphone,
  Sparkles,
  User,
  UtensilsCrossed,
  WashingMachine,
  Wrench,
} from "lucide-react";

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

export function Modal({ open, onClose, children, variant = "sheet", closeOnBackdrop = true }) {
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
      <div className="modal-backdrop" onClick={closeOnBackdrop ? onClose : undefined} />
      <article className="modal-card">{children}</article>
    </section>
  );
}

export function Field({ label, children }) {
  return (
    <div className="field">
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
    <div className="section stat-card" style={{ padding: 10 }}>
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
  const iconByKey = {
    ads: FileText,
    services: Hammer,
    taxi: CarFront,
    food: Hamburger,
    profile: User,
    all: Grid2x2,
    auto: Car,
    realty: House,
    electronics: Smartphone,
    appliance: WashingMachine,
    furniture: Sofa,
    misc: Plus,
    mine: User,
    pastry: CakeSlice,
    tutor: GraduationCap,
    beauty: Sparkles,
    carservice: Wrench,
    foodall: UtensilsCrossed,
    caucasus: Mountain,
    sushi: Fish,
    pie: Pizza,
    burger: Hamburger,
    route: Route,
    "taxi-city": CarFront,
    "route-fw": MoveRight,
    "route-bw": MoveLeft,
    open: ExternalLink,
    heart: Heart,
    "heart-fill": Heart,
  };

  const LucideIcon = iconByKey[name] || Circle;
  const isFilledHeart = name === "heart-fill";

  return (
    <LucideIcon
      className="icon"
      aria-hidden="true"
      strokeWidth={1.9}
      fill={isFilledHeart ? "currentColor" : "none"}
    />
  );
}
