import { useEffect, useRef, useState } from "react";
import { clamp, fmtRub, short, formatListingPostedAt } from "../utils/helpers";
import { applyImageFallback } from "../utils/images";
import { formatTaxiWhenForDisplay } from "../utils/taxi";
import { Icon } from "./ui";

export function ItemCard({ item, onOpen, onFav, activeFav, showRating = false, section = "ads", isOwn = false, canFavorite = true }) {
  const hasRating = typeof item.ratingValue === "number" && Number(item.reviewsCount) > 0;
  const postedAtText = section === "ads"
    ? formatListingPostedAt(item.createdAt, item.date)
    : `${item.date} дн. назад`;
  const cardSectionClass = section === "ads" ? "card-ad" : section === "services" ? "card-service" : "";
  return (
    <article
      className={`card card-clickable ${cardSectionClass}`}
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onOpen();
      }}
    >
      <div className="card-body">
        {canFavorite ? (
          <button
            className={`fav-corner-btn taxi-fav-btn ${activeFav ? "active" : ""}`}
            type="button"
            aria-label={activeFav ? "Убрать из избранного" : "Добавить в избранное"}
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
              onFav();
            }}
          >
            <Icon name={activeFav ? "heart-fill" : "heart"} />
            <span>{activeFav ? "В избранном" : "В избранное"}</span>
          </button>
        ) : isOwn ? (
          <span className="fav-corner-btn taxi-fav-btn owner-corner-tag" aria-label="Ваше объявление">
            Моё объявление
          </span>
        ) : null}
        <Media photos={item.photos} emptyText="Нет фотографий" bleed section={section} />
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div className="row wrap" style={{ alignItems: "center", gap: 6 }}>
              <div className="card-title">{item.title}</div>
            </div>
            <div className="meta">{item.category} · {postedAtText}</div>
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

export function TaxiCard({ item, onOpen, onFav, activeFav, isOwn = false, canFavorite = true }) {
  const hasRating = typeof item.ratingValue === "number" && Number(item.reviewsCount) > 0;
  const whenText = formatTaxiWhenForDisplay(item.when);
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
      <div className="card-body taxi-card-body">
        {canFavorite ? (
          <button
            className={`fav-corner-btn taxi-fav-btn ${activeFav ? "active" : ""}`}
            type="button"
            aria-label={activeFav ? "Убрать из избранного" : "Добавить в избранное"}
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
              onFav();
            }}
          >
            <Icon name={activeFav ? "heart-fill" : "heart"} />
            <span>{activeFav ? "В избранном" : "В избранное"}</span>
          </button>
        ) : isOwn ? (
          <span className="fav-corner-btn taxi-fav-btn owner-corner-tag" aria-label="Ваша поездка">
            Вы водитель
          </span>
        ) : null}
        <div className="taxi-card-layout">
          <Media photos={item.photos} emptyText="Нет фото" section="taxi" className="taxi-media-full" blockParentClick />
          <div className="taxi-card-content">
            <div className="taxi-card-head">
              <div className="row wrap" style={{ alignItems: "center", gap: 6 }}>
                <div className="card-title">{item.name}</div>
              </div>
              <div className="price">{fmtRub.format(item.price)}</div>
            </div>
            <div className="meta">{item.category}</div>
            <div className="taxi-rating-line">
              <span className="badge">{hasRating ? `Оценка ${item.ratingValue.toFixed(1)}` : "Нет оценок"}</span>
              <span className="small">{item.reviewsCount || 0} отзыв(ов)</span>
            </div>
          </div>
        </div>
        <div className="row wrap taxi-tags">
          {item.weekdays ? <span className="badge">Регулярно</span> : null}
          {whenText ? <span className="badge">{whenText}</span> : null}
          {item.seats ? <span className="badge">Места: {item.seats.free}/{item.seats.total}</span> : null}
          {item.isFilled ? <span className="badge">Водитель заполнен</span> : null}
        </div>
        <p className="small">{short(item.desc)}</p>
      </div>
    </article>
  );
}

export function FoodCard({ item, onOpen, onFav, activeFav }) {
  const deliveryText = item.delivery ? "Есть доставка" : "Только самовывоз";
  const prepText = item.always ? "Всегда в наличии" : `${item.prep} минут`;

  return (
    <article
      className="card card-clickable food-card"
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
        <Media photos={item.photos} emptyText="Нет фотографий" bleed section="food" blockParentClick />
        <div className="food-card-head">
          <div className="food-card-main">
            <div className="row wrap">
              <span className="food-meta-chip">
                <Icon name="foodall" />
                {item.category}
              </span>
              {item.restaurant ? (
                <span className="food-meta-chip">
                  <Icon name="store" />
                  {item.restaurant}
                </span>
              ) : null}
            </div>
            <div className="card-title">{item.title}</div>
          </div>
          <div className="price">{fmtRub.format(item.price)}</div>
        </div>
        <div className="food-info-list">
          <div className="food-info-item">
            <Icon name="time" />
            <span>{prepText}</span>
          </div>
          <div className="food-info-item">
            <Icon name="delivery" />
            <span>{deliveryText}</span>
          </div>
        </div>
        <p className="small">{short(item.desc)}</p>
      </div>
    </article>
  );
}

export function Media({ photos, emptyText, compact = false, onOpen, bleed = false, section = "ads", className = "", blockParentClick = false, overlay = null }) {
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
      className={`media ${compact ? "media-compact" : ""} ${bleed ? "media-bleed" : ""} ${hasPhotos ? "media-has-image" : ""} ${hasPhotos && onOpen ? "media-clickable" : ""} ${className}`}
      role={hasPhotos && onOpen ? "button" : undefined}
      tabIndex={hasPhotos && onOpen ? 0 : undefined}
      onClick={
        blockParentClick
          ? (e) => {
              e.preventDefault();
              e.stopPropagation();
            }
          : hasPhotos && onOpen
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
      {overlay ? <div className="media-overlay">{overlay}</div> : null}
    </div>
  );
}
