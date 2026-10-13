# Privacy and safety — public technical spike

This GitHub repository is public. HealthKit samples and live activity metadata can include sensitive health/location information. Keep all real data local to user's physical devices unless a fully reviewed, consented upload mechanism is separately approved; **none is in scope for the PoC**.

- Do not commit Apple Developer API keys, credentials, team identifiers, device IDs/UDIDs, provisioning material, Expo tokens, EAS secret environment values or private health content.
- Do not store real route coordinates, heart-rate arrays, timestamps tied to the owner's identity, screenshot galleries of private Health app, or private workout JSON in issues/CI logs.
- No PHI telemetry/analytics, no LLM API calls with HealthKit payloads, no backend upload or third-party data sharing.
- Permission just-in-time, specify use and data category in app descriptions; minimum HealthKit read types for running workout query plus optional distance and HR if justified.
- HealthKit read access can intentionally obscure authorization status. Use "requested", "no data", "unavailable", not a fabricated "fully connected".
- Keep in-memory samples ephemeral; sample display on phone for manual test only, no persisted remote diagnostics.
- Sanitize error reports and screenshots before attaching evidence to GitHub.
- Build credential provisioning through official secure Apple/EAS flows; document required config fields, not actual secrets.
- Follow Apple HealthKit data-use restrictions and current platform requirements before integrating into production.
