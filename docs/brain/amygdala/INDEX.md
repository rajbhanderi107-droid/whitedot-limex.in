# 🔐 AMYGDALA — Security Dome

> Threat response, security rules, secret management.

## Files
- [SECURITY.md](SECURITY.md) — Full security policy

## Rules (Never Break)
- No secrets in git — ever
- One active GCP secret at a time
- JWT in header, never cookie
- CORS must include whitedotindia.in explicitly

## Auto-Debug Layer
- Hook fires on every Bash/PowerShell error
- Routes to debug-monster automatically
- Config: `.claude/settings.json`

← [Brain Cortex](../../obsidian/🧠%20BRAIN-CORTEX.md)
