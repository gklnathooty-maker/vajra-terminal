def ema(values, period):
    if not values: return []
    k=2/(period+1)
    out=[values[0]]
    for v in values[1:]:
        out.append(v*k+out[-1]*(1-k))
    return out

def sma(values, period):
    return [None if i+1<period else sum(values[i+1-period:i+1])/period
            for i in range(len(values))]
