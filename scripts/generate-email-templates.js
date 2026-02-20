/**
 * Generate branded email templates for Supabase
 * 
 * Run this script to generate HTML email templates that can be pasted
 * into Supabase Dashboard → Authentication → Email Templates
 * 
 * Usage: node scripts/generate-email-templates.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Brand colors from actual design system
const colors = {
  primary: '#5B6CFF',        // Blue-violet
  background: '#0E1116',      // Dark charcoal
  foreground: '#F5F7FA',       // Soft off-white
  card: '#181B20',            // Card background
  border: '#2A2F3A',          // Border color
  muted: '#64748B',           // Muted text
  confirmed: '#3FB984',       // Success green
  maybe: '#E6B566',           // Amber
  out: '#D46A6A',             // Red
};

// Logo URL - using the actual public URL (versioned filename from Vite build)
const logoUrl = 'https://www.inlockstep.ai/assets/lockstep-logo-light-4rS9VEC5.png';

// Base email template structure
function createEmailTemplate({ subject, title, body, ctaText, ctaUrl, footerText }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: ${colors.background};
      color: ${colors.foreground};
      line-height: 1.6;
      padding: 0;
      margin: 0;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: ${colors.card};
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid ${colors.border};
    }
    .email-header {
      background: linear-gradient(135deg, ${colors.primary}15, ${colors.primary}05);
      padding: 40px 32px;
      text-align: center;
      border-bottom: 1px solid ${colors.border};
    }
    .logo {
      max-width: 180px;
      height: auto;
      margin-bottom: 24px;
    }
    .email-body {
      padding: 40px 32px;
    }
    .email-title {
      font-size: 24px;
      font-weight: 600;
      color: ${colors.foreground};
      margin-bottom: 16px;
      line-height: 1.3;
    }
    .email-text {
      font-size: 16px;
      color: ${colors.foreground};
      margin-bottom: 24px;
      line-height: 1.6;
    }
    .cta-button {
      display: inline-block;
      padding: 14px 32px;
      background-color: ${colors.primary};
      color: #FFFFFF;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      text-align: center;
      margin: 24px 0;
      transition: opacity 0.2s;
    }
    .cta-button:hover {
      opacity: 0.9;
    }
    .email-footer {
      padding: 32px;
      text-align: center;
      border-top: 1px solid ${colors.border};
      background-color: ${colors.background};
    }
    .footer-text {
      font-size: 14px;
      color: ${colors.muted};
      line-height: 1.6;
      margin-bottom: 16px;
    }
    .footer-link {
      color: ${colors.primary};
      text-decoration: none;
    }
    .footer-link:hover {
      text-decoration: underline;
    }
    .divider {
      height: 1px;
      background-color: ${colors.border};
      margin: 32px 0;
    }
    @media only screen and (max-width: 600px) {
      .email-container {
        border-radius: 0;
      }
      .email-header,
      .email-body,
      .email-footer {
        padding: 32px 24px;
      }
      .email-title {
        font-size: 20px;
      }
      .email-text {
        font-size: 15px;
      }
    }
  </style>
</head>
<body>
  <div style="padding: 24px 16px; min-height: 100vh; background-color: ${colors.background};">
    <div class="email-container">
      <div class="email-header">
        <img src="${logoUrl}" alt="Lockstep" class="logo" />
      </div>
      
      <div class="email-body">
        <h1 class="email-title">${title}</h1>
        ${body}
        ${ctaUrl ? `<a href="{{ .ConfirmationURL }}" class="cta-button">${ctaText}</a>` : ''}
      </div>
      
      <div class="email-footer">
        <p class="footer-text">${footerText}</p>
        <p class="footer-text" style="font-size: 12px; margin-top: 24px;">
          <a href="https://inlockstep.ai" class="footer-link">inlockstep.ai</a> · 
          <a href="https://inlockstep.ai/auth" class="footer-link">Sign in</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// Template 1: Confirmation Email (Signup)
const confirmationEmail = createEmailTemplate({
  subject: 'Confirm your Lockstep account',
  title: 'Welcome to Lockstep! 🎉',
  body: `
    <p class="email-text">
      We\'re thrilled to have you! You\'re just one click away from creating seamless, organized events that your guests will love.
    </p>
    <p class="email-text">
      Click the button below to confirm your email and start planning your first event.
    </p>
  `,
  ctaText: 'Confirm Email',
  ctaUrl: '{{ .ConfirmationURL }}',
  footerText: 'If you didn\'t create a Lockstep account, you can safely ignore this email.',
});

// Template 2: Magic Link Email
const magicLinkEmail = createEmailTemplate({
  subject: 'Your Lockstep sign-in link',
  title: 'Sign in to Lockstep',
  body: `
    <p class="email-text">
      Click the button below to sign in to your Lockstep account. This link will expire in 1 hour.
    </p>
    <p class="email-text" style="color: ${colors.muted}; font-size: 14px;">
      If you didn\'t request this link, you can safely ignore this email.
    </p>
  `,
  ctaText: 'Sign In',
  ctaUrl: '{{ .ConfirmationURL }}',
  footerText: 'This magic link expires in 1 hour for your security.',
});

// Template 3: Password Reset Email
const passwordResetEmail = createEmailTemplate({
  subject: 'Reset your Lockstep password',
  title: 'Reset your password',
  body: `
    <p class="email-text">
      We received a request to reset your password. Click the button below to create a new password.
    </p>
    <p class="email-text" style="color: ${colors.muted}; font-size: 14px;">
      This link will expire in 1 hour. If you didn\'t request a password reset, you can safely ignore this email.
    </p>
  `,
  ctaText: 'Reset Password',
  ctaUrl: '{{ .ConfirmationURL }}',
  footerText: 'For security, this link expires in 1 hour.',
});

// Template 4: Email Change Confirmation (New Email)
const emailChangeConfirmation = createEmailTemplate({
  subject: 'Confirm your new email address',
  title: 'Confirm your new email',
  body: `
    <p class="email-text">
      You\'ve requested to change your email address to this one. Click the button below to confirm this is your email.
    </p>
    <p class="email-text" style="color: ${colors.muted}; font-size: 14px;">
      If you didn\'t request this change, please contact us immediately.
    </p>
  `,
  ctaText: 'Confirm New Email',
  ctaUrl: '{{ .ConfirmationURL }}',
  footerText: 'This confirmation link expires in 24 hours.',
});

// Template 5: Email Change Notification (Old Email)
const emailChangeNotification = createEmailTemplate({
  subject: 'Your Lockstep email has been changed',
  title: 'Email address updated',
  body: `
    <p class="email-text">
      Your Lockstep account email has been successfully changed to: <strong>{{ .NewEmail }}</strong>
    </p>
    <p class="email-text" style="color: ${colors.muted}; font-size: 14px;">
      If you didn\'t make this change, please contact us immediately to secure your account.
    </p>
  `,
  ctaText: 'Sign In',
  ctaUrl: 'https://inlockstep.ai/auth',
  footerText: 'If this wasn\'t you, please contact us right away.',
});

// Template 6: Invite User Email (if using team features)
const inviteUserEmail = createEmailTemplate({
  subject: 'You\'ve been invited to Lockstep',
  title: 'You\'re invited! 🎊',
  body: `
    <p class="email-text">
      You\'ve been invited to join a Lockstep event. Click the button below to accept the invitation and create your account.
    </p>
    <p class="email-text" style="color: ${colors.muted}; font-size: 14px;">
      This invitation will expire in 7 days.
    </p>
  `,
  ctaText: 'Accept Invitation',
  ctaUrl: '{{ .ConfirmationURL }}',
  footerText: 'If you weren\'t expecting this invitation, you can safely ignore this email.',
});

// Save templates to files
const outputDir = path.join(__dirname, '..', 'email-templates');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const templates = [
  { name: 'confirmation', content: confirmationEmail, description: 'Email confirmation (signup)' },
  { name: 'magic-link', content: magicLinkEmail, description: 'Magic link sign-in' },
  { name: 'password-reset', content: passwordResetEmail, description: 'Password reset' },
  { name: 'email-change-confirmation', content: emailChangeConfirmation, description: 'Email change confirmation (new email)' },
  { name: 'email-change-notification', content: emailChangeNotification, description: 'Email change notification (old email)' },
  { name: 'invite-user', content: inviteUserEmail, description: 'User invitation' },
];

console.log('📧 Generating Lockstep email templates...\n');

templates.forEach(({ name, content, description }) => {
  const filePath = path.join(outputDir, `${name}.html`);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Generated: ${name}.html (${description})`);
});

// Create a README with instructions
const readme = `# Lockstep Email Templates

These are branded email templates for Supabase Authentication.

## How to Use

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Email Templates**
3. For each template type, copy the corresponding HTML file and paste it into the template editor

## Template Mapping

| Supabase Template | File | Description |
|-------------------|------|-------------|
| **Confirm signup** | \`confirmation.html\` | Sent when user signs up |
| **Magic Link** | \`magic-link.html\` | Sent for passwordless sign-in |
| **Change Email Address** | \`email-change-confirmation.html\` | Sent to new email address |
| **Change Email Address (Old)** | \`email-change-notification.html\` | Sent to old email address |
| **Reset Password** | \`password-reset.html\` | Sent for password reset |

## Important Notes

- The logo is hosted at: \`https://inlockstep.ai/assets/lockstep-logo-light.png\`
- All templates use Supabase's \`{{ .ConfirmationURL }}\` variable for action links
- Templates are mobile-responsive and use Lockstep's brand colors
- The \`{{ .NewEmail }}\` variable is used in the email change notification template

## Customization

To update templates:
1. Edit the HTML files in this directory
2. Run \`node scripts/generate-email-templates.js\` to regenerate
3. Copy the updated HTML into Supabase Dashboard

## Brand Colors Used

- Primary: #5B6CFF (blue-violet)
- Background: #0E1116 (dark charcoal)
- Foreground: #F5F7FA (soft off-white)
- Card: #181B20 (card background)
- Border: #2A2F3A (border color)
- Muted: #64748B (muted text)

---

Generated: ${new Date().toISOString()}
`;

fs.writeFileSync(path.join(outputDir, 'README.md'), readme, 'utf8');

console.log('\n📝 Created README.md with instructions');
console.log(`\n✨ All templates saved to: ${outputDir}`);
console.log('\n💡 Next steps:');
console.log('   1. Review the templates in the email-templates/ directory');
console.log('   2. Copy each HTML file into Supabase Dashboard → Authentication → Email Templates');
console.log('   3. Logo URL used: https://www.inlockstep.ai/assets/lockstep-logo-light-4rS9VEC5.png\n');
