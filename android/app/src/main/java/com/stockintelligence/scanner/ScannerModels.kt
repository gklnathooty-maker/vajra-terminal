package com.stockintelligence.scanner

data class ScannerCondition(
    val timeframe: String,
    val field: String,
    val operator: String,
    val value: String,
    val offset: Int = 0
)

data class ScannerGroup(
    val mode: String = "ALL",
    val conditions: List<ScannerCondition> = emptyList()
)

data class ScannerPreset(
    val id: String,
    val name: String
)
