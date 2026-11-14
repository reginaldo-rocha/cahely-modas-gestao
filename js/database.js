
const Database = {
    STORAGE_KEY: "cahelyModasDB",

    // Estrutura inicial do sistema
    dadosVazios() {
        return {
            fornecedores: [],
            pecas: [],
            vendas: [],
            pagamentos: [],
            despesas: []
        };
    },

    // Carrega os dados do navegador
    carregar() {
        try {
            const armazenado = localStorage.getItem(this.STORAGE_KEY);

            if (!armazenado) {
                return this.dadosVazios();
            }

            const dados = JSON.parse(armazenado);

            return {
                fornecedores: Array.isArray(dados.fornecedores)
                    ? dados.fornecedores : [],

                pecas: Array.isArray(dados.pecas)
                    ? dados.pecas : [],

                vendas: Array.isArray(dados.vendas)
                    ? dados.vendas : [],

                pagamentos: Array.isArray(dados.pagamentos)
                    ? dados.pagamentos : [],

                despesas: Array.isArray(dados.despesas)
                    ? dados.despesas : []
            };

        } catch (erro) {
            console.error("Erro ao carregar dados:", erro);
            alert("Não foi possível carregar os dados.");
            return this.dadosVazios();
        }
    },

    // Salva os dados no navegador
    salvar(dados) {
        try {
            localStorage.setItem(
                this.STORAGE_KEY,
                JSON.stringify(dados)
            );

            return true;

        } catch (erro) {
            console.error("Erro ao salvar dados:", erro);
            alert("Não foi possível salvar os dados.");
            return false;
        }
    },

    // Gera identificador único
    gerarId() {
        return Date.now().toString(36) +
            Math.random().toString(36).substring(2, 9);
    },

    // Exporta backup completo
    exportarBackup() {
        const dados = this.carregar();

        const arquivo = new Blob(
            [JSON.stringify(dados, null, 2)],
            { type: "application/json" }
        );

        const link = document.createElement("a");

        link.href = URL.createObjectURL(arquivo);
        link.download = "backup-cahely-modas.json";

        link.click();

        URL.revokeObjectURL(link.href);
    }
};
