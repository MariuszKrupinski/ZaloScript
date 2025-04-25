// ==UserScript==
// @name         Auto Execute Telegram Tracer
// @namespace    http://tampermonkey.net/
// @version      2.1
// @author       Mariusz K
// @description  Trigger search on Enter, show modal with pasteable QLs, and execute each with delay, with count and ETA
// @match        https://portal.logistics.zalan.do/tab/overview/*
// @match        https://portal.logistics.zalan.do/tab/queries/*
// @match        https://portal.logistics.zalan.do/*
// @updateURL    https://raw.githubusercontent.com/MariuszKrupinski/ZaloScript/main/TelegramTracer-AutoExcec-script.user.js
// @downloadURL  https://raw.githubusercontent.com/MariuszKrupinski/ZaloScript/main/TelegramTracer-AutoExcec-script.user.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    let isExecuting = false;
    const delay = 300;

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
        modalOverlay.style = `
            font-family: Roboto, sans-serif;
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background-color: rgba(0, 0, 0, 0.4);
            z-index: 9999;
        `;

        const modal = document.createElement('div');
        modal.id = 'tm-custom-modal';
        modal.style = `
            font-family: Roboto, sans-serif;
            position: fixed;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            min-width: 320px;
            width: 640px;
            max-height: 80%;
            overflow-y: auto;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            position: relative;
        `;

        const closeBtn = document.createElement('span');
        closeBtn.textContent = '✖';
        closeBtn.style = `
            position: absolute;
            top: 10px;
            right: 15px;
            cursor: pointer;
            font-size: 16px;
            color: #888;
        `;
        closeBtn.addEventListener('click', () => {
            isExecuting = false;
            document.body.removeChild(modalOverlay);
        });

        const table = document.createElement('table');
        table.id = 'tm-ql-table';
        table.style = `
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        `;

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

            cell1.style = cell2.style = `
                padding: 8px;
                border: 1px solid #ddd;
                text-align: left;
                width: 300px;
                word-break: break-word;
            `;
            cell2.style.backgroundColor = '#f0f8ff';

            row.appendChild(cell1);
            row.appendChild(cell2);
            table.appendChild(row);
        }

        createRow(0);

        const executeAllBtn = document.createElement('button');
        executeAllBtn.textContent = 'Execute All';
        executeAllBtn.className = 'v-btn theme--dark v-size--default';
        executeAllBtn.style = `
            margin-left: 0px;
            background-color: #4CAF50;
            color: white;
            border-radius: 4px;
            padding: 6px 12px;
            cursor: pointer;
        `;

        const stopBtn = document.createElement('button');
        stopBtn.textContent = 'Stop';
        stopBtn.className = 'v-btn theme--dark v-size--default';
        stopBtn.style = `
            margin-left: 0px;
            background-color: #f44336;
            color: white;
            border-radius: 4px;
            padding: 6px 12px;
            cursor: pointer;
        `;

        const copyValuesBtn = document.createElement('button');
        copyValuesBtn.textContent = 'Copy Values';
        copyValuesBtn.className = 'v-btn theme--dark v-size--default';
        copyValuesBtn.style = `
            margin-left: 0px;
            background-color: #FFC107;
            color: white;
            border-radius: 4px;
            padding: 6px 12px;
            cursor: pointer;
        `;

        const statusLabel = document.createElement('div');
        statusLabel.style = `
            margin-top: 10px;
            font-size: 14px;
            color: #333;
        `;
        statusLabel.textContent = 'No QLs pasted yet.';

        executeAllBtn.addEventListener('click', async () => {
            if (isExecuting) return;
            isExecuting = true;

            const searchInput = document.getElementById('search');
            const executeButton = document.getElementById('executeButton');
            const rows = table.querySelectorAll('tr');
            const totalQLs = Array.from(rows).filter(row => row.cells[0].querySelector('input').value.trim() !== '');
            statusLabel.textContent = `Executing ${totalQLs.length} QLs. Estimated time: ~${(delay * 0.001 * totalQLs.length).toFixed(1)} seconds`;

            for (let row of totalQLs) {
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
                    await new Promise(res => setTimeout(res, delay));

                    const resultTable = document.querySelector('.v-data-table__wrapper');
                    const resultRow = resultTable?.querySelector('tr');
                    const td = resultRow?.querySelectorAll('td')[4];
                    outputCell.textContent = td ? td.textContent.trim() : 'Not found';
                }
                if (!isExecuting) break;
            }

            isExecuting = false;
        });

        stopBtn.addEventListener('click', () => {
            isExecuting = false;
        });

        copyValuesBtn.addEventListener('click', () => {
            const rows = table.querySelectorAll('tr');
            let copiedText = '';
            rows.forEach(row => {
                const inputField = row.cells[0].querySelector('input');
                const outputCell = row.cells[1];
                copiedText += `${inputField.value}\t${outputCell.textContent}\n`;
            });
            navigator.clipboard.writeText(copiedText).then(() => {
                alert('Copied to clipboard!');
            });
        });

        const inputFieldForPaste = document.createElement('textarea');
        inputFieldForPaste.placeholder = 'Paste QLs here...';
        inputFieldForPaste.style = `
            width: 100%;
            height: 80px;
            resize: none;
            margin-top: 10px;
        `;
        inputFieldForPaste.addEventListener('paste', (e) => {
            e.preventDefault();
            const text = (e.clipboardData || window.clipboardData).getData('text');
            const lines = text.split(/\r?\n/).filter(l => l.trim());

            table.innerHTML = '';
            lines.forEach((line, index) => {
                createRow(index);
                table.rows[index].cells[0].querySelector('input').value = line.trim();
            });

            statusLabel.textContent = `${lines.length} QLs pasted. Estimated time: ~${(delay * 0.001 * lines.length).toFixed(1)} seconds`;
        });

        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.justifyContent = 'space-between';
        buttonContainer.style.marginBottom = '10px';

        buttonContainer.appendChild(executeAllBtn);
        buttonContainer.appendChild(stopBtn);
        buttonContainer.appendChild(copyValuesBtn);

        modal.appendChild(closeBtn);
        modal.appendChild(inputFieldForPaste);
        modal.appendChild(buttonContainer);
        modal.appendChild(statusLabel);
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
        newBtnWrapper.style = `
            font-family: Roboto, sans-serif;
            margin-left: 10px;
            padding: 4px 10px;
            font-size: 13px;
            height: auto;
            min-height: 32px;
            line-height: 1.2;
        `;

        const contentSpan = document.createElement('span');
        contentSpan.className = 'v-btn__content';

        const textNode = document.createTextNode('Auto Execute');
        const icon = document.createElement('i');
        icon.className = 'v-icon notranslate v-icon--right mdi mdi-play theme--dark';
        icon.style.marginLeft = '6px';

        contentSpan.appendChild(textNode);
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
