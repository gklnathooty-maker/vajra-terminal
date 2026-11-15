plugins {
    id("com.android.application") version "8.9.0" apply false
    id("org.jetbrains.kotlin.android") version "2.1.20" apply false
    id("org.jetbrains.kotlin.plugin.compose") version "2.1.20" apply false
    // Processes app/google-services.json into Firebase config at build time.
    // Required because the app module uses firebase-auth/firestore/messaging.
    id("com.google.gms.google-services") version "4.4.2" apply false
}
