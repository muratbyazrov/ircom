import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {X} from 'lucide-react';
import {AuthModalContent, CreateForm, DetailModalContent, ProfileEditForm} from './components/modals';
import {EntityGroupModalContent} from './components/entity-group-modal-content';
import {Icon, Modal} from './components/ui';
import {useAuthState} from './hooks/use-auth-state';
import {useGestureGuard} from './hooks/use-gesture-guard';
import {useNavHistory} from './hooks/use-nav-history';
import {useTaxiCatalog} from './hooks/use-taxi-catalog';
import {useTelegramSetup} from './hooks/use-telegram-setup';
import {AdsTab, FoodTab, ProfileTab, ServicesTab, TaxiTab} from './sections/tabs';
import {
  createOrUpdateAccountRequest,
  getSessionRequest,
  registerRequest,
  signInRequest,
  signOutRequest,
  telegramAuthRequest,
} from './api/auth';
import {
  createListingRequest,
  deleteMyListingRequest,
  getListingsRequest,
  getMyListingsRequest,
  toggleListingFavoriteRequest,
  updateListingRequest,
} from './api/listing';
import {
  createTaxiOfferRequest,
  deleteTaxiOfferRequest,
  getMyTaxiOffersRequest,
  getTaxiOffersRequest,
  toggleTaxiFavoriteRequest,
  updateTaxiOfferRequest,
} from './api/taxi';
import {
  createMenuItemRequest,
  createOrUpdateRestaurantRequest,
  deleteMenuItemRequest,
  getMenuItemsRequest,
  getMyRestaurantRequest,
  getRestaurantsRequest,
  toggleMenuItemFavoriteRequest,
  updateMenuItemRequest,
} from './api/food';
import {getDictionariesRequest} from './api/dictionary';
import {deleteImagesFromS3, uploadImagesToS3} from './utils/s3-upload';
import {tabConfig} from './utils/constants';
import {sortItems} from './utils/helpers';
import {toTaxiDepartureAtApiValue} from './utils/taxi';
import {formatPhoneValueCompact} from './utils/phone';
import {LOGIN_MAX, LOGIN_MIN} from './utils/validation';

import {
  ADS_CATEGORIES,
  APP_HISTORY_KEY,
  AUTH_SESSION_STORAGE_KEY,
  FEEDBACK_STORAGE_KEY,
  FOOD_CATEGORIES,
  SERVICE_CATEGORIES,
  TAXI_CATEGORIES,
  TAXI_CITY_CATEGORY,
  TAXI_OUTBOUND_CATEGORY,
  buildTaxiRoutePayload,
  buildInitialFeedback,
  buildRestaurantId,
  getFeedbackRating,
  getRestaurantDeliveryMode,
  getRestaurantDeliveryPrice,
  mapListingToUi,
  mapMenuItemToUi,
  mapTaxiToUi,
  normalizeDish,
  normalizeEntityPhotos,
  normalizeFivePhotos,
  normalizePhotoReference,
  normalizeRating,
  normalizeSinglePhoto,
  profileValue,
  randomSuffix,
  toAccountId,
  toArray,
} from './utils/app-domain';

const normalizeDictionaryNames = (dictionaryList) => {
  return [...new Set(
    toArray(dictionaryList)
      .map((entry) => String(entry?.name || "").trim())
      .filter(Boolean)
  )];
};
const withAllCategory = (categories) => ["Все", ...categories.filter((item) => item !== "Все")];
const withMyAdsCategory = (categories) => categories.includes("Мои объявления") ? categories : [...categories, "Мои объявления"];
const SUPPORT_TELEGRAM_URL = "https://t.me/+Bqm7XK8ISl4yMmNi";
const TELEGRAM_AUTO_AUTH_DISABLED_KEY = "__ircomTelegramAutoAuthDisabled";
const SCROLL_TOP_VISIBILITY_OFFSET = 420;
const TAB_AUTO_REFRESH_STALE_MS = 30000;
const FULL_SCREEN_CREATE_TYPES = new Set(["ad", "service", "taxi", "restaurant"]);
const LIST_TABS = new Set(["ads", "services", "taxi", "food"]);
const buildModalSnapshot = (currentModal) => (
  currentModal ? { type: currentModal.type, payload: currentModal.payload } : null
);

const getModalReturnTarget = (currentModal) => currentModal?.payload?.returnTo || null;

