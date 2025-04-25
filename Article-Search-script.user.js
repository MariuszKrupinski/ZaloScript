// ==UserScript==
// @name         Article Search Copy Button
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Copies Supplier Size, SKU, Supplier SKU, and Supplier Color in a single line format
// @author        Mariusz Krupinski
// @match        https://portal.logistics.zalan.do/proxy/article-search/
// @updateURL   https://raw.githubusercontent.com/MariuszKrupinski/ZaloScript/main/Article-Search-script.user.js
// @downloadURL https://raw.githubusercontent.com/MariuszKrupinski/ZaloScript/main/Article-Search-script.user.js
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // Function to get value for a given label using querySelector
    function getValue(label) {
        const thElements = document.querySelectorAll('th');
        const thElement = Array.from(thElements).find(th => th.innerText.includes(label));

        if (!thElement) {
            console.error(`Element not found for label: ${label}`);
            return '';
        }

        const tdElement = thElement.nextElementSibling;
        if (tdElement) {
            console.log(`Found value for ${label}: ${tdElement.innerText.trim()}`);
            return tdElement.innerText.trim();
        }

        console.error(`No sibling td found for label: ${label}`);
        return '';
    }

    // Function to copy the values in a single line format
    function copyValues() {
        const supplierSize = getValue('Supplier Size');
        const sku = getValue('SKU');
        const supplierSku = getValue('Supplier SKU');
        const supplierColor = getValue('Supplier Color');

        // Format the values in horizontal tab-separated format
        const textToCopy = `${supplierSize}\t${sku}\t${supplierSku}\t${supplierColor}`;

        // Copy the text to clipboard
        navigator.clipboard.writeText(textToCopy).then(() => {
            console.log('Copied to clipboard:', textToCopy);

            // Clear and focus the input
            const searchInput = document.querySelector('input[placeholder="SKU/EAN/MSI"]');
            if (searchInput) {
                searchInput.value = '';
                searchInput.focus();
                searchInput.select(); // Highlights the empty input field
            } else {
                console.error('Search input field not found.');
            }

        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    }


    // Function to add a "Copy Value" button to the page
    function addButton() {
        const container = document.querySelector('.sku-search-menu');

        if (container) {
            const copyButton = document.createElement('button');
            copyButton.innerText = 'Copy Value';
            copyButton.style.marginLeft = '0px';
            copyButton.style.padding = '3px 6px';
            copyButton.style.border = '1px solid #ccc';
            copyButton.style.borderRadius = '5px';
            copyButton.style.cursor = 'pointer';
            copyButton.style.backgroundColor = '#1890FF';
            copyButton.style.color = 'white';
            copyButton.style.width = '100px';
            copyButton.style.height = '32px';

            // Add active (click) state
            copyButton.addEventListener('mousedown', function () {
                copyButton.style.backgroundColor = '#096dd9'; // Darker blue when clicked
                copyButton.style.borderColor = '#096dd9';
            });

            copyButton.addEventListener('mouseup', function () {
                copyButton.style.backgroundColor = '#1890FF'; // Return to original blue
                copyButton.style.borderColor = '#ccc';
            });

            // Optional: Reset on mouse leave
            copyButton.addEventListener('mouseleave', function () {
                copyButton.style.backgroundColor = '#1890FF';
                copyButton.style.borderColor = '#ccc';
            });

            copyButton.addEventListener('click', copyValues);
            container.appendChild(copyButton);
        } else {
            console.error('Container for button not found.');
        }
    }

    // Wait for the page to load and then add the button
    function main(){

        window.addEventListener('load', addButton);
    }
    main();
})();
