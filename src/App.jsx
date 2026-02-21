import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { CreateForm, DetailModalContent, ProfileEditForm } from "./components/modals";
import { EntityGroupModalContent } from "./components/entity-group-modal-content";
import { Icon, Modal } from "./components/ui";
import { useAuthState } from "./hooks/use-auth-state";
import { useGestureGuard } from "./hooks/use-gesture-guard";
import { useNavHistory } from "./hooks/use-nav-history";
import { useTaxiCatalog } from "./hooks/use-taxi-catalog";
import { AdsTab, FoodTab, ProfileTab, ServicesTab, TaxiTab } from "./sections/tabs";
import {
  createOrUpdateAccountRequest,
  getSessionRequest,
  registerRequest,
  signInRequest,
  signOutRequest,
} from "./api/auth";
import {
  createListingRequest,
  getListingsRequest,
  getMyListingsRequest,
  toggleListingFavoriteRequest,
  updateListingRequest,
} from "./api/listing";
import {
  createTaxiOfferRequest,
  getMyTaxiOffersRequest,
  getTaxiOffersRequest,
  toggleTaxiFavoriteRequest,
  updateTaxiOfferRequest,
} from "./api/taxi";
import {
  createMenuItemRequest,
  createOrUpdateRestaurantRequest,
  deleteMenuItemRequest,
  getMenuItemsRequest,
  getMyRestaurantRequest,
  toggleMenuItemFavoriteRequest,
  updateMenuItemRequest,
} from "./api/food";
import { uploadImagesToS3 } from "./utils/s3-upload";
import { tabConfig } from "./utils/constants";
import { sortItems } from "./utils/helpers";
import {
  formatPhoneValueCompact,
  handlePhoneInputCompact,
  PHONE_COMPACT_PATTERN,
  PHONE_COMPACT_PLACEHOLDER,
  syncPhonePrev,
} from "./utils/phone";

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
const APP_HISTORY_KEY = "__ircomNavState";
const AUTH_SESSION_STORAGE_KEY = "__ircomAuthSession";
const ADS_CATEGORIES = ["Все", "Авто", "Недвижимость", "Электроника", "Бытовая техника", "Мебель", "Другое", "Мои объявления"];
const SERVICE_CATEGORIES = ["Все", "Кондитерка", "Репетиторы", "Красота", "Автосервис", "Другое"];
const FOOD_CATEGORIES = ["Все", "Кавказская кухня", "Суши и роллы", "Осетинские пироги", "Бургеры", "Другое"];
const TAXI_CATEGORIES = ["Такси по Цхинвалу", "Цхинвал -> Владикавказ", "Владикавказ -> Цхинвал"];
const TAXI_CATEGORY_TO_DIRECTION = {
  "Такси по Цхинвалу": 1,
  "Цхинвал -> Владикавказ": 2,
  "Владикавказ -> Цхинвал": 3,
};
const DIRECTION_TO_TAXI_CATEGORY = {
  1: "Такси по Цхинвалу",
  2: "Цхинвал -> Владикавказ",
  3: "Владикавказ -> Цхинвал",
};

