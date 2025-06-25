
import { supabase } from '@/integrations/supabase/client';
import { CallMetrics } from '@/types/database';

async function calculateTodayAnalytics(): Promise<CallMetrics> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data: businessUser } = await supabase
      .from('business_users')
      .select('business_id')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .eq('status', 'active')
      .single();

    const { data: calls, error } = await supabase
      .from('calls')
      .select('*')
      .eq('business_id', businessUser?.business_id)
      .gte('created_at', today.toISOString());

    if (error) {
      console.error('Error calculating analytics:', error);
      throw error;
    }

    const totalCalls = calls?.length || 0;
    const answeredCalls = calls?.filter(call => call.status === 'completed').length || 0;
    const droppedCalls = calls?.filter(call => call.status === 'dropped').length || 0;
    
    const avgWaitTime = totalCalls > 0 ? calls?.reduce((sum) => sum + 30, 0) / totalCalls : 0;

    const avgCallDuration = totalCalls > 0 ? calls?.reduce((sum, call) => sum + (call.duration || 0), 0) / totalCalls : 0;
    
    const customerSatisfaction = totalCalls > 0 ? calls?.reduce((sum, call) => sum + (call.sentiment_score || 0), 0) / totalCalls : 0;

    return {
      total_calls: totalCalls,
      answered_calls: answeredCalls,
      dropped_calls: droppedCalls,
      avg_wait_time: avgWaitTime,
      avg_call_duration: avgCallDuration,
      customer_satisfaction: Math.max(0, Math.min(100, (customerSatisfaction + 1) * 50))
    };
  }

export const analyticsService = {
  async getTodayAnalytics(): Promise<CallMetrics> {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: businessUser } = await supabase
      .from('business_users')
      .select('business_id')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .eq('status', 'active')
      .single();

    const { data, error } = await supabase
      .from('analytics')
      .select('*')
      .eq('date', today)
      .eq('business_id', businessUser?.business_id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching analytics:', error);
      throw error;
    }

    if (!data) {
      return await calculateTodayAnalytics();
    }

    return {
      total_calls: data.total_calls || 0,
      answered_calls: data.answered_calls || 0,
      dropped_calls: data.dropped_calls || 0,
      avg_wait_time: data.avg_wait_time || 0,
      avg_call_duration: data.avg_call_duration || 0,
      customer_satisfaction: data.customer_satisfaction || 0
    };
  }
};
