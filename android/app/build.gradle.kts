plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
    // Reads app/google-services.json (your Firebase project config) and
    // wires it into the build. Without this, FirebaseAuth.getInstance()
    // and friends crash at runtime with "Default FirebaseApp is not initialized".
    id("com.google.gms.google-services")
}

android {
    namespace="com.stockintelligence"
    compileSdk=35

    defaultConfig {
        applicationId="com.stockintelligence"
        minSdk=26
        targetSdk=35
        versionCode=16
        versionName="1.0.0-phase16"
    }

    buildFeatures { compose=true }

    kotlinOptions { jvmTarget="17" }
}

dependencies {
    implementation(platform("androidx.compose:compose-bom:2025.03.00"))
    implementation("androidx.activity:activity-compose:1.10.1")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.foundation:foundation")
    implementation("androidx.navigation:navigation-compose:2.9.0")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.9.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-play-services:1.10.2")
    implementation("androidx.security:security-crypto:1.1.0-alpha06")

    implementation(platform("com.google.firebase:firebase-bom:34.19.0"))
    implementation("com.google.firebase:firebase-auth")
    implementation("com.google.firebase:firebase-firestore")
    implementation("com.google.firebase:firebase-messaging")

    implementation("com.squareup.retrofit2:retrofit:2.11.0")
    implementation("com.squareup.retrofit2:converter-moshi:2.11.0")
}
