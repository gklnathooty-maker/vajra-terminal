def valuation_flags(pe=None, pb=None, ev_ebitda=None):
    flags=[]

    if pe is not None:
        flags.append("PE_LOW" if pe < 15 else "PE_HIGH" if pe > 35 else "PE_NORMAL")

    if pb is not None:
        flags.append("PB_LOW" if pb < 2 else "PB_HIGH" if pb > 6 else "PB_NORMAL")

    if ev_ebitda is not None:
        flags.append(
            "EV_EBITDA_LOW" if ev_ebitda < 10
            else "EV_EBITDA_HIGH" if ev_ebitda > 25
            else "EV_EBITDA_NORMAL"
        )

    return flags
