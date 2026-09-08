import ast
from collections import Counter


def _is_inside_loop(parents: dict[ast.AST, ast.AST | None], node: ast.AST) -> bool:
    current = parents.get(node)
    while current:
        if isinstance(current, (ast.For, ast.While, ast.AsyncFor)):
            return True
        current = parents.get(current)
    return False


def analyze_python_code(code: str) -> tuple[bool, str, list[dict]]:
    if not code.strip():
        return False, "Code input is empty.", []

    try:
        tree = ast.parse(code)
    except SyntaxError as exc:
        return False, f"Invalid Python syntax at line {exc.lineno}: {exc.msg}", []

    findings: list[dict] = []
    parents: dict[ast.AST, ast.AST | None] = {tree: None}

    for parent in ast.walk(tree):
        for child in ast.iter_child_nodes(parent):
            parents[child] = parent

    # nested loops
    for node in ast.walk(tree):
        if isinstance(node, (ast.For, ast.While, ast.AsyncFor)) and _is_inside_loop(parents, node):
            findings.append(
                {
                    "category": "unnecessary_nested_loops",
                    "severity": "high",
                    "certainty": "possible",
                    "line_number": getattr(node, "lineno", None),
                    "message": "Nested loop detected; consider vectorization, pre-indexing, or reducing loop depth.",
                }
            )

    # repeated calculations
    expr_counter = Counter()
    expr_nodes: dict[str, int] = {}
    for node in ast.walk(tree):
        if isinstance(node, ast.BinOp):
            key = ast.dump(node, include_attributes=False)
            expr_counter[key] += 1
            expr_nodes[key] = getattr(node, "lineno", None)
    for key, count in expr_counter.items():
        if count >= 3:
            findings.append(
                {
                    "category": "repeated_calculations",
                    "severity": "medium",
                    "certainty": "actual",
                    "line_number": expr_nodes[key],
                    "message": f"Expression repeated {count} times; cache or compute once.",
                }
            )

    # inefficient string operations
    for node in ast.walk(tree):
        if isinstance(node, ast.AugAssign) and isinstance(node.op, ast.Add) and isinstance(node.target, ast.Name):
            if _is_inside_loop(parents, node):
                findings.append(
                    {
                        "category": "inefficient_string_operations",
                        "severity": "high",
                        "certainty": "actual",
                        "line_number": getattr(node, "lineno", None),
                        "message": "String '+=' in loop can be costly; consider list accumulation and ''.join().",
                    }
                )

    # unnecessary sorting (possible)
    for node in ast.walk(tree):
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id == "sorted":
            findings.append(
                {
                    "category": "unnecessary_sorting",
                    "severity": "medium",
                    "certainty": "possible",
                    "line_number": getattr(node, "lineno", None),
                    "message": "Sorting detected; verify output order is required before sorting.",
                }
            )

    # excessive object creation
    for node in ast.walk(tree):
        if isinstance(node, (ast.List, ast.Dict, ast.Set, ast.Call)) and _is_inside_loop(parents, node):
            if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id in {"len", "sum", "min", "max"}:
                continue
            findings.append(
                {
                    "category": "excessive_object_creation",
                    "severity": "medium",
                    "certainty": "possible",
                    "line_number": getattr(node, "lineno", None),
                    "message": "Object allocation inside loop can increase memory churn.",
                }
            )

    # repeated DB/API calls in loops
    api_like_names = {"get", "post", "fetch", "query", "execute", "request"}
    for node in ast.walk(tree):
        if isinstance(node, ast.Call) and _is_inside_loop(parents, node):
            func_name = None
            if isinstance(node.func, ast.Name):
                func_name = node.func.id.lower()
            elif isinstance(node.func, ast.Attribute):
                func_name = node.func.attr.lower()
            if func_name and any(word in func_name for word in api_like_names):
                findings.append(
                    {
                        "category": "repeated_database_or_api_operations",
                        "severity": "high",
                        "certainty": "possible",
                        "line_number": getattr(node, "lineno", None),
                        "message": "Possible repeated DB/API operation in loop; batch or prefetch if possible.",
                    }
                )

    summary = "No inefficiency patterns detected." if not findings else f"Detected {len(findings)} potential inefficiency patterns."
    return True, summary, findings
