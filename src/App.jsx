import { useEffect, useMemo, useState } from "react";
import { mock } from "./data/mock";
import { CreateForm, DetailModalContent, ProfileEditForm } from "./components/modals";
import { Icon, Modal } from "./components/ui";
import { AdsTab, FoodTab, ProfileTab, ServicesTab, TaxiTab } from "./sections/tabs";
import { tabConfig } from "./utils/constants";
import { sortItems } from "./utils/helpers";

const WEEKDAY_TO_INDEX = { Вс: 0, Пн: 1, Вт: 2, Ср: 3, Чт: 4, Пт: 5, Сб: 6 };
const INDEX_TO_WEEKDAY = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const FEEDBACK_SEED = {
  t1: [
    { id: "r-t1-1", author: "Ацамаз", rating: 5, text: "Доехали быстро, водитель вежливый.", createdAt: "2026-02-01T10:20:00.000Z" },
    { id: "r-t1-2", author: "Лана", rating: 4, text: "Аккуратно вёл, всё по времени.", createdAt: "2026-02-04T16:05:00.000Z" },
    { id: "r-t1-3", author: "Ирина", rating: 5, text: "Чистый салон, приятно ехать.", createdAt: "2026-02-05T11:10:00.000Z" },
    { id: "r-t1-4", author: "Тамерлан", rating: 5, text: "Приехал за 5 минут, супер.", createdAt: "2026-02-06T08:12:00.000Z" },
    { id: "r-t1-5", author: "Сабина", rating: 4, text: "Хорошо, но немного громкая музыка.", createdAt: "2026-02-06T15:32:00.000Z" },
    { id: "r-t1-6", author: "Роберт", rating: 5, text: "Помог с багажом, спасибо.", createdAt: "2026-02-07T09:28:00.000Z" },
    { id: "r-t1-7", author: "Алина", rating: 4, text: "Довез без задержек.", createdAt: "2026-02-08T18:41:00.000Z" },
    { id: "r-t1-8", author: "Зарина", rating: 5, text: "Очень аккуратная езда.", createdAt: "2026-02-09T07:17:00.000Z" },
    { id: "r-t1-9", author: "Артур", rating: 5, text: "Всегда на связи, рекомендую.", createdAt: "2026-02-10T12:56:00.000Z" },
    { id: "r-t1-10", author: "Белла", rating: 4, text: "Комфортно, вежливый водитель.", createdAt: "2026-02-11T20:13:00.000Z" },
    { id: "r-t1-11", author: "Вадим", rating: 5, text: "Маршрут выбрали оптимальный.", createdAt: "2026-02-12T06:09:00.000Z" },
    { id: "r-t1-12", author: "Элина", rating: 5, text: "Идеально, буду обращаться ещё.", createdAt: "2026-02-13T14:38:00.000Z" },
  ],
  t2: [
    { id: "r-t2-1", author: "Марина", rating: 4, text: "Доехали быстро, всё ок.", createdAt: "2026-02-03T09:44:00.000Z" },
    { id: "r-t2-2", author: "Григорий", rating: 5, text: "Очень пунктуальный водитель.", createdAt: "2026-02-04T12:20:00.000Z" },
    { id: "r-t2-3", author: "Леон", rating: 5, text: "Приятный разговор и мягкая езда.", createdAt: "2026-02-06T17:02:00.000Z" },
    { id: "r-t2-4", author: "Лиана", rating: 4, text: "Все понравилось, спасибо.", createdAt: "2026-02-08T08:18:00.000Z" },
    { id: "r-t2-5", author: "Русудана", rating: 5, text: "Приехал ровно ко времени.", createdAt: "2026-02-09T13:50:00.000Z" },
    { id: "r-t2-6", author: "Инга", rating: 4, text: "Хороший сервис.", createdAt: "2026-02-10T15:31:00.000Z" },
    { id: "r-t2-7", author: "Арсен", rating: 5, text: "Ребёнку поставили кресло, всё как просили.", createdAt: "2026-02-12T10:12:00.000Z" },
    { id: "r-t2-8", author: "Нелли", rating: 4, text: "Комфортная машина.", createdAt: "2026-02-14T19:21:00.000Z" },
  ],
  t4: [
    { id: "r-t4-1", author: "Сергей", rating: 5, text: "Поездка межгород прошла отлично.", createdAt: "2026-02-02T05:45:00.000Z" },
    { id: "r-t4-2", author: "Диана", rating: 4, text: "Нормально, приехали вовремя.", createdAt: "2026-02-05T11:27:00.000Z" },
    { id: "r-t4-3", author: "Алана", rating: 5, text: "Водитель помог на КПП.", createdAt: "2026-02-08T14:09:00.000Z" },
    { id: "r-t4-4", author: "Виктор", rating: 5, text: "Комфортно и без лишних остановок.", createdAt: "2026-02-11T07:22:00.000Z" },
    { id: "r-t4-5", author: "Майя", rating: 4, text: "Все хорошо, рекомендую.", createdAt: "2026-02-15T16:35:00.000Z" },
  ],
  s1: [
    { id: "r-s1-1", author: "Диана", rating: 5, text: "Очень вкусный торт и аккуратная подача.", createdAt: "2026-02-03T08:40:00.000Z" },
    { id: "r-s1-2", author: "Лейла", rating: 5, text: "Сделали в срок, начинка отличная.", createdAt: "2026-02-04T10:12:00.000Z" },
    { id: "r-s1-3", author: "Олег", rating: 4, text: "Вкусно, но хотелось меньше крема.", createdAt: "2026-02-05T19:03:00.000Z" },
    { id: "r-s1-4", author: "Зема", rating: 5, text: "Дизайн торта как на фото.", createdAt: "2026-02-06T13:42:00.000Z" },
    { id: "r-s1-5", author: "Кристина", rating: 5, text: "Гостям очень понравилось.", createdAt: "2026-02-07T17:58:00.000Z" },
    { id: "r-s1-6", author: "Амир", rating: 4, text: "Хороший вкус и быстрая доставка.", createdAt: "2026-02-09T12:30:00.000Z" },
    { id: "r-s1-7", author: "София", rating: 5, text: "Уже второй заказ, всё стабильно.", createdAt: "2026-02-10T09:16:00.000Z" },
    { id: "r-s1-8", author: "Виктория", rating: 5, text: "Красиво и очень вкусно.", createdAt: "2026-02-11T14:54:00.000Z" },
    { id: "r-s1-9", author: "Тимур", rating: 4, text: "Качество хорошее, цена адекватная.", createdAt: "2026-02-12T18:21:00.000Z" },
    { id: "r-s1-10", author: "Оксана", rating: 5, text: "Лучший торт из тех, что пробовали.", createdAt: "2026-02-14T11:05:00.000Z" },
    { id: "r-s1-11", author: "Мадина", rating: 5, text: "Спасибо за срочный заказ.", createdAt: "2026-02-15T08:44:00.000Z" },
    { id: "r-s1-12", author: "Роман", rating: 4, text: "Все понравилось, будем заказывать ещё.", createdAt: "2026-02-16T20:10:00.000Z" },
  ],
  s3: [
    { id: "r-s3-1", author: "Эмма", rating: 5, text: "Аккуратно и стерильно.", createdAt: "2026-02-04T09:20:00.000Z" },
    { id: "r-s3-2", author: "Ася", rating: 5, text: "Дизайн получился как хотела.", createdAt: "2026-02-06T12:48:00.000Z" },
    { id: "r-s3-3", author: "Инна", rating: 4, text: "Хорошо держится покрытие.", createdAt: "2026-02-08T16:26:00.000Z" },
    { id: "r-s3-4", author: "Юлия", rating: 5, text: "Очень аккуратная работа.", createdAt: "2026-02-10T10:33:00.000Z" },
    { id: "r-s3-5", author: "Нина", rating: 4, text: "Всё понравилось, приду снова.", createdAt: "2026-02-12T15:57:00.000Z" },
    { id: "r-s3-6", author: "Камила", rating: 5, text: "Лучший маникюр за последнее время.", createdAt: "2026-02-14T18:11:00.000Z" },
    { id: "r-s3-7", author: "Света", rating: 5, text: "Быстро и красиво.", createdAt: "2026-02-16T09:05:00.000Z" },
  ],
  s5: [
    { id: "r-s5-1", author: "Игорь", rating: 4, text: "Пироги горячие, доставка быстрая.", createdAt: "2026-02-05T12:00:00.000Z" },
    { id: "r-s5-2", author: "Люба", rating: 5, text: "Очень вкусно, тесто отличное.", createdAt: "2026-02-07T13:14:00.000Z" },
    { id: "r-s5-3", author: "Павел", rating: 4, text: "Хороший сервис и вкус.", createdAt: "2026-02-09T19:46:00.000Z" },
    { id: "r-s5-4", author: "Эльвира", rating: 5, text: "Всей семье понравилось.", createdAt: "2026-02-11T11:39:00.000Z" },
    { id: "r-s5-5", author: "Раиса", rating: 5, text: "Будем заказывать ещё.", createdAt: "2026-02-13T20:27:00.000Z" },
    { id: "r-s5-6", author: "Георг", rating: 4, text: "Стабильное качество.", createdAt: "2026-02-15T17:59:00.000Z" },
  ],
};

