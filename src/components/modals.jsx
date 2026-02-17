import { useEffect, useRef, useState } from "react";
import { mock } from "../data/mock";
import { clamp, contactLabel, fmtRub, getTouchDistance } from "../utils/helpers";
import { FormActions, Icon, Field } from "./ui";
import { Media } from "./cards";
import restaurantHero from "../assets/restaurant-hero.svg";
import taxiHero from "../assets/taxi-hero.svg";
import serviceHero from "../assets/service-hero.svg";

export function DetailModalContent({ data, onFav, isFav }) {
  const { item, type } = data;
  const photos = item.photos || [];
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

  const contactButtons = Object.entries(item.contacts || {}).map(([k, v]) => (
    <button className="ghost-btn" key={`${k}-${v}`} type="button" onClick={() => alert(`Откроем контакт: ${v}`)}>
      {contactLabel(k)} {v}
    </button>
  ));

  const showPrev = () => setViewerIndex((prev) => Math.max(0, prev - 1));
  const showNext = () => setViewerIndex((prev) => Math.min(photos.length - 1, prev + 1));

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
      <h3 style={{ marginBottom: 8 }}>{item.title || item.name}</h3>
      <Media photos={photos} emptyText="Нет фотографий" onOpen={() => (photos.length ? setViewerIndex(0) : null)} />
      {photos.length > 1 ? (
        <div className="gallery" style={{ marginTop: 8 }}>
          {photos.slice(1).map((photo, thumbIndex) => {
            const index = thumbIndex + 1;
            return (
              <button key={photo} className="gallery-btn" type="button" onClick={() => setViewerIndex(index)}>
                <img className="gallery-img" src={photo} alt="gallery" loading="lazy" />
              </button>
            );
          })}
        </div>
      ) : null}
      <p><b>Цена:</b> {fmtRub.format(item.price)}</p>
      {type === "food" ? <p><b>Готовность:</b> {item.always ? "Всегда в наличии" : `${item.prep} минут`}</p> : null}
      {type === "taxi" && item.when ? <p><b>Дата и время:</b> {item.when}</p> : null}
      {type === "taxi" && item.seats ? <p><b>Места:</b> {item.seats.free}/{item.seats.total}</p> : null}
      <p><b>Описание:</b> {item.desc || "Нет описания"}</p>
      <div className="actions" style={{ marginTop: 8 }}>{contactButtons.length ? contactButtons : <p className="small">Контакты не указаны</p>}</div>
      <div className="actions" style={{ marginTop: 8 }}>
        <button className="primary-btn" type="button" onClick={() => onFav(item.id)}>{isFav(item.id) ? <><Icon name="heart-fill" /> Убрать из избранного</> : <><Icon name="heart" /> В избранное</>}</button>
      </div>

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

export function CreateForm({ type, onSubmit, onClose, taxiCategories }) {
  const [isPreparingPhotos, setIsPreparingPhotos] = useState(false);
  const [selectedPhotoCount, setSelectedPhotoCount] = useState(0);
  const [photosLimitError, setPhotosLimitError] = useState("");
  const [selectedTaxiCategories, setSelectedTaxiCategories] = useState(() => (type === "taxi" ? [taxiCategories?.[0]].filter(Boolean) : []));
  const [taxiOfferMode, setTaxiOfferMode] = useState("one-time");
  const [taxiDayPreset, setTaxiDayPreset] = useState("");
  const [taxiHourPreset, setTaxiHourPreset] = useState(12);
  const [recurringDays, setRecurringDays] = useState(["Пн", "Ср", "Пт"]);
  const [recurringHourPreset, setRecurringHourPreset] = useState(8);
  const [isTimeDragging, setIsTimeDragging] = useState(false);
  const prepTimerRef = useRef(null);
  const imagesInputRef = useRef(null);
  const maxPhotos = type === "taxi" ? 3 : 10;

  useEffect(() => {
    return () => {
      if (prepTimerRef.current) clearTimeout(prepTimerRef.current);
    };
  }, []);

  const handleImagesChange = (e) => {
    const count = e.target.files?.length || 0;
    setSelectedPhotoCount(count);
    setPhotosLimitError(count > maxPhotos ? `Можно загрузить не более ${maxPhotos} фото` : "");

    if (!count) {
      setIsPreparingPhotos(false);
      return;
    }

    setIsPreparingPhotos(true);
    if (prepTimerRef.current) clearTimeout(prepTimerRef.current);
    const delayMs = Math.min(1500, Math.max(350, count * 120));
    prepTimerRef.current = setTimeout(() => setIsPreparingPhotos(false), delayMs);
  };

  const clearSelectedImages = () => {
    if (prepTimerRef.current) clearTimeout(prepTimerRef.current);
    if (imagesInputRef.current) imagesInputRef.current.value = "";
    setIsPreparingPhotos(false);
    setSelectedPhotoCount(0);
    setPhotosLimitError("");
  };

  const phonePattern = "\\+7 \\(\\d{3}\\) \\d{3}-\\d{2}-\\d{2}";
  const phonePlaceholder = "+7 (___) ___-__-__";

  const normalizePhoneDigits = (raw) => {
    const rawValue = String(raw || "");
    let digits = rawValue.replace(/\D/g, "");
    if (rawValue.trim().startsWith("+7")) digits = digits.slice(1);
    if (digits.length > 10 && (digits[0] === "7" || digits[0] === "8")) digits = digits.slice(1);
    return digits.slice(0, 10);
  };

  const formatPhoneDigits = (digits, { allowEmpty = true } = {}) => {
    if (!digits) return allowEmpty ? "" : "+7";

    let result = "+7";
    if (digits.length < 3) return `${result} ${digits}`;

    result += ` (${digits.slice(0, 3)})`;
    if (digits.length < 6) return `${result} ${digits.slice(3)}`;

    result += ` ${digits.slice(3, 6)}`;
    if (digits.length < 8) return `${result}-${digits.slice(6)}`;

    result += `-${digits.slice(6, 8)}`;
    return `${result}-${digits.slice(8, 10)}`;
  };

  const formatPhoneValue = (raw, options = {}) => formatPhoneDigits(normalizePhoneDigits(raw), options);

  const handlePhoneInput = (e, options = {}) => {
    const input = e.currentTarget;
    const prev = input.dataset.prevValue || "";
    const raw = input.value;
    let digits = normalizePhoneDigits(raw);
    const isDelete = raw.length < prev.length;

    if (isDelete && raw && !/\d$/.test(raw)) {
      digits = digits.slice(0, -1);
    }

    const next = formatPhoneDigits(digits, options);
    input.value = next;
    input.dataset.prevValue = next;
  };

  const syncPhonePrev = (e) => {
    e.currentTarget.dataset.prevValue = e.currentTarget.value;
  };
  const startTimeDrag = () => setIsTimeDragging(true);
  const endTimeDrag = () => setIsTimeDragging(false);

  const cityCategory = "Такси по Цхинвалу";
  const isRecurring = taxiOfferMode === "recurring";

  const toggleTaxiCategory = (category) => {
    const isCity = category === cityCategory;
    setSelectedTaxiCategories((prev) => {
      if (isCity) {
        if (prev.includes(cityCategory)) return prev.filter((x) => x !== cityCategory);
        return [cityCategory];
      }

      if (prev.includes(category)) return prev.filter((x) => x !== category);
      return [category];
    });
  };
  const isIntercitySelected = selectedTaxiCategories.some((x) => x !== cityCategory);
  const taxiDayPresets = ["Сегодня", "Завтра", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  const recurringWeekdays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  const formatTaxiHour = (hour) => `${hour % 24}`.padStart(2, "0") + ":00";
  const taxiTimePreset = formatTaxiHour(taxiHourPreset);
  const recurringTimePreset = formatTaxiHour(recurringHourPreset);
  const getTaxiDateByPreset = (preset) => {
    if (!preset) return "";

    const now = new Date();
    const date = new Date(now);
    const weekdays = { Вс: 0, Пн: 1, Вт: 2, Ср: 3, Чт: 4, Пт: 5, Сб: 6 };

    if (preset === "Сегодня") {
      // keep current date
    } else if (preset === "Завтра") {
      date.setDate(now.getDate() + 1);
    } else {
      const target = weekdays[preset];
      if (typeof target === "number") {
        const diff = (target - now.getDay() + 7) % 7;
        date.setDate(now.getDate() + diff);
      }
    }

    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };
  const taxiDateValue = getTaxiDateByPreset(taxiDayPreset);
  const taxiWhenValue = taxiDayPreset && taxiDateValue
    ? `${taxiDayPreset} (${taxiDateValue})${taxiTimePreset ? ` ${taxiTimePreset}` : ""}`
    : "";
  const toggleRecurringDay = (day) => {
    setRecurringDays((prev) => (
      prev.includes(day) ? prev.filter((x) => x !== day) : [...prev, day]
    ));
  };

  useEffect(() => {
    if (!isIntercitySelected && taxiOfferMode !== "one-time") setTaxiOfferMode("one-time");
  }, [isIntercitySelected, taxiOfferMode]);

  if (type === "restaurant") {
    return (
      <>
        <div
          style={{
            display: "grid",
            gap: 8,
            marginBottom: 10,
            padding: 10,
            borderRadius: 14,
            background: "var(--primary-soft)",
            border: "1px solid var(--line)",
          }}
        >
          <img
            src={restaurantHero}
            alt="Здание заведения"
            style={{
              width: "100%",
              height: 150,
              objectFit: "cover",
              borderRadius: 12,
            }}
          />
          <p className="small" style={{ margin: 0, color: "var(--text)" }}>Расскажите о заведении и добавьте лучшие фото</p>
        </div>
        <h3 style={{ marginBottom: 8 }}>Создать заведение</h3>
        <form className="list" onSubmit={(e) => onSubmit(e, "restaurant")}>
          <Field label="Название"><input required name="title" className="input" minLength={2} maxLength={100} /></Field>
          <Field label="Описание"><textarea required name="desc" className="textarea" maxLength={2000} /></Field>
          <Field label="Адрес"><input required name="address" className="input" minLength={5} maxLength={200} /></Field>
          <div className="grid-2">
            <Field label="Телефон">
              <input
                required
                name="phone"
                type="tel"
                inputMode="tel"
                className="input"
                placeholder={phonePlaceholder}
                maxLength={18}
                pattern={phonePattern}
                title="Введите номер в формате +7 (999) 999-99-99"
                onInput={(e) => handlePhoneInput(e, { allowEmpty: true })}
                onFocus={syncPhonePrev}
              />
            </Field>
            <Field label="Telegram"><input name="telegram" className="input" placeholder="@username" /></Field>
          </div>
          <Field label="WhatsApp">
            <input
              name="whatsapp"
              type="tel"
              inputMode="tel"
              className="input"
              placeholder={phonePlaceholder}
              maxLength={18}
              pattern={phonePattern}
              title="Введите номер в формате +7 (999) 999-99-99"
              onInput={(e) => handlePhoneInput(e, { allowEmpty: true })}
              onFocus={syncPhonePrev}
            />
          </Field>
          <Field label="Фото (до 10)">
            <div className="input-with-clear">
              <input
                type="file"
                name="images"
                className={`input ${selectedPhotoCount > 0 ? "input-has-clear" : ""}`}
                multiple
                accept="image/*"
                ref={imagesInputRef}
                onChange={handleImagesChange}
                onClick={(e) => {
                  e.currentTarget.value = "";
                }}
              />
              {selectedPhotoCount > 0 ? (
                <button className="clear-photos-btn clear-photos-inside" type="button" onClick={clearSelectedImages} aria-label="Убрать выбранные фото">
                  ×
                </button>
              ) : null}
            </div>
            {selectedPhotoCount > 0 ? (
              <div className="upload-status" aria-live="polite">
                {isPreparingPhotos ? (
                  <>
                    <span className="loader-spinner" aria-hidden="true" />
                    Подготавливаем {selectedPhotoCount} фото...
                  </>
                ) : (
                  <>Выбрано фото: {selectedPhotoCount}</>
                )}
              </div>
            ) : null}
            {photosLimitError ? <p className="small" style={{ color: "var(--danger)" }}>{photosLimitError}</p> : null}
          </Field>
          <FormActions
            onClose={onClose}
            submitDisabled={isPreparingPhotos || Boolean(photosLimitError)}
            submitLabel={isPreparingPhotos ? "Подготовка фото..." : "Сохранить"}
          />
        </form>
      </>
    );
  }

  if (type === "taxi") {
    return (
      <>
        <div
          style={{
            display: "grid",
            gap: 8,
            marginBottom: 10,
            padding: 10,
            borderRadius: 14,
            background: "var(--primary-soft)",
            border: "1px solid var(--line)",
          }}
        >
          <img
            src={taxiHero}
            alt="Иллюстрация такси"
            style={{
              width: "100%",
              height: 150,
              objectFit: "cover",
              borderRadius: 12,
            }}
          />
          <p className="small" style={{ margin: 0, color: "var(--text)" }}>Укажите маршрут, время и контакты для пассажиров</p>
        </div>
        <h3 style={{ marginBottom: 8 }}>Создание предложения такси</h3>
        <form className="list" onSubmit={(e) => onSubmit(e, "taxi")}>
          <Field label="Направления">
            <div className="multi-select-buttons">
              {taxiCategories.map((x) => {
                return (
                  <button
                    key={x}
                    type="button"
                    className={`multi-select-btn ${selectedTaxiCategories.includes(x) ? "active" : ""}`}
                    onClick={() => toggleTaxiCategory(x)}
                    aria-pressed={selectedTaxiCategories.includes(x)}
                  >
                    {x}
                  </button>
                );
              })}
            </div>
            {selectedTaxiCategories.map((x) => (
              <input key={x} type="hidden" name="category" value={x} />
            ))}
            <p className="small" style={{ marginTop: 6, color: "var(--muted)" }}>
              Можно выбрать только одно направление.
            </p>
            {!selectedTaxiCategories.length ? <p className="small" style={{ color: "var(--danger)", marginTop: 6 }}>Выберите хотя бы одно направление</p> : null}
          </Field>
          <Field label="Имя/ник"><input required name="name" className="input" minLength={2} maxLength={60} /></Field>
          <div className={isIntercitySelected ? "grid-2" : undefined}>
            <Field label="Стоимость"><input required name="price" type="number" min={1} inputMode="numeric" pattern="[0-9]*" className="input" /></Field>
            {isIntercitySelected ? <Field label="Свободных мест"><input name="seats" type="number" min={1} className="input" /></Field> : null}
          </div>
          {isIntercitySelected ? (
            <>
              <Field label="Формат поездок">
                <div className="multi-select-buttons">
                  <button
                    type="button"
                    className={`multi-select-btn ${taxiOfferMode === "one-time" ? "active" : ""}`}
                    onClick={() => setTaxiOfferMode("one-time")}
                    aria-pressed={taxiOfferMode === "one-time"}
                  >
                    Разовая
                  </button>
                  <button
                    type="button"
                    className={`multi-select-btn ${taxiOfferMode === "recurring" ? "active" : ""}`}
                    onClick={() => setTaxiOfferMode("recurring")}
                    aria-pressed={taxiOfferMode === "recurring"}
                  >
                    Регулярная
                  </button>
                </div>
              </Field>
              {isRecurring ? (
                <Field label={`Регулярные выезды (${recurringDays.join(", ") || "выберите дни"} · ${recurringTimePreset})`}>
                  <div className="multi-select-buttons">
                    {recurringWeekdays.map((x) => (
                      <button
                        key={x}
                        type="button"
                        className={`multi-select-btn ${recurringDays.includes(x) ? "active" : ""}`}
                        onClick={() => toggleRecurringDay(x)}
                        aria-pressed={recurringDays.includes(x)}
                      >
                        {x}
                      </button>
                    ))}
                  </div>
                  <p className="small" style={{ marginTop: 8, marginBottom: 6 }}>Время выезда</p>
                  <div className={`time-slider-meta${isTimeDragging ? " is-dragging" : ""}`}>
                    <span>04:00</span>
                    <b>{recurringTimePreset}</b>
                    <span>00:00</span>
                  </div>
                  <input
                    type="range"
                    className="time-slider"
                    min={4}
                    max={24}
                    step={1}
                    value={recurringHourPreset}
                    onChange={(e) => setRecurringHourPreset(Number(e.currentTarget.value))}
                    onPointerDown={startTimeDrag}
                    onPointerUp={endTimeDrag}
                    onPointerCancel={endTimeDrag}
                    onPointerLeave={endTimeDrag}
                  />
                  {recurringDays.map((x) => <input key={x} type="hidden" name="scheduleDay" value={x} />)}
                  <input type="hidden" name="scheduleHour" value={recurringTimePreset} />
                </Field>
              ) : (
                <Field label={taxiDateValue ? `Дата и время (${taxiDateValue} ${taxiTimePreset})` : "Дата и время"}>
                  <div className="multi-select-buttons">
                    {taxiDayPresets.map((x) => (
                      <button
                        key={x}
                        type="button"
                        className={`multi-select-btn ${taxiDayPreset === x ? "active" : ""}`}
                        onClick={() => setTaxiDayPreset((prev) => (prev === x ? "" : x))}
                        aria-pressed={taxiDayPreset === x}
                      >
                        {x}
                      </button>
                    ))}
                  </div>
                  <p className="small" style={{ marginTop: 8, marginBottom: 6 }}>Время выезда</p>
                  <div className={`time-slider-meta${isTimeDragging ? " is-dragging" : ""}`}>
                    <span>04:00</span>
                    <b>{taxiTimePreset}</b>
                    <span>00:00</span>
                  </div>
                  <input
                    type="range"
                    className="time-slider"
                    min={4}
                    max={24}
                    step={1}
                    value={taxiHourPreset}
                    onChange={(e) => setTaxiHourPreset(Number(e.currentTarget.value))}
                    onPointerDown={startTimeDrag}
                    onPointerUp={endTimeDrag}
                    onPointerCancel={endTimeDrag}
                    onPointerLeave={endTimeDrag}
                  />
                  <input type="hidden" name="when" value={taxiWhenValue} />
                </Field>
              )}
              <input type="hidden" name="mode" value={taxiOfferMode} />
            </>
          ) : null}
          <Field label="Телефон">
            <input
              required
              name="phone"
              type="tel"
              inputMode="tel"
              className="input"
              placeholder={phonePlaceholder}
              maxLength={18}
              pattern={phonePattern}
              title="Введите номер в формате +7 (999) 999-99-99"
              onInput={(e) => handlePhoneInput(e, { allowEmpty: true })}
              onFocus={syncPhonePrev}
            />
          </Field>
          <Field label="WhatsApp">
            <input
              name="wa"
              type="tel"
              inputMode="tel"
              className="input"
              placeholder={phonePlaceholder}
              maxLength={18}
              pattern={phonePattern}
              title="Введите номер в формате +7 (999) 999-99-99"
              onInput={(e) => handlePhoneInput(e, { allowEmpty: true })}
              onFocus={syncPhonePrev}
            />
          </Field>
          <Field label="Telegram"><input name="tg" className="input" /></Field>
          <Field label="Описание"><textarea name="desc" className="textarea" maxLength={2000} /></Field>
          <Field label="Фото авто или водителя (до 3)">
            <div className="input-with-clear">
              <input
                type="file"
                name="images"
                className={`input ${selectedPhotoCount > 0 ? "input-has-clear" : ""}`}
                multiple
                accept="image/*"
                ref={imagesInputRef}
                onChange={handleImagesChange}
                onClick={(e) => {
                  e.currentTarget.value = "";
                }}
              />
              {selectedPhotoCount > 0 ? (
                <button className="clear-photos-btn clear-photos-inside" type="button" onClick={clearSelectedImages} aria-label="Убрать выбранные фото">
                  ×
                </button>
              ) : null}
            </div>
            {selectedPhotoCount > 0 ? (
              <div className="upload-status" aria-live="polite">
                {isPreparingPhotos ? (
                  <>
                    <span className="loader-spinner" aria-hidden="true" />
                    Подготавливаем {selectedPhotoCount} фото...
                  </>
                ) : (
                  <>Выбрано фото: {selectedPhotoCount}</>
                )}
              </div>
            ) : null}
            {photosLimitError ? <p className="small" style={{ color: "var(--danger)" }}>{photosLimitError}</p> : null}
          </Field>
          <FormActions
            onClose={onClose}
            submitDisabled={!selectedTaxiCategories.length || isPreparingPhotos || Boolean(photosLimitError) || (isIntercitySelected && isRecurring && !recurringDays.length)}
            submitLabel={isPreparingPhotos ? "Подготовка фото..." : "Сохранить"}
          />
        </form>
      </>
    );
  }

  const categories = type === "ad"
    ? mock.adsCategories.filter((x) => x !== "Мои объявления")
    : type === "service"
      ? mock.serviceCategories
      : mock.foodCategories;

  return (
    <>
      {type === "service" ? (
        <div
          style={{
            display: "grid",
            gap: 8,
            marginBottom: 10,
            padding: 10,
            borderRadius: 14,
            background: "var(--primary-soft)",
            border: "1px solid var(--line)",
          }}
        >
          <img
            src={serviceHero}
            alt="Иллюстрация услуги"
            style={{
              width: "100%",
              height: 150,
              objectFit: "cover",
              borderRadius: 12,
            }}
          />
          <p className="small" style={{ margin: 0, color: "var(--text)" }}>Опишите услугу, стоимость и приложите примеры работ</p>
        </div>
      ) : null}
      <h3 style={{ marginBottom: 8 }}>{type === "ad" ? "Создание объявления" : type === "service" ? "Создание услуги" : "Добавление блюда"}</h3>
      <form className="list" onSubmit={(e) => onSubmit(e, type)}>
        <Field label="Название"><input required name="title" className="input" minLength={3} maxLength={80} /></Field>
        <Field label="Категория"><select className="select" name="category">{categories.map((x) => <option key={x}>{x}</option>)}</select></Field>
        <Field label="Цена, ₽"><input required name="price" type="number" min={1} inputMode="numeric" pattern="[0-9]*" className="input" /></Field>
        <Field label="Описание"><textarea required name="desc" className="textarea" minLength={10} maxLength={2000} /></Field>
        <Field label={`Фото (до ${maxPhotos})`}>
          <div className="input-with-clear">
            <input
              type="file"
              name="images"
              className={`input ${selectedPhotoCount > 0 ? "input-has-clear" : ""}`}
              multiple
              accept="image/*"
              ref={imagesInputRef}
              onChange={handleImagesChange}
              onClick={(e) => {
                e.currentTarget.value = "";
              }}
            />
            {selectedPhotoCount > 0 ? (
              <button className="clear-photos-btn clear-photos-inside" type="button" onClick={clearSelectedImages} aria-label="Убрать выбранные фото">
                ×
              </button>
            ) : null}
          </div>
          {selectedPhotoCount > 0 ? (
            <div className="upload-status" aria-live="polite">
              {isPreparingPhotos ? (
                <>
                  <span className="loader-spinner" aria-hidden="true" />
                  Подготавливаем {selectedPhotoCount} фото...
                </>
              ) : (
                <>Выбрано фото: {selectedPhotoCount}</>
              )}
            </div>
          ) : null}
        </Field>
        {photosLimitError ? <p className="small" style={{ color: "var(--danger)" }}>{photosLimitError}</p> : null}
        <FormActions
          onClose={onClose}
          submitDisabled={isPreparingPhotos || Boolean(photosLimitError)}
          submitLabel={isPreparingPhotos ? "Подготовка фото..." : "Сохранить"}
        />
      </form>
    </>
  );
}

export function ProfileEditForm({ profile, onSubmit, onClose }) {
  const phonePattern = "\\+7 \\(\\d{3}\\) \\d{3}-\\d{2}-\\d{2}";
  const phonePlaceholder = "+7 (___) ___-__-__";

  const normalizePhoneDigits = (raw) => {
    const rawValue = String(raw || "");
    let digits = rawValue.replace(/\D/g, "");
    if (rawValue.trim().startsWith("+7")) digits = digits.slice(1);
    if (digits.length > 10 && (digits[0] === "7" || digits[0] === "8")) digits = digits.slice(1);
    return digits.slice(0, 10);
  };

  const formatPhoneDigits = (digits, { allowEmpty = true } = {}) => {
    if (!digits) return allowEmpty ? "" : "+7";

    let result = "+7";
    if (digits.length < 3) return `${result} ${digits}`;

    result += ` (${digits.slice(0, 3)})`;
    if (digits.length < 6) return `${result} ${digits.slice(3)}`;

    result += ` ${digits.slice(3, 6)}`;
    if (digits.length < 8) return `${result}-${digits.slice(6)}`;

    result += `-${digits.slice(6, 8)}`;
    return `${result}-${digits.slice(8, 10)}`;
  };

  const formatPhoneValue = (raw, options = {}) => formatPhoneDigits(normalizePhoneDigits(raw), options);

  const handlePhoneInput = (e, options = {}) => {
    const input = e.currentTarget;
    const prev = input.dataset.prevValue || "";
    const raw = input.value;
    let digits = normalizePhoneDigits(raw);
    const isDelete = raw.length < prev.length;

    if (isDelete && raw && !/\d$/.test(raw)) {
      digits = digits.slice(0, -1);
    }

    const next = formatPhoneDigits(digits, options);
    input.value = next;
    input.dataset.prevValue = next;
  };

  const syncPhonePrev = (e) => {
    e.currentTarget.dataset.prevValue = e.currentTarget.value;
  };

  return (
    <>
      <h3 style={{ marginBottom: 8 }}>Редактирование профиля</h3>
      <form className="list" onSubmit={(e) => onSubmit(e, "profile")}>
        <Field label="Имя"><input required name="name" defaultValue={profile.name} className="input" minLength={2} maxLength={80} /></Field>
        <Field label="Телефон">
          <input
            required
            name="phone"
            type="tel"
            inputMode="tel"
            defaultValue={formatPhoneValue(profile.phone, { allowEmpty: true })}
            className="input"
            placeholder={phonePlaceholder}
            maxLength={18}
            pattern={phonePattern}
            title="Введите номер в формате +7 (999) 999-99-99"
            onInput={(e) => handlePhoneInput(e, { allowEmpty: true })}
            onFocus={syncPhonePrev}
          />
        </Field>
        <Field label="Telegram"><input name="telegram" defaultValue={profile.telegram} className="input" /></Field>
        <Field label="WhatsApp">
          <input
            name="whatsapp"
            type="tel"
            inputMode="tel"
            defaultValue={formatPhoneValue(profile.whatsapp, { allowEmpty: true })}
            className="input"
            placeholder={phonePlaceholder}
            maxLength={18}
            pattern={phonePattern}
            title="Введите номер в формате +7 (999) 999-99-99"
            onInput={(e) => handlePhoneInput(e, { allowEmpty: true })}
            onFocus={syncPhonePrev}
          />
        </Field>
        <Field label="О себе"><textarea name="about" defaultValue={profile.about} className="textarea" maxLength={500} /></Field>
        <FormActions onClose={onClose} />
      </form>
    </>
  );
}
