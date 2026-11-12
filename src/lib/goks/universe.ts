import type { Instrument } from "./types";

function nse(ticker: string, sector: string, name: string): Instrument {
  return { symbol: `${ticker}.NS`, ticker, exchange: "NSE", sector, name, kind: "equity" };
}

function bse(ticker: string, sector: string, name: string): Instrument {
  return { symbol: `${ticker}.BO`, ticker, exchange: "BSE", sector, name, kind: "equity" };
}

export const INDICES: Instrument[] = [
  { symbol: "^INDIAVIX", ticker: "INDIA VIX", exchange: "INDEX", sector: "Volatility", name: "India VIX Volatility Index", kind: "index" },
  { symbol: "^GIFTNIFTY", ticker: "GIFT NIFTY", exchange: "INDEX", sector: "Futures", name: "GIFT Nifty 50 Benchmark", kind: "index" },
  { symbol: "^NSEI", ticker: "NIFTY", exchange: "INDEX", sector: "Index", name: "NIFTY 50", kind: "index" },
  { symbol: "^BSESN", ticker: "SENSEX", exchange: "INDEX", sector: "Index", name: "S&P BSE SENSEX", kind: "index" },
  { symbol: "^NSEBANK", ticker: "BANKNIFTY", exchange: "INDEX", sector: "Index", name: "NIFTY BANK", kind: "index" },
  { symbol: "^CNXIT", ticker: "NIFTYIT", exchange: "INDEX", sector: "Index", name: "NIFTY IT", kind: "index" },
  { symbol: "^CNXFIN", ticker: "FINNIFTY", exchange: "INDEX", sector: "Index", name: "NIFTY FINANCIAL SERVICES", kind: "index" },
  { symbol: "^NSEMDCP50", ticker: "MIDCAP50", exchange: "INDEX", sector: "Index", name: "NIFTY MIDCAP 50", kind: "index" },
  { symbol: "^CNXAUTO", ticker: "AUTO", exchange: "INDEX", sector: "Index", name: "NIFTY AUTO", kind: "index" },
  { symbol: "^CNXFMCG", ticker: "FMCG", exchange: "INDEX", sector: "Index", name: "NIFTY FMCG", kind: "index" },
  { symbol: "^CNXPHARMA", ticker: "PHARMA", exchange: "INDEX", sector: "Index", name: "NIFTY PHARMA", kind: "index" },
  { symbol: "^CNXMETAL", ticker: "METAL", exchange: "INDEX", sector: "Index", name: "NIFTY METAL", kind: "index" },
  { symbol: "^CNXENERGY", ticker: "ENERGY", exchange: "INDEX", sector: "Index", name: "NIFTY ENERGY", kind: "index" },
  { symbol: "^CNXINFRA", ticker: "INFRA", exchange: "INDEX", sector: "Index", name: "NIFTY INFRA", kind: "index" },
  { symbol: "^CNXCONSUMER", ticker: "CONSUMER", exchange: "INDEX", sector: "Index", name: "NIFTY CONSUMPTION", kind: "index" },
  { symbol: "^CNXPSUBANK", ticker: "PSUBANK", exchange: "INDEX", sector: "Index", name: "NIFTY PSU BANK", kind: "index" },
  { symbol: "^CNXREALTY", ticker: "REALTY", exchange: "INDEX", sector: "Index", name: "NIFTY REALTY", kind: "index" },
  { symbol: "^BSE100", ticker: "BSE100", exchange: "INDEX", sector: "Index", name: "S&P BSE 100", kind: "index" },
  { symbol: "^PENNY", ticker: "PENNY", exchange: "INDEX", sector: "Penny Stocks", name: "NSE & BSE Penny Stocks (< ₹50)", kind: "index" },
  { symbol: "^CNXSC", ticker: "SMALLCAP", exchange: "INDEX", sector: "Index", name: "NIFTY SMALLCAP 100", kind: "index" },
  { symbol: "^NSELM250", ticker: "LARGEMID250", exchange: "INDEX", sector: "Index", name: "NIFTY LARGEMIDCAP 250", kind: "index" },
  { symbol: "^NSEMS400", ticker: "MIDSMALL400", exchange: "INDEX", sector: "Index", name: "NIFTY MIDSMALLCAP 400", kind: "index" },
  { symbol: "^NSEMDCP150", ticker: "MIDCAP150", exchange: "INDEX", sector: "Index", name: "NIFTY MIDCAP 150", kind: "index" },
];

