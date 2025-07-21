/// <reference types="cypress" />

describe('Fluxo do Cardápio', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.loginNoCardapio('1', 'Teste','1');
  });

  it('Deve exibir as categorias do cardápio', () => {
    cy.contains('Entradas').should('exist');
    cy.contains('Pratos Principais').should('exist');
    cy.contains('Bebidas').should('exist');
    cy.contains('Sobremesas').should('exist');
  });

  it('Deve adicionar um item ao carrinho', () => {
    cy.adicionarItemAoCarrinho('entradas');
    cy.abrirCarrinho();
    // Se quiser checar itens no carrinho, adapte o seletor conforme o HTML do carrinho
  });

  it('Deve aumentar e diminuir a quantidade de um item no carrinho', () => {
    cy.adicionarItemAoCarrinho('entradas');
    cy.abrirCarrinho();
    cy.get('#aumentar-quantidade').click();
    cy.get('#diminuir-quantidade').click();
  });

  it('Deve remover um item do carrinho', () => {
    cy.adicionarItemAoCarrinho('entradas');
    cy.abrirCarrinho();
    cy.removerPrimeiroItemDoCarrinho();
  });

  it('Deve confirmar o pedido', () => {
    cy.adicionarItemAoCarrinho('entradas');
    cy.abrirCarrinho();
    cy.confirmarPedido();
    cy.on('window:alert', (txt) => {
      expect(txt).to.contain('Pedido confirmado');
    });
  });
});
