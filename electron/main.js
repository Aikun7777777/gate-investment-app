const { app, BrowserWindow, ipcMain, Notification } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let pythonProcess;

const PYTHON_SERVER_PORT = 5001;

function startPythonServer() {
  const pythonScript = path.join(__dirname, '../python/gate_api_server.py');
  const venvPython = path.join(__dirname, '../venv/bin/python3');
  pythonProcess = spawn(venvPython, [pythonScript]);

  pythonProcess.stdout.on('data', (data) => {
    console.log(`Python: ${data}`);
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`Python Error: ${data}`);
  });

  pythonProcess.on('close', (code) => {
    console.log(`Python process exited with code ${code}`);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    backgroundColor: '#1a1a2e',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'hiddenInset',
    frame: true
  });

  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  startPythonServer();

  setTimeout(() => {
    createWindow();
  }, 2000);
});

app.on('window-all-closed', () => {
  if (pythonProcess) {
    pythonProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  if (pythonProcess) {
    pythonProcess.kill();
  }
});

ipcMain.handle('gate:getPrice', async (event, pair) => {
  try {
    const response = await fetch(`http://localhost:${PYTHON_SERVER_PORT}/api/price/${pair}`);
    return await response.json();
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('gate:getAccount', async () => {
  try {
    const response = await fetch(`http://localhost:${PYTHON_SERVER_PORT}/api/account`);
    return await response.json();
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('gate:placeOrder', async (event, params) => {
  try {
    const response = await fetch(`http://localhost:${PYTHON_SERVER_PORT}/api/order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return await response.json();
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('gate:getOrderBook', async (event, pair) => {
  try {
    const response = await fetch(`http://localhost:${PYTHON_SERVER_PORT}/api/orderbook/${pair}`);
    return await response.json();
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('gate:getFundingRates', async () => {
  try {
    const response = await fetch(`http://localhost:${PYTHON_SERVER_PORT}/api/funding-rates`);
    return await response.json();
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('gate:getConfig', async () => {
  try {
    const response = await fetch(`http://localhost:${PYTHON_SERVER_PORT}/api/config`);
    return await response.json();
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('gate:getRecommendations', async () => {
  try {
    const response = await fetch(`http://localhost:${PYTHON_SERVER_PORT}/api/recommendations`);
    return await response.json();
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('gate:getAlerts', async (event, pair) => {
  try {
    const url = pair
      ? `http://localhost:${PYTHON_SERVER_PORT}/api/alerts?pair=${pair}`
      : `http://localhost:${PYTHON_SERVER_PORT}/api/alerts`;
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('gate:addAlert', async (event, alertData) => {
  try {
    const response = await fetch(`http://localhost:${PYTHON_SERVER_PORT}/api/alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alertData)
    });
    return await response.json();
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('gate:deleteAlert', async (event, alertId) => {
  try {
    const response = await fetch(`http://localhost:${PYTHON_SERVER_PORT}/api/alerts/${alertId}`, {
      method: 'DELETE'
    });
    return await response.json();
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('gate:checkPriceAlerts', async (event, pair) => {
  try {
    const response = await fetch(`http://localhost:${PYTHON_SERVER_PORT}/api/price/${pair}/check-alerts`);
    const result = await response.json();

    // 如果有触发的预警，显示桌面通知
    if (result.success && result.triggered_alerts && result.triggered_alerts.length > 0) {
      result.triggered_alerts.forEach(alert => {
        const notification = new Notification({
          title: '🔔 价格预警触发',
          body: `${alert.pair} 已${alert.condition === 'above' ? '突破' : '跌破'} $${alert.target_price}\n当前价格: $${result.current_price}`,
          silent: false
        });
        notification.show();
      });
    }

    return result;
  } catch (error) {
    return { error: error.message };
  }
});

ipcMain.handle('show-notification', async (event, { title, body }) => {
  try {
    const notification = new Notification({
      title,
      body,
      silent: false
    });
    notification.show();
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
});
