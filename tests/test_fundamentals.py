from app.fundamentals.model import Fundamentals, calculate_fundamental_score

def test_fundamental_score():
    f=Fundamentals(
        symbol="TEST",
        revenue_growth=15,
        eps_growth=20,
        profit_margin=15,
        roe=18,
        roce=20,
        debt_to_equity=.5
    )
    score=calculate_fundamental_score(f)
    assert 0 <= score <= 100
