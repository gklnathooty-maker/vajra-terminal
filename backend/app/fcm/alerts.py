from app.fcm.service import send_to_fid

def dispatch_alert(fid,symbol,alert_type,message):
    return send_to_fid(
        fid=fid,
        title=f"{symbol} — {alert_type}",
        body=message,
        data={
            "symbol":symbol,
            "alert_type":alert_type
        }
    )
