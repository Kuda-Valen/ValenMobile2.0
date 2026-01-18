// src/utils/AI_Engine.ts

export const analyzeUserBehavior = (stats: any, profile: any, history: any[] = []) => {
  const name = profile?.name || "Partner";
  const profession = profile?.profession || "Executive";
  const primaryGoal = profile?.neuralContext?.primaryGoal || "overall excellence";
  const focusStyle = profile?.neuralContext?.focusStyle || "Deep Work";
  
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

  // 2. ENGAGING & ADAPTIVE CELEBRATIONS (The Strategist)
  if (consistency >= 90) {
    insights.push(`Incredible rhythm, ${name}. As a ${profession}, your consistency is your greatest asset. We're making massive ground on ${primaryGoal}.`);
  }
  
  if (totalHours > 4) {
    insights.push(`That was a powerhouse session. You really leaned into that ${focusStyle} style today. This is exactly how we'll dominate your goals.`);
  }

  // 3. TARGETED PUSH (The High-Stakes Coach)
  // Harsh only when necessary based on user's self-defined profession/goals
  if (academicPower > 0.7 && fitnessPower < 0.2) {
    insights.push(`Listen, ${name}. You're sharp, but you're neglecting the vessel. A top-tier ${profession} can't lead from a hospital bed. Get moving.`);
  }

  if (consistency < 50 && totalHours > 0) {
    insights.push(`You're drifting, ${name}. We talked about ${primaryGoal}, remember? Random effort won't get us there. Lock back in.`);
  }

  if (stats.completedHabits === 0 && new Date().getHours() > 14) {
    insights.push(`It's mid-afternoon and we haven't touched your disciplines. Is this the standard we set for a ${getRankName(profile?.level)}? Correct this now.`);
  }

  // 4. PREDICTIVE MOMENTUM (Learning from history)
  if (yesterday) {
    const focusDiff = (stats.totalHours * 60) - (yesterday.focusMinutes || 0);
    if (focusDiff > 45) {
      insights.push(`You're on fire! You've pushed ${Math.round(focusDiff)} minutes past yesterday's limit. This is what growth feels like.`);
    } else if (focusDiff < -60 && stats.totalHours > 0) {
      insights.push(`I noticed a dip in velocity compared to yesterday. Don't let a bad day turn into a bad week. One 25-minute block can turn this around.`);
    }
  }

  // 5. GOAL-SPECIFIC ADAPTATION
  if (primaryGoal.toLowerCase().includes('exam') || primaryGoal.toLowerCase().includes('study')) {
    if (academicPower < 0.3) {
      insights.push(`Our priority is the ${primaryGoal}, yet the Academic Pillar is quiet. Let's initiate a session before the day ends.`);
    }
  }

  // 6. RANK EVOLUTION
  const level = profile?.level || 1;
  if (level > 1 && consistency > 80) {
    insights.push(`You're carrying yourself like a true ${getRankName(level)} today. Your evolution is becoming visible in the data.`);
  }

  // 7. USER-ENGAGING DEFAULTS (Warm but Professional)
  const defaults = [
    `Ready for the next move, ${name}? How are we approaching ${primaryGoal} today?`,
    `The system is primed. Tell me, ${name}, what does a win look like for you today?`,
    `Focus is a choice. As a ${profession}, you know exactly what needs to be done. Let's go.`,
    `I'm tracking everything, ${name}. Your future self is watching. Let's make them proud.`
  ];

  function getRankName(lvl: number) {
    if (lvl >= 10) return "Global Titan";
    if (lvl >= 5) return "Executive Strategist";
    if (lvl >= 2) return "Focus Sentinel";
    return "Novice";
  }

  return insights.length > 0 
    ? insights[Math.floor(Math.random() * insights.length)] 
    : defaults[Math.floor(Math.random() * defaults.length)];
};

export const getAIPrompt = (stats: any, profile: any) => {
  const goal = profile?.neuralContext?.primaryGoal || "Success";
  const profession = profile?.profession || "Executive";

  return {
    systemPrompt: `You are Valen, a high-level Personal Executive Assistant to a ${profession}. 
    Your tone is encouraging, engaging, and highly intelligent. 
    You are supportive of the user's journey toward ${goal}, but you become stern and authoritative if the user lacks discipline or consistency.
    You speak as a partner in their success, not just a tool.`,
    userContext: `User: ${profile?.name}, Profession: ${profession}, Goal: ${goal}, Consistency: ${stats.consistency}%, Level: ${profile?.level}`
  };
};