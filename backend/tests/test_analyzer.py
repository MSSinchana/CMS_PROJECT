from app.services.analyzer import analyze_python_code


def test_analyzer_detects_string_concat_loop():
    code = """
def target():
    s = ""
    for i in range(10):
        s += str(i)
    return s
"""
    parse_ok, _, findings = analyze_python_code(code)
    assert parse_ok
    categories = {item["category"] for item in findings}
    assert "inefficient_string_operations" in categories


def test_analyzer_handles_invalid_python():
    parse_ok, summary, findings = analyze_python_code("def broken(:\n pass")
    assert not parse_ok
    assert "Invalid Python syntax" in summary
    assert findings == []
