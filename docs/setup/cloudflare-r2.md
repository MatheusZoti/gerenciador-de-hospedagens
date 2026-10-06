# Configurar o Cloudflare R2 (fotos de perfil)

O app guarda as fotos de perfil num bucket do **Cloudflare R2**, que é
compatível com S3. O plano gratuito cobre 10 GB e não cobra pela saída de
dados. Enquanto o R2 não estiver configurado, o upload fica desativado e o
perfil mostra as iniciais.

## 1. Criar o bucket

1. No painel da Cloudflare, abra **R2 Object Storage** e ative o serviço.
2. **Create bucket** → nome, por exemplo `hospedagens-arquivos`. Em
   *Location*, escolha *Automatic* (ou América do Sul, se disponível).
3. Abra o bucket → **Settings** → **Public access** e escolha uma das opções:
   - **Custom domain** (recomendado em produção): por exemplo
     `arquivos.seudominio.com.br`;
   - **R2.dev subdomain** (rápido para testar): gera uma URL
     `https://pub-xxxx.r2.dev`.

   Essa URL pública é o `R2_PUBLIC_URL`.

## 2. Criar a chave de API

1. Em **R2 Object Storage** → **Manage R2 API Tokens** → **Create API token**.
2. Permissão **Object Read & Write**, restrita ao bucket criado.
3. Copie o **Access Key ID** e o **Secret Access Key**. O segredo só aparece
   uma vez.
4. O **Account ID** aparece na página inicial do R2, à direita.

## 3. Variáveis de ambiente

No `.env` da raiz (e nas variáveis do projeto na Vercel):

```bash
R2_ACCOUNT_ID=seu-account-id
R2_ACCESS_KEY_ID=sua-access-key
R2_SECRET_ACCESS_KEY=seu-secret
R2_BUCKET=hospedagens-arquivos
R2_PUBLIC_URL=https://arquivos.seudominio.com.br   # sem barra no final
```

`R2_ENDPOINT` fica vazio em produção. Ele só serve para apontar para um
emulador S3 local em testes.

Reinicie o app. Em **Perfil**, o campo de foto passa a aceitar JPG, PNG ou
WebP de até 2 MB.

## Como funciona

- **Validação:** o upload passa por uma Server Action. O arquivo é conferido
  pelo **conteúdo** (assinatura do arquivo), não só pela extensão.
- **Caminho no bucket:** `avatars/<id-do-usuario>/<uuid>.<ext>`. Cada envio
  gera um nome novo, então o arquivo pode ficar em cache para sempre.
- **Limpeza:** ao trocar ou remover a foto, a anterior é apagada do bucket.
- **Arquitetura:** o código fala com a porta `FileStorage`
  (`packages/core/src/storage/ports.ts`). Trocar o R2 por outro serviço
  compatível com S3 só muda as variáveis de ambiente.
