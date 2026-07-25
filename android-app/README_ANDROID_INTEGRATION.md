# 📱 Android APK & Web Unified Link Guide

Your Librika platform backend is now fully equipped to link **Web Browsers** and **Android Apps (.apk)** to the same user accounts, share real-time data, and broadcast simultaneous push notifications.

---

## 🔑 1. How Mobile Authentication Works

1. **Login Request**:
   Send a `POST` request from the Android App:
   - **URL**: `https://your-domain.com/api/v1/auth/login`
   - **Body**:
     ```json
     {
       "login": "9876543210",
       "password": "user_password",
       "device_type": "android",
       "fcm_token": "ANDROID_FCM_DEVICE_TOKEN_HERE"
     }
     ```
2. **Response**:
   Returns a `token` (JWT) and `user` object:
   ```json
   {
     "success": true,
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "user": {
       "id": 42,
       "name": "John Student",
       "role": "student",
       "school_code": "SCH001"
     }
   }
   ```
3. **Authenticated API Calls**:
   Pass the JWT token in all future HTTP headers:
   ```http
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

---

## 🔔 2. Device Token Registration Endpoint

If the FCM token refreshes on the Android device, update the backend by sending:
- **URL**: `POST /api/v1/devices/register`
- **Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Body**:
  ```json
  {
    "fcm_token": "NEW_ANDROID_FCM_TOKEN",
    "device_type": "android"
  }
  ```

---

## 📲 3. Building the Android (.apk) File

### Option A: Using Capacitor (Recommended)
1. Install Capacitor dependencies:
   ```bash
   npm install @capacitor/core @capacitor/android @capacitor/push-notifications
   ```
2. Add the Android platform:
   ```bash
   npx cap add android
   ```
3. Copy your `google-services.json` file into `android/app/google-services.json`.
4. Build the `.apk` in Android Studio or command line:
   ```bash
   npx cap open android
   # In Android Studio: Build > Build Bundle(s) / APK(s) > Build APK(s)
   ```

---

## 🧪 4. Testing Simultaneous Push Notifications

1. Log in on both Web App and Android App with the same credentials.
2. Send a test notification from the backend API:
   - **Endpoint**: `POST /api/v1/notifications/send-test`
   - **Headers**: `Authorization: Bearer <JWT_TOKEN>`
3. **Result**: Both the browser desktop notification and Android phone push notification will trigger simultaneously!
