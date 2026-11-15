from collections import Counter
import time

requests=Counter()
errors=Counter()
latency_ms=[]

def record_request(route):
    requests[route]+=1

def record_error(route):
    errors[route]+=1

def record_latency(start):
    latency_ms.append((time.perf_counter()-start)*1000)

def snapshot():
    return {
        "requests":dict(requests),
        "errors":dict(errors),
        "latency_count":len(latency_ms),
        "latency_avg_ms":(
            round(sum(latency_ms)/len(latency_ms),2)
            if latency_ms else 0
        )
    }
