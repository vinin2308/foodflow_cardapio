// Comando para preencher dados cadastrais e iniciar pedido
Cypress.Commands.add('loginNoCardapio', (mesa = '1', nome = 'Teste', pessoas = '1') => {
  cy.get('#mesa').clear().type(mesa);
  cy.get('#nome').clear().type(nome);
  cy.get('#numeroPessoas').clear().type(pessoas);
    cy.get('#iniciar-pedido').click();
    });

// Tipagem global para comandos customizados
export {};
declare global {
  namespace Cypress {
    interface Chainable {
      adicionarItemAoCarrinho(categoria: string, itemIndex?: number): Chainable<any>;
      abrirCarrinho(): Chainable<any>;
      removerPrimeiroItemDoCarrinho(): Chainable<any>;
      confirmarPedido(): Chainable<any>;
      loginNoCardapio(mesa?: string, nome?: string, pessoas?: string): Chainable<any>;
    }
  }
}

Cypress.Commands.add('adicionarItemAoCarrinho', (categoria, itemIndex = 0) => {
  cy.get(`#categoria-${categoria}`).click();
  cy.get('#adicionar-item').eq(itemIndex).click();
});


Cypress.Commands.add('abrirCarrinho', () => {
  cy.get('#abrir-carrinho').click();
});


Cypress.Commands.add('removerPrimeiroItemDoCarrinho', () => {
  cy.get('#remover-item').first().click();
  cy.on('window:confirm', () => true);
});


Cypress.Commands.add('confirmarPedido', () => {
  cy.get('#confirmar-pedido').click();
  cy.on('window:confirm', () => true);
});