const toArray = (value) => (Array.isArray(value) ? value : value ? [value] : []);
const dayStart = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const formatDateRu = (date) => new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
const buildUserPhoto = (name, idx) => `https://picsum.photos/seed/${encodeURIComponent(`user-taxi-${name}-${idx}`)}/900/600`;
const randomSuffix = () => Math.random().toString(36).slice(2, 8);
const normalizeRating = (value) => Math.max(1, Math.min(5, Number(value) || 1));
const buildInitialFeedback = () => {
  const source = [...mock.services, ...mock.taxi];
  return source.reduce((acc, item) => {
    acc[item.id] = Array.isArray(FEEDBACK_SEED[item.id]) ? [...FEEDBACK_SEED[item.id]] : [];
    return acc;
  }, {});
};
const getFeedbackRating = (reviews) => {
  if (!Array.isArray(reviews) || !reviews.length) return null;
  const sum = reviews.reduce((acc, review) => acc + (Number(review.rating) || 0), 0);
  return Number((sum / reviews.length).toFixed(1));
};
const normalizeWeekdays = (value) => {
  const source = Array.isArray(value) ? value : String(value || "").split(",");
  return source.map((x) => String(x).trim()).filter((x) => x in WEEKDAY_TO_INDEX);
};
const nextWeekdayDate = (targetWeekday, now) => {
  const date = dayStart(now);
  const diff = (targetWeekday - now.getDay() + 7) % 7;
  date.setDate(date.getDate() + diff);
  return date;
};
const parseTaxiWhenValue = (whenValue) => {
  const text = String(whenValue || "").trim();
  if (!text) return null;

  const timeMatch = text.match(/(\d{1,2}):(\d{2})/);
  if (!timeMatch) return null;
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;

  const now = new Date();
  let datePart = dayStart(now);

  const dateInBrackets = text.match(/\((\d{2})\.(\d{2})\.(\d{4})\)/);
  if (dateInBrackets) {
    const day = Number(dateInBrackets[1]);
    const month = Number(dateInBrackets[2]) - 1;
    const year = Number(dateInBrackets[3]);
    datePart = new Date(year, month, day);
  } else if (text.startsWith("Сегодня")) {
    datePart = dayStart(now);
  } else if (text.startsWith("Завтра")) {
    datePart = dayStart(now);
    datePart.setDate(datePart.getDate() + 1);
  } else {
    const weekdayMatch = text.match(/^(Вс|Пн|Вт|Ср|Чт|Пт|Сб)\b/);
    if (weekdayMatch) {
      datePart = nextWeekdayDate(WEEKDAY_TO_INDEX[weekdayMatch[1]], now);
    }
  }

  datePart.setHours(hour, minute, 0, 0);
  return datePart;
};

