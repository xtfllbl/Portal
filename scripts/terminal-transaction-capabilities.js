(() => {
    'use strict';

    const STORAGE_KEY = 'pw_terminal_transaction_capabilities';
    const UNATTENDED = new Set(['Vending Machine', 'EV Charging', 'Arcade Machine', 'Coffee Machine']);
    const ATTENDED = new Set(['Standalone Terminal', 'Terminal + ECR']);

    function readRecords() {
        const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid capability records');
        return value;
    }

    function normalizeIdentity(tci) {
        return /^(?:TC)?\d{8}$/i.test(tci || '') ? `TC${tci.replace(/^TC/i, '')}` : tci;
    }

    function resolveIdentity(tci, sn, fallback) {
        if (tci && tci !== '-') return normalizeIdentity(tci);
        try {
            const matched = Object.entries(readRecords()).find(([, record]) =>
                record?.sn && record.sn.toLowerCase() === sn.trim().toLowerCase());
            if (matched) return matched[0];
        } catch { /* Keep the known identity when browser storage cannot be read. */ }
        return fallback && fallback !== '-' ? normalizeIdentity(fallback) : `SN:${sn.trim().toUpperCase()}`;
    }

    function read(tci, sn = '') {
        try {
            tci = normalizeIdentity(tci);
            const records = readRecords();
            if (tci && Object.hasOwn(records, tci)) return records[tci];
            // Binding a known physical terminal can bring its saved capability choices into a new TCI.
            if (!sn) return null;
            const matched = Object.values(records).find((record) =>
                record && record.sn && record.sn.toLowerCase() === sn.trim().toLowerCase());
            if (matched) return matched;
            const leads = JSON.parse(localStorage.getItem('paywizard-upt-lead-overrides-v1') || '{}');
            return Object.values(leads).map((lead) => lead?.snAssignments?.[sn.trim().toUpperCase()])
                .find((assignment) => assignment && (UNATTENDED.has(assignment.scenario) || ATTENDED.has(assignment.scenario))) || null;
        } catch {
            return null;
        }
    }

    function createControls(prefix) {
        const element = document.createElement('div');
        element.className = 'terminal-capabilities';
        element.setAttribute('role', 'group');
        element.setAttribute('aria-label', 'Terminal transaction capabilities');
        for (const [key, label] of [['cardless', 'Supports Cardless Transactions'], ['routing', 'Supports Transaction Routing']]) {
            const wrapper = document.createElement('label');
            wrapper.className = 'terminal-capability-switch';
            wrapper.htmlFor = `${prefix}-${key}`;
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.id = wrapper.htmlFor;
            input.name = key === 'cardless' ? 'supportsCardlessTransactions' : 'supportsTransactionRouting';
            input.setAttribute('role', 'switch');
            input.setAttribute('aria-label', label);
            const track = document.createElement('span');
            track.className = 'terminal-capability-track';
            track.setAttribute('aria-hidden', 'true');
            const text = document.createElement('span');
            text.className = 'terminal-capability-label';
            text.textContent = label.replace(/^Supports /, 'Support ');
            wrapper.append(input, track, text);
            element.append(wrapper);
        }
        const error = document.createElement('div');
        error.className = 'terminal-capability-error';
        error.setAttribute('role', 'alert');
        error.tabIndex = -1;
        error.hidden = true;
        element.append(error);
        const cardless = element.querySelector(`#${prefix}-cardless`);
        const routing = element.querySelector(`#${prefix}-routing`);
        let scenario = '';

        function syncDependency() {
            if (!cardless.checked) routing.checked = false;
            routing.disabled = cardless.disabled || !cardless.checked;
        }
        cardless.addEventListener('change', () => {
            routing.checked = cardless.checked;
            syncDependency();
        });

        return {
            element,
            load(nextScenario, saved) {
                scenario = nextScenario;
                cardless.disabled = !UNATTENDED.has(scenario) && !ATTENDED.has(scenario);
                const enabled = UNATTENDED.has(scenario);
                cardless.checked = typeof saved?.cardless === 'boolean' ? saved.cardless : enabled;
                routing.checked = typeof saved?.routing === 'boolean' ? saved.routing : enabled;
                syncDependency();
                error.hidden = true;
            },
            changeScenario(nextScenario) {
                if ((!UNATTENDED.has(scenario) && !ATTENDED.has(scenario)) || UNATTENDED.has(nextScenario) !== UNATTENDED.has(scenario)) this.load(nextScenario);
                else scenario = nextScenario;
            },
            value() { return { scenario, cardless: cardless.checked, routing: cardless.checked && routing.checked }; },
            save(tci, sn, beforeError) {
                try {
                    if (!tci) throw new Error('Missing terminal configuration identity');
                    tci = normalizeIdentity(tci);
                    if (!UNATTENDED.has(scenario) && !ATTENDED.has(scenario)) throw new Error('Unknown terminal scenario');
                    const records = readRecords();
                    records[tci] = { sn: sn.trim(), scenario, cardless: cardless.checked, routing: cardless.checked && routing.checked };
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
                    error.hidden = true;
                    return true;
                } catch {
                    beforeError?.();
                    error.textContent = 'Unable to save terminal transaction capabilities. Check browser storage permissions and try again. Your selections have been kept.';
                    error.hidden = false;
                    error.scrollIntoView({ block: 'center' });
                    error.focus({ preventScroll: true });
                    return false;
                }
            }
        };
    }

    const api = { read, resolveIdentity, form: null, leadAssignment: null,
        mount(host, prefix) { const controls = createControls(prefix); host.append(controls.element); return controls; }
    };
    window.TerminalTransactionCapabilities = api;

    document.addEventListener('DOMContentLoaded', () => {
        const onboarding = Boolean(document.getElementById('onboard-device-scenario'));
        const scenario = document.getElementById(onboarding ? 'onboard-device-scenario' : 'device-terminal-scenario');
        if (scenario) {
            const prefix = onboarding ? 'onboard-device' : 'device';
            const tci = document.getElementById(`${prefix}-tci`);
            const sn = document.getElementById(`${prefix}-tpn`);
            const model = document.getElementById(`${prefix}-model`);
            const controls = createControls(prefix);
            scenario.closest('.form-grid').after(controls.element);
            const sourceTci = new URLSearchParams(location.search).get('sourceTci');
            const saved = read(sourceTci || tci?.value, sourceTci ? '' : sn?.value);
            if (saved?.scenario && [...scenario.options].some((option) => option.value === saved.scenario)) scenario.value = saved.scenario;
            controls.load(scenario.value, saved);
            scenario.addEventListener('change', () => controls.changeScenario(scenario.value));
            const syncModel = () => { controls.element.hidden = model?.value === 'Q3MINI-R'; };
            model?.addEventListener('change', syncModel);
            syncModel();
            api.form = {
                load(nextScenario, sourceIdentity) {
                    const saved = read(sourceIdentity);
                    const value = saved?.scenario || nextScenario;
                    if ([...scenario.options].some((option) => option.value === value)) scenario.value = value;
                    controls.load(scenario.value, saved);
                    syncModel();
                },
                save(beforeError) { return controls.element.hidden || controls.save(tci?.value, sn?.value || '', beforeError); }
            };
        }
        const leadScenario = document.getElementById('leadAssignScenario');
        if (leadScenario) {
            const controls = createControls('lead-assign');
            leadScenario.closest('.lead-assign-field').after(controls.element);
            const picker = window.PaywizardMerchantSelects.mount(leadScenario);
            controls.load('');
            leadScenario.addEventListener('change', () => controls.changeScenario(leadScenario.value));
            api.leadAssignment = {
                reset() { leadScenario.value = ''; controls.load(''); picker.refresh(); },
                value: () => controls.value(),
                close: () => picker.close()
            };
        }
    });
})();
