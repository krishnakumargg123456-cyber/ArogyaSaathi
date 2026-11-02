import type { Metadata } from "next";
import { SaathiChatScreen } from "@/components/patient/SaathiChatScreen";

export const metadata: Metadata = {
  title: "Sehat Saathi | ArogyaSaathi",
  description: "A Hindi-first AI health conversation with image questions and spoken replies.",
};

export default function SaathiPage() {
  return <SaathiChatScreen />;
}
