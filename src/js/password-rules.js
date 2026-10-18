// Mirrors MINIMUM_PASSWORD_LENGTH and is_password_strong_enough() in
// v6_api (c2corg_api/views/user.py). The API stays the authority: if both
// ever disagree, its validation error is still displayed by BaseForm.
export const MINIMUM_PASSWORD_LENGTH = 10;

// Python's str.isdigit() is true for Numeric_Type=Decimal (\p{Nd}) and Numeric_Type=Digit characters
// (superscripts, subscripts, circled digits...). JS regexes have no Numeric_Type property, so the
// latter are listed here (generated from Python's unicodedata: c.isdigit() and not c.isdecimal()).
const PYTHON_DIGIT =
  /[\p{Nd}\u{b2}-\u{b3}\u{b9}\u{1369}-\u{1371}\u{19da}\u{2070}\u{2074}-\u{2079}\u{2080}-\u{2089}\u{2460}-\u{2468}\u{2474}-\u{247c}\u{2488}-\u{2490}\u{24ea}\u{24f5}-\u{24fd}\u{24ff}\u{2776}-\u{277e}\u{2780}-\u{2788}\u{278a}-\u{2792}\u{10a40}-\u{10a43}\u{10e60}-\u{10e68}\u{11052}-\u{1105a}\u{1f100}-\u{1f10a}]/u;

// Python's str.isspace() is true for \x1c-\x1f and \x85, which JS's \s doesn't match, and false for
// \uFEFF, which JS's \s matches.
const PYTHON_ALNUM_OR_SPACE = /[\p{L}\p{N}\s\x1c-\x1f\x85]/u;

/**
 * @param {string} password
 * @returns {{ length: boolean; lower: boolean; upper: boolean; digit: boolean; special: boolean }}
 */
export default function checkPasswordRules(password) {
  const chars = [...(password || '')]; // code points, like Python's len()

  return {
    length: chars.length >= MINIMUM_PASSWORD_LENGTH,
    // Python's islower()/isupper() use the Lowercase/Uppercase properties, wider than \p{Ll}/\p{Lu}
    lower: chars.some((c) => /\p{Lowercase}/u.test(c)),
    upper: chars.some((c) => /\p{Uppercase}/u.test(c)),
    digit: chars.some((c) => PYTHON_DIGIT.test(c)),
    // Python: not c.isalnum() and not c.isspace()
    special: chars.some((c) => c === '\uFEFF' || !PYTHON_ALNUM_OR_SPACE.test(c)),
  };
}
