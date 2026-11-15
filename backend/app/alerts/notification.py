def build_notification(event):
    return {
        "title": f"{event.symbol} alert",
        "body": event.message,
        "data":{
            "symbol":event.symbol,
            "alert_type":event.alert_type
        }
    }

def send_fcm(notification, tokens):
    """
    Integrate Firebase Admin Messaging here.
    Tokens must be stored securely and associated with the authenticated user.
    """
    return {
        "status":"FCM_ADAPTER_READY",
        "token_count":len(tokens),
        "notification":notification
    }
