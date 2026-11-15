package com.stockintelligence

data class StockSummary(
    val symbol:String,
    val price:Double?,
    val changePct:Double?,
    val masterSignal:String?,
    val technicalScore:Double?,
    val momentumScore:Double?,
    val riskReward:Double?,
    val qualityRank:String?
)

enum class Timeframe(val value:String) {
    FIVE_MIN("5m"),
    FIFTEEN_MIN("15m"),
    ONE_HOUR("1h"),
    ONE_DAY("1d"),
    ONE_WEEK("1w"),
    ONE_MONTH("1mo")
}

enum class DisplayPeriod(val value:String) {
    SIX_MONTHS("6M"),
    ONE_YEAR("1Y"),
    TWO_YEARS("2Y"),
    THREE_YEARS("3Y"),
    FIVE_YEARS("5Y")
}
