package com.stockintelligence.data

import retrofit2.http.*

data class DashboardResponse(
    val market_status:String?,
    val indices:List<Map<String,Any>> = emptyList(),
    val top_signals:List<Map<String,Any>> = emptyList()
)

data class TokenRegistration(
    val token:String
)

data class WatchlistItem(
    val symbol:String,
    val addedAt:String?=null
)

data class PortfolioPosition(
    val symbol:String,
    val quantity:Double,
    val averagePrice:Double
)

interface BackendApi {
    @GET("api/v1/mobile/dashboard")
    suspend fun dashboard():Map<String,Any?>

    @GET("api/v1/screener/institutional")
    suspend fun institutionalScreener(
        @Query("master_signal") masterSignal:String?=null,
        @Query("min_momentum") minMomentum:Double?=null,
        @Query("min_rr") minRR:Double?=null,
        @Query("quality_rank") qualityRank:String?=null
    ):Map<String,Any?>

    @POST("api/v1/user/device-token")
    suspend fun registerDeviceToken(@Body body:TokenRegistration):Map<String,Any?>

    @GET("api/v1/user/watchlist")
    suspend fun watchlist():List<WatchlistItem>

    @POST("api/v1/user/watchlist")
    suspend fun addWatchlist(@Body body:WatchlistItem):Map<String,Any?>

    @DELETE("api/v1/user/watchlist/{symbol}")
    suspend fun removeWatchlist(@Path("symbol") symbol:String):Map<String,Any?>

    @GET("api/v1/user/portfolio")
    suspend fun portfolio():List<PortfolioPosition>

    @GET("api/v1/mobile/stock/{symbol}")
    suspend fun stockDetail(
        @Path("symbol") symbol:String,
        @Query("timeframe") timeframe:String="1d",
        @Query("period") period:String="1Y"
    ):Map<String,Any?>
}
