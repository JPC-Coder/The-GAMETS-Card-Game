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

const els = {
  deckCount: document.querySelector("#deck-count"),
  roundCount: document.querySelector("#round-count"),
  playerCaptures: document.querySelector("#player-captures"),
  opponentCaptures: document.querySelector("#opponent-captures"),
  playerScoreLabel: document.querySelector("#player-score-label"),
  opponentScoreLabel: document.querySelector("#opponent-score-label"),
  turnBanner: document.querySelector("#turn-banner"),
  attackSlot: document.querySelector("#attack-slot"),
  defenseSlot: document.querySelector("#defense-slot"),
  battleResult: document.querySelector("#battle-result"),
  selectedReadout: document.querySelector("#selected-readout"),
  boostAttack: document.querySelector("#boost-attack"),
  boostDefense: document.querySelector("#boost-defense"),
  playCard: document.querySelector("#play-card"),
  newMatch: document.querySelector("#new-match"),
  playerHand: document.querySelector("#player-hand"),
  opponentHand: document.querySelector("#opponent-hand"),
  playerZone: document.querySelector("#player-zone"),
  opponentZone: document.querySelector("#opponent-zone"),
  playerHandCount: document.querySelector("#player-hand-count"),
  opponentHandCount: document.querySelector("#opponent-hand-count"),
  opponentKicker: document.querySelector("#opponent-kicker"),
  opponentTitle: document.querySelector("#opponent-title"),
  battleLog: document.querySelector("#battle-log"),
  cardTemplate: document.querySelector("#card-template"),
  galleryGrid: document.querySelector("#gallery-grid"),
  galleryCounts: document.querySelector("#gallery-counts"),
  onlinePanel: document.querySelector("#online-panel"),
  roomCode: document.querySelector("#room-code"),
  roomStatus: document.querySelector("#room-status")
};

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(cards) {
  const copy = [...cards];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function sideLabel(side) {
  if (side === "player") return state.mode === "local" || state.mode === "online" ? "Player 1" : "You";
  if (state.mode === "bot") return "Bot";
  if (state.mode === "online") return "Online Player";
  return "Player 2";
}

function otherSide(side) {
  return side === "player" ? "opponent" : "player";
}

function createMatchCard(base) {
  const attack = randomInt(100, 820);
  const defense = randomInt(100, 820);

  return {
    ...base,
    attack,
    defense,
    baseAttack: attack,
    baseDefense: defense,
    boostUsed: false,
    bonusAttack: 0,
    bonusDefense: 0
  };
}

function newMatch(mode = state.mode) {
  const freshCards = baseCards.map(createMatchCard);
  state.mode = mode;
  state.allCards = freshCards;
  state.deck = shuffle(freshCards);
  state.hands.player = [];
  state.hands.opponent = [];
  state.captured.player = [];
  state.captured.opponent = [];
  state.discard = [];
  state.pendingAttack = null;
  state.lastBattle = null;
  state.activeSide = "player";
  state.action = "attack";
  state.selected = null;
  state.round = 1;
  state.gameOver = false;
  state.log = [
    "New match started. Attack and defense were randomly set from 100 to 820."
  ];

  for (let i = 0; i < 5; i += 1) {
    drawOne("player");
    drawOne("opponent");
  }

  render();
}

function drawOne(side) {
  const card = state.deck.shift();
  if (card) {
    state.hands[side].push(card);
  }
  return card;
}

function drawToFive(side) {
  while (state.hands[side].length < 5 && state.deck.length > 0) {
    drawOne(side);
  }
}

function removeFromHand(side, cardId) {
  const hand = state.hands[side];
  const index = hand.findIndex((card) => card.id === cardId);
  if (index < 0) return null;
  return hand.splice(index, 1)[0];
}

function addLog(message) {
  state.log.unshift(message);
  state.log = state.log.slice(0, 8);
}

function boostRange(card) {
  if (!card || card.type === "wild") return null;
  if (card.kind === "diamond") return [100, 500];
  if (card.kind === "star") return [200, 1000];
  return null;
}

function powerName(card) {
  if (card.kind === "diamond") return "Diamond";
  if (card.kind === "star") return "Star";
  if (card.kind === "wild") return "Free Pass";
  return "Normal";
}

function applyBoost(card, stat, ownerLabel = "Player") {
  const range = boostRange(card);
  if (!range || card.boostUsed) return 0;

  const amount = randomInt(range[0], range[1]);
  if (stat === "attack") {
    card.attack += amount;
    card.bonusAttack += amount;
  } else {
    card.defense += amount;
    card.bonusDefense += amount;
  }
  card.boostUsed = true;
  addLog(`${ownerLabel} used ${powerName(card)} power on ${card.name}: +${amount} ${stat.toUpperCase()}.`);
  return amount;
}

function selectedCard() {
  if (!state.selected) return null;
  return state.hands[state.selected.side].find((card) => card.id === state.selected.cardId) || null;
}

function canHumanActOn(side) {
  if (state.gameOver) return false;
  if (state.activeSide !== side) return false;
  return state.mode !== "bot" || side === "player";
}

function chooseCard(side, cardId) {
  if (!canHumanActOn(side)) return;
  state.selected = { side, cardId };
  render();
}

function playSelectedCard() {
  const card = selectedCard();
  if (!card || !canHumanActOn(state.selected.side)) return;
  playCard(state.selected.side, card);
}

function playCard(side, card) {
  if (state.gameOver) return;

  if (card.type === "wild") {
    useFreePass(side, card);
    return;
  }

  if (state.action === "attack") {
    const attackCard = removeFromHand(side, card.id);
    if (!attackCard) return;
    state.pendingAttack = {
      side,
      card: attackCard
    };
    state.lastBattle = {
      attack: attackCard,
      defense: null,
      message: `${sideLabel(side)} played ${attackCard.name} in attack mode.`
    };
    state.selected = null;
    state.activeSide = otherSide(side);
    state.action = "defense";
    addLog(`${sideLabel(side)} attacked with ${attackCard.name} (${attackCard.attack} ATK).`);
    render();
    maybeRunBotTurn();
    return;
  }

  if (!state.pendingAttack) return;
  const defenseCard = removeFromHand(side, card.id);
  if (!defenseCard) return;
  resolveBattle(defenseCard, side);
}

function useFreePass(side, card) {
  const passCard = removeFromHand(side, card.id);
  if (!passCard) return;

  state.discard.push(passCard);
  const drawn = drawOne(side);
  const drawText = drawn ? ` drew ${drawn.name}.` : " could not draw because the deck is empty.";

  if (state.pendingAttack) {
    state.hands[state.pendingAttack.side].push(state.pendingAttack.card);
    state.lastBattle = {
      attack: state.pendingAttack.card,
      defense: passCard,
      message: `${sideLabel(side)} used Free Pass. Battle canceled.`
    };
    state.pendingAttack = null;
  } else {
    state.lastBattle = {
      attack: passCard,
      defense: null,
      message: `${sideLabel(side)} used Free Pass instead of attacking.`
    };
  }

  addLog(`${sideLabel(side)} used ${passCard.name} as FREE PASS and${drawText}`);
  state.selected = null;
  state.activeSide = otherSide(side);
  state.action = "attack";
  state.round += 1;
  checkGameOver();
  render();
  maybeRunBotTurn();
}

function resolveBattle(defenseCard, defenderSide) {
  const attackCard = state.pendingAttack.card;
  const attackerSide = state.pendingAttack.side;
  const attackPower = attackCard.attack;
  const defensePower = defenseCard.defense;
  const attackWins = attackPower > defensePower;
  const winnerSide = attackWins ? attackerSide : defenderSide;
  const loserCard = attackWins ? defenseCard : attackCard;
  const winnerCard = attackWins ? attackCard : defenseCard;

  state.captured[winnerSide].push(loserCard);
  state.discard.push(winnerCard);
  state.lastBattle = {
    attack: attackCard,
    defense: defenseCard,
    message: attackWins
      ? `${attackCard.name} breaks through ${defenseCard.name}.`
      : `${defenseCard.name} blocks ${attackCard.name}.`
  };

  addLog(
    attackWins
      ? `${sideLabel(attackerSide)} wins: ${attackPower} ATK beats ${defensePower} DEF and captures ${defenseCard.name}.`
      : `${sideLabel(defenderSide)} wins: ${defensePower} DEF holds against ${attackPower} ATK and captures ${attackCard.name}.`
  );

  state.pendingAttack = null;
  state.selected = null;
  drawToFive("player");
  drawToFive("opponent");
  state.activeSide = defenderSide;
  state.action = "attack";
  state.round += 1;
  checkGameOver();
  render();
  maybeRunBotTurn();
}

function checkGameOver() {
  if (state.deck.length > 0) return;
  if (state.hands.player.length > 0 && state.hands.opponent.length > 0) return;

  state.gameOver = true;
  const playerScore = state.captured.player.length;
  const opponentScore = state.captured.opponent.length;
  let message = "Game over. The match is tied by captured cards.";

  if (playerScore > opponentScore) {
    message = `Game over. ${sideLabel("player")} win by captured cards.`;
  } else if (opponentScore > playerScore) {
    message = `Game over. ${sideLabel("opponent")} wins by captured cards.`;
  }

  addLog(message);
}

function playableBattleCards(side) {
  return state.hands[side].filter((card) => card.type === "battle");
}

function botChooseAttack() {
  const battleCards = playableBattleCards("opponent");
  if (battleCards.length === 0) {
    const pass = state.hands.opponent.find((card) => card.type === "wild");
    if (pass) useFreePass("opponent", pass);
    return;
  }

  const sorted = [...battleCards].sort((a, b) => b.attack - a.attack);
  const pick = sorted[randomInt(0, Math.min(2, sorted.length - 1))];
  if (boostRange(pick) && !pick.boostUsed && Math.random() > 0.35) {
    applyBoost(pick, "attack", "Bot");
  }
  playCard("opponent", pick);
}

function botChooseDefense() {
  const attackCard = state.pendingAttack?.card;
  if (!attackCard) return;

  const pass = state.hands.opponent.find((card) => card.type === "wild");
  const battleCards = playableBattleCards("opponent");
  if (battleCards.length === 0) {
    if (pass) useFreePass("opponent", pass);
    return;
  }

  const bestDefense = [...battleCards].sort((a, b) => b.defense - a.defense)[0];
  if (pass && attackCard.attack > bestDefense.defense + 120 && Math.random() > 0.55) {
    useFreePass("opponent", pass);
    return;
  }

  const winningOptions = battleCards
    .filter((card) => card.defense >= attackCard.attack)
    .sort((a, b) => a.defense - b.defense);
  const pick = winningOptions[0] || bestDefense;

  if (boostRange(pick) && !pick.boostUsed && pick.defense <= attackCard.attack && Math.random() > 0.25) {
    applyBoost(pick, "defense", "Bot");
  } else if (boostRange(pick) && !pick.boostUsed && Math.random() > 0.7) {
    applyBoost(pick, "defense", "Bot");
  }

  playCard("opponent", pick);
}

function maybeRunBotTurn() {
  if (state.mode !== "bot" || state.gameOver || state.activeSide !== "opponent") return;

  window.setTimeout(() => {
    if (state.mode !== "bot" || state.gameOver || state.activeSide !== "opponent") return;
    if (state.action === "attack") {
      botChooseAttack();
    } else {
      botChooseDefense();
    }
  }, 650);
}

function render() {
  renderHeader();
  renderBattlefield();
  renderHands();
  renderControls();
  renderLog();
  renderGallery();
}

function renderHeader() {
  const opponentName = sideLabel("opponent");
  els.deckCount.textContent = state.deck.length;
  els.roundCount.textContent = state.round;
  els.playerCaptures.textContent = state.captured.player.length;
  els.opponentCaptures.textContent = state.captured.opponent.length;
  els.playerScoreLabel.textContent = state.mode === "local" || state.mode === "online" ? "P1 kept" : "You kept";
  els.opponentScoreLabel.textContent = `${opponentName} kept`;
  els.playerHandCount.textContent = `${state.hands.player.length} cards`;
  els.opponentHandCount.textContent = `${state.hands.opponent.length} cards`;
  els.opponentKicker.textContent = opponentName;
  els.opponentTitle.textContent = `${opponentName} Hand`;
  els.onlinePanel.classList.toggle("hidden", state.mode !== "online");

  if (state.gameOver) {
    const playerScore = state.captured.player.length;
    const opponentScore = state.captured.opponent.length;
    const winner =
      playerScore === opponentScore
        ? "It is a tie."
        : playerScore > opponentScore
          ? `${sideLabel("player")} win.`
          : `${sideLabel("opponent")} wins.`;
    els.turnBanner.textContent = `Game over. ${winner} Start a new match to play again.`;
    return;
  }

  const active = sideLabel(state.activeSide);
  const actionText = state.action === "attack" ? "choose an attack card" : "choose a defense card";
  if (state.mode === "bot" && state.activeSide === "opponent") {
    els.turnBanner.textContent = `Bot is choosing ${state.action === "attack" ? "an attack" : "a defense"} card.`;
  } else if (state.pendingAttack) {
    els.turnBanner.textContent = `${active} must ${actionText}. ${sideLabel(state.pendingAttack.side)} is attacking with ${state.pendingAttack.card.name}.`;
  } else {
    els.turnBanner.textContent = `${active} must ${actionText}.`;
  }
}

function renderBattlefield() {
  const attackCard = state.pendingAttack?.card || state.lastBattle?.attack || null;
  const defenseCard = state.lastBattle?.defense || null;

  renderSlot(els.attackSlot, attackCard, "Waiting");
  renderSlot(els.defenseSlot, defenseCard, state.pendingAttack ? "Choose defense" : "Waiting");
  els.battleResult.textContent = state.lastBattle?.message || "Attack beats defense when the attack number is bigger.";
}

function renderSlot(slot, card, emptyText) {
  slot.innerHTML = "";
  slot.className = "slot-card";
  if (!card) {
    slot.classList.add("empty");
    slot.textContent = emptyText;
    return;
  }
  slot.appendChild(cardElement(card, { selectable: false }));
}

function renderHands() {
  els.playerZone.classList.toggle("is-active", canHumanActOn("player"));
  els.opponentZone.classList.toggle("is-active", canHumanActOn("opponent"));
  renderHand(els.playerHand, "player");
  renderHand(els.opponentHand, "opponent");
}

function renderHand(container, side) {
  container.innerHTML = "";
  const shouldHide = state.mode === "bot" && side === "opponent";
  const canSelect = canHumanActOn(side);

  if (state.hands[side].length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-hand";
    empty.textContent = "No cards in hand.";
    container.appendChild(empty);
    return;
  }

  state.hands[side].forEach((card) => {
    if (shouldHide) {
      container.appendChild(cardBack());
      return;
    }

    const isSelected = state.selected?.side === side && state.selected?.cardId === card.id;
    const el = cardElement(card, { selectable: canSelect, selected: isSelected });
    if (canSelect) {
      el.addEventListener("click", () => chooseCard(side, card.id));
    }
    container.appendChild(el);
  });
}

function cardBack() {
  const wrapper = document.createElement("div");
  wrapper.className = "card-back";
  const img = document.createElement("img");
  img.src = "./assets/ui/back-logo.jpg";
  img.alt = "GAMETS card back";
  wrapper.appendChild(img);
  return wrapper;
}

function cardElement(card, options = {}) {
  const el = els.cardTemplate.content.firstElementChild.cloneNode(true);
  const img = el.querySelector(".card-image");
  const number = el.querySelector(".card-number");
  const kind = el.querySelector(".card-kind");
  const name = el.querySelector(".card-name");
  const attack = el.querySelector(".attack-value");
  const defense = el.querySelector(".defense-value");

  el.dataset.cardId = card.id;
  el.classList.toggle("active-card", Boolean(options.selected));
  el.classList.toggle("is-wild", card.type === "wild");
  el.disabled = !options.selectable;
  img.src = card.image;
  img.alt = `${card.name} card art`;
  number.textContent = `#${card.id}`;
  name.textContent = card.name;
  attack.textContent = card.attack;
  defense.textContent = card.defense;

  kind.className = `card-kind ${card.kind}`;
  if (card.kind === "diamond") {
    kind.textContent = "D";
    kind.title = "Diamond super card";
  } else if (card.kind === "star") {
    kind.textContent = "S";
    kind.title = "Star boost card";
  } else if (card.kind === "wild") {
    kind.textContent = "PASS";
    kind.title = "Free Pass wild card";
  } else {
    kind.textContent = "G";
    kind.title = "Normal GAMETS card";
  }

  return el;
}

function renderControls() {
  const card = selectedCard();
  const range = boostRange(card);
  const canPlay = Boolean(card) && canHumanActOn(state.selected?.side);
  const canBoost = canPlay && range && !card.boostUsed;

  els.boostAttack.disabled = !canBoost;
  els.boostDefense.disabled = !canBoost;
  els.playCard.disabled = !canPlay;

  if (!card) {
    els.selectedReadout.textContent = "Select a card from the active hand.";
    els.boostAttack.textContent = "Boost ATK";
    els.boostDefense.textContent = "Boost DEF";
    els.playCard.textContent = "Play Card";
    return;
  }

  const boostText = range ? `${powerName(card)} ${range[0]}-${range[1]}` : "No boost";
  const role = card.type === "wild" ? "Free Pass" : state.action === "attack" ? "Attack" : "Defense";
  els.selectedReadout.textContent = `${sideLabel(state.selected.side)} selected ${card.name}. ${role} card. ${boostText}.`;
  els.boostAttack.textContent = range ? `Add ${range[0]}-${range[1]} ATK` : "Boost ATK";
  els.boostDefense.textContent = range ? `Add ${range[0]}-${range[1]} DEF` : "Boost DEF";
  els.playCard.textContent = card.type === "wild"
    ? "Use Free Pass"
    : state.action === "attack"
      ? "Attack"
      : "Defend";
}

function renderLog() {
  els.battleLog.innerHTML = "";
  state.log.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    els.battleLog.appendChild(li);
  });
}

