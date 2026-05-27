export const normalizeDigits = (value) => String(value || "").replace(/\D/g, "");

export const isValidEmail = (value) => {
  const email = String(value || "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const isValidName = (value) => {
  const name = String(value || "").trim();
  return name.length >= 3 && /[A-Za-z]/.test(name) && /^[A-Za-z\s.'-]+$/.test(name);
};

export const isValidPhone = (value) => {
  const digits = normalizeDigits(value);
  return /^\d{10,13}$/.test(digits);
};

export const isValidPincode = (value) => {
  const digits = normalizeDigits(value);
  return /^\d{6}$/.test(digits);
};

export const isValidPassword = (value) => {
  const password = String(value || "");
  return password.length >= 6;
};

export const formatPhone = (value) => normalizeDigits(value).slice(0, 13);
