// ==UserScript==
// @name         Workbench Quick Selector
// @namespace    http://tampermonkey.net/
// @version      0.5
// @description  Add quick workbench selection to modal
// @author       Mariusz Krupinski
// @match        https://portal.logistics.zalan.do/*
// @updateURL    https://raw.githubusercontent.com/MariuszKrupinski/ZaloScript/main/Workbench-Selector-script.user.js
// @downloadURL  https://raw.githubusercontent.com/MariuszKrupinski/ZaloScript/main/Workbench-Selector-script.user.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const speed = 1;
    let saveButton;

    let workbenches = JSON.parse(localStorage.getItem('workbenches')) || [
        "", // empty string placeholder
        "999-999-999-S-01",
        "300-000-001-N-01",
        "200-013-101-C-99",
        "200-008-001-H-01",
    ];

    function simulateTyping(input, text) {
        input.focus();
        input.click();
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;

        let originalValue = input.value + " ";
        let deleteIndex = originalValue.length;

        function deleteNextChar() {
            if (deleteIndex > 0) {
                deleteIndex--;
                setter.call(input, originalValue.slice(0, deleteIndex));
                input.dispatchEvent(new Event('input', { bubbles: true }));
                setTimeout(deleteNextChar, speed);
            } else {
                typeNextChar();
            }
        }

        let i = 0;
        function typeNextChar() {
            if (i < text.length) {
                setter.call(input, input.value + text[i]);
                input.dispatchEvent(new Event('input', { bubbles: true }));
                i++;
                setTimeout(typeNextChar, speed);
            } else {
                input.dispatchEvent(new Event('change', { bubbles: true }));
                input.blur();
            }
        }

        deleteNextChar();
    }

    function saveWorkbenches() {
        localStorage.setItem('workbenches', JSON.stringify(workbenches));
    }

    function updateDropdownOptions(dropdown) {
        dropdown.innerHTML = '';
        workbenches.forEach(wb => {
            const option = document.createElement('option');
            option.value = wb;
            option.textContent = wb || '-- Select a Workbench --';
            dropdown.appendChild(option);
        });
    }

    function renderWorkbenchTable(container, dropdown) {
        container.innerHTML = '';

        const table = document.createElement('table');
        table.style.width = '350px';
        table.style.tableLayout = 'fixed';
        table.style.borderCollapse = 'collapse';
        table.style.marginBottom = '10px';
        table.style.borderRadius = '8px';
        table.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';

        const header = table.createTHead();
        const headerRow = header.insertRow();
        ['Workbench ID', 'Actions'].forEach(text => {
            const cell = headerRow.insertCell();
            cell.textContent = text;
            header.style.width = '200px';
            cell.style.padding = '10px';
            cell.style.border = '1px solid #ddd';
            cell.style.backgroundColor = '#f5f5f5';
            cell.style.fontWeight = 'bold';
        });

        const tbody = document.createElement('tbody');
        workbenches.forEach((wb, index) => {
            if (wb === '') return;

            const row = tbody.insertRow();
            const cell1 = row.insertCell();
            cell1.textContent = wb;
            cell1.style.width = '220px';
            cell1.style.padding = '10px';
            cell1.style.border = '1px solid #ddd';

            const cell2 = row.insertCell();
            cell2.style.padding = '10px';
            cell2.style.width = '150px';
            cell2.style.border = '1px solid #ddd';

            const editButton = document.createElement('button');
            editButton.textContent = 'Edit';
            editButton.className = 'ant-btn ant-btn-primary';
            editButton.style.backgroundColor = '#4CAF50';
            editButton.style.borderColor = '#4CAF50';
            editButton.style.marginRight = '5px';
            editButton.addEventListener('click', () => editWorkbench(index, container, dropdown));

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.className = 'ant-btn ant-btn-primary';
            deleteButton.style.backgroundColor = '#f44336';
            deleteButton.style.borderColor = '#f44336';
            deleteButton.addEventListener('click', () => deleteWorkbench(index, container, dropdown));

            cell2.appendChild(editButton);
            cell2.appendChild(deleteButton);
        });

        table.appendChild(tbody);
        container.appendChild(table);
    }

    function addNewWorkbench(container, dropdown) {
        const table = container.querySelector('table');
        const tbody = table.querySelector('tbody');

        const existingNewRow = tbody.querySelector('.new-workbench-row');
        if (existingNewRow) existingNewRow.remove();

        const newRow = document.createElement('tr');
        newRow.classList.add('new-workbench-row');

        const cell1 = document.createElement('td');
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Workbench ID';
        input.style.width = '80%';
        input.style.padding = '6px 8px';
        input.style.fontSize = '14px';
        input.style.border = '1px solid #ccc';
        input.style.borderRadius = '4px';
        cell1.style.padding = '10px';
        cell1.style.width = '220px';
        cell1.style.border = '1px solid #ddd';
        cell1.appendChild(input);

        const cell2 = document.createElement('td');
        cell2.style.padding = '10px';
        cell2.style.border = '1px solid #ddd';
        cell2.style.width = '40px';

        saveButton = document.createElement('button');
        saveButton.textContent = 'Save';
        saveButton.className = 'ant-btn ant-btn-primary';
        saveButton.style.backgroundColor = '#4CAF50';
        saveButton.style.borderColor = '#4CAF50';
        saveButton.style.marginRight = '5px';

        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancel';
        cancelButton.className = 'ant-btn ant-btn-primary';
        cancelButton.style.backgroundColor = '#f44336';
        cancelButton.style.borderColor = '#f44336';

        saveButton.addEventListener('click', () => {
            const newId = input.value.trim();
            if (newId && !workbenches.includes(newId)) {
                workbenches.push(newId);
                saveWorkbenches();
                renderWorkbenchTable(container, dropdown);
                updateDropdownOptions(dropdown);
            } else {
                alert('Invalid or duplicate Workbench ID');
            }
        });

        cancelButton.addEventListener('click', () => newRow.remove());

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveButton.click();
            }
        });

        cell2.appendChild(saveButton);
        cell2.appendChild(cancelButton);

        newRow.appendChild(cell1);
        newRow.appendChild(cell2);
        tbody.appendChild(newRow);
    }

    function editWorkbench(index, container, dropdown) {
        const newId = prompt("Edit workbench ID:", workbenches[index]);
        if (newId && newId !== workbenches[index] && !workbenches.includes(newId)) {
            workbenches[index] = newId;
            saveWorkbenches();
            renderWorkbenchTable(container, dropdown);
            updateDropdownOptions(dropdown);
        } else if (workbenches.includes(newId)) {
            alert("Workbench already exists.");
        }
    }

    function deleteWorkbench(index, container, dropdown) {
        if (confirm(`Are you sure you want to delete workbench "${workbenches[index]}"?`)) {
            workbenches.splice(index, 1);
            saveWorkbenches();
            renderWorkbenchTable(container, dropdown);
            updateDropdownOptions(dropdown);
        }
    }

    function addWorkbenchSelector(modal) {
        const inputWrappers = modal.querySelectorAll('.ant-input-affix-wrapper');
        if (inputWrappers.length === 0) return;

        inputWrappers.forEach(wrapper => {
            const input = wrapper.querySelector('input#settings-form_workbench.ant-input');
            if (!input) return;

            if (wrapper.parentNode.querySelector('.workbench-quick-selector')) return;

            const container = document.createElement('div');
            container.style.marginTop = '10px';
            container.className = 'workbench-quick-selector';

            const dropdown = document.createElement('select');
            dropdown.style.width = '100%';
            dropdown.style.padding = '8px';
            dropdown.style.marginTop = '8px';
            dropdown.style.border = '1px solid #ddd';
            dropdown.style.borderRadius = '4px';
            updateDropdownOptions(dropdown);

            dropdown.addEventListener('change', () => {
                simulateTyping(input, dropdown.value);
            });

            const gearButton = document.createElement('button');
            gearButton.innerHTML = '&#9881;';
            gearButton.style.fontSize = '24px';
            gearButton.style.background = 'transparent';
            gearButton.style.border = 'none';
            gearButton.style.cursor = 'pointer';
            gearButton.style.marginTop = '8px';

            const workbenchTableContainer = document.createElement('div');
            workbenchTableContainer.id = 'workbench-table-container';
            workbenchTableContainer.style.display = 'none';
            workbenchTableContainer.style.marginTop = '10px';

            const addButton = document.createElement('button');
            addButton.textContent = 'Add New Workbench';
            addButton.className = 'ant-btn ant-btn-primary';
            addButton.style.backgroundColor = '#4CAF50';
            addButton.style.borderColor = '#4CAF50';
            addButton.style.marginTop = '10px';
            addButton.style.display = 'none';
            addButton.addEventListener('click', () => {
                addNewWorkbench(workbenchTableContainer, dropdown);
            });

            gearButton.addEventListener('click', () => {
                const show = workbenchTableContainer.style.display === 'none';
                workbenchTableContainer.style.display = show ? 'block' : 'none';
                addButton.style.display = show ? 'inline-block' : 'none';
            });

            container.appendChild(dropdown);
            container.appendChild(gearButton);
            container.appendChild(workbenchTableContainer);
            container.appendChild(addButton);
            wrapper.parentNode.insertBefore(container, wrapper.nextSibling);

            renderWorkbenchTable(workbenchTableContainer, dropdown);
        });
    }

    // Style
    const style = document.createElement('style');
    style.innerHTML = `
      .ant-modal-content .ant-col.ant-col-10.ant-form-item-label {
          flex: 0 0 110px !important;
          max-width: 110px !important;
      }
      .ant-modal-content .ant-form-item-label > label {
          white-space: nowrap;
      }
      .workbench-quick-selector button {
          font-size: 14px;
          height: 32px;
          padding: 4px 15px;
          border-radius: 6px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 500;
          transition: all 0.3s;
      }
    `;
    document.head.appendChild(style);

    function observeVisibility(modalWrap) {
        const visibilityObserver = new MutationObserver(() => {
            if (modalWrap.style.display !== 'none') {
                const modalContent = modalWrap.querySelector('.ant-modal-content');
                if (modalContent) {
                    addWorkbenchSelector(modalContent);
                }
            }
        });

        visibilityObserver.observe(modalWrap, {
            attributes: true,
            attributeFilter: ['style', 'class'],
        });
    }

    function setupModalObserver() {
        const modalObserver = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (
                        node.nodeType === 1 &&
                        node.classList.contains('ant-modal-wrap')
                    ) {
                        observeVisibility(node);
                        const modalContent = node.querySelector('.ant-modal-content');
                        if (modalContent) {
                            addWorkbenchSelector(modalContent);
                        }
                    }
                }
            }
        });

        modalObserver.observe(document.body, { childList: true, subtree: true });

        document.querySelectorAll('.ant-modal-wrap').forEach(observeVisibility);
    }

    // Modal activation via button click
    document.body.addEventListener('click', (e) => {
        const target = e.target.closest('.ant-btn.ant-btn-primary');
        if (target) {
            setTimeout(() => {
                document.querySelectorAll('.ant-modal-wrap').forEach(modalWrap => {
                    if (modalWrap.style.display !== 'none') {
                        const modalContent = modalWrap.querySelector('.ant-modal-content');
                        if (modalContent) {
                            addWorkbenchSelector(modalContent);
                        }
                    }
                });
            }, 300);
        }
    });

    setupModalObserver();
})();
