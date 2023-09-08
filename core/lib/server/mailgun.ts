import nodemailer, { Transporter } from 'nodemailer';

export const smtpclient = nodemailer.createTransport({
    pool: true,
    host: "smtp.mailgun.org",
    port: 465,
    secure: true,
    auth: {
        user: process.env.MAILGUN_SMTP_USERNAME,
        pass: process.env.MAILGUN_SMTP_PASSWORD,
    },
})