# AEGIS AI Backend Container Scan Exception

Date recorded: 2026-08-04
Review date: 2026-11-04

## Reason

Trivy detects two vulnerable package versions through third-party SBOM
metadata inherited from the official Python base image.

Direct inspection of the final container filesystem confirmed:

- msgpack 1.2.1
- setuptools 83.0.0

No msgpack 1.1.2 or setuptools 70.3.0 package metadata exists in the
final runtime filesystem.

The suppressed findings are restricted to the exact stale PURLs:

- pkg:pypi/msgpack@1.1.2
- pkg:pypi/setuptools@70.3.0

All other HIGH and CRITICAL findings remain active and will fail the scan.
