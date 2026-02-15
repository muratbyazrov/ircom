import { useEffect, useRef, useState } from "react";
import { mock } from "../data/mock";
import { clamp, contactLabel, fmtRub, getTouchDistance } from "../utils/helpers";
import { FormActions, Icon, Field } from "./ui";
import { Media } from "./cards";

export function DetailModalContent({ data, onFav, isFav }) {
  const { item, type } = data;
  const photos = item.photos || [];
  const [viewerIndex, setViewerIndex] = useState(null);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [zoom, setZoom] = useState(1);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const pinchStartDist = useRef(null);
  const pinchStartScale = useRef(1);
  const lastTapAt = useRef(0);

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
    setIsDragging(false);
    setZoom(1);
  }, [viewerIndex]);

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
                setIsDragging(false);
                return;
              }
              touchStartX.current = e.changedTouches[0]?.clientX ?? null;
              touchStartY.current = e.changedTouches[0]?.clientY ?? null;
              setIsDragging(true);
            }}
            onTouchMove={(e) => {
              if (e.touches.length === 2) {
                const dist = getTouchDistance(e.touches[0], e.touches[1]);
                if (pinchStartDist.current) {
                  const nextScale = clamp(pinchStartScale.current * (dist / pinchStartDist.current), 1, 4);
                  setZoom(nextScale);
                }
                return;
              }

              if (zoom > 1 || !isDragging || touchStartX.current === null) return;
              const currentX = e.changedTouches[0]?.clientX ?? touchStartX.current;
              setDragX(currentX - touchStartX.current);
            }}
            onTouchEnd={(e) => {
              if (pinchStartDist.current) {
                pinchStartDist.current = null;
                pinchStartScale.current = zoom;
              }

              if (touchStartY.current === null || touchStartX.current === null) return;
              const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
              const endY = e.changedTouches[0]?.clientY ?? touchStartY.current;
              const deltaX = endX - touchStartX.current;
              const deltaY = endY - touchStartY.current;
              touchStartX.current = null;
              touchStartY.current = null;
              setIsDragging(false);
              const absX = Math.abs(deltaX);
              const absY = Math.abs(deltaY);

              if (zoom === 1 && absX > absY && absX >= 40 && photos.length > 1) {
                if (deltaX < 0) showNext();
                else showPrev();
                setDragX(0);
                return;
              }

              if (absX < 12 && absY < 12) {
                const now = Date.now();
                if (now - lastTapAt.current < 260) {
                  setZoom((prev) => (prev > 1 ? 1 : 2));
                  lastTapAt.current = 0;
                } else {
                  lastTapAt.current = now;
                }
              }

              setDragX(0);
            }}
          >
            <div
              className="viewer-track"
              style={{
                transform: `translate3d(calc(${-viewerIndex * 100}% + ${dragX}px), 0, 0)`,
                transition: isDragging || zoom > 1 ? "none" : "transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1)",
              }}
            >
              {photos.map((photo, idx) => (
                <div className="viewer-slide" key={photo}>
                  <img
                    className="viewer-img"
                    src={photo}
                    alt="fullscreen"
                    draggable={false}
                    style={{
                      transform: idx === viewerIndex ? `scale(${zoom})` : "scale(1)",
                      transition: "transform 180ms ease",
                    }}
                  />
                </div>
              ))}
            </div>
            <button className="viewer-close" type="button" onClick={() => setViewerIndex(null)}>
              ×
            </button>
          </div>
        </section>
      ) : null}
    </>
  );
}

