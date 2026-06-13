export const DEFAULT_PROGRESS = Object.freeze({
  bestScore: 0,
  bestLevel: 0,
  bestCombo: 0,
  totalRuns: 0,
  totalEggs: 0,
  totalPerfects: 0,
  totalCoinsEarned: 0,
  discoveredEvents: [],
});

function safeInteger(value) {
  return Math.max(0, Math.floor(Number(value) || 0));
}

export function normalizeProgress(value = {}, validEventIds = []) {
  const validIds = new Set(validEventIds);
  const discoveredEvents = [
    ...new Set(
      Array.isArray(value.discoveredEvents)
        ? value.discoveredEvents.filter((id) => validIds.has(id))
        : [],
    ),
  ];
  return {
    bestScore: safeInteger(value.bestScore),
    bestLevel: safeInteger(value.bestLevel),
    bestCombo: safeInteger(value.bestCombo),
    totalRuns: safeInteger(value.totalRuns),
    totalEggs: safeInteger(value.totalEggs),
    totalPerfects: safeInteger(value.totalPerfects),
    totalCoinsEarned: safeInteger(value.totalCoinsEarned),
    discoveredEvents,
  };
}

export function discoverEvent(progress, eventId, validEventIds) {
  const current = normalizeProgress(progress, validEventIds);
  if (!validEventIds.includes(eventId) || current.discoveredEvents.includes(eventId)) {
    return { progress: current, isNew: false };
  }
  return {
    progress: {
      ...current,
      discoveredEvents: [...current.discoveredEvents, eventId],
    },
    isNew: true,
  };
}

export function recordRun(progress, result, validEventIds = []) {
  const current = normalizeProgress(progress, validEventIds);
  const totalScore = safeInteger(result.totalScore);
  const levelReached = safeInteger(result.levelReached);
  const bestCombo = safeInteger(result.bestCombo);
  const eggsCooked = safeInteger(result.eggsCooked);
  const perfectEggs = safeInteger(result.perfectEggs);
  const coinsEarned = safeInteger(result.coinsEarned);
  const records = {
    score: totalScore > current.bestScore,
    level: levelReached > current.bestLevel,
    combo: bestCombo > current.bestCombo,
  };
  return {
    progress: {
      ...current,
      bestScore: Math.max(current.bestScore, totalScore),
      bestLevel: Math.max(current.bestLevel, levelReached),
      bestCombo: Math.max(current.bestCombo, bestCombo),
      totalRuns: current.totalRuns + 1,
      totalEggs: current.totalEggs + eggsCooked,
      totalPerfects: current.totalPerfects + perfectEggs,
      totalCoinsEarned: current.totalCoinsEarned + coinsEarned,
    },
    records,
    hasNewRecord: records.score || records.level || records.combo,
  };
}

export function collectionProgress(count, total) {
  const safeTotal = Math.max(0, safeInteger(total));
  const safeCount = Math.min(safeTotal, safeInteger(count));
  return {
    count: safeCount,
    total: safeTotal,
    percent: safeTotal === 0 ? 0 : Math.round((safeCount / safeTotal) * 100),
  };
}
