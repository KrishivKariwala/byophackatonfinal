import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-16 bg-logobg">
      <div className="mx-auto flex max-w-7xl flex-col items-start gap-4 px-4 py-8 sm:flex-row sm:items-center sm:px-6">
        <Logo width={96} />
        <div className="flex-1 text-xs text-burgundy">
          <p className="font-semibold tracking-wide">RESCUING GOOD FOOD, REDUCING WASTE, AND MAKING EVERY MEAL COUNT. · EST. 2026</p>
          <p className="mt-1 text-muted">
            Demo build: all restaurants, NGOs, ratings and approvals are fictional; payments are simulated or Razorpay TEST mode. Impact counts
            treat one listed unit as one meal and count only completed handovers.
          </p>
        </div>
      </div>
    </footer>
  );
}
