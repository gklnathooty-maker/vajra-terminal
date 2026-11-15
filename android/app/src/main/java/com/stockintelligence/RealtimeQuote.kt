package com.stockintelligence

data class RealtimeQuote(
    val symbol:String,
    val exchange:String,
    val price:Double,
    val changePct:Double,
    val volume:Double,
    val timestamp:String
)
