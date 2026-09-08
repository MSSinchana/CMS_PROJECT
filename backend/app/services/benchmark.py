import ast
import json
import multiprocessing
import resource
import time
import tracemalloc

from ..config import get_settings


ALLOWED_NODES = {
    ast.Module,
    ast.FunctionDef,
    ast.arguments,
    ast.arg,
    ast.Return,
    ast.Assign,
    ast.AugAssign,
    ast.Expr,
    ast.Name,
    ast.Load,
    ast.Store,
    ast.Constant,
    ast.BinOp,
    ast.UnaryOp,
    ast.Compare,
    ast.For,
    ast.While,
    ast.If,
    ast.List,
    ast.Dict,
    ast.Tuple,
    ast.Set,
    ast.Call,
    ast.Attribute,
    ast.Subscript,
    ast.Slice,
    ast.ListComp,
    ast.DictComp,
    ast.SetComp,
    ast.GeneratorExp,
    ast.comprehension,
    ast.Add,
    ast.Sub,
    ast.Mult,
    ast.Div,
    ast.Mod,
    ast.Pow,
    ast.FloorDiv,
    ast.Eq,
    ast.NotEq,
    ast.Gt,
    ast.GtE,
    ast.Lt,
    ast.LtE,
    ast.And,
    ast.Or,
    ast.BoolOp,
    ast.IfExp,
    ast.Break,
    ast.Continue,
    ast.Pass,
    ast.JoinedStr,
    ast.FormattedValue,
}

DISALLOWED_NAMES = {"open", "exec", "eval", "compile", "__import__", "input", "globals", "locals"}


class BenchmarkSafetyError(ValueError):
    pass


def validate_safe_code(code: str) -> str:
    try:
        tree = ast.parse(code)
    except SyntaxError as exc:
        raise BenchmarkSafetyError(f"Syntax error: {exc}") from exc

    function_names = [node.name for node in tree.body if isinstance(node, ast.FunctionDef)]
    if "target" not in function_names:
        raise BenchmarkSafetyError("Benchmark requires a function named target().")

    for node in ast.walk(tree):
        if type(node) not in ALLOWED_NODES:
            raise BenchmarkSafetyError(f"Unsupported syntax in benchmark: {type(node).__name__}")
        if isinstance(node, (ast.Import, ast.ImportFrom, ast.With, ast.Try, ast.ClassDef, ast.Lambda)):
            raise BenchmarkSafetyError("Imports, classes, context managers, lambdas, and try blocks are not allowed.")
        if isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name) and node.func.id in DISALLOWED_NAMES:
                raise BenchmarkSafetyError(f"Unsafe call: {node.func.id}")
        if isinstance(node, ast.Attribute) and node.attr.startswith("__"):
            raise BenchmarkSafetyError("Dunder attribute access is not allowed.")
    return code


def _benchmark_worker(code: str, iterations: int, queue: multiprocessing.Queue) -> None:
    resource.setrlimit(resource.RLIMIT_CPU, (2, 2))
    resource.setrlimit(resource.RLIMIT_AS, (256 * 1024 * 1024, 256 * 1024 * 1024))

    safe_builtins = {
        "range": range,
        "len": len,
        "sum": sum,
        "min": min,
        "max": max,
        "sorted": sorted,
        "enumerate": enumerate,
        "list": list,
        "dict": dict,
        "set": set,
        "tuple": tuple,
        "abs": abs,
    }
    namespace = {"__builtins__": safe_builtins}

    exec(compile(code, "<benchmark>", "exec"), namespace, namespace)
    if "target" not in namespace or not callable(namespace["target"]):
        raise ValueError("target() is missing or not callable")

    tracemalloc.start()
    start_cpu = time.process_time()
    start = time.perf_counter()
    for _ in range(iterations):
        namespace["target"]()
    duration = (time.perf_counter() - start) * 1000
    cpu = (time.process_time() - start_cpu) * 1000
    _, peak = tracemalloc.get_traced_memory()
    tracemalloc.stop()

    cpu_percent = 0.0 if duration == 0 else min(100.0, (cpu / duration) * 100)
    result = {
        "time_ms": round(duration, 4),
        "cpu_percent": round(cpu_percent, 4),
        "memory_mb": round(peak / (1024 * 1024), 4),
    }
    queue.put(json.dumps(result))


def run_safe_benchmark(code: str, iterations: int) -> dict:
    settings = get_settings()
    if iterations > settings.benchmark_max_iterations:
        raise ValueError(f"iterations cannot exceed {settings.benchmark_max_iterations}")

    validated = validate_safe_code(code)
    queue: multiprocessing.Queue = multiprocessing.Queue()
    process = multiprocessing.Process(target=_benchmark_worker, args=(validated, iterations, queue))
    process.start()
    process.join(settings.benchmark_timeout_seconds)

    if process.is_alive():
        process.terminate()
        process.join()
        raise TimeoutError("Benchmark timed out.")

    if process.exitcode != 0:
        raise ValueError("Benchmark execution failed under restricted mode.")

    if queue.empty():
        raise ValueError("No benchmark result returned.")

    return json.loads(queue.get())
