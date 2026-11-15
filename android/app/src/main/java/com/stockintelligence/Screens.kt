package com.stockintelligence

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import androidx.lifecycle.viewmodel.compose.viewModel
import com.stockintelligence.data.ApiFactory
import com.stockintelligence.data.BackendApi
import com.stockintelligence.data.WatchlistItem
import kotlinx.coroutines.launch

/**
 * These six screens are the navigation destinations declared in App.kt
 * (dashboard/screener/watchlist/portfolio/alerts/stock-detail). They were
 * previously missing entirely, so the app could not compile.
 *
 * The backend endpoints they call ("DATA_PIPELINE_REQUIRED" /
 * "DATA_PROVIDER_REQUIRED" statuses, empty result lists) are intentional
 * stubs until a licensed market-data provider is connected server-side —
 * these screens render whatever the backend actually returns, including
 * "no data yet", rather than inventing placeholder prices.
 */

private fun api():BackendApi = ApiFactory.create(AppConfig.API_BASE_URL)

@Composable
fun DashboardScreen(nav:NavController) {
    var status by remember { mutableStateOf("Loading...") }
    var signals by remember { mutableStateOf<List<Map<String,Any?>>>(emptyList()) }
    var error by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        try {
            val res=api().dashboard()
            status=res["market_status"] as? String ?: "UNKNOWN"
            @Suppress("UNCHECKED_CAST")
            signals=(res["top_signals"] as? List<Map<String,Any?>>) ?: emptyList()
        } catch (e:Exception) {
            error=e.message ?: "Failed to load dashboard"
        }
    }

    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Text("Market status: $status", style=MaterialTheme.typography.titleMedium)
        error?.let { Text(it, color=MaterialTheme.colorScheme.error) }

        Spacer(Modifier.height(16.dp))
        Text("Top signals", style=MaterialTheme.typography.titleSmall)

        if (signals.isEmpty()) {
            Spacer(Modifier.height(8.dp))
            Text("No signals yet — connect a licensed market-data provider on the backend.")
        } else {
            LazyColumn {
                items(signals) { s ->
                    val symbol=s["symbol"] as? String ?: return@items
                    ListItem(
                        headlineContent={ Text(symbol) },
                        supportingContent={ Text((s["master_signal"] as? String) ?: "") },
                        modifier=Modifier.clickable { nav.navigate("stock/$symbol") }
                    )
                    HorizontalDivider()
                }
            }
        }
    }
}

@Composable
fun ScreenerScreen(nav:NavController) {
    var results by remember { mutableStateOf<List<Map<String,Any?>>>(emptyList()) }
    var status by remember { mutableStateOf<String?>(null) }
    var error by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        try {
            val res=api().institutionalScreener()
            status=res["status"] as? String
            @Suppress("UNCHECKED_CAST")
            results=(res["results"] as? List<Map<String,Any?>>) ?: emptyList()
        } catch (e:Exception) {
            error=e.message ?: "Failed to load screener"
        }
    }

    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Text("Institutional screener", style=MaterialTheme.typography.titleMedium)
        error?.let { Text(it, color=MaterialTheme.colorScheme.error) }
        status?.let { Text(it, style=MaterialTheme.typography.bodySmall) }

        if (results.isEmpty()) {
            Spacer(Modifier.height(8.dp))
            Text("No matches yet — the screener needs a live data pipeline connected on the backend.")
        } else {
            LazyColumn {
                items(results) { r ->
                    val symbol=r["symbol"] as? String ?: return@items
                    ListItem(
                        headlineContent={ Text(symbol) },
                        modifier=Modifier.clickable { nav.navigate("stock/$symbol") }
                    )
                    HorizontalDivider()
                }
            }
        }
    }
}

