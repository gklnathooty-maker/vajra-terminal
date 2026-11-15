package com.stockintelligence.scanner

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun ScannerBuilderScreen() {
    var timeframe by remember { mutableStateOf("1D") }
    var field by remember { mutableStateOf("RSI14") }
    var operator by remember { mutableStateOf(">=") }
    var value by remember { mutableStateOf("55") }

    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Text("Professional Scanner", style=MaterialTheme.typography.headlineSmall)
        Spacer(Modifier.height(12.dp))
        Text("Build Chartink-style technical conditions using your own data engine.")
        Spacer(Modifier.height(16.dp))
        Text("Timeframe: $timeframe")
        Text("Field: $field")
        Text("Operator: $operator")
        Text("Value: $value")
        Spacer(Modifier.height(16.dp))
        Button(onClick={}) { Text("ADD CONDITION") }
        Spacer(Modifier.height(8.dp))
        Button(onClick={}) { Text("RUN SCAN") }
    }
}
