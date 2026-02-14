import { CategoryTabs, Empty, Section, SectionHeader, SortSelect, StatCard } from "../components/ui";
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
        {servicesItems.length ? servicesItems.map((x) => <ItemCard key={x.id} item={x} onOpen={() => openDetail("services", x.id)} onFav={() => toggleFavorite(x.id)} activeFav={favorites.has(x.id)} />) : <Empty text="Пока нет услуг" />}
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
      <SectionHeader title="Еда" actionLabel="Добавить блюдо" onAction={() => openCreate("dish")} />
      <Section>
        <CategoryTabs list={foodCategories} value={foodCategory} onChange={setFoodCategory} />
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
  );
}

export function ProfileTab({ isAuth, profile, myAdsCount, myServicesCount, openEditProfile, setTab, toggleAuth }) {
  return (
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
        <StatCard title={String(myAdsCount)} caption="Мои объявления" />
        <StatCard title={String(myServicesCount)} caption="Мои услуги" />
      </div>

      <div className="actions" style={{ marginTop: 10 }}>
        <button className={isAuth ? "ghost-btn" : "primary-btn"} type="button" onClick={toggleAuth}>
          {isAuth ? "Выйти из аккаунта" : "Войти в аккаунт"}
        </button>
        <button className="primary-btn" type="button" onClick={openEditProfile}>Редактировать профиль</button>
        <button className="ghost-btn" type="button" onClick={() => setTab("ads")}>К объявлениям</button>
        <button className="ghost-btn" type="button" onClick={() => setTab("food")}>К еде</button>
      </div>
    </Section>
  );
}
