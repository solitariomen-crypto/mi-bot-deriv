const CONFIG_KEY = 'deriv_bot_config';
const LOG_KEY = 'deriv_bot_logs';

let ws = null;
let requestId = 1;
let isConnected = false;
let isRunning = false;
let currentContractId = null;
let currentProposalId = null;
let sessionStats = {
    initialBalance: 0,
    currentBalance: 0,
    sessionProfit: 0,
    wins: 0,
    losses: 0,
    totalTrades: 0,
    totalTarget: 20
};
let pendingBuy = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
let accountId = null;
let currentToken = null;

function getConfig() {
    const defaults = {
        apiToken: '',
        accountType: 'demo',
        stakeAmount: 1,
        takeProfit: 2,
        growthRate: 2,
        totalTarget: 20,
        symbol: 'R_10',
        contractType: 'ACCU'
    };
    try {
        const saved = localStorage.getItem(CONFIG_KEY);
        return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    } catch {
        return defaults;
    }
}

function saveConfig() {
    const config = {
        apiToken: document.getElementById('apiToken').value,
        accountType: document.getElementById('accountType').value,
        stakeAmount: parseFloat(document.getElementById('stakeAmount').value),
        takeProfit: parseFloat(document.getElementById('takeProfit').value),
        growthRate: parseFloat(document.getElementById('growthRate').value),
        totalTarget: parseFloat(document.getElementById('totalTarget').value),
        symbol: document.getElementById('symbolSelect').value,
        contractType: document.getElementById('contractTypeSelect').value
    };
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    log('success', 'Configuración guardada');
    sessionStats.totalTarget = config.totalTarget;
    updateProgress();
}

function loadConfig() {
    const config = getConfig();
    document.getElementById('apiToken').value = config.apiToken;
    document.getElementById('accountType').value = config.accountType;
    document.getElementById('stakeAmount').value = config.stakeAmount;
    document.getElementById('takeProfit').value = config.takeProfit;
    document.getElementById('growthRate').value = config.growthRate;
    document.getElementById('totalTarget').value = config.totalTarget;
    document.getElementById('symbolSelect').value = config.symbol;
    document.getElementById('contractTypeSelect').value = config.contractType;
    sessionStats.totalTarget = config.totalTarget;
}

function log(type, message, data = null) {
    const container = document.getElementById('logContainer');
    const time = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;
    let msg = `<span class="log-time">[${time}]</span>${message}`;
    if (data) msg += ` <pre style="color:#888;font-size:0.75em;">${JSON.stringify(data, null, 2)}</pre>`;
    entry.innerHTML = msg;
    container.insertBefore(entry, container.firstChild);
    while (container.children.length > 100) container.removeChild(container.lastChild);
    saveLogs();
    console.log(`[${type.toUpperCase()}] ${message}`, data || '');
}

function saveLogs() {
    const container = document.getElementById('logContainer');
    const logs = Array.from(container.children).map(el => el.outerHTML).join('');
    localStorage.setItem(LOG_KEY, logs);
}

function loadLogs() {
    const logs = localStorage.getItem(LOG_KEY);
    if (logs) document.getElementById('logContainer').innerHTML = logs;
}

function clearLogs() {
    document.getElementById('logContainer').innerHTML = '';
    localStorage.removeItem(LOG_KEY);
}

