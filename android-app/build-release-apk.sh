#!/usr/bin/env bash
set -euo pipefail

echo "=================================================="
echo " Smart Calculator — Release APK Build & Signer"
echo "=================================================="

KEYSTORE="release-keystore.jks"
PROPS="keystore.properties"

if [ ! -f "$KEYSTORE" ]; then
  echo "[1/4] Generating release RSA-2048 keystore ($KEYSTORE)..."
  keytool -genkeypair -v \
    -keystore "$KEYSTORE" \
    -alias smartcalculator \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -storepass SmartCalc2026! \
    -keypass SmartCalc2026! \
    -dname "CN=Smart Tools Studio, OU=Mobile Engineering, O=SmartTools, L=San Francisco, ST=CA, C=US"
fi

if [ ! -f "$PROPS" ]; then
  echo "[2/4] Writing $PROPS..."
  cat > "$PROPS" <<EOF
storeFile=../$KEYSTORE
storePassword=SmartCalc2026!
keyAlias=smartcalculator
keyPassword=SmartCalc2026!
EOF
fi

echo "[3/4] Running unit tests and building optimized release APK..."
./gradlew testReleaseUnitTest assembleRelease

APK_PATH="app/build/outputs/apk/release/app-universal-release.apk"
echo "[4/4] Release APK ready at: $APK_PATH"
ls -lh app/build/outputs/apk/release/*.apk
echo "Install on connected device via: adb install -r $APK_PATH"
