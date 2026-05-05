function makeQuestions(topics, count) {
  return Array.from({ length: count }, () => makeQuestion(rand(topics)));
}

function makeQuestion(topic) {
  if (topic === "payouts")   return makePayoutQuestion();
  if (topic === "maths")     return makeMathsQuestion();
  if (topic === "wheel")     return makeWheelQuestion();
  if (topic === "neighbours")return makeNeighbourQuestion();
  if (topic === "announced") return makeAnnouncedQuestion();
  if (topic === "procedure") return makeProcedureQuestion();
  if (topic === "sectors")   return makeSectorQuestion();
  if (topic === "callbets")  return makeCallBetQuestion();
  return makePayoutQuestion();
}

function makePayoutQuestion() {
  const bet = rand(PAYOUTS);
  const type = rand(["odds", "covers"]);

  if (type === "odds") {
    return {
      id: `payout-odds-${bet.name}`,
      topic: "payouts",
      type: "mc",
      prompt: `What does a ${bet.name} bet pay?`,
      answer: bet.odds,
      options: sample(PAYOUTS.map(p => p.odds).filter(o => o !== bet.odds), 3),
      explanation: `${bet.name} covers ${bet.covers} number${bet.covers === 1 ? "" : "s"}.`
    };
  }

  return {
    id: `payout-covers-${bet.name}`,
    topic: "payouts",
    type: "mc",
    prompt: `How many numbers does a ${bet.name} bet cover?`,
    answer: String(bet.covers),
    options: sample(PAYOUTS.map(p => String(p.covers)).filter(c => c !== String(bet.covers)), 3),
    explanation: `${bet.name} pays ${bet.odds}.`
  };
}

function makeMathsQuestion() {
  const bet = rand(PAYOUTS);
  const units = rand([1, 2, 3, 4, 5, 10, 15, 20]);
  const answer = units * bet.profit;

  return {
    id: `maths-${bet.name}`,
    topic: "maths",
    type: "text",
    check: "number",
    prompt: `A player wins ${units} unit${units === 1 ? "" : "s"} on ${bet.name}. What is the profit payout?`,
    answer: String(answer),
    hint: "Type the profit only, not including the original stake.",
    explanation: `${bet.name} pays ${bet.odds}, so profit is ${units} × ${bet.profit}.`
  };
}

function makeWheelQuestion() {
  const n = rand(WHEEL);
  const i = WHEEL.indexOf(n);
  const previous = WHEEL[(i - 1 + WHEEL.length) % WHEEL.length];
  const next = WHEEL[(i + 1) % WHEEL.length];
  const type = rand(["next", "previous", "run"]);

  if (type === "next") {
    return {
      id: `wheel-next-${n}`,
      topic: "wheel",
      type: "mc",
      prompt: `What number comes after ${n} in the wheel sequence?`,
      answer: String(next),
      options: sample(WHEEL.filter(x => x !== next).map(String), 3),
      explanation: `${previous} → ${n} → ${next}.`
    };
  }

  if (type === "previous") {
    return {
      id: `wheel-prev-${n}`,
      topic: "wheel",
      type: "mc",
      prompt: `What number comes before ${n} in the wheel sequence?`,
      answer: String(previous),
      options: sample(WHEEL.filter(x => x !== previous).map(String), 3),
      explanation: `${previous} → ${n} → ${next}.`
    };
  }

  const startIndex = WHEEL.indexOf(n);
  const run = Array.from({ length: 5 }, (_, offset) => WHEEL[(startIndex + offset) % WHEEL.length]);

  return {
    id: `wheel-run-${n}`,
    topic: "wheel",
    type: "text",
    check: "numberSequence",
    prompt: `Complete this 5-number wheel run starting at ${n}.`,
    answer: run.join(", "),
    hint: "Example format: 0, 32, 15, 19, 4",
    explanation: `Sequence: ${run.join(" → ")}`
  };
}

function makeNeighbourQuestion() {
  const n = rand(WHEEL);
  const i = WHEEL.indexOf(n);
  const previous = WHEEL[(i - 1 + WHEEL.length) % WHEEL.length];
  const next = WHEEL[(i + 1) % WHEEL.length];

  return {
    id: `neighbours-${n}`,
    topic: "neighbours",
    type: "text",
    check: "numberSet",
    prompt: `What are the two wheel neighbours of ${n}?`,
    answer: `${previous}, ${next}`,
    hint: "Type both numbers. Order does not matter.",
    explanation: `${n} sits between ${previous} and ${next}.`
  };
}

