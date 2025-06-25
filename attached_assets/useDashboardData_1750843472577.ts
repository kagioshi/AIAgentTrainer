
import { useState, useEffect } from 'react';
import { DashboardStats, AnalyticsUpdate } from '@/types/database';
import { analyticsService } from '@/services/analyticsService';
import { callService } from '@/services/callService';
import { supabase } from '@/integrations/supabase/client';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export const useDashboardData = () => {
  const [data, setData] = useState<DashboardStats & { isLoading: boolean; error: string | null }>({
    activeCalls: 0,
    availableAgents: '0/0',
    avgHandleTime: '0m 0s',
    customerSatisfaction: '0.0/5',
    isLoading: true,
    error: null
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setData(prev => ({ ...prev, isLoading: true, error: null }));
        
        const activeCalls = await callService.getActiveCalls();
        const analytics = await analyticsService.getTodayAnalytics();
        
        const totalAgents = 15;
        const busyAgents = activeCalls.filter(call => call.agent_id).length;
        const availableAgents = totalAgents - busyAgents;
        
        const avgHandleTimeMinutes = Math.floor((analytics.avg_call_duration || 0) / 60);
        const avgHandleTimeSeconds = Math.round((analytics.avg_call_duration || 0) % 60);
        
        const customerSat = ((analytics.customer_satisfaction || 0) / 20).toFixed(1);
        
        setData({
          activeCalls: activeCalls.length,
          availableAgents: `${availableAgents}/${totalAgents}`,
          avgHandleTime: `${avgHandleTimeMinutes}m ${avgHandleTimeSeconds}s`,
          customerSatisfaction: `${customerSat}/5`,
          isLoading: false,
          error: null
        });
        
        console.log('Dashboard data loaded successfully:', {
          activeCalls: activeCalls.length,
          analytics,
          availableAgents: `${availableAgents}/${totalAgents}`
        });
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load dashboard data';
        setData(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage
        }));
      }
    };

    fetchInitialData();

    const handleAnalyticsUpdate = (payload: RealtimePostgresChangesPayload<{ [key: string]: any }>) => {
      const update = payload.new as AnalyticsUpdate;
      if (!update) return;

      console.log('Analytics update received:', update);
      const avgHandleTimeMinutes = Math.floor((update.avg_call_duration || 0) / 60);
      const avgHandleTimeSeconds = Math.round((update.avg_call_duration || 0) % 60);
      const customerSat = ((update.customer_satisfaction || 0) / 20).toFixed(1);
      
      setData(prev => ({
        ...prev,
        avgHandleTime: `${avgHandleTimeMinutes}m ${avgHandleTimeSeconds}s`,
        customerSatisfaction: `${customerSat}/5`
      }));
    };

    const handleCallUpdate = async () => {
      try {
        const activeCalls = await callService.getActiveCalls();
        const totalAgents = 15;
        const busyAgents = activeCalls.filter(call => call.agent_id).length;
        const availableAgents = totalAgents - busyAgents;
        
        console.log('Call update received:', {
          activeCalls: activeCalls.length,
          availableAgents: `${availableAgents}/${totalAgents}`
        });
        
        setData(prev => ({
          ...prev,
          activeCalls: activeCalls.length,
          availableAgents: `${availableAgents}/${totalAgents}`
        }));
      } catch (error) {
        console.error('Error updating call data:', error);
      }
    };

    const analyticsChannel = supabase.channel('analytics-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'analytics' }, handleAnalyticsUpdate)
      .subscribe();
      
    const callsChannel = supabase.channel('calls-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calls' }, handleCallUpdate)
      .subscribe();

    return () => {
      supabase.removeChannel(analyticsChannel);
      supabase.removeChannel(callsChannel);
    };
  }, []);

  return data;
};
