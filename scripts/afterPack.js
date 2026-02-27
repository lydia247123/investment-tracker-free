// afterPack hook to fix macOS app signing
exports.default = async function (context) {
  if (context.electronPlatformName === 'darwin') {
    const fs = require('fs');
    const path = require('path');
    const { execSync } = require('child_process');

    // Find the .app bundle
    const appPath = path.join(context.appOutDir, 'Investment Tracker Free.app');

    if (!fs.existsSync(appPath)) {
      console.log('App bundle not found, skipping afterPack hook');
      return;
    }

    console.log(`Fixing ${appPath} for macOS Gatekeeper...`);

    // Remove quarantine attributes
    try {
      execSync(`xattr -cr "${appPath}"`, { stdio: 'inherit' });
    } catch (e) {
      console.log('Could not remove xattr:', e.message);
    }

    // Remove and re-sign to avoid Gatekeeper issues
    try {
      execSync(`codesign --remove-signature "${appPath}"`, { stdio: 'inherit' });
      execSync(`codesign --force --deep --sign - "${appPath}"`, { stdio: 'inherit' });
      console.log('App signing fixed successfully');
    } catch (e) {
      console.log('Could not re-sign app:', e.message);
    }
  }
};
