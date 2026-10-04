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
- Guardar a foto da nota junto do gasto e abrir essa foto em Meus gastos, pelo botão "Ver nota".
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

Os textos estão em `app.json`, no plugin `expo-image-picker`. O app não grava a imagem na galeria e não mostra o caminho interno do arquivo.

## Armazenamento

Tudo é local, via AsyncStorage:

- `@notescan/expenses` — lista de gastos
- `@notescan/categories` — categorias marcadas

Se existir a chave antiga `@user_categories`, ela é copiada uma vez para `@notescan/categories`. JSON ilegível não é apagado automaticamente; a tela mostra erro e não substitui esses dados.

Um gasto tem `id`, `amount`, `description`, `date`, `category`, `ocrText`, `receiptImage` e `createdAt`. Descrição, data, texto OCR e foto podem ser nulos. O valor e a categoria são obrigatórios para salvar. Gastos gravados antes da foto existir continuam válidos sem `receiptImage`.

### Foto da nota

Ao salvar um gasto que veio de uma foto, a imagem é copiada do cache do seletor para `receipts/<id do gasto>.<extensão>`, na pasta de documentos do app (`expo-file-system`). Essa pasta é privada do NoteScan, não aparece na galeria e o sistema não a limpa como faz com o cache. O gasto guarda só o caminho relativo, porque no iOS o endereço absoluto da pasta de documentos muda entre atualizações.

- Se a cópia falhar, o gasto não é salvo e a revisão continua aberta para tentar de novo.
- Se a gravação do gasto falhar depois da cópia, a foto copiada é apagada.
- Excluir o gasto apaga a foto dele.
- Editar o gasto mantém a foto.
- Gasto lançado manualmente não tem foto.
- Na web não há pasta de documentos. O gasto é salvo sem foto.

### Arquivos temporários

`services/files/temporaryFiles.js` controla a pasta `notescan-tmp`, dentro do cache do app (`Paths.cache`). Só essa camada cria ou apaga arquivos nela.

- O nome de cada arquivo é `<id do gasto>__<sufixo único>.<extensão>`. O id do gasto é gerado quando a foto é capturada e é o mesmo que o gasto recebe ao ser salvo. Assim, gasto → id do temporário → caminho fica explícito.
- O expo-image-picker grava cada foto como `<UUID>.<ext>` em `cache/ImagePicker` (no Expo Go para iOS, às vezes direto na raiz do cache). Só um arquivo assim é movido para `notescan-tmp`. Se mover falhar, a foto é copiada, a cópia é conferida (existe e tem o mesmo tamanho) e só então o original sai. Qualquer outra origem é copiada e o original fica intacto. `content://`, `ph://`, `assets-library://`, `data:` e `blob:` não são aceitos; nesse caso a captura segue com o endereço original, sem temporário.
- Os caminhos são comparados na forma canônica: decodificada, sem `file://` e com `/private/var` → `/var` (iOS) e `/data/data` → `/data/user/0` (Android). Diferença de maiúsculas e minúsculas não é tratada como o mesmo caminho, então a operação é recusada.
- A leitura do OCR e a cópia para `receipts/` marcam o arquivo como em uso. Uma exclusão pedida nesse intervalo fica pendente e acontece quando o uso termina.
- Salvar copia o temporário para `receipts/` e apaga o temporário. Durante esse instante a foto existe nos dois lugares, porque o temporário é a única fonte para uma nova tentativa. Se a cópia for interrompida, a foto parcial em `receipts/` é apagada. Se a gravação do gasto falhar, o temporário fica para nova tentativa e a cópia em `receipts/` é desfeita.
- Se o app for encerrado entre a cópia para `receipts/` e a gravação do gasto, a foto fica em `receipts/` sem gasto. O app não apaga fotos de `receipts/` automaticamente.
- Fechar a revisão, salvando ou cancelando, apaga os temporários daquele gasto. Sair da captura durante a leitura também.
- Excluir um gasto, pela tela ou pelas rotinas internas (incluindo o `delete` da demonstração), passa por `services/expenses/expenseRemoval.js`. Essa função remove o registro, a foto em `receipts/` e os temporários com o id do gasto.
- Se o sistema recusar uma exclusão, o arquivo entra numa fila que é tentada de novo depois, sem derrubar o app.
- Ao abrir o app, arquivos de `notescan-tmp` com o padrão de nome do NoteScan e que não pertencem à execução atual são apagados. Arquivos fora desse padrão, pastas e qualquer coisa fora dessa pasta nunca são tocados. O registro da execução atual sobrevive ao Fast Refresh, então recarregar o código em desenvolvimento não apaga o temporário de uma revisão aberta.
- Toda operação valida o nome contra o padrão acima e confere que o caminho canônico é filho direto da pasta controlada. Caminhos com `..`, `%2e%2e`, `\`, separador codificado, `?` ou `#` são recusados.

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
- `pages/Receipt.js` — foto da nota de um gasto
- `services/receipts/receiptFiles.js` — cópia, endereço e exclusão da foto da nota
- `services/files/temporaryFiles.js` — arquivos temporários: criação, uso, exclusão e limpeza
- `services/expenses/expenseRemoval.js` — exclusão de um gasto com seus arquivos
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
