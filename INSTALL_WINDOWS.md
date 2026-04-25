# Installer NimbrayAI Beta sur Windows

Ouvre PowerShell dans le dossier NimbrayAI_Beta, puis :

```powershell
npm.cmd install --no-audit --no-fund
copy .env.example .env.local
npm.cmd run dev
```

Ouvre ensuite :

```text
http://localhost:3000
```

Tu peux aussi double-cliquer sur `start-windows.cmd`.
