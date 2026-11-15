package com.stockintelligence.scanner

data class ScannerResult(
    val rank: Int,
    val symbol: String,
    val scannerScore: Double,
    val combinedScore: Double,
    val signal: String,
    val qualityRank: String,
    val momentum: Double,
    val riskReward: Double,
    val mtfAlignment: String,
    val matched: Int,
    val total: Int,
    val reasons: List<String>
)
