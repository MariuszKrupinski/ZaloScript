// ==UserScript==
// @name         Shipping Notice Table Fast Copy
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Shows a hover table with latest row data; copyable with mouse; auto-hides on exit reliably; no infinite loops or reprocessing issues.
// @author       Mariusz Krupinski
// @match        https://portal.logistics.zalan.do/proxy/shipping-notice-viewer/*
// @updateURL    https://raw.githubusercontent.com/MariuszKrupinski/ZaloScript/main/SNV-script.user.js
// @downloadURL  https://raw.githubusercontent.com/MariuszKrupinski/ZaloScript/main/SNV-script.user.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    function createHoverTable(values) {
        const table = document.createElement('table');
        table.style.border = '1px solid #ccc';
        table.style.background = '#fff';
        table.style.borderCollapse = 'collapse';
        table.style.boxShadow = '0px 2px 8px rgba(0,0,0,0.2)';
        table.style.position = 'absolute';
        table.style.zIndex = 10000;
        table.style.fontSize = '12px';
        table.style.userSelect = 'text';
        table.style.cursor = 'text';

        values.forEach(val => {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.textContent = val;
            cell.style.border = '1px solid #ddd';
            cell.style.padding = '4px 8px';
            row.appendChild(cell);
            table.appendChild(row);
        });

        return table;
    }

    const processedCells = new WeakSet();
    let currentHover = { cell: null, table: null };

    function clearCurrentHover(force = false) {
        if (!currentHover.table) return;
        if (!force) {
            const stillHovering =
                currentHover.cell?.matches(':hover') ||
                currentHover.table?.matches(':hover');
            if (stillHovering) return;
        }
        currentHover.table.remove();
        currentHover = { cell: null, table: null };
    }

    const observer = new MutationObserver(() => {
        const rows = document.querySelectorAll('.MuiDataGrid-virtualScrollerRenderZone [data-id]');

        rows.forEach(row => {
            const rowId = row.getAttribute('data-id');
            const detailCell = row.querySelector('.MuiDataGrid-cell[aria-colindex="24"]');
            if (!detailCell || processedCells.has(detailCell)) return;

            const getValues = () =>
                detailCell.innerText.trim().split(',').map(v => v.trim()).filter(Boolean);

            detailCell.addEventListener('mouseenter', (e) => {
                const values = getValues();
                if (!values.length) return;

                clearCurrentHover(true); // remove any previous table

                const table = createHoverTable(values);
                document.body.appendChild(table);
                const rect = detailCell.getBoundingClientRect();
                table.style.top = `${rect.bottom + window.scrollY}px`;
                table.style.left = `${rect.left + window.scrollX}px`;

                currentHover = { cell: detailCell, table };
            });

            processedCells.add(detailCell);

            const button = row.querySelector('.MuiDataGrid-cell[aria-colindex="23"] button');
            if (button && !button.dataset.tmBound) {
                button.dataset.tmBound = 'true';
                button.addEventListener('click', () => {
                    setTimeout(() => {
                        // detailCell content may update — handled dynamically
                    }, 500);
                });
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Global cleanup check
    document.addEventListener('mousemove', () => {
        clearCurrentHover();
    });
})();


