# Lockstep Email Templates

These are branded email templates for Supabase Authentication.

## How to Use

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Email Templates**
3. For each template type, copy the corresponding HTML file and paste it into the template editor

## Template Mapping

| Supabase Template | File | Description |
|-------------------|------|-------------|
| **Confirm signup** | `confirmation.html` | Sent when user signs up |
| **Magic Link** | `magic-link.html` | Sent for passwordless sign-in |
| **Change Email Address** | `email-change-confirmation.html` | Sent to new email address |
| **Change Email Address (Old)** | `email-change-notification.html` | Sent to old email address |
| **Reset Password** | `password-reset.html` | Sent for password reset |

## Important Notes

- **Logo URL**: The templates reference the logo at `https://www.inlockstep.ai/assets/lockstep-logo-light-4rS9VEC5.png`
  - This is a versioned filename from Vite's build process
  - If the filename changes after a rebuild, update the logo URL in all templates or regenerate them
- All templates use Supabase's `{{ .ConfirmationURL }}` variable for action links
- Templates are mobile-responsive and use Lockstep's brand colors
- The `{{ .NewEmail }}` variable is used in the email change notification template

## Customization

To update templates:
1. Edit the HTML files in this directory
2. Run `node scripts/generate-email-templates.js` to regenerate
3. Copy the updated HTML into Supabase Dashboard

## Brand Colors Used

- Primary: #5B6CFF (blue-violet)
- Background: #0E1116 (dark charcoal)
- Foreground: #F5F7FA (soft off-white)
- Card: #181B20 (card background)
- Border: #2A2F3A (border color)
- Muted: #64748B (muted text)

---

Generated: 2026-01-12T22:35:11.315Z
