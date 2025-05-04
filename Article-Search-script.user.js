// ==UserScript==
// @name         Article Search Copy Button
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  Copies Supplier Size, SKU, Supplier SKU, and Supplier Color in a single line format (tab-separated)
// @author       Mariusz Krupinski
// @match        https://portal.logistics.zalan.do/proxy/article-search/
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    function getValueByLabel(labelText) {
        const labels = document.querySelectorAll('.ant-descriptions-item-label');
        for (const label of labels) {
            if (label.innerText.trim() === labelText) {
                const content = label.parentElement.querySelector('.ant-descriptions-item-content');
                return content ? content.innerText.trim() : '';
            }
        }
        console.warn(`Label not found: ${labelText}`);
        return '';
    }

    function copyValues() {
        const supplierSize = getValueByLabel('Supplier Size');
        const sku = getValueByLabel('SKU');
        const supplierSku = getValueByLabel('Supplier SKU');
        const supplierColor = getValueByLabel('Supplier Color');

        const textToCopy = `${supplierSize}\t${sku}\t${supplierSku}\t${supplierColor}`;

        navigator.clipboard.writeText(textToCopy).then(() => {
            console.log('Copied to clipboard:', textToCopy);
        }).catch(err => {
            console.error('Failed to copy text:', err);
        });
    }

    function insertCopyButtonIfNeeded() {
        const existingButton = document.querySelector('[data-copy-button]');
        if (existingButton) return; // Prevent duplicates

        // Find the "Clear" button by its span text
        const buttons = document.querySelectorAll('button.ant-btn span');
        let clearButton = null;
        for (const span of buttons) {
            if (span.textContent.trim() === 'Clear') {
                clearButton = span.parentElement;
                break;
            }
        }

        if (!clearButton) {
            console.warn('"Clear" button not found.');
            return;
        }

        const copyButton = document.createElement('button');
        copyButton.setAttribute('data-copy-button', 'true');
        copyButton.className = 'ant-btn ant-btn-primary';
        copyButton.style.marginLeft = '15px';

        const span = document.createElement('span');
        span.textContent = 'Copy Value';
        copyButton.appendChild(span);


        copyButton.addEventListener('mousedown', () => {
            copyButton.style.backgroundColor = '#096dd9';
            copyButton.style.borderColor = '#096dd9';
        });

        copyButton.addEventListener('mouseup', () => {
            copyButton.style.backgroundColor = '#1890FF';
            copyButton.style.borderColor = '#ccc';
        });

        copyButton.addEventListener('mouseleave', () => {
            copyButton.style.backgroundColor = '#1890FF';
            copyButton.style.borderColor = '#ccc';
        });

        copyButton.addEventListener('click', copyValues);

        // Insert after the Clear button
        clearButton.parentElement.insertBefore(copyButton, clearButton.nextSibling);
    }


    function observeTabSwitching() {
        setInterval(() => {
            insertCopyButtonIfNeeded();
        }, 500);
    }

    function main() {
        window.addEventListener('load', () => {
            insertCopyButtonIfNeeded();
            observeTabSwitching();
        });
    }

    main();
})();