/** Liquid NSE & BSE book encompassing all liquid equities across Indian markets. */
export const NSE_BOOK: Instrument[] = [
  // Private & Universal Banks
  nse("HDFCBANK", "Banks", "HDFC Bank Limited"),
  nse("ICICIBANK", "Banks", "ICICI Bank Limited"),
  nse("SBIN", "Banks", "State Bank of India"),
  nse("KOTAKBANK", "Banks", "Kotak Mahindra Bank Limited"),
  nse("AXISBANK", "Banks", "Axis Bank Limited"),
  nse("INDUSINDBK", "Banks", "IndusInd Bank Limited"),
  nse("FEDERALBNK", "Banks", "The Federal Bank Limited"),
  nse("IDFCFIRSTB", "Banks", "IDFC First Bank Limited"),
  nse("RBLBANK", "Banks", "RBL Bank Limited"),
  nse("BANDHANBNK", "Banks", "Bandhan Bank Limited"),
  nse("AUBANK", "Banks", "AU Small Finance Bank Limited"),
  nse("UJJIVANSFB", "Banks", "Ujjivan Small Finance Bank Limited"),
  nse("EQUITASBNK", "Banks", "Equitas Small Finance Bank Limited"),
  nse("ESAFSFB", "Banks", "ESAF Small Finance Bank Limited"),
  nse("JSFB", "Banks", "Jana Small Finance Bank Limited"),
  nse("SURYODAY", "Banks", "Suryoday Small Finance Bank Limited"),
  nse("UTKARSHBNK", "Banks", "Utkarsh Small Finance Bank Limited"),
  nse("CAPITALSFB", "Banks", "Capital Small Finance Bank Limited"),
  nse("YESBANK", "Banks", "Yes Bank Limited"),
  nse("CUB", "Banks", "City Union Bank Limited"),
  nse("KARURVYSYA", "Banks", "Karur Vysya Bank Limited"),

  // Public Sector (PSU) Banks
  nse("BANKBARODA", "PSU Banks", "Bank of Baroda Limited"),
  nse("PNB", "PSU Banks", "Punjab National Bank"),
  nse("CANBK", "PSU Banks", "Canara Bank"),
  nse("UNIONBANK", "PSU Banks", "Union Bank of India"),
  nse("BANKINDIA", "PSU Banks", "Bank of India"),
  nse("INDIANB", "PSU Banks", "Indian Bank"),
  nse("MAHABANK", "PSU Banks", "Bank of Maharashtra"),
  nse("CENTRALBK", "PSU Banks", "Central Bank of India"),
  nse("UCOBANK", "PSU Banks", "UCO Bank"),
  nse("IOB", "PSU Banks", "Indian Overseas Bank"),

  // NBFCs, Housing Finance & Wealth
  nse("BAJFINANCE", "NBFC", "Bajaj Finance Limited"),
  nse("BAJAJFINSV", "NBFC", "Bajaj Finserv Limited"),
  nse("SHRIRAMFIN", "NBFC", "Shriram Finance Limited"),
  nse("JIOFIN", "NBFC", "Jio Financial Services Limited"),
  nse("CHOLAFIN", "NBFC", "Cholamandalam Investment and Finance"),
  nse("MUTHOOTFIN", "NBFC", "Muthoot Finance Limited"),
  nse("POONAWALLA", "NBFC", "Poonawalla Fincorp Limited"),
  nse("MANAPPURAM", "NBFC", "Manappuram Finance Limited"),
  nse("L&TFH", "NBFC", "L&T Finance Holdings Limited"),
  nse("ABCAPITAL", "NBFC", "Aditya Birla Capital Limited"),
  nse("SUNDARMFIN", "NBFC", "Sundaram Finance Limited"),
  nse("M&MFIN", "NBFC", "Mahindra & Mahindra Financial Services Limited"),
  nse("PFC", "NBFC", "Power Finance Corporation Limited"),
  nse("RECLTD", "NBFC", "REC Limited"),
  nse("HUDCO", "NBFC", "Housing & Urban Development Corporation (HUDCO)"),
  nse("IREDA", "NBFC", "Indian Renewable Energy Development Agency (IREDA)"),
  nse("LICHSGFIN", "NBFC", "LIC Housing Finance Limited"),
  nse("PNBHOUSING", "NBFC", "PNB Housing Finance Limited"),

  // Insurance
  nse("SBILIFE", "Insurance", "SBI Life Insurance Company Limited"),
  nse("HDFCLIFE", "Insurance", "HDFC Life Insurance Company Limited"),
  nse("ICICIPRULI", "Insurance", "ICICI Prudential Life Insurance Limited"),
  nse("GICRE", "Insurance", "General Insurance Corporation of India"),

  // Information Technology & Software
  nse("TCS", "Information Technology", "Tata Consultancy Services Limited"),
  nse("INFY", "Information Technology", "Infosys Limited"),
  nse("HCLTECH", "Information Technology", "HCL Technologies Limited"),
  nse("WIPRO", "Information Technology", "Wipro Limited"),
  nse("TECHM", "Information Technology", "Tech Mahindra Limited"),
  nse("LTIM", "Information Technology", "LTIMindtree Limited"),
  nse("PERSISTENT", "Information Technology", "Persistent Systems Limited"),
  nse("COFORGE", "Information Technology", "Coforge Limited"),
  nse("MPHASIS", "Information Technology", "Mphasis Limited"),
  nse("LTTS", "Information Technology", "L&T Technology Services Limited"),
  nse("KPITTECH", "Information Technology", "KPIT Technologies Limited"),
  nse("TATAELXSI", "Information Technology", "Tata Elxsi Limited"),
  nse("CYIENT", "Information Technology", "Cyient Limited"),
  nse("SONATSOFTW", "Information Technology", "Sonata Software Limited"),
  nse("BSOFT", "Information Technology", "Birlasoft Limited"),

  // Fintech, Exchanges & Depository
  nse("PAYTM", "Fintech", "One97 Communications Limited (Paytm)"),
  nse("POLICYBZR", "Fintech", "PB Fintech Limited (Policybazaar)"),
  nse("NYKAA", "Fintech", "FSN E-Commerce Ventures Limited (Nykaa)"),
  nse("DELHIVERY", "Logistics", "Delhivery Limited"),
  nse("SWIGGY", "Consumer", "Swiggy Limited"),
  nse("ETERNAL", "Consumer", "Eternal Limited (Zomato)"),
  nse("BSE", "Exchanges", "BSE Limited"),
  nse("CDSL", "Exchanges", "Central Depository Services (India) Limited (CDSL)"),
  nse("MCX", "Exchanges", "Multi Commodity Exchange of India (MCX)"),
  nse("IEX", "Exchanges", "Indian Energy Exchange Limited (IEX)"),
  nse("ANGELONE", "Fintech", "Angel One Limited"),
  nse("CAMS", "Fintech", "Computer Age Management Services Limited"),

  // Fast-Moving Consumer Goods (FMCG)
  nse("HINDUNILVR", "FMCG", "Hindustan Unilever Limited"),
  nse("ITC", "FMCG", "ITC Limited"),
  nse("NESTLEIND", "FMCG", "Nestlé India Limited"),
  nse("BRITANNIA", "FMCG", "Britannia Industries Limited"),
  nse("TATACONSUM", "FMCG", "Tata Consumer Products Limited"),
  nse("DABUR", "FMCG", "Dabur India Limited"),
  nse("MARICO", "FMCG", "Marico Limited"),
  nse("COLPAL", "FMCG", "Colgate-Palmolive (India) Limited"),
  nse("GODREJCP", "FMCG", "Godrej Consumer Products Limited"),
  nse("VBL", "FMCG", "Varun Beverages Limited"),
  nse("RADICO", "FMCG", "Radico Khaitan Limited"),
  nse("UBL", "FMCG", "United Breweries Limited"),
  nse("MCDOWELL-N", "FMCG", "United Spirits Limited"),

  // Automobiles & EV
  nse("MARUTI", "Auto", "Maruti Suzuki India Limited"),
  nse("M&M", "Auto", "Mahindra & Mahindra Limited"),
  nse("TMPV", "Auto", "Tata Motors Passenger Vehicles Limited (TATAMOTORS)"),
  nse("EICHERMOT", "Auto", "Eicher Motors Limited"),
  nse("HEROMOTOCO", "Auto", "Hero MotoCorp Limited"),
  nse("BAJAJ-AUTO", "Auto", "Bajaj Auto Limited"),
  nse("TVSMOTOR", "Auto", "TVS Motor Company Limited"),
  nse("ASHOKLEY", "Auto", "Ashok Leyland Limited"),
  nse("ESCORTS", "Auto", "Escorts Kubota Limited"),

  // Auto Ancillaries, Tyres & Batteries
  nse("BHARATFORG", "Auto Ancillary", "Bharat Forge Limited"),
  nse("MOTHERSON", "Auto Ancillary", "Samvardhana Motherson International Limited"),
  nse("TIINDIA", "Auto Ancillary", "Tube Investments of India Limited"),
  nse("BOSCHLTD", "Auto Ancillary", "Bosch Limited"),
  nse("ENDURANCE", "Auto Ancillary", "Endurance Technologies Limited"),
  nse("SONACOMS", "Auto Ancillary", "Sona BLW Precision Forgings Limited"),
  nse("MRF", "Auto Ancillary", "MRF Limited"),
  nse("BALKRISIND", "Auto Ancillary", "Balkrishna Industries Limited"),
  nse("APOLLOTYRE", "Auto Ancillary", "Apollo Tyres Limited"),
  nse("CEATLTD", "Auto Ancillary", "CEAT Limited"),
  nse("EXIDEIND", "Auto Ancillary", "Exide Industries Limited"),
  nse("AMARAJABAT", "Auto Ancillary", "Amara Raja Energy & Mobility Limited"),

  // Pharma, Healthcare & Hospitals
  nse("SUNPHARMA", "Healthcare", "Sun Pharmaceutical Industries Limited"),
  nse("CIPLA", "Healthcare", "Cipla Limited"),
  nse("DRREDDY", "Healthcare", "Dr. Reddy's Laboratories Limited"),
  nse("DIVISLAB", "Healthcare", "Divi's Laboratories Limited"),
  nse("APOLLOHOSP", "Healthcare", "Apollo Hospitals Enterprise Limited"),
  nse("MAXHEALTH", "Healthcare", "Max Healthcare Institute Limited"),
  nse("ZYDUSLIFE", "Healthcare", "Zydus Lifesciences Limited"),
  nse("LUPIN", "Healthcare", "Lupin Limited"),
  nse("MANKIND", "Healthcare", "Mankind Pharma Limited"),
  nse("ALKEM", "Healthcare", "Alkem Laboratories Limited"),
  nse("TORNTPHARM", "Healthcare", "Torrent Pharmaceuticals Limited"),
  nse("AUROPHARMA", "Healthcare", "Aurobindo Pharma Limited"),
  nse("BIOCON", "Healthcare", "Biocon Limited"),
  nse("GLENMARK", "Healthcare", "Glenmark Pharmaceuticals Limited"),
  nse("IPCA", "Healthcare", "IPCA Laboratories Limited"),
  nse("AJANTPHARM", "Healthcare", "Ajanta Pharma Limited"),
  nse("LAURUSLABS", "Healthcare", "Laurus Labs Limited"),
  nse("FORTIS", "Healthcare", "Fortis Healthcare Limited"),
  nse("MEDANTA", "Healthcare", "Global Health Limited (Medanta)"),
  nse("LALPATHLAB", "Healthcare", "Dr. Lal PathLabs Limited"),

  // Metals & Mining
  nse("TATASTEEL", "Metals", "Tata Steel Limited"),
  nse("JSWSTEEL", "Metals", "JSW Steel Limited"),
  nse("HINDALCO", "Metals", "Hindalco Industries Limited"),
  nse("VEDL", "Metals", "Vedanta Limited"),
  nse("SAIL", "Metals", "Steel Authority of India Limited (SAIL)"),
  nse("NMDC", "Metals", "NMDC Limited"),
  nse("NATIONALUM", "Metals", "National Aluminium Company Limited (NALCO)"),
  nse("HINDCOPPER", "Metals", "Hindustan Copper Limited"),
  nse("HINDZINC", "Metals", "Hindustan Zinc Limited"),
  nse("JINDALSTEL", "Metals", "Jindal Steel & Power Limited"),
  nse("JSL", "Metals", "Jindal Stainless Limited"),
  nse("APLAPOLLO", "Metals", "APL Apollo Tubes Limited"),

  // Oil, Gas & Energy
  nse("RELIANCE", "Energy", "Reliance Industries Limited"),
  nse("ONGC", "Energy", "Oil and Natural Gas Corporation Limited"),
  nse("BPCL", "Energy", "Bharat Petroleum Corporation Limited"),
  nse("IOC", "Energy", "Indian Oil Corporation Limited"),
  nse("COALINDIA", "Energy", "Coal India Limited"),
  nse("GAIL", "Energy", "GAIL (India) Limited"),
  nse("OIL", "Energy", "Oil India Limited"),
  nse("HINDPETRO", "Energy", "Hindustan Petroleum Corporation Limited"),
  nse("PETRONET", "Energy", "Petronet LNG Limited"),
  nse("IGL", "Energy", "Indraprastha Gas Limited"),
  nse("MGL", "Energy", "Mahanagar Gas Limited"),
  nse("GUJGASLTD", "Energy", "Gujarat Gas Limited"),

  // Power, Renewable Energy & Green Transition
  nse("NTPC", "Utilities", "NTPC Limited"),
  nse("POWERGRID", "Utilities", "Power Grid Corporation of India Limited"),
  nse("TATAPOWER", "Utilities", "Tata Power Company Limited"),
  nse("JSWENERGY", "Utilities", "JSW Energy Limited"),
  nse("TORNTPOWER", "Utilities", "Torrent Power Limited"),
  nse("NHPC", "Utilities", "NHPC Limited"),
  nse("SJVN", "Utilities", "SJVN Limited"),
  nse("SUZLON", "Utilities", "Suzlon Energy Limited"),
  nse("INOXWIND", "Utilities", "Inox Wind Limited"),
  nse("ADANIGREEN", "Utilities", "Adani Green Energy Limited"),
  nse("ADANIPOWER", "Utilities", "Adani Power Limited"),
  nse("CESC", "Utilities", "CESC Limited"),

  // Railways & Transportation
  nse("IRFC", "Railways", "Indian Railway Finance Corporation Limited (IRFC)"),
  nse("RVNL", "Railways", "Rail Vikas Nigam Limited (RVNL)"),
  nse("IRCTC", "Railways", "Indian Railway Catering & Tourism Corporation (IRCTC)"),
  nse("IRCON", "Railways", "Ircon International Limited"),
  nse("RITES", "Railways", "RITES Limited"),
  nse("RAILTEL", "Railways", "RailTel Corporation of India Limited"),
  nse("TITAGARH", "Railways", "Titagarh Rail Systems Limited"),

  // Defence & Shipbuilding
  nse("BEL", "Defence", "Bharat Electronics Limited (BEL)"),
  nse("HAL", "Defence", "Hindustan Aeronautics Limited (HAL)"),
  nse("MAZDOCK", "Defence", "Mazagon Dock Shipbuilders Limited"),
  nse("COCHINSHIP", "Defence", "Cochin Shipyard Limited"),
  nse("GRSE", "Defence", "Garden Reach Shipbuilders & Engineers Limited"),
  nse("BDL", "Defence", "Bharat Dynamics Limited"),
  nse("BEML", "Defence", "BEML Limited"),
  nse("MIDHANI", "Defence", "Mishra Dhatu Nigam Limited"),

  // Capital Goods & Heavy Engineering
  nse("LT", "Industrials", "Larsen & Toubro Limited"),
  nse("BHEL", "Industrials", "Bharat Heavy Electricals Limited (BHEL)"),
  nse("SIEMENS", "Industrials", "Siemens Limited"),
  nse("ABB", "Industrials", "ABB India Limited"),
  nse("CUMMINSIND", "Industrials", "Cummins India Limited"),
  nse("THERMAX", "Industrials", "Thermax Limited"),
  nse("POLYCAB", "Industrials", "Polycab India Limited"),
  nse("KEI", "Industrials", "KEI Industries Limited"),
  nse("HAVELLS", "Industrials", "Havells India Limited"),
  nse("VOLTAS", "Industrials", "Voltas Limited"),
  nse("BLUESTARCO", "Industrials", "Blue Star Limited"),
  nse("CROMPTON", "Industrials", "Crompton Greaves Consumer Electricals Limited"),
  nse("DIXON", "Industrials", "Dixon Technologies (India) Limited"),
  nse("AMBER", "Industrials", "Amber Enterprises India Limited"),
  nse("KAYNES", "Industrials", "Kaynes Technology India Limited"),

  // Cement & Building Materials
  nse("ULTRACEMCO", "Cement", "UltraTech Cement Limited"),
  nse("AMBUJACEM", "Cement", "Ambuja Cements Limited"),
  nse("GRASIM", "Cement", "Grasim Industries Limited"),
  nse("SHREECEM", "Cement", "Shree Cement Limited"),
  nse("DALBHARAT", "Cement", "Dalmia Bharat Limited"),
  nse("ACC", "Cement", "ACC Limited"),

  // Chemicals & Fertilizers
  nse("ASIANPAINT", "Chemicals", "Asian Paints Limited"),
  nse("PIDILITIND", "Chemicals", "Pidilite Industries Limited"),
  nse("BERGEPAINT", "Chemicals", "Berger Paints (India) Limited"),
  nse("TATACHEM", "Chemicals", "Tata Chemicals Limited"),
  nse("DEEPAKNTR", "Chemicals", "Deepak Nitrite Limited"),
  nse("ATUL", "Chemicals", "Atul Limited"),
  nse("NAVINFLUOR", "Chemicals", "Navin Fluorine International Limited"),
  nse("SRF", "Chemicals", "SRF Limited"),
  nse("AARTIIND", "Chemicals", "Aarti Industries Limited"),
  nse("PIIND", "Chemicals", "PI Industries Limited"),
  nse("UPL", "Chemicals", "UPL Limited"),
  nse("COROMANDEL", "Chemicals", "Coromandel International Limited"),
  nse("CHAMBLFERT", "Chemicals", "Chambal Fertilisers and Chemicals Limited"),
  nse("FACT", "Chemicals", "Fertilisers and Chemicals Travancore Limited"),

  // Realty & Real Estate
  nse("DLF", "Realty", "DLF Limited"),
  nse("PRESTIGE", "Realty", "Prestige Estates Projects Limited"),
  nse("GODREJPROP", "Realty", "Godrej Properties Limited"),
  nse("OBEROIRLTY", "Realty", "Oberoi Realty Limited"),
  nse("PHOENIXLTD", "Realty", "The Phoenix Mills Limited"),
  nse("BRIGADE", "Realty", "Brigade Enterprises Limited"),
  nse("SOBHA", "Realty", "Sobha Limited"),
  nse("MACROTECH", "Realty", "Macrotech Developers Limited (Lodha)"),
  nse("SIGNATURE", "Realty", "Signatureglobal (India) Limited"),

  // Consumer, Retail & Jewellery
  nse("TITAN", "Consumer", "Titan Company Limited"),
  nse("TRENT", "Consumer", "Trent Limited"),
  nse("DMART", "Consumer", "Avenue Supermarts Limited (DMart)"),
  nse("KALYANKJIL", "Consumer", "Kalyan Jewellers India Limited"),
  nse("SENCO", "Consumer", "Senco Gold Limited"),
  nse("PAGEIND", "Consumer", "Page Industries Limited"),
  nse("ABFRL", "Consumer", "Aditya Birla Fashion and Retail Limited"),
  nse("RAYMOND", "Consumer", "Raymond Limited"),
  nse("BATAINDIA", "Consumer", "Bata India Limited"),
  nse("METROBRAND", "Consumer", "Metro Brands Limited"),
  nse("REDTAPE", "Consumer", "Redtape Limited"),
  nse("INDIGO", "Aviation", "InterGlobe Aviation Limited (IndiGo)"),

  // Ports, Logistics & Telecom
  nse("ADANIENT", "Industrials", "Adani Enterprises Limited"),
  nse("ADANIPORTS", "Industrials", "Adani Ports and SEZ Limited"),
  nse("BHARTIARTL", "Telecom", "Bharti Airtel Limited"),
  nse("IDEA", "Telecom", "Vodafone Idea Limited"),
  nse("INDUSTOWER", "Telecom", "Indus Towers Limited"),
  nse("TATACOMM", "Telecom", "Tata Communications Limited"),
  nse("PVRINOX", "Media", "PVR INOX Limited"),
  nse("ZEEL", "Media", "Zee Entertainment Enterprises Limited"),

  // Retail Favorites, Smallcap Multibaggers & BSE Highlights
  nse("GUJTLRM", "Industrials", "Gujarat Toolroom Limited"),
  nse("PCJEWELLER", "Consumer", "PC Jeweller Limited"),
  nse("TAPARIA", "Industrials", "Taparia Tools Limited"),
  nse("ALOKINDS", "Textiles", "Alok Industries Limited"),
  nse("RPOWER", "Power", "Reliance Power Limited"),
  nse("JPPOWER", "Power", "Jaiprakash Power Ventures Limited"),
  nse("RTNPOWER", "Power", "RattanIndia Power Limited"),
  nse("RTNINDIA", "Consumer", "RattanIndia Enterprises Limited"),
  nse("BCG", "Information Technology", "Brightcom Group Limited"),
  nse("GTLINFRA", "Telecom", "GTL Infrastructure Limited"),
  nse("URJA", "Power", "Urja Global Limited"),
  nse("VIKASLIFE", "Chemicals", "Vikas Lifecare Limited"),
  nse("SOUTHBANK", "Banks", "The South Indian Bank Limited"),
  nse("TRIDENT", "Textiles", "Trident Limited"),
  nse("NBCC", "Realty", "NBCC (India) Limited"),
  nse("MMTC", "Metals", "MMTC Limited"),
  nse("EASEMYTRIP", "Consumer", "Easy Trip Planners Limited"),
  nse("HFCL", "Telecom", "HFCL Limited"),
  nse("LLOYDSENGG", "Industrials", "Lloyds Engineering Works Limited"),
  nse("RENUKA", "FMCG", "Shree Renuka Sugars Limited"),
  nse("MARKSANS", "Pharma", "Marksans Pharma Limited"),
  nse("SUBEX", "Information Technology", "Subex Limited"),
  nse("HCC", "Industrials", "Hindustan Construction Company Limited"),
  nse("INFIBEAM", "Fintech", "Infibeam Avenues Limited"),
  nse("JPASSOCIAT", "Industrials", "Jaiprakash Associates Limited"),
  nse("DISHTV", "Media", "Dish TV India Limited"),
  nse("VAKRANGEE", "Fintech", "Vakrangee Limited"),
  nse("SUVENPHAR", "Pharma", "Suven Pharmaceuticals Limited"),
  nse("DHANI", "Fintech", "Dhani Services Limited"),
  nse("TV18BRDCST", "Media", "TV18 Broadcast Limited"),
  nse("FCSSOFT", "Information Technology", "FCS Software Solutions Limited"),
  nse("VIKASECO", "Chemicals", "Vikas Ecotech Limited"),
  nse("3IINFOLTD", "Information Technology", "3i Infotech Limited"),
  nse("RCOM", "Telecom", "Reliance Communications Limited"),
  nse("GVKPIL", "Power", "GVK Power & Infrastructure Limited"),

  // Top Penny Gainers, Losers & High-Volume Movers (NSE & BSE)
  nse("MUNDUNURU", "Fintech", "Mundunuru Enterprises Limited"),
  nse("MUKTA", "Agriculture", "Mukta Agriculture Limited"),
  nse("PSIT", "Information Technology", "PS IT Infrastructure & Services Limited"),
  nse("LANDMARC", "Media", "Landmarc Leisure Corporation Limited"),
  nse("RGFCAP", "Financial Services", "RGF Capital Markets Limited"),
  nse("PARSVNATH", "Realty", "Parsvnath Developers Limited"),
  nse("CUBICAL", "Financial Services", "Cubical Financial Services Limited"),
  nse("SHARPINV", "Financial Services", "Sharp Investments Limited"),
  nse("ASHAPURI", "Consumer", "Ashapuri Gold Ornament Limited"),
  nse("TRIVENI", "Industrials", "Triveni Glass Limited"),
  nse("CHANDRIMA", "Textiles", "Chandrima Mercantiles Limited"),
  nse("ANUBHAV", "Infrastructure", "Anubhav Infrastructure Limited"),
  nse("IEL", "Trading", "IEL Limited"),
  nse("PARVATI", "Sugar", "Parvati Sweetners and Power Limited"),
  nse("THINKINK", "Media", "Thinkink Picturez Limited"),
  nse("LADAM", "Realty", "Ladam Affordable Housing Limited"),
  nse("DILIGENT", "Agriculture", "Diligent Industries Limited"),
  nse("PREMIEREN", "Infrastructure", "Premier Energy & Infrastructure Limited"),
  nse("SHUKRA", "Consumer", "Shukra Jewellery Limited"),
  nse("RAAMA", "Financial Services", "Raama Finance Limited"),
  nse("AAPLUS", "Trading", "AA Plus Tradelink Limited"),
  nse("WARDWIZARD", "Automobiles", "Wardwizard Innovations & Mobility Limited"),
  nse("GROWINGTON", "Logistics", "Growington Ventures India Limited"),
  nse("QUADRANT", "Telecom", "Quadrant Televentures Limited"),
  nse("CROPSTER", "Agriculture", "Cropster Agro Limited"),
  nse("LEADINGLEAS", "Financial Services", "Leading Leasing Finance & Investment Co Limited"),
  nse("SAMPRE", "FMCG", "Sampre Nutritions Limited"),
  nse("DUCON", "Infrastructure", "Ducon Infratechnologies Limited"),
  nse("ULTRACAB", "Industrials", "Ultracab (India) Limited"),
  nse("LANDSMILL", "Agriculture", "Landsmill Green Limited"),
  nse("CONSEC", "Financial Services", "Consecutive Investments & Trading Co Limited"),
  nse("DAVANGERE", "Sugar", "Davangere Sugar Company Limited"),
  nse("SHREESEC", "Financial Services", "Shree Securities Limited"),
  nse("GACM", "Fintech", "GACM Technologies Limited"),
  nse("TUNITEX", "Textiles", "Tuni Textile Mills Limited"),

  // Extended Index Constituents (Smallcap 100, Midcap 150, LargeMid 250, MidSmall 400)
  nse("5PAISA", "Diversified", "5PAISA Limited"),
  nse("AFFLE", "Diversified", "AFFLE Limited"),
  nse("AHLUCONT", "Diversified", "AHLUCONT Limited"),
  nse("AIAENG", "Diversified", "AIAENG Limited"),
  nse("AJMERA", "Diversified", "AJMERA Limited"),
  nse("ALLCARGO", "Diversified", "ALLCARGO Limited"),
  nse("AMIORG", "Diversified", "AMIORG Limited"),
  nse("ANANTRAJ", "Diversified", "ANANTRAJ Limited"),
  nse("ANDHRAPAP", "Diversified", "ANDHRAPAP Limited"),
  nse("ANUPAM", "Diversified", "ANUPAM Limited"),
  nse("ARVIND", "Diversified", "ARVIND Limited"),
  nse("ASHOKA", "Diversified", "ASHOKA Limited"),
  nse("ASTERDM", "Diversified", "ASTERDM Limited"),
  nse("ASTRAL", "Diversified", "ASTRAL Limited"),
  nse("ASTRAZEN", "Diversified", "ASTRAZEN Limited"),
  nse("ATGL", "Diversified", "ATGL Limited"),
  nse("BAJAJHLDNG", "Diversified", "BAJAJHLDNG Limited"),
  nse("BANCOINDIA", "Diversified", "BANCOINDIA Limited"),
  nse("BLISSGVS", "Diversified", "BLISSGVS Limited"),
  nse("BLS", "Diversified", "BLS Limited"),
  nse("BOMBAYDYE", "Diversified", "BOMBAYDYE Limited"),
  nse("BORORENEW", "Diversified", "BORORENEW Limited"),
  nse("CAMPUS", "Diversified", "CAMPUS Limited"),
  nse("CANFINHOME", "Financials", "CANFINHOME Limited"),
  nse("CAPACITE", "Financials", "CAPACITE Limited"),
  nse("CAPL", "Financials", "CAPL Limited"),
  nse("CENTURYPLY", "Diversified", "CENTURYPLY Limited"),
  nse("CENTURYTEX", "Diversified", "CENTURYTEX Limited"),
  nse("CERA", "Diversified", "CERA Limited"),
  nse("CGPOWER", "Utilities", "CGPOWER Limited"),
  nse("CLEAN", "Diversified", "CLEAN Limited"),
  nse("CRAFTSMAN", "Diversified", "CRAFTSMAN Limited"),
  nse("DATAMATICS", "Diversified", "DATAMATICS Limited"),
  nse("DATAPATTNS", "Diversified", "DATAPATTNS Limited"),
  nse("DBL", "Diversified", "DBL Limited"),
  nse("DCXINDIA", "Diversified", "DCXINDIA Limited"),
  nse("DECCANCE", "Diversified", "DECCANCE Limited"),
  nse("DEEPAKFERT", "Chemicals", "DEEPAKFERT Limited"),
  nse("DEVYANI", "Diversified", "DEVYANI Limited"),
  nse("DFMFOODS", "Consumer", "DFMFOODS Limited"),
  nse("DODLA", "Diversified", "DODLA Limited"),
  nse("DOLLAR", "Diversified", "DOLLAR Limited"),
  nse("DREDGECORP", "Diversified", "DREDGECORP Limited"),
  nse("DYNAMATECH", "Information Technology", "DYNAMATECH Limited"),
  nse("ELECON", "Diversified", "ELECON Limited"),
  nse("ERIS", "Diversified", "ERIS Limited"),
  nse("ESAF", "Diversified", "ESAF Limited"),
  nse("ETHOSLTD", "Diversified", "ETHOSLTD Limited"),
  nse("FDC", "Diversified", "FDC Limited"),
  nse("FIEMIND", "Diversified", "FIEMIND Limited"),
  nse("FINPIPE", "Financials", "FINPIPE Limited"),
  nse("GABRIEL", "Diversified", "GABRIEL Limited"),
  nse("GALLANTT", "Diversified", "GALLANTT Limited"),
  nse("GARFIBRES", "Diversified", "GARFIBRES Limited"),
  nse("GATEWAY", "Diversified", "GATEWAY Limited"),
  nse("GEOJITFSL", "Diversified", "GEOJITFSL Limited"),
  nse("GMRINFRA", "Industrials", "GMRINFRA Limited"),
  nse("GNFC", "Diversified", "GNFC Limited"),
  nse("GOCOLORS", "Diversified", "GOCOLORS Limited"),
  nse("GOKEX", "Diversified", "GOKEX Limited"),
  nse("GOODLUCK", "Diversified", "GOODLUCK Limited"),
  nse("GRAVITA", "Diversified", "GRAVITA Limited"),
  nse("GREENPANEL", "Diversified", "GREENPANEL Limited"),
  nse("GREENPLY", "Diversified", "GREENPLY Limited"),
  nse("GRINFRA", "Industrials", "GRINFRA Limited"),
  nse("GSFC", "Diversified", "GSFC Limited"),
  nse("GUFICBIO", "Healthcare", "GUFICBIO Limited"),
  nse("GULFPETRO", "Diversified", "GULFPETRO Limited"),
  nse("HATSUN", "Diversified", "HATSUN Limited"),
  nse("HBLPOWER", "Utilities", "HBLPOWER Limited"),
  nse("HEIDELBERG", "Diversified", "HEIDELBERG Limited"),
  nse("HERITGFOOD", "Consumer", "HERITGFOOD Limited"),
  nse("HGINFRA", "Industrials", "HGINFRA Limited"),
  nse("HIMATSEIDE", "Diversified", "HIMATSEIDE Limited"),
  nse("ICICIGI", "Diversified", "ICICIGI Limited"),
  nse("IIFL", "Diversified", "IIFL Limited"),
  nse("INDIGOPNTS", "Diversified", "INDIGOPNTS Limited"),
  nse("INTELLECT", "Diversified", "INTELLECT Limited"),
  nse("IRB", "Diversified", "IRB Limited"),
  nse("ITDCEIL", "Diversified", "ITDCEIL Limited"),
  nse("JAYAGRO", "Diversified", "JAYAGRO Limited"),
  nse("JAYBARMARU", "Diversified", "JAYBARMARU Limited"),
  nse("JINDALPOLY", "Chemicals", "JINDALPOLY Limited"),
  nse("JKPAPER", "Diversified", "JKPAPER Limited"),
  nse("JKTYRE", "Automobile", "JKTYRE Limited"),
  nse("JUBLFOOD", "Consumer", "JUBLFOOD Limited"),
  nse("JUPITERIN", "Diversified", "JUPITERIN Limited"),
  nse("KAJARIACER", "Diversified", "KAJARIACER Limited"),
  nse("KALPATPOWR", "Diversified", "KALPATPOWR Limited"),
  nse("KANSAINER", "Diversified", "KANSAINER Limited"),
  nse("KEC", "Diversified", "KEC Limited"),
  nse("KFINTECH", "Financials", "KFINTECH Limited"),
  nse("KIMS", "Diversified", "KIMS Limited"),
  nse("KIRLFER", "Diversified", "KIRLFER Limited"),
  nse("KIRLOSBROS", "Diversified", "KIRLOSBROS Limited"),
  nse("KIRLOSENG", "Diversified", "KIRLOSENG Limited"),
  nse("KNRCON", "Diversified", "KNRCON Limited"),
  nse("KOLTEPATIL", "Diversified", "KOLTEPATIL Limited"),
  nse("KOPRAN", "Diversified", "KOPRAN Limited"),
  nse("KPRMILL", "Textiles", "KPRMILL Limited"),
  nse("KUMAR", "Diversified", "KUMAR Limited"),
  nse("KWALITY", "Diversified", "KWALITY Limited"),
  nse("LIBERTSHOE", "Diversified", "LIBERTSHOE Limited"),
  nse("LICI", "Diversified", "LICI Limited"),
  nse("LINCOLN", "Diversified", "LINCOLN Limited"),
  nse("LUMAXIND", "Diversified", "LUMAXIND Limited"),
  nse("LUMAXTECH", "Information Technology", "LUMAXTECH Limited"),
  nse("LUXIND", "Diversified", "LUXIND Limited"),
  nse("MAHLOG", "Diversified", "MAHLOG Limited"),
  nse("MANGALAM", "Diversified", "MANGALAM Limited"),
  nse("MANINFRA", "Industrials", "MANINFRA Limited"),
  nse("MANYAVAR", "Diversified", "MANYAVAR Limited"),
  nse("MASTEK", "Diversified", "MASTEK Limited"),
  nse("MINDAIND", "Diversified", "MINDAIND Limited"),
  nse("MIRZAINT", "Diversified", "MIRZAINT Limited"),
  nse("MONTECARLO", "Diversified", "MONTECARLO Limited"),
  nse("MOREPENLAB", "Healthcare", "MOREPENLAB Limited"),
  nse("MOTILALOFS", "Diversified", "MOTILALOFS Limited"),
  nse("MTARTECH", "Information Technology", "MTARTECH Limited"),
  nse("MUNJALAU", "Diversified", "MUNJALAU Limited"),
  nse("NAHARSPING", "Diversified", "NAHARSPING Limited"),
  nse("NATCOPHARM", "Healthcare", "NATCOPHARM Limited"),
  nse("NAUKRI", "Diversified", "NAUKRI Limited"),
  nse("NCC", "Diversified", "NCC Limited"),
  nse("NCLIND", "Diversified", "NCLIND Limited"),
  nse("NELCO", "Diversified", "NELCO Limited"),
  nse("NEOGEN", "Diversified", "NEOGEN Limited"),
  nse("NETWORK18", "Diversified", "NETWORK18 Limited"),
  nse("NEULANDLAB", "Healthcare", "NEULANDLAB Limited"),
  nse("NEWGEN", "Diversified", "NEWGEN Limited"),
  nse("NFL", "Diversified", "NFL Limited"),
  nse("ORIENTCEM", "Diversified", "ORIENTCEM Limited"),
  nse("ORIENTHOT", "Diversified", "ORIENTHOT Limited"),
  nse("PANACEABIO", "Healthcare", "PANACEABIO Limited"),
  nse("PARAS", "Diversified", "PARAS Limited"),
  nse("PENIND", "Diversified", "PENIND Limited"),
  nse("PITTIENG", "Diversified", "PITTIENG Limited"),
  nse("PNCINFRA", "Industrials", "PNCINFRA Limited"),
  nse("POLYMED", "Healthcare", "POLYMED Limited"),
  nse("PRAJIND", "Diversified", "PRAJIND Limited"),
  nse("PRAKASH", "Diversified", "PRAKASH Limited"),
  nse("PREMIER", "Diversified", "PREMIER Limited"),
  nse("PRICOLLTD", "Diversified", "PRICOLLTD Limited"),
  nse("PRINCEPIPE", "Diversified", "PRINCEPIPE Limited"),
  nse("PROTEAN", "Diversified", "PROTEAN Limited"),
  nse("PSPPROJECT", "Diversified", "PSPPROJECT Limited"),
  nse("PURVA", "Diversified", "PURVA Limited"),
  nse("QUICKHEAL", "Diversified", "QUICKHEAL Limited"),
  nse("RAINBOW", "Diversified", "RAINBOW Limited"),
  nse("RANEHOLDIN", "Diversified", "RANEHOLDIN Limited"),
  nse("RATEGAIN", "Diversified", "RATEGAIN Limited"),
  nse("RATNAMANI", "Diversified", "RATNAMANI Limited"),
  nse("RCF", "Diversified", "RCF Limited"),
  nse("ROLEXRINGS", "Diversified", "ROLEXRINGS Limited"),
  nse("ROSSARI", "Diversified", "ROSSARI Limited"),
  nse("ROUTE", "Diversified", "ROUTE Limited"),
  nse("RUPA", "Diversified", "RUPA Limited"),
  nse("SAGCEM", "Diversified", "SAGCEM Limited"),
  nse("SAKSOFT", "Information Technology", "SAKSOFT Limited"),
  nse("SALASAR", "Diversified", "SALASAR Limited"),
  nse("SANDHAR", "Diversified", "SANDHAR Limited"),
  nse("SANSERA", "Diversified", "SANSERA Limited"),
  nse("SAPPHIRE", "Diversified", "SAPPHIRE Limited"),
  nse("SCHAEFFLER", "Diversified", "SCHAEFFLER Limited"),
  nse("SCI", "Diversified", "SCI Limited"),
  nse("SESHAPAPER", "Diversified", "SESHAPAPER Limited"),
  nse("SFL", "Diversified", "SFL Limited"),
  nse("SHALPAINTS", "Diversified", "SHALPAINTS Limited"),
  nse("SHARDACROP", "Diversified", "SHARDACROP Limited"),
  nse("SHIVALIK", "Diversified", "SHIVALIK Limited"),
  nse("SIYARAM", "Diversified", "SIYARAM Limited"),
  nse("SKFINDIA", "Financials", "SKFINDIA Limited"),
  nse("SMSPHARMA", "Healthcare", "SMSPHARMA Limited"),
  nse("SOLARA", "Utilities", "SOLARA Limited"),
  nse("SOLARINDS", "Utilities", "SOLARINDS Limited"),
  nse("SOMANYCERA", "Diversified", "SOMANYCERA Limited"),
  nse("SPIC", "Diversified", "SPIC Limited"),
  nse("STARCEMENT", "Industrials", "STARCEMENT Limited"),
  nse("STARPAPER", "Diversified", "STARPAPER Limited"),
  nse("SUBROS", "Diversified", "SUBROS Limited"),
  nse("SUNDRMFAST", "Diversified", "SUNDRMFAST Limited"),
  nse("SUNTV", "Diversified", "SUNTV Limited"),
  nse("SUPRAJIT", "Diversified", "SUPRAJIT Limited"),
  nse("SUPREMEIND", "Diversified", "SUPREMEIND Limited"),
  nse("SWANENERGY", "Utilities", "SWANENERGY Limited"),
  nse("SYNGENE", "Diversified", "SYNGENE Limited"),
  nse("TALBROSENG", "Diversified", "TALBROSENG Limited"),
  nse("TANLA", "Diversified", "TANLA Limited"),
  nse("TASTYBITE", "Diversified", "TASTYBITE Limited"),
  nse("TATVA", "Diversified", "TATVA Limited"),
  nse("TCIEXP", "Diversified", "TCIEXP Limited"),
  nse("TCNSBRANDS", "Diversified", "TCNSBRANDS Limited"),
  nse("TEXRAIL", "Diversified", "TEXRAIL Limited"),
  nse("THEMISMED", "Healthcare", "THEMISMED Limited"),
  nse("TIMETECHNO", "Information Technology", "TIMETECHNO Limited"),
  nse("TIMKEN", "Diversified", "TIMKEN Limited"),
  nse("TNPL", "Diversified", "TNPL Limited"),
  nse("TVSSRICHAK", "Diversified", "TVSSRICHAK Limited"),
  nse("UNITEDSPR", "Diversified", "UNITEDSPR Limited"),
  nse("UTKARSH", "Diversified", "UTKARSH Limited"),
  nse("VADILALIND", "Diversified", "VADILALIND Limited"),
  nse("VAIBHAVGBL", "Diversified", "VAIBHAVGBL Limited"),
  nse("VARROC", "Diversified", "VARROC Limited"),
  nse("VENKYS", "Diversified", "VENKYS Limited"),
  nse("VRLLOG", "Diversified", "VRLLOG Limited"),
  nse("VSTTILLERS", "Diversified", "VSTTILLERS Limited"),
  nse("VTL", "Diversified", "VTL Limited"),
  nse("WELSPUNLIV", "Diversified", "WELSPUNLIV Limited"),
  nse("WESTLIFE", "Diversified", "WESTLIFE Limited"),
  nse("WHIRLPOOL", "Diversified", "WHIRLPOOL Limited"),
  nse("WSTCSTPAPR", "Diversified", "WSTCSTPAPR Limited"),
  nse("ZENSARTECH", "Information Technology", "ZENSARTECH Limited"),
  nse("ZOMATO", "Diversified", "ZOMATO Limited"),
  nse("ZYDUSWELL", "Diversified", "ZYDUSWELL Limited"),
];

