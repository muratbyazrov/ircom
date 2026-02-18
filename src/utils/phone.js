export const PHONE_PATTERN = "\\+7 \\(\\d{3}\\) \\d{3}-\\d{2}-\\d{2}";
export const PHONE_PLACEHOLDER = "+7 (___) ___-__-__";

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

export const formatPhoneValue = (raw, options = {}) => formatPhoneDigits(normalizePhoneDigits(raw), options);

export const handlePhoneInput = (e, options = {}) => {
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

export const syncPhonePrev = (e) => {
  e.currentTarget.dataset.prevValue = e.currentTarget.value;
};
