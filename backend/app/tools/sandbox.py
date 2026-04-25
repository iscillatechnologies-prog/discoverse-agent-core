"""Code execution sandbox using Docker (ephemeral python:3.11-slim container).

For production, harden further: cgroup limits, network isolation, seccomp.
"""
import asyncio
import shlex
import tempfile
from pathlib import Path


async def run_python(code: str, timeout: int = 20) -> dict:
    """Run snippet in throwaway container, return {stdout, stderr, exit_code}."""
    with tempfile.TemporaryDirectory() as tmp:
        script = Path(tmp) / "main.py"
        script.write_text(code)
        cmd = (
            f"docker run --rm --network none --memory 256m --cpus 0.5 "
            f"-v {shlex.quote(tmp)}:/work:ro -w /work python:3.11-slim "
            f"timeout {timeout} python /work/main.py"
        )
        proc = await asyncio.create_subprocess_shell(
            cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        try:
            out, err = await asyncio.wait_for(proc.communicate(), timeout=timeout + 5)
        except asyncio.TimeoutError:
            proc.kill()
            return {"stdout": "", "stderr": "Sandbox timeout", "exit_code": -1}
        return {
            "stdout": out.decode(errors="replace"),
            "stderr": err.decode(errors="replace"),
            "exit_code": proc.returncode or 0,
        }