/** Full parity: Every single stock in the book trades on BSE with the same ticker. */
export const BSE_BOOK: Instrument[] = NSE_BOOK.map((row) =>
  bse(row.ticker, row.sector, row.name)
);

export const TOP_PICKS: Instrument[] = [
  { symbol: "^NSEI", ticker: "NIFTY 50", exchange: "INDEX", sector: "Index", name: "NIFTY 50", kind: "index" },
  { symbol: "^BSESN", ticker: "SENSEX", exchange: "INDEX", sector: "Index", name: "S&P BSE SENSEX", kind: "index" },
  { symbol: "^NSEBANK", ticker: "BANKNIFTY", exchange: "INDEX", sector: "Index", name: "NIFTY BANK", kind: "index" },
  { symbol: "^PENNY", ticker: "PENNY STOCKS", exchange: "INDEX", sector: "Penny Stocks", name: "NSE & BSE Penny Stocks (< ₹50)", kind: "index" },
  { symbol: "RELIANCE.NS", ticker: "RELIANCE", exchange: "NSE", sector: "Energy", name: "Reliance Industries Limited", kind: "equity" },
  { symbol: "TCS.NS", ticker: "TCS", exchange: "NSE", sector: "Information Technology", name: "Tata Consultancy Services Limited", kind: "equity" },
  { symbol: "HDFCBANK.NS", ticker: "HDFCBANK", exchange: "NSE", sector: "Banks", name: "HDFC Bank Limited", kind: "equity" },
  { symbol: "INFY.NS", ticker: "INFY", exchange: "NSE", sector: "Information Technology", name: "Infosys Limited", kind: "equity" },
  { symbol: "ICICIBANK.NS", ticker: "ICICIBANK", exchange: "NSE", sector: "Banks", name: "ICICI Bank Limited", kind: "equity" },
  { symbol: "SBIN.NS", ticker: "SBIN", exchange: "NSE", sector: "Banks", name: "State Bank of India", kind: "equity" },
  { symbol: "BHARTIARTL.NS", ticker: "BHARTIARTL", exchange: "NSE", sector: "Telecom", name: "Bharti Airtel Limited", kind: "equity" },
  { symbol: "ITC.NS", ticker: "ITC", exchange: "NSE", sector: "FMCG", name: "ITC Limited", kind: "equity" },
  { symbol: "TMPV.NS", ticker: "TATAMOTORS", exchange: "NSE", sector: "Auto", name: "Tata Motors Passenger Vehicles Limited (TATAMOTORS)", kind: "equity" },
  { symbol: "ETERNAL.NS", ticker: "ZOMATO", exchange: "NSE", sector: "Consumer", name: "Eternal Limited (Zomato)", kind: "equity" },
  { symbol: "PCJEWELLER.NS", ticker: "PCJEWELLER", exchange: "NSE", sector: "Consumer", name: "PC Jeweller Limited (PCJ)", kind: "equity" },
  { symbol: "GUJTLRM.BO", ticker: "GUJTLRM", exchange: "BSE", sector: "Industrials", name: "Gujarat Toolroom Limited", kind: "equity" },
  { symbol: "TAPARIA.BO", ticker: "TAPARIA", exchange: "BSE", sector: "Industrials", name: "Taparia Tools Limited", kind: "equity" },
];

