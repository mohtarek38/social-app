export const emailTemplates = {
  confirmationEmail: (firstName: string, lastName: string, otp: string) =>
    `
        <!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Confirmation</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 1px solid #eeeeee;
        }
        .header h1 {
            color: #333333;
        }
        .content {
            padding: 20px 0;
            text-align: center;
        }
        .content p {
            font-size: 16px;
            line-height: 1.6;
            color: #555555;
        }
        .otp-code {
            display: inline-block;
            background-color: #007bff;
            color: #ffffff;
            font-size: 24px;
            font-weight: bold;
            padding: 10px 20px;
            margin: 20px 0;
            border-radius: 5px;
            text-decoration: none; /* In case you want to make it clickable, but for OTP it's usually just text */
        }
        .footer {
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #eeeeee;
            font-size: 14px;
            color: #777777;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Confirm Your Email Address</h1>
        </div>
        <div class="content">
            <p>Thank you for registering, ${firstName}! To complete your registration, please use the following One-Time Password (OTP) to verify your email address:</p>
            <span class="otp-code">${otp}</span>
            <p>This code is valid for a limited time. Please do not share this code with anyone.</p>
        </div>
        <div class="footer">
            <p>&copy; 2025 MohTarek38. All rights reserved.</p>
        </div>
    </div>
</body>
</html>       
  `,

  // Add more email templates here as needed
  // passwordReset: (firstName: string, resetLink: string) => `...`,
  // welcomeEmail: (firstName: string) => `...`,
};
