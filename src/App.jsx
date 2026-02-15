import { useEffect, useMemo, useState } from "react";
import { mock } from "./data/mock";
import { CreateForm, DetailModalContent, ProfileEditForm } from "./components/modals";
import { Icon, Modal } from "./components/ui";
import { AdsTab, FoodTab, ProfileTab, ServicesTab, TaxiTab } from "./sections/tabs";
import { tabConfig } from "./utils/constants";
import { sortItems } from "./utils/helpers";

const WEEKDAY_TO_INDEX = { Вс: 0, Пн: 1, Вт: 2, Ср: 3, Чт: 4, Пт: 5, Сб: 6 };
const INDEX_TO_WEEKDAY = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

const toArray = (value) => (Array.isArray(value) ? value : value ? [value] : []);
const dayStart = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const formatDateRu = (date) => new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
const buildUserPhoto = (name, idx) => `https://picsum.photos/seed/${encodeURIComponent(`user-taxi-${name}-${idx}`)}/900/600`;
const randomSuffix = () => Math.random().toString(36).slice(2, 8);
const normalizeWeekdays = (value) => {
  const source = Array.isArray(value) ? value : String(value || "").split(",");
  return source.map((x) => String(x).trim()).filter((x) => x in WEEKDAY_TO_INDEX);
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
  const [customTaxiItems, setCustomTaxiItems] = useState([]);
  const [taxiTemplates, setTaxiTemplates] = useState([]);
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

  const recurringTaxiItems = useMemo(() => buildRecurringTaxiOccurrences(taxiTemplates, 14), [taxiTemplates]);
  const allTaxiItems = useMemo(() => [...customTaxiItems, ...recurringTaxiItems, ...mock.taxi], [customTaxiItems, recurringTaxiItems]);
  const taxiItems = useMemo(
    () => sortItems(allTaxiItems.filter((x) => x.category === taxiCategory), taxiSort, favorites),
    [allTaxiItems, taxiCategory, taxiSort, favorites]
  );

  const openDetail = (type, id) => {
    const source = type === "ads" ? mock.ads : type === "services" ? mock.services : type === "food" ? mock.food : allTaxiItems;
    const item = source.find((x) => x.id === id);
    if (!item) return;
    setModal({ type: "detail", payload: { type, item } });
  };

  const openCreate = (type) => ensureAuth(() => setModal({ type: "create", payload: { type } }));
  const openEditProfile = () => ensureAuth(() => setModal({ type: "profileEdit", payload: profile }));
  const createType = modal?.type === "create" ? modal.payload?.type : null;
  const fullScreenCreate = createType === "ad" || createType === "service" || createType === "taxi" || createType === "restaurant";
  const fullScreenModal = modal?.type === "detail" || modal?.type === "profileEdit" || fullScreenCreate;

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
        onClose={() => setModal(null)}
        variant={fullScreenModal ? "full" : "sheet"}
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
