export { transporter } from './client';
export { sendEmail, sendBulkEmails } from './utils';
export type { SendMailOptions } from 'nodemailer';
export {
  getOrderConfirmationTemplate,
  getPasswordResetTemplate,
  getWelcomeTemplate,
  getOrderShippedTemplate,
} from './templates';
export type {
  EmailOptions,
  EmailAttachment,
  EmailResult,
  BulkEmailResult,
  OrderEmailData,
  OrderItem,
  WelcomeEmailData,
  PasswordResetEmailData,
  OrderShippedEmailData,
} from './types';
