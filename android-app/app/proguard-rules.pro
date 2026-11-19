# Smart Calculator ProGuard / R8 Rules
-keep class com.smarttools.smartcalculator.engine.** { *; }
-keepattributes SourceFile,LineNumberTable

# Google Mobile Ads & UMP Consent
-keep class com.google.android.gms.ads.** { *; }
-keep class com.google.android.ump.** { *; }

# Strip verbose debug logs in release APK
-assumenosideeffects class android.util.Log {
    public static boolean isLoggable(java.lang.String, int);
    public static int v(...);
    public static int d(...);
    public static int i(...);
}
