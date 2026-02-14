import { useEffect, useMemo, useRef, useState } from "react";

const fmtRub = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 0,
});

const img = (tags, lock) => `https://loremflickr.com/900/600/${tags}?lock=${lock}`;

const tabConfig = [
  ["ads", "ads", "Объявления"],
  ["services", "services", "Услуги"],
  ["taxi", "taxi", "Такси"],
  ["food", "food", "Еда"],
  ["profile", "profile", "Профиль"],
];

const sortModes = [
  ["date", "По дате"],
  ["price", "По цене"],
  ["fav", "По избранному"],
  ["rating", "По рейтингу"],
];

const mock = {
  adsCategories: ["Все", "Авто", "Недвижимость", "Электроника", "Бытовая техника", "Мебель", "Другое", "Мои объявления"],
  serviceCategories: ["Все", "Кондитерка", "Репетиторы", "Красота", "Автосервис", "Другое"],
  foodCategories: ["Все", "Кавказская кухня", "Суши и роллы", "Осетинские пироги", "Бургеры", "Другое"],
  taxiCategories: ["Такси по Цхинвалу", "Цхинвал -> Владикавказ", "Владикавказ -> Цхинвал"],
  ads: [
    { id: "ad1", category: "Электроника", title: "iPhone 12, 128GB", price: 32000, date: 2, desc: "Состояние отличное, аккумулятор 86%, комплект полный.", owner: "murat", contacts: { phone: "+7(929)123-45-67" }, photos: [img("iphone,smartphone", 101), img("phone,apple", 102), img("mobile,device", 109)] },
    { id: "ad2", category: "Недвижимость", title: "1-комн. квартира", price: 18000, date: 5, desc: "Центр, после ремонта, рядом транспорт.", owner: "other", contacts: { tg: "@rentos", wa: "+7(929)111-11-11" }, photos: [img("apartment,interior", 103), img("flat,living-room", 104), img("kitchen,apartment", 110), img("bedroom,home", 111)] },
    { id: "ad3", category: "Авто", title: "Lada Vesta 2019", price: 790000, date: 1, desc: "Без ДТП, один владелец, торг у капота.", owner: "other", contacts: { phone: "+7(929)777-10-10" }, photos: [img("car,sedan", 105), img("car,interior", 112), img("car,road", 113)] },
    { id: "ad4", category: "Бытовая техника", title: "Стиральная машина LG", price: 17500, date: 4, desc: "Работает тихо, без протечек, 6 кг загрузка.", owner: "other", contacts: { wa: "+7(929)444-11-99" }, photos: [img("washing-machine,home-appliance", 114), img("laundry,appliance", 115)] },
    { id: "ad5", category: "Мебель", title: "Диван угловой", price: 25000, date: 3, desc: "Почти новый, ткань антивандальная, есть ниша для белья.", owner: "murat", contacts: { phone: "+7(929)100-88-11" }, photos: [img("sofa,furniture", 106), img("living-room,sofa", 116), img("furniture,interior", 117)] },
    { id: "ad6", category: "Авто", title: "Комплект зимней резины R16", price: 14000, date: 7, desc: "Nokian, остаток 70%, без грыж и порезов.", owner: "other", contacts: { tg: "@tyres_os" }, photos: [img("tires,car", 107), img("wheel,automotive", 118)] },
    { id: "ad7", category: "Электроника", title: "PlayStation 5", price: 47000, date: 6, desc: "В комплекте 2 геймпада и зарядная станция.", owner: "other", contacts: { wa: "+7(929)101-33-22" }, photos: [img("gaming,console", 108), img("controller,gaming", 119), img("playstation,setup", 120)] },
    { id: "ad8", category: "Другое", title: "Горный велосипед", price: 22000, date: 8, desc: "Алюминиевая рама, дисковые тормоза.", owner: "other", contacts: { phone: "+7(929)453-87-90" }, photos: [img("mountain-bike,bicycle", 121), img("bike,cycling", 122), img("bicycle,trail", 123)] },
  ],
  services: [
    { id: "s1", category: "Кондитерка", title: "Торты на заказ", price: 1800, date: 1, desc: "Свадебные и детские торты, доставка.", contacts: { wa: "+7(929)999-10-10" }, photos: [img("cake,bakery", 201), img("dessert,cake", 206), img("wedding-cake,bakery", 207)] },
    { id: "s2", category: "Репетиторы", title: "Математика 5-11 класс", price: 700, date: 3, desc: "Подготовка к ОГЭ/ЕГЭ, онлайн и офлайн.", contacts: { tg: "@mathcoach" }, photos: [img("teacher,study", 202), img("math,school", 208)] },
    { id: "s3", category: "Красота", title: "Маникюр и покрытие", price: 1200, date: 2, desc: "Стерильный инструмент, дизайн любой сложности.", contacts: { phone: "+7(929)345-12-77" }, photos: [img("manicure,nails", 203), img("nail-salon,beauty", 209), img("beauty,manicure", 210)] },
    { id: "s4", category: "Автосервис", title: "Диагностика двигателя", price: 1500, date: 5, desc: "Компьютерная диагностика и рекомендации.", contacts: { phone: "+7(929)288-00-77" }, photos: [img("car-service,mechanic", 211), img("engine,diagnostic", 212)] },
    { id: "s5", category: "Кондитерка", title: "Осетинские пироги на заказ", price: 450, date: 4, desc: "Горячие, доставка в течение часа.", contacts: { wa: "+7(929)670-90-10" }, photos: [img("pie,bakery", 204), img("pastry,bread", 213)] },
    { id: "s6", category: "Репетиторы", title: "Английский язык", price: 900, date: 6, desc: "Разговорная практика, школьная программа.", contacts: { tg: "@eng_with_ira" }, photos: [img("english,lesson", 205), img("language,teacher", 214)] },
    { id: "s7", category: "Другое", title: "Ремонт ноутбуков", price: 2500, date: 7, desc: "Чистка, замена термопасты, апгрейд SSD.", contacts: { phone: "+7(929)555-77-10" }, photos: [img("laptop,repair", 215), img("computer,service", 216)] },
  ],
  taxi: [
    { id: "t1", category: "Такси по Цхинвалу", name: "Володя", price: 200, rating: 4.0, date: 1, seats: null, when: null, desc: "Быстрая подача, аккуратное вождение.", contacts: { phone: "+7(929)906-78-93", wa: "+7(929)906-78-93" }, photos: [img("taxi,car", 301), img("taxi,city", 307), img("driver,vehicle", 308)] },
    { id: "t2", category: "Такси по Цхинвалу", name: "Руслан", price: 230, rating: 4.6, date: 3, seats: null, when: null, desc: "Детское кресло по запросу.", contacts: { phone: "+7(929)915-11-22" }, photos: [img("car,interior", 309), img("taxi,night", 310)] },
    { id: "t3", category: "Такси по Цхинвалу", name: "Инал", price: 180, rating: 4.2, date: 5, seats: null, when: null, desc: "Работаю до позднего вечера.", contacts: { tg: "@inal_drive" }, photos: [img("driver,car", 302), img("street,car", 311)] },
    { id: "t4", category: "Цхинвал -> Владикавказ", name: "Алан", price: 1200, rating: 4.4, date: 0, seats: { total: 4, free: 2 }, when: "Сегодня 15:30", desc: "Еду через КПП, помогу с багажом.", contacts: { phone: "+7(929)800-11-22", tg: "@alanride" }, photos: [img("road,car", 303), img("highway,trip", 312), img("car,mountains", 313)] },
    { id: "t5", category: "Цхинвал -> Владикавказ", name: "Георгий", price: 1100, rating: 4.7, date: 2, seats: { total: 4, free: 1 }, when: "Завтра 08:00", desc: "Пунктуально, без задержек.", contacts: { wa: "+7(929)401-40-40" }, photos: [img("highway,car", 304), img("road,mountain", 314)] },
    { id: "t6", category: "Владикавказ -> Цхинвал", name: "Сослан", price: 1300, rating: 4.2, date: 4, seats: { total: 4, free: 1 }, when: "Завтра 09:00", desc: "Выезд по расписанию, кондиционер.", contacts: { phone: "+7(929)333-22-11" }, photos: [img("travel,car", 305), img("trip,car", 315)] },
    { id: "t7", category: "Владикавказ -> Цхинвал", name: "Тамерлан", price: 1250, rating: 4.5, date: 2, seats: { total: 4, free: 3 }, when: "Сегодня 19:20", desc: "Можно с небольшими животными.", contacts: { tg: "@tam_taxi" }, photos: [img("evening,car", 316), img("road,night", 317)] },
    { id: "t8", category: "Владикавказ -> Цхинвал", name: "Коста", price: 1400, rating: 4.1, date: 6, seats: { total: 6, free: 4 }, when: "Пн 07:30", desc: "Минивэн, много места для багажа.", contacts: { phone: "+7(929)500-01-00" }, photos: [img("minivan,travel", 306), img("van,road", 318), img("vehicle,trip", 319)] },
  ],
  food: [
    { id: "f1", category: "Осетинские пироги", title: "Пирог с сыром", price: 450, prep: 35, always: false, delivery: true, desc: "Тонкое тесто, свежий сыр, 30см.", contacts: { phone: "+7(929)444-10-10" }, photos: [img("pie,food", 401), img("pie,cheese", 408), img("baked,pie", 409)] },
    { id: "f2", category: "Бургеры", title: "Чизбургер", price: 350, prep: 20, always: true, delivery: false, desc: "Говяжья котлета, фирменный соус.", contacts: { wa: "+7(929)550-70-70" }, photos: [img("burger,food", 402), img("burger,fries", 410), img("burger,restaurant", 411)] },
    { id: "f3", category: "Суши и роллы", title: "Филадельфия", price: 620, prep: 30, always: false, delivery: true, desc: "Классический ролл с лососем.", contacts: { phone: "+7(929)333-90-90" }, photos: [img("sushi,roll", 403), img("sushi,salmon", 412)] },
    { id: "f4", category: "Кавказская кухня", title: "Шашлык из телятины", price: 780, prep: 45, always: false, delivery: true, desc: "Маринад по фирменному рецепту.", contacts: { tg: "@kavkaz_food" }, photos: [img("barbecue,meat", 404), img("grill,kebab", 413), img("meat,bbq", 414)] },
    { id: "f5", category: "Осетинские пироги", title: "Пирог с картофелем", price: 430, prep: 25, always: true, delivery: true, desc: "Домашний вкус и мягкое тесто.", contacts: { wa: "+7(929)611-11-12" }, photos: [img("pie,baked", 405), img("potato,pie", 415)] },
    { id: "f6", category: "Бургеры", title: "Двойной бургер", price: 520, prep: 25, always: false, delivery: false, desc: "Двойная котлета и много сыра.", contacts: { phone: "+7(929)789-40-20" }, photos: [img("double-burger,food", 416), img("burger,cheese", 417)] },
    { id: "f7", category: "Другое", title: "Сырники со сметаной", price: 280, prep: 15, always: true, delivery: false, desc: "Завтрак на каждый день.", contacts: { wa: "+7(929)100-22-33" }, photos: [img("breakfast,pancake", 406), img("syrniki,breakfast", 418)] },
    { id: "f8", category: "Суши и роллы", title: "Сет Классический", price: 1200, prep: 50, always: false, delivery: true, desc: "24 кусочка, подходит на 2-3 человек.", contacts: { phone: "+7(929)880-80-70" }, photos: [img("sushi,set", 407), img("sushi,platter", 419), img("japanese,food", 420)] },
  ],
};

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
          <p>{isAuth ? "Вы авторизованы" : "Гостевой режим"}</p>
        </div>
        <button className="ghost-btn" onClick={toggleAuth} type="button">
          {isAuth ? "Выйти" : "Войти"}
        </button>
      </header>

      <main className="screen">
        {tab === "ads" && (
          <>
            <SectionHeader title="Объявления" subtitle="Продажа б/у вещей" actionLabel="Разместить" onAction={() => openCreate("ad")} />
            <Section>
              <ChipRow list={adsCategoriesVisible} value={adsCategory} onChange={setAdsCategory} />
              <SortSelect value={adsSort} onChange={setAdsSort} />
            </Section>
            <section className="list">
              {adsItems.length ? adsItems.map((x) => <ItemCard key={x.id} item={x} onOpen={() => openDetail("ads", x.id)} onFav={() => toggleFavorite(x.id)} activeFav={favorites.has(x.id)} />) : <Empty text="Пока нет объявлений" />}
            </section>
          </>
        )}

        {tab === "services" && (
          <>
            <SectionHeader title="Услуги" actionLabel="Разместить услугу" onAction={() => openCreate("service")} />
            <Section>
              <ChipRow list={mock.serviceCategories} value={serviceCategory} onChange={setServiceCategory} />
              <SortSelect value={servicesSort} onChange={setServicesSort} />
            </Section>
            <section className="list">
              {servicesItems.length ? servicesItems.map((x) => <ItemCard key={x.id} item={x} onOpen={() => openDetail("services", x.id)} onFav={() => toggleFavorite(x.id)} activeFav={favorites.has(x.id)} />) : <Empty text="Пока нет услуг" />}
            </section>
          </>
        )}

        {tab === "taxi" && (
          <>
            <SectionHeader title="Такси" actionLabel="Добавить себя" onAction={() => openCreate("taxi")} />
            <Section>
              <ChipRow list={mock.taxiCategories} value={taxiCategory} onChange={setTaxiCategory} />
              <SortSelect value={taxiSort} onChange={setTaxiSort} />
            </Section>
            <section className="list">
              {taxiItems.length ? taxiItems.map((x) => <TaxiCard key={x.id} item={x} onOpen={() => openDetail("taxi", x.id)} onFav={() => toggleFavorite(x.id)} activeFav={favorites.has(x.id)} />) : <Empty text="Пока нет предложений" />}
            </section>
          </>
        )}

        {tab === "food" && (
          <>
            <SectionHeader title="Еда" actionLabel="Добавить блюдо" onAction={() => openCreate("dish")} />
            <Section>
              <ChipRow list={mock.foodCategories} value={foodCategory} onChange={setFoodCategory} />
              <div className="actions" style={{ marginTop: 10 }}>
                <button className="ghost-btn" onClick={() => openCreate("restaurant")} type="button">
                  {hasRestaurant ? "Управлять заведением" : "Создать заведение"}
                </button>
              </div>
              <SortSelect value={foodSort} onChange={setFoodSort} />
            </Section>
            <section className="list">
              {foodItems.length ? foodItems.map((x) => <FoodCard key={x.id} item={x} onOpen={() => openDetail("food", x.id)} onFav={() => toggleFavorite(x.id)} activeFav={favorites.has(x.id)} />) : <Empty text="Пока нет блюд" />}
            </section>
          </>
        )}

        {tab === "profile" && (
          <Section>
            <h2>Профиль</h2>
            <p className="small">{isAuth ? "Аккаунт активен" : "Войдите для публикации, лайков и редактирования"}</p>

            <div className="grid-2" style={{ marginTop: 10 }}>
              <StatCard title={profile.name} caption="Имя" />
              <StatCard title={profile.phone} caption="Телефон" />
              <StatCard title={profile.telegram} caption="Telegram" />
              <StatCard title={profile.whatsapp} caption="WhatsApp" />
            </div>

            <Section>
              <h4>О себе</h4>
              <p className="small">{profile.about}</p>
            </Section>

            <div className="grid-2" style={{ marginTop: 10 }}>
              <StatCard title={String(mock.ads.filter((x) => x.owner === "murat").length)} caption="Мои объявления" />
              <StatCard title="2" caption="Мои услуги" />
            </div>

            <div className="actions" style={{ marginTop: 10 }}>
              <button className="primary-btn" type="button" onClick={openEditProfile}>Редактировать профиль</button>
              <button className="ghost-btn" type="button" onClick={() => setTab("ads")}>К объявлениям</button>
              <button className="ghost-btn" type="button" onClick={() => setTab("food")}>К еде</button>
            </div>
          </Section>
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

      <Modal open={Boolean(modal)} onClose={() => setModal(null)}>
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

function Section({ children }) {
  return <section className="section">{children}</section>;
}

function SectionHeader({ title, subtitle, actionLabel, onAction }) {
  return (
    <Section>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h2>{title}</h2>
        {actionLabel ? (
          <button className="primary-btn" type="button" onClick={onAction}>
            {actionLabel}
          </button>
        ) : null}
      </div>
      {subtitle ? <p className="small">{subtitle}</p> : null}
    </Section>
  );
}

function ChipRow({ list, value, onChange }) {
  return (
    <div className="row wrap" style={{ marginTop: 10 }}>
      {list.map((item) => (
        <button key={item} className={`chip ${value === item ? "active" : ""}`} type="button" onClick={() => onChange(item)}>
          {item}
        </button>
      ))}
    </div>
  );
}

function SortSelect({ value, onChange }) {
  return (
    <div style={{ marginTop: 10 }}>
      <label className="label">Сортировка</label>
      <select className="select" value={value} onChange={(e) => onChange(e.target.value)}>
        {sortModes.map(([v, l]) => (
          <option value={v} key={v}>{l}</option>
        ))}
      </select>
    </div>
  );
}

function ItemCard({ item, onOpen, onFav, activeFav }) {
  return (
    <article className="card">
      <div className="card-body">
        <Media photos={item.photos} emptyText="Нет фотографий" />
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div className="card-title">{item.title}</div>
            <div className="meta">{item.category} · {item.date} дн. назад</div>
          </div>
          <div className="price">{fmtRub.format(item.price)}</div>
        </div>
        <p className="small">{short(item.desc)}</p>
        <div className="actions">
          <button className="soft-btn" type="button" onClick={onOpen}><Icon name="open" /> Открыть</button>
          <button className="ghost-btn" type="button" onClick={onFav}>{activeFav ? <><Icon name="heart-fill" /> В избранном</> : <><Icon name="heart" /> В избранное</>}</button>
        </div>
      </div>
    </article>
  );
}

function TaxiCard({ item, onOpen, onFav, activeFav }) {
  return (
    <article className="card">
      <div className="card-body">
        <div className="grid-2" style={{ gridTemplateColumns: "94px 1fr", alignItems: "center" }}>
          <Media photos={item.photos} emptyText="Нет фото" compact />
          <div>
            <div className="card-title">{item.name}</div>
            <div className="meta">{item.category}</div>
            <div className="price">{fmtRub.format(item.price)}</div>
            <div className="small">Оценка {item.rating.toFixed(1)}</div>
          </div>
        </div>
        <div className="row wrap">
          {item.when ? <span className="badge">{item.when}</span> : null}
          {item.seats ? <span className="badge">Места: {item.seats.free}/{item.seats.total}</span> : null}
        </div>
        <p className="small">{short(item.desc)}</p>
        <div className="actions">
          <button className="soft-btn" type="button" onClick={onOpen}><Icon name="open" /> Открыть</button>
          <button className="ghost-btn" type="button" onClick={onFav}>{activeFav ? <><Icon name="heart-fill" /> В избранном</> : <><Icon name="heart" /> В избранное</>}</button>
        </div>
      </div>
    </article>
  );
}

function FoodCard({ item, onOpen, onFav, activeFav }) {
  return (
    <article className="card">
      <div className="card-body">
        <Media photos={item.photos} emptyText="Нет фотографий" />
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div className="card-title">{item.title}</div>
            <div className="meta">{item.category}</div>
          </div>
          <div className="price">{fmtRub.format(item.price)}</div>
        </div>
        <div className="row wrap">
          <span className="badge">{item.always ? "Всегда в наличии" : `${item.prep} мин`}</span>
          <span className="badge">{item.delivery ? "Есть доставка" : "Самовывоз"}</span>
        </div>
        <p className="small">{short(item.desc)}</p>
        <div className="actions">
          <button className="soft-btn" type="button" onClick={onOpen}><Icon name="open" /> Открыть</button>
          <button className="ghost-btn" type="button" onClick={onFav}>{activeFav ? <><Icon name="heart-fill" /> В избранном</> : <><Icon name="heart" /> В избранное</>}</button>
        </div>
      </div>
    </article>
  );
}

function Media({ photos, emptyText, compact = false, onOpen }) {
  const cover = photos?.[0];
  return (
    <div
      className={`media ${compact ? "media-compact" : ""} ${cover ? "media-has-image" : ""} ${cover && onOpen ? "media-clickable" : ""}`}
      role={cover && onOpen ? "button" : undefined}
      tabIndex={cover && onOpen ? 0 : undefined}
      onClick={cover && onOpen ? onOpen : undefined}
      onKeyDown={(e) => {
        if (cover && onOpen && (e.key === "Enter" || e.key === " ")) onOpen();
      }}
    >
      {cover ? <img className="media-img" src={cover} alt="preview" loading="lazy" /> : <div className="media-empty">{emptyText}</div>}
    </div>
  );
}

function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <section className="modal" aria-hidden="false">
      <div className="modal-backdrop" onClick={onClose} />
      <article className="modal-card">{children}</article>
    </section>
  );
}

