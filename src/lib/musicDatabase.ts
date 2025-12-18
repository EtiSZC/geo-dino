import { GenreId } from '@/types/app';

interface MusicTrack {
  title: string;
  artist: string;
  spotifyUrl: string;
  deezerUrl: string;
  appleMusicUrl: string;
}

const MUSIC_DATABASE: Record<GenreId, MusicTrack[]> = {
  'pop-rock': [
    { title: 'Mr. Brightside', artist: 'The Killers', spotifyUrl: 'https://open.spotify.com/track/003vvx7Niy0yvhvHt4a68B', deezerUrl: 'https://www.deezer.com/track/1109731', appleMusicUrl: 'https://music.apple.com/us/album/mr-brightside/1450500664?i=1450500667' },
    { title: 'Take Me Out', artist: 'Franz Ferdinand', spotifyUrl: 'https://open.spotify.com/track/5qaEfEh1AtSdrdrByCP7qR', deezerUrl: 'https://www.deezer.com/track/1076524', appleMusicUrl: 'https://music.apple.com/us/album/take-me-out/716188630?i=716188742' },
    { title: 'Somebody Told Me', artist: 'The Killers', spotifyUrl: 'https://open.spotify.com/track/6K0IEVMpPY2sLxjMhJWBzn', deezerUrl: 'https://www.deezer.com/track/1109732', appleMusicUrl: 'https://music.apple.com/us/album/somebody-told-me/1450500664?i=1450500668' },
  ],
  'synthwave': [
    { title: 'Nightcall', artist: 'Kavinsky', spotifyUrl: 'https://open.spotify.com/track/0U0ldCRmgCqhVvD6ksG63j', deezerUrl: 'https://www.deezer.com/track/15483813', appleMusicUrl: 'https://music.apple.com/us/album/nightcall/1440839538?i=1440839823' },
    { title: 'Tech Noir', artist: 'Gunship', spotifyUrl: 'https://open.spotify.com/track/2R7T5H35hL2gPQ5VaqFxu4', deezerUrl: 'https://www.deezer.com/track/109789324', appleMusicUrl: 'https://music.apple.com/us/album/tech-noir/1061165092?i=1061165099' },
    { title: 'A Real Hero', artist: 'College & Electric Youth', spotifyUrl: 'https://open.spotify.com/track/5S7XCFQ6ReWqzQyR0NpDFu', deezerUrl: 'https://www.deezer.com/track/15483769', appleMusicUrl: 'https://music.apple.com/us/album/a-real-hero/1440839538?i=1440839548' },
  ],
  'punk-rock': [
    { title: 'Basket Case', artist: 'Green Day', spotifyUrl: 'https://open.spotify.com/track/6L9W3Kqlx4oJNhLrRIyZ6K', deezerUrl: 'https://www.deezer.com/track/786241', appleMusicUrl: 'https://music.apple.com/us/album/basket-case/1161503945?i=1161503964' },
    { title: 'All the Small Things', artist: 'blink-182', spotifyUrl: 'https://open.spotify.com/track/2mLJkFKwjQGG9SRAUNzX3Y', deezerUrl: 'https://www.deezer.com/track/916424', appleMusicUrl: 'https://music.apple.com/us/album/all-the-small-things/1440839750?i=1440840008' },
    { title: 'Blitzkrieg Bop', artist: 'Ramones', spotifyUrl: 'https://open.spotify.com/track/4cPnNnCZVtpaciRO8VegFh', deezerUrl: 'https://www.deezer.com/track/14461830', appleMusicUrl: 'https://music.apple.com/us/album/blitzkrieg-bop/1440749251?i=1440749263' },
  ],
  'rnb': [
    { title: 'No Diggity', artist: 'Blackstreet', spotifyUrl: 'https://open.spotify.com/track/11GKMvRJXzLT3Io5kXkU6E', deezerUrl: 'https://www.deezer.com/track/565282', appleMusicUrl: 'https://music.apple.com/us/album/no-diggity/271969570?i=271969571' },
    { title: 'Untitled (How Does It Feel)', artist: "D'Angelo", spotifyUrl: 'https://open.spotify.com/track/3OFqkMiSqSCRKSM4LBjOFR', deezerUrl: 'https://www.deezer.com/track/3157795', appleMusicUrl: 'https://music.apple.com/us/album/untitled-how-does-it-feel/255343170?i=255343314' },
    { title: 'Crazy in Love', artist: 'Beyoncé', spotifyUrl: 'https://open.spotify.com/track/5IVuqXILoxVWvWEPm82Jxr', deezerUrl: 'https://www.deezer.com/track/908604', appleMusicUrl: 'https://music.apple.com/us/album/crazy-in-love-feat-jay-z/201274359?i=201274640' },
  ],
  'reggae': [
    { title: 'Three Little Birds', artist: 'Bob Marley', spotifyUrl: 'https://open.spotify.com/track/4HypGzGLU4FP2Ht2W5cvKH', deezerUrl: 'https://www.deezer.com/track/3613756', appleMusicUrl: 'https://music.apple.com/us/album/three-little-birds/1469575763?i=1469575893' },
    { title: 'Red Red Wine', artist: 'UB40', spotifyUrl: 'https://open.spotify.com/track/7dVMp5P2E0OmNVCQzPvtSu', deezerUrl: 'https://www.deezer.com/track/2320422', appleMusicUrl: 'https://music.apple.com/us/album/red-red-wine/1440840561?i=1440840583' },
    { title: 'Is This Love', artist: 'Bob Marley', spotifyUrl: 'https://open.spotify.com/track/5k6K3t1M9JAhTFxfMfFPZ6', deezerUrl: 'https://www.deezer.com/track/3614165', appleMusicUrl: 'https://music.apple.com/us/album/is-this-love/1469575763?i=1469576157' },
  ],
  'ska': [
    { title: 'Sell Out', artist: 'Reel Big Fish', spotifyUrl: 'https://open.spotify.com/track/1HfMRBHJRPuVKlXjMjqAXZ', deezerUrl: 'https://www.deezer.com/track/590648', appleMusicUrl: 'https://music.apple.com/us/album/sell-out/300856441?i=300856443' },
    { title: 'Superman', artist: 'Goldfinger', spotifyUrl: 'https://open.spotify.com/track/7AexBJkBWcvkCxC9mJnQa4', deezerUrl: 'https://www.deezer.com/track/68478611', appleMusicUrl: 'https://music.apple.com/us/album/superman/1440843587?i=1440843841' },
    { title: 'The Impression That I Get', artist: 'The Mighty Mighty Bosstones', spotifyUrl: 'https://open.spotify.com/track/5KG6yJo6g0WZHGlXNhXqPk', deezerUrl: 'https://www.deezer.com/track/564820', appleMusicUrl: 'https://music.apple.com/us/album/the-impression-that-i-get/290841884?i=290841891' },
  ],
  'soul': [
    { title: "Ain't No Mountain High Enough", artist: 'Marvin Gaye & Tammi Terrell', spotifyUrl: 'https://open.spotify.com/track/7tqhbajSfrz2F7E1Z75ASX', deezerUrl: 'https://www.deezer.com/track/7171270', appleMusicUrl: 'https://music.apple.com/us/album/aint-no-mountain-high-enough/1440740765?i=1440740768' },
    { title: 'Respect', artist: 'Aretha Franklin', spotifyUrl: 'https://open.spotify.com/track/7s25THrKz86DM225dOYwnr', deezerUrl: 'https://www.deezer.com/track/904034', appleMusicUrl: 'https://music.apple.com/us/album/respect/1440644063?i=1440644067' },
    { title: "What's Going On", artist: 'Marvin Gaye', spotifyUrl: 'https://open.spotify.com/track/5WndWfzGwCkHzAbQXVkg2V', deezerUrl: 'https://www.deezer.com/track/904090', appleMusicUrl: 'https://music.apple.com/us/album/whats-going-on/1440712963?i=1440712965' },
  ],
  'northern-soul': [
    { title: 'Do I Love You', artist: 'Frank Wilson', spotifyUrl: 'https://open.spotify.com/track/4HTkA8RSwD0G3UVx3VK3nP', deezerUrl: 'https://www.deezer.com/track/14169657', appleMusicUrl: 'https://music.apple.com/us/album/do-i-love-you-indeed-i-do/712411212?i=712411242' },
    { title: 'Out on the Floor', artist: 'Dobie Gray', spotifyUrl: 'https://open.spotify.com/track/5rp3XZPO5PfQlwZWXxV3Hg', deezerUrl: 'https://www.deezer.com/track/2523481', appleMusicUrl: 'https://music.apple.com/us/album/out-on-the-floor/295949684?i=295949699' },
    { title: 'Tainted Love', artist: 'Gloria Jones', spotifyUrl: 'https://open.spotify.com/track/1eAoYPLfLQz0gRuZ4sxO5M', deezerUrl: 'https://www.deezer.com/track/72116927', appleMusicUrl: 'https://music.apple.com/us/album/tainted-love/336147556?i=336147563' },
  ],
  'rap': [
    { title: 'Juicy', artist: 'The Notorious B.I.G.', spotifyUrl: 'https://open.spotify.com/track/5ByAIlEEnxYdvpnezg7HTX', deezerUrl: 'https://www.deezer.com/track/60955251', appleMusicUrl: 'https://music.apple.com/us/album/juicy-2005-remaster/1440827981?i=1440828122' },
    { title: 'N.Y. State of Mind', artist: 'Nas', spotifyUrl: 'https://open.spotify.com/track/6WNXH3eM5UqWKJPZnDpASE', deezerUrl: 'https://www.deezer.com/track/2497507', appleMusicUrl: 'https://music.apple.com/us/album/n-y-state-of-mind/1440831281?i=1440831290' },
    { title: 'C.R.E.A.M.', artist: 'Wu-Tang Clan', spotifyUrl: 'https://open.spotify.com/track/119c93MHjrDLJTApCVGpvx', deezerUrl: 'https://www.deezer.com/track/2387887', appleMusicUrl: 'https://music.apple.com/us/album/c-r-e-a-m-cash-rules-everything-around-me/269842381?i=269842387' },
  ],
  'gfunk': [
    { title: 'Nuthin\' but a "G" Thang', artist: 'Dr. Dre', spotifyUrl: 'https://open.spotify.com/track/5lbCIrEFkOxBbMVOoGBQwP', deezerUrl: 'https://www.deezer.com/track/1174746', appleMusicUrl: 'https://music.apple.com/us/album/nuthin-but-a-g-thang/6654037?i=6654006' },
    { title: 'Regulate', artist: 'Warren G & Nate Dogg', spotifyUrl: 'https://open.spotify.com/track/7LzeUQGdCGMGemQzQnxqBk', deezerUrl: 'https://www.deezer.com/track/3122737', appleMusicUrl: 'https://music.apple.com/us/album/regulate/256823190?i=256823206' },
    { title: 'Gin and Juice', artist: 'Snoop Dogg', spotifyUrl: 'https://open.spotify.com/track/0VF7YLIu9Wy9gTNjTW2XsO', deezerUrl: 'https://www.deezer.com/track/1168316', appleMusicUrl: 'https://music.apple.com/us/album/gin-and-juice/275027428?i=275027436' },
  ],
  'funk': [
    { title: 'Superstition', artist: 'Stevie Wonder', spotifyUrl: 'https://open.spotify.com/track/1h2xVEoJORqrg71HocgqXd', deezerUrl: 'https://www.deezer.com/track/904090', appleMusicUrl: 'https://music.apple.com/us/album/superstition/1440772347?i=1440772620' },
    { title: 'Get Up (I Feel Like Being a) Sex Machine', artist: 'James Brown', spotifyUrl: 'https://open.spotify.com/track/3YBXL7DKrIwLxJy7pCPvkA', deezerUrl: 'https://www.deezer.com/track/904050', appleMusicUrl: 'https://music.apple.com/us/album/get-up-i-feel-like-being-a-sex-machine/1443178773?i=1443178777' },
    { title: 'Give Up the Funk', artist: 'Parliament', spotifyUrl: 'https://open.spotify.com/track/7McrrkWIRNmH0JiO7MWHRb', deezerUrl: 'https://www.deezer.com/track/3613848', appleMusicUrl: 'https://music.apple.com/us/album/give-up-the-funk-tear-the-roof-off-the-sucker/1440854025?i=1440854029' },
  ],
};

export function getRandomTrack(genre: GenreId): MusicTrack {
  const tracks = MUSIC_DATABASE[genre];
  const randomIndex = Math.floor(Math.random() * tracks.length);
  return tracks[randomIndex];
}
