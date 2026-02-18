import { useEffect, useMemo, useState } from "react";
import { mock } from "./data/mock";
import { CreateForm, DetailModalContent, ProfileEditForm } from "./components/modals";
import { EntityGroupModalContent } from "./components/entity-group-modal-content";
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
const profileValue = (value) => {
  const text = String(value || "").trim();
  return text === "-" ? "" : text;
};
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
const deepCopy = (value) => (value == null ? value : JSON.parse(JSON.stringify(value)));
const TEST_USERS = {
  user_with_entities: {
    label: "Пользователь с сущностями",
    owner: "test_driver",
    profile: {
      name: "Тест Водитель",
      phone: "+7(929)111-22-33",
      telegram: "@test_driver_ircom",
      whatsapp: "+7(929)111-22-33",
      about: "Тестовый аккаунт: есть заведение, услуга и поездка такси.",
    },
    hasRestaurant: true,
    restaurantEntity: {
      title: "Кафе Тест",
      desc: "Домашняя кухня и выпечка.",
      address: "г. Цхинвал, ул. Тестовая, 10",
      deliveryMode: "free",
      deliveryPrice: 0,
      phone: "+7(929)111-22-33",
      telegram: "@cafe_test",
      whatsapp: "+7(929)111-22-33",
    },
    services: [
      {
        id: "service-test-user-1",
        category: "Другое",
        title: "Услуга тестового пользователя",
        price: 1500,
        date: 0,
        desc: "Тестовая услуга для проверки профиля.",
        owner: "test_driver",
        contacts: { phone: "+7(929)111-22-33", tg: "@test_driver_ircom", wa: "+7(929)111-22-33" },
        photos: [buildUserPhoto("service-test-user-1", 0)],
      },
    ],
    ads: [
      {
        id: "ad-test-user-1",
        category: "Электроника",
        title: "Ноутбук Lenovo ThinkPad",
        price: 38000,
        date: 0,
        desc: "Тестовое объявление пользователя для проверки блока сущностей.",
        owner: "test_driver",
        contacts: { phone: "+7(929)111-22-33", tg: "@test_driver_ircom" },
        photos: [buildUserPhoto("ad-test-user-1", 0)],
      },
    ],
    taxiItems: [
      {
        id: "taxi-test-user-1",
        category: "Цхинвал -> Владикавказ",
        name: "Тест Водитель",
        price: 1200,
        rating: 5,
        date: 0,
        seats: { total: 4, free: 1 },
        when: "Сегодня 18:00",
        mode: "one-time",
        isFilled: false,
        desc: "Тестовая поездка межгород.",
        contacts: { phone: "+7(929)111-22-33", wa: "+7(929)111-22-33" },
        photos: [buildUserPhoto("taxi-test-user-1", 0)],
      },
    ],
    taxiTemplates: [],
    isTaxiDriver: true,
  },
  user_empty: {
    label: "Пользователь без сущностей",
    owner: "test_empty",
    profile: {
      name: "Тест Пустой",
      phone: "+7(929)444-55-66",
      telegram: "@test_empty_ircom",
      whatsapp: "+7(929)444-55-66",
      about: "Тестовый аккаунт без объявлений и услуг.",
    },
    hasRestaurant: false,
    restaurantEntity: null,
    services: [],
    ads: [],
    taxiItems: [],
    taxiTemplates: [],
    isTaxiDriver: false,
  },
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
  const [currentOwner, setCurrentOwner] = useState(null);
  const [selectedAuthUser, setSelectedAuthUser] = useState("user_with_entities");
  const [profile, setProfile] = useState({
    name: "Гость",
    phone: "-",
    telegram: "-",
    whatsapp: "-",
    about: "Авторизуйтесь, чтобы управлять профилем.",
  });
  const [hasRestaurant, setHasRestaurant] = useState(false);
  const [restaurantEntity, setRestaurantEntity] = useState(null);
  const [favorites, setFavorites] = useState(new Set());
  const [adsCategory, setAdsCategory] = useState("Все");
  const [serviceCategory, setServiceCategory] = useState("Все");
  const [foodCategory, setFoodCategory] = useState("Все");
  const [foodViewMode, setFoodViewMode] = useState("restaurants");
  const [taxiCategory, setTaxiCategory] = useState("Такси по Цхинвалу");
  const [adsSort, setAdsSort] = useState("date");
  const [servicesSort, setServicesSort] = useState("date");
  const [foodSort, setFoodSort] = useState("price");
  const [taxiSort, setTaxiSort] = useState("rating");
  const [taxiRequestedAt, setTaxiRequestedAt] = useState("");
  const [customAds, setCustomAds] = useState([]);
  const [customTaxiItems, setCustomTaxiItems] = useState([]);
  const [customServices, setCustomServices] = useState([]);
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
      setCurrentOwner(null);
      setProfile({ name: "Гость", phone: "-", telegram: "-", whatsapp: "-", about: "Авторизуйтесь, чтобы управлять профилем." });
      setHasRestaurant(false);
      setRestaurantEntity(null);
      setCustomServices([]);
      setCustomAds([]);
      setCustomTaxiItems([]);
      setTaxiTemplates([]);
      setIsTaxiDriver(false);
      return;
    }

    setModal({ type: "auth", payload: {} });
  };

  const applyAuthUser = (userKey) => {
    const data = TEST_USERS[userKey] || TEST_USERS.user_empty;
    setIsAuth(true);
    setCurrentOwner(data.owner || null);
    setProfile(deepCopy(data.profile));
    setHasRestaurant(Boolean(data.hasRestaurant));
    setRestaurantEntity(deepCopy(data.restaurantEntity));
    setCustomServices(deepCopy(data.services) || []);
    setCustomAds(deepCopy(data.ads) || []);
    setCustomTaxiItems(deepCopy(data.taxiItems) || []);
    setTaxiTemplates(deepCopy(data.taxiTemplates) || []);
    setIsTaxiDriver(Boolean(data.isTaxiDriver) || Boolean((data.taxiItems || []).length) || Boolean((data.taxiTemplates || []).length));
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

  const adsCatalog = useMemo(() => [...customAds, ...mock.ads], [customAds]);
  const myAds = useMemo(
    () => (currentOwner ? adsCatalog.filter((x) => x.owner === currentOwner) : []),
    [adsCatalog, currentOwner]
  );

  const adsItems = useMemo(() => {
    const category = adsCategoriesVisible.includes(adsCategory) ? adsCategory : "Все";
    const filtered = adsCatalog.filter(
      (x) => category === "Все" || x.category === category || (category === "Мои объявления" && currentOwner && x.owner === currentOwner)
    );
    return sortItems(filtered, adsSort, favorites);
  }, [adsCategoriesVisible, adsCategory, adsSort, favorites, currentOwner, adsCatalog]);

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

  const servicesCatalog = useMemo(() => [...customServices, ...mock.services].map((item) => decorateWithFeedback(item)), [feedbackByItem, customServices]);

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
    if (type === "restaurant") {
      if (!hasRestaurant || !restaurantEntity) return;
      setModal({ type: "detail", payload: { type: "restaurant", id: "my-restaurant" } });
      return;
    }
    const source = type === "ads" ? adsCatalog : type === "services" ? servicesCatalog : type === "food" ? mock.food : taxiCatalog;
    const item = source.find((x) => x.id === id);
    if (!item) return;
    setModal({ type: "detail", payload: { type, id } });
  };

  const openCreate = (type) => ensureAuth(() => setModal({ type: "create", payload: { type } }));
  const openEditEntity = (payload) => ensureAuth(() => setModal({ type: "editEntity", payload }));
  const openEntityGroup = (group) => ensureAuth(() => setModal({ type: "entityGroup", payload: { group } }));
  const openEditProfile = () => ensureAuth(() => setModal({ type: "profileEdit", payload: profile }));
  const createType = modal?.type === "create" || modal?.type === "editEntity" ? modal.payload?.type : null;
  const fullScreenCreate = createType === "ad" || createType === "service" || createType === "taxi" || createType === "restaurant";
  const fullScreenModal = modal?.type === "detail" || modal?.type === "profileEdit" || modal?.type === "entityGroup" || fullScreenCreate;
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

    const editEntityId = typeof payload.editEntityId === "string" ? payload.editEntityId : "";
    const editEntityKind = typeof payload.editEntityKind === "string" ? payload.editEntityKind : "";
    const isEdit = Boolean(editEntityId || editEntityKind === "restaurant");

    if (type === "restaurant") setHasRestaurant(true);
    if (type === "restaurant") {
      setRestaurantEntity((prev) => {
        const deliveryModeRaw = String(payload.deliveryMode || "none");
        const deliveryMode = deliveryModeRaw === "free" || deliveryModeRaw === "paid" ? deliveryModeRaw : "none";
        const deliveryPrice = deliveryMode === "paid" ? Math.max(0, Number(payload.deliveryPrice) || 0) : 0;
        const nextPhotos = toArray(payload.images).length
          ? toArray(payload.images).map((name, idx) => buildUserPhoto(String(name), idx))
          : Array.isArray(prev?.photos)
            ? prev.photos
            : [];
        return {
          title: payload.title || "Моё заведение",
          desc: payload.desc || "",
          address: payload.address || "",
          deliveryMode,
          deliveryPrice,
          phone: payload.phone || "",
          telegram: payload.telegram || "",
          whatsapp: payload.whatsapp || "",
          photos: nextPhotos,
        };
      });
    }
    if (type === "ad") {
      if (isEdit && editEntityId) {
        setCustomAds((prev) => prev.map((ad) => {
          if (ad.id !== editEntityId) return ad;
          const nextPhotos = toArray(payload.images).length
            ? toArray(payload.images).map((name, idx) => buildUserPhoto(String(name), idx))
            : ad.photos || [];
          return {
            ...ad,
            category: payload.category || ad.category,
            title: payload.title || ad.title,
            price: Number(payload.price) || ad.price || 0,
            desc: payload.desc || ad.desc || "",
            photos: nextPhotos,
          };
        }));
      } else {
        setCustomAds((prev) => [
          {
            id: `ad-custom-${Date.now()}-${randomSuffix()}`,
            category: payload.category || "Другое",
            title: payload.title || "Объявление",
            price: Number(payload.price) || 0,
            date: 0,
            desc: payload.desc || "",
            owner: currentOwner || "test_driver",
            contacts: {
              ...(profile.phone && profile.phone !== "-" ? { phone: profile.phone } : {}),
              ...(profile.whatsapp && profile.whatsapp !== "-" ? { wa: profile.whatsapp } : {}),
              ...(profile.telegram && profile.telegram !== "-" ? { tg: profile.telegram } : {}),
            },
            photos: toArray(payload.images).map((name, idx) => buildUserPhoto(String(name), idx)),
          },
          ...prev,
        ]);
      }
    }
    if (type === "service") {
      if (isEdit && editEntityId) {
        setCustomServices((prev) => prev.map((service) => {
          if (service.id !== editEntityId) return service;
          const nextPhotos = toArray(payload.images).length
            ? toArray(payload.images).map((name, idx) => buildUserPhoto(String(name), idx))
            : service.photos || [];
          return {
            ...service,
            category: payload.category || service.category,
            title: payload.title || service.title,
            price: Number(payload.price) || service.price || 0,
            desc: payload.desc || service.desc || "",
            photos: nextPhotos,
          };
        }));
      } else {
        setCustomServices((prev) => [
          {
            id: `service-custom-${Date.now()}-${randomSuffix()}`,
            category: payload.category || "Другое",
            title: payload.title || "Услуга",
            price: Number(payload.price) || 0,
            date: 0,
            desc: payload.desc || "",
            owner: currentOwner || "test_driver",
            contacts: {
              ...(profile.phone && profile.phone !== "-" ? { phone: profile.phone } : {}),
              ...(profile.whatsapp && profile.whatsapp !== "-" ? { wa: profile.whatsapp } : {}),
              ...(profile.telegram && profile.telegram !== "-" ? { tg: profile.telegram } : {}),
            },
            photos: toArray(payload.images).map((name, idx) => buildUserPhoto(String(name), idx)),
          },
          ...prev,
        ]);
      }
    }
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

      if (isEdit && editEntityId && editEntityKind === "taxi-one-time") {
        setCustomTaxiItems((prev) => prev.map((item) => {
          if (item.id !== editEntityId) return item;
          return {
            ...item,
            category: categories[0] || item.category,
            name: payload.name || item.name,
            price: Number(payload.price) || item.price || 0,
            seats,
            when: payload.when || item.when || null,
            desc: payload.desc || item.desc || "",
            contacts,
            photos: photos.length ? photos : item.photos || [],
          };
        }));
        setIsTaxiDriver(true);
      } else if (isEdit && editEntityId && editEntityKind === "taxi-template") {
        setTaxiTemplates((prev) => prev.map((template) => {
          if (template.id !== editEntityId) return template;
          return {
            ...template,
            category: categories[0] || template.category,
            name: payload.name || template.name,
            price: Number(payload.price) || template.price || 0,
            seats,
            desc: payload.desc || template.desc || "",
            contacts,
            photos: photos.length ? photos : template.photos || [],
            weekdays: scheduleDays.length ? scheduleDays : template.weekdays || [],
            time: scheduleHour || template.time,
          };
        }));
        setIsTaxiDriver(true);
      } else if (mode === "recurring" && scheduleDays.length && categories.length) {
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
          mode: "one-time",
          isFilled: false,
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

  const editTemplate = (id) => openEditEntity({ type: "taxi", id, kind: "taxi-template" });

  const toggleTaxiFilled = (id) => {
    setCustomTaxiItems((prev) => prev.map((x) => (x.id === id ? { ...x, isFilled: !x.isFilled } : x)));
  };

  const editTaxiOffer = (id) => openEditEntity({ type: "taxi", id, kind: "taxi-one-time" });

  const editService = (id) => openEditEntity({ type: "service", id, kind: "service" });
  const editAd = (id) => openEditEntity({ type: "ad", id, kind: "ad" });

  const editRestaurant = () => openEditEntity({ type: "restaurant", kind: "restaurant" });
  const viewRestaurant = () => openDetail("restaurant", "my-restaurant");
  const viewTaxiTemplate = (id) => {
    if (!id) return;
    setModal({ type: "detail", payload: { type: "taxi", id: `template-preview-${id}` } });
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
    if (detailType === "restaurant") {
      if (!restaurantEntity) return null;
      return {
        type: "restaurant",
        item: {
          id: "my-restaurant",
          title: restaurantEntity.title || "Заведение",
          desc: restaurantEntity.desc || "",
          address: restaurantEntity.address || "",
          deliveryMode: restaurantEntity.deliveryMode || "none",
          deliveryPrice: Number(restaurantEntity.deliveryPrice) || 0,
          photos: Array.isArray(restaurantEntity.photos) ? restaurantEntity.photos : [],
          contacts: {
            ...(restaurantEntity.phone ? { phone: restaurantEntity.phone } : {}),
            ...(restaurantEntity.telegram ? { tg: restaurantEntity.telegram } : {}),
            ...(restaurantEntity.whatsapp ? { wa: restaurantEntity.whatsapp } : {}),
          },
        },
      };
    }
    const source = detailType === "ads"
      ? adsCatalog
      : detailType === "services"
        ? servicesCatalog
        : detailType === "food"
          ? mock.food
          : taxiCatalog;
    const item = source.find((x) => x.id === detailId);
    if (!item && detailType === "taxi" && typeof detailId === "string" && detailId.startsWith("template-preview-")) {
      const templateId = detailId.slice("template-preview-".length);
      const template = taxiTemplates.find((x) => x.id === templateId);
      if (!template) return null;
      return {
        type: "taxi",
        item: {
          ...template,
          id: detailId,
          mode: "one-time",
          when: template.weekdays?.length
            ? `${template.weekdays.join(", ")} · ${template.time || "Время не указано"}`
            : template.time || "Время не указано",
          isFilled: false,
        },
      };
    }
    if (!item) return null;
    return { type: detailType, item };
  }, [modal, adsCatalog, servicesCatalog, taxiCatalog, restaurantEntity, taxiTemplates]);

  const createInitialValues = useMemo(() => {
    if (modal?.type !== "create") return null;
    const createTarget = modal.payload?.type;

    if (createTarget === "taxi") {
      return {
        name: profileValue(profile.name),
        contacts: {
          phone: profileValue(profile.phone),
          wa: profileValue(profile.whatsapp),
          tg: profileValue(profile.telegram),
        },
      };
    }

    if (createTarget === "restaurant") {
      return {
        phone: profileValue(profile.phone),
        telegram: profileValue(profile.telegram),
        whatsapp: profileValue(profile.whatsapp),
      };
    }

    return null;
  }, [modal, profile]);

  const editEntityData = useMemo(() => {
    if (modal?.type !== "editEntity") return null;
    const editType = modal.payload?.type;
    const editId = modal.payload?.id;
    const editKind = modal.payload?.kind;

    if (editType === "restaurant") {
      return {
        type: "restaurant",
        initialValues: restaurantEntity || {},
        editMeta: { kind: editKind || "restaurant" },
      };
    }

    if (editType === "service") {
      const item = customServices.find((x) => x.id === editId);
      if (!item) return null;
      return {
        type: "service",
        initialValues: item,
        editMeta: { id: item.id, kind: editKind || "service" },
      };
    }

    if (editType === "ad") {
      const item = customAds.find((x) => x.id === editId);
      if (!item) return null;
      return {
        type: "ad",
        initialValues: item,
        editMeta: { id: item.id, kind: editKind || "ad" },
      };
    }

    if (editType === "taxi") {
      if (editKind === "taxi-template") {
        const item = taxiTemplates.find((x) => x.id === editId);
        if (!item) return null;
        return {
          type: "taxi",
          initialValues: { ...item, mode: "recurring", categories: [item.category] },
          editMeta: { id: item.id, kind: "taxi-template" },
        };
      }
      const item = customTaxiItems.find((x) => x.id === editId);
      if (!item) return null;
      return {
        type: "taxi",
        initialValues: { ...item, mode: "one-time", categories: [item.category] },
        editMeta: { id: item.id, kind: "taxi-one-time" },
      };
    }

    return null;
  }, [modal, restaurantEntity, customServices, customAds, taxiTemplates, customTaxiItems]);

  const entityGroupData = useMemo(() => {
    if (modal?.type !== "entityGroup") return null;
    const group = modal.payload?.group;
    if (group === "restaurant") {
      return { title: "Заведения", items: hasRestaurant && restaurantEntity ? [restaurantEntity] : [] };
    }
    if (group === "ads") {
      return { title: "Объявления", items: myAds };
    }
    if (group === "services") {
      return { title: "Услуги", items: customServices };
    }
    if (group === "taxi") {
      return {
        title: "Моё такси",
        items: {
          oneTime: customTaxiItems.filter((x) => x.mode === "one-time" && x.category !== "Такси по Цхинвалу"),
          regular: taxiTemplates,
        },
      };
    }
    return null;
  }, [modal, hasRestaurant, restaurantEntity, myAds, customServices, customTaxiItems, taxiTemplates]);

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
            foodViewMode={foodViewMode}
            setFoodViewMode={setFoodViewMode}
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
            myAdsCount={myAds.length}
            myServicesCount={customServices.length}
            myAds={myAds}
            hasRestaurant={hasRestaurant}
            restaurantEntity={restaurantEntity}
            isTaxiDriver={isTaxiDriver}
            taxiTemplates={taxiTemplates}
            oneTimeIntercityOffers={customTaxiItems.filter((x) => x.mode === "one-time" && x.category !== "Такси по Цхинвалу")}
            myServices={customServices}
            onOpenEntityGroup={openEntityGroup}
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
            <p className="small">Временно выберите тестового пользователя для входа.</p>
            <div className="multi-select-buttons" style={{ marginTop: 8 }}>
              {Object.entries(TEST_USERS).map(([key, user]) => (
                <button
                  key={key}
                  type="button"
                  className={`multi-select-btn ${selectedAuthUser === key ? "active" : ""}`}
                  onClick={() => setSelectedAuthUser(key)}
                  aria-pressed={selectedAuthUser === key}
                >
                  {user.label}
                </button>
              ))}
            </div>
            <div className="actions" style={{ marginTop: 8 }}>
              <button
                className="primary-btn"
                type="button"
                onClick={() => {
                  applyAuthUser(selectedAuthUser);
                  if (modal?.payload?.returnTo) {
                    setModal({ type: "detail", payload: modal.payload.returnTo });
                  } else {
                    setModal(null);
                  }
                }}
              >
                Войти как выбранный
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
          <CreateForm
            type={modal.payload.type}
            initialValues={createInitialValues}
            onSubmit={submitMock}
            onClose={() => setModal(null)}
            taxiCategories={mock.taxiCategories}
          />
        )}

        {modal?.type === "editEntity" && editEntityData && (
          <CreateForm
            type={editEntityData.type}
            mode="edit"
            initialValues={editEntityData.initialValues}
            editMeta={editEntityData.editMeta}
            onSubmit={submitMock}
            onClose={() => setModal(null)}
            taxiCategories={mock.taxiCategories}
          />
        )}

        {modal?.type === "entityGroup" && entityGroupData && (
          <EntityGroupModalContent
            group={modal.payload?.group}
            entityGroupData={entityGroupData}
            onViewRestaurant={viewRestaurant}
            onEditRestaurant={editRestaurant}
            onViewAd={(id) => openDetail("ads", id)}
            onEditAd={editAd}
            onViewService={(id) => openDetail("services", id)}
            onEditService={editService}
            onViewTaxi={(id) => openDetail("taxi", id)}
            onEditTaxi={editTaxiOffer}
            onToggleTaxiFilled={toggleTaxiFilled}
            onViewTaxiTemplate={viewTaxiTemplate}
            onSetTemplateStatus={setTemplateStatus}
            onEditTemplate={editTemplate}
            onRemoveTemplate={removeTemplate}
          />
        )}

        {modal?.type === "profileEdit" && <ProfileEditForm profile={profile} onSubmit={submitMock} onClose={() => setModal(null)} />}
      </Modal>
    </div>
  );
}