export function CreateForm({ type, onSubmit, onClose, taxiCategories }) {
  const [isPreparingPhotos, setIsPreparingPhotos] = useState(false);
  const [selectedPhotoCount, setSelectedPhotoCount] = useState(0);
  const prepTimerRef = useRef(null);
  const imagesInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (prepTimerRef.current) clearTimeout(prepTimerRef.current);
    };
  }, []);

  const handleImagesChange = (e) => {
    const count = e.target.files?.length || 0;
    setSelectedPhotoCount(count);

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
  };

  if (type === "restaurant") {
    return (
      <>
        <h3 style={{ marginBottom: 8 }}>Создать заведение</h3>
        <form className="list" onSubmit={(e) => onSubmit(e, "restaurant")}>
          <Field label="Название"><input required name="title" className="input" minLength={2} maxLength={100} /></Field>
          <Field label="Описание"><textarea required name="desc" className="textarea" maxLength={2000} /></Field>
          <Field label="Логотип"><input name="logo" className="input" placeholder="https://..." /></Field>
          <FormActions onClose={onClose} />
        </form>
      </>
    );
  }

  if (type === "taxi") {
    return (
      <>
        <h3 style={{ marginBottom: 8 }}>Создание предложения такси</h3>
        <form className="list" onSubmit={(e) => onSubmit(e, "taxi")}>
          <Field label="Направление">
            <select name="category" className="select">{taxiCategories.map((x) => <option key={x}>{x}</option>)}</select>
          </Field>
          <Field label="Имя/ник"><input required name="name" className="input" minLength={2} maxLength={60} /></Field>
          <div className="grid-2">
            <Field label="Стоимость"><input required name="price" type="number" min={1} className="input" /></Field>
            <Field label="Свободных мест"><input name="seats" type="number" min={1} className="input" /></Field>
          </div>
          <Field label="Дата и время"><input name="when" className="input" placeholder="Например, Сегодня 15:30" /></Field>
          <Field label="Телефон"><input required name="phone" className="input" /></Field>
          <Field label="WhatsApp"><input name="wa" className="input" /></Field>
          <Field label="Telegram"><input name="tg" className="input" /></Field>
          <Field label="Описание"><textarea name="desc" className="textarea" maxLength={2000} /></Field>
          <Field label="Фото автомобиля"><input name="photo" className="input" placeholder="https://..." /></Field>
          <FormActions onClose={onClose} />
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
      <h3 style={{ marginBottom: 8 }}>{type === "ad" ? "Создание объявления" : type === "service" ? "Создание услуги" : "Добавление блюда"}</h3>
      <form className="list" onSubmit={(e) => onSubmit(e, type)}>
        <Field label="Название"><input required name="title" className="input" minLength={3} maxLength={80} /></Field>
        <Field label="Категория"><select className="select" name="category">{categories.map((x) => <option key={x}>{x}</option>)}</select></Field>
        <Field label="Цена, ₽"><input required name="price" type="number" min={1} className="input" /></Field>
        <Field label="Описание"><textarea required name="desc" className="textarea" minLength={10} maxLength={2000} /></Field>
        <Field label="Фото (до 10)">
          <input
            type="file"
            name="images"
            className="input"
            multiple
            accept="image/*"
            ref={imagesInputRef}
            onChange={handleImagesChange}
            onClick={(e) => {
              e.currentTarget.value = "";
            }}
          />
          {selectedPhotoCount > 0 ? (
            <div className="upload-status-wrap">
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
              <button className="clear-photos-btn" type="button" onClick={clearSelectedImages} aria-label="Убрать выбранные фото">
                ×
              </button>
            </div>
          ) : null}
        </Field>
        <FormActions onClose={onClose} submitDisabled={isPreparingPhotos} submitLabel={isPreparingPhotos ? "Подготовка фото..." : "Сохранить"} />
      </form>
    </>
  );
}

export function ProfileEditForm({ profile, onSubmit, onClose }) {
  return (
    <>
      <h3 style={{ marginBottom: 8 }}>Редактирование профиля</h3>
      <form className="list" onSubmit={(e) => onSubmit(e, "profile")}>
        <Field label="Имя"><input required name="name" defaultValue={profile.name} className="input" minLength={2} maxLength={80} /></Field>
        <Field label="Телефон"><input required name="phone" defaultValue={profile.phone} className="input" /></Field>
        <Field label="Telegram"><input name="telegram" defaultValue={profile.telegram} className="input" /></Field>
        <Field label="WhatsApp"><input name="whatsapp" defaultValue={profile.whatsapp} className="input" /></Field>
        <Field label="О себе"><textarea name="about" defaultValue={profile.about} className="textarea" maxLength={500} /></Field>
        <FormActions onClose={onClose} />
      </form>
    </>
  );
}