function DetailModalContent({ data, onFav, isFav }) {
  const { item, type } = data;
  const photos = item.photos || [];
  const [viewerIndex, setViewerIndex] = useState(null);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [zoom, setZoom] = useState(1);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const pinchStartDist = useRef(null);
  const pinchStartScale = useRef(1);
  const lastTapAt = useRef(0);
  const contactButtons = Object.entries(item.contacts || {}).map(([k, v]) => (
    <button className="ghost-btn" key={`${k}-${v}`} type="button" onClick={() => alert(`Откроем контакт: ${v}`)}>
      {contactLabel(k)} {v}
    </button>
  ));
  const showPrev = () => setViewerIndex((prev) => Math.max(0, prev - 1));
  const showNext = () => setViewerIndex((prev) => Math.min(photos.length - 1, prev + 1));

  useEffect(() => {
    if (viewerIndex === null) return;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const modalCard = document.querySelector(".modal-card");
    const prevCardOverflow = modalCard?.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    if (modalCard) modalCard.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      if (modalCard) modalCard.style.overflow = prevCardOverflow || "";
    };
  }, [viewerIndex]);

  useEffect(() => {
    if (viewerIndex === null) return;
    setDragX(0);
    setIsDragging(false);
    setZoom(1);
  }, [viewerIndex]);

  return (
    <>
      <h3 style={{ marginBottom: 8 }}>{item.title || item.name}</h3>
      <Media photos={photos} emptyText="Нет фотографий" onOpen={() => (photos.length ? setViewerIndex(0) : null)} />
      {photos.length > 1 ? (
        <div className="gallery" style={{ marginTop: 8 }}>
          {photos.slice(1).map((photo, thumbIndex) => {
            const index = thumbIndex + 1;
            return (
            <button key={photo} className="gallery-btn" type="button" onClick={() => setViewerIndex(index)}>
              <img className="gallery-img" src={photo} alt="gallery" loading="lazy" />
            </button>
          );
          })}
        </div>
      ) : null}
      <p><b>Цена:</b> {fmtRub.format(item.price)}</p>
      {type === "food" ? <p><b>Готовность:</b> {item.always ? "Всегда в наличии" : `${item.prep} минут`}</p> : null}
      {type === "taxi" && item.when ? <p><b>Дата и время:</b> {item.when}</p> : null}
      {type === "taxi" && item.seats ? <p><b>Места:</b> {item.seats.free}/{item.seats.total}</p> : null}
      <p><b>Описание:</b> {item.desc || "Нет описания"}</p>
      <div className="actions" style={{ marginTop: 8 }}>{contactButtons.length ? contactButtons : <p className="small">Контакты не указаны</p>}</div>
      <div className="actions" style={{ marginTop: 8 }}>
        <button className="primary-btn" type="button" onClick={() => onFav(item.id)}>{isFav(item.id) ? <><Icon name="heart-fill" /> Убрать из избранного</> : <><Icon name="heart" /> В избранное</>}</button>
      </div>

      {viewerIndex !== null ? (
        <section className="viewer" role="dialog" aria-modal="true" aria-label="Просмотр фото">
          <div
            className="viewer-content"
            onTouchStart={(e) => {
              if (e.touches.length === 2) {
                pinchStartDist.current = getTouchDistance(e.touches[0], e.touches[1]);
                pinchStartScale.current = zoom;
                setIsDragging(false);
                return;
              }
              touchStartX.current = e.changedTouches[0]?.clientX ?? null;
              touchStartY.current = e.changedTouches[0]?.clientY ?? null;
              setIsDragging(true);
            }}
            onTouchMove={(e) => {
              if (e.touches.length === 2) {
                const dist = getTouchDistance(e.touches[0], e.touches[1]);
                if (pinchStartDist.current) {
                  const nextScale = clamp(pinchStartScale.current * (dist / pinchStartDist.current), 1, 4);
                  setZoom(nextScale);
                }
                return;
              }

              if (zoom > 1 || !isDragging || touchStartX.current === null) return;
              const currentX = e.changedTouches[0]?.clientX ?? touchStartX.current;
              setDragX(currentX - touchStartX.current);
            }}
            onTouchEnd={(e) => {
              if (pinchStartDist.current) {
                pinchStartDist.current = null;
                pinchStartScale.current = zoom;
              }

              if (touchStartY.current === null || touchStartX.current === null) return;
              const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
              const endY = e.changedTouches[0]?.clientY ?? touchStartY.current;
              const deltaX = endX - touchStartX.current;
              const delta = endY - touchStartY.current;
              touchStartX.current = null;
              touchStartY.current = null;
              setIsDragging(false);
              const absX = Math.abs(deltaX);
              const absY = Math.abs(delta);

              if (zoom === 1 && absX > absY && absX >= 40 && photos.length > 1) {
                if (deltaX < 0) showNext();
                else showPrev();
                setDragX(0);
                return;
              }

              if (absX < 12 && absY < 12) {
                const now = Date.now();
                if (now - lastTapAt.current < 260) {
                  setZoom((prev) => (prev > 1 ? 1 : 2));
                  lastTapAt.current = 0;
                } else {
                  lastTapAt.current = now;
                }
              }

              setDragX(0);
            }}
          >
            <div
              className="viewer-track"
              style={{
                transform: `translate3d(calc(${-viewerIndex * 100}% + ${dragX}px), 0, 0)`,
                transition: isDragging || zoom > 1 ? "none" : "transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1)",
              }}
            >
              {photos.map((photo, idx) => (
                <div className="viewer-slide" key={photo}>
                  <img
                    className="viewer-img"
                    src={photo}
                    alt="fullscreen"
                    draggable={false}
                    style={{
                      transform: idx === viewerIndex ? `scale(${zoom})` : "scale(1)",
                      transition: "transform 180ms ease",
                    }}
                  />
                </div>
              ))}
            </div>
            <button className="viewer-close" type="button" onClick={() => setViewerIndex(null)}>
              ×
            </button>
          </div>
        </section>
      ) : null}
    </>
  );
}

