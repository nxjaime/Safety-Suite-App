import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarCheck, ShieldCheck, Truck, Sparkles, BarChart3, Users, FileText, HelpCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Landing: React.FC = () => {
  const { session } = useAuth();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 selection:bg-emerald-500/30">
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute top-[20%] right-[-10%] w-[30%] h-[50%] rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] rounded-full bg-purple-500/10 blur-[120px]" />
      </div>

      <div className="relative z-10">
        <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-slate-900/80 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white">SafetyHub Connect</span>
            </div>
            <div className="flex items-center gap-4">
              {session ? (
                  <Link
                    to="/dashboard"
                    className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400 transition-colors"
                  >
                    Go to Dashboard
                  </Link>
              ) : (
                  <>
                      <Link to="/login" className="hidden text-sm font-medium text-slate-300 hover:text-white sm:block">
                        Sign In
                      </Link>
                      <Link
                        to="/login"
                        className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400 transition-colors"
                      >
                        Get Started
                      </Link>
                  </>
              )}
            </div>
          </div>
        </header>

        <main>
          {/* Hero Section */}
          <section className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <div className="mb-6 inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                <Sparkles className="mr-2 h-3 w-3" />
                The All-in-One Fleet Safety Platform
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
                Safety First, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Compliance Always</span>
              </h1>
              <p className="mt-6 text-lg leading-8 text-slate-400">
                Empower your fleet with real-time risk intelligence, automated compliance tracking, and streamlined operations. 
                Reduce incidents and keep your drivers safe.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Link
                  to="/login"
                  className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 transition-all hover:scale-105"
                >
                  Start Free Trial
                </Link>
                <Link to="/login" className="text-sm font-semibold leading-6 text-white hover:text-emerald-300 flex items-center gap-1">
                  View Demo <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            
            {/* Hero Stats */}
            <div className="mt-16 border-y border-white/5 bg-white/5 backdrop-blur-sm sm:mt-24">
              <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <dl className="grid grid-cols-1 gap-x-8 gap-y-16 text-center lg:grid-cols-3">
                  <div className="mx-auto flex max-w-xs flex-col gap-y-4 py-10">
                    <dt className="text-base leading-7 text-slate-400">Reduction in Incidents</dt>
                    <dd className="order-first text-3xl font-semibold tracking-tight text-white sm:text-5xl">40%</dd>
                  </div>
                  <div className="mx-auto flex max-w-xs flex-col gap-y-4 py-10">
                    <dt className="text-base leading-7 text-slate-400">Compliance Rate</dt>
                    <dd className="order-first text-3xl font-semibold tracking-tight text-white sm:text-5xl">99.9%</dd>
                  </div>
                  <div className="mx-auto flex max-w-xs flex-col gap-y-4 py-10">
                    <dt className="text-base leading-7 text-slate-400">Admin Time Saved</dt>
                    <dd className="order-first text-3xl font-semibold tracking-tight text-white sm:text-5xl">20h+</dd>
                  </div>
                </dl>
              </div>
            </div>
          </section>

          {/* Features Grid */}
          <section className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Everything you need to manage your fleet</h2>
              <p className="mt-6 text-lg leading-8 text-slate-400">
                From driver onboarding to maintenance tracking, SafetyHub connects every aspect of your operations.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                    <Truck className="h-5 w-5 flex-none text-emerald-400" />
                    Fleet Management
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-slate-400">
                    <p className="flex-auto">Track vehicle locations, manage assignments, and monitor utilization rates in real-time.</p>
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                    <ShieldCheck className="h-5 w-5 flex-none text-emerald-400" />
                    Safety & Compliance
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-slate-400">
                    <p className="flex-auto">Automated DQ files, MVR monitoring, and CSA score prediction to keep you audit-ready.</p>
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                    <FileText className="h-5 w-5 flex-none text-emerald-400" />
                    Document Control
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-slate-400">
                    <p className="flex-auto">Centralized storage for all fleet documents with expiration alerts and renewal tracking.</p>
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                    <Users className="h-5 w-5 flex-none text-emerald-400" />
                    Driver Coaching
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-slate-400">
                    <p className="flex-auto">Assign training modules, track completion, and improve driver behavior with targeted coaching.</p>
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                    <BarChart3 className="h-5 w-5 flex-none text-emerald-400" />
                    Advanced Analytics
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-slate-400">
                    <p className="flex-auto">Visualize trends, identify risks, and make data-driven decisions with customizable dashboards.</p>
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                    <CalendarCheck className="h-5 w-5 flex-none text-emerald-400" />
                    Maintenance Scheduling
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-slate-400">
                    <p className="flex-auto">Prevent breakdowns with automated maintenance schedules and work order management.</p>
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8 border-t border-white/5">
            <div className="mx-auto max-w-4xl divide-y divide-white/10">
              <h2 className="text-2xl font-bold leading-10 tracking-tight text-white">Frequently asked questions</h2>
              <dl className="mt-10 space-y-6 divide-y divide-white/10">
                <div className="pt-6">
                  <dt>
                    <div className="flex w-full items-start justify-between text-left text-white">
                      <span className="text-base font-semibold leading-7">How long does implementation take?</span>
                    </div>
                  </dt>
                  <dd className="mt-2 pr-12">
                    <p className="text-base leading-7 text-slate-400">Most fleets are up and running within 48 hours. Our team assists with data migration and setup.</p>
                  </dd>
                </div>
                <div className="pt-6">
                  <dt>
                    <div className="flex w-full items-start justify-between text-left text-white">
                      <span className="text-base font-semibold leading-7">Is it FMCSA compliant?</span>
                    </div>
                  </dt>
                  <dd className="mt-2 pr-12">
                    <p className="text-base leading-7 text-slate-400">Yes, our platform is designed to meet all FMCSA regulations regarding driver qualification files, maintenance records, and hours of service monitoring.</p>
                  </dd>
                </div>
                <div className="pt-6">
                  <dt>
                    <div className="flex w-full items-start justify-between text-left text-white">
                      <span className="text-base font-semibold leading-7">Can I integrate with my ELD provider?</span>
                    </div>
                  </dt>
                  <dd className="mt-2 pr-12">
                    <p className="text-base leading-7 text-slate-400">We support integrations with major ELD providers including Motive, Samsara, and Geotab.</p>
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          {/* CTA Section */}
          <section className="relative isolate mt-32 px-6 py-32 sm:mt-56 sm:py-40 lg:px-8 bg-emerald-900/20">
            <div className="absolute inset-x-0 top-1/2 -z-10 -translate-y-1/2 transform-gpu overflow-hidden opacity-30 blur-3xl" aria-hidden="true">
              <div className="ml-[max(50%,38rem)] aspect-[1313/771] w-[82.0625rem] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
            </div>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Ready to upgrade your fleet safety?</h2>
              <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-slate-300">
                Join hundreds of safety-conscious fleets using SafetyHub to protect their drivers and bottom line.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Link
                  to="/login"
                  className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
                >
                  Get started today
                </Link>
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t border-white/5 bg-slate-900 py-12">
          <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row justify-between items-center gap-6">
             <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-emerald-500/20 text-emerald-400">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <span className="text-sm font-semibold text-slate-300">SafetyHub Connect</span>
             </div>
             <p className="text-xs text-slate-500">© 2026 SafetyHub Connect. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Landing;
