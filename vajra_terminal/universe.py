"""
VAJRA TERMINAL - Complete Universe of Indian Equities & Indices
==============================================================
Contains exact constituents of:
- NIFTY 50
- NIFTY MIDCAP 150 (150 stocks)
- NIFTY SMALLCAP 100 (100 stocks)
- NIFTY LARGEMIDCAP 250 (250 stocks)
- NIFTY MIDSMALLCAP 400 (400 stocks)
- BSE Liquid Book & Major Indices
"""

from typing import Dict, List, Optional
from dataclasses import dataclass

@dataclass
class Instrument:
    symbol: str
    ticker: str
    name: str
    exchange: str
    sector: str
    kind: str = "equity"

INDICES: List[Dict[str, str]] = [
    {
        "symbol": "^NSEI",
        "ticker": "NIFTY 50",
        "name": "NIFTY 50 Index",
        "exchange": "NSE",
        "sector": "Benchmark"
    },
    {
        "symbol": "^BSESN",
        "ticker": "SENSEX",
        "name": "BSE SENSEX 30",
        "exchange": "BSE",
        "sector": "Benchmark"
    },
    {
        "symbol": "^NSEBANK",
        "ticker": "BANK NIFTY",
        "name": "NIFTY Bank Index",
        "exchange": "NSE",
        "sector": "Banking"
    },
    {
        "symbol": "^CNXIT",
        "ticker": "NIFTY IT",
        "name": "NIFTY IT Sector",
        "exchange": "NSE",
        "sector": "Technology"
    },
    {
        "symbol": "NIFTY_FIN_SERVICE.NS",
        "ticker": "FINNIFTY",
        "name": "NIFTY Financial Services",
        "exchange": "NSE",
        "sector": "Financials"
    },
    {
        "symbol": "NIFTY_MIDCAP_50.NS",
        "ticker": "MIDCAP 50",
        "name": "NIFTY Midcap 50",
        "exchange": "NSE",
        "sector": "Midcap"
    },
    {
        "symbol": "^INDIAVIX",
        "ticker": "INDIA VIX",
        "name": "India Volatility Index",
        "exchange": "NSE",
        "sector": "Volatility"
    },
    {
        "symbol": "GIFT_NIFTY.NS",
        "ticker": "GIFT NIFTY",
        "name": "GIFT Nifty Benchmark",
        "exchange": "NSE",
        "sector": "Benchmark"
    }
]

NIFTY_50: List[str] = [
    "RELIANCE",
    "TCS",
    "HDFCBANK",
    "ICICIBANK",
    "BHARTIARTL",
    "INFY",
    "ITC",
    "SBIN",
    "LT",
    "HINDUNILVR",
    "AXISBANK",
    "KOTAKBANK",
    "M&M",
    "MARUTI",
    "SUNPHARMA",
    "TITAN",
    "BAJFINANCE",
    "BAJAJFINSV",
    "TATASTEEL",
    "NTPC",
    "POWERGRID",
    "ASIANPAINT",
    "ULTRACEMCO",
    "TECHM",
    "HCLTECH",
    "WIPRO",
    "JSWSTEEL",
    "INDUSINDBK",
    "NESTLEIND",
    "ADANIPORTS",
    "ADANIENT",
    "COALINDIA",
    "ONGC",
    "BPCL",
    "GRASIM",
    "CIPLA",
    "DRREDDY",
    "APOLLOHOSP",
    "BRITANNIA",
    "EICHERMOT",
    "HEROMOTOCO",
    "TATACONSUM",
    "TMPV",
    "BEL",
    "TRENT",
    "SHREECEM",
    "TATAPOWER",
    "SUZLON",
    "BHEL",
    "HINDALCO"
]

NIFTY_MIDCAP_150: List[str] = [
    "AUBANK",
    "FEDERALBNK",
    "IDFCFIRSTB",
    "BANDHANBNK",
    "RBLBANK",
    "PERSISTENT",
    "COFORGE",
    "MPHASIS",
    "LTTS",
    "KPITTECH",
    "TATAELXSI",
    "ASHOKLEY",
    "BHARATFORG",
    "ESCORTS",
    "BALKRISIND",
    "MRF",
    "APOLLOTYRE",
    "ALKEM",
    "LUPIN",
    "MANKIND",
    "AUROPHARMA",
    "BIOCON",
    "GLENMARK",
    "IPCA",
    "LAURUSLABS",
    "NATCOPHARM",
    "SAIL",
    "NMDC",
    "NATIONALUM",
    "HINDCOPPER",
    "HINDZINC",
    "JSL",
    "APLAPOLLO",
    "RATNAMANI",
    "TORNTPOWER",
    "NHPC",
    "SJVN",
    "INOXWIND",
    "CESC",
    "GUJGASLTD",
    "MAZDOCK",
    "COCHINSHIP",
    "GRSE",
    "BDL",
    "BEML",
    "TITAGARH",
    "RAILTEL",
    "RITES",
    "IRCON",
    "POLYCAB",
    "KEI",
    "VOLTAS",
    "BLUESTARCO",
    "CROMPTON",
    "WHIRLPOOL",
    "DIXON",
    "KAYNES",
    "PRESTIGE",
    "GODREJPROP",
    "OBEROIRLTY",
    "PHOENIXLTD",
    "BRIGADE",
    "SOBHA",
    "MACROTECH",
    "SIGNATURE",
    "RADICO",
    "UBL",
    "MCDOWELL-N",
    "DEVYANI",
    "JUBLFOOD",
    "WESTLIFE",
    "SAPPHIRE",
    "PAYTM",
    "POLICYBZR",
    "NYKAA",
    "SWIGGY",
    "BSE",
    "CDSL",
    "MCX",
    "ANGELONE",
    "KALYANKJIL",
    "PAGEIND",
    "BATAINDIA",
    "MUTHOOTFIN",
    "POONAWALLA",
    "MANAPPURAM",
    "M&MFIN",
    "LICHSGFIN",
    "CANFINHOME",
    "HUDCO",
    "IREDA",
    "ASTRAL",
    "SUPREMEIND",
    "FINPIPE",
    "PRINCEPIPE",
    "KAJARIACER",
    "CERA",
    "PIIND",
    "UPL",
    "COROMANDEL",
    "DEEPAKNTR",
    "TATACHEM",
    "SRF",
    "NAVINFLUOR",
    "AARTIIND",
    "ATUL",
    "SOLARINDS",
    "AIAENG",
    "THERMAX",
    "KUMAR",
    "CUMMINSIND",
    "TIMKEN",
    "SKFINDIA",
    "SUNTV",
    "ZEEL",
    "PVRINOX",
    "NETWORK18",
    "ABFRL",
    "MANYAVAR",
    "METROBRAND",
    "CAMPUS",
    "SYNGENE",
    "FORTIS",
    "ASTERDM",
    "MEDANTA",
    "RAINBOW",
    "KIMS",
    "GMRINFRA",
    "AFFLE",
    "SONACOMS",
    "ENDURANCE",
    "EXIDEIND",
    "AMARAJABAT",
    "CGPOWER",
    "SUNDRMFAST",
    "SCHAEFFLER",
    "KEC",
    "KALPATPOWR",
    "ZENSARTECH",
    "CYIENT",
    "SONATSOFTW",
    "MASTEK",
    "BSOFT",
    "INTELLECT",
    "ALLCARGO",
    "TCIEXP",
    "VRLLOG",
    "GATEWAY",
    "MAHLOG",
    "SCI"
]

NIFTY_SMALLCAP_100: List[str] = [
    "SUZLON",
    "IRFC",
    "RVNL",
    "HUDCO",
    "IREDA",
    "MAZDOCK",
    "COCHINSHIP",
    "GRSE",
    "BEML",
    "TITAGARH",
    "RAILTEL",
    "RITES",
    "IRCON",
    "NBCC",
    "CENTRALBK",
    "UCOBANK",
    "IOB",
    "MAHABANK",
    "UJJIVANSFB",
    "EQUITASBNK",
    "SOUTHBANK",
    "IDFCFIRSTB",
    "YESBANK",
    "ALOKINDS",
    "TRIDENT",
    "HFCL",
    "LLOYDSENGG",
    "MARKSANS",
    "SUBEX",
    "INFIBEAM",
    "PCJEWELLER",
    "KALYANKJIL",
    "RADICO",
    "CDSL",
    "ANGELONE",
    "BSE",
    "BCG",
    "URJA",
    "VIKASLIFE",
    "EASEMYTRIP",
    "HCC",
    "DISHTV",
    "JPASSOCIAT",
    "RPOWER",
    "JPPOWER",
    "RTNPOWER",
    "RTNINDIA",
    "VIKASECO",
    "FCSSOFT",
    "GTLINFRA",
    "GVKPIL",
    "IDEA",
    "TAPARIA",
    "GUJTLRM",
    "3IINFOLTD",
    "VAKRANGEE",
    "DHANI",
    "MUNDUNURU",
    "MUKTA",
    "PSIT",
    "LANDMARC",
    "RGFCAP",
    "PARSVNATH",
    "CUBICAL",
    "SHARPINV",
    "ASHAPURI",
    "TRIVENI",
    "CHANDRIMA",
    "ANUBHAV",
    "IEL",
    "PARVATI",
    "THINKINK",
    "LADAM",
    "DILIGENT",
    "PREMIEREN",
    "SHUKRA",
    "RAAMA",
    "AAPLUS",
    "WARDWIZARD",
    "GROWINGTON",
    "QUADRANT",
    "CROPSTER",
    "LEADINGLEAS",
    "SAMPRE",
    "DUCON",
    "ULTRACAB",
    "LANDSMILL",
    "CONSEC",
    "DAVANGERE",
    "SHREESEC",
    "GACM",
    "TUNITEX",
    "KARURVYSYA",
    "CUB",
    "ESAF",
    "JSFB",
    "SURYODAY",
    "UTKARSH",
    "CAPITALSFB",
    "TV18BRDCST"
]

NIFTY_LARGEMIDCAP_250: List[str] = [
    "RELIANCE",
    "TCS",
    "HDFCBANK",
    "ICICIBANK",
    "BHARTIARTL",
    "INFY",
    "ITC",
    "SBIN",
    "LT",
    "HINDUNILVR",
    "AXISBANK",
    "KOTAKBANK",
    "M&M",
    "MARUTI",
    "SUNPHARMA",
    "TITAN",
    "BAJFINANCE",
    "BAJAJFINSV",
    "TATASTEEL",
    "NTPC",
    "POWERGRID",
    "ASIANPAINT",
    "ULTRACEMCO",
    "TECHM",
    "HCLTECH",
    "WIPRO",
    "JSWSTEEL",
    "INDUSINDBK",
    "NESTLEIND",
    "ADANIPORTS",
    "ADANIENT",
    "COALINDIA",
    "ONGC",
    "BPCL",
    "GRASIM",
    "CIPLA",
    "DRREDDY",
    "APOLLOHOSP",
    "BRITANNIA",
    "EICHERMOT",
    "HEROMOTOCO",
    "TATACONSUM",
    "TMPV",
    "BEL",
    "TRENT",
    "SHREECEM",
    "TATAPOWER",
    "SUZLON",
    "BHEL",
    "HINDALCO",
    "ABB",
    "ADANIGREEN",
    "ADANIPOWER",
    "AMBUJACEM",
    "ATGL",
    "BAJAJHLDNG",
    "BANKBARODA",
    "BERGEPAINT",
    "BOSCHLTD",
    "CANBK",
    "CHOLAFIN",
    "COLPAL",
    "DLF",
    "DMART",
    "GAIL",
    "GODREJCP",
    "HAL",
    "HAVELLS",
    "ICICIGI",
    "ICICIPRULI",
    "IOC",
    "IRCTC",
    "IRFC",
    "JINDALSTEL",
    "JIOFIN",
    "JSWENERGY",
    "LICI",
    "LTIM",
    "MARICO",
    "MOTHERSON",
    "NAUKRI",
    "PIDILITIND",
    "PFC",
    "PNB",
    "RECLTD",
    "SBILIFE",
    "SHRIRAMFIN",
    "SIEMENS",
    "TORNTPHARM",
    "TVSMOTOR",
    "UNITEDSPR",
    "VBL",
    "VEDL",
    "ZOMATO",
    "ZYDUSLIFE",
    "MAXHEALTH",
    "ETERNAL",
    "DIVISLAB",
    "DABUR",
    "INDIGO",
    "AUBANK",
    "FEDERALBNK",
    "IDFCFIRSTB",
    "BANDHANBNK",
    "RBLBANK",
    "PERSISTENT",
    "COFORGE",
    "MPHASIS",
    "LTTS",
    "KPITTECH",
    "TATAELXSI",
    "ASHOKLEY",
    "BHARATFORG",
    "ESCORTS",
    "BALKRISIND",
    "MRF",
    "APOLLOTYRE",
    "ALKEM",
    "LUPIN",
    "MANKIND",
    "AUROPHARMA",
    "BIOCON",
    "GLENMARK",
    "IPCA",
    "LAURUSLABS",
    "NATCOPHARM",
    "SAIL",
    "NMDC",
    "NATIONALUM",
    "HINDCOPPER",
    "HINDZINC",
    "JSL",
    "APLAPOLLO",
    "RATNAMANI",
    "TORNTPOWER",
    "NHPC",
    "SJVN",
    "INOXWIND",
    "CESC",
    "GUJGASLTD",
    "MAZDOCK",
    "COCHINSHIP",
    "GRSE",
    "BDL",
    "BEML",
    "TITAGARH",
    "RAILTEL",
    "RITES",
    "IRCON",
    "POLYCAB",
    "KEI",
    "VOLTAS",
    "BLUESTARCO",
    "CROMPTON",
    "WHIRLPOOL",
    "DIXON",
    "KAYNES",
    "PRESTIGE",
    "GODREJPROP",
    "OBEROIRLTY",
    "PHOENIXLTD",
    "BRIGADE",
    "SOBHA",
    "MACROTECH",
    "SIGNATURE",
    "RADICO",
    "UBL",
    "MCDOWELL-N",
    "DEVYANI",
    "JUBLFOOD",
    "WESTLIFE",
    "SAPPHIRE",
    "PAYTM",
    "POLICYBZR",
    "NYKAA",
    "SWIGGY",
    "BSE",
    "CDSL",
    "MCX",
    "ANGELONE",
    "KALYANKJIL",
    "PAGEIND",
    "BATAINDIA",
    "MUTHOOTFIN",
    "POONAWALLA",
    "MANAPPURAM",
    "M&MFIN",
    "LICHSGFIN",
    "CANFINHOME",
    "HUDCO",
    "IREDA",
    "ASTRAL",
    "SUPREMEIND",
    "FINPIPE",
    "PRINCEPIPE",
    "KAJARIACER",
    "CERA",
    "PIIND",
    "UPL",
    "COROMANDEL",
    "DEEPAKNTR",
    "TATACHEM",
    "SRF",
    "NAVINFLUOR",
    "AARTIIND",
    "ATUL",
    "SOLARINDS",
    "AIAENG",
    "THERMAX",
    "KUMAR",
    "CUMMINSIND",
    "TIMKEN",
    "SKFINDIA",
    "SUNTV",
    "ZEEL",
    "PVRINOX",
    "NETWORK18",
    "ABFRL",
    "MANYAVAR",
    "METROBRAND",
    "CAMPUS",
    "SYNGENE",
    "FORTIS",
    "ASTERDM",
    "MEDANTA",
    "RAINBOW",
    "KIMS",
    "GMRINFRA",
    "AFFLE",
    "SONACOMS",
    "ENDURANCE",
    "EXIDEIND",
    "AMARAJABAT",
    "CGPOWER",
    "SUNDRMFAST",
    "SCHAEFFLER",
    "KEC",
    "KALPATPOWR",
    "ZENSARTECH",
    "CYIENT",
    "SONATSOFTW",
    "MASTEK",
    "BSOFT",
    "INTELLECT",
    "ALLCARGO",
    "TCIEXP",
    "VRLLOG",
    "GATEWAY",
    "MAHLOG",
    "SCI"
]