function CreateForm({ type, onSubmit, onClose, taxiCategories }) {
  if (type === "restaurant") {
    return (
      <>
        <h3 style={{ marginBottom: 8 }}>Создать заведение</h3>
        <form className="list" onSubmit={(e) => onSubmit(e, "restaurant")}>
          <Field label="Название"><input required name="title" className="input" minLength={2} maxLength={100} /></Field>
          <Field label="Описание"><textarea required name="desc" className="textarea" maxLength={2000} /></Field>
          <Field label="Логотип"><input name="logo" className="input" placeholder="https://..." /></Field>
          <FormActions onClose={onClose} />
        </form>
      </>
    );
  }

  if (type === "taxi") {
    return (
      <>
        <h3 style={{ marginBottom: 8 }}>Создание предложения такси</h3>
        <form className="list" onSubmit={(e) => onSubmit(e, "taxi")}>
          <Field label="Направление">
            <select name="category" className="select">{taxiCategories.map((x) => <option key={x}>{x}</option>)}</select>
          </Field>
          <Field label="Имя/ник"><input required name="name" className="input" minLength={2} maxLength={60} /></Field>
          <div className="grid-2">
            <Field label="Стоимость"><input required name="price" type="number" min={1} className="input" /></Field>
            <Field label="Свободных мест"><input name="seats" type="number" min={1} className="input" /></Field>
          </div>
          <Field label="Дата и время"><input name="when" className="input" placeholder="Например, Сегодня 15:30" /></Field>
          <Field label="Телефон"><input required name="phone" className="input" /></Field>
          <Field label="WhatsApp"><input name="wa" className="input" /></Field>
          <Field label="Telegram"><input name="tg" className="input" /></Field>
          <Field label="Описание"><textarea name="desc" className="textarea" maxLength={2000} /></Field>
          <Field label="Фото автомобиля"><input name="photo" className="input" placeholder="https://..." /></Field>
          <FormActions onClose={onClose} />
        </form>
      </>
    );
  }

  const categories = type === "ad"
    ? mock.adsCategories.filter((x) => x !== "Мои объявления")
    : type === "service"
    ? mock.serviceCategories
    : mock.foodCategories;

  return (
    <>
      <h3 style={{ marginBottom: 8 }}>{type === "ad" ? "Создание объявления" : type === "service" ? "Создание услуги" : "Добавление блюда"}</h3>
      <form className="list" onSubmit={(e) => onSubmit(e, type)}>
        <Field label="Название"><input required name="title" className="input" minLength={3} maxLength={80} /></Field>
        <Field label="Категория"><select className="select" name="category">{categories.map((x) => <option key={x}>{x}</option>)}</select></Field>
        <Field label="Цена, ₽"><input required name="price" type="number" min={1} className="input" /></Field>
        <Field label="Описание"><textarea required name="desc" className="textarea" minLength={10} maxLength={2000} /></Field>
        <Field label="Фото (до 10)">
          <input
            type="file"
            name="images"
            className="input"
            multiple
            accept="image/*"
            onClick={(e) => {
              e.currentTarget.value = "";
            }}
          />
        </Field>
        <FormActions onClose={onClose} />
      </form>
    </>
  );
}

