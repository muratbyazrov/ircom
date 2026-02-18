export function EntityGroupModalContent({
  group,
  entityGroupData,
  onViewRestaurant,
  onEditRestaurant,
  onViewAd,
  onEditAd,
  onViewService,
  onEditService,
  onViewTaxi,
  onEditTaxi,
  onToggleTaxiFilled,
  onViewTaxiTemplate,
  onSetTemplateStatus,
  onEditTemplate,
  onRemoveTemplate,
}) {
  return (
    <>
      <h3 style={{ marginBottom: 8 }}>{entityGroupData.title}</h3>
      {group !== "taxi" && entityGroupData.items.length ? (
        <div className="list">
          {group === "restaurant" ? entityGroupData.items.map((item) => (
            <article className="card" key={item.title || "restaurant"}>
              <div className="card-body">
                <div className="card-title">{item.title || "Заведение"}</div>
                <p className="small">{item.address || "Адрес не указан"}</p>
                <div className="actions">
                  <button className="primary-btn" type="button" onClick={onViewRestaurant}>Просмотреть</button>
                  <button className="ghost-btn" type="button" onClick={onEditRestaurant}>Редактировать</button>
                </div>
              </div>
            </article>
          )) : null}

          {group === "ads" ? entityGroupData.items.map((item) => (
            <article className="card" key={item.id}>
              <div className="card-body">
                <div className="card-title">{item.title}</div>
                <p className="small">{item.category} · {item.price} ₽</p>
                <div className="actions">
                  <button className="primary-btn" type="button" onClick={() => onViewAd(item.id)}>Просмотреть</button>
                  <button className="ghost-btn" type="button" onClick={() => onEditAd(item.id)}>Редактировать</button>
                </div>
              </div>
            </article>
          )) : null}

          {group === "services" ? entityGroupData.items.map((item) => (
            <article className="card" key={item.id}>
              <div className="card-body">
                <div className="card-title">{item.title}</div>
                <p className="small">{item.category} · {item.price} ₽</p>
                <div className="actions">
                  <button className="primary-btn" type="button" onClick={() => onViewService(item.id)}>Просмотреть</button>
                  <button className="ghost-btn" type="button" onClick={() => onEditService(item.id)}>Редактировать</button>
                </div>
              </div>
            </article>
          )) : null}
        </div>
      ) : group === "taxi" ? (
        <div className="list">
          <section className="section" style={{ padding: 10 }}>
            <h4 style={{ marginBottom: 4 }}>Разовые поездки</h4>
            {(entityGroupData.items.oneTime || []).length ? (
              <div className="list">
                {entityGroupData.items.oneTime.map((item) => (
                  <article className="card" key={item.id}>
                    <div className="card-body">
                      <div className="card-title">{item.category}</div>
                      <p className="small">{item.when || "Дата не указана"} · {item.price} ₽</p>
                      <div className="actions">
                        <button className="primary-btn" type="button" onClick={() => onViewTaxi(item.id)}>Просмотреть</button>
                        <button className="ghost-btn" type="button" onClick={() => onEditTaxi(item.id)}>Редактировать</button>
                        <button className={item.isFilled ? "primary-btn" : "ghost-btn"} type="button" onClick={() => onToggleTaxiFilled(item.id)}>
                          {item.isFilled ? "Снять заполнение" : "Заполнен"}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="small">Разовых поездок пока нет.</p>
            )}
          </section>

          <section className="section" style={{ padding: 10 }}>
            <h4 style={{ marginBottom: 4 }}>Регулярные поездки</h4>
            {(entityGroupData.items.regular || []).length ? (
              <div className="list">
                {entityGroupData.items.regular.map((item) => (
                  <article className="card" key={item.id}>
                    <div className="card-body">
                      <div className="card-title">{item.category}</div>
                      <p className="small">{item.weekdays.join(", ")} · {item.time}</p>
                      <div className="row wrap">
                        <span className="badge">{item.status === "paused" ? "На паузе" : "Активна"}</span>
                      </div>
                      <div className="actions">
                        <button className="primary-btn" type="button" onClick={() => onViewTaxiTemplate(item.id)}>Просмотреть</button>
                        {item.status === "paused" ? (
                          <button className="ghost-btn" type="button" onClick={() => onSetTemplateStatus(item.id, "active")}>Возобновить</button>
                        ) : (
                          <button className="ghost-btn" type="button" onClick={() => onSetTemplateStatus(item.id, "paused")}>Пауза</button>
                        )}
                        <button className="ghost-btn" type="button" onClick={() => onEditTemplate(item.id)}>Изменить</button>
                        <button className="danger-btn" type="button" onClick={() => onRemoveTemplate(item.id)}>Удалить</button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="small">Регулярных поездок пока нет.</p>
            )}
          </section>
        </div>
      ) : (
        <p className="small">Пока ничего нет в этой группе.</p>
      )}
    </>
  );
}
