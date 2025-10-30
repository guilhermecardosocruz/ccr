export type Run = { team: string; score: number; timeSec: number; at: number };

export function compute(byTeam: Map<string, Run[]>) {
  const out: Array<{
    team: string; runs: Run[];
    pickedIdx: number[]; rankingScore: number; tieTotal: number; tieTime: number;
  }> = [];

  byTeam.forEach((arr, team) => {
    const scores = arr.map(r=>r.score);
    const times  = arr.map(r=>r.timeSec);
    const idx = scores.map((_,i)=>i).sort((a,b)=>scores[b]-scores[a]).slice(0, Math.min(2, scores.length)).sort((a,b)=>a-b);
    const rankingScore = idx.reduce((acc,i)=>acc+scores[i],0);
    const tieTotal = scores.reduce((a,b)=>a+b,0);
    const tieTime = idx.reduce((acc,i)=>acc+times[i],0);
    out.push({ team, runs: arr, pickedIdx: idx, rankingScore, tieTotal, tieTime });
  });

  out.sort((a,b)=>{
    if (b.rankingScore!==a.rankingScore) return b.rankingScore-a.rankingScore;
    if (b.tieTotal!==a.tieTotal) return b.tieTotal-a.tieTotal;
    if (a.tieTime!==b.tieTime)   return a.tieTime-b.tieTime;
    return a.team.localeCompare(b.team,"pt-BR");
  });

  return out;
}
