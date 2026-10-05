// Mirrors MINIMUM_PASSWORD_LENGTH and is_password_strong_enough() in
// v6_api (c2corg_api/views/user.py). The API stays the authority: if both
// ever disagree, its validation error is still displayed by BaseForm.
export const MINIMUM_PASSWORD_LENGTH = 10;

/**
 * @param {string} password
 * @returns {{ length: boolean; lower: boolean; upper: boolean; digit: boolean; special: boolean }}
 */
export default function checkPasswordRules(password) {
  const chars = [...(password || '')]; // code points, like Python's len()

  return {
    length: chars.length >= MINIMUM_PASSWORD_LENGTH,
    lower: chars.some((c) => /\p{Ll}/u.test(c)),
    upper: chars.some((c) => /\p{Lu}/u.test(c)),
    digit: chars.some((c) => /\p{Nd}/u.test(c)),
    // Python: not c.isalnum() and not c.isspace()
    special: chars.some((c) => !/[\p{L}\p{N}\s]/u.test(c)),
  };
}
