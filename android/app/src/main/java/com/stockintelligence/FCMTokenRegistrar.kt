package com.stockintelligence

import com.google.firebase.messaging.FirebaseMessaging
import com.stockintelligence.data.ApiFactory
import kotlinx.coroutines.*

class FCMTokenRegistrar(
    private val baseUrl:String
) {
    fun register() {
        FirebaseMessaging.getInstance().token.addOnSuccessListener { token ->
            CoroutineScope(Dispatchers.IO).launch {
                try {
                    ApiFactory.create(baseUrl)
                        .registerDeviceToken(
                            com.stockintelligence.data.TokenRegistration(token)
                        )
                } catch (_:Exception) {}
            }
        }
    }
}
