# ircom frontend (React)

Мобильный frontend по ТЗ (`/docs/техническое задание.md`) с интеграцией API.

## Стек
- React 18
- Vite 5
- Чистый CSS (mobile-first)

## ENV

```bash
VITE_IRCOM_API_URL=http://127.0.0.1:3002/ircom-api/v1
VITE_S3_PUBLIC_BASE_URL=https://cdn.example.com # optional
VITE_S3_MAX_UPLOAD_BYTES=10485760 # optional
```

## Запуск
```bash
npm install
npm run dev
```

Открыть в браузере: `http://localhost:5173`

## Что реализовано
- Нижняя навигация: `Объявления / Услуги / Такси / Еда / Профиль`
- Категории, списки, карточки, детальные модалки
- Избранное (лайки)
- Проверка авторизации для защищенных действий
- Формы создания (объявление, услуга, такси, заведение, блюдо)
- Загрузка фото напрямую в S3 через `media.initPhotoUpload` + отправка ссылок/ключей в бэкенд
- Инициализация Telegram WebApp при наличии `window.Telegram.WebApp`

## Структура
- `index.html`
- `src/main.jsx`
- `src/App.jsx`
- `src/styles.css`
