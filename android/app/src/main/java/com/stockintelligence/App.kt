package com.stockintelligence

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.compose.*
import com.stockintelligence.auth.LoginScreen
import com.google.firebase.auth.FirebaseAuth

@Composable
fun StockIntelligenceApp() {
    val nav=rememberNavController()
    var authenticated by remember {
        mutableStateOf(FirebaseAuth.getInstance().currentUser != null)
    }

    if(!authenticated) {
        LoginScreen { authenticated=true }
        return
    }

    Scaffold(
        bottomBar={
            NavigationBar {
                listOf(
                    "Dashboard" to "dashboard",
                    "Screener" to "screener",
                    "Watchlist" to "watchlist",
                    "Portfolio" to "portfolio",
                    "Alerts" to "alerts"
                ).forEach { (label,route) ->
                    NavigationBarItem(
                        selected=false,
                        onClick={nav.navigate(route)},
                        icon={},
                        label={Text(label)}
                    )
                }
            }
        }
    ) { padding ->
        NavHost(
            navController=nav,
            startDestination="dashboard",
            modifier=Modifier.padding(padding)
        ) {
            composable("dashboard"){ DashboardScreen(nav) }
            composable("screener"){ ScreenerScreen(nav) }
            composable("watchlist"){ WatchlistScreen() }
            composable("portfolio"){ PortfolioScreen() }
            composable("alerts"){ AlertsScreen() }
            composable("stock/{symbol}") { b ->
                StockDetailScreen(b.arguments?.getString("symbol") ?: "")
            }
        }
    }
}
