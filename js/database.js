
const Database = {
    STORAGE_KEY: "cahelyModasDB",

    dadosVazios() {
        return {
            fornecedores: [],
            produtos: [],
            pecas: [],
            vendas: [],
            pagamentos: [],
            despesas: []
        };
    },

    carregar() {
        try {
            const armazenado = localStorage.getItem(this.STORAGE_KEY);

            if (!armazenado) {
                return this.dadosVazios();
            }

            const dados = JSON.parse(armazenado);

            return {
                fornecedores: Array.isArray(dados.fornecedores) ? dados.fornecedores : [],
                produtos: Array.isArray(dados.produtos) ? dados.produtos : [],
                pecas: Array.isArray(dados.pecas) ? dados.pecas : [],
                vendas: Array.isArray(dados.vendas) ? dados.vendas : [],
                pagamentos: Array.isArray(dados.pagamentos) ? dados.pagamentos : [],
                despesas: Array.isArray(dados.despesas) ? dados.despesas : []
            };

        } catch (erro) {
            console.error("Erro ao carregar dados:", erro);
            alert("Não foi possível carregar os dados.");
            return this.dadosVazios();
        }
    },

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

    gerarId() {
        return Date.now().toString(36) +
            Math.random().toString(36).substring(2, 9);
    },

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
