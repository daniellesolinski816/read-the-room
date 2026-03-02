import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

const CATEGORIES = ['Family', 'Community', 'Digital', 'Civic', 'Workplace', 'Personal', 'Reflection'];

export default function GenerateScenario({ isPremium, onScenarioGenerated }) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generate = async () => {
    setIsGenerating(true);
    const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a scenario designer for The Empathy Enigma, an empathy training game. Generate a single, original real-life scenario in the "${category}" category.

The scenario should:
- Present a charged, emotionally complex moment between two people
- Have no clear "right" political or moral answer
- Invite empathic communication (not debate or advice)
- Be 2-4 sentences, written in second person ("Your friend tells you..." / "A colleague approaches you...")
- Reflect diverse, realistic, modern situations
- Be suitable for all adult players

Return JSON with:
{
  "title": "<short evocative title, 3-6 words>",
  "category": "${category}",
  "prompt": "<the full scenario text>"
}`,
      response_json_schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          category: { type: "string" },
          prompt: { type: "string" }
        },
        required: ["title", "category", "prompt"]
      }
    });

    setIsGenerating(false);
    onScenarioGenerated({
      id: `ai-${Date.now()}`,
      title: result.title,
      category: result.category,
      prompt: result.prompt,
      is_premium: true
    });
  };

  if (!isPremium) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#C9943A]/30 bg-[#C9943A]/5"
      >
        <Lock className="w-4 h-4 text-[#C9943A]/60" />
        <span className="text-xs text-[#C9943A]/60">AI Scenarios · Premium Only</span>
      </motion.div>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={generate}
      disabled={isGenerating}
      className="border-[#C9943A]/50 text-[#C9943A] hover:bg-[#C9943A]/10 hover:border-[#C9943A] gap-2"
    >
      {isGenerating ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Sparkles className="w-4 h-4" />
      )}
      {isGenerating ? 'Generating...' : 'AI Scenario'}
    </Button>
  );
}