# PRD - Pecadômetro Diário

## 1. Visão Geral do Produto
O **Pecadômetro Diário** é uma aplicação web interativa e gamificada projetada para amigos monitorarem seus "pecados" diários de forma lúdica. O sistema permite que os usuários registrem suas falhas morais/comportamentais baseadas em uma lista pré-definida, gerando uma pontuação acumulada e um ranking competitivo entre o grupo.

## 2. Objetivos
- **Gamificação Social:** Criar uma dinâmica de grupo através de um ranking (Leaderboard).
- **Auto-reflexão:** Proporcionar uma forma visual de acompanhar comportamentos diários.
- **Engajamento:** Estimular o uso diário através de um histórico persistente.

## 3. Público-Alvo
Grupos de amigos que buscam uma forma descontraída e interativa de compartilhar e comparar suas rotinas morais/éticas.

## 4. Funcionalidades Principais (MVP)
- **Autenticação:** Login social via Google para identificação única e persistência de dados.
- **Checklist Diário:** Lista de mais de 100 pecados para seleção manual.
- **Cálculo de Pontuação:** Cada pecado selecionado equivale a 1 ponto.
- **Ranking em Tempo Real:** Visualização dos top 10 usuários com maior pontuação acumulada.
- **Histórico Pessoal:** Visualização de registros de dias anteriores.
- **Interface Responsiva:** Otimizada para uso em dispositivos móveis e desktop.

## 5. Requisitos Não-Funcionais
- **Segurança:** Regras de acesso via Firebase Security Rules para garantir que usuários só editem seus próprios dados.
- **Performance:** Carregamento rápido e atualizações em tempo real via Firestore Snapshots.
- **Estética:** Design "Dark Mode" moderno com elementos visuais de alta qualidade (shadcn/ui).

---

# Especificações Técnicas (Specs)

## 1. Stack Tecnológica
- **Frontend:** React 19 (Vite)
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS 4.0
- **Componentes:** shadcn/ui (Radix UI)
- **Animações:** Motion (Framer Motion)
- **Backend/DB:** Firebase (Firestore + Auth)

## 2. Arquitetura de Dados (Firestore)

### Coleção: `users`
- `uid` (string): ID único do Firebase Auth.
- `displayName` (string): Nome exibido do usuário.
- `photoURL` (string): Link da foto de perfil.
- `totalScore` (number): Soma acumulada de todos os pecados registrados.
- `lastUpdate` (timestamp): Data da última modificação.

### Coleção: `logs`
- `userId` (string): Referência ao usuário.
- `date` (string): Formato `YYYY-MM-DD`.
- `sins` (array<string>): Lista de nomes dos pecados selecionados.
- `score` (number): Quantidade de pecados naquele dia.
- *ID do Documento:* `${userId}_${date}` (Garante um registro único por usuário/dia).

## 3. Regras de Negócio
1. **Pontuação:** 1 pecado selecionado = 1 ponto.
2. **Unicidade Diária:** O usuário pode editar sua lista de hoje múltiplas vezes, mas apenas o estado final do dia é persistido como o log oficial.
3. **Ranking:** Ordenado de forma decrescente pelo `totalScore`.

## 4. Design System
- **Cores:**
  - Background: `#0a0a0a` (Preto profundo)
  - Accent: `#ea580c` (Laranja/Fogo)
  - Surface: `#18181b` (Zinco escuro)
- **Tipografia:** Sans-serif moderna (Inter/System) com variações em Itálico e Black para títulos.

## 5. Segurança (Firestore Rules)
- Usuários autenticados podem ler o ranking e perfis de outros.
- Usuários só podem criar/editar documentos na coleção `users` e `logs` se o `userId` corresponder ao seu próprio `auth.uid`.
- Validação de tipos de dados (strings, numbers, lists) no nível do banco de dados.
