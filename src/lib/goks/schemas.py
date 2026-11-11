"""
Strict Pydantic v2 Schemas and Sanitization Pipeline for GOKS Chart.
Validates all incoming JSON data (market feeds, backup imports, user lots, settings)
before processing to prevent corrupted state, malformed types, or injection.
"""

from __future__ import annotations
import json
import re
from typing import Any, Dict, List, Literal, Optional, Union
from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    ValidationError,
    field_validator,
    model_validator,
)


class BaseSanitizedModel(BaseModel):
    """Base model enforcing strict types, forbidding extra fields, and stripping whitespace."""

    model_config = ConfigDict(
        strict=True,
        extra="forbid",
        str_strip_whitespace=True,
        validate_assignment=True,
    )


# ---------------------------------------------------------------------------
# 1. Market Feed & Chart JSON Schemas
# ---------------------------------------------------------------------------

class StrictChartMeta(BaseSanitizedModel):
    symbol: str
    currency: Optional[str] = None
    regularMarketPrice: Optional[float] = None
    regularMarketChangePercent: Optional[float] = None
    fiftyTwoWeekHigh: Optional[float] = None
    fiftyTwoWeekLow: Optional[float] = None
    validRanges: Optional[List[str]] = None

    @field_validator("symbol")
    @classmethod
    def sanitize_symbol(cls, v: str) -> str:
        clean = v.strip().upper()
        if not clean:
            raise ValueError("Symbol cannot be empty")
        return clean


class StrictQuoteIndicators(BaseSanitizedModel):
    open: List[Optional[float]] = Field(default_factory=list)
    high: List[Optional[float]] = Field(default_factory=list)
    low: List[Optional[float]] = Field(default_factory=list)
    close: List[Optional[float]] = Field(default_factory=list)
    volume: List[Optional[Union[int, float]]] = Field(default_factory=list)


class StrictIndicators(BaseSanitizedModel):
    quote: List[StrictQuoteIndicators] = Field(default_factory=list)


class StrictChartResult(BaseSanitizedModel):
    meta: Optional[StrictChartMeta] = None
    timestamp: List[int] = Field(default_factory=list)
    indicators: Optional[StrictIndicators] = None


class StrictChartError(BaseSanitizedModel):
    code: Optional[str] = None
    description: Optional[str] = None


class StrictChartData(BaseSanitizedModel):
    result: Optional[List[StrictChartResult]] = None
    error: Optional[StrictChartError] = None


class StrictChartBody(BaseSanitizedModel):
    """Sanitizes incoming Yahoo Finance / external exchange chart JSON responses."""
    chart: StrictChartData


# ---------------------------------------------------------------------------
# 2. Portfolio, Desk & User Backup Schemas
# ---------------------------------------------------------------------------

SYMBOL_REGEX = re.compile(r"^(?:\^[A-Z0-9.]{1,15}|[A-Z0-9&-]{1,20}(?:\.(?:NS|BO))?)$")


class StrictLot(BaseSanitizedModel):
    id: str = Field(min_length=1)
    symbol: str = Field(min_length=1)
    qty: float = Field(gt=0, description="Quantity must be strictly positive")
    cost: float = Field(gt=0, description="Average cost must be strictly positive")
    date: str = Field(min_length=8, max_length=10, description="ISO Date string YYYY-MM-DD")

    @field_validator("symbol")
    @classmethod
    def validate_symbol(cls, v: str) -> str:
        clean = v.strip().upper()
        if not SYMBOL_REGEX.match(clean):
            raise ValueError(f"Invalid symbol format: '{clean}'")
        return clean


class StrictDividend(BaseSanitizedModel):
    id: str = Field(min_length=1)
    symbol: str = Field(min_length=1)
    amount: float = Field(gt=0, description="Dividend amount must be positive")
    date: str = Field(min_length=8, max_length=10)

    @field_validator("symbol")
    @classmethod
    def validate_symbol(cls, v: str) -> str:
        clean = v.strip().upper()
        if not SYMBOL_REGEX.match(clean):
            raise ValueError(f"Invalid dividend symbol format: '{clean}'")
        return clean


class StrictPaperFill(BaseSanitizedModel):
    id: str = Field(min_length=1)
    symbol: str = Field(min_length=1)
    side: Literal["BUY", "SELL"]
    qty: float = Field(gt=0)
    price: float = Field(gt=0)
    ts: int = Field(gt=0)


