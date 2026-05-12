# Third-Party Services Transfer Guide

This document outlines all the external services, platforms, and APIs used to run the HomEV platform. It also includes instructions on how to transfer ownership of each service to someone else.

---

## 1. Property Management System (PMS): Uplisting
**Usage**: Synchronizes property details, calendars, and reservations.
**Configuration Keys**: `UPLISTING_API_KEY`, `UPLISTING_WEBHOOK_KEY`, `UPLISTING_CLIENT_ID`

**How to Transfer**:
1. Log in to your [Uplisting Dashboard](https://app.uplisting.io/).
2. Navigate to **Settings > Team / Users**.
3. Invite the new owner's email address and assign them "Admin" privileges.
4. Have the new owner log in and accept the invitation.
5. Once the new owner is an Admin, they can remove your original user account or update the primary billing information under **Settings > Billing**.

---

## 2. Payment Gateway: Stripe
**Usage**: Securely processes credit card payments for reservations.
**Configuration Keys**: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

**How to Transfer**:
1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com/).
2. Go to **Settings (gear icon) > Team and Security > Team**.
3. Click **+ New member** and enter the new owner's email address, assigning them the **Administrator** role.
4. Once the new owner accepts the invitation, they can log in.
5. The new owner should go to **Settings > Account details** to update the public business information, and **Settings > Bank accounts and scheduling** to change the payout bank account.
6. The new owner can then click on your original account under the Team settings and remove your access.

---

## 3. Database: Neon (PostgreSQL)
**Usage**: Stores all platform data, including users, bookings, and sync states.
**Configuration Keys**: `DATABASE_URL`, `DIRECT_URL` (Points to `aws.neon.tech`)

**How to Transfer**:
1. Log in to the [Neon Console](https://console.neon.tech/).
2. Select your project.
3. Go to **Settings > Members**.
4. Invite the new owner's email as an **Owner** or **Admin**.
5. After the new owner joins, they can navigate to **Settings > Billing** to update the payment method.
6. The new owner can remove your access from the **Members** tab.

---

## 4. Maps: Mapbox
**Usage**: Renders the interactive property maps on the frontend.
**Configuration Keys**: `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`

**How to Transfer**:
1. Mapbox does not have a built-in "team" or "transfer ownership" feature for standard accounts. 
2. The easiest way to transfer is to log in to [Mapbox](https://account.mapbox.com/), go to **Account > Settings**, and change the account email address and password to the new owner's credentials.
3. Alternatively, the new owner can create their own Mapbox account, generate a new access token, and replace the `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` in your deployment environment with their new token.

---

## 5. Cloud Storage / Auth: Firebase
**Usage**: Used for storing media/images or handling real-time features. 
**Project ID**: `homevsuites`
**Configuration Keys**: `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, etc.

**How to Transfer**:
1. Log in to the [Firebase Console](https://console.firebase.google.com/).
2. Open the `homevsuites` project.
3. Click the gear icon next to Project Overview and select **Project settings**.
4. Go to the **Users and permissions** tab.
5. Click **Add member**, enter the new owner's email, and assign them the **Owner** role.
6. After they accept, they can remove your email from the project. 

---

## 6. Email Service (SMTP): GoDaddy / Secureserver
**Usage**: Sends automated emails (booking confirmations, etc.) via `support@homevsuites.com`.
**Configuration Keys**: `SMTP_HOST` (`smtpout.secureserver.net`), `SMTP_USER`, `SMTP_PASS`

**How to Transfer**:
1. Log in to your email provider (likely GoDaddy or Microsoft 365 through GoDaddy).
2. Transfer the entire GoDaddy account (which usually holds the domain `homevsuites.com` and the email hosting) by going to **Account Settings > Delegate Access** or simply changing the primary email/password on the GoDaddy account.
3. Provide the new owner with the `SMTP_PASS` so they can update or rotate the password for `support@homevsuites.com`.

---

## 7. Telegram Bot
**Usage**: Sends automated notifications to a designated Telegram group.
**Configuration Keys**: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_GROUP_ID`

**How to Transfer**:
1. Open Telegram and search for `@BotFather`.
2. To transfer ownership of the bot to another Telegram user, send the command `/mybots` to BotFather.
3. Select the bot you are using for the platform.
4. Click on **Transfer Ownership**.
5. Follow the prompts to select the new owner (you will need to choose them from a chat or send their username). Note: You must have 2-Step Verification enabled on your Telegram account for at least 7 days to transfer a bot.
6. For the Group Chat (`TELEGRAM_GROUP_ID`), open the group settings in Telegram, select **Administrators**, and add the new owner as an admin with "Add New Admins" rights. You can then transfer group ownership to them.

---

## 8. Frontend & Backend Hosting (e.g., Vercel, Render, Railway, DigitalOcean)
*Note: Your specific host depends on where the code is deployed (e.g., Vercel for Frontend, Render/Railway/DigitalOcean for Backend).*

**How to Transfer (General Process)**:
1. **Vercel (Frontend)**: Go to your Vercel dashboard, navigate to **Settings > Teams**, invite the new owner, and transfer the project to them. Once transferred, they update the billing.
2. **Backend Host**: Log into the hosting provider dashboard. Most modern providers (like Render or Railway) allow you to invite team members and transfer project ownership, similar to Vercel. 
3. **GitHub/GitLab (Source Code)**: Go to the repository settings > **Collaborators** (or **Manage Access**), add the new owner, and optionally use the **Transfer Ownership** button at the bottom of the repo's Danger Zone settings to move the codebase to their GitHub account.
4. **Domain Registrar**: If your domain (`homevsuites.com`) is hosted on GoDaddy, Namecheap, etc., log in and initiate a Domain Transfer to the new owner's account or change the account credentials.
