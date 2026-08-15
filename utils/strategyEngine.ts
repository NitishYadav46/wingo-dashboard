
export interface HistoryRecord {
  period: string;
  result_type: 'big' | 'small';
}

export interface StrategyResults {
  totalAnalyzed: number;
  triggersFound: number;
  winDistribution: { level: string; count: number }[];
  failedCount: number;
}

export function runBacktest(
  data: HistoryRecord[],
  target: 'big' | 'small' = 'big',
  triggerAlternatingCount: number = 3,
  maxLevels: number = 9
): StrategyResults {
  let triggersFound = 0;
  let failedCount = 0;
  
  let currentLevel = 1;
  let altCount = 0;
  let status: 'WAITING' | 'BETTING' | 'WAITING_RECOVERY' = 'WAITING';
  
  const winCounts: Record<number, number> = {};
  for (let i = 1; i <= maxLevels; i++) winCounts[i] = 0;

  // Oldest se newest data analyze karna
  for (let i = 1; i < data.length; i++) {
    const current = data[i].result_type;
    const previous = data[i - 1].result_type;

    if (status === 'WAITING') {
      if (current === target && previous !== target) {
        altCount++; // Target mila, jo pichle se alag hai (Alternating)
      } else if (current === target && previous === target) {
        altCount = 0; // Double aa gaya, pattern reset
      }

      if (altCount === triggerAlternatingCount) {
        status = 'BETTING';
        triggersFound++;
        currentLevel = 1;
      }
    } 
    
    else if (status === 'BETTING') {
      if (current === target) {
        // WIN (Double aa gaya!)
        winCounts[currentLevel]++;
        status = 'WAITING';
        altCount = 0; // Reset for next fresh pattern
      } else {
        // LOSS (Alternating continue raha)
        currentLevel++;
        if (currentLevel > maxLevels) {
          // 9 Levels cross ho gaye - FAILED
          failedCount++;
          status = 'WAITING';
          altCount = 0;
        } else {
          // Option B: Wait for the next target to drop before betting again
          status = 'WAITING_RECOVERY';
        }
      }
    } 
    
    else if (status === 'WAITING_RECOVERY') {
      if (current === target) {
        // Target wapas aa gaya hai! Ab next round par humari bet hogi
        status = 'BETTING';
      }
      // Agar current opposite hai, toh chupchap wait karte raho (No level loss)
    }
  }

  // UI ke liye Chart Data format karna
  const winDistribution = Object.keys(winCounts).map(level => ({
    level: `L${level}`,
    count: winCounts[parseInt(level)]
  }));

  return {
    totalAnalyzed: data.length,
    triggersFound,
    winDistribution,
    failedCount
  };
}
