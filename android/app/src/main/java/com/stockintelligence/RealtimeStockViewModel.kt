package com.stockintelligence

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.stockintelligence.auth.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import java.net.URLEncoder

class RealtimeStockViewModel(
    private val authRepository: AuthRepository = AuthRepository()
):ViewModel() {
    private val _quote=MutableStateFlow<RealtimeQuote?>(null)
    val quote:StateFlow<RealtimeQuote?> = _quote

    private var ws:QuoteWebSocket?=null

    fun start(baseUrl:String,symbol:String) {
        ws?.close()
        ws=QuoteWebSocket()

        // The backend now requires a Firebase ID token on the websocket
        // handshake (/ws/quotes/{symbol}?token=...), so the token has to be
        // fetched first — hence the coroutine instead of a direct connect().
        // Built as a plain string (not okhttp3.HttpUrl) because HttpUrl only
        // parses http(s) schemes and baseUrl here is wss://.
        viewModelScope.launch {
            val token = authRepository.idToken()
            val url = "$baseUrl/ws/quotes/${symbol.uppercase()}"
            val authedUrl = if (!token.isNullOrBlank()) {
                "$url?token=${URLEncoder.encode(token, "UTF-8")}"
            } else {
                url
            }

            ws?.connect(
                authedUrl,
                onQuote={ _quote.value=it }
            )
        }
    }

    fun stop() {
        ws?.close()
        ws=null
    }

    override fun onCleared() {
        stop()
        super.onCleared()
    }
}
