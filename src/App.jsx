import {useCallback, useEffect, useMemo, useState} from 'react';
import {Eye, EyeOff} from 'lucide-react';
import {CreateForm, DetailModalContent, ProfileEditForm} from './components/modals';
import {EntityGroupModalContent} from './components/entity-group-modal-content';
import {Icon, Modal} from './components/ui';
import {useAuthState} from './hooks/use-auth-state';
import {useGestureGuard} from './hooks/use-gesture-guard';
import {useNavHistory} from './hooks/use-nav-history';
import {useTaxiCatalog} from './hooks/use-taxi-catalog';
import {AdsTab, FoodTab, ProfileTab, ServicesTab, TaxiTab} from './sections/tabs';
import {
  createOrUpdateAccountRequest,
  getSessionRequest,
  registerRequest,
  signInRequest,
  signOutRequest,
} from './api/auth';
import {
  createListingRequest,
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
import {
  formatPhoneValueCompact,
  handlePhoneInputCompact,
  PHONE_COMPACT_PATTERN,
  PHONE_COMPACT_PLACEHOLDER,
  syncPhonePrev,
} from './utils/phone';

import {
  ADS_CATEGORIES,
  APP_HISTORY_KEY,
  AUTH_SESSION_STORAGE_KEY,
  FEEDBACK_STORAGE_KEY,
  FOOD_CATEGORIES,
  SERVICE_CATEGORIES,
  TAXI_CATEGORIES,
  TAXI_CATEGORY_TO_DIRECTION,
  buildInitialFeedback,
  buildRestaurantId,
  deepCopy,
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

export default function App() {
  const [tab, setTab] = useState("ads");
  const [favorites, setFavorites] = useState(new Set());
  const [adsCategories, setAdsCategories] = useState(ADS_CATEGORIES);
  const [serviceCategories, setServiceCategories] = useState(SERVICE_CATEGORIES);
  const [foodCategories, setFoodCategories] = useState(FOOD_CATEGORIES);
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
  const [isDetailViewerOpen, setIsDetailViewerOpen] = useState(false);
  const [detailViewerCloseSignal, setDetailViewerCloseSignal] = useState(0);
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

  const adsCategoriesVisible = useMemo(
    () => (isAuth ? adsCategories : adsCategories.filter((x) => x !== "Мои объявления")),
    [isAuth, adsCategories]
  );
  const openSupport = useCallback(() => {
    const tg = window.Telegram?.WebApp;
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(SUPPORT_TELEGRAM_URL);
      return;
    }
    window.open(SUPPORT_TELEGRAM_URL, "_blank", "noopener,noreferrer");
  }, []);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    const root = document.documentElement;
    let fullscreenRetryTimer = null;
    let fullscreenAttempts = 0;
    const MAX_FULLSCREEN_ATTEMPTS = 6;
    const FULLSCREEN_RETRY_DELAY = 180;
    const clampInset = (value) => {
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) return 0;
      return Math.max(0, Math.min(numeric, 96));
    };
    const applyViewportVars = () => {
      const isTelegram = Boolean(tg);
      const isAndroidTelegram = isTelegram && String(tg?.platform || "").toLowerCase() === "android";
      const telegramPlatform = String(tg?.platform || "").toLowerCase();
      const ua = String(window.navigator?.userAgent || "");
      const isAndroidUa = /Android/i.test(ua);
      const isIosUa = /iPhone|iPad|iPod/i.test(ua);
      const isAndroidPlatform = telegramPlatform === "android" || (!isTelegram && isAndroidUa);
      const isIosPlatform = telegramPlatform === "ios" || (!isTelegram && isIosUa);
      const stableHeight = Number(tg?.viewportStableHeight);
      const viewportHeight = Number(tg?.viewportHeight);
      const appHeight = Number.isFinite(stableHeight) && stableHeight > 0
        ? stableHeight
        : (Number.isFinite(viewportHeight) && viewportHeight > 0 ? viewportHeight : window.innerHeight);

      const safeTopFromTg = clampInset(tg?.contentSafeAreaInset?.top ?? tg?.safeAreaInset?.top);
      const safeBottomFromTg = clampInset(tg?.contentSafeAreaInset?.bottom ?? tg?.safeAreaInset?.bottom);
      const topFallback = clampInset(window.innerHeight - appHeight);
      const minTopInset = isAndroidTelegram ? 86 : (isTelegram ? 74 : 0);
      const safeTop = Math.max(safeTopFromTg, topFallback, minTopInset);

      root.style.setProperty("--app-height", `${Math.max(appHeight, 320)}px`);
      root.style.setProperty("--tg-safe-area-top", `${safeTop}px`);
      root.style.setProperty("--tg-safe-area-bottom", `${safeBottomFromTg}px`);
      root.style.setProperty("--topbar-global-offset", `${isAndroidPlatform ? 68 : (isIosPlatform ? 38 : 52)}px`);
      root.style.setProperty("--bottom-nav-lift", `${isAndroidPlatform ? 12 : 0}px`);
      root.classList.toggle("is-telegram", isTelegram);
      root.classList.toggle("is-tg-android", isAndroidTelegram);
    };

    if (!tg) {
      applyViewportVars();
      window.addEventListener("resize", applyViewportVars);
      return () => {
        window.removeEventListener("resize", applyViewportVars);
      };
    }

    const enforceFullscreen = () => {
      tg.expand?.();
      tg.disableVerticalSwipes?.();
      tg.requestFullscreen?.();
    };
    const scheduleFullscreenRetry = () => {
      if (fullscreenAttempts >= MAX_FULLSCREEN_ATTEMPTS) return;
      if (fullscreenRetryTimer) return;
      fullscreenRetryTimer = window.setTimeout(() => {
        fullscreenRetryTimer = null;
        fullscreenAttempts += 1;
        enforceFullscreen();
      }, FULLSCREEN_RETRY_DELAY);
    };
    const handleViewportChanged = () => {
      applyViewportVars();
      const isExpanded = tg.isExpanded !== false;
      const isFullscreen = tg.isFullscreen !== false;
      if (!isExpanded || !isFullscreen) {
        enforceFullscreen();
        scheduleFullscreenRetry();
      }
    };
    const handleFullscreenChanged = () => {
      if (tg.isFullscreen === false) {
        enforceFullscreen();
        scheduleFullscreenRetry();
      }
    };
    const handleFullscreenFailed = () => {
      scheduleFullscreenRetry();
    };

    tg.ready();
    enforceFullscreen();
    tg.enableClosingConfirmation?.();
    applyViewportVars();
    scheduleFullscreenRetry();

    tg.onEvent?.("viewportChanged", handleViewportChanged);
    tg.onEvent?.("safeAreaChanged", applyViewportVars);
    tg.onEvent?.("contentSafeAreaChanged", applyViewportVars);
    tg.onEvent?.("fullscreenChanged", handleFullscreenChanged);
    tg.onEvent?.("fullscreenFailed", handleFullscreenFailed);
    window.addEventListener("resize", applyViewportVars);

    return () => {
      if (fullscreenRetryTimer) {
        window.clearTimeout(fullscreenRetryTimer);
      }
      tg.offEvent?.("viewportChanged", handleViewportChanged);
      tg.offEvent?.("safeAreaChanged", applyViewportVars);
      tg.offEvent?.("contentSafeAreaChanged", applyViewportVars);
      tg.offEvent?.("fullscreenChanged", handleFullscreenChanged);
      tg.offEvent?.("fullscreenFailed", handleFullscreenFailed);
      window.removeEventListener("resize", applyViewportVars);
    };
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
    const [adsRaw, servicesRaw, taxiCityRaw, taxiOutRaw, taxiInRaw, restaurantsRaw, menuRaw] = await Promise.all([
      getListingsRequest({ kind: 1, limit: 200, ...(accountId !== null ? { accountId } : {}) }),
      getListingsRequest({ kind: 2, limit: 200, ...(accountId !== null ? { accountId } : {}) }),
      getTaxiOffersRequest({ direction: 1, limit: 200, ...(accountId !== null ? { accountId } : {}) }),
      getTaxiOffersRequest({ direction: 2, limit: 200, ...(accountId !== null ? { accountId } : {}) }),
      getTaxiOffersRequest({ direction: 3, limit: 200, ...(accountId !== null ? { accountId } : {}) }),
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
    const nextTaxi = [...toArray(taxiCityRaw), ...toArray(taxiOutRaw), ...toArray(taxiInRaw)].map(mapTaxiToUi);
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
    const myActiveTaxi = myTaxi.filter((item) => item.isActive !== false);

    setCustomAds(myAds);
    setCustomServices(myServices);
    setCustomTaxiItems(myActiveTaxi);
    setTaxiTemplates([]);
    setIsTaxiDriver(myActiveTaxi.length > 0);

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
    setTaxiTemplates,
    setUserRestaurantDishes,
    setHasRestaurant,
    setRestaurantEntity,
    setIsTaxiDriver,
  ]);

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
      const ownTaxiByTemplate = taxiTemplates.some((item) => {
        if (!item?.id || typeof id !== "string") return false;
        return id === item.id || id === `template-preview-${item.id}` || id.startsWith(`${item.id}-`);
      });
      const isOwnItem =
        customAds.some((item) => item.id === id)
        || customServices.some((item) => item.id === id)
        || customTaxiItems.some((item) => item.id === id)
        || userRestaurantDishes.some((item) => item.id === id)
        || ownTaxiByTemplate
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
  const normalizedTaxiTemplates = useMemo(
    () => taxiTemplates.map((item) => normalizeEntityPhotos(item)),
    [taxiTemplates]
  );
  const isOwnTaxiItem = useCallback((item) => {
    if (!item) return false;
    if (currentOwner && item.owner === currentOwner) return true;
    if (isTaxiOwnedByProfile(item)) return true;
    const id = String(item.id || "");
    if (!id) return false;
    if (normalizedCustomTaxiItems.some((entry) => entry.id === id)) return true;
    return normalizedTaxiTemplates.some((entry) => {
      const templateId = String(entry.id || "");
      if (!templateId) return false;
      return id === templateId || id === `template-preview-${templateId}` || id.startsWith(`${templateId}-`);
    });
  }, [currentOwner, normalizedCustomTaxiItems, normalizedTaxiTemplates, isTaxiOwnedByProfile]);

  const { taxiCatalog, taxiItems } = useTaxiCatalog({
    customTaxiItems: normalizedTaxiFeedItems,
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
    if (type === "taxi" && isOwnTaxiItem(item)) {
      setModal({
        type: "detail",
        payload: {
          type,
          id,
          fromBusiness: true,
          returnTo: { type: "entityGroup", payload: { group: "taxi" } },
        },
      });
      return;
    }
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
        const currentTaxi = isEdit ? customTaxiItems.find((x) => x.id === editEntityId) : null;
        const rawDepartureAt = payload.when || currentTaxi?.when || undefined;
        const departureAt = toTaxiDepartureAtApiValue(rawDepartureAt);
        if (typeof rawDepartureAt === "string" && rawDepartureAt.trim() && departureAt === null) {
          throw new Error("Неверный формат даты поездки");
        }
        if (isEdit && editEntityKind === "taxi-one-time") {
          const taxiOfferId = Number(String(editEntityId).split("-")[1]);
          if (!taxiOfferId) throw new Error("Некорректный идентификатор поездки");
          const keptExistingPhotos = normalizeSubmittedPhotos(payload.existingPhotos, 1);
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
            departureAt: departureAt === undefined ? undefined : departureAt,
            seatsTotal: seats,
            seatsFree: seats,
            carPhotos: [...keptExistingPhotos, ...uploadedTaxiPhotos].slice(0, 1),
          });
          await removePhotosFromS3(payload.removedPhotos);
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
  const confirmRemoveTaxiOffer = async () => {
    if (modal?.type !== "confirmTaxiDelete") return;
    const taxiId = modal?.payload?.taxiId;
    if (!taxiId) {
      closeModal();
      return;
    }
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
      price: Number(dish.price) || 1,
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
          oneTimeCity: normalizedCustomTaxiItems.filter((x) => x.mode === "one-time" && x.category === "Такси по Цхинвалу"),
          oneTimeIntercity: normalizedCustomTaxiItems.filter((x) => x.mode === "one-time" && x.category !== "Такси по Цхинвалу"),
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
          <button className="ghost-btn topbar-support-btn" onClick={openSupport} type="button">
            Проблема
          </button>
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
            currentOwner={currentOwner}
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
            ownedRestaurantId={restaurantEntity?.id || null}
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
            oneTimeIntercityOffers={customTaxiItems.filter((x) => x.mode === "one-time")}
            myServices={customServices}
            onOpenEntityGroup={openEntityGroup}
            openCreate={openCreate}
            openEditProfile={openEditProfile}
            onOpenSupport={openSupport}
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
            <form key={authMode} className="list" style={{ marginTop: 10 }} onSubmit={handleAuthSubmit}>
              {authMode === "signin" && (
                <label className="field">
                  <span className="small">Телефон</span>
                  <input
                    required
                    name="phone"
                    type="tel"
                    inputMode="numeric"
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
                      type="tel"
                      inputMode="numeric"
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
            onDeleteTaxi={
              detailData.type === "taxi" && isOwnTaxiItem(detailData.item)
                ? removeTaxiOffer
                : null
            }
            isOwnerView={Boolean(
              modal?.payload?.fromBusiness
              || (detailData.type === "restaurant" && detailData.item.id === restaurantEntity?.id)
              || (detailData.type === "ads" && (detailData.item.owner === currentOwner || customAds.some((item) => item.id === detailData.item.id)))
              || (detailData.type === "services" && (detailData.item.owner === currentOwner || customServices.some((item) => item.id === detailData.item.id)))
              || (detailData.type === "food" && userRestaurantDishes.some((dish) => dish.id === detailData.item.id))
              || (detailData.type === "taxi" && isOwnTaxiItem(detailData.item))
            )}
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
