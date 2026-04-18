# ⛪ Paróquia Sagrada Família - Escala de Coroinhas e Acólitos

Sistema de coordenação e auto-escala desenvolvido para a **Paróquia Sagrada Família**, sob a coordenação de **Luiggi Barudi**. Este aplicativo permite que coroinhas e acólitos se programem para as missas do final de semana de forma ágil e centralizada.

---

## ✨ Funcionalidades

### 👦 Interface do Servidor (Coroinha/Acólito)
- **Seleção de Cargo:** Filtra automaticamente a lista de nomes entre Coroinhas e Acólitos.
- **Auto-Escala:** O servidor seleciona todas as missas que pode comparecer no final de semana atual.
- **Datas Inteligentes:** O sistema identifica automaticamente o próximo sábado e domingo, exibindo o dia e mês específicos em cada opção.

### 📋 Interface do Coordenador (Luiggi)
- **Dashboard Consolidado:** Visão clara de todos os inscritos por horário de missa.
- **Abas por Horário:** Navegação rápida entre as missas de Sábado (17h) e Domingo (09h, 11h, 18h).
- **Check-in de Presença:** Botão de confirmação em tempo real para marcar quem efetivamente serviu na missa.
- **Identificação Visual:** Badges coloridos que diferenciam Coroinhas (Azul) de Acólitos (Dourado) na lista.

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
