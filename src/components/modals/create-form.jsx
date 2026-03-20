import { useEffect, useRef, useState } from "react";
import { applyImageFallback } from "../../utils/images";
import { formatPhoneValue, handlePhoneInput, PHONE_PATTERN, PHONE_PLACEHOLDER, syncPhonePrev, syncWhatsappFromPhone } from "../../utils/phone";
import { getTaxiDateByPreset, getTaxiPresetState, TAXI_DAY_PRESETS, TAXI_RECURRING_WEEKDAYS } from "../../utils/taxi";
import { TAXI_CITY_CATEGORY } from "../../utils/app-domain";
import { FormActions, Field } from "../ui";
import restaurantHero from "../../assets/restaurant-hero.svg";
import taxiHero from "../../assets/taxi-hero.svg";
import serviceHero from "../../assets/service-hero.svg";

const TITLE_MAX = 60;
const RESTAURANT_TITLE_MAX = 40;
const DESCRIPTION_MAX = 4000;

export function CreateForm({
  type,
  onSubmit,
  onClose,
  submitPending = false,
  taxiCategories,
  adsCategories = [],
  serviceCategories = [],
  foodCategories = [],
  mode = "create",
  initialValues = null,
  editMeta = null,
}) {
  const isEdit = mode === "edit";
  const initialCategory = initialValues?.category;
  const initialTaxiCategories = Array.isArray(initialValues?.categories)
    ? initialValues.categories
    : initialCategory
      ? [initialCategory]
      : [taxiCategories?.[0]].filter(Boolean);
  const initialTaxiMode = initialValues?.mode === "recurring" ? "recurring" : "one-time";
  const initialTaxiWhen = String(initialValues?.when || "");
  const initialTaxiPresetState = getTaxiPresetState(initialTaxiWhen);
  const initialTaxiDayPreset = initialTaxiPresetState.dayPreset;
  const initialTaxiHourPreset = initialTaxiPresetState.hourPreset;
  const initialRecurringHourPreset = (() => {
    const match = String(initialValues?.time || "").match(/(\d{1,2}):/);
    const parsed = Number(match?.[1]);
    if (!Number.isFinite(parsed)) return 8;
    return Math.max(4, Math.min(24, parsed));
  })();
  const [isPreparingPhotos, setIsPreparingPhotos] = useState(false);
  const [selectedPhotoCount, setSelectedPhotoCount] = useState(0);
  const [selectedPhotoFiles, setSelectedPhotoFiles] = useState([]);
  const [selectedPhotoPreviews, setSelectedPhotoPreviews] = useState([]);
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [removedExistingPhotos, setRemovedExistingPhotos] = useState([]);
  const [photosLimitError, setPhotosLimitError] = useState("");
  const [attemptedTaxiSubmit, setAttemptedTaxiSubmit] = useState(false);
  const [taxiFieldErrors, setTaxiFieldErrors] = useState({});
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
  const [dishIsAvailable, setDishIsAvailable] = useState(() => {
    if (type !== "dish") return true;
    return !initialValues?.unavailable;
  });
  const [isTimeDragging, setIsTimeDragging] = useState(false);
  const prepTimerRef = useRef(null);
  const imagesInputRef = useRef(null);
  const selectedPhotoPreviewsRef = useRef([]);
  const wasIntercityOneTimeCreateRef = useRef(false);
  const restaurantPhoneRef = useRef(null);
  const restaurantWhatsappRef = useRef(null);
  const taxiPhoneRef = useRef(null);
  const taxiWhatsappRef = useRef(null);
  const maxPhotos = type === "ad" || type === "service" ? 8 : 1;

  const collectInitialPhotos = () => {
    if (!isEdit) return [];
    if (type === "restaurant") {
      const logo = String(initialValues?.logo || "").trim();
      return logo ? [logo] : [];
    }
    const photos = Array.isArray(initialValues?.photos) ? initialValues.photos : [];
    return photos
      .map((photo) => String(photo || "").trim())
      .filter(Boolean)
      .slice(0, maxPhotos);
  };

  const buildPhotosLimitError = (newCount, keptExistingCount = existingPhotos.length) => {
    const total = Number(newCount || 0) + Number(keptExistingCount || 0);
    return total > maxPhotos ? `Можно загрузить не более ${maxPhotos} фото` : "";
  };

  const replaceSelectedPhotoPreviews = (nextPreviewUrls) => {
    setSelectedPhotoPreviews((prev) => {
      prev.forEach((url) => URL.revokeObjectURL(url));
      selectedPhotoPreviewsRef.current = nextPreviewUrls;
      return nextPreviewUrls;
    });
  };

  useEffect(() => {
    return () => {
      if (prepTimerRef.current) clearTimeout(prepTimerRef.current);
      selectedPhotoPreviewsRef.current.forEach((url) => URL.revokeObjectURL(url));
      selectedPhotoPreviewsRef.current = [];
    };
  }, []);

  useEffect(() => {
    const nextInitial = collectInitialPhotos();
    setExistingPhotos(nextInitial);
    setRemovedExistingPhotos([]);
  }, [isEdit, type, initialValues, maxPhotos]);

  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files || []);
    const count = files.length;
    setSelectedPhotoFiles(files);
    setSelectedPhotoCount(count);
    setPhotosLimitError(buildPhotosLimitError(count));
    replaceSelectedPhotoPreviews(files.map((file) => URL.createObjectURL(file)));
    if (count > 0) {
      setTaxiFieldErrors((prev) => {
        if (!prev.images) return prev;
        return { ...prev, images: "" };
      });
    }

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
    setSelectedPhotoFiles([]);
    setSelectedPhotoCount(0);
    replaceSelectedPhotoPreviews([]);
    setPhotosLimitError(buildPhotosLimitError(0));
  };

  const removeSelectedImage = (indexToRemove) => {
    if (indexToRemove < 0 || indexToRemove >= selectedPhotoFiles.length) return;
    const nextFiles = selectedPhotoFiles.filter((_, index) => index !== indexToRemove);
    const removedPreviewUrl = selectedPhotoPreviewsRef.current[indexToRemove];
    const nextPreviewUrls = selectedPhotoPreviewsRef.current.filter((_, index) => index !== indexToRemove);
    if (imagesInputRef.current) {
      if (!nextFiles.length) {
        imagesInputRef.current.value = "";
      } else {
        const dataTransfer = new DataTransfer();
        nextFiles.forEach((file) => dataTransfer.items.add(file));
        imagesInputRef.current.files = dataTransfer.files;
      }
    }
    if (prepTimerRef.current) clearTimeout(prepTimerRef.current);
    setIsPreparingPhotos(false);
    setSelectedPhotoFiles(nextFiles);
    setSelectedPhotoCount(nextFiles.length);
    setPhotosLimitError(buildPhotosLimitError(nextFiles.length));
    if (removedPreviewUrl) URL.revokeObjectURL(removedPreviewUrl);
    selectedPhotoPreviewsRef.current = nextPreviewUrls;
    setSelectedPhotoPreviews(nextPreviewUrls);
  };

  const removeExistingImage = (indexToRemove) => {
    if (indexToRemove < 0 || indexToRemove >= existingPhotos.length) return;
    const removedPhoto = existingPhotos[indexToRemove];
    const nextExisting = existingPhotos.filter((_, index) => index !== indexToRemove);
    setExistingPhotos(nextExisting);
    setRemovedExistingPhotos((prev) => {
      if (!removedPhoto || prev.includes(removedPhoto)) return prev;
      return [...prev, removedPhoto];
    });
    setPhotosLimitError(buildPhotosLimitError(selectedPhotoFiles.length, nextExisting.length));
  };

  const startTimeDrag = () => setIsTimeDragging(true);
  const endTimeDrag = () => setIsTimeDragging(false);

  const cityCategory = TAXI_CITY_CATEGORY;
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
  const isIntercityCreate = isIntercitySelected && !isEdit;
  const hasTaxiDirection = selectedTaxiCategories.length > 0;
  const formatTaxiHour = (hour) => `${hour % 24}`.padStart(2, "0") + ":00";
  const taxiTimePreset = formatTaxiHour(taxiHourPreset);
  const recurringTimePreset = formatTaxiHour(recurringHourPreset);
  const taxiDateValue = getTaxiDateByPreset(taxiDayPreset);
  const taxiWhenValue = taxiDayPreset && taxiDateValue
    ? `${taxiDayPreset} (${taxiDateValue})${taxiTimePreset ? ` ${taxiTimePreset}` : ""}`
    : "";
  const hasTaxiWhen = Boolean(String(taxiWhenValue || "").trim());
  const hasRecurringDays = recurringDays.length > 0;
  const showTaxiDirectionError = attemptedTaxiSubmit && !hasTaxiDirection;
  const showTaxiWhenError = attemptedTaxiSubmit && isIntercityCreate && !isRecurring && !hasTaxiWhen;
  const showTaxiRecurringDaysError = attemptedTaxiSubmit && isIntercityCreate && isRecurring && !hasRecurringDays;
  const toggleRecurringDay = (day) => {
    setRecurringDays((prev) => (
      prev.includes(day) ? prev.filter((x) => x !== day) : [...prev, day]
    ));
  };

  useEffect(() => {
    if (!isIntercitySelected && taxiOfferMode !== "one-time") setTaxiOfferMode("one-time");
  }, [isIntercitySelected, taxiOfferMode]);

  const isIntercityOneTimeCreate = isIntercityCreate && !isRecurring;
  useEffect(() => {
    if (isIntercityOneTimeCreate && !wasIntercityOneTimeCreateRef.current && !taxiDayPreset) {
      setTaxiDayPreset("Сегодня");
    }
    wasIntercityOneTimeCreateRef.current = isIntercityOneTimeCreate;
  }, [isIntercityOneTimeCreate, taxiDayPreset]);

  useEffect(() => {
    syncWhatsappFromPhone(restaurantPhoneRef.current, restaurantWhatsappRef.current);
    syncWhatsappFromPhone(taxiPhoneRef.current, taxiWhatsappRef.current);
  }, []);

  const handleTaxiSubmit = (e) => {
    setAttemptedTaxiSubmit(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const nextFieldErrors = {};

    if (!String(formData.get("name") || "").trim()) nextFieldErrors.name = "Укажите имя водителя";
    if (!String(formData.get("price") || "").trim()) nextFieldErrors.price = "Укажите стоимость поездки";
    if (isIntercityCreate && !String(formData.get("seats") || "").trim()) nextFieldErrors.seats = "Укажите количество мест";
    if (!String(formData.get("phone") || "").trim()) nextFieldErrors.phone = "Укажите номер телефона для связи";
    if (isIntercityCreate && !String(formData.get("wa") || "").trim()) nextFieldErrors.wa = "Укажите WhatsApp для связи";

    setTaxiFieldErrors(nextFieldErrors);
    const nativeValid = form.reportValidity();
    const hasRequiredTaxiWhen = !isIntercityCreate || isRecurring || hasTaxiWhen;
    const hasRequiredRecurringDays = !isIntercityCreate || !isRecurring || hasRecurringDays;
    const hasMissingTaxiFields = Object.values(nextFieldErrors).some(Boolean);
    if (!nativeValid || hasMissingTaxiFields || !hasTaxiDirection || !hasRequiredTaxiWhen || !hasRequiredRecurringDays || Boolean(photosLimitError)) {
      e.preventDefault();
      return;
    }
    onSubmit(e, "taxi");
  };

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
          {existingPhotos.map((photo, index) => <input key={`existing-restaurant-${photo}-${index}`} type="hidden" name="existingPhotos" value={photo} />)}
          {removedExistingPhotos.map((photo, index) => <input key={`removed-restaurant-${photo}-${index}`} type="hidden" name="removedPhotos" value={photo} />)}
          <Field label="Название"><input required name="title" defaultValue={initialValues?.title || ""} className="input" minLength={2} maxLength={RESTAURANT_TITLE_MAX} onInput={(e) => {
            if (e.currentTarget.value.length > RESTAURANT_TITLE_MAX) {
              e.currentTarget.value = e.currentTarget.value.slice(0, RESTAURANT_TITLE_MAX);
            }
          }} /></Field>
          <Field label="Описание"><textarea required name="desc" defaultValue={initialValues?.desc || ""} className="textarea" maxLength={DESCRIPTION_MAX} /></Field>
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
                ref={restaurantPhoneRef}
                onInput={(e) => {
                  handlePhoneInput(e, { allowEmpty: true });
                  syncWhatsappFromPhone(e.currentTarget, restaurantWhatsappRef.current);
                }}
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
              ref={restaurantWhatsappRef}
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
            {isPreparingPhotos && selectedPhotoCount > 0 ? (
              <div className="upload-status" aria-live="polite">
                <span className="loader-spinner" aria-hidden="true" />
                Подготавливаем {selectedPhotoCount} фото...
              </div>
            ) : null}
            {existingPhotos.length > 0 ? (
              <div className="upload-preview-grid" aria-live="polite">
                {existingPhotos.map((photoUrl, index) => (
                  <div key={`existing-restaurant-preview-${photoUrl}-${index}`} className="upload-preview-item">
                    <img className="upload-preview-thumb" src={photoUrl} alt={`Текущее фото ${index + 1}`} onError={(e) => applyImageFallback(e, "food")} />
                    <button
                      type="button"
                      className="upload-preview-remove-btn"
                      onClick={() => removeExistingImage(index)}
                      aria-label={`Убрать текущее фото ${index + 1}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
            {selectedPhotoPreviews.length > 0 && !isPreparingPhotos ? (
              <div className="upload-preview-grid" aria-live="polite">
                {selectedPhotoPreviews.map((photoUrl, index) => (
                  <div key={photoUrl} className="upload-preview-item">
                    <img className="upload-preview-thumb" src={photoUrl} alt={`Предпросмотр фото ${index + 1}`} />
                    <button
                      type="button"
                      className="upload-preview-remove-btn"
                      onClick={() => removeSelectedImage(index)}
                      aria-label={`Удалить фото ${index + 1}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
            {photosLimitError ? <p className="small" style={{ color: "var(--danger)" }}>{photosLimitError}</p> : null}
          </Field>
          <FormActions
            onClose={onClose}
            submitting={submitPending}
            submitDisabled={submitPending || isPreparingPhotos || Boolean(photosLimitError)}
            submitLabel={submitPending ? "Сохранение..." : isPreparingPhotos ? "Подготовка фото..." : isEdit ? "Сохранить изменения" : "Сохранить"}
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
        <form className={`list ${attemptedTaxiSubmit ? "form-attempted" : ""}`} onSubmit={handleTaxiSubmit}>
          {isEdit && editMeta?.id ? <input type="hidden" name="editEntityId" value={editMeta.id} /> : null}
          {isEdit && editMeta?.kind ? <input type="hidden" name="editEntityKind" value={editMeta.kind} /> : null}
          {existingPhotos.map((photo, index) => <input key={`existing-taxi-${photo}-${index}`} type="hidden" name="existingPhotos" value={photo} />)}
          {removedExistingPhotos.map((photo, index) => <input key={`removed-taxi-${photo}-${index}`} type="hidden" name="removedPhotos" value={photo} />)}
          <Field label="Направления">
            <div className={`multi-select-buttons ${showTaxiDirectionError ? "is-invalid" : ""}`}>
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
            {showTaxiDirectionError ? <p className="small field-invalid-note">Выберите хотя бы одно направление</p> : null}
          </Field>
          <div className={isIntercitySelected ? "grid-2" : undefined}>
            <Field label="Стоимость">
              <input
                required
                name="price"
                defaultValue={initialValues?.price || ""}
                type="number"
                min={1}
                inputMode="numeric"
                pattern="[0-9]*"
                className={`input ${taxiFieldErrors.price ? "is-invalid" : ""}`}
                onInput={() => setTaxiFieldErrors((prev) => ({ ...prev, price: "" }))}
              />
              {taxiFieldErrors.price ? <p className="small field-invalid-note">{taxiFieldErrors.price}</p> : null}
            </Field>
            {isIntercitySelected ? (
              <Field label={isIntercityCreate ? "Всего мест" : "Свободных мест"}>
                <input
                  required={isIntercityCreate}
                  name="seats"
                  defaultValue={initialValues?.seats?.free || initialValues?.seats?.total || ""}
                  type="number"
                  min={1}
                  className={`input ${taxiFieldErrors.seats ? "is-invalid" : ""}`}
                  onInput={() => setTaxiFieldErrors((prev) => ({ ...prev, seats: "" }))}
                />
                {taxiFieldErrors.seats ? <p className="small field-invalid-note">{taxiFieldErrors.seats}</p> : null}
              </Field>
            ) : null}
          </div>
          <Field label="Модель машины">
            <input
              name="vehicle"
              defaultValue={initialValues?.vehicle || initialValues?.carModel || ""}
              className="input"
              maxLength={80}
              placeholder="Например, Toyota Camry"
            />
          </Field>
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
                  <div className={`multi-select-buttons ${showTaxiRecurringDaysError ? "is-invalid" : ""}`}>
                    {TAXI_RECURRING_WEEKDAYS.map((x) => (
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
                  {showTaxiRecurringDaysError ? <p className="small field-invalid-note">Выберите хотя бы один день</p> : null}
                </Field>
              ) : (
                <Field label={taxiDateValue ? `Дата и время (${taxiDateValue} ${taxiTimePreset})` : "Дата и время"}>
                  <p className="small" style={{ marginTop: 0, marginBottom: 8 }}>Указывайте время по Москве (UTC+3).</p>
                  <div className={`multi-select-buttons ${showTaxiWhenError ? "is-invalid" : ""}`}>
                    {TAXI_DAY_PRESETS.map((x) => (
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
                  {showTaxiWhenError ? <p className="small field-invalid-note">Выберите дату выезда</p> : null}
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
              className={`input ${taxiFieldErrors.phone ? "is-invalid" : ""}`}
              placeholder={PHONE_PLACEHOLDER}
              maxLength={18}
              pattern={PHONE_PATTERN}
              title="Введите номер в формате +7 (999) 999-99-99"
              ref={taxiPhoneRef}
              onInput={(e) => {
                handlePhoneInput(e, { allowEmpty: true });
                syncWhatsappFromPhone(e.currentTarget, taxiWhatsappRef.current);
                setTaxiFieldErrors((prev) => ({ ...prev, phone: "" }));
              }}
              onFocus={syncPhonePrev}
            />
            {taxiFieldErrors.phone ? <p className="small field-invalid-note">{taxiFieldErrors.phone}</p> : null}
          </Field>
          <Field label="WhatsApp">
            <input
              required={isIntercityCreate}
              name="wa"
              type="tel"
              inputMode="tel"
              defaultValue={formatPhoneValue(initialValues?.contacts?.wa, { allowEmpty: true })}
              className={`input ${taxiFieldErrors.wa ? "is-invalid" : ""}`}
              placeholder={PHONE_PLACEHOLDER}
              maxLength={18}
              pattern={PHONE_PATTERN}
              title="Введите номер в формате +7 (999) 999-99-99"
              ref={taxiWhatsappRef}
              onInput={(e) => {
                handlePhoneInput(e, { allowEmpty: true });
                setTaxiFieldErrors((prev) => ({ ...prev, wa: "" }));
              }}
              onFocus={syncPhonePrev}
            />
            {taxiFieldErrors.wa ? <p className="small field-invalid-note">{taxiFieldErrors.wa}</p> : null}
          </Field>
          <Field label="Telegram"><input name="tg" defaultValue={initialValues?.contacts?.tg || ""} className="input" /></Field>
          <Field label="Описание">
            <textarea
              name="desc"
              defaultValue={initialValues?.desc || ""}
              className={`textarea ${taxiFieldErrors.desc ? "is-invalid" : ""}`}
              maxLength={DESCRIPTION_MAX}
              onInput={() => setTaxiFieldErrors((prev) => ({ ...prev, desc: "" }))}
            />
            {taxiFieldErrors.desc ? <p className="small field-invalid-note">{taxiFieldErrors.desc}</p> : null}
          </Field>
          <Field label="Фото авто или водителя (1 фото)">
            <div className="input-with-clear">
              <input
                type="file"
                name="images"
                className={`input ${selectedPhotoCount > 0 ? "input-has-clear" : ""} ${taxiFieldErrors.images ? "is-invalid" : ""}`}
                multiple={maxPhotos > 1}
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
            {isPreparingPhotos && selectedPhotoCount > 0 ? (
              <div className="upload-status" aria-live="polite">
                <span className="loader-spinner" aria-hidden="true" />
                Подготавливаем {selectedPhotoCount} фото...
              </div>
            ) : null}
            {existingPhotos.length > 0 ? (
              <div className="upload-preview-grid" aria-live="polite">
                {existingPhotos.map((photoUrl, index) => (
                  <div key={`existing-taxi-preview-${photoUrl}-${index}`} className="upload-preview-item">
                    <img className="upload-preview-thumb" src={photoUrl} alt={`Текущее фото ${index + 1}`} onError={(e) => applyImageFallback(e, "taxi")} />
                    <button
                      type="button"
                      className="upload-preview-remove-btn"
                      onClick={() => removeExistingImage(index)}
                      aria-label={`Убрать текущее фото ${index + 1}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
            {selectedPhotoPreviews.length > 0 && !isPreparingPhotos ? (
              <div className="upload-preview-grid" aria-live="polite">
                {selectedPhotoPreviews.map((photoUrl, index) => (
                  <div key={photoUrl} className="upload-preview-item">
                    <img className="upload-preview-thumb" src={photoUrl} alt={`Предпросмотр фото ${index + 1}`} />
                    <button
                      type="button"
                      className="upload-preview-remove-btn"
                      onClick={() => removeSelectedImage(index)}
                      aria-label={`Удалить фото ${index + 1}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
            {photosLimitError ? <p className="small" style={{ color: "var(--danger)" }}>{photosLimitError}</p> : null}
            {taxiFieldErrors.images ? <p className="small field-invalid-note">{taxiFieldErrors.images}</p> : null}
          </Field>
          <FormActions
            onClose={onClose}
            submitting={submitPending}
            submitDisabled={
              submitPending
              || isPreparingPhotos
              || Boolean(photosLimitError)
            }
            submitLabel={submitPending ? "Сохранение..." : isPreparingPhotos ? "Подготовка фото..." : isEdit ? "Сохранить изменения" : "Сохранить"}
          />
        </form>
      </>
    );
  }

  const categories = type === "ad"
    ? adsCategories.filter((x) => x !== "Мои объявления")
    : type === "service"
      ? serviceCategories
      : foodCategories;
  const safeCategories = categories.length ? categories : ["Другое"];

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
        {existingPhotos.map((photo, index) => <input key={`existing-${type}-${photo}-${index}`} type="hidden" name="existingPhotos" value={photo} />)}
        {removedExistingPhotos.map((photo, index) => <input key={`removed-${type}-${photo}-${index}`} type="hidden" name="removedPhotos" value={photo} />)}
        <Field label="Название"><input required name="title" defaultValue={initialValues?.title || ""} className="input" minLength={3} maxLength={TITLE_MAX} /></Field>
        <Field label="Категория"><select className="select" name="category" defaultValue={initialValues?.category || safeCategories[0]}>{safeCategories.map((x) => <option key={x}>{x}</option>)}</select></Field>
        <Field label="Цена, ₽"><input required name="price" defaultValue={initialValues?.price || ""} type="number" min={1} inputMode="numeric" pattern="[0-9]*" className="input" /></Field>
        <Field label="Описание"><textarea required name="desc" defaultValue={initialValues?.desc || ""} className="textarea" minLength={10} maxLength={DESCRIPTION_MAX} /></Field>
        {type === "dish" ? (
          <Field label="Наличие">
            <div className="multi-select-buttons">
              <button
                type="button"
                className={`multi-select-btn ${dishIsAvailable ? "active" : ""}`}
                onClick={() => setDishIsAvailable(true)}
                aria-pressed={dishIsAvailable}
              >
                В наличии
              </button>
              <button
                type="button"
                className={`multi-select-btn ${!dishIsAvailable ? "active" : ""}`}
                onClick={() => setDishIsAvailable(false)}
                aria-pressed={!dishIsAvailable}
              >
                Нет в наличии
              </button>
            </div>
            <input type="hidden" name="isAvailable" value={dishIsAvailable ? "true" : "false"} />
          </Field>
        ) : null}
        <Field label={`Фото (до ${maxPhotos})`}>
          <div className="input-with-clear">
            <input
              type="file"
              name="images"
              className={`input ${selectedPhotoCount > 0 ? "input-has-clear" : ""}`}
              multiple={maxPhotos > 1}
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
          {isPreparingPhotos && selectedPhotoCount > 0 ? (
            <div className="upload-status" aria-live="polite">
              <span className="loader-spinner" aria-hidden="true" />
              Подготавливаем {selectedPhotoCount} фото...
            </div>
          ) : null}
          {existingPhotos.length > 0 ? (
            <div className="upload-preview-grid" aria-live="polite">
              {existingPhotos.map((photoUrl, index) => (
                <div key={`existing-generic-preview-${photoUrl}-${index}`} className="upload-preview-item">
                  <img className="upload-preview-thumb" src={photoUrl} alt={`Текущее фото ${index + 1}`} onError={(e) => applyImageFallback(e, type === "ad" ? "ads" : type === "service" ? "services" : "food")} />
                  <button
                    type="button"
                    className="upload-preview-remove-btn"
                    onClick={() => removeExistingImage(index)}
                    aria-label={`Убрать текущее фото ${index + 1}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : null}
          {selectedPhotoPreviews.length > 0 && !isPreparingPhotos ? (
            <div className="upload-preview-grid" aria-live="polite">
              {selectedPhotoPreviews.map((photoUrl, index) => (
                <div key={photoUrl} className="upload-preview-item">
                  <img className="upload-preview-thumb" src={photoUrl} alt={`Предпросмотр фото ${index + 1}`} />
                  <button
                    type="button"
                    className="upload-preview-remove-btn"
                    onClick={() => removeSelectedImage(index)}
                    aria-label={`Удалить фото ${index + 1}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </Field>
        {photosLimitError ? <p className="small" style={{ color: "var(--danger)" }}>{photosLimitError}</p> : null}
        <FormActions
          onClose={onClose}
          submitting={submitPending}
          submitDisabled={submitPending || isPreparingPhotos || Boolean(photosLimitError)}
          submitLabel={submitPending ? "Сохранение..." : isPreparingPhotos ? "Подготовка фото..." : isEdit ? "Сохранить изменения" : "Сохранить"}
        />
      </form>
    </>
  );
}