function makeAnnouncedQuestion() {
  const bet = rand(ANNOUNCED);
  const type = rand(["name", "chips", "numbers", "placement"]);

  if (type === "name") {
    return {
      id: `announced-name-${bet.name}`,
      topic: "announced",
      type: "mc",
      prompt: `Which announced bet covers: ${bet.numbers.join(", ")}?`,
      answer: bet.name,
      options: ANNOUNCED.map(b => b.name).filter(name => name !== bet.name),
      explanation: `${bet.name} is a standard French announced bet.`
    };
  }

  if (type === "chips") {
    return {
      id: `announced-chips-${bet.name}`,
      topic: "announced",
      type: "mc",
      prompt: `How many chips are used for a standard ${bet.name}?`,
      answer: String(bet.chips),
      options: sample(["4", "5", "6", "9", "10", "12"].filter(x => x !== String(bet.chips)), 3),
      explanation: bet.placement
    };
  }

  if (type === "numbers") {
    return {
      id: `announced-numbers-${bet.name}`,
      topic: "announced",
      type: "text",
      check: "numberSet",
      prompt: `Which numbers are covered by ${bet.name}?`,
      answer: bet.numbers.join(", "),
      hint: "Type the numbers. Order does not matter.",
      explanation: bet.placement
    };
  }

  return {
    id: `announced-placement-${bet.name}`,
    topic: "announced",
    type: "mc",
    prompt: `What is the standard placement for ${bet.name}?`,
    answer: bet.placement,
    options: sample(ANNOUNCED.map(b => b.placement).filter(p => p !== bet.placement), 3),
    explanation: `${bet.name} covers ${bet.numbers.join(", ")}.`
  };
}

function makeProcedureQuestion() {
  const item = rand(PROCEDURES);

  return {
    id: `procedure-${item.q}`,
    topic: "procedure",
    type: "mc",
    prompt: item.q,
    answer: item.a,
    options: item.o,
    explanation: "Always follow your casino's exact house procedure."
  };
}

function makeSectorQuestion() {
  const sector = rand(SECTORS);
  const type = rand(["chips", "count", "firstNum", "lastNum", "containsNum", "chunkOrder"]);

  if (type === "chips") {
    return {
      id: `sector-chips-${sector.id}`,
      topic: "sectors",
      type: "mc",
      prompt: `How many chips does a standard ${sector.name} bet use?`,
      answer: String(sector.chips),
      options: sample(SECTORS.map(s => String(s.chips)).filter(c => c !== String(sector.chips)), 3),
      explanation: sector.placement
    };
  }

  if (type === "count") {
    return {
      id: `sector-count-${sector.id}`,
      topic: "sectors",
      type: "mc",
      prompt: `How many numbers does ${sector.name} cover?`,
      answer: String(sector.numbers.length),
      options: sample(SECTORS.map(s => String(s.numbers.length)).filter(c => c !== String(sector.numbers.length)), 3),
      explanation: `${sector.name}: ${sector.numbers.join(", ")}`
    };
  }

  if (type === "firstNum") {
    const first = sector.numbers[0];
    return {
      id: `sector-first-${sector.id}`,
      topic: "sectors",
      type: "mc",
      prompt: `Which number starts the ${sector.name} sector (going clockwise)?`,
      answer: String(first),
      options: sample(WHEEL.filter(n => n !== first).map(String), 3),
      explanation: `${sector.name} runs: ${sector.numbers.join(" → ")}`
    };
  }

  if (type === "lastNum") {
    const last = sector.numbers[sector.numbers.length - 1];
    return {
      id: `sector-last-${sector.id}`,
      topic: "sectors",
      type: "mc",
      prompt: `Which number ends the ${sector.name} sector (going clockwise)?`,
      answer: String(last),
      options: sample(WHEEL.filter(n => n !== last).map(String), 3),
      explanation: `${sector.name} runs: ${sector.numbers.join(" → ")}`
    };
  }

  if (type === "containsNum") {
    // pick a random number and ask which sector contains it
    const n = rand(WHEEL);
    const containingSector = SECTORS.find(s => s.numbers.includes(n));
    if (!containingSector) return makeSectorQuestion();
    return {
      id: `sector-contains-${n}`,
      topic: "sectors",
      type: "mc",
      prompt: `Number ${n} belongs to which French sector?`,
      answer: containingSector.name,
      options: SECTORS.map(s => s.name).filter(name => name !== containingSector.name),
      explanation: `${containingSector.name} covers: ${containingSector.numbers.join(", ")}`
    };
  }

  // chunkOrder: give first N numbers of the sector, ask for the next one
  const chunkStart = Math.floor(Math.random() * (sector.numbers.length - 2));
  const shown = sector.numbers.slice(chunkStart, chunkStart + 3);
  const correctNext = sector.numbers[chunkStart + 3];
  if (correctNext === undefined) return makeSectorQuestion();

  return {
    id: `sector-chunk-${sector.id}-${chunkStart}`,
    topic: "sectors",
    type: "mc",
    prompt: `In ${sector.name}, what comes after: ${shown.join(", ")} …?`,
    answer: String(correctNext),
    options: sample(WHEEL.filter(n => n !== correctNext).map(String), 3),
    explanation: `${sector.name} sequence: ${sector.numbers.join(" → ")}`
  };
}

