import { fmtRub, short } from "../utils/helpers";
import { Icon } from "./ui";

export function ItemCard({ item, onOpen, onFav, activeFav }) {
  return (
    <article
      className="card card-clickable"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onOpen();
      }}
    >
      <div className="card-body">
        <button
          className={`fav-corner-btn ${activeFav ? "active" : ""}`}
          type="button"
          aria-label={activeFav ? "Убрать из избранного" : "Добавить в избранное"}
          onClick={(e) => {
            e.stopPropagation();
            onFav();
          }}
        >
          <Icon name={activeFav ? "heart-fill" : "heart"} />
          <span>{activeFav ? "В избранном" : "В избранное"}</span>
        </button>
        <Media photos={item.photos} emptyText="Нет фотографий" />
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div className="card-title">{item.title}</div>
            <div className="meta">{item.category} · {item.date} дн. назад</div>
          </div>
          <div className="price">{fmtRub.format(item.price)}</div>
        </div>
        <p className="small">{short(item.desc)}</p>
      </div>
    </article>
  );
}

export function TaxiCard({ item, onOpen, onFav, activeFav }) {
  return (
    <article
      className="card card-clickable"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onOpen();
      }}
    >
      <div className="card-body">
        <button
          className={`fav-corner-btn ${activeFav ? "active" : ""}`}
          type="button"
          aria-label={activeFav ? "Убрать из избранного" : "Добавить в избранное"}
          onClick={(e) => {
            e.stopPropagation();
            onFav();
          }}
        >
          <Icon name={activeFav ? "heart-fill" : "heart"} />
          <span>{activeFav ? "В избранном" : "В избранное"}</span>
        </button>
        <div className="grid-2" style={{ gridTemplateColumns: "94px 1fr", alignItems: "center" }}>
          <Media photos={item.photos} emptyText="Нет фото" compact />
          <div>
            <div className="card-title">{item.name}</div>
            <div className="meta">{item.category}</div>
            <div className="price">{fmtRub.format(item.price)}</div>
            <div className="small">Оценка {item.rating.toFixed(1)}</div>
          </div>
        </div>
        <div className="row wrap">
          {item.when ? <span className="badge">{item.when}</span> : null}
          {item.seats ? <span className="badge">Места: {item.seats.free}/{item.seats.total}</span> : null}
        </div>
        <p className="small">{short(item.desc)}</p>
      </div>
    </article>
  );
}

export function FoodCard({ item, onOpen, onFav, activeFav }) {
  return (
    <article
      className="card card-clickable"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onOpen();
      }}
    >
      <div className="card-body">
        <button
          className={`fav-corner-btn ${activeFav ? "active" : ""}`}
          type="button"
          aria-label={activeFav ? "Убрать из избранного" : "Добавить в избранное"}
          onClick={(e) => {
            e.stopPropagation();
            onFav();
          }}
        >
          <Icon name={activeFav ? "heart-fill" : "heart"} />
          <span>{activeFav ? "В избранном" : "В избранное"}</span>
        </button>
        <Media photos={item.photos} emptyText="Нет фотографий" />
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div className="card-title">{item.title}</div>
            <div className="meta">{item.category}</div>
          </div>
          <div className="price">{fmtRub.format(item.price)}</div>
        </div>
        <div className="row wrap">
          <span className="badge">{item.always ? "Всегда в наличии" : `${item.prep} мин`}</span>
          <span className="badge">{item.delivery ? "Есть доставка" : "Самовывоз"}</span>
        </div>
        <p className="small">{short(item.desc)}</p>
      </div>
    </article>
  );
}

export function Media({ photos, emptyText, compact = false, onOpen }) {
  const cover = photos?.[0];
  return (
    <div
      className={`media ${compact ? "media-compact" : ""} ${cover ? "media-has-image" : ""} ${cover && onOpen ? "media-clickable" : ""}`}
      role={cover && onOpen ? "button" : undefined}
      tabIndex={cover && onOpen ? 0 : undefined}
      onClick={cover && onOpen ? onOpen : undefined}
      onKeyDown={(e) => {
        if (cover && onOpen && (e.key === "Enter" || e.key === " ")) onOpen();
      }}
    >
      {cover ? <img className="media-img" src={cover} alt="preview" loading="lazy" /> : <div className="media-empty">{emptyText}</div>}
    </div>
  );
}
