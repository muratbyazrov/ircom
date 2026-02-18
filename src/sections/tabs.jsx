import { CategoryTabs, Empty, Field, Icon, Section, SectionHeader, SortSelect, StatCard } from "../components/ui";
import { ItemCard, TaxiCard } from "../components/cards";
import { sectionSortModes } from "../utils/constants";
import { applyImageFallback } from "../utils/images";

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
  restaurants,
  foodCategories,
  hasRestaurant,
  openCreate,
  openDetail,
}) {
  return (
    <>
      <SectionHeader
        title="Еда"
        actionLabel={hasRestaurant ? "Управлять заведением" : "Создать заведение"}
        onAction={() => openCreate("restaurant")}
      />
      <Section>
        <CategoryTabs list={foodCategories} value={foodCategory} onChange={setFoodCategory} />
        {hasRestaurant ? (
          <div className="actions" style={{ marginTop: 10 }}>
            <button className="ghost-btn" onClick={() => openCreate("dish")} type="button">Добавить блюдо</button>
          </div>
        ) : null}
      </Section>
      <section className="list">
        {!restaurants.length ? <Empty text="Пока нет заведений" /> : null}
        {restaurants.map((restaurant) => (
          <article
            className="card card-clickable restaurant-list-card"
            key={restaurant.id}
            role="button"
            tabIndex={0}
            onClick={() => openDetail("restaurant", restaurant.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") openDetail("restaurant", restaurant.id);
            }}
          >
            <div className="card-body">
              <div className="restaurant-list-photo-wrap">
                {restaurant.photos?.[0] ? (
                  <img
                    className="restaurant-list-photo"
                    src={restaurant.photos[0]}
                    alt={restaurant.title || "Заведение"}
                    loading="lazy"
                    onError={(e) => applyImageFallback(e, "food")}
                  />
                ) : (
                  <div className="restaurant-list-photo-empty">Нет фото</div>
                )}
              </div>
              <div className="restaurant-list-head">
                <div className="card-title">{restaurant.title}</div>
                <span className="badge">{restaurant.dishes.length} блюд</span>
              </div>
              <div className="restaurant-list-address">{restaurant.address || "Адрес не указан"}</div>
              <div className="restaurant-list-meta">
                <span className="food-meta-chip">
                  <Icon name="star" />
                  {typeof restaurant.ratingValue === "number" ? `${restaurant.ratingValue.toFixed(1)} (${restaurant.reviewsCount || 0})` : "Нет оценок"}
                </span>
                <span className="food-meta-chip">
                  <Icon name="delivery" />
                  {restaurant.deliveryMode === "none" ? "Нет доставки" : "Есть доставка"}
                </span>
              </div>
            </div>
          </article>
        ))}
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
