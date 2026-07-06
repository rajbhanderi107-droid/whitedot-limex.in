# Deploy & cache

WhiteDot production is served from the Hostinger VPS.

Current live path:

```txt
Visitor browser -> GoDaddy DNS -> Hostinger VPS -> nginx -> /var/www/whitedot-frontend
```

## Production deploy

Production deploys are handled by GitHub Actions:

- Workflow: `.github/workflows/deploy.yml`
- Trigger: push to `main` or manual `workflow_dispatch`
- Build command: `npm ci && npm run build`
- Upload target: `/var/www/whitedot-frontend-new`
- Live directory after atomic swap: `/var/www/whitedot-frontend`
- Web server: nginx on the Hostinger VPS

The workflow builds the Vite site, uploads `dist/` to the VPS, swaps it into the live directory, validates nginx, and reloads nginx.

## DNS

DNS is managed in GoDaddy. The live domain should point to the Hostinger VPS:

- `whitedotindia.in`
- `www.whitedotindia.in`

The expected A record target is the current Hostinger VPS IP used by the deployment secrets.

## When the site is not reachable

Use the VPS repair workflow:

- Workflow: `.github/workflows/vps-web-repair.yml`
- Name: `Repair VPS Web Reachability`

That workflow restarts nginx, verifies ports `80` and `443`, opens local firewall rules when needed, and runs public smoke checks from GitHub Actions.

If GitHub Actions can reach the site but a local network cannot, the issue is likely outside the repo and VPS OS, such as GoDaddy DNS propagation, Hostinger network/firewall, or the local ISP route to the VPS.
