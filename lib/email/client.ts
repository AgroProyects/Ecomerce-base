import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

// Configuración del transporter de Nodemailer con Gmail
const transporter: Transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  secure: false, // true para puerto 465, false para otros puertos
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
});

// Verificar la conexión al iniciar (opcional, útil para debugging)
if (process.env.NODE_ENV === 'development') {
  transporter.verify((error, success) => {
    if (error) {
      console.error('Error al conectar con el servidor de email:', error);
    } else {
      console.log('Servidor de email listo para enviar mensajes');
    }
  });
}

export { transporter };
