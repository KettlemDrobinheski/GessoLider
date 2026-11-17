# Segurança e acesso local

O GessoLider não tem backend de autenticação. A opção **Continuar neste dispositivo** apenas registra no AsyncStorage que o uso local foi iniciado; o Expo Router usa esse estado para controlar a navegação entre as telas públicas e internas.

Esse estado não confirma identidade e não é uma barreira contra alguém que tenha acesso ao dispositivo, aos dados do aplicativo ou ao armazenamento local. O AsyncStorage não é criptografado. Orçamentos, clientes, dados da empresa e o cliente em edição ficam no aparelho e não são separados por usuário. Encerrar o acesso remove a autorização de navegação, mas não exclui os dados salvos.

Login por senha, cadastro, login social, recuperação de conta, sincronização entre dispositivos e isolamento de registros exigem autenticação e persistência em servidor. Antes de oferecer essas garantias, o projeto precisa de backend, política de sessão, controle de acesso por usuário e migração dos registros locais.

Na Web, o AsyncStorage usa o armazenamento local do navegador e os registros ficam associados à origem e ao perfil do navegador em uso. Eles não são sincronizados entre dispositivos nem enviados para backup na nuvem. Limpar os dados do site, usar uma sessão privada ou trocar de domínio pode deixar esses registros indisponíveis.
