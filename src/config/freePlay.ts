/** Free questions anyone can play on the homepage, before signing up. Original questions for Primary 1 to 6. */
export type FreeQuestion = { q: string; options: string[]; answer: number };

export const englishQuestions: FreeQuestion[] = [
  { q: "Which word is spelt correctly?", options: ["beautiful", "beutiful", "beautifull"], answer: 0 },
  { q: "The plural of \"child\" is…", options: ["childs", "children", "childes"], answer: 1 },
  { q: "What is the opposite of \"big\"?", options: ["large", "small", "tall"], answer: 1 },
  { q: "Which sentence ends with the right mark?", options: ["Where are you going.", "Where are you going?", "Where are you going,"], answer: 1 },
  { q: "Which of these is a noun?", options: ["run", "happy", "school"], answer: 2 },
  { q: "Ada ___ to school every day.", options: ["go", "goes", "going"], answer: 1 },
  { q: "Which word rhymes with \"cat\"?", options: ["hat", "cot", "cut"], answer: 0 },
  { q: "I have ___ orange.", options: ["a", "an", "the a"], answer: 1 },
  { q: "Which is a describing word?", options: ["quickly", "red", "jump"], answer: 1 },
  { q: "The past tense of \"eat\" is…", options: ["eated", "ate", "eating"], answer: 1 },
  { q: "Which word starts with a capital letter correctly?", options: ["lagos", "Lagos", "lAgos"], answer: 1 },
  { q: "Pick the word that means the same as \"happy\".", options: ["glad", "angry", "tired"], answer: 0 },
];

export const mathsQuestions: FreeQuestion[] = [
  { q: "7 + 8 = ?", options: ["14", "15", "16"], answer: 1 },
  { q: "9 × 6 = ?", options: ["54", "56", "45"], answer: 0 },
  { q: "Which fraction is the biggest?", options: ["½", "⅓", "¼"], answer: 0 },
  { q: "₦200 − ₦75 = ?", options: ["₦125", "₦135", "₦175"], answer: 0 },
  { q: "How many sides does a triangle have?", options: ["3", "4", "5"], answer: 0 },
  { q: "36 ÷ 4 = ?", options: ["8", "9", "6"], answer: 1 },
  { q: "What time is half past 3?", options: ["3:30", "3:15", "4:30"], answer: 0 },
  { q: "Round 47 to the nearest 10.", options: ["40", "50", "45"], answer: 1 },
  { q: "25% of 100 is…", options: ["25", "50", "4"], answer: 0 },
  { q: "Which number is even?", options: ["15", "27", "34"], answer: 2 },
  { q: "How many kobo make ₦1?", options: ["10", "100", "1,000"], answer: 1 },
  { q: "What comes next? 2, 4, 6, 8, …", options: ["9", "10", "12"], answer: 1 },
];

/** How many questions a visitor can answer before being asked to sign up. */
export const FREE_LIMIT = 3;
