import { useCallback, useState } from "react";

const GUEST_PROFILE = {
  name: "Гость",
  phone: "-",
  telegram: "-",
  whatsapp: "-",
};

const profileOrGuest = (account) => ({
  name: account?.name || "Гость",
  phone: account?.phone || "-",
  telegram: account?.telegram || "-",
  whatsapp: account?.whatsapp || "-",
});

export function useAuthState() {
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
    setIsTaxiDriver(false);
  }, []);

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
    isTaxiDriver,
    setIsTaxiDriver,
    toggleAuth,
    applyAuthSession,
  };
}
