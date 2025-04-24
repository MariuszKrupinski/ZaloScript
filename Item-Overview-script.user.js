// ==UserScript==
// @name         Copy Selected Columns from Item Overview (with Settings)
// @namespace    http://tampermonkey.net/
// @version      2.2
// @description  Adds buttons to select and copy specific columns from a table with saved preferences and modal controls.
// @author       Mariusz K
// @match        https://portal.logistics.zalan.do/proxy/item-overview/*
// @updateURL   https://raw.githubusercontent.com/MariuszKrupinski/ZaloScript/main/Item-Overview-script.user.js
// @downloadURL https://raw.githubusercontent.com/MariuszKrupinski/ZaloScript/main/Item-Overview-script.user.js
// @grant        GM_setClipboard
// ==/UserScript==

//Test Sub

(function () {
    'use strict';

    const STORAGE_KEY = 'selectedColumnsToCopy';

    function waitForElement(selector, callback) {
        const interval = setInterval(() => {
            const el = document.querySelector(selector);
            if (el) {
                clearInterval(interval);
                callback(el);
            }
        }, 500);
    }

    function getHeaders() {
        const headers = Array.from(document.querySelectorAll('thead tr th'));
        return headers.map((th, index) => ({
            name: th.innerText.trim(),
            index
        }));
    }

    function getSelectedColumnData(selectedIndexes) {
        const rows = document.querySelectorAll('tbody tr.ant-table-row');
        let copiedData = '';

        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            let rowText = '';
            selectedIndexes.forEach(i => {
                if (cells[i]) {
                    rowText += cells[i].innerText.trim() + '\t';
                }
            });
            copiedData += rowText.trim() + '\n';
        });

        return copiedData.trim();
    }

    function saveSelectionToStorage(indexes) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(indexes));
    }

    function loadSelectionFromStorage() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        } catch {
            return [];
        }
    }

    function clearStorage() {
        localStorage.removeItem(STORAGE_KEY);
    }

    function createModal(headers, onConfirm) {
        const previousSelection = loadSelectionFromStorage();

        // Overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.style.position = 'fixed';
        modalOverlay.style.top = 0;
        modalOverlay.style.left = 0;
        modalOverlay.style.width = '100%';
        modalOverlay.style.height = '100%';
        modalOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
        modalOverlay.style.zIndex = 9999;

        // Modal
        const modal = document.createElement('div');
        modal.style.position = 'fixed';
        modal.style.top = '50%';
        modal.style.left = '50%';
        modal.style.transform = 'translate(-50%, -50%)';
        modal.style.backgroundColor = 'white';
        modal.style.padding = '20px';
        modal.style.borderRadius = '8px';
        modal.style.minWidth = '320px';
        modal.style.maxHeight = '80%';
        modal.style.overflowY = 'auto';
        modal.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
        modal.style.position = 'relative';
        modal.style.width = '400px';

        // Close (X) button
        const closeBtn = document.createElement('span');
        closeBtn.textContent = '✖';
        closeBtn.style.position = 'absolute';
        closeBtn.style.top = '10px';
        closeBtn.style.right = '15px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.fontSize = '16px';
        closeBtn.style.color = '#888';
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(modalOverlay);
        });
        modal.appendChild(closeBtn);

        // Title
        const title = document.createElement('h3');
        title.textContent = 'Select Columns to Copy';
        modal.appendChild(title);

        const checkboxes = [];

        // Checkboxes
        headers.forEach(header => {
            const label = document.createElement('label');
            label.style.display = 'block';
            label.style.marginBottom = '5px';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = header.index;
            checkbox.checked = previousSelection.includes(header.index);

            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(' ' + header.name));
            modal.appendChild(label);
            checkboxes.push(checkbox);
        });

        // Button Container
        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.flexDirection = 'column';
        buttonContainer.style.gap = '8px';
        buttonContainer.style.marginTop = '12px';

        // Confirm Button
        const confirmBtn = document.createElement('button');
        confirmBtn.textContent = '✅ Save Selection';
        confirmBtn.classList.add('ant-btn');
        confirmBtn.onclick = () => {
            const selected = checkboxes.filter(cb => cb.checked).map(cb => parseInt(cb.value));
            saveSelectionToStorage(selected);
            onConfirm(selected);
            document.body.removeChild(modalOverlay);
        };

        // Reset Button
        const resetBtn = document.createElement('button');
        resetBtn.textContent = '🔄 Reset Selection';
        resetBtn.classList.add('ant-btn');
        resetBtn.onclick = () => {
            checkboxes.forEach(cb => cb.checked = false);
            clearStorage();
        };

        // Check All Button
        const checkallBtn = document.createElement('button');
        checkallBtn.textContent = '✅ Check All';
        checkallBtn.classList.add('ant-btn');
        checkallBtn.onclick = () => {
            checkboxes.forEach(cb => cb.checked = true);
        };

        // Append buttons
        buttonContainer.appendChild(confirmBtn);
        buttonContainer.appendChild(resetBtn);
        buttonContainer.appendChild(checkallBtn);
        modal.appendChild(buttonContainer);

        modalOverlay.appendChild(modal);
        document.body.appendChild(modalOverlay);
    }

    waitForElement('.ant-checkbox-wrapper', (container) => {
        // Button to open modal
        const selectBtn = document.createElement('button');
        selectBtn.textContent = '⚙️ Select Columns';
        selectBtn.classList.add('ant-btn', 'item-unit-overview-search__button');
        selectBtn.style.fontSize = '11px';
        selectBtn.style.height = '26px';
        selectBtn.style.padding = '0 10px';
        selectBtn.style.marginRight = '6px';
        selectBtn.style.width = '120px';

        selectBtn.addEventListener('click', () => {
            const headers = getHeaders();
            createModal(headers, () => {});
        });

        // Button to copy using saved config
        const copyBtn = document.createElement('button');
        copyBtn.textContent = '📋 Copy Values';
        copyBtn.classList.add('ant-btn', 'item-unit-overview-search__button');
        copyBtn.style.fontSize = '11px';
        copyBtn.style.height = '26px';
        copyBtn.style.padding = '0 10px';
        copyBtn.style.width = '104px';

        copyBtn.addEventListener('click', () => {
            const selectedIndexes = loadSelectionFromStorage();
            const originalText = copyBtn.innerText;

            if (selectedIndexes.length === 0) {
                copyBtn.innerText = '✖ None Selected';
                setTimeout(() => {
                    copyBtn.innerText = originalText;
                }, 1000);
                return;
            }

            const data = getSelectedColumnData(selectedIndexes);
            GM_setClipboard(data);
            navigator.clipboard.writeText(data).then(() => {
                copyBtn.innerText = 'Copied!';
                setTimeout(() => {
                    copyBtn.innerText = originalText;
                }, 1000);
            });
        });

        container.parentNode.insertBefore(copyBtn, container);
        container.parentNode.insertBefore(selectBtn, copyBtn);
    });
})();
