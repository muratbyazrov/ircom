import { useEffect, useMemo, useState } from "react";

const fmtRub = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 0,
});

const mock = {
  adsCategories: ["Все", "Авто", "Недвижимость", "Электроника", "Бытовая техника", "Мебель", "Другое", "Мои объявления"],
  serviceCategories: ["Все", "Кондитерка", "Репетиторы", "Красота", "Автосервис", "Другое"],
  foodCategories: ["Все", "Кавказская кухня", "Суши и роллы", "Осетинские пироги", "Бургеры", "Другое"],
  taxiCategories: ["Такси по Цхинвалу", "Цхинвал -> Владикавказ", "Владикавказ -> Цхинвал"],
  ads: [
    { id: "ad1", category: "Электроника", title: "iPhone 12, 128GB", price: 32000, date: 2, desc: "Состояние отличное, аккумулятор 86%, комплект полный.", media: "Фото товара", owner: "murat", contacts: { phone: "+7(929)123-45-67" } },
    { id: "ad2", category: "Недвижимость", deal: "Аренда", title: "1-комн. квартира", price: 18000, date: 5, desc: "Центр, после ремонта, рядом транспорт.", media: "Фото квартиры", owner: "other", contacts: { tg: "@rentos", wa: "+7(929)111-11-11" } },
    { id: "ad3", category: "Авто", title: "Lada Vesta 2019", price: 790000, date: 1, desc: "Без ДТП, один владелец, торг у капота.", media: "Фото авто", owner: "other", contacts: { phone: "+7(929)777-10-10" } },
  ],
  services: [
    { id: "s1", category: "Кондитерка", title: "Торты на заказ", price: 1800, date: 1, desc: "Свадебные и детские торты, доставка.", media: "Фото услуги", contacts: { wa: "+7(929)999-10-10" } },
    { id: "s2", category: "Репетиторы", title: "Математика 5-11 класс", price: 700, date: 3, desc: "Подготовка к ОГЭ/ЕГЭ, онлайн и офлайн.", media: "Фото услуги", contacts: { tg: "@mathcoach" } },
  ],
  taxi: [
    { id: "t1", category: "Такси по Цхинвалу", name: "Володя", price: 200, rating: 4.0, seats: null, when: null, desc: "Быстрая подача, аккуратное вождение.", contacts: { phone: "+7(929)906-78-93", wa: "+7(929)906-78-93" }, media: "Фото автомобиля" },
    { id: "t2", category: "Цхинвал -> Владикавказ", name: "Алан", price: 1200, rating: 4.4, seats: { total: 4, free: 2 }, when: "Сегодня 15:30", desc: "Еду через КПП, помогу с багажом.", contacts: { phone: "+7(929)800-11-22", tg: "@alanride" }, media: "Фото автомобиля" },
    { id: "t3", category: "Владикавказ -> Цхинвал", name: "Сослан", price: 1300, rating: 4.2, seats: { total: 4, free: 1 }, when: "Завтра 09:00", desc: "Выезд по расписанию, кондиционер.", contacts: { phone: "+7(929)333-22-11" }, media: "Фото автомобиля" },
  ],
  food: [
    { id: "f1", category: "Осетинские пироги", title: "Пирог с сыром", price: 450, prep: 35, always: false, delivery: true, desc: "Тонкое тесто, свежий сыр, 30см.", media: "Фото блюда", contacts: { phone: "+7(929)444-10-10" } },
    { id: "f2", category: "Бургеры", title: "Чизбургер", price: 350, prep: 20, always: true, delivery: false, desc: "Говяжья котлета, фирменный соус.", media: "Фото блюда", contacts: { wa: "+7(929)550-70-70" } },
  ],
};

const tabs = [
  ["ads", "Объявления"],
  ["services", "Услуги"],
  ["taxi", "Такси"],
  ["food", "Еда"],
  ["profile", "Профиль"],
];

const sortModes = [
  ["date", "По дате"],
  ["price", "По цене"],
  ["fav", "По избранному"],
  ["rating", "По рейтингу"],
];

