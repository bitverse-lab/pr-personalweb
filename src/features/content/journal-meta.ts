import { FiFrown, FiMeh, FiSmile, FiSun, FiCloudRain } from "react-icons/fi";

export const MOODS = [
  { value: 1, label: "Awful", Icon: FiCloudRain },
  { value: 2, label: "Bad", Icon: FiFrown },
  { value: 3, label: "Okay", Icon: FiMeh },
  { value: 4, label: "Good", Icon: FiSmile },
  { value: 5, label: "Great", Icon: FiSun },
] as const;

export const moodLabel = (value: number | null) => MOODS.find((m) => m.value === value)?.label ?? null;

// Sequential blue ramp (light → dark): mood is ordered, so lightness carries the order.
// Every use is paired with an icon and a text label, never colour alone.
export const MOOD_COLOR: Record<number, string> = {
  1: "#c5d9f3",
  2: "#8db6e8",
  3: "#5a95dc",
  4: "#2a78d6",
  5: "#1c56a0",
};

export const PROMPTS = [
  "What is one thing that went well today, and why?",
  "What is taking up most of your mental space right now?",
  "Describe a moment today you would like to remember.",
  "What did you learn this week that surprised you?",
  "Who are you grateful for today, and what would you tell them?",
  "What is a small win you have not given yourself credit for?",
  "What would make tomorrow a good day?",
  "What are you avoiding, and what is the smallest step toward it?",
  "How did your body feel today? What did it need?",
  "What did you do today that your future self will thank you for?",
  "Write about a decision you are weighing. What does each side cost?",
  "What drained your energy today? What restored it?",
  "What are you looking forward to?",
  "What would you do this week if you were not afraid of failing?",
  "Describe your ideal ordinary day a year from now.",
  "What is something you changed your mind about recently?",
  "What did you spend time on today that did not matter?",
  "Write a letter to yourself from five years ago.",
  "What made you laugh recently?",
  "Which of your habits is helping you most right now?",
  "What is a problem you solved recently, and how?",
  "What would you tell a friend in your exact situation?",
  "What are three things within your control this week?",
  "What conversation are you rehearsing in your head?",
  "What are you proud of that nobody has noticed?",
  "Where did your attention go today? Where did you want it to go?",
  "What is one thing you would like to let go of?",
  "What did you notice today that you usually miss?",
  "What is your next career step, and what is in the way?",
  "How are you really doing?",
];

export function promptForDate(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  const dayOfYear = Math.floor((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 0)) / 86400000);
  return dayOfYear % PROMPTS.length;
}
