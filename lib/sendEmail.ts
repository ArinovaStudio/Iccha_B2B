import nodemailer from "nodemailer";
const EMAIL_USER = process.env.EMAIL_USER?.trim() || process.env.EMAIL?.trim();
// Google app passwords are often copied in four-character groups with spaces.
const EMAIL_PASS = process.env.EMAIL_PASS?.replace(/\s+/g, "");

const transporter = EMAIL_USER && EMAIL_PASS
    ? nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: EMAIL_USER,
            pass: EMAIL_PASS,
        },
        connectionTimeout: 15_000,
        greetingTimeout: 15_000,
        socketTimeout: 20_000,
    })
    : null;

const sendEmail = async (to: string, subject: string, html: string): Promise<boolean> => {
    if (!transporter || !EMAIL_USER) {
        console.error("Email is not configured. Set EMAIL (or EMAIL_USER) and EMAIL_PASS.");
        return false;
    }

    try {
        await transporter.verify();
        await transporter.sendMail({
            from: EMAIL_USER,
            to,
            subject,
            html,
        });

        return true;
    } catch (error) {
        console.error("Email send error:", error);
        return false;
    }
}

export default sendEmail;
