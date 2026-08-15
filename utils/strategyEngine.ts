export interface HistoryRecord {
  period: string;
  result_type: 'big' | 'small';
  number?: number;
  color?: string;
  created_at?: string;
}

export interface RowAnalysis extends HistoryRecord {
  signalStatus: 'NORMAL' | 'TRIGGER' | 'WIN' | 'LOSS_RECOVERY';
  levelInfo?: string;
}

export function runBacktestWithDetails(
  data: HistoryRecord[],
  target: 'big' | 'small' = 'big',
  triggerAlternatingCount: number = 3,
  maxLevels: number = 9
) {
  let triggersFound = 0;
  let failedCount = 0;
  
  let currentLevel = 1;
  let altCount = 0;
  let status: 'WAITING' | 'BETTING' | 'WAITING_RECOVERY' = 'WAITING';
  
  const winCounts: Record<number, number> = {};
  for (let i = 1; i <= maxLevels; i++) winCounts[i] = 0;

  const analyzedRows: RowAnalysis[] = data.map(row => ({ ...row, signalStatus: 'NORMAL' }));

  for (let i = 1; i < data.length; i++) {
    const current = data[i].result_type;
    const previous = data[i - 1].result_type;

    if (status === 'WAITING') {
      if (current === target && previous !== target) {
        altCount++;
      } else if (current === target && previous === target) {
        altCount = 0;
      }

      if (altCount === triggerAlternatingCount) {
        status = 'BETTING';
        triggersFound++;
        currentLevel = 1;
        analyzedRows[i].signalStatus = 'TRIGGER';
        analyzedRows[i].levelInfo = `L${currentLevel} Bet`;
      }
    } 
    else if (status === 'BETTING') {
      if (current === target) {
        winCounts[currentLevel]++;
        analyzedRows[i].signalStatus = 'WIN';
        analyzedRows[i].levelInfo = `Win @ L${currentLevel}`;
        status = 'WAITING';
        altCount = 0;
      } else {
        currentLevel++;
        if (currentLevel > maxLevels) {
          failedCount++;
          analyzedRows[i].signalStatus = 'LOSS_RECOVERY';
          analyzedRows[i].levelInfo = `Failed (>L${maxLevels})`;
          status = 'WAITING';
          altCount = 0;
        } else {
          analyzedRows[i].signalStatus = 'LOSS_RECOVERY';
          analyzedRows[i].levelInfo = `Loss -> Wait for L${currentLevel}`;
          status = 'WAITING_RECOVERY';
        }
      }
    } 
    else if (status === 'WAITING_RECOVERY') {
      if (current === target) {
        status = 'BETTING';
        analyzedRows[i].signalStatus = 'TRIGGER';
        analyzedRows[i].levelInfo = `L${currentLevel} Bet (Recovery)`;
      }
    }
  }

  const winDistribution = Object.keys(winCounts).map(level => ({
    level: `L${level}`,
    count: winCounts[parseInt(level)]
  }));

  return {
    totalAnalyzed: data.length,
    triggersFound,
    winDistribution,
    failedCount,
    analyzedRows
  };
}
