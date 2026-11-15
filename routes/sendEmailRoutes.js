import { Router } from "express";
import {
  createConfirmationEmailTemplate,
  createContactEmailTemplate,
} from "../services/contactEmailTemplates.js";
import { transporter } from "../config/nodeMailerConfig.js";

const router = Router();

router.post("/", async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!email || !message) {
    return res.status(400).json({ error: "Email and message are required" });
  }

  try {
    const mailOptionsToYou = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: `New Contact Form: ${subject || "Inquiry"}`,
      html: createContactEmailTemplate(name, email, message),
      text: `You have received a new message from ${name} (${email}):\n\n${message}`,
    };

    const mailOptionsToUser = {
      from: `"CodeAtik Agent" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Thank you for contacting CodeAtik",
      html: createConfirmationEmailTemplate(name, message),
      text: `Dear ${name},\n\nThank you for contacting us. We have received your message and will get back to you soon.\n\nYour message:\n${message}\n\nBest regards,\nThe CodeAtik Team`,
    };

    await transporter.sendMail(mailOptionsToYou);
    await transporter.sendMail(mailOptionsToUser);

    res.status(200).json({ message: "Emails sent successfully!" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
});

export default router;
