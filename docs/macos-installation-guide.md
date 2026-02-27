# macOS Installation Guide - Investment Tracker Free

## 🚨 "App is damaged" Error

If you see the error **"Investment Tracker Free is damaged and can't be opened"**, this is due to macOS security settings. Follow these steps to fix it:

---

## ✅ Solution 1: Allow in System Settings (Most Reliable)

### Step 1: Allow the App
1. Click **"Cancel"** on the error dialog
2. Open **System Settings** (or System Preferences)
3. Go to **Privacy & Security** (or Security & Privacy)
4. Look for a message saying **"Investment Tracker Free was blocked"**
5. Click **"Open Anyway"** or **"Allow Anyway"**

### Step 2: Open the App
1. Double-click `Investment Tracker Free.app` again
2. Click **"Open"** in the confirmation dialog

---

## ✅ Solution 2: Allow on First Launch

1. **Right-click** (or Ctrl+Click) on `Investment Tracker Free.app`
2. Select **"Open"** from the menu
3. Click **"Open"** in the security dialog
4. The app should now launch successfully

---

## ✅ Solution 3: Remove Quarantine Flag

If the above methods don't work:

1. Open **Terminal** (Applications > Utilities > Terminal)
2. Run this command:
```bash
xattr -cr ~/Downloads/Investment\ Tracker\ Free.app
```
3. Double-click the app to launch

---

## 📦 Full Installation Steps

### From ZIP File (Recommended)

1. Download `Investment Tracker Free-1.0.0-arm64-mac.zip`
2. Double-click to extract the ZIP
3. Follow **Solution 1** or **Solution 2** above to launch
4. Optionally, drag the app to your Applications folder

### From DMG File

1. Download `Investment Tracker Free-1.0.0-arm64.dmg`
2. Right-click the DMG and select **"Open"**
3. Click **"Open"** in the dialog
4. Drag the app to Applications folder
5. Follow **Solution 1** or **Solution 2** to launch

---

## 🔄 Make It Permanent

To avoid security warnings on every launch:

```bash
# Copy to Applications
cp -R ~/Downloads/Investment\ Tracker\ Free.app /Applications/

# Allow in System Settings (see Solution 1)
```

Once allowed, the app will launch normally from Applications.

---

## 🔒 Why This Happens

This error occurs because:
- **The app is not signed** with an Apple Developer certificate ($99/year)
- **macOS Gatekeeper** blocks unsigned apps for security
- This is **normal** for free/open-source software
- You only need to allow it **once**, then it works normally

---

## ✅ After Installation

Once installed, the app should:
- ✓ Open without errors
- ✓ Show the investment tracker dashboard
- ✓ Allow you to add and track investments
- ✓ Save your data locally on your Mac

---

## 🆘 Still Having Issues?

**Try these steps in order:**

1. **Make sure you downloaded from the official repository**: https://github.com/lydia247123/investment-tracker-free
2. **Check macOS version**: Requires macOS 10.14 (Mojave) or later
3. **Redownload the file**: It might have been corrupted during download
4. **Try a different format**: Use ZIP instead of DMG or vice versa
5. **Contact support**: lydia247@163.com

---

## 💻 Advanced Users

If you're comfortable with Terminal, you can use this one-liner:

```bash
# Download, extract, and launch in one go
cd ~/Downloads && \
unzip -q Investment\ Tracker\ Free-1.0.0-arm64-mac.zip && \
xattr -cr Investment\ Tracker\ Free.app && \
open Investment\ Tracker\ Free.app
```

---

## 📝 Developer Note

To fully fix this issue (no security warnings), the app would need:
- Apple Developer Program membership ($99/year)
- Code signing certificate
- App notarization by Apple

Since this is a free open-source project, we rely on user-side workarounds. We apologize for the inconvenience!