export default function App() {
  const [tab, setTab] = useState("ads");
  const [isAuth, setIsAuth] = useState(false);
  const [userName, setUserName] = useState("Гость");
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

  const toggleAuth = () => {
    if (isAuth) {
      setIsAuth(false);
      setUserName("Гость");
      setHasRestaurant(false);
      return;
    }
    setIsAuth(true);
    setUserName("Мурад");
  };

  const ensureAuth = (fn) => {
    if (isAuth) return fn();
    setModal({
      type: "auth",
      payload: null,
    });
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

  const servicesItems = useMemo(() => sortItems(mock.services.filter((x) => serviceCategory === "Все" || x.category === serviceCategory), servicesSort, favorites), [serviceCategory, servicesSort, favorites]);
  const foodItems = useMemo(() => sortItems(mock.food.filter((x) => foodCategory === "Все" || x.category === foodCategory), foodSort, favorites), [foodCategory, foodSort, favorites]);
  const taxiItems = useMemo(() => sortItems(mock.taxi.filter((x) => x.category === taxiCategory), taxiSort, favorites), [taxiCategory, taxiSort, favorites]);

  const openDetail = (type, id) => {
    const source = type === "ads" ? mock.ads : type === "services" ? mock.services : type === "food" ? mock.food : mock.taxi;
    const item = source.find((x) => x.id === id);
    if (!item) return;
    setModal({ type: "detail", payload: { type, item } });
  };

  const openCreate = (type) => ensureAuth(() => setModal({ type: "create", payload: { type } }));

  const submitMock = (event, type) => {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const payload = Object.fromEntries(fd.entries());
    if (type === "restaurant") setHasRestaurant(true);
    alert(`Мок-отправка (${type})\n${JSON.stringify(payload, null, 2)}`);
    setModal(null);
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <h1>{tab === "profile" ? `Профиль: ${userName}` : "ircom"}</h1>
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
              <ChipRow
                list={adsCategoriesVisible}
                value={adsCategory}
                onChange={setAdsCategory}
              />
              <SortSelect value={adsSort} onChange={setAdsSort} />
            </Section>
            <section className="list">{adsItems.length ? adsItems.map((x) => <ItemCard key={x.id} item={x} onOpen={() => openDetail("ads", x.id)} onFav={() => toggleFavorite(x.id)} activeFav={favorites.has(x.id)} />) : <Empty text="Пока нет объявлений" />}</section>
          </>
        )}

        {tab === "services" && (
          <>
            <SectionHeader title="Услуги" actionLabel="Разместить услугу" onAction={() => openCreate("service")} />
            <Section>
              <ChipRow list={mock.serviceCategories} value={serviceCategory} onChange={setServiceCategory} />
              <SortSelect value={servicesSort} onChange={setServicesSort} />
            </Section>
            <section className="list">{servicesItems.length ? servicesItems.map((x) => <ItemCard key={x.id} item={x} onOpen={() => openDetail("services", x.id)} onFav={() => toggleFavorite(x.id)} activeFav={favorites.has(x.id)} />) : <Empty text="Пока нет услуг" />}</section>
          </>
        )}

        {tab === "taxi" && (
          <>
            <SectionHeader title="Такси" actionLabel="Добавить себя" onAction={() => openCreate("taxi")} />
            <Section>
              <ChipRow list={mock.taxiCategories} value={taxiCategory} onChange={setTaxiCategory} />
              <SortSelect value={taxiSort} onChange={setTaxiSort} />
            </Section>
            <section className="list">{taxiItems.length ? taxiItems.map((x) => <TaxiCard key={x.id} item={x} onOpen={() => openDetail("taxi", x.id)} onFav={() => toggleFavorite(x.id)} activeFav={favorites.has(x.id)} />) : <Empty text="Пока нет предложений" />}</section>
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
            <section className="list">{foodItems.length ? foodItems.map((x) => <FoodCard key={x.id} item={x} onOpen={() => openDetail("food", x.id)} onFav={() => toggleFavorite(x.id)} activeFav={favorites.has(x.id)} />) : <Empty text="Пока нет блюд" />}</section>
          </>
        )}

        {tab === "profile" && (
          <Section>
            <h2>Профиль</h2>
            <p className="small">{isAuth ? "Аккаунт активен" : "Войдите для публикации и лайков"}</p>
            <div className="grid-2" style={{ marginTop: 10 }}>
              <StatCard title={isAuth ? userName : "Гость"} caption="Имя" />
              <StatCard title={isAuth ? "+7(929)000-00-00" : "-"} caption="Телефон" />
              <StatCard title={String(mock.ads.filter((x) => x.owner === "murat").length)} caption="Мои объявления" />
              <StatCard title="1" caption="Мои услуги" />
            </div>
            <div className="actions" style={{ marginTop: 10 }}>
              <button className="ghost-btn" type="button" onClick={() => setTab("ads")}>Перейти в объявления</button>
              <button className="ghost-btn" type="button" onClick={() => setTab("food")}>Перейти в еду</button>
            </div>
          </Section>
        )}
      </main>

      <nav className="bottom-nav">
        {tabs.map(([key, label]) => (
          <button className={`tab-btn ${tab === key ? "active" : ""}`} key={key} onClick={() => setTab(key)} type="button">
            {label}
          </button>
        ))}
      </nav>

      <Modal open={Boolean(modal)} onClose={() => setModal(null)}>
        {modal?.type === "auth" && (
          <>
            <h3>Требуется авторизация</h3>
            <p className="small">Для этого действия нужно войти или зарегистрироваться.</p>
            <div className="actions" style={{ marginTop: 8 }}>
              <button className="primary-btn" type="button" onClick={() => { setIsAuth(true); setUserName("Мурад"); setModal(null); }}>
                Войти
              </button>
              <button className="ghost-btn" type="button" onClick={() => setModal(null)}>
                Отмена
              </button>
            </div>
          </>
        )}

        {modal?.type === "detail" && <DetailModalContent data={modal.payload} onFav={toggleFavorite} isFav={(id) => favorites.has(id)} />}

        {modal?.type === "create" && (
          <CreateForm type={modal.payload.type} onSubmit={submitMock} onClose={() => setModal(null)} taxiCategories={mock.taxiCategories} />
        )}
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
        <div className="media">{item.media}</div>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div className="card-title">{item.title}</div>
            <div className="meta">{item.date} дн. назад · {item.category}</div>
          </div>
          <div className="price">{fmtRub.format(item.price)}</div>
        </div>
        <p className="small">{short(item.desc)}</p>
        <div className="actions">
          <button className="soft-btn" type="button" onClick={onOpen}>Открыть</button>
          <button className="ghost-btn" type="button" onClick={onFav}>{activeFav ? "В избранном" : "В избранное"}</button>
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
          <div className="media" style={{ minHeight: 94 }}>{item.media}</div>
          <div>
            <div className="card-title">{item.name}</div>
            <div className="meta">{item.category}</div>
            <div className="price">{fmtRub.format(item.price)}</div>
            <div className="small">Оценка {item.rating.toFixed(1)} ★</div>
          </div>
        </div>
        <div className="row wrap">
          {item.when ? <span className="badge">{item.when}</span> : null}
          {item.seats ? <span className="badge">Места: {item.seats.free}/{item.seats.total}</span> : null}
        </div>
        <div className="actions">
          <button className="soft-btn" type="button" onClick={onOpen}>Открыть</button>
          <button className="ghost-btn" type="button" onClick={onFav}>{activeFav ? "В избранном" : "В избранное"}</button>
        </div>
      </div>
    </article>
  );
}

