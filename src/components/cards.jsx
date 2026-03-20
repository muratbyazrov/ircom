import { useEffect, useMemo, useRef, useState } from "react";
import { clamp, fmtRub, formatCompactRub, short, formatListingPostedAt } from "../utils/helpers";
import {
  formatTaxiDateForDisplay,
  getTaxiExactTimeForDisplay,
  formatTaxiWhenForDisplay,
  formatTaxiSeatsForDisplay,
  getTaxiDirectionAccent,
  getTaxiDirectionBadgeText,
  isIntercityTaxiCategory,
} from "../utils/taxi";
import { Icon } from "./ui";

const MEDIA_STATUS_LOADING = "loading";
const MEDIA_STATUS_LOADED = "loaded";
const MEDIA_STATUS_ERROR = "error";
const ACTIVATION_KEYS = ["Enter", " "];
const truncateSingleLine = (value, maxLength = 32) => {
  const normalized = String(value || "").replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trim()}…`;
};

function buildPhotoStates(items) {
  return items.map(() => MEDIA_STATUS_LOADING);
}

function stopCardActionPropagation(event) {
  event.stopPropagation();
}

function MediaStateSurface({ state, title, note, tile = false }) {
  return (
    <div className={`media-state media-state-${state} ${tile ? "media-state-tile" : ""}`} aria-live={state === MEDIA_STATUS_LOADING ? "polite" : undefined}>
      <div className="media-state-art" aria-hidden="true">
        <span className="media-state-frame" />
        <span className="media-state-line media-state-line-lg" />
        <span className="media-state-line media-state-line-sm" />
      </div>
      {tile ? null : (
        <>
          <span className="media-state-title">{title}</span>
          {note ? <span className="media-state-note">{note}</span> : null}
        </>
      )}
    </div>
  );
}

function SkeletonBlock({ className = "" }) {
  return <span className={`skeleton-block ${className}`.trim()} aria-hidden="true" />;
}

function InteractiveCard({ className = "", onOpen, children }) {
  return (
    <article
      className={className}
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (ACTIVATION_KEYS.includes(event.key)) onOpen();
      }}
    >
      {children}
    </article>
  );
}

function FavoriteCornerButton({
  activeFav,
  onFav,
  canFavorite = true,
  isOwn = false,
  ownerLabel = "",
  ownerAriaLabel = "",
  favoriteClassName = "",
  ownerClassName = "",
}) {
  const buttonClassName = ["fav-corner-btn", favoriteClassName, activeFav ? "active" : ""]
    .filter(Boolean)
    .join(" ");
  const ownerBadgeClassName = ["fav-corner-btn", ownerClassName].filter(Boolean).join(" ");

  if (canFavorite) {
    return (
      <button
        className={buttonClassName}
        type="button"
        aria-label={activeFav ? "Убрать из избранного" : "Добавить в избранное"}
        onPointerDown={stopCardActionPropagation}
        onTouchStart={stopCardActionPropagation}
        onClick={(event) => {
          stopCardActionPropagation(event);
          onFav();
        }}
      >
        <Icon name={activeFav ? "heart-fill" : "heart"} />
        <span>{activeFav ? "В избранном" : "В избранное"}</span>
      </button>
    );
  }

  if (isOwn && ownerLabel) {
    return (
      <span className={ownerBadgeClassName} aria-label={ownerAriaLabel || ownerLabel}>
        {ownerLabel}
      </span>
    );
  }

  return null;
}

export function ItemCardSkeleton({ section = "ads", showRating = false }) {
  const cardSectionClass = section === "ads" ? "card-ad" : section === "services" ? "card-service" : "";

  return (
    <article className={`card card-skeleton ${cardSectionClass}`} aria-hidden="true">
      <div className="card-body">
        <span className="card-skeleton-pill card-skeleton-pill-floating">
          <SkeletonBlock className="card-skeleton-icon" />
          <SkeletonBlock className="card-skeleton-pill-text" />
        </span>
        <div className={`media media-bleed card-skeleton-media ${section === "ads" || section === "services" ? "card-skeleton-media-compact" : ""}`}>
          <div className="card-skeleton-gallery">
            <SkeletonBlock className="card-skeleton-gallery-primary" />
            <SkeletonBlock className="card-skeleton-gallery-secondary" />
            <SkeletonBlock className="card-skeleton-gallery-secondary" />
            <SkeletonBlock className="card-skeleton-gallery-secondary" />
          </div>
        </div>
        <div className="card-skeleton-topline">
          <div className="card-skeleton-title-wrap">
            <SkeletonBlock className="card-skeleton-line card-skeleton-line-title" />
            <SkeletonBlock className="card-skeleton-line card-skeleton-line-title-short" />
            <SkeletonBlock className="card-skeleton-line card-skeleton-line-meta" />
          </div>
          <SkeletonBlock className="card-skeleton-price" />
        </div>
        {showRating ? (
          <div className="card-skeleton-rating">
            <SkeletonBlock className="card-skeleton-badge" />
            <SkeletonBlock className="card-skeleton-line card-skeleton-line-caption" />
          </div>
        ) : null}
        <div className="card-skeleton-copy">
          <SkeletonBlock className="card-skeleton-line" />
          <SkeletonBlock className="card-skeleton-line card-skeleton-line-wide" />
        </div>
      </div>
    </article>
  );
}

export function TaxiCardSkeleton() {
  return (
    <article className="card card-skeleton card-taxi" aria-hidden="true">
      <div className="card-body taxi-card-body">
        <div className="taxi-card-toolbar">
          <span className="card-skeleton-pill">
            <SkeletonBlock className="card-skeleton-pill-text" />
          </span>
          <span className="card-skeleton-pill taxi-card-toolbar-action">
            <SkeletonBlock className="card-skeleton-icon" />
            <SkeletonBlock className="card-skeleton-pill-text" />
          </span>
        </div>
        <div className="taxi-card-layout">
          <div className="media taxi-media-full card-skeleton-media card-skeleton-media-square">
            <SkeletonBlock className="card-skeleton-square-art" />
          </div>
          <div className="taxi-card-content">
            <div className="taxi-card-head">
              <div className="taxi-card-head-main">
                <SkeletonBlock className="card-skeleton-line card-skeleton-line-meta" />
              </div>
              <SkeletonBlock className="card-skeleton-price" />
            </div>
            <div className="card-skeleton-chips">
              <SkeletonBlock className="card-skeleton-chip" />
              <SkeletonBlock className="card-skeleton-chip" />
              <SkeletonBlock className="card-skeleton-chip card-skeleton-chip-wide" />
            </div>
            <div className="card-skeleton-copy">
              <SkeletonBlock className="card-skeleton-line" />
              <SkeletonBlock className="card-skeleton-line card-skeleton-line-wide" />
            </div>
            <div className="card-skeleton-chips">
              <SkeletonBlock className="card-skeleton-chip card-skeleton-chip-wide" />
              <SkeletonBlock className="card-skeleton-chip" />
            </div>
            <div className="card-skeleton-rating">
              <SkeletonBlock className="card-skeleton-badge" />
              <SkeletonBlock className="card-skeleton-line card-skeleton-line-caption" />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export function RestaurantCardSkeleton() {
  return (
    <article className="card card-skeleton restaurant-list-card" aria-hidden="true">
      <div className="card-body">
        <div className="restaurant-list-photo-wrap card-skeleton-media card-skeleton-restaurant-hero">
          <div className="card-skeleton-gallery">
            <SkeletonBlock className="card-skeleton-gallery-primary" />
            <SkeletonBlock className="card-skeleton-gallery-secondary" />
            <SkeletonBlock className="card-skeleton-gallery-secondary" />
            <SkeletonBlock className="card-skeleton-gallery-secondary" />
          </div>
        </div>
        <div className="restaurant-list-head">
          <div className="restaurant-list-main">
            <div className="card-skeleton-copy card-skeleton-copy-tight">
              <SkeletonBlock className="card-skeleton-line card-skeleton-line-title" />
              <SkeletonBlock className="card-skeleton-line card-skeleton-line-title-short" />
            </div>
          </div>
          <SkeletonBlock className="card-skeleton-badge card-skeleton-badge-compact" />
        </div>
        <div className="card-skeleton-copy card-skeleton-copy-tight">
          <SkeletonBlock className="card-skeleton-line" />
          <SkeletonBlock className="card-skeleton-line card-skeleton-line-wide" />
        </div>
        <div className="restaurant-list-meta">
          <SkeletonBlock className="card-skeleton-chip card-skeleton-chip-wide" />
        </div>
      </div>
    </article>
  );
}

export function ItemCard({ item, onOpen, onFav, activeFav, showRating = false, section = "ads", isOwn = false, canFavorite = true }) {
  const hasRating = typeof item.ratingValue === "number" && Number(item.reviewsCount) > 0;
  const postedAtText = section === "ads" || section === "services"
    ? formatListingPostedAt(item.createdAt, item.date, item.importMeta?.date)
    : `${item.date} дн. назад`;
  const cardSectionClass = section === "ads" ? "card-ad" : section === "services" ? "card-service" : "";
  return (
    <InteractiveCard className={`card card-clickable ${cardSectionClass}`} onOpen={onOpen}>
      <div className="card-body">
        <FavoriteCornerButton
          activeFav={activeFav}
          onFav={onFav}
          canFavorite={canFavorite}
          isOwn={isOwn}
          ownerLabel="Моё объявление"
          ownerAriaLabel="Ваше объявление"
          favoriteClassName="taxi-fav-btn"
          ownerClassName="taxi-fav-btn owner-corner-tag"
        />
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
    </InteractiveCard>
  );
}

export function TaxiCard({ item, onOpen, onFav, activeFav, isOwn = false, canFavorite = true }) {
  const hasRating = typeof item.ratingValue === "number" && Number(item.reviewsCount) > 0;
  const isIntercity = isIntercityTaxiCategory(item.category);
  const numericPrice = Number(item.price);
  const hasValidPrice = Number.isFinite(numericPrice) && numericPrice > 0;
  const fullPriceText = hasValidPrice ? fmtRub.format(numericPrice) : "По договору";
  const priceText = formatCompactRub(numericPrice);
  const whenText = formatTaxiWhenForDisplay(item.when);
  const whenDateText = formatTaxiDateForDisplay(item.when);
  const exactTimeText = getTaxiExactTimeForDisplay(item.when, item.desc);
  const seatsText = isIntercity ? formatTaxiSeatsForDisplay(item.seats) : "";
  const vehicleRawText = String(item.vehicle || item.carModel || "").trim();
  const vehicleText = truncateSingleLine(vehicleRawText, 32);
  const cityTitle = vehicleText || "Такси по городу";
  const summaryText = short(item.desc);
  const directionAccentClass = getTaxiDirectionAccent(item.category);
  const directionBadgeText = getTaxiDirectionBadgeText(item.category);
  const showDateLine = isIntercity && (whenDateText || whenText);
  const showToolbar = isIntercity;
  const showInlineFavorite = !isIntercity && canFavorite;
  const favoriteButton = canFavorite ? (
    <FavoriteCornerButton
      activeFav={activeFav}
      onFav={onFav}
      canFavorite={canFavorite}
      favoriteClassName={`taxi-fav-btn${showInlineFavorite ? " taxi-fav-inline" : ""}`}
    />
  ) : null;

  if (!isIntercity) {
    return (
      <InteractiveCard className="card card-clickable card-taxi card-taxi-city" onOpen={onOpen}>
        <div className="card-body taxi-card-body taxi-card-body-city">
          <div className="taxi-card-layout taxi-card-layout-city">
            <Media photos={item.photos} emptyText="Нет фото" section="taxi" className="taxi-media-full taxi-media-city" blockParentClick />
            <div className="taxi-card-content taxi-card-content-city">
              <div className="taxi-card-city-copy">
                <span className="taxi-inline-chip taxi-vehicle-chip taxi-city-chip" title={vehicleRawText || cityTitle}>{cityTitle}</span>
                {summaryText ? <p className="taxi-card-summary taxi-card-summary-city">{summaryText}</p> : null}
              </div>
              <div className="taxi-card-city-footer">
                {(isOwn || item.isFilled || hasRating) ? (
                  <div className="taxi-card-city-meta">
                    {isOwn ? <span className="taxi-owner-badge taxi-owner-badge-city">Вы водитель</span> : null}
                    {item.isFilled ? <span className="badge">Водитель заполнен</span> : null}
                    {hasRating ? <span className="badge">{`Оценка ${item.ratingValue.toFixed(1)}`}</span> : null}
                  </div>
                ) : null}
                <div className="taxi-card-head-actions taxi-card-head-actions-city">
                  <div className="price taxi-card-price taxi-card-price-city" title={fullPriceText}>{priceText}</div>
                  {favoriteButton}
                </div>
              </div>
            </div>
          </div>
        </div>
      </InteractiveCard>
    );
  }

  return (
    <InteractiveCard className="card card-clickable card-taxi" onOpen={onOpen}>
      <div className="card-body taxi-card-body">
        {showToolbar ? (
          <div className="taxi-card-toolbar">
            {isIntercity ? <span className={`taxi-route-badge ${directionAccentClass}`}>{directionBadgeText}</span> : null}
            {favoriteButton}
          </div>
        ) : null}
        <div className="taxi-card-layout">
          <Media photos={item.photos} emptyText="Нет фото" section="taxi" className="taxi-media-full" blockParentClick />
          <div className="taxi-card-content">
            <div className={`taxi-card-head${showDateLine ? "" : " taxi-card-head-price-only"}`}>
              {showDateLine ? (
                <div className="taxi-card-head-main">
                {showDateLine ? <div className="taxi-when-line">{whenDateText || whenText}</div> : null}
                </div>
              ) : null}
              <div className="taxi-card-head-actions">
                <div className="price taxi-card-price" title={fullPriceText}>{priceText}</div>
                {showInlineFavorite ? favoriteButton : null}
              </div>
            </div>
            {(vehicleText || (isIntercity && (exactTimeText || seatsText))) ? (
              <div className="taxi-card-meta-row">
                {isIntercity && exactTimeText ? <span className="taxi-time-chip">Выезд {exactTimeText}</span> : null}
                {isIntercity && seatsText ? <span className="taxi-inline-chip">{seatsText}</span> : null}
                {vehicleText ? <span className="taxi-inline-chip taxi-vehicle-chip" title={vehicleRawText}>{vehicleText}</span> : null}
              </div>
            ) : null}
            {summaryText ? <p className="taxi-card-summary">{summaryText}</p> : null}
            {(isOwn || item.isFilled) ? (
              <div className="taxi-card-statuses">
                <div className="taxi-card-footer-tags">
                  {isOwn ? <span className="taxi-owner-badge">Вы водитель</span> : null}
                  {item.isFilled ? <span className="badge">Водитель заполнен</span> : null}
                </div>
              </div>
            ) : null}
            {hasRating ? (
              <div className="taxi-rating-line taxi-rating-line-compact">
                <span className="badge">{`Оценка ${item.ratingValue.toFixed(1)}`}</span>
                <span className="small">{item.reviewsCount || 0} отзыв(ов)</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </InteractiveCard>
  );
}

export function FoodCard({ item, onOpen, onFav, activeFav }) {
  const foodAddressText = String(item.restaurantAddress || item.address || "").trim();

  return (
    <InteractiveCard className="card card-clickable food-card" onOpen={onOpen}>
      <div className="card-body">
        <FavoriteCornerButton activeFav={activeFav} onFav={onFav} />
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
            <Icon name="route" />
            <span>{foodAddressText || "Адрес не указан"}</span>
          </div>
        </div>
        <p className="small">{short(item.desc)}</p>
      </div>
    </InteractiveCard>
  );
}

export function Media({ photos, emptyText, compact = false, onOpen, bleed = false, className = "", blockParentClick = false, overlay = null }) {
  const items = useMemo(() => (Array.isArray(photos) ? photos.filter(Boolean) : []), [photos]);
  const hasPhotos = items.length > 0;
  const showGrid = hasPhotos && !onOpen;
  const [index, setIndex] = useState(0);
  const [photoStates, setPhotoStates] = useState(() => buildPhotoStates(items));
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const suppressClickRef = useRef(false);
  const photoSignature = items.join("\n");

  useEffect(() => {
    setIndex(0);
  }, [items, photoSignature]);

  useEffect(() => {
    if (!items.length) {
      setPhotoStates([]);
      return undefined;
    }

    const initialStates = buildPhotoStates(items);
    let isCancelled = false;
    setPhotoStates(initialStates);

    const preloaders = items.map((photo, photoIndex) => {
      const image = new Image();
      const updatePhotoState = (status) => {
        if (isCancelled) return;
        setPhotoStates((prev) => {
          const baseStates = Array.isArray(prev) && prev.length === items.length ? prev : initialStates;
          if (baseStates[photoIndex] === status) return baseStates;
          const nextStates = [...baseStates];
          nextStates[photoIndex] = status;
          return nextStates;
        });
      };

      image.onload = () => updatePhotoState(MEDIA_STATUS_LOADED);
      image.onerror = () => updatePhotoState(MEDIA_STATUS_ERROR);
      image.src = photo;

      if (image.complete) {
        updatePhotoState(image.naturalWidth > 0 ? MEDIA_STATUS_LOADED : MEDIA_STATUS_ERROR);
      }

      return image;
    });

    return () => {
      isCancelled = true;
      preloaders.forEach((image) => {
        image.onload = null;
        image.onerror = null;
      });
    };
  }, [items, photoSignature]);

  const resolvedPhotoStates = items.map((_, photoIndex) => photoStates[photoIndex] || MEDIA_STATUS_LOADING);
  const hasLoadedPhoto = resolvedPhotoStates.some((state) => state === MEDIA_STATUS_LOADED);
  const hasPendingPhoto = resolvedPhotoStates.some((state) => state === MEDIA_STATUS_LOADING);
  const isLoadingOnly = hasPhotos && !hasLoadedPhoto && hasPendingPhoto;
  const isUnavailable = hasPhotos && !hasLoadedPhoto && !hasPendingPhoto;
  const isInteractive = hasLoadedPhoto && Boolean(onOpen);

  const updatePhotoState = (photoIndex, status) => {
    setPhotoStates((prev) => {
      if (!Array.isArray(prev) || prev[photoIndex] === status) return prev;
      const nextStates = [...prev];
      nextStates[photoIndex] = status;
      return nextStates;
    });
  };

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
      className={`media ${compact ? "media-compact" : ""} ${bleed ? "media-bleed" : ""} ${hasPhotos ? "media-has-image" : ""} ${showGrid ? "media-grid-mode" : ""} ${isInteractive ? "media-clickable" : ""} ${className}`}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={
        blockParentClick
          ? (e) => {
              e.preventDefault();
              e.stopPropagation();
            }
          : isInteractive
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
        if (isInteractive && (e.key === "Enter" || e.key === " ")) onOpen(index);
      }}
      onTouchStart={showGrid ? undefined : onTouchStart}
      onTouchEnd={showGrid ? undefined : onTouchEnd}
    >
      {!hasPhotos ? (
        <MediaStateSurface state="empty" title={emptyText} />
      ) : isLoadingOnly ? (
        <MediaStateSurface state={MEDIA_STATUS_LOADING} title="Загружаем фото" note="Покажем изображения сразу после загрузки." />
      ) : isUnavailable ? (
        <MediaStateSurface state={MEDIA_STATUS_ERROR} title="Не удалось загрузить фото" note="Похоже, изображения сейчас недоступны." />
      ) : (
        showGrid ? (
          <div className={`media-grid media-grid-${Math.min(items.length, 4)}`}>
            {items.slice(0, 4).map((photo, photoIndex) => (
              <div className="media-grid-item" key={`${photo}-${photoIndex}`}>
                {resolvedPhotoStates[photoIndex] === MEDIA_STATUS_LOADED ? (
                  <img
                    className="media-img"
                    src={photo}
                    alt="preview"
                    loading="lazy"
                    draggable={false}
                    onError={() => updatePhotoState(photoIndex, MEDIA_STATUS_ERROR)}
                  />
                ) : (
                  <MediaStateSurface
                    state={resolvedPhotoStates[photoIndex]}
                    title={resolvedPhotoStates[photoIndex] === MEDIA_STATUS_LOADING ? "Загружаем фото" : "Фото недоступно"}
                    tile
                  />
                )}
                {photoIndex === 3 && items.length > 4 ? (
                  <span className="media-grid-more">+{items.length - 4}</span>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="media-slider" style={{ transform: `translate3d(-${index * 100}%, 0, 0)` }}>
              {items.map((photo, photoIndex) => (
                <div className="media-slide" key={`${photo}-${photoIndex}`}>
                  {resolvedPhotoStates[photoIndex] === MEDIA_STATUS_LOADED ? (
                    <img
                      className="media-img"
                      src={photo}
                      alt="preview"
                      loading="lazy"
                      draggable={false}
                      onError={() => updatePhotoState(photoIndex, MEDIA_STATUS_ERROR)}
                    />
                  ) : (
                    <MediaStateSurface
                      state={resolvedPhotoStates[photoIndex]}
                      title={resolvedPhotoStates[photoIndex] === MEDIA_STATUS_LOADING ? "Загружаем фото" : "Фото недоступно"}
                      tile
                    />
                  )}
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
        )
      )}
      {overlay ? <div className="media-overlay">{overlay}</div> : null}
    </div>
  );
}
