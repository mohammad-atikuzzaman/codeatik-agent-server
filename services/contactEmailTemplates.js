export const createContactEmailTemplate = (name, email, message) => {
  const date = new Date().toLocaleString();
  return `
    <!DOCTYPE html>
    <html xmlns="http://www.w3.org/1999/xhtml">
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>New Message from CodeAtik</title>
    </head>
    <body style="margin:0; padding:0; font-family: Arial, sans-serif; color: #333; background-color: #f5f5f5;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5;">
            <tr>
                <td align="center">
                    <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; margin: 20px auto; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                        <tr>
                            <td style="background: linear-gradient(135deg, #6b46c1 0%, #d53f8c 100%); padding: 30px 20px; text-align: center;">
                                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td style="text-align: center;">
                                            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">CodeAtik</h1>
                                            <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0; font-size: 16px;">Website Generator</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 30px;">
                                <h2 style="color: #2d3748; margin: 0 0 20px; font-size: 20px; font-weight: bold;">New Contact Form Submission</h2>
                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 25px;">
                                    <tr>
                                        <td width="30%" style="padding: 8px 0; color: #718096; font-size: 14px;">From:</td>
                                        <td style="padding: 8px 0; font-size: 14px; font-weight: bold;">${name}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #718096; font-size: 14px;">Email:</td>
                                        <td style="padding: 8px 0; font-size: 14px;">
                                            <a href="mailto:${email}" style="color: #6b46c1; text-decoration: none;">${email}</a>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #718096; font-size: 14px;">Date:</td>
                                        <td style="padding: 8px 0; font-size: 14px;">${date}</td>
                                    </tr>
                                </table>
                                <div style="background-color: #f8f9fa; border-left: 4px solid #6b46c1; padding: 15px; margin: 20px 0; border-radius: 0 4px 4px 0;">
                                    <p style="margin: 0; font-size: 15px; line-height: 1.5; color: #4a5568;">${message}</p>
                                </div>
                                <p style="margin: 25px 0 0; font-size: 14px; color: #718096; line-height: 1.5;">
                                    You can reply directly to this email or contact the sender at the provided email address.
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <td style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #718096; border-top: 1px solid #e2e8f0;">
                                <p style="margin: 0 0 10px;">&copy; ${new Date().getFullYear()} CodeAtik. All rights reserved.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
  `;
};

export const createConfirmationEmailTemplate = (name, message) => {
  return `
    <!DOCTYPE html>
    <html xmlns="http://www.w3.org/1999/xhtml">
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Thank you for your message</title>
    </head>
    <body style="margin:0; padding:0; font-family: Arial, sans-serif; color: #333; background-color: #f5f5f5;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5;">
            <tr>
                <td align="center">
                    <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; margin: 20px auto; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                        <tr>
                            <td style="background: linear-gradient(135deg, #6b46c1 0%, #d53f8c 100%); padding: 30px 20px; text-align: center;">
                                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td style="text-align: center;">
                                            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">CodeAtik</h1>
                                            <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0; font-size: 16px;">Website Generator</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 30px;">
                                <h2 style="color: #2d3748; margin: 0 0 20px; font-size: 20px; font-weight: bold;">Thank you for contacting us!</h2>
                                <p style="color: #4a5568; font-size: 15px; line-height: 1.5; margin-bottom: 20px;">
                                    Dear ${name},<br><br>
                                    Thank you for reaching out to us. We have received your message and will get back to you soon.
                                </p>
                                <div style="background-color: #f8f9fa; border-left: 4px solid #6b46c1; padding: 15px; margin: 20px 0; border-radius: 0 4px 4px 0;">
                                    <p style="margin: 0; font-size: 15px; line-height: 1.5; color: #4a5568;">${message}</p>
                                </div>
                                <p style="margin: 25px 0 0; font-size: 14px; color: #718096; line-height: 1.5;">
                                    If you have any additional questions, feel free to reply to this email.
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <td style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #718096; border-top: 1px solid #e2e8f0;">
                                <p style="margin: 0 0 10px;">&copy; ${new Date().getFullYear()} CodeAtik. All rights reserved.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
  `;
};