def quality_rank(technical, fundamental):
    overall=technical*0.70 + fundamental*0.30

    if overall>=90:
        return overall,"A+ INSTITUTIONAL"
    if overall>=80:
        return overall,"A"
    if overall>=70:
        return overall,"B"
    if overall>=60:
        return overall,"C"
    return overall,"D"
