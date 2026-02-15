import { useEffect, useMemo, useState } from "react";
import { mock } from "./data/mock";
import { CreateForm, DetailModalContent, ProfileEditForm } from "./components/modals";
import { Icon, Modal } from "./components/ui";
import { AdsTab, FoodTab, ProfileTab, ServicesTab, TaxiTab } from "./sections/tabs";
import { tabConfig } from "./utils/constants";
import { sortItems } from "./utils/helpers";

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

  const ensureAuth = (fn) => {
    if (isAuth) return fn();
    setModal({ type: "auth" });
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

  const servicesItems = useMemo(
    () => sortItems(mock.services.filter((x) => serviceCategory === "Все" || x.category === serviceCategory), servicesSort, favorites),
    [serviceCategory, servicesSort, favorites]
  );

  const foodItems = useMemo(
    () => sortItems(mock.food.filter((x) => foodCategory === "Все" || x.category === foodCategory), foodSort, favorites),
    [foodCategory, foodSort, favorites]
  );

  const taxiItems = useMemo(
    () => sortItems(mock.taxi.filter((x) => x.category === taxiCategory), taxiSort, favorites),
    [taxiCategory, taxiSort, favorites]
  );

  const openDetail = (type, id) => {
    const source = type === "ads" ? mock.ads : type === "services" ? mock.services : type === "food" ? mock.food : mock.taxi;
    const item = source.find((x) => x.id === id);
    if (!item) return;
    setModal({ type: "detail", payload: { type, item } });
  };

  const openCreate = (type) => ensureAuth(() => setModal({ type: "create", payload: { type } }));
  const openEditProfile = () => ensureAuth(() => setModal({ type: "profileEdit", payload: profile }));

  const submitMock = (event, type) => {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const payload = Object.fromEntries(fd.entries());

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

    alert(`Мок-отправка (${type})\n${JSON.stringify(payload, null, 2)}`);
    setModal(null);
  };

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
            openEditProfile={openEditProfile}
            setTab={setTab}
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

      <Modal open={Boolean(modal)} onClose={() => setModal(null)} variant={modal?.type === "detail" ? "full" : "sheet"}>
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
                  setModal(null);
                }}
              >
                Войти
              </button>
              <button className="ghost-btn" type="button" onClick={() => setModal(null)}>Отмена</button>
            </div>
          </>
        )}

        {modal?.type === "detail" && <DetailModalContent data={modal.payload} onFav={toggleFavorite} isFav={(id) => favorites.has(id)} />}

        {modal?.type === "create" && (
          <CreateForm type={modal.payload.type} onSubmit={submitMock} onClose={() => setModal(null)} taxiCategories={mock.taxiCategories} />
        )}

        {modal?.type === "profileEdit" && <ProfileEditForm profile={profile} onSubmit={submitMock} onClose={() => setModal(null)} />}
      </Modal>
    </div>
  );
}
