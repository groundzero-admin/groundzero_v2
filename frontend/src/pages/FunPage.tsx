import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Pizza, Bot } from "lucide-react";
import { FractionPizza } from "@/components/fun/FractionPizza/FractionPizza";
import { AIOrHuman } from "@/components/fun/AIOrHuman/AIOrHuman";
import * as s from "./FunPage.css";

const TABS = [
  { id: "pizza", label: "Fraction Pizza", icon: Pizza },
  { id: "ai", label: "AI or Human?", icon: Bot },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function FunPage() {
  const [activeTab, setActiveTab] = useState<TabId>("pizza");
  const navigate = useNavigate();

  return (
    <div className={s.root}>
      <div
        className={s.backLink}
        onClick={() => navigate("/")}
      >
        <ArrowLeft size={14} /> Back
      </div>

      <div className={s.header}>
        <div className={s.title}>Fun Questions</div>
        <div className={s.subtitle}>
          Interactive, animated questions that make learning fun
        </div>
      </div>

      <div className={s.tabs}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`${s.tab} ${activeTab === tab.id ? s.tabActive : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className={s.content}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === "pizza" && <FractionPizza />}
            {activeTab === "ai" && <AIOrHuman />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
