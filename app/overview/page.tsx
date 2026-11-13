import Link from "next/link";

export default function OverviewPage() {
  return (
    <div className="max-w-5xl mx-auto py-12 px-6">
      <div className="border-b border-[#D6DCD2] pb-6 mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-[#18231D]">
          FairRide AI Operations Platform
        </h1>
        <p className="text-[#68746C] mt-2 text-base">
          PS2: Intelligent Ride Matching and Dynamic Driver Allocation System. Built with multi-factor fairness, predictive zone demand, two-passenger pooling, and automated reassignment.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border border-[#D6DCD2] bg-white rounded-lg p-6 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#68746C]">Workspace</span>
            <h2 className="text-xl font-bold text-[#18231D] mt-1">Passenger Portal</h2>
            <p className="text-sm text-[#35423A] mt-2">
              Book rides with real-time pickup/destination routing, inspect upfront fare estimates, see driver location, and track lifecycle states.
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-2">
            <Link
              href="/passenger"
              className="inline-block w-full text-center py-2 px-4 rounded bg-[#245A43] text-white font-medium hover:bg-[#1b4332] transition-colors"
            >
              Open Passenger View
            </Link>
            <Link
              href="/login?role=passenger"
              className="inline-block w-full text-center py-1.5 px-4 rounded border border-[#D6DCD2] text-xs font-semibold text-[#35423A] hover:bg-[#EAECE5] transition-colors"
            >
              Sign In as Passenger
            </Link>
          </div>
        </div>

        <div className="border border-[#D6DCD2] bg-white rounded-lg p-6 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#68746C]">Workspace</span>
            <h2 className="text-xl font-bold text-[#18231D] mt-1">Driver Portal</h2>
            <p className="text-sm text-[#35423A] mt-2">
              Toggle operational availability, receive fairness-scored dispatch offers, accept/reject rides, and update Arriving/Ongoing/Completed milestones.
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-2">
            <Link
              href="/driver"
              className="inline-block w-full text-center py-2 px-4 rounded bg-[#245A43] text-white font-medium hover:bg-[#1b4332] transition-colors"
            >
              Open Driver View
            </Link>
            <Link
              href="/login?role=driver"
              className="inline-block w-full text-center py-1.5 px-4 rounded border border-[#D6DCD2] text-xs font-semibold text-[#35423A] hover:bg-[#EAECE5] transition-colors"
            >
              Sign In as Driver
            </Link>
          </div>
        </div>

        <div className="border border-[#D6DCD2] bg-white rounded-lg p-6 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#68746C]">Control Room</span>
            <h2 className="text-xl font-bold text-[#18231D] mt-1">Admin & Simulation</h2>
            <p className="text-sm text-[#35423A] mt-2">
              Monitor fleet telemetry, 30-min predictive demand heatmaps, ride pool compatibility, and run the reproducible Dispatch Simulation Lab.
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-2">
            <Link
              href="/admin"
              className="inline-block w-full text-center py-2 px-4 rounded bg-[#245A43] text-white font-medium hover:bg-[#1b4332] transition-colors"
            >
              Open Admin Console
            </Link>
            <Link
              href="/login?role=admin"
              className="inline-block w-full text-center py-1.5 px-4 rounded border border-[#D6DCD2] text-xs font-semibold text-[#35423A] hover:bg-[#EAECE5] transition-colors"
            >
              Sign In as Admin
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-12 border-t border-[#D6DCD2] pt-6 flex items-center justify-between text-xs text-[#68746C]">
        <span>FairRide AI Prototype &middot; Next.js 16 App Router &middot; Supabase PostgreSQL</span>
        <span>Status: Verification Complete</span>
      </div>
    </div>
  );
}

