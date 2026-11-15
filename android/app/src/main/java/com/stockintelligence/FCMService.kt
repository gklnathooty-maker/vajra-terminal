package com.stockintelligence

import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class FCMService:FirebaseMessagingService() {
    override fun onNewToken(token:String) {
        // Send token to authenticated backend.
        // Never use the token as authorization.
    }

    override fun onMessageReceived(message:RemoteMessage) {
        // Convert backend data payload into an Android notification.
    }
}
