# Gate 投资助手

基于 Electron + React 的 Gate.io 投资辅助桌面应用。

## 功能特性

- 📊 **实时行情监控** - 监控多个交易对的实时价格、涨跌幅、成交量
- 💹 **交易执行** - 支持限价单和市价单，实时订单簿展示
- 💰 **资产管理** - 查看现货账户余额和持仓情况
- 🔄 **资金费率套利** - 监控合约资金费率，发现套利机会
- ⚙️ **灵活配置** - 支持测试网/正式网切换，自定义监控列表

## 技术栈

- **前端**: Electron 28 + React 18 + Vite + TailwindCSS
- **后端**: Python Flask + Gate.io API
- **数据流**: IPC 通信 + REST API

## 安装依赖

### Node.js 依赖

```bash
cd gate-investment-app
npm install
```

### Python 依赖

```bash
pip3 install -r python/requirements.txt
```

## 配置

应用会自动读取 `~/.openclaw/gate-config.json` 配置文件。

示例配置：

```json
{
  "gate": {
    "testnet": true,
    "testnet_api_key": "your_testnet_api_key",
    "testnet_api_secret": "your_testnet_api_secret"
  },
  "trading": {
    "default_slippage": 0.005,
    "max_position_usd": 10000,
    "watched_pairs": [
      "BTC_USDT", "ETH_USDT", "SOL_USDT"
    ]
  }
}
```

## 运行

### 开发模式

```bash
npm run electron:dev
```

这会同时启动：
1. Vite 开发服务器 (http://localhost:5173)
2. Python Flask API 服务器 (http://localhost:5000)
3. Electron 应用

### 生产构建

```bash
npm run electron:build
```

## 项目结构

```
gate-investment-app/
├── electron/           # Electron 主进程
│   ├── main.js        # 主进程入口
│   └── preload.js     # 预加载脚本
├── python/            # Python 后端服务
│   ├── gate_api_server.py  # Flask API 服务器
│   └── gate_trader.py      # Gate.io API 封装
├── src/               # React 前端
│   ├── components/    # UI 组件
│   ├── hooks/         # React Hooks
│   └── utils/         # 工具函数
└── public/            # 静态资源
```

## 功能说明

### 仪表板
- 显示账户总资产、今日盈亏
- 快速访问监控列表
- 查看账户余额

### 行情监控
- 实时显示配置的交易对价格
- 24小时涨跌幅、高低价、成交量
- 每 3 秒自动刷新
- 点击交易对快速跳转到交易页面

### 交易面板
- 实时订单簿（买卖盘深度）
- 支持限价单和市价单
- 买入/卖出操作
- 预计成交金额显示

### 资产管理
- 现货账户余额查看
- 可用/冻结资产统计
- 总资产概览

### 资金费率套利
- 显示主流币合约资金费率
- 年化收益计算
- 套利机会提示（费率 > 0.1%）
- 每分钟自动刷新

## 安全提示

⚠️ **重要**：
- 默认使用测试网环境，所有交易均为模拟
- API 密钥存储在本地配置文件，请妥善保管
- 切换到正式网前请确保充分测试
- 下单前请仔细核对交易参数

## 开发说明

### 添加新的交易对

编辑 `~/.openclaw/gate-config.json`：

```json
{
  "trading": {
    "watched_pairs": [
      "BTC_USDT",
      "ETH_USDT",
      "NEW_PAIR_USDT"
    ]
  }
}
```

### 自定义 UI 主题

编辑 `tailwind.config.js` 中的颜色配置。

## 故障排除

### Python 服务器启动失败

检查 Python 依赖是否安装：
```bash
pip3 install flask flask-cors requests gate-api
```

### Electron 无法连接到后端

确保 Python 服务器在 5000 端口运行：
```bash
python3 python/gate_api_server.py
```

### API 调用失败

检查配置文件中的 API 密钥是否正确。

## License

MIT

## 作者

Created with Claude Code
