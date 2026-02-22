import { useCallback, useState } from "react";

const GUEST_PROFILE = {
  name: "Гость",
  phone: "-",
  telegram: "-",
  whatsapp: "-",
};

const normalizeSinglePhoto = (photos) => {
  if (!Array.isArray(photos)) return [];
  const firstPhoto = photos.find((photo) => Boolean(String(photo || "").trim()));
  return firstPhoto ? [firstPhoto] : [];
};

const normalizeFivePhotos = (photos) => {
  if (!Array.isArray(photos)) return [];
  return photos
    .filter((photo) => Boolean(String(photo || "").trim()))
    .slice(0, 5);
};

const normalizeEntityPhotos = (item) => ({
  ...item,
  photos: normalizeSinglePhoto(item?.photos),
});

const profileOrGuest = (account) => ({
  name: account?.name || "Гость",
  phone: account?.phone || "-",
  telegram: account?.telegram || "-",
  whatsapp: account?.whatsapp || "-",
});

export function useAuthState({ deepCopy }) {
  const [isAuth, setIsAuth] = useState(false);
  const [authSession, setAuthSession] = useState({
    sessionToken: null,
    accountId: null,
  });
  const [currentOwner, setCurrentOwner] = useState(null);
  const [profile, setProfile] = useState(GUEST_PROFILE);
  const [hasRestaurant, setHasRestaurant] = useState(false);
  const [restaurantEntity, setRestaurantEntity] = useState(null);
  const [customTaxiItems, setCustomTaxiItems] = useState([]);
  const [customServices, setCustomServices] = useState([]);
  const [customAds, setCustomAds] = useState([]);
  const [userRestaurantDishes, setUserRestaurantDishes] = useState([]);
  const [taxiTemplates, setTaxiTemplates] = useState([]);
  const [isTaxiDriver, setIsTaxiDriver] = useState(false);

  const toggleAuth = useCallback((openAuthModal) => {
    if (isAuth) {
      setIsAuth(false);
      setAuthSession({ sessionToken: null, accountId: null });
      setCurrentOwner(null);
      setProfile(GUEST_PROFILE);
      setHasRestaurant(false);
      setRestaurantEntity(null);
      setUserRestaurantDishes([]);
      setCustomServices([]);
      setCustomAds([]);
      setCustomTaxiItems([]);
      setTaxiTemplates([]);
      setIsTaxiDriver(false);
      return;
    }

    openAuthModal();
  }, [isAuth]);

  const applyAuthSession = useCallback(({ sessionToken, account }) => {
    const normalizedAccountId = Number(account?.accountId);
    const accountId = Number.isFinite(normalizedAccountId) ? normalizedAccountId : null;
    const ownerId = accountId ? `account-${accountId}` : null;

    setIsAuth(true);
    setAuthSession({ sessionToken: sessionToken || null, accountId });
    setCurrentOwner(ownerId);
    setProfile(profileOrGuest(account));
    setHasRestaurant(false);
    setRestaurantEntity(null);
    setUserRestaurantDishes([]);
    setCustomServices([]);
    setCustomAds([]);
    setCustomTaxiItems([]);
    setTaxiTemplates([]);
    setIsTaxiDriver(false);

    const data = deepCopy({
      hasRestaurant: false,
      restaurantEntity: null,
      dishes: [],
      services: [],
      ads: [],
      taxiItems: [],
      taxiTemplates: [],
      isTaxiDriver: false,
    });

    const sourceDishes = deepCopy(data.dishes) || [];
    setUserRestaurantDishes(sourceDishes.map((dish) => ({ ...dish, photos: normalizeSinglePhoto(dish?.photos) })));
    setCustomServices((deepCopy(data.services) || []).map((item) => ({ ...item, photos: normalizeFivePhotos(item?.photos) })));
    setCustomAds((deepCopy(data.ads) || []).map((item) => ({ ...item, photos: normalizeFivePhotos(item?.photos) })));
    setCustomTaxiItems((deepCopy(data.taxiItems) || []).map(normalizeEntityPhotos));
    setTaxiTemplates((deepCopy(data.taxiTemplates) || []).map(normalizeEntityPhotos));
    setIsTaxiDriver(Boolean(data.isTaxiDriver));

  }, [deepCopy]);

  return {
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
  };
}
