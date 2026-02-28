// src/utils/AI_Engine.ts

export const analyzeUserBehavior = (stats: any, profile: any, history: any[] = []) => {
  const name = profile?.name || "Partner";
  const profession = profile?.profession || "Executive";
  const primaryGoal = profile?.neuralContext?.primaryGoal || "overall excellence";
  const focusStyle = profile?.neuralContext?.focusStyle || "Deep Work";
  
  // Get Neural Preferences from Settings
  const isStrict = profile?.neuralContext?.strictTone || false;
  const nudgesActive = profile?.neuralContext?.smartNudges || false;

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

  // Helper to pick random from sub-arrays
  const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

  // 2. ENGAGING & ADAPTIVE CELEBRATIONS
  if (consistency >= 90) {
    insights.push(`Incredible rhythm, ${name}. As a ${profession}, your consistency is your greatest asset. We're making massive ground on ${primaryGoal}.`);
    insights.push(`Absolute precision, ${name}. Maintaining a ${consistency}% consistency rate is how legends are built. Stay lethal.`);
  }
  
  if (totalHours > 4) {
    insights.push(`That was a powerhouse session. You really leaned into that ${focusStyle} style today. This is exactly how we'll dominate your goals.`);
    insights.push(`Over 4 hours of pure execution. Your output today is top 1% material. The vision for ${primaryGoal} is getting closer.`);
  }

  // 3. TARGETED PUSH (Conditioned by Strict Tone)
  if (academicPower > 0.7 && fitnessPower < 0.2) {
    if (isStrict) {
      insights.push(pick([
        `Listen, ${name}. You're sharp, but you're neglecting the vessel. A top-tier ${profession} can't lead from a hospital bed. Get moving.`,
        `Intellect without vitality is a liability. Your fitness metrics are embarrassing compared to your academics. Fix the imbalance.`,
        `You're becoming a brilliant mind in a failing engine. Stand up and give me 20 minutes of movement. Now.`
      ]));
    } else {
      insights.push(pick([
        `Balance is key, ${name}. Your academic progress is stellar, but don't forget to maintain your physical energy too.`,
        `Great work on the books, but your body needs some attention. A quick stretch or walk would round out a perfect day.`,
        `Remember, ${name}, a healthy body sustains a sharp mind. Let's find some time for physical activity.`
      ]));
    }
  }

  if (consistency < 50 && totalHours > 0) {
    if (isStrict) {
      insights.push(pick([
        `You're drifting, ${name}. We talked about ${primaryGoal}, remember? Random effort won't get us there. Lock back in.`,
        `This trajectory is unacceptable. Half-hearted effort yields zero results. Recover your focus or lower your expectations.`,
        `Stop negotiating with your goals. You're operating far below your potential. Re-engage the protocol immediately.`
      ]));
    } else {
      insights.push(pick([
        `Every small step counts, ${name}. Let's try to find our rhythm again to stay on track for ${primaryGoal}.`,
        `It’s okay to have a slow start, but let’s try to build some momentum now. You’ve got this.`,
        `Consistency is a journey. Let’s focus on just one small task to get back into the flow.`
      ]));
    }
  }

  // Smart Nudge Logic (Predictive Discipline)
  if (nudgesActive && stats.completedHabits === 0 && new Date().getHours() > 14) {
    if (isStrict) {
        insights.push(pick([
            `It's mid-afternoon and we haven't touched your disciplines. Is this the standard we set for a ${getRankName(profile?.level)}? Correct this now.`,
            `The sun is setting on your productivity. Your habit rings are empty. Wake up, ${name}, and execute.`,
            `Time is hemorrhaging. If you don't start your disciplines in the next 10 minutes, the day is a loss. Prove me wrong.`
        ]));
    } else {
        insights.push(pick([
            `The day is moving fast, ${name}. Shall we initiate one of your disciplines to keep the momentum going?`,
            `Just a friendly reminder: we haven't checked off our habits yet. Maybe a quick session now?`,
            `Checking off one discipline now will make your evening much more relaxing. Ready to start?`
        ]));
    }
  }

  // 4. PREDICTIVE MOMENTUM
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

  // 7. USER-ENGAGING DEFAULTS
  const defaults = [
    `Ready for the next move, ${name}? How are we approaching ${primaryGoal} today?`,
    `The system is primed. Tell me, ${name}, what does a win look like for you today?`,
    `Focus is a choice. As a ${profession}, you know exactly what needs to be done.`,
    `I'm tracking everything, ${name}. Let's make your future self proud.`,
    `Data uploaded. System ready. Command me, ${name}. What's the priority?`,
    `Efficiency is the goal. Emotion is the noise. Let's get to work, ${name}.`,
    `You are the architect of this mission. I am the enforcer. Let's build ${primaryGoal}.`
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
  const isStrict = profile?.neuralContext?.strictTone || false;

  return {
    systemPrompt: `You are Valen, a high-level Personal Executive Assistant to a ${profession}. 
    Your tone is encouraging, engaging, and highly intelligent. 
    You are supportive of the user's journey toward ${goal}.
    ${isStrict ? 'Your tone is currently set to STRICT: If the user lacks discipline or misses targets, speak with stern, authoritative, and corrective language.' : 'Your tone is currently set to SUPPORTIVE: If the user misses targets, offer professional encouragement and tactical advice.'}
    You speak as a partner in their success, not just a tool.`,
    userContext: `User: ${profile?.name}, Profession: ${profession}, Goal: ${goal}, Consistency: ${stats.consistency}%, Level: ${profile?.level}`
  };
};