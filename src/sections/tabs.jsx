import { CategoryTabs, Empty, Icon, Section, SectionHeader, SortSelect, StatCard } from "../components/ui";
import { FoodCard, ItemCard, TaxiCard } from "../components/cards";

export function AdsTab({ adsCategoriesVisible, adsCategory, setAdsCategory, adsSort, setAdsSort, adsItems, openCreate, openDetail, toggleFavorite, favorites }) {
  return (
    <>
      <SectionHeader title="Объявления" subtitle="Продажа б/у вещей" actionLabel="Разместить" onAction={() => openCreate("ad")} />
      <Section>
        <CategoryTabs list={adsCategoriesVisible} value={adsCategory} onChange={setAdsCategory} />
        <SortSelect value={adsSort} onChange={setAdsSort} />
      </Section>
      <section className="list">
        {adsItems.length ? adsItems.map((x) => <ItemCard key={x.id} item={x} onOpen={() => openDetail("ads", x.id)} onFav={() => toggleFavorite(x.id)} activeFav={favorites.has(x.id)} />) : <Empty text="Пока нет объявлений" />}
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
        <SortSelect value={servicesSort} onChange={setServicesSort} />
      </Section>
      <section className="list">
        {servicesItems.length ? servicesItems.map((x) => <ItemCard key={x.id} item={x} onOpen={() => openDetail("services", x.id)} onFav={() => toggleFavorite(x.id)} activeFav={favorites.has(x.id)} showRating />) : <Empty text="Пока нет услуг" />}
      </section>
    </>
  );
}

export function TaxiTab({ taxiCategory, setTaxiCategory, taxiSort, setTaxiSort, taxiItems, taxiCategories, openCreate, openDetail, toggleFavorite, favorites }) {
  return (
    <>
      <SectionHeader title="Такси" actionLabel="Добавить себя" onAction={() => openCreate("taxi")} />
      <Section>
        <CategoryTabs list={taxiCategories} value={taxiCategory} onChange={setTaxiCategory} />
        <SortSelect value={taxiSort} onChange={setTaxiSort} />
      </Section>
      <section className="list">
        {taxiItems.length ? taxiItems.map((x) => <TaxiCard key={x.id} item={x} onOpen={() => openDetail("taxi", x.id)} onFav={() => toggleFavorite(x.id)} activeFav={favorites.has(x.id)} />) : <Empty text="Пока нет предложений" />}
      </section>
    </>
  );
}

export function FoodTab({ foodCategory, setFoodCategory, foodSort, setFoodSort, foodItems, foodCategories, hasRestaurant, openCreate, openDetail, toggleFavorite, favorites }) {
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
        <SortSelect value={foodSort} onChange={setFoodSort} />
      </Section>
      <section className="list">
        {foodItems.length ? foodItems.map((x) => <FoodCard key={x.id} item={x} onOpen={() => openDetail("food", x.id)} onFav={() => toggleFavorite(x.id)} activeFav={favorites.has(x.id)} />) : <Empty text="Пока нет блюд" />}
      </section>
    </>
  );
}

export function ProfileTab({
  isAuth,
  profile,
  myAdsCount,
  myServicesCount,
  hasRestaurant,
  isTaxiDriver,
  taxiTemplates,
  onPauseTemplate,
  onResumeTemplate,
  onDeleteTemplate,
  onEditTemplate,
  openCreate,
  openEditProfile,
  toggleAuth,
}) {
  return (
    <Section>
      <h2>Профиль</h2>
      <p className="small">{isAuth ? "Аккаунт активен" : "Войдите для публикации, лайков и редактирования"}</p>

      <div className="profile-stack">
        <div className="grid-2 profile-grid">
          <StatCard title={profile.name} caption="Имя" />
          <StatCard title={profile.phone} caption="Телефон" />
          <StatCard title={profile.telegram} caption="Telegram" />
          <StatCard title={profile.whatsapp} caption="WhatsApp" />
        </div>

        <Section>
          <h4>О себе</h4>
          <p className="small">{profile.about}</p>
        </Section>

        <div className="grid-2 profile-grid">
          <StatCard title={String(myAdsCount)} caption="Мои объявления" />
          <StatCard title={String(myServicesCount)} caption="Мои услуги" />
        </div>

        <Section>
          <h4>Быстрые действия</h4>
          <div className="quick-actions" style={{ marginTop: 8 }}>
            <button className="ghost-btn quick-action-btn" type="button" onClick={() => openCreate("restaurant")}>
              <Icon name="food" />
              {hasRestaurant ? "Управлять заведением" : "Добавить заведение"}
            </button>
            <button className="ghost-btn quick-action-btn" type="button" onClick={() => openCreate("taxi")}>
              <Icon name="taxi" />
              Стать водителем такси
            </button>
            <button className="ghost-btn quick-action-btn" type="button" onClick={() => openCreate("service")}>
              <Icon name="services" />
              Добавить услугу
            </button>
          </div>
        </Section>

        {isAuth && isTaxiDriver ? (
          <Section>
            <h4>Мои регулярные поездки</h4>
            <p className="small">{taxiTemplates.length ? "Управляйте расписанием без повторного создания объявлений." : "Пока нет регулярных поездок."}</p>
            <div className="list" style={{ marginTop: 8 }}>
              {taxiTemplates.map((template) => (
                <article className="card" key={template.id}>
                  <div className="card-body">
                    <div className="card-title">{template.category}</div>
                    <div className="small">{template.weekdays.join(", ")} · {template.time}</div>
                    <div className="row wrap">
                      <span className="badge">{template.status === "paused" ? "На паузе" : "Активна"}</span>
                    </div>
                    <div className="actions">
                      {template.status === "paused" ? (
                        <button className="ghost-btn" type="button" onClick={() => onResumeTemplate(template.id)}>Возобновить</button>
                      ) : (
                        <button className="ghost-btn" type="button" onClick={() => onPauseTemplate(template.id)}>Пауза</button>
                      )}
                      <button className="ghost-btn" type="button" onClick={() => onEditTemplate(template.id)}>Изменить</button>
                      <button className="danger-btn" type="button" onClick={() => onDeleteTemplate(template.id)}>Удалить</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </Section>
        ) : null}

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
