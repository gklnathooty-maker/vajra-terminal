from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
import asyncio
import json

from app.auth.firebase_auth import initialize
from firebase_admin import auth as firebase_auth_sdk

router=APIRouter()


def _verify_ws_token(token:str|None):
    """Verify a Firebase ID token supplied on the websocket handshake.

    Returns the uid on success, or None if the token is missing/invalid.
    """
    if not token:
        return None
    initialize()
    try:
        decoded=firebase_auth_sdk.verify_id_token(token)
        return decoded["uid"]
    except Exception:
        return None

class ConnectionManager:
    def __init__(self):
        self.connections={}

    async def connect(self,symbol,ws):
        await ws.accept()
        self.connections.setdefault(symbol,set()).add(ws)

    def disconnect(self,symbol,ws):
        self.connections.get(symbol,set()).discard(ws)

    async def broadcast(self,symbol,event):
        dead=[]
        for ws in list(self.connections.get(symbol,set())):
            try:
                await ws.send_text(json.dumps(event))
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(symbol,ws)

manager=ConnectionManager()

@router.websocket("/ws/quotes/{symbol}")
async def quotes(websocket:WebSocket,symbol:str,token:str|None=Query(default=None)):
    uid=_verify_ws_token(token)
    if uid is None:
        await websocket.close(code=4401)
        return

    symbol=symbol.upper()
    await manager.connect(symbol,websocket)

    try:
        while True:
            # Client may send ping/subscribe control messages.
            # Provider events should be forwarded by the shared event bus.
            message=await websocket.receive_text()

            try:
                command=json.loads(message)
            except Exception:
                command={}

            if command.get("type")=="ping":
                await websocket.send_json({"type":"pong"})
    except WebSocketDisconnect:
        manager.disconnect(symbol,websocket)
    except Exception:
        manager.disconnect(symbol,websocket)
