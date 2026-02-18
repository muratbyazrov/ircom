import { useMemo } from "react";
import { CategoryTabs, Empty, Field, Icon, Section, SectionHeader, SortSelect, StatCard } from "../components/ui";
import { FoodCard, ItemCard, TaxiCard } from "../components/cards";
import { sectionSortModes } from "../utils/constants";

export function AdsTab({ adsCategoriesVisible, adsCategory, setAdsCategory, adsSort, setAdsSort, adsItems, openCreate, openDetail, toggleFavorite, favorites }) {
  return (
    <>
      <SectionHeader title="Объявления" subtitle="Продажа б/у вещей" actionLabel="Разместить" onAction={() => openCreate("ad")} />
      <Section>
        <CategoryTabs list={adsCategoriesVisible} value={adsCategory} onChange={setAdsCategory} />
        <SortSelect value={adsSort} onChange={setAdsSort} modes={sectionSortModes.ads} />
      </Section>
      <section className="list">
        {adsItems.length ? adsItems.map((x) => <ItemCard key={x.id} item={x} section="ads" onOpen={() => openDetail("ads", x.id)} onFav={() => toggleFavorite(x.id)} activeFav={favorites.has(x.id)} />) : <Empty text="Пока нет объявлений" />}
      </section>
    </>
  );
}

export function ServicesTab({ serviceCategory, setServiceCategory, servicesSort, setServicesSort, servicesItems, openCreate, openDetail, toggleFavorite, favorites, serviceCategories }) {
  return (
    <>
      <SectionHeader title="Услуги" actionLabel="Разместить услугу" onAction={() => openCreate("service")} />
      <Section>
        <CategoryTabs list={serviceCategories} value={serviceCategory} onChange={setServiceCategory} />
        <SortSelect value={servicesSort} onChange={setServicesSort} modes={sectionSortModes.services} />
      </Section>
      <section className="list">
        {servicesItems.length ? servicesItems.map((x) => <ItemCard key={x.id} item={x} section="services" onOpen={() => openDetail("services", x.id)} onFav={() => toggleFavorite(x.id)} activeFav={favorites.has(x.id)} showRating />) : <Empty text="Пока нет услуг" />}
      </section>
    </>
  );
}

export function TaxiTab({
  taxiCategory,
  setTaxiCategory,
  taxiSort,
  setTaxiSort,
  taxiItems,
  taxiRequestedAt,
  setTaxiRequestedAt,
  taxiCategories,
  openCreate,
  openDetail,
  toggleFavorite,
  favorites,
}) {
  const isIntercity = taxiCategory !== "Такси по Цхинвалу";

  return (
    <>
      <SectionHeader title="Такси" actionLabel="Добавить себя" onAction={() => openCreate("taxi")} />
      <Section>
        <CategoryTabs list={taxiCategories} value={taxiCategory} onChange={setTaxiCategory} />
        {isIntercity ? (
          <div className="taxi-time-field">
            <Field label="Когда хотите поехать">
              <div className="actions taxi-time-filter-actions">
                <input
                  type="datetime-local"
                  className="input"
                  value={taxiRequestedAt}
                  onChange={(e) => setTaxiRequestedAt(e.currentTarget.value)}
                />
                {taxiRequestedAt ? (
                  <button className="ghost-btn" type="button" onClick={() => setTaxiRequestedAt("")}>
                    Сбросить
                  </button>
                ) : null}
              </div>
              <p className="small" style={{ marginTop: 6 }}>Показываем поездки не раньше выбранного времени.</p>
            </Field>
          </div>
        ) : null}
        <SortSelect value={taxiSort} onChange={setTaxiSort} modes={sectionSortModes.taxi} />
      </Section>
      <section className="list">
        {taxiItems.length
          ? taxiItems.map((x) => <TaxiCard key={x.id} item={x} onOpen={() => openDetail("taxi", x.id)} onFav={() => toggleFavorite(x.id)} activeFav={favorites.has(x.id)} />)
          : <Empty text={taxiRequestedAt && isIntercity ? "Нет поездок на выбранное время" : "Пока нет предложений"} />}
      </section>
    </>
  );
}

export function FoodTab({
  foodCategory,
  setFoodCategory,
  foodViewMode,
  setFoodViewMode,
  foodSort,
  setFoodSort,
  foodItems,
  foodCategories,
  hasRestaurant,
  openCreate,
  openDetail,
  toggleFavorite,
  favorites,
}) {
  const groupedByRestaurants = useMemo(() => {
    const buckets = new Map();
    foodItems.forEach((item) => {
      const restaurantName = (item.restaurant || "").trim() || "Без названия заведения";
      if (!buckets.has(restaurantName)) buckets.set(restaurantName, []);
      buckets.get(restaurantName).push(item);
    });
    return [...buckets.entries()].map(([name, items]) => ({ name, items }));
  }, [foodItems]);

  return (
    <>
      <SectionHeader
        title="Еда"
        actionLabel={hasRestaurant ? "Управлять заведением" : "Создать заведение"}
        onAction={() => openCreate("restaurant")}
      />
      <Section>
        <CategoryTabs list={foodCategories} value={foodCategory} onChange={setFoodCategory} />
        <div className="food-view-switch" role="tablist" aria-label="Режим отображения блюд">
          <button
            className={`food-view-switch-btn ${foodViewMode === "restaurants" ? "active" : ""}`}
            type="button"
            onClick={() => setFoodViewMode("restaurants")}
            role="tab"
            aria-selected={foodViewMode === "restaurants"}
          >
            По заведениям
          </button>
          <button
            className={`food-view-switch-btn ${foodViewMode === "all" ? "active" : ""}`}
            type="button"
            onClick={() => setFoodViewMode("all")}
            role="tab"
            aria-selected={foodViewMode === "all"}
          >
            Все блюда
          </button>
        </div>
        {hasRestaurant ? (
          <div className="actions" style={{ marginTop: 10 }}>
            <button className="ghost-btn" onClick={() => openCreate("dish")} type="button">Добавить блюдо</button>
          </div>
        ) : null}
        <SortSelect value={foodSort} onChange={setFoodSort} modes={sectionSortModes.food} />
      </Section>
      <section className="list">
        {!foodItems.length ? <Empty text="Пока нет блюд" /> : null}
        {foodItems.length && foodViewMode === "all"
          ? foodItems.map((x) => <FoodCard key={x.id} item={x} onOpen={() => openDetail("food", x.id)} onFav={() => toggleFavorite(x.id)} activeFav={favorites.has(x.id)} />)
          : null}
        {foodItems.length && foodViewMode === "restaurants"
          ? groupedByRestaurants.map((group) => (
            <article className="section food-group" key={group.name}>
              <div className="food-group-head">
                <h4>{group.name}</h4>
                <span className="badge">{group.items.length} блюд</span>
              </div>
              <div className="list food-group-list">
                {group.items.map((x) => (
                  <FoodCard key={x.id} item={x} onOpen={() => openDetail("food", x.id)} onFav={() => toggleFavorite(x.id)} activeFav={favorites.has(x.id)} />
                ))}
              </div>
            </article>
          ))
          : null}
      </section>
    </>
  );
}

