
let dados = Database.carregar();

if (!dados) dados = Database.dadosVazios();

function salvarDados() {
    if (!Database.salvar(dados)) {
        alert("Erro ao salvar os dados. Faça um backup.");
        return false;
    }
    return true;
}

function dinheiro(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function hoje() {
    const data = new Date();
    data.setMinutes(data.getMinutes() - data.getTimezoneOffset());
    return data.toISOString().slice(0, 10);
}

function formatarData(data) {
    if (!data) return "-";
    return new Date(data + "T12:00:00").toLocaleDateString("pt-BR");
}

function escapar(texto) {
    return String(texto ?? "").replace(/[&<>"']/g, letra => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[letra]);
}

function mostrarMensagem(texto) {
    const elemento = document.getElementById("mensagem");
    elemento.textContent = texto;
    elemento.style.display = "block";

    clearTimeout(window.mensagemTimer);

    window.mensagemTimer = setTimeout(() => {
        elemento.style.display = "none";
    }, 3000);
}

function nomeFornecedor(id) {
    const fornecedor = dados.fornecedores.find(f => f.id === id);
    return fornecedor ? fornecedor.nome : "Não encontrado";
}

function estoqueDaPeca(peca) {
    const vendidas = dados.vendas
        .filter(v => v.pecaId === peca.id)
        .reduce((total, v) => total + Number(v.quantidade), 0);

    const devolvidas = Number(peca.devolvidas || 0);

    return Math.max(0, Number(peca.quantidade) - vendidas - devolvidas);
}

function custoVendido(fornecedorId) {
    return dados.vendas
        .filter(v => v.fornecedorId === fornecedorId)
        .reduce((total, v) => total + Number(v.quantidade) * Number(v.custo), 0);
}

function totalPago(fornecedorId) {
    return dados.pagamentos
        .filter(p => p.fornecedorId === fornecedorId)
        .reduce((total, p) => total + Number(p.valor), 0);
}

function saldoFornecedor(fornecedorId) {
    return Math.max(0, custoVendido(fornecedorId) - totalPago(fornecedorId));
}

function calcularTotais() {
    const vendas = dados.vendas.reduce((s, v) => s + Number(v.total), 0);

    const custo = dados.vendas.reduce(
        (s, v) => s + Number(v.quantidade) * Number(v.custo), 0
    );

    const pagos = dados.pagamentos.reduce((s, p) => s + Number(p.valor), 0);

    const despesas = dados.despesas.reduce((s, d) => s + Number(d.valor), 0);

    const estoque = dados.pecas.reduce(
        (s, p) => s + estoqueDaPeca(p), 0
    );

    const devido = dados.fornecedores.reduce(
        (s, f) => s + saldoFornecedor(f.id), 0
    );

    return {
        vendas,
        custo,
        pagos,
        despesas,
        estoque,
        devido,
        lucro: vendas - custo,
        saldo: vendas - pagos - despesas
    };
}

/* NAVEGAÇÃO */

document.querySelectorAll(".menu-item").forEach(botao => {
    botao.addEventListener("click", function () {
        const pagina = this.dataset.page;

        document.querySelectorAll(".pagina").forEach(p => {
            p.classList.remove("ativa");
        });

        document.querySelectorAll(".menu-item").forEach(b => {
            b.classList.remove("active");
        });

        document.getElementById(pagina).classList.add("ativa");
        this.classList.add("active");
    });
});

/* BOTÕES DE AÇÃO */

function botoesAcoes(tipo, id) {
    return `
        <button type="button" data-acao="editar" data-tipo="${tipo}" data-id="${id}">Editar</button>
        <button type="button" data-acao="excluir" data-tipo="${tipo}" data-id="${id}">Excluir</button>
    `;
}

/* FORNECEDORES */
/* CADASTRO DE PRODUTOS */

document.getElementById("formProduto").addEventListener("submit", function (e) {
    e.preventDefault();

    const nome = document.getElementById("nomeProduto").value.trim();
    const categoria = document.getElementById("categoriaProduto").value;
    const tamanho = document.getElementById("tamanhoProduto").value.trim();
    const cor = document.getElementById("corProduto").value.trim();
    const preco = Number(document.getElementById("precoProduto").value);

    if (!nome || !categoria || preco <= 0) {
        alert("Preencha o nome, a categoria e um preço válido.");
        return;
    }

    dados.produtos.push({
        id: Database.gerarId(),
        nome,
        categoria,
        tamanho,
        cor,
        preco
    });

    if (!salvarDados()) return;

    this.reset();
    listarProdutos();
    mostrarMensagem("Produto cadastrado com sucesso!");
});

function listarProdutos() {
    const lista = document.getElementById("listaProdutos");

    lista.innerHTML = dados.produtos.map(p => `
        <tr>
            <td>${escapar(p.nome)}</td>
            <td>${escapar(p.categoria)}</td>
            <td>${escapar(p.tamanho || "-")}</td>
            <td>${escapar(p.cor || "-")}</td>
            <td>${dinheiro(p.preco)}</td>
            <td>${botoesAcoes("produto", p.id)}</td>
        </tr>
    `).join("");
}

document.getElementById("formFornecedor").addEventListener("submit", function (e) {
    e.preventDefault();

    const nome = document.getElementById("nomeFornecedor").value.trim();

    if (!nome) return;

    dados.fornecedores.push({
        id: Database.gerarId(),
        nome,
        telefone: document.getElementById("telefoneFornecedor").value.trim(),
        obs: document.getElementById("obsFornecedor").value.trim()
    });

    if (!salvarDados()) return;

    this.reset();
    atualizarSistema();
    mostrarMensagem("Fornecedor cadastrado com sucesso!");
});

function listarFornecedores() {
    const lista = document.getElementById("listaFornecedores");

    lista.innerHTML = dados.fornecedores.map(f => `
        <tr>
            <td>${escapar(f.nome)}</td>
            <td>${escapar(f.telefone)}</td>
            <td>${escapar(f.obs)}</td>
            <td>${botoesAcoes("fornecedor", f.id)}</td>
        </tr>
    `).join("");

    const opcoes = dados.fornecedores.map(f => `
        <option value="${f.id}">${escapar(f.nome)}</option>
    `).join("");

    document.getElementById("fornecedorEntrada").innerHTML =
        '<option value="">Selecione</option>' + opcoes;

    document.getElementById("fornecedorAcerto").innerHTML =
        '<option value="">Selecione</option>' + opcoes;
}

/* ENTRADA DE ROUPAS */

document.getElementById("formEntrada").addEventListener("submit", function (e) {
    e.preventDefault();

    const fornecedorId = document.getElementById("fornecedorEntrada").value;
    const produto = document.getElementById("produtoEntrada").value.trim();
    const quantidade = Number(document.getElementById("quantidadeEntrada").value);
    const custo = Number(document.getElementById("custoEntrada").value);
    const preco = Number(document.getElementById("precoEntrada").value);

    if (!fornecedorId || !produto || quantidade <= 0 || custo <= 0 || preco <= 0) {
        alert("Confira os dados informados.");
        return;
    }

    dados.pecas.push({
        id: Database.gerarId(),
        fornecedorId,
        produto,
        quantidade,
        custo,
        preco,
        devolvidas: 0,
        data: hoje()
    });

    if (!salvarDados()) return;

    this.reset();
    atualizarSistema();
    mostrarMensagem("Entrada de roupas registrada!");
});

function listarEstoque() {
    const lista = document.getElementById("listaEstoque");

    lista.innerHTML = dados.pecas.map(p => {
        const vendidas = Number(p.quantidade) -
            estoqueDaPeca(p) - Number(p.devolvidas || 0);

        return `
            <tr>
                <td>${escapar(nomeFornecedor(p.fornecedorId))}</td>
                <td>${escapar(p.produto)}</td>
                <td>${p.quantidade}</td>
                <td>${vendidas}</td>
                <td><strong>${estoqueDaPeca(p)}</strong></td>
                <td>${dinheiro(p.custo)}</td>
                <td>${dinheiro(p.preco)}</td>
                <td>${botoesAcoes("peca", p.id)}</td>
            </tr>
        `;
    }).join("");
}

/* VENDAS */

function atualizarProdutosVenda() {
    const select = document.getElementById("produtoVenda");

    const disponiveis = dados.pecas.filter(p => estoqueDaPeca(p) > 0);

    select.innerHTML = '<option value="">Selecione um produto</option>' +
        disponiveis.map(p => `
            <option value="${p.id}">
                ${escapar(p.produto)} - ${escapar(nomeFornecedor(p.fornecedorId))}
                (${estoqueDaPeca(p)} disponíveis)
            </option>
        `).join("");
}

document.getElementById("formVenda").addEventListener("submit", function (e) {
    e.preventDefault();

    const pecaId = document.getElementById("produtoVenda").value;
    const quantidade = Number(document.getElementById("quantidadeVenda").value);
    const pagamento = document.getElementById("pagamentoVenda").value;

    const peca = dados.pecas.find(p => p.id === pecaId);

    if (!peca || quantidade <= 0 || quantidade > estoqueDaPeca(peca)) {
        alert("Quantidade indisponível no estoque.");
        return;
    }

    if (!pagamento) {
        alert("Selecione a forma de pagamento.");
        return;
    }

    dados.vendas.push({
        id: Database.gerarId(),
        pecaId,
        fornecedorId: peca.fornecedorId,
        produto: peca.produto,
        quantidade,
        custo: peca.custo,
        preco: peca.preco,
        total: quantidade * peca.preco,
        pagamento,
        data: hoje()
    });

    if (!salvarDados()) return;

    this.reset();
    atualizarSistema();
    mostrarMensagem("Venda registrada com sucesso!");
});

function listarVendas() {
    const lista = document.getElementById("listaVendas");

    lista.innerHTML = [...dados.vendas].reverse().map(v => `
        <tr>
            <td>${formatarData(v.data)}</td>
            <td>${escapar(v.produto)}</td>
            <td>${escapar(nomeFornecedor(v.fornecedorId))}</td>
            <td>${v.quantidade}</td>
            <td>${dinheiro(v.total)}</td>
            <td>${escapar(v.pagamento)}</td>
            <td>${botoesAcoes("venda", v.id)}</td>
        </tr>
    `).join("");
}

/* ACERTOS E PAGAMENTOS */

document.getElementById("formAcerto").addEventListener("submit", function (e) {
    e.preventDefault();

    const fornecedorId = document.getElementById("fornecedorAcerto").value;
    const valor = Number(document.getElementById("valorAcerto").value);

    if (!fornecedorId || valor <= 0) {
        alert("Informe o fornecedor e um valor válido.");
        return;
    }

    const saldo = saldoFornecedor(fornecedorId);

    if (valor > saldo) {
        alert("O pagamento não pode superar o saldo devido: " + dinheiro(saldo));
        return;
    }

    dados.pagamentos.push({
        id: Database.gerarId(),
        fornecedorId,
        valor,
        data: document.getElementById("dataAcerto").value,
        obs: document.getElementById("obsAcerto").value.trim()
    });

    if (!salvarDados()) return;

    this.reset();
    document.getElementById("dataAcerto").value = hoje();

    atualizarSistema();
    mostrarMensagem("Pagamento registrado!");
});

function listarAcertos() {
    const lista = document.getElementById("resumoAcertos");

    lista.innerHTML = dados.fornecedores.map(f => `
        <tr>
            <td>${escapar(f.nome)}</td>
            <td>${dinheiro(custoVendido(f.id))}</td>
            <td>${dinheiro(totalPago(f.id))}</td>
            <td>${dinheiro(saldoFornecedor(f.id))}</td>
        </tr>
    `).join("");

    const historico = document.getElementById("listaPagamentos");

    historico.innerHTML = [...dados.pagamentos].reverse().map(p => `
        <tr>
            <td>${formatarData(p.data)}</td>
            <td>${escapar(nomeFornecedor(p.fornecedorId))}</td>
            <td>${dinheiro(p.valor)}</td>
            <td>${escapar(p.obs)}</td>
            <td>${botoesAcoes("pagamento", p.id)}</td>
        </tr>
    `).join("");
}

/* DESPESAS */

document.getElementById("formDespesa").addEventListener("submit", function (e) {
    e.preventDefault();

    const valor = Number(document.getElementById("valorDespesa").value);

    if (valor <= 0) {
        alert("Informe um valor válido.");
        return;
    }

    dados.despesas.push({
        id: Database.gerarId(),
        descricao: document.getElementById("descricaoDespesa").value.trim(),
        categoria: document.getElementById("categoriaDespesa").value,
        valor,
        data: document.getElementById("dataDespesa").value
    });

    if (!salvarDados()) return;

    this.reset();
    document.getElementById("dataDespesa").value = hoje();

    atualizarSistema();
    mostrarMensagem("Despesa registrada!");
});

function listarDespesas() {
    document.getElementById("listaDespesas").innerHTML =
        dados.despesas.map(d => `
            <tr>
                <td>${formatarData(d.data)}</td>
                <td>${escapar(d.descricao)}</td>
                <td>${escapar(d.categoria)}</td>
                <td>${dinheiro(d.valor)}</td>
                <td>${botoesAcoes("despesa", d.id)}</td>
            </tr>
        `).join("");
}
function editarProduto(id) {
    const p = dados.produtos.find(item => item.id === id);
    if (!p) return;

    const nome = prompt("Nome do produto:", p.nome);
    if (nome === null) return;

    if (!nome.trim()) {
        alert("O nome não pode ficar vazio.");
        return;
    }

    const categoria = prompt("Categoria:", p.categoria);
    if (categoria === null) return;

    const tamanho = prompt("Tamanho:", p.tamanho || "");
    if (tamanho === null) return;

    const cor = prompt("Cor:", p.cor || "");
    if (cor === null) return;

    const preco = Number(prompt("Preço de venda (R$):", p.preco));

    if (!Number.isFinite(preco) || preco <= 0) {
        alert("Informe um preço válido.");
        return;
    }

    p.nome = nome.trim();
    p.categoria = categoria.trim();
    p.tamanho = tamanho.trim();
    p.cor = cor.trim();
    p.preco = preco;

    if (!salvarDados()) return;

    atualizarSistema();
    mostrarMensagem("Produto atualizado!");
}

function excluirProduto(id) {
    const p = dados.produtos.find(item => item.id === id);
    if (!p) return;

    if (!confirm("Deseja realmente excluir este produto do cadastro?")) return;

    dados.produtos = dados.produtos.filter(item => item.id !== id);

    if (!salvarDados()) return;

    atualizarSistema();
    mostrarMensagem("Produto excluído!");
}

/* EDIÇÃO E EXCLUSÃO */

function editarFornecedor(id) {
    const f = dados.fornecedores.find(item => item.id === id);
    if (!f) return;

    const nome = prompt("Nome do fornecedor:", f.nome);
    if (nome === null) return;
    if (!nome.trim()) {
        alert("O nome não pode ficar vazio.");
        return;
    }

    const telefone = prompt("Telefone:", f.telefone || "");
    if (telefone === null) return;

    const obs = prompt("Observações:", f.obs || "");
    if (obs === null) return;

    f.nome = nome.trim();
    f.telefone = telefone.trim();
    f.obs = obs.trim();

    if (!salvarDados()) return;

    atualizarSistema();
    mostrarMensagem("Fornecedor atualizado!");
}

function excluirFornecedor(id) {
    const possuiPecas = dados.pecas.some(p => p.fornecedorId === id);
    const possuiVendas = dados.vendas.some(v => v.fornecedorId === id);
    const possuiPagamentos = dados.pagamentos.some(p => p.fornecedorId === id);

    if (possuiPecas || possuiVendas || possuiPagamentos) {
        alert("Este fornecedor possui movimentações registradas. Não é possível excluí-lo.");
        return;
    }

    if (!confirm("Deseja realmente excluir este fornecedor?")) return;

    dados.fornecedores = dados.fornecedores.filter(f => f.id !== id);

    if (!salvarDados()) return;

    atualizarSistema();
    mostrarMensagem("Fornecedor excluído!");
}

function editarPeca(id) {
    const p = dados.pecas.find(item => item.id === id);
    if (!p) return;

    const nome = prompt("Nome do produto:", p.produto);
    if (nome === null) return;
    if (!nome.trim()) {
        alert("O nome do produto não pode ficar vazio.");
        return;
    }

    const quantidade = Number(prompt("Quantidade recebida:", p.quantidade));
    if (!Number.isInteger(quantidade) || quantidade <= 0) {
        alert("Informe uma quantidade inteira válida.");
        return;
    }

    const vendidas = dados.vendas
        .filter(v => v.pecaId === id)
        .reduce((total, v) => total + Number(v.quantidade), 0);

    const devolvidas = Number(p.devolvidas || 0);

    if (quantidade < vendidas + devolvidas) {
        alert("A quantidade recebida não pode ser menor que a quantidade já vendida e devolvida.");
        return;
    }

    const custo = Number(prompt("Custo por peça (R$):", p.custo));
    if (!Number.isFinite(custo) || custo <= 0) {
        alert("Informe um custo válido.");
        return;
    }

    const preco = Number(prompt("Preço de venda por peça (R$):", p.preco));
    if (!Number.isFinite(preco) || preco <= 0) {
        alert("Informe um preço válido.");
        return;
    }

    p.produto = nome.trim();
    p.quantidade = quantidade;
    p.custo = custo;
    p.preco = preco;

    if (!salvarDados()) return;

    atualizarSistema();
    mostrarMensagem("Entrada atualizada!");
}

function excluirPeca(id) {
    const possuiVendas = dados.vendas.some(v => v.pecaId === id);

    if (possuiVendas) {
        alert("Este produto possui vendas no histórico. Não é possível excluí-lo.");
        return;
    }

    if (!confirm("Deseja realmente excluir esta entrada de estoque?")) return;

    dados.pecas = dados.pecas.filter(p => p.id !== id);

    if (!salvarDados()) return;

    atualizarSistema();
    mostrarMensagem("Entrada excluída!");
}

function totalPagoDepoisDaAlteracao(fornecedorId, pagamentoIgnorado = null) {
    return dados.pagamentos
        .filter(p => p.fornecedorId === fornecedorId && p.id !== pagamentoIgnorado)
        .reduce((total, p) => total + Number(p.valor), 0);
}

function custoVendidoDepoisDaAlteracao(fornecedorId, vendaIgnorada = null, novaVenda = null) {
    let total = dados.vendas
        .filter(v => v.fornecedorId === fornecedorId && v.id !== vendaIgnorada)
        .reduce((soma, v) => soma + Number(v.quantidade) * Number(v.custo), 0);

    if (novaVenda) {
        total += Number(novaVenda.quantidade) * Number(novaVenda.custo);
    }

    return total;
}

function editarVenda(id) {
    const v = dados.vendas.find(item => item.id === id);
    if (!v) return;

    const peca = dados.pecas.find(p => p.id === v.pecaId);

    if (!peca) {
        alert("Não foi possível localizar o produto desta venda.");
        return;
    }

    const quantidadeDisponivel = estoqueDaPeca(peca) + Number(v.quantidade);

    const quantidade = Number(prompt(
        "Quantidade vendida:",
        v.quantidade
    ));

    if (!Number.isInteger(quantidade) || quantidade <= 0 || quantidade > quantidadeDisponivel) {
        alert("Quantidade inválida. Disponível para esta alteração: " + quantidadeDisponivel);
        return;
    }

    const formas = [
        "Pix",
        "Dinheiro",
        "Cartão de débito",
        "Cartão de crédito",
        "Transferência"
    ];

    const pagamento = prompt(
        "Forma de pagamento:\n" + formas.join("\n"),
        v.pagamento
    );

    if (pagamento === null) return;

    if (!formas.includes(pagamento)) {
        alert("Forma de pagamento inválida.");
        return;
    }

    const custoTotalNovo = custoVendidoDepoisDaAlteracao(
        v.fornecedorId,
        v.id,
        {
            quantidade,
            custo: v.custo
        }
    );

    if (totalPago(v.fornecedorId) > custoTotalNovo) {
        alert("Não é possível alterar esta venda porque os pagamentos já realizados superariam o novo custo vendido ao fornecedor.");
        return;
    }

    v.quantidade = quantidade;
    v.pagamento = pagamento;
    v.total = quantidade * Number(v.preco);

    if (!salvarDados()) return;

    atualizarSistema();
    mostrarMensagem("Venda atualizada!");
}

function excluirVenda(id) {
    const v = dados.vendas.find(item => item.id === id);
    if (!v) return;

    const custoRestante = custoVendidoDepoisDaAlteracao(
        v.fornecedorId,
        v.id
    );

    if (totalPago(v.fornecedorId) > custoRestante) {
        alert("Não é possível excluir esta venda porque os pagamentos já realizados superariam o custo restante do fornecedor.");
        return;
    }

    if (!confirm("Deseja realmente excluir esta venda? O estoque será atualizado automaticamente.")) {
        return;
    }

    dados.vendas = dados.vendas.filter(item => item.id !== id);

    if (!salvarDados()) return;

    atualizarSistema();
    mostrarMensagem("Venda excluída e estoque atualizado!");
}

function editarPagamento(id) {
    const p = dados.pagamentos.find(item => item.id === id);
    if (!p) return;

    const data = prompt("Data do pagamento (AAAA-MM-DD):", p.data);
    if (data === null) return;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
        alert("Informe a data no formato AAAA-MM-DD.");
        return;
    }

    const valor = Number(prompt("Valor pago (R$):", p.valor));
    if (!Number.isFinite(valor) || valor <= 0) {
        alert("Informe um valor válido.");
        return;
    }

    const outrosPagamentos = totalPagoDepoisDaAlteracao(p.fornecedorId, p.id);
    const custo = custoVendido(p.fornecedorId);

    if (outrosPagamentos + valor > custo) {
        alert("O total pago não pode superar o custo vendido ao fornecedor: " + dinheiro(custo));
        return;
    }

    const obs = prompt("Observação:", p.obs || "");
    if (obs === null) return;

    p.data = data;
    p.valor = valor;
    p.obs = obs.trim();

    if (!salvarDados()) return;

    atualizarSistema();
    mostrarMensagem("Pagamento atualizado!");
}

function excluirPagamento(id) {
    const p = dados.pagamentos.find(item => item.id === id);
    if (!p) return;

    if (!confirm("Deseja realmente excluir este pagamento?")) return;

    dados.pagamentos = dados.pagamentos.filter(item => item.id !== id);

    if (!salvarDados()) return;

    atualizarSistema();
    mostrarMensagem("Pagamento excluído!");
}

function editarDespesa(id) {
    const d = dados.despesas.find(item => item.id === id);
    if (!d) return;

    const descricao = prompt("Descrição:", d.descricao);
    if (descricao === null) return;
    if (!descricao.trim()) {
        alert("A descrição não pode ficar vazia.");
        return;
    }

    const categorias = [
        "Embalagens",
        "Aluguel",
        "Transporte",
        "Contas",
        "Marketing",
        "Outros"
    ];

    const categoria = prompt(
        "Categoria:\n" + categorias.join("\n"),
        d.categoria
    );

    if (categoria === null) return;

    if (!categorias.includes(categoria)) {
        alert("Categoria inválida.");
        return;
    }

    const valor = Number(prompt("Valor (R$):", d.valor));
    if (!Number.isFinite(valor) || valor <= 0) {
        alert("Informe um valor válido.");
        return;
    }

    const data = prompt("Data (AAAA-MM-DD):", d.data);
    if (data === null) return;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
        alert("Informe a data no formato AAAA-MM-DD.");
        return;
    }

    d.descricao = descricao.trim();
    d.categoria = categoria;
    d.valor = valor;
    d.data = data;

    if (!salvarDados()) return;

    atualizarSistema();
    mostrarMensagem("Despesa atualizada!");
}

function excluirDespesa(id) {
    if (!confirm("Deseja realmente excluir esta despesa?")) return;

    dados.despesas = dados.despesas.filter(d => d.id !== id);

    if (!salvarDados()) return;

    atualizarSistema();
    mostrarMensagem("Despesa excluída!");
}

/* CLIQUES NAS AÇÕES DAS TABELAS */

document.addEventListener("click", function (e) {
    const botao = e.target.closest("button[data-acao]");
    if (!botao) return;

    const acao = botao.dataset.acao;
    const tipo = botao.dataset.tipo;
    const id = botao.dataset.id;

    if (!id) return;

    const funcoes = {produto: {
    editar: editarProduto,
    excluir: excluirProduto
    
},
        fornecedor: {
            editar: editarFornecedor,
            excluir: excluirFornecedor
        },
        peca: {
            editar: editarPeca,
            excluir: excluirPeca
        },
        venda: {
            editar: editarVenda,
            excluir: excluirVenda
        },
        pagamento: {
            editar: editarPagamento,
            excluir: excluirPagamento
        },
        despesa: {
            editar: editarDespesa,
            excluir: excluirDespesa
        }
    };

    if (funcoes[tipo] && funcoes[tipo][acao]) {
        funcoes[tipo][acao](id);
    }
});

/* DASHBOARD E FINANCEIRO */

function atualizarIndicadores() {
    const t = calcularTotais();

    document.getElementById("totalVendido").textContent = dinheiro(t.vendas);
    document.getElementById("totalEstoque").textContent = t.estoque;
    document.getElementById("totalFornecedores").textContent = dados.fornecedores.length;
    document.getElementById("totalDevido").textContent = dinheiro(t.devido);
    document.getElementById("lucroBruto").textContent = dinheiro(t.lucro);
    document.getElementById("saldoFinanceiro").textContent = dinheiro(t.saldo);

    document.getElementById("financeiroEntradas").textContent = dinheiro(t.vendas);
    document.getElementById("financeiroPagamentos").textContent = dinheiro(t.pagos);
    document.getElementById("financeiroDespesas").textContent = dinheiro(t.despesas);
    document.getElementById("financeiroSaldo").textContent = dinheiro(t.saldo);

    document.getElementById("resumoRelatorio").innerHTML = `
        <p>Total vendido: <strong>${dinheiro(t.vendas)}</strong></p>
        <p>Custo das peças vendidas: <strong>${dinheiro(t.custo)}</strong></p>
        <p>Lucro bruto: <strong>${dinheiro(t.lucro)}</strong></p>
        <p>Pagamentos a fornecedores: <strong>${dinheiro(t.pagos)}</strong></p>
        <p>Saldo devido: <strong>${dinheiro(t.devido)}</strong></p>
        <p>Despesas da loja: <strong>${dinheiro(t.despesas)}</strong></p>
        <p>Saldo financeiro: <strong>${dinheiro(t.saldo)}</strong></p>
    `;
}

/* BACKUP */

document.getElementById("btnBackup").addEventListener("click", function () {
    Database.exportarBackup();
    mostrarMensagem("Backup exportado!");
});

document.getElementById("btnExportarCSV").addEventListener("click", function () {
    const linhas = [
        ["Data", "Produto", "Fornecedor", "Quantidade", "Total", "Pagamento"],
        ...dados.vendas.map(v => [
            v.data,
            v.produto,
            nomeFornecedor(v.fornecedorId),
            v.quantidade,
            v.total,
            v.pagamento
        ])
    ];

    const csv = linhas.map(l => l.join(";")).join("\n");

    const arquivo = new Blob(["\ufeff" + csv], {
        type: "text/csv;charset=utf-8;"
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(arquivo);
    link.download = "relatorio-cahely-modas.csv";
    link.click();

    URL.revokeObjectURL(link.href);
});

/* ATUALIZAÇÃO GERAL */

function atualizarSistema() {
    listarProdutos();
    listarFornecedores();
    listarEstoque();
    atualizarProdutosVenda();
    listarVendas();
    listarAcertos();
    listarDespesas();
    atualizarIndicadores();
}

/* DATAS INICIAIS */

document.getElementById("dataAcerto").value = hoje();
document.getElementById("dataDespesa").value = hoje();

atualizarSistema();
