import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { getProject } from "@/data/studio-projects";
import { resolveThemedProject, applyThemeToCharacter } from "@/data/studio-themes";
import { useStudioTheme } from "@/context/StudioThemeContext";
import { CharacterBase, useCharacterState } from "@/components/characters";
import { PRESET_CONFIGS } from "@/components/characters/presets/configs";
import { StepRenderer } from "@/components/studio/StepRenderer/StepRenderer";
import * as s from "./StudioPlayerPage.css";

export default function StudioPlayerPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { activeTheme } = useStudioTheme();

  const baseProject = getProject(projectId ?? "");
  const project = baseProject ? resolveThemedProject(baseProject, activeTheme) : undefined;

  const [stepIndex, setStepIndex] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  const [showXPToast, setShowXPToast] = useState(false);
  const [stepAnswered, setStepAnswered] = useState(false);
  const [completed, setCompleted] = useState(false);

  const charState = useCharacterState();

  const labels = activeTheme?.labels;
  const xpName = labels?.xpName ?? "XP";
  const xpIcon = labels?.xpIcon ?? "⭐";

  // Build character config — apply theme overrides if active
  const presetName = project?.characterPreset ?? "detective";
  const baseConfig = PRESET_CONFIGS[presetName] ?? PRESET_CONFIGS.detective;
  const charConfig = activeTheme
    ? applyThemeToCharacter(baseConfig, activeTheme, presetName)
    : baseConfig;

  if (!project) {
    return (
      <div className={s.root}>
        <div className={s.main}>
          <p>Project not found.</p>
          <button className={s.nextBtn} onClick={() => navigate("/studio")}>
            Back to Studio
          </button>
        </div>
      </div>
    );
  }

  const step = project.steps[stepIndex];
  const isLastStep = stepIndex === project.steps.length - 1;
  const isIntro = step?.challengeType === "story_intro";

  const themeStyles = activeTheme
    ? ({
        background: activeTheme.visuals.pageBackground,
        "--studio-accent": activeTheme.visuals.accentColor,
        "--studio-accent-hover": activeTheme.visuals.accentHoverColor,
      } as React.CSSProperties)
    : undefined;

  const awardXP = (xp: number) => {
    setTotalXP((t) => t + xp);
    setShowXPToast(true);
    setTimeout(() => setShowXPToast(false), 2000);
  };

  const handleCorrect = () => {
    charState.react("correct");
    awardXP(step.xpReward);
    setStepAnswered(true);
  };

  const handleWrong = () => {
    charState.react("wrong");
    setStepAnswered(true);
  };

  const handleIntroComplete = () => {
    awardXP(step.xpReward);
    goNext();
  };

  const goNext = () => {
    if (isLastStep) {
      setCompleted(true);
      charState.react("complete");
      return;
    }
    setStepIndex((i) => i + 1);
    setStepAnswered(false);
    charState.react("reset");
  };

  if (completed) {
    return (
      <div className={s.root} style={themeStyles}>
        <div className={s.topBar}>
          <div className={s.topBarLeft}>
            <span className={s.backBtn} onClick={() => navigate("/studio")}>
              <ArrowLeft size={14} /> Studio
            </span>
          </div>
        </div>
        <div className={s.main}>
          <motion.div
            className={s.completionScreen}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className={s.characterArea}>
              <CharacterBase
                config={charConfig}
                expression={charState.expression}
                action={charState.action}
                size={160}
              />
            </div>
            <div
              className={s.completionTitle}
              style={activeTheme ? { color: "rgba(255,255,255,0.95)" } : undefined}
            >
              {project.icon} {labels?.completionTitle ?? "Project Complete!"}
            </div>
            <motion.div
              className={s.completionXP}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
              style={activeTheme ? { color: activeTheme.visuals.accentColor } : undefined}
            >
              +{totalXP} {xpName} {xpIcon}
            </motion.div>
            <div
              className={s.completionSubtext}
              style={activeTheme ? { color: "rgba(255,255,255,0.6)" } : undefined}
            >
              Great work on {project.name}!
            </div>
            <button
              className={s.nextBtn}
              onClick={() => navigate("/studio")}
              style={
                activeTheme
                  ? { backgroundColor: activeTheme.visuals.accentColor }
                  : undefined
              }
            >
              Back to Studio
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className={s.root} style={themeStyles}>
      {/* Top bar */}
      <div
        className={s.topBar}
        style={
          activeTheme
            ? {
                backgroundColor: "rgba(0,0,0,0.3)",
                borderBottomColor: "rgba(255,255,255,0.1)",
                backdropFilter: "blur(12px)",
              }
            : undefined
        }
      >
        <div className={s.topBarLeft}>
          <span
            className={s.backBtn}
            onClick={() => navigate("/studio")}
            style={activeTheme ? { color: "rgba(255,255,255,0.6)" } : undefined}
          >
            <ArrowLeft size={14} /> Back
          </span>
          <div
            className={s.projectTitle}
            style={activeTheme ? { color: "rgba(255,255,255,0.95)" } : undefined}
          >
            <span>{project.icon}</span> {project.name}
          </div>
        </div>
        <div className={s.topBarLeft}>
          <span
            className={s.stepCounter}
            style={activeTheme ? { color: "rgba(255,255,255,0.5)" } : undefined}
          >
            {labels?.stepNoun ?? "Step"} {stepIndex + 1} of {project.steps.length}
          </span>
          <span
            className={s.xpBadge}
            style={
              activeTheme
                ? {
                    color: activeTheme.visuals.accentColor,
                    backgroundColor: `${activeTheme.visuals.accentColor}18`,
                    borderColor: `${activeTheme.visuals.accentColor}33`,
                  }
                : undefined
            }
          >
            {xpIcon} {totalXP} {xpName}
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className={s.main}>
        {/* Character */}
        <motion.div
          className={s.characterArea}
          animate={charState.action === "talking" ? { y: [0, -3, 0] } : {}}
          transition={{ repeat: Infinity, duration: 0.6 }}
        >
          <CharacterBase
            config={charConfig}
            expression={charState.expression}
            action={charState.action}
            size={130}
          />
        </motion.div>

        {/* Story text (speech bubble) — shown for challenge steps, not intros */}
        {!isIntro && (
          <motion.div
            className={s.storyText}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            key={`story-${stepIndex}`}
          >
            <div className={s.speechTail} />
            {step.storyText}
          </motion.div>
        )}

        {/* Content card — wraps challenge + button so text is readable on dark themed bg */}
        <div className={activeTheme ? s.contentCard : undefined}>
          {/* Step content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={stepIndex}
              className={s.challengeArea}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
            >
              <StepRenderer
                step={step}
                onCorrect={handleCorrect}
                onWrong={handleWrong}
                onComplete={handleIntroComplete}
                onTalkingChange={(talking) => {
                  if (talking) charState.startTalking();
                  else charState.stopTalking();
                }}
                onExpressionChange={charState.setExpression}
              />
            </motion.div>
          </AnimatePresence>

          {/* Next button (for non-intro answered steps) */}
          <AnimatePresence>
            {stepAnswered && !isIntro && (
              <motion.button
                className={s.nextBtn}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                onClick={goNext}
                style={
                  activeTheme
                    ? { backgroundColor: activeTheme.visuals.accentColor }
                    : undefined
                }
              >
                {isLastStep ? "Finish! 🎉" : `Next ${labels?.stepNoun ?? "Step"} →`}
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Progress dots */}
        <div className={s.progressDots}>
          {project.steps.map((_, i) => (
            <div
              key={i}
              className={`${s.dot} ${i < stepIndex ? s.dotDone : ""} ${i === stepIndex ? s.dotCurrent : ""}`}
              style={
                activeTheme && i === stepIndex
                  ? {
                      backgroundColor: activeTheme.visuals.accentColor,
                      boxShadow: `0 0 6px ${activeTheme.visuals.accentColor}`,
                    }
                  : undefined
              }
            />
          ))}
        </div>
      </div>

      {/* XP Toast */}
      <AnimatePresence>
        {showXPToast && (
          <motion.div
            className={s.xpToast}
            initial={{ opacity: 0, y: -20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 400 }}
            style={
              activeTheme
                ? { backgroundColor: activeTheme.visuals.xpToastColor }
                : undefined
            }
          >
            +{step.xpReward} {xpName} {xpIcon}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
