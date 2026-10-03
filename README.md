# NoteScan

O NoteScan é um aplicativo mobile para registrar gastos a partir de uma foto de nota ou cupom. A leitura do texto acontece no aparelho. Os gastos ficam salvos neste aparelho. Não há conta, servidor nem banco remoto.

## O que funciona

- Continuar para a área principal, sem pedir senha.
- Tirar foto ou escolher uma imagem da galeria.
- Cancelar a câmera ou a galeria sem alterar nada.
- Ver a imagem escolhida e um indicador enquanto a leitura acontece.
- Ler o texto com OCR nativo, quando o app roda em um development build de Android ou iOS.
- Revisar descrição, valor, data e categoria antes de salvar.
- Preencher um gasto manualmente, com o mesmo formato dos gastos lidos por OCR.
- Guardar, editar e excluir gastos em AsyncStorage.
- Escolher quais categorias aparecem ao salvar. Um gasto antigo permanece na categoria em que foi gravado.
- Mostrar o gráfico só com a soma dos gastos salvos. Sem gastos, o gráfico não inventa números.

## O que não existe

- Conta, login, cadastro, logout e recuperação de senha. Não há backend, então o app não finge autenticar.
- Envio da foto para um servidor.
- Cópia automática da foto para a galeria.
- Parser completo de nota fiscal. A leitura só preenche um campo quando o texto contém um sinal claro: uma linha de estabelecimento, uma data `dd/mm/aaaa`, ou um único valor / um valor na linha de total. O resto fica em branco para a pessoa completar.
- OCR no Expo Go e na web.

## Requisitos

- Node.js usado nesta máquina: v24.17.0. O Expo SDK 54 é normalmente usado com Node 20 ou 22. A compatibilidade oficial com Node 24 não foi confirmada além dos testes locais abaixo.
- npm 11.13.0
- Expo SDK 54 (`expo` ~54.0.20)
- React Native 0.81.5
- Para o OCR: Android Studio ou Xcode, porque o leitor é um módulo nativo

## Instalação

Na pasta que contém este `package.json`:

```bash
npm install
```

O `package-lock.json` fixa as versões instaladas. Não há arquivo `.env`.

## Executar

Expo Go abre a interface, a entrada manual, as categorias e o gráfico. A leitura da foto não funciona no Expo Go: o módulo nativo `expo-text-extractor` não está embutido nele. Se a leitura não estiver disponível, o app mostra a foto e pede para preencher os dados. Ele não inventa texto.

```bash
npm start
```

Development build, necessário para testar o OCR de verdade:

```bash
npx expo run:android
npx expo run:ios
```

O comando gera as pastas nativas, compila o app e instala um cliente de desenvolvimento. A pasta `ios` só pode ser gerada no macOS. Este repositório ainda não teve um development build executado em aparelho ou emulador.

Build de produção com EAS, quando houver conta Expo:

```bash
npx eas-cli build --platform android --profile production
npx eas-cli build --platform ios --profile production
```

Os perfis estão em `eas.json`. Nenhum build de produção foi gerado.

Web:

```bash
npm run web
```

A web não tem OCR. A câmera depende do que o navegador permitir.

## OCR

A biblioteca é `expo-text-extractor` 2.0.0. Ela usa Google ML Kit no Android e Apple Vision no iOS. Não usa rede. Não há plugin próprio no pacote; o autolinking do Expo inclui o módulo no development build.

Permissões pedidas na hora da captura:

- câmera, para fotografar a nota;
- fotos, para escolher uma imagem existente.

Os textos estão em `app.json`, no plugin `expo-image-picker`. A imagem usada na leitura permanece no cache do seletor. O app não grava essa imagem na galeria e não mostra o caminho interno do arquivo.

## Armazenamento

Tudo é local, via AsyncStorage:

- `@notescan/expenses` — lista de gastos
- `@notescan/categories` — categorias marcadas

Se existir a chave antiga `@user_categories`, ela é copiada uma vez para `@notescan/categories`. JSON ilegível não é apagado automaticamente; a tela mostra erro e não substitui esses dados.

Um gasto tem `id`, `amount`, `description`, `date`, `category`, `ocrText` e `createdAt`. Descrição, data e texto OCR podem ser nulos. O valor e a categoria são obrigatórios para salvar.

O valor digitado usa vírgula como decimal. Ponto em grupos de três é milhar: `1.234` vale 1234 e `1.234,56` vale 1234,56. Um ponto com uma ou duas casas, como `10.50`, continua valendo decimal.

## Testes

```bash
npm test
```

Os testes cobrem armazenamento, leitura simples do texto, validação, gráfico vazio, OCR simulado por uma função injetada, cancelamento da câmera, criação de um gasto manual e a ida desse gasto até as abas Gastos e Gráfico. Eles não usam câmera física nem o módulo nativo.

Há um teste que desmonta e monta o aplicativo de novo dentro do mesmo processo do Jest, para verificar o carregamento inicial. Isso não reinicia o sistema operacional. O reinício real do aparelho continua pendente.

Não há lint configurado e o projeto não está em TypeScript, então não há typecheck.

## Arquitetura

- `App.js` — safe area, tema, dados e navegação
- `routes/AppRoutes.js` — Welcome, abas, captura, revisão e entrada manual
- `pages/Dashboard.js` — resumo dos gastos salvos
- `pages/Camera.js` — captura e chamada do OCR
- `pages/More.js` — preferências de categoria neste aparelho
- `pages/Review.js` e `pages/ManualEntry.js` — o mesmo formulário de gasto
- `pages/Expenses.js` — histórico
- `pages/Chart.js` — totais calculados dos gastos
- `services/storage` — leitura e gravação
- `services/ocr/recognizeText.js` — OCR isolado, para poder testar sucesso, texto vazio, erro e tempo esgotado sem a câmera
- `services/expenses` — valor, leitura simples do cupom e validação
- `data/categories.js` — catálogo fixo

## Demonstração em desenvolvimento

Em build de produção essa seção não aparece. No Expo Go ou num development build:

1. Toque em Continuar.
2. Abra a aba Mais.
3. Em Desenvolvimento, toque em **Gerar dados de demonstração**.
4. Volte para Início, Gastos e Gráfico. Os totais saem desses gastos gravados.
5. Volte a Mais e toque em **delete**.

O app não recria esses gastos ao abrir. O comando `delete` apaga somente gastos cujo `id` começa com `demo-`. Um gasto lançado pela pessoa permanece. Categorias e preferências não são alteradas.

## Limitações conhecidas

- O ícone, o splash e o favicon ainda são os arquivos de modelo do Expo que já estavam no projeto. O logo usado dentro do app é `assets/images/noteScan.png`.
- A pasta do workspace não é um repositório Git.
- O identificador nativo está como `com.notescan.app`. Troque antes de publicar, se precisar de outro.
- Não há paginação. A lista cabe no uso pessoal, não em um volume grande de lançamentos.
- `npm audit` aponta vulnerabilidades em dependências transitivas do ecossistema Expo e Jest. Elas não foram atualizadas automaticamente.