export default function App() {
  const [tab, setTab] = useState("ads");
  const [favorites, setFavorites] = useState(new Set());
  const [adsCategories, setAdsCategories] = useState(ADS_CATEGORIES);
  const [serviceCategories, setServiceCategories] = useState(SERVICE_CATEGORIES);
  const [foodCategories, setFoodCategories] = useState(FOOD_CATEGORIES);
  const [adsCategory, setAdsCategory] = useState("Все");
  const [serviceCategory, setServiceCategory] = useState("Все");
  const [foodCategory, setFoodCategory] = useState("Все");
  const [taxiCategory, setTaxiCategory] = useState(TAXI_OUTBOUND_CATEGORY);
  const [adsSort, setAdsSort] = useState("date");
  const [servicesSort, setServicesSort] = useState("date");
  const [taxiSort, setTaxiSort] = useState("date");
  const [taxiRequestedAt, setTaxiRequestedAt] = useState("");
  const [feedbackByItem, setFeedbackByItem] = useState(() => buildInitialFeedback());
  const [modal, setModal] = useState(null);
  const [isDetailViewerOpen, setIsDetailViewerOpen] = useState(false);
  const [detailViewerCloseSignal, setDetailViewerCloseSignal] = useState(0);
  const [authMode, setAuthMode] = useState("signin");
  const [authPending, setAuthPending] = useState(false);
  const [authError, setAuthError] = useState("");
  const [submitPending, setSubmitPending] = useState(false);
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [authBootstrapDone, setAuthBootstrapDone] = useState(false);
  const [signInPhoneValue, setSignInPhoneValue] = useState("");
  const [signInLoginValue, setSignInLoginValue] = useState("");
  const [signInMethod, setSignInMethod] = useState("phone");
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);
  const [isListRefreshing, setIsListRefreshing] = useState(false);
  const [showScrollTopButton, setShowScrollTopButton] = useState(false);
  const [adsData, setAdsData] = useState([]);
  const [servicesData, setServicesData] = useState([]);
  const [taxiData, setTaxiData] = useState([]);
  const [foodData, setFoodData] = useState([]);
  const screenRef = useRef(null);
  const scrollTopButtonVisibleRef = useRef(false);
  const lastCatalogRefreshAtRef = useRef(0);
  const listRefreshPromiseRef = useRef(null);
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
    isTaxiDriver,
    setIsTaxiDriver,
    toggleAuth,
    applyAuthSession,
  } = useAuthState();

  const adsCategoriesVisible = useMemo(
    () => (isAuth ? adsCategories : adsCategories.filter((x) => x !== "Мои объявления")),
    [isAuth, adsCategories]
  );
  const { telegramWebApp, telegramInitData, isTelegramMiniApp } = useTelegramSetup();
  const openSupport = useCallback(() => {
    const tg = window.Telegram?.WebApp;
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(SUPPORT_TELEGRAM_URL);
      return;
    }
    window.open(SUPPORT_TELEGRAM_URL, "_blank", "noopener,noreferrer");
  }, []);

  const showActionError = useCallback((error, fallbackMessage) => {
    alert(error?.message || fallbackMessage);
  }, []);

  const closeMiniApp = useCallback(() => {
    const tg = window.Telegram?.WebApp;
    if (tg?.close) {
      tg.close();
      return;
    }

    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    window.close();
  }, []);

  const resetSignInFields = useCallback(() => {
    setSignInPhoneValue("");
    setSignInLoginValue("");
    setSignInMethod("phone");
  }, []);

  const isTelegramAutoAuthDisabled = useCallback(() => {
    try {
      return sessionStorage.getItem(TELEGRAM_AUTO_AUTH_DISABLED_KEY) === "1";
    } catch {
      return false;
    }
  }, []);

  const disableTelegramAutoAuth = useCallback(() => {
    try {
      sessionStorage.setItem(TELEGRAM_AUTO_AUTH_DISABLED_KEY, "1");
    } catch {
      // ignore storage errors
    }
  }, []);

  const enableTelegramAutoAuth = useCallback(() => {
    try {
      sessionStorage.removeItem(TELEGRAM_AUTO_AUTH_DISABLED_KEY);
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const rawSession = localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    if (!rawSession) {
      setAuthBootstrapDone(true);
      return undefined;
    }

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
      } finally {
        if (isMounted) {
          setAuthBootstrapDone(true);
        }
      }
    };

    restore();
    return () => {
      isMounted = false;
    };
  }, [applyAuthSession]);

  useEffect(() => {
    if (!authBootstrapDone || isAuth) return undefined;
    if (localStorage.getItem(AUTH_SESSION_STORAGE_KEY)) return undefined;
    if (isTelegramAutoAuthDisabled()) return undefined;

    const tg = isTelegramMiniApp ? telegramWebApp : null;
    if (!tg || !telegramInitData) return undefined;

    let isMounted = true;

    const runTelegramAuth = async () => {
      setAuthPending(true);
      setAuthError("");
      try {
        const response = await telegramAuthRequest({ initData: telegramInitData });
        if (!isMounted || !response?.sessionToken || !response?.account) return;

        localStorage.setItem(
          AUTH_SESSION_STORAGE_KEY,
          JSON.stringify({ sessionToken: response.sessionToken })
        );
        applyAuthSession({
          sessionToken: response.sessionToken,
          account: response.account,
        });
      } catch (error) {
        // Keep guest fallback, but log the reason so prod issues are debuggable.
        console.error("Telegram auto-auth failed", error);
      } finally {
        if (isMounted) {
          setAuthPending(false);
        }
      }
    };

    runTelegramAuth();

    return () => {
      isMounted = false;
    };
  }, [authBootstrapDone, isAuth, applyAuthSession, isTelegramAutoAuthDisabled, telegramWebApp, telegramInitData, isTelegramMiniApp]);

  useEffect(() => {
    setIsTaxiDriver(customTaxiItems.length > 0);
  }, [customTaxiItems.length, setIsTaxiDriver]);

  const refreshCatalog = useCallback(async ({ showLoader = true } = {}) => {
    const accountId = toAccountId(authSession?.accountId);
    if (showLoader) {
      setIsCatalogLoading(true);
    }
    try {
      const [adsRaw, servicesRaw, taxiCityRaw, taxiIntercityRaw, restaurantsRaw, menuRaw] = await Promise.all([
        getListingsRequest({ kind: 1, limit: 200, ...(accountId !== null ? { accountId } : {}) }),
        getListingsRequest({ kind: 2, limit: 200, ...(accountId !== null ? { accountId } : {}) }),
        getTaxiOffersRequest({ direction: 1, limit: 200, ...(accountId !== null ? { accountId } : {}) }),
        getTaxiOffersRequest({ direction: 2, limit: 400, ...(accountId !== null ? { accountId } : {}) }),
        getRestaurantsRequest({ limit: 300 }),
        getMenuItemsRequest({ limit: 300, ...(accountId !== null ? { accountId } : {}) }),
      ]);

      const restaurantDeliveryById = new Map(
        toArray(restaurantsRaw).map((restaurant) => [
          toAccountId(restaurant?.restaurantId),
          {
            mode: getRestaurantDeliveryMode(restaurant),
            price: getRestaurantDeliveryPrice(restaurant),
          },
        ]).filter(([id]) => id !== null)
      );

      const nextAds = toArray(adsRaw).map(mapListingToUi);
      const nextServices = toArray(servicesRaw).map(mapListingToUi);
      const nextTaxi = [...toArray(taxiCityRaw), ...toArray(taxiIntercityRaw)]
        .map(mapTaxiToUi)
        .filter((item) => item.category);
      const nextFood = toArray(menuRaw).map((item) => {
        const mapped = mapMenuItemToUi(item);
        const restaurantId = toAccountId(mapped.restaurantId);
        const restaurantDelivery = restaurantId !== null ? restaurantDeliveryById.get(restaurantId) : null;
        return {
          ...mapped,
          restaurantDeliveryMode: restaurantDelivery?.mode || "none",
          restaurantDeliveryPrice: restaurantDelivery?.price || 0,
        };
      });

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
      lastCatalogRefreshAtRef.current = Date.now();
    } finally {
      if (showLoader) {
        setIsCatalogLoading(false);
      }
    }
  }, [authSession?.accountId]);

  const refreshDictionaries = useCallback(async () => {
    try {
      const dictionaries = await getDictionariesRequest({});
      const listingCategories = withMyAdsCategory(
        withAllCategory(normalizeDictionaryNames(dictionaries?.listingCategories || []))
      );
      const nextServiceCategories = withAllCategory(normalizeDictionaryNames(dictionaries?.serviceCategories || []));
      const nextFoodCategories = withAllCategory(normalizeDictionaryNames(dictionaries?.kitchenCategories || []));

      if (listingCategories.length > 1) setAdsCategories(listingCategories);
      if (nextServiceCategories.length > 1) setServiceCategories(nextServiceCategories);
      if (nextFoodCategories.length > 1) setFoodCategories(nextFoodCategories);
    } catch {
      // keep local fallback categories
    }
  }, []);

  const refreshMyData = useCallback(async () => {
    const accountId = toAccountId(authSession?.accountId);
    if (accountId === null) {
      setCustomAds([]);
      setCustomServices([]);
      setCustomTaxiItems([]);
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
    const myActiveTaxi = myTaxi.filter((item) => item.isActive !== false);

    setCustomAds(myAds);
    setCustomServices(myServices);
    setCustomTaxiItems(myActiveTaxi);

    const myRestaurantId = toAccountId(myRestaurantRaw?.restaurantId);
    if (myRestaurantId !== null) {
      const myRestaurantMenuRaw = await getMenuItemsRequest({ accountId, restaurantId: myRestaurantId, limit: 300 });
      const myRestaurantMenu = toArray(myRestaurantMenuRaw).map(mapMenuItemToUi);
      setHasRestaurant(true);
      const myRestaurantDeliveryMode = getRestaurantDeliveryMode(myRestaurantRaw);
      const myRestaurantDeliveryPrice = getRestaurantDeliveryPrice(myRestaurantRaw);
      setRestaurantEntity({
        id: `restaurant-${myRestaurantId}`,
        restaurantId: myRestaurantId,
        title: myRestaurantRaw.name || "Моё заведение",
        desc: myRestaurantRaw.description || "",
        address: myRestaurantRaw.address || "",
        deliveryMode: myRestaurantDeliveryMode,
        deliveryPrice: myRestaurantDeliveryPrice,
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
    setUserRestaurantDishes,
    setHasRestaurant,
    setRestaurantEntity,
    setIsTaxiDriver,
  ]);

  const runListRefresh = useCallback(async ({ showCatalogLoader = false } = {}) => {
    if (listRefreshPromiseRef.current) {
      return listRefreshPromiseRef.current;
    }

    const refreshPromise = (async () => {
      setIsListRefreshing(true);
      try {
        await Promise.allSettled([
          refreshCatalog({ showLoader: showCatalogLoader }),
          refreshDictionaries(),
          refreshMyData(),
        ]);
      } finally {
        setIsListRefreshing(false);
        listRefreshPromiseRef.current = null;
      }
    })();

    listRefreshPromiseRef.current = refreshPromise;
    return refreshPromise;
  }, [refreshCatalog, refreshDictionaries, refreshMyData]);

  useEffect(() => {
    refreshDictionaries().catch(() => {});
  }, [refreshDictionaries]);

  useEffect(() => {
    refreshCatalog().catch(() => {});
  }, [refreshCatalog]);

  useEffect(() => {
    refreshMyData().catch(() => {});
  }, [refreshMyData]);

  useEffect(() => {
    try {
      localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(feedbackByItem));
    } catch {
      // ignore storage errors
    }
  }, [feedbackByItem]);

  useEffect(() => {
    if (modal?.type === "detail") return;
    setIsDetailViewerOpen(false);
  }, [modal?.type]);

  const handleBackAttempt = useCallback(() => {
    if (modal?.type === "auth") {
      const navModalType = window.history.state?.[APP_HISTORY_KEY]?.modal?.type;
      if (navModalType === "auth") window.history.back();
      else setModal(modal?.payload?.returnTo || null);
      return true;
    }
    if (modal?.type !== "detail" || !isDetailViewerOpen) return false;
    setDetailViewerCloseSignal((prev) => prev + 1);
    return true;
  }, [modal, isDetailViewerOpen]);

  useNavHistory({
    appHistoryKey: APP_HISTORY_KEY,
    tab,
    setTab,
    modal,
    setModal,
    onBackAttempt: handleBackAttempt,
  });
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
      disableTelegramAutoAuth();
      localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
      toggleAuth(() => setModal({ type: "auth", payload: {} }));
      return;
    }

    setAuthMode("signin");
    setAuthError("");
    setShowAuthPassword(false);
    resetSignInFields();
    toggleAuth(() => setModal({ type: "auth", payload: {} }));
  };

  const ensureAuth = (fn, options = {}) => {
    if (isAuth) return fn();
    const returnTo = options.returnTo || null;
    setAuthMode("signin");
    setAuthError("");
    setShowAuthPassword(false);
    resetSignInFields();
    setModal({ type: "auth", payload: returnTo ? { returnTo, fromDetail: Boolean(options.fromDetail) } : {} });
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    if (authPending) return;

    const fd = new FormData(event.currentTarget);
    const signInPhone = formatPhoneValueCompact(signInPhoneValue, { allowEmpty: true });
    const login = signInLoginValue.replace(/^@+/, "").trim();
    const rawPhone = String(fd.get("phone") || "").trim();
    const phone = formatPhoneValueCompact(rawPhone, { allowEmpty: true });
    const name = String(fd.get("name") || "").trim();
    const password = String(fd.get("password") || "");
    const phoneRegex = /^\+7\(\d{3}\)\d{3}-\d{2}-\d{2}$/;
    const isValidPhone = phoneRegex.test(signInPhone);
    const isValidSignupPhone = phoneRegex.test(phone);
    const loginPattern = new RegExp(`^[A-Za-z0-9_]{${LOGIN_MIN},${LOGIN_MAX}}$`);
    const isValidLogin = loginPattern.test(login);
    const hasSignInPhone = signInMethod === "phone" && Boolean(signInPhone);
    const hasSignInLogin = signInMethod === "login" && Boolean(login);

    if (!password) {
      setAuthError("Введите пароль");
      return;
    }

    if (authMode === "signin") {
      if (signInMethod === "phone" && !hasSignInPhone) {
        setAuthError("Введите телефон");
        return;
      }
      if (signInMethod === "phone" && !isValidPhone) {
        setAuthError("Введите телефон в формате +7(XXX)XXX-XX-XX");
        return;
      }
      if (signInMethod === "login" && !hasSignInLogin) {
        setAuthError("Введите логин");
        return;
      }
      if (signInMethod === "login" && !isValidLogin) {
        setAuthError("Введите корректный логин");
        return;
      }
    }

    if (authMode === "signin" && !hasSignInPhone && !hasSignInLogin) {
      setAuthError(signInMethod === "phone" ? "Введите телефон" : "Введите логин");
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
      if (!isValidSignupPhone) {
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
          ...(hasSignInPhone ? { phone: signInPhone } : { login }),
          password,
        });

      if (!response?.sessionToken || !response?.account) {
        throw new Error("Некорректный ответ сервера");
      }

      enableTelegramAutoAuth();
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

  const isTaxiOwnedByProfile = useCallback((item) => {
    if (!item) return false;
    const normalizeText = (value) => String(value || "").trim().toLowerCase();
    const normalizePhone = (value) => {
      let digits = String(value || "").replace(/\D/g, "");
      if (digits.length === 11 && digits.startsWith("8")) digits = `7${digits.slice(1)}`;
      return digits;
    };

    const profileName = normalizeText(profile?.name);
    const itemName = normalizeText(item.name || item.title);
    const profileFirstName = profileName.split(/\s+/).filter(Boolean)[0] || "";
    const itemFirstName = itemName.split(/\s+/).filter(Boolean)[0] || "";
    const sameName = Boolean(
      profileName
      && itemName
      && (
        profileName === itemName
        || (profileFirstName.length >= 3 && profileFirstName === itemFirstName)
        || profileName.startsWith(`${itemName} `)
        || itemName.startsWith(`${profileName} `)
      )
    );

    const profilePhones = [profile?.phone, profile?.whatsapp]
      .map(normalizePhone)
      .filter(Boolean);
    const itemPhones = [item?.contacts?.phone, item?.contacts?.wa]
      .map(normalizePhone)
      .filter(Boolean);
    const hasSamePhone = profilePhones.some((phone) => itemPhones.includes(phone));

    const normalizeTelegram = (value) => normalizeText(String(value || "").replace(/^@/, ""));
    const profileTelegram = normalizeTelegram(profile?.telegram);
    const itemTelegram = normalizeTelegram(item?.contacts?.tg);
    const hasSameTelegram = Boolean(profileTelegram && itemTelegram && profileTelegram === itemTelegram);

    return hasSamePhone || hasSameTelegram || sameName;
  }, [profile?.name, profile?.phone, profile?.telegram, profile?.whatsapp]);

  const toggleFavorite = (id) => {
    ensureAuth(async () => {
      const accountId = toAccountId(authSession?.accountId);
      if (accountId === null || !id) return;
      const isOwnItem =
        customAds.some((item) => item.id === id)
        || customServices.some((item) => item.id === id)
        || customTaxiItems.some((item) => item.id === id)
        || userRestaurantDishes.some((item) => item.id === id)
        || taxiData.some((item) => item.id === id && (item.owner === currentOwner || isTaxiOwnedByProfile(item)));
      if (isOwnItem) return;
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

  const decorateWithFeedback = useCallback((item) => {
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
  }, [feedbackByItem]);

  const servicesCatalog = useMemo(
    () => servicesData
      .map((item) => ({ ...item, photos: normalizeFivePhotos(item?.photos) }))
      .map((item) => decorateWithFeedback(item)),
    [decorateWithFeedback, servicesData]
  );

  const servicesItems = useMemo(
    () => {
      const category = serviceCategories.includes(serviceCategory) ? serviceCategory : "Все";
      return sortItems(
        servicesCatalog.filter((x) => category === "Все" || x.category === category),
        servicesSort,
        favorites
      );
    },
    [serviceCategories, serviceCategory, servicesSort, favorites, servicesCatalog]
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
      const numericRestaurantId = toAccountId(dishes[0]?.restaurantId);
      const contacts = dishes.reduce((acc, dish) => {
        const nextContacts = dish.contacts || {};
        if (!acc.phone && nextContacts.phone) acc.phone = nextContacts.phone;
        if (!acc.wa && nextContacts.wa) acc.wa = nextContacts.wa;
        if (!acc.tg && nextContacts.tg) acc.tg = nextContacts.tg;
        return acc;
      }, {});
      const id = numericRestaurantId
        ? `restaurant-${numericRestaurantId}`
        : String(restaurantKey).startsWith("restaurant-")
          ? restaurantKey
          : buildRestaurantId(restaurantTitle);
      const reviews = Array.isArray(feedbackByItem[id]) ? feedbackByItem[id] : [];
      const categories = [...new Set(dishes.map((x) => x.category).filter(Boolean))];

      return {
        id,
        restaurantId: numericRestaurantId,
        title: restaurantTitle,
        desc: categories.length ? `Кухня: ${categories.join(", ")}` : "Описание заведения не указано.",
        address: String(dishes[0]?.restaurantAddress || "").trim(),
        logo: String(dishes[0]?.restaurantLogo || "").trim(),
        deliveryMode: String(dishes[0]?.restaurantDeliveryMode || "none"),
        deliveryPrice: Number(dishes[0]?.restaurantDeliveryPrice) || 0,
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
      const ownRestaurantCard = {
        id: ownRestaurantId,
        restaurantId: toAccountId(restaurantEntity?.restaurantId),
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
        dishes: normalizedUserRestaurantDishes,
        reviews: ownReviews,
        reviewsCount: ownReviews.length,
        ratingValue: getFeedbackRating(ownReviews),
      };
      const ownRestaurantNumericId = toAccountId(restaurantEntity?.restaurantId);
      const existingIdx = fromFood.findIndex((x) => (
        x.id === ownRestaurantId
        || (ownRestaurantNumericId !== null && toAccountId(x.restaurantId) === ownRestaurantNumericId)
      ));
      if (existingIdx >= 0) fromFood[existingIdx] = ownRestaurantCard;
      else fromFood.unshift(ownRestaurantCard);
    }

    return fromFood;
  }, [hasRestaurant, restaurantEntity, feedbackByItem, normalizedUserRestaurantDishes, foodCatalog]);

  const visibleFoodRestaurants = useMemo(
    () => {
      const category = foodCategories.includes(foodCategory) ? foodCategory : "Все";
      return foodRestaurants
        .map((restaurant) => ({
          ...restaurant,
          dishes: restaurant.dishes.filter((dish) => category === "Все" || dish.category === category),
        }))
        .filter((restaurant) => restaurant.dishes.length > 0 || (category === "Все" && restaurant.id === restaurantEntity?.id));
    },
    [foodCategories, foodRestaurants, foodCategory, restaurantEntity?.id]
  );

  const normalizedTaxiFeedItems = useMemo(
    () => taxiData.map((item) => normalizeEntityPhotos(item)),
    [taxiData]
  );
  const normalizedCustomTaxiItems = useMemo(
    () => customTaxiItems.map((item) => normalizeEntityPhotos(item)),
    [customTaxiItems]
  );
  const oneTimeTaxiOffers = useMemo(
    () => customTaxiItems.filter((item) => item.mode === "one-time"),
    [customTaxiItems]
  );
  const oneTimeCityOffers = useMemo(
    () => normalizedCustomTaxiItems.filter((item) => item.mode === "one-time" && item.category === TAXI_CITY_CATEGORY),
    [normalizedCustomTaxiItems]
  );
  const oneTimeIntercityOffers = useMemo(
    () => normalizedCustomTaxiItems.filter((item) => item.mode === "one-time" && item.category !== TAXI_CITY_CATEGORY),
    [normalizedCustomTaxiItems]
  );
  const ownedAdIds = useMemo(() => new Set(customAds.map((item) => item.id)), [customAds]);
  const ownedServiceIds = useMemo(() => new Set(customServices.map((item) => item.id)), [customServices]);
  const ownedDishIds = useMemo(() => new Set(userRestaurantDishes.map((item) => item.id)), [userRestaurantDishes]);
  const isOwnTaxiItem = useCallback((item) => {
    if (!item) return false;
    if (currentOwner && item.owner === currentOwner) return true;
    if (isTaxiOwnedByProfile(item)) return true;
    const id = String(item.id || "");
    if (!id) return false;
    return normalizedCustomTaxiItems.some((entry) => entry.id === id);
  }, [currentOwner, normalizedCustomTaxiItems, isTaxiOwnedByProfile]);

  const { taxiCatalog, taxiItems } = useTaxiCatalog({
    customTaxiItems: normalizedTaxiFeedItems,
    mockTaxi: [],
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
    if (type === "restaurant") {
      const restaurant = foodRestaurants.find((entry) => entry.id === id);
      if (!restaurant) return;
    }
    if (type === "ads") {
      const item = adsCatalog.find((entry) => entry.id === id);
      if (!item) return;
    }
    if (type === "services") {
      const item = servicesCatalog.find((entry) => entry.id === id);
      if (!item) return;
    }
    if (type === "taxi") {
      const item = taxiCatalog.find((entry) => entry.id === id);
      if (!item) return;
    }
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
    const fallbackReturnTo = buildModalSnapshot(modal);
    setModal({
      type: "create",
      payload: {
        type,
        ...(options.returnTo ? { returnTo: options.returnTo } : fallbackReturnTo ? { returnTo: fallbackReturnTo } : {}),
      },
    });
  });
  const openEditEntity = (payload) => ensureAuth(() => {
    const fallbackReturnTo = buildModalSnapshot(modal);
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
    const fallbackReturnTo = buildModalSnapshot(modal);
    setModal({
      type: "profileEdit",
      payload: {
        ...profile,
        ...(fallbackReturnTo ? { returnTo: fallbackReturnTo } : {}),
      },
    });
  });
  const createType = modal?.type === "create" || modal?.type === "editEntity" ? modal.payload?.type : null;
  const fullScreenCreate = FULL_SCREEN_CREATE_TYPES.has(createType);
  const fullScreenModal = modal?.type === "detail" || modal?.type === "profileEdit" || modal?.type === "entityGroup" || fullScreenCreate;
  const blockAuthBackdropClose = modal?.type === "auth" && Boolean(modal?.payload?.returnTo);
  const isListTab = LIST_TABS.has(tab);
  const showFloatingScrollTopButton = isListTab && showScrollTopButton && !fullScreenModal;

  const handleScreenScroll = useCallback((event) => {
    const nextVisible = event.currentTarget.scrollTop > SCROLL_TOP_VISIBILITY_OFFSET;
    if (scrollTopButtonVisibleRef.current === nextVisible) return;
    scrollTopButtonVisibleRef.current = nextVisible;
    setShowScrollTopButton(nextVisible);
  }, []);

  const handleListRefresh = useCallback(() => {
    runListRefresh({ showCatalogLoader: false }).catch(() => {});
  }, [runListRefresh]);

  const scrollScreenToTop = useCallback(() => {
    screenRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleTabChange = useCallback((nextTab) => {
    setTab((currentTab) => (currentTab === nextTab ? currentTab : nextTab));
  }, []);

  const handleTabPointerDown = useCallback((event, nextTab) => {
    if (event.pointerType === "mouse") return;
    handleTabChange(nextTab);
  }, [handleTabChange]);

  useEffect(() => {
    if (!isListTab || isCatalogLoading) return undefined;

    const lastRefreshAt = lastCatalogRefreshAtRef.current;
    const isStale = !lastRefreshAt || (Date.now() - lastRefreshAt) >= TAB_AUTO_REFRESH_STALE_MS;
    if (!isStale) return undefined;

    runListRefresh({ showCatalogLoader: false }).catch(() => {});
    return undefined;
  }, [tab, isListTab, isCatalogLoading, runListRefresh]);

  useEffect(() => {
    const nextVisible = (screenRef.current?.scrollTop || 0) > SCROLL_TOP_VISIBILITY_OFFSET;
    scrollTopButtonVisibleRef.current = nextVisible;
    setShowScrollTopButton(nextVisible);
  }, [tab]);

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
    const normalizeSubmittedPhotos = (value, limit) => {
      return toArray(value)
        .map((photo) => normalizePhotoReference(photo))
        .filter(Boolean)
        .slice(0, limit);
    };
    const removePhotosFromS3 = async (value) => {
      const removedPhotos = normalizeSubmittedPhotos(value, 100);
      if (!removedPhotos.length) return;
      await deleteImagesFromS3({
        photos: removedPhotos,
        accountId,
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
        const keptExistingLogo = normalizeSubmittedPhotos(payload.existingPhotos, 1);
        const logo = uploadedLogo[0] || keptExistingLogo[0] || undefined;
        const restaurantResponse = await createOrUpdateRestaurantRequest({
          accountId,
          ...(isEdit && restaurantIdForUpdate ? { restaurantId: restaurantIdForUpdate } : {}),
          name: payload.title || "Моё заведение",
          address: payload.address || "",
          description: payload.desc || "",
          hasDelivery: String(payload.deliveryMode || "none") !== "none",
          deliveryMode: String(payload.deliveryMode || "none"),
          deliveryPrice: Number(payload.deliveryPrice) || 0,
          logoUrl: logo,
          phone: payload.phone || undefined,
          telegram: payload.telegram || undefined,
          whatsapp: payload.whatsapp || undefined,
        });
        if (isEdit) {
          await removePhotosFromS3(payload.removedPhotos);
        }
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
        const uploadedListingPhotos = await uploadPhotos("images", 8, "listing");
        const kind = type === "ad" ? 1 : 2;
        if (isEdit) {
          const listingId = Number(String(editEntityId).split("-")[1]);
          if (!listingId) throw new Error("Некорректный идентификатор объявления/услуги");
          const currentItem = (type === "ad" ? customAds : customServices).find((x) => x.id === editEntityId);
          const keptExistingPhotos = normalizeSubmittedPhotos(payload.existingPhotos, 8);
          await updateListingRequest({
            accountId,
            listingId,
            kind,
            category: payload.category || currentItem?.category || "Другое",
            title: payload.title || currentItem?.title || (type === "ad" ? "Объявление" : "Услуга"),
            description: payload.desc || currentItem?.desc || "",
            price: Number(payload.price) || Number(currentItem?.price) || 1,
            photos: [...keptExistingPhotos, ...uploadedListingPhotos].slice(0, 8),
          });
          await removePhotosFromS3(payload.removedPhotos);
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
        const payloadAvailability = String(payload.isAvailable || "").trim().toLowerCase();
        if (isEdit && editEntityId && editEntityKind === "dish") {
          const menuItemId = Number(String(editEntityId).split("-").pop());
          if (!menuItemId) throw new Error("Некорректный идентификатор блюда");
          const currentDish = userRestaurantDishes.find((x) => x.id === editEntityId);
          const keptExistingPhotos = normalizeSubmittedPhotos(payload.existingPhotos, 1);
          await updateMenuItemRequest({
            accountId,
            menuItemId,
            category: payload.category || currentDish?.category || "Другое",
            name: payload.title || currentDish?.title || "Блюдо",
            description: payload.desc || currentDish?.desc || "",
            price: Number(payload.price) || Number(currentDish?.price) || 1,
            isAvailable: payloadAvailability === "true" ? true : payloadAvailability === "false" ? false : !currentDish?.unavailable,
            photos: [...keptExistingPhotos, ...photos].slice(0, 1),
          });
          await removePhotosFromS3(payload.removedPhotos);
        } else {
          await createMenuItemRequest({
            accountId,
            category: payload.category || "Другое",
            name: payload.title || "Новое блюдо",
            description: payload.desc || "",
            price: Number(payload.price) || 1,
            isAvailable: payloadAvailability === "false" ? false : true,
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
        }));
        await refreshCatalog();
      }

      if (type === "taxi") {
        const uploadedTaxiPhotos = await uploadPhotos("images", 1, "taxi");
        const currentTaxi = isEdit
          ? customTaxiItems.find((x) => x.id === editEntityId) || null
          : null;
        const categories = toArray(payload.category).filter(Boolean);
        const category = categories[0] || currentTaxi?.category;
        const routePayload = buildTaxiRoutePayload(category);
        if (!routePayload) throw new Error("Выберите направление");
        const seatsValue = Number(payload.seats);
        const seats = Number.isFinite(seatsValue) && seatsValue > 0 ? seatsValue : undefined;
        const rawDepartureAt = payload.when || currentTaxi?.when || undefined;
        const departureAt = toTaxiDepartureAtApiValue(rawDepartureAt);
        if (typeof rawDepartureAt === "string" && rawDepartureAt.trim() && departureAt === null) {
          throw new Error("Неверный формат даты поездки");
        }
        const vehicle = String(payload.vehicle || "").trim();
        if (isEdit && editEntityKind === "taxi-one-time") {
          const taxiOfferId = Number(String(editEntityId).split("-")[1]);
          if (!taxiOfferId) throw new Error("Некорректный идентификатор поездки");
          const keptExistingPhotos = normalizeSubmittedPhotos(payload.existingPhotos, 1);
          await updateTaxiOfferRequest({
            accountId,
            taxiOfferId,
            direction: routePayload.direction,
            routeDirection: routePayload.routeDirection ?? undefined,
            fromPlace: routePayload.fromPlace || undefined,
            toPlace: routePayload.toPlace || undefined,
            routeText: routePayload.routeText || undefined,
            vehicle: vehicle || undefined,
            description: payload.desc || currentTaxi?.desc || "",
            phone: payload.phone || currentTaxi?.contacts?.phone,
            whatsapp: payload.wa || currentTaxi?.contacts?.wa || undefined,
            telegram: payload.tg || currentTaxi?.contacts?.tg || undefined,
            price: Number(payload.price) || Number(currentTaxi?.price) || 1,
            departureAt: departureAt === undefined ? undefined : departureAt,
            seatsTotal: seats,
            seatsFree: seats,
            carPhotos: [...keptExistingPhotos, ...uploadedTaxiPhotos].slice(0, 1),
          });
          await removePhotosFromS3(payload.removedPhotos);
        } else {
          await createTaxiOfferRequest({
            accountId,
            direction: routePayload.direction,
            routeDirection: routePayload.routeDirection ?? undefined,
            fromPlace: routePayload.fromPlace || undefined,
            toPlace: routePayload.toPlace || undefined,
            routeText: routePayload.routeText || undefined,
            vehicle: vehicle || undefined,
            description: payload.desc || "",
            phone: payload.phone,
            whatsapp: payload.wa || undefined,
            telegram: payload.tg || undefined,
            price: Number(payload.price) || 1,
            departureAt: departureAt === undefined ? undefined : departureAt,
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

  const toggleTaxiFilled = (id) => {
    setCustomTaxiItems((prev) => prev.map((x) => (x.id === id ? { ...x, isFilled: !x.isFilled } : x)));
  };

  const editTaxiOffer = (id) => openEditEntity({ type: "taxi", id, kind: "taxi-one-time" });
  const removeTaxiOffer = (id) => {
    const targetTaxi = normalizedCustomTaxiItems.find((item) => item.id === id);
    if (!targetTaxi) return;
    const taxiTitle = String(targetTaxi.name || targetTaxi.category || "Поездка").trim();

    setModal({
      type: "confirmTaxiDelete",
      payload: {
        taxiId: id,
        taxiTitle,
        returnTo: { type: "entityGroup", payload: { group: "taxi" } },
      },
    });
  };

  const editService = (id) => openEditEntity({ type: "service", id, kind: "service" });
  const editAd = (id) => openEditEntity({ type: "ad", id, kind: "ad" });
  const removeListing = (id) => {
    const isAd = String(id).startsWith("ad-");
    const allItems = isAd ? customAds : customServices;
    const target = allItems.find((item) => item.id === id);
    const listingTitle = String(target?.title || (isAd ? "Объявление" : "Услуга")).trim();
    setModal({
      type: "confirmListingDelete",
      payload: { listingId: id, listingTitle },
    });
  };
  const confirmRemoveListing = async () => {
    if (modal?.type !== "confirmListingDelete") return;
    const rawId = modal?.payload?.listingId;
    if (!rawId) { closeModal(); return; }
    try {
      const accountId = toAccountId(authSession?.accountId);
      const isAd = String(rawId).startsWith("ad-");
      const listingId = Number(String(rawId).split("-")[1]);
      if (accountId !== null && listingId) {
        await deleteMyListingRequest({ accountId, listingId, kind: isAd ? 1 : 2 });
        await refreshMyData();
        await refreshCatalog();
        setFavorites((prev) => {
          if (!prev.has(rawId)) return prev;
          const next = new Set(prev);
          next.delete(rawId);
          return next;
        });
      }
      setModal(null);
    } catch (error) {
      showActionError(error, "Не удалось удалить объявление");
    }
  };
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
    try {
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
    } catch (error) {
      showActionError(error, "Не удалось удалить блюдо");
    }
  };
  const confirmRemoveTaxiOffer = async () => {
    if (modal?.type !== "confirmTaxiDelete") return;
    const taxiId = modal?.payload?.taxiId;
    if (!taxiId) {
      closeModal();
      return;
    }
    try {
      const accountId = toAccountId(authSession?.accountId);
      const taxiOfferId = Number(String(taxiId).split("-")[1]);
      if (accountId !== null && taxiOfferId) {
        await deleteTaxiOfferRequest({ accountId, taxiOfferId });
        await refreshMyData();
        await refreshCatalog();
        setFeedbackByItem((prev) => {
          if (!Object.prototype.hasOwnProperty.call(prev, taxiId)) return prev;
          const next = { ...prev };
          delete next[taxiId];
          return next;
        });
        setFavorites((prev) => {
          if (!prev.has(taxiId)) return prev;
          const next = new Set(prev);
          next.delete(taxiId);
          return next;
        });
      }
      if (modal?.payload?.returnTo) {
        setModal(modal.payload.returnTo);
        return;
      }
      setModal(null);
    } catch (error) {
      showActionError(error, "Не удалось удалить поездку");
    }
  };
  const toggleDishAvailability = async (id) => {
    try {
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
        price: Number(dish.price) || 1,
        isAvailable: Boolean(dish.unavailable),
        photos: normalizeSinglePhoto(dish.photos),
      });
      await refreshMyData();
      await refreshCatalog();
    } catch (error) {
      showActionError(error, "Не удалось обновить наличие блюда");
    }
  };

  const editRestaurant = () => openEditEntity({ type: "restaurant", kind: "restaurant" });
  const viewRestaurant = () => {
    if (!restaurantEntity?.id) return;
    openBusinessDetail("restaurant", restaurantEntity.id, "restaurant");
  };

  const addFeedback = ({ itemId, rating, text }) => {
    const normalizedItemId = String(itemId || "").trim();
    const message = String(text || "").trim();
    if (!normalizedItemId) return false;

    ensureAuth(() => {
      const authorName = String(profile.name || "Пользователь").trim();
      const existingReviews = Array.isArray(feedbackByItem[normalizedItemId]) ? feedbackByItem[normalizedItemId] : [];
      const alreadyLeft = existingReviews.some((review) => String(review.author || "").trim().toLowerCase() === authorName.toLowerCase());
      if (alreadyLeft) return;

      const nextReview = {
        id: `review-${Date.now()}-${randomSuffix()}`,
        author: authorName,
        rating: normalizeRating(rating),
        text: message,
        createdAt: new Date().toISOString(),
      };

      setFeedbackByItem((prev) => {
        const current = Array.isArray(prev[normalizedItemId]) ? prev[normalizedItemId] : [];
        return {
          ...prev,
          [normalizedItemId]: [nextReview, ...current],
        };
      });
    });

    return true;
  };

  const requireAuthForFeedback = () => {
    ensureAuth(() => {}, {
      returnTo: modal?.type === "detail" ? modal.payload : null,
      fromDetail: true,
    });
  };

  const closeModal = () => {
    const returnTarget = getModalReturnTarget(modal);
    if (returnTarget) {
      setModal(returnTarget);
      return;
    }
    setModal(null);
  };

  const detailCatalogs = useMemo(
    () => ({
      ads: adsCatalog,
      services: servicesCatalog,
      food: foodCatalog,
      taxi: taxiCatalog,
    }),
    [adsCatalog, servicesCatalog, foodCatalog, taxiCatalog]
  );
  const detailData = useMemo(() => {
    if (modal?.type !== "detail") return null;
    const detailType = modal.payload?.type;
    const detailId = modal.payload?.id;
    if (detailType === "restaurant") {
      const restaurant = foodRestaurants.find((entry) => entry.id === detailId);
      if (!restaurant) return null;
      return { type: "restaurant", item: restaurant };
    }
    const source = detailCatalogs[detailType] || [];
    const item = source.find((x) => x.id === detailId);
    if (!item) return null;
    return { type: detailType, item };
  }, [modal, detailCatalogs, foodRestaurants]);

  const createDrafts = useMemo(
    () => ({
      taxi: {
        name: profileValue(profile.name),
        contacts: {
          phone: profileValue(profile.phone),
          wa: profileValue(profile.whatsapp),
          tg: profileValue(profile.telegram),
        },
      },
      restaurant: {
        phone: profileValue(profile.phone),
        telegram: profileValue(profile.telegram),
        whatsapp: profileValue(profile.whatsapp),
      },
    }),
    [profile]
  );
  const createInitialValues = useMemo(() => {
    if (modal?.type !== "create") return null;
    return createDrafts[modal.payload?.type] || null;
  }, [modal, createDrafts]);

  const editEntityCollections = useMemo(
    () => ({
      service: customServices,
      ad: customAds,
      dish: userRestaurantDishes,
      taxi: normalizedCustomTaxiItems,
    }),
    [customServices, customAds, userRestaurantDishes, normalizedCustomTaxiItems]
  );
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

    const item = editEntityCollections[editType]?.find((entry) => entry.id === editId);
    if (!item) return null;

    if (editType === "taxi") {
      return {
        type: "taxi",
        initialValues: { ...item, mode: "one-time", categories: [item.category] },
        editMeta: { id: item.id, kind: "taxi-one-time" },
      };
    }

    return {
      type: editType,
      initialValues: item,
      editMeta: { id: item.id, kind: editKind || editType },
    };
  }, [modal, restaurantEntity, editEntityCollections]);

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
          oneTimeCity: oneTimeCityOffers,
          oneTimeIntercity: oneTimeIntercityOffers,
        },
      };
    }
    return null;
  }, [modal, hasRestaurant, restaurantEntity, myAds, customServices, oneTimeCityOffers, oneTimeIntercityOffers]);

  const detailFromBusiness = Boolean(modal?.payload?.fromBusiness);
  const isOwnedRestaurantDetail = Boolean(
    detailData?.type === "restaurant" && detailData.item.id === restaurantEntity?.id
  );
  const isOwnedAdDetail = Boolean(
    detailData?.type === "ads"
      && (detailData.item.owner === currentOwner || ownedAdIds.has(detailData.item.id))
  );
  const isOwnedServiceDetail = Boolean(
    detailData?.type === "services"
      && (detailData.item.owner === currentOwner || ownedServiceIds.has(detailData.item.id))
  );
  const isOwnedFoodDetail = Boolean(
    detailData?.type === "food" && ownedDishIds.has(detailData.item.id)
  );
  const isOwnedTaxiDetail = Boolean(
    detailData?.type === "taxi" && isOwnTaxiItem(detailData.item)
  );
  const canManageDishesFromDetail = isOwnedRestaurantDetail || isOwnedFoodDetail;
  const isDetailOwnerView = detailFromBusiness
    || isOwnedRestaurantDetail
    || isOwnedAdDetail
    || isOwnedServiceDetail
    || isOwnedFoodDetail
    || isOwnedTaxiDetail;
  const handleDetailEdit = () => {
    if (!detailData) return;
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
      editTaxiOffer(detailData.item.id);
    }
  };

  const screenContent = (
    <>
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
          currentOwner={currentOwner}
          isLoading={isCatalogLoading}
          onRefresh={handleListRefresh}
          isRefreshing={isListRefreshing}
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
          serviceCategories={serviceCategories}
          currentOwner={currentOwner}
          isLoading={isCatalogLoading}
          onRefresh={handleListRefresh}
          isRefreshing={isListRefreshing}
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
          currentOwner={currentOwner}
          isOwnTaxiItem={isOwnTaxiItem}
          isLoading={isCatalogLoading}
          onRefresh={handleListRefresh}
          isRefreshing={isListRefreshing}
        />
      )}

      {tab === "food" && (
        <FoodTab
          foodCategory={foodCategory}
          setFoodCategory={setFoodCategory}
          restaurants={visibleFoodRestaurants}
          foodCategories={foodCategories}
          isAuth={isAuth}
          hasRestaurant={hasRestaurant}
          openCreate={openCreate}
          openEntityGroup={openEntityGroup}
          openDetail={openDetail}
          isLoading={isCatalogLoading}
          onRefresh={handleListRefresh}
          isRefreshing={isListRefreshing}
        />
      )}

      {tab === "profile" && (
        <ProfileTab
          isAuth={isAuth}
          profile={profile}
          myAds={myAds}
          hasRestaurant={hasRestaurant}
          isTaxiDriver={isTaxiDriver}
          oneTimeIntercityOffers={oneTimeTaxiOffers}
          myServices={customServices}
          onOpenEntityGroup={openEntityGroup}
          openCreate={openCreate}
          openEditProfile={openEditProfile}
          onOpenSupport={openSupport}
          toggleAuth={toggleAuthModal}
        />
      )}
    </>
  );

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <h1>{tab === "profile" ? profile.name : "ircom"}</h1>
        </div>
        <div className="topbar-actions">
          <button className="ghost-btn topbar-support-btn" onClick={openSupport} type="button">
            Проблема
          </button>
          {!isAuth ? (
            <button className="ghost-btn topbar-auth-btn" onClick={toggleAuthModal} type="button">
              Войти
            </button>
          ) : null}
          <button className="topbar-close-btn" onClick={closeMiniApp} type="button" aria-label="Закрыть приложение">
            <span className="topbar-close-icon" aria-hidden="true">
              <X className="icon" />
            </span>
            <span>Закрыть</span>
          </button>
        </div>
      </header>

      <main
        ref={screenRef}
        className="screen"
        onScroll={handleScreenScroll}
      >
        {screenContent}
      </main>

      <button
        className={`scroll-top-btn ${showFloatingScrollTopButton ? "is-visible" : ""}`}
        type="button"
        onClick={scrollScreenToTop}
        aria-label="Наверх"
      >
        <Icon name="up" />
      </button>

      <nav className="bottom-nav">
        {tabConfig.map(([key, icon, label]) => (
          <button
            className={`tab-btn ${tab === key ? "active" : ""}`}
            key={key}
            onPointerDown={(event) => handleTabPointerDown(event, key)}
            onClick={() => handleTabChange(key)}
            type="button"
          >
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
          <AuthModalContent
            authMode={authMode}
            setAuthMode={setAuthMode}
            authError={authError}
            setAuthError={setAuthError}
            authPending={authPending}
            showAuthPassword={showAuthPassword}
            setShowAuthPassword={setShowAuthPassword}
            signInMethod={signInMethod}
            setSignInMethod={setSignInMethod}
            signInPhoneValue={signInPhoneValue}
            setSignInPhoneValue={setSignInPhoneValue}
            signInLoginValue={signInLoginValue}
            setSignInLoginValue={setSignInLoginValue}
            onSubmit={handleAuthSubmit}
            onClose={closeModal}
            resetSignInFields={resetSignInFields}
          />
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
            closeViewerSignal={detailViewerCloseSignal}
            onViewerOpenChange={setIsDetailViewerOpen}
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
            onEdit={isDetailOwnerView ? handleDetailEdit : null}
            onAddDish={isOwnedRestaurantDetail ? () => openCreate("dish") : null}
            onEditDish={canManageDishesFromDetail ? editDish : null}
            onDeleteDish={canManageDishesFromDetail ? removeDish : null}
            onToggleDishAvailability={canManageDishesFromDetail ? toggleDishAvailability : null}
            onDeleteTaxi={isOwnedTaxiDetail ? removeTaxiOffer : null}
            onDeleteListing={(isOwnedAdDetail || isOwnedServiceDetail) ? removeListing : null}
            isOwnerView={isDetailOwnerView}
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

        {modal?.type === "confirmTaxiDelete" && (
          <>
            <h3>Удалить поездку?</h3>
            <p className="small">
              Поездка «{modal?.payload?.taxiTitle || "Без названия"}» будет удалена без возможности восстановления.
            </p>
            <div className="actions" style={{ marginTop: 8 }}>
              <button className="danger-btn" type="button" onClick={confirmRemoveTaxiOffer}>Удалить</button>
              <button className="ghost-btn" type="button" onClick={closeModal}>Отмена</button>
            </div>
          </>
        )}

        {modal?.type === "confirmListingDelete" && (
          <>
            <h3>Удалить объявление?</h3>
            <p className="small">
              «{modal?.payload?.listingTitle || "Без названия"}» будет удалено без возможности восстановления.
            </p>
            <div className="actions" style={{ marginTop: 8 }}>
              <button className="danger-btn" type="button" onClick={confirmRemoveListing}>Удалить</button>
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
            adsCategories={adsCategories}
            serviceCategories={serviceCategories}
            foodCategories={foodCategories}
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
            adsCategories={adsCategories}
            serviceCategories={serviceCategories}
            foodCategories={foodCategories}
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
            onCreateRestaurant={() => openCreate("restaurant")}
            onCreateAd={() => openCreate("ad")}
            onCreateService={() => openCreate("service")}
            onCreateTaxi={() => openCreate("taxi")}
            onToggleTaxiFilled={toggleTaxiFilled}
          />
        )}

        {modal?.type === "profileEdit" && <ProfileEditForm profile={profile} onSubmit={submitMock} onClose={closeModal} />}
      </Modal>
    </div>
  );
}
