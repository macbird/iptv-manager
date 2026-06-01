# Projeto Cliente Manager - Diretrizes de Desenvolvimento

## Regras de Desenvolvimento e Validação

1.  **Validação Obrigatória:** Antes de confirmar qualquer alteração na interface (UI) ou lógica de frontend como concluída, é obrigatória a validação empírica utilizando o `chrome-devtools` (skill `chrome-devtools`).
    *   Verifique se a página renderiza sem erros no console.
    *   Verifique se as interações (botões, submissão de formulários, navegação) funcionam como esperado.
    *   Valide o comportamento responsivo.

2.  **Ciclo de Vida:** Operar estritamente no ciclo **Pesquisa -> Estratégia -> Execução (Plan -> Act -> Validate)**. Nenhuma tarefa é considerada finalizada sem a devida validação.
