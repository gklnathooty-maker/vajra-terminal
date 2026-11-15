package com.stockintelligence

import kotlinx.coroutines.*
import okhttp3.*
import org.json.JSONObject

class QuoteWebSocket(
    private val client:OkHttpClient = OkHttpClient()
) {
    private var socket:WebSocket?=null

    fun connect(url:String,onQuote:(RealtimeQuote)->Unit) {
        val request=Request.Builder().url(url).build()

        socket=client.newWebSocket(request,object:WebSocketListener() {
            override fun onMessage(webSocket:WebSocket,text:String) {
                try {
                    val j=JSONObject(text)
                    onQuote(
                        RealtimeQuote(
                            symbol=j.getString("symbol"),
                            exchange=j.getString("exchange"),
                            price=j.getDouble("price"),
                            changePct=j.getDouble("change_pct"),
                            volume=j.getDouble("volume"),
                            timestamp=j.getString("timestamp")
                        )
                    )
                } catch (_:Exception) {}
            }
        })
    }

    fun ping() {
        socket?.send("""{"type":"ping"}""")
    }

    fun close() {
        socket?.close(1000,"client-close")
        socket=null
    }
}
