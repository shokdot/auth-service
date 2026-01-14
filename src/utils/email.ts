import nodemailer, { Transporter } from "nodemailer";

const transporter: Transporter = nodemailer.createTransport({
	service: "Gmail",
	host: process.env.SMTP_HOST,
	port: Number(process.env.SMTP_PORT),
	secure: true,
	auth: {
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASS,
	},
});

const getEmailTemplate = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ft_transcendence</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f7;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f7; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">ft_transcendence</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #fafafa; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e5e7;">
              <p style="margin: 0 0 10px; color: #86868b; font-size: 13px; line-height: 1.5;">
                This email was sent from ft_transcendence. If you didn't request this, you can safely ignore it.
              </p>
              <p style="margin: 0; color: #86868b; font-size: 13px;">
                © ${new Date().getFullYear()} ft_transcendence. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export const sendResetEmail = async (to: string, token: string) => {
	const resetUrl = `http://127.0.0.1:3000/api/v1/auth/password/reset?token=${token}`; //frontend route

	const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="display: inline-block; background-color: #fff3cd; border-radius: 50%; padding: 20px; margin-bottom: 20px;">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C9.38 2 7.25 4.13 7.25 6.75V9C6.01 9 5 10.01 5 11.25V17.75C5 18.99 6.01 20 7.25 20H16.75C17.99 20 19 18.99 19 17.75V11.25C19 10.01 17.99 9 16.75 9V6.75C16.75 4.13 14.62 2 12 2ZM12 4C13.54 4 14.75 5.21 14.75 6.75V9H9.25V6.75C9.25 5.21 10.46 4 12 4Z" fill="#856404"/>
        </svg>
      </div>
    </div>
    
    <h2 style="margin: 0 0 16px; color: #1d1d1f; font-size: 24px; font-weight: 600; text-align: center;">Reset Your Password</h2>
    
    <p style="margin: 0 0 24px; color: #515154; font-size: 16px; line-height: 1.6; text-align: center;">
      We received a request to reset your password. Click the button below to create a new password.
    </p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
        Reset Password
      </a>
    </div>
    
    <p style="margin: 24px 0 0; color: #86868b; font-size: 14px; line-height: 1.6; text-align: center;">
      This link will expire in 1 hour for security reasons.
    </p>
    
    <div style="margin-top: 32px; padding: 16px; background-color: #f5f5f7; border-radius: 8px; border-left: 4px solid #667eea;">
      <p style="margin: 0; color: #515154; font-size: 13px; line-height: 1.5;">
        <strong>Didn't request this?</strong><br>
        If you didn't request a password reset, please ignore this email or contact support if you have concerns.
      </p>
    </div>
  `;

	await transporter.sendMail({
		from: '"ft_transcendence" <no-reply@bigbang-transcendence.com>',
		to,
		subject: "Reset Your Password - ft_transcendence",
		html: getEmailTemplate(content),
	});
};

export const sendVerificationEmail = async (to: string, token: string, username: string) => {
	const verificationUrl = `http://127.0.0.1:3000/api/v1/auth/verify-email?token=${token}`;

	const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="display: inline-block; background-color: #d1f4e0; border-radius: 50%; padding: 20px; margin-bottom: 20px;">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="#0f5132"/>
        </svg>
      </div>
    </div>
    
    <h2 style="margin: 0 0 16px; color: #1d1d1f; font-size: 24px; font-weight: 600; text-align: center;">Welcome to ft_transcendence, ${username}! 🎉</h2>
    
    <p style="margin: 0 0 24px; color: #515154; font-size: 16px; line-height: 1.6; text-align: center;">
      You're almost there! We just need to verify your email address to complete your registration.
    </p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
        Verify Email Address
      </a>
    </div>
    
    <p style="margin: 24px 0 0; color: #86868b; font-size: 14px; line-height: 1.6; text-align: center;">
      This link will expire in 24 hours.
    </p>
    
    <div style="margin-top: 32px; padding: 20px; background-color: #f5f5f7; border-radius: 8px;">
      <h3 style="margin: 0 0 12px; color: #1d1d1f; font-size: 16px; font-weight: 600;">What's next?</h3>
      <ul style="margin: 0; padding-left: 20px; color: #515154; font-size: 14px; line-height: 1.8;">
        <li>Complete your profile</li>
        <li>Explore the dashboard</li>
        <li>Connect with other players</li>
      </ul>
    </div>
    
    <div style="margin-top: 24px; padding: 16px; background-color: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
      <p style="margin: 0; color: #856404; font-size: 13px; line-height: 1.5;">
        <strong>Security tip:</strong> We'll never ask for your password via email. Keep your account safe!
      </p>
    </div>
  `;

	await transporter.sendMail({
		from: '"ft_transcendence" <no-reply@bigbang-transcendence.com>',
		to,
		subject: "Verify Your Email - ft_transcendence",
		html: getEmailTemplate(content),
	});
};