function makeCallBetQuestion() {
  const bet = rand(CALL_BETS);
  const type = rand(["chips", "numbers", "describe", "whichBet"]);

  if (type === "chips") {
    // how many chips for this call bet?
    const otherChips = sample(["3","4","5","6","7","8"].filter(c => c !== String(bet.chips)), 3);
    return {
      id: `callbet-chips-${bet.name}`,
      topic: "callbets",
      type: "mc",
      prompt: `How many chips does "${bet.name}" require?`,
      answer: String(bet.chips),
      options: otherChips,
      explanation: bet.description
    };
  }

  if (type === "numbers") {
    // how many numbers does this call bet cover?
    const count = bet.numbers.length;
    const otherCounts = sample(["3","4","5","6","7","8"].filter(c => c !== String(count)), 3);
    return {
      id: `callbet-count-${bet.name}`,
      topic: "callbets",
      type: "mc",
      prompt: `How many numbers does "${bet.name}" cover?`,
      answer: String(count),
      options: otherCounts,
      explanation: bet.description
    };
  }

  if (type === "describe") {
    // what does a finale en plein on digit X mean?
    if (bet.type === "finale-plein") {
      return {
        id: `callbet-desc-${bet.name}`,
        topic: "callbets",
        type: "mc",
        prompt: `What is a "Finale en plein ${bet.digit}"?`,
        answer: `Straight-up on all numbers ending in ${bet.digit}`,
        options: [
          `Split on all numbers ending in ${bet.digit}`,
          `Corner on all numbers ending in ${bet.digit}`,
          `Street on all numbers ending in ${bet.digit}`
        ],
        explanation: bet.description
      };
    }
    // finale à cheval
    return {
      id: `callbet-desc-${bet.name}`,
      topic: "callbets",
      type: "mc",
      prompt: `What is a "Finale à cheval ${bet.digits.join("/")} "?`,
      answer: `Splits on pairs of numbers ending in ${bet.digits[0]} and ${bet.digits[1]}`,
      options: [
        `Straight-up on numbers ending in ${bet.digits[0]} and ${bet.digits[1]}`,
        `Corners on numbers ending in ${bet.digits[0]} and ${bet.digits[1]}`,
        `Streets covering numbers ending in ${bet.digits[0]} and ${bet.digits[1]}`
      ],
      explanation: bet.description
    };
  }

  // whichBet: name the bet from a description of which digit it covers
  if (bet.type === "finale-plein") {
    const others = sample(
      CALL_BETS.filter(b => b.type === "finale-plein" && b.digit !== bet.digit).map(b => b.name), 3
    );
    return {
      id: `callbet-which-${bet.name}`,
      topic: "callbets",
      type: "mc",
      prompt: `A player calls a straight-up bet on all numbers ending in ${bet.digit}. Which call bet is this?`,
      answer: bet.name,
      options: others,
      explanation: bet.description
    };
  }

  const others = sample(
    CALL_BETS.filter(b => b.type === "finale-cheval" && b.name !== bet.name).map(b => b.name), 3
  );
  return {
    id: `callbet-which-${bet.name}`,
    topic: "callbets",
    type: "mc",
    prompt: `A player calls splits on all pairs of numbers ending in ${bet.digits.join(" and ")}. Which call bet is this?`,
    answer: bet.name,
    options: others,
    explanation: bet.description
  };
}
