export async function sendBrevoEmail(_: { to: string | string[]; subject: string; html: string }) {
  // Email sending disabled
}

export function adminRecipients(): string[] {
  return [];
}
