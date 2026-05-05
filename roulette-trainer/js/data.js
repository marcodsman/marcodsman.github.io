const WHEEL = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
const REDS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);

// Named wheel sectors used for chunk memorisation.
// numbers are in wheel order (clockwise from the landmark anchor).
const SECTORS = [
  {
    id: "voisins",
    name: "Voisins du Zéro",
    shortName: "Voisins",
    description: "The 17 numbers surrounding zero — the largest sector.",
    color: "#20c875",
    numbers: [22,18,29,7,28,12,35,3,26,0,32,15,19,4,21,2,25],
    chips: 9,
    placement: "0/2/3 two chips · 4/7 · 12/15 · 18/21 · 19/22 · 25/26/28/29 two chips · 32/35"
  },
  {
    id: "tiers",
    name: "Tiers du Cylindre",
    shortName: "Tiers",
    description: "The 12 numbers on the opposite side of the wheel from zero.",
    color: "#58a6ff",
    numbers: [27,13,36,11,30,8,23,10,5,24,16,33],
    chips: 6,
    placement: "Splits: 5/8 · 10/11 · 13/16 · 23/24 · 27/30 · 33/36"
  },
  {
    id: "orphelins",
    name: "Orphelins",
    shortName: "Orphelins",
    description: "The 8 numbers left uncovered between Voisins and Tiers.",
    color: "#ffd166",
    numbers: [17,34,6,1,20,14,31,9],
    chips: 5,
    placement: "1 straight-up · splits: 6/9 · 14/17 · 17/20 · 31/34"
  },
  {
    id: "zerospiel",
    name: "Zero Spiel",
    shortName: "Zero Spiel",
    description: "The 7 numbers closest to zero — a subset of Voisins.",
    color: "#ff5a68",
    numbers: [12,35,3,26,0,32,15],
    chips: 4,
    placement: "26 straight-up · splits: 0/3 · 12/15 · 32/35"
  }
];

const PAYOUTS = [
  { name: "Straight up",           covers: 1,  odds: "35:1", profit: 35 },
  { name: "Split",                 covers: 2,  odds: "17:1", profit: 17 },
  { name: "Street",                covers: 3,  odds: "11:1", profit: 11 },
  { name: "Corner/Square",         covers: 4,  odds: "8:1",  profit: 8  },
  { name: "Six line/Double street",covers: 6,  odds: "5:1",  profit: 5  },
  { name: "Column",                covers: 12, odds: "2:1",  profit: 2  },
  { name: "Dozen",                 covers: 12, odds: "2:1",  profit: 2  },
  { name: "Red/Black",             covers: 18, odds: "1:1",  profit: 1  },
  { name: "Odd/Even",              covers: 18, odds: "1:1",  profit: 1  },
  { name: "High/Low",              covers: 18, odds: "1:1",  profit: 1  }
];

const ANNOUNCED = [
  {
    name: "Voisins du Zéro",
    chips: 9,
    numbers: [22,18,29,7,28,12,35,3,26,0,32,15,19,4,21,2,25],
    placement: "0/2/3 with 2 chips, 4/7, 12/15, 18/21, 19/22, 25/26/28/29 with 2 chips, 32/35"
  },
  {
    name: "Tiers du Cylindre",
    chips: 6,
    numbers: [27,13,36,11,30,8,23,10,5,24,16,33],
    placement: "Splits 5/8, 10/11, 13/16, 23/24, 27/30, 33/36"
  },
  {
    name: "Orphelins",
    chips: 5,
    numbers: [1,20,14,31,9,17,34,6],
    placement: "1 straight-up, plus splits 6/9, 14/17, 17/20, 31/34"
  },
  {
    name: "Zero Spiel",
    chips: 4,
    numbers: [12,35,3,26,0,32,15],
    placement: "26 straight-up, plus splits 0/3, 12/15, 32/35"
  }
];

