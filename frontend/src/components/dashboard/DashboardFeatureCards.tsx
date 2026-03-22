import { Link } from "react-router";
import { BookOpen, Calculator, Star } from "lucide-react";
import * as s from "./DashboardFeatureCards.css";

export function DashboardFeatureCards() {
  return (
    <div className={s.row}>
      <Link to="/benchmark" className={`${s.card} ${s.cardGreen}`}>
        <div className={s.cardTop}>
          <Star className={s.icon} size={22} strokeWidth={2} />
        </div>
        <h3 className={s.title}>AI Benchmark</h3>
        <p className={s.desc}>Discover your strengths across 8 dimensions</p>
        <span className={s.linkHint}>Report sent to parents</span>
      </Link>

      <Link to="/studio" className={`${s.card} ${s.cardPurple}`}>
        <div className={s.cardTop}>
          <Calculator className={s.icon} size={22} strokeWidth={2} />
        </div>
        <h3 className={s.title}>Math Studio</h3>
        <p className={s.desc}>Suggested concepts based on your level</p>
        <span className={s.badgePurple}>4 topics ready</span>
      </Link>

      <div className={`${s.card} ${s.cardTeal} ${s.cardDisabled}`} aria-disabled>
        <span className={s.comingSoon}>COMING SOON</span>
        <div className={s.cardTop}>
          <BookOpen className={s.iconMuted} size={22} strokeWidth={2} />
        </div>
        <h3 className={s.titleMuted}>Exam Prep</h3>
        <p className={s.descMuted}>Chapter-wise practice to prep for exams</p>
        <span className={s.badgeTeal}>10 chapters</span>
      </div>
    </div>
  );
}
