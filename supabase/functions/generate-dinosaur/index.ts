import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Fun facts about dinosaurs (inspired by Wikipedia and paleontology)
const DINO_FUN_FACTS: Record<string, string[]> = {
  't-rex': [
    "Le T-Rex avait la morsure la plus puissante de tous les animaux terrestres : 6 tonnes de pression !",
    "Ses petits bras pouvaient quand même soulever 200 kg chacun !",
    "Le T-Rex vivait il y a 68 millions d'années en Amérique du Nord.",
    "Son nom signifie 'Roi des lézards tyrans' en latin.",
    "Un T-Rex adulte pouvait mesurer 12 mètres de long et peser 9 tonnes !",
  ],
  'triceratops': [
    "Le Tricératops avait 3 cornes et une collerette osseuse pour se protéger.",
    "Sa collerette pouvait mesurer jusqu'à 2 mètres de large !",
    "Il vivait en troupeaux comme les bisons d'aujourd'hui.",
    "Son bec ressemblait à celui d'un perroquet géant.",
    "C'était l'un des derniers dinosaures avant l'extinction.",
  ],
  'velociraptor': [
    "Le vrai Vélociraptor était de la taille d'une dinde, pas comme dans les films !",
    "Il avait des plumes sur tout le corps comme un oiseau.",
    "Sa griffe en forme de faucille mesurait 6,5 cm de long.",
    "Il chassait probablement en meute comme les loups.",
    "Son nom signifie 'voleur rapide' en latin.",
  ],
  'stegosaurus': [
    "Les plaques sur son dos servaient peut-être à réguler sa température.",
    "Son cerveau était de la taille d'une noix !",
    "Sa queue avait 4 pointes appelées 'thagomizer' pour se défendre.",
    "Il vivait 80 millions d'années AVANT le T-Rex !",
    "Il pouvait mesurer 9 mètres de long.",
  ],
  'pterodactyl': [
    "Le Ptérodactyle n'est pas un dinosaure mais un reptile volant !",
    "Certains ptérosaures avaient une envergure de 10 mètres, comme un petit avion !",
    "Ils ont été les premiers vertébrés à maîtriser le vol.",
    "Leur nom signifie 'doigt ailé' en grec.",
    "Ils se nourrissaient principalement de poissons.",
  ],
  'brachiosaurus': [
    "Le Brachiosaure pouvait atteindre 13 mètres de haut, comme un immeuble de 4 étages !",
    "Il mangeait environ 400 kg de plantes par jour.",
    "Contrairement aux autres sauropodes, ses pattes avant étaient plus longues que les arrières.",
    "Il pesait environ 56 tonnes, comme 10 éléphants !",
    "Son cœur devait être énorme pour pomper le sang jusqu'à sa tête.",
  ],
  'ankylosaurus': [
    "L'Ankylosaure était recouvert d'une armure osseuse comme un tank vivant !",
    "Sa queue se terminait par une massue de 45 kg capable de briser des os.",
    "Même ses paupières étaient blindées !",
    "Il pesait environ 6 tonnes malgré sa petite taille.",
    "Son armure était faite de plaques osseuses appelées ostéodermes.",
  ],
  'spinosaurus': [
    "Le Spinosaure était le plus grand dinosaure carnivore, plus grand que le T-Rex !",
    "Sa voile dorsale pouvait mesurer 2 mètres de haut.",
    "C'était un excellent nageur qui chassait les poissons.",
    "Il vivait en Afrique du Nord il y a 95 millions d'années.",
    "Son museau ressemblait à celui d'un crocodile.",
  ],
};

const getRandomFunFact = (dinoType: string): string => {
  const normalizedType = dinoType.toLowerCase().replace(/[éè]/g, 'e').replace(/[àâ]/g, 'a');
  
  // Map French names to English keys
  const typeMapping: Record<string, string> = {
    'tyrannosaurus': 't-rex',
    'tyrannosaure': 't-rex',
    't-rex': 't-rex',
    'triceratops': 'triceratops',
    'velocirapteur': 'velociraptor',
    'velociraptor': 'velociraptor',
    'stegosaure': 'stegosaurus',
    'stegosaurus': 'stegosaurus',
    'pterodactyle': 'pterodactyl',
    'pterodactyl': 'pterodactyl',
    'brachiosaure': 'brachiosaurus',
    'brachiosaurus': 'brachiosaurus',
    'ankylosaure': 'ankylosaurus',
    'ankylosaurus': 'ankylosaurus',
    'spinosaure': 'spinosaurus',
    'spinosaurus': 'spinosaurus',
  };

  const key = typeMapping[normalizedType] || 't-rex';
  const facts = DINO_FUN_FACTS[key] || DINO_FUN_FACTS['t-rex'];
  return facts[Math.floor(Math.random() * facts.length)];
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dinoType, dinoName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Generate a realistic dinosaur image
    const prompt = `Create a scientifically accurate, realistic ${dinoType} dinosaur.
    The dinosaur should be:
    - Photorealistic with detailed scales, feathers (if appropriate), and textures
    - Anatomically correct based on paleontological research
    - In a natural prehistoric environment (jungle, swamp, or plains)
    - Dynamic pose showing the dinosaur in its natural behavior
    - Dramatic lighting like a nature documentary
    - High detail on skin texture, eyes, and muscle definition
    - Named "${dinoName}" 
    Style: National Geographic wildlife photography, ultra-realistic, cinematic lighting, 8K detail`;

    console.log(`Generating realistic dinosaur image for type: ${dinoType}, name: ${dinoName}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Trop de requêtes, réessaie plus tard." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits insuffisants." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response received:", JSON.stringify(data).substring(0, 500));

    // Extract the image from the response
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageUrl) {
      console.error("No image in response. Full response:", JSON.stringify(data));
      // Return a fallback with fun fact but no image
      const funFact = getRandomFunFact(dinoType);
      return new Response(
        JSON.stringify({ 
          success: true, 
          imageUrl: null,
          dinoName,
          dinoType,
          funFact,
          warning: "Image generation failed"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get a fun fact about the dinosaur
    const funFact = getRandomFunFact(dinoType);

    return new Response(
      JSON.stringify({ 
        success: true, 
        imageUrl,
        dinoName,
        dinoType,
        funFact
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating dinosaur:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
