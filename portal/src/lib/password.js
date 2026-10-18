// Mirrors the server's password rules for instant feedback (the server always re-checks).

export const MIN_LENGTH = 12;

export function passwordChecks(pw, { name = "", email = "" } = {}) {
  const lower = pw.toLowerCase();
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length;
  const personal = [email.split("@")[0], ...name.split(/\s+/)].map((s) => s.toLowerCase()).filter((s) => s.length >= 4);
  return [
    { ok: pw.length >= MIN_LENGTH, text: `At least ${MIN_LENGTH} characters` },
    { ok: classes >= 3, text: "Three of: lowercase, uppercase, number, symbol" },
    { ok: pw.length > 0 && !/(.)\1{3,}/.test(pw) && new Set(pw).size >= 6, text: "No long runs of the same character" },
    { ok: pw.length > 0 && !/(0123|1234|2345|3456|4567|5678|6789|abcd|qwer|asdf)/.test(lower), text: "No simple sequences (1234, abcd, qwer)" },
    { ok: pw.length > 0 && !personal.some((p) => lower.includes(p)), text: "Doesn't contain your name or email" },
  ];
}

export function isStrong(pw, who) {
  return passwordChecks(pw, who).every((c) => c.ok);
}

/** Random 16-character password with every character type (no look-alike characters). */
export function generatePassword(length = 16) {
  const sets = ["abcdefghijkmnpqrstuvwxyz", "ABCDEFGHJKLMNPQRSTUVWXYZ", "23456789", "!@#$%^&*-_=+?"];
  const all = sets.join("");
  const rand = (n) => {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return a[0] % n;
  };
  for (;;) {
    const chars = sets.map((s) => s[rand(s.length)]);
    while (chars.length < length) chars.push(all[rand(all.length)]);
    for (let i = chars.length - 1; i > 0; i--) {
      const j = rand(i + 1);
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    const pw = chars.join("");
    if (isStrong(pw)) return pw;
  }
}
