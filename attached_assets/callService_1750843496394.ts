
import { supabase } from '@/integrations/supabase/client';
import { CallUpdate, CallWithRelations } from '@/types/database';

export const callService = {
  async createCall(callData: {
    customer_id: string;
    call_type: 'inbound' | 'outbound';
    status?: 'queued' | 'active' | 'completed' | 'dropped';
  }) {
    const { data: businessUser } = await supabase
      .from('business_users')
      .select('business_id')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .eq('status', 'active')
      .single();

    const { data, error } = await supabase
      .from('calls')
      .insert([{
        ...callData,
        business_id: businessUser?.business_id,
        status: callData.status || 'queued',
        duration: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating call:', error);
      throw error;
    }

    return data;
  },

  async updateCall(callId: string, updates: Partial<CallUpdate>) {
    const { data, error } = await supabase
      .from('calls')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', callId)
      .select()
      .single();

    if (error) {
      console.error('Error updating call:', error);
      throw error;
    }

    return data;
  },

  async getActiveCalls(): Promise<CallWithRelations[]> {
    const { data, error } = await supabase
      .from('calls')
      .select(`
        *,
        customers (first_name, last_name, phone_number, email, tier),
        profiles (first_name, last_name, role)
      `)
      .in('status', ['queued', 'active'])
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching active calls:', error);
      throw error;
    }

    return data || [];
  },

  async getQueuedCalls(): Promise<CallWithRelations[]> {
    const { data, error } = await supabase
        .from('calls')
        .select(`
          *,
          customers (first_name, last_name, phone_number, email, tier),
          profiles (first_name, last_name, role)
        `)
        .eq('status', 'queued')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching queued calls:', error);
        throw error;
      }
      return data || [];
  },

  async assignCall(callId: string) {
    const { error } = await supabase
      .from('calls')
      .update({ 
        status: 'active',
        agent_id: (await supabase.auth.getUser()).data.user?.id
      })
      .eq('id', callId);

    if (error) {
      console.error('Error assigning call:', error);
      throw error;
    }
  }
};
