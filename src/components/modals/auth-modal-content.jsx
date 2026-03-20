import { Eye, EyeOff } from 'lucide-react';
import {
  handlePhoneInputCompact,
  PHONE_COMPACT_PATTERN,
  PHONE_COMPACT_PLACEHOLDER,
  syncPhonePrev,
} from '../../utils/phone';
import {
  ACCOUNT_NAME_MAX,
  ACCOUNT_NAME_MIN,
  LOGIN_MAX,
  LOGIN_MIN,
  PASSWORD_MAX,
  PASSWORD_MIN,
  PHONE_INPUT_MAX,
} from '../../utils/validation';

const clampTextLength = (value, maxLength) => String(value || "").slice(0, maxLength);

export function AuthModalContent({
  authMode,
  setAuthMode,
  authError,
  setAuthError,
  authPending,
  showAuthPassword,
  setShowAuthPassword,
  signInMethod,
  setSignInMethod,
  signInPhoneValue,
  setSignInPhoneValue,
  signInLoginValue,
  setSignInLoginValue,
  onSubmit,
  onClose,
  resetSignInFields,
}) {
  return (
    <>
      <h3>Требуется авторизация</h3>
      <p className="small">Выберите способ входа. Для регистрации новый аккаунт по-прежнему создаётся по номеру телефона.</p>
      <div className="multi-select-buttons" style={{ marginTop: 8 }}>
        <button
          type="button"
          className={`multi-select-btn ${authMode === "signin" ? "active" : ""}`}
          onClick={() => {
            setAuthMode("signin");
            setAuthError("");
            setShowAuthPassword(false);
            resetSignInFields();
          }}
          aria-pressed={authMode === "signin"}
        >
          Вход
        </button>
        <button
          type="button"
          className={`multi-select-btn ${authMode === "signup" ? "active" : ""}`}
          onClick={() => {
            setAuthMode("signup");
            setAuthError("");
            setShowAuthPassword(false);
            resetSignInFields();
          }}
          aria-pressed={authMode === "signup"}
        >
          Регистрация
        </button>
      </div>
      <form key={authMode} className="list" style={{ marginTop: 10 }} onSubmit={onSubmit}>
        {authMode === "signin" && (
          <>
            <div className="auth-method-switch" role="tablist" aria-label="Способ входа">
              <button
                type="button"
                className={`auth-method-switch-btn ${signInMethod === "phone" ? "active" : ""}`}
                onClick={() => {
                  setSignInMethod("phone");
                  setAuthError("");
                }}
                aria-pressed={signInMethod === "phone"}
              >
                По телефону
              </button>
              <button
                type="button"
                className={`auth-method-switch-btn ${signInMethod === "login" ? "active" : ""}`}
                onClick={() => {
                  setSignInMethod("login");
                  setAuthError("");
                }}
                aria-pressed={signInMethod === "login"}
              >
                По логину
              </button>
            </div>
            <p className="small" style={{ marginTop: 2 }}>
              {signInMethod === "phone"
                ? "Введите номер телефона и пароль."
                : "Введите логин и пароль."}
            </p>
            <label className="field">
              <span className="small">{signInMethod === "phone" ? "Телефон" : "Логин"}</span>
              {signInMethod === "phone" ? (
                <input
                  name="signinPhone"
                  type="tel"
                  inputMode="numeric"
                  className="input"
                  placeholder={PHONE_COMPACT_PLACEHOLDER}
                  pattern={PHONE_COMPACT_PATTERN}
                  maxLength={PHONE_INPUT_MAX}
                  autoComplete="tel"
                  value={signInPhoneValue}
                  onInput={(e) => {
                    handlePhoneInputCompact(e, { allowEmpty: true });
                    setSignInPhoneValue(e.currentTarget.value);
                    if (authError) setAuthError("");
                  }}
                  onFocus={syncPhonePrev}
                />
              ) : (
                <input
                  name="signinLogin"
                  type="text"
                  inputMode="text"
                  className="input"
                  placeholder="Ваш логин"
                  autoComplete="username"
                  minLength={LOGIN_MIN}
                  maxLength={LOGIN_MAX}
                  value={signInLoginValue}
                  onChange={(e) => {
                    setSignInLoginValue(clampTextLength(e.currentTarget.value, LOGIN_MAX));
                    if (authError) setAuthError("");
                  }}
                />
              )}
            </label>
          </>
        )}

        {authMode === "signup" && (
          <>
            <label className="field">
              <span className="small">Имя</span>
              <input
                required
                name="name"
                className="input"
                minLength={ACCOUNT_NAME_MIN}
                maxLength={ACCOUNT_NAME_MAX}
                placeholder="Ваше имя"
                autoComplete="name"
                onInput={(e) => {
                  if (e.currentTarget.value.length > ACCOUNT_NAME_MAX) {
                    e.currentTarget.value = e.currentTarget.value.slice(0, ACCOUNT_NAME_MAX);
                  }
                }}
              />
            </label>
            <label className="field">
              <span className="small">Телефон</span>
              <input
                required
                name="phone"
                type="tel"
                inputMode="numeric"
                className="input"
                placeholder={PHONE_COMPACT_PLACEHOLDER}
                pattern={PHONE_COMPACT_PATTERN}
                maxLength={PHONE_INPUT_MAX}
                autoComplete="tel"
                onInput={(e) => handlePhoneInputCompact(e, { allowEmpty: true })}
                onFocus={syncPhonePrev}
              />
            </label>
          </>
        )}

        <label className="field">
          <span className="small">Пароль</span>
          <div className="password-input-wrap">
            <input
              required
              type={showAuthPassword ? "text" : "password"}
              name="password"
              className="input password-input"
              minLength={PASSWORD_MIN}
              maxLength={PASSWORD_MAX}
              autoComplete={authMode === "signin" ? "current-password" : "new-password"}
              onInput={(e) => {
                if (e.currentTarget.value.length > PASSWORD_MAX) {
                  e.currentTarget.value = e.currentTarget.value.slice(0, PASSWORD_MAX);
                }
              }}
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowAuthPassword((v) => !v)}
              aria-label={showAuthPassword ? "Скрыть пароль" : "Показать пароль"}
              aria-pressed={showAuthPassword}
            >
              {showAuthPassword ? <EyeOff className="icon" aria-hidden="true" /> : <Eye className="icon" aria-hidden="true" />}
            </button>
          </div>
        </label>

        {authError ? <p className="small" style={{ color: "#c62828", marginTop: 6 }}>{authError}</p> : null}

        <div className="actions" style={{ marginTop: 8 }}>
          <button className="primary-btn" type="submit" disabled={authPending}>
            {authPending ? "Отправка..." : authMode === "signin" ? "Войти" : "Зарегистрироваться"}
          </button>
          <button className="ghost-btn" type="button" onClick={onClose} disabled={authPending}>Отмена</button>
        </div>
      </form>
    </>
  );
}

AuthModalContent.displayName = "AuthModalContent";
