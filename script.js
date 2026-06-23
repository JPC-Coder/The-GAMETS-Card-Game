const cardNames = [
  "Air Head",
  "Vertex",
  "Dr. Smoosh Smoke",
  "Bat-Bunny",
  "Twister",
  "Krylon",
  "GA Milk",
  "Newspaper Man",
  "Slumbok",
  "Trash Can",
  "Masked Hood",
  "Ice Cube",
  "Blue Fury",
  "Thumbs Up",
  "Spray Skater",
  "Chain Lock",
  "Gamets Crew",
  "Ink",
  "Inferno Dragon",
  "Golden Blaze",
  "Hell Rider",
  "Slick Smash",
  "Blink Doom",
  "Chain Fury",
  "Call Out",
  "Toxic Rose",
  "Tideborn Sentinel",
  "Skidoo",
  "Brick Fist",
  "Chaos Golem",
  "Lil Gamet",
  "Prism Queen",
  "Cosmo Keeper",
  "Atom Flame",
  "Scarred Warrior",
  "Stoneblade",
  "Soapman",
  "Shock Goo",
  "Chain Chomp",
  "Vine Shade",
  "Volt Smash",
  "Spring Jester",
  "Wazzpin",
  "Slime Raider",
  "Gem Girl",
  "Stopper",
  "Amber Breaker",
  "Blob Can",
  "Color Girl",
  "The Gamets Crew"
];

const diamondIds = new Set([1, 5, 12, 13, 18, 20, 23, 27, 30, 32, 33, 35, 36, 38, 41]);
const starIds = new Set([4, 10, 15, 17, 21, 22, 24, 26, 31, 34]);
const wildIds = new Set([46, 47, 48, 49, 50]);

const baseCards = cardNames.map((name, index) => {
  const id = index + 1;
  let kind = "normal";
  let type = "battle";

  if (diamondIds.has(id)) kind = "diamond";
  if (starIds.has(id)) kind = "star";
  if (wildIds.has(id)) {
    kind = "wild";
    type = "wild";
  }

  return {
    id,
    name,
    kind,
    type,
    image: `./assets/cards/card${String(id).padStart(2, "0")}.jpg`
  };
});

const state = {
  mode: "bot",
  deck: [],
  allCards: [],
  hands: {
    player: [],
    opponent: []
  },
  captured: {
    player: [],
    opponent: []
  },
  discard: [],
  pendingAttack: null,
  lastBattle: null,
  activeSide: "player",
  action: "attack",
  selected: null,
  round: 1,
  gameOver: false,
  log: []
};