export const ALL_INSTRUMENTS: Instrument[] = [...INDICES, ...NSE_BOOK, ...BSE_BOOK];

export type ConstituentStock = {
  symbol: string;
  ticker: string;
  label: string;
  name: string;
  sector: string;
};

function makeConstituents(tickers: string[], exchange: "NSE" | "BSE" = "NSE"): ConstituentStock[] {
  return tickers.map((t) => {
    const symbol = exchange === "BSE" ? `${t}.BO` : `${t}.NS`;
    const bookItem = exchange === "BSE"
      ? BSE_BOOK.find((b) => b.ticker === t)
      : NSE_BOOK.find((n) => n.ticker === t);
    const label = t === "TMPV" ? "TATAMOTORS" : t === "ETERNAL" ? "ZOMATO" : t;
    const name = bookItem?.name ?? label;
    const sector = bookItem?.sector ?? "Equity";
    return { symbol, ticker: t, label, name, sector };
  });
}

export const INDEX_CONSTITUENTS: Record<string, ConstituentStock[]> = {
  "^PENNY": makeConstituents([
    // Active Top Gainers, Losers & High-Volume Movers from latest market scan
    "MUNDUNURU", "MUKTA", "PSIT", "LANDMARC", "RGFCAP", "PARSVNATH", "CUBICAL",
    "SHARPINV", "ASHAPURI", "TRIVENI", "CHANDRIMA", "ANUBHAV", "IEL", "PARVATI",
    "THINKINK", "LADAM", "DILIGENT", "PREMIEREN", "SHUKRA", "RAAMA", "AAPLUS",
    "WARDWIZARD", "GROWINGTON", "QUADRANT", "CROPSTER", "LEADINGLEAS", "SAMPRE",
    "DUCON", "ULTRACAB", "LANDSMILL", "CONSEC", "DAVANGERE", "SHREESEC", "GACM", "TUNITEX",
    // Broad Retail Favorites
    "GUJTLRM", "RCOM", "VIKASECO", "FCSSOFT", "GTLINFRA", "GVKPIL", "BCG", "IDEA",
    "JPASSOCIAT", "DISHTV", "PCJEWELLER", "RTNPOWER", "TAPARIA", "JPPOWER", "URJA",
    "3IINFOLTD", "YESBANK", "ALOKINDS", "VAKRANGEE", "SOUTHBANK", "INFIBEAM", "SUBEX",
    "EASEMYTRIP", "TRIDENT", "RPOWER", "HCC", "TV18BRDCST", "UCOBANK", "RENUKA",
    "IOB", "CENTRALBK", "MAHABANK", "UJJIVANSFB", "SUZLON", "VIKASLIFE", "DHANI",
  ]),
  "^INDIAVIX": makeConstituents([
    "RELIANCE", "HDFCBANK", "ICICIBANK", "INFY", "TCS", "ITC", "LT", "SBIN", "BHARTIARTL", "AXISBANK",
    "KOTAKBANK", "MARUTI", "BAJFINANCE", "M&M", "SUNPHARMA", "TITAN", "NTPC", "TMPV",
  ]),
  "^GIFTNIFTY": makeConstituents([
    "RELIANCE", "TCS", "HDFCBANK", "ICICIBANK", "BHARTIARTL", "INFY", "ITC", "SBIN",
    "LT", "HINDUNILVR", "AXISBANK", "KOTAKBANK", "M&M", "MARUTI", "SUNPHARMA", "TITAN",
    "BAJFINANCE", "BAJAJFINSV", "TATASTEEL", "NTPC", "POWERGRID", "ASIANPAINT",
  ]),
  "^NSEI": makeConstituents([
    "RELIANCE", "TCS", "HDFCBANK", "ICICIBANK", "BHARTIARTL", "INFY", "ITC", "SBIN",
    "LT", "HINDUNILVR", "AXISBANK", "KOTAKBANK", "M&M", "MARUTI", "SUNPHARMA", "TITAN",
    "BAJFINANCE", "BAJAJFINSV", "TATASTEEL", "NTPC", "POWERGRID", "ASIANPAINT",
    "ULTRACEMCO", "TECHM", "HCLTECH", "WIPRO", "JSWSTEEL", "INDUSINDBK", "NESTLEIND",
    "ADANIPORTS", "ADANIENT", "COALINDIA", "ONGC", "BPCL", "GRASIM", "CIPLA",
    "DRREDDY", "APOLLOHOSP", "BRITANNIA", "EICHERMOT", "HEROMOTOCO", "TATACONSUM",
    "TMPV", "BEL", "TRENT", "SHREECEM", "TATAPOWER", "SUZLON", "BHEL",
  ]),
  "^BSESN": makeConstituents([
    "RELIANCE", "TCS", "HDFCBANK", "ICICIBANK", "BHARTIARTL", "INFY", "ITC", "SBIN",
    "LT", "HINDUNILVR", "AXISBANK", "KOTAKBANK", "M&M", "MARUTI", "SUNPHARMA", "TITAN",
    "BAJFINANCE", "BAJAJFINSV", "TATASTEEL", "NTPC", "POWERGRID", "ASIANPAINT",
    "ULTRACEMCO", "TECHM", "HCLTECH", "WIPRO", "JSWSTEEL", "INDUSINDBK", "NESTLEIND",
    "ADANIPORTS",
  ], "BSE"),
  "^NSEBANK": makeConstituents([
    "HDFCBANK", "ICICIBANK", "SBIN", "KOTAKBANK", "AXISBANK", "INDUSINDBK", "BANKBARODA",
    "PNB", "CANBK", "FEDERALBNK", "IDFCFIRSTB", "AUBANK", "YESBANK",
  ]),
  "^CNXPSUBANK": makeConstituents([
    "SBIN", "PNB", "CANBK", "BANKBARODA", "UNIONBANK", "BANKINDIA", "INDIANB", "MAHABANK",
    "CENTRALBK", "UCOBANK", "IOB",
  ]),
  "^CNXIT": makeConstituents([
    "TCS", "INFY", "HCLTECH", "WIPRO", "TECHM", "LTIM", "PERSISTENT", "COFORGE",
    "MPHASIS", "LTTS", "KPITTECH", "TATAELXSI",
  ]),
  "^CNXFIN": makeConstituents([
    "HDFCBANK", "ICICIBANK", "SBIN", "KOTAKBANK", "AXISBANK", "BAJFINANCE", "BAJAJFINSV",
    "SHRIRAMFIN", "JIOFIN", "CHOLAFIN", "MUTHOOTFIN", "POONAWALLA", "PFC", "RECLTD",
    "HUDCO", "IREDA", "SBILIFE", "HDFCLIFE",
  ]),
  "^NSEMDCP50": makeConstituents([
    "TRENT", "BEL", "HAL", "POLYCAB", "MAXHEALTH", "ETERNAL", "INDIGO", "DLF",
    "SIEMENS", "DMART", "PIDILITIND", "AMBUJACEM", "SUZLON", "TATAPOWER", "IRFC",
    "RVNL", "BHEL", "SAIL", "NMDC", "PERSISTENT", "COFORGE", "LTIM",
  ]),
  "^CNXAUTO": makeConstituents([
    "MARUTI", "M&M", "TMPV", "BAJAJ-AUTO", "EICHERMOT", "HEROMOTOCO", "TVSMOTOR",
    "BHARATFORG", "ASHOKLEY", "ESCORTS", "MOTHERSON", "BOSCHLTD", "MRF", "APOLLOTYRE",
  ]),
  "^CNXFMCG": makeConstituents([
    "HINDUNILVR", "ITC", "NESTLEIND", "BRITANNIA", "TATACONSUM", "DABUR", "MARICO",
    "COLPAL", "GODREJCP", "VBL", "RADICO", "UBL", "MCDOWELL-N",
  ]),
  "^CNXPHARMA": makeConstituents([
    "SUNPHARMA", "CIPLA", "DRREDDY", "DIVISLAB", "APOLLOHOSP", "MAXHEALTH",
    "ZYDUSLIFE", "LUPIN", "MANKIND", "ALKEM", "TORNTPHARM", "AUROPHARMA", "BIOCON",
    "GLENMARK", "IPCA",
  ]),
  "^CNXMETAL": makeConstituents([
    "TATASTEEL", "JSWSTEEL", "HINDALCO", "VEDL", "SAIL", "NMDC", "NATIONALUM",
    "HINDCOPPER", "HINDZINC", "JINDALSTEL", "JSL", "APLAPOLLO",
  ]),
  "^CNXENERGY": makeConstituents([
    "RELIANCE", "ONGC", "BPCL", "IOC", "COALINDIA", "NTPC", "POWERGRID", "GAIL",
    "TATAPOWER", "JSWENERGY", "TORNTPOWER", "NHPC", "SJVN", "SUZLON", "INOXWIND",
    "ADANIGREEN", "ADANIPOWER",
  ]),
  "^CNXINFRA": makeConstituents([
    "LT", "BEL", "HAL", "MAZDOCK", "COCHINSHIP", "GRSE", "BDL", "BEML", "BHEL",
    "SIEMENS", "ABB", "POLYCAB", "KEI", "IRFC", "RVNL", "IRCTC", "IRCON",
    "ADANIENT", "ADANIPORTS",
  ]),
  "^CNXREALTY": makeConstituents([
    "DLF", "PRESTIGE", "GODREJPROP", "OBEROIRLTY", "PHOENIXLTD", "BRIGADE", "SOBHA",
    "MACROTECH", "SIGNATURE",
  ]),
  "^CNXCONSUMER": makeConstituents([
    "TITAN", "TRENT", "DMART", "ETERNAL", "PAYTM", "POLICYBZR", "NYKAA", "SWIGGY",
    "BSE", "CDSL", "MCX", "ANGELONE", "KALYANKJIL", "PAGEIND", "BATAINDIA", "INDIGO",
  ]),
  "^BSE100": makeConstituents([
    "RELIANCE", "TCS", "HDFCBANK", "ICICIBANK", "BHARTIARTL", "INFY", "ITC", "SBIN",
    "LT", "HINDUNILVR", "AXISBANK", "KOTAKBANK", "M&M", "MARUTI", "SUNPHARMA", "TITAN",
    "BAJFINANCE", "BAJAJFINSV", "TATASTEEL", "NTPC", "POWERGRID", "ASIANPAINT",
    "ULTRACEMCO", "BEL", "HAL", "TMPV", "COALINDIA", "ONGC", "TRENT", "ETERNAL",
    "SUZLON", "TATAPOWER", "BHEL", "SAIL",
  ], "BSE"),
  "^CNXSC": makeConstituents([
    "SUZLON", "IRFC", "RVNL", "HUDCO", "IREDA", "MAZDOCK", "COCHINSHIP", "GRSE", "BEML", "TITAGARH",
    "RAILTEL", "RITES", "IRCON", "NBCC", "CENTRALBK", "UCOBANK", "IOB", "MAHABANK", "UJJIVANSFB", "EQUITASBNK",
    "SOUTHBANK", "IDFCFIRSTB", "YESBANK", "ALOKINDS", "TRIDENT", "HFCL", "LLOYDSENGG", "MARKSANS", "SUBEX", "INFIBEAM",
    "PCJEWELLER", "KALYANKJIL", "RADICO", "CDSL", "ANGELONE", "BSE", "BCG", "URJA", "VIKASLIFE", "EASEMYTRIP",
    "HCC", "DISHTV", "JPASSOCIAT", "RPOWER", "JPPOWER", "RTNPOWER", "RTNINDIA", "VIKASECO", "FCSSOFT", "GTLINFRA",
    "GVKPIL", "IDEA", "TAPARIA", "GUJTLRM", "3IINFOLTD", "VAKRANGEE", "DHANI", "MUNDUNURU", "MUKTA", "PSIT",
    "LANDMARC", "RGFCAP", "PARSVNATH", "CUBICAL", "SHARPINV", "ASHAPURI", "TRIVENI", "CHANDRIMA", "ANUBHAV", "IEL",
    "PARVATI", "THINKINK", "LADAM", "DILIGENT", "PREMIEREN", "SHUKRA", "RAAMA", "AAPLUS", "WARDWIZARD", "GROWINGTON",
    "QUADRANT", "CROPSTER", "LEADINGLEAS", "SAMPRE", "DUCON", "ULTRACAB", "LANDSMILL", "CONSEC", "DAVANGERE", "SHREESEC",
    "GACM", "TUNITEX", "KARURVYSYA", "CUB", "ESAF", "JSFB", "SURYODAY", "UTKARSH", "CAPITALSFB", "TV18BRDCST",
  ]),
  "^NSEMDCP150": makeConstituents([
    "AUBANK", "FEDERALBNK", "IDFCFIRSTB", "BANDHANBNK", "RBLBANK", "PERSISTENT", "COFORGE", "MPHASIS", "LTTS", "KPITTECH",
    "TATAELXSI", "ASHOKLEY", "BHARATFORG", "ESCORTS", "BALKRISIND", "MRF", "APOLLOTYRE", "ALKEM", "LUPIN", "MANKIND",
    "AUROPHARMA", "BIOCON", "GLENMARK", "IPCA", "LAURUSLABS", "NATCOPHARM", "SAIL", "NMDC", "NATIONALUM", "HINDCOPPER",
    "HINDZINC", "JSL", "APLAPOLLO", "RATNAMANI", "TORNTPOWER", "NHPC", "SJVN", "INOXWIND", "CESC", "GUJGASLTD",
    "MAZDOCK", "COCHINSHIP", "GRSE", "BDL", "BEML", "TITAGARH", "RAILTEL", "RITES", "IRCON", "POLYCAB",
    "KEI", "VOLTAS", "BLUESTARCO", "CROMPTON", "WHIRLPOOL", "DIXON", "KAYNES", "PRESTIGE", "GODREJPROP", "OBEROIRLTY",
    "PHOENIXLTD", "BRIGADE", "SOBHA", "MACROTECH", "SIGNATURE", "RADICO", "UBL", "MCDOWELL-N", "DEVYANI", "JUBLFOOD",
    "WESTLIFE", "SAPPHIRE", "PAYTM", "POLICYBZR", "NYKAA", "SWIGGY", "BSE", "CDSL", "MCX", "ANGELONE",
    "KALYANKJIL", "PAGEIND", "BATAINDIA", "MUTHOOTFIN", "POONAWALLA", "MANAPPURAM", "M&MFIN", "LICHSGFIN", "CANFINHOME", "HUDCO",
    "IREDA", "ASTRAL", "SUPREMEIND", "FINPIPE", "PRINCEPIPE", "KAJARIACER", "CERA", "PIIND", "UPL", "COROMANDEL",
    "DEEPAKNTR", "TATACHEM", "SRF", "NAVINFLUOR", "AARTIIND", "ATUL", "SOLARINDS", "AIAENG", "THERMAX", "KUMAR",
    "CUMMINSIND", "TIMKEN", "SKFINDIA", "SUNTV", "ZEEL", "PVRINOX", "NETWORK18", "ABFRL", "MANYAVAR", "METROBRAND",
    "CAMPUS", "SYNGENE", "FORTIS", "ASTERDM", "MEDANTA", "RAINBOW", "KIMS", "GMRINFRA", "AFFLE", "SONACOMS",
    "ENDURANCE", "EXIDEIND", "AMARAJABAT", "CGPOWER", "SUNDRMFAST", "SCHAEFFLER", "KEC", "KALPATPOWR", "ZENSARTECH", "CYIENT",
    "SONATSOFTW", "MASTEK", "BSOFT", "INTELLECT", "ALLCARGO", "TCIEXP", "VRLLOG", "GATEWAY", "MAHLOG", "SCI",
  ]),
  "^NSELM250": makeConstituents([
    "RELIANCE", "TCS", "HDFCBANK", "ICICIBANK", "BHARTIARTL", "INFY", "ITC", "SBIN", "LT", "HINDUNILVR",
    "AXISBANK", "KOTAKBANK", "M&M", "MARUTI", "SUNPHARMA", "TITAN", "BAJFINANCE", "BAJAJFINSV", "TATASTEEL", "NTPC",
    "POWERGRID", "ASIANPAINT", "ULTRACEMCO", "TECHM", "HCLTECH", "WIPRO", "JSWSTEEL", "INDUSINDBK", "NESTLEIND", "ADANIPORTS",
    "ADANIENT", "COALINDIA", "ONGC", "BPCL", "GRASIM", "CIPLA", "DRREDDY", "APOLLOHOSP", "BRITANNIA", "EICHERMOT",
    "HEROMOTOCO", "TATACONSUM", "TMPV", "BEL", "TRENT", "SHREECEM", "TATAPOWER", "SUZLON", "BHEL", "HINDALCO",
    "ABB", "ADANIGREEN", "ADANIPOWER", "AMBUJACEM", "ATGL", "BAJAJHLDNG", "BANKBARODA", "BERGEPAINT", "BOSCHLTD", "CANBK",
    "CHOLAFIN", "COLPAL", "DLF", "DMART", "GAIL", "GODREJCP", "HAL", "HAVELLS", "ICICIGI", "ICICIPRULI",
    "IOC", "IRCTC", "IRFC", "JINDALSTEL", "JIOFIN", "JSWENERGY", "LICI", "LTIM", "MARICO", "MOTHERSON",
    "NAUKRI", "PIDILITIND", "PFC", "PNB", "RECLTD", "SBILIFE", "SHRIRAMFIN", "SIEMENS", "TORNTPHARM", "TVSMOTOR",
    "UNITEDSPR", "VBL", "VEDL", "ZOMATO", "ZYDUSLIFE", "MAXHEALTH", "ETERNAL", "DIVISLAB", "DABUR", "INDIGO",
    "AUBANK", "FEDERALBNK", "IDFCFIRSTB", "BANDHANBNK", "RBLBANK", "PERSISTENT", "COFORGE", "MPHASIS", "LTTS", "KPITTECH",
    "TATAELXSI", "ASHOKLEY", "BHARATFORG", "ESCORTS", "BALKRISIND", "MRF", "APOLLOTYRE", "ALKEM", "LUPIN", "MANKIND",
    "AUROPHARMA", "BIOCON", "GLENMARK", "IPCA", "LAURUSLABS", "NATCOPHARM", "SAIL", "NMDC", "NATIONALUM", "HINDCOPPER",
    "HINDZINC", "JSL", "APLAPOLLO", "RATNAMANI", "TORNTPOWER", "NHPC", "SJVN", "INOXWIND", "CESC", "GUJGASLTD",
    "MAZDOCK", "COCHINSHIP", "GRSE", "BDL", "BEML", "TITAGARH", "RAILTEL", "RITES", "IRCON", "POLYCAB",
    "KEI", "VOLTAS", "BLUESTARCO", "CROMPTON", "WHIRLPOOL", "DIXON", "KAYNES", "PRESTIGE", "GODREJPROP", "OBEROIRLTY",
    "PHOENIXLTD", "BRIGADE", "SOBHA", "MACROTECH", "SIGNATURE", "RADICO", "UBL", "MCDOWELL-N", "DEVYANI", "JUBLFOOD",
    "WESTLIFE", "SAPPHIRE", "PAYTM", "POLICYBZR", "NYKAA", "SWIGGY", "BSE", "CDSL", "MCX", "ANGELONE",
    "KALYANKJIL", "PAGEIND", "BATAINDIA", "MUTHOOTFIN", "POONAWALLA", "MANAPPURAM", "M&MFIN", "LICHSGFIN", "CANFINHOME", "HUDCO",
    "IREDA", "ASTRAL", "SUPREMEIND", "FINPIPE", "PRINCEPIPE", "KAJARIACER", "CERA", "PIIND", "UPL", "COROMANDEL",
    "DEEPAKNTR", "TATACHEM", "SRF", "NAVINFLUOR", "AARTIIND", "ATUL", "SOLARINDS", "AIAENG", "THERMAX", "KUMAR",
    "CUMMINSIND", "TIMKEN", "SKFINDIA", "SUNTV", "ZEEL", "PVRINOX", "NETWORK18", "ABFRL", "MANYAVAR", "METROBRAND",
    "CAMPUS", "SYNGENE", "FORTIS", "ASTERDM", "MEDANTA", "RAINBOW", "KIMS", "GMRINFRA", "AFFLE", "SONACOMS",
    "ENDURANCE", "EXIDEIND", "AMARAJABAT", "CGPOWER", "SUNDRMFAST", "SCHAEFFLER", "KEC", "KALPATPOWR", "ZENSARTECH", "CYIENT",
    "SONATSOFTW", "MASTEK", "BSOFT", "INTELLECT", "ALLCARGO", "TCIEXP", "VRLLOG", "GATEWAY", "MAHLOG", "SCI",
  ]),
  "^NSEMS400": makeConstituents([
    "AUBANK", "FEDERALBNK", "IDFCFIRSTB", "BANDHANBNK", "RBLBANK", "PERSISTENT", "COFORGE", "MPHASIS", "LTTS", "KPITTECH",
    "TATAELXSI", "ASHOKLEY", "BHARATFORG", "ESCORTS", "BALKRISIND", "MRF", "APOLLOTYRE", "ALKEM", "LUPIN", "MANKIND",
    "AUROPHARMA", "BIOCON", "GLENMARK", "IPCA", "LAURUSLABS", "NATCOPHARM", "SAIL", "NMDC", "NATIONALUM", "HINDCOPPER",
    "HINDZINC", "JSL", "APLAPOLLO", "RATNAMANI", "TORNTPOWER", "NHPC", "SJVN", "INOXWIND", "CESC", "GUJGASLTD",
    "MAZDOCK", "COCHINSHIP", "GRSE", "BDL", "BEML", "TITAGARH", "RAILTEL", "RITES", "IRCON", "POLYCAB",
    "KEI", "VOLTAS", "BLUESTARCO", "CROMPTON", "WHIRLPOOL", "DIXON", "KAYNES", "PRESTIGE", "GODREJPROP", "OBEROIRLTY",
    "PHOENIXLTD", "BRIGADE", "SOBHA", "MACROTECH", "SIGNATURE", "RADICO", "UBL", "MCDOWELL-N", "DEVYANI", "JUBLFOOD",
    "WESTLIFE", "SAPPHIRE", "PAYTM", "POLICYBZR", "NYKAA", "SWIGGY", "BSE", "CDSL", "MCX", "ANGELONE",
    "KALYANKJIL", "PAGEIND", "BATAINDIA", "MUTHOOTFIN", "POONAWALLA", "MANAPPURAM", "M&MFIN", "LICHSGFIN", "CANFINHOME", "HUDCO",
    "IREDA", "ASTRAL", "SUPREMEIND", "FINPIPE", "PRINCEPIPE", "KAJARIACER", "CERA", "PIIND", "UPL", "COROMANDEL",
    "DEEPAKNTR", "TATACHEM", "SRF", "NAVINFLUOR", "AARTIIND", "ATUL", "SOLARINDS", "AIAENG", "THERMAX", "KUMAR",
    "CUMMINSIND", "TIMKEN", "SKFINDIA", "SUNTV", "ZEEL", "PVRINOX", "NETWORK18", "ABFRL", "MANYAVAR", "METROBRAND",
    "CAMPUS", "SYNGENE", "FORTIS", "ASTERDM", "MEDANTA", "RAINBOW", "KIMS", "GMRINFRA", "AFFLE", "SONACOMS",
    "ENDURANCE", "EXIDEIND", "AMARAJABAT", "CGPOWER", "SUNDRMFAST", "SCHAEFFLER", "KEC", "KALPATPOWR", "ZENSARTECH", "CYIENT",
    "SONATSOFTW", "MASTEK", "BSOFT", "INTELLECT", "ALLCARGO", "TCIEXP", "VRLLOG", "GATEWAY", "MAHLOG", "SCI",
    "RVNL", "NBCC", "CENTRALBK", "UCOBANK", "IOB", "MAHABANK", "UJJIVANSFB", "EQUITASBNK", "SOUTHBANK", "YESBANK",
    "ALOKINDS", "TRIDENT", "HFCL", "LLOYDSENGG", "MARKSANS", "SUBEX", "INFIBEAM", "PCJEWELLER", "BCG", "URJA",
    "VIKASLIFE", "EASEMYTRIP", "HCC", "DISHTV", "JPASSOCIAT", "RPOWER", "JPPOWER", "RTNPOWER", "RTNINDIA", "VIKASECO",
    "FCSSOFT", "GTLINFRA", "GVKPIL", "IDEA", "TAPARIA", "GUJTLRM", "3IINFOLTD", "VAKRANGEE", "DHANI", "MUNDUNURU",
    "MUKTA", "PSIT", "LANDMARC", "RGFCAP", "PARSVNATH", "CUBICAL", "SHARPINV", "ASHAPURI", "TRIVENI", "CHANDRIMA",
    "ANUBHAV", "IEL", "PARVATI", "THINKINK", "LADAM", "DILIGENT", "PREMIEREN", "SHUKRA", "RAAMA", "AAPLUS",
    "WARDWIZARD", "GROWINGTON", "QUADRANT", "CROPSTER", "LEADINGLEAS", "SAMPRE", "DUCON", "ULTRACAB", "LANDSMILL", "CONSEC",
    "DAVANGERE", "SHREESEC", "GACM", "TUNITEX", "KARURVYSYA", "CUB", "ESAF", "JSFB", "SURYODAY", "UTKARSH",
    "CAPITALSFB", "TV18BRDCST", "HBLPOWER", "DATAPATTNS", "PARAS", "MTARTECH", "BORORENEW", "PRAJIND", "DEEPAKFERT", "GNFC",
    "GSFC", "RCF", "NFL", "CHAMBLFERT", "SPIC", "HATSUN", "HERITGFOOD", "DODLA", "VADILALIND", "TASTYBITE",
    "ZYDUSWELL", "REDTAPE", "LIBERTSHOE", "MIRZAINT", "RUPA", "LUXIND", "DOLLAR", "SANSERA", "CRAFTSMAN", "PRICOLLTD",
    "SUPRAJIT", "FIEMIND", "LUMAXTECH", "SUBROS", "KNRCON", "PNCINFRA", "ASHOKA", "GRINFRA", "ITDCEIL", "HGINFRA",
    "PSPPROJECT", "BLS", "PROTEAN", "CAMS", "KFINTECH", "IIFL", "GEOJITFSL", "MOTILALOFS", "5PAISA", "ANANTRAJ",
    "PURVA", "KOLTEPATIL", "AJMERA", "ARVIND", "GOKEX", "RAYMOND", "WELSPUNLIV", "CENTURYTEX", "VTL", "KPRMILL",
    "GARFIBRES", "SWANENERGY", "ROSSARI", "CLEAN", "NEOGEN", "ANUPAM", "AMIORG", "TATVA", "POLYMED", "ERIS",
    "FDC", "CAPL", "CEATLTD", "JKTYRE", "TVSSRICHAK", "GOCOLORS", "TCNSBRANDS", "ETHOSLTD", "DCXINDIA", "DBL",
    "NCC", "IRB", "DYNAMATECH", "ASTRAZEN", "PREMIER", "PRAKASH", "JINDALPOLY", "GALLANTT", "GRAVITA", "PITTIENG",
    "SALASAR", "TIMETECHNO", "ELECON", "TEXRAIL", "JUPITERIN", "PENIND", "GOODLUCK", "SFL", "SHARDACROP", "INDIGOPNTS",
    "KANSAINER", "SHALPAINTS", "MINDAIND", "LUMAXIND", "GABRIEL", "VARROC", "JAYBARMARU", "BANCOINDIA", "TALBROSENG", "ROLEXRINGS",
    "KWALITY", "DFMFOODS", "SOMANYCERA", "DREDGECORP", "SIYARAM", "BOMBAYDYE", "HIMATSEIDE", "NAHARSPING", "MONTECARLO", "VENKYS",
    "RATEGAIN", "TANLA", "ROUTE", "DATAMATICS", "QUICKHEAL", "SAKSOFT", "NEWGEN", "VAIBHAVGBL", "GREENPANEL", "GREENPLY",
    "CENTURYPLY", "ORIENTCEM", "HEIDELBERG", "STARCEMENT", "SAGCEM", "DECCANCE", "MANGALAM", "NCLIND", "ANDHRAPAP", "JKPAPER",
    "WSTCSTPAPR", "TNPL", "SESHAPAPER", "STARPAPER", "KOPRAN", "MOREPENLAB", "SMSPHARMA", "NEULANDLAB", "SUVENPHAR", "SOLARA",
    "THEMISMED", "GUFICBIO", "BLISSGVS", "LINCOLN", "AHLUCONT", "CAPACITE", "MANINFRA", "NELCO", "RANEHOLDIN", "SHIVALIK",
    "SANDHAR", "JAYAGRO", "MUNJALAU", "VSTTILLERS", "GULFPETRO", "PANACEABIO", "KIRLOSENG", "KIRLOSBROS", "KIRLFER", "ORIENTHOT",
  ]),
};

