// ==UserScript==
// @name         Advize Auto Sort To Target
// @namespace    http://tampermonkey.net/
// @version      2.0
// @author       Mariusz Krupinski & Guli Guli
// @description  Floating control panel for automated sorting on Zalando Logistics Portal with QL tracking, counter, and delay control buttons.
// @updateURL    https://raw.githubusercontent.com/MariuszKrupinski/ZaloScript/main/Advize-Auto-Sort-script.user.js
// @downloadURL  https://raw.githubusercontent.com/MariuszKrupinski/ZaloScript/main/Advize-Auto-Sort-script.user.js
// @match        https://portal.logistics.zalan.do/proxy/logistics-unit-advise/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // ✅ Default delay in seconds (saved to localStorage)
    let delaySeconds = parseFloat(localStorage.getItem('advize-delay-seconds')) || 0;

    let isAutomated = false; // Turn on / off
    let automationInterval; // Automation
    let lastQL = null; // Checking last QL
    let itemCounter = 0; // Counting
    let currentQL = ''; // Showing Current QL
    let delayinterval = 1; // Change Value by
    let maxdelay = 5; // Maximum Delay setup

    function createControlPanel() {
        const panel = document.createElement('div');
        panel.id = 'auto-advize-panel';
        panel.style.position = 'fixed';
        panel.style.top = '0px'; // top padding
        panel.style.right = '10px'; // right side padding
        panel.style.backgroundColor = '#f0f0f0';
        panel.style.border = '1px solid #ccc';
        panel.style.padding = '10px 14px';
        panel.style.borderRadius = '8px';
        panel.style.zIndex = '9999';
        panel.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        panel.style.fontFamily = 'Arial, sans-serif';
        panel.style.fontSize = '14px';
        panel.style.color = '#333';
        panel.style.minWidth = '150px'; //Width of the panel

        panel.innerHTML = `
            <div style="margin-bottom: 8px;"><strong>Auto AdviZe</strong></div>
            <div>Status: <span id="advize-status">Stopped</span></div>
            <div>QL: <span id="advize-ql">—</span></div>
            <div>Count: <span id="advize-count">0</span></div>
            <div>
                Delay: <span id="advize-delay">${delaySeconds.toFixed(1)}s</span>
                <div style="display: flex; gap: 4px; margin-top: 4px;">
                    <button id="advize-delay-up" style="width: 24px; height: 24px;">▲</button>
                    <button id="advize-delay-down" style="width: 24px; height: 24px;">▼</button>
                </div>
            </div>
            <button id="advize-toggle" style="
                margin-top: 10px;
                padding: 5px 10px;
                background-color: #4CAF50;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                width: 100%;
            ">Start</button>
        `;

        document.body.appendChild(panel);

        const statusEl = document.getElementById('advize-status');
        const qlEl = document.getElementById('advize-ql');
        const countEl = document.getElementById('advize-count');
        const delayEl = document.getElementById('advize-delay');
        const upBtn = document.getElementById('advize-delay-up');
        const downBtn = document.getElementById('advize-delay-down');
        const toggleBtn = document.getElementById('advize-toggle');

        const updateDelay = () => {
            delaySeconds = Math.max(0, Math.min(maxdelay, parseFloat(delaySeconds.toFixed(1))));
            delayEl.textContent = `${delaySeconds.toFixed(1)}s`;
            localStorage.setItem('advize-delay-seconds', delaySeconds.toFixed(1));

            if (isAutomated) {
                stopAutomation();
                startAutomation(qlEl, countEl);
            }
        };

        upBtn.addEventListener('click', () => {
            delaySeconds += delayinterval;
            updateDelay();
        });

        downBtn.addEventListener('click', () => {
            delaySeconds -= delayinterval;
            updateDelay();
        });

        toggleBtn.addEventListener('click', () => {
            isAutomated = !isAutomated;
            if (isAutomated) {
                toggleBtn.textContent = 'Stop';
                toggleBtn.style.backgroundColor = '#FF5722';
                statusEl.textContent = 'Running';
                startAutomation(qlEl, countEl);
            } else {
                toggleBtn.textContent = 'Start';
                toggleBtn.style.backgroundColor = '#4CAF50';
                statusEl.textContent = 'Stopped';
                stopAutomation();
            }
        });
    }

    function startAutomation(qlEl, countEl) {
        automationInterval = setInterval(() => {
            const sortButton = document.getElementById('derive_guidance_from_resource_target-btn');
            const qlHeader = document.getElementById('header-title');

            const ql = qlHeader?.innerText?.trim();
            currentQL = ql || '—';
            qlEl.textContent = currentQL;

            if (sortButton && sortButton.innerText.trim() === 'Sort to Target') {
                if (ql && ql !== lastQL) {
                    console.log(`Clicking 'Sort to Target' for QL: ${ql}`);
                    sortButton.click();
                    lastQL = ql;
                    itemCounter++;
                    countEl.textContent = itemCounter;
                }
            }
        }, delaySeconds * 1000);
    }

    function stopAutomation() {
        clearInterval(automationInterval);
    }

    window.addEventListener('load', () => {
        setTimeout(createControlPanel, 1000);
    });
})();
