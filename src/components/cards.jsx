import { useEffect, useRef, useState } from "react";
import { clamp, fmtRub, short } from "../utils/helpers";
import { applyImageFallback } from "../utils/images";
import { Icon } from "./ui";

export function ItemCard({ item, onOpen, onFav, activeFav, showRating = false, section = "ads" }) {
  const hasRating = typeof item.ratingValue === "number";
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
        <Media photos={item.photos} emptyText="Нет фотографий" bleed section={section} />
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div className="card-title">{item.title}</div>
            <div className="meta">{item.category} · {item.date} дн. назад</div>
          </div>
          <div className="price">{fmtRub.format(item.price)}</div>
        </div>
        {showRating ? (
          <div className="rating-line">
            <span className={`badge ${hasRating ? "" : "badge-muted"}`}>
              {hasRating ? `Оценка ${item.ratingValue.toFixed(1)}/5` : "Нет оценок"}
            </span>
            <span className="small">{item.reviewsCount || 0} отзыв(ов)</span>
          </div>
        ) : null}
        <p className="small">{short(item.desc)}</p>
      </div>
    </article>
  );
}

export function TaxiCard({ item, onOpen, onFav, activeFav }) {
  const hasRating = typeof item.ratingValue === "number";
  return (
    <article
      className="card card-clickable card-taxi"
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
          <Media photos={item.photos} emptyText="Нет фото" compact section="taxi" />
          <div>
            <div className="card-title">{item.name}</div>
            <div className="meta">{item.category}</div>
            <div className="price">{fmtRub.format(item.price)}</div>
            <div className="small">{hasRating ? `Оценка ${item.ratingValue.toFixed(1)}` : "Нет оценок"}</div>
            <div className="small">{item.reviewsCount || 0} отзыв(ов)</div>
          </div>
        </div>
        <div className="row wrap">
          {item.weekdays ? <span className="badge">Регулярно</span> : null}
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
        <Media photos={item.photos} emptyText="Нет фотографий" bleed section="food" />
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

export function Media({ photos, emptyText, compact = false, onOpen, bleed = false, section = "ads" }) {
  const items = Array.isArray(photos) ? photos.filter(Boolean) : [];
  const hasPhotos = items.length > 0;
  const [index, setIndex] = useState(0);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const suppressClickRef = useRef(false);

  useEffect(() => {
    setIndex(0);
  }, [items.length, items[0]]);

  const onTouchStart = (e) => {
    if (items.length < 2) return;
    touchStartX.current = e.changedTouches[0]?.clientX ?? null;
    touchStartY.current = e.changedTouches[0]?.clientY ?? null;
  };

  const onTouchEnd = (e) => {
    if (items.length < 2 || touchStartX.current === null || touchStartY.current === null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const endY = e.changedTouches[0]?.clientY ?? touchStartY.current;
    const deltaX = endX - touchStartX.current;
    const deltaY = endY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    if (absX < 36 || absX <= absY) return;

    const next = deltaX < 0 ? index + 1 : index - 1;
    setIndex(clamp(next, 0, items.length - 1));
    suppressClickRef.current = true;
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 220);
  };

  return (
    <div
      className={`media ${compact ? "media-compact" : ""} ${bleed ? "media-bleed" : ""} ${hasPhotos ? "media-has-image" : ""} ${hasPhotos && onOpen ? "media-clickable" : ""}`}
      role={hasPhotos && onOpen ? "button" : undefined}
      tabIndex={hasPhotos && onOpen ? 0 : undefined}
      onClick={
        hasPhotos && onOpen
          ? (e) => {
              if (suppressClickRef.current) {
                e.preventDefault();
                e.stopPropagation();
                return;
              }
              onOpen(index);
            }
          : undefined
      }
      onKeyDown={(e) => {
        if (hasPhotos && onOpen && (e.key === "Enter" || e.key === " ")) onOpen(index);
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchMove={(e) => {
        if (items.length > 1) e.stopPropagation();
      }}
    >
      {hasPhotos ? (
        <>
          <div className="media-slider" style={{ transform: `translate3d(-${index * 100}%, 0, 0)` }}>
            {items.map((photo) => (
              <div className="media-slide" key={photo}>
                <img
                  className="media-img"
                  src={photo}
                  alt="preview"
                  loading="lazy"
                  draggable={false}
                  onError={(e) => applyImageFallback(e, section)}
                />
              </div>
            ))}
          </div>
          {items.length > 1 ? (
            <div className="media-dots" aria-hidden="true">
              {items.map((_, dotIndex) => (
                <span className={`media-dot ${dotIndex === index ? "active" : ""}`} key={`dot-${dotIndex}`} />
              ))}
            </div>
          ) : null}
        </>
      ) : (
        <div className="media-empty">{emptyText}</div>
      )}
    </div>
  );
}
