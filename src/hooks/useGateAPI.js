import { useState, useEffect, useCallback } from 'react';

export function useGateAPI() {
  const getPrice = useCallback(async (pair) => {
    try {
      const result = await window.electron.invoke('gate:getPrice', pair);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  const getAccount = useCallback(async () => {
    try {
      const result = await window.electron.invoke('gate:getAccount');
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

  return {
    getPrice,
    getAccount,
    placeOrder,
    getOrderBook,
    getFundingRates,
    getConfig
  };
}
