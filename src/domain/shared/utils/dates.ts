export type UnixMillis = number;
export type ISODateString = string;
export type ISODateOnly = string; // "2026-02-26"

export const DateUtils = {
  // =============================
  // CREACIÓN
  // =============================

  nowUnix(): UnixMillis {
    return Date.now();
  },

  nowISO(): ISODateString {
    return new Date().toISOString();
  },

  todayISODateOnly(): ISODateOnly {
    return new Date().toISOString().split("T")[0];
  },

  // =============================
  // CONVERSIONES
  // =============================

  unixToISO(unix: UnixMillis): ISODateString {
    return new Date(unix).toISOString();
  },

  isoToUnix(iso: ISODateString): UnixMillis {
    return new Date(iso).getTime();
  },

  isoToDate(iso: ISODateString): Date {
    return new Date(iso);
  },

  dateToISO(date: Date): ISODateString {
    return date.toISOString();
  },

  // =============================
  // ISO DATE ONLY
  // =============================

  isoDateOnlyToISO(dateOnly: ISODateOnly): ISODateString {
    return `${dateOnly}T00:00:00.000Z`;
  },

  isoToDateOnly(iso: ISODateString): ISODateOnly {
    return iso.split("T")[0];
  },

  // =============================
  // COMPARACIONES SEGURAS
  // =============================

  isBefore(a: ISODateString, b: ISODateString): boolean {
    return new Date(a).getTime() < new Date(b).getTime();
  },

  isAfter(a: ISODateString, b: ISODateString): boolean {
    return new Date(a).getTime() > new Date(b).getTime();
  }
};

const ULID_ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function ulidEncodeTime(time: UnixMillis): string {
  let t = time;
  let out = "";
  for (let i = 0; i < 10; i++) {
    out = ULID_ENCODING[t % 32] + out;
    t = Math.floor(t / 32);
  }
  return out;
}

function ulidRandomChar(): string {
  const cryptoObj = (globalThis as unknown as { crypto?: Crypto }).crypto;
  const arr = new Uint8Array(1);
  if (cryptoObj?.getRandomValues) {
    cryptoObj.getRandomValues(arr);
    return ULID_ENCODING[arr[0] % 32];
  }
  return ULID_ENCODING[Math.floor(Math.random() * 32)];
}

export function generarUlid(prefijo?: string, now?: UnixMillis): string {
  const timePart = ulidEncodeTime(now ?? Date.now());
  let randomPart = "";
  for (let i = 0; i < 16; i++) randomPart += ulidRandomChar();
  const ulid = `${timePart}${randomPart}`;
  return prefijo ? `${prefijo}_${ulid}` : ulid;
}