class StrictAlertRule(BaseSanitizedModel):
    id: str = Field(min_length=1)
    symbol: str = Field(min_length=1)
    field: Literal["price", "changePct", "rsi", "master"]
    op: Literal[">=", "<="]
    value: float


class StrictWatch(BaseSanitizedModel):
    id: str = Field(min_length=1)
    name: str = Field(min_length=1, max_length=100)
    symbols: List[str] = Field(default_factory=list)


class StrictSettings(BaseSanitizedModel):
    rf: float = Field(default=0.065, ge=0.0, le=0.5, description="Risk-free rate: 0% to 50%")
    brokeragePct: float = Field(default=0.03, ge=0.0, le=5.0, description="Brokerage %: 0% to 5%")
    slippagePct: float = Field(default=0.05, ge=0.0, le=5.0, description="Slippage %: 0% to 5%")
    sellChargePct: float = Field(default=0.10, ge=0.0, le=5.0, description="Sell charge %: 0% to 5%")
    breadthMin: float = Field(default=0.55, ge=0.0, le=1.0, description="Market breadth ratio: 0.0 to 1.0")
    above200Min: float = Field(default=0.50, ge=0.0, le=1.0, description="200-DMA minimum: 0.0 to 1.0")
    maxWeight: float = Field(default=0.20, gt=0.0, le=1.0, description="Max asset weight: >0% to 100%")


class StrictDeskState(BaseSanitizedModel):
    section: Optional[str] = "market"
    symbol: Optional[str] = "RELIANCE.NS"
    query: Optional[str] = ""
    lots: List[StrictLot] = Field(default_factory=list)
    portfolioCash: float = Field(default=0.0, ge=0.0)
    dividends: List[StrictDividend] = Field(default_factory=list)
    alerts: List[StrictAlertRule] = Field(default_factory=list)
    watches: List[StrictWatch] = Field(default_factory=list)
    paper: List[StrictPaperFill] = Field(default_factory=list)
    paperCash: float = Field(default=1_000_000.0, ge=0.0)
    assumptions: Dict[str, Any] = Field(default_factory=dict)
    screens: List[Dict[str, Any]] = Field(default_factory=list)
    settings: StrictSettings = Field(default_factory=StrictSettings)


class StrictDeskBackup(BaseSanitizedModel):
    """Strictly validates and sanitizes incoming user desk backups (.json)."""
    app: Literal["goks-chart"]
    version: int = Field(ge=1, le=10)
    exportedAt: str
    desk: StrictDeskState


# ---------------------------------------------------------------------------
# Public Sanitization Functions
# ---------------------------------------------------------------------------

def validate_and_sanitize_backup(raw_json: Union[str, Dict[str, Any]]) -> Dict[str, Any]:
    """
    Validates a raw JSON string or dict against StrictDeskBackup.
    Returns cleaned dict with verified types and stripped malicious fields.
    Raises ValueError with formatted validation error messages on failure.
    """
    try:
        if isinstance(raw_json, str):
            data = json.loads(raw_json)
        else:
            data = raw_json
        model = StrictDeskBackup.model_validate(data)
        return model.model_dump()
    except (json.JSONDecodeError, ValidationError) as e:
        raise ValueError(f"Strict Pydantic Validation Failed: {e}") from e


def validate_and_sanitize_chart(raw_json: Union[str, Dict[str, Any]]) -> Dict[str, Any]:
    """
    Validates raw external exchange / Yahoo chart JSON response.
    Ensures no malformed data reaches analytical engines.
    """
    try:
        if isinstance(raw_json, str):
            data = json.loads(raw_json)
        else:
            data = raw_json
        model = StrictChartBody.model_validate(data)
        return model.model_dump()
    except (json.JSONDecodeError, ValidationError) as e:
        raise ValueError(f"Strict Chart Validation Failed: {e}") from e


def validate_and_sanitize_lot(raw_json: Union[str, Dict[str, Any]]) -> Dict[str, Any]:
    """Validates an individual portfolio lot."""
    try:
        if isinstance(raw_json, str):
            data = json.loads(raw_json)
        else:
            data = raw_json
        model = StrictLot.model_validate(data)
        return model.model_dump()
    except (json.JSONDecodeError, ValidationError) as e:
        raise ValueError(f"Strict Lot Validation Failed: {e}") from e