export function getConstituentsForIndex(symbol: string): ConstituentStock[] {
  return INDEX_CONSTITUENTS[symbol] ?? INDEX_CONSTITUENTS["^NSEI"] ?? [];
}

export function findIndexForStock(stockSymbol: string): string {
  for (const [idxSymbol, constituents] of Object.entries(INDEX_CONSTITUENTS)) {
    if (constituents.some((c) => c.symbol === stockSymbol)) {
      return idxSymbol;
    }
  }
  return "^NSEI";
}

export const ALLOWED_SYMBOLS = new Set(ALL_INSTRUMENTS.map((row) => row.symbol));

const CHART_SYMBOL = /^(?:\^[A-Z0-9.]{1,15}|[A-Z0-9&-]{1,20}\.(?:NS|BO))$/;

export function isChartSymbol(symbol: string): boolean {
  return CHART_SYMBOL.test(symbol);
}

/** Bare tickers default to NSE. Full codes such as NMDC.NS or NMDC.BO pass through. */
export function asNseCode(raw: string): string | null {
  const code = raw.trim().toUpperCase().replace(/\s+/g, "");
  if (code === "VIX" || code === "INDIAVIX" || code === "^VIX") return "^INDIAVIX";
  if (code === "GIFT" || code === "GIFTNIFTY" || code === "SGXNIFTY" || code === "^GIFT") return "^GIFTNIFTY";
  if (code === "SMALLCAP" || code === "NIFTYSMLCAP" || code === "SMALLCAP100") return "^CNXSC";
  if (code === "LARGEMID" || code === "LARGEMIDCAP" || code === "LARGEMID250") return "^NSELM250";
  if (code === "MIDSMALL" || code === "MIDSMALLCAP" || code === "MIDSMALL400") return "^NSEMS400";
  if (code === "MIDCAP150") return "^NSEMDCP150";
  if (code === "TATAMOTORS" || code === "TATAMOTOR" || code === "TATAPV" || code === "TATAMOTORS.NS") return "TMPV.NS";
  if (code === "ZOMATO" || code === "ZOMATO.NS") return "ETERNAL.NS";
  if (code === "PCJ" || code === "PCJ.NS" || code === "PCJEWELLER" || code === "PCJEWELLERS") return "PCJEWELLER.NS";
  if (code === "PCJ.BO" || code === "PCJEWELLER.BO") return "PCJEWELLER.BO";
  if (code === "UJJIVAN" || code === "UJJIVANSFB") return "UJJIVANSFB.NS";
  if (code === "UJJIVANSFB.BO" || code === "UJJIVAN.BO") return "UJJIVANSFB.BO";
  if (code === "GUJTLRM" || code === "GUJARATTOOLROOM") return "GUJTLRM.BO";
  if (code === "TAPARIA" || code === "TAPARIATOOLS") return "TAPARIA.BO";
  if (code === "ALOK" || code === "ALOKINDUSTRIES") return "ALOKINDS.NS";
  if (code === "RPOWER" || code === "RELIANCEPOWER") return "RPOWER.NS";
  if (code === "JPPOWER" || code === "JAIPRAKASHPOWER") return "JPPOWER.NS";
  if (code === "RTNPOWER" || code === "RATTANPOWER") return "RTNPOWER.NS";
  if (code === "RTNINDIA") return "RTNINDIA.NS";
  if (code === "SUZLONENERGY") return "SUZLON.NS";
  if (code === "TATAPOWERCOMPANY") return "TATAPOWER.NS";
  if (code === "PUNJABNATIONALBANK") return "PNB.NS";
  if (code === "CANARABANK") return "CANBK.NS";
  if (code === "INDIANRAILWAYFINANCE") return "IRFC.NS";
  if (code === "RAILVIKAS" || code === "RAILVIKASVIGAM") return "RVNL.NS";
  if (code === "STEELAUTHORITY") return "SAIL.NS";
  if (code === "BHARATHEAVY") return "BHEL.NS";
  if (code === "ONE97") return "PAYTM.NS";
  if (code === "YESBANK") return "YESBANK.NS";
  if (isChartSymbol(code)) return code;
  if (/^[A-Z][A-Z0-9&-]{0,19}$/.test(code)) return `${code}.NS`;
  return null;
}

