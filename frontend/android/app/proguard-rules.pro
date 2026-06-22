# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# ── Capacitor / WebView Bridge ──────────────────────────────────────────────
# Keep all Capacitor plugin classes and their public members so the WebView
# bridge does not lose its native hooks after minification.
-keep class com.getcapacitor.** { *; }
-keep class com.getcapacitor.plugin.** { *; }
-keepnames class com.getcapacitor.** { *; }

# Keep JavaScript interface methods called from the WebView
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# ── Google Sign-In ────────────────────────────────────────────────────────
-keep class com.google.android.gms.** { *; }
-keep class com.google.api.client.** { *; }
-dontwarn com.google.android.gms.**

# ── OkHttp (used by Capacitor for networking) ─────────────────────────────
-dontwarn okhttp3.**
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }

# ── Preserve stack traces in crash reports ────────────────────────────────
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
