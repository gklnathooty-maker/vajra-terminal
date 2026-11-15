package com.stockintelligence.auth

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch

@Composable
fun LoginScreen(onAuthenticated:()->Unit) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    val scope=rememberCoroutineScope()
    val auth=remember { AuthRepository() }

    Column(
        Modifier.fillMaxSize().padding(24.dp),
        verticalArrangement=Arrangement.Center
    ) {
        Text("Stock Intelligence",style=MaterialTheme.typography.headlineMedium)
        Text("Professional Market Analysis")

        Spacer(Modifier.height(24.dp))

        OutlinedTextField(
            value=email,
            onValueChange={email=it},
            label={Text("Email")},
            modifier=Modifier.fillMaxWidth()
        )

        Spacer(Modifier.height(8.dp))

        OutlinedTextField(
            value=password,
            onValueChange={password=it},
            label={Text("Password")},
            visualTransformation=PasswordVisualTransformation(),
            modifier=Modifier.fillMaxWidth()
        )

        error?.let {
            Spacer(Modifier.height(8.dp))
            Text(it,color=MaterialTheme.colorScheme.error)
        }

        Spacer(Modifier.height(16.dp))

        Button(
            modifier=Modifier.fillMaxWidth(),
            onClick={
                scope.launch {
                    try {
                        auth.signIn(email,password)
                        onAuthenticated()
                    } catch(e:Exception) {
                        error=e.message ?: "Sign-in failed"
                    }
                }
            }
        ) {
            Text("Sign In")
        }

        Spacer(Modifier.height(8.dp))

        OutlinedButton(
            modifier=Modifier.fillMaxWidth(),
            onClick={
                scope.launch {
                    try {
                        auth.register(email,password)
                        onAuthenticated()
                    } catch(e:Exception) {
                        error=e.message ?: "Registration failed"
                    }
                }
            }
        ) {
            Text("Create Account")
        }
    }
}
