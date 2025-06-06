export interface Device {
  id: number;
  clerk_id: string;
  email: string;
  name: string;
  serial_number?: string;
  location?: string;
  is_active: boolean;
  last_seen?: string;
  created_at: string;
  updated_at: string;
  mail_delivered_notify: boolean;
  mailbox_opened_notify: boolean;
  mail_removed_notify: boolean;
  battery_low_notify: boolean;
  push_notifications: boolean;
  email_notifications: boolean;
  check_interval: number;
  battery_threshold: number;
  capture_image_on_open: boolean;
  capture_image_on_delivery: boolean;
}

export interface DevicePayload {
  email: string;
  clerk_id: string;
  name: string;
  serial_number?: string;
  location?: string;
  is_active?: boolean;
  mail_delivered_notify?: boolean;
  mailbox_opened_notify?: boolean;
  mail_removed_notify?: boolean;
  battery_low_notify?: boolean;
  push_notifications?: boolean;
  email_notifications?: boolean;
  check_interval?: number;
  battery_threshold?: number;
  capture_image_on_open?: boolean;
  capture_image_on_delivery?: boolean;
}

export interface MailboxEvent {
  id: number;
  device_id: number;
  event_type: "open" | "close";
  occurred_at: string;
}

export interface MailboxEventPayload {
  device_id: number;
  event_type: string;
  timestamp?: string;
}

export interface Image {
  id: number;
  device_id: number;
  image_url: string;
  captured_at: string;
}

export interface DeviceHealth {
  clerk_id: string;
  battery_level?: number;
  signal_strength?: number;
  temperature?: number;
  firmware_version?: string;
}

export interface Notification {
  id: number;
  device_id: number;
  notification_type: string;
  sent_at: string;
}

export interface NotificationPayload {
  device_id: number;
  notification_type: string;
}

export interface DeviceSettings {
  mail_delivered_notify?: boolean;
  mailbox_opened_notify?: boolean;
  mail_removed_notify?: boolean;
  battery_low_notify?: boolean;
  push_notifications?: boolean;
  email_notifications?: boolean;
  check_interval?: number;
  battery_threshold?: number;
  capture_image_on_open?: boolean;
  capture_image_on_delivery?: boolean;
}

export interface DeviceStatusPayload {
  clerk_id: string;
  is_active: boolean;
}

export interface HeartbeatPayload {
  clerk_id: string;
}

export interface DashboardData {
  devices: Device[];
  recent_events: MailboxEvent[];
  recent_images: Image[];
  notification_count: number;
}

export interface DeviceSummary {
  device: Device;
  latest_event?: MailboxEvent;
  latest_image?: Image;
  notification_count: number;
  recent_events?: MailboxEvent[];
}
