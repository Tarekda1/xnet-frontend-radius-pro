import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export interface AnalyticsData {
  time: string;
  users: number;
  bandwidth: number;
  authSuccess: number;
  authFailed: number;
}

export interface AuthDistribution {
  name: string;
  value: number;
  color: string;
}

export interface GeographicData {
  name: string;
  users: number;
  color: string;
}

export interface PeakHoursData {
  hour: string;
  usage: number;
}

export interface AnalyticsMetrics {
  activeUsers: number;
  bandwidthUsage: string;
  authSuccessRate: number;
  failedAttempts: number;
  userGrowth: number;
  bandwidthGrowth: number;
  authRateGrowth: number;
  failedAttemptsGrowth: number;
}

// Mock data generators for development
const generateMockAnalyticsData = (timeRange: string): AnalyticsData[] => {
  const now = new Date();
  const data: AnalyticsData[] = [];
  let points = 24; // Default to 24 hours
  
  switch (timeRange) {
    case '1h':
      points = 60; // 60 minutes
      break;
    case '7d':
      points = 168; // 7 days * 24 hours
      break;
    case '30d':
      points = 30; // 30 days
      break;
    default:
      points = 24; // 24 hours
  }
  
  for (let i = points - 1; i >= 0; i--) {
    const time = new Date(now.getTime() - i * (timeRange === '1h' ? 60 * 1000 : 60 * 60 * 1000));
    data.push({
      time: timeRange === '1h' 
        ? time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        : time.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit' }),
      users: Math.floor(Math.random() * 50) + 20,
      bandwidth: Math.floor(Math.random() * 100) + 50,
      authSuccess: Math.floor(Math.random() * 100) + 80,
      authFailed: Math.floor(Math.random() * 20) + 5,
    });
  }
  
  return data;
};

const generateMockMetrics = (): AnalyticsMetrics => {
  return {
    activeUsers: Math.floor(Math.random() * 1000) + 500,
    bandwidthUsage: `${(Math.random() * 5 + 1).toFixed(1)} GB/s`,
    authSuccessRate: Math.floor(Math.random() * 10) + 90,
    failedAttempts: Math.floor(Math.random() * 50) + 10,
    userGrowth: Math.floor(Math.random() * 20) - 5,
    bandwidthGrowth: Math.floor(Math.random() * 20) - 5,
    authRateGrowth: Math.floor(Math.random() * 10) - 2,
    failedAttemptsGrowth: Math.floor(Math.random() * 20) - 10,
  };
};

// API functions
const fetchAnalyticsData = async (timeRange: string): Promise<AnalyticsData[]> => {
  try {
    const response = await axios.get(`/api/analytics/usage?range=${timeRange}`);
    return response.data;
  } catch (error) {
    console.warn('Using mock data for analytics:', error);
    return generateMockAnalyticsData(timeRange);
  }
};

const fetchAnalyticsMetrics = async (): Promise<AnalyticsMetrics> => {
  try {
    const response = await axios.get('/api/analytics/metrics');
    return response.data;
  } catch (error) {
    console.warn('Using mock data for metrics:', error);
    return generateMockMetrics();
  }
};

const fetchAuthDistribution = async (): Promise<AuthDistribution[]> => {
  try {
    const response = await axios.get('/api/analytics/auth-distribution');
    return response.data;
  } catch (error) {
    console.warn('Using mock data for auth distribution:', error);
    return [
      { name: 'Success', value: 85, color: '#10b981' },
      { name: 'Failed', value: 10, color: '#ef4444' },
      { name: 'Timeout', value: 5, color: '#f59e0b' },
    ];
  }
};

const fetchGeographicData = async (): Promise<GeographicData[]> => {
  try {
    const response = await axios.get('/api/analytics/geographic');
    return response.data;
  } catch (error) {
    console.warn('Using mock data for geographic data:', error);
    return [
      { name: 'North America', users: 45, color: '#3b82f6' },
      { name: 'Europe', users: 30, color: '#8b5cf6' },
      { name: 'Asia', users: 20, color: '#f59e0b' },
      { name: 'Africa', users: 3, color: '#10b981' },
      { name: 'South America', users: 2, color: '#ef4444' },
    ];
  }
};

const fetchPeakHoursData = async (): Promise<PeakHoursData[]> => {
  try {
    const response = await axios.get('/api/analytics/peak-hours');
    return response.data;
  } catch (error) {
    console.warn('Using mock data for peak hours:', error);
    const hours = Array.from({ length: 24 }, (_, i) => i);
    return hours.map(hour => ({
      hour: `${hour}:00`,
      usage: Math.floor(Math.random() * 100) + (hour >= 9 && hour <= 17 ? 50 : 20),
    }));
  }
};

// Custom hooks
export const useAnalyticsData = (timeRange: string) => {
  return useQuery({
    queryKey: ['analytics', 'usage', timeRange],
    queryFn: () => fetchAnalyticsData(timeRange),
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });
};

export const useAnalyticsMetrics = () => {
  return useQuery({
    queryKey: ['analytics', 'metrics'],
    queryFn: fetchAnalyticsMetrics,
    refetchInterval: 15000, // Refetch every 15 seconds
    staleTime: 5000, // Consider data stale after 5 seconds
  });
};

export const useAuthDistribution = () => {
  return useQuery({
    queryKey: ['analytics', 'auth-distribution'],
    queryFn: fetchAuthDistribution,
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000, // Consider data stale after 30 seconds
  });
};

export const useGeographicData = () => {
  return useQuery({
    queryKey: ['analytics', 'geographic'],
    queryFn: fetchGeographicData,
    refetchInterval: 300000, // Refetch every 5 minutes
    staleTime: 120000, // Consider data stale after 2 minutes
  });
};

export const usePeakHoursData = () => {
  return useQuery({
    queryKey: ['analytics', 'peak-hours'],
    queryFn: fetchPeakHoursData,
    refetchInterval: 600000, // Refetch every 10 minutes
    staleTime: 300000, // Consider data stale after 5 minutes
  });
};

// Utility functions
export const formatBandwidth = (bytes: number): string => {
  const units = ['B/s', 'KB/s', 'MB/s', 'GB/s', 'TB/s'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

export const getGrowthColor = (growth: number): string => {
  if (growth > 0) return 'text-green-600';
  if (growth < 0) return 'text-red-600';
  return 'text-gray-600';
};

export const getGrowthIcon = (growth: number): 'TrendingUp' | 'TrendingDown' | 'Minus' => {
  if (growth > 0) return 'TrendingUp';
  if (growth < 0) return 'TrendingDown';
  return 'Minus';
}; 