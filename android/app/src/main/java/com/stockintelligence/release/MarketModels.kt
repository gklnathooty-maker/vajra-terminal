package com.stockintelligence.release

data class MarketQuote(
    val exchange: String,
    val symbol: String,
    val price: Double,
    val timestamp: String,
    val stale: Boolean
)

data class ScreenerMatch(
    val symbol: String,
    val score: Double,
    val signal: String,
    val quality: String
)
