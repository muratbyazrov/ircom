import { useState } from "react";

const GUEST_PROFILE = {
  name: "Гость",
  phone: "-",
  telegram: "-",
  whatsapp: "-",
  about: "Авторизуйтесь, чтобы управлять профилем.",
};

const normalizeDishPhotos = (photos) => {
  if (!Array.isArray(photos)) return [];
  const firstPhoto = photos.find((photo) => Boolean(String(photo || "").trim()));
  return firstPhoto ? [firstPhoto] : [];
};

const normalizeDish = (dish) => ({
  ...dish,
  photos: normalizeDishPhotos(dish?.photos),
});

export function useAuthState({ testUsers, mock, deepCopy }) {
  const [isAuth, setIsAuth] = useState(false);
  const [currentOwner, setCurrentOwner] = useState(null);
  const [selectedAuthUser, setSelectedAuthUser] = useState("user_with_entities");
  const [profile, setProfile] = useState(GUEST_PROFILE);
  const [hasRestaurant, setHasRestaurant] = useState(false);
  const [restaurantEntity, setRestaurantEntity] = useState(null);
  const [customTaxiItems, setCustomTaxiItems] = useState([]);
  const [customServices, setCustomServices] = useState([]);
  const [customAds, setCustomAds] = useState([]);
  const [userRestaurantDishes, setUserRestaurantDishes] = useState([]);
  const [taxiTemplates, setTaxiTemplates] = useState([]);
  const [isTaxiDriver, setIsTaxiDriver] = useState(false);

  const toggleAuth = (openAuthModal) => {
    if (isAuth) {
      setIsAuth(false);
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
  };

  const applyAuthUser = (userKey) => {
    const data = testUsers[userKey] || testUsers.user_empty;
    setIsAuth(true);
    setCurrentOwner(data.owner || null);
    setProfile(deepCopy(data.profile));
    setHasRestaurant(Boolean(data.hasRestaurant));
    setRestaurantEntity(deepCopy(data.restaurantEntity));
    const restaurantTitle = String(data.restaurantEntity?.title || "").trim();
    const defaultDishes = data.hasRestaurant && restaurantTitle
      ? mock.food
        .filter((dish) => String(dish.restaurant || "").trim() === restaurantTitle)
        .map(normalizeDish)
      : [];
    const sourceDishes = deepCopy(data.dishes) || deepCopy(defaultDishes) || [];
    setUserRestaurantDishes(sourceDishes.map(normalizeDish));
    setCustomServices(deepCopy(data.services) || []);
    setCustomAds(deepCopy(data.ads) || []);
    setCustomTaxiItems(deepCopy(data.taxiItems) || []);
    setTaxiTemplates(deepCopy(data.taxiTemplates) || []);
    setIsTaxiDriver(Boolean(data.isTaxiDriver) || Boolean((data.taxiItems || []).length) || Boolean((data.taxiTemplates || []).length));
  };

  return {
    isAuth,
    currentOwner,
    selectedAuthUser,
    setSelectedAuthUser,
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
    applyAuthUser,
  };
}
