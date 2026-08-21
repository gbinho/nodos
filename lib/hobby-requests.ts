import { createClient } from '@/lib/supabase-server';
import { HobbyRequestRow, OfficialHobbyRow } from './database.types';

export async function createHobbyRequest(
  userId: string,
  hobbyName: string,
  category: string,
  description: string | null
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('hobby_requests')
      .insert({
        user_id: userId,
        hobby_name: hobbyName,
        category,
        description
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating hobby request:', error);
      return { success: false, error: 'Failed to submit hobby request' };
    }

    return { success: true };
  } catch (err) {
    console.error('Unexpected error creating hobby request:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function getPendingHobbyRequests(): Promise<{ 
  requests: HobbyRequestRow[]; 
  error?: string 
}> {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('hobby_requests')
      .select(`
        id,
        user_id,
        hobby_name,
        category,
        description,
        status,
        created_at,
        profiles (username, avatar_url)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending hobby requests:', error);
      return { requests: [], error: 'Failed to fetch requests' };
    }

    return { requests: data as HobbyRequestRow[] };
  } catch (err) {
    console.error('Unexpected error fetching hobby requests:', err);
    return { requests: [], error: 'An unexpected error occurred' };
  }
}

export async function approveHobbyRequest(
  requestId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  
  try {
    // Get the request details first
    const { data: request, error: fetchError } = await supabase
      .from('hobby_requests')
      .select(`
        id,
        user_id,
        hobby_name,
        category,
        description,
        status
      `)
      .eq('id', requestId)
      .single();

    if (fetchError) {
      console.error('Error fetching hobby request:', fetchError);
      return { success: false, error: 'Failed to fetch request' };
    }

    // Insert into official_hobbies table
    const slug = request.hobby_name.toLowerCase().replace(/\s+/g, '-');
    
    const { data: insertedHobby, error: insertError } = await supabase
      .from('official_hobbies')
      .insert({
        name: request.hobby_name,
        slug,
        category: request.category,
        color_hex: '#6b7280' // Default gray color
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting official hobby:', insertError);
      return { success: false, error: 'Failed to approve hobby request' };
    }

    // Update the request status to approved
    const { error: updateError } = await supabase
      .from('hobby_requests')
      .update({ status: 'approved' })
      .eq('id', requestId);

    if (updateError) {
      console.error('Error updating hobby request status:', updateError);
      return { success: false, error: 'Failed to approve request' };
    }

    return { success: true };
  } catch (err) {
    console.error('Unexpected error approving hobby request:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function rejectHobbyRequest(
  requestId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  
  try {
    const { error } = await supabase
      .from('hobby_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId);

    if (error) {
      console.error('Error rejecting hobby request:', error);
      return { success: false, error: 'Failed to reject request' };
    }

    return { success: true };
  } catch (err) {
    console.error('Unexpected error rejecting hobby request:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
}