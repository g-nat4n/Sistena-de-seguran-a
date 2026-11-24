# Assinatura do Setup (Authenticode)

O SmartGuard **1.3.0+** já está preparado para assinar o instalador. Sem certificado, o Windows SmartScreen pode mostrar “Windows protegeu o PC”.

## O que precisa

1. Certificado Authenticode (`.pfx`) — idealmente **EV** para reputação mais rápida no SmartScreen  
2. Variáveis de ambiente no PC/CI que gera o Setup:

```powershell
$env:CSC_LINK = "C:\certs\smartguard.pfx"   # ou base64 do PFX
$env:CSC_KEY_PASSWORD = "senha-do-pfx"
```

3. Gerar o instalador normalmente:

```powershell
cd desktop
npm run dist
```

O `electron-builder` assina automaticamente quando `CSC_LINK` está definido.

## Assinar um Setup já gerado

```powershell
.\windows\scripts\sign-setup.ps1 -SetupPath .\desktop\dist\SmartGuard-AI-Setup.exe
```

Requer `signtool.exe` (Windows SDK) e as mesmas variáveis `CSC_LINK` / `CSC_KEY_PASSWORD`.

## Sem certificado

- Distribua o link direto do `.exe`  
- Oriente: **Mais informações → Executar assim mesmo**  
- A assinatura não bloqueia o app; só reduz o aviso do SmartScreen
