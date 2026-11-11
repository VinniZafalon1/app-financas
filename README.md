# Saldo — controle financeiro pessoal

Aplicativo de finanças pessoais criado com **Ionic Vue**, Vue 3, Supabase, ApexCharts e Capacitor. A interface funciona na web e o projeto inclui uma versão Android.

## Requisitos

- Node.js 20 ou superior
- npm
- Para compilar Android: Android Studio, Android SDK e o JDK incluído no Android Studio

## Instalar e executar

```bash
npm install
npm run dev
```

Abra o endereço local exibido pelo Vite. Sem configurar o Supabase, entre em **Explorar demonstração** para usar o app com dados de exemplo salvos no navegador.

Para gerar uma compilação web:

```bash
npm run build
```

## Funcionalidades

- Cadastro, login e logout com Supabase Auth, além de modo demonstração local.
- Dashboard com receitas, despesas, saldo, percentual comprometido, categorias, evolução mensal e movimentações recentes.
- Cadastro, edição, exclusão, busca e filtro de receitas e despesas.
- Personalização do perfil com nome, cor do avatar e foto. A foto pode ser trocada ou removida.
- Layout responsivo para computador e celular, com navegação por menu e barra inferior.

## Configurar o Supabase

1. Crie um projeto Supabase e habilite autenticação por e-mail e senha.
2. Crie o arquivo `.env.local` na raiz do projeto, com os dados do seu projeto:

   ```env
   VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=SUA_CHAVE_PUBLICAVEL
   ```

   Em projetos antigos, a chave também pode ser informada como `VITE_SUPABASE_ANON_KEY`. Use somente a chave publicável/anon no aplicativo. Nunca inclua a chave `service_role` no frontend.

3. Execute [supabase/schema.sql](supabase/schema.sql) no SQL Editor. O script cria as tabelas de receitas e despesas e as políticas RLS para cada usuário acessar somente os próprios lançamentos.
4. Para habilitar fotos de perfil, crie no Storage um bucket chamado `profile-avatars`. Deixe-o privado, configure o limite máximo em 2 MB e permita `image/jpeg`.
5. Execute [supabase/profile-storage.sql](supabase/profile-storage.sql) no SQL Editor para aplicar as políticas de acesso às fotos. Cada pessoa acessa apenas os arquivos da própria pasta.
6. Em **Authentication > URL Configuration**, configure a URL do seu app e adicione `http://localhost:5173/login` e `br.com.vzafalon.saldo://auth-callback` às URLs de redirecionamento.
7. Em **Authentication > Sign In / Providers**, habilite Email e permita novos cadastros. Reinicie o servidor depois de criar ou alterar `.env.local`.

O app usa o Supabase quando as variáveis de ambiente estão configuradas. Sem elas, abre o modo demonstração local. No modo conectado, JPG, PNG e WebP são recortados para quadrado e convertidos para JPEG antes do envio; no modo demonstração, a foto fica salva no armazenamento local do navegador.

## Android

O projeto nativo está na pasta `android/`. Configure `.env.local` antes de compilar para incluir a conexão Supabase no app. Para sincronizar a versão web com o projeto Android:

```bash
npm run android:sync
```

Para abrir no Android Studio:

```bash
npm run android:open
```

Para gerar um APK de depuração no Windows, execute dentro da pasta `android`:

```powershell
.\gradlew.bat assembleDebug
```

O arquivo gerado fica em `android/app/build/outputs/apk/debug/app-debug.apk`. Para distribuir o aplicativo, gere uma versão assinada pelo Android Studio.

O projeto Android está configurado. A plataforma iOS requer macOS e Xcode e ainda não foi criada neste projeto.
