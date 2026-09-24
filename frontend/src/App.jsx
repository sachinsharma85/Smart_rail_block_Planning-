import { useEffect, useMemo, useState } from 'react';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const API = 'https://smart-rail-block-planning-api.onrender.com';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '▦' },
  { id: 'assets', label: 'Assets', icon: '◈' },
  { id: 'tasks', label: 'Maintenance Tasks', icon: '✓' },
  { id: 'defects', label: 'Defects', icon: '⚠' },
  { id: 'trains', label: 'Train Schedule', icon: '▣' },
  { id: 'corridors', label: 'Corridor Availability', icon: '↔' },
  { id: 'plans', label: 'Block Plans', icon: '◆' },
];

function Card({ children, className = "" }) {
  return (
    <div
      className={`bg-white border border-slate-200 rounded-2xl shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

function StatusBadge({ children, type = "default" }) {
  const styles = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    danger: "bg-red-50 text-red-700 border-red-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
    purple: "bg-violet-50 text-violet-700 border-violet-200",
    default: "bg-slate-50 text-slate-700 border-slate-200",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
        styles[type] || styles.default
      }`}
    >
      {children}
    </span>
  );
}

function getPriorityType(score) {
  if (score >= 80) return "danger";
  if (score >= 50) return "warning";
  return "info";
}

