(function () {
    const root = document.getElementById('onboardingDeviceRoot');
    if (!root || typeof PROCESSOR_PARAMETER_SCHEMA === 'undefined') return;

    const TEMPLATE_KEY = 'pw_device_param_templates';
    const CARD_READER_CHANNEL_KEY = 'pw_card_reader_payment_channels';
    const CARD_READER_MODEL = 'Q3MINI-R';
    const PROCESSORS = ['TSYS', 'FISERV', 'ELAVON', 'NUVEI ATTD', 'NUVEI UPT', 'OXPAY'];
    const VERSIONS = {
        TSYS: ['v1.3.121'],
        FISERV: ['1.0.34_20260622'],
        ELAVON: ['v1.1.57'],
        'NUVEI ATTD': ['1.0.20_260622'],
        'NUVEI UPT': ['1.0.41_20260622'],
        OXPAY: ['v1.0.19_260609']
    };
    const KEY_PROCESSORS = new Set(['ELAVON', 'NUVEI ATTD', 'NUVEI UPT']);
    const DEFAULT_CARD_CHANNELS = [
        { name: 'ELAVON_EU_Reader', appVersions: [{ version: '2.8.4_20260619', active: true }] },
        { name: 'Nuvei_ATTD_Reader', appVersions: [] },
        { name: 'TSYS_Transit_Reader', appVersions: [{ version: '2.7.9_20260628', active: true }] },
        { name: 'Fiserv_Reader', appVersions: [] }
    ];

    const els = {
        tci: document.getElementById('onboard-device-tci'),
        sn: document.getElementById('onboard-device-tpn'),
        label: document.getElementById('onboard-device-label'),
        scenario: document.getElementById('onboard-device-scenario'),
        model: document.getElementById('onboard-device-model'),
        provision: document.getElementById('onboard-device-provision'),
        provisionLabel: document.getElementById('onboard-deployment-label'),
        deploymentTitle: document.getElementById('onboard-deployment-title'),
        deploymentOptions: document.getElementById('onboard-deployment-options'),
        processorLabel: document.getElementById('onboard-processor-label'),
        processor: document.getElementById('onboard-device-processor'),
        version: document.getElementById('onboard-processor-version'),
        versionField: document.getElementById('onboard-version-field'),
        integration: document.getElementById('onboard-device-integration'),
        injectKey: document.getElementById('onboard-inject-key'),
        keyOption: document.getElementById('onboard-key-option'),
        template: document.getElementById('onboard-device-template'),
        processorSection: document.getElementById('onboard-processor-params'),
        processorSets: document.getElementById('onboard-processor-param-sets'),
        errors: document.getElementById('onboard-device-errors')
    };
    let lastCardReaderMode = false;
    let terminalProcessor = '';
    let cardProcessor = '';
    let pendingTemplate = null;
    const processorVersions = new Map();

    function slug(value) {
        return String(value).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }

    function generateTci() {
        const values = new Uint32Array(1);
        if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(values);
        else values[0] = Math.floor(Math.random() * 100000000);
        return `TC${String(values[0] % 100000000).padStart(8, '0')}`;
    }

    function selectedText(select) {
        const option = select && select.options[select.selectedIndex];
        return option ? option.textContent.trim() : '';
    }

    function resolveOptions(spec) {
        if (Array.isArray(spec)) return spec;
        if (spec && spec !== 'binary' && typeof PROCESSOR_PARAMETER_OPTIONS !== 'undefined') {
            return PROCESSOR_PARAMETER_OPTIONS[spec] || [];
        }
        return [];
    }

    function syncSegment(input) {
        const segmented = input && input.parentElement.querySelector('.param-segmented');
        if (!segmented) return;
        segmented.querySelectorAll('.param-segment').forEach((button) => {
            const selected = button.dataset.value === input.value;
            button.classList.toggle('is-selected', selected);
            button.setAttribute('aria-pressed', String(selected));
        });
    }

    function createParameterField(namespace, fieldData) {
        const [key, labelText, tooltipText, defaultValue, required, minLength, maxLength, rule, optionSpec] = fieldData;
        const field = document.createElement('div');
        field.className = 'field';
        const inputId = `param-${slug(namespace)}-${slug(key)}`;
        const label = document.createElement('label');
        label.htmlFor = inputId;
        label.append(document.createTextNode(labelText));
        if (required) {
            const requiredMark = document.createElement('span');
            requiredMark.className = 'required-mark';
            requiredMark.textContent = '*';
            label.appendChild(requiredMark);
        }

        if (tooltipText && tooltipText !== labelText) {
            const line = document.createElement('div');
            line.className = 'param-label-line';
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'param-info-button';
            button.textContent = '!';
            button.setAttribute('aria-label', `About ${labelText}`);
            const tooltip = document.createElement('span');
            tooltip.className = 'param-tooltip';
            tooltip.role = 'tooltip';
            tooltip.textContent = tooltipText;
            line.append(label, button, tooltip);
            field.appendChild(line);
        } else {
            field.appendChild(label);
        }

        const control = document.createElement('div');
        control.className = 'param-control';
        let input;
        if (optionSpec === 'binary') {
            input = document.createElement('input');
            input.type = 'hidden';
            input.value = defaultValue;
            const segmented = document.createElement('div');
            segmented.className = 'param-segmented';
            segmented.setAttribute('role', 'group');
            segmented.setAttribute('aria-label', labelText);
            [['1', 'Enable'], ['0', 'Disable']].forEach(([value, text]) => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'param-segment';
                button.dataset.value = value;
                button.textContent = text;
                segmented.appendChild(button);
            });
            control.append(input, segmented);
        } else if (optionSpec) {
            input = document.createElement('select');
            input.className = 'param-input parameter-value';
            const options = resolveOptions(optionSpec);
            if (!defaultValue || !options.some(([value]) => value === defaultValue)) {
                input.appendChild(new Option(`Select ${labelText}`, ''));
            }
            options.forEach(([value, text]) => input.appendChild(new Option(text, value)));
            input.value = defaultValue;
            control.appendChild(input);
        } else {
            input = document.createElement('input');
            input.type = 'text';
            input.className = 'param-input parameter-value';
            input.value = defaultValue;
            if (minLength && Number(minLength) > 0) input.minLength = Number(minLength);
            if (maxLength) input.maxLength = Number(maxLength);
            if (rule === 'N') {
                input.inputMode = 'numeric';
                input.pattern = '[0-9]*';
            } else if (rule && rule !== 'ANS' && rule !== 'NS') {
                input.pattern = rule;
            }
            control.appendChild(input);
        }
        input.id = inputId;
        input.name = `${namespace}.${key}`;
        input.dataset.parameterKey = key;
        input.dataset.defaultValue = defaultValue;
        input.classList.add('parameter-value');
        if (required) input.required = true;
        field.appendChild(control);
        const error = document.createElement('div');
        error.className = 'param-error';
        error.id = `${inputId}-error`;
        error.setAttribute('role', 'alert');
        field.appendChild(error);
        syncSegment(input);
        return field;
    }

    function createSchemaSet(namespace, groups, activeByDefault) {
        const set = document.createElement('div');
        set.className = `param-set${activeByDefault ? ' active' : ''}`;
        set.dataset.processor = namespace;
        const tabs = document.createElement('div');
        tabs.className = 'param-tabs';
        tabs.setAttribute('role', 'tablist');
        tabs.setAttribute('aria-label', `${namespace} parameter groups`);
        groups.forEach(([groupName], index) => {
            const key = `${slug(namespace)}-${slug(groupName)}`;
            const tab = document.createElement('button');
            tab.type = 'button';
            tab.className = `param-tab${index === 0 ? ' active' : ''}`;
            tab.dataset.tab = key;
            tab.id = `${key}-tab`;
            tab.setAttribute('role', 'tab');
            tab.setAttribute('aria-controls', `${key}-panel`);
            tab.setAttribute('aria-selected', String(index === 0));
            tab.textContent = groupName;
            tabs.appendChild(tab);
        });
        set.appendChild(tabs);
        groups.forEach(([groupName, fields], index) => {
            const key = `${slug(namespace)}-${slug(groupName)}`;
            const panel = document.createElement('div');
            panel.className = `param-panel${index === 0 ? ' active' : ''}`;
            panel.dataset.panel = key;
            panel.id = `${key}-panel`;
            panel.setAttribute('role', 'tabpanel');
            panel.setAttribute('aria-labelledby', `${key}-tab`);
            const group = document.createElement('div');
            group.className = 'param-group';
            const grid = document.createElement('div');
            grid.className = 'group-grid';
            fields.forEach((field) => grid.appendChild(createParameterField(namespace, field)));
            group.appendChild(grid);
            panel.appendChild(group);
            set.appendChild(panel);
        });
        return set;
    }

    function renderSchemas() {
        Object.entries(PROCESSOR_PARAMETER_SCHEMA).forEach(([processor, groups]) => {
            els.processorSets.appendChild(createSchemaSet(processor, groups, false));
        });
    }

    function activateTab(tab) {
        const set = tab.closest('.param-set');
        if (!set) return;
        set.querySelectorAll('.param-tab').forEach((item) => {
            const active = item === tab;
            item.classList.toggle('active', active);
            item.setAttribute('aria-selected', String(active));
        });
        set.querySelectorAll('.param-panel').forEach((panel) => {
            panel.classList.toggle('active', panel.dataset.panel === tab.dataset.tab);
        });
    }

    root.addEventListener('click', (event) => {
        const tab = event.target.closest('.param-tab');
        if (tab) activateTab(tab);
        const segment = event.target.closest('.param-segment');
        if (segment) {
            const input = segment.closest('.param-control').querySelector('.parameter-value');
            input.value = segment.dataset.value;
            syncSegment(input);
            input.dispatchEvent(new Event('change', { bubbles: true }));
        }
    });

    function loadCardChannels() {
        try {
            const stored = JSON.parse(localStorage.getItem(CARD_READER_CHANNEL_KEY) || 'null');
            const channels = Array.isArray(stored) && stored.length ? stored : DEFAULT_CARD_CHANNELS;
            return channels.filter((channel) => channel && channel.name && !/opc/i.test(channel.name));
        } catch (error) {
            return DEFAULT_CARD_CHANNELS;
        }
    }

    function channelProcessor(name) {
        const normalized = String(name).toLowerCase();
        if (normalized.includes('elavon')) return 'ELAVON';
        if (normalized.includes('nuvei')) return 'NUVEI ATTD';
        if (normalized.includes('tsys')) return 'TSYS';
        if (normalized.includes('fiserv')) return 'FISERV';
        if (normalized.includes('oxpay')) return 'OXPAY';
        return '';
    }

    function isCardReader() {
        return els.model.value === CARD_READER_MODEL;
    }

    function renderProcessorOptions() {
        const cardMode = isCardReader();
        if (lastCardReaderMode) cardProcessor = els.processor.value;
        else terminalProcessor = els.processor.value;
        els.processor.innerHTML = '';
        els.processor.appendChild(new Option(cardMode ? 'Select Payment Channel' : 'Select Processor', ''));
        if (cardMode) {
            loadCardChannels().forEach((channel) => {
                const option = new Option(channel.name, channelProcessor(channel.name));
                option.dataset.channelName = channel.name;
                els.processor.appendChild(option);
            });
            els.processor.value = cardProcessor;
        } else {
            PROCESSORS.forEach((processor) => els.processor.appendChild(new Option(processor, processor)));
            els.processor.value = terminalProcessor;
        }
        lastCardReaderMode = cardMode;
    }

    function populateVersions() {
        const preserved = processorVersions.get(els.processor.value) || '';
        els.version.innerHTML = '';
        if (isCardReader()) {
            els.version.appendChild(new Option('Not Required', ''));
            els.version.disabled = true;
            return;
        }
        const versions = VERSIONS[els.processor.value] || [];
        els.version.appendChild(new Option('Select Version', ''));
        versions.forEach((version) => els.version.appendChild(new Option(version, version)));
        els.version.disabled = versions.length === 0;
        els.version.value = versions.includes(preserved) ? preserved : (versions[0] || '');
    }

    function syncProcessor() {
        const processor = els.processor.value;
        if (isCardReader()) cardProcessor = processor;
        else terminalProcessor = processor;
        populateVersions();
        els.processorSection.classList.toggle('is-hidden', !processor || !els.provision.checked);
        els.processorSets.querySelectorAll('.param-set').forEach((set) => {
            set.classList.toggle('active', set.dataset.processor === processor);
        });
        els.keyOption.classList.toggle('is-hidden', !els.provision.checked || !KEY_PROCESSORS.has(processor));
    }

    function syncDeploymentMode() {
        renderProcessorOptions();
        const cardMode = isCardReader();
        els.deploymentTitle.textContent = cardMode ? 'Card Reader Deployment' : 'Payment App Deployment';
        els.provisionLabel.textContent = cardMode ? 'Deploy parameters' : 'Deploy app & parameters';
        els.processorLabel.textContent = cardMode ? 'Payment Channel *' : 'Processor / Acquirer *';
        els.versionField.classList.toggle('is-hidden', cardMode);
        syncProcessor();
    }

    function syncProvision() {
        els.deploymentOptions.classList.toggle('is-disabled', !els.provision.checked);
        syncProcessor();
    }

    function setFieldError(input, message) {
        if (!input) return;
        const field = input.closest('.field');
        const error = document.getElementById(`${input.id}-error`);
        input.setCustomValidity(message || '');
        if (field) field.classList.toggle('has-error', Boolean(message));
        if (error) {
            error.textContent = message || '';
            error.classList.toggle('is-visible', Boolean(message));
        }
    }

    function validateElavon() {
        if (els.processor.value !== 'ELAVON') return true;
        const mid = document.getElementById('param-elavon-mid');
        const system = document.getElementById('param-elavon-systemid');
        const tid = document.getElementById('param-elavon-tid');
        if (!mid || !system || !tid) return true;
        setFieldError(system, '');
        setFieldError(tid, '');
        if (!mid.value.trim() || !system.value.trim()) return true;
        if (!system.value.trim().startsWith(mid.value.trim())) {
            setFieldError(system, 'System ID must be Merchant ID + Terminal Suffix.');
            return false;
        }
        const suffix = system.value.trim().slice(mid.value.trim().length);
        if (!suffix || suffix.length > 8) {
            setFieldError(system, 'System ID must include a terminal suffix of up to 8 characters.');
            return false;
        }
        const expected = suffix.padStart(8, '0');
        if (!tid.value.trim()) tid.value = expected;
        if (tid.value.trim() !== expected) {
            setFieldError(tid, 'Terminal ID must use the System ID suffix, padded to 8 characters.');
            return false;
        }
        return true;
    }

    function activeValidationControls() {
        const controls = [els.model, els.scenario];
        if (!els.provision.checked) return controls;
        controls.push(els.processor);
        if (!isCardReader()) controls.push(els.version);
        const activeSet = els.processorSets.querySelector(`.param-set[data-processor="${CSS.escape(els.processor.value)}"]`);
        if (activeSet) controls.push(...activeSet.querySelectorAll('.parameter-value'));
        return controls.filter((control) => control && control.type !== 'hidden');
    }

    function exposeInvalidControl(control) {
        const panel = control.closest('.param-panel');
        if (panel && !panel.classList.contains('active')) {
            const tab = panel.parentElement.querySelector(`.param-tab[data-tab="${panel.dataset.panel}"]`);
            if (tab) activateTab(tab);
        }
        control.closest('.field')?.classList.add('has-error');
        const error = document.getElementById(`${control.id}-error`);
        if (error) {
            error.textContent = control.validationMessage || 'Enter a valid value.';
            error.classList.add('is-visible');
        }
    }

    function validateDevice() {
        els.errors.classList.add('is-hidden');
        root.querySelectorAll('.field.has-error').forEach((field) => field.classList.remove('has-error'));
        const relationshipValid = !els.provision.checked || validateElavon();
        const controls = activeValidationControls();
        const invalidControls = controls.filter((control) => !control.checkValidity());
        invalidControls.forEach(exposeInvalidControl);
        const invalid = invalidControls[0];
        if (!relationshipValid || invalid) {
            const first = invalid || root.querySelector('[aria-invalid="true"], .field.has-error input');
            if (first) {
                exposeInvalidControl(first);
                first.focus();
                first.reportValidity?.();
            }
            els.errors.textContent = 'Complete the highlighted required fields before continuing to Review.';
            els.errors.classList.remove('is-hidden');
            return false;
        }
        syncReview();
        return true;
    }

    function collectValues(container) {
        const values = {};
        container.querySelectorAll('.parameter-value').forEach((input) => {
            if (input.id) values[input.id] = input.value;
        });
        return values;
    }

    function activeProcessorSet() {
        return els.processorSets.querySelector('.param-set.active');
    }

    function currentConfiguration() {
        return {
            processorKey: els.processor.value,
            processorLabel: selectedText(els.processor),
            version: els.version.value,
            integration: els.integration.value,
            injectKey: els.injectKey.checked,
            processor: collectValues(activeProcessorSet() || document.createElement('div'))
        };
    }

    function loadTemplates() {
        try {
            const value = JSON.parse(localStorage.getItem(TEMPLATE_KEY) || '[]');
            return Array.isArray(value) ? value : [];
        } catch (error) {
            return [];
        }
    }

    function refreshTemplates(selectedName) {
        els.template.innerHTML = '<option value="">Select Template</option>';
        loadTemplates().forEach((template, index) => {
            const option = new Option(template.name || `Template ${index + 1}`, `__tpl_${index}`);
            if (selectedName && template.name === selectedName) option.selected = true;
            els.template.appendChild(option);
        });
    }

    function applyValues(values) {
        Object.entries(values || {}).forEach(([id, value]) => {
            const input = document.getElementById(id);
            if (!input || !root.contains(input)) return;
            input.value = value;
            syncSegment(input);
        });
    }

    function applyTemplate(template) {
        const config = template.configuration || template;
        if (config.processorKey && PROCESSORS.includes(config.processorKey)) {
            if (isCardReader()) cardProcessor = config.processorKey;
            else terminalProcessor = config.processorKey;
            renderProcessorOptions();
            els.processor.value = config.processorKey;
        }
        syncProcessor();
        if (config.version) els.version.value = config.version;
        if (config.integration) els.integration.value = config.integration;
        if (typeof config.injectKey === 'boolean') els.injectKey.checked = config.injectKey;
        applyValues(config.processor || template.processor);
        validateElavon();
        showToast('Template applied');
    }

    function openModal(modal, focus) {
        modal.classList.remove('is-hidden');
        setTimeout(() => focus?.focus(), 0);
    }

    function closeModal(modal) {
        modal.classList.add('is-hidden');
    }

    const saveModal = document.getElementById('deviceTemplateModal');
    const confirmModal = document.getElementById('deviceTemplateConfirmModal');
    const templateName = document.getElementById('deviceTemplateName');
    const saveTemplateButton = document.getElementById('saveDeviceTemplateBtn');

    saveTemplateButton?.addEventListener('click', () => {
        if (els.provision.checked && !els.processor.value) {
            els.errors.textContent = 'Select a Processor / Acquirer before saving a parameter template.';
            els.errors.classList.remove('is-hidden');
            els.processor.focus();
            return;
        }
        templateName.value = '';
        openModal(saveModal, templateName);
    });
    document.getElementById('cancelDeviceTemplate')?.addEventListener('click', () => closeModal(saveModal));
    document.getElementById('confirmDeviceTemplate')?.addEventListener('click', () => {
        const name = templateName.value.trim();
        if (!name) {
            templateName.focus();
            templateName.setCustomValidity('Enter a template name.');
            templateName.reportValidity();
            return;
        }
        templateName.setCustomValidity('');
        const templates = loadTemplates();
        const configuration = currentConfiguration();
        templates.unshift({ name, configuration, processor: configuration.processor });
        localStorage.setItem(TEMPLATE_KEY, JSON.stringify(templates));
        refreshTemplates(name);
        closeModal(saveModal);
        showToast('Template saved');
    });

    els.template.addEventListener('change', () => {
        const index = Number(els.template.value.replace('__tpl_', ''));
        const template = loadTemplates()[index];
        if (!template) return;
        pendingTemplate = template;
        const hasInput = Boolean(els.processor.value || els.integration.value !== 'Disable');
        if (hasInput) openModal(confirmModal, document.getElementById('confirmDeviceTemplateApply'));
        else {
            applyTemplate(template);
            pendingTemplate = null;
        }
    });
    document.getElementById('cancelDeviceTemplateApply')?.addEventListener('click', () => {
        pendingTemplate = null;
        els.template.value = '';
        closeModal(confirmModal);
    });
    document.getElementById('confirmDeviceTemplateApply')?.addEventListener('click', () => {
        if (pendingTemplate) applyTemplate(pendingTemplate);
        pendingTemplate = null;
        closeModal(confirmModal);
    });

    function showToast(message, delay = 0) {
        setTimeout(() => {
            const stack = document.getElementById('deviceToastStack');
            const toast = document.createElement('div');
            toast.className = 'device-toast';
            toast.innerHTML = '<div class="device-toast-title">Success</div>' +
                `<div class="device-toast-message"></div><button class="device-toast-close" type="button" aria-label="Dismiss">&times;</button>`;
            toast.querySelector('.device-toast-message').textContent = message;
            toast.querySelector('.device-toast-close').addEventListener('click', () => toast.remove());
            stack.appendChild(toast);
            setTimeout(() => toast.remove(), 7000);
        }, delay);
    }

    function setReview(id, value, fallback = 'Not provided') {
        const element = document.getElementById(id);
        if (element) element.textContent = value || fallback;
    }

    function syncReview() {
        const hasSn = Boolean(els.sn.value.trim());
        const cardTitle = document.getElementById('review-device-card-title');
        if (cardTitle) cardTitle.textContent = hasSn ? 'Device' : 'Device Configuration';
        setReview('review-device-tci', els.tci.value);
        setReview('review-device-tpn', hasSn ? els.sn.value.trim() : 'Not assigned');
        setReview('review-device-processor', els.provision.checked ? selectedText(els.processor) : 'Not configured');
        setReview('review-device-scenario', els.scenario.value);
        setReview('review-processor-version', els.provision.checked ? (isCardReader() ? 'Not required' : selectedText(els.version)) : 'Not configured');
        setReview('review-device-paywizard', els.provision.checked ? selectedText(els.integration) : 'Not configured');
        setReview('review-device-model', els.model.value);
        setReview('review-device-deployment', !hasSn ? 'Configuration only — no device assigned' : (els.provision.checked ? (isCardReader() ? 'Parameters queued' : 'App & parameters queued') : 'Device only'));
        const injectVisible = !els.keyOption.classList.contains('is-hidden');
        setReview('review-device-inject-key', injectVisible ? (els.injectKey.checked ? 'Yes' : 'No') : 'Not applicable');
    }

    function setMockValue(input, value) {
        if (!input) return;
        if (input.type === 'checkbox') input.checked = Boolean(value);
        else input.value = value;
        if (input.type === 'hidden') syncSegment(input);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function fillMockData() {
        setMockValue(els.sn, 'WP5111QC33000050');
        setMockValue(els.label, 'Front Counter');
        setMockValue(els.scenario, 'Vending Machine');
        setMockValue(els.model, 'Q2');
        setMockValue(els.provision, true);
        setMockValue(els.processor, 'OXPAY');
        setMockValue(els.version, VERSIONS.OXPAY[0]);
        setMockValue(els.integration, 'Disable');
        setMockValue(els.injectKey, false);
        setMockValue(els.template, '');

        const requiredValues = {
            'merchant name': 'Mock Coffee Market',
            'merchant phone': '6155550100',
            'merchant email': 'merchant.mock@example.com'
        };
        activeProcessorSet()?.querySelectorAll('.parameter-value').forEach((input) => {
            const key = String(input.dataset.parameterKey || '').toLowerCase();
            let value = input.dataset.defaultValue || '';
            if (input.required && !value) value = requiredValues[key] || (input.options ? input.options[1]?.value : 'MOCK01');
            setMockValue(input, value);
        });

        els.errors.classList.add('is-hidden');
        root.querySelectorAll('.field.has-error').forEach((field) => field.classList.remove('has-error'));
        root.querySelectorAll('.parameter-value').forEach((input) => input.setCustomValidity(''));
        syncReview();
    }

    function showCompletionToasts() {
        const hasSn = Boolean(els.sn.value.trim());
        showToast('Merchant add success', 0);
        showToast('Store add success', 180);
        showToast(hasSn ? 'Device add success' : 'Device configuration save success', 360);
        const subtitle = document.getElementById('reviewHeroSubtitle');
        if (subtitle) subtitle.textContent = hasSn
            ? 'Merchant, store, and terminal push are completed.'
            : 'Merchant, store, and device configuration are completed.';
        syncReview();
    }

    els.model.addEventListener('change', syncDeploymentMode);
    els.provision.addEventListener('change', syncProvision);
    els.processor.addEventListener('change', syncProcessor);
    els.version.addEventListener('change', () => {
        if (els.processor.value) processorVersions.set(els.processor.value, els.version.value);
    });
    [els.sn, els.label, els.scenario, els.model, els.processor, els.version, els.integration, els.injectKey, els.provision].forEach((input) => {
        input?.addEventListener('change', syncReview);
        input?.addEventListener('input', syncReview);
    });
    root.addEventListener('input', (event) => {
        const input = event.target.closest('.parameter-value');
        if (!input || !input.checkValidity()) return;
        input.closest('.field')?.classList.remove('has-error');
        const error = document.getElementById(`${input.id}-error`);
        if (error && !input.validationMessage) {
            error.textContent = '';
            error.classList.remove('is-visible');
        }
    });
    const onboardButton = document.getElementById('onboardMerchantBtn');
    onboardButton?.addEventListener('click', showCompletionToasts);

    document.querySelectorAll('.device-modal').forEach((modal) => {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) closeModal(modal);
        });
    });
    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        document.querySelectorAll('.device-modal:not(.is-hidden)').forEach(closeModal);
    });

    els.tci.value = generateTci();
    renderSchemas();
    ['param-elavon-mid', 'param-elavon-systemid', 'param-elavon-tid'].forEach((id) => {
        document.getElementById(id)?.addEventListener('input', validateElavon);
    });
    refreshTemplates();
    renderProcessorOptions();
    syncDeploymentMode();
    syncProvision();
    syncReview();
    window.validateOnboardingDevice = validateDevice;
    window.syncOnboardingDeviceReview = syncReview;
    window.onboardingDevice = { validate: validateDevice, syncReview, getConfiguration: currentConfiguration, fillMockData };
})();
