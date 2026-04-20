const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  invoke: (channel, ...args) => {
    const validChannels = [
      'gate:getPrice',
      'gate:getAccount',
      'gate:placeOrder',
      'gate:getOrderBook',
      'gate:getFundingRates',
      'gate:getConfig',
      'gate:getRecommendations',
      'gate:getAlerts',
      'gate:addAlert',
      'gate:deleteAlert',
      'gate:checkPriceAlerts',
      'show-notification'
    ];
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
  },
  showNotification: (options) => {
    return ipcRenderer.invoke('show-notification', options);
  }
});
