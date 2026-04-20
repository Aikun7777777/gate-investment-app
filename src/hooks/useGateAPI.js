import { useState, useEffect, useCallback } from 'react';
import { cache } from '../utils/cache';

export function useGateAPI() {
  const getPrice = useCallback(async (pair) => {
    try {
      // 尝试从缓存获取（5秒缓存）
      const cacheKey = `price:${pair}`;
      const cached = cache.get(cacheKey, 5000);
      if (cached) return cached;

      const result = await window.electron.invoke('gate:getPrice', pair);
      if (result.success) {
        cache.set(cacheKey, result);
      }
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  const getAccount = useCallback(async () => {
    try {
      // 尝试从缓存获取（10秒缓存）
      const cacheKey = 'account';
      const cached = cache.get(cacheKey, 10000);
      if (cached) return cached;

      const result = await window.electron.invoke('gate:getAccount');
      if (result.success) {
        cache.set(cacheKey, result);
      }
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  const placeOrder = useCallback(async (params) => {
    try {
      const result = await window.electron.invoke('gate:placeOrder', params);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  const getOrderBook = useCallback(async (pair, limit = 10) => {
    try {
      const result = await window.electron.invoke('gate:getOrderBook', pair);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  const getFundingRates = useCallback(async () => {
    try {
      const result = await window.electron.invoke('gate:getFundingRates');
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  const getConfig = useCallback(async () => {
    try {
      const result = await window.electron.invoke('gate:getConfig');
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  const getAlerts = useCallback(async (pair = null) => {
    try {
      const result = await window.electron.invoke('gate:getAlerts', pair);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  const addAlert = useCallback(async (alertData) => {
    try {
      const result = await window.electron.invoke('gate:addAlert', alertData);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  const deleteAlert = useCallback(async (alertId) => {
    try {
      const result = await window.electron.invoke('gate:deleteAlert', alertId);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  const checkPriceAlerts = useCallback(async (pair) => {
    try {
      const result = await window.electron.invoke('gate:checkPriceAlerts', pair);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  return {
    getPrice,
    getAccount,
    placeOrder,
    getOrderBook,
    getFundingRates,
    getConfig,
    getAlerts,
    addAlert,
    deleteAlert,
    checkPriceAlerts
  };
}
