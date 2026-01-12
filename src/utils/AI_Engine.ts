// src/utils/AI_Engine.ts

export const analyzeUserBehavior = (stats: any, profile: any, history: any[] = []) => {
  const name = profile?.name || "Master";
  const insights: string[] = [];

  // 1. DATA EXTRACTION
  const { 
    consistency, 
    totalHours, 
    academicPower, 
    fitnessPower, 
    faithPower, 
    visionPower 
  } = stats;

  const yesterday = history.length > 0 ? history[0] : null;

  // 2. SUCCESS CELEBRATIONS (The Motivator)
  if (consistency >= 95 && academicPower > 0.5) {
    insights.push(`Absolute precision, ${name}. You are operating at an elite frequency. This is how empires are built.`);
  }
  if (totalHours > 5) {
    insights.push(`Your focus volume is exceptional today. You've entered a flow state most never achieve. Maintain this depth.`);
  }

  // 3. BALANCE & REPRIMAND (The Harsh Coach)
  if (academicPower > 0.6 && fitnessPower < 0.2) {
    insights.push(`Your mind is sharp, but your body is softening. A Titan requires a vessel that can sustain the pressure. Prioritize your fitness pillar.`);
  }
  if (academicPower > 0.8 && faithPower < 0.2) {
    insights.push(`You are gaining the world but losing your center. Reconnect with your spiritual disciplines before your focus becomes hollow.`);
  }
  if (consistency < 40 && totalHours > 0) {
    insights.push(`Random bursts of effort are for amateurs, ${name}. Valen rewards the consistent. Stop drifting and close your rings.`);
  }

  // 4. HISTORICAL VELOCITY (The Trend Analyzer)
  if (yesterday) {
    const focusIncrease = (stats.totalHours * 60) - (yesterday.focusMinutes || 0);
    if (focusIncrease > 30) {
      insights.push(`Velocity alert: You are outperforming yesterday's version of yourself by ${Math.round(focusIncrease)} minutes. Keep the momentum.`);
    } else if (focusIncrease < -60 && stats.totalHours > 0) {
      insights.push(`I've detected a significant drop in focus volume compared to yesterday. Fight the fatigue, ${name}. Resistance is highest just before the breakthrough.`);
    }
  }

  // 5. RECOMMENDATION ENGINE (The Assistant)
  if (consistency > 80 && stats.totalHours < 1) {
    insights.push(`Disciplines are solid, but academic depth is lacking. Use your next focus block for your most difficult module.`);
  }
  if (stats.completedHabits === 0 && new Date().getHours() > 12) {
    insights.push(`Half the day has vanished and your rings are empty. Initiate a 25-minute 'Quick Start' session immediately to salvage the day.`);
  }

  // 6. ARCHETYPE SPECIFIC
  if (profile?.archetype === 'The Novice' && consistency > 70) {
    insights.push(`You are outgrowing the Novice stage. Maintain this for 3 more days to officially ascend to the next archetype.`);
  }

  // 7. DEFAULT STOICISM
  const defaults = [
    `The day is yours to command, ${name}. What is our primary objective?`,
    "Focus is the only currency that matters. Spend it wisely.",
    "Eliminate the noise. The work is all that exists.",
    "Your future self is either thanking you or blaming you right now. Choose."
  ];

  return insights.length > 0 
    ? insights[Math.floor(Math.random() * insights.length)] 
    : defaults[Math.floor(Math.random() * defaults.length)];
};

export const getAIPrompt = (stats: any, profile: any) => {
  return {
    systemPrompt: `You are Valen, a high-level Executive PA. Tone: Stoic, Elite, Brutally Honest.`,
    userContext: `Consistency: ${stats.consistency}%, Focus: ${stats.totalHours}h, Archetype: ${profile?.archetype}`
  };
};