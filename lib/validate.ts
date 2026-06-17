export function sanitize(s: string): string {
  return s.replace(/[<>&"']/g, "").trim();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && email.length <= 200;
}

export function isValidPhone(phone: string): boolean {
  return /^[+\d\s\-().]{6,25}$/.test(phone.trim());
}

export function isValidName(name: string): boolean {
  return name.trim().length >= 2 && name.trim().length <= 120 && !/[<>&"'{}[\]\\^~`|]/.test(name);
}

export function isValidMessage(msg: string): boolean {
  return msg.trim().length >= 3 && msg.trim().length <= 2000 && !/<script/i.test(msg);
}
