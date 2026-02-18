import { FormActions, Field } from "../ui";
import { formatPhoneValue, handlePhoneInput, PHONE_PATTERN, PHONE_PLACEHOLDER, syncPhonePrev } from "../../utils/phone";

export function ProfileEditForm({ profile, onSubmit, onClose }) {
  return (
    <>
      <h3 style={{ marginBottom: 8 }}>Редактирование профиля</h3>
      <form className="list" onSubmit={(e) => onSubmit(e, "profile")}>
        <Field label="Имя"><input required name="name" defaultValue={profile.name} className="input" minLength={2} maxLength={80} /></Field>
        <Field label="Телефон">
          <input
            required
            name="phone"
            type="tel"
            inputMode="tel"
            defaultValue={formatPhoneValue(profile.phone, { allowEmpty: true })}
            className="input"
            placeholder={PHONE_PLACEHOLDER}
            maxLength={18}
            pattern={PHONE_PATTERN}
            title="Введите номер в формате +7 (999) 999-99-99"
            onInput={(e) => handlePhoneInput(e, { allowEmpty: true })}
            onFocus={syncPhonePrev}
          />
        </Field>
        <Field label="Telegram"><input name="telegram" defaultValue={profile.telegram} className="input" /></Field>
        <Field label="WhatsApp">
          <input
            name="whatsapp"
            type="tel"
            inputMode="tel"
            defaultValue={formatPhoneValue(profile.whatsapp, { allowEmpty: true })}
            className="input"
            placeholder={PHONE_PLACEHOLDER}
            maxLength={18}
            pattern={PHONE_PATTERN}
            title="Введите номер в формате +7 (999) 999-99-99"
            onInput={(e) => handlePhoneInput(e, { allowEmpty: true })}
            onFocus={syncPhonePrev}
          />
        </Field>
        <Field label="О себе"><textarea name="about" defaultValue={profile.about} className="textarea" maxLength={500} /></Field>
        <FormActions onClose={onClose} />
      </form>
    </>
  );
}
