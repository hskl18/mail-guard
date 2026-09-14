# Dependency maintenance

Use Node.js 22 and the pnpm version pinned in `stack/package.json`.
Keep the matching pnpm version in `.github/workflows/ci.yml` synchronized.
Use Python 3.11 for Lambda and CDK, matching the deployed runtime declared in the source.

## Scope and update policy

The dependency entry points are `stack/package.json`, `stack/pnpm-workspace.yaml`, `lambda/requirements.in`, `lambda/cdk/requirements.in`, `IOT/platformio.ini`, Docker base images, and GitHub Actions.
Check both direct and transitive dependencies.
Treat patch and compatible minor updates as separate work from framework or SDK migrations.
Keep Next.js and its ESLint packages on the same version.
Routine Node package releases have a seven-day minimum age configured in `pnpm-workspace.yaml`.
For an urgent security release, review its advisory and use a narrowly scoped age exception when needed.

The pnpm overrides for `sharp` and `js-yaml` enforce patched versions even when upstream dependencies request older releases.
Browserslist stays at `4.28.7` because the resolved `update-browserslist-db` version declares that exact peer version.
MailerSend stays at `0.6.0` because the Lambda uses `emails.NewEmail`, which version 2 removed.
Move to MailerSend 2 only together with a verified notification API migration.
CDK `2.267.0` includes the NodejsFunction bundling security fix.
The synthesized log-retention helper changes from Node.js 22 to Node.js 24; the two application Lambdas remain on Python 3.11.
The 17-resource template was compared locally; this runtime migration has not been deployed.

## Node checks

Run from `stack/`, before and after updating:

```sh
pnpm install --frozen-lockfile
pnpm outdated
pnpm audit
pnpm test
pnpm lint
pnpm typecheck
pnpm build
```

Use the offline placeholder environment in the existing CI workflow for the build.
Run database migrations twice against a disposable MySQL 8.4 database, as CI does.
Never point migration verification at a real database.
After building, start the production server and check public HTTP responses and both WebP and AVIF image optimization.
Compilation and HTTP checks do not prove authenticated UI behavior.

## Python locks

Edit direct dependencies in each `requirements.in` file.
Generate the adjacent `requirements.txt` file instead of editing its transitive pins manually.
Run the following from `lambda/` and then from `lambda/cdk/`:

```sh
uv pip compile --python 3.11 --universal --upgrade requirements.in -o requirements.txt
uv venv --python 3.11 .venv
uv pip sync --python .venv/bin/python requirements.txt
uv pip check --python .venv/bin/python
uvx --python 3.11 pip-audit -r requirements.txt
```

Verify Lambda imports with offline environment values and `PYTHON_DOTENV_DISABLED=1`.
For CDK, run `python app.py` in its Python environment with Docker available and an explicit `CDK_OUTDIR`.
Compare synthesized templates before accepting a CDK update.
Synthesis builds artifacts locally; it does not deploy resources.

Build the standalone Lambda image from the repository root so it can use the existing RDS certificate:

```sh
docker build --platform linux/arm64 -f lambda/Dockerfile.lambda -t mailguard-local .
```

The Dockerfile-specific ignore file limits the build context to the application, dependency lock, and certificate.
The Compose build uses the same repository-root context.

## Remaining migration work

The calendar now uses `@daypicker/react` 10 with its current class names and Chevron component API.
Vaul 1.1.2 explicitly supports the React 19 version used by the app.
Use `pnpm install --resolution-only --no-frozen-lockfile --strict-peer-dependencies` to validate peers even when an existing lockfile is up to date.
Then run a frozen install and the relevant checks.
ESLint 9 and Recharts 2 are deprecated upstream.
Resolve these through separate compatibility migrations with checks of the affected UI flows.
Do not hide these warnings with peer-dependency overrides.

For ESP32, compile both PlatformIO environments with dummy local credentials before changing the framework or libraries.
Firmware compilation does not verify camera, Wi-Fi, scale calibration, or a physical device.

## References

- [Renovate upgrade practices](https://github.com/renovatebot/renovate/blob/main/docs/usage/upgrade-best-practices.md)
- [npm-check-updates](https://github.com/raineorshine/npm-check-updates)
- [Next.js 15.5.25 AVIF follow-up](https://github.com/vercel/next.js/releases/tag/v15.5.25)
- [Windows Next.js advisory](https://github.com/advisories/GHSA-p293-qw3h-jr36)
- [AVIF Next.js advisory](https://github.com/advisories/GHSA-2xp9-vwfh-vxw4)
- [sharp advisory](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c)
- [js-yaml advisory](https://github.com/advisories/GHSA-2883-xcg3-v3hh)
