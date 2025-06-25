
import { supabase } from '@/integrations/supabase/client';

export const customerService = {
  async createCustomer(customerData: {
    phone_number: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    tier?: string;
    tags?: string[];
    notes?: string;
    preferred_contact_method?: string;
  }) {
    const { data: businessUser } = await supabase
      .from('business_users')
      .select('business_id')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .eq('status', 'active')
      .single();

    const { data, error } = await supabase
      .from('customers')
      .insert([{
        ...customerData,
        business_id: businessUser?.business_id,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating customer:', error);
      throw error;
    }

    return data;
  },

  async updateCustomer(customerId: string, updates: any) {
    const { data, error } = await supabase
      .from('customers')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', customerId)
      .select()
      .single();

    if (error) {
      console.error('Error updating customer:', error);
      throw error;
    }

    return data;
  }
};
