package com.stockintelligence.data

import com.google.firebase.auth.FirebaseAuth
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.tasks.await
import okhttp3.Interceptor
import okhttp3.Response

/**
 * Adds a fresh Firebase ID token to protected API requests.
 * The Firebase Task is awaited on OkHttp's worker thread instead of reading
 * Task.result synchronously.
 */
class AuthInterceptor(
    private val auth: FirebaseAuth = FirebaseAuth.getInstance()
) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        val token = runBlocking {
            auth.currentUser?.getIdToken(false)?.await()?.token
        }

        val secured = request.newBuilder()
        if (!token.isNullOrBlank()) {
            secured.header("Authorization", "Bearer $token")
        }
        return chain.proceed(secured.build())
    }
}
