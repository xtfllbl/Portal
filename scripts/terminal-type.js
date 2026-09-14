(function(){
    'use strict';

    const STORAGE_KEY = 'paywizard.nayaxTerminalTypes.v1';
    const DEFAULT_TYPE = document.getElementById('terminalTypeCard')?.dataset.defaultType || 'unattended_vending';
    const typeGroups = [
        { label: 'Attended Scenarios', items: ['attended_standalone', 'attended_pos_linked'] },
        { label: 'Unattended Scenarios', items: ['unattended_vending', 'unattended_ev', 'unattended_arcade', 'unattended_coffee'] }
    ];
    const typeMap = {
        attended_standalone: { label: 'Standalone Terminal', attendance: 'Attended', icon: 'assets/icons/terminal-standalone.svg' },
        attended_pos_linked: { label: 'Terminal + ECR', attendance: 'Attended', icon: 'assets/icons/terminal-ecr.svg' },
        unattended_vending: { label: 'Vending Machine', attendance: 'Unattended', icon: 'assets/icons/terminal-vending.svg' },
        unattended_ev: { label: 'EV Charging', attendance: 'Unattended', icon: 'assets/icons/terminal-ev.svg' },
        unattended_arcade: { label: 'Arcade Machine', attendance: 'Unattended', icon: 'assets/icons/terminal-arcade.svg' },
        unattended_coffee: { label: 'Coffee Machine', attendance: 'Unattended', icon: 'assets/icons/terminal-coffee.svg' }
    };
    const card = document.getElementById('terminalTypeCard');
    const button = document.getElementById('terminalTypeButton');
    const menu = document.getElementById('terminalTypeOptions');
    const modal = document.getElementById('terminalTypeModal');
    const cancelButton = document.getElementById('terminalTypeCancel');
    const summary = document.getElementById('terminalTypeSummary');
    const icon = document.getElementById('terminalTypeIcon');
    const attendance = document.getElementById('terminalTypeAttendance');
    const typeName = document.getElementById('terminalTypeName');
    const toast = document.getElementById('prototypeToast');
    if(!card || !button || !menu || !modal || !cancelButton || !summary || !icon || !attendance || !typeName) return;

    const isValidType = key => Object.prototype.hasOwnProperty.call(typeMap, key);
    const readStore = () => {
        try {
            const raw = window.sessionStorage.getItem(STORAGE_KEY);
            if(!raw) return {};
            const parsed = JSON.parse(raw);
            if(!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid terminal type state');
            return parsed;
        } catch(error){
            try { window.sessionStorage.removeItem(STORAGE_KEY); } catch(ignore) {}
            return {};
        }
    };
    const initialStore = readStore();
    const queryType = new URLSearchParams(window.location.search).get('terminalType') || '';
    let currentTypeKey = isValidType(initialStore[terminalContext.sn])
        ? initialStore[terminalContext.sn]
        : isValidType(queryType) ? queryType : DEFAULT_TYPE;
    let toastTimer = 0;

    function escapeHtml(value){
        return String(value == null ? '' : value).replace(/[&<>"']/g, char => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[char]));
    }
    function attendanceClass(mode){
        return mode.attendance === 'Attended' ? 'attended' : 'unattended';
    }
    function showTerminalTypeToast(message){
        if(!toast) return;
        window.clearTimeout(toastTimer);
        toast.textContent = message;
        toast.classList.add('show');
        toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2600);
    }
    function persistCurrentType(){
        try {
            const state = readStore();
            state[terminalContext.sn] = currentTypeKey;
            window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            return true;
        } catch(error){
            return false;
        }
    }
    function renderCard(){
        const mode = typeMap[currentTypeKey] || typeMap[DEFAULT_TYPE];
        const kind = attendanceClass(mode);
        summary.className = `terminal-type-summary ${kind}`;
        icon.className = `terminal-type-icon ${kind}`;
        icon.innerHTML = `<img src="${mode.icon}" alt="">`;
        attendance.textContent = mode.attendance;
        attendance.className = `terminal-type-attendance ${kind}`;
        typeName.textContent = mode.label;
        button.setAttribute('aria-label', `Edit terminal type, current ${mode.label}`);
    }
    function renderMenu(){
        menu.innerHTML = `${typeGroups.map(group => `
            <div class="terminal-type-group" role="group" aria-label="${escapeHtml(group.label)}">
                <div class="terminal-type-group-label">${escapeHtml(group.label)}</div>
                ${group.items.map(key => {
                    const mode = typeMap[key];
                    const current = key === currentTypeKey;
                    return `<button class="terminal-type-option${current ? ' current' : ''}" type="button" role="menuitem" data-terminal-type="${key}"${current ? ' disabled aria-current="true"' : ''}>
                        <span class="terminal-type-option-icon ${attendanceClass(mode)}" aria-hidden="true"><img src="${mode.icon}" alt=""></span>
                        <strong>${escapeHtml(mode.label)}</strong>
                        ${current ? '<span class="terminal-type-current">Current</span>' : ''}
                    </button>`;
                }).join('')}
            </div>
        `).join('')}`;
    }
    function menuItems(){
        return Array.from(menu.querySelectorAll('.terminal-type-option:not([disabled])'));
    }
    function setModalOpen(open, focusEdge){
        modal.classList.toggle('open', open);
        modal.setAttribute('aria-hidden', String(!open));
        button.setAttribute('aria-expanded', String(open));
        if(open){
            document.body.classList.add('feature-modal-open');
            renderMenu();
            if(focusEdge){
                window.requestAnimationFrame(() => {
                    if(!modal.classList.contains('open')) return;
                    const items = menuItems();
                    const target = focusEdge === 'last' ? items[items.length - 1] : items[0];
                    if(target) target.focus({ preventScroll: true });
                });
            }
        } else {
            if(!document.querySelector('.feature-modal-overlay.open')) document.body.classList.remove('feature-modal-open');
            if(focusEdge === 'button') button.focus();
        }
    }
    function applyType(key){
        if(!isValidType(key) || key === currentTypeKey) return;
        currentTypeKey = key;
        const saved = persistCurrentType();
        renderCard();
        renderMenu();
        const label = typeMap[currentTypeKey].label;
        setModalOpen(false, 'button');
        showTerminalTypeToast(saved
            ? `Terminal type changed to ${label}.`
            : `Terminal type changed to ${label} until this page is refreshed.`);
        document.dispatchEvent(new CustomEvent('terminaltype:changed', {
            detail: { sn: terminalContext.sn, type: currentTypeKey, label }
        }));
    }

    button.addEventListener('click', event => {
        event.stopPropagation();
        setModalOpen(true, 'first');
    });
    button.addEventListener('keydown', event => {
        if(event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
        event.preventDefault();
        setModalOpen(true, event.key === 'ArrowDown' ? 'first' : 'last');
    });
    menu.addEventListener('click', event => {
        const option = event.target.closest('[data-terminal-type]');
        if(!option || option.disabled) return;
        applyType(option.getAttribute('data-terminal-type'));
    });
    menu.addEventListener('keydown', event => {
        const items = menuItems();
        if(!items.length) return;
        if(event.key === 'Escape'){
            event.preventDefault();
            setModalOpen(false, 'button');
            return;
        }
        if(!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const currentIndex = items.indexOf(document.activeElement);
        let nextIndex = currentIndex;
        if(event.key === 'Home') nextIndex = 0;
        if(event.key === 'End') nextIndex = items.length - 1;
        if(event.key === 'ArrowDown') nextIndex = (currentIndex + 1 + items.length) % items.length;
        if(event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + items.length) % items.length;
        items[nextIndex].focus();
    });
    cancelButton.addEventListener('click', () => setModalOpen(false, 'button'));
    modal.addEventListener('click', event => {
        if(event.target === modal) setModalOpen(false, 'button');
    });
    document.addEventListener('keydown', event => {
        if(!modal.classList.contains('open')) return;
        if(event.key === 'Escape'){
            event.preventDefault();
            setModalOpen(false, 'button');
            return;
        }
        if(event.key !== 'Tab') return;
        const focusable = [...menuItems(), cancelButton];
        if(!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if(event.shiftKey && document.activeElement === first){
            event.preventDefault();
            last.focus();
        } else if(!event.shiftKey && document.activeElement === last){
            event.preventDefault();
            first.focus();
        }
    });

    renderCard();
    renderMenu();
})();
