export function calculatePoints({isCorrect,answerTime,timeLimit,maxPoints=1000}){
  if(!isCorrect)return 0;
  const safeLimit=Math.max(1,timeLimit);
  const timeRatio=Math.min(1,Math.max(0,answerTime/safeLimit));
  return Math.round(maxPoints*(0.5+(1-timeRatio)*0.5));
}
