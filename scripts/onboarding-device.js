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

    const OPC_SCHEMA = [
        ['OPERTAION MODE', [
            ['OperatingMode', 'Operating Mode', 'OperatingMode', '0', false, null, null, null, [['0', 'UPT'], ['1', 'BIZHI'], ['2', 'ATTENDANCE'], ['3', 'SenseTime'], ['4', 'SERIAL_MODE'], ['5', 'YinXiang'], ['6', 'OpenableLocker'], ['7', 'MultiPrice'], ['8', 'FixedPrice']]],
            ['ProtocolType', 'Protocol Type', 'Protocol Type', '12', false, null, null, null, [['0', 'SERIAL HOST'], ['1', 'MDB'], ['2', 'PAX-ECR'], ['3', 'SERIAL SLAVE'], ['4', 'SERIAL EXT'], ['5', 'SOCKET SERVER'], ['6', 'SERIAL CDC'], ['7', 'SERIAL VENDOR'], ['8', 'PULSE MODE'], ['9', 'SERIAL EXT2'], ['10', 'USB ACCESSORY'], ['11', 'CLOUD MODE'], ['12', 'DEFAULT'], ['13', 'BLUETOOTH SPP']]],
            ['UrlType', 'Paywizard Server', 'UrlType', '2', false, null, null, null, [['0', 'DEBUG'], ['1', 'UAT'], ['2', 'RELEASE'], ['3', 'TEST'], ['4', 'DEV']]],
            ['UiRunMode', 'OPC UI Run Mode', '0 follow ProtocolType; 1 foreground with kiosk; 2 background without kiosk', '0', false, null, null, null, [['0', 'Follow ProtocolType'], ['1', 'Foreground'], ['2', 'Background']]]
        ]],
        ['PAYMENT APP', [
            ['EnableDebugMode', 'Debug Mode', 'EnableDebugMode', '0', false, null, null, null, 'binary'],
            ['HomePaymentIcons', 'Home Payment Icons', 'Comma-separated preset keys or image URLs; empty = app default', '', false, '0', '8000', 'ANS', null],
            ['HomeAnimationUrl', 'Home Animation Url', 'Home ready-state guide animation URL; empty=built-in Lottie', '', false, '0', '2000', 'ANS', null],
            ['EnableNetworkDisconnectReboot', 'Enable Network Disconnect Reboot', 'Reboot device after network disconnected for 5 minutes; default disabled', '0', false, null, null, null, 'binary'],
            ['AidlPackageName', 'Payment App', 'Payment App ID', 'com.wizarpos.paywizard.demo', false, '0', '128', 'ANS', null],
            ['CurrencyCode', 'Currency Code', 'CurrencyCode', '', true, '0', '3', 'N', null],
            ['NeedCheckParam', 'Check Param', 'Need Check Param', '0', false, null, null, null, 'binary'],
            ['KeyState', 'Check KeyState', 'KeyState', '0', false, null, null, null, 'binary'],
            ['paymentTimeout', 'Payment Timeout(s)', 'paymentTimeout', '180', true, '1', '5', 'N', null],
            ['IsSimplify', 'JSON parameters', 'IsSimplify', '0', false, null, null, null, [['1', 'Simplify'], ['0', 'All parameters']]],
            ['CustomerServiceHotline', 'Customer Hotline', 'Customer Service Hotline', '', false, '0', '15', 'ANS', null],
            ['ClientId', 'ClientId', 'ClientId', '', false, '0', '50', 'ANS', null],
            ['ClientSecret', 'ClientSecret', 'ClientSecret', '', false, '0', '50', 'ANS', null],
            ['JwtToken', 'JwtToken', 'JwtToken', '', false, '0', '50', 'ANS', null],
            ['EnableOpcTakeoverUi', 'Enable OPC Takeover UI', 'OPC takes over payment UI', '0', false, null, null, null, 'binary'],
            ['EnableWhiteBin', 'Enable White Bin', 'EnableWhiteBin', '0', false, null, null, null, 'binary'],
            ['WhiteBinVersion', 'White Bin Version', 'WhiteBinVersion', '', false, '0', '64', 'ANS', null],
            ['WhiteBinList', 'White Bin List', 'Comma-separated package names or paths', '', false, '0', '8000', 'ANS', null]
        ]],
        ['ATTENDANCE MODE', [
            ['CreditCards', 'CreditCards', 'CreditCards', '1', false, null, null, null, 'binary'],
            ['DigitalWallets', 'DigitalWallets', 'DigitalWallets', '0', false, null, null, null, 'binary'],
            ['Loyalty', 'Loyalty', 'Loyalty', '0', false, null, null, null, 'binary'],
            ['EnableCardReaderTapUi', 'Enable Card Reader Tap UI', 'Use native card reader tap animation', '0', false, null, null, null, 'binary']
        ]],
        ['UPT MODE', [
            ['AdminPass', 'Admin Password', 'Admin Passwd', '99999999', false, '0', '8', 'ANS', null],
            ['operationPass', 'Operation Password', 'operation Pass', '88888888', false, '0', '8', 'ANS', null],
            ['AllowOfflineMode', 'AllowOfflineMode', 'AllowOfflineMode', '0', false, null, null, null, 'binary'],
            ['AmountScale', 'AmountScale', 'AmountScale', '0', false, null, null, null, [['0', 'DEFAULT'], ['10', 'Multiply 10'], ['100', 'Multiply 100'], ['-10', 'Divide 10'], ['-100', 'Divide 100']]],
            ['QrMid', 'QrMid', 'QrMid', '', false, '0', '64', 'ANS', null],
            ['QrScanChannel', 'Qr Scan Channel', 'QR pay scanChannel', 'PAY_DATA_CLOUD', false, null, null, null, [['M_PAY', 'MPAY'], ['PIX', 'PIX'], ['MMG', 'MMG'], ['PAY_DATA_CLOUD', 'PayData Cloud'], ['PAYWIZARD_APM', 'Paywizard APM'], ['OX_PAY', 'OXPAY'], ['PROMPT_PAY', 'PromptPay']]],
            ['EnableVoicePlayback', 'Enable Voice Playback', 'Enable Voice Playback', '1', false, null, null, null, 'binary'],
            ['SystemVolume', 'System Volume', 'System Volume (0-100)', '70', true, '1', '3', 'N', null],
            ['BaudRate', 'Set Baud Rate', 'Baud Rate', '115200', false, '0', '6', 'N', null],
            ['SocketPort', 'SocketPort', 'SocketPort', '6031', false, '0', '6', 'N', null],
            ['EnableDataSplit', 'Enable Data Split', 'Enable Data Split', '0', false, null, null, null, 'binary'],
            ['ConcurrentRequests', 'ConcurrentRequests', 'Allow concurrent transaction requests', '0', false, null, null, null, 'binary'],
            ['SplitLength', 'Split Length', 'Split Length', '150', false, '0', '5', 'N', null],
            ['SplitDelay', 'Split Delay', 'Split Delay', '500', false, '0', '5', 'N', null],
            ['ShowPaymentResult', 'Show Payment Result', 'ShowPaymentResult', '0', false, null, null, null, 'binary'],
            ['EnableExitDirectly', 'Allowed Exit', 'Enable Exit Directly', '0', false, null, null, null, 'binary'],
            ['LogoUrl', 'Logo Url', 'LogoUrl', '', false, '0', '2000', 'ANS', null],
            ['EnableManualBeginSession', 'Manual Begin Session', 'Enable Manual Begin Session', '0', false, null, null, null, 'binary'],
            ['EnableSilent', 'Silent', 'Enable Silent', '0', false, null, null, null, 'binary'],
            ['EnableConvertJodAmt', 'Convert JOD Amt', 'Enable Convert JOD Amt', '0', false, null, null, null, 'binary'],
            ['KsnetMberCode', 'KSNET Mber Code', 'KSNET mberCode', '0000', true, '0', '128', 'ANS', null],
            ['KsnetCrtftCode', 'KSNET Crtft Code', 'KSNET crtftCode', '0000', true, '0', '128', 'ANS', null],
            ['TSMTerminalCode', 'TSM Terminal Code', 'Terminal Code', '00000000', true, '8', '8', 'ANS', null],
            ['TSMMerchantCode', 'TSM Merchant Code', '9F40', '000000000000', true, '12', '32', 'ANS', null],
            ['TSMConnType', 'TSM Conn Type', 'TSMConnType', '0', false, null, null, null, [['0', 'PROC'], ['1', 'TEST']]],
            ['BtSppUuid', 'Bluetooth SPP UUID', 'RFCOMM service UUID', '00002026-0000-1000-8000-00805F9B34FB', false, '0', '36', 'ANS', null]
        ]],
        ['MDB PARA', [
            ['EnableManualCancel', 'MDB Manual Cancel', 'Enable Manual Cancel', '0', false, null, null, null, 'binary'],
            ['ScalingFactor', 'MDB Scaling Factor', 'ScalingFactor', '1', true, '1', '7', 'N', null],
            ['DecimalPlaces', 'MDB Decimal Places', 'DecimalPlaces', '0', true, '1', '2', 'N', null],
            ['FoundAvailable', 'MDB Found Available', 'FoundAvailable', '65535', true, '0', '10', 'ANS', null],
            ['MdbAutoReversal', 'MDB Auto Reversal', 'MdbAutoReversal', '0', false, null, null, null, 'binary'],
            ['Mdb3Support32BitAmount', 'Mdb3Support32BitAmount', 'Mdb3Support32BitAmount', '0', false, null, null, null, 'binary'],
            ['ManualMdbBegin', 'ManualMdbBegin', 'ManualMdbBegin', '0', false, null, null, null, 'binary'],
            ['EnableGenTransCode', 'Enable Gen Trans Code', 'EnableGenTransCode', '0', false, null, null, null, 'binary']
        ]],
        ['PULSE PARA', [
            ['PulsePortNum', 'Pulse Port Num', 'Pulse Port Num', '0', false, null, null, null, [['0', 'Channel 1'], ['1', 'Channel 2']]],
            ['PulseDeviceVoltage', 'Pulse Device Voltage', 'Pulse Device Voltage', '0', false, null, null, null, [['0', 'Low Level'], ['1', 'High Level']]],
            ['PulseDuration', 'Pulse Duration', 'Pulse Duration (ms)', '200', true, '1', '5', 'N', null],
            ['PulseInterval', 'Pulse Interval', 'Pulse Interval (ms)', '50', true, '1', '5', 'N', null],
            ['PulseAmount', 'PulseAmount P1', 'PulseAmount', '100', true, '0', '128', 'ANS', null],
            ['PulseVoltage', 'PulseNumber P1', 'PulseVoltage', '1', true, '0', '128', 'ANS', null],
            ['PulseAmount2', 'PulseAmount P2', 'PulseAmount2', '200', true, '0', '128', 'ANS', null],
            ['PulseVoltage2', 'PulseNumber P2', 'PulseVoltage2', '2', true, '0', '128', 'ANS', null],
            ['PulseAmount3', 'PulseAmount P3', 'PulseAmount3', '300', true, '0', '128', 'ANS', null],
            ['PulseVoltage3', 'PulseNumber P3', 'PulseVoltage3', '3', true, '0', '128', 'ANS', null],
            ['PulseAmount4', 'PulseAmount P4', 'PulseAmount4', '400', true, '0', '128', 'ANS', null],
            ['PulseVoltage4', 'PulseNumber P4', 'PulseVoltage4', '4', true, '0', '128', 'ANS', null],
            ['PulseText', 'PulseText P1', 'Pulse button 1 text', '', false, '0', '20', 'ANS', null],
            ['PulseText2', 'PulseText P2', 'Pulse button 2 text', '', false, '0', '20', 'ANS', null],
            ['PulseText3', 'PulseText P3', 'Pulse button 3 text', '', false, '0', '20', 'ANS', null],
            ['PulseText4', 'PulseText P4', 'Pulse button 4 text', '', false, '0', '20', 'ANS', null]
        ]],
        ['BIZHI MODE', [
            ['bzUrlType', 'BIZHI UrlType', 'bzUrlType', '0', false, null, null, null, [['0', 'SINGAPORE_IOTSONG'], ['1', 'AMERICA_BTOZ_TECH'], ['2', 'UAT']]]
        ]],
        ['SenseTime MODE', [
            ['senseTimeUrlType', 'senseTimeUrlType', 'senseTimeUrlType', '0', false, null, null, null, [['0', 'SENSE_TIME_RELEASE'], ['1', 'SENSE_TIME_UAT']]],
            ['senseTimeAccessKey', 'senseTimeAccessKey', 'senseTimeAccessKey', '', false, '0', '100', 'ANS', null],
            ['senseTimeSecretKey', 'senseTimeSecretKey', 'senseTimeSecretKey', '', false, '0', '100', 'ANS', null]
        ]],
        ['MULTI PRICE', [
            ['MultiPricingAmount1', 'MultiPricing Amount 1', 'MultiPricing fixed amount slot 1', '1', true, '0', '10', 'N', null],
            ['MultiPricingAmount2', 'MultiPricing Amount 2', 'MultiPricing fixed amount slot 2', '2', true, '0', '10', 'N', null],
            ['MultiPricingAmount3', 'MultiPricing Amount 3', 'MultiPricing fixed amount slot 3', '3', true, '0', '10', 'N', null],
            ['MultiPricingAmount4', 'MultiPricing Amount 4', 'MultiPricing fixed amount slot 4', '4', true, '0', '10', 'N', null],
            ['EReceiptRequired', 'E-Receipt Required', 'Require e-receipt QR screen', '1', false, null, null, null, 'binary']
        ]],
        ['FIXED PRICE', [
            ['FixedPricingAmount', 'FixedPricing Amount', 'FixedPricing fixed amount', '5', true, '0', '10', 'N', null]
        ]]
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
        processorName: document.getElementById('onboard-processor-name'),
        processorSets: document.getElementById('onboard-processor-param-sets'),
        opcSection: document.getElementById('onboard-opc-params'),
        opcSets: document.getElementById('onboard-opc-param-sets'),
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
        if (required) label.append(document.createTextNode(' *'));

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
            } else if (rule && rule !== 'ANS') {
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
            panel.setAttribute('role', 'tabpanel');
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
        els.opcSets.appendChild(createSchemaSet('PAYWIZARD_OPC', OPC_SCHEMA, true));
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
        els.processorName.textContent = processor || 'Processor';
        els.processorSets.querySelectorAll('.param-set').forEach((set) => {
            set.classList.toggle('active', set.dataset.processor === processor);
        });
        els.keyOption.classList.toggle('is-hidden', !els.provision.checked || !KEY_PROCESSORS.has(processor));
        syncOpc();
    }

    function syncOpc() {
        const show = els.provision.checked && els.integration.value !== 'Disable' && Boolean(els.processor.value);
        els.opcSection.classList.toggle('is-hidden', !show);
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
        if (els.integration.value !== 'Disable') controls.push(...els.opcSets.querySelectorAll('.parameter-value'));
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
            processor: collectValues(activeProcessorSet() || document.createElement('div')),
            paywizard: collectValues(els.opcSets)
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
        syncOpc();
        applyValues(config.processor || template.processor);
        applyValues(config.paywizard || template.paywizard);
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
        templates.unshift({ name, configuration, processor: configuration.processor, paywizard: configuration.paywizard });
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

    function appendReviewGroup(container, title, fields) {
        if (!fields.length) return;
        const group = document.createElement('div');
        group.className = 'review-parameter-group';
        const heading = document.createElement('h5');
        heading.textContent = title;
        group.appendChild(heading);
        fields.forEach((input) => {
            const row = document.createElement('div');
            row.className = 'review-parameter-row';
            const label = input.closest('.field')?.querySelector('label')?.textContent.replace(/\s*\*$/, '') || input.dataset.parameterKey;
            const value = input.type === 'hidden'
                ? (input.value === '1' ? 'Enable' : 'Disable')
                : (input.options ? selectedText(input) : input.value);
            const labelEl = document.createElement('span');
            const valueEl = document.createElement('span');
            labelEl.textContent = label;
            valueEl.textContent = value || '-';
            row.append(labelEl, valueEl);
            group.appendChild(row);
        });
        container.appendChild(group);
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
        setReview('review-device-template', selectedText(els.template) === 'Select Template' ? '' : selectedText(els.template));
        const details = document.getElementById('review-device-parameter-details');
        if (details) {
            details.innerHTML = '';
            if (els.provision.checked) {
                appendReviewGroup(details, 'Processor Parameters', Array.from(activeProcessorSet()?.querySelectorAll('.parameter-value') || []));
                if (els.integration.value !== 'Disable') appendReviewGroup(details, 'PAYwizard OPC Parameters', Array.from(els.opcSets.querySelectorAll('.parameter-value')));
            }
        }
        document.getElementById('device-review-details')?.classList.toggle('is-hidden', !els.provision.checked);
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
    els.integration.addEventListener('change', syncOpc);
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
    window.onboardingDevice = { validate: validateDevice, syncReview, getConfiguration: currentConfiguration };
})();
