# Revisão de finalização do GessoLider

## Entregue nesta revisão

- Substituído o formulário de login sem autenticação por uma entrada local claramente descrita e persistida no dispositivo.
- Aplicadas rotas protegidas do Expo Router ao estado de acesso local, com ação para encerrar esse acesso na tela inicial.
- Removido o nome de cliente dos parâmetros usados para editar orçamentos salvos; os dados são carregados do registro local.
- Removidos controles de notificação sem ação e saudação com identidade fixa.
- Preservados os cálculos e a geração do documento existentes.
- Documentadas as limitações do acesso local em [SECURITY.md](./SECURITY.md).

## Lacunas ainda abertas

- O rascunho em andamento é salvo localmente ao editar os campos e pode ser retomado na etapa atual. A validação após encerramento forçado e em dispositivos físicos ainda é necessária.
- Não foi feita uma auditoria visual/interativa de todas as telas nem validação funcional em Android ou iOS.
- A auditoria completa de acessibilidade, navegação e erros de armazenamento ainda precisa de uma rodada dedicada.
- Login real, cadastro, recuperação de conta, sincronização e isolamento por usuário dependem de backend.
- ESLint e Expo Doctor não puderam ser executados: o projeto não tem configuração/script do ESLint e este ambiente não permite baixar dependências do npm.

## Validação manual final em dispositivos

1. Instalar e iniciar em Android e iOS; confirmar o acesso inicial, fechamento e reabertura do app.
2. Tentar abrir diretamente uma rota interna sem acesso local; confirmar redirecionamento para a tela de acesso.
3. Encerrar o acesso local e confirmar que as rotas internas deixam de abrir sem apagar o histórico salvo.
4. Criar um orçamento para cada serviço; revisar medidas, materiais, valores e totais.
5. Salvar, editar, duplicar, mudar cada status e excluir com confirmação; conferir histórico e detalhe após cada ação.
6. Reconstruir e visualizar o PDF de um orçamento com portas e janelas, confirmar empresa e cliente históricos, quantidades de materiais, total de materiais e mão de obra; compartilhar o arquivo.
7. Interromper um orçamento em cada etapa e confirmar restauração dos campos, especialmente durante fechamento forçado do processo.