function exportLogs() {
    const container = document.getElementById('logContainer');
    const text = Array.from(container.children).map(el => el.innerText).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bot_logs_${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}

function updateConnectionStatus(status) {
    const el = document.getElementById('connectionStatus');
    const dot = document.getElementById('connDot');
    el.className = `connection-status ${status}`;
    const texts = { connected: 'Conectado', disconnected: 'Desconectado', connecting: 'Conectando...' };
    el.innerHTML = `<span class="dot"></span> ${texts[status]}`;
    if (dot) dot.style.background = status === 'connected' ? '#00ff88' : status === 'connecting' ? '#ffaa00' : '#ff4444';
}

function updateUI() {
    document.getElementById('btnConnect').disabled = isConnected;
    document.getElementById('btnDisconnect').disabled = !isConnected;
    document.getElementById('btnStart').disabled = !isConnected || isRunning;
    document.getElementById('btnStop').disabled = !isRunning;
    document.getElementById('apiToken').disabled = isConnected;
    document.getElementById('accountType').disabled = isConnected;
    updateProgress();
}

function updateProgress() {
    const pct = Math.min(100, (sessionStats.sessionProfit / sessionStats.totalTarget) * 100);
    document.getElementById('progressBar').style.width = `${pct}%`;
    document.getElementById('progressText').textContent = `${pct.toFixed(1)}%`;
    document.getElementById('balance').textContent = `$${sessionStats.currentBalance.toFixed(2)}`;
    document.getElementById('sessionProfit').textContent = `$${sessionStats.sessionProfit.toFixed(2)}`;
    document.getElementById('wins').textContent = sessionStats.wins;
    document.getElementById('losses').textContent = sessionStats.losses;
    document.getElementById('totalTrades').textContent = sessionStats.totalTrades;
}

function send(msg) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(msg));
        log('info', `📤 Enviado: ${msg.msg_type || 'buy/sell'}`, msg);
        return true;
    }
    log('error', 'WebSocket no conectado');
    return false;
}

function nextId() {
    return requestId++;
}

function authorize(token) {
    send({ authorize: token, req_id: nextId() });
}

function getBalance() {
    send({ balance: 1, subscribe: 1, req_id: nextId() });
}

function getProposal(params) {
    send({
        proposal: 1,
        amount: params.stake,
        basis: 'stake',
        contract_type: params.contractType,
        currency: 'USD',
        duration: 1,
        duration_unit: 't',
        growth_rate: params.growthRate,
        symbol: params.symbol,
        req_id: nextId()
    });
}

function buyContract(proposalId, price) {
    send({ buy: proposalId, price: price, req_id: nextId() });
}

function sellContract(contractId, price = 0) {
    send({ sell: contractId, price: price, req_id: nextId() });
}

function proposeOpenContract(contractId) {
    send({ proposal_open_contract: 1, contract_id: contractId, subscribe: 1, req_id: nextId() });
}

function forgetAll() {
    send({ forget_all: 'proposal_open_contract', req_id: nextId() });
}