function getPriorityLabel(score) {
  if (score >= 80) return "Critical";
  if (score >= 50) return "High";
  return "Low";
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconClass,
}) {
  return (
    <Card className="p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <h3 className="text-3xl font-bold text-slate-900 mt-2">
            {value}
          </h3>

          <p className="text-xs text-slate-400 mt-2">
            {subtitle}
          </p>
        </div>

        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}

function EmptyState({ text }) {
  return (
    <div className="py-12 text-center">
      <div className="text-4xl mb-3">📭</div>

      <p className="text-slate-500">
        {text}
      </p>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [assets, setAssets] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [defects, setDefects] = useState([]);
  const [trains, setTrains] = useState([]);
  const [corridors, setCorridors] = useState([]);
  const [plans, setPlans] = useState([]);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);

  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [corridorFilter, setCorridorFilter] = useState("All");

  const changePage = (newPage) => {
    setPage(newPage);
    setSidebarOpen(false);
  };

  async function fetchData() {
    try {
      setLoading(true);

      const [
        assetsRes,
        tasksRes,
        defectsRes,
        trainsRes,
        corridorsRes,
        plansRes,
      ] = await Promise.all([
        fetch(`${API}/assets`),
        fetch(`${API}/tasks`),
        fetch(`${API}/defects`),
        fetch(`${API}/trains`),
        fetch(`${API}/corridors`),
        fetch(`${API}/block-plans`),
      ]);

      if (
        !assetsRes.ok ||
        !tasksRes.ok ||
        !defectsRes.ok ||
        !trainsRes.ok ||
        !corridorsRes.ok ||
        !plansRes.ok
      ) {
        throw new Error("Backend API error");
      }

      setAssets(await assetsRes.json());
      setTasks(await tasksRes.json());
      setDefects(await defectsRes.json());
      setTrains(await trainsRes.json());
      setCorridors(await corridorsRes.json());
      setPlans(await plansRes.json());

      setBackendOnline(true);
    } catch (error) {
      console.error(
        "Backend connection error:",
        error
      );

      setBackendOnline(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  // =========================================================
  // AI BLOCK PLAN GENERATION
  // =========================================================

  async function generateBlockPlan() {
    if (generating) return;

    try {
      setGenerating(true);

      const response = await fetch(
        `${API}/ai/planning/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      console.log(
        "AI Planning Response:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            "AI planning failed"
        );
      }

      await fetchData();

      if (
        data?.message ===
        "No pending maintenance tasks found"
      ) {
        alert(
          "No Pending Maintenance Tasks\n\n" +
            "All available maintenance tasks have already been planned."
        );

        return;
      }

      if (data?.summary) {
        const summary = data.summary;

        const totalTasks =
          Number(summary.total_tasks || 0);

        const optimizedPlans =
          Number(summary.optimized_plans || 0);

        const conflictsDetected =
          Number(
            summary.conflicts_detected || 0
          );

        const safePlans =
          Number(
            summary.final_safe_plans || 0
          );

        const savedPlans =
          Number(
            summary.plans_saved_to_database || 0
          );

        if (savedPlans > 0) {
          alert(
            "AI Block Plan Generated Successfully!\n\n" +
              `Tasks Processed: ${totalTasks}\n` +
              `Optimized Plans: ${optimizedPlans}\n` +
              `Conflicts Detected: ${conflictsDetected}\n` +
              `Safe Plans: ${safePlans}\n` +
              `Plans Saved: ${savedPlans}`
          );
        } else if (conflictsDetected > 0) {
          alert(
            "Planning Completed With Conflicts\n\n" +
              `Tasks Processed: ${totalTasks}\n` +
              `Conflicts Detected: ${conflictsDetected}\n` +
              `Safe Plans: ${safePlans}\n` +
              `Plans Saved: ${savedPlans}`
          );
        } else {
          alert(
            "AI Planning Completed\n\n" +
              `Tasks Processed: ${totalTasks}\n` +
              `Optimized Plans: ${optimizedPlans}\n` +
              `Plans Saved: ${savedPlans}`
          );
        }

        return;
      }

      alert(
        data?.message ||
          "AI planning process completed successfully."
      );
    } catch (error) {
      console.error(
        "AI Planning Error:",
        error
      );

      alert(
        "Unable to generate block plan.\n\n" +
          `${error.message}\n\n` +
          "Please check whether the backend is running."
      );
    } finally {
      setGenerating(false);
    }
  }

  // =========================================================
  // DASHBOARD DATA
  // =========================================================

  const pendingTasks = tasks.filter(
    (task) =>
      String(task.status || "").toUpperCase() ===
      "PENDING"
  );

  const openDefects = defects.filter(
    (defect) =>
      String(defect.status || "").toUpperCase() ===
      "OPEN"
  );

  const availableCorridors = corridors.filter(
    (corridor) =>
      String(corridor.status || "").toUpperCase() ===
      "AVAILABLE"
  );

  const departments = [
    "All",
    ...new Set(
      plans
        .map((plan) => {
          const task = tasks.find(
            (t) =>
              t.task_code === plan.task_code
          );

          return task?.department;
        })
        .filter(Boolean)
    ),
  ];

  const corridorOptions = [
    "All",
    ...new Set(
      plans
        .map((plan) => plan.corridor)
        .filter(Boolean)
    ),
  ];

  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      const task = tasks.find(
        (t) =>
          t.task_code === plan.task_code
      );

      const departmentMatch =
        departmentFilter === "All" ||
        task?.department ===
          departmentFilter;

      const corridorMatch =
        corridorFilter === "All" ||
        plan.corridor === corridorFilter;

      return (
        departmentMatch &&
        corridorMatch
      );
    });
  }, [
    plans,
    tasks,
    departmentFilter,
    corridorFilter,
  ]);

  const priorityData = [
    {
      name: "Critical",
      value: plans.filter(
        (p) =>
          Number(p.priority_score || 0) >= 80
      ).length,
    },
    {
      name: "High",
      value: plans.filter(
        (p) =>
          Number(p.priority_score || 0) >= 50 &&
          Number(p.priority_score || 0) < 80
      ).length,
    },
    {
      name: "Low",
      value: plans.filter(
        (p) =>
          Number(p.priority_score || 0) < 50
      ).length,
    },
  ];

  const departmentData = [
    "Engineering",
    "TD",
    "S&T",
  ].map((department) => ({
    department,

    blocks: plans.filter((plan) => {
      const task = tasks.find(
        (t) =>
          t.task_code === plan.task_code
      );

      return (
        task?.department === department
      );
    }).length,
  }));

  const COLORS = [
    "#dc2626",
    "#f59e0b",
    "#3b82f6",
  ];

  const pageTitle = {
    dashboard: "Dashboard",
    assets: "Assets",
    tasks: "Maintenance Tasks",
    defects: "Defects",
    trains: "Train Schedule",
    corridors: "Corridor Availability",
    plans: "Block Plans",
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">

      {/* =====================================================
          SIDEBAR OVERLAY
      ===================================================== */}

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-[2px]"
          onClick={() =>
            setSidebarOpen(false)
          }
        />
      )}

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        className={`fixed left-0 top-0 bottom-0 w-72 bg-slate-950 text-white z-50 shadow-2xl transition-transform duration-300 ${
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col">

          {/* LOGO */}

          <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">

            <div>
              <div className="text-lg font-bold tracking-wide">
                SMART RAIL
              </div>

              <div className="text-xs text-slate-400 mt-1">
                Automatic Block Planning
              </div>
            </div>

            <button
              onClick={() =>
                setSidebarOpen(false)
              }
              className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition"
            >
              ✕
            </button>

          </div>

          {/* NAVIGATION */}

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">

            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() =>
                  changePage(item.id)
                }
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition ${
                  page === item.id
                    ? "bg-red-600 text-white shadow-lg shadow-red-900/20"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <span className="w-6 text-center">
                  {item.icon}
                </span>

                <span className="font-medium text-sm">
                  {item.label}
                </span>
              </button>
            ))}

          </nav>

          {/* SIDEBAR STATUS */}

          <div className="p-4 border-t border-slate-800">

            <div className="rounded-xl bg-slate-900 p-4">

              <div className="text-xs text-slate-400">
                SYSTEM STATUS
              </div>

              <div className="flex items-center gap-2 mt-2">

                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    backendOnline
                      ? "bg-emerald-400 animate-pulse"
                      : "bg-red-400"
                  }`}
                />

                <span className="text-sm font-medium">
                  {backendOnline
                    ? "Backend Online"
                    : "Backend Offline"}
                </span>

              </div>

            </div>

          </div>

        </div>
      </aside>

      {/* =====================================================
          TOP BAR
      ===================================================== */}

      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">

        <div className="px-5 md:px-8 py-4 flex items-center justify-between">

          <div className="flex items-center gap-4">

            <button
              onClick={() =>
                setSidebarOpen(true)
              }
              className="w-11 h-11 bg-slate-950 text-white rounded-xl flex items-center justify-center text-xl hover:bg-red-600 transition shadow-sm"
            >
              ☰
            </button>

            <div>

              <h1 className="text-xl md:text-2xl font-bold">
                {pageTitle[page]}
              </h1>

              <p className="text-xs md:text-sm text-slate-500">
                Railway Operations Control System
              </p>

            </div>

          </div>

          <div className="flex items-center gap-3">

            <button
              onClick={fetchData}
              className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-medium"
            >
              ↻ Refresh
            </button>

            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200">

              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  backendOnline
                    ? "bg-emerald-500 animate-pulse"
                    : "bg-red-500"
                }`}
              />

              <span className="hidden sm:block text-xs font-semibold">
                {backendOnline
                  ? "Operational"
                  : "Offline"}
              </span>

            </div>

          </div>

        </div>

      </header>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="p-5 md:p-8 max-w-[1600px] mx-auto">

        {/* ===================================================
            DASHBOARD
        =================================================== */}

        {page === "dashboard" && (
          <>

            {/* =================================================
                HERO
            ================================================= */}

            <section className="relative rounded-3xl overflow-hidden mb-6 min-h-[390px] bg-slate-950 text-white shadow-2xl">

              {/* Railway Background */}

              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage:
                    "url('https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=1800&q=85')",
                }}
              />

              {/* Dark Overlay */}

              <div className="absolute inset-0 bg-slate-950/75" />

              {/* Red Glow */}

              <div className="absolute -right-20 -top-20 w-80 h-80 bg-red-600/20 rounded-full blur-3xl" />

              {/* Green Glow */}

              <div className="absolute right-20 bottom-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />

              {/* Hero Content */}

              <div className="relative z-10 p-7 md:p-10 min-h-[390px] flex flex-col justify-between">

                {/* Top Status */}

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                  <div className="inline-flex items-center gap-2 w-fit px-4 py-2 rounded-full bg-black/30 border border-white/20 backdrop-blur-md">

                    <span className="relative flex h-3 w-3">

                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />

                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400" />

                    </span>

                    <span className="text-xs font-bold tracking-widest">
                      SYSTEM OPERATIONAL
                    </span>

                  </div>

                  <div className="hidden md:flex items-center gap-2 text-xs text-slate-300 bg-black/30 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">

                    <span className="text-red-400">
                      ●
                    </span>

                    AI PLANNING ENGINE

                    <span className="text-emerald-400">
                      ACTIVE
                    </span>

                  </div>

                </div>

                {/* Main Hero Content */}

                <div className="mt-10 max-w-4xl">

                  <div className="flex items-center gap-3 mb-4">

                    <div className="h-px w-10 bg-red-500" />

                    <span className="text-red-400 text-xs md:text-sm font-bold tracking-[0.25em]">
                      SMART RAIL · OPERATIONS CONTROL
                    </span>

                  </div>

                  <h2 className="text-3xl md:text-5xl font-black leading-tight tracking-tight">

                    AI-Powered Railway

                    <span className="block text-red-400">
                      Maintenance Intelligence
                    </span>

                  </h2>

                  <p className="text-slate-300 max-w-2xl mt-5 text-sm md:text-base leading-relaxed">
                    Smart Rail analyzes maintenance
                    priorities, corridor availability
                    and train movement conflicts to
                    identify optimized maintenance
                    block windows with minimal
                    operational disruption.
                  </p>

                  {/* AI FLOW */}

                  <div className="flex flex-wrap items-center gap-2 mt-6">

                    <div className="px-3 py-2 rounded-lg bg-white/10 border border-white/10 backdrop-blur-md text-xs">
                      Maintenance
                    </div>

                    <span className="text-red-400">
                      →
                    </span>

                    <div className="px-3 py-2 rounded-lg bg-white/10 border border-white/10 backdrop-blur-md text-xs">
                      Priority AI
                    </div>

                    <span className="text-red-400">
                      →
                    </span>

                    <div className="px-3 py-2 rounded-lg bg-white/10 border border-white/10 backdrop-blur-md text-xs">
                      Corridor
                    </div>

                    <span className="text-red-400">
                      →
                    </span>

                    <div className="px-3 py-2 rounded-lg bg-white/10 border border-white/10 backdrop-blur-md text-xs">
                      Train Conflict
                    </div>

                    <span className="text-red-400">
                      →
                    </span>

                    <div className="px-3 py-2 rounded-lg bg-emerald-500/20 border border-emerald-400/20 text-emerald-300 text-xs">
                      Optimal Block
                    </div>

                  </div>

                </div>

                {/* Bottom Controls */}

                <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-4">

                  <button
                    onClick={generateBlockPlan}
                    disabled={
                      generating ||
                      !backendOnline
                    }
                    className="w-fit px-6 py-3.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:bg-slate-700 disabled:cursor-not-allowed font-bold shadow-lg shadow-red-900/30 transition-all duration-300 hover:scale-[1.02]"
                  >
                    {generating
                      ? "⚙ AI Processing..."
                      : "⚡ Generate AI Block Plan"}
                  </button>

                  <div className="flex items-center gap-3 text-xs text-slate-300">

                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />

                    Real-time planning system connected

                  </div>

                </div>

              </div>

            </section>

            {/* =================================================
                KPI CARDS
            ================================================= */}

            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">

              <StatCard
                title="Total Assets"
                value={assets.length}
                subtitle="Registered infrastructure assets"
                icon="◈"
                iconClass="bg-blue-50 text-blue-600"
              />

              <StatCard
                title="Planned Blocks"
                value={plans.length}
                subtitle="Generated maintenance plans"
                icon="◆"
                iconClass="bg-violet-50 text-violet-600"
              />

              <StatCard
                title="Pending Tasks"
                value={pendingTasks.length}
                subtitle="Tasks awaiting planning"
                icon="✓"
                iconClass="bg-amber-50 text-amber-600"
              />

              <StatCard
                title="Open Defects"
                value={openDefects.length}
                subtitle="Active infrastructure defects"
                icon="⚠"
                iconClass="bg-red-50 text-red-600"
              />

              <StatCard
                title="Available Corridors"
                value={availableCorridors.length}
                subtitle="Corridors ready for allocation"
                icon="↔"
                iconClass="bg-emerald-50 text-emerald-600"
              />

            </section>

            {/* =================================================
                CHARTS
            ================================================= */}

            <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">

              {/* PRIORITY CHART */}

              <Card className="p-5 hover:shadow-md transition">

                <div className="flex items-center justify-between mb-5">

                  <div>

                    <h3 className="font-bold text-lg">
                      Priority Distribution
                    </h3>

                    <p className="text-sm text-slate-500">
                      Generated block plan priority
                    </p>

                  </div>

                  <span className="text-xs px-3 py-1.5 bg-slate-100 rounded-full font-medium">
                    Live
                  </span>

                </div>

                <div className="h-72">

                  {plans.length === 0 ? (
                    <EmptyState text="No block plan data available" />
                  ) : (
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >

                      <PieChart>

                        <Pie
                          data={priorityData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={100}
                          paddingAngle={4}
                        >

                          {priorityData.map(
                            (entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={
                                  COLORS[index]
                                }
                              />
                            )
                          )}

                        </Pie>

                        <Tooltip />

                        <Legend
                          verticalAlign="bottom"
                          iconType="circle"
                        />

                      </PieChart>

                    </ResponsiveContainer>
                  )}

                </div>

              </Card>

              {/* DEPARTMENT CHART */}

              <Card className="p-5 hover:shadow-md transition">

                <div className="mb-5">

                  <h3 className="font-bold text-lg">
                    Department-wise Blocks
                  </h3>

                  <p className="text-sm text-slate-500">
                    Distribution across railway departments
                  </p>

                </div>

                <div className="h-72">

                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >

                    <BarChart
                      data={departmentData}
                    >

                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="department"
                      />

                      <YAxis
                        allowDecimals={false}
                      />

                      <Tooltip />

                      <Bar
                        dataKey="blocks"
                        name="Block Plans"
                        radius={[
                          8,
                          8,
                          0,
                          0,
                        ]}
                        fill="#dc2626"
                      />

                    </BarChart>

                  </ResponsiveContainer>

                </div>

              </Card>

            </section>

            {/* =================================================
                FILTERS
            ================================================= */}

            <Card className="p-5 mb-6">

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                <div>

                  <h3 className="font-bold text-lg">
                    Active Block Plans
                  </h3>

                  <p className="text-sm text-slate-500 mt-1">
                    Filter and inspect generated
                    maintenance blocks
                  </p>

                </div>

                <div className="flex flex-col sm:flex-row gap-3">

                  <select
                    value={departmentFilter}
                    onChange={(e) =>
                      setDepartmentFilter(
                        e.target.value
                      )
                    }
                    className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-red-500"
                  >

                    {departments.map(
                      (department) => (
                        <option
                          key={department}
                          value={department}
                        >
                          {department}
                        </option>
                      )
                    )}

                  </select>

                  <select
                    value={corridorFilter}
                    onChange={(e) =>
                      setCorridorFilter(
                        e.target.value
                      )
                    }
                    className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-red-500"
                  >

                    {corridorOptions.map(
                      (corridor) => (
                        <option
                          key={corridor}
                          value={corridor}
                        >
                          {corridor}
                        </option>
                      )
                    )}

                  </select>

                </div>

              </div>

            </Card>

            {/* =================================================
                ACTIVE PLANS TABLE
            ================================================= */}

            <Card className="overflow-hidden mb-6">

              <div className="overflow-x-auto">

                <table className="w-full text-sm">

                  <thead className="bg-slate-50 border-b border-slate-200">

                    <tr>

                      <th className="text-left px-5 py-4 font-semibold text-slate-600">
                        Task
                      </th>

                      <th className="text-left px-5 py-4 font-semibold text-slate-600">
                        Department
                      </th>

                      <th className="text-left px-5 py-4 font-semibold text-slate-600">
                        Corridor
                      </th>

                      <th className="text-left px-5 py-4 font-semibold text-slate-600">
                        Date
                      </th>

                      <th className="text-left px-5 py-4 font-semibold text-slate-600">
                        Time
                      </th>

                      <th className="text-left px-5 py-4 font-semibold text-slate-600">
                        Priority
                      </th>

                      <th className="text-left px-5 py-4 font-semibold text-slate-600">
                        Status
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {loading ? (
                      <tr>

                        <td
                          colSpan="7"
                          className="text-center py-12 text-slate-500"
                        >
                          Loading railway planning data...
                        </td>

                      </tr>
                    ) : filteredPlans.length === 0 ? (
                      <tr>

                        <td colSpan="7">

                          <EmptyState
                            text="No block plans match the selected filters"
                          />

                        </td>

                      </tr>
                    ) : (
                      filteredPlans.map(
                        (plan) => {

                          const task =
                            tasks.find(
                              (t) =>
                                t.task_code ===
                                plan.task_code
                            );

                          const score =
                            Number(
                              plan.priority_score ||
                                0
                            );

                          return (
                            <tr
                              key={plan.id}
                              className="border-b border-slate-100 hover:bg-slate-50 transition"
                            >

                              <td className="px-5 py-4">

                                <div className="font-semibold text-slate-900">
                                  {plan.task_code}
                                </div>

                                <div className="text-xs text-slate-400">
                                  Plan #{plan.id}
                                </div>

                              </td>

                              <td className="px-5 py-4">
                                {task?.department ||
                                  "—"}
                              </td>

                              <td className="px-5 py-4 font-medium">
                                {plan.corridor}
                              </td>

                              <td className="px-5 py-4">
                                {plan.planned_date}
                              </td>

                              <td className="px-5 py-4">
                                {plan.start_time} –{" "}
                                {plan.end_time}
                              </td>

                              <td className="px-5 py-4">

                                <div className="flex items-center gap-2">

                                  <StatusBadge
                                    type={getPriorityType(
                                      score
                                    )}
                                  >
                                    {getPriorityLabel(
                                      score
                                    )}
                                  </StatusBadge>

                                  <span className="font-bold">
                                    {score}
                                  </span>

                                </div>

                              </td>

                              <td className="px-5 py-4">

                                <StatusBadge type="success">
                                  {plan.status ||
                                    "PLANNED"}
                                </StatusBadge>

                              </td>

                            </tr>
                          );
                        }
                      )
                    )}

                  </tbody>

                </table>

              </div>

            </Card>

            {/* =================================================
                AI PIPELINE
            ================================================= */}

            <Card className="p-6">

              <div className="mb-6">

                <div className="flex items-center gap-3">

                  <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                    🤖
                  </div>

                  <div>

                    <h3 className="text-lg font-bold">
                      AI Planning Engine
                    </h3>

                    <p className="text-sm text-slate-500 mt-1">
                      Intelligent maintenance block generation workflow
                    </p>

                  </div>

                </div>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">

                {[
                  [
                    "01",
                    "Priority",
                    "Assess urgency & criticality",
                  ],
                  [
                    "02",
                    "Availability",
                    "Find suitable corridor",
                  ],
                  [
                    "03",
                    "Conflict Check",
                    "Check train movement",
                  ],
                  [
                    "04",
                    "Optimization",
                    "Select feasible slot",
                  ],
                  [
                    "05",
                    "Block Plan",
                    "Generate final plan",
                  ],
                ].map(
                  (
                    [number, title, text],
                    index
                  ) => (
                    <div
                      key={number}
                      className="relative"
                    >

                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 h-full hover:border-red-200 hover:bg-red-50/30 transition">

                        <div className="text-xs font-bold text-red-600 mb-3">
                          {number}
                        </div>

                        <h4 className="font-bold">
                          {title}
                        </h4>

                        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                          {text}
                        </p>

                      </div>

                      {index < 4 && (
                        <div className="hidden md:block absolute top-1/2 -right-2 text-red-300 font-bold">
                          →
                        </div>
                      )}

                    </div>
                  )
                )}

              </div>

            </Card>

          </>
        )}

        {/* =====================================================
            ASSETS
        ===================================================== */}

        {page === "assets" && (
          <Card className="overflow-hidden">

            <div className="p-6 border-b border-slate-200">

              <h2 className="text-xl font-bold">
                Railway Assets
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Registered infrastructure assets
              </p>

            </div>

            <div className="overflow-x-auto">

              <table className="w-full text-sm">

                <thead className="bg-slate-50">

                  <tr>

                    <th className="text-left px-5 py-4">
                      Asset Code
                    </th>

                    <th className="text-left px-5 py-4">
                      Type
                    </th>

                    <th className="text-left px-5 py-4">
                      Department
                    </th>

                    <th className="text-left px-5 py-4">
                      Location
                    </th>

                    <th className="text-left px-5 py-4">
                      Criticality
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {assets.map(
                    (asset) => (
                      <tr
                        key={asset.id}
                        className="border-t border-slate-100"
                      >

                        <td className="px-5 py-4 font-semibold">
                          {asset.asset_code}
                        </td>

                        <td className="px-5 py-4">
                          {asset.asset_type}
                        </td>

                        <td className="px-5 py-4">
                          {asset.department}
                        </td>

                        <td className="px-5 py-4">
                          {asset.location}
                        </td>

                        <td className="px-5 py-4">

                          <StatusBadge type="warning">
                            {asset.criticality}
                          </StatusBadge>

                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

              {assets.length === 0 && (
                <EmptyState text="No assets available" />
              )}

            </div>

          </Card>
        )}

        {/* =====================================================
            TASKS
        ===================================================== */}

        {page === "tasks" && (
          <Card className="overflow-hidden">

            <div className="p-6 border-b border-slate-200">

              <h2 className="text-xl font-bold">
                Maintenance Tasks
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Maintenance workload requiring planning
              </p>

            </div>

            <div className="overflow-x-auto">

              <table className="w-full text-sm">

                <thead className="bg-slate-50">

                  <tr>

                    <th className="text-left px-5 py-4">
                      Task
                    </th>

                    <th className="text-left px-5 py-4">
                      Asset
                    </th>

                    <th className="text-left px-5 py-4">
                      Department
                    </th>

                    <th className="text-left px-5 py-4">
                      Urgency
                    </th>

                    <th className="text-left px-5 py-4">
                      Criticality
                    </th>

                    <th className="text-left px-5 py-4">
                      Duration
                    </th>

                    <th className="text-left px-5 py-4">
                      Status
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {tasks.map(
                    (task) => (
                      <tr
                        key={task.id}
                        className="border-t border-slate-100"
                      >

                        <td className="px-5 py-4 font-semibold">
                          {task.task_code}
                        </td>

                        <td className="px-5 py-4">
                          {task.asset_code}
                        </td>

                        <td className="px-5 py-4">
                          {task.department}
                        </td>

                        <td className="px-5 py-4">
                          {task.urgency}
                        </td>

                        <td className="px-5 py-4">
                          {task.criticality}
                        </td>

                        <td className="px-5 py-4">
                          {task.duration_minutes} min
                        </td>

                        <td className="px-5 py-4">

                          <StatusBadge
                            type={
                              String(
                                task.status
                              ).toUpperCase() ===
                              "PENDING"
                                ? "warning"
                                : "success"
                            }
                          >
                            {task.status}
                          </StatusBadge>

                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

              {tasks.length === 0 && (
                <EmptyState text="No maintenance tasks available" />
              )}

            </div>

          </Card>
        )}

        {/* =====================================================
            DEFECTS
        ===================================================== */}

        {page === "defects" && (
          <Card className="overflow-hidden">

            <div className="p-6 border-b border-slate-200">

              <h2 className="text-xl font-bold">
                Infrastructure Defects
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Open and historical asset defects
              </p>

            </div>

            <div className="overflow-x-auto">

              <table className="w-full text-sm">

                <thead className="bg-slate-50">

                  <tr>

                    <th className="text-left px-5 py-4">
                      Defect
                    </th>

                    <th className="text-left px-5 py-4">
                      Asset
                    </th>

                    <th className="text-left px-5 py-4">
                      Department
                    </th>

                    <th className="text-left px-5 py-4">
                      Severity
                    </th>

                    <th className="text-left px-5 py-4">
                      Description
                    </th>

                    <th className="text-left px-5 py-4">
                      Status
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {defects.map(
                    (defect) => (
                      <tr
                        key={defect.id}
                        className="border-t border-slate-100"
                      >

                        <td className="px-5 py-4 font-semibold">
                          {defect.defect_code}
                        </td>

                        <td className="px-5 py-4">
                          {defect.asset_code}
                        </td>

                        <td className="px-5 py-4">
                          {defect.department}
                        </td>

                        <td className="px-5 py-4">

                          <StatusBadge
                            type={
                              Number(
                                defect.severity
                              ) >= 8
                                ? "danger"
                                : "warning"
                            }
                          >
                            {defect.severity}/10
                          </StatusBadge>

                        </td>

                        <td className="px-5 py-4 max-w-xs">
                          {defect.description}
                        </td>

                        <td className="px-5 py-4">

                          <StatusBadge
                            type={
                              String(
                                defect.status
                              ).toUpperCase() ===
                              "OPEN"
                                ? "danger"
                                : "success"
                            }
                          >
                            {defect.status}
                          </StatusBadge>

                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

              {defects.length === 0 && (
                <EmptyState text="No defects available" />
              )}

            </div>

          </Card>
        )}

        {/* =====================================================
            TRAINS
        ===================================================== */}

        {page === "trains" && (
          <Card className="overflow-hidden">

            <div className="p-6 border-b border-slate-200">

              <h2 className="text-xl font-bold">
                Train Schedule
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Train movement data used for conflict detection
              </p>

            </div>

            <div className="overflow-x-auto">

              <table className="w-full text-sm">

                <thead className="bg-slate-50">

                  <tr>

                    <th className="text-left px-5 py-4">
                      Train
                    </th>

                    <th className="text-left px-5 py-4">
                      Name
                    </th>

                    <th className="text-left px-5 py-4">
                      Corridor
                    </th>

                    <th className="text-left px-5 py-4">
                      Type
                    </th>

                    <th className="text-left px-5 py-4">
                      Date
                    </th>

                    <th className="text-left px-5 py-4">
                      Arrival
                    </th>

                    <th className="text-left px-5 py-4">
                      Departure
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {trains.map(
                    (train) => (
                      <tr
                        key={train.id}
                        className="border-t border-slate-100"
                      >

                        <td className="px-5 py-4 font-semibold">
                          {train.train_number}
                        </td>

                        <td className="px-5 py-4">
                          {train.train_name}
                        </td>

                        <td className="px-5 py-4">
                          {train.corridor}
                        </td>

                        <td className="px-5 py-4">
                          {train.train_type}
                        </td>

                        <td className="px-5 py-4">
                          {train.journey_date}
                        </td>

                        <td className="px-5 py-4">
                          {train.arrival_time}
                        </td>

                        <td className="px-5 py-4">
                          {train.departure_time}
                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

              {trains.length === 0 && (
                <EmptyState text="No train schedule available" />
              )}

            </div>

          </Card>
        )}

        {/* =====================================================
            CORRIDORS
        ===================================================== */}

        {page === "corridors" && (
          <Card className="overflow-hidden">

            <div className="p-6 border-b border-slate-200">

              <h2 className="text-xl font-bold">
                Corridor Availability
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Available maintenance windows
              </p>

            </div>

            <div className="overflow-x-auto">

              <table className="w-full text-sm">

                <thead className="bg-slate-50">

                  <tr>

                    <th className="text-left px-5 py-4">
                      Corridor
                    </th>

                    <th className="text-left px-5 py-4">
                      Department
                    </th>

                    <th className="text-left px-5 py-4">
                      Date
                    </th>

                    <th className="text-left px-5 py-4">
                      Window
                    </th>

                    <th className="text-left px-5 py-4">
                      Available
                    </th>

                    <th className="text-left px-5 py-4">
                      Status
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {corridors.map(
                    (corridor) => (
                      <tr
                        key={corridor.id}
                        className="border-t border-slate-100"
                      >

                        <td className="px-5 py-4 font-semibold">
                          {corridor.corridor}
                        </td>

                        <td className="px-5 py-4">
                          {corridor.department}
                        </td>

                        <td className="px-5 py-4">
                          {corridor.available_date}
                        </td>

                        <td className="px-5 py-4">
                          {corridor.start_time} –{" "}
                          {corridor.end_time}
                        </td>

                        <td className="px-5 py-4">
                          {corridor.available_minutes} min
                        </td>

                        <td className="px-5 py-4">

                          <StatusBadge
                            type={
                              String(
                                corridor.status
                              ).toUpperCase() ===
                              "AVAILABLE"
                                ? "success"
                                : "warning"
                            }
                          >
                            {corridor.status}
                          </StatusBadge>

                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

              {corridors.length === 0 && (
                <EmptyState text="No corridor availability data" />
              )}

            </div>

          </Card>
        )}

        {/* =====================================================
            PLANS
        ===================================================== */}

        {page === "plans" && (
          <Card className="overflow-hidden">

            <div className="p-6 border-b border-slate-200">

              <h2 className="text-xl font-bold">
                Generated Block Plans
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Maintenance plans generated by the planning engine
              </p>

            </div>

            <div className="overflow-x-auto">

              <table className="w-full text-sm">

                <thead className="bg-slate-50">

                  <tr>

                    <th className="text-left px-5 py-4">
                      Plan
                    </th>

                    <th className="text-left px-5 py-4">
                      Task
                    </th>

                    <th className="text-left px-5 py-4">
                      Corridor
                    </th>

                    <th className="text-left px-5 py-4">
                      Date
                    </th>

                    <th className="text-left px-5 py-4">
                      Time
                    </th>

                    <th className="text-left px-5 py-4">
                      Priority
                    </th>

                    <th className="text-left px-5 py-4">
                      Status
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {plans.map(
                    (plan) => {

                      const score =
                        Number(
                          plan.priority_score ||
                            0
                        );

                      return (
                        <tr
                          key={plan.id}
                          className="border-t border-slate-100"
                        >

                          <td className="px-5 py-4 font-semibold">
                            #{plan.id}
                          </td>

                          <td className="px-5 py-4">
                            {plan.task_code}
                          </td>

                          <td className="px-5 py-4">
                            {plan.corridor}
                          </td>

                          <td className="px-5 py-4">
                            {plan.planned_date}
                          </td>

                          <td className="px-5 py-4">
                            {plan.start_time} –{" "}
                            {plan.end_time}
                          </td>

                          <td className="px-5 py-4">

                            <StatusBadge
                              type={getPriorityType(
                                score
                              )}
                            >
                              {score} ·{" "}
                              {getPriorityLabel(
                                score
                              )}
                            </StatusBadge>

                          </td>

                          <td className="px-5 py-4">

                            <StatusBadge type="success">
                              {plan.status}
                            </StatusBadge>

                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

              {plans.length === 0 && (
                <EmptyState text="No generated block plans" />
              )}

            </div>

          </Card>
        )}

      </main>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="px-5 md:px-8 py-6 text-center text-xs text-slate-400">

        Smart Rail Automatic Block Planning System
        · Railway Operations Control

      </footer>

    </div>
  );
}