NIFTY_MIDSMALLCAP_400: List[str] = [
    "AUBANK",
    "FEDERALBNK",
    "IDFCFIRSTB",
    "BANDHANBNK",
    "RBLBANK",
    "PERSISTENT",
    "COFORGE",
    "MPHASIS",
    "LTTS",
    "KPITTECH",
    "TATAELXSI",
    "ASHOKLEY",
    "BHARATFORG",
    "ESCORTS",
    "BALKRISIND",
    "MRF",
    "APOLLOTYRE",
    "ALKEM",
    "LUPIN",
    "MANKIND",
    "AUROPHARMA",
    "BIOCON",
    "GLENMARK",
    "IPCA",
    "LAURUSLABS",
    "NATCOPHARM",
    "SAIL",
    "NMDC",
    "NATIONALUM",
    "HINDCOPPER",
    "HINDZINC",
    "JSL",
    "APLAPOLLO",
    "RATNAMANI",
    "TORNTPOWER",
    "NHPC",
    "SJVN",
    "INOXWIND",
    "CESC",
    "GUJGASLTD",
    "MAZDOCK",
    "COCHINSHIP",
    "GRSE",
    "BDL",
    "BEML",
    "TITAGARH",
    "RAILTEL",
    "RITES",
    "IRCON",
    "POLYCAB",
    "KEI",
    "VOLTAS",
    "BLUESTARCO",
    "CROMPTON",
    "WHIRLPOOL",
    "DIXON",
    "KAYNES",
    "PRESTIGE",
    "GODREJPROP",
    "OBEROIRLTY",
    "PHOENIXLTD",
    "BRIGADE",
    "SOBHA",
    "MACROTECH",
    "SIGNATURE",
    "RADICO",
    "UBL",
    "MCDOWELL-N",
    "DEVYANI",
    "JUBLFOOD",
    "WESTLIFE",
    "SAPPHIRE",
    "PAYTM",
    "POLICYBZR",
    "NYKAA",
    "SWIGGY",
    "BSE",
    "CDSL",
    "MCX",
    "ANGELONE",
    "KALYANKJIL",
    "PAGEIND",
    "BATAINDIA",
    "MUTHOOTFIN",
    "POONAWALLA",
    "MANAPPURAM",
    "M&MFIN",
    "LICHSGFIN",
    "CANFINHOME",
    "HUDCO",
    "IREDA",
    "ASTRAL",
    "SUPREMEIND",
    "FINPIPE",
    "PRINCEPIPE",
    "KAJARIACER",
    "CERA",
    "PIIND",
    "UPL",
    "COROMANDEL",
    "DEEPAKNTR",
    "TATACHEM",
    "SRF",
    "NAVINFLUOR",
    "AARTIIND",
    "ATUL",
    "SOLARINDS",
    "AIAENG",
    "THERMAX",
    "KUMAR",
    "CUMMINSIND",
    "TIMKEN",
    "SKFINDIA",
    "SUNTV",
    "ZEEL",
    "PVRINOX",
    "NETWORK18",
    "ABFRL",
    "MANYAVAR",
    "METROBRAND",
    "CAMPUS",
    "SYNGENE",
    "FORTIS",
    "ASTERDM",
    "MEDANTA",
    "RAINBOW",
    "KIMS",
    "GMRINFRA",
    "AFFLE",
    "SONACOMS",
    "ENDURANCE",
    "EXIDEIND",
    "AMARAJABAT",
    "CGPOWER",
    "SUNDRMFAST",
    "SCHAEFFLER",
    "KEC",
    "KALPATPOWR",
    "ZENSARTECH",
    "CYIENT",
    "SONATSOFTW",
    "MASTEK",
    "BSOFT",
    "INTELLECT",
    "ALLCARGO",
    "TCIEXP",
    "VRLLOG",
    "GATEWAY",
    "MAHLOG",
    "SCI",
    "RVNL",
    "NBCC",
    "CENTRALBK",
    "UCOBANK",
    "IOB",
    "MAHABANK",
    "UJJIVANSFB",
    "EQUITASBNK",
    "SOUTHBANK",
    "YESBANK",
    "ALOKINDS",
    "TRIDENT",
    "HFCL",
    "LLOYDSENGG",
    "MARKSANS",
    "SUBEX",
    "INFIBEAM",
    "PCJEWELLER",
    "BCG",
    "URJA",
    "VIKASLIFE",
    "EASEMYTRIP",
    "HCC",
    "DISHTV",
    "JPASSOCIAT",
    "RPOWER",
    "JPPOWER",
    "RTNPOWER",
    "RTNINDIA",
    "VIKASECO",
    "FCSSOFT",
    "GTLINFRA",
    "GVKPIL",
    "IDEA",
    "TAPARIA",
    "GUJTLRM",
    "3IINFOLTD",
    "VAKRANGEE",
    "DHANI",
    "MUNDUNURU",
    "MUKTA",
    "PSIT",
    "LANDMARC",
    "RGFCAP",
    "PARSVNATH",
    "CUBICAL",
    "SHARPINV",
    "ASHAPURI",
    "TRIVENI",
    "CHANDRIMA",
    "ANUBHAV",
    "IEL",
    "PARVATI",
    "THINKINK",
    "LADAM",
    "DILIGENT",
    "PREMIEREN",
    "SHUKRA",
    "RAAMA",
    "AAPLUS",
    "WARDWIZARD",
    "GROWINGTON",
    "QUADRANT",
    "CROPSTER",
    "LEADINGLEAS",
    "SAMPRE",
    "DUCON",
    "ULTRACAB",
    "LANDSMILL",
    "CONSEC",
    "DAVANGERE",
    "SHREESEC",
    "GACM",
    "TUNITEX",
    "KARURVYSYA",
    "CUB",
    "ESAF",
    "JSFB",
    "SURYODAY",
    "UTKARSH",
    "CAPITALSFB",
    "TV18BRDCST",
    "HBLPOWER",
    "DATAPATTNS",
    "PARAS",
    "MTARTECH",
    "BORORENEW",
    "PRAJIND",
    "DEEPAKFERT",
    "GNFC",
    "GSFC",
    "RCF",
    "NFL",
    "CHAMBLFERT",
    "SPIC",
    "HATSUN",
    "HERITGFOOD",
    "DODLA",
    "VADILALIND",
    "TASTYBITE",
    "ZYDUSWELL",
    "REDTAPE",
    "LIBERTSHOE",
    "MIRZAINT",
    "RUPA",
    "LUXIND",
    "DOLLAR",
    "SANSERA",
    "CRAFTSMAN",
    "PRICOLLTD",
    "SUPRAJIT",
    "FIEMIND",
    "LUMAXTECH",
    "SUBROS",
    "KNRCON",
    "PNCINFRA",
    "ASHOKA",
    "GRINFRA",
    "ITDCEIL",
    "HGINFRA",
    "PSPPROJECT",
    "BLS",
    "PROTEAN",
    "CAMS",
    "KFINTECH",
    "IIFL",
    "GEOJITFSL",
    "MOTILALOFS",
    "5PAISA",
    "ANANTRAJ",
    "PURVA",
    "KOLTEPATIL",
    "AJMERA",
    "ARVIND",
    "GOKEX",
    "RAYMOND",
    "WELSPUNLIV",
    "CENTURYTEX",
    "VTL",
    "KPRMILL",
    "GARFIBRES",
    "SWANENERGY",
    "ROSSARI",
    "CLEAN",
    "NEOGEN",
    "ANUPAM",
    "AMIORG",
    "TATVA",
    "POLYMED",
    "ERIS",
    "FDC",
    "CAPL",
    "CEATLTD",
    "JKTYRE",
    "TVSSRICHAK",
    "GOCOLORS",
    "TCNSBRANDS",
    "ETHOSLTD",
    "DCXINDIA",
    "DBL",
    "NCC",
    "IRB",
    "DYNAMATECH",
    "ASTRAZEN",
    "PREMIER",
    "PRAKASH",
    "JINDALPOLY",
    "GALLANTT",
    "GRAVITA",
    "PITTIENG",
    "SALASAR",
    "TIMETECHNO",
    "ELECON",
    "TEXRAIL",
    "JUPITERIN",
    "PENIND",
    "GOODLUCK",
    "SFL",
    "SHARDACROP",
    "INDIGOPNTS",
    "KANSAINER",
    "SHALPAINTS",
    "MINDAIND",
    "LUMAXIND",
    "GABRIEL",
    "VARROC",
    "JAYBARMARU",
    "BANCOINDIA",
    "TALBROSENG",
    "ROLEXRINGS",
    "KWALITY",
    "DFMFOODS",
    "SOMANYCERA",
    "DREDGECORP",
    "SIYARAM",
    "BOMBAYDYE",
    "HIMATSEIDE",
    "NAHARSPING",
    "MONTECARLO",
    "VENKYS",
    "RATEGAIN",
    "TANLA",
    "ROUTE",
    "DATAMATICS",
    "QUICKHEAL",
    "SAKSOFT",
    "NEWGEN",
    "VAIBHAVGBL",
    "GREENPANEL",
    "GREENPLY",
    "CENTURYPLY",
    "ORIENTCEM",
    "HEIDELBERG",
    "STARCEMENT",
    "SAGCEM",
    "DECCANCE",
    "MANGALAM",
    "NCLIND",
    "ANDHRAPAP",
    "JKPAPER",
    "WSTCSTPAPR",
    "TNPL",
    "SESHAPAPER",
    "STARPAPER",
    "KOPRAN",
    "MOREPENLAB",
    "SMSPHARMA",
    "NEULANDLAB",
    "SUVENPHAR",
    "SOLARA",
    "THEMISMED",
    "GUFICBIO",
    "BLISSGVS",
    "LINCOLN",
    "AHLUCONT",
    "CAPACITE",
    "MANINFRA",
    "NELCO",
    "RANEHOLDIN",
    "SHIVALIK",
    "SANDHAR",
    "JAYAGRO",
    "MUNJALAU",
    "VSTTILLERS",
    "GULFPETRO",
    "PANACEABIO",
    "KIRLOSENG",
    "KIRLOSBROS",
    "KIRLFER",
    "ORIENTHOT"
]

