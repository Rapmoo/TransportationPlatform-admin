// Validation rules for the "Add account" form.

export const PASSWORD_MIN_LENGTH = 8;

// Full name: letters (any alphabet), spaces, hyphen, apostrophe and period only.
const NAME_BAD_RE = /[^\p{L}\p{M}\s.'’-]/gu;
export const sanitizeFullName = (value) => String(value ?? '').replace(NAME_BAD_RE, '');
export const isValidFullName = (value) => {
  const v = String(value ?? '').trim();
  return v.length > 0 && !/[^\p{L}\p{M}\s.'’-]/u.test(v) && /\p{L}/u.test(v);
};

// Each rule maps to a translation key so the admin sees what is still missing.
export function passwordChecks(password) {
  const p = String(password ?? '');
  return [
    { key: 'length', ok: p.length >= PASSWORD_MIN_LENGTH },
    { key: 'letter', ok: /\p{L}/u.test(p) },
    { key: 'number', ok: /\d/.test(p) },
    { key: 'special', ok: /[^\p{L}\d\s]/u.test(p) },
  ];
}

export const isStrongPassword = (password) => passwordChecks(password).every((c) => c.ok);