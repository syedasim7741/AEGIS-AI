from pathlib import Path
from re import MULTILINE, search
from sys import exit


ROOT = Path(__file__).resolve().parents[2]

checks: list[tuple[str, bool]] = []


def add_check(
    name: str,
    passed: bool,
) -> None:
    checks.append((name, passed))


root_gitignore = ROOT / ".gitignore"
backend_gitignore = (
    ROOT / "aegis-ai-backend" / ".gitignore"
)
frontend_gitignore = (
    ROOT / "aegis-ai-frontend" / ".gitignore"
)

backend_dockerignore = (
    ROOT / "aegis-ai-backend" / ".dockerignore"
)
frontend_dockerignore = (
    ROOT / "aegis-ai-frontend" / ".dockerignore"
)

compose_path = ROOT / "compose.yaml"
docker_secret_path = ROOT / ".env.docker"
docker_example_path = ROOT / ".env.docker.example"


for path, label in (
    (
        root_gitignore,
        "Root .gitignore exists",
    ),
    (
        backend_gitignore,
        "Backend .gitignore exists",
    ),
    (
        frontend_gitignore,
        "Frontend .gitignore exists",
    ),
    (
        backend_dockerignore,
        "Backend .dockerignore exists",
    ),
    (
        frontend_dockerignore,
        "Frontend .dockerignore exists",
    ),
    (
        compose_path,
        "Compose file exists",
    ),
    (
        docker_secret_path,
        "Docker secret file exists",
    ),
    (
        docker_example_path,
        "Docker example file exists",
    ),
):
    add_check(
        label,
        path.is_file(),
    )


for path, label in (
    (
        root_gitignore,
        "Root ignores environment files",
    ),
    (
        backend_gitignore,
        "Backend ignores environment files",
    ),
    (
        frontend_gitignore,
        "Frontend ignores environment files",
    ),
):
    content = (
        path.read_text(
            encoding="utf-8-sig",
        )
        if path.is_file()
        else ""
    )

    add_check(
        label,
        ".env" in content
        and ".env.*" in content,
    )


for path, label in (
    (
        backend_dockerignore,
        "Backend Docker build excludes secrets",
    ),
    (
        frontend_dockerignore,
        "Frontend Docker build excludes secrets",
    ),
):
    content = (
        path.read_text(
            encoding="utf-8-sig",
        )
        if path.is_file()
        else ""
    )

    add_check(
        label,
        ".env" in content,
    )


compose_content = (
    compose_path.read_text(
        encoding="utf-8-sig",
    )
    if compose_path.is_file()
    else ""
)

add_check(
    "Compose uses password variable",
    (
        "POSTGRES_PASSWORD: "
        "${POSTGRES_PASSWORD}"
    )
    in compose_content,
)

hardcoded_password = search(
    r"^\s*POSTGRES_PASSWORD:\s+"
    r"(?!\$\{POSTGRES_PASSWORD\})"
    r".+$",
    compose_content,
    flags=MULTILINE,
)

add_check(
    "Compose has no hardcoded database password",
    hardcoded_password is None,
)


actual_password = None

if docker_secret_path.is_file():
    for line in docker_secret_path.read_text(
        encoding="utf-8-sig",
    ).splitlines():
        if line.startswith(
            "POSTGRES_PASSWORD="
        ):
            actual_password = line.split(
                "=",
                1,
            )[1]

            break


public_files = [
    compose_path,
    docker_example_path,
    ROOT
    / "aegis-ai-backend"
    / "Dockerfile",
    ROOT
    / "aegis-ai-frontend"
    / "Dockerfile",
]


password_leaked = False

if actual_password:
    for path in public_files:
        if (
            path.is_file()
            and actual_password
            in path.read_text(
                encoding="utf-8-sig",
            )
        ):
            password_leaked = True


add_check(
    "Generated database password is not copied "
    "into public configuration",
    bool(actual_password)
    and not password_leaked,
)


failed_checks = [
    name
    for name, passed in checks
    if not passed
]


print("===== SECRET PROTECTION AUDIT =====")

for name, passed in checks:
    status = (
        "PASS"
        if passed
        else "FAIL"
    )

    print(f"{status}: {name}")


print()

if failed_checks:
    print(
        "ERROR: Secret protection audit failed."
    )

    exit(1)


print(
    "SUCCESS: Secret protection audit passed."
)
print(
    "Secret values displayed: False"
)
