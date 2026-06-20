import { MetodoPago } from "./finanzas";

export type MonedaCuentaCliente = "PEN" | "USD";

export type EstadoCuentaCliente = "ACTIVE" | "SUSPENDED" | "CLOSED";

export interface CustomerAccount {
  id: string;
  clienteId: string;
  estado: EstadoCuentaCliente;
  createdAt: Date;
}

export type TipoAccountEntry = "DEPOSIT" | "PAYMENT" | "SALE" | "REFUND" | "REVERSAL";

export type DireccionAccountEntry = "CREDIT" | "DEBIT";

export type OrigenAccountEntry =
  | "CASH_RECEIPT"
  | "SALE"
  | "ORDER"
  | "REFUND"
  | "REVERSAL"
  | "RECURRENCE"
  | "MANUAL_ADJUSTMENT"
  | "EXTERNAL";

export interface AccountEntry {
  id: string;
  accountId: string;
  entryType: TipoAccountEntry;
  direction: DireccionAccountEntry;
  amount: number;
  moneda: MonedaCuentaCliente;
  originType: OrigenAccountEntry;
  originId: string;
  idempotencyKey?: string;
  createdAt: Date;
}

export interface Allocation {
  id: string;
  sourceEntryId: string;
  targetEntryId: string;
  amount: number;
  moneda: MonedaCuentaCliente;
  createdAt: Date;
}

export type EstadoCashReceipt = "CREATED" | "RECEIVED" | "REJECTED" | "CANCELLED";

export interface CashReceipt {
  id: string;
  clienteId: string;
  amount: number;
  moneda: MonedaCuentaCliente;
  paymentMethod: MetodoPago;
  createdById: string;
  estado: EstadoCashReceipt;
  idempotencyKey: string;
  createdAt: Date;
}

export type EstadoCustodyTransfer = "CREATED" | "RECEIVED" | "REJECTED" | "CANCELLED";

export interface CustodyTransfer {
  id: string;
  receiptId: string;
  fromActorId: string;
  toActorId: string;
  fromShiftId: string;
  toShiftId: string;
  estado: EstadoCustodyTransfer;
  receivedById?: string;
  rejectedById?: string;
  cancelledById?: string;
  rejectionReason?: string;
  cancellationReason?: string;
  createdAt: Date;
  resolvedAt?: Date;
}

export type EstadoCashShift = "OPEN" | "CLOSED";

export interface CashShift {
  id: string;
  cashBoxId: string;
  cashierId: string;
  openedAt: Date;
  closedAt?: Date;
  estado: EstadoCashShift;
}

export type EstadoCashBox = "ACTIVE" | "INACTIVE";

export interface CashBox {
  id: string;
  estado: EstadoCashBox;
}

export interface AccountSnapshot {
  accountId: string;
  availableBalance: number;
  receivableBalance: number;
  moneda: MonedaCuentaCliente;
  updatedAt: Date;
}
