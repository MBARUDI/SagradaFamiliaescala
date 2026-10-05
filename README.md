# ⛪ Paróquia Sagrada Família - Escala de Coroinhas e Acólitos

Sistema de coordenação e auto-escala desenvolvido para a **Paróquia Sagrada Família**, sob a coordenação de **Luiggi Barudi**. Este aplicativo permite que coroinhas e acólitos se programem para as missas do mês completo de forma ágil, visual e centralizada.

---

## ✨ Funcionalidades

### 👦 Interface do Servidor (Coroinha/Acólito)
- **Seleção de Cargo e Nome:** Filtra automaticamente a lista de nomes entre Coroinhas (incluindo o coroinha Davi) e Acólitos.
- **Escala Mensal Completa:** Visualização de todos os fins de semana do mês com navegação entre meses (Mês Anterior / Próximo Mês).
- **Alteração e Desmarcação de Ticks:** Ao selecionar o nome, as marcações já salvas são carregadas na tela com o tick (✓). O usuário pode marcar novos dias ou desmarcar (desfazer o tick) qualquer dia que não puder mais comparecer.
- **Ações Rápidas de Marcação:** Botões para desmarcar todos os ticks ou marcar todos os sábados/domingos com um único clique.
- **Agenda Geral Interativa:** Tabela pública com filtros por final de semana, coluna fixa do nome e botão rápido para carregar e editar os ticks.

### 📋 Interface do Coordenador (Luiggi)
- **Dashboard Consolidado Mensal:** Visão clara de todos os inscritos organizados por missa e fim de semana.
- **Chamada por Horário:** Navegação entre as missas de Sábado (17h) e Domingo (09h, 11h, 18h30) com confirmação de presença em tempo real.
- **Relatórios em PDF e Excel:** Exportação completa da escala mensal.

---

## 🚀 Como Executar

O projeto foi construído utilizando tecnologias Web puras (Vanilla JS), o que o torna extremamente leve e fácil de rodar.

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/MBARUDI/SagradaFamiliaescala.git
    ```
2.  **Abra o arquivo:**
    Basta abrir o arquivo `index.html` em qualquer navegador moderno.
3.  **Servidor Local (Opcional):**
    Para uma experiência melhor, você pode usar uma extensão como o *Live Server* do VS Code ou rodar via terminal:
    ```bash
    npx http-server ./
    ```

---

## 🛠️ Tecnologias Utilizadas

- **HTML5:** Estrutura semântica dos dados.
- **CSS3:** Design premium com *Glassmorphism*, Dark Mode e layout responsivo.
- **JavaScript (ES6+):** Lógica de cálculo de datas, filtragem dinâmica e persistência de dados (LocalStorage).

---

## 📅 Horários de Escala Fixos
- **Sábado:** 17h
- **Domingo:** 09h, 11h e 18h

---

## 👤 Coordenação
**Luiggi Barudi**  
*Paróquia Sagrada Família*

---
*Desenvolvido com foco na agilidade e no serviço litúrgico.*
