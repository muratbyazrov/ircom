import { useEffect, useRef, useState } from "react";
import { mock } from "../../data/mock";
import { applyImageFallback } from "../../utils/images";
import { formatPhoneValue, handlePhoneInput, PHONE_PATTERN, PHONE_PLACEHOLDER, syncPhonePrev } from "../../utils/phone";
import { FormActions, Field } from "../ui";
import restaurantHero from "../../assets/restaurant-hero.svg";
import taxiHero from "../../assets/taxi-hero.svg";
import serviceHero from "../../assets/service-hero.svg";

export function CreateForm({ type, onSubmit, onClose, taxiCategories, mode = "create", initialValues = null, editMeta = null }) {
  const isEdit = mode === "edit";
  const initialCategory = initialValues?.category;
  const initialTaxiCategories = Array.isArray(initialValues?.categories)
    ? initialValues.categories
    : initialCategory
      ? [initialCategory]
      : [taxiCategories?.[0]].filter(Boolean);
  const initialTaxiMode = initialValues?.mode === "recurring" ? "recurring" : "one-time";
  const initialTaxiWhen = String(initialValues?.when || "");
  const initialTaxiDayPreset = (() => {
    const match = initialTaxiWhen.match(/^(Сегодня|Завтра|Пн|Вт|Ср|Чт|Пт|Сб|Вс)\b/);
    return match ? match[1] : "";
  })();
  const initialTaxiHourPreset = (() => {
    const match = initialTaxiWhen.match(/(\d{1,2}):/);
    const parsed = Number(match?.[1]);
    if (!Number.isFinite(parsed)) return 12;
    return Math.max(4, Math.min(24, parsed));
  })();
  const initialRecurringHourPreset = (() => {
    const match = String(initialValues?.time || "").match(/(\d{1,2}):/);
    const parsed = Number(match?.[1]);
    if (!Number.isFinite(parsed)) return 8;
    return Math.max(4, Math.min(24, parsed));
  })();
  const [isPreparingPhotos, setIsPreparingPhotos] = useState(false);
  const [selectedPhotoCount, setSelectedPhotoCount] = useState(0);
  const [photosLimitError, setPhotosLimitError] = useState("");
  const [selectedTaxiCategories, setSelectedTaxiCategories] = useState(() => (type === "taxi" ? initialTaxiCategories : []));
  const [taxiOfferMode, setTaxiOfferMode] = useState(initialTaxiMode);
  const [taxiDayPreset, setTaxiDayPreset] = useState(initialTaxiDayPreset);
  const [taxiHourPreset, setTaxiHourPreset] = useState(initialTaxiHourPreset);
  const [recurringDays, setRecurringDays] = useState(() => {
    const source = Array.isArray(initialValues?.weekdays) ? initialValues.weekdays : ["Пн", "Ср", "Пт"];
    return source.length ? source : ["Пн", "Ср", "Пт"];
  });
  const [recurringHourPreset, setRecurringHourPreset] = useState(initialRecurringHourPreset);
  const [restaurantDeliveryMode, setRestaurantDeliveryMode] = useState(() => {
    const mode = String(initialValues?.deliveryMode || "none");
    return mode === "free" || mode === "paid" ? mode : "none";
  });
  const [restaurantDeliveryPrice, setRestaurantDeliveryPrice] = useState(() => {
    const price = Number(initialValues?.deliveryPrice);
    return Number.isFinite(price) && price > 0 ? String(price) : "";
  });
  const [isTimeDragging, setIsTimeDragging] = useState(false);
  const prepTimerRef = useRef(null);
  const imagesInputRef = useRef(null);
  const maxPhotos = type === "taxi" ? 3 : type === "restaurant" ? 1 : 10;

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
            onError={(e) => applyImageFallback(e, "food")}
            style={{
              width: "100%",
              height: 150,
              objectFit: "cover",
              borderRadius: 12,
            }}
          />
          <p className="small" style={{ margin: 0, color: "var(--text)" }}>Расскажите о заведении и добавьте логотип</p>
        </div>
        <h3 style={{ marginBottom: 8 }}>{isEdit ? "Редактирование заведения" : "Создать заведение"}</h3>
        <form className="list" onSubmit={(e) => onSubmit(e, "restaurant")}>
          {isEdit && editMeta?.id ? <input type="hidden" name="editEntityId" value={editMeta.id} /> : null}
          {isEdit && editMeta?.kind ? <input type="hidden" name="editEntityKind" value={editMeta.kind} /> : null}
          <Field label="Название"><input required name="title" defaultValue={initialValues?.title || ""} className="input" minLength={2} maxLength={100} /></Field>
          <Field label="Описание"><textarea required name="desc" defaultValue={initialValues?.desc || ""} className="textarea" maxLength={2000} /></Field>
          <Field label="Адрес"><input required name="address" defaultValue={initialValues?.address || ""} className="input" minLength={5} maxLength={200} /></Field>
          <div className="grid-2">
            <Field label="Телефон">
              <input
                required
                name="phone"
                type="tel"
                inputMode="tel"
                defaultValue={formatPhoneValue(initialValues?.phone, { allowEmpty: true })}
                className="input"
                placeholder={PHONE_PLACEHOLDER}
                maxLength={18}
                pattern={PHONE_PATTERN}
                title="Введите номер в формате +7 (999) 999-99-99"
                onInput={(e) => handlePhoneInput(e, { allowEmpty: true })}
                onFocus={syncPhonePrev}
              />
            </Field>
            <Field label="Telegram"><input name="telegram" defaultValue={initialValues?.telegram || ""} className="input" placeholder="@username" /></Field>
          </div>
          <Field label="WhatsApp">
            <input
              name="whatsapp"
              type="tel"
              inputMode="tel"
              defaultValue={formatPhoneValue(initialValues?.whatsapp, { allowEmpty: true })}
              className="input"
              placeholder={PHONE_PLACEHOLDER}
              maxLength={18}
              pattern={PHONE_PATTERN}
              title="Введите номер в формате +7 (999) 999-99-99"
              onInput={(e) => handlePhoneInput(e, { allowEmpty: true })}
              onFocus={syncPhonePrev}
            />
          </Field>
          <Field label="Доставка">
            <div className="multi-select-buttons">
              <button
                type="button"
                className={`multi-select-btn ${restaurantDeliveryMode === "none" ? "active" : ""}`}
                onClick={() => {
                  setRestaurantDeliveryMode("none");
                  setRestaurantDeliveryPrice("");
                }}
                aria-pressed={restaurantDeliveryMode === "none"}
              >
                Нет доставки
              </button>
              <button
                type="button"
                className={`multi-select-btn ${restaurantDeliveryMode === "free" ? "active" : ""}`}
                onClick={() => {
                  setRestaurantDeliveryMode("free");
                  setRestaurantDeliveryPrice("");
                }}
                aria-pressed={restaurantDeliveryMode === "free"}
              >
                Бесплатно
              </button>
              <button
                type="button"
                className={`multi-select-btn ${restaurantDeliveryMode === "paid" ? "active" : ""}`}
                onClick={() => setRestaurantDeliveryMode("paid")}
                aria-pressed={restaurantDeliveryMode === "paid"}
              >
                Указать цену
              </button>
            </div>
            <input type="hidden" name="deliveryMode" value={restaurantDeliveryMode} />
          </Field>
          {restaurantDeliveryMode === "paid" ? (
            <Field label="Стоимость доставки, ₽">
              <input
                required
                name="deliveryPrice"
                type="number"
                min={1}
                inputMode="numeric"
                pattern="[0-9]*"
                className="input"
                value={restaurantDeliveryPrice}
                onChange={(e) => setRestaurantDeliveryPrice(e.currentTarget.value)}
              />
            </Field>
          ) : null}
          <Field label="Логотип заведения (1 фото)">
            <div className="input-with-clear">
              <input
                type="file"
                name="logo"
                className={`input ${selectedPhotoCount > 0 ? "input-has-clear" : ""}`}
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
            submitLabel={isPreparingPhotos ? "Подготовка фото..." : isEdit ? "Сохранить изменения" : "Сохранить"}
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
            onError={(e) => applyImageFallback(e, "taxi")}
            style={{
              width: "100%",
              height: 150,
              objectFit: "cover",
              borderRadius: 12,
            }}
          />
          <p className="small" style={{ margin: 0, color: "var(--text)" }}>Укажите маршрут, время и контакты для пассажиров</p>
        </div>
        <h3 style={{ marginBottom: 8 }}>{isEdit ? "Редактирование предложения такси" : "Создание предложения такси"}</h3>
        <form className="list" onSubmit={(e) => onSubmit(e, "taxi")}>
          {isEdit && editMeta?.id ? <input type="hidden" name="editEntityId" value={editMeta.id} /> : null}
          {isEdit && editMeta?.kind ? <input type="hidden" name="editEntityKind" value={editMeta.kind} /> : null}
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
          <Field label="Имя/ник"><input required name="name" defaultValue={initialValues?.name || ""} className="input" minLength={2} maxLength={60} /></Field>
          <div className={isIntercitySelected ? "grid-2" : undefined}>
            <Field label="Стоимость"><input required name="price" defaultValue={initialValues?.price || ""} type="number" min={1} inputMode="numeric" pattern="[0-9]*" className="input" /></Field>
            {isIntercitySelected ? <Field label="Свободных мест"><input name="seats" defaultValue={initialValues?.seats?.free || initialValues?.seats?.total || ""} type="number" min={1} className="input" /></Field> : null}
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
              defaultValue={formatPhoneValue(initialValues?.contacts?.phone, { allowEmpty: true })}
              className="input"
              placeholder={PHONE_PLACEHOLDER}
              maxLength={18}
              pattern={PHONE_PATTERN}
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
              defaultValue={formatPhoneValue(initialValues?.contacts?.wa, { allowEmpty: true })}
              className="input"
              placeholder={PHONE_PLACEHOLDER}
              maxLength={18}
              pattern={PHONE_PATTERN}
              title="Введите номер в формате +7 (999) 999-99-99"
              onInput={(e) => handlePhoneInput(e, { allowEmpty: true })}
              onFocus={syncPhonePrev}
            />
          </Field>
          <Field label="Telegram"><input name="tg" defaultValue={initialValues?.contacts?.tg || ""} className="input" /></Field>
          <Field label="Описание"><textarea name="desc" defaultValue={initialValues?.desc || ""} className="textarea" maxLength={2000} /></Field>
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
            submitLabel={isPreparingPhotos ? "Подготовка фото..." : isEdit ? "Сохранить изменения" : "Сохранить"}
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
            onError={(e) => applyImageFallback(e, "services")}
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
      <h3 style={{ marginBottom: 8 }}>
        {type === "ad"
          ? (isEdit ? "Редактирование объявления" : "Создание объявления")
          : type === "service"
            ? (isEdit ? "Редактирование услуги" : "Создание услуги")
            : (isEdit ? "Редактирование блюда" : "Добавление блюда")}
      </h3>
      <form className="list" onSubmit={(e) => onSubmit(e, type)}>
        {isEdit && editMeta?.id ? <input type="hidden" name="editEntityId" value={editMeta.id} /> : null}
        {isEdit && editMeta?.kind ? <input type="hidden" name="editEntityKind" value={editMeta.kind} /> : null}
        <Field label="Название"><input required name="title" defaultValue={initialValues?.title || ""} className="input" minLength={3} maxLength={80} /></Field>
        <Field label="Категория"><select className="select" name="category" defaultValue={initialValues?.category || categories[0]}>{categories.map((x) => <option key={x}>{x}</option>)}</select></Field>
        <Field label="Цена, ₽"><input required name="price" defaultValue={initialValues?.price || ""} type="number" min={1} inputMode="numeric" pattern="[0-9]*" className="input" /></Field>
        <Field label="Описание"><textarea required name="desc" defaultValue={initialValues?.desc || ""} className="textarea" minLength={10} maxLength={2000} /></Field>
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
          submitLabel={isPreparingPhotos ? "Подготовка фото..." : isEdit ? "Сохранить изменения" : "Сохранить"}
        />
      </form>
    </>
  );
}
