
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';

interface Business {
  id: string;
  name: string;
  business_type: string;
  industry?: string;
  phone_number?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  subscription_plan: string;
  subscription_status: string;
}

export const useBusiness = () => {
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded && user) {
      fetchBusiness();
    } else if (isLoaded) {
      setBusiness(null);
      setLoading(false);
    }
  }, [user, isLoaded]);

  const fetchBusiness = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('business_users')
        .select(`
          businesses (
            id,
            name,
            business_type,
            industry,
            phone_number,
            email,
            website,
            address,
            city,
            state,
            zip_code,
            subscription_plan,
            subscription_status
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No business found - user needs to complete onboarding
          setBusiness(null);
        } else {
          throw error;
        }
      } else {
        setBusiness(data.businesses as Business);
      }
    } catch (err) {
      console.error('Error fetching business:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch business');
    } finally {
      setLoading(false);
    }
  };

  return { business, loading, error, refetch: fetchBusiness };
};
