// ==UserScript==
// @name         Auto Execute Telegram Tracer
// @namespace    http://tampermonkey.net/
// @version      1.8
// @description  Trigger search on Enter, show modal with pasteable QLs, and execute each with delay
// @match        https://portal.logistics.zalan.do/tab/overview/*
// @match        https://portal.logistics.zalan.do/tab/queries/*
// @match        https://portal.logistics.zalan.do/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    let isExecuting = false; // Flag to control execution flow

    function isSecondTabActive() {
        const tabs = document.querySelectorAll('.v-tab');
        return tabs.length >= 2 && tabs[1].classList.contains('v-tab--active');
    }

    function setupSearchTrigger() {
        const searchInput = document.getElementById('search');
        const executeButton = document.getElementById('executeButton');
        if (!searchInput || !executeButton) return;

        if (searchInput.dataset.tmListenerAdded) return;
        searchInput.dataset.tmListenerAdded = "true";

        searchInput.addEventListener('keydown', function (event) {
            if (event.key === 'Enter' && searchInput.value.trim() !== '') {
                if (isSecondTabActive()) {
                    event.preventDefault();
                    executeButton.click();
                }
            }
        });
    }

    function createModal() {
        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'tm-modal-overlay';
        modalOverlay.style.fontFamily = 'Roboto, sans-serif';
        modalOverlay.style.position = 'fixed';
        modalOverlay.style.top = 0;
        modalOverlay.style.left = 0;
        modalOverlay.style.width = '100%';
        modalOverlay.style.height = '100%';
        modalOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
        modalOverlay.style.zIndex = 9999;

        const modal = document.createElement('div');
        modal.id = 'tm-custom-modal';
        modal.style.fontFamily = 'Roboto, sans-serif';
        modal.style.position = 'fixed';
        modal.style.top = '50%';
        modal.style.left = '50%';
        modal.style.transform = 'translate(-50%, -50%)';
        modal.style.backgroundColor = 'white';
        modal.style.padding = '20px';
        modal.style.borderRadius = '8px';
        modal.style.minWidth = '320px';
        modal.style.width = '640px';
        modal.style.maxHeight = '80%';
        modal.style.overflowY = 'auto';
        modal.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
        modal.style.position = 'relative';

        const closeBtn = document.createElement('span');
        closeBtn.textContent = '✖';
        closeBtn.style.position = 'absolute';
        closeBtn.style.top = '10px';
        closeBtn.style.right = '15px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.fontSize = '16px';
        closeBtn.style.color = '#888';
        closeBtn.addEventListener('click', () => {
            isExecuting = false; // Stop execution when modal is closed
            document.body.removeChild(modalOverlay);
        });


        const table = document.createElement('table');
        table.id = 'tm-ql-table';
        table.style.cssText = `
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        `;

        // Function to create a row for each QL
        function createRow(index) {
            const row = document.createElement('tr');
            row.style.background = index % 2 === 0 ? '#f9f9f9' : '#ffffff';

            const cell1 = document.createElement('td');
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = 'Quality Label';
            input.style.width = '100%';
            cell1.appendChild(input);

            const cell2 = document.createElement('td');
            cell2.textContent = '';

            cell1.style.cssText = `
                padding: 8px;
                border: 1px solid #ddd;
                text-align: left;
                width: 300px;
                word-break: break-word;
                background-color: #ffffff;
            `;

            cell2.style.cssText = `
                padding: 8px;
                border: 1px solid #ddd;
                text-align: left;
                width: 300px;
                word-break: break-word;
                background-color: #f0f8ff;
            `;

            row.appendChild(cell1);
            row.appendChild(cell2);
            table.appendChild(row);
        }

        // Create initial 1 row to start with
        createRow(0);

        const executeAllBtn = document.createElement('button');
        executeAllBtn.textContent = 'Execute All';
        executeAllBtn.className = 'v-btn theme--dark v-size--default';
        executeAllBtn.style.cssText = `
            margin-left: 0px;
            background-color: #4CAF50;
            color: white;
            border-radius: 4px;
            padding: 6px 12px;
            cursor: pointer;
        `;
        executeAllBtn.addEventListener('click', async () => {
            if (isExecuting) return; // Don't execute if already running
            isExecuting = true;
            const searchInput = document.getElementById('search');
            const executeButton = document.getElementById('executeButton');
            const rows = table.querySelectorAll('tr');

            for (let row of rows) {
                const inputField = row.cells[0].querySelector('input');
                const ql = inputField.value.trim();
                const outputCell = row.cells[1];

                if (ql !== '') {
                    inputField.focus();
                    searchInput.focus();
                    searchInput.value = '';
                    searchInput.dispatchEvent(new Event('input', { bubbles: true }));

                    searchInput.value = ql;
                    searchInput.dispatchEvent(new Event('input', { bubbles: true }));

                    executeButton.click();
                    await new Promise(res => setTimeout(res, 500));

                    const resultTable = document.querySelector('.v-data-table__wrapper');
                    const resultRow = resultTable?.querySelector('tr');
                    const td = resultRow?.querySelectorAll('td')[4];
                    outputCell.textContent = td ? td.textContent.trim() : 'Not found';
                }
                if (!isExecuting) break; // Exit loop if stopped
            }
            isExecuting = false;
        });

        const stopBtn = document.createElement('button');
        stopBtn.textContent = 'Stop';
        stopBtn.className = 'v-btn theme--dark v-size--default';
        stopBtn.style.cssText = `
            margin-left: 0px;
            background-color: #f44336;
            color: white;
            border-radius: 4px;
            padding: 6px 12px;
            cursor: pointer;
        `;
        stopBtn.addEventListener('click', () => {
            isExecuting = false; // Stop the execution
        });

        const copyValuesBtn = document.createElement('button');
        copyValuesBtn.textContent = 'Copy Values';
        copyValuesBtn.className = 'v-btn theme--dark v-size--default';
        copyValuesBtn.style.cssText = `
            margin-left: 0px;
            background-color: #FFC107;
            color: white;
            border-radius: 4px;
            padding: 6px 12px;
            cursor: pointer;
        `;
        copyValuesBtn.addEventListener('click', () => {
            const rows = table.querySelectorAll('tr');
            let copiedText = '';
            rows.forEach(row => {
                const inputField = row.cells[0].querySelector('input');
                const outputCell = row.cells[1];
                copiedText += `${inputField.value}\t${outputCell.textContent}\n`;
            });
            // Copy to clipboard
            navigator.clipboard.writeText(copiedText).then(() => {
                alert('Copied to clipboard!');
            });
        });

        // Handle paste event for adding multiple rows
        const inputFieldForPaste = document.createElement('textarea');
        inputFieldForPaste.placeholder = 'Paste QLs here...';
        inputFieldForPaste.style.width = '100%';
        inputFieldForPaste.style.height = '80px';
        inputFieldForPaste.style.resize = 'none'; // Disable resizing
        inputFieldForPaste.style.marginTop = '10px';
        inputFieldForPaste.addEventListener('paste', (e) => {
            e.preventDefault();
            const text = (e.clipboardData || window.clipboardData).getData('text');
            const lines = text.split(/\r?\n/);

            // Remove existing rows and create new ones based on the pasted content
            table.innerHTML = '';
            lines.forEach((line, index) => {
                createRow(index); // Create row for each pasted QL
                table.rows[index].cells[0].querySelector('input').value = line.trim();
            });
        });

        // Create container for the buttons and add them to the modal
        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.justifyContent = 'space-between';
        buttonContainer.style.marginBottom = '10px';

        buttonContainer.appendChild(executeAllBtn);
        buttonContainer.appendChild(stopBtn);
        buttonContainer.appendChild(copyValuesBtn);

        modal.appendChild(closeBtn);
        modal.appendChild(inputFieldForPaste); // Paste area for multiple QLs
        modal.appendChild(buttonContainer); // Add buttons at the top
        modal.appendChild(table);
        modalOverlay.appendChild(modal);
        document.body.appendChild(modalOverlay);

        return modal;
    }

    function addModalButton() {
        const existingButton = document.querySelector('.v-btn.v-btn--icon.v-btn--round.theme--dark.v-size--default');
        if (!existingButton || document.getElementById('tm-modal-trigger')) return;

        const newBtnWrapper = document.createElement('button');
        newBtnWrapper.id = 'tm-modal-trigger';
        newBtnWrapper.className = 'v-btn v-btn--has-bg theme--dark';
        newBtnWrapper.style.fontFamily = 'Roboto, sans-serif';
        newBtnWrapper.style.cssText += `
        margin-left: 10px;
        padding: 4px 10px;
        font-size: 13px;
        height: auto;
        min-height: 32px;
        line-height: 1.2;
        `;

        const contentSpan = document.createElement('span');
        contentSpan.className = 'v-btn__content';

        // Text part
        const textNode = document.createTextNode('Auto Execute');
        contentSpan.appendChild(textNode);

        // Icon part
        const icon = document.createElement('i');
        icon.className = 'v-icon notranslate v-icon--right mdi mdi-play theme--dark';
        icon.style.marginLeft = '6px'; // optional spacing between text and icon
        contentSpan.appendChild(icon);


        newBtnWrapper.appendChild(contentSpan);
        newBtnWrapper.onclick = () => {
            if (!document.getElementById('tm-modal-overlay')) {
                createModal();
            }
        };

        existingButton.parentElement.insertBefore(newBtnWrapper, existingButton.nextSibling);
    }

    const observer = new MutationObserver(() => {
        if (isSecondTabActive()) {
            setupSearchTrigger();
            addModalButton();
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    window.addEventListener('load', () => {
        if (isSecondTabActive()) {
            setupSearchTrigger();
            addModalButton();
        }
    });
})();
