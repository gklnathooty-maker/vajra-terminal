import ast
import operator as op

_ALLOWED={ast.Add:op.add,ast.Sub:op.sub,ast.Mult:op.mul,
          ast.Div:op.truediv,ast.Mod:op.mod,ast.Pow:op.pow,
          ast.USub:op.neg}

def calculate(expression, variables):
    """Small safe arithmetic expression evaluator for custom screener ratios."""
    tree=ast.parse(expression,mode="eval")
    def walk(n):
        if isinstance(n,ast.Expression): return walk(n.body)
        if isinstance(n,ast.Constant) and isinstance(n.value,(int,float)): return n.value
        if isinstance(n,ast.Name):
            if n.id not in variables: raise ValueError(f"Unknown variable: {n.id}")
            return variables[n.id]
        if isinstance(n,ast.BinOp) and type(n.op) in _ALLOWED:
            return _ALLOWED[type(n.op)](walk(n.left),walk(n.right))
        if isinstance(n,ast.UnaryOp) and type(n.op) in _ALLOWED:
            return _ALLOWED[type(n.op)](walk(n.operand))
        raise ValueError("Unsupported expression")
    return walk(tree)
