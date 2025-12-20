import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Destination {
  id: string;
  name: string;
  coordinates: [number, number];
  created_at: string;
}

export function useDestinations() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch last 10 destinations
  const fetchDestinations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('destinations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching destinations:', error);
        return;
      }

      const formattedData: Destination[] = (data || []).map(d => ({
        id: d.id,
        name: d.name,
        coordinates: (d.coordinates as { lng: number; lat: number }) 
          ? [(d.coordinates as any).lng, (d.coordinates as any).lat] as [number, number]
          : d.coordinates as unknown as [number, number],
        created_at: d.created_at,
      }));

      setDestinations(formattedData);
    } catch (error) {
      console.error('Error fetching destinations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Add a new destination
  const addDestination = useCallback(async (name: string, coordinates: [number, number]) => {
    try {
      const { error } = await supabase
        .from('destinations')
        .insert({
          name,
          coordinates: { lng: coordinates[0], lat: coordinates[1] },
        });

      if (error) {
        console.error('Error adding destination:', error);
        return false;
      }

      // Refresh the list
      await fetchDestinations();

      // Clean up old destinations (keep only 10)
      const { data: allDestinations } = await supabase
        .from('destinations')
        .select('id')
        .order('created_at', { ascending: false });

      if (allDestinations && allDestinations.length > 10) {
        const idsToDelete = allDestinations.slice(10).map(d => d.id);
        await supabase
          .from('destinations')
          .delete()
          .in('id', idsToDelete);
      }

      return true;
    } catch (error) {
      console.error('Error adding destination:', error);
      return false;
    }
  }, [fetchDestinations]);

  // Delete a destination
  const deleteDestination = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('destinations')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting destination:', error);
        return false;
      }

      // Refresh the list
      await fetchDestinations();
      return true;
    } catch (error) {
      console.error('Error deleting destination:', error);
      return false;
    }
  }, [fetchDestinations]);

  useEffect(() => {
    fetchDestinations();
  }, [fetchDestinations]);

  return {
    destinations,
    loading,
    addDestination,
    deleteDestination,
    refreshDestinations: fetchDestinations,
  };
}
