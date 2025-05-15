// ==UserScript==
// @name         Article Search Multi Copy Tool (Scrollable Table)
// @namespace    http://tampermonkey.net/
// @version      2.5
// @description  Enhanced multi-copy tool for Zalando article search with modal and configurable delays.
// @match        https://portal.logistics.zalan.do/proxy/article-search/
// @updateURL    https://raw.githubusercontent.com/MariuszKrupinski/ZaloScript/main/Article-Search-script.user.js
// @downloadURL  https://raw.githubusercontent.com/MariuszKrupinski/ZaloScript/main/Article-Search-script.user.js
// @grant        none
// @run-at       document-end
// ==/UserScript==
//Hello Froggy :3 
(function () {
    'use strict';

    const TYPING_DELAY = 1000;
    const LOADING_DELAY = 1000;
    let isRunning = false;
    const AFTER_SEARCH_DELAY = 500; // Wait a bit more after data is loaded


    function getValueByLabel(labelText) {
        const labels = document.querySelectorAll('.ant-descriptions-item-label');
        for (const label of labels) {
            if (label.innerText.trim() === labelText) {
                const content = label.parentElement.querySelector('.ant-descriptions-item-content');
                return content ? content.innerText.trim() : '';
            }
        }
        return 'Not found';
    }

    function copyValues() {
        const supplierSize = getValueByLabel('Supplier Size');
        const sku = getValueByLabel('SKU');
        const supplierSku = getValueByLabel('Supplier SKU');
        const supplierColor = getValueByLabel('Supplier Color');
        const textToCopy = `${supplierSize}\t${sku}\t${supplierSku}\t${supplierColor}`;
        navigator.clipboard.writeText(textToCopy).then(() => {
            console.log('Copied to clipboard:', textToCopy);
        });
    }

    function createButton(text, onClick, attr) {
        const btn = document.createElement('button');
        btn.className = 'ant-btn ant-btn-primary';
        btn.style.marginLeft = '8px';
        btn.innerHTML = `<span>${text}</span>`;
        btn.setAttribute(attr, 'true');
        btn.addEventListener('click', onClick);
        return btn;
    }

    function insertButtonsIfNeeded() {
        const existingCopy = document.querySelector('[data-copy-button]');
        const existingMulti = document.querySelector('[data-multi-button]');
        if (existingCopy && existingMulti) return;

        const buttons = document.querySelectorAll('button.ant-btn span');
        let clearButton = null;
        for (const span of buttons) {
            if (span.textContent.trim() === 'Clear') {
                clearButton = span.parentElement;
                break;
            }
        }
        if (!clearButton) return;

        if (!existingCopy) {
            const copyBtn = createButton('Copy Values', copyValues, 'data-copy-button');
            clearButton.parentElement.insertBefore(copyBtn, clearButton.nextSibling);
        }

        if (!existingMulti) {
            const multiBtn = createButton('Multi Copy', showModal, 'data-multi-button');
            clearButton.parentElement.insertBefore(multiBtn, clearButton.nextSibling.nextSibling);
        }
    }

    function simulateTypingReact(input, value) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeInputValueSetter.call(input, value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
    }

    function simulateClick(button) {
        button.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        button.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }

    async function waitForData(previousSKU = '', maxTime = 5000, interval = LOADING_DELAY) {
        const start = Date.now();
        while (Date.now() - start < maxTime) {
            const sku = getValueByLabel('SKU');
            if (sku && sku !== 'Not found' && sku !== previousSKU) return;
            await new Promise(r => setTimeout(r, interval));
        }
    }

    function showModal() {
        if (document.querySelector('#multiCopyModal')) return;

        const modal = document.createElement('div');
        modal.id = 'multiCopyModal';
        modal.style.position = 'fixed';
        modal.style.top = '80px';
        modal.style.left = '50%';
        modal.style.transform = 'translateX(-50%)';
        modal.style.width = '600px';
        modal.style.background = '#fff';
        modal.style.border = '1px solid #ccc';
        modal.style.borderRadius = '8px';
        modal.style.padding = '16px';
        modal.style.zIndex = '10000';
        modal.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
        modal.innerHTML = `
            <h3 style="margin: 0 0 10px;">Multi QL Copy</h3>
            <textarea id="qlInput" rows="4" style="width: 100%; margin-bottom: 10px;" placeholder="Paste SKU/EAN/MSI values separated by new lines"></textarea>
            <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                <button id="startMultiCopy" class="ant-btn ant-btn-primary">Start</button>
                <button id="stopMultiCopy" class="ant-btn ant-btn-danger">Stop</button>
                <button id="copyAll" class="ant-btn ant-btn-primary" style="background-color: #ffc107; color: white; border: none;">Copy All</button>
                <button id="closeModal" class="ant-btn">Close</button>
            </div>
            <div style="max-height: 300px; overflow-y: auto;">
                <table id="resultTable" style="width: 100%; border-collapse: collapse; font-size: 12px;">
                    <thead>
                        <tr>
                            <th style="border: 1px solid #ccc; padding: 4px;">QL</th>
                            <th style="border: 1px solid #ccc; padding: 4px;">Supplier Size</th>
                            <th style="border: 1px solid #ccc; padding: 4px;">SKU</th>
                            <th style="border: 1px solid #ccc; padding: 4px;">Supplier SKU</th>
                            <th style="border: 1px solid #ccc; padding: 4px;">Supplier Color</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('closeModal').onclick = () => {
            isRunning = false;
            modal.remove();
        };

        document.getElementById('stopMultiCopy').onclick = () => { isRunning = false; };

        document.getElementById('copyAll').onclick = () => {
            const rows = document.querySelectorAll('#resultTable tbody tr');
            if (rows.length === 0) return alert('No data to copy.');
            const lines = [];
            for (const row of rows) {
                const cells = row.querySelectorAll('td');
                const ql = cells[0]?.textContent.trim() || '';
                const supplierSize = cells[1]?.textContent.trim() || '';
                const sku = cells[2]?.textContent.trim() || '';
                const supplierSku = cells[3]?.textContent.trim() || '';
                const supplierColor = cells[4]?.textContent.trim() || '';

                // Leave empty spot between QL and Supplier Size
                lines.push([supplierSize, sku, supplierSku, supplierColor].join('\t')); //Select what to copy
            }
            navigator.clipboard.writeText(lines.join('\n'))
                .then(() => console.log('All data copied to clipboard.'))
                .catch(err => console.error('Copy failed:', err));
        };

        document.getElementById('startMultiCopy').onclick = async () => {
            const input = document.getElementById('qlInput').value;
            const qls = input.split('\n').map(q => q.trim()).filter(Boolean);
            if (!qls.length) return alert('SKU/BARCODE cannot be empty');

            const tableBody = document.querySelector('#resultTable tbody');
            tableBody.innerHTML = '';
            isRunning = true;

            for (const ql of qls) {
                if (!isRunning) break;

                const inputBox = document.querySelector('input.ant-input[placeholder="SKU/EAN/MSI"]');
                const searchBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Search');

                if (!inputBox || !searchBtn) {
                    alert('Search field or button not found!');
                    return;
                }

                simulateTypingReact(inputBox, ql);
                await new Promise(r => setTimeout(r, TYPING_DELAY));
                simulateClick(searchBtn);
                await waitForData();
                await new Promise(r => setTimeout(r, AFTER_SEARCH_DELAY)); // New delay after search

                const supplierSize = getValueByLabel('Supplier Size');

                const sku = getValueByLabel('SKU');
                const supplierSku = getValueByLabel('Supplier SKU');
                const supplierColor = getValueByLabel('Supplier Color');

                const tr = document.createElement('tr');
                [ql, supplierSize, sku, supplierSku, supplierColor].forEach(text => {
                    const td = document.createElement('td');
                    td.style.border = '1px solid #ccc';
                    td.style.padding = '4px';
                    td.textContent = text || 'Not found';
                    tr.appendChild(td);
                });
                tableBody.appendChild(tr);
            }
        };
    }

    function main() {
        setInterval(insertButtonsIfNeeded, 1000);
    }

    main();
})();
