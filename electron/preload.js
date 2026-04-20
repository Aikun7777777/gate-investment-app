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
      'gate:getRecommendations'
    ];
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
  }
});
