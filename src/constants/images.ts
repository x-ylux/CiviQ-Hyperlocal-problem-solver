/** Curated Unsplash photos — plants, earth, sustainability */
export const IMAGES = {
  earth: "https://images.unsplash.com/photo-1614730321146-b063fa5f9460?w=1400&q=80&auto=format&fit=crop",
  earthHands: "https://images.unsplash.com/photo-1542601906990-b46d7fb4668e?w=1400&q=80&auto=format&fit=crop",
  forest: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1400&q=80&auto=format&fit=crop",
  leaves: "https://images.unsplash.com/photo-1466781783364-36c667e68334?w=1400&q=80&auto=format&fit=crop",
  plantClose: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1400&q=80&auto=format&fit=crop",
  garden: "https://images.unsplash.com/photo-1585320806297-97985b4008fd?w=800&q=80&auto=format&fit=crop",
  treePlanting: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&q=80&auto=format&fit=crop",
  recycling: "https://images.unsplash.com/photo-1532996122724-e3c354a0ba15?w=800&q=80&auto=format&fit=crop",
  cleanCity: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80&auto=format&fit=crop",
  water: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80&auto=format&fit=crop",
  compost: "https://images.unsplash.com/photo-1595846519845-68e298c2edd8?w=800&q=80&auto=format&fit=crop",
  rooftop: "https://images.unsplash.com/photo-1592150621744-aca125f726b8?w=800&q=80&auto=format&fit=crop",
} as const;

export const CAMPAIGN_IMAGES: Record<string, string> = {
  clean: IMAGES.cleanCity,
  tree: IMAGES.treePlanting,
  water: IMAGES.water,
  recycle: IMAGES.recycling,
  school: IMAGES.garden,
  eco: IMAGES.rooftop,
};
