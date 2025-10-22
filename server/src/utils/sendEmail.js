import nodemailer from "nodemailer";

// create a transporter (for testing, using Ethereal) idk how to do that,do i go online and find something like that
// define a sendEmail({ to, subject, body }) function that sends the HTML email ,don't know much about it either,but we do one step first,


const testAccount = await nodemailer.createTestAccount();

const transporter = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure, // true for 465, false for 587
    auth: {
        user: testAccount.user,
        pass: testAccount.pass
    }
});

try {
    await transporter.verify();
    console.log("SMTP connection is ready!");
} catch (error) {
    console.error("Error with SMTP connection:", error);
}

export async function sendEmail({ to, subject, body }) {
    const info = await transporter.sendMail({
        from: '"Pharma Coverage" <no-reply@pharma.com>', // sender address
        to,
        subject,
        html: body
    });

    console.log("Message sent:", info.messageId);
    console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
}