function buildRecurringTaxiOccurrences(templates, horizonDays = 14) {
  const today = dayStart(new Date());
  const result = [];

  for (const template of templates) {
    if (template.status === "paused") continue;
    const weekdays = Array.isArray(template.weekdays) ? template.weekdays : [];
    for (let offset = 0; offset <= horizonDays; offset += 1) {
      const date = new Date(today);
      date.setDate(today.getDate() + offset);
      const weekday = INDEX_TO_WEEKDAY[date.getDay()];
      if (!weekdays.includes(weekday)) continue;

      result.push({
        ...template,
        id: `${template.id}-${date.toISOString().slice(0, 10)}`,
        when: `${weekday} (${formatDateRu(date)}) ${template.time}`,
        date: offset,
      });
    }
  }

  return result;
}

export default function App() {
  const [tab, setTab] = useState("ads");
  const [isAuth, setIsAuth] = useState(false);
  const [profile, setProfile] = useState({
    name: "Гость",
    phone: "-",
    telegram: "-",
    whatsapp: "-",
    about: "Авторизуйтесь, чтобы управлять профилем.",
  });
  const [hasRestaurant, setHasRestaurant] = useState(false);
  const [favorites, setFavorites] = useState(new Set());
  const [adsCategory, setAdsCategory] = useState("Все");
  const [serviceCategory, setServiceCategory] = useState("Все");
  const [foodCategory, setFoodCategory] = useState("Все");
  const [taxiCategory, setTaxiCategory] = useState("Такси по Цхинвалу");
  const [adsSort, setAdsSort] = useState("date");
  const [servicesSort, setServicesSort] = useState("date");
  const [foodSort, setFoodSort] = useState("price");
  const [taxiSort, setTaxiSort] = useState("rating");
  const [taxiRequestedAt, setTaxiRequestedAt] = useState("");
  const [customTaxiItems, setCustomTaxiItems] = useState([]);
  const [taxiTemplates, setTaxiTemplates] = useState([]);
  const [feedbackByItem, setFeedbackByItem] = useState(() => buildInitialFeedback());
  const [isTaxiDriver, setIsTaxiDriver] = useState(false);
  const [modal, setModal] = useState(null);

  const adsCategoriesVisible = isAuth ? mock.adsCategories : mock.adsCategories.filter((x) => x !== "Мои объявления");

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;
    tg.ready();
    tg.expand();
  }, []);

  useEffect(() => {
    let lastTouchEnd = 0;

    const preventGesture = (e) => {
      if (e.target?.closest?.(".viewer-content")) return;
      e.preventDefault();
    };

    const preventMultiTouchZoom = (e) => {
      if (e.target?.closest?.(".viewer-content")) return;
      if (e.touches && e.touches.length > 1) e.preventDefault();
    };

    const preventDoubleTapZoom = (e) => {
      if (e.target?.closest?.(".viewer-content")) return;
      const now = Date.now();
      if (now - lastTouchEnd <= 300) e.preventDefault();
      lastTouchEnd = now;
    };

    document.addEventListener("gesturestart", preventGesture, { passive: false });
    document.addEventListener("gesturechange", preventGesture, { passive: false });
    document.addEventListener("touchmove", preventMultiTouchZoom, { passive: false });
    document.addEventListener("touchend", preventDoubleTapZoom, { passive: false });

    return () => {
      document.removeEventListener("gesturestart", preventGesture);
      document.removeEventListener("gesturechange", preventGesture);
      document.removeEventListener("touchmove", preventMultiTouchZoom);
      document.removeEventListener("touchend", preventDoubleTapZoom);
    };
  }, []);

  const toggleAuth = () => {
    if (isAuth) {
      setIsAuth(false);
      setProfile({ name: "Гость", phone: "-", telegram: "-", whatsapp: "-", about: "Авторизуйтесь, чтобы управлять профилем." });
      setHasRestaurant(false);
      setIsTaxiDriver(false);
      return;
    }

    setIsAuth(true);
    setProfile({
      name: "Мурад",
      phone: "+7(929)000-00-00",
      telegram: "@murat_ircom",
      whatsapp: "+7(929)000-00-00",
      about: "Продаю технику и размещаю междугородние поездки.",
    });
  };

  const ensureAuth = (fn, options = {}) => {
    if (isAuth) return fn();
    const returnTo = options.returnTo || null;
    setModal({ type: "auth", payload: returnTo ? { returnTo, fromDetail: Boolean(options.fromDetail) } : {} });
  };

  const toggleFavorite = (id) => {
    ensureAuth(() => {
      setFavorites((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    });
  };

  const adsItems = useMemo(() => {
    const category = adsCategoriesVisible.includes(adsCategory) ? adsCategory : "Все";
    const filtered = mock.ads.filter(
      (x) => category === "Все" || x.category === category || (category === "Мои объявления" && x.owner === "murat")
    );
    return sortItems(filtered, adsSort, favorites);
  }, [adsCategoriesVisible, adsCategory, adsSort, favorites]);

  const decorateWithFeedback = (item) => {
    const reviews = Array.isArray(feedbackByItem[item.id]) ? feedbackByItem[item.id] : [];
    const reviewsCount = reviews.length;
    const reviewsRating = getFeedbackRating(reviews);
    const baseRating = typeof item.rating === "number" ? Number(item.rating.toFixed(1)) : null;
    const ratingValue = reviewsRating ?? baseRating;

    return {
      ...item,
      rating: ratingValue ?? 0,
      ratingValue,
      reviewsCount,
      reviews,
    };
  };

  const servicesCatalog = useMemo(() => mock.services.map((item) => decorateWithFeedback(item)), [feedbackByItem]);

  const servicesItems = useMemo(
    () => sortItems(servicesCatalog.filter((x) => serviceCategory === "Все" || x.category === serviceCategory), servicesSort, favorites),
    [serviceCategory, servicesSort, favorites, servicesCatalog]
  );

  const foodItems = useMemo(
    () => sortItems(mock.food.filter((x) => foodCategory === "Все" || x.category === foodCategory), foodSort, favorites),
    [foodCategory, foodSort, favorites]
  );

  const recurringTaxiItems = useMemo(() => buildRecurringTaxiOccurrences(taxiTemplates, 14), [taxiTemplates]);
  const allTaxiItems = useMemo(() => [...customTaxiItems, ...recurringTaxiItems, ...mock.taxi], [customTaxiItems, recurringTaxiItems]);
  const taxiCatalog = useMemo(() => allTaxiItems.map((item) => decorateWithFeedback(item)), [allTaxiItems, feedbackByItem]);
  const taxiRequestTime = useMemo(() => {
    if (!taxiRequestedAt) return null;
    const parsed = new Date(taxiRequestedAt);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [taxiRequestedAt]);
  const taxiItems = useMemo(
    () => {
      const byCategory = taxiCatalog.filter((x) => x.category === taxiCategory);
      if (!taxiRequestTime || taxiCategory === "Такси по Цхинвалу") return sortItems(byCategory, taxiSort, favorites);

      const filteredByTime = byCategory.filter((item) => {
        const rideDate = parseTaxiWhenValue(item.when);
        if (!rideDate) return false;
        return rideDate.getTime() >= taxiRequestTime.getTime();
      });
      return sortItems(filteredByTime, taxiSort, favorites);
    },
    [taxiCatalog, taxiCategory, taxiSort, favorites, taxiRequestTime]
  );

  useEffect(() => {
    if (taxiCategory === "Такси по Цхинвалу" && taxiRequestedAt) setTaxiRequestedAt("");
  }, [taxiCategory, taxiRequestedAt]);

  const openDetail = (type, id) => {
    const source = type === "ads" ? mock.ads : type === "services" ? servicesCatalog : type === "food" ? mock.food : taxiCatalog;
    const item = source.find((x) => x.id === id);
    if (!item) return;
    setModal({ type: "detail", payload: { type, id } });
  };

  const openCreate = (type) => ensureAuth(() => setModal({ type: "create", payload: { type } }));
  const openEditProfile = () => ensureAuth(() => setModal({ type: "profileEdit", payload: profile }));
  const createType = modal?.type === "create" ? modal.payload?.type : null;
  const fullScreenCreate = createType === "ad" || createType === "service" || createType === "taxi" || createType === "restaurant";
  const fullScreenModal = modal?.type === "detail" || modal?.type === "profileEdit" || fullScreenCreate;
  const blockAuthBackdropClose = modal?.type === "auth" && Boolean(modal?.payload?.returnTo);

  const submitMock = (event, type) => {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const payload = {};

    for (const [key, value] of fd.entries()) {
      if (value instanceof File) {
        if (!value.name) continue;
        if (!payload[key]) payload[key] = [];
        payload[key].push(value.name);
        continue;
      }
      if (key in payload) {
        if (Array.isArray(payload[key])) payload[key].push(value);
        else payload[key] = [payload[key], value];
      } else {
        payload[key] = value;
      }
    }

    if (type === "restaurant") setHasRestaurant(true);
    if (type === "profile") {
      setProfile({
        name: payload.name || "-",
        phone: payload.phone || "-",
        telegram: payload.telegram || "-",
        whatsapp: payload.whatsapp || "-",
        about: payload.about || "-",
      });
    }
    if (type === "taxi") {
      const categories = toArray(payload.category).filter(Boolean);
      const mode = payload.mode === "recurring" ? "recurring" : "one-time";
      const scheduleDays = normalizeWeekdays(payload.scheduleDay);
      const scheduleHour = typeof payload.scheduleHour === "string" ? payload.scheduleHour : "08:00";
      const seatsValue = Number(payload.seats);
      const seats = Number.isFinite(seatsValue) && seatsValue > 0 ? { total: seatsValue, free: seatsValue } : null;
      const photos = toArray(payload.images).map((name, idx) => buildUserPhoto(String(name), idx));
      const contacts = {
        ...(payload.phone ? { phone: payload.phone } : {}),
        ...(payload.wa ? { wa: payload.wa } : {}),
        ...(payload.tg ? { tg: payload.tg } : {}),
      };

      if (mode === "recurring" && scheduleDays.length && categories.length) {
        const templates = categories.map((category) => ({
          id: `taxi-template-${Date.now()}-${randomSuffix()}`,
          category,
          name: payload.name || "Водитель",
          price: Number(payload.price) || 0,
          rating: 5,
          seats,
          desc: payload.desc || "Регулярные поездки по расписанию.",
          contacts,
          photos,
          weekdays: scheduleDays,
          time: scheduleHour,
          status: "active",
        }));
        setTaxiTemplates((prev) => [...templates, ...prev]);
        setIsTaxiDriver(true);
      } else if (categories.length) {
        const items = categories.map((category) => ({
          id: `taxi-custom-${Date.now()}-${randomSuffix()}`,
          category,
          name: payload.name || "Водитель",
          price: Number(payload.price) || 0,
          rating: 5,
          date: 0,
          seats,
          when: payload.when || null,
          desc: payload.desc || "Новое предложение",
          contacts,
          photos,
        }));
        setCustomTaxiItems((prev) => [...items, ...prev]);
        setIsTaxiDriver(true);
      }
    }

    alert(`Мок-отправка (${type})\n${JSON.stringify(payload, null, 2)}`);
    setModal(null);
  };

  const setTemplateStatus = (id, status) => {
    setTaxiTemplates((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x)));
  };

  const removeTemplate = (id) => {
    setTaxiTemplates((prev) => prev.filter((x) => x.id !== id));
  };

  const editTemplate = (id) => {
    setTaxiTemplates((prev) => prev.map((template) => {
      if (template.id !== id) return template;

      const daysInput = window.prompt("Дни недели через запятую (например: Пн,Ср,Пт)", template.weekdays.join(","));
      if (daysInput === null) return template;
      const nextDays = normalizeWeekdays(daysInput);
      if (!nextDays.length) return template;

      const timeInput = window.prompt("Время выезда в формате HH:00 (например: 08:00)", template.time);
      if (timeInput === null) return template;
      const nextTime = String(timeInput).trim();
      if (!/^(0[4-9]|1\d|2[0-4]):00$/.test(nextTime)) return template;

      return { ...template, weekdays: nextDays, time: nextTime };
    }));
  };

  const addFeedback = ({ itemId, rating, text }) => {
    let added = false;

    ensureAuth(() => {
      const message = String(text || "").trim();
      if (!message) return;
      const authorName = String(profile.name || "Пользователь").trim();

      const nextReview = {
        id: `review-${Date.now()}-${randomSuffix()}`,
        author: authorName,
        rating: normalizeRating(rating),
        text: message,
        createdAt: new Date().toISOString(),
      };

      setFeedbackByItem((prev) => {
        const current = Array.isArray(prev[itemId]) ? prev[itemId] : [];
        const alreadyLeft = current.some((review) => String(review.author || "").trim().toLowerCase() === authorName.toLowerCase());
        if (alreadyLeft) return prev;
        added = true;
        return {
          ...prev,
          [itemId]: [nextReview, ...current],
        };
      });
    });

    return added;
  };

  const requireAuthForFeedback = () => {
    ensureAuth(() => {}, {
      returnTo: modal?.type === "detail" ? modal.payload : null,
      fromDetail: true,
    });
  };

  const closeModal = () => {
    if (modal?.type === "auth" && modal?.payload?.returnTo) {
      setModal({ type: "detail", payload: modal.payload.returnTo });
      return;
    }
    setModal(null);
  };

  const detailData = useMemo(() => {
    if (modal?.type !== "detail") return null;
    const detailType = modal.payload?.type;
    const detailId = modal.payload?.id;
    const source = detailType === "ads"
      ? mock.ads
      : detailType === "services"
        ? servicesCatalog
        : detailType === "food"
          ? mock.food
          : taxiCatalog;
    const item = source.find((x) => x.id === detailId);
    if (!item) return null;
    return { type: detailType, item };
  }, [modal, servicesCatalog, taxiCatalog]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <h1>{tab === "profile" ? profile.name : "ircom"}</h1>
        </div>
        <div className="topbar-actions">
          <span className="topbar-status">{isAuth ? "Онлайн" : "Гость"}</span>
          <button className="ghost-btn topbar-auth-btn" onClick={toggleAuth} type="button">
            {isAuth ? "Выйти" : "Войти"}
          </button>
        </div>
      </header>

      <main className="screen">
        {tab === "ads" && (
          <AdsTab
            adsCategoriesVisible={adsCategoriesVisible}
            adsCategory={adsCategory}
            setAdsCategory={setAdsCategory}
            adsSort={adsSort}
            setAdsSort={setAdsSort}
            adsItems={adsItems}
            openCreate={openCreate}
            openDetail={openDetail}
            toggleFavorite={toggleFavorite}
            favorites={favorites}
          />
        )}

        {tab === "services" && (
          <ServicesTab
            serviceCategory={serviceCategory}
            setServiceCategory={setServiceCategory}
            servicesSort={servicesSort}
            setServicesSort={setServicesSort}
            servicesItems={servicesItems}
            openCreate={openCreate}
            openDetail={openDetail}
            toggleFavorite={toggleFavorite}
            favorites={favorites}
            serviceCategories={mock.serviceCategories}
          />
        )}

        {tab === "taxi" && (
          <TaxiTab
            taxiCategory={taxiCategory}
            setTaxiCategory={setTaxiCategory}
            taxiSort={taxiSort}
            setTaxiSort={setTaxiSort}
            taxiItems={taxiItems}
            taxiRequestedAt={taxiRequestedAt}
            setTaxiRequestedAt={setTaxiRequestedAt}
            taxiCategories={mock.taxiCategories}
            openCreate={openCreate}
            openDetail={openDetail}
            toggleFavorite={toggleFavorite}
            favorites={favorites}
          />
        )}

        {tab === "food" && (
          <FoodTab
            foodCategory={foodCategory}
            setFoodCategory={setFoodCategory}
            foodSort={foodSort}
            setFoodSort={setFoodSort}
            foodItems={foodItems}
            foodCategories={mock.foodCategories}
            hasRestaurant={hasRestaurant}
            openCreate={openCreate}
            openDetail={openDetail}
            toggleFavorite={toggleFavorite}
            favorites={favorites}
          />
        )}

        {tab === "profile" && (
          <ProfileTab
            isAuth={isAuth}
            profile={profile}
            myAdsCount={mock.ads.filter((x) => x.owner === "murat").length}
            myServicesCount={2}
            hasRestaurant={hasRestaurant}
            isTaxiDriver={isTaxiDriver}
            taxiTemplates={taxiTemplates}
            onPauseTemplate={(id) => setTemplateStatus(id, "paused")}
            onResumeTemplate={(id) => setTemplateStatus(id, "active")}
            onDeleteTemplate={removeTemplate}
            onEditTemplate={editTemplate}
            openCreate={openCreate}
            openEditProfile={openEditProfile}
            toggleAuth={toggleAuth}
          />
        )}
      </main>

      <nav className="bottom-nav">
        {tabConfig.map(([key, icon, label]) => (
          <button className={`tab-btn ${tab === key ? "active" : ""}`} key={key} onClick={() => setTab(key)} type="button">
            <Icon name={icon} />
            <span className="tab-label">{label}</span>
          </button>
        ))}
      </nav>

      <Modal
        open={Boolean(modal)}
        onClose={closeModal}
        variant={fullScreenModal ? "full" : "sheet"}
        closeOnBackdrop={!blockAuthBackdropClose}
      >
        {modal?.type === "auth" && (
          <>
            <h3>Требуется авторизация</h3>
            <p className="small">Для этого действия нужно войти или зарегистрироваться.</p>
            <div className="actions" style={{ marginTop: 8 }}>
              <button
                className="primary-btn"
                type="button"
                onClick={() => {
                  setIsAuth(true);
                  setProfile({
                    name: "Мурад",
                    phone: "+7(929)000-00-00",
                    telegram: "@murat_ircom",
                    whatsapp: "+7(929)000-00-00",
                    about: "Продаю технику и размещаю междугородние поездки.",
                  });
                  if (modal?.payload?.returnTo) {
                    setModal({ type: "detail", payload: modal.payload.returnTo });
                  } else {
                    setModal(null);
                  }
                }}
              >
                Войти
              </button>
              <button className="ghost-btn" type="button" onClick={closeModal}>Отмена</button>
            </div>
          </>
        )}

        {modal?.type === "detail" && detailData && (
          <DetailModalContent
            data={detailData}
            onFav={toggleFavorite}
            isFav={(id) => favorites.has(id)}
            isAuth={isAuth}
            onAddFeedback={addFeedback}
            onRequireAuth={requireAuthForFeedback}
            currentUserName={profile.name}
          />
        )}

        {modal?.type === "create" && (
          <CreateForm type={modal.payload.type} onSubmit={submitMock} onClose={() => setModal(null)} taxiCategories={mock.taxiCategories} />
        )}

        {modal?.type === "profileEdit" && <ProfileEditForm profile={profile} onSubmit={submitMock} onClose={() => setModal(null)} />}
      </Modal>
    </div>
  );
}
