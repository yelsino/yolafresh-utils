import type { FiscalV1Environment } from "./modulo-fiscal-v1.contract";

/** Backend custody of an artifact received over the authenticated provider channel.
 * This records provenance. It does not assert independent X509 verification and
 * must never be accepted from an operator, device or an imported arbitrary XML. */
export interface FiscalV1ProviderChannelReceipt {
  readonly schemaVersion: "fiscal-v1-provider-channel-v1";
  readonly assurance: "PROVIDER_AUTHENTICATED_CHANNEL";
  readonly provider: "XmlPeru";
  readonly origin: "https://api.xmlperu.dev";
  readonly tenantId: string;
  readonly issuerRuc: string;
  readonly environment: FiscalV1Environment;
  readonly externalId: string;
  readonly documentType: "01" | "03" | "07";
  readonly series: string;
  readonly number: number;
  readonly artifactKind: "SIGNED_XML" | "CDR" | "PROVIDER_RESULT";
  readonly artifactSha256: string;
  readonly receivedAtMs: number;
}

export type FiscalV1ProviderReceiptBinding = Pick<FiscalV1ProviderChannelReceipt,
  "tenantId" | "issuerRuc" | "environment" | "externalId" | "documentType" |
  "series" | "number" | "artifactKind" | "artifactSha256">;

/** Shape/binding validation only. The trusted backend adapter owns the source
 * assertion; a well-formed receipt is not a signature or permission to emit. */
export function assertFiscalV1ProviderChannelReceipt(value: unknown,
  binding: FiscalV1ProviderReceiptBinding, notBeforeMs = 0): asserts value is FiscalV1ProviderChannelReceipt {
  const fail = (): never => { throw new Error("FISCAL_V1_PROVIDER_RECEIPT_INVALID"); };
  if (!value || typeof value !== "object" || Array.isArray(value)) return fail();
  const row = value as unknown as FiscalV1ProviderChannelReceipt;
  if (Object.keys(row).sort().join(",") !==
      "artifactKind,artifactSha256,assurance,documentType,environment,externalId,issuerRuc,number,origin,provider,receivedAtMs,schemaVersion,series,tenantId" ||
      row.schemaVersion !== "fiscal-v1-provider-channel-v1" || row.assurance !== "PROVIDER_AUTHENTICATED_CHANNEL" ||
      row.provider !== "XmlPeru" || row.origin !== "https://api.xmlperu.dev" ||
      typeof row.tenantId !== "string" || !row.tenantId.trim() || row.tenantId.length > 256 ||
      !/^\d{11}$/.test(row.issuerRuc) || !["DEMO", "PRODUCTION"].includes(row.environment) ||
      typeof row.externalId !== "string" || !row.externalId.trim() || row.externalId.length > 256 ||
      /[\x00-\x1f\x7f]/.test(row.externalId) || !["01", "03", "07"].includes(row.documentType) ||
      !/^[BF][A-Z0-9]{3}$/.test(row.series) || row.documentType === "01" && row.series[0] !== "F" ||
      row.documentType === "03" && row.series[0] !== "B" ||
      !Number.isSafeInteger(row.number) || row.number < 1 || row.number > 99_999_999 ||
      !["SIGNED_XML", "CDR", "PROVIDER_RESULT"].includes(row.artifactKind) || !/^[a-f0-9]{64}$/.test(row.artifactSha256) ||
      !Number.isSafeInteger(row.receivedAtMs) || row.receivedAtMs < notBeforeMs ||
      !Number.isSafeInteger(notBeforeMs) || notBeforeMs < 0 || !binding ||
      Object.keys(binding).some(key => row[key as keyof FiscalV1ProviderReceiptBinding] !== binding[key as keyof FiscalV1ProviderReceiptBinding]) ||
      Object.keys(binding).sort().join(",") !== "artifactKind,artifactSha256,documentType,environment,externalId,issuerRuc,number,series,tenantId") return fail();
}
