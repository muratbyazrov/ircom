export const PHONE_PATTERN = "\\+7 \\(\\d{3}\\) \\d{3}-\\d{2}-\\d{2}";
export const PHONE_PLACEHOLDER = "+7 (___) ___-__-__";
export const PHONE_COMPACT_PATTERN = "\\+7\\(\\d{3}\\)\\d{3}-\\d{2}-\\d{2}";
export const PHONE_COMPACT_PLACEHOLDER = "+7(___)___-__-__";

const normalizePhoneDigits = (raw) => {
  const rawValue = String(raw || "");
  let digits = rawValue.replace(/\D/g, "");
  if (rawValue.trim().startsWith("+7")) digits = digits.slice(1);
  if (digits.length > 10 && (digits[0] === "7" || digits[0] === "8")) digits = digits.slice(1);
  return digits.slice(0, 10);
};

const formatPhoneDigits = (digits, { allowEmpty = true } = {}) => {
  if (!digits) return allowEmpty ? "" : "+7";

  const len = digits.length;
  let result = "+7";

  result += ` (${digits.slice(0, Math.min(3, len))}`;
  if (len >= 3) result += ")";
  if (len > 3) result += ` ${digits.slice(3, Math.min(6, len))}`;
  if (len > 6) result += `-${digits.slice(6, Math.min(8, len))}`;
  if (len > 8) result += `-${digits.slice(8, 10)}`;

  return result;
};

const formatPhoneDigitsCompact = (digits, { allowEmpty = true } = {}) => {
  if (!digits) return allowEmpty ? "" : "+7";

  const len = digits.length;
  let result = "+7";

  result += `(${digits.slice(0, Math.min(3, len))}`;
  if (len >= 3) result += ")";
  if (len > 3) result += `${digits.slice(3, Math.min(6, len))}`;
  if (len > 6) result += `-${digits.slice(6, Math.min(8, len))}`;
  if (len > 8) result += `-${digits.slice(8, 10)}`;

  return result;
};

export const formatPhoneValue = (raw, options = {}) => formatPhoneDigits(normalizePhoneDigits(raw), options);
export const formatPhoneValueCompact = (raw, options = {}) => formatPhoneDigitsCompact(normalizePhoneDigits(raw), options);

export const handlePhoneInput = (e, options = {}) => {
  const input = e.currentTarget;
  const prev = input.dataset.prevValue || "";
  const raw = input.value;
  const prevDigits = normalizePhoneDigits(prev);
  let digits = normalizePhoneDigits(raw);
  const inputType = e?.nativeEvent?.inputType || "";
  const isDelete = inputType.startsWith("delete") || raw.length < prev.length;

  // If user deletes a formatting symbol, drop one real digit instead of restoring the mask.
  if (isDelete && digits.length === prevDigits.length && digits.length > 0) {
    digits = digits.slice(0, -1);
  }

  const next = formatPhoneDigits(digits, options);
  input.value = next;
  input.dataset.prevValue = next;
};

export const handlePhoneInputCompact = (e, options = {}) => {
  const input = e.currentTarget;
  const prev = input.dataset.prevValue || "";
  const raw = input.value;
  const prevDigits = normalizePhoneDigits(prev);
  let digits = normalizePhoneDigits(raw);
  const inputType = e?.nativeEvent?.inputType || "";
  const isDelete = inputType.startsWith("delete") || raw.length < prev.length;

  // If user deletes a formatting symbol, drop one real digit instead of restoring the mask.
  if (isDelete && digits.length === prevDigits.length && digits.length > 0) {
    digits = digits.slice(0, -1);
  }

  const next = formatPhoneDigitsCompact(digits, options);
  input.value = next;
  input.dataset.prevValue = next;
};

export const syncPhonePrev = (e) => {
  e.currentTarget.dataset.prevValue = e.currentTarget.value;
};

export const syncWhatsappFromPhone = (phoneInput, whatsappInput) => {
  if (!phoneInput || !whatsappInput) return;

  const phoneValue = String(phoneInput.value || "");
  const whatsappValue = String(whatsappInput.value || "");
  const lastAutofillValue = String(whatsappInput.dataset.autofillFromPhone || "");

  // Keep WhatsApp in sync with phone until user provides their own different value.
  if (!whatsappValue || whatsappValue === lastAutofillValue) {
    whatsappInput.value = phoneValue;
    whatsappInput.dataset.prevValue = phoneValue;
    whatsappInput.dataset.autofillFromPhone = phoneValue;
  }
};
