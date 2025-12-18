import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, artist } = await req.json();
    
    if (!title || !artist) {
      return new Response(
        JSON.stringify({ error: 'Title and artist are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Searching Deezer for: "${title}" by "${artist}"`);
    
    // Build search query - combine artist and title for better results
    const query = encodeURIComponent(`${artist} ${title}`);
    const url = `https://api.deezer.com/search?q=${query}&limit=5`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log(`Deezer returned ${data.data?.length || 0} results`);
    
    if (data.data && data.data.length > 0) {
      // Find the best match - prioritize exact title match
      const normalizeString = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
      const normalizedTitle = normalizeString(title);
      const normalizedArtist = normalizeString(artist);
      
      let bestMatch = data.data[0];
      
      for (const track of data.data) {
        const trackTitle = normalizeString(track.title || '');
        const trackArtist = normalizeString(track.artist?.name || '');
        
        // Check for exact title match
        if (trackTitle === normalizedTitle || trackTitle.includes(normalizedTitle)) {
          // Also check artist match
          if (trackArtist.includes(normalizedArtist) || normalizedArtist.includes(trackArtist)) {
            bestMatch = track;
            break;
          }
        }
      }
      
      console.log(`Best match: "${bestMatch.title}" by "${bestMatch.artist?.name}" - ID: ${bestMatch.id}`);
      
      return new Response(
        JSON.stringify({
          found: true,
          deezerUrl: bestMatch.link,
          trackId: bestMatch.id,
          title: bestMatch.title,
          artist: bestMatch.artist?.name,
          albumCover: bestMatch.album?.cover_medium,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('No results found on Deezer');
    return new Response(
      JSON.stringify({ found: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error searching Deezer:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
