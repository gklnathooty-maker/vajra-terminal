package com.stockintelligence

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color

data class Candle(
    val open:Float,
    val high:Float,
    val low:Float,
    val close:Float
)

@Composable
fun CandleChart(
    candles:List<Candle>,
    modifier:Modifier=Modifier
) {
    Canvas(modifier.fillMaxSize()) {
        if(candles.isEmpty()) return@Canvas

        val hi=candles.maxOf{it.high}
        val lo=candles.minOf{it.low}
        val range=(hi-lo).coerceAtLeast(0.0001f)
        val width=size.width/candles.size.coerceAtLeast(1)

        fun y(price:Float)=size.height-((price-lo)/range)*size.height

        candles.forEachIndexed { i,c ->
            val x=i*width+width/2
            drawLine(
                Color.DarkGray,
                Offset(x,y(c.high)),
                Offset(x,y(c.low)),
                strokeWidth=2f
            )

            val top=y(maxOf(c.open,c.close))
            val bottom=y(minOf(c.open,c.close))

            drawRect(
                color=if(c.close>=c.open) Color(0xFF2E7D32) else Color(0xFFC62828),
                topLeft=Offset(x-width*.30f,top),
                size=androidx.compose.ui.geometry.Size(
                    width*.60f,
                    (bottom-top).coerceAtLeast(2f)
                )
            )
        }
    }
}
