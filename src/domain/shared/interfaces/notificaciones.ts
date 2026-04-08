export type NotificationChannel =
  | "APP"
  | "EMAIL"
  | "SMS"
  | "WHATSAPP"
  | "PUSH"
  | "WEBHOOK";

export type NotificationPriority = "LOW" | "NORMAL" | "HIGH" | "CRITICAL";

export type NotificationStatus =
  | "CREATED"
  | "QUEUED"
  | "SENT"
  | "DELIVERED"
  | "READ"
  | "FAILED"
  | "EXPIRED"
  | "CANCELLED";

export type NotificationEntityType =
  | "VENTA"
  | "COMPRA"
  | "PAGO"
  | "INGRESO"
  | "EGRESO"
  | "CAJA"
  | "TURNO_CAJA"
  | "MOVIMIENTO_CAJA"
  | "INVENTARIO"
  | "TRANSFERENCIA"
  | "CLIENTE"
  | "PROVEEDOR"
  | "USUARIO"
  | "SISTEMA"
  | "OTRO";

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: NotificationPriority;
  status: NotificationStatus;
  createdAt: Date;
  expiresAt?: Date;
  entityType?: NotificationEntityType;
  entityId?: string;
  triggeredByUserId?: string;
  tenantId?: string;
  data?: Record<string, unknown>;
}

export type NotificationRecipientStatus =
  | "PENDING"
  | "DELIVERED"
  | "READ"
  | "FAILED"
  | "CANCELLED";

export interface NotificationRecipient {
  id: string;
  notificationId: string;
  userId?: string;
  roleId?: string;
  channel: NotificationChannel;
  status: NotificationRecipientStatus;
  isRead: boolean;
  deliveredAt?: Date;
  readAt?: Date;
  createdAt: Date;
}

export type NotificationDeliveryStatus = "PENDING" | "SENT" | "FAILED";

export interface NotificationDelivery {
  id: string;
  notificationId: string;
  recipientId: string;
  channel: NotificationChannel;
  status: NotificationDeliveryStatus;
  sentAt?: Date;
  failedAt?: Date;
  error?: string;
  createdAt: Date;
}

export interface NotificationTemplate {
  id: string;
  code: string;
  titleTemplate: string;
  messageTemplate: string;
  language?: string;
  channels?: NotificationChannel[];
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationPreference {
  id: string;
  userId: string;
  notificationType: string;
  channel: NotificationChannel;
  enabled: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationEvent {
  id: string;
  type: string;
  entityType?: NotificationEntityType;
  entityId?: string;
  payload?: Record<string, unknown>;
  tenantId?: string;
  triggeredByUserId?: string;
  createdAt: Date;
}

export interface NotificationGroup {
  id: string;
  type: string;
  entityType?: NotificationEntityType;
  entityId?: string;
  count: number;
  lastEventAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