const toArray = (value) => (Array.isArray(value) ? value : value ? [value] : []);
const PHOTO_PUBLIC_BASE_URL = String(import.meta.env.VITE_S3_PUBLIC_BASE_URL || "").trim().replace(/\/+$/, "");
const normalizePhotoReference = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (!PHOTO_PUBLIC_BASE_URL) return raw;
  return `${PHOTO_PUBLIC_BASE_URL}/${encodeURIComponent(raw).replace(/%2F/g, "/")}`;
};
const randomSuffix = () => Math.random().toString(36).slice(2, 8);
const normalizeRating = (value) => Math.max(1, Math.min(5, Number(value) || 1));
const normalizePhotos = (photos, limit = 1) => {
  if (!Array.isArray(photos)) return [];
  return photos
    .map((photo) => normalizePhotoReference(photo))
    .filter(Boolean)
    .slice(0, limit);
};
const normalizeSinglePhoto = (photos) => normalizePhotos(photos, 1);
const normalizeFivePhotos = (photos) => normalizePhotos(photos, 5);
const normalizeEntityPhotos = (item) => ({
  ...item,
  photos: normalizeSinglePhoto(item?.photos),
});
const normalizeDish = (dish) => ({
  ...normalizeEntityPhotos(dish),
});
const buildRestaurantId = (name) => {
  const normalized = String(name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9а-яё-]/gi, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return `restaurant-${normalized || "unknown"}`;
};
const profileValue = (value) => {
  const text = String(value || "").trim();
  return text === "-" ? "" : text;
};
const buildInitialFeedback = () => {
  return {};
};
const getFeedbackRating = (reviews) => {
  if (!Array.isArray(reviews) || !reviews.length) return null;
  const sum = reviews.reduce((acc, review) => acc + (Number(review.rating) || 0), 0);
  return Number((sum / reviews.length).toFixed(1));
};
const deepCopy = (value) => (value == null ? value : JSON.parse(JSON.stringify(value)));
const getDaysAgo = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 0;
  const delta = Date.now() - date.getTime();
  return Math.max(0, Math.floor(delta / 86400000));
};
const getContacts = (item) => ({
  ...(item?.phone ? { phone: item.phone } : {}),
  ...(item?.whatsapp ? { wa: item.whatsapp } : {}),
  ...(item?.telegram ? { tg: item.telegram } : {}),
});
const toAccountId = (value) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return null;
  return parsed;
};
const mapListingToUi = (item) => ({
  id: `${item.kind === 1 ? "ad" : "service"}-${item.listingId}`,
  listingId: item.listingId,
  category: item.category,
  title: item.title,
  price: Number(item.price) || 0,
  date: getDaysAgo(item.createdAt),
  desc: item.description || "",
  owner: item.accountId ? `account-${item.accountId}` : null,
  contacts: getContacts(item),
  photos: normalizeFivePhotos(item.photos),
  isFavorite: Boolean(item.isFavorite),
});
const mapTaxiToUi = (item) => ({
  id: `taxi-${item.taxiOfferId}`,
  taxiOfferId: item.taxiOfferId,
  category: DIRECTION_TO_TAXI_CATEGORY[item.direction] || TAXI_CATEGORIES[0],
  direction: item.direction,
  name: item.displayName,
  price: Number(item.price) || 0,
  rating: Number(item.rating) || 0,
  date: getDaysAgo(item.createdAt),
  seats: item.seatsTotal ? { total: item.seatsTotal, free: item.seatsFree } : null,
  when: item.departureAt || null,
  mode: "one-time",
  isFilled: false,
  desc: item.description || "",
  contacts: getContacts(item),
  photos: normalizeSinglePhoto(item.carPhotos),
  reviewsCount: Number(item.reviewsCount) || 0,
  owner: item.accountId ? `account-${item.accountId}` : null,
  isFavorite: Boolean(item.isFavorite),
});
const mapMenuItemToUi = (item) => ({
  id: `food-${item.menuItemId}`,
  menuItemId: item.menuItemId,
  restaurantId: item.restaurantId,
  category: item.category || "Другое",
  restaurant: item.restaurantName || "Без названия заведения",
  restaurantAddress: item.restaurantAddress || "",
  restaurantLogo: normalizePhotoReference(item.restaurantLogo || item.restaurantLogoUrl),
  title: item.name,
  price: Number(item.price) || 0,
  prep: Number(item.cookTimeMinutes) || 25,
  always: Boolean(item.alwaysInStock),
  unavailable: !Boolean(item.isAvailable),
  delivery: Boolean(item.hasDelivery),
  desc: item.description || "",
  contacts: getContacts(item),
  photos: normalizeSinglePhoto(item.photos),
  isFavorite: Boolean(item.isFavorite),
});
export default function App() {
  const [tab, setTab] = useState("ads");
  const [favorites, setFavorites] = useState(new Set());
  const [adsCategory, setAdsCategory] = useState("Все");
  const [serviceCategory, setServiceCategory] = useState("Все");
  const [foodCategory, setFoodCategory] = useState("Все");
  const [taxiCategory, setTaxiCategory] = useState("Такси по Цхинвалу");
  const [adsSort, setAdsSort] = useState("date");
  const [servicesSort, setServicesSort] = useState("date");
  const [taxiSort, setTaxiSort] = useState("rating");
  const [taxiRequestedAt, setTaxiRequestedAt] = useState("");
  const [feedbackByItem, setFeedbackByItem] = useState(() => buildInitialFeedback());
  const [modal, setModal] = useState(null);
  const [authMode, setAuthMode] = useState("signin");
  const [authPending, setAuthPending] = useState(false);
  const [authError, setAuthError] = useState("");
  const [submitPending, setSubmitPending] = useState(false);
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [adsData, setAdsData] = useState([]);
  const [servicesData, setServicesData] = useState([]);
  const [taxiData, setTaxiData] = useState([]);
  const [foodData, setFoodData] = useState([]);
  const {
    isAuth,
    authSession,
    currentOwner,
    profile,
    setProfile,
    hasRestaurant,
    setHasRestaurant,
    restaurantEntity,
    setRestaurantEntity,
    customTaxiItems,
    setCustomTaxiItems,
    customServices,
    setCustomServices,
    customAds,
    setCustomAds,
    userRestaurantDishes,
    setUserRestaurantDishes,
    taxiTemplates,
    setTaxiTemplates,
    isTaxiDriver,
    setIsTaxiDriver,
    toggleAuth,
    applyAuthSession,
  } = useAuthState({ deepCopy });

  const adsCategoriesVisible = isAuth ? ADS_CATEGORIES : ADS_CATEGORIES.filter((x) => x !== "Мои объявления");

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;
    tg.ready();
    tg.expand();
  }, []);

  useEffect(() => {
    let isMounted = true;
    const rawSession = localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    if (!rawSession) return undefined;

    const restore = async () => {
      try {
        const parsed = JSON.parse(rawSession);
        const sessionToken = String(parsed?.sessionToken || "").trim();
        if (!sessionToken) return;
        const session = await getSessionRequest({ sessionToken });
        if (!isMounted || !session?.accountId) return;
        applyAuthSession({
          sessionToken: session.sessionToken || sessionToken,
          account: {
            accountId: session.accountId,
            name: session.name,
            phone: session.phone,
            whatsapp: session.whatsapp,
            telegram: session.telegram,
          },
        });
      } catch {
        localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
      }
    };

    restore();
    return () => {
      isMounted = false;
    };
  }, [applyAuthSession]);

  const refreshCatalog = useCallback(async () => {
    const accountId = toAccountId(authSession?.accountId);
    const [adsRaw, servicesRaw, taxiCityRaw, taxiOutRaw, taxiInRaw, menuRaw] = await Promise.all([
      getListingsRequest({ kind: 1, limit: 200, ...(accountId !== null ? { accountId } : {}) }),
      getListingsRequest({ kind: 2, limit: 200, ...(accountId !== null ? { accountId } : {}) }),
      getTaxiOffersRequest({ direction: 1, limit: 200, ...(accountId !== null ? { accountId } : {}) }),
      getTaxiOffersRequest({ direction: 2, limit: 200, ...(accountId !== null ? { accountId } : {}) }),
      getTaxiOffersRequest({ direction: 3, limit: 200, ...(accountId !== null ? { accountId } : {}) }),
      getMenuItemsRequest({ limit: 300, ...(accountId !== null ? { accountId } : {}) }),
    ]);

    const nextAds = toArray(adsRaw).map(mapListingToUi);
    const nextServices = toArray(servicesRaw).map(mapListingToUi);
    const nextTaxi = [...toArray(taxiCityRaw), ...toArray(taxiOutRaw), ...toArray(taxiInRaw)].map(mapTaxiToUi);
    const nextFood = toArray(menuRaw).map(mapMenuItemToUi);

    setAdsData(nextAds);
    setServicesData(nextServices);
    setTaxiData(nextTaxi);
    setFoodData(nextFood);

    const nextFavorites = new Set([
      ...nextAds.filter((x) => x.isFavorite).map((x) => x.id),
      ...nextServices.filter((x) => x.isFavorite).map((x) => x.id),
      ...nextTaxi.filter((x) => x.isFavorite).map((x) => x.id),
      ...nextFood.filter((x) => x.isFavorite).map((x) => x.id),
    ]);
    setFavorites(nextFavorites);
  }, [authSession?.accountId]);

  const refreshMyData = useCallback(async () => {
    const accountId = toAccountId(authSession?.accountId);
    if (accountId === null) {
      setCustomAds([]);
      setCustomServices([]);
      setCustomTaxiItems([]);
      setTaxiTemplates([]);
      setUserRestaurantDishes([]);
      setHasRestaurant(false);
      setRestaurantEntity(null);
      setIsTaxiDriver(false);
      return;
    }

    const [myAdsRaw, myServicesRaw, myTaxiRaw, myRestaurantRaw] = await Promise.all([
      getMyListingsRequest({ accountId, kind: 1, limit: 200 }),
      getMyListingsRequest({ accountId, kind: 2, limit: 200 }),
      getMyTaxiOffersRequest({ accountId, limit: 200 }),
      getMyRestaurantRequest({ accountId }),
    ]);

    const myAds = toArray(myAdsRaw).map((item) => mapListingToUi({ ...item, kind: 1, accountId }));
    const myServices = toArray(myServicesRaw).map((item) => mapListingToUi({ ...item, kind: 2, accountId }));
    const myTaxi = toArray(myTaxiRaw).map((item) => mapTaxiToUi({ ...item, accountId }));

    setCustomAds(myAds);
    setCustomServices(myServices);
    setCustomTaxiItems(myTaxi);
    setTaxiTemplates([]);
    setIsTaxiDriver(myTaxi.length > 0);

    const myRestaurantId = toAccountId(myRestaurantRaw?.restaurantId);
    if (myRestaurantId !== null) {
      const myRestaurantMenuRaw = await getMenuItemsRequest({ accountId, restaurantId: myRestaurantId, limit: 300 });
      const myRestaurantMenu = toArray(myRestaurantMenuRaw).map(mapMenuItemToUi);
      setHasRestaurant(true);
      setRestaurantEntity({
        id: `restaurant-${myRestaurantId}`,
        restaurantId: myRestaurantId,
        title: myRestaurantRaw.name || "Моё заведение",
        desc: myRestaurantRaw.description || "",
        address: myRestaurantRaw.address || "",
        deliveryMode: myRestaurantMenu.some((dish) => dish.delivery) ? "free" : "none",
        deliveryPrice: 0,
        logo: normalizePhotoReference(myRestaurantRaw.logoUrl),
        phone: myRestaurantRaw.phone || "",
        telegram: myRestaurantRaw.telegram || "",
        whatsapp: myRestaurantRaw.whatsapp || "",
      });
      setUserRestaurantDishes(myRestaurantMenu);
    } else {
      setHasRestaurant(false);
      setRestaurantEntity(null);
      setUserRestaurantDishes([]);
    }
  }, [
    authSession?.accountId,
    setCustomAds,
    setCustomServices,
    setCustomTaxiItems,
    setTaxiTemplates,
    setUserRestaurantDishes,
    setHasRestaurant,
    setRestaurantEntity,
    setIsTaxiDriver,
  ]);

  useEffect(() => {
    refreshCatalog().catch(() => {});
  }, [refreshCatalog]);

  useEffect(() => {
    refreshMyData().catch(() => {});
  }, [refreshMyData]);

  useNavHistory({ appHistoryKey: APP_HISTORY_KEY, tab, setTab, modal, setModal });
  useGestureGuard();
  const toggleAuthModal = async () => {
    if (isAuth) {
      try {
        if (authSession?.sessionToken) {
          await signOutRequest({ sessionToken: authSession.sessionToken });
        }
      } catch {
        // ignore: user should still be logged out locally
      }
      localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
      toggleAuth(() => setModal({ type: "auth", payload: {} }));
      return;
    }

    setAuthMode("signin");
    setAuthError("");
    setShowAuthPassword(false);
    toggleAuth(() => setModal({ type: "auth", payload: {} }));
  };

  const ensureAuth = (fn, options = {}) => {
    if (isAuth) return fn();
    const returnTo = options.returnTo || null;
    setAuthMode("signin");
    setAuthError("");
    setShowAuthPassword(false);
    setModal({ type: "auth", payload: returnTo ? { returnTo, fromDetail: Boolean(options.fromDetail) } : {} });
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    if (authPending) return;

    const fd = new FormData(event.currentTarget);
    const rawPhone = String(fd.get("phone") || "").trim();
    const signInPhone = formatPhoneValueCompact(rawPhone, { allowEmpty: true });
    const phone = signInPhone;
    const name = String(fd.get("name") || "").trim();
    const password = String(fd.get("password") || "");
    const isValidPhone = /^\+7\(\d{3}\)\d{3}-\d{2}-\d{2}$/.test(signInPhone);

    if (!password) {
      setAuthError("Введите пароль");
      return;
    }

    if (authMode === "signin" && !signInPhone) {
      setAuthError("Введите телефон");
      return;
    }
    if (authMode === "signin" && !isValidPhone) {
      setAuthError("Введите телефон в формате +7(XXX)XXX-XX-XX");
      return;
    }

    if (authMode === "signup") {
      if (!name) {
        setAuthError("Введите имя");
        return;
      }
      if (!phone) {
        setAuthError("Введите телефон");
        return;
      }
      if (!isValidPhone) {
        setAuthError("Введите телефон в формате +7(XXX)XXX-XX-XX");
        return;
      }
    }

    setAuthPending(true);
    setAuthError("");
    try {
      const response = authMode === "signup"
        ? await registerRequest({
          name,
          phone: phone || undefined,
          password,
        })
        : await signInRequest({
          phone: signInPhone,
          password,
        });

      if (!response?.sessionToken || !response?.account) {
        throw new Error("Некорректный ответ сервера");
      }

      localStorage.setItem(
        AUTH_SESSION_STORAGE_KEY,
        JSON.stringify({ sessionToken: response.sessionToken })
      );
      applyAuthSession({
        sessionToken: response.sessionToken,
        account: response.account,
      });

      if (modal?.payload?.returnTo) {
        setModal(modal.payload.returnTo);
      } else {
        setModal(null);
      }
    } catch (error) {
      setAuthError(error?.message || "Ошибка авторизации");
    } finally {
      setAuthPending(false);
    }
  };

  const toggleFavorite = (id) => {
    ensureAuth(async () => {
      const accountId = toAccountId(authSession?.accountId);
      if (accountId === null || !id) return;
      try {
        if (id.startsWith("ad-") || id.startsWith("service-")) {
          const listingId = Number(id.split("-")[1]);
          if (!listingId) return;
          const result = await toggleListingFavoriteRequest({ accountId, listingId });
          setFavorites((prev) => {
            const next = new Set(prev);
            if (result?.isFavorite) next.add(id);
            else next.delete(id);
            return next;
          });
        } else if (id.startsWith("taxi-")) {
          const taxiOfferId = Number(id.split("-")[1]);
          if (!taxiOfferId) return;
          const result = await toggleTaxiFavoriteRequest({ accountId, taxiOfferId });
          setFavorites((prev) => {
            const next = new Set(prev);
            if (result?.isFavorite) next.add(id);
            else next.delete(id);
            return next;
          });
        } else if (id.startsWith("food-")) {
          const menuItemId = Number(id.split("-")[1]);
          if (!menuItemId) return;
          const result = await toggleMenuItemFavoriteRequest({ accountId, menuItemId });
          setFavorites((prev) => {
            const next = new Set(prev);
            if (result?.isFavorite) next.add(id);
            else next.delete(id);
            return next;
          });
        }
      } catch {
        // ignore
      }
    });
  };

  const adsCatalog = useMemo(
    () => adsData.map((item) => ({ ...item, photos: normalizeFivePhotos(item?.photos) })),
    [adsData]
  );
  const myAds = useMemo(() => customAds, [customAds]);

  const adsItems = useMemo(() => {
    const category = adsCategoriesVisible.includes(adsCategory) ? adsCategory : "Все";
    const filtered = adsCatalog.filter(
      (x) => category === "Все" || x.category === category || (category === "Мои объявления" && currentOwner && x.owner === currentOwner)
    );
    return sortItems(filtered, adsSort, favorites);
  }, [adsCategoriesVisible, adsCategory, adsSort, favorites, currentOwner, adsCatalog]);

  const decorateWithFeedback = (item) => {
    const reviews = Array.isArray(feedbackByItem[item.id]) ? feedbackByItem[item.id] : [];
    const reviewsCount = Math.max(reviews.length, Number(item.reviewsCount) || 0);
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

  const servicesCatalog = useMemo(
    () => servicesData
      .map((item) => ({ ...item, photos: normalizeFivePhotos(item?.photos) }))
      .map((item) => decorateWithFeedback(item)),
    [feedbackByItem, servicesData]
  );

  const servicesItems = useMemo(
    () => sortItems(servicesCatalog.filter((x) => serviceCategory === "Все" || x.category === serviceCategory), servicesSort, favorites),
    [serviceCategory, servicesSort, favorites, servicesCatalog]
  );
  const normalizedUserRestaurantDishes = useMemo(
    () => (Array.isArray(userRestaurantDishes) ? userRestaurantDishes : []).map((dish) => normalizeDish(dish)),
    [userRestaurantDishes]
  );
  const foodCatalog = useMemo(
    () => foodData.map((dish) => normalizeDish(dish)),
    [foodData]
  );

  const foodRestaurants = useMemo(() => {
    const buckets = new Map();
    foodCatalog.forEach((dish) => {
      const restaurantKey = String(dish.restaurantId || dish.restaurant || "").trim() || "restaurant-unknown";
      if (!buckets.has(restaurantKey)) buckets.set(restaurantKey, []);
      buckets.get(restaurantKey).push(dish);
    });

    const fromFood = [...buckets.entries()].map(([restaurantKey, dishes]) => {
      const restaurantTitle = String(dishes[0]?.restaurant || "").trim() || "Без названия заведения";
      const contacts = dishes.reduce((acc, dish) => {
        const nextContacts = dish.contacts || {};
        if (!acc.phone && nextContacts.phone) acc.phone = nextContacts.phone;
        if (!acc.wa && nextContacts.wa) acc.wa = nextContacts.wa;
        if (!acc.tg && nextContacts.tg) acc.tg = nextContacts.tg;
        return acc;
      }, {});
      const id = String(restaurantKey).startsWith("restaurant-") ? restaurantKey : buildRestaurantId(restaurantTitle);
      const reviews = Array.isArray(feedbackByItem[id]) ? feedbackByItem[id] : [];
      const categories = [...new Set(dishes.map((x) => x.category).filter(Boolean))];

      return {
        id,
        title: restaurantTitle,
        desc: categories.length ? `Кухня: ${categories.join(", ")}` : "Описание заведения не указано.",
        address: String(dishes[0]?.restaurantAddress || "").trim(),
        logo: String(dishes[0]?.restaurantLogo || "").trim(),
        deliveryMode: dishes.some((x) => x.delivery) ? "free" : "none",
        deliveryPrice: 0,
        contacts,
        photos: [...new Set(dishes.flatMap((x) => (Array.isArray(x.photos) ? x.photos : [])))].slice(0, 1),
        dishes,
        reviews,
        reviewsCount: reviews.length,
        ratingValue: getFeedbackRating(reviews),
      };
    });

    if (hasRestaurant && restaurantEntity) {
      const ownRestaurantId = restaurantEntity?.id || "restaurant-own";
      const ownReviews = Array.isArray(feedbackByItem[ownRestaurantId]) ? feedbackByItem[ownRestaurantId] : [];
      const ownDishes = normalizedUserRestaurantDishes;
      const ownRestaurantCard = {
        id: ownRestaurantId,
        title: restaurantEntity.title || "Моё заведение",
        desc: restaurantEntity.desc || "",
        address: restaurantEntity.address || "",
        deliveryMode: restaurantEntity.deliveryMode || "none",
        deliveryPrice: Number(restaurantEntity.deliveryPrice) || 0,
        logo: String(restaurantEntity.logo || "").trim(),
        contacts: {
          ...(restaurantEntity.phone ? { phone: restaurantEntity.phone } : {}),
          ...(restaurantEntity.telegram ? { tg: restaurantEntity.telegram } : {}),
          ...(restaurantEntity.whatsapp ? { wa: restaurantEntity.whatsapp } : {}),
        },
        photos: normalizeSinglePhoto(restaurantEntity.photos),
        dishes: ownDishes,
        reviews: ownReviews,
        reviewsCount: ownReviews.length,
        ratingValue: getFeedbackRating(ownReviews),
      };
      const existingIdx = fromFood.findIndex((x) => x.id === ownRestaurantId);
      if (existingIdx >= 0) fromFood[existingIdx] = ownRestaurantCard;
      else fromFood.unshift(ownRestaurantCard);
    }

    return fromFood;
  }, [hasRestaurant, restaurantEntity, feedbackByItem, normalizedUserRestaurantDishes, foodCatalog]);

  const visibleFoodRestaurants = useMemo(
    () => foodRestaurants
      .map((restaurant) => ({
        ...restaurant,
        dishes: restaurant.dishes.filter((dish) => foodCategory === "Все" || dish.category === foodCategory),
      }))
      .filter((restaurant) => restaurant.dishes.length > 0 || (foodCategory === "Все" && restaurant.id === restaurantEntity?.id)),
    [foodRestaurants, foodCategory, restaurantEntity?.id]
  );

  const normalizedCustomTaxiItems = useMemo(
    () => taxiData.map((item) => normalizeEntityPhotos(item)),
    [taxiData]
  );
  const normalizedTaxiTemplates = useMemo(
    () => taxiTemplates.map((item) => normalizeEntityPhotos(item)),
    [taxiTemplates]
  );

  const { taxiCatalog, taxiItems } = useTaxiCatalog({
    customTaxiItems: normalizedCustomTaxiItems,
    taxiTemplates: normalizedTaxiTemplates,
    mockTaxi: [],
    feedbackByItem,
    decorateWithFeedback,
    taxiRequestedAt,
    setTaxiRequestedAt,
    taxiCategory,
    taxiSort,
    favorites,
  });

  const openDetail = (type, id) => {
    if (type === "restaurant") {
      if (!id) return;
      const restaurant = foodRestaurants.find((entry) => entry.id === id);
      if (!restaurant) return;
      setModal({ type: "detail", payload: { type: "restaurant", id: restaurant.id } });
      return;
    }
    const source = type === "ads"
      ? adsCatalog
      : type === "services"
        ? servicesCatalog
        : type === "food"
          ? foodCatalog
          : taxiCatalog;
    const item = source.find((x) => x.id === id);
    if (!item) return;
    setModal({ type: "detail", payload: { type, id } });
  };

  const openBusinessDetail = (type, id, group) => {
    if (!id) return;
    setModal({
      type: "detail",
      payload: {
        type,
        id,
        fromBusiness: true,
        returnTo: group ? { type: "entityGroup", payload: { group } } : null,
      },
    });
  };

  const openCreate = (type, options = {}) => ensureAuth(() => {
    const fallbackReturnTo = modal ? { type: modal.type, payload: modal.payload } : null;
    setModal({
      type: "create",
      payload: {
        type,
        ...(options.returnTo ? { returnTo: options.returnTo } : fallbackReturnTo ? { returnTo: fallbackReturnTo } : {}),
      },
    });
  });
  const openEditEntity = (payload) => ensureAuth(() => {
    const fallbackReturnTo = modal ? { type: modal.type, payload: modal.payload } : null;
    setModal({
      type: "editEntity",
      payload: {
        ...payload,
        ...(payload?.returnTo ? {} : fallbackReturnTo ? { returnTo: fallbackReturnTo } : {}),
      },
    });
  });
  const openEntityGroup = (group) => ensureAuth(() => setModal({ type: "entityGroup", payload: { group } }));
  const openEditProfile = () => ensureAuth(() => {
    const fallbackReturnTo = modal ? { type: modal.type, payload: modal.payload } : null;
    setModal({
      type: "profileEdit",
      payload: {
        ...profile,
        ...(fallbackReturnTo ? { returnTo: fallbackReturnTo } : {}),
      },
    });
  });
  const createType = modal?.type === "create" || modal?.type === "editEntity" ? modal.payload?.type : null;
  const fullScreenCreate = createType === "ad" || createType === "service" || createType === "taxi" || createType === "restaurant";
  const fullScreenModal = modal?.type === "detail" || modal?.type === "profileEdit" || modal?.type === "entityGroup" || fullScreenCreate;
  const blockAuthBackdropClose = modal?.type === "auth" && Boolean(modal?.payload?.returnTo);

  const submitMock = async (event, type) => {
    event.preventDefault();
    if (submitPending) return;
    const fd = new FormData(event.currentTarget);
    const payload = {};

    for (const [key, value] of fd.entries()) {
      if (value instanceof File) {
        if (!value.name) continue;
        if (!payload[key]) payload[key] = [];
        payload[key].push(value);
        continue;
      }
      if (key in payload) {
        if (Array.isArray(payload[key])) payload[key].push(value);
        else payload[key] = [payload[key], value];
      } else {
        payload[key] = value;
      }
    }

    const accountId = toAccountId(authSession?.accountId);
    const editEntityId = typeof payload.editEntityId === "string" ? payload.editEntityId : "";
    const editEntityKind = typeof payload.editEntityKind === "string" ? payload.editEntityKind : "";
    const isEdit = Boolean(editEntityId || editEntityKind === "restaurant");
    const uploadPhotos = async (key, limit, entityType) => {
      const files = toArray(payload[key]).filter((value) => value instanceof File).slice(0, limit);
      if (!files.length) return [];
      return uploadImagesToS3({
        files,
        accountId,
        entityType,
      });
    };

    if (accountId === null) return;

    try {
      setSubmitPending(true);
      if (type === "restaurant") {
        const parseRestaurantIdFromString = (value) => {
          if (typeof value !== "string") return null;
          const parsed = Number(value.replace("restaurant-", ""));
          return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
        };
        const modalReturnRestaurantId = parseRestaurantIdFromString(modal?.payload?.returnTo?.payload?.id);
        const editRestaurantId = parseRestaurantIdFromString(editEntityId);
        const currentRestaurantId = toAccountId(restaurantEntity?.restaurantId);
        const restaurantIdForUpdate = editRestaurantId || currentRestaurantId || modalReturnRestaurantId;
        const uploadedLogo = await uploadPhotos("logo", 1, "restaurant");
        const logo = uploadedLogo[0] || String(restaurantEntity?.logo || "").trim() || undefined;
        const restaurantResponse = await createOrUpdateRestaurantRequest({
          accountId,
          ...(isEdit && restaurantIdForUpdate ? { restaurantId: restaurantIdForUpdate } : {}),
          name: payload.title || "Моё заведение",
          address: payload.address || "",
          description: payload.desc || "",
          logoUrl: logo,
          phone: payload.phone || undefined,
          telegram: payload.telegram || undefined,
          whatsapp: payload.whatsapp || undefined,
        });
        await refreshMyData();
        await refreshCatalog();

        if (isEdit) {
          const savedRestaurantId = toAccountId(restaurantResponse?.restaurantId) || restaurantIdForUpdate;
          if (savedRestaurantId) {
            setModal({
              type: "detail",
              payload: {
                type: "restaurant",
                id: `restaurant-${savedRestaurantId}`,
                fromBusiness: true,
                returnTo: { type: "entityGroup", payload: { group: "restaurant" } },
              },
            });
            return;
          }
        }
      }

      if (type === "ad" || type === "service") {
        const uploadedListingPhotos = await uploadPhotos("images", 5, "listing");
        const kind = type === "ad" ? 1 : 2;
        if (isEdit) {
          const listingId = Number(String(editEntityId).split("-")[1]);
          if (!listingId) throw new Error("Некорректный идентификатор объявления/услуги");
          const currentItem = (type === "ad" ? customAds : customServices).find((x) => x.id === editEntityId);
          await updateListingRequest({
            accountId,
            listingId,
            kind,
            category: payload.category || currentItem?.category || "Другое",
            title: payload.title || currentItem?.title || (type === "ad" ? "Объявление" : "Услуга"),
            description: payload.desc || currentItem?.desc || "",
            price: Number(payload.price) || Number(currentItem?.price) || 1,
            photos: uploadedListingPhotos.length ? uploadedListingPhotos : normalizeFivePhotos(currentItem?.photos),
          });
        } else {
          await createListingRequest({
            accountId,
            kind,
            category: payload.category || "Другое",
            title: payload.title || (type === "ad" ? "Объявление" : "Услуга"),
            description: payload.desc || "",
            price: Number(payload.price) || 1,
            photos: uploadedListingPhotos,
          });
        }
        await refreshMyData();
        await refreshCatalog();
      }

      if (type === "dish") {
        const photos = await uploadPhotos("images", 1, "dish");
        if (isEdit && editEntityId && editEntityKind === "dish") {
          const menuItemId = Number(String(editEntityId).split("-").pop());
          if (!menuItemId) throw new Error("Некорректный идентификатор блюда");
          const currentDish = userRestaurantDishes.find((x) => x.id === editEntityId);
          await updateMenuItemRequest({
            accountId,
            menuItemId,
            category: payload.category || currentDish?.category || "Другое",
            name: payload.title || currentDish?.title || "Блюдо",
            description: payload.desc || currentDish?.desc || "",
            cookTimeMinutes: Number(currentDish?.prep) || 25,
            alwaysInStock: Boolean(currentDish?.always),
            price: Number(payload.price) || Number(currentDish?.price) || 1,
            hasDelivery: Boolean(currentDish?.delivery),
            isAvailable: !Boolean(currentDish?.unavailable),
            photos: photos.length ? photos : normalizeSinglePhoto(currentDish?.photos),
          });
        } else {
          await createMenuItemRequest({
            accountId,
            category: payload.category || "Другое",
            name: payload.title || "Новое блюдо",
            description: payload.desc || "",
            cookTimeMinutes: 25,
            alwaysInStock: true,
            price: Number(payload.price) || 1,
            hasDelivery: Boolean(restaurantEntity && restaurantEntity.deliveryMode !== "none"),
            isAvailable: true,
            photos,
          });
        }
        await refreshMyData();
        await refreshCatalog();
      }

      if (type === "profile") {
      await createOrUpdateAccountRequest({
        accountId,
        name: payload.name || profile.name || "Пользователь",
        phone: payload.phone || null,
        telegram: payload.telegram || null,
        whatsapp: payload.whatsapp || null,
      });
        setProfile((prev) => ({
          ...prev,
          name: payload.name || "-",
          phone: payload.phone || "-",
          telegram: payload.telegram || "-",
          whatsapp: payload.whatsapp || "-",
          about: payload.about || "-",
        }));
        await refreshCatalog();
      }

      if (type === "taxi") {
        if (isEdit && editEntityKind === "taxi-template") {
          throw new Error("Редактирование шаблонов такси не поддерживается бэкендом");
        }
        const uploadedTaxiPhotos = await uploadPhotos("images", 1, "taxi");
        const categories = toArray(payload.category).filter(Boolean);
        const category = categories[0];
        const direction = TAXI_CATEGORY_TO_DIRECTION[category];
        if (!direction) throw new Error("Выберите направление");
        const seatsValue = Number(payload.seats);
        const seats = Number.isFinite(seatsValue) && seatsValue > 0 ? seatsValue : undefined;
        if (isEdit && editEntityKind === "taxi-one-time") {
          const taxiOfferId = Number(String(editEntityId).split("-")[1]);
          if (!taxiOfferId) throw new Error("Некорректный идентификатор поездки");
          const currentTaxi = customTaxiItems.find((x) => x.id === editEntityId);
          await updateTaxiOfferRequest({
            accountId,
            taxiOfferId,
            direction,
            displayName: payload.name || currentTaxi?.name || "Водитель",
            description: payload.desc || currentTaxi?.desc || "",
            phone: payload.phone || currentTaxi?.contacts?.phone,
            whatsapp: payload.wa || currentTaxi?.contacts?.wa || undefined,
            telegram: payload.tg || currentTaxi?.contacts?.tg || undefined,
            price: Number(payload.price) || Number(currentTaxi?.price) || 1,
            departureAt: payload.when || currentTaxi?.when || undefined,
            seatsTotal: seats,
            seatsFree: seats,
            carPhotos: uploadedTaxiPhotos.length ? uploadedTaxiPhotos : normalizeSinglePhoto(currentTaxi?.photos),
          });
        } else {
          await createTaxiOfferRequest({
            accountId,
            direction,
            displayName: payload.name || "Водитель",
            description: payload.desc || "",
            phone: payload.phone,
            whatsapp: payload.wa || undefined,
            telegram: payload.tg || undefined,
            price: Number(payload.price) || 1,
            departureAt: payload.when || undefined,
            seatsTotal: seats,
            seatsFree: seats,
            carPhotos: uploadedTaxiPhotos,
          });
        }
        await refreshMyData();
        await refreshCatalog();
      }

      if (modal?.payload?.returnTo) {
        setModal(modal.payload.returnTo);
        return;
      }
      setModal(null);
    } catch (error) {
      alert(error?.message || "Не удалось сохранить данные");
    } finally {
      setSubmitPending(false);
    }
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
  const editDish = (id) => openEditEntity({ type: "dish", id, kind: "dish" });
  const removeDish = (id) => {
    const targetDish = userRestaurantDishes.find((dish) => dish.id === id);
    if (!targetDish) return;
    const dishTitle = String(targetDish.title || "Блюдо").trim();

    const fallbackReturnTo = {
      type: "detail",
      payload: {
        type: "restaurant",
        id: restaurantEntity?.id,
        fromBusiness: true,
        returnTo: { type: "entityGroup", payload: { group: "restaurant" } },
      },
    };
    const returnTo = modal?.type === "detail" && modal?.payload?.returnTo ? modal.payload.returnTo : fallbackReturnTo;

    setModal({
      type: "confirmDishDelete",
      payload: {
        dishId: id,
        dishTitle,
        returnTo,
      },
    });
  };

  const confirmRemoveDish = async () => {
    if (modal?.type !== "confirmDishDelete") return;
    const dishId = modal?.payload?.dishId;
    if (!dishId) {
      closeModal();
      return;
    }
    const accountId = toAccountId(authSession?.accountId);
    const menuItemId = Number(String(dishId).split("-").pop());
    if (accountId !== null && menuItemId) {
      await deleteMenuItemRequest({ accountId, menuItemId });
      await refreshMyData();
      await refreshCatalog();
    }
    if (modal?.payload?.returnTo) {
      setModal(modal.payload.returnTo);
      return;
    }
    setModal(null);
  };
  const toggleDishAvailability = async (id) => {
    const accountId = toAccountId(authSession?.accountId);
    const menuItemId = Number(String(id).split("-").pop());
    const dish = userRestaurantDishes.find((x) => x.id === id);
    if (accountId === null || !menuItemId || !dish) return;
    await updateMenuItemRequest({
      accountId,
      menuItemId,
      category: dish.category,
      name: dish.title,
      description: dish.desc || "",
      cookTimeMinutes: Number(dish.prep) || 25,
      alwaysInStock: Boolean(dish.always),
      price: Number(dish.price) || 1,
      hasDelivery: Boolean(dish.delivery),
      isAvailable: Boolean(dish.unavailable),
      photos: normalizeSinglePhoto(dish.photos),
    });
    await refreshMyData();
    await refreshCatalog();
  };

  const editRestaurant = () => openEditEntity({ type: "restaurant", kind: "restaurant" });
  const viewRestaurant = () => {
    if (!restaurantEntity?.id) return;
    openBusinessDetail("restaurant", restaurantEntity.id, "restaurant");
  };
  const viewTaxiTemplate = (id) => {
    if (!id) return;
    setModal({
      type: "detail",
      payload: {
        type: "taxi",
        id: `template-preview-${id}`,
        fromBusiness: true,
        returnTo: { type: "entityGroup", payload: { group: "taxi" } },
      },
    });
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
    if (modal?.payload?.returnTo) {
      setModal(modal.payload.returnTo);
      return;
    }
    setModal(null);
  };

  const detailData = useMemo(() => {
    if (modal?.type !== "detail") return null;
    const detailType = modal.payload?.type;
    const detailId = modal.payload?.id;
    if (detailType === "restaurant") {
      const restaurant = foodRestaurants.find((entry) => entry.id === detailId);
      if (!restaurant) return null;
      return { type: "restaurant", item: restaurant };
    }
    const source = detailType === "ads"
      ? adsCatalog
      : detailType === "services"
        ? servicesCatalog
        : detailType === "food"
          ? foodCatalog
          : taxiCatalog;
    const item = source.find((x) => x.id === detailId);
    if (!item && detailType === "taxi" && typeof detailId === "string" && detailId.startsWith("template-preview-")) {
      const templateId = detailId.slice("template-preview-".length);
      const template = normalizedTaxiTemplates.find((x) => x.id === templateId);
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
  }, [modal, adsCatalog, servicesCatalog, foodCatalog, taxiCatalog, normalizedTaxiTemplates, foodRestaurants]);

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
        editMeta: { id: restaurantEntity?.id, kind: editKind || "restaurant" },
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

    if (editType === "dish") {
      const item = userRestaurantDishes.find((x) => x.id === editId);
      if (!item) return null;
      return {
        type: "dish",
        initialValues: item,
        editMeta: { id: item.id, kind: editKind || "dish" },
      };
    }

    if (editType === "taxi") {
      if (editKind === "taxi-template") {
        const item = normalizedTaxiTemplates.find((x) => x.id === editId);
        if (!item) return null;
        return {
          type: "taxi",
          initialValues: { ...item, mode: "recurring", categories: [item.category] },
          editMeta: { id: item.id, kind: "taxi-template" },
        };
      }
      const item = normalizedCustomTaxiItems.find((x) => x.id === editId);
      if (!item) return null;
      return {
        type: "taxi",
        initialValues: { ...item, mode: "one-time", categories: [item.category] },
        editMeta: { id: item.id, kind: "taxi-one-time" },
      };
    }

    return null;
  }, [modal, restaurantEntity, customServices, customAds, normalizedTaxiTemplates, normalizedCustomTaxiItems, userRestaurantDishes]);

  const entityGroupData = useMemo(() => {
    if (modal?.type !== "entityGroup") return null;
    const group = modal.payload?.group;
    if (group === "restaurant") {
      return { title: "Мои заведения", items: hasRestaurant && restaurantEntity ? [restaurantEntity] : [] };
    }
    if (group === "ads") {
      return { title: "Мои объявления", items: myAds };
    }
    if (group === "services") {
      return { title: "Мои услуги", items: customServices };
    }
    if (group === "taxi") {
      return {
        title: "Моё такси",
        items: {
          oneTime: normalizedCustomTaxiItems.filter((x) => x.mode === "one-time" && x.category !== "Такси по Цхинвалу"),
          regular: normalizedTaxiTemplates,
        },
      };
    }
    return null;
  }, [modal, hasRestaurant, restaurantEntity, myAds, customServices, normalizedCustomTaxiItems, normalizedTaxiTemplates]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <h1>{tab === "profile" ? profile.name : "ircom"}</h1>
        </div>
        <div className="topbar-actions">
          <span className="topbar-status">{isAuth ? "Онлайн" : "Гость"}</span>
          <button className="ghost-btn topbar-auth-btn" onClick={toggleAuthModal} type="button">
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
            serviceCategories={SERVICE_CATEGORIES}
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
            taxiCategories={TAXI_CATEGORIES}
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
            restaurants={visibleFoodRestaurants}
            foodCategories={FOOD_CATEGORIES}
            isAuth={isAuth}
            hasRestaurant={hasRestaurant}
            openCreate={openCreate}
            openEntityGroup={openEntityGroup}
            openDetail={openDetail}
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
            toggleAuth={toggleAuthModal}
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
            <p className="small">Войдите по телефону и паролю, либо создайте новый аккаунт.</p>
            <div className="multi-select-buttons" style={{ marginTop: 8 }}>
              <button
                type="button"
                className={`multi-select-btn ${authMode === "signin" ? "active" : ""}`}
                onClick={() => {
                  setAuthMode("signin");
                  setAuthError("");
                  setShowAuthPassword(false);
                }}
                aria-pressed={authMode === "signin"}
              >
                Вход
              </button>
              <button
                type="button"
                className={`multi-select-btn ${authMode === "signup" ? "active" : ""}`}
                onClick={() => {
                  setAuthMode("signup");
                  setAuthError("");
                  setShowAuthPassword(false);
                }}
                aria-pressed={authMode === "signup"}
              >
                Регистрация
              </button>
            </div>
            <form className="list" style={{ marginTop: 10 }} onSubmit={handleAuthSubmit}>
              {authMode === "signin" && (
                <label className="field">
                  <span className="small">Телефон</span>
                  <input
                    required
                    name="phone"
                    className="input"
                    placeholder={PHONE_COMPACT_PLACEHOLDER}
                    pattern={PHONE_COMPACT_PATTERN}
                    autoComplete="tel"
                    onInput={(e) => handlePhoneInputCompact(e, { allowEmpty: true })}
                    onFocus={syncPhonePrev}
                  />
                </label>
              )}

              {authMode === "signup" && (
                <>
                  <label className="field">
                    <span className="small">Имя</span>
                    <input
                      required
                      name="name"
                      className="input"
                      minLength={2}
                      maxLength={80}
                      placeholder="Ваше имя"
                      autoComplete="name"
                    />
                  </label>
                  <label className="field">
                    <span className="small">Телефон</span>
                    <input
                      required
                      name="phone"
                      className="input"
                      placeholder={PHONE_COMPACT_PLACEHOLDER}
                      pattern={PHONE_COMPACT_PATTERN}
                      autoComplete="tel"
                      onInput={(e) => handlePhoneInputCompact(e, { allowEmpty: true })}
                      onFocus={syncPhonePrev}
                    />
                  </label>
                </>
              )}

              <label className="field">
                <span className="small">Пароль</span>
                <div className="password-input-wrap">
                  <input
                    required
                    type={showAuthPassword ? "text" : "password"}
                    name="password"
                    className="input password-input"
                    minLength={6}
                    maxLength={128}
                    autoComplete={authMode === "signin" ? "current-password" : "new-password"}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowAuthPassword((v) => !v)}
                    aria-label={showAuthPassword ? "Скрыть пароль" : "Показать пароль"}
                    aria-pressed={showAuthPassword}
                  >
                    {showAuthPassword ? <EyeOff className="icon" aria-hidden="true" /> : <Eye className="icon" aria-hidden="true" />}
                  </button>
                </div>
              </label>

              {authError ? <p className="small" style={{ color: "#c62828", marginTop: 6 }}>{authError}</p> : null}

              <div className="actions" style={{ marginTop: 8 }}>
                <button className="primary-btn" type="submit" disabled={authPending}>
                  {authPending ? "Отправка..." : authMode === "signin" ? "Войти" : "Зарегистрироваться"}
                </button>
                <button className="ghost-btn" type="button" onClick={closeModal} disabled={authPending}>Отмена</button>
              </div>
            </form>
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
            onOpenDish={(dishId, restaurantId) => {
              if (!dishId) return;
              setModal({
                type: "detail",
                payload: {
                  type: "food",
                  id: dishId,
                  fromBusiness: Boolean(modal?.payload?.fromBusiness),
                  returnTo: restaurantId
                    ? {
                      type: "detail",
                      payload: {
                        type: "restaurant",
                        id: restaurantId,
                        fromBusiness: Boolean(modal?.payload?.fromBusiness),
                        returnTo: modal?.payload?.returnTo || null,
                      },
                    }
                    : null,
                },
              });
            }}
            onEdit={
              (modal?.payload?.fromBusiness
                || (detailData.type === "restaurant" && detailData.item.id === restaurantEntity?.id))
                ? () => {
                  if (detailData.type === "restaurant") {
                    editRestaurant();
                    return;
                  }
                  if (detailData.type === "ads") {
                    editAd(detailData.item.id);
                    return;
                  }
                  if (detailData.type === "services") {
                    editService(detailData.item.id);
                    return;
                  }
                  if (detailData.type === "food") {
                    editDish(detailData.item.id);
                    return;
                  }
                  if (detailData.type === "taxi") {
                    if (typeof detailData.item.id === "string" && detailData.item.id.startsWith("template-preview-")) {
                      editTemplate(detailData.item.id.slice("template-preview-".length));
                    } else {
                      editTaxiOffer(detailData.item.id);
                    }
                  }
                }
                : null
            }
            onAddDish={detailData.type === "restaurant" && detailData.item.id === restaurantEntity?.id ? () => openCreate("dish") : null}
            onEditDish={
              (detailData.type === "restaurant" && detailData.item.id === restaurantEntity?.id)
              || (detailData.type === "food" && userRestaurantDishes.some((dish) => dish.id === detailData.item.id))
                ? editDish
                : null
            }
            onDeleteDish={
              (detailData.type === "restaurant" && detailData.item.id === restaurantEntity?.id)
              || (detailData.type === "food" && userRestaurantDishes.some((dish) => dish.id === detailData.item.id))
                ? removeDish
                : null
            }
            onToggleDishAvailability={
              (detailData.type === "restaurant" && detailData.item.id === restaurantEntity?.id)
              || (detailData.type === "food" && userRestaurantDishes.some((dish) => dish.id === detailData.item.id))
                ? toggleDishAvailability
                : null
            }
            isOwnerView={Boolean(modal?.payload?.fromBusiness)}
          />
        )}

        {modal?.type === "confirmDishDelete" && (
          <>
            <h3>Удалить блюдо?</h3>
            <p className="small">
              Блюдо «{modal?.payload?.dishTitle || "Без названия"}» будет удалено без возможности восстановления.
            </p>
            <div className="actions" style={{ marginTop: 8 }}>
              <button className="danger-btn" type="button" onClick={confirmRemoveDish}>Удалить</button>
              <button className="ghost-btn" type="button" onClick={closeModal}>Отмена</button>
            </div>
          </>
        )}

        {modal?.type === "create" && (
          <CreateForm
            type={modal.payload.type}
            initialValues={createInitialValues}
            onSubmit={submitMock}
            onClose={closeModal}
            submitPending={submitPending}
            taxiCategories={TAXI_CATEGORIES}
            adsCategories={ADS_CATEGORIES}
            serviceCategories={SERVICE_CATEGORIES}
            foodCategories={FOOD_CATEGORIES}
          />
        )}

        {modal?.type === "editEntity" && editEntityData && (
          <CreateForm
            type={editEntityData.type}
            mode="edit"
            initialValues={editEntityData.initialValues}
            editMeta={editEntityData.editMeta}
            onSubmit={submitMock}
            onClose={closeModal}
            submitPending={submitPending}
            taxiCategories={TAXI_CATEGORIES}
            adsCategories={ADS_CATEGORIES}
            serviceCategories={SERVICE_CATEGORIES}
            foodCategories={FOOD_CATEGORIES}
          />
        )}

        {modal?.type === "entityGroup" && entityGroupData && (
          <EntityGroupModalContent
            group={modal.payload?.group}
            entityGroupData={entityGroupData}
            onOpenRestaurant={viewRestaurant}
            onOpenAd={(id) => openBusinessDetail("ads", id, "ads")}
            onOpenService={(id) => openBusinessDetail("services", id, "services")}
            onOpenTaxi={(id) => openBusinessDetail("taxi", id, "taxi")}
            onToggleTaxiFilled={toggleTaxiFilled}
            onOpenTaxiTemplate={viewTaxiTemplate}
            onSetTemplateStatus={setTemplateStatus}
            onRemoveTemplate={removeTemplate}
          />
        )}

        {modal?.type === "profileEdit" && <ProfileEditForm profile={profile} onSubmit={submitMock} onClose={closeModal} />}
      </Modal>
    </div>
  );
}