async function connectBot() {
    const token = document.getElementById('apiToken').value.trim();
    if (!token) { alert('Ingresa tu API Token'); return; }
    if (token.length < 20) { alert('Token parece inválido (muy corto)'); return; }
    
    currentToken = token;
    saveConfig();
    updateConnectionStatus('connecting');
    log('info', '=== INICIANDO CONEXIÓN ===');
    log('info', `Token: ${token.substring(0,8)}...${token.slice(-4)}`);
    log('info', `Tipo cuenta: ${getConfig().accountType}`);

    try {
        const config = getConfig();
        
        // Step 1: Get accounts list
        log('info', '1/3 Obteniendo lista de cuentas...');
        const accountsUrl = 'https://api.derivws.com/trading/v1/options/accounts';
        log('info', `   GET ${accountsUrl}`);
        
        const accountsRes = await fetch(accountsUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Deriv-App-ID': '67545'
            }
        });
        
        log('info', `   HTTP ${accountsRes.status} ${accountsRes.statusText}`);
        const accountsText = await accountsRes.text();
        log('info', `   Response: ${accountsText.substring(0,500)}`);
        
        let accountsData;
        try {
            accountsData = JSON.parse(accountsText);
        } catch (e) {
            throw new Error('Respuesta no es JSON válido: ' + accountsText.substring(0,200));
        }
        
        if (accountsData.error) {
            throw new Error(`API Error: ${accountsData.error.code} - ${accountsData.error.message}`);
        }
        
        const accounts = accountsData.accounts || [];
        log('success', `   Cuentas encontradas: ${accounts.length}`);
        accounts.forEach((acc, i) => {
            log('info', `   [${i}] ${acc.loginid} | ID: ${acc.id} | Virtual: ${acc.is_virtual} | Currency: ${acc.currency}`);
        });
        
        // Step 2: Find target account
        const targetAccount = accounts.find(acc => 
            (config.accountType === 'demo' && acc.is_virtual === 1) || 
            (config.accountType === 'real' && acc.is_virtual === 0)
        ) || accounts[0];
        
        if (!targetAccount) throw new Error('No se encontró cuenta ' + config.accountType);
        accountId = targetAccount.id;
        log('success', `2/3 Cuenta seleccionada: ${accountId} (${targetAccount.loginid})`);

        // Step 3: Get OTP for WebSocket
        log('info', '3/3 Obteniendo OTP para WebSocket...');
        const otpUrl = `https://api.derivws.com/trading/v1/options/accounts/${accountId}/otp`;
        log('info', `   POST ${otpUrl}`);
        
        const otpRes = await fetch(otpUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Deriv-App-ID': '67545'
            }
        });
        
        log('info', `   HTTP ${otpRes.status} ${otpRes.statusText}`);
        const otpText = await otpRes.text();
        log('info', `   Response: ${otpText.substring(0,500)}`);
        
        let otpData;
        try {
            otpData = JSON.parse(otpText);
        } catch (e) {
            throw new Error('Respuesta OTP no es JSON válido: ' + otpText.substring(0,200));
        }
        
        if (otpData.error) {
            throw new Error(`OTP Error: ${otpData.error.code} - ${otpData.error.message}`);
        }
        
        // Try different possible URL fields
        let wsUrl = otpData.ws_url || otpData.otp_url || otpData.url;
        if (!wsUrl && otpData.otp) {
            wsUrl = `wss://api.derivws.com/trading/v1/options/ws/${config.accountType}?otp=${otpData.otp}&app_id=67545`;
        } else if (wsUrl && !wsUrl.includes('app_id=')) {
            // Add app_id if not present
            const separator = wsUrl.includes('?') ? '&' : '?';
            wsUrl += `${separator}app_id=67545`;
        }
        if (!wsUrl) {
            throw new Error('No se encontró URL WebSocket en respuesta: ' + JSON.stringify(otpData));
        }
        
        log('success', `   WebSocket URL: ${wsUrl}`);
        log('info', 'Conectando WebSocket...');
        
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            log('success', '✅ WebSocket CONECTADO');
            isConnected = true;
            reconnectAttempts = 0;
            updateConnectionStatus('connected');
            updateUI();
            authorize(currentToken);
        };

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                log('info', `📥 Recibido: ${msg.msg_type}`, msg);
                handleMessage(msg);
            } catch (e) {
                log('error', 'Error parseando mensaje WS', e.message);
            }
        };
        
        ws.onclose = (event) => {
            log('warning', `WebSocket cerrado: code=${event.code}, reason=${event.reason || 'none'}`);
            handleDisconnect();
        };
        
        ws.onerror = (err) => {
            log('error', 'Error WebSocket', err.message || err);
        };
        
    } catch (err) {
        log('error', '❌ ERROR DE CONEXIÓN', err.message);
        log('error', 'Stack:', err.stack);
        updateConnectionStatus('disconnected');
        updateUI();
    }
}