function renderGallery() {
  const cards = [...state.allCards].sort((a, b) => a.id - b.id);
  if (cards.length === 0) return;

  const diamondCount = cards.filter((card) => card.kind === "diamond").length;
  const starCount = cards.filter((card) => card.kind === "star").length;
  const wildCount = cards.filter((card) => card.kind === "wild").length;
  const normalCount = cards.filter((card) => card.kind === "normal").length;

  els.galleryCounts.innerHTML = "";
  [
    `${diamondCount} Diamond`,
    `${starCount} Star`,
    `${wildCount} Free Pass`,
    `${normalCount} Normal`
  ].forEach((label) => {
    const span = document.createElement("span");
    span.textContent = label;
    els.galleryCounts.appendChild(span);
  });

  els.galleryGrid.innerHTML = "";
  cards.forEach((card) => {
    els.galleryGrid.appendChild(cardElement(card, { selectable: false }));
  });
}

function setView(viewName) {
  document.querySelectorAll(".view").forEach((view) => {
    view.classList.toggle("active", view.id === `view-${viewName}`);
  });
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === viewName);
  });
}

function setMode(mode) {
  document.querySelectorAll(".mode-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === mode);
  });
  newMatch(mode);
}

function setupEvents() {
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.view));
  });

  document.querySelectorAll(".mode-button").forEach((button) => {
    button.addEventListener("click", () => setMode(button.dataset.mode));
  });

  els.boostAttack.addEventListener("click", () => {
    const card = selectedCard();
    if (!card) return;
    applyBoost(card, "attack", sideLabel(state.selected.side));
    render();
  });

  els.boostDefense.addEventListener("click", () => {
    const card = selectedCard();
    if (!card) return;
    applyBoost(card, "defense", sideLabel(state.selected.side));
    render();
  });

  els.playCard.addEventListener("click", playSelectedCard);
  els.newMatch.addEventListener("click", () => newMatch(state.mode));

  document.querySelector("#create-room").addEventListener("click", () => {
    const code = `GM${randomInt(1000, 9999)}`;
    els.roomCode.value = code;
    els.roomStatus.textContent = `Room ${code} created. This prototype is ready for a multiplayer server to connect remote players.`;
  });

  document.querySelector("#join-room").addEventListener("click", () => {
    const code = els.roomCode.value.trim().toUpperCase() || "GAMETS";
    els.roomCode.value = code;
    els.roomStatus.textContent = `Room ${code} selected. Same-screen play works now; remote online play needs the server layer next.`;
  });
}

setupEvents();
newMatch("bot");