export function findInstrument(symbol: string): Instrument | undefined {
  if (symbol === "TATAMOTORS.NS" || symbol === "TATAMOTORS") {
    return ALL_INSTRUMENTS.find((row) => row.symbol === "TMPV.NS");
  }
  if (symbol === "ZOMATO.NS" || symbol === "ZOMATO") {
    return ALL_INSTRUMENTS.find((row) => row.symbol === "ETERNAL.NS");
  }
  if (symbol === "PCJ.NS" || symbol === "PCJ") {
    return ALL_INSTRUMENTS.find((row) => row.symbol === "PCJEWELLER.NS");
  }
  if (symbol === "PCJ.BO") {
    return ALL_INSTRUMENTS.find((row) => row.symbol === "PCJEWELLER.BO");
  }
  if (symbol === "UJJIVAN.NS" || symbol === "UJJIVAN") {
    return ALL_INSTRUMENTS.find((row) => row.symbol === "UJJIVANSFB.NS");
  }
  if (symbol === "UJJIVAN.BO") {
    return ALL_INSTRUMENTS.find((row) => row.symbol === "UJJIVANSFB.BO");
  }
  const found = ALL_INSTRUMENTS.find((row) => row.symbol === symbol);
  if (found) return found;

  // Dynamic instrument synthesizer: Supports ANY NSE or BSE listed stock in India
  if (isChartSymbol(symbol)) {
    const isBse = symbol.endsWith(".BO");
    const isIndex = symbol.startsWith("^");
    const ticker = symbol.replace(/\.(NS|BO)$/, "").replace(/^\^/, "");
    const exchange: Instrument["exchange"] = isBse ? "BSE" : isIndex ? "INDEX" : "NSE";
    return {
      symbol,
      ticker,
      exchange,
      sector: isIndex ? "Index" : "Equities",
      name: `${ticker} Limited`,
      kind: isIndex ? "index" : "equity",
    };
  }
  return undefined;
}