function handleDisconnect() {
    isConnected = false;
    isRunning = false;
    currentContractId = null;
    updateConnectionStatus('disconnected');
    updateUI();
    log('warning', 'Desconectado del servidor');
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS && document.getElementById('apiToken').value) {
        reconnectAttempts++;
        log('info', `Reintentando conexión (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
        setTimeout(connectBot, 5000 * reconnectAttempts);
    }
}

function handleMessage(msg) {
    if (msg.msg_type === 'authorize') {
        if (msg.error) {
            log('error', '❌ Autorización fallida', msg.error);
            ws.close();
            return;
        }
        log('success', `✅ Autorizado: ${msg.authorize.loginid} (${msg.authorize.currency}) | Balance: ${msg.authorize.balance}`);
        getBalance();
    }
    else if (msg.msg_type === 'balance') {
        sessionStats.currentBalance = msg.balance.balance;
        if (sessionStats.initialBalance === 0) sessionStats.initialBalance = msg.balance.balance;
        sessionStats.sessionProfit = sessionStats.currentBalance - sessionStats.initialBalance;
        updateProgress();
        log('info', `💰 Balance: $${sessionStats.currentBalance.toFixed(2)}`);
        if (isRunning && !currentContractId && !pendingBuy) {
            checkTargetAndTrade();
        }
    }
    else if (msg.msg_type === 'proposal') {
        if (msg.error) { log('error', 'Error en propuesta', msg.error); pendingBuy = false; return; }
        currentProposalId = msg.proposal.id;
        const price = msg.proposal.display_value || msg.proposal.ask_price;
        log('success', `📋 Propuesta: $${price} (ID: ${currentProposalId})`);
        buyContract(currentProposalId, price);
    }
    else if (msg.msg_type === 'buy') {
        if (msg.error) { log('error', 'Error al comprar', msg.error); pendingBuy = false; return; }
        currentContractId = msg.buy.contract_id;
        pendingBuy = false;
        log('success', `🟢 COMPRADO: ${currentContractId} - $${msg.buy.buy_price}`);
        proposeOpenContract(currentContractId);
    }
    else if (msg.msg_type === 'proposal_open_contract') {
        if (msg.error) { log('error', 'Error monitoreando contrato', msg.error); return; }
        const c = msg.proposal_open_contract;
        const profit = c.profit || 0;
        const status = c.status;
        const payout = c.payout || 0;

        if (status === 'open') {
            log('info', `⏳ Activo | Payout: $${payout.toFixed(2)} | Ganancia: $${profit.toFixed(2)}`);
            const config = getConfig();
            if (profit >= config.takeProfit) {
                log('warning', `🎯 Take Profit: $${profit.toFixed(2)} >= $${config.takeProfit}`);
                sellContract(currentContractId);
            }
        } else if (status === 'sold' || status === 'won' || status === 'lost') {
            const isWin = profit > 0;
            sessionStats.totalTrades++;
            if (isWin) sessionStats.wins++; else sessionStats.losses++;
            sessionStats.currentBalance += profit;
            sessionStats.sessionProfit = sessionStats.currentBalance - sessionStats.initialBalance;
            updateProgress();
            log(isWin ? 'success' : 'error', `🔚 ${status.toUpperCase()} | P/L: $${profit.toFixed(2)} | Balance: $${sessionStats.currentBalance.toFixed(2)}`);
            currentContractId = null;
            currentProposalId = null;
            if (isRunning) checkTargetAndTrade();
        }
    }
    else if (msg.msg_type === 'sell') {
        if (msg.error) log('error', 'Error al vender', msg.error);
        else log('success', `🔴 VENDIDO: $${msg.sell.sold_for}`);
    }
    else if (msg.msg_type === 'error') {
        log('error', 'Error API', msg.error);
    }
}

function checkTargetAndTrade() {
    if (!isRunning) return;
    if (sessionStats.sessionProfit >= sessionStats.totalTarget) {
        log('success', `🎉🎉 META ALCANZADA: $${sessionStats.sessionProfit.toFixed(2)} >= $${sessionStats.totalTarget} 🎉🎉`);
        stopBot();
        return;
    }
    if (currentContractId || pendingBuy) return;
    pendingBuy = true;
    const config = getConfig();
    log('info', `🔄 Nueva operación | Stake: $${config.stakeAmount} | Growth: ${config.growthRate}% | TP: $${config.takeProfit}`);
    getProposal({
        stake: config.stakeAmount,
        contractType: config.contractType,
        growthRate: config.growthRate,
        symbol: config.symbol
    });
}

function startBot() {
    if (!isConnected) { alert('Conéctate primero'); return; }
    saveConfig();
    isRunning = true;
    sessionStats = { ...sessionStats, totalTarget: getConfig().totalTarget, wins: 0, losses: 0, totalTrades: 0, sessionProfit: 0 };
    updateUI();
    log('success', '🤖🤖 BOT INICIADO - Acumulador Volatilidad 10 🤖🤖');
    checkTargetAndTrade();
}

function stopBot() {
    isRunning = false;
    if (currentContractId) {
        log('warning', 'Deteniendo bot, cerrando contrato...');
        sellContract(currentContractId);
    }
    forgetAll();
    updateUI();
    log('info', '⏹ Bot DETENIDO');
}

function disconnectBot() {
    stopBot();
    if (ws) { ws.close(); ws = null; }
    isConnected = false;
    sessionStats = { initialBalance: 0, currentBalance: 0, sessionProfit: 0, wins: 0, losses: 0, totalTrades: 0, totalTarget: 20 };
    updateUI();
    log('info', 'Desconectado completamente');
}