const PROCEDURES = [
  // --- game flow ---
  {
    q: "When should the dealer announce no more bets?",
    a: "Before the ball drops and before the result is known",
    o: ["After the ball lands", "Only after payouts", "Whenever a player asks"]
  },
  {
    q: "What should you do with a late bet placed after no more bets?",
    a: "Refuse it according to house procedure",
    o: ["Accept it quickly", "Move it to the winning number", "Ask another player"]
  },
  {
    q: "When do you place the dolly on the winning number?",
    a: "After the winning number is confirmed",
    o: ["Before spinning", "Before no more bets", "After paying all bets"]
  },
  {
    q: "In what order are losing bets and winning bets handled after the result?",
    a: "Clear losing bets first, then pay winning bets",
    o: ["Pay winners first, then clear losers", "Clear and pay simultaneously", "Ask the inspector"]
  },
  {
    q: "When may players place new bets after a result?",
    a: "Only after the dolly is removed and the dealer signals bets open",
    o: ["Immediately after the ball lands", "While payouts are being made", "Whenever they like"]
  },
  // --- void spin / irregularities ---
  {
    q: "What should you do if the ball jumps out of the wheel?",
    a: "Call the supervisor and follow house procedure — the spin is void",
    o: ["Pick any number", "Pay the nearest number", "Ignore it and spin again"]
  },
  {
    q: "What constitutes a void spin?",
    a: "Ball leaves the wheel track, foreign object on table, or other irregularity per house rules",
    o: ["The ball takes more than 3 revolutions", "A player touches the table", "The ball lands on zero"]
  },
  {
    q: "A player knocks chips onto the layout just before no more bets. What do you do?",
    a: "Remove the chips and refuse the bet — it was not placed intentionally before the cut-off",
    o: ["Accept it as a valid bet", "Place the chips on the nearest number", "Call the inspector immediately"]
  },
  // --- game protection / transparency ---
  {
    q: "Why are clear hands important?",
    a: "To show transparency and protect game security",
    o: ["To make the game slower", "To hide chip movement", "Only for appearance"]
  },
  {
    q: "When must you show clear hands?",
    a: "When leaving the table, after handling cash, and whenever instructed by the inspector",
    o: ["Only when a player asks", "Only at shift end", "Never — it is optional"]
  },
  {
    q: "What should you do if a player disputes a payout?",
    a: "Call the inspector or supervisor",
    o: ["Argue with the player", "Pay whatever they ask", "Remove their chips immediately"]
  },
  {
    q: "A player claims they placed a bet you did not see. What do you do?",
    a: "Refer to CCTV through the supervisor — do not pay without verification",
    o: ["Pay the claimed bet to avoid conflict", "Refuse and ignore the claim", "Ask nearby players"]
  },
  // --- chip colours / player identification ---
  {
    q: "Why does each roulette player receive a unique colour of chips?",
    a: "To identify which bets belong to which player and prevent disputes",
    o: ["Because roulette chips are decorative", "To make the table look colourful", "House rules require it for accounting only"]
  },
  {
    q: "Can roulette colour chips be used at any other table?",
    a: "No — they have no value away from the roulette table they were issued at",
    o: ["Yes, at any table in the casino", "Yes, but only at other roulette tables", "Only if the inspector approves"]
  },
  {
    q: "What must you establish when issuing colour chips to a player?",
    a: "The value the player assigns to each chip",
    o: ["The player's name", "The player's membership number", "The number of chips they want to buy"]
  },
  {
    q: "What should you do when a player wants to leave the roulette table?",
    a: "Exchange their colour chips for casino cash chips before they leave",
    o: ["Let them take the colour chips to the cashier", "Keep the chips and refund cash later", "Ask the inspector to handle it"]
  },
  {
    q: "Two players accidentally mix up their chip colours. How do you resolve it?",
    a: "Call the inspector — do not attempt to reassign chips yourself",
    o: ["Reassign colours yourself to save time", "Ask the players to sort it out", "Void the round"]
  },
  // --- supervisor escalation ---
  {
    q: "In which situations must you immediately call the inspector?",
    a: "Disputed payouts, void spins, irregularities, and any situation outside normal procedure",
    o: ["Only when a physical fight breaks out", "Only for disputed payouts", "Whenever a player looks unhappy"]
  },
  {
    q: "A player becomes aggressive at the table. What is the correct first action?",
    a: "Call the inspector or supervisor — do not engage or argue",
    o: ["Ask the player to calm down", "Stop the game and walk away", "Call security yourself without telling the inspector"]
  },
  {
    q: "Who has final authority on a disputed payout at the table?",
    a: "The inspector or pit manager, not the dealer",
    o: ["The dealer", "The player", "The most senior player at the table"]
  }
];

