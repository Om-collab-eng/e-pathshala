# JaaS (Jitsi as a Service on 8x8.vc) Setup Guide for Librika

This guide provides step-by-step instructions for configuring **production-ready JaaS (8x8.vc)** on the Librika platform.

---

## 1. Create a JaaS Developer Account
1. Go to **[https://jaas.8x8.vc](https://jaas.8x8.vc)** and sign up for a free or paid developer account.
2. Complete your email verification and log in to the **JaaS Developer Console**.

---

## 2. Obtain Your JaaS App ID
1. In the JaaS Console dashboard, locate your unique **App ID** (also called Tenant / `vpaas-magic-cookie-...`).
2. Example format: `vpaas-magic-cookie-9a1b2c3d4e5f`
3. Copy this value for `JAAS_APP_ID`.

---

## 3. Create an API Key & Generate RSA Key Pair
1. In the JaaS Developer Console, navigate to **API Keys** in the sidebar.
2. Click **Add API Key** (or **Generate New Key**).
3. The console will generate:
   - **Key ID (`kid`)**: Formatted as `vpaas-magic-cookie-xxxx/xxxxxx`.
   - **RSA Private Key (`.pk` / `.pem`)**: Download the private key file or copy its contents.
4. **CRITICAL SECURITY**: Store this private key securely. **Never commit it to Git or expose it to client-side bundles.**

---

## 4. Configure Server Environment Variables
Open or create your `.env` file on the server (or hosting control panel environment settings) and add:

```env
# JaaS on 8x8.vc
JAAS_APP_ID=vpaas-magic-cookie-9a1b2c3d4e5f
JAAS_API_KEY_ID=vpaas-magic-cookie-9a1b2c3d4e5f/a1b2c3
JAAS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC6...\n-----END PRIVATE KEY-----"
JAAS_DOMAIN=8x8.vc
```

> **Tip for Private Key formatting:**
> - If adding directly inside `.env` as a single string, replace line breaks with `\n` and enclose in double quotes `"..."`.
> - Alternatively, save the file to a secure directory on your server (e.g. `./keys/jaas_private.pk`) and set `JAAS_PRIVATE_KEY=./keys/jaas_private.pk`.

---

## 5. Architecture & Security Flow

```
[Student / Teacher Client]
           │
           ▼
    Clicks "Join Class"
           │
           ▼
  POST /api/studio/sessions/:id/join
           │
           ▼
  jaasService.js (Server-Side)
  1. Authenticates Librika user
  2. Verifies student/teacher role & class access
  3. Assigns moderator=true (Host/Teacher/Librarian) or moderator=false (Student)
  4. Generates short-lived (30-min) RS256 JWT using server private key
  5. Records attendance entry
           │
           ▼
  Returns { jwt, fullRoomName, domain: '8x8.vc', isModerator }
           │
           ▼
  Client loads JaaS External API SDK from https://8x8.vc/external_api.js
  Starts attendance heartbeat every 30s
```

---

## 6. Testing the Integration

### Test A: Schedule a Live Class (Teacher / Librarian)
1. Log in as an Administrator, Librarian, or Teacher at `https://librika.in/admin?module=studio`.
2. Click **+ Schedule Live Class**.
3. Fill in Title (e.g. `Physics: Quantum Mechanics`), Class (e.g. `Class 10`), Start Time, and Duration.
4. Click **Schedule Class**.
5. The session is created with a secure namespaced room `librika-<id>-<randomHex>` in status `SCHEDULED`.

### Test B: Launch / Start Class as Host
1. On the session card, click **🚀 Start Class** or **Launch Room**.
2. Status transitions to `LIVE`.
3. The interactive classroom opens at `/studio/meeting/:id`.
4. Host is granted **👑 Host / Moderator** badge and full moderation tools.

### Test C: Join Class as Student
1. Log in as a Student at `https://librika.in/student?module=studio`.
2. The active broadcast displays a glowing red **🔴 LIVE BROADCAST** badge.
3. Click **🔴 JOIN LIVE CLASS NOW**.
4. The student joins with non-moderator privileges (audio/video controlled, secure room).
5. Attendance join and 30-second heartbeats are automatically logged in `studio_attendance`.

### Test D: End Class & Attendance Summary
1. The host clicks **Leave Room** or concludes the session.
2. Status transitions to `COMPLETED`.
3. Total duration seconds for each attendee are calculated in the database.

---

## 7. Troubleshooting & Error Reference

| Issue / Error | Cause | Resolution |
| :--- | :--- | :--- |
| **"JaaS Setup Required" card displays** | `JAAS_APP_ID` or `JAAS_PRIVATE_KEY` missing from `.env` | Add the 4 environment variables to `.env` and restart the Node server. |
| **"Token signing error"** | Malformed RSA Private Key format | Ensure the key has `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` or provide a valid key file path. |
| **"You are not authorized to join this live class"** | Student belongs to a different school or class | Check `session.class_name` and student user profile. |
| **403 when creating class** | Non-teacher/non-admin user attempted creation | Only Librarians, Teachers, and Admins can create classes. |
