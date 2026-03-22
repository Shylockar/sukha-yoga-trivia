import ScoreBadge from "@/components/ScoreBadge";
import HowToPlayModal from "@/components/HowToPlayModal";
import MiniLeaderboard from "@/components/MiniLeaderboard";
import LevelAwareCategoryGrid from "@/components/LevelAwareCategoryGrid";
import HomeMessages from "@/components/HomeMessages";

export default function Home() {
  return (
    <main className="min-h-screen">
      <HomeMessages />

      <div className="mx-auto w-full max-w-[512px] px-4 pb-16 pt-14">

        {/* ── Isotipo + Logo ── */}
        <div className="animate-fadeInUp mb-10 text-center">
          <div className="mb-6 flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/flor-sukha.svg"
              alt=""
              width={72}
              height={72}
              className="animate-slowSpinLogo"
              aria-hidden="true"
            />
          </div>

          <h1 className="font-bree text-5xl leading-none tracking-tight text-sukha-dark">
            Sukha{" "}
            <span className="text-sukha-accent">Trivia</span>
          </h1>
          <p className="mt-4 font-rubik text-lg font-light text-sukha-dark">
            ¿Cuánto sabés sobre yoga?
          </p>
        </div>

        {/* ── Score badge (client-only) ── */}
        <ScoreBadge />

        {/* ── Cómo se juega ── */}
        <div className="animate-fadeInUp mb-4" style={{ animationDelay: "60ms" }}>
          <HowToPlayModal />
        </div>

        {/* ── Level-aware grid: Aleatorio + Categorías con selector de nivel ── */}
        <LevelAwareCategoryGrid />

        {/* ── Mini leaderboard ── */}
        <div className="mt-2">
          <MiniLeaderboard />
        </div>

        {/* ── Footer ── */}
        <p className="mt-12 text-center font-rubik text-xs text-sukha-mid">
          SUKHA · www.sukhaonline.com.ar
        </p>
      </div>
    </main>
  );
}
