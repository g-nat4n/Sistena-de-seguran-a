## SmartGuard AI 1.2.5

Corrige heranca de usuarios/banco de outra instalacao no mesmo PC.

### O que mudou
- Cada instalacao usa pasta de dados isolada (`ProgramData\\SmartGuard\\instances\\...`)
- Ao abrir, nao reutiliza API antiga de outro Setup ainda rodando
- Botao para zerar dados desta instalacao (login / Este PC)

### Importante
Na primeira abertura desta versao, pode pedir cadastro do administrador de novo (banco limpo e isolado).
Isso e esperado para nao misturar logins antigos.
