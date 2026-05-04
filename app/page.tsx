import MicroDefenseGame from "@/components/MicroDefenseGame";
import questions from "@/data/questions.json";
import type { MicroQuestion } from "@/lib/questionEngine";

export default function Home() {
  return <MicroDefenseGame questions={questions as MicroQuestion[]} />;
}