// Call bets (Finales and other verbal bets)
const CALL_BETS = [
  // Finales en plein (straight-up on every number ending in digit X)
  { name: "Finale en plein 0", type: "finale-plein", digit: 0,
    numbers: [0, 10, 20, 30], chips: 4,
    description: "Straight-up on every number ending in 0: 0, 10, 20, 30." },
  { name: "Finale en plein 1", type: "finale-plein", digit: 1,
    numbers: [1, 11, 21, 31], chips: 4,
    description: "Straight-up on every number ending in 1: 1, 11, 21, 31." },
  { name: "Finale en plein 2", type: "finale-plein", digit: 2,
    numbers: [2, 12, 22, 32], chips: 4,
    description: "Straight-up on every number ending in 2: 2, 12, 22, 32." },
  { name: "Finale en plein 3", type: "finale-plein", digit: 3,
    numbers: [3, 13, 23, 33], chips: 4,
    description: "Straight-up on every number ending in 3: 3, 13, 23, 33." },
  { name: "Finale en plein 4", type: "finale-plein", digit: 4,
    numbers: [4, 14, 24, 34], chips: 4,
    description: "Straight-up on every number ending in 4: 4, 14, 24, 34." },
  { name: "Finale en plein 5", type: "finale-plein", digit: 5,
    numbers: [5, 15, 25, 35], chips: 4,
    description: "Straight-up on every number ending in 5: 5, 15, 25, 35." },
  { name: "Finale en plein 6", type: "finale-plein", digit: 6,
    numbers: [6, 16, 26, 36], chips: 4,
    description: "Straight-up on every number ending in 6: 6, 16, 26, 36." },
  { name: "Finale en plein 7", type: "finale-plein", digit: 7,
    numbers: [7, 17, 27], chips: 3,
    description: "Straight-up on every number ending in 7: 7, 17, 27. Only 3 numbers, so 3 chips." },
  { name: "Finale en plein 8", type: "finale-plein", digit: 8,
    numbers: [8, 18, 28], chips: 3,
    description: "Straight-up on every number ending in 8: 8, 18, 28. Only 3 numbers, so 3 chips." },
  { name: "Finale en plein 9", type: "finale-plein", digit: 9,
    numbers: [9, 19, 29], chips: 3,
    description: "Straight-up on every number ending in 9: 9, 19, 29. Only 3 numbers, so 3 chips." },

  // Finales à cheval (split on pairs of numbers ending in digits X and X+1)
  { name: "Finale à cheval 0/3", type: "finale-cheval", digits: [0, 3],
    numbers: [0, 3, 10, 13, 20, 23, 30, 33], chips: 4,
    description: "Splits on pairs ending in 0 and 3: 0/3, 10/13, 20/23, 30/33. 4 chips." },
  { name: "Finale à cheval 1/4", type: "finale-cheval", digits: [1, 4],
    numbers: [1, 4, 11, 14, 21, 24, 31, 34], chips: 4,
    description: "Splits on pairs ending in 1 and 4: 1/4, 11/14, 21/24, 31/34. 4 chips." },
  { name: "Finale à cheval 2/5", type: "finale-cheval", digits: [2, 5],
    numbers: [2, 5, 12, 15, 22, 25, 32, 35], chips: 4,
    description: "Splits on pairs ending in 2 and 5: 2/5, 12/15, 22/25, 32/35. 4 chips." },
  { name: "Finale à cheval 3/6", type: "finale-cheval", digits: [3, 6],
    numbers: [3, 6, 13, 16, 23, 26, 33, 36], chips: 4,
    description: "Splits on pairs ending in 3 and 6: 3/6, 13/16, 23/26, 33/36. 4 chips." },
  { name: "Finale à cheval 4/7", type: "finale-cheval", digits: [4, 7],
    numbers: [4, 7, 14, 17, 24, 27, 34], chips: 4,
    description: "Splits on 4/7, 14/17, 24/27, plus 34 straight-up. 4 chips." },
  { name: "Finale à cheval 5/8", type: "finale-cheval", digits: [5, 8],
    numbers: [5, 8, 15, 18, 25, 28, 35], chips: 4,
    description: "Splits on 5/8, 15/18, 25/28, plus 35 straight-up. 4 chips." },
  { name: "Finale à cheval 6/9", type: "finale-cheval", digits: [6, 9],
    numbers: [6, 9, 16, 19, 26, 29, 36], chips: 4,
    description: "Splits on 6/9, 16/19, 26/29, plus 36 straight-up. 4 chips." },
  { name: "Finale à cheval 7/0", type: "finale-cheval", digits: [7, 0],
    numbers: [0, 7, 10, 17, 20, 27, 30], chips: 4,
    description: "Splits on 0/7 (note: 0 treated as ending in 0), 10/17, 20/27, 30 straight-up. 4 chips." },
];

const LESSONS = [
  {
    id: "payouts",
    title: "Level 1: Payouts",
    desc: "Learn bet names, numbers covered and payout odds.",
    topics: ["payouts"],
    count: 10
  },
  {
    id: "maths",
    title: "Level 2: Payout Maths",
    desc: "Practise fast profit calculations.",
    topics: ["maths"],
    count: 10
  },
  {
    id: "wheel",
    title: "Level 3: Wheel Sequence",
    desc: "Drill next number, previous number and wheel runs.",
    topics: ["wheel"],
    count: 12
  },
  {
    id: "neighbours",
    title: "Level 4: Neighbours",
    desc: "Identify the two numbers beside any wheel number.",
    topics: ["neighbours"],
    count: 12
  },
  {
    id: "announced",
    title: "Level 5: French Bets",
    desc: "Voisins, Tiers, Orphelins and Zero Spiel.",
    topics: ["announced"],
    count: 12
  },
  {
    id: "procedure",
    title: "Level 6: Table Procedure",
    desc: "No more bets, dolly, disputes and game protection.",
    topics: ["procedure"],
    count: 10
  },
  {
    id: "callbets",
    title: "Level 7: Call Bets",
    desc: "Finales en plein, Finales à cheval and other verbal bets.",
    topics: ["callbets"],
    count: 12
  },
  {
    id: "final",
    title: "Level 8: Final Mix",
    desc: "A mixed lesson covering everything.",
    topics: ["payouts", "maths", "wheel", "neighbours", "announced", "sectors", "callbets", "procedure"],
    count: 20
  }
];