function ProfileEditForm({ profile, onSubmit, onClose }) {
  return (
    <>
      <h3 style={{ marginBottom: 8 }}>Редактирование профиля</h3>
      <form className="list" onSubmit={(e) => onSubmit(e, "profile")}>
        <Field label="Имя"><input required name="name" defaultValue={profile.name} className="input" minLength={2} maxLength={80} /></Field>
        <Field label="Телефон"><input required name="phone" defaultValue={profile.phone} className="input" /></Field>
        <Field label="Telegram"><input name="telegram" defaultValue={profile.telegram} className="input" /></Field>
        <Field label="WhatsApp"><input name="whatsapp" defaultValue={profile.whatsapp} className="input" /></Field>
        <Field label="О себе"><textarea name="about" defaultValue={profile.about} className="textarea" maxLength={500} /></Field>
        <FormActions onClose={onClose} />
      </form>
    </>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div className="label">{label}</div>
      {children}
    </div>
  );
}

function FormActions({ onClose }) {
  return (
    <div className="actions">
      <button className="primary-btn" type="submit">Сохранить</button>
      <button className="ghost-btn" type="button" onClick={onClose}>Отмена</button>
    </div>
  );
}

function Icon({ name }) {
  const paths = {
    ads: <path d="M6 3h9l3 3v15H6zM15 3v3h3M9 11h6M9 15h6M9 19h4" />,
    services: <path d="M14 4l6 6-2 2-1-1-3 3 1 1-2 2-6-6 7-7zM4 20l5-5" />,
    taxi: <path d="M5 13h14l-1-4a3 3 0 0 0-3-2H9a3 3 0 0 0-3 2l-1 4zM7 17h0M17 17h0M6 13v4M18 13v4" />,
    food: <path d="M7 3v8M10 3v8M7 7h3M15 3v18M19 3c0 3-2 5-4 5" />,
    profile: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0" />,
    open: <path d="M14 4h6v6M10 14l10-10M5 8v11h11" />,
    heart: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.6-7 10-7 10z" />,
    "heart-fill": <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.6-7 10-7 10z" fill="currentColor" stroke="none" />,
  };
  return (
    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name] || null}
    </svg>
  );
}

function StatCard({ title, caption }) {
  return (
    <div className="section" style={{ padding: 10 }}>
      <h4>{title}</h4>
      <p className="small">{caption}</p>
    </div>
  );
}

function Empty({ text }) {
  return (
    <div className="section">
      <p className="small">{text}</p>
    </div>
  );
}

function sortItems(items, mode, favorites) {
  const out = [...items];
  if (mode === "price") out.sort((a, b) => (a.price || 0) - (b.price || 0));
  if (mode === "date") out.sort((a, b) => (a.date || 0) - (b.date || 0));
  if (mode === "rating") out.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  if (mode === "fav") out.sort((a, b) => Number(favorites.has(b.id)) - Number(favorites.has(a.id)));
  return out;
}

function short(text) {
  if (!text) return "";
  return text.length > 96 ? `${text.slice(0, 96)}...` : text;
}

function getTouchDistance(touchA, touchB) {
  const dx = touchA.clientX - touchB.clientX;
  const dy = touchA.clientY - touchB.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function contactLabel(key) {
  if (key === "phone") return "Тел:";
  if (key === "wa") return "WA:";
  if (key === "tg") return "TG:";
  return `${key}:`;
}
