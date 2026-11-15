package com.stockintelligence.scanner

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun ScannerResultsScreen(results: List<ScannerResult> = emptyList()) {
    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Text("Scanner Results", style=MaterialTheme.typography.headlineSmall)
        Spacer(Modifier.height(12.dp))

        LazyColumn(verticalArrangement=Arrangement.spacedBy(8.dp)) {
            items(results) { item ->
                Card(Modifier.fillMaxWidth()) {
                    Column(Modifier.padding(12.dp)) {
                        Text("${item.rank}. ${item.symbol}", style=MaterialTheme.typography.titleMedium)
                        Text("${item.signal} • ${item.qualityRank}")
                        Text("Combined Score: ${item.combinedScore}")
                        Text("Momentum: ${item.momentum}   R:R: ${item.riskReward}")
                        Text("MTF: ${item.mtfAlignment}")
                        Text("Matched: ${item.matched}/${item.total}")
                    }
                }
            }
        }
    }
}