/** Resolve a typed code. Unknown tickers of 2+ letters become a valid lookup, never a book miss. */
export function instrumentFromQuery(raw: string): Instrument | null {
  const symbol = asNseCode(raw);
  if (!symbol || !isChartSymbol(symbol)) return null;
  const known = findInstrument(symbol);
  if (known) return known;
  const ticker = symbol.replace(/\.(NS|BO)$/, "").replace(/^\^/, "");
  const exchange: Instrument["exchange"] = symbol.endsWith(".BO") ? "BSE" : symbol.startsWith("^") ? "INDEX" : "NSE";
  return {
    symbol,
    ticker,
    exchange,
    sector: "Equities",
    name: `${ticker} Limited`,
    kind: symbol.startsWith("^") ? "index" : "equity",
  };
}

export function searchBook(raw: string): Instrument[] {
  const q = raw.trim().toLowerCase();
  if (!q) return [];
  const qClean = q.replace(/[\s_\-.]+/g, "");

  // Priority Indian market keyword handling
  let preferred: Instrument[] = [];
  if (q === "penny" || q.includes("penny") || q.includes("pennystock")) {
    const pennyIdx = ALL_INSTRUMENTS.find((i) => i.symbol === "^PENNY");
    const popularPenny = [
      "MUNDUNURU.BO", "CHANDRIMA.BO", "PARSVNATH.NS", "ANUBHAV.BO", "DAVANGERE.NS", "ULTRACAB.NS",
      "THINKINK.BO", "WARDWIZARD.BO", "DUCON.NS", "GUJTLRM.BO", "PCJEWELLER.NS", "TAPARIA.BO",
      "RPOWER.NS", "JPPOWER.NS", "RTNPOWER.NS", "GTLINFRA.NS", "BCG.NS", "IDEA.NS", "ALOKINDS.NS",
      "YESBANK.NS", "URJA.NS", "FCSSOFT.NS", "3IINFOLTD.NS",
    ].map((s) => ALL_INSTRUMENTS.find((i) => i.symbol === s)).filter((x): x is Instrument => Boolean(x));
    preferred = [pennyIdx, ...popularPenny].filter((x): x is Instrument => Boolean(x));
  } else if (q.includes("mundunuru")) {
    const row = ALL_INSTRUMENTS.find((i) => i.ticker === "MUNDUNURU");
    if (row) preferred = [row];
  } else if (q.includes("chandrima")) {
    const row = ALL_INSTRUMENTS.find((i) => i.ticker === "CHANDRIMA");
    if (row) preferred = [row];
  } else if (q.includes("parsvnath")) {
    const row = ALL_INSTRUMENTS.find((i) => i.ticker === "PARSVNATH");
    if (row) preferred = [row];
  } else if (q.includes("anubhav")) {
    const row = ALL_INSTRUMENTS.find((i) => i.ticker === "ANUBHAV");
    if (row) preferred = [row];
  } else if (q.includes("thinkink")) {
    const row = ALL_INSTRUMENTS.find((i) => i.ticker === "THINKINK");
    if (row) preferred = [row];
  } else if (q.includes("davangere")) {
    const row = ALL_INSTRUMENTS.find((i) => i.ticker === "DAVANGERE");
    if (row) preferred = [row];
  } else if (q.includes("ultracab")) {
    const row = ALL_INSTRUMENTS.find((i) => i.ticker === "ULTRACAB");
    if (row) preferred = [row];
  } else if (q.includes("wardwizard")) {
    const row = ALL_INSTRUMENTS.find((i) => i.ticker === "WARDWIZARD");
    if (row) preferred = [row];
  } else if (q.includes("ducon")) {
    const row = ALL_INSTRUMENTS.find((i) => i.ticker === "DUCON");
    if (row) preferred = [row];
  } else if (q === "ujjivan" || q === "ujjivansfb" || q.includes("ujjivan")) {
    const nseRow = ALL_INSTRUMENTS.find((i) => i.symbol === "UJJIVANSFB.NS");
    const bseRow = ALL_INSTRUMENTS.find((i) => i.symbol === "UJJIVANSFB.BO");
    preferred = [nseRow, bseRow].filter((x): x is Instrument => Boolean(x));
  } else if (q === "gujtlrm" || q.includes("gujarat tool") || q === "gujarattoolroom") {
    const bseRow = ALL_INSTRUMENTS.find((i) => i.symbol === "GUJTLRM.BO");
    const nseRow = ALL_INSTRUMENTS.find((i) => i.symbol === "GUJTLRM.NS");
    preferred = [bseRow, nseRow].filter((x): x is Instrument => Boolean(x));
  } else if (q === "pcj" || q.includes("pc jeweller") || q === "pcjeweller") {
    const nseRow = ALL_INSTRUMENTS.find((i) => i.symbol === "PCJEWELLER.NS");
    const bseRow = ALL_INSTRUMENTS.find((i) => i.symbol === "PCJEWELLER.BO");
    preferred = [nseRow, bseRow].filter((x): x is Instrument => Boolean(x));
  } else if (q === "taparia" || q.includes("taparia tool") || q === "tapariatools") {
    const bseRow = ALL_INSTRUMENTS.find((i) => i.symbol === "TAPARIA.BO");
    const nseRow = ALL_INSTRUMENTS.find((i) => i.symbol === "TAPARIA.NS");
    preferred = [bseRow, nseRow].filter((x): x is Instrument => Boolean(x));
  } else if (q === "alok" || q.includes("alok ind") || q === "alokinds") {
    const nseRow = ALL_INSTRUMENTS.find((i) => i.symbol === "ALOKINDS.NS");
    const bseRow = ALL_INSTRUMENTS.find((i) => i.symbol === "ALOKINDS.BO");
    preferred = [nseRow, bseRow].filter((x): x is Instrument => Boolean(x));
  } else if (q === "rpower" || q.includes("reliance power")) {
    const nseRow = ALL_INSTRUMENTS.find((i) => i.symbol === "RPOWER.NS");
    const bseRow = ALL_INSTRUMENTS.find((i) => i.symbol === "RPOWER.BO");
    preferred = [nseRow, bseRow].filter((x): x is Instrument => Boolean(x));
  } else if (q === "jppower" || q.includes("jaiprakash power")) {
    const nseRow = ALL_INSTRUMENTS.find((i) => i.symbol === "JPPOWER.NS");
    const bseRow = ALL_INSTRUMENTS.find((i) => i.symbol === "JPPOWER.BO");
    preferred = [nseRow, bseRow].filter((x): x is Instrument => Boolean(x));
  } else if (q === "rtnpower" || q.includes("rattan power") || q.includes("rattanindia power")) {
    const nseRow = ALL_INSTRUMENTS.find((i) => i.symbol === "RTNPOWER.NS");
    const bseRow = ALL_INSTRUMENTS.find((i) => i.symbol === "RTNPOWER.BO");
    preferred = [nseRow, bseRow].filter((x): x is Instrument => Boolean(x));
  } else if (q === "vix" || q.includes("vix") || q.includes("volatilit")) {
    const vix = ALL_INSTRUMENTS.find((i) => i.symbol === "^INDIAVIX");
    if (vix) preferred = [vix];
  } else if (q.includes("gift") || q.includes("sgx")) {
    const gift = ALL_INSTRUMENTS.find((i) => i.symbol === "^GIFTNIFTY");
    if (gift) preferred = [gift];
  } else if (q.startsWith("nif")) {
    preferred = INDICES.filter((i) => i.symbol.startsWith("^NSE") || i.symbol.startsWith("^CNX"));
  } else if (q.startsWith("bse") || q.startsWith("sen")) {
    const sensex = ALL_INSTRUMENTS.find((i) => i.symbol === "^BSESN");
    preferred = [sensex, ...BSE_BOOK.slice(0, 5)].filter((x): x is Instrument => Boolean(x));
  } else if (q.startsWith("bank")) {
    const bankNifty = ALL_INSTRUMENTS.find((i) => i.symbol === "^NSEBANK");
    if (bankNifty) preferred = [bankNifty];
  } else if (q.includes("tata motor") || q === "tatamotors" || q === "tatamotor") {
    const tmpv = ALL_INSTRUMENTS.find((i) => i.symbol === "TMPV.NS");
    if (tmpv) preferred = [tmpv];
  } else if (q === "zomato" || q.includes("zomato")) {
    const eternal = ALL_INSTRUMENTS.find((i) => i.symbol === "ETERNAL.NS");
    if (eternal) preferred = [eternal];
  } else if (q === "sbi" || q.startsWith("sbi")) {
    const sbin = ALL_INSTRUMENTS.find((i) => i.symbol === "SBIN.NS");
    if (sbin) preferred = [sbin];
  } else if (q.includes("airtel") || q.includes("bharti")) {
    const airtel = ALL_INSTRUMENTS.find((i) => i.symbol === "BHARTIARTL.NS");
    if (airtel) preferred = [airtel];
  } else if (q === "lt" || q.includes("larsen")) {
    const lt = ALL_INSTRUMENTS.find((i) => i.symbol === "LT.NS");
    if (lt) preferred = [lt];
  } else if (q === "suzlon" || q.includes("suzlon")) {
    const suzlon = ALL_INSTRUMENTS.find((i) => i.symbol === "SUZLON.NS");
    if (suzlon) preferred = [suzlon];
  } else if (q.includes("tata power") || q === "tatapower") {
    const tp = ALL_INSTRUMENTS.find((i) => i.symbol === "TATAPOWER.NS");
    if (tp) preferred = [tp];
  } else if (q.includes("punjab national") || q === "pnb") {
    const pnb = ALL_INSTRUMENTS.find((i) => i.symbol === "PNB.NS");
    if (pnb) preferred = [pnb];
  } else if (q.includes("canara") || q === "canbk") {
    const canbk = ALL_INSTRUMENTS.find((i) => i.symbol === "CANBK.NS");
    if (canbk) preferred = [canbk];
  } else if (q === "yesbank" || q.includes("yes bank")) {
    const yb = ALL_INSTRUMENTS.find((i) => i.symbol === "YESBANK.NS");
    if (yb) preferred = [yb];
  } else if (q === "irfc" || q.includes("indian railway finance")) {
    const irfc = ALL_INSTRUMENTS.find((i) => i.symbol === "IRFC.NS");
    if (irfc) preferred = [irfc];
  } else if (q === "rvnl" || q.includes("rail vikas")) {
    const rvnl = ALL_INSTRUMENTS.find((i) => i.symbol === "RVNL.NS");
    if (rvnl) preferred = [rvnl];
  } else if (q === "sail" || q.includes("steel authority")) {
    const sail = ALL_INSTRUMENTS.find((i) => i.symbol === "SAIL.NS");
    if (sail) preferred = [sail];
  } else if (q === "bhel" || q.includes("bharat heavy")) {
    const bhel = ALL_INSTRUMENTS.find((i) => i.symbol === "BHEL.NS");
    if (bhel) preferred = [bhel];
  } else if (q === "paytm" || q.includes("one97")) {
    const paytm = ALL_INSTRUMENTS.find((i) => i.symbol === "PAYTM.NS");
    if (paytm) preferred = [paytm];
  }

  // Score real instruments
  const scored = ALL_INSTRUMENTS.map((row) => {
    const ticker = row.ticker.toLowerCase();
    const name = row.name.toLowerCase();
    const sector = row.sector.toLowerCase();
    let score = 0;
    if (ticker === q) score = 100;
    else if (ticker.startsWith(q)) score = 85;
    else if (name.startsWith(q)) score = 75;
    else if (ticker.includes(q)) score = 60;
    else if (name.includes(q)) score = 50;
    else if (sector.includes(q)) score = 45;
    else if (qClean.length >= 3) {
      const tickerClean = ticker.replace(/[\s_\-.]+/g, "");
      const nameClean = name.replace(/[\s_\-.]+/g, "");
      if (tickerClean.startsWith(qClean)) score = 40;
      else if (tickerClean.includes(qClean) || nameClean.includes(qClean)) score = 30;
    }
    return { row, score };
  })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.row);

  const seen = new Set<string>();
  const combined: Instrument[] = [];
  for (const item of [...preferred, ...scored]) {
    if (!seen.has(item.symbol)) {
      seen.add(item.symbol);
      combined.push(item);
    }
    if (combined.length >= 20) break;
  }

  // If no exact match found or book had no hits, append direct lookup
  const isIndexQuery = q.startsWith("nif") || q.startsWith("sen") || q.startsWith("banknif") || q.startsWith("vix");
  if (!isIndexQuery && qClean.length >= 2) {
    const cleanTicker = qClean.toUpperCase();
    const candidateSymbols = [
      `${cleanTicker}.NS`,
      `${cleanTicker}.BO`,
    ];
    for (const sym of candidateSymbols) {
      if (!seen.has(sym)) {
        const inst = findInstrument(sym) || instrumentFromQuery(sym);
        if (inst) {
          seen.add(sym);
          if (cleanTicker === q.toUpperCase()) {
            combined.unshift(inst);
          } else if (combined.length < 20) {
            combined.push(inst);
          }
        }
      }
    }
  }

  return combined.slice(0, 20);
}
