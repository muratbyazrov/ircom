import { useEffect, useRef, useState } from "react";
import { clamp, fmtRub, getTouchDistance } from "../../utils/helpers";
import { applyImageFallback, replaceImageWithEmpty } from "../../utils/images";
import { Icon, Field } from "../ui";
import { Media } from "../cards";

export function DetailModalContent({
  data,
  onFav,
  isFav,
  isAuth,
  onAddFeedback,
  onRequireAuth,
  currentUserName,
  onOpenDish,
  onEdit,
  onAddDish,
  isOwnerView = false,
  onEditDish,
  onDeleteDish,
  onToggleDishAvailability,
}) {
  const { item, type } = data;
  const photos = item.photos || [];
  const feedbackEnabled = !isOwnerView && (type === "taxi" || type === "services");
  const isRestaurantDetail = type === "restaurant";
  const restaurantLogo = isRestaurantDetail ? String(item.logo || "").trim() : "";
  const reviews = Array.isArray(item.reviews) ? item.reviews : [];
  const normalizedUserName = String(currentUserName || "").trim().toLowerCase();
  const alreadyLeftReview = Boolean(
    normalizedUserName && reviews.some((review) => String(review.author || "").trim().toLowerCase() === normalizedUserName)
  );
  const REVIEWS_STEP = 3;
  const ratingValue = typeof item.ratingValue === "number" ? item.ratingValue : null;
  const foodPrepText = type === "food" ? (item.always ? "Всегда в наличии" : `${item.prep} минут`) : "";
  const foodDeliveryText = type === "food" ? (item.delivery ? "Есть доставка" : "Только самовывоз") : "";
  const isFoodDetail = type === "food";
  const isTaxiDetail = type === "taxi";
  const isServicesDetail = type === "services";
  const isAdsDetail = type === "ads";
  const isBasicDetail = !isRestaurantDetail && !isTaxiDetail && !isFoodDetail;
  const isFoodOwnerView = isFoodDetail && typeof onEditDish === "function";
  const restaurantDeliveryText = isRestaurantDetail
    ? item.deliveryMode === "free"
      ? "Бесплатно"
      : item.deliveryMode === "paid"
        ? `Платная (${fmtRub.format(Number(item.deliveryPrice) || 0)})`
        : "Нет доставки"
    : "";
  const restaurantDescText = isRestaurantDetail ? String(item.desc || "").trim() : "";
  const isCuisineOnlyDesc = /^Кухня:/i.test(restaurantDescText);
  const cuisineText = isCuisineOnlyDesc ? restaurantDescText.replace(/^Кухня:\s*/i, "").trim() : "";
  const restaurantAboutText = !isCuisineOnlyDesc ? restaurantDescText : "";
  const hasRestaurantMeta = isRestaurantDetail;
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [visibleReviewsCount, setVisibleReviewsCount] = useState(REVIEWS_STEP);
  const [viewerIndex, setViewerIndex] = useState(null);
  const [dragX, setDragX] = useState(0);
  const [isTrackDragging, setIsTrackDragging] = useState(false);
  const [isImageInteracting, setIsImageInteracting] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dismissY, setDismissY] = useState(0);
  const [dismissAnimating, setDismissAnimating] = useState(false);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const touchStartAt = useRef(0);
  const panStartX = useRef(0);
  const panStartY = useRef(0);
  const pinchStartDist = useRef(null);
  const pinchStartScale = useRef(1);
  const pinchStartPan = useRef({ x: 0, y: 0 });
  const pinchStartFocal = useRef({ x: 0, y: 0 });
  const gestureMode = useRef("idle");
  const lastTapAt = useRef(0);
  const activeImageRef = useRef(null);
  const closeTimerRef = useRef(null);
  const normalizePhoneDigits = (value) => {
    let digits = String(value || "").replace(/\D/g, "");
    if (digits.length === 11 && digits.startsWith("8")) digits = `7${digits.slice(1)}`;
    return digits;
  };
  const buildContactHref = (type, value) => {
    const raw = String(value || "").trim();
    if (!raw) return null;

    if (type === "phone") return `tel:${raw.replace(/\s+/g, "")}`;

    if (type === "whatsapp") {
      const digits = normalizePhoneDigits(raw);
      return digits ? `https://wa.me/${digits}` : null;
    }

    if (type === "telegram") {
      const withoutAt = raw.replace(/^@/, "");
      return withoutAt ? `https://t.me/${withoutAt}` : null;
    }

    return null;
  };

  const contactButtons = Object.entries(item.contacts || {})
    .filter(([, value]) => Boolean(String(value || "").trim()))
    .map(([k, v]) => {
      const contactType = k === "tg" ? "telegram" : k === "wa" ? "whatsapp" : "phone";
      const contactLabel = k === "tg" ? "Telegram" : k === "wa" ? "WhatsApp" : "Телефон";
      const href = buildContactHref(contactType, v);
      if (!href) return null;

      return (
        <a className="detail-contact-btn" key={`${k}-${v}`} href={href} target="_blank" rel="noopener noreferrer">
          <span className={`detail-contact-icon detail-contact-icon-${contactType}`}>
            <Icon name={contactType} />
          </span>
          <span className="detail-contact-text">
            <b>{contactLabel}</b>
            <span>{v}</span>
          </span>
        </a>
      );
    })
    .filter(Boolean);

  const favoriteButton = !isRestaurantDetail && !isOwnerView ? (
    <button
      className={`ghost-btn detail-taxi-fav-btn detail-media-fav-btn ${isFav(item.id) ? "active" : ""}`}
      type="button"
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onFav(item.id);
      }}
    >
      {isFav(item.id) ? <><Icon name="heart-fill" /> В избранном</> : <><Icon name="heart" /> В избранное</>}
    </button>
  ) : null;

  const showPrev = () => setViewerIndex((prev) => Math.max(0, prev - 1));
  const showNext = () => setViewerIndex((prev) => Math.min(photos.length - 1, prev + 1));
  const formatReviewDate = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
  };

  const submitFeedback = (e) => {
    e.preventDefault();
    const added = onAddFeedback?.({
      itemId: item.id,
      rating: reviewRating,
      text: reviewText,
    });
    if (!added) return;
    setReviewText("");
    setReviewRating(5);
  };

  useEffect(() => {
    if (viewerIndex === null) return;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const modalCard = document.querySelector(".modal-card");
    const prevCardOverflow = modalCard?.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    if (modalCard) modalCard.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      if (modalCard) modalCard.style.overflow = prevCardOverflow || "";
    };
  }, [viewerIndex]);

  useEffect(() => {
    setVisibleReviewsCount(REVIEWS_STEP);
  }, [item.id]);

  useEffect(() => {
    if (viewerIndex === null) return;
    setDragX(0);
    setIsTrackDragging(false);
    setIsImageInteracting(false);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setDismissY(0);
    setDismissAnimating(false);
  }, [viewerIndex]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const getFocalFromTouches = (t1, t2) => {
    const stableNode = activeImageRef.current?.parentElement || activeImageRef.current;
    const rect = stableNode?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const midX = (t1.clientX + t2.clientX) / 2;
    const midY = (t1.clientY + t2.clientY) / 2;
    return { x: midX - (rect.left + rect.width / 2), y: midY - (rect.top + rect.height / 2) };
  };

  const getPanLimits = (scale) => {
    const baseWidth = activeImageRef.current?.offsetWidth || Math.min(window.innerWidth * 0.96, 900);
    const baseHeight = activeImageRef.current?.offsetHeight || window.innerHeight * 0.75;
    return {
      x: Math.max(0, (baseWidth * scale - baseWidth) / 2),
      y: Math.max(0, (baseHeight * scale - baseHeight) / 2),
    };
  };

  const clampPan = (nextPan, scale = zoom) => {
    const limits = getPanLimits(scale);
    return {
      x: clamp(nextPan.x, -limits.x, limits.x),
      y: clamp(nextPan.y, -limits.y, limits.y),
    };
  };

  const closeViewerWithSwipe = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setDismissAnimating(true);
    setDismissY(window.innerHeight * 0.35);
    closeTimerRef.current = setTimeout(() => {
      setViewerIndex(null);
    }, 180);
  };

  return (
    <>
      {!isRestaurantDetail ? (
        isTaxiDetail ? (
          <div className="detail-taxi-head">
            <h3 className="detail-taxi-title" style={{ marginBottom: 0 }}>{item.title || item.name}</h3>
          </div>
        ) : (
          <h3 className="detail-main-title">{item.title || item.name}</h3>
        )
      ) : null}
      {!isRestaurantDetail && !isTaxiDetail && !isServicesDetail && !isAdsDetail ? (
        <Media
          photos={photos}
          emptyText="Нет фотографий"
          section={type}
          overlay={favoriteButton}
          onOpen={
            type !== "food"
              ? (startIndex = 0) => (photos.length ? setViewerIndex(clamp(startIndex, 0, photos.length - 1)) : null)
              : undefined
          }
        />
      ) : null}
      {!isRestaurantDetail && !isTaxiDetail && !isFoodDetail && !isServicesDetail && !isAdsDetail && photos.length > 1 ? (
        <div className="gallery" style={{ marginTop: 8 }}>
          {photos.slice(1).map((photo, thumbIndex) => {
            const index = thumbIndex + 1;
            return (
              <button key={photo} className="gallery-btn" type="button" onClick={() => setViewerIndex(index)}>
                <img className="gallery-img" src={photo} alt="gallery" loading="lazy" onError={(e) => applyImageFallback(e, type)} />
              </button>
            );
          })}
        </div>
      ) : null}
      {type === "food" ? (
        <section className="detail-food-meta">
          <div className="detail-food-price">{fmtRub.format(item.price)}</div>
          <div className="detail-food-info-list">
            <div className="detail-food-info-item">
              <Icon name="foodall" />
              <span>{item.category || "Категория не указана"}</span>
            </div>
            {item.restaurant ? (
              <div className="detail-food-info-item">
                <Icon name="store" />
                <span>{item.restaurant}</span>
              </div>
            ) : null}
            <div className="detail-food-info-item">
              <Icon name="time" />
              <span>{foodPrepText}</span>
            </div>
            <div className="detail-food-info-item">
              <Icon name="delivery" />
              <span>{foodDeliveryText}</span>
            </div>
          </div>
        </section>
      ) : null}
      {isBasicDetail && !isServicesDetail && !isAdsDetail ? (
        <section className="detail-basic-meta">
          <div className="detail-basic-meta-price">
            <span>Стоимость</span>
            <b>{fmtRub.format(item.price)}</b>
          </div>
          <div className="detail-basic-meta-list">
            {item.category ? (
              <div className="detail-basic-meta-item">
                <Icon name="route" />
                <span>{item.category}</span>
              </div>
            ) : null}
            {typeof item.date === "number" ? (
              <div className="detail-basic-meta-item">
                <Icon name="time" />
                <span>{item.date} дн. назад</span>
              </div>
            ) : null}
            {ratingValue !== null ? (
              <div className="detail-basic-meta-item">
                <Icon name="star" />
                <span>{ratingValue.toFixed(1)} / 5</span>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
      {isServicesDetail ? (
        <section className="detail-service-unified-block">
          <Media
            photos={photos}
            emptyText="Нет фотографий"
            section={type}
            overlay={favoriteButton}
            onOpen={(startIndex = 0) => (photos.length ? setViewerIndex(clamp(startIndex, 0, photos.length - 1)) : null)}
          />
          {photos.length > 1 ? (
            <div className="gallery detail-service-gallery">
              {photos.slice(1).map((photo, thumbIndex) => {
                const index = thumbIndex + 1;
                return (
                  <button key={photo} className="gallery-btn" type="button" onClick={() => setViewerIndex(index)}>
                    <img className="gallery-img" src={photo} alt="gallery" loading="lazy" onError={(e) => applyImageFallback(e, type)} />
                  </button>
                );
              })}
            </div>
          ) : null}
          <div className="detail-basic-meta">
            <div className="detail-basic-meta-price">
              <span>Стоимость</span>
              <b>{fmtRub.format(item.price)}</b>
            </div>
            <div className="detail-basic-meta-list">
              {item.category ? (
                <div className="detail-basic-meta-item">
                  <Icon name="route" />
                  <span>{item.category}</span>
                </div>
              ) : null}
              {typeof item.date === "number" ? (
                <div className="detail-basic-meta-item">
                  <Icon name="time" />
                  <span>{item.date} дн. назад</span>
                </div>
              ) : null}
              {ratingValue !== null ? (
                <div className="detail-basic-meta-item">
                  <Icon name="star" />
                  <span>{ratingValue.toFixed(1)} / 5</span>
                </div>
              ) : null}
            </div>
          </div>
          <div className="detail-basic-desc-card">
            <div className="detail-content-title">Описание</div>
            <p>{item.desc || "Нет описания"}</p>
          </div>
          <div className="detail-contacts-block detail-contacts-block-basic detail-service-contacts">
            <div className="detail-contacts-title">Контакты</div>
            <div className="detail-contact-grid">{contactButtons.length ? contactButtons : <p className="small">Контакты не указаны</p>}</div>
          </div>
        </section>
      ) : null}
      {isAdsDetail ? (
        <section className="detail-ad-unified-block">
          <Media
            photos={photos}
            emptyText="Нет фотографий"
            section={type}
            overlay={favoriteButton}
            onOpen={(startIndex = 0) => (photos.length ? setViewerIndex(clamp(startIndex, 0, photos.length - 1)) : null)}
          />
          {photos.length > 1 ? (
            <div className="gallery detail-ad-gallery">
              {photos.slice(1).map((photo, thumbIndex) => {
                const index = thumbIndex + 1;
                return (
                  <button key={photo} className="gallery-btn" type="button" onClick={() => setViewerIndex(index)}>
                    <img className="gallery-img" src={photo} alt="gallery" loading="lazy" onError={(e) => applyImageFallback(e, type)} />
                  </button>
                );
              })}
            </div>
          ) : null}
          <div className="detail-basic-meta">
            <div className="detail-basic-meta-price">
              <span>Стоимость</span>
              <b>{fmtRub.format(item.price)}</b>
            </div>
            <div className="detail-basic-meta-list">
              {item.category ? (
                <div className="detail-basic-meta-item">
                  <Icon name="route" />
                  <span>{item.category}</span>
                </div>
              ) : null}
              {typeof item.date === "number" ? (
                <div className="detail-basic-meta-item">
                  <Icon name="time" />
                  <span>{item.date} дн. назад</span>
                </div>
              ) : null}
              {ratingValue !== null ? (
                <div className="detail-basic-meta-item">
                  <Icon name="star" />
                  <span>{ratingValue.toFixed(1)} / 5</span>
                </div>
              ) : null}
            </div>
          </div>
          <div className="detail-basic-desc-card">
            <div className="detail-content-title">Описание</div>
            <p>{item.desc || "Нет описания"}</p>
          </div>
          <div className="detail-contacts-block detail-contacts-block-basic detail-ad-contacts">
            <div className="detail-contacts-title">Контакты</div>
            <div className="detail-contact-grid">{contactButtons.length ? contactButtons : <p className="small">Контакты не указаны</p>}</div>
          </div>
        </section>
      ) : null}
      {isTaxiDetail ? (
        <section className="detail-taxi-info-block">
          <div className="detail-taxi-media">
            <Media
              photos={photos}
              emptyText="Нет фотографий"
              section={type}
              overlay={favoriteButton}
            />
          </div>
          <div className="detail-taxi-highlight">
            <div className="detail-taxi-price-pill">
              <span>Стоимость поездки</span>
              <b>{fmtRub.format(item.price)}</b>
            </div>
          </div>
          <div className="detail-taxi-info-grid">
            {ratingValue !== null ? (
              <div className="detail-taxi-info-item">
                <span>Оценка</span>
                <b>{ratingValue.toFixed(1)} / 5</b>
              </div>
            ) : null}
            <div className="detail-taxi-info-item">
              <span>Направление</span>
              <b>{item.category || "Не указано"}</b>
            </div>
            {item.when ? (
              <div className="detail-taxi-info-item">
                <span>Дата и время</span>
                <b>{item.when}</b>
              </div>
            ) : null}
            {item.seats ? (
              <div className="detail-taxi-info-item">
                <span>Места</span>
                <b>{item.seats.free}/{item.seats.total}</b>
              </div>
            ) : null}
            {item.isFilled ? (
              <div className="detail-taxi-info-item">
                <span>Статус</span>
                <b>Водитель заполнен</b>
              </div>
            ) : null}
          </div>
          <p className="detail-taxi-desc"><b>Описание:</b> {item.desc || "Нет описания"}</p>
          <div className="detail-taxi-contacts-title">Контакты водителя</div>
          <div className="detail-contact-grid">
            {contactButtons.length ? contactButtons : <p className="small">Контакты не указаны</p>}
          </div>
        </section>
      ) : null}
      {hasRestaurantMeta ? (
        <section className="detail-restaurant-meta restaurant-list-card">
          <div className="detail-restaurant-photo-wrap restaurant-list-photo-wrap">
            {restaurantLogo ? (
              <img
                className="detail-restaurant-photo restaurant-list-photo"
                src={restaurantLogo}
                alt={item.title || "Заведение"}
                loading="lazy"
                onError={(e) => replaceImageWithEmpty(e, "detail-restaurant-photo-empty restaurant-list-photo-empty")}
              />
            ) : (
              <div className="detail-restaurant-photo-empty restaurant-list-photo-empty">Нет фото</div>
            )}
          </div>
          <div className="detail-restaurant-meta-head restaurant-list-head">
            <div className="card-title">{item.title || "Заведение"}</div>
            {(item.dishes || []).length ? <span className="badge">{item.dishes.length} блюд</span> : null}
          </div>
          <div className="detail-restaurant-address restaurant-list-address">{item.address || "Адрес не указан"}</div>
          <div className="detail-restaurant-info-list">
            <div className="detail-restaurant-info-row restaurant-list-meta">
              {cuisineText ? (
                <span className="food-meta-chip">
                  <Icon name="foodall" />
                  {cuisineText}
                </span>
              ) : null}
              <span className="food-meta-chip">
                <Icon name="delivery" />
                {restaurantDeliveryText}
              </span>
            </div>
          </div>
          {contactButtons.length ? (
            <div className="detail-restaurant-contacts">
              {contactButtons}
            </div>
          ) : null}
          {restaurantAboutText ? <p className="detail-restaurant-desc">{restaurantAboutText}</p> : null}
          <div className="actions" style={{ marginTop: 8 }}>
            {typeof onAddDish === "function" ? (
              <button className="primary-btn" type="button" onClick={onAddDish}>Добавить блюдо</button>
            ) : null}
            {typeof onEdit === "function" ? (
              <button className="primary-btn" type="button" onClick={onEdit}>Редактировать</button>
            ) : null}
          </div>
        </section>
      ) : null}
      {isFoodDetail ? (
        <section className="detail-food-desc-card">
          <div className="detail-content-title">Описание блюда</div>
          <p>{item.desc || "Нет описания"}</p>
        </section>
      ) : null}
      {isBasicDetail && !isServicesDetail && !isAdsDetail ? (
        <section className="detail-basic-desc-card">
          <div className="detail-content-title">Описание</div>
          <p>{item.desc || "Нет описания"}</p>
        </section>
      ) : null}
      {feedbackEnabled ? (
        <section className={`reviews-block ${isTaxiDetail ? "reviews-block-standalone" : ""}`}>
          <div className="reviews-header">
            <b>Оценка и отзывы</b>
            <span className="small">
              {ratingValue !== null ? `Средняя: ${ratingValue.toFixed(1)}/5` : "Пока нет оценок"} · {reviews.length} отзыв(ов)
            </span>
          </div>
          {isAuth && !alreadyLeftReview ? (
            <form className="reviews-form" onSubmit={submitFeedback}>
              <Field label="Ваша оценка">
                <div className="rating-stars-shell">
                  <div className="rating-stars" role="radiogroup" aria-label="Ваша оценка">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        className={`rating-star ${value <= reviewRating ? "active" : ""}`}
                        role="radio"
                        aria-checked={reviewRating === value}
                        aria-label={`${value} из 5`}
                        onClick={() => setReviewRating(value)}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <span className="rating-score-chip">{reviewRating}.0 / 5</span>
                </div>
              </Field>
              <Field label="Ваш отзыв">
                <textarea
                  className="textarea"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.currentTarget.value)}
                  minLength={5}
                  maxLength={500}
                  required
                  placeholder="Напишите коротко о вашем опыте"
                />
              </Field>
              <button className="primary-btn" type="submit">Оставить отзыв</button>
            </form>
          ) : null}
          {isAuth && alreadyLeftReview ? (
            <p className="small" style={{ marginTop: 6 }}>Вы уже оставили отзыв для этого предложения.</p>
          ) : (
            !isAuth ? (
              <div className="reviews-guest-actions">
                <p className="small" style={{ margin: 0 }}>Войдите в аккаунт, чтобы оставить оценку и отзыв.</p>
                <button className="primary-btn" type="button" onClick={onRequireAuth}>Оставить отзыв</button>
              </div>
            ) : null
          )}
          {reviews.length ? (
            <>
              <div className="reviews-list">
                {reviews.slice(0, visibleReviewsCount).map((review) => (
                  <article className="review-item" key={review.id}>
                    <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
                      <b>{review.author || "Пользователь"}</b>
                      <span className="small">{review.rating}/5</span>
                    </div>
                    <p style={{ margin: "4px 0 0" }}>{review.text}</p>
                    {review.createdAt ? <p className="small" style={{ marginTop: 4 }}>{formatReviewDate(review.createdAt)}</p> : null}
                  </article>
                ))}
              </div>
              {visibleReviewsCount < reviews.length ? (
                <button
                  className="ghost-btn reviews-more-btn"
                  type="button"
                  onClick={() => setVisibleReviewsCount((prev) => Math.min(reviews.length, prev + REVIEWS_STEP))}
                >
                  Показать ещё
                </button>
              ) : null}
            </>
          ) : (
            <p className="small" style={{ marginTop: 6 }}>Отзывов пока нет.</p>
          )}
        </section>
      ) : null}
      {!isRestaurantDetail && !isTaxiDetail && !isServicesDetail && !isAdsDetail && !isFoodOwnerView ? (
        <section className={`detail-contacts-block ${isFoodDetail ? "detail-contacts-block-food" : "detail-contacts-block-basic"}`}>
          <div className="detail-contacts-title">{isFoodDetail ? "Контакты заведения" : "Контакты"}</div>
          <div className="detail-contact-grid">{contactButtons.length ? contactButtons : <p className="small">Контакты не указаны</p>}</div>
        </section>
      ) : null}
      {isRestaurantDetail ? (
        <>
          <section className="detail-restaurant-dishes-block">
            <div className="detail-restaurant-dishes-head">
              <h4>Список блюд</h4>
              <span className="badge">{(item.dishes || []).length}</span>
            </div>
            {(item.dishes || []).length ? (
              <div className="detail-restaurant-dishes-list">
                {item.dishes.map((dish) => (
                  <article
                    className="detail-restaurant-dish-item card-clickable"
                    key={dish.id || `${dish.title}-${dish.price}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => onOpenDish?.(dish.id, item.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") onOpenDish?.(dish.id, item.id);
                    }}
                  >
                    <div className="detail-restaurant-dish-photo-wrap">
                      {dish.photos?.[0] ? (
                        <img
                          className="detail-restaurant-dish-photo"
                          src={dish.photos[0]}
                          alt={dish.title || "Блюдо"}
                          loading="lazy"
                          onError={(e) => applyImageFallback(e, "food")}
                        />
                      ) : (
                        <div className="detail-restaurant-dish-photo-empty">Нет фото</div>
                      )}
                    </div>
                    <div className="detail-restaurant-dish-price">{fmtRub.format(Number(dish.price) || 0)}</div>
                    <div className="detail-restaurant-dish-title">{dish.title || "Блюдо"}</div>
                    <div className="detail-restaurant-dish-submeta">
                      <span>{dish.prep ? `${dish.prep} минут` : "Время не указано"}</span>
                      <span>{dish.delivery ? "Есть доставка" : "Только самовывоз"}</span>
                      {dish.always ? <span>Всегда в наличии</span> : null}
                      {dish.unavailable ? <span>Нет в наличии</span> : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="small" style={{ marginTop: 6 }}>В этом заведении пока нет добавленных блюд.</p>
            )}
          </section>
        </>
      ) : null}
      {!isRestaurantDetail && !isOwnerView && !isTaxiDetail && !isServicesDetail && !isAdsDetail && !isFoodDetail ? (
        <div className="actions" style={{ marginTop: 8 }}>
          <button className="primary-btn" type="button" onClick={() => onFav(item.id)}>{isFav(item.id) ? <><Icon name="heart-fill" /> Убрать из избранного</> : <><Icon name="heart" /> В избранное</>}</button>
          {typeof onEdit === "function" ? <button className="ghost-btn" type="button" onClick={onEdit}>Редактировать</button> : null}
        </div>
      ) : null}
      {isFoodOwnerView ? (
        <div className="actions" style={{ marginTop: 8 }}>
          <button className="primary-btn" type="button" onClick={() => onEditDish?.(item.id)}>Редактировать</button>
          <button className={item.unavailable ? "primary-btn" : "ghost-btn"} type="button" onClick={() => onToggleDishAvailability?.(item.id)}>
            {item.unavailable ? "В наличии" : "Нет в наличии"}
          </button>
          <button className="danger-btn" type="button" onClick={() => onDeleteDish?.(item.id)}>Удалить</button>
        </div>
      ) : null}
      {!isRestaurantDetail && isOwnerView && type !== "food" ? (
        <div className="actions" style={{ marginTop: 8 }}>
          {typeof onEdit === "function" ? <button className="primary-btn" type="button" onClick={onEdit}>Редактировать</button> : null}
        </div>
      ) : null}

      {viewerIndex !== null ? (
        <section className="viewer" role="dialog" aria-modal="true" aria-label="Просмотр фото">
          <div
            className="viewer-content"
            onTouchStart={(e) => {
              if (e.touches.length === 2) {
                pinchStartDist.current = getTouchDistance(e.touches[0], e.touches[1]);
                pinchStartScale.current = zoom;
                pinchStartPan.current = { ...pan };
                pinchStartFocal.current = getFocalFromTouches(e.touches[0], e.touches[1]);
                gestureMode.current = "pinch";
                setIsTrackDragging(false);
                setIsImageInteracting(true);
                setDismissAnimating(false);
                return;
              }
              if (e.touches.length !== 1) return;
              touchStartX.current = e.changedTouches[0]?.clientX ?? null;
              touchStartY.current = e.changedTouches[0]?.clientY ?? null;
              touchStartAt.current = Date.now();
              panStartX.current = pan.x;
              panStartY.current = pan.y;
              if (zoom > 1.01) {
                gestureMode.current = "pan";
                setIsImageInteracting(true);
                setIsTrackDragging(false);
              } else {
                gestureMode.current = "swipe";
                setIsTrackDragging(true);
              }
              setDismissAnimating(false);
            }}
            onTouchMove={(e) => {
              if (e.touches.length === 2) {
                const dist = getTouchDistance(e.touches[0], e.touches[1]);
                if (pinchStartDist.current) {
                  const nextScale = clamp(pinchStartScale.current * (dist / pinchStartDist.current), 1, 4);
                  const currentFocal = getFocalFromTouches(e.touches[0], e.touches[1]);
                  const ratio = nextScale / pinchStartScale.current;
                  const nextPan = {
                    x: currentFocal.x - (pinchStartFocal.current.x - pinchStartPan.current.x) * ratio,
                    y: currentFocal.y - (pinchStartFocal.current.y - pinchStartPan.current.y) * ratio,
                  };
                  setIsImageInteracting(true);
                  setZoom(nextScale);
                  setPan(clampPan(nextPan, nextScale));
                }
                return;
              }

              if (e.touches.length !== 1 || touchStartX.current === null || touchStartY.current === null) return;
              const currentX = e.touches[0]?.clientX ?? touchStartX.current;
              const currentY = e.touches[0]?.clientY ?? touchStartY.current;
              const deltaX = currentX - touchStartX.current;
              const deltaY = currentY - touchStartY.current;

              if (gestureMode.current === "pan" || zoom > 1.01) {
                setPan(clampPan({ x: panStartX.current + deltaX, y: panStartY.current + deltaY }));
                return;
              }

              if (gestureMode.current === "swipe") {
                if (deltaY > 0 && Math.abs(deltaY) > Math.abs(deltaX) + 8) {
                  setDismissY(deltaY * 0.9);
                  setDragX(0);
                  return;
                }
                setDismissY(0);
                setDragX(deltaX);
              }
            }}
            onTouchEnd={(e) => {
              if (gestureMode.current === "pinch") {
                pinchStartDist.current = null;
                pinchStartScale.current = zoom;
                if (e.touches.length === 1) {
                  const touch = e.touches[0];
                  touchStartX.current = touch?.clientX ?? null;
                  touchStartY.current = touch?.clientY ?? null;
                  panStartX.current = pan.x;
                  panStartY.current = pan.y;
                  gestureMode.current = zoom > 1.01 ? "pan" : "swipe";
                  setIsImageInteracting(zoom > 1.01);
                  setIsTrackDragging(zoom <= 1.01);
                  return;
                }
              }

              if (touchStartY.current === null || touchStartX.current === null) return;
              const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
              const endY = e.changedTouches[0]?.clientY ?? touchStartY.current;
              const deltaX = endX - touchStartX.current;
              const deltaY = endY - touchStartY.current;
              const elapsed = Date.now() - (touchStartAt.current || Date.now());
              touchStartX.current = null;
              touchStartY.current = null;
              touchStartAt.current = 0;
              setIsTrackDragging(false);
              setIsImageInteracting(false);
              const absX = Math.abs(deltaX);
              const absY = Math.abs(deltaY);

              if (deltaY > 90 && absY > absX && elapsed < 320) {
                closeViewerWithSwipe();
                setDragX(0);
                gestureMode.current = "idle";
                return;
              }

              if (zoom > 1.01 && absX > absY && absX >= 80 && elapsed < 320 && photos.length > 1) {
                if (deltaX < 0) showNext();
                else showPrev();
                setDragX(0);
                setDismissY(0);
                gestureMode.current = "idle";
                return;
              }

              if (zoom <= 1.01 && gestureMode.current === "swipe" && absX > absY && absX >= 40 && photos.length > 1) {
                if (deltaX < 0) showNext();
                else showPrev();
                setDragX(0);
                setDismissY(0);
                gestureMode.current = "idle";
                return;
              }

              if (absX < 12 && absY < 12) {
                const now = Date.now();
                if (now - lastTapAt.current < 260) {
                  const nextZoom = zoom > 1.01 ? 1 : 2;
                  setZoom(nextZoom);
                  setPan({ x: 0, y: 0 });
                  lastTapAt.current = 0;
                } else {
                  lastTapAt.current = now;
                }
              }

              if (zoom <= 1.01) {
                setPan({ x: 0, y: 0 });
              }
              setDragX(0);
              if (dismissY > 0) {
                setDismissAnimating(true);
                setDismissY(0);
              }
              gestureMode.current = "idle";
            }}
            onTouchCancel={() => {
              touchStartX.current = null;
              touchStartY.current = null;
              touchStartAt.current = 0;
              pinchStartDist.current = null;
              pinchStartScale.current = zoom;
              setDragX(0);
              setDismissAnimating(true);
              setDismissY(0);
              setIsTrackDragging(false);
              setIsImageInteracting(false);
              gestureMode.current = "idle";
            }}
            style={{
              transform: `translate3d(0, ${dismissY}px, 0)`,
              opacity: `${Math.max(0.45, 1 - dismissY / Math.max(400, window.innerHeight * 0.9))}`,
              transition: dismissAnimating ? "transform 180ms ease, opacity 180ms ease" : "none",
            }}
          >
            <div
              className="viewer-track"
              style={{
                transform: `translate3d(calc(${-viewerIndex * 100}% + ${dragX}px), 0, 0)`,
                transition: isTrackDragging || zoom > 1 ? "none" : "transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1)",
              }}
            >
              {photos.map((photo, idx) => (
                <div className="viewer-slide" key={photo}>
                  <img
                    className="viewer-img"
                    src={photo}
                    alt="fullscreen"
                    draggable={false}
                    ref={idx === viewerIndex ? activeImageRef : null}
                    onError={(e) => applyImageFallback(e, type)}
                    style={{
                      transform: idx === viewerIndex ? `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})` : "translate3d(0, 0, 0) scale(1)",
                      transformOrigin: "50% 50%",
                      transition: isImageInteracting ? "none" : "transform 170ms ease",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
          <button className="viewer-close" type="button" onClick={() => setViewerIndex(null)}>
            ×
          </button>
        </section>
      ) : null}
    </>
  );
}
