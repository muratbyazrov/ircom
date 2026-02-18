import { FormActions, Field } from "../ui";

export function ProfileEditForm({ profile, onSubmit, onClose }) {
  const phonePattern = "\\+7 \\(\\d{3}\\) \\d{3}-\\d{2}-\\d{2}";
  const phonePlaceholder = "+7 (___) ___-__-__";

  const normalizePhoneDigits = (raw) => {
    const rawValue = String(raw || "");
    let digits = rawValue.replace(/\D/g, "");
    if (rawValue.trim().startsWith("+7")) digits = digits.slice(1);
    if (digits.length > 10 && (digits[0] === "7" || digits[0] === "8")) digits = digits.slice(1);
    return digits.slice(0, 10);
  };

  const formatPhoneDigits = (digits, { allowEmpty = true } = {}) => {
    if (!digits) return allowEmpty ? "" : "+7";

    let result = "+7";
    if (digits.length < 3) return `${result} ${digits}`;

    result += ` (${digits.slice(0, 3)})`;
    if (digits.length < 6) return `${result} ${digits.slice(3)}`;

    result += ` ${digits.slice(3, 6)}`;
    if (digits.length < 8) return `${result}-${digits.slice(6)}`;

    result += `-${digits.slice(6, 8)}`;
    return `${result}-${digits.slice(8, 10)}`;
  };

  const formatPhoneValue = (raw, options = {}) => formatPhoneDigits(normalizePhoneDigits(raw), options);

  const handlePhoneInput = (e, options = {}) => {
    const input = e.currentTarget;
    const prev = input.dataset.prevValue || "";
    const raw = input.value;
    let digits = normalizePhoneDigits(raw);
    const isDelete = raw.length < prev.length;

    if (isDelete && raw && !/\d$/.test(raw)) {
      digits = digits.slice(0, -1);
    }

    const next = formatPhoneDigits(digits, options);
    input.value = next;
    input.dataset.prevValue = next;
  };

  const syncPhonePrev = (e) => {
    e.currentTarget.dataset.prevValue = e.currentTarget.value;
  };

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
            placeholder={phonePlaceholder}
            maxLength={18}
            pattern={phonePattern}
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
            placeholder={phonePlaceholder}
            maxLength={18}
            pattern={phonePattern}
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
