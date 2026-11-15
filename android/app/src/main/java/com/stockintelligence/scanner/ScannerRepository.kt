package com.stockintelligence.scanner

class ScannerRepository {
    val timeframes = listOf("5m","15m","1H","1D","1W","1M")
    val fields = listOf(
        "Close","Volume","EMA20","EMA50","EMA200","RSI14",
        "MACD","ADX14","VWAP","Volume Ratio","R:R",
        "Momentum","Technical Score","Quality Rank"
    )
    val operators = listOf(">=",">","<=","<","==","!=")
}
