export function EntityGroupModalContent({
  group,
  entityGroupData,
  onOpenRestaurant,
  onOpenAd,
  onOpenService,
  onOpenTaxi,
  onToggleTaxiFilled,
  onOpenTaxiTemplate,
  onSetTemplateStatus,
  onRemoveTemplate,
}) {
  return (
    <>
      <h3 style={{ marginBottom: 8 }}>{entityGroupData.title}</h3>
      {group !== "taxi" && entityGroupData.items.length ? (
        <div className="list">
          {group === "restaurant" ? entityGroupData.items.map((item) => (
            <article
              className="card card-clickable"
              key={item.title || "restaurant"}
              role="button"
              tabIndex={0}
              onClick={onOpenRestaurant}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onOpenRestaurant();
              }}
            >
              <div className="card-body">
                <div className="card-title">{item.title || "Заведение"}</div>
                <p className="small">{item.address || "Адрес не указан"}</p>
                <div className="actions">
                  <button
                    className="primary-btn"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenRestaurant();
                    }}
                  >
                    Посмотреть
                  </button>
                </div>
              </div>
            </article>
          )) : null}

          {group === "ads" ? entityGroupData.items.map((item) => (
            <article
              className="card card-clickable"
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => onOpenAd(item.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onOpenAd(item.id);
              }}
            >
              <div className="card-body">
                <div className="card-title">{item.title}</div>
                <p className="small">{item.category} · {item.price} ₽</p>
                <div className="actions">
                  <button
                    className="primary-btn"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenAd(item.id);
                    }}
                  >
                    Посмотреть
                  </button>
                </div>
              </div>
            </article>
          )) : null}

          {group === "services" ? entityGroupData.items.map((item) => (
            <article
              className="card card-clickable"
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => onOpenService(item.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onOpenService(item.id);
              }}
            >
              <div className="card-body">
                <div className="card-title">{item.title}</div>
                <p className="small">{item.category} · {item.price} ₽</p>
                <div className="actions">
                  <button
                    className="primary-btn"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenService(item.id);
                    }}
                  >
                    Посмотреть
                  </button>
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
                  <article
                    className="card card-clickable"
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onOpenTaxi(item.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") onOpenTaxi(item.id);
                    }}
                  >
                    <div className="card-body">
                      <div className="card-title">{item.category}</div>
                      <p className="small">{item.when || "Дата не указана"} · {item.price} ₽</p>
                      <div className="actions">
                        <button
                          className="primary-btn"
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenTaxi(item.id);
                          }}
                        >
                          Посмотреть
                        </button>
                        <button
                          className={item.isFilled ? "primary-btn" : "ghost-btn"}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleTaxiFilled(item.id);
                          }}
                        >
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
                  <article
                    className="card card-clickable"
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onOpenTaxiTemplate(item.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") onOpenTaxiTemplate(item.id);
                    }}
                  >
                    <div className="card-body">
                      <div className="card-title">{item.category}</div>
                      <p className="small">{item.weekdays.join(", ")} · {item.time}</p>
                      <div className="row wrap">
                        <span className="badge">{item.status === "paused" ? "На паузе" : "Активна"}</span>
                      </div>
                      <div className="actions">
                        <button
                          className="primary-btn"
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenTaxiTemplate(item.id);
                          }}
                        >
                          Посмотреть
                        </button>
                        {item.status === "paused" ? (
                          <button
                            className="ghost-btn"
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSetTemplateStatus(item.id, "active");
                            }}
                          >
                            Возобновить
                          </button>
                        ) : (
                          <button
                            className="ghost-btn"
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSetTemplateStatus(item.id, "paused");
                            }}
                          >
                            Пауза
                          </button>
                        )}
                        <button
                          className="danger-btn"
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveTemplate(item.id);
                          }}
                        >
                          Удалить
                        </button>
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
