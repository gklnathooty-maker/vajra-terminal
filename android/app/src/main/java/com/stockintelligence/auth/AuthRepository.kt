package com.stockintelligence.auth

import com.google.firebase.auth.FirebaseAuth
import kotlinx.coroutines.tasks.await

class AuthRepository(
    private val auth: FirebaseAuth = FirebaseAuth.getInstance()
) {
    fun currentUser() = auth.currentUser

    suspend fun signIn(email:String,password:String) {
        auth.signInWithEmailAndPassword(email,password).await()
    }

    suspend fun register(email:String,password:String) {
        auth.createUserWithEmailAndPassword(email,password).await()
    }

    fun signOut() {
        auth.signOut()
    }

    suspend fun idToken():String? {
        return auth.currentUser?.getIdToken(false)?.await()?.token
    }
}