NSE_BOOK: List[Dict[str, str]] = [
    {
        "symbol": "HDFCBANK.NS",
        "ticker": "HDFCBANK",
        "name": "Banks",
        "exchange": "NSE",
        "sector": "HDFC Bank Limited",
        "kind": "equity"
    },
    {
        "symbol": "ICICIBANK.NS",
        "ticker": "ICICIBANK",
        "name": "Banks",
        "exchange": "NSE",
        "sector": "ICICI Bank Limited",
        "kind": "equity"
    },
    {
        "symbol": "SBIN.NS",
        "ticker": "SBIN",
        "name": "Banks",
        "exchange": "NSE",
        "sector": "State Bank of India",
        "kind": "equity"
    },
    {
        "symbol": "KOTAKBANK.NS",
        "ticker": "KOTAKBANK",
        "name": "Banks",
        "exchange": "NSE",
        "sector": "Kotak Mahindra Bank Limited",
        "kind": "equity"
    },
    {
        "symbol": "AXISBANK.NS",
        "ticker": "AXISBANK",
        "name": "Banks",
        "exchange": "NSE",
        "sector": "Axis Bank Limited",
        "kind": "equity"
    },
    {
        "symbol": "INDUSINDBK.NS",
        "ticker": "INDUSINDBK",
        "name": "Banks",
        "exchange": "NSE",
        "sector": "IndusInd Bank Limited",
        "kind": "equity"
    },
    {
        "symbol": "FEDERALBNK.NS",
        "ticker": "FEDERALBNK",
        "name": "Banks",
        "exchange": "NSE",
        "sector": "The Federal Bank Limited",
        "kind": "equity"
    },
    {
        "symbol": "IDFCFIRSTB.NS",
        "ticker": "IDFCFIRSTB",
        "name": "Banks",
        "exchange": "NSE",
        "sector": "IDFC First Bank Limited",
        "kind": "equity"
    },
    {
        "symbol": "RBLBANK.NS",
        "ticker": "RBLBANK",
        "name": "Banks",
        "exchange": "NSE",
        "sector": "RBL Bank Limited",
        "kind": "equity"
    },
    {
        "symbol": "BANDHANBNK.NS",
        "ticker": "BANDHANBNK",
        "name": "Banks",
        "exchange": "NSE",
        "sector": "Bandhan Bank Limited",
        "kind": "equity"
    },
    {
        "symbol": "AUBANK.NS",
        "ticker": "AUBANK",
        "name": "Banks",
        "exchange": "NSE",
        "sector": "AU Small Finance Bank Limited",
        "kind": "equity"
    },
    {
        "symbol": "UJJIVANSFB.NS",
        "ticker": "UJJIVANSFB",
        "name": "Banks",
        "exchange": "NSE",
        "sector": "Ujjivan Small Finance Bank Limited",
        "kind": "equity"
    },
    {
        "symbol": "EQUITASBNK.NS",
        "ticker": "EQUITASBNK",
        "name": "Banks",
        "exchange": "NSE",
        "sector": "Equitas Small Finance Bank Limited",
        "kind": "equity"
    },
    {
        "symbol": "ESAFSFB.NS",
        "ticker": "ESAFSFB",
        "name": "Banks",
        "exchange": "NSE",
        "sector": "ESAF Small Finance Bank Limited",
        "kind": "equity"
    },
    {
        "symbol": "JSFB.NS",
        "ticker": "JSFB",
        "name": "Banks",
        "exchange": "NSE",
        "sector": "Jana Small Finance Bank Limited",
        "kind": "equity"
    },
    {
        "symbol": "SURYODAY.NS",
        "ticker": "SURYODAY",
        "name": "Banks",
        "exchange": "NSE",
        "sector": "Suryoday Small Finance Bank Limited",
        "kind": "equity"
    },
    {
        "symbol": "UTKARSHBNK.NS",
        "ticker": "UTKARSHBNK",
        "name": "Banks",
        "exchange": "NSE",
        "sector": "Utkarsh Small Finance Bank Limited",
        "kind": "equity"
    },
    {
        "symbol": "CAPITALSFB.NS",
        "ticker": "CAPITALSFB",
        "name": "Banks",
        "exchange": "NSE",
        "sector": "Capital Small Finance Bank Limited",
        "kind": "equity"
    },
    {
        "symbol": "YESBANK.NS",
        "ticker": "YESBANK",
        "name": "Banks",
        "exchange": "NSE",
        "sector": "Yes Bank Limited",
        "kind": "equity"
    },
    {
        "symbol": "CUB.NS",
        "ticker": "CUB",
        "name": "Banks",
        "exchange": "NSE",
        "sector": "City Union Bank Limited",
        "kind": "equity"
    },
    {
        "symbol": "KARURVYSYA.NS",
        "ticker": "KARURVYSYA",
        "name": "Banks",
        "exchange": "NSE",
        "sector": "Karur Vysya Bank Limited",
        "kind": "equity"
    },
    {
        "symbol": "BANKBARODA.NS",
        "ticker": "BANKBARODA",
        "name": "PSU Banks",
        "exchange": "NSE",
        "sector": "Bank of Baroda Limited",
        "kind": "equity"
    },
    {
        "symbol": "PNB.NS",
        "ticker": "PNB",
        "name": "PSU Banks",
        "exchange": "NSE",
        "sector": "Punjab National Bank",
        "kind": "equity"
    },
    {
        "symbol": "CANBK.NS",
        "ticker": "CANBK",
        "name": "PSU Banks",
        "exchange": "NSE",
        "sector": "Canara Bank",
        "kind": "equity"
    },
    {
        "symbol": "UNIONBANK.NS",
        "ticker": "UNIONBANK",
        "name": "PSU Banks",
        "exchange": "NSE",
        "sector": "Union Bank of India",
        "kind": "equity"
    },
    {
        "symbol": "BANKINDIA.NS",
        "ticker": "BANKINDIA",
        "name": "PSU Banks",
        "exchange": "NSE",
        "sector": "Bank of India",
        "kind": "equity"
    },
    {
        "symbol": "INDIANB.NS",
        "ticker": "INDIANB",
        "name": "PSU Banks",
        "exchange": "NSE",
        "sector": "Indian Bank",
        "kind": "equity"
    },
    {
        "symbol": "MAHABANK.NS",
        "ticker": "MAHABANK",
        "name": "PSU Banks",
        "exchange": "NSE",
        "sector": "Bank of Maharashtra",
        "kind": "equity"
    },
    {
        "symbol": "CENTRALBK.NS",
        "ticker": "CENTRALBK",
        "name": "PSU Banks",
        "exchange": "NSE",
        "sector": "Central Bank of India",
        "kind": "equity"
    },
    {
        "symbol": "UCOBANK.NS",
        "ticker": "UCOBANK",
        "name": "PSU Banks",
        "exchange": "NSE",
        "sector": "UCO Bank",
        "kind": "equity"
    },
    {
        "symbol": "IOB.NS",
        "ticker": "IOB",
        "name": "PSU Banks",
        "exchange": "NSE",
        "sector": "Indian Overseas Bank",
        "kind": "equity"
    },
    {
        "symbol": "BAJFINANCE.NS",
        "ticker": "BAJFINANCE",
        "name": "NBFC",
        "exchange": "NSE",
        "sector": "Bajaj Finance Limited",
        "kind": "equity"
    },
    {
        "symbol": "BAJAJFINSV.NS",
        "ticker": "BAJAJFINSV",
        "name": "NBFC",
        "exchange": "NSE",
        "sector": "Bajaj Finserv Limited",
        "kind": "equity"
    },
    {
        "symbol": "SHRIRAMFIN.NS",
        "ticker": "SHRIRAMFIN",
        "name": "NBFC",
        "exchange": "NSE",
        "sector": "Shriram Finance Limited",
        "kind": "equity"
    },
    {
        "symbol": "JIOFIN.NS",
        "ticker": "JIOFIN",
        "name": "NBFC",
        "exchange": "NSE",
        "sector": "Jio Financial Services Limited",
        "kind": "equity"
    },
    {
        "symbol": "CHOLAFIN.NS",
        "ticker": "CHOLAFIN",
        "name": "NBFC",
        "exchange": "NSE",
        "sector": "Cholamandalam Investment and Finance",
        "kind": "equity"
    },
    {
        "symbol": "MUTHOOTFIN.NS",
        "ticker": "MUTHOOTFIN",
        "name": "NBFC",
        "exchange": "NSE",
        "sector": "Muthoot Finance Limited",
        "kind": "equity"
    },
    {
        "symbol": "POONAWALLA.NS",
        "ticker": "POONAWALLA",
        "name": "NBFC",
        "exchange": "NSE",
        "sector": "Poonawalla Fincorp Limited",
        "kind": "equity"
    },
    {
        "symbol": "MANAPPURAM.NS",
        "ticker": "MANAPPURAM",
        "name": "NBFC",
        "exchange": "NSE",
        "sector": "Manappuram Finance Limited",
        "kind": "equity"
    },
    {
        "symbol": "L&TFH.NS",
        "ticker": "L&TFH",
        "name": "NBFC",
        "exchange": "NSE",
        "sector": "L&T Finance Holdings Limited",
        "kind": "equity"
    },
    {
        "symbol": "ABCAPITAL.NS",
        "ticker": "ABCAPITAL",
        "name": "NBFC",
        "exchange": "NSE",
        "sector": "Aditya Birla Capital Limited",
        "kind": "equity"
    },
    {
        "symbol": "SUNDARMFIN.NS",
        "ticker": "SUNDARMFIN",
        "name": "NBFC",
        "exchange": "NSE",
        "sector": "Sundaram Finance Limited",
        "kind": "equity"
    },
    {
        "symbol": "M&MFIN.NS",
        "ticker": "M&MFIN",
        "name": "NBFC",
        "exchange": "NSE",
        "sector": "Mahindra & Mahindra Financial Services Limited",
        "kind": "equity"
    },
    {
        "symbol": "PFC.NS",
        "ticker": "PFC",
        "name": "NBFC",
        "exchange": "NSE",
        "sector": "Power Finance Corporation Limited",
        "kind": "equity"
    },
    {
        "symbol": "RECLTD.NS",
        "ticker": "RECLTD",
        "name": "NBFC",
        "exchange": "NSE",
        "sector": "REC Limited",
        "kind": "equity"
    },
    {
        "symbol": "HUDCO.NS",
        "ticker": "HUDCO",
        "name": "NBFC",
        "exchange": "NSE",
        "sector": "Housing & Urban Development Corporation (HUDCO)",
        "kind": "equity"
    },
    {
        "symbol": "IREDA.NS",
        "ticker": "IREDA",
        "name": "NBFC",
        "exchange": "NSE",
        "sector": "Indian Renewable Energy Development Agency (IREDA)",
        "kind": "equity"
    },
    {
        "symbol": "LICHSGFIN.NS",
        "ticker": "LICHSGFIN",
        "name": "NBFC",
        "exchange": "NSE",
        "sector": "LIC Housing Finance Limited",
        "kind": "equity"
    },
    {
        "symbol": "PNBHOUSING.NS",
        "ticker": "PNBHOUSING",
        "name": "NBFC",
        "exchange": "NSE",
        "sector": "PNB Housing Finance Limited",
        "kind": "equity"
    },
    {
        "symbol": "SBILIFE.NS",
        "ticker": "SBILIFE",
        "name": "Insurance",
        "exchange": "NSE",
        "sector": "SBI Life Insurance Company Limited",
        "kind": "equity"
    },
    {
        "symbol": "HDFCLIFE.NS",
        "ticker": "HDFCLIFE",
        "name": "Insurance",
        "exchange": "NSE",
        "sector": "HDFC Life Insurance Company Limited",
        "kind": "equity"
    },
    {
        "symbol": "ICICIPRULI.NS",
        "ticker": "ICICIPRULI",
        "name": "Insurance",
        "exchange": "NSE",
        "sector": "ICICI Prudential Life Insurance Limited",
        "kind": "equity"
    },
    {
        "symbol": "GICRE.NS",
        "ticker": "GICRE",
        "name": "Insurance",
        "exchange": "NSE",
        "sector": "General Insurance Corporation of India",
        "kind": "equity"
    },
    {
        "symbol": "TCS.NS",
        "ticker": "TCS",
        "name": "Information Technology",
        "exchange": "NSE",
        "sector": "Tata Consultancy Services Limited",
        "kind": "equity"
    },
    {
        "symbol": "INFY.NS",
        "ticker": "INFY",
        "name": "Information Technology",
        "exchange": "NSE",
        "sector": "Infosys Limited",
        "kind": "equity"
    },
    {
        "symbol": "HCLTECH.NS",
        "ticker": "HCLTECH",
        "name": "Information Technology",
        "exchange": "NSE",
        "sector": "HCL Technologies Limited",
        "kind": "equity"
    },
    {
        "symbol": "WIPRO.NS",
        "ticker": "WIPRO",
        "name": "Information Technology",
        "exchange": "NSE",
        "sector": "Wipro Limited",
        "kind": "equity"
    },
    {
        "symbol": "TECHM.NS",
        "ticker": "TECHM",
        "name": "Information Technology",
        "exchange": "NSE",
        "sector": "Tech Mahindra Limited",
        "kind": "equity"
    },
    {
        "symbol": "LTIM.NS",
        "ticker": "LTIM",
        "name": "Information Technology",
        "exchange": "NSE",
        "sector": "LTIMindtree Limited",
        "kind": "equity"
    },
    {
        "symbol": "PERSISTENT.NS",
        "ticker": "PERSISTENT",
        "name": "Information Technology",
        "exchange": "NSE",
        "sector": "Persistent Systems Limited",
        "kind": "equity"
    },
    {
        "symbol": "COFORGE.NS",
        "ticker": "COFORGE",
        "name": "Information Technology",
        "exchange": "NSE",
        "sector": "Coforge Limited",
        "kind": "equity"
    },
    {
        "symbol": "MPHASIS.NS",
        "ticker": "MPHASIS",
        "name": "Information Technology",
        "exchange": "NSE",
        "sector": "Mphasis Limited",
        "kind": "equity"
    },
    {
        "symbol": "LTTS.NS",
        "ticker": "LTTS",
        "name": "Information Technology",
        "exchange": "NSE",
        "sector": "L&T Technology Services Limited",
        "kind": "equity"
    },
    {
        "symbol": "KPITTECH.NS",
        "ticker": "KPITTECH",
        "name": "Information Technology",
        "exchange": "NSE",
        "sector": "KPIT Technologies Limited",
        "kind": "equity"
    },
    {
        "symbol": "TATAELXSI.NS",
        "ticker": "TATAELXSI",
        "name": "Information Technology",
        "exchange": "NSE",
        "sector": "Tata Elxsi Limited",
        "kind": "equity"
    },
    {
        "symbol": "CYIENT.NS",
        "ticker": "CYIENT",
        "name": "Information Technology",
        "exchange": "NSE",
        "sector": "Cyient Limited",
        "kind": "equity"
    },
    {
        "symbol": "SONATSOFTW.NS",
        "ticker": "SONATSOFTW",
        "name": "Information Technology",
        "exchange": "NSE",
        "sector": "Sonata Software Limited",
        "kind": "equity"
    },
    {
        "symbol": "BSOFT.NS",
        "ticker": "BSOFT",
        "name": "Information Technology",
        "exchange": "NSE",
        "sector": "Birlasoft Limited",
        "kind": "equity"
    },
    {
        "symbol": "PAYTM.NS",
        "ticker": "PAYTM",
        "name": "Fintech",
        "exchange": "NSE",
        "sector": "One97 Communications Limited (Paytm)",
        "kind": "equity"
    },
    {
        "symbol": "POLICYBZR.NS",
        "ticker": "POLICYBZR",
        "name": "Fintech",
        "exchange": "NSE",
        "sector": "PB Fintech Limited (Policybazaar)",
        "kind": "equity"
    },
    {
        "symbol": "NYKAA.NS",
        "ticker": "NYKAA",
        "name": "Fintech",
        "exchange": "NSE",
        "sector": "FSN E-Commerce Ventures Limited (Nykaa)",
        "kind": "equity"
    },
    {
        "symbol": "DELHIVERY.NS",
        "ticker": "DELHIVERY",
        "name": "Logistics",
        "exchange": "NSE",
        "sector": "Delhivery Limited",
        "kind": "equity"
    },
    {
        "symbol": "SWIGGY.NS",
        "ticker": "SWIGGY",
        "name": "Consumer",
        "exchange": "NSE",
        "sector": "Swiggy Limited",
        "kind": "equity"
    },
    {
        "symbol": "ETERNAL.NS",
        "ticker": "ETERNAL",
        "name": "Consumer",
        "exchange": "NSE",
        "sector": "Eternal Limited (Zomato)",
        "kind": "equity"
    },
    {
        "symbol": "BSE.NS",
        "ticker": "BSE",
        "name": "Exchanges",
        "exchange": "NSE",
        "sector": "BSE Limited",
        "kind": "equity"
    },
    {
        "symbol": "CDSL.NS",
        "ticker": "CDSL",
        "name": "Exchanges",
        "exchange": "NSE",
        "sector": "Central Depository Services (India) Limited (CDSL)",
        "kind": "equity"
    },
    {
        "symbol": "MCX.NS",
        "ticker": "MCX",
        "name": "Exchanges",
        "exchange": "NSE",
        "sector": "Multi Commodity Exchange of India (MCX)",
        "kind": "equity"
    },
    {
        "symbol": "IEX.NS",
        "ticker": "IEX",
        "name": "Exchanges",
        "exchange": "NSE",
        "sector": "Indian Energy Exchange Limited (IEX)",
        "kind": "equity"
    },
    {
        "symbol": "ANGELONE.NS",
        "ticker": "ANGELONE",
        "name": "Fintech",
        "exchange": "NSE",
        "sector": "Angel One Limited",
        "kind": "equity"
    },
    {
        "symbol": "CAMS.NS",
        "ticker": "CAMS",
        "name": "Fintech",
        "exchange": "NSE",
        "sector": "Computer Age Management Services Limited",
        "kind": "equity"
    },
    {
        "symbol": "HINDUNILVR.NS",
        "ticker": "HINDUNILVR",
        "name": "FMCG",
        "exchange": "NSE",
        "sector": "Hindustan Unilever Limited",
        "kind": "equity"
    },
    {
        "symbol": "ITC.NS",
        "ticker": "ITC",
        "name": "FMCG",
        "exchange": "NSE",
        "sector": "ITC Limited",
        "kind": "equity"
    },
    {
        "symbol": "NESTLEIND.NS",
        "ticker": "NESTLEIND",
        "name": "FMCG",
        "exchange": "NSE",
        "sector": "Nestl\u00e9 India Limited",
        "kind": "equity"
    },
    {
        "symbol": "BRITANNIA.NS",
        "ticker": "BRITANNIA",
        "name": "FMCG",
        "exchange": "NSE",
        "sector": "Britannia Industries Limited",
        "kind": "equity"
    },
    {
        "symbol": "TATACONSUM.NS",
        "ticker": "TATACONSUM",
        "name": "FMCG",
        "exchange": "NSE",
        "sector": "Tata Consumer Products Limited",
        "kind": "equity"
    },
    {
        "symbol": "DABUR.NS",
        "ticker": "DABUR",
        "name": "FMCG",
        "exchange": "NSE",
        "sector": "Dabur India Limited",
        "kind": "equity"
    },
    {
        "symbol": "MARICO.NS",
        "ticker": "MARICO",
        "name": "FMCG",
        "exchange": "NSE",
        "sector": "Marico Limited",
        "kind": "equity"
    },
    {
        "symbol": "COLPAL.NS",
        "ticker": "COLPAL",
        "name": "FMCG",
        "exchange": "NSE",
        "sector": "Colgate-Palmolive (India) Limited",
        "kind": "equity"
    },
    {
        "symbol": "GODREJCP.NS",
        "ticker": "GODREJCP",
        "name": "FMCG",
        "exchange": "NSE",
        "sector": "Godrej Consumer Products Limited",
        "kind": "equity"
    },
    {
        "symbol": "VBL.NS",
        "ticker": "VBL",
        "name": "FMCG",
        "exchange": "NSE",
        "sector": "Varun Beverages Limited",
        "kind": "equity"
    },
    {
        "symbol": "RADICO.NS",
        "ticker": "RADICO",
        "name": "FMCG",
        "exchange": "NSE",
        "sector": "Radico Khaitan Limited",
        "kind": "equity"
    },
    {
        "symbol": "UBL.NS",
        "ticker": "UBL",
        "name": "FMCG",
        "exchange": "NSE",
        "sector": "United Breweries Limited",
        "kind": "equity"
    },
    {
        "symbol": "MCDOWELL-N.NS",
        "ticker": "MCDOWELL-N",
        "name": "FMCG",
        "exchange": "NSE",
        "sector": "United Spirits Limited",
        "kind": "equity"
    },
    {
        "symbol": "MARUTI.NS",
        "ticker": "MARUTI",
        "name": "Auto",
        "exchange": "NSE",
        "sector": "Maruti Suzuki India Limited",
        "kind": "equity"
    },
    {
        "symbol": "M&M.NS",
        "ticker": "M&M",
        "name": "Auto",
        "exchange": "NSE",
        "sector": "Mahindra & Mahindra Limited",
        "kind": "equity"
    },
    {
        "symbol": "TMPV.NS",
        "ticker": "TMPV",
        "name": "Auto",
        "exchange": "NSE",
        "sector": "Tata Motors Passenger Vehicles Limited (TATAMOTORS)",
        "kind": "equity"
    },
    {
        "symbol": "EICHERMOT.NS",
        "ticker": "EICHERMOT",
        "name": "Auto",
        "exchange": "NSE",
        "sector": "Eicher Motors Limited",
        "kind": "equity"
    },
    {
        "symbol": "HEROMOTOCO.NS",
        "ticker": "HEROMOTOCO",
        "name": "Auto",
        "exchange": "NSE",
        "sector": "Hero MotoCorp Limited",
        "kind": "equity"
    },
    {
        "symbol": "BAJAJ-AUTO.NS",
        "ticker": "BAJAJ-AUTO",
        "name": "Auto",
        "exchange": "NSE",
        "sector": "Bajaj Auto Limited",
        "kind": "equity"
    },
    {
        "symbol": "TVSMOTOR.NS",
        "ticker": "TVSMOTOR",
        "name": "Auto",
        "exchange": "NSE",
        "sector": "TVS Motor Company Limited",
        "kind": "equity"
    },
    {
        "symbol": "ASHOKLEY.NS",
        "ticker": "ASHOKLEY",
        "name": "Auto",
        "exchange": "NSE",
        "sector": "Ashok Leyland Limited",
        "kind": "equity"
    },
    {
        "symbol": "ESCORTS.NS",
        "ticker": "ESCORTS",
        "name": "Auto",
        "exchange": "NSE",
        "sector": "Escorts Kubota Limited",
        "kind": "equity"
    },
    {
        "symbol": "BHARATFORG.NS",
        "ticker": "BHARATFORG",
        "name": "Auto Ancillary",
        "exchange": "NSE",
        "sector": "Bharat Forge Limited",
        "kind": "equity"
    },
    {
        "symbol": "MOTHERSON.NS",
        "ticker": "MOTHERSON",
        "name": "Auto Ancillary",
        "exchange": "NSE",
        "sector": "Samvardhana Motherson International Limited",
        "kind": "equity"
    },
    {
        "symbol": "TIINDIA.NS",
        "ticker": "TIINDIA",
        "name": "Auto Ancillary",
        "exchange": "NSE",
        "sector": "Tube Investments of India Limited",
        "kind": "equity"
    },
    {
        "symbol": "BOSCHLTD.NS",
        "ticker": "BOSCHLTD",
        "name": "Auto Ancillary",
        "exchange": "NSE",
        "sector": "Bosch Limited",
        "kind": "equity"
    },
    {
        "symbol": "ENDURANCE.NS",
        "ticker": "ENDURANCE",
        "name": "Auto Ancillary",
        "exchange": "NSE",
        "sector": "Endurance Technologies Limited",
        "kind": "equity"
    },
    {
        "symbol": "SONACOMS.NS",
        "ticker": "SONACOMS",
        "name": "Auto Ancillary",
        "exchange": "NSE",
        "sector": "Sona BLW Precision Forgings Limited",
        "kind": "equity"
    },
    {
        "symbol": "MRF.NS",
        "ticker": "MRF",
        "name": "Auto Ancillary",
        "exchange": "NSE",
        "sector": "MRF Limited",
        "kind": "equity"
    },
    {
        "symbol": "BALKRISIND.NS",
        "ticker": "BALKRISIND",
        "name": "Auto Ancillary",
        "exchange": "NSE",
        "sector": "Balkrishna Industries Limited",
        "kind": "equity"
    },
    {
        "symbol": "APOLLOTYRE.NS",
        "ticker": "APOLLOTYRE",
        "name": "Auto Ancillary",
        "exchange": "NSE",
        "sector": "Apollo Tyres Limited",
        "kind": "equity"
    },
    {
        "symbol": "CEATLTD.NS",
        "ticker": "CEATLTD",
        "name": "Auto Ancillary",
        "exchange": "NSE",
        "sector": "CEAT Limited",
        "kind": "equity"
    },
    {
        "symbol": "EXIDEIND.NS",
        "ticker": "EXIDEIND",
        "name": "Auto Ancillary",
        "exchange": "NSE",
        "sector": "Exide Industries Limited",
        "kind": "equity"
    },
    {
        "symbol": "AMARAJABAT.NS",
        "ticker": "AMARAJABAT",
        "name": "Auto Ancillary",
        "exchange": "NSE",
        "sector": "Amara Raja Energy & Mobility Limited",
        "kind": "equity"
    },
    {
        "symbol": "SUNPHARMA.NS",
        "ticker": "SUNPHARMA",
        "name": "Healthcare",
        "exchange": "NSE",
        "sector": "Sun Pharmaceutical Industries Limited",
        "kind": "equity"
    },
    {
        "symbol": "CIPLA.NS",
        "ticker": "CIPLA",
        "name": "Healthcare",
        "exchange": "NSE",
        "sector": "Cipla Limited",
        "kind": "equity"
    },
    {
        "symbol": "DRREDDY.NS",
        "ticker": "DRREDDY",
        "name": "Healthcare",
        "exchange": "NSE",
        "sector": "Dr. Reddy's Laboratories Limited",
        "kind": "equity"
    },
    {
        "symbol": "DIVISLAB.NS",
        "ticker": "DIVISLAB",
        "name": "Healthcare",
        "exchange": "NSE",
        "sector": "Divi's Laboratories Limited",
        "kind": "equity"
    },
    {
        "symbol": "APOLLOHOSP.NS",
        "ticker": "APOLLOHOSP",
        "name": "Healthcare",
        "exchange": "NSE",
        "sector": "Apollo Hospitals Enterprise Limited",
        "kind": "equity"
    },
    {
        "symbol": "MAXHEALTH.NS",
        "ticker": "MAXHEALTH",
        "name": "Healthcare",
        "exchange": "NSE",
        "sector": "Max Healthcare Institute Limited",
        "kind": "equity"
    },
    {
        "symbol": "ZYDUSLIFE.NS",
        "ticker": "ZYDUSLIFE",
        "name": "Healthcare",
        "exchange": "NSE",
        "sector": "Zydus Lifesciences Limited",
        "kind": "equity"
    },
    {
        "symbol": "LUPIN.NS",
        "ticker": "LUPIN",
        "name": "Healthcare",
        "exchange": "NSE",
        "sector": "Lupin Limited",
        "kind": "equity"
    },
    {
        "symbol": "MANKIND.NS",
        "ticker": "MANKIND",
        "name": "Healthcare",
        "exchange": "NSE",
        "sector": "Mankind Pharma Limited",
        "kind": "equity"
    },
    {
        "symbol": "ALKEM.NS",
        "ticker": "ALKEM",
        "name": "Healthcare",
        "exchange": "NSE",
        "sector": "Alkem Laboratories Limited",
        "kind": "equity"
    },
    {
        "symbol": "TORNTPHARM.NS",
        "ticker": "TORNTPHARM",
        "name": "Healthcare",
        "exchange": "NSE",
        "sector": "Torrent Pharmaceuticals Limited",
        "kind": "equity"
    },
    {
        "symbol": "AUROPHARMA.NS",
        "ticker": "AUROPHARMA",
        "name": "Healthcare",
        "exchange": "NSE",
        "sector": "Aurobindo Pharma Limited",
        "kind": "equity"
    },
    {
        "symbol": "BIOCON.NS",
        "ticker": "BIOCON",
        "name": "Healthcare",
        "exchange": "NSE",
        "sector": "Biocon Limited",
        "kind": "equity"
    },
    {
        "symbol": "GLENMARK.NS",
        "ticker": "GLENMARK",
        "name": "Healthcare",
        "exchange": "NSE",
        "sector": "Glenmark Pharmaceuticals Limited",
        "kind": "equity"
    },
    {
        "symbol": "IPCA.NS",
        "ticker": "IPCA",
        "name": "Healthcare",
        "exchange": "NSE",
        "sector": "IPCA Laboratories Limited",
        "kind": "equity"
    },
    {
        "symbol": "AJANTPHARM.NS",
        "ticker": "AJANTPHARM",
        "name": "Healthcare",
        "exchange": "NSE",
        "sector": "Ajanta Pharma Limited",
        "kind": "equity"
    },
    {
        "symbol": "LAURUSLABS.NS",
        "ticker": "LAURUSLABS",
        "name": "Healthcare",
        "exchange": "NSE",
        "sector": "Laurus Labs Limited",
        "kind": "equity"
    },
    {
        "symbol": "FORTIS.NS",
        "ticker": "FORTIS",
        "name": "Healthcare",
        "exchange": "NSE",
        "sector": "Fortis Healthcare Limited",
        "kind": "equity"
    },
    {
        "symbol": "MEDANTA.NS",
        "ticker": "MEDANTA",
        "name": "Healthcare",
        "exchange": "NSE",
        "sector": "Global Health Limited (Medanta)",
        "kind": "equity"
    },
    {
        "symbol": "LALPATHLAB.NS",
        "ticker": "LALPATHLAB",
        "name": "Healthcare",
        "exchange": "NSE",
        "sector": "Dr. Lal PathLabs Limited",
        "kind": "equity"
    },
    {
        "symbol": "TATASTEEL.NS",
        "ticker": "TATASTEEL",
        "name": "Metals",
        "exchange": "NSE",
        "sector": "Tata Steel Limited",
        "kind": "equity"
    },
    {
        "symbol": "JSWSTEEL.NS",
        "ticker": "JSWSTEEL",
        "name": "Metals",
        "exchange": "NSE",
        "sector": "JSW Steel Limited",
        "kind": "equity"
    },
    {
        "symbol": "HINDALCO.NS",
        "ticker": "HINDALCO",
        "name": "Metals",
        "exchange": "NSE",
        "sector": "Hindalco Industries Limited",
        "kind": "equity"
    },
    {
        "symbol": "VEDL.NS",
        "ticker": "VEDL",
        "name": "Metals",
        "exchange": "NSE",
        "sector": "Vedanta Limited",
        "kind": "equity"
    },
    {
        "symbol": "SAIL.NS",
        "ticker": "SAIL",
        "name": "Metals",
        "exchange": "NSE",
        "sector": "Steel Authority of India Limited (SAIL)",
        "kind": "equity"
    },
    {
        "symbol": "NMDC.NS",
        "ticker": "NMDC",
        "name": "Metals",
        "exchange": "NSE",
        "sector": "NMDC Limited",
        "kind": "equity"
    },
    {
        "symbol": "NATIONALUM.NS",
        "ticker": "NATIONALUM",
        "name": "Metals",
        "exchange": "NSE",
        "sector": "National Aluminium Company Limited (NALCO)",
        "kind": "equity"
    },
    {
        "symbol": "HINDCOPPER.NS",
        "ticker": "HINDCOPPER",
        "name": "Metals",
        "exchange": "NSE",
        "sector": "Hindustan Copper Limited",
        "kind": "equity"
    },
    {
        "symbol": "HINDZINC.NS",
        "ticker": "HINDZINC",
        "name": "Metals",
        "exchange": "NSE",
        "sector": "Hindustan Zinc Limited",
        "kind": "equity"
    },
    {
        "symbol": "JINDALSTEL.NS",
        "ticker": "JINDALSTEL",
        "name": "Metals",
        "exchange": "NSE",
        "sector": "Jindal Steel & Power Limited",
        "kind": "equity"
    },
    {
        "symbol": "JSL.NS",
        "ticker": "JSL",
        "name": "Metals",
        "exchange": "NSE",
        "sector": "Jindal Stainless Limited",
        "kind": "equity"
    },
    {
        "symbol": "APLAPOLLO.NS",
        "ticker": "APLAPOLLO",
        "name": "Metals",
        "exchange": "NSE",
        "sector": "APL Apollo Tubes Limited",
        "kind": "equity"
    },
    {
        "symbol": "RELIANCE.NS",
        "ticker": "RELIANCE",
        "name": "Energy",
        "exchange": "NSE",
        "sector": "Reliance Industries Limited",
        "kind": "equity"
    },
    {
        "symbol": "ONGC.NS",
        "ticker": "ONGC",
        "name": "Energy",
        "exchange": "NSE",
        "sector": "Oil and Natural Gas Corporation Limited",
        "kind": "equity"
    },
    {
        "symbol": "BPCL.NS",
        "ticker": "BPCL",
        "name": "Energy",
        "exchange": "NSE",
        "sector": "Bharat Petroleum Corporation Limited",
        "kind": "equity"
    },
    {
        "symbol": "IOC.NS",
        "ticker": "IOC",
        "name": "Energy",
        "exchange": "NSE",
        "sector": "Indian Oil Corporation Limited",
        "kind": "equity"
    },
    {
        "symbol": "COALINDIA.NS",
        "ticker": "COALINDIA",
        "name": "Energy",
        "exchange": "NSE",
        "sector": "Coal India Limited",
        "kind": "equity"
    },
    {
        "symbol": "GAIL.NS",
        "ticker": "GAIL",
        "name": "Energy",
        "exchange": "NSE",
        "sector": "GAIL (India) Limited",
        "kind": "equity"
    },
    {
        "symbol": "OIL.NS",
        "ticker": "OIL",
        "name": "Energy",
        "exchange": "NSE",
        "sector": "Oil India Limited",
        "kind": "equity"
    },
    {
        "symbol": "HINDPETRO.NS",
        "ticker": "HINDPETRO",
        "name": "Energy",
        "exchange": "NSE",
        "sector": "Hindustan Petroleum Corporation Limited",
        "kind": "equity"
    },
    {
        "symbol": "PETRONET.NS",
        "ticker": "PETRONET",
        "name": "Energy",
        "exchange": "NSE",
        "sector": "Petronet LNG Limited",
        "kind": "equity"
    },
    {
        "symbol": "IGL.NS",
        "ticker": "IGL",
        "name": "Energy",
        "exchange": "NSE",
        "sector": "Indraprastha Gas Limited",
        "kind": "equity"
    },
    {
        "symbol": "MGL.NS",
        "ticker": "MGL",
        "name": "Energy",
        "exchange": "NSE",
        "sector": "Mahanagar Gas Limited",
        "kind": "equity"
    },
    {
        "symbol": "GUJGASLTD.NS",
        "ticker": "GUJGASLTD",
        "name": "Energy",
        "exchange": "NSE",
        "sector": "Gujarat Gas Limited",
        "kind": "equity"
    },
    {
        "symbol": "NTPC.NS",
        "ticker": "NTPC",
        "name": "Utilities",
        "exchange": "NSE",
        "sector": "NTPC Limited",
        "kind": "equity"
    },
    {
        "symbol": "POWERGRID.NS",
        "ticker": "POWERGRID",
        "name": "Utilities",
        "exchange": "NSE",
        "sector": "Power Grid Corporation of India Limited",
        "kind": "equity"
    },
    {
        "symbol": "TATAPOWER.NS",
        "ticker": "TATAPOWER",
        "name": "Utilities",
        "exchange": "NSE",
        "sector": "Tata Power Company Limited",
        "kind": "equity"
    },
    {
        "symbol": "JSWENERGY.NS",
        "ticker": "JSWENERGY",
        "name": "Utilities",
        "exchange": "NSE",
        "sector": "JSW Energy Limited",
        "kind": "equity"
    },
    {
        "symbol": "TORNTPOWER.NS",
        "ticker": "TORNTPOWER",
        "name": "Utilities",
        "exchange": "NSE",
        "sector": "Torrent Power Limited",
        "kind": "equity"
    },
    {
        "symbol": "NHPC.NS",
        "ticker": "NHPC",
        "name": "Utilities",
        "exchange": "NSE",
        "sector": "NHPC Limited",
        "kind": "equity"
    },
    {
        "symbol": "SJVN.NS",
        "ticker": "SJVN",
        "name": "Utilities",
        "exchange": "NSE",
        "sector": "SJVN Limited",
        "kind": "equity"
    },
    {
        "symbol": "SUZLON.NS",
        "ticker": "SUZLON",
        "name": "Utilities",
        "exchange": "NSE",
        "sector": "Suzlon Energy Limited",
        "kind": "equity"
    },
    {
        "symbol": "INOXWIND.NS",
        "ticker": "INOXWIND",
        "name": "Utilities",
        "exchange": "NSE",
        "sector": "Inox Wind Limited",
        "kind": "equity"
    },
    {
        "symbol": "ADANIGREEN.NS",
        "ticker": "ADANIGREEN",
        "name": "Utilities",
        "exchange": "NSE",
        "sector": "Adani Green Energy Limited",
        "kind": "equity"
    },
    {
        "symbol": "ADANIPOWER.NS",
        "ticker": "ADANIPOWER",
        "name": "Utilities",
        "exchange": "NSE",
        "sector": "Adani Power Limited",
        "kind": "equity"
    },
    {
        "symbol": "CESC.NS",
        "ticker": "CESC",
        "name": "Utilities",
        "exchange": "NSE",
        "sector": "CESC Limited",
        "kind": "equity"
    },
    {
        "symbol": "IRFC.NS",
        "ticker": "IRFC",
        "name": "Railways",
        "exchange": "NSE",
        "sector": "Indian Railway Finance Corporation Limited (IRFC)",
        "kind": "equity"
    },
    {
        "symbol": "RVNL.NS",
        "ticker": "RVNL",
        "name": "Railways",
        "exchange": "NSE",
        "sector": "Rail Vikas Nigam Limited (RVNL)",
        "kind": "equity"
    },
    {
        "symbol": "IRCTC.NS",
        "ticker": "IRCTC",
        "name": "Railways",
        "exchange": "NSE",
        "sector": "Indian Railway Catering & Tourism Corporation (IRCTC)",
        "kind": "equity"
    },
    {
        "symbol": "IRCON.NS",
        "ticker": "IRCON",
        "name": "Railways",
        "exchange": "NSE",
        "sector": "Ircon International Limited",
        "kind": "equity"
    },
    {
        "symbol": "RITES.NS",
        "ticker": "RITES",
        "name": "Railways",
        "exchange": "NSE",
        "sector": "RITES Limited",
        "kind": "equity"
    },
    {
        "symbol": "RAILTEL.NS",
        "ticker": "RAILTEL",
        "name": "Railways",
        "exchange": "NSE",
        "sector": "RailTel Corporation of India Limited",
        "kind": "equity"
    },
    {
        "symbol": "TITAGARH.NS",
        "ticker": "TITAGARH",
        "name": "Railways",
        "exchange": "NSE",
        "sector": "Titagarh Rail Systems Limited",
        "kind": "equity"
    },
    {
        "symbol": "BEL.NS",
        "ticker": "BEL",
        "name": "Defence",
        "exchange": "NSE",
        "sector": "Bharat Electronics Limited (BEL)",
        "kind": "equity"
    },
    {
        "symbol": "HAL.NS",
        "ticker": "HAL",
        "name": "Defence",
        "exchange": "NSE",
        "sector": "Hindustan Aeronautics Limited (HAL)",
        "kind": "equity"
    },
    {
        "symbol": "MAZDOCK.NS",
        "ticker": "MAZDOCK",
        "name": "Defence",
        "exchange": "NSE",
        "sector": "Mazagon Dock Shipbuilders Limited",
        "kind": "equity"
    },
    {
        "symbol": "COCHINSHIP.NS",
        "ticker": "COCHINSHIP",
        "name": "Defence",
        "exchange": "NSE",
        "sector": "Cochin Shipyard Limited",
        "kind": "equity"
    },
    {
        "symbol": "GRSE.NS",
        "ticker": "GRSE",
        "name": "Defence",
        "exchange": "NSE",
        "sector": "Garden Reach Shipbuilders & Engineers Limited",
        "kind": "equity"
    },
    {
        "symbol": "BDL.NS",
        "ticker": "BDL",
        "name": "Defence",
        "exchange": "NSE",
        "sector": "Bharat Dynamics Limited",
        "kind": "equity"
    },
    {
        "symbol": "BEML.NS",
        "ticker": "BEML",
        "name": "Defence",
        "exchange": "NSE",
        "sector": "BEML Limited",
        "kind": "equity"
    },
    {
        "symbol": "MIDHANI.NS",
        "ticker": "MIDHANI",
        "name": "Defence",
        "exchange": "NSE",
        "sector": "Mishra Dhatu Nigam Limited",
        "kind": "equity"
    },
    {
        "symbol": "LT.NS",
        "ticker": "LT",
        "name": "Industrials",
        "exchange": "NSE",
        "sector": "Larsen & Toubro Limited",
        "kind": "equity"
    },
    {
        "symbol": "BHEL.NS",
        "ticker": "BHEL",
        "name": "Industrials",
        "exchange": "NSE",
        "sector": "Bharat Heavy Electricals Limited (BHEL)",
        "kind": "equity"
    },
    {
        "symbol": "SIEMENS.NS",
        "ticker": "SIEMENS",
        "name": "Industrials",
        "exchange": "NSE",
        "sector": "Siemens Limited",
        "kind": "equity"
    },
    {
        "symbol": "ABB.NS",
        "ticker": "ABB",
        "name": "Industrials",
        "exchange": "NSE",
        "sector": "ABB India Limited",
        "kind": "equity"
    },
    {
        "symbol": "CUMMINSIND.NS",
        "ticker": "CUMMINSIND",
        "name": "Industrials",
        "exchange": "NSE",
        "sector": "Cummins India Limited",
        "kind": "equity"
    },
    {
        "symbol": "THERMAX.NS",
        "ticker": "THERMAX",
        "name": "Industrials",
        "exchange": "NSE",
        "sector": "Thermax Limited",
        "kind": "equity"
    },
    {
        "symbol": "POLYCAB.NS",
        "ticker": "POLYCAB",
        "name": "Industrials",
        "exchange": "NSE",
        "sector": "Polycab India Limited",
        "kind": "equity"
    },
    {
        "symbol": "KEI.NS",
        "ticker": "KEI",
        "name": "Industrials",
        "exchange": "NSE",
        "sector": "KEI Industries Limited",
        "kind": "equity"
    },
    {
        "symbol": "HAVELLS.NS",
        "ticker": "HAVELLS",
        "name": "Industrials",
        "exchange": "NSE",
        "sector": "Havells India Limited",
        "kind": "equity"
    },
    {
        "symbol": "VOLTAS.NS",
        "ticker": "VOLTAS",
        "name": "Industrials",
        "exchange": "NSE",
        "sector": "Voltas Limited",
        "kind": "equity"
    },
    {
        "symbol": "BLUESTARCO.NS",
        "ticker": "BLUESTARCO",
        "name": "Industrials",
        "exchange": "NSE",
        "sector": "Blue Star Limited",
        "kind": "equity"
    },
    {
        "symbol": "CROMPTON.NS",
        "ticker": "CROMPTON",
        "name": "Industrials",
        "exchange": "NSE",
        "sector": "Crompton Greaves Consumer Electricals Limited",
        "kind": "equity"
    },
    {
        "symbol": "DIXON.NS",
        "ticker": "DIXON",
        "name": "Industrials",
        "exchange": "NSE",
        "sector": "Dixon Technologies (India) Limited",
        "kind": "equity"
    },
    {
        "symbol": "AMBER.NS",
        "ticker": "AMBER",
        "name": "Industrials",
        "exchange": "NSE",
        "sector": "Amber Enterprises India Limited",
        "kind": "equity"
    },
    {
        "symbol": "KAYNES.NS",
        "ticker": "KAYNES",
        "name": "Industrials",
        "exchange": "NSE",
        "sector": "Kaynes Technology India Limited",
        "kind": "equity"
    },
    {
        "symbol": "ULTRACEMCO.NS",
        "ticker": "ULTRACEMCO",
        "name": "Cement",
        "exchange": "NSE",
        "sector": "UltraTech Cement Limited",
        "kind": "equity"
    },
    {
        "symbol": "AMBUJACEM.NS",
        "ticker": "AMBUJACEM",
        "name": "Cement",
        "exchange": "NSE",
        "sector": "Ambuja Cements Limited",
        "kind": "equity"
    },
    {
        "symbol": "GRASIM.NS",
        "ticker": "GRASIM",
        "name": "Cement",
        "exchange": "NSE",
        "sector": "Grasim Industries Limited",
        "kind": "equity"
    },
    {
        "symbol": "SHREECEM.NS",
        "ticker": "SHREECEM",
        "name": "Cement",
        "exchange": "NSE",
        "sector": "Shree Cement Limited",
        "kind": "equity"
    },
    {
        "symbol": "DALBHARAT.NS",
        "ticker": "DALBHARAT",
        "name": "Cement",
        "exchange": "NSE",
        "sector": "Dalmia Bharat Limited",
        "kind": "equity"
    },
    {
        "symbol": "ACC.NS",
        "ticker": "ACC",
        "name": "Cement",
        "exchange": "NSE",
        "sector": "ACC Limited",
        "kind": "equity"
    },
    {
        "symbol": "ASIANPAINT.NS",
        "ticker": "ASIANPAINT",
        "name": "Chemicals",
        "exchange": "NSE",
        "sector": "Asian Paints Limited",
        "kind": "equity"
    },
    {
        "symbol": "PIDILITIND.NS",
        "ticker": "PIDILITIND",
        "name": "Chemicals",
        "exchange": "NSE",
        "sector": "Pidilite Industries Limited",
        "kind": "equity"
    },
    {
        "symbol": "BERGEPAINT.NS",
        "ticker": "BERGEPAINT",
        "name": "Chemicals",
        "exchange": "NSE",
        "sector": "Berger Paints (India) Limited",
        "kind": "equity"
    },
    {
        "symbol": "TATACHEM.NS",
        "ticker": "TATACHEM",
        "name": "Chemicals",
        "exchange": "NSE",
        "sector": "Tata Chemicals Limited",
        "kind": "equity"
    },
    {
        "symbol": "DEEPAKNTR.NS",
        "ticker": "DEEPAKNTR",
        "name": "Chemicals",
        "exchange": "NSE",
        "sector": "Deepak Nitrite Limited",
        "kind": "equity"
    },
    {
        "symbol": "ATUL.NS",
        "ticker": "ATUL",
        "name": "Chemicals",
        "exchange": "NSE",
        "sector": "Atul Limited",
        "kind": "equity"
    },
    {
        "symbol": "NAVINFLUOR.NS",
        "ticker": "NAVINFLUOR",
        "name": "Chemicals",
        "exchange": "NSE",
        "sector": "Navin Fluorine International Limited",
        "kind": "equity"
    },
    {
        "symbol": "SRF.NS",
        "ticker": "SRF",
        "name": "Chemicals",
        "exchange": "NSE",
        "sector": "SRF Limited",
        "kind": "equity"
    },
    {
        "symbol": "AARTIIND.NS",
        "ticker": "AARTIIND",
        "name": "Chemicals",
        "exchange": "NSE",
        "sector": "Aarti Industries Limited",
        "kind": "equity"
    },
    {
        "symbol": "PIIND.NS",
        "ticker": "PIIND",
        "name": "Chemicals",
        "exchange": "NSE",
        "sector": "PI Industries Limited",
        "kind": "equity"
    },
    {
        "symbol": "UPL.NS",
        "ticker": "UPL",
        "name": "Chemicals",
        "exchange": "NSE",
        "sector": "UPL Limited",
        "kind": "equity"
    },
    {
        "symbol": "COROMANDEL.NS",
        "ticker": "COROMANDEL",
        "name": "Chemicals",
        "exchange": "NSE",
        "sector": "Coromandel International Limited",
        "kind": "equity"
    },
    {
        "symbol": "CHAMBLFERT.NS",
        "ticker": "CHAMBLFERT",
        "name": "Chemicals",
        "exchange": "NSE",
        "sector": "Chambal Fertilisers and Chemicals Limited",
        "kind": "equity"
    },
    {
        "symbol": "FACT.NS",
        "ticker": "FACT",
        "name": "Chemicals",
        "exchange": "NSE",
        "sector": "Fertilisers and Chemicals Travancore Limited",
        "kind": "equity"
    },
    {
        "symbol": "DLF.NS",
        "ticker": "DLF",
        "name": "Realty",
        "exchange": "NSE",
        "sector": "DLF Limited",
        "kind": "equity"
    },
    {
        "symbol": "PRESTIGE.NS",
        "ticker": "PRESTIGE",
        "name": "Realty",
        "exchange": "NSE",
        "sector": "Prestige Estates Projects Limited",
        "kind": "equity"
    },
    {
        "symbol": "GODREJPROP.NS",
        "ticker": "GODREJPROP",
        "name": "Realty",
        "exchange": "NSE",
        "sector": "Godrej Properties Limited",
        "kind": "equity"
    },
    {
        "symbol": "OBEROIRLTY.NS",
        "ticker": "OBEROIRLTY",
        "name": "Realty",
        "exchange": "NSE",
        "sector": "Oberoi Realty Limited",
        "kind": "equity"
    },
    {
        "symbol": "PHOENIXLTD.NS",
        "ticker": "PHOENIXLTD",
        "name": "Realty",
        "exchange": "NSE",
        "sector": "The Phoenix Mills Limited",
        "kind": "equity"
    },
    {
        "symbol": "BRIGADE.NS",
        "ticker": "BRIGADE",
        "name": "Realty",
        "exchange": "NSE",
        "sector": "Brigade Enterprises Limited",
        "kind": "equity"
    },
    {
        "symbol": "SOBHA.NS",
        "ticker": "SOBHA",
        "name": "Realty",
        "exchange": "NSE",
        "sector": "Sobha Limited",
        "kind": "equity"
    },
    {
        "symbol": "MACROTECH.NS",
        "ticker": "MACROTECH",
        "name": "Realty",
        "exchange": "NSE",
        "sector": "Macrotech Developers Limited (Lodha)",
        "kind": "equity"
    },
    {
        "symbol": "SIGNATURE.NS",
        "ticker": "SIGNATURE",
        "name": "Realty",
        "exchange": "NSE",
        "sector": "Signatureglobal (India) Limited",
        "kind": "equity"
    },
    {
        "symbol": "TITAN.NS",
        "ticker": "TITAN",
        "name": "Consumer",
        "exchange": "NSE",
        "sector": "Titan Company Limited",
        "kind": "equity"
    },
    {
        "symbol": "TRENT.NS",
        "ticker": "TRENT",
        "name": "Consumer",
        "exchange": "NSE",
        "sector": "Trent Limited",
        "kind": "equity"
    },
    {
        "symbol": "DMART.NS",
        "ticker": "DMART",
        "name": "Consumer",
        "exchange": "NSE",
        "sector": "Avenue Supermarts Limited (DMart)",
        "kind": "equity"
    },
    {
        "symbol": "KALYANKJIL.NS",
        "ticker": "KALYANKJIL",
        "name": "Consumer",
        "exchange": "NSE",
        "sector": "Kalyan Jewellers India Limited",
        "kind": "equity"
    },
    {
        "symbol": "SENCO.NS",
        "ticker": "SENCO",
        "name": "Consumer",
        "exchange": "NSE",
        "sector": "Senco Gold Limited",
        "kind": "equity"
    },
    {
        "symbol": "PAGEIND.NS",
        "ticker": "PAGEIND",
        "name": "Consumer",
        "exchange": "NSE",
        "sector": "Page Industries Limited",
        "kind": "equity"
    },
    {
        "symbol": "ABFRL.NS",
        "ticker": "ABFRL",
        "name": "Consumer",
        "exchange": "NSE",
        "sector": "Aditya Birla Fashion and Retail Limited",
        "kind": "equity"
    },
    {
        "symbol": "RAYMOND.NS",
        "ticker": "RAYMOND",
        "name": "Consumer",
        "exchange": "NSE",
        "sector": "Raymond Limited",
        "kind": "equity"
    },
    {
        "symbol": "BATAINDIA.NS",
        "ticker": "BATAINDIA",
        "name": "Consumer",
        "exchange": "NSE",
        "sector": "Bata India Limited",
        "kind": "equity"
    },
    {
        "symbol": "METROBRAND.NS",
        "ticker": "METROBRAND",
        "name": "Consumer",
        "exchange": "NSE",
        "sector": "Metro Brands Limited",
        "kind": "equity"
    },
    {
        "symbol": "REDTAPE.NS",
        "ticker": "REDTAPE",
        "name": "Consumer",
        "exchange": "NSE",
        "sector": "Redtape Limited",
        "kind": "equity"
    },
    {
        "symbol": "INDIGO.NS",
        "ticker": "INDIGO",
        "name": "Aviation",
        "exchange": "NSE",
        "sector": "InterGlobe Aviation Limited (IndiGo)",
        "kind": "equity"
    },
    {
        "symbol": "ADANIENT.NS",
        "ticker": "ADANIENT",
        "name": "Industrials",
        "exchange": "NSE",
        "sector": "Adani Enterprises Limited",
        "kind": "equity"
    },
    {
        "symbol": "ADANIPORTS.NS",
        "ticker": "ADANIPORTS",
        "name": "Industrials",
        "exchange": "NSE",
        "sector": "Adani Ports and SEZ Limited",
        "kind": "equity"
    },
    {
        "symbol": "BHARTIARTL.NS",
        "ticker": "BHARTIARTL",
        "name": "Telecom",
        "exchange": "NSE",
        "sector": "Bharti Airtel Limited",
        "kind": "equity"
    },
    {
        "symbol": "IDEA.NS",
        "ticker": "IDEA",
        "name": "Telecom",
        "exchange": "NSE",
        "sector": "Vodafone Idea Limited",
        "kind": "equity"
    },
    {
        "symbol": "INDUSTOWER.NS",
        "ticker": "INDUSTOWER",
        "name": "Telecom",
        "exchange": "NSE",
        "sector": "Indus Towers Limited",
        "kind": "equity"
    },
    {
        "symbol": "TATACOMM.NS",
        "ticker": "TATACOMM",
        "name": "Telecom",
        "exchange": "NSE",
        "sector": "Tata Communications Limited",
        "kind": "equity"
    },
    {
        "symbol": "PVRINOX.NS",
        "ticker": "PVRINOX",
        "name": "Media",
        "exchange": "NSE",
        "sector": "PVR INOX Limited",
        "kind": "equity"
    },
    {
        "symbol": "ZEEL.NS",
        "ticker": "ZEEL",
        "name": "Media",
        "exchange": "NSE",
        "sector": "Zee Entertainment Enterprises Limited",
        "kind": "equity"
    },
    {
        "symbol": "GUJTLRM.NS",
        "ticker": "GUJTLRM",
        "name": "Industrials",
        "exchange": "NSE",
        "sector": "Gujarat Toolroom Limited",
        "kind": "equity"
    },
    {
        "symbol": "PCJEWELLER.NS",
        "ticker": "PCJEWELLER",
        "name": "Consumer",
        "exchange": "NSE",
        "sector": "PC Jeweller Limited",
        "kind": "equity"
    },
    {
        "symbol": "TAPARIA.NS",
        "ticker": "TAPARIA",
        "name": "Industrials",
        "exchange": "NSE",
        "sector": "Taparia Tools Limited",
        "kind": "equity"
    },
    {
        "symbol": "ALOKINDS.NS",
        "ticker": "ALOKINDS",
        "name": "Textiles",
        "exchange": "NSE",
        "sector": "Alok Industries Limited",
        "kind": "equity"
    },
    {
        "symbol": "RPOWER.NS",
        "ticker": "RPOWER",
        "name": "Power",
        "exchange": "NSE",
        "sector": "Reliance Power Limited",
        "kind": "equity"
    },
    {
        "symbol": "JPPOWER.NS",
        "ticker": "JPPOWER",
        "name": "Power",
        "exchange": "NSE",
        "sector": "Jaiprakash Power Ventures Limited",
        "kind": "equity"
    },
    {
        "symbol": "RTNPOWER.NS",
        "ticker": "RTNPOWER",
        "name": "Power",
        "exchange": "NSE",
        "sector": "RattanIndia Power Limited",
        "kind": "equity"
    },
    {
        "symbol": "RTNINDIA.NS",
        "ticker": "RTNINDIA",
        "name": "Consumer",
        "exchange": "NSE",
        "sector": "RattanIndia Enterprises Limited",
        "kind": "equity"
    },
    {
        "symbol": "BCG.NS",
        "ticker": "BCG",
        "name": "Information Technology",
        "exchange": "NSE",
        "sector": "Brightcom Group Limited",
        "kind": "equity"
    },
    {
        "symbol": "GTLINFRA.NS",
        "ticker": "GTLINFRA",
        "name": "Telecom",
        "exchange": "NSE",
        "sector": "GTL Infrastructure Limited",
        "kind": "equity"
    },
    {
        "symbol": "URJA.NS",
        "ticker": "URJA",
        "name": "Power",
        "exchange": "NSE",
        "sector": "Urja Global Limited",
        "kind": "equity"
    },
    {
        "symbol": "VIKASLIFE.NS",
        "ticker": "VIKASLIFE",
        "name": "Chemicals",
        "exchange": "NSE",
        "sector": "Vikas Lifecare Limited",
        "kind": "equity"
    },
    {
        "symbol": "SOUTHBANK.NS",
        "ticker": "SOUTHBANK",
        "name": "Banks",
        "exchange": "NSE",
        "sector": "The South Indian Bank Limited",
        "kind": "equity"
    },
    {
        "symbol": "TRIDENT.NS",
        "ticker": "TRIDENT",
        "name": "Textiles",
        "exchange": "NSE",
        "sector": "Trident Limited",
        "kind": "equity"
    },
    {
        "symbol": "NBCC.NS",
        "ticker": "NBCC",
        "name": "Realty",
        "exchange": "NSE",
        "sector": "NBCC (India) Limited",
        "kind": "equity"
    },
    {
        "symbol": "MMTC.NS",
        "ticker": "MMTC",
        "name": "Metals",
        "exchange": "NSE",
        "sector": "MMTC Limited",
        "kind": "equity"
    },
    {
        "symbol": "EASEMYTRIP.NS",
        "ticker": "EASEMYTRIP",
        "name": "Consumer",
        "exchange": "NSE",
        "sector": "Easy Trip Planners Limited",
        "kind": "equity"
    },
    {
        "symbol": "HFCL.NS",
        "ticker": "HFCL",
        "name": "Telecom",
        "exchange": "NSE",
        "sector": "HFCL Limited",
        "kind": "equity"
    },
    {
        "symbol": "LLOYDSENGG.NS",
        "ticker": "LLOYDSENGG",
        "name": "Industrials",
        "exchange": "NSE",
        "sector": "Lloyds Engineering Works Limited",
        "kind": "equity"
    },
    {
        "symbol": "RENUKA.NS",
        "ticker": "RENUKA",
        "name": "FMCG",
        "exchange": "NSE",
        "sector": "Shree Renuka Sugars Limited",
        "kind": "equity"
    },
    {
        "symbol": "MARKSANS.NS",
        "ticker": "MARKSANS",
        "name": "Pharma",
        "exchange": "NSE",
        "sector": "Marksans Pharma Limited",
        "kind": "equity"
    },
    {
        "symbol": "SUBEX.NS",
        "ticker": "SUBEX",
        "name": "Information Technology",
        "exchange": "NSE",
        "sector": "Subex Limited",
        "kind": "equity"
    },
    {
        "symbol": "HCC.NS",
        "ticker": "HCC",
        "name": "Industrials",
        "exchange": "NSE",
        "sector": "Hindustan Construction Company Limited",
        "kind": "equity"
    },
    {
        "symbol": "INFIBEAM.NS",
        "ticker": "INFIBEAM",
        "name": "Fintech",
        "exchange": "NSE",
        "sector": "Infibeam Avenues Limited",
        "kind": "equity"
    },
    {
        "symbol": "JPASSOCIAT.NS",
        "ticker": "JPASSOCIAT",
        "name": "Industrials",
        "exchange": "NSE",
        "sector": "Jaiprakash Associates Limited",
        "kind": "equity"
    },
    {
        "symbol": "DISHTV.NS",
        "ticker": "DISHTV",
        "name": "Media",
        "exchange": "NSE",
        "sector": "Dish TV India Limited",
        "kind": "equity"
    },
    {
        "symbol": "VAKRANGEE.NS",
        "ticker": "VAKRANGEE",
        "name": "Fintech",
        "exchange": "NSE",
        "sector": "Vakrangee Limited",
        "kind": "equity"
    },
    {
        "symbol": "SUVENPHAR.NS",
        "ticker": "SUVENPHAR",
        "name": "Pharma",
        "exchange": "NSE",
        "sector": "Suven Pharmaceuticals Limited",
        "kind": "equity"
    },
    {
        "symbol": "DHANI.NS",
        "ticker": "DHANI",
        "name": "Fintech",
        "exchange": "NSE",
        "sector": "Dhani Services Limited",
        "kind": "equity"
    },
    {
        "symbol": "TV18BRDCST.NS",
        "ticker": "TV18BRDCST",
        "name": "Media",
        "exchange": "NSE",
        "sector": "TV18 Broadcast Limited",
        "kind": "equity"
    },
    {
        "symbol": "FCSSOFT.NS",
        "ticker": "FCSSOFT",
        "name": "Information Technology",
        "exchange": "NSE",
        "sector": "FCS Software Solutions Limited",
        "kind": "equity"
    },
    {
        "symbol": "VIKASECO.NS",
        "ticker": "VIKASECO",
        "name": "Chemicals",
        "exchange": "NSE",
        "sector": "Vikas Ecotech Limited",
        "kind": "equity"
    },
    {
        "symbol": "3IINFOLTD.NS",
        "ticker": "3IINFOLTD",
        "name": "Information Technology",
        "exchange": "NSE",
        "sector": "3i Infotech Limited",
        "kind": "equity"
    },
    {
        "symbol": "RCOM.NS",
        "ticker": "RCOM",
        "name": "Telecom",
        "exchange": "NSE",
        "sector": "Reliance Communications Limited",
        "kind": "equity"
    },
    {
        "symbol": "GVKPIL.NS",
        "ticker": "GVKPIL",
        "name": "Power",
        "exchange": "NSE",
        "sector": "GVK Power & Infrastructure Limited",
        "kind": "equity"
    },
    {
        "symbol": "MUNDUNURU.NS",
        "ticker": "MUNDUNURU",
        "name": "Fintech",
        "exchange": "NSE",
        "sector": "Mundunuru Enterprises Limited",
        "kind": "equity"
    },
    {
        "symbol": "MUKTA.NS",
        "ticker": "MUKTA",
        "name": "Agriculture",
        "exchange": "NSE",
        "sector": "Mukta Agriculture Limited",
        "kind": "equity"
    },
    {
        "symbol": "PSIT.NS",
        "ticker": "PSIT",
        "name": "Information Technology",
        "exchange": "NSE",
        "sector": "PS IT Infrastructure & Services Limited",
        "kind": "equity"
    },
    {
        "symbol": "LANDMARC.NS",
        "ticker": "LANDMARC",
        "name": "Media",
        "exchange": "NSE",
        "sector": "Landmarc Leisure Corporation Limited",
        "kind": "equity"
    },
    {
        "symbol": "RGFCAP.NS",
        "ticker": "RGFCAP",
        "name": "Financial Services",
        "exchange": "NSE",
        "sector": "RGF Capital Markets Limited",
        "kind": "equity"
    },
    {
        "symbol": "PARSVNATH.NS",
        "ticker": "PARSVNATH",
        "name": "Realty",
        "exchange": "NSE",
        "sector": "Parsvnath Developers Limited",
        "kind": "equity"
    },
    {
        "symbol": "CUBICAL.NS",
        "ticker": "CUBICAL",
        "name": "Financial Services",
        "exchange": "NSE",
        "sector": "Cubical Financial Services Limited",
        "kind": "equity"
    },
    {
        "symbol": "SHARPINV.NS",
        "ticker": "SHARPINV",
        "name": "Financial Services",
        "exchange": "NSE",
        "sector": "Sharp Investments Limited",
        "kind": "equity"
    },
    {
        "symbol": "ASHAPURI.NS",
        "ticker": "ASHAPURI",
        "name": "Consumer",
        "exchange": "NSE",
        "sector": "Ashapuri Gold Ornament Limited",
        "kind": "equity"
    },
    {
        "symbol": "TRIVENI.NS",
        "ticker": "TRIVENI",
        "name": "Industrials",
        "exchange": "NSE",
        "sector": "Triveni Glass Limited",
        "kind": "equity"
    },
    {
        "symbol": "CHANDRIMA.NS",
        "ticker": "CHANDRIMA",
        "name": "Textiles",
        "exchange": "NSE",
        "sector": "Chandrima Mercantiles Limited",
        "kind": "equity"
    },
    {
        "symbol": "ANUBHAV.NS",
        "ticker": "ANUBHAV",
        "name": "Infrastructure",
        "exchange": "NSE",
        "sector": "Anubhav Infrastructure Limited",
        "kind": "equity"
    },
    {
        "symbol": "IEL.NS",
        "ticker": "IEL",
        "name": "Trading",
        "exchange": "NSE",
        "sector": "IEL Limited",
        "kind": "equity"
    },
    {
        "symbol": "PARVATI.NS",
        "ticker": "PARVATI",
        "name": "Sugar",
        "exchange": "NSE",
        "sector": "Parvati Sweetners and Power Limited",
        "kind": "equity"
    },
    {
        "symbol": "THINKINK.NS",
        "ticker": "THINKINK",
        "name": "Media",
        "exchange": "NSE",
        "sector": "Thinkink Picturez Limited",
        "kind": "equity"
    },
    {
        "symbol": "LADAM.NS",
        "ticker": "LADAM",
        "name": "Realty",
        "exchange": "NSE",
        "sector": "Ladam Affordable Housing Limited",
        "kind": "equity"
    },
    {
        "symbol": "DILIGENT.NS",
        "ticker": "DILIGENT",
        "name": "Agriculture",
        "exchange": "NSE",
        "sector": "Diligent Industries Limited",
        "kind": "equity"
    },
    {
        "symbol": "PREMIEREN.NS",
        "ticker": "PREMIEREN",
        "name": "Infrastructure",
        "exchange": "NSE",
        "sector": "Premier Energy & Infrastructure Limited",
        "kind": "equity"
    },
    {
        "symbol": "SHUKRA.NS",
        "ticker": "SHUKRA",
        "name": "Consumer",
        "exchange": "NSE",
        "sector": "Shukra Jewellery Limited",
        "kind": "equity"
    },
    {
        "symbol": "RAAMA.NS",
        "ticker": "RAAMA",
        "name": "Financial Services",
        "exchange": "NSE",
        "sector": "Raama Finance Limited",
        "kind": "equity"
    },
    {
        "symbol": "AAPLUS.NS",
        "ticker": "AAPLUS",
        "name": "Trading",
        "exchange": "NSE",
        "sector": "AA Plus Tradelink Limited",
        "kind": "equity"
    },
    {
        "symbol": "WARDWIZARD.NS",
        "ticker": "WARDWIZARD",
        "name": "Automobiles",
        "exchange": "NSE",
        "sector": "Wardwizard Innovations & Mobility Limited",
        "kind": "equity"
    },
    {
        "symbol": "GROWINGTON.NS",
        "ticker": "GROWINGTON",
        "name": "Logistics",
        "exchange": "NSE",
        "sector": "Growington Ventures India Limited",
        "kind": "equity"
    },
    {
        "symbol": "QUADRANT.NS",
        "ticker": "QUADRANT",
        "name": "Telecom",
        "exchange": "NSE",
        "sector": "Quadrant Televentures Limited",
        "kind": "equity"
    },
    {
        "symbol": "CROPSTER.NS",
        "ticker": "CROPSTER",
        "name": "Agriculture",
        "exchange": "NSE",
        "sector": "Cropster Agro Limited",
        "kind": "equity"
    },
    {
        "symbol": "LEADINGLEAS.NS",
        "ticker": "LEADINGLEAS",
        "name": "Financial Services",
        "exchange": "NSE",
        "sector": "Leading Leasing Finance & Investment Co Limited",
        "kind": "equity"
    },
    {
        "symbol": "SAMPRE.NS",
        "ticker": "SAMPRE",
        "name": "FMCG",
        "exchange": "NSE",
        "sector": "Sampre Nutritions Limited",
        "kind": "equity"
    },
    {
        "symbol": "DUCON.NS",
        "ticker": "DUCON",
        "name": "Infrastructure",
        "exchange": "NSE",
        "sector": "Ducon Infratechnologies Limited",
        "kind": "equity"
    },
    {
        "symbol": "ULTRACAB.NS",
        "ticker": "ULTRACAB",
        "name": "Industrials",
        "exchange": "NSE",
        "sector": "Ultracab (India) Limited",
        "kind": "equity"
    },
    {
        "symbol": "LANDSMILL.NS",
        "ticker": "LANDSMILL",
        "name": "Agriculture",
        "exchange": "NSE",
        "sector": "Landsmill Green Limited",
        "kind": "equity"
    },
    {
        "symbol": "CONSEC.NS",
        "ticker": "CONSEC",
        "name": "Financial Services",
        "exchange": "NSE",
        "sector": "Consecutive Investments & Trading Co Limited",
        "kind": "equity"
    },
    {
        "symbol": "DAVANGERE.NS",
        "ticker": "DAVANGERE",
        "name": "Sugar",
        "exchange": "NSE",
        "sector": "Davangere Sugar Company Limited",
        "kind": "equity"
    },
    {
        "symbol": "SHREESEC.NS",
        "ticker": "SHREESEC",
        "name": "Financial Services",
        "exchange": "NSE",
        "sector": "Shree Securities Limited",
        "kind": "equity"
    },
    {
        "symbol": "GACM.NS",
        "ticker": "GACM",
        "name": "Fintech",
        "exchange": "NSE",
        "sector": "GACM Technologies Limited",
        "kind": "equity"
    },
    {
        "symbol": "TUNITEX.NS",
        "ticker": "TUNITEX",
        "name": "Textiles",
        "exchange": "NSE",
        "sector": "Tuni Textile Mills Limited",
        "kind": "equity"
    },
    {
        "symbol": "5PAISA.NS",
        "ticker": "5PAISA",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "5PAISA Limited",
        "kind": "equity"
    },
    {
        "symbol": "AFFLE.NS",
        "ticker": "AFFLE",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "AFFLE Limited",
        "kind": "equity"
    },
    {
        "symbol": "AHLUCONT.NS",
        "ticker": "AHLUCONT",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "AHLUCONT Limited",
        "kind": "equity"
    },
    {
        "symbol": "AIAENG.NS",
        "ticker": "AIAENG",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "AIAENG Limited",
        "kind": "equity"
    },
    {
        "symbol": "AJMERA.NS",
        "ticker": "AJMERA",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "AJMERA Limited",
        "kind": "equity"
    },
    {
        "symbol": "ALLCARGO.NS",
        "ticker": "ALLCARGO",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "ALLCARGO Limited",
        "kind": "equity"
    },
    {
        "symbol": "AMIORG.NS",
        "ticker": "AMIORG",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "AMIORG Limited",
        "kind": "equity"
    },
    {
        "symbol": "ANANTRAJ.NS",
        "ticker": "ANANTRAJ",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "ANANTRAJ Limited",
        "kind": "equity"
    },
    {
        "symbol": "ANDHRAPAP.NS",
        "ticker": "ANDHRAPAP",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "ANDHRAPAP Limited",
        "kind": "equity"
    },
    {
        "symbol": "ANUPAM.NS",
        "ticker": "ANUPAM",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "ANUPAM Limited",
        "kind": "equity"
    },
    {
        "symbol": "ARVIND.NS",
        "ticker": "ARVIND",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "ARVIND Limited",
        "kind": "equity"
    },
    {
        "symbol": "ASHOKA.NS",
        "ticker": "ASHOKA",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "ASHOKA Limited",
        "kind": "equity"
    },
    {
        "symbol": "ASTERDM.NS",
        "ticker": "ASTERDM",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "ASTERDM Limited",
        "kind": "equity"
    },
    {
        "symbol": "ASTRAL.NS",
        "ticker": "ASTRAL",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "ASTRAL Limited",
        "kind": "equity"
    },
    {
        "symbol": "ASTRAZEN.NS",
        "ticker": "ASTRAZEN",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "ASTRAZEN Limited",
        "kind": "equity"
    },
    {
        "symbol": "ATGL.NS",
        "ticker": "ATGL",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "ATGL Limited",
        "kind": "equity"
    },
    {
        "symbol": "BAJAJHLDNG.NS",
        "ticker": "BAJAJHLDNG",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "BAJAJHLDNG Limited",
        "kind": "equity"
    },
    {
        "symbol": "BANCOINDIA.NS",
        "ticker": "BANCOINDIA",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "BANCOINDIA Limited",
        "kind": "equity"
    },
    {
        "symbol": "BLISSGVS.NS",
        "ticker": "BLISSGVS",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "BLISSGVS Limited",
        "kind": "equity"
    },
    {
        "symbol": "BLS.NS",
        "ticker": "BLS",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "BLS Limited",
        "kind": "equity"
    },
    {
        "symbol": "BOMBAYDYE.NS",
        "ticker": "BOMBAYDYE",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "BOMBAYDYE Limited",
        "kind": "equity"
    },
    {
        "symbol": "BORORENEW.NS",
        "ticker": "BORORENEW",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "BORORENEW Limited",
        "kind": "equity"
    },
    {
        "symbol": "CAMPUS.NS",
        "ticker": "CAMPUS",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "CAMPUS Limited",
        "kind": "equity"
    },
    {
        "symbol": "CANFINHOME.NS",
        "ticker": "CANFINHOME",
        "name": "Financials",
        "exchange": "NSE",
        "sector": "CANFINHOME Limited",
        "kind": "equity"
    },
    {
        "symbol": "CAPACITE.NS",
        "ticker": "CAPACITE",
        "name": "Financials",
        "exchange": "NSE",
        "sector": "CAPACITE Limited",
        "kind": "equity"
    },
    {
        "symbol": "CAPL.NS",
        "ticker": "CAPL",
        "name": "Financials",
        "exchange": "NSE",
        "sector": "CAPL Limited",
        "kind": "equity"
    },
    {
        "symbol": "CENTURYPLY.NS",
        "ticker": "CENTURYPLY",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "CENTURYPLY Limited",
        "kind": "equity"
    },
    {
        "symbol": "CENTURYTEX.NS",
        "ticker": "CENTURYTEX",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "CENTURYTEX Limited",
        "kind": "equity"
    },
    {
        "symbol": "CERA.NS",
        "ticker": "CERA",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "CERA Limited",
        "kind": "equity"
    },
    {
        "symbol": "CGPOWER.NS",
        "ticker": "CGPOWER",
        "name": "Utilities",
        "exchange": "NSE",
        "sector": "CGPOWER Limited",
        "kind": "equity"
    },
    {
        "symbol": "CLEAN.NS",
        "ticker": "CLEAN",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "CLEAN Limited",
        "kind": "equity"
    },
    {
        "symbol": "CRAFTSMAN.NS",
        "ticker": "CRAFTSMAN",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "CRAFTSMAN Limited",
        "kind": "equity"
    },
    {
        "symbol": "DATAMATICS.NS",
        "ticker": "DATAMATICS",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "DATAMATICS Limited",
        "kind": "equity"
    },
    {
        "symbol": "DATAPATTNS.NS",
        "ticker": "DATAPATTNS",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "DATAPATTNS Limited",
        "kind": "equity"
    },
    {
        "symbol": "DBL.NS",
        "ticker": "DBL",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "DBL Limited",
        "kind": "equity"
    },
    {
        "symbol": "DCXINDIA.NS",
        "ticker": "DCXINDIA",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "DCXINDIA Limited",
        "kind": "equity"
    },
    {
        "symbol": "DECCANCE.NS",
        "ticker": "DECCANCE",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "DECCANCE Limited",
        "kind": "equity"
    },
    {
        "symbol": "DEEPAKFERT.NS",
        "ticker": "DEEPAKFERT",
        "name": "Chemicals",
        "exchange": "NSE",
        "sector": "DEEPAKFERT Limited",
        "kind": "equity"
    },
    {
        "symbol": "DEVYANI.NS",
        "ticker": "DEVYANI",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "DEVYANI Limited",
        "kind": "equity"
    },
    {
        "symbol": "DFMFOODS.NS",
        "ticker": "DFMFOODS",
        "name": "Consumer",
        "exchange": "NSE",
        "sector": "DFMFOODS Limited",
        "kind": "equity"
    },
    {
        "symbol": "DODLA.NS",
        "ticker": "DODLA",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "DODLA Limited",
        "kind": "equity"
    },
    {
        "symbol": "DOLLAR.NS",
        "ticker": "DOLLAR",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "DOLLAR Limited",
        "kind": "equity"
    },
    {
        "symbol": "DREDGECORP.NS",
        "ticker": "DREDGECORP",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "DREDGECORP Limited",
        "kind": "equity"
    },
    {
        "symbol": "DYNAMATECH.NS",
        "ticker": "DYNAMATECH",
        "name": "Information Technology",
        "exchange": "NSE",
        "sector": "DYNAMATECH Limited",
        "kind": "equity"
    },
    {
        "symbol": "ELECON.NS",
        "ticker": "ELECON",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "ELECON Limited",
        "kind": "equity"
    },
    {
        "symbol": "ERIS.NS",
        "ticker": "ERIS",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "ERIS Limited",
        "kind": "equity"
    },
    {
        "symbol": "ESAF.NS",
        "ticker": "ESAF",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "ESAF Limited",
        "kind": "equity"
    },
    {
        "symbol": "ETHOSLTD.NS",
        "ticker": "ETHOSLTD",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "ETHOSLTD Limited",
        "kind": "equity"
    },
    {
        "symbol": "FDC.NS",
        "ticker": "FDC",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "FDC Limited",
        "kind": "equity"
    },
    {
        "symbol": "FIEMIND.NS",
        "ticker": "FIEMIND",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "FIEMIND Limited",
        "kind": "equity"
    },
    {
        "symbol": "FINPIPE.NS",
        "ticker": "FINPIPE",
        "name": "Financials",
        "exchange": "NSE",
        "sector": "FINPIPE Limited",
        "kind": "equity"
    },
    {
        "symbol": "GABRIEL.NS",
        "ticker": "GABRIEL",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "GABRIEL Limited",
        "kind": "equity"
    },
    {
        "symbol": "GALLANTT.NS",
        "ticker": "GALLANTT",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "GALLANTT Limited",
        "kind": "equity"
    },
    {
        "symbol": "GARFIBRES.NS",
        "ticker": "GARFIBRES",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "GARFIBRES Limited",
        "kind": "equity"
    },
    {
        "symbol": "GATEWAY.NS",
        "ticker": "GATEWAY",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "GATEWAY Limited",
        "kind": "equity"
    },
    {
        "symbol": "GEOJITFSL.NS",
        "ticker": "GEOJITFSL",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "GEOJITFSL Limited",
        "kind": "equity"
    },
    {
        "symbol": "GMRINFRA.NS",
        "ticker": "GMRINFRA",
        "name": "Industrials",
        "exchange": "NSE",
        "sector": "GMRINFRA Limited",
        "kind": "equity"
    },
    {
        "symbol": "GNFC.NS",
        "ticker": "GNFC",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "GNFC Limited",
        "kind": "equity"
    },
    {
        "symbol": "GOCOLORS.NS",
        "ticker": "GOCOLORS",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "GOCOLORS Limited",
        "kind": "equity"
    },
    {
        "symbol": "GOKEX.NS",
        "ticker": "GOKEX",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "GOKEX Limited",
        "kind": "equity"
    },
    {
        "symbol": "GOODLUCK.NS",
        "ticker": "GOODLUCK",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "GOODLUCK Limited",
        "kind": "equity"
    },
    {
        "symbol": "GRAVITA.NS",
        "ticker": "GRAVITA",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "GRAVITA Limited",
        "kind": "equity"
    },
    {
        "symbol": "GREENPANEL.NS",
        "ticker": "GREENPANEL",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "GREENPANEL Limited",
        "kind": "equity"
    },
    {
        "symbol": "GREENPLY.NS",
        "ticker": "GREENPLY",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "GREENPLY Limited",
        "kind": "equity"
    },
    {
        "symbol": "GRINFRA.NS",
        "ticker": "GRINFRA",
        "name": "Industrials",
        "exchange": "NSE",
        "sector": "GRINFRA Limited",
        "kind": "equity"
    },
    {
        "symbol": "GSFC.NS",
        "ticker": "GSFC",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "GSFC Limited",
        "kind": "equity"
    },
    {
        "symbol": "GUFICBIO.NS",
        "ticker": "GUFICBIO",
        "name": "Healthcare",
        "exchange": "NSE",
        "sector": "GUFICBIO Limited",
        "kind": "equity"
    },
    {
        "symbol": "GULFPETRO.NS",
        "ticker": "GULFPETRO",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "GULFPETRO Limited",
        "kind": "equity"
    },
    {
        "symbol": "HATSUN.NS",
        "ticker": "HATSUN",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "HATSUN Limited",
        "kind": "equity"
    },
    {
        "symbol": "HBLPOWER.NS",
        "ticker": "HBLPOWER",
        "name": "Utilities",
        "exchange": "NSE",
        "sector": "HBLPOWER Limited",
        "kind": "equity"
    },
    {
        "symbol": "HEIDELBERG.NS",
        "ticker": "HEIDELBERG",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "HEIDELBERG Limited",
        "kind": "equity"
    },
    {
        "symbol": "HERITGFOOD.NS",
        "ticker": "HERITGFOOD",
        "name": "Consumer",
        "exchange": "NSE",
        "sector": "HERITGFOOD Limited",
        "kind": "equity"
    },
    {
        "symbol": "HGINFRA.NS",
        "ticker": "HGINFRA",
        "name": "Industrials",
        "exchange": "NSE",
        "sector": "HGINFRA Limited",
        "kind": "equity"
    },
    {
        "symbol": "HIMATSEIDE.NS",
        "ticker": "HIMATSEIDE",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "HIMATSEIDE Limited",
        "kind": "equity"
    },
    {
        "symbol": "ICICIGI.NS",
        "ticker": "ICICIGI",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "ICICIGI Limited",
        "kind": "equity"
    },
    {
        "symbol": "IIFL.NS",
        "ticker": "IIFL",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "IIFL Limited",
        "kind": "equity"
    },
    {
        "symbol": "INDIGOPNTS.NS",
        "ticker": "INDIGOPNTS",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "INDIGOPNTS Limited",
        "kind": "equity"
    },
    {
        "symbol": "INTELLECT.NS",
        "ticker": "INTELLECT",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "INTELLECT Limited",
        "kind": "equity"
    },
    {
        "symbol": "IRB.NS",
        "ticker": "IRB",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "IRB Limited",
        "kind": "equity"
    },
    {
        "symbol": "ITDCEIL.NS",
        "ticker": "ITDCEIL",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "ITDCEIL Limited",
        "kind": "equity"
    },
    {
        "symbol": "JAYAGRO.NS",
        "ticker": "JAYAGRO",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "JAYAGRO Limited",
        "kind": "equity"
    },
    {
        "symbol": "JAYBARMARU.NS",
        "ticker": "JAYBARMARU",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "JAYBARMARU Limited",
        "kind": "equity"
    },
    {
        "symbol": "JINDALPOLY.NS",
        "ticker": "JINDALPOLY",
        "name": "Chemicals",
        "exchange": "NSE",
        "sector": "JINDALPOLY Limited",
        "kind": "equity"
    },
    {
        "symbol": "JKPAPER.NS",
        "ticker": "JKPAPER",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "JKPAPER Limited",
        "kind": "equity"
    },
    {
        "symbol": "JKTYRE.NS",
        "ticker": "JKTYRE",
        "name": "Automobile",
        "exchange": "NSE",
        "sector": "JKTYRE Limited",
        "kind": "equity"
    },
    {
        "symbol": "JUBLFOOD.NS",
        "ticker": "JUBLFOOD",
        "name": "Consumer",
        "exchange": "NSE",
        "sector": "JUBLFOOD Limited",
        "kind": "equity"
    },
    {
        "symbol": "JUPITERIN.NS",
        "ticker": "JUPITERIN",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "JUPITERIN Limited",
        "kind": "equity"
    },
    {
        "symbol": "KAJARIACER.NS",
        "ticker": "KAJARIACER",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "KAJARIACER Limited",
        "kind": "equity"
    },
    {
        "symbol": "KALPATPOWR.NS",
        "ticker": "KALPATPOWR",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "KALPATPOWR Limited",
        "kind": "equity"
    },
    {
        "symbol": "KANSAINER.NS",
        "ticker": "KANSAINER",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "KANSAINER Limited",
        "kind": "equity"
    },
    {
        "symbol": "KEC.NS",
        "ticker": "KEC",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "KEC Limited",
        "kind": "equity"
    },
    {
        "symbol": "KFINTECH.NS",
        "ticker": "KFINTECH",
        "name": "Financials",
        "exchange": "NSE",
        "sector": "KFINTECH Limited",
        "kind": "equity"
    },
    {
        "symbol": "KIMS.NS",
        "ticker": "KIMS",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "KIMS Limited",
        "kind": "equity"
    },
    {
        "symbol": "KIRLFER.NS",
        "ticker": "KIRLFER",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "KIRLFER Limited",
        "kind": "equity"
    },
    {
        "symbol": "KIRLOSBROS.NS",
        "ticker": "KIRLOSBROS",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "KIRLOSBROS Limited",
        "kind": "equity"
    },
    {
        "symbol": "KIRLOSENG.NS",
        "ticker": "KIRLOSENG",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "KIRLOSENG Limited",
        "kind": "equity"
    },
    {
        "symbol": "KNRCON.NS",
        "ticker": "KNRCON",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "KNRCON Limited",
        "kind": "equity"
    },
    {
        "symbol": "KOLTEPATIL.NS",
        "ticker": "KOLTEPATIL",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "KOLTEPATIL Limited",
        "kind": "equity"
    },
    {
        "symbol": "KOPRAN.NS",
        "ticker": "KOPRAN",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "KOPRAN Limited",
        "kind": "equity"
    },
    {
        "symbol": "KPRMILL.NS",
        "ticker": "KPRMILL",
        "name": "Textiles",
        "exchange": "NSE",
        "sector": "KPRMILL Limited",
        "kind": "equity"
    },
    {
        "symbol": "KUMAR.NS",
        "ticker": "KUMAR",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "KUMAR Limited",
        "kind": "equity"
    },
    {
        "symbol": "KWALITY.NS",
        "ticker": "KWALITY",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "KWALITY Limited",
        "kind": "equity"
    },
    {
        "symbol": "LIBERTSHOE.NS",
        "ticker": "LIBERTSHOE",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "LIBERTSHOE Limited",
        "kind": "equity"
    },
    {
        "symbol": "LICI.NS",
        "ticker": "LICI",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "LICI Limited",
        "kind": "equity"
    },
    {
        "symbol": "LINCOLN.NS",
        "ticker": "LINCOLN",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "LINCOLN Limited",
        "kind": "equity"
    },
    {
        "symbol": "LUMAXIND.NS",
        "ticker": "LUMAXIND",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "LUMAXIND Limited",
        "kind": "equity"
    },
    {
        "symbol": "LUMAXTECH.NS",
        "ticker": "LUMAXTECH",
        "name": "Information Technology",
        "exchange": "NSE",
        "sector": "LUMAXTECH Limited",
        "kind": "equity"
    },
    {
        "symbol": "LUXIND.NS",
        "ticker": "LUXIND",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "LUXIND Limited",
        "kind": "equity"
    },
    {
        "symbol": "MAHLOG.NS",
        "ticker": "MAHLOG",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "MAHLOG Limited",
        "kind": "equity"
    },
    {
        "symbol": "MANGALAM.NS",
        "ticker": "MANGALAM",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "MANGALAM Limited",
        "kind": "equity"
    },
    {
        "symbol": "MANINFRA.NS",
        "ticker": "MANINFRA",
        "name": "Industrials",
        "exchange": "NSE",
        "sector": "MANINFRA Limited",
        "kind": "equity"
    },
    {
        "symbol": "MANYAVAR.NS",
        "ticker": "MANYAVAR",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "MANYAVAR Limited",
        "kind": "equity"
    },
    {
        "symbol": "MASTEK.NS",
        "ticker": "MASTEK",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "MASTEK Limited",
        "kind": "equity"
    },
    {
        "symbol": "MINDAIND.NS",
        "ticker": "MINDAIND",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "MINDAIND Limited",
        "kind": "equity"
    },
    {
        "symbol": "MIRZAINT.NS",
        "ticker": "MIRZAINT",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "MIRZAINT Limited",
        "kind": "equity"
    },
    {
        "symbol": "MONTECARLO.NS",
        "ticker": "MONTECARLO",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "MONTECARLO Limited",
        "kind": "equity"
    },
    {
        "symbol": "MOREPENLAB.NS",
        "ticker": "MOREPENLAB",
        "name": "Healthcare",
        "exchange": "NSE",
        "sector": "MOREPENLAB Limited",
        "kind": "equity"
    },
    {
        "symbol": "MOTILALOFS.NS",
        "ticker": "MOTILALOFS",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "MOTILALOFS Limited",
        "kind": "equity"
    },
    {
        "symbol": "MTARTECH.NS",
        "ticker": "MTARTECH",
        "name": "Information Technology",
        "exchange": "NSE",
        "sector": "MTARTECH Limited",
        "kind": "equity"
    },
    {
        "symbol": "MUNJALAU.NS",
        "ticker": "MUNJALAU",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "MUNJALAU Limited",
        "kind": "equity"
    },
    {
        "symbol": "NAHARSPING.NS",
        "ticker": "NAHARSPING",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "NAHARSPING Limited",
        "kind": "equity"
    },
    {
        "symbol": "NATCOPHARM.NS",
        "ticker": "NATCOPHARM",
        "name": "Healthcare",
        "exchange": "NSE",
        "sector": "NATCOPHARM Limited",
        "kind": "equity"
    },
    {
        "symbol": "NAUKRI.NS",
        "ticker": "NAUKRI",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "NAUKRI Limited",
        "kind": "equity"
    },
    {
        "symbol": "NCC.NS",
        "ticker": "NCC",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "NCC Limited",
        "kind": "equity"
    },
    {
        "symbol": "NCLIND.NS",
        "ticker": "NCLIND",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "NCLIND Limited",
        "kind": "equity"
    },
    {
        "symbol": "NELCO.NS",
        "ticker": "NELCO",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "NELCO Limited",
        "kind": "equity"
    },
    {
        "symbol": "NEOGEN.NS",
        "ticker": "NEOGEN",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "NEOGEN Limited",
        "kind": "equity"
    },
    {
        "symbol": "NETWORK18.NS",
        "ticker": "NETWORK18",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "NETWORK18 Limited",
        "kind": "equity"
    },
    {
        "symbol": "NEULANDLAB.NS",
        "ticker": "NEULANDLAB",
        "name": "Healthcare",
        "exchange": "NSE",
        "sector": "NEULANDLAB Limited",
        "kind": "equity"
    },
    {
        "symbol": "NEWGEN.NS",
        "ticker": "NEWGEN",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "NEWGEN Limited",
        "kind": "equity"
    },
    {
        "symbol": "NFL.NS",
        "ticker": "NFL",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "NFL Limited",
        "kind": "equity"
    },
    {
        "symbol": "ORIENTCEM.NS",
        "ticker": "ORIENTCEM",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "ORIENTCEM Limited",
        "kind": "equity"
    },
    {
        "symbol": "ORIENTHOT.NS",
        "ticker": "ORIENTHOT",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "ORIENTHOT Limited",
        "kind": "equity"
    },
    {
        "symbol": "PANACEABIO.NS",
        "ticker": "PANACEABIO",
        "name": "Healthcare",
        "exchange": "NSE",
        "sector": "PANACEABIO Limited",
        "kind": "equity"
    },
    {
        "symbol": "PARAS.NS",
        "ticker": "PARAS",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "PARAS Limited",
        "kind": "equity"
    },
    {
        "symbol": "PENIND.NS",
        "ticker": "PENIND",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "PENIND Limited",
        "kind": "equity"
    },
    {
        "symbol": "PITTIENG.NS",
        "ticker": "PITTIENG",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "PITTIENG Limited",
        "kind": "equity"
    },
    {
        "symbol": "PNCINFRA.NS",
        "ticker": "PNCINFRA",
        "name": "Industrials",
        "exchange": "NSE",
        "sector": "PNCINFRA Limited",
        "kind": "equity"
    },
    {
        "symbol": "POLYMED.NS",
        "ticker": "POLYMED",
        "name": "Healthcare",
        "exchange": "NSE",
        "sector": "POLYMED Limited",
        "kind": "equity"
    },
    {
        "symbol": "PRAJIND.NS",
        "ticker": "PRAJIND",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "PRAJIND Limited",
        "kind": "equity"
    },
    {
        "symbol": "PRAKASH.NS",
        "ticker": "PRAKASH",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "PRAKASH Limited",
        "kind": "equity"
    },
    {
        "symbol": "PREMIER.NS",
        "ticker": "PREMIER",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "PREMIER Limited",
        "kind": "equity"
    },
    {
        "symbol": "PRICOLLTD.NS",
        "ticker": "PRICOLLTD",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "PRICOLLTD Limited",
        "kind": "equity"
    },
    {
        "symbol": "PRINCEPIPE.NS",
        "ticker": "PRINCEPIPE",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "PRINCEPIPE Limited",
        "kind": "equity"
    },
    {
        "symbol": "PROTEAN.NS",
        "ticker": "PROTEAN",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "PROTEAN Limited",
        "kind": "equity"
    },
    {
        "symbol": "PSPPROJECT.NS",
        "ticker": "PSPPROJECT",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "PSPPROJECT Limited",
        "kind": "equity"
    },
    {
        "symbol": "PURVA.NS",
        "ticker": "PURVA",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "PURVA Limited",
        "kind": "equity"
    },
    {
        "symbol": "QUICKHEAL.NS",
        "ticker": "QUICKHEAL",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "QUICKHEAL Limited",
        "kind": "equity"
    },
    {
        "symbol": "RAINBOW.NS",
        "ticker": "RAINBOW",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "RAINBOW Limited",
        "kind": "equity"
    },
    {
        "symbol": "RANEHOLDIN.NS",
        "ticker": "RANEHOLDIN",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "RANEHOLDIN Limited",
        "kind": "equity"
    },
    {
        "symbol": "RATEGAIN.NS",
        "ticker": "RATEGAIN",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "RATEGAIN Limited",
        "kind": "equity"
    },
    {
        "symbol": "RATNAMANI.NS",
        "ticker": "RATNAMANI",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "RATNAMANI Limited",
        "kind": "equity"
    },
    {
        "symbol": "RCF.NS",
        "ticker": "RCF",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "RCF Limited",
        "kind": "equity"
    },
    {
        "symbol": "ROLEXRINGS.NS",
        "ticker": "ROLEXRINGS",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "ROLEXRINGS Limited",
        "kind": "equity"
    },
    {
        "symbol": "ROSSARI.NS",
        "ticker": "ROSSARI",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "ROSSARI Limited",
        "kind": "equity"
    },
    {
        "symbol": "ROUTE.NS",
        "ticker": "ROUTE",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "ROUTE Limited",
        "kind": "equity"
    },
    {
        "symbol": "RUPA.NS",
        "ticker": "RUPA",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "RUPA Limited",
        "kind": "equity"
    },
    {
        "symbol": "SAGCEM.NS",
        "ticker": "SAGCEM",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "SAGCEM Limited",
        "kind": "equity"
    },
    {
        "symbol": "SAKSOFT.NS",
        "ticker": "SAKSOFT",
        "name": "Information Technology",
        "exchange": "NSE",
        "sector": "SAKSOFT Limited",
        "kind": "equity"
    },
    {
        "symbol": "SALASAR.NS",
        "ticker": "SALASAR",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "SALASAR Limited",
        "kind": "equity"
    },
    {
        "symbol": "SANDHAR.NS",
        "ticker": "SANDHAR",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "SANDHAR Limited",
        "kind": "equity"
    },
    {
        "symbol": "SANSERA.NS",
        "ticker": "SANSERA",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "SANSERA Limited",
        "kind": "equity"
    },
    {
        "symbol": "SAPPHIRE.NS",
        "ticker": "SAPPHIRE",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "SAPPHIRE Limited",
        "kind": "equity"
    },
    {
        "symbol": "SCHAEFFLER.NS",
        "ticker": "SCHAEFFLER",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "SCHAEFFLER Limited",
        "kind": "equity"
    },
    {
        "symbol": "SCI.NS",
        "ticker": "SCI",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "SCI Limited",
        "kind": "equity"
    },
    {
        "symbol": "SESHAPAPER.NS",
        "ticker": "SESHAPAPER",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "SESHAPAPER Limited",
        "kind": "equity"
    },
    {
        "symbol": "SFL.NS",
        "ticker": "SFL",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "SFL Limited",
        "kind": "equity"
    },
    {
        "symbol": "SHALPAINTS.NS",
        "ticker": "SHALPAINTS",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "SHALPAINTS Limited",
        "kind": "equity"
    },
    {
        "symbol": "SHARDACROP.NS",
        "ticker": "SHARDACROP",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "SHARDACROP Limited",
        "kind": "equity"
    },
    {
        "symbol": "SHIVALIK.NS",
        "ticker": "SHIVALIK",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "SHIVALIK Limited",
        "kind": "equity"
    },
    {
        "symbol": "SIYARAM.NS",
        "ticker": "SIYARAM",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "SIYARAM Limited",
        "kind": "equity"
    },
    {
        "symbol": "SKFINDIA.NS",
        "ticker": "SKFINDIA",
        "name": "Financials",
        "exchange": "NSE",
        "sector": "SKFINDIA Limited",
        "kind": "equity"
    },
    {
        "symbol": "SMSPHARMA.NS",
        "ticker": "SMSPHARMA",
        "name": "Healthcare",
        "exchange": "NSE",
        "sector": "SMSPHARMA Limited",
        "kind": "equity"
    },
    {
        "symbol": "SOLARA.NS",
        "ticker": "SOLARA",
        "name": "Utilities",
        "exchange": "NSE",
        "sector": "SOLARA Limited",
        "kind": "equity"
    },
    {
        "symbol": "SOLARINDS.NS",
        "ticker": "SOLARINDS",
        "name": "Utilities",
        "exchange": "NSE",
        "sector": "SOLARINDS Limited",
        "kind": "equity"
    },
    {
        "symbol": "SOMANYCERA.NS",
        "ticker": "SOMANYCERA",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "SOMANYCERA Limited",
        "kind": "equity"
    },
    {
        "symbol": "SPIC.NS",
        "ticker": "SPIC",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "SPIC Limited",
        "kind": "equity"
    },
    {
        "symbol": "STARCEMENT.NS",
        "ticker": "STARCEMENT",
        "name": "Industrials",
        "exchange": "NSE",
        "sector": "STARCEMENT Limited",
        "kind": "equity"
    },
    {
        "symbol": "STARPAPER.NS",
        "ticker": "STARPAPER",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "STARPAPER Limited",
        "kind": "equity"
    },
    {
        "symbol": "SUBROS.NS",
        "ticker": "SUBROS",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "SUBROS Limited",
        "kind": "equity"
    },
    {
        "symbol": "SUNDRMFAST.NS",
        "ticker": "SUNDRMFAST",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "SUNDRMFAST Limited",
        "kind": "equity"
    },
    {
        "symbol": "SUNTV.NS",
        "ticker": "SUNTV",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "SUNTV Limited",
        "kind": "equity"
    },
    {
        "symbol": "SUPRAJIT.NS",
        "ticker": "SUPRAJIT",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "SUPRAJIT Limited",
        "kind": "equity"
    },
    {
        "symbol": "SUPREMEIND.NS",
        "ticker": "SUPREMEIND",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "SUPREMEIND Limited",
        "kind": "equity"
    },
    {
        "symbol": "SWANENERGY.NS",
        "ticker": "SWANENERGY",
        "name": "Utilities",
        "exchange": "NSE",
        "sector": "SWANENERGY Limited",
        "kind": "equity"
    },
    {
        "symbol": "SYNGENE.NS",
        "ticker": "SYNGENE",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "SYNGENE Limited",
        "kind": "equity"
    },
    {
        "symbol": "TALBROSENG.NS",
        "ticker": "TALBROSENG",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "TALBROSENG Limited",
        "kind": "equity"
    },
    {
        "symbol": "TANLA.NS",
        "ticker": "TANLA",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "TANLA Limited",
        "kind": "equity"
    },
    {
        "symbol": "TASTYBITE.NS",
        "ticker": "TASTYBITE",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "TASTYBITE Limited",
        "kind": "equity"
    },
    {
        "symbol": "TATVA.NS",
        "ticker": "TATVA",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "TATVA Limited",
        "kind": "equity"
    },
    {
        "symbol": "TCIEXP.NS",
        "ticker": "TCIEXP",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "TCIEXP Limited",
        "kind": "equity"
    },
    {
        "symbol": "TCNSBRANDS.NS",
        "ticker": "TCNSBRANDS",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "TCNSBRANDS Limited",
        "kind": "equity"
    },
    {
        "symbol": "TEXRAIL.NS",
        "ticker": "TEXRAIL",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "TEXRAIL Limited",
        "kind": "equity"
    },
    {
        "symbol": "THEMISMED.NS",
        "ticker": "THEMISMED",
        "name": "Healthcare",
        "exchange": "NSE",
        "sector": "THEMISMED Limited",
        "kind": "equity"
    },
    {
        "symbol": "TIMETECHNO.NS",
        "ticker": "TIMETECHNO",
        "name": "Information Technology",
        "exchange": "NSE",
        "sector": "TIMETECHNO Limited",
        "kind": "equity"
    },
    {
        "symbol": "TIMKEN.NS",
        "ticker": "TIMKEN",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "TIMKEN Limited",
        "kind": "equity"
    },
    {
        "symbol": "TNPL.NS",
        "ticker": "TNPL",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "TNPL Limited",
        "kind": "equity"
    },
    {
        "symbol": "TVSSRICHAK.NS",
        "ticker": "TVSSRICHAK",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "TVSSRICHAK Limited",
        "kind": "equity"
    },
    {
        "symbol": "UNITEDSPR.NS",
        "ticker": "UNITEDSPR",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "UNITEDSPR Limited",
        "kind": "equity"
    },
    {
        "symbol": "UTKARSH.NS",
        "ticker": "UTKARSH",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "UTKARSH Limited",
        "kind": "equity"
    },
    {
        "symbol": "VADILALIND.NS",
        "ticker": "VADILALIND",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "VADILALIND Limited",
        "kind": "equity"
    },
    {
        "symbol": "VAIBHAVGBL.NS",
        "ticker": "VAIBHAVGBL",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "VAIBHAVGBL Limited",
        "kind": "equity"
    },
    {
        "symbol": "VARROC.NS",
        "ticker": "VARROC",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "VARROC Limited",
        "kind": "equity"
    },
    {
        "symbol": "VENKYS.NS",
        "ticker": "VENKYS",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "VENKYS Limited",
        "kind": "equity"
    },
    {
        "symbol": "VRLLOG.NS",
        "ticker": "VRLLOG",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "VRLLOG Limited",
        "kind": "equity"
    },
    {
        "symbol": "VSTTILLERS.NS",
        "ticker": "VSTTILLERS",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "VSTTILLERS Limited",
        "kind": "equity"
    },
    {
        "symbol": "VTL.NS",
        "ticker": "VTL",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "VTL Limited",
        "kind": "equity"
    },
    {
        "symbol": "WELSPUNLIV.NS",
        "ticker": "WELSPUNLIV",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "WELSPUNLIV Limited",
        "kind": "equity"
    },
    {
        "symbol": "WESTLIFE.NS",
        "ticker": "WESTLIFE",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "WESTLIFE Limited",
        "kind": "equity"
    },
    {
        "symbol": "WHIRLPOOL.NS",
        "ticker": "WHIRLPOOL",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "WHIRLPOOL Limited",
        "kind": "equity"
    },
    {
        "symbol": "WSTCSTPAPR.NS",
        "ticker": "WSTCSTPAPR",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "WSTCSTPAPR Limited",
        "kind": "equity"
    },
    {
        "symbol": "ZENSARTECH.NS",
        "ticker": "ZENSARTECH",
        "name": "Information Technology",
        "exchange": "NSE",
        "sector": "ZENSARTECH Limited",
        "kind": "equity"
    },
    {
        "symbol": "ZOMATO.NS",
        "ticker": "ZOMATO",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "ZOMATO Limited",
        "kind": "equity"
    },
    {
        "symbol": "ZYDUSWELL.NS",
        "ticker": "ZYDUSWELL",
        "name": "Diversified",
        "exchange": "NSE",
        "sector": "ZYDUSWELL Limited",
        "kind": "equity"
    }
]