function FoodCard({ item, onOpen, onFav, activeFav }) {
  return (
    <article className="card">
      <div className="card-body">
        <div className="media">{item.media}</div>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div className="card-title">{item.title}</div>
            <div className="meta">{item.category}</div>
          </div>
          <div className="price">{fmtRub.format(item.price)}</div>
        </div>
        <div className="row wrap">
          <span className="badge">{item.always ? "Всегда в наличии" : `${item.prep} мин`}</span>
          <span className="badge">{item.delivery ? "Есть доставка" : "Без доставки"}</span>
        </div>
        <p className="small">{short(item.desc)}</p>
        <div className="actions">
          <button className="soft-btn" type="button" onClick={onOpen}>Открыть</button>
          <button className="ghost-btn" type="button" onClick={onFav}>{activeFav ? "В избранном" : "В избранное"}</button>
        </div>
      </div>
    </article>
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
  const contactButtons = Object.entries(item.contacts || {}).map(([k, v]) => (
    <button className="ghost-btn" key={`${k}-${v}`} type="button" onClick={() => alert(`Откроем контакт: ${v}`)}>
      {k.toUpperCase()}: {v}
    </button>
  ));

  return (
    <>
      <h3 style={{ marginBottom: 8 }}>{item.title || item.name}</h3>
      <div className="media" style={{ marginBottom: 8 }}>{item.media}</div>
      <p><b>Цена:</b> {fmtRub.format(item.price)}</p>
      {type === "food" ? <p><b>Готовность:</b> {item.always ? "Всегда в наличии" : `${item.prep} минут`}</p> : null}
      {type === "taxi" && item.when ? <p><b>Дата и время:</b> {item.when}</p> : null}
      {type === "taxi" && item.seats ? <p><b>Места:</b> {item.seats.free}/{item.seats.total}</p> : null}
      <p><b>Описание:</b> {item.desc || "Нет описания"}</p>
      <div className="actions" style={{ marginTop: 8 }}>{contactButtons.length ? contactButtons : <p className="small">Контакты не указаны</p>}</div>
      <div className="actions" style={{ marginTop: 8 }}>
        <button className="primary-btn" type="button" onClick={() => onFav(item.id)}>{isFav(item.id) ? "Убрать из избранного" : "В избранное"}</button>
      </div>
    </>
  );
}

function CreateForm({ type, onSubmit, onClose, taxiCategories }) {
  if (type === "restaurant") {
    return (
      <>
        <h3 style={{ marginBottom: 8 }}>Создать заведение</h3>
        <form data-form="restaurant" className="list" onSubmit={(e) => onSubmit(e, "restaurant")}>
          <Field label="Название"><input required name="title" className="input" minLength={2} maxLength={100} /></Field>
          <Field label="Описание"><textarea required name="desc" className="textarea" maxLength={2000} /></Field>
          <Field label="Логотип"><input name="logo" className="input" placeholder="mock-logo.png" /></Field>
          <FormActions onClose={onClose} />
        </form>
      </>
    );
  }

  if (type === "taxi") {
    return (
      <>
        <h3 style={{ marginBottom: 8 }}>Создание предложения такси</h3>
        <form data-form="taxi" className="list" onSubmit={(e) => onSubmit(e, "taxi")}>
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
          <FormActions onClose={onClose} />
        </form>
      </>
    );
  }

  return (
    <>
      <h3 style={{ marginBottom: 8 }}>{type === "ad" ? "Создание объявления" : type === "service" ? "Создание услуги" : "Добавление блюда"}</h3>
      <form data-form={type} className="list" onSubmit={(e) => onSubmit(e, type)}>
        <Field label="Название"><input required name="title" className="input" minLength={3} maxLength={80} /></Field>
        <Field label="Категория">
          <select className="select" name="category">
            {(type === "ad"
              ? mock.adsCategories.filter((x) => x !== "Мои объявления")
              : type === "service"
              ? mock.serviceCategories
              : mock.foodCategories
            ).map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Цена, ₽"><input required name="price" type="number" min={1} className="input" /></Field>
        <Field label="Описание"><textarea required name="desc" className="textarea" minLength={10} maxLength={2000} /></Field>
        <Field label="Фото (до 10)"><input type="file" name="images" className="input" multiple /></Field>
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
      <button className="primary-btn" type="submit">Опубликовать</button>
      <button className="ghost-btn" type="button" onClick={onClose}>Отмена</button>
    </div>
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
  return text.length > 88 ? `${text.slice(0, 88)}...` : text;
}
