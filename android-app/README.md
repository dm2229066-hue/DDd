# Smart Calculator — Android (Kotlin + Jetpack Compose)

- **Application ID:** `com.smarttools.smartcalculator`
- **Version:** `1.0.0` (`versionCode = 1`)
- **Min / Target SDK:** `24` / `35`
- **Architecture:** Single-Activity Jetpack Compose + Material 3 + DataStore Preferences + Google AdMob & UMP Consent SDK

## Build & Sign Release APK

### Option A: One-Command CLI Build (Linux / macOS)
```bash
chmod +x build-release-apk.sh
./build-release-apk.sh
```
This script generates an RSA-2048 release keystore (`release-keystore.jks`), configures `keystore.properties`, runs all JUnit tests (`testReleaseUnitTest`), and builds an R8-shrunk, resource-shrunk, signed release APK at:
`app/build/outputs/apk/release/app-universal-release.apk`

### Option B: Manual Gradle Commands
1. Generate a signing keystore:
   ```bash
   keytool -genkeypair -v -keystore release-keystore.jks -alias smartcalculator \
     -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Copy `keystore.properties.example` to `keystore.properties` and enter your keystore credentials.
3. Run tests and assemble the release APK:
   ```bash
   ./gradlew testReleaseUnitTest assembleRelease
   ```
4. Install on an Android device or emulator via ADB:
   ```bash
   adb install -r app/build/outputs/apk/release/app-universal-release.apk
   ```

### Option C: Android Studio
1. Open the `android-app` folder in Android Studio Ladybug (or newer).
2. Let Gradle sync complete.
3. Go to **Build → Generate Signed App Bundle / APK → APK**, select `release-keystore.jks`, and choose the `release` build variant.
