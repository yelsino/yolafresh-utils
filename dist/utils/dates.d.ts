export type UnixMillis = number;
export type ISODateString = string;
export type ISODateOnly = string;
export declare const DateUtils: {
    nowUnix(): UnixMillis;
    nowISO(): ISODateString;
    todayISODateOnly(): ISODateOnly;
    unixToISO(unix: UnixMillis): ISODateString;
    isoToUnix(iso: ISODateString): UnixMillis;
    isoToDate(iso: ISODateString): Date;
    dateToISO(date: Date): ISODateString;
    isoDateOnlyToISO(dateOnly: ISODateOnly): ISODateString;
    isoToDateOnly(iso: ISODateString): ISODateOnly;
    isBefore(a: ISODateString, b: ISODateString): boolean;
    isAfter(a: ISODateString, b: ISODateString): boolean;
};
export declare function generarUlid(prefijo?: string, now?: UnixMillis): string;