@Composable
fun WatchlistScreen() {
    val scope=rememberCoroutineScope()
    var items by remember { mutableStateOf<List<WatchlistItem>>(emptyList()) }
    var newSymbol by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }

    suspend fun refresh() {
        try {
            items=api().watchlist()
        } catch (e:Exception) {
            error=e.message ?: "Failed to load watchlist"
        }
    }

    LaunchedEffect(Unit) { refresh() }

    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Text("Watchlist", style=MaterialTheme.typography.titleMedium)
        error?.let { Text(it, color=MaterialTheme.colorScheme.error) }

        Row(Modifier.fillMaxWidth().padding(vertical=8.dp), verticalAlignment=Alignment.CenterVertically) {
            OutlinedTextField(
                value=newSymbol,
                onValueChange={ newSymbol=it },
                label={ Text("Symbol, e.g. RELIANCE.NS") },
                modifier=Modifier.weight(1f)
            )
            Spacer(Modifier.width(8.dp))
            Button(onClick={
                val symbol=newSymbol.trim()
                if (symbol.isNotEmpty()) {
                    scope.launch {
                        try {
                            api().addWatchlist(WatchlistItem(symbol))
                            newSymbol=""
                            refresh()
                        } catch (e:Exception) {
                            error=e.message ?: "Failed to add"
                        }
                    }
                }
            }) { Text("Add") }
        }

        LazyColumn {
            items(items) { item ->
                ListItem(
                    headlineContent={ Text(item.symbol) },
                    trailingContent={
                        TextButton(onClick={
                            scope.launch {
                                try {
                                    api().removeWatchlist(item.symbol)
                                    refresh()
                                } catch (e:Exception) {
                                    error=e.message ?: "Failed to remove"
                                }
                            }
                        }) { Text("Remove") }
                    }
                )
                HorizontalDivider()
            }
        }
    }
}

@Composable
fun PortfolioScreen() {
    var positions by remember { mutableStateOf<List<com.stockintelligence.data.PortfolioPosition>>(emptyList()) }
    var error by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        try {
            positions=api().portfolio()
        } catch (e:Exception) {
            error=e.message ?: "Failed to load portfolio"
        }
    }

    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Text("Portfolio", style=MaterialTheme.typography.titleMedium)
        error?.let { Text(it, color=MaterialTheme.colorScheme.error) }

        if (positions.isEmpty()) {
            Spacer(Modifier.height(8.dp))
            Text("No positions yet.")
        } else {
            LazyColumn {
                items(positions) { p ->
                    ListItem(
                        headlineContent={ Text(p.symbol) },
                        supportingContent={ Text("Qty ${p.quantity} @ ${p.averagePrice}") }
                    )
                    HorizontalDivider()
                }
            }
        }
    }
}

@Composable
fun AlertsScreen() {
    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Text("Alerts", style=MaterialTheme.typography.titleMedium)
        Spacer(Modifier.height(8.dp))
        Text(
            "Alert rules run on the backend (app/alerts) but aren't exposed " +
            "through a mobile API endpoint yet. Push notifications for " +
            "triggered alerts will appear here once that route is added."
        )
    }
}

@Composable
fun StockDetailScreen(symbol:String) {
    val viewModel:RealtimeStockViewModel=viewModel()
    val liveQuote by viewModel.quote.collectAsState()

    var summary by remember { mutableStateOf<Map<String,Any?>?>(null) }
    var error by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(symbol) {
        try {
            summary=api().stockDetail(symbol)
        } catch (e:Exception) {
            error=e.message ?: "Failed to load $symbol"
        }
    }

    DisposableEffect(symbol) {
        viewModel.start(AppConfig.WS_BASE_URL, symbol)
        onDispose { viewModel.stop() }
    }

    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Text(symbol, style=MaterialTheme.typography.headlineSmall)
        error?.let { Text(it, color=MaterialTheme.colorScheme.error) }

        Spacer(Modifier.height(8.dp))
        liveQuote?.let { q ->
            Text("Live: ${q.price} (${q.changePct}%)", style=MaterialTheme.typography.titleMedium)
        } ?: Text("Waiting for live quote...")

        Spacer(Modifier.height(16.dp))
        Box(Modifier.fillMaxWidth().height(240.dp)) {
            CandleChart(candles=emptyList(), modifier=Modifier.fillMaxSize())
        }

        if (summary?.get("candles").let { (it as? List<*>)?.isEmpty() != false }) {
            Spacer(Modifier.height(8.dp))
            Text("No historical candles yet — requires a connected data provider on the backend.")
        }
    }
}
