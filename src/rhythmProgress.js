export const RHYTHM_PROGRESS_KEY = "danzai-rhythm-progress";

export function createDefaultRhythmProgress(totalLevels = 3) {
  const total = Math.max(1, Math.floor(Number(totalLevels) || 1));
  return {
    unlockedLevelIndex: 0,
    bestStarsByLevel: Array.from({ length: total }, () => 0),
  };
}

export function normalizeRhythmProgress(progress = {}, totalLevels = 3) {
  const fallback = createDefaultRhythmProgress(totalLevels);
  const bestStarsByLevel = Array.from({ length: fallback.bestStarsByLevel.length }, (_, index) => {
    const stars = Math.floor(Number(progress?.bestStarsByLevel?.[index]) || 0);
    return Math.min(3, Math.max(0, stars));
  });
  return {
    unlockedLevelIndex: Math.min(
      fallback.bestStarsByLevel.length - 1,
      Math.max(0, Math.floor(Number(progress?.unlockedLevelIndex) || 0)),
    ),
    bestStarsByLevel,
  };
}

export function isRhythmLevelUnlocked(progress, levelIndex = 0) {
  const index = Math.max(0, Math.floor(Number(levelIndex) || 0));
  return index <= Math.max(0, Math.floor(Number(progress?.unlockedLevelIndex) || 0));
}

export function recordRhythmLevelResult(progress, levelIndex, stars, totalLevels = 3) {
  const next = normalizeRhythmProgress(progress, totalLevels);
  const index = Math.min(
    next.bestStarsByLevel.length - 1,
    Math.max(0, Math.floor(Number(levelIndex) || 0)),
  );
  const earnedStars = Math.min(3, Math.max(0, Math.floor(Number(stars) || 0)));
  next.bestStarsByLevel[index] = Math.max(next.bestStarsByLevel[index] || 0, earnedStars);
  if (earnedStars >= 1 && index < next.bestStarsByLevel.length - 1) {
    next.unlockedLevelIndex = Math.max(next.unlockedLevelIndex, index + 1);
  }
  return next;
}

export function getRhythmResultProgressUpdate(progress, levelIndex, stars, totalLevels = 3) {
  const before = normalizeRhythmProgress(progress, totalLevels);
  const index = Math.min(
    before.bestStarsByLevel.length - 1,
    Math.max(0, Math.floor(Number(levelIndex) || 0)),
  );
  const earnedStars = Math.min(3, Math.max(0, Math.floor(Number(stars) || 0)));
  const previousBestStars = before.bestStarsByLevel[index] || 0;
  const previousUnlockedLevelIndex = before.unlockedLevelIndex;
  const next = recordRhythmLevelResult(before, index, earnedStars, totalLevels);
  return {
    progress: next,
    newBestStars: earnedStars > previousBestStars,
    unlockedNext: next.unlockedLevelIndex > previousUnlockedLevelIndex,
    previousBestStars,
  };
}

export function readRhythmProgress(storage = globalThis.localStorage, totalLevels = 3) {
  try {
    const raw = JSON.parse(storage.getItem(RHYTHM_PROGRESS_KEY) || "{}");
    return normalizeRhythmProgress(raw, totalLevels);
  } catch {
    return createDefaultRhythmProgress(totalLevels);
  }
}

export function saveRhythmProgress(progress, storage = globalThis.localStorage) {
  try {
    storage.setItem(RHYTHM_PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // Storage can be unavailable in private or restricted contexts.
  }
}
