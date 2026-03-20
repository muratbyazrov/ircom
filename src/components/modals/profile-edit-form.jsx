import { useEffect, useRef } from "react";
import { FormActions, Field } from "../ui";
import { formatPhoneValue, handlePhoneInput, PHONE_PATTERN, PHONE_PLACEHOLDER, syncPhonePrev, syncWhatsappFromPhone } from "../../utils/phone";
import { ACCOUNT_NAME_MAX, ACCOUNT_NAME_MIN, PHONE_INPUT_MAX, TELEGRAM_MAX } from "../../utils/validation";

export function ProfileEditForm({ profile, onSubmit, onClose }) {
  const clampTextLength = (value, maxLength) => String(value || "").slice(0, maxLength);
  const limitTextInput = (event, maxLength) => {
    if (event.currentTarget.value.length > maxLength) {
      event.currentTarget.value = event.currentTarget.value.slice(0, maxLength);
    }
  };
  const phoneRef = useRef(null);
  const whatsappRef = useRef(null);

  useEffect(() => {
    syncWhatsappFromPhone(phoneRef.current, whatsappRef.current);
  }, []);

  return (
    <>
      <h3 style={{ marginBottom: 8 }}>Редактирование профиля</h3>
      <form className="list" onSubmit={(e) => onSubmit(e, "profile")}>
        <Field label="Имя"><input required name="name" defaultValue={clampTextLength(profile.name, ACCOUNT_NAME_MAX)} className="input" minLength={ACCOUNT_NAME_MIN} maxLength={ACCOUNT_NAME_MAX} onInput={(e) => limitTextInput(e, ACCOUNT_NAME_MAX)} /></Field>
        <Field label="Телефон">
          <input
            required
            name="phone"
            type="tel"
            inputMode="tel"
            defaultValue={formatPhoneValue(profile.phone, { allowEmpty: true })}
            className="input"
            placeholder={PHONE_PLACEHOLDER}
            maxLength={PHONE_INPUT_MAX}
            pattern={PHONE_PATTERN}
            title="Введите номер в формате +7 (999) 999-99-99"
            ref={phoneRef}
            onInput={(e) => {
              handlePhoneInput(e, { allowEmpty: true });
              syncWhatsappFromPhone(e.currentTarget, whatsappRef.current);
            }}
            onFocus={syncPhonePrev}
          />
        </Field>
        <Field label="Telegram"><input name="telegram" defaultValue={clampTextLength(profile.telegram, TELEGRAM_MAX)} className="input" maxLength={TELEGRAM_MAX} onInput={(e) => limitTextInput(e, TELEGRAM_MAX)} /></Field>
        <Field label="WhatsApp">
          <input
            name="whatsapp"
            type="tel"
            inputMode="tel"
            defaultValue={formatPhoneValue(profile.whatsapp, { allowEmpty: true })}
            className="input"
            placeholder={PHONE_PLACEHOLDER}
            maxLength={PHONE_INPUT_MAX}
            pattern={PHONE_PATTERN}
            title="Введите номер в формате +7 (999) 999-99-99"
            ref={whatsappRef}
            onInput={(e) => handlePhoneInput(e, { allowEmpty: true })}
            onFocus={syncPhonePrev}
          />
        </Field>
        <FormActions onClose={onClose} />
      </form>
    </>
  );
}