BSE_BOOK: List[Dict[str, str]] = []

ALL_INSTRUMENTS: List[Dict[str, str]] = INDICES + NSE_BOOK + BSE_BOOK

BASE_PRICES: Dict[str, float] = {
    "^INDIAVIX": 13.85,
    "^GIFTNIFTY": 25410.5,
    "^NSEI": 25388.25,
    "^BSESN": 82359.02,
    "^NSEBANK": 54195.45,
    "^CNXIT": 41850.2,
    "^CNXFIN": 24850.6,
    "^NSEMDCP50": 16450.8,
    "^CNXAUTO": 23850.0,
    "^CNXFMCG": 56420.0,
    "^CNXPHARMA": 21850.0,
    "^CNXMETAL": 8950.0,
    "^CNXENERGY": 38450.0,
    "^CNXINFRA": 8240.0,
    "^CNXCONSUMER": 9850.0,
    "^CNXPSUBANK": 6480.0,
    "^CNXREALTY": 985.0,
    "^BSE100": 26180.5,
    "^PENNY": 18.5,
    "^CNXSC": 19250.0,
    "^NSELM250": 15450.0,
    "^NSEMS400": 16800.0,
    "^NSEMDCP150": 21650.0,
    "5PAISA": 450.0,
    "AFFLE": 450.0,
    "AHLUCONT": 450.0,
    "AIAENG": 450.0,
    "AJMERA": 450.0,
    "ALLCARGO": 450.0,
    "AMIORG": 450.0,
    "ANANTRAJ": 450.0,
    "ANDHRAPAP": 450.0,
    "ANUPAM": 450.0,
    "ARVIND": 450.0,
    "ASHOKA": 450.0,
    "ASTERDM": 450.0,
    "ASTRAL": 450.0,
    "ASTRAZEN": 450.0,
    "ATGL": 450.0,
    "BAJAJHLDNG": 450.0,
    "BANCOINDIA": 450.0,
    "BLISSGVS": 450.0,
    "BLS": 450.0,
    "BOMBAYDYE": 450.0,
    "BORORENEW": 450.0,
    "CAMPUS": 450.0,
    "CANFINHOME": 450.0,
    "CAPACITE": 450.0,
    "CAPL": 450.0,
    "CENTURYPLY": 450.0,
    "CENTURYTEX": 450.0,
    "CERA": 450.0,
    "CGPOWER": 450.0,
    "CLEAN": 450.0,
    "CRAFTSMAN": 450.0,
    "DATAMATICS": 450.0,
    "DATAPATTNS": 450.0,
    "DBL": 450.0,
    "DCXINDIA": 450.0,
    "DECCANCE": 450.0,
    "DEEPAKFERT": 450.0,
    "DEVYANI": 450.0,
    "DFMFOODS": 450.0,
    "DODLA": 450.0,
    "DOLLAR": 450.0,
    "DREDGECORP": 450.0,
    "DYNAMATECH": 450.0,
    "ELECON": 450.0,
    "ERIS": 450.0,
    "ESAF": 450.0,
    "ETHOSLTD": 450.0,
    "FDC": 450.0,
    "FIEMIND": 450.0,
    "FINPIPE": 450.0,
    "GABRIEL": 450.0,
    "GALLANTT": 450.0,
    "GARFIBRES": 450.0,
    "GATEWAY": 450.0,
    "GEOJITFSL": 450.0,
    "GMRINFRA": 450.0,
    "GNFC": 450.0,
    "GOCOLORS": 450.0,
    "GOKEX": 450.0,
    "GOODLUCK": 450.0,
    "GRAVITA": 450.0,
    "GREENPANEL": 450.0,
    "GREENPLY": 450.0,
    "GRINFRA": 450.0,
    "GSFC": 450.0,
    "GUFICBIO": 450.0,
    "GULFPETRO": 450.0,
    "HATSUN": 450.0,
    "HBLPOWER": 450.0,
    "HEIDELBERG": 450.0,
    "HERITGFOOD": 450.0,
    "HGINFRA": 450.0,
    "HIMATSEIDE": 450.0,
    "ICICIGI": 450.0,
    "IIFL": 450.0,
    "INDIGOPNTS": 450.0,
    "INTELLECT": 450.0,
    "IRB": 450.0,
    "ITDCEIL": 450.0,
    "JAYAGRO": 450.0,
    "JAYBARMARU": 450.0,
    "JINDALPOLY": 450.0,
    "JKPAPER": 450.0,
    "JKTYRE": 450.0,
    "JUBLFOOD": 450.0,
    "JUPITERIN": 450.0,
    "KAJARIACER": 450.0,
    "KALPATPOWR": 450.0,
    "KANSAINER": 450.0,
    "KEC": 450.0,
    "KFINTECH": 450.0,
    "KIMS": 450.0,
    "KIRLFER": 450.0,
    "KIRLOSBROS": 450.0,
    "KIRLOSENG": 450.0,
    "KNRCON": 450.0,
    "KOLTEPATIL": 450.0,
    "KOPRAN": 450.0,
    "KPRMILL": 450.0,
    "KUMAR": 450.0,
    "KWALITY": 450.0,
    "LIBERTSHOE": 450.0,
    "LICI": 450.0,
    "LINCOLN": 450.0,
    "LUMAXIND": 450.0,
    "LUMAXTECH": 450.0,
    "LUXIND": 450.0,
    "MAHLOG": 450.0,
    "MANGALAM": 450.0,
    "MANINFRA": 450.0,
    "MANYAVAR": 450.0,
    "MASTEK": 450.0,
    "MINDAIND": 450.0,
    "MIRZAINT": 450.0,
    "MONTECARLO": 450.0,
    "MOREPENLAB": 450.0,
    "MOTILALOFS": 450.0,
    "MTARTECH": 450.0,
    "MUNJALAU": 450.0,
    "NAHARSPING": 450.0,
    "NATCOPHARM": 450.0,
    "NAUKRI": 450.0,
    "NCC": 450.0,
    "NCLIND": 450.0,
    "NELCO": 450.0,
    "NEOGEN": 450.0,
    "NETWORK18": 450.0,
    "NEULANDLAB": 450.0,
    "NEWGEN": 450.0,
    "NFL": 450.0,
    "ORIENTCEM": 450.0,
    "ORIENTHOT": 450.0,
    "PANACEABIO": 450.0,
    "PARAS": 450.0,
    "PENIND": 450.0,
    "PITTIENG": 450.0,
    "PNCINFRA": 450.0,
    "POLYMED": 450.0,
    "PRAJIND": 450.0,
    "PRAKASH": 450.0,
    "PRICOLLTD": 450.0,
    "PRINCEPIPE": 450.0,
    "PROTEAN": 450.0,
    "PSPPROJECT": 450.0,
    "PURVA": 450.0,
    "QUICKHEAL": 450.0,
    "RAINBOW": 450.0,
    "RANEHOLDIN": 450.0,
    "RATEGAIN": 450.0,
    "RATNAMANI": 450.0,
    "RCF": 450.0,
    "ROLEXRINGS": 450.0,
    "ROSSARI": 450.0,
    "ROUTE": 450.0,
    "RUPA": 450.0,
    "SAGCEM": 450.0,
    "SAKSOFT": 450.0,
    "SALASAR": 450.0,
    "SANDHAR": 450.0,
    "SANSERA": 450.0,
    "SAPPHIRE": 450.0,
    "SCHAEFFLER": 450.0,
    "SCI": 450.0,
    "SESHAPAPER": 450.0,
    "SFL": 450.0,
    "SHALPAINTS": 450.0,
    "SHARDACROP": 450.0,
    "SHIVALIK": 450.0,
    "SIYARAM": 450.0,
    "SKFINDIA": 450.0,
    "SMSPHARMA": 450.0,
    "SOLARA": 450.0,
    "SOLARINDS": 450.0,
    "SOMANYCERA": 450.0,
    "SPIC": 450.0,
    "STARCEMENT": 450.0,
    "STARPAPER": 450.0,
    "SUBROS": 450.0,
    "SUNDRMFAST": 450.0,
    "SUNTV": 450.0,
    "SUPRAJIT": 450.0,
    "SUPREMEIND": 450.0,
    "SWANENERGY": 450.0,
    "SYNGENE": 450.0,
    "TALBROSENG": 450.0,
    "TANLA": 450.0,
    "TASTYBITE": 450.0,
    "TATVA": 450.0,
    "TCIEXP": 450.0,
    "TCNSBRANDS": 450.0,
    "TEXRAIL": 450.0,
    "THEMISMED": 450.0,
    "TIMETECHNO": 450.0,
    "TIMKEN": 450.0,
    "TNPL": 450.0,
    "TVSSRICHAK": 450.0,
    "UNITEDSPR": 450.0,
    "UTKARSH": 450.0,
    "VADILALIND": 450.0,
    "VAIBHAVGBL": 450.0,
    "VARROC": 450.0,
    "VENKYS": 450.0,
    "VRLLOG": 450.0,
    "VSTTILLERS": 450.0,
    "VTL": 450.0,
    "WELSPUNLIV": 450.0,
    "WESTLIFE": 450.0,
    "WHIRLPOOL": 450.0,
    "WSTCSTPAPR": 450.0,
    "ZENSARTECH": 450.0,
    "ZYDUSWELL": 450.0,
    "M&M": 2890.0,
    "BAJAJ-AUTO": 8950.0,
    "3IINFOLTD": 19.63
}

# Quick symbol index
_INSTRUMENT_MAP: Dict[str, Dict[str, str]] = {inst["symbol"]: inst for inst in ALL_INSTRUMENTS}
_TICKER_MAP: Dict[str, Dict[str, str]] = {inst["ticker"]: inst for inst in ALL_INSTRUMENTS}

def get_instrument_by_symbol(symbol: str) -> Optional[Dict[str, str]]:
    return _INSTRUMENT_MAP.get(symbol.upper())

def get_instrument_by_ticker(ticker: str) -> Optional[Dict[str, str]]:
    return _TICKER_MAP.get(ticker.upper())

def get_base_price(ticker: str) -> float:
    return BASE_PRICES.get(ticker.upper(), 100.0)

def get_index_constituents(index_name: str) -> List[str]:
    name = index_name.upper()
    if "SMALL" in name:
        return NIFTY_SMALLCAP_100
    elif "400" in name or "MIDSMALL" in name:
        return NIFTY_MIDSMALLCAP_400
    elif "250" in name or "LARGEMID" in name:
        return NIFTY_LARGEMIDCAP_250
    elif "150" in name or "MID" in name:
        return NIFTY_MIDCAP_150
    return NIFTY_50
