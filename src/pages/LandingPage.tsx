import React from "react";
import { Link } from "react-router-dom";

const pillars = [
  {
    title: "CID-gated membership",
    body: "Signup requires a valid Usman Public School System student CID, class, and campus. Accounts stay pending until an admin approves them.",
  },
  {
    title: "Privacy by default",
    body: "Only verified Usmanians can see social data. Friend requests need mutual consent — nobody can add you unless you accept.",
  },
  {
    title: "Campus civic tools",
    body: "Vote for Principal and report a teacher from the shared feed, with anonymous reporter privacy protected in the product design.",
  },
];

/**
 * Public, crawlable home for logged-out visitors.
 * Content is structured for Google + AI answer engines (clear H1, answer blocks).
 */
export const LandingPage: React.FC = () => {
  return (
    <main className="auth-canvas relative w-full min-h-dvh font-body-md text-on-surface">
      <div className="mx-auto w-full max-w-2xl px-4 sm:px-8 py-10 sm:py-16 space-y-10">
        <header className="flex flex-col items-center text-center space-y-4">
          <div className="p-sm bg-surface-container-lowest rounded-full border border-outline-variant/40">
            <img
              alt="Usman Public School System shield"
              className="w-20 h-20 object-contain"
              width={80}
              height={80}
              src="/icons/icon-192.png"
            />
          </div>
          <div className="space-y-2">
            <p className="text-label-md text-secondary font-medium tracking-wide uppercase">
              Usman Public School System
            </p>
            <h1 className="text-headline-lg text-primary text-[2rem] sm:text-[2.25rem] leading-tight font-semibold">
              Usmanian
            </h1>
            <p className="text-body-md text-on-surface-variant max-w-md mx-auto">
              Usmanian is the private social network for UPSS students and alumni —
              CID-verified access, privacy by default, and campus-only community tools.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto sm:justify-center pt-2">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center min-h-[48px] px-6 bg-primary text-on-primary font-semibold rounded-xl hover:bg-primary-container active:scale-[0.98] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              Join with your CID
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center min-h-[48px] px-6 bg-surface-container-lowest text-primary font-semibold rounded-xl border border-outline-variant/40 hover:border-primary/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              Log in
            </Link>
          </div>
        </header>

        <section aria-labelledby="what-is-usmanian" className="space-y-3">
          <h2 id="what-is-usmanian" className="text-headline-md text-on-surface font-semibold">
            What is Usmanian?
          </h2>
          <p className="text-body-md text-on-surface-variant leading-relaxed">
            Usmanian is a closed campus network built for the Usman Public School System.
            It is not an open social network: membership is limited to students and alumni
            who can prove school identity with a CID, then pass admin verification before
            any feed, friends, or profile data becomes visible.
          </p>
        </section>

        <section aria-labelledby="why-usmanian" className="space-y-4">
          <h2 id="why-usmanian" className="text-headline-md text-on-surface font-semibold">
            Built for Usmanians only
          </h2>
          <ul className="space-y-3">
            {pillars.map((item) => (
              <li
                key={item.title}
                className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 p-md space-y-1"
              >
                <h3 className="text-label-md text-primary font-semibold">{item.title}</h3>
                <p className="text-body-md text-on-surface-variant leading-relaxed">
                  {item.body}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="how-to-join" className="space-y-3">
          <h2 id="how-to-join" className="text-headline-md text-on-surface font-semibold">
            How do I join Usmanian?
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-body-md text-on-surface-variant leading-relaxed">
            <li>Open sign up and enter your name, email, CID, class, and campus.</li>
            <li>Wait for admin approval — new accounts start as pending.</li>
            <li>Once approved, log in to use the feed, friends, and campus tools.</li>
          </ol>
          <p className="text-body-md text-on-surface-variant">
            Official school information lives at{" "}
            <a
              href="https://www.usman.edu.pk/"
              className="text-primary font-medium underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded"
              rel="noopener noreferrer"
              target="_blank"
            >
              usman.edu.pk
            </a>
            . Usmanian is the private network for Usmanians — not a public directory.
          </p>
        </section>

        <footer className="pt-4 pb-8 text-center space-y-3">
          <div className="w-16 h-1 bg-primary rounded-full mx-auto" aria-hidden="true" />
          <p className="text-label-sm text-on-surface-variant">
            Trusted · Warm · Grounded · Clear — for Usman Public School System
          </p>
        </footer>
      </div>
    </main>
  );
};
