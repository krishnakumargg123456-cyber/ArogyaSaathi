# Proguard rules for ArogyaSaathi Android
-keepattributes *Annotation*
-keepclassmembers class * {
    @org.webkit.JavascriptInterface <methods>;
}
-keep class com.capacitorjs.** { *; }
-dontwarn com.capacitorjs.**

