export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  path?: string;
  content?: string | Buffer;
  contentType?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface BulkEmailResult {
  total: number;
  successful: number;
  failed: number;
  results: PromiseSettledResult<EmailResult>[];
}

export interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  items: OrderItem[];
  total: number;
  shippingAddress?: string;
}

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface WelcomeEmailData {
  customerName: string;
  email: string;
}

export interface PasswordResetEmailData {
  customerName: string;
  resetLink: string;
}

export interface OrderShippedEmailData {
  orderNumber: string;
  customerName: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
}
