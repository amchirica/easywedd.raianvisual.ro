import type { Guest } from "@/types/planner";

function normalizeName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function findDuplicateGuests(
  guests: Pick<Guest, "id" | "first_name" | "last_name" | "email" | "phone">[],
): { guestIds: string[]; reason: string }[] {
  const byName = new Map<string, string[]>();
  const byEmail = new Map<string, string[]>();
  const byPhone = new Map<string, string[]>();

  for (const guest of guests) {
    const nameKey = `${normalizeName(guest.first_name)}|${normalizeName(guest.last_name)}`;
    byName.set(nameKey, [...(byName.get(nameKey) ?? []), guest.id]);

    if (guest.email) {
      const email = guest.email.trim().toLowerCase();
      byEmail.set(email, [...(byEmail.get(email) ?? []), guest.id]);
    }
    if (guest.phone) {
      const phone = guest.phone.replace(/\s+/g, "");
      byPhone.set(phone, [...(byPhone.get(phone) ?? []), guest.id]);
    }
  }

  const groups: { guestIds: string[]; reason: string }[] = [];

  for (const [key, ids] of byName) {
    if (ids.length > 1) {
      groups.push({ guestIds: ids, reason: `Nume similar: ${key.replace("|", " ")}` });
    }
  }
  for (const [email, ids] of byEmail) {
    if (ids.length > 1) {
      groups.push({ guestIds: ids, reason: `Email: ${email}` });
    }
  }
  for (const [phone, ids] of byPhone) {
    if (ids.length > 1) {
      groups.push({ guestIds: ids, reason: `Telefon: ${phone}` });
    }
  }

  return groups;
}
