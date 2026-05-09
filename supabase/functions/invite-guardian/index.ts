import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { dogId, email } = await req.json();

    if (!dogId || !email) {
      return new Response(
        JSON.stringify({ error: 'dogId and email are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Service-role client — can access auth.admin and bypass RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Verify the calling user is a guardian of this dog
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const siteUrl = Deno.env.get('SITE_URL') ?? 'http://localhost:4200';

    // Check if a profile with this email already exists
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (profile) {
      // User has an account — create dog_guardian directly
      const { data: guardian, error } = await supabase
        .from('dog_guardians')
        .insert({
          dog_id: dogId,
          user_id: profile.id,
          role: 'guardian',
          status: 'invited',
          expires_at: expiresAt,
        })
        .select()
        .single();

      if (error) {
        const isDuplicate = error.message.includes('duplicate') || error.message.includes('unique');
        return new Response(
          JSON.stringify({ error: isDuplicate ? 'duplicate' : error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      return new Response(
        JSON.stringify({ type: 'existing_user', guardian: { ...guardian, invited_email: normalizedEmail } }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    } else {
      // No account — store pending invite by email and send registration invite
      const { data: guardian, error } = await supabase
        .from('dog_guardians')
        .insert({
          dog_id: dogId,
          user_id: null,
          invited_email: normalizedEmail,
          role: 'guardian',
          status: 'invited',
          expires_at: expiresAt,
        })
        .select()
        .single();

      if (error) {
        const isDuplicate = error.message.includes('duplicate') || error.message.includes('unique');
        return new Response(
          JSON.stringify({ error: isDuplicate ? 'duplicate' : error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      // Send invite email via Supabase Auth
      const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
        normalizedEmail,
        { redirectTo: `${siteUrl}/auth/callback?invite=guardian&dog=${dogId}` },
      );

      if (inviteError) {
        console.error('Failed to send invite email:', inviteError.message);
        // Don't fail the request — invite record exists, email can be resent
      }

      return new Response(
        JSON.stringify({ type: 'new_user', guardian }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
  } catch (err) {
    console.error('invite-guardian error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
