import type { Handler } from "@netlify/functions";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export const handler: Handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    const { to, bcc, subject, text, html } = JSON.parse(event.body || "{}");

    if (!to && !bcc) {
        return { statusCode: 400, body: "Missing 'to' or 'bcc' email address" };
    }

    try {
        // Create a test account if no env vars are set
        // In production, these should be set in Netlify environment variables
        const host = process.env.SMTP_HOST || "smtp.ethereal.email";
        const port = parseInt(process.env.SMTP_PORT || "587");
        const user = process.env.SMTP_USER;
        const pass = process.env.SMTP_PASS;

        console.log("SMTP Config - Host:", host, "Port:", port, "User:", user ? "Set" : "Not Set");
        console.log("Current Working Directory:", process.cwd());
        console.log("Available Env Vars:", Object.keys(process.env).filter(key => key.includes('SMTP') || key.includes('VITE')));

        let transporter;

        if (user && pass) {
            transporter = nodemailer.createTransport({
                host,
                port,
                secure: port === 465, // true for 465, false for other ports
                auth: {
                    user,
                    pass,
                },
            });
        } else {
            // Fallback to Ethereal test account generation
            console.log("No SMTP credentials found, creating Ethereal test account...");
            const testAccount = await nodemailer.createTestAccount();
            transporter = nodemailer.createTransport({
                host: "smtp.ethereal.email",
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                },
            });
            console.log("Ethereal Test Account created:", testAccount.user);
        }

        const info = await transporter.sendMail({
            from: '"Alarmfase 3 - ledensysteem" <ledensysteem@alarmfase3.nl>',
            to: to,
            bcc: bcc,
            subject: subject || "Hello World",
            text: text || "Hello world from Band Manager!",
            html: html || "<b>Hello world from Band Manager!</b>",
        });

        console.log("Message sent: %s", info.messageId);
        const previewUrl = nodemailer.getTestMessageUrl(info);
        console.log("Preview URL: %s", previewUrl);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Email sent successfully",
                previewUrl: previewUrl,
            }),
        };
    } catch (error) {
        console.error("Error sending email:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to send email" }),
        };
    }
};
