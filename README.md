# Saldo — controle financeiro pessoal

Aplicativo responsivo de finanças pessoais feito com Ionic Vue, Vue 3 Composition API, Supabase, ApexCharts e Capacitor. Inclui projeto nativo Android.

## Rodar localmente

1. Instale Node.js 20 ou superior.
2. Na pasta do projeto, execute `npm install` e `npm run dev`.
3. Sem credenciais, use **Explorar demonstração** na tela inicial. Os lançamentos de exemplo e as alterações ficam no `localStorage` deste navegador.

## Conectar ao Supabase

1. Crie um projeto Supabase e habilite autenticação por e-mail/senha.
2. Copie `.env.example` para `.env.local` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` com os dados de API do projeto. Projetos antigos também podem usar `VITE_SUPABASE_ANON_KEY`.
3. Execute [supabase/schema.sql](supabase/schema.sql) no SQL Editor do Supabase. As tabelas têm RLS para que cada conta acesse somente os próprios lançamentos.
4. Em Authentication > URL Configuration, adicione `http://localhost:5173/login` e `br.com.vzafalon.saldo://auth-callback` à lista de Redirect URLs. Defina também a Site URL usada para a versão web publicada.
5. Em Authentication > Sign In / Providers, habilite Email e permita novos cadastros. A confirmação por e-mail está integrada ao retorno por deep link no Android.
6. Reinicie `npm run dev` e use **Criar conta** para cadastrar um usuário.

O modo conectado e o modo demonstração são mutuamente exclusivos: com as variáveis de ambiente configuradas, o app usa Supabase para autenticação e persistência. Nunca coloque a chave `service_role` no frontend.

## Android

O projeto Android já está criado em `android/`. O APK de depuração pode ser reconstruído com:

1. Instale Android Studio, Android SDK e JDK (o JDK incluído no Android Studio serve).
2. Configure `.env` antes do build para que o APK use o Supabase; sem ela, o APK usa o modo demonstração local.
3. Execute `npm run android:sync` para compilar a web e sincronizar os arquivos nativos.
4. Abra com `npm run android:open` e gere um APK assinado pelo Android Studio para distribuição. Para gerar o APK de depuração pela linha de comando, execute `gradlew.bat assembleDebug` dentro da pasta `android`.

O APK de depuração gerado neste workspace fica em `android/app/build/outputs/apk/debug/app-debug.apk`. Para iOS é necessário macOS e Xcode; esta plataforma ainda não foi gerada.

## O que já está implementado

- Cadastro, login, logout e navegação protegida com Supabase Auth.
- Receitas e despesas com inclusão, edição, exclusão, busca e filtro por período.
- Dashboard com receitas, despesas, saldo, percentual comprometido, distribuição por categoria, evolução mensal e movimentações recentes.
- Validação de valores positivos, descrição, categoria e data.
- Modo demonstração local para experimentar sem configurar credenciais.
- Layout responsivo para telas grandes e celulares.

## Empacotar para Android/iOS

Para atualizar os arquivos nativos após mudanças, execute `npm run android:sync`.

## Foto de perfil no Supabase

Para habilitar o envio de fotos no modo conectado:

1. No painel do Supabase, abra **Storage** e crie um bucket chamado `profile-avatars`. Deixe-o **privado**, defina o tamanho máximo como **2 MB** e permita apenas `image/jpeg`.
2. Execute [supabase/profile-storage.sql](supabase/profile-storage.sql) no SQL Editor. As políticas restringem leitura, envio, atualização e remoção à pasta do próprio usuário.
3. No app, a pessoa escolhe JPG, PNG ou WebP; a imagem é recortada para quadrado e convertida para JPEG antes do envio.

No modo demonstração, a foto é salva no armazenamento local do navegador.
