// ==UserScript==
// @name         Quality Label Protocol Customize Columns
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  Create a modal to hide selected headers
// @author        Mariusz Krupinski
// @match        https://portal.logistics.zalan.do/proxy/quality-label-protocol/
// @updateURL    https://raw.githubusercontent.com/MariuszKrupinski/ZaloScript/main/Quality-Label-Protocol-script.user.js
// @downloadURL  https://raw.githubusercontent.com/MariuszKrupinski/ZaloScript/main/Quality-Label-Protocol-script.user.js
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    // Add custom styles for the modal and checkboxes
    GM_addStyle(`
        .custom-modal {
            display: none;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: white;
            padding: 20px;
            border: 1px solid #ccc;
            z-index: 9999;
            width: auto;
            max-width: 600px;
        }
        .custom-modal.show {
            display: block;
        }
        .ant-modal-header {
            background: #fff;
            border-bottom: 1px solid #f0f0f0;
            border-radius: 2px 2px 0 0;
            color: #000000d9;
            padding: 16px 24px;
        }
        .ant-modal-content {
            background-clip: padding-box;
            background-color: #fff;
            border: 0;
            border-radius: 2px;
            box-shadow: 0 3px 6px -4px #0000001f, 0 6px 16px 0 #00000014, 0 9px 28px 8px #0000000d;
        }
        .ant-modal-footer {
            border-top: 1px solid #f0f0f0;
            padding: 16px;
            text-align: right;
        }
        .modal-button {
            padding: 10px 20px;
            background-color: #007bff;
            color: white;
            border: none;
            cursor: pointer;
        }
        .modal-button:hover {
            background-color: #0056b3;
        }
        .column-option {
            display: flex;
            align-items: center;
            margin: 10px 0;
        }
        .column-option label {
            margin-right: 10px;
        }
        .ant-switch-inner {
            font-size: 14px;
        }
        /* Larger checkboxes */
        .column-option input[type="checkbox"] {
            transform: scale(1.5);
            margin-left: 10px;
        }
    `);

    // Create the modal structure, now including a Reset View button in the footer
    const modal = document.createElement('div');
    modal.classList.add('custom-modal');
    modal.innerHTML = `
        <div class="ant-modal-header">
            <div class="ant-modal-title" id="rc_unique_0">Customize Columns</div>
        </div>
        <div class="ant-modal-body">
            <div class="column-options"></div>
        </div>
        <div class="ant-modal-footer">
            <button class="ant-btn ant-btn-default reset-view">Reset View</button>
            <button class="ant-btn ant-btn-default close-modal">Close</button>
        </div>
    `;
    document.body.appendChild(modal);

    // Create the button to open the modal
    const openModalButton = document.createElement('button');
    openModalButton.classList.add('modal-button');
    openModalButton.innerText = 'Customize Columns';

    // Improved styling
    Object.assign(openModalButton.style, {
        marginTop: '5px',
        padding: '5px 15px',// More comfortable padding
        border: '1px solid #ccc',
        height: '32px',
        borderRadius: '5px',
        background: '#FF6900',
        cursor: 'pointer',// Better user experience
        fontSize: '12px',// More readable
        transition: 'background 0.3s ease' // Smooth hover effect
    });

    // Add hover effect
    openModalButton.addEventListener('mouseover', () => {
        openModalButton.style.background = '#1890ff';
    });
    openModalButton.addEventListener('mouseout', () => {
        openModalButton.style.background = '#FF6900';
    });

    // Append button to the form
    document.querySelector('.ant-form.ant-form-inline').appendChild(openModalButton);


    const table = document.querySelector('.ant-table');
    const headerCells = table.querySelectorAll('th');
    const columnOptions = modal.querySelector('.column-options');

    // Function to toggle column visibility
    function toggleColumnVisibility(index, isVisible) {
        const columns = table.querySelectorAll('td:nth-child(' + (index + 1) + '), th:nth-child(' + (index + 1) + ')');
        columns.forEach(col => {
            col.style.display = isVisible ? '' : 'none'; // Show or hide column
        });
    }

    // Function to update column visibility from localStorage
    function updateColumnVisibilityFromStorage() {
        headerCells.forEach((headerCell, index) => {
            const savedState = localStorage.getItem('column-' + index);
            if (savedState !== null) {
                const isChecked = savedState === 'true';
                toggleColumnVisibility(index, isChecked); // Apply saved visibility
            }
        });
    }

    // Event to open the modal
    openModalButton.addEventListener('click', function() {
        columnOptions.innerHTML = '';

        // Loop through each header cell and add a checkbox
        headerCells.forEach((headerCell, index) => {
            const label = headerCell.textContent.trim();
            if (label) {
                const optionDiv = document.createElement('div');
                optionDiv.classList.add('column-option');
                optionDiv.innerHTML = `
                    <label>
                        <input type="checkbox" class="column-toggle" data-index="${index}" checked>
                        ${label}
                    </label>
                `;
                columnOptions.appendChild(optionDiv);

                // Set the checkbox state based on localStorage
                const savedState = localStorage.getItem('column-' + index);
                if (savedState !== null) {
                    const checkbox = optionDiv.querySelector('.column-toggle');
                    checkbox.checked = savedState === 'true';
                    toggleColumnVisibility(index, checkbox.checked); // Apply saved visibility
                }

                // Add event listener to hide or show columns based on checkbox state
                const checkbox = optionDiv.querySelector('.column-toggle');
                checkbox.addEventListener('change', function() {
                    // Save the new state of the checkbox in localStorage
                    localStorage.setItem('column-' + index, checkbox.checked);

                    // Show or hide the columns based on the checkbox state
                    toggleColumnVisibility(index, checkbox.checked);
                });
            }
        });

        // Show the modal
        modal.classList.add('show');
    });

    // Event to close the modal
    modal.querySelector('.close-modal').addEventListener('click', function() {
        modal.classList.remove('show');
    });

    // Event to reset view: show all columns and update localStorage + checkboxes
    modal.querySelector('.reset-view').addEventListener('click', function() {
        headerCells.forEach((headerCell, index) => {
            // Set all columns to visible
            localStorage.setItem('column-' + index, 'true');
            toggleColumnVisibility(index, true);
        });
        // Update checkboxes if modal is open
       document.querySelectorAll('.column-toggle').forEach(checkbox => {
           checkbox.checked = true;
           checkbox.dispatchEvent(new Event('change')); // Trigger change event to update visibility
       });

    });

    // Update column visibility when the page loads
    updateColumnVisibilityFromStorage();

    // Add MutationObserver to watch for changes in the table content
    const tableContent = document.querySelector('.ant-table-content');
    if (tableContent) {
        const observer = new MutationObserver(function() {
            // Update the column visibility whenever the table content changes
            updateColumnVisibilityFromStorage();
        });

        observer.observe(tableContent, {
            childList: true, // Detect added/removed elements
            subtree: true // Detect changes within the table content subtree
        });
    }

})();



