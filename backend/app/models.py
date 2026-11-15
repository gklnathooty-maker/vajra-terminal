from sqlalchemy import (
    Column,Integer,String,Float,DateTime,Boolean,
    UniqueConstraint,Index
)
from app.db import Base

class Candle(Base):
    __tablename__="candles"

    id=Column(Integer,primary_key=True)
    symbol=Column(String(40),nullable=False)
    exchange=Column(String(10),nullable=False)
    timeframe=Column(String(10),nullable=False)
    timestamp=Column(DateTime(timezone=True),nullable=False)
    open=Column(Float,nullable=False)
    high=Column(Float,nullable=False)
    low=Column(Float,nullable=False)
    close=Column(Float,nullable=False)
    volume=Column(Float,nullable=False)

    __table_args__=(
        UniqueConstraint(
            "symbol","exchange","timeframe","timestamp",
            name="uq_candle"
        ),
        Index(
            "ix_candle_lookup",
            "symbol","exchange","timeframe","timestamp"
        )
    )

class AnalysisSnapshot(Base):
    __tablename__="analysis_snapshots"

    id=Column(Integer,primary_key=True)
    symbol=Column(String(40),nullable=False)
    timeframe=Column(String(10),nullable=False)
    timestamp=Column(DateTime(timezone=True),nullable=False)
    master_signal=Column(String(40))
    momentum_score=Column(Float)
    technical_score=Column(Float)
    overall_score=Column(Float)
    quality_rank=Column(String(40))
    risk_reward=Column(Float)
    smart_entry_low=Column(Float)
    smart_entry_high=Column(Float)
    stop_loss=Column(Float)
    trailing_stop=Column(Float)
    swing_target=Column(Float)
    is_breakout=Column(Boolean,default=False)