export function ProfileTab({
  isAuth,
  profile,
  myAdsCount,
  myServicesCount,
  myAds,
  hasRestaurant,
  restaurantEntity,
  isTaxiDriver,
  taxiTemplates,
  oneTimeIntercityOffers,
  myServices,
  onOpenEntityGroup,
  openCreate,
  openEditProfile,
  toggleAuth,
}) {
  const entityGroups = [
    { key: "restaurant", label: "Заведения", count: hasRestaurant ? 1 : 0, icon: "food" },
    { key: "ads", label: "Объявления", count: myAds.length, icon: "ads" },
    { key: "services", label: "Услуги", count: myServices.length, icon: "services" },
    { key: "taxi", label: "Моё такси", count: oneTimeIntercityOffers.length + taxiTemplates.length, icon: "taxi" },
  ].filter((entry) => entry.count > 0);

  return (
    <Section>
      <h2>Профиль</h2>
      <p className="small">{isAuth ? "Аккаунт активен" : "Войдите для публикации, лайков и редактирования"}</p>

      <div className="profile-stack">
        <div className="grid-2 profile-grid">
          <StatCard title={profile.name} caption="Имя" />
          <StatCard title={profile.phone} caption="Телефон" />
          <div className="section stat-card" style={{ padding: 10 }}>
            <div className="profile-contact-head">
              <Icon name="telegram" />
              <p className="small">Telegram</p>
            </div>
            <h4>{profile.telegram}</h4>
          </div>
          <div className="section stat-card" style={{ padding: 10 }}>
            <div className="profile-contact-head">
              <Icon name="whatsapp" />
              <p className="small">WhatsApp</p>
            </div>
            <h4>{profile.whatsapp}</h4>
          </div>
        </div>

        <Section>
          <h4>О себе</h4>
          <p className="small">{profile.about}</p>
        </Section>

        {isAuth ? (
          <Section>
            <h4>Мой бизнес</h4>
            <div className="entity-groups-compact">
              {entityGroups.map((entry) => (
                <article className="entity-compact-card" key={entry.key}>
                  <div className="entity-compact-main">
                    <div className="entity-compact-icon-wrap">
                      <Icon name={entry.icon} />
                    </div>
                    <div className="entity-compact-title">{entry.label}</div>
                    <span className="entity-compact-count-badge">{entry.count}</span>
                  </div>
                  <button
                    className="ghost-btn"
                    type="button"
                    onClick={() => onOpenEntityGroup(entry.key)}
                  >
                    Открыть
                  </button>
                </article>
              ))}
              {!hasRestaurant && !myAds.length && !myServices.length && !oneTimeIntercityOffers.length && !taxiTemplates.length ? (
                <p className="small">Создайте заведение, объявление, услугу или поездку, чтобы управлять ими из профиля.</p>
              ) : null}
            </div>
          </Section>
        ) : null}

        <Section>
          <h4>Быстрые действия</h4>
          <div className="quick-actions" style={{ marginTop: 8 }}>
            {!hasRestaurant ? (
              <button
                className="ghost-btn quick-action-btn"
                type="button"
                onClick={() => openCreate("restaurant")}
              >
                <span className="quick-action-icon"><Icon name="food" /></span>
                <span>Создать заведение</span>
              </button>
            ) : null}
            <button className="ghost-btn quick-action-btn" type="button" onClick={() => openCreate("taxi")}>
              <span className="quick-action-icon"><Icon name="taxi" /></span>
              <span>{isTaxiDriver ? "Добавить поездку" : "Стать водителем такси"}</span>
            </button>
            {!myServices.length ? (
              <button
                className="ghost-btn quick-action-btn"
                type="button"
                onClick={() => openCreate("service")}
              >
                <span className="quick-action-icon"><Icon name="services" /></span>
                <span>Добавить свою услугу</span>
              </button>
            ) : null}
          </div>
        </Section>

        <div className="actions profile-actions">
          <button className={isAuth ? "ghost-btn" : "primary-btn"} type="button" onClick={toggleAuth}>
            {isAuth ? "Выйти из аккаунта" : "Войти в аккаунт"}
          </button>
          {isAuth ? <button className="primary-btn" type="button" onClick={openEditProfile}>Редактировать профиль</button> : null}
        </div>
      </div>
    </Section>
  );
}
