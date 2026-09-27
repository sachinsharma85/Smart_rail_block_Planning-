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

                     <span
                        className={`absolute inline-flex h-full w-full rounded-full ${
                        backendOnline
                        ? "animate-ping bg-emerald-400 opacity-75"
                        : "bg-red-400"
                    }`}
                  />

                 <span
                 className={`relative inline-flex rounded-full h-3 w-3 ${
                 backendOnline
                 ? "bg-emerald-400"
                 : "bg-red-400"
                 }`}
                />
                    </span>

                    <span className="text-xs font-bold tracking-widest">
                      {backendOnline
                        ? "SYSTEM OPERATIONAL"
                        : "SYSTEM OFFLINE"}
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

                    <span
                      className={`w-2 h-2 rounded-full ${
                      backendOnline
                      ? "bg-emerald-400 animate-pulse"
                      : "bg-red-400"
                    }`}
                   />

                     {backendOnline
                      ? "Real-time planning system connected"
                      : "Backend connection unavailable"}
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
             ASSETS — RAILWAY ASSET CONTROL CENTER
        ===================================================== */}

{page === "assets" && (
  <div className="space-y-6">

    {/* PAGE HEADER */}
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-red-950 text-white shadow-xl">

      <div className="absolute inset-0 opacity-20">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="relative p-7 md:p-9">

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

          <div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-xs font-semibold text-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              RAILWAY ASSET CONTROL
            </div>

            <h2 className="text-2xl md:text-4xl font-bold mt-4">
              Railway Infrastructure
            </h2>

            <p className="text-slate-300 mt-2 max-w-2xl text-sm md:text-base">
              Monitor railway infrastructure assets, criticality and
              department ownership for intelligent maintenance planning.
            </p>

          </div>

          <button
            onClick={fetchData}
            className="self-start lg:self-auto inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-slate-900 font-semibold hover:bg-slate-100 transition shadow-lg"
          >
            ↻ Refresh Assets
          </button>

        </div>

        {/* RAILWAY TRACK VISUAL */}
        <div className="mt-8 relative h-16 overflow-hidden rounded-2xl bg-black/20 border border-white/10">

          <div className="absolute left-0 right-0 top-5 h-1 bg-slate-500/70" />
          <div className="absolute left-0 right-0 bottom-5 h-1 bg-slate-500/70" />

          <div className="absolute left-0 right-0 top-0 bottom-0 flex items-center justify-around opacity-30">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((item) => (
              <div
                key={item}
                className="h-16 w-1 bg-slate-300"
              />
            ))}
          </div>

          <div
            className="absolute text-3xl"
            style={{
              animation: "assetTrainMove 12s linear infinite",
            }}
          >
            🚆
          </div>

        </div>

      </div>
    </div>


    {/* KPI CARDS */}

    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">

        <div className="flex items-center justify-between">

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Assets
            </p>

            <p className="text-3xl font-bold text-slate-900 mt-2">
              {assets.length}
            </p>
          </div>

          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl">
            🏗️
          </div>

        </div>

        <p className="text-xs text-slate-500 mt-3">
          Registered infrastructure
        </p>

      </div>


      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">

        <div className="flex items-center justify-between">

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              High Criticality
            </p>

            <p className="text-3xl font-bold text-red-600 mt-2">
              {
                assets.filter(
                  (asset) =>
                    String(asset.criticality).toLowerCase() === "high"
                ).length
              }
            </p>
          </div>

          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-2xl">
            🚨
          </div>

        </div>

        <p className="text-xs text-slate-500 mt-3">
          Requires priority attention
        </p>

      </div>


      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">

        <div className="flex items-center justify-between">

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Departments
            </p>

            <p className="text-3xl font-bold text-slate-900 mt-2">
              {
                new Set(
                  assets.map(
                    (asset) => asset.department
                  )
                ).size
              }
            </p>
          </div>

          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-2xl">
            🏢
          </div>

        </div>

        <p className="text-xs text-slate-500 mt-3">
          Responsible departments
        </p>

      </div>


      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">

        <div className="flex items-center justify-between">

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Network Status
            </p>

            <p className="text-2xl font-bold text-emerald-600 mt-2">
              OPERATIONAL
            </p>
          </div>

          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-2xl">
            🟢
          </div>

        </div>

        <p className="text-xs text-slate-500 mt-3">
          Asset monitoring active
        </p>

      </div>

    </div>


    {/* INFRASTRUCTURE OVERVIEW */}

    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

      {/* VISUAL CARD */}

      <div className="xl:col-span-2 relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white p-6 shadow-lg">

        <div className="absolute right-0 top-0 text-[130px] opacity-10">
          🚆
        </div>

        <div className="relative">

          <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
            Infrastructure Monitoring
          </p>

          <h3 className="text-2xl font-bold mt-2">
            Connected Railway Assets
          </h3>

          <p className="text-slate-400 text-sm mt-2 max-w-xl">
            Smart Rail continuously tracks infrastructure assets that
            may require inspection, maintenance or repair.
          </p>


          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-7">

            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <p className="text-2xl">🚦</p>
              <p className="font-semibold mt-2">Signals</p>
              <p className="text-xs text-slate-400">
                Signalling assets
              </p>
            </div>

            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <p className="text-2xl">🛤️</p>
              <p className="font-semibold mt-2">Track</p>
              <p className="text-xs text-slate-400">
                Track infrastructure
              </p>
            </div>

            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <p className="text-2xl">⚡</p>
              <p className="font-semibold mt-2">Traction</p>
              <p className="text-xs text-slate-400">
                Electrical assets
              </p>
            </div>

            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <p className="text-2xl">📡</p>
              <p className="font-semibold mt-2">S&T</p>
              <p className="text-xs text-slate-400">
                Communication
              </p>
            </div>

          </div>

        </div>

      </div>


      {/* DEPARTMENT DISTRIBUTION */}

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">

        <div className="flex items-center justify-between">

          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
              Department Distribution
            </p>

            <h3 className="text-lg font-bold text-slate-900 mt-1">
              Asset Ownership
            </h3>
          </div>

          <span className="text-2xl">
            🏢
          </span>

        </div>


        <div className="mt-6 space-y-5">

          {
            Array.from(
              new Set(
                assets.map(
                  (asset) => asset.department
                )
              )
            ).map((department) => {

              const count = assets.filter(
                (asset) =>
                  asset.department === department
              ).length;

              const percentage =
                assets.length > 0
                  ? Math.round(
                      (count / assets.length) * 100
                    )
                  : 0;

              return (
                <div key={department}>

                  <div className="flex justify-between text-sm mb-2">

                    <span className="font-medium text-slate-700">
                      {department}
                    </span>

                    <span className="font-semibold text-slate-900">
                      {count}
                    </span>

                  </div>

                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">

                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-700"
                      style={{
                        width: `${percentage}%`,
                      }}
                    />

                  </div>

                  <p className="text-xs text-slate-400 mt-1">
                    {percentage}% of registered assets
                  </p>

                </div>
              );
            })
          }

          {assets.length === 0 && (
            <p className="text-sm text-slate-400">
              No department data available.
            </p>
          )}

        </div>

      </div>

    </div>


    {/* ASSET TABLE */}

    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

      <div className="p-6 border-b border-slate-200">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <div>

            <div className="flex items-center gap-3">

              <h3 className="text-xl font-bold text-slate-900">
                Registered Assets
              </h3>

              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                {assets.length} assets
              </span>

            </div>

            <p className="text-sm text-slate-500 mt-1">
              Railway infrastructure currently monitored by Smart Rail
            </p>

          </div>

          <div className="flex items-center gap-2">

            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />

            <span className="text-xs font-semibold text-slate-500">
              LIVE MONITORING
            </span>

          </div>

        </div>

      </div>


      <div className="overflow-x-auto">

        <table className="w-full text-sm">

          <thead className="bg-slate-50 border-b border-slate-200">

            <tr>

              <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-slate-500">
                Asset
              </th>

              <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-slate-500">
                Type
              </th>

              <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-slate-500">
                Department
              </th>

              <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-slate-500">
                Location
              </th>

              <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-slate-500">
                Criticality
              </th>

            </tr>

          </thead>


          <tbody>

            {assets.map((asset) => (

              <tr
                key={asset.id}
                className="border-t border-slate-100 hover:bg-slate-50 transition"
              >

                <td className="px-6 py-5">

                  <div className="flex items-center gap-3">

                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-lg">
                      {
                        String(asset.asset_type)
                          .toLowerCase()
                          .includes("signal")
                          ? "🚦"
                          : "🏗️"
                      }
                    </div>

                    <div>

                      <p className="font-bold text-slate-900">
                        {asset.asset_code}
                      </p>

                      <p className="text-xs text-slate-400">
                        Asset ID #{asset.id}
                      </p>

                    </div>

                  </div>

                </td>


                <td className="px-6 py-5">

                  <span className="font-medium text-slate-700">
                    {asset.asset_type}
                  </span>

                </td>


                <td className="px-6 py-5">

                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold">
                    {asset.department}
                  </span>

                </td>


                <td className="px-6 py-5">

                  <div className="flex items-center gap-2">

                    <span className="text-slate-400">
                      📍
                    </span>

                    <span className="text-slate-700">
                      {asset.location}
                    </span>

                  </div>

                </td>


                <td className="px-6 py-5">

                  <StatusBadge
                    type={
                      String(asset.criticality)
                        .toLowerCase() === "high"
                        ? "danger"
                        : String(asset.criticality)
                            .toLowerCase() === "medium"
                          ? "warning"
                          : "success"
                    }
                  >
                    {asset.criticality}
                  </StatusBadge>

                </td>

              </tr>

            ))}

          </tbody>

        </table>


        {assets.length === 0 && (
          <EmptyState text="No assets available" />
        )}

      </div>

    </div>


    {/* FOOTNOTE */}

    <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-blue-50 border border-blue-100">

      <span className="text-xl">
        💡
      </span>

      <p className="text-sm text-blue-800">
        Asset criticality is used by the Smart Rail planning engine
        to prioritize maintenance activities and select suitable
        railway block windows.
      </p>

    </div>


    {/* LOCAL ANIMATION */}

    <style>{`
      @keyframes assetTrainMove {
        0% {
          left: -60px;
        }

        100% {
          left: calc(100% + 20px);
        }
      }
    `}</style>

  </div>
)}
        {/* =====================================================
    TASKS — RAILWAY MAINTENANCE CONTROL
===================================================== */}

{page === "tasks" && (
  <div className="space-y-6">

    {/* HEADER */}

    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-red-950 text-white shadow-xl">

      <div className="absolute inset-0 opacity-20">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="relative p-7 md:p-9">

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

          <div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-xs font-semibold text-slate-200">

              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />

              MAINTENANCE CONTROL

            </div>

            <h2 className="text-2xl md:text-4xl font-bold mt-4">
              Railway Maintenance Tasks
            </h2>

            <p className="text-slate-300 mt-2 max-w-2xl text-sm md:text-base">
              Monitor maintenance workload, task priority and asset
              criticality before generating optimized railway block plans.
            </p>

          </div>

          <button
            onClick={fetchData}
            className="self-start lg:self-auto inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-slate-900 font-semibold hover:bg-slate-100 transition shadow-lg"
          >
            ↻ Refresh Tasks
          </button>

        </div>


        {/* MAINTENANCE TRACK */}

        <div className="mt-8 relative h-14 overflow-hidden rounded-2xl bg-black/20 border border-white/10">

          <div className="absolute left-0 right-0 top-4 h-1 bg-slate-500/70" />

          <div className="absolute left-0 right-0 bottom-4 h-1 bg-slate-500/70" />

          <div className="absolute inset-0 flex items-center justify-around opacity-30">

            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <div
                key={item}
                className="h-14 w-1 bg-slate-300"
              />
            ))}

          </div>

          <div
            className="absolute text-2xl"
            style={{
              animation: "maintenanceTrainMove 13s linear infinite",
            }}
          >
            🔧
          </div>

        </div>

      </div>

    </div>


    {/* KPI CARDS */}

    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

      {/* TOTAL */}

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">

        <div className="flex items-center justify-between">

          <div>

            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Tasks
            </p>

            <p className="text-3xl font-bold text-slate-900 mt-2">
              {tasks.length}
            </p>

          </div>

          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl">
            🔧
          </div>

        </div>

        <p className="text-xs text-slate-500 mt-3">
          Registered maintenance workload
        </p>

      </div>


      {/* HIGH PRIORITY */}

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">

        <div className="flex items-center justify-between">

          <div>

            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              High Priority
            </p>

            <p className="text-3xl font-bold text-red-600 mt-2">

              {
                tasks.filter(
                  (task) =>
                    Number(task.urgency || 0) >= 8 ||
                    Number(task.criticality || 0) >= 8
                ).length
              }

            </p>

          </div>

          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-2xl">
            🚨
          </div>

        </div>

        <p className="text-xs text-slate-500 mt-3">
          Requires priority attention
        </p>

      </div>


      {/* PENDING */}

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">

        <div className="flex items-center justify-between">

          <div>

            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Pending Tasks
            </p>

            <p className="text-3xl font-bold text-amber-600 mt-2">

              {
                tasks.filter(
                  (task) =>
                    String(task.status).toUpperCase() ===
                    "PENDING"
                ).length
              }

            </p>

          </div>

          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-2xl">
            ⏳
          </div>

        </div>

        <p className="text-xs text-slate-500 mt-3">
          Waiting for planning
        </p>

      </div>


      {/* PLANNED */}

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">

        <div className="flex items-center justify-between">

          <div>

            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Planned Tasks
            </p>

            <p className="text-3xl font-bold text-emerald-600 mt-2">

              {
                tasks.filter(
                  (task) =>
                    String(task.status).toUpperCase() ===
                    "PLANNED"
                ).length
              }

            </p>

          </div>

          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-2xl">
            ✓
          </div>

        </div>

        <p className="text-xs text-slate-500 mt-3">
          Already assigned for planning
        </p>

      </div>

    </div>


    {/* ANALYTICS */}

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* PRIORITY LEVEL */}

      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">

        <div className="flex items-center justify-between">

          <div>

            <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
              Maintenance Priority
            </p>

            <h3 className="text-lg font-bold text-slate-900 mt-1">
              Task Priority Overview
            </h3>

          </div>

          <span className="text-2xl">
            📊
          </span>

        </div>


        <div className="mt-6 space-y-5">

          {[
            {
              label: "Critical",
              min: 9,
              color: "bg-red-600",
              text: "text-red-700",
              bg: "bg-red-50",
            },
            {
              label: "High",
              min: 7,
              color: "bg-orange-500",
              text: "text-orange-700",
              bg: "bg-orange-50",
            },
            {
              label: "Medium",
              min: 4,
              color: "bg-amber-500",
              text: "text-amber-700",
              bg: "bg-amber-50",
            },
            {
              label: "Low",
              min: 0,
              color: "bg-emerald-500",
              text: "text-emerald-700",
              bg: "bg-emerald-50",
            },
          ].map((level) => {

            const count = tasks.filter((task) => {

              const value = Math.max(
                Number(task.urgency || 0),
                Number(task.criticality || 0)
              );

              if (level.label === "Critical") {
                return value >= 9;
              }

              if (level.label === "High") {
                return value >= 7 && value < 9;
              }

              if (level.label === "Medium") {
                return value >= 4 && value < 7;
              }

              return value < 4;

            }).length;

            const percentage =
              tasks.length > 0
                ? Math.round((count / tasks.length) * 100)
                : 0;

            return (
              <div key={level.label}>

                <div className="flex items-center justify-between mb-2">

                  <div className="flex items-center gap-2">

                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${level.bg} ${level.text}`}
                    >
                      {level.label}
                    </span>

                  </div>

                  <span className="text-sm font-bold text-slate-700">
                    {count} tasks
                  </span>

                </div>

                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">

                  <div
                    className={`h-full rounded-full ${level.color} transition-all duration-700`}
                    style={{
                      width: `${percentage}%`,
                    }}
                  />

                </div>

              </div>
            );

          })}

        </div>

      </div>


      {/* WORKLOAD SUMMARY */}

      <div className="bg-slate-950 rounded-2xl p-6 text-white shadow-lg">

        <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
          Workload Summary
        </p>

        <h3 className="text-xl font-bold mt-1">
          Maintenance Effort
        </h3>

        <div className="mt-6">

          <p className="text-4xl font-bold">

            {
              tasks.reduce(
                (total, task) =>
                  total +
                  Number(task.duration_minutes || 0),
                0
              )
            }

            <span className="text-base font-medium text-slate-400 ml-2">
              min
            </span>

          </p>

          <p className="text-sm text-slate-400 mt-1">
            Total estimated maintenance duration
          </p>

        </div>


        <div className="mt-7 space-y-4">

          <div className="flex justify-between items-center">

            <span className="text-sm text-slate-400">
              Average task
            </span>

            <span className="font-semibold">

              {
                tasks.length > 0
                  ? Math.round(
                      tasks.reduce(
                        (total, task) =>
                          total +
                          Number(
                            task.duration_minutes || 0
                          ),
                        0
                      ) / tasks.length
                    )
                  : 0
              }

              min

            </span>

          </div>


          <div className="flex justify-between items-center">

            <span className="text-sm text-slate-400">
              Departments
            </span>

            <span className="font-semibold">

              {
                new Set(
                  tasks.map(
                    (task) => task.department
                  )
                ).size
              }

            </span>

          </div>


          <div className="flex justify-between items-center">

            <span className="text-sm text-slate-400">
              Assets affected
            </span>

            <span className="font-semibold">

              {
                new Set(
                  tasks.map(
                    (task) => task.asset_code
                  )
                ).size
              }

            </span>

          </div>

        </div>

      </div>

    </div>


    {/* TASK TABLE */}

    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

      <div className="p-6 border-b border-slate-200">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <div>

            <div className="flex items-center gap-3">

              <h3 className="text-xl font-bold text-slate-900">
                Maintenance Workload
              </h3>

              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                {tasks.length} tasks
              </span>

            </div>

            <p className="text-sm text-slate-500 mt-1">
              Maintenance activities requiring operational planning
            </p>

          </div>

          <div className="flex items-center gap-2">

            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />

            <span className="text-xs font-semibold text-slate-500">
              LIVE DATA
            </span>

          </div>

        </div>

      </div>


      <div className="overflow-x-auto">

        <table className="w-full text-sm">

          <thead className="bg-slate-50 border-b border-slate-200">

            <tr>

              <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-slate-500">
                Task
              </th>

              <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-slate-500">
                Asset
              </th>

              <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-slate-500">
                Department
              </th>

              <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-slate-500">
                Priority
              </th>

              <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-slate-500">
                Duration
              </th>

              <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-slate-500">
                Status
              </th>

            </tr>

          </thead>


          <tbody>

            {tasks.map((task) => {

              const priorityValue = Math.max(
                Number(task.urgency || 0),
                Number(task.criticality || 0)
              );

              let priorityType = "success";
              let priorityLabel = "LOW";

              if (priorityValue >= 9) {
                priorityType = "danger";
                priorityLabel = "CRITICAL";
              } else if (priorityValue >= 7) {
                priorityType = "danger";
                priorityLabel = "HIGH";
              } else if (priorityValue >= 4) {
                priorityType = "warning";
                priorityLabel = "MEDIUM";
              }

              const statusType =
                String(task.status).toUpperCase() === "PENDING"
                  ? "warning"
                  : "success";

              return (

                <tr
                  key={task.id}
                  className="border-t border-slate-100 hover:bg-slate-50 transition"
                >

                  {/* TASK */}

                  <td className="px-6 py-5">

                    <div className="flex items-center gap-3">

                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-lg">
                        🔧
                      </div>

                      <div>

                        <p className="font-bold text-slate-900">
                          {task.task_code}
                        </p>

                        <p className="text-xs text-slate-400 max-w-xs truncate">
                          {task.description || "Maintenance activity"}
                        </p>

                      </div>

                    </div>

                  </td>


                  {/* ASSET */}

                  <td className="px-6 py-5">

                    <span className="font-semibold text-slate-700">
                      {task.asset_code}
                    </span>

                  </td>


                  {/* DEPARTMENT */}

                  <td className="px-6 py-5">

                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold">
                      {task.department}
                    </span>

                  </td>


                  {/* PRIORITY */}

                  <td className="px-6 py-5">

                    <div className="flex flex-col items-start gap-1">

                      <StatusBadge type={priorityType}>
                        {priorityLabel}
                      </StatusBadge>

                      <span className="text-xs text-slate-400">
                        U:{task.urgency ?? 0} / C:{task.criticality ?? 0}
                      </span>

                    </div>

                  </td>


                  {/* DURATION */}

                  <td className="px-6 py-5">

                    <div className="flex items-center gap-2">

                      <span className="text-slate-400">
                        ⏱
                      </span>

                      <span className="font-semibold text-slate-700">
                        {task.duration_minutes ?? 0} min
                      </span>

                    </div>

                  </td>


                  {/* STATUS */}

                  <td className="px-6 py-5">

                    <StatusBadge type={statusType}>
                      {task.status}
                    </StatusBadge>

                  </td>

                </tr>

              );

            })}

          </tbody>

        </table>


        {tasks.length === 0 && (
          <EmptyState text="No maintenance tasks available" />
        )}

      </div>

    </div>


    {/* INFO NOTE */}

    <div className="flex items-start gap-3 px-5 py-4 rounded-xl bg-amber-50 border border-amber-100">

      <span className="text-xl">
        💡
      </span>

      <p className="text-sm text-amber-800">

        Task urgency and asset criticality are important inputs for
        Smart Rail's AI planning engine. Higher-priority maintenance
        activities can be considered earlier when selecting safe
        maintenance block windows.

      </p>

    </div>


    <style>{`

      @keyframes maintenanceTrainMove {

        0% {
          left: -50px;
        }

        100% {
          left: calc(100% + 20px);
        }

      }

    `}</style>

  </div>
)}

  {/* =====================================================
    DEFECTS — RAILWAY INFRASTRUCTURE HEALTH CENTER
===================================================== */}

{page === "defects" && (() => {

  const totalDefects = defects.length;

  const criticalDefects = defects.filter(
    (d) => Number(d.severity) >= 8
  ).length;

  const highDefects = defects.filter(
    (d) => Number(d.severity) >= 6 && Number(d.severity) < 8
  ).length;

  const openDefectsCount = defects.filter(
    (d) =>
      String(d.status).toUpperCase() === "OPEN"
  ).length;

  const resolvedDefects = defects.filter(
    (d) =>
      String(d.status).toUpperCase() !== "OPEN"
  ).length;

  const departmentData = defects.reduce(
    (acc, defect) => {
      const dept = defect.department || "Other";

      if (!acc[dept]) {
        acc[dept] = 0;
      }

      acc[dept]++;

      return acc;
    },
    {}
  );

  const severityData = [
    {
      label: "Critical",
      count: criticalDefects,
      color: "bg-red-600",
    },
    {
      label: "High",
      count: highDefects,
      color: "bg-amber-500",
    },
    {
      label: "Normal",
      count: defects.filter(
        (d) => Number(d.severity) < 6
      ).length,
      color: "bg-blue-500",
    },
  ];

  return (
    <div className="space-y-6">

      {/* ================= HERO ================= */}

      <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-6 md:p-8 text-white shadow-xl">

        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-10 -top-20 h-64 w-64 rounded-full bg-red-500 blur-3xl" />
          <div className="absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-blue-500 blur-3xl" />
        </div>

        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

          <div>

            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200 mb-4">

              <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />

              INFRASTRUCTURE HEALTH MONITORING

            </div>

            <h2 className="text-2xl md:text-4xl font-bold leading-tight">
              Railway Defect
              <span className="block text-red-400">
                Monitoring Center
              </span>
            </h2>

            <p className="mt-3 max-w-2xl text-sm md:text-base text-slate-300 leading-6">
              Monitor infrastructure defects, identify high-severity
              issues and support maintenance planning across railway
              assets and departments.
            </p>

          </div>

          <div className="min-w-[190px] rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">

            <p className="text-xs uppercase tracking-wider text-slate-400">
              Network Health
            </p>

            <div className="mt-2 flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/15 text-xl">
                ⚠
              </div>

              <div>
                <p className="text-xl font-bold">
                  {criticalDefects > 0
                    ? "Attention"
                    : "Stable"}
                </p>

                <p className="text-xs text-slate-400">
                  Based on reported defects
                </p>
              </div>

            </div>

          </div>

        </div>

      </div>


      {/* ================= KPI CARDS ================= */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

        <StatCard
          label="Total Defects"
          value={totalDefects}
          icon="⚠"
          tone="blue"
        />

        <StatCard
          label="Critical Defects"
          value={criticalDefects}
          icon="!"
          tone="red"
        />

        <StatCard
          label="Open Defects"
          value={openDefectsCount}
          icon="◉"
          tone="amber"
        />

        <StatCard
          label="Resolved"
          value={resolvedDefects}
          icon="✓"
          tone="green"
        />

      </div>


      {/* ================= ANALYTICS ================= */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Severity */}

        <Card className="p-6">

          <div className="flex items-center justify-between mb-5">

            <div>
              <h3 className="font-bold text-slate-900">
                Severity Overview
              </h3>

              <p className="text-xs text-slate-500 mt-1">
                Distribution of reported defects
              </p>
            </div>

            <div className="h-9 w-9 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
              ⚠
            </div>

          </div>

          <div className="space-y-4">

            {severityData.map((item) => {

              const percentage =
                totalDefects > 0
                  ? Math.round(
                      (item.count / totalDefects) * 100
                    )
                  : 0;

              return (
                <div key={item.label}>

                  <div className="flex justify-between text-sm mb-1.5">

                    <span className="font-medium text-slate-700">
                      {item.label}
                    </span>

                    <span className="font-semibold text-slate-900">
                      {item.count}
                    </span>

                  </div>

                  <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">

                    <div
                      className={`h-full rounded-full ${item.color} transition-all duration-700`}
                      style={{
                        width: `${percentage}%`,
                      }}
                    />

                  </div>

                  <p className="text-[11px] text-slate-400 mt-1">
                    {percentage}% of total defects
                  </p>

                </div>
              );
            })}

          </div>

        </Card>


        {/* Department Summary */}

        <Card className="p-6">

          <div className="flex items-center justify-between mb-5">

            <div>
              <h3 className="font-bold text-slate-900">
                Department Impact
              </h3>

              <p className="text-xs text-slate-500 mt-1">
                Defects by responsible department
              </p>
            </div>

            <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              ◈
            </div>

          </div>

          {Object.keys(departmentData).length > 0 ? (

            <div className="space-y-4">

              {Object.entries(departmentData).map(
                ([department, count]) => {

                  const percentage =
                    totalDefects > 0
                      ? Math.round(
                          (count / totalDefects) * 100
                        )
                      : 0;

                  return (
                    <div key={department}>

                      <div className="flex justify-between mb-1.5">

                        <span className="text-sm font-medium text-slate-700">
                          {department}
                        </span>

                        <span className="text-sm font-semibold text-slate-900">
                          {count}
                        </span>

                      </div>

                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">

                        <div
                          className="h-full rounded-full bg-blue-600 transition-all duration-700"
                          style={{
                            width: `${percentage}%`,
                          }}
                        />

                      </div>

                    </div>
                  );
                }
              )}

            </div>

          ) : (

            <EmptyState text="No department data available" />

          )}

        </Card>


        {/* Monitoring Status */}

        <Card className="p-6">

          <div className="flex items-center justify-between mb-5">

            <div>
              <h3 className="font-bold text-slate-900">
                Monitoring Status
              </h3>

              <p className="text-xs text-slate-500 mt-1">
                Current infrastructure condition
              </p>
            </div>

            <div className="h-9 w-9 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
              ✓
            </div>

          </div>

          <div className="space-y-4">

            <div className="flex items-center justify-between rounded-xl bg-red-50 p-4">

              <div className="flex items-center gap-3">

                <div className="h-9 w-9 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                  !
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Critical
                  </p>

                  <p className="text-xs text-slate-500">
                    Immediate attention
                  </p>
                </div>

              </div>

              <span className="text-lg font-bold text-red-600">
                {criticalDefects}
              </span>

            </div>


            <div className="flex items-center justify-between rounded-xl bg-amber-50 p-4">

              <div className="flex items-center gap-3">

                <div className="h-9 w-9 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                  !
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Open
                  </p>

                  <p className="text-xs text-slate-500">
                    Under monitoring
                  </p>
                </div>

              </div>

              <span className="text-lg font-bold text-amber-600">
                {openDefectsCount}
              </span>

            </div>


            <div className="flex items-center justify-between rounded-xl bg-green-50 p-4">

              <div className="flex items-center gap-3">

                <div className="h-9 w-9 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                  ✓
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Resolved
                  </p>

                  <p className="text-xs text-slate-500">
                    Closed defects
                  </p>
                </div>

              </div>

              <span className="text-lg font-bold text-green-600">
                {resolvedDefects}
              </span>

            </div>

          </div>

        </Card>

      </div>


      {/* ================= DEFECT TABLE ================= */}

      <Card className="overflow-hidden">

        <div className="p-6 border-b border-slate-200">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">

            <div>

              <h2 className="text-xl font-bold text-slate-900">
                Infrastructure Defects
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Detailed defect records requiring monitoring
                and maintenance action
              </p>

            </div>

            <div className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
              {totalDefects} Records
            </div>

          </div>

        </div>


        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead className="bg-slate-50 border-b border-slate-200">

              <tr>

                <th className="text-left px-5 py-4 font-semibold text-slate-600">
                  Defect
                </th>

                <th className="text-left px-5 py-4 font-semibold text-slate-600">
                  Asset
                </th>

                <th className="text-left px-5 py-4 font-semibold text-slate-600">
                  Department
                </th>

                <th className="text-left px-5 py-4 font-semibold text-slate-600">
                  Severity
                </th>

                <th className="text-left px-5 py-4 font-semibold text-slate-600">
                  Description
                </th>

                <th className="text-left px-5 py-4 font-semibold text-slate-600">
                  Status
                </th>

              </tr>

            </thead>


            <tbody>

              {defects.map((defect) => {

                const severity =
                  Number(defect.severity);

                const isCritical =
                  severity >= 8;

                const isOpen =
                  String(defect.status).toUpperCase() ===
                  "OPEN";

                return (
                  <tr
                    key={defect.id}
                    className="border-t border-slate-100 hover:bg-slate-50/80 transition-colors"
                  >

                    <td className="px-5 py-4">

                      <div className="flex items-center gap-3">

                        <div
                          className={`h-9 w-9 rounded-lg flex items-center justify-center font-bold ${
                            isCritical
                              ? "bg-red-50 text-red-600"
                              : "bg-amber-50 text-amber-600"
                          }`}
                        >
                          !
                        </div>

                        <div>

                          <p className="font-semibold text-slate-900">
                            {defect.defect_code}
                          </p>

                          <p className="text-xs text-slate-400">
                            ID #{defect.id}
                          </p>

                        </div>

                      </div>

                    </td>


                    <td className="px-5 py-4">

                      <span className="font-medium text-slate-700">
                        {defect.asset_code}
                      </span>

                    </td>


                    <td className="px-5 py-4">

                      <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                        {defect.department}
                      </span>

                    </td>


                    <td className="px-5 py-4">

                      <StatusBadge
                        type={
                          severity >= 8
                            ? "danger"
                            : severity >= 6
                            ? "warning"
                            : "info"
                        }
                      >
                        {severity}/10
                      </StatusBadge>

                    </td>


                    <td className="px-5 py-4 max-w-sm">

                      <p
                        className="text-slate-600 truncate"
                        title={defect.description}
                      >
                        {defect.description}
                      </p>

                    </td>


                    <td className="px-5 py-4">

                      <StatusBadge
                        type={
                          isOpen
                            ? "danger"
                            : "success"
                        }
                      >
                        {defect.status}
                      </StatusBadge>

                    </td>

                  </tr>
                );
              })}

            </tbody>

          </table>


          {defects.length === 0 && (
            <EmptyState text="No defects available" />
          )}

        </div>

      </Card>


      {/* ================= INFO NOTE ================= */}

      <div className="rounded-2xl border border-red-100 bg-red-50/60 p-5">

        <div className="flex gap-3">

          <div className="h-9 w-9 shrink-0 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
            ⚠
          </div>

          <div>

            <p className="font-semibold text-slate-900">
              Defect-driven maintenance planning
            </p>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              High-severity infrastructure defects can influence
              maintenance priority and help the Smart Rail planning
              engine identify assets that require earlier intervention.
            </p>

          </div>

        </div>

      </div>


      <style>{`
        @keyframes defectPulse {
          0%, 100% {
            opacity: 0.7;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.08);
          }
        }
      `}</style>

    </div>
  );
})()}      
       {/* =====================================================
    TRAIN SCHEDULE — RAILWAY MOVEMENT CONTROL CENTER
===================================================== */}

{page === "trains" && (
  <div className="space-y-6">

    {/* ================= HERO ================= */}
    <section
      className="relative overflow-hidden rounded-3xl min-h-[330px] flex items-center"
      style={{
        backgroundImage: `
          linear-gradient(
            90deg,
            rgba(7, 18, 38, 0.98) 0%,
            rgba(7, 18, 38, 0.92) 42%,
            rgba(7, 18, 38, 0.58) 70%,
            rgba(7, 18, 38, 0.35) 100%
          ),
          url("https://commons.wikimedia.org/wiki/Special:Redirect/file/Indian_Railways_Train_in_2025.jpg")
        `,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >

      {/* Railway red accent */}
      <div className="absolute left-0 top-0 bottom-0 w-2 bg-red-600" />

      {/* Decorative railway line */}
      <div className="absolute bottom-8 left-0 right-0 opacity-30">
        <div className="h-[2px] bg-white" />
        <div className="mt-3 h-[2px] bg-white" />
      </div>

      <div className="relative z-10 px-7 md:px-12 py-10 max-w-4xl">

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-sm font-semibold backdrop-blur-md mb-5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
          RAILWAY OPERATIONS CONTROL CENTER
        </div>

        <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight">
          Train Movement
          <span className="block text-red-400">
            Intelligence
          </span>
        </h1>

        <p className="mt-4 text-slate-200 text-base md:text-lg max-w-2xl leading-relaxed">
          Monitor scheduled train movements and identify corridor
          conflicts before maintenance blocks are finalized.
        </p>

        <div className="mt-7 flex flex-wrap gap-3">

          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white backdrop-blur-md">
            <span className="text-green-400">●</span>
            Schedule Monitoring
          </div>

          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white backdrop-blur-md">
            <span className="text-blue-400">◆</span>
            AI Conflict Detection
          </div>

          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white backdrop-blur-md">
            <span className="text-amber-400">⚡</span>
            Block Planning Input
          </div>

        </div>
      </div>
    </section>


    {/* ================= KPI CARDS ================= */}

    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

      {/* Train Services */}
      <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600" />

        <div className="flex items-start justify-between">

          <div>
            <p className="text-sm font-semibold text-slate-500">
              TRAIN SERVICES
            </p>

            <h3 className="mt-3 text-4xl font-extrabold text-slate-900">
              {trains.length}
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Scheduled movements
            </p>
          </div>

          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl">
            🚆
          </div>

        </div>
      </div>


      {/* Corridors */}
      <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-600" />

        <div className="flex items-start justify-between">

          <div>
            <p className="text-sm font-semibold text-slate-500">
              CORRIDORS
            </p>

            <h3 className="mt-3 text-4xl font-extrabold text-slate-900">
              {new Set(trains.map((t) => t.corridor)).size}
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Corridors monitored
            </p>
          </div>

          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-2xl">
            ↔
          </div>

        </div>
      </div>


      {/* Conflicts */}
      <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />

        <div className="flex items-start justify-between">

          <div>
            <p className="text-sm font-semibold text-slate-500">
              CONFLICT STATUS
            </p>

            <h3 className="mt-3 text-4xl font-extrabold text-slate-900">
              0
            </h3>

            <p className="mt-2 text-sm text-green-600 font-medium">
              No conflicts detected
            </p>
          </div>

          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-2xl">
            ⚡
          </div>

        </div>
      </div>


      {/* Network */}
      <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="absolute top-0 left-0 right-0 h-1 bg-red-600" />

        <div className="flex items-start justify-between">

          <div>
            <p className="text-sm font-semibold text-slate-500">
              NETWORK STATUS
            </p>

            <h3 className="mt-3 text-2xl font-extrabold text-red-600">
              {backendOnline ? "ONLINE" : "OFFLINE"}
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Railway data connection
            </p>
          </div>

          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
              backendOnline
                ? "bg-green-50 text-green-600"
                : "bg-red-50 text-red-600"
            }`}
          >
            ●
          </div>

        </div>
      </div>

    </div>


    {/* ================= AI CONFLICT MONITOR ================= */}

    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

      <div className="px-6 md:px-8 py-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">

        <div>
          <div className="flex items-center gap-3">

            <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xl">
              ◆
            </div>

            <div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-900">
                AI Conflict Monitor
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Planning engine input for maintenance block optimization
              </p>
            </div>

          </div>
        </div>

        <div
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
            trains.length > 0
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-slate-100 text-slate-600 border border-slate-200"
          }`}
        >
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              trains.length > 0
                ? "bg-green-500"
                : "bg-slate-400"
            }`}
          />
          {trains.length > 0 ? "Schedule Loaded" : "Awaiting Schedule"}
        </div>

      </div>


      <div className="p-6 md:p-8">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Step 1 */}
          <div className="rounded-2xl bg-blue-50 border border-blue-100 p-5">
            <div className="flex items-center justify-between">

              <span className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                01
              </span>

              <span className="text-blue-600 text-lg">
                ✓
              </span>

            </div>

            <h3 className="mt-4 font-bold text-slate-900">
              Schedule Input
            </h3>

            <p className="mt-1 text-sm text-slate-600">
              Train movement data is provided to the planning engine.
            </p>
          </div>


          {/* Step 2 */}
          <div className="rounded-2xl bg-amber-50 border border-amber-100 p-5">
            <div className="flex items-center justify-between">

              <span className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                02
              </span>

              <span className="text-amber-600 text-lg">
                ◆
              </span>

            </div>

            <h3 className="mt-4 font-bold text-slate-900">
              Conflict Analysis
            </h3>

            <p className="mt-1 text-sm text-slate-600">
              Block windows are compared against train movements.
            </p>
          </div>


          {/* Step 3 */}
          <div className="rounded-2xl bg-green-50 border border-green-100 p-5">
            <div className="flex items-center justify-between">

              <span className="w-10 h-10 rounded-xl bg-green-100 text-green-700 flex items-center justify-center font-bold">
                03
              </span>

              <span className="text-green-600 text-lg">
                ✓
              </span>

            </div>

            <h3 className="mt-4 font-bold text-slate-900">
              Safe Planning
            </h3>

            <p className="mt-1 text-sm text-slate-600">
              Conflict-free windows can be considered for maintenance.
            </p>
          </div>

        </div>

      </div>

    </section>


    {/* ================= MOVEMENT TIMELINE ================= */}

    <section className="bg-slate-900 rounded-2xl overflow-hidden shadow-lg">

      <div className="px-6 md:px-8 py-6 border-b border-white/10">

        <div className="flex items-center justify-between">

          <div>
            <p className="text-red-400 text-xs font-bold tracking-widest uppercase">
              Operations View
            </p>

            <h2 className="mt-1 text-xl md:text-2xl font-bold text-white">
              Train Movement Timeline
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Scheduled movement windows across monitored corridors
            </p>
          </div>

          <div className="hidden md:flex w-12 h-12 rounded-xl bg-white/10 items-center justify-center text-2xl">
            🚆
          </div>

        </div>

      </div>


      <div className="p-6 md:p-8">

        {trains.length === 0 ? (

          <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 py-12 text-center">

            <div className="text-5xl mb-4 opacity-80">
              🚆
            </div>

            <h3 className="text-lg font-bold text-white">
              No scheduled services
            </h3>

            <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">
              Train movement information will appear here once
              schedule data is available.
            </p>

          </div>

        ) : (

          <div className="space-y-5">

            {/* Timeline header */}
            <div className="grid grid-cols-5 text-xs text-slate-400 font-semibold">
              <span>06:00</span>
              <span className="text-center">09:00</span>
              <span className="text-center">12:00</span>
              <span className="text-center">15:00</span>
              <span className="text-right">18:00</span>
            </div>


            {/* Timeline */}
            <div className="relative h-20">

              <div className="absolute top-8 left-0 right-0 h-[3px] bg-white/20 rounded-full" />

              <div className="absolute top-7 left-0 w-4 h-4 rounded-full bg-green-400 border-4 border-slate-900" />

              <div className="absolute top-7 right-0 w-4 h-4 rounded-full bg-red-400 border-4 border-slate-900" />

              {trains.slice(0, 5).map((train, index) => (

                <div
                  key={train.id || index}
                  className="absolute top-1/2 -translate-y-1/2"
                  style={{
                    left: `${Math.min(
                      15 + index * 18,
                      88
                    )}%`,
                  }}
                >

                  <div className="group relative">

                    <div className="w-10 h-10 rounded-full bg-red-600 border-4 border-slate-900 shadow-lg flex items-center justify-center text-white">
                      🚆
                    </div>

                    <div className="absolute left-1/2 -translate-x-1/2 top-12 whitespace-nowrap">
                      <span className="text-xs font-bold text-white">
                        {train.train_number || "TRAIN"}
                      </span>
                    </div>

                  </div>

                </div>

              ))}

            </div>

          </div>

        )}

      </div>

    </section>


    {/* ================= TRAIN SCHEDULE ================= */}

    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

      <div className="px-6 md:px-8 py-6 border-b border-slate-200">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <div>

            <p className="text-xs font-bold tracking-widest text-red-600 uppercase">
              Schedule Database
            </p>

            <h2 className="mt-1 text-xl md:text-2xl font-bold text-slate-900">
              Scheduled Train Services
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Train movements used for maintenance block conflict detection
            </p>

          </div>

          <div className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold">
            {trains.length} Services
          </div>

        </div>

      </div>


      {trains.length === 0 ? (

        <div className="px-6 py-14 text-center">

          <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl">
            🚆
          </div>

          <h3 className="mt-5 text-xl font-bold text-slate-900">
            No train schedule available
          </h3>

          <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
            Add train schedule information to enable
            corridor-level conflict detection and AI block planning.
          </p>

        </div>

      ) : (

        <div className="overflow-x-auto">

          <table className="w-full min-w-[950px]">

            <thead className="bg-slate-900">

              <tr>

                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Train
                </th>

                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Service
                </th>

                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Corridor
                </th>

                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Type
                </th>

                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Journey Date
                </th>

                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Arrival
                </th>

                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Departure
                </th>

              </tr>

            </thead>


            <tbody className="divide-y divide-slate-100">

              {trains.map((train, index) => (

                <tr
                  key={train.id || index}
                  className="hover:bg-slate-50 transition-colors"
                >

                  {/* Train */}
                  <td className="px-6 py-5">

                    <div className="flex items-center gap-3">

                      <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                        🚆
                      </div>

                      <div>

                        <div className="font-bold text-slate-900">
                          {train.train_number || "—"}
                        </div>

                        <div className="text-xs text-slate-500">
                          Service ID
                        </div>

                      </div>

                    </div>

                  </td>


                  {/* Name */}
                  <td className="px-6 py-5">

                    <div className="font-semibold text-slate-900">
                      {train.train_name || "—"}
                    </div>

                  </td>


                  {/* Corridor */}
                  <td className="px-6 py-5">

                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold">
                      {train.corridor || "—"}
                    </span>

                  </td>


                  {/* Type */}
                  <td className="px-6 py-5">

                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                      {train.train_type || "—"}
                    </span>

                  </td>


                  {/* Date */}
                  <td className="px-6 py-5">

                    <span className="text-sm font-medium text-slate-700">
                      {train.journey_date || "—"}
                    </span>

                  </td>


                  {/* Arrival */}
                  <td className="px-6 py-5">

                    <div className="flex items-center gap-2">

                      <span className="w-2 h-2 rounded-full bg-green-500" />

                      <span className="font-bold text-slate-900">
                        {train.arrival_time || "—"}
                      </span>

                    </div>

                  </td>


                  {/* Departure */}
                  <td className="px-6 py-5">

                    <div className="flex items-center gap-2">

                      <span className="w-2 h-2 rounded-full bg-red-500" />

                      <span className="font-bold text-slate-900">
                        {train.departure_time || "—"}
                      </span>

                    </div>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      )}

    </section>


    {/* ================= INFORMATION PANEL ================= */}

    <section className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-slate-50 p-6 md:p-8">

      <div className="flex flex-col md:flex-row gap-5">

        <div className="w-12 h-12 shrink-0 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-xl">
          ℹ
        </div>

        <div>

          <h3 className="text-lg font-bold text-slate-900">
            Why train schedules matter
          </h3>

          <p className="mt-2 text-sm md:text-base text-slate-600 leading-relaxed">
            Smart Rail compares proposed maintenance block windows
            with scheduled train movements on the same corridor.
            Overlapping windows can be identified before a block
            is finalized, helping the planning engine search for
            safer maintenance windows.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">

            <span className="px-3 py-1.5 rounded-lg bg-white border border-blue-100 text-xs font-semibold text-slate-700">
              Train Schedule
            </span>

            <span className="px-3 py-1.5 rounded-lg bg-white border border-blue-100 text-xs font-semibold text-slate-700">
              Corridor
            </span>

            <span className="px-3 py-1.5 rounded-lg bg-white border border-blue-100 text-xs font-semibold text-slate-700">
              Conflict Detection
            </span>

            <span className="px-3 py-1.5 rounded-lg bg-white border border-blue-100 text-xs font-semibold text-slate-700">
              AI Block Planning
            </span>

          </div>

        </div>

      </div>

    </section>

  </div>

    )}
        {/* =====================================================
    CORRIDORS — RAILWAY CORRIDOR CONTROL CENTER
===================================================== */}

{page === "corridors" && (
  <div className="space-y-6">

    {/* HERO */}
    <section className="relative overflow-hidden rounded-3xl bg-slate-950 text-white shadow-xl">

      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(7,18,38,0.98), rgba(7,18,38,0.55)), url('https://commons.wikimedia.org/wiki/Special:Redirect/file/Railway_tracks_in_India.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />

      <div className="relative p-7 md:p-10">

        <div className="flex items-center gap-3 mb-4">
          <span className="px-3 py-1 rounded-full bg-red-600/20 border border-red-400/30 text-red-300 text-xs font-semibold">
            RAILWAY OPERATIONS CONTROL
          </span>

          <span className="px-3 py-1 rounded-full bg-green-500/10 border border-green-400/20 text-green-300 text-xs font-semibold">
            LIVE AVAILABILITY
          </span>
        </div>

        <h2 className="text-3xl md:text-4xl font-bold leading-tight max-w-3xl">
          Corridor Availability
          <span className="block text-red-400">
            Control & Planning
          </span>
        </h2>

        <p className="mt-4 max-w-2xl text-slate-300 text-sm md:text-base leading-7">
          Monitor maintenance windows across railway corridors and
          identify safe time slots for infrastructure maintenance
          without disrupting scheduled train movements.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">

          <span className="px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-sm">
            Corridor Monitoring
          </span>

          <span className="px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-sm">
            Maintenance Windows
          </span>

          <span className="px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-sm">
            AI Block Planning
          </span>

        </div>

        {/* Railway line */}
        <div className="mt-8 flex items-center gap-3">

          <div className="h-1 w-16 bg-red-500 rounded-full" />

          <div className="h-1 flex-1 max-w-md bg-white/20 rounded-full" />

          <div className="h-3 w-3 rounded-full bg-green-400 shadow-lg shadow-green-400/50" />

        </div>

      </div>
    </section>


    {/* KPI CARDS */}
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

      <StatCard
        title="Total Windows"
        value={corridors.length}
        subtitle="Maintenance availability records"
        accent="blue"
      />

      <StatCard
        title="Available Windows"
        value={corridors.filter(
          (c) =>
            String(c.status).toUpperCase() === "AVAILABLE"
        ).length}
        subtitle="Ready for allocation"
        accent="green"
      />

      <StatCard
        title="Available Minutes"
        value={`${corridors.reduce(
          (sum, c) =>
            sum + Number(c.available_minutes || 0),
          0
        )} min`}
        subtitle="Total maintenance capacity"
        accent="amber"
      />

      <StatCard
        title="Allocated / Blocked"
        value={corridors.filter(
          (c) =>
            String(c.status).toUpperCase() !== "AVAILABLE"
        ).length}
        subtitle="Currently unavailable"
        accent="red"
      />

    </div>


    {/* AI PLANNING PIPELINE */}
    <Card className="overflow-hidden">

      <div className="p-6 border-b border-slate-200">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">

          <div>
            <h3 className="text-lg font-bold text-slate-900">
              AI Block Planning Pipeline
            </h3>

            <p className="text-sm text-slate-500 mt-1">
              Corridor availability is one of the key inputs used by
              Smart Rail's planning engine.
            </p>
          </div>

          <span className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
            PLANNING INPUT
          </span>

        </div>

      </div>


      <div className="p-6">

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

          {/* STEP 1 */}
          <div className="relative">

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 h-full">

              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                01
              </div>

              <h4 className="mt-4 font-bold text-slate-900">
                Corridor Availability
              </h4>

              <p className="mt-2 text-xs text-slate-500 leading-5">
                Identify available maintenance windows.
              </p>

            </div>

          </div>


          {/* STEP 2 */}
          <div className="relative">

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 h-full">

              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                02
              </div>

              <h4 className="mt-4 font-bold text-slate-900">
                Maintenance Requirement
              </h4>

              <p className="mt-2 text-xs text-slate-500 leading-5">
                Match available capacity with maintenance duration.
              </p>

            </div>

          </div>


          {/* STEP 3 */}
          <div className="relative">

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 h-full">

              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold">
                03
              </div>

              <h4 className="mt-4 font-bold text-slate-900">
                Train Conflict Check
              </h4>

              <p className="mt-2 text-xs text-slate-500 leading-5">
                Check maintenance windows against train movements.
              </p>

            </div>

          </div>


          {/* STEP 4 */}
          <div className="relative">

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 h-full">

              <div className="w-10 h-10 rounded-xl bg-green-100 text-green-700 flex items-center justify-center font-bold">
                04
              </div>

              <h4 className="mt-4 font-bold text-slate-900">
                Optimal Block Window
              </h4>

              <p className="mt-2 text-xs text-slate-500 leading-5">
                Generate a safe maintenance block plan.
              </p>

            </div>

          </div>

        </div>

      </div>

    </Card>


    {/* AVAILABILITY OVERVIEW */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* WINDOW SUMMARY */}
      <Card className="lg:col-span-1">

        <div className="p-6 border-b border-slate-200">

          <h3 className="text-lg font-bold text-slate-900">
            Availability Overview
          </h3>

          <p className="text-sm text-slate-500 mt-1">
            Current corridor capacity
          </p>

        </div>

        <div className="p-6 space-y-5">

          {[
            {
              label: "Available",
              count: corridors.filter(
                (c) =>
                  String(c.status).toUpperCase() === "AVAILABLE"
              ).length,
              type: "success",
            },
            {
              label: "Allocated",
              count: corridors.filter(
                (c) =>
                  String(c.status).toUpperCase() === "ALLOCATED"
              ).length,
              type: "info",
            },
            {
              label: "Blocked",
              count: corridors.filter(
                (c) =>
                  String(c.status).toUpperCase() === "BLOCKED"
              ).length,
              type: "warning",
            },
          ].map((item) => {

            const total = corridors.length || 1;

            const percentage = Math.round(
              (item.count / total) * 100
            );

            return (
              <div key={item.label}>

                <div className="flex justify-between items-center mb-2">

                  <span className="text-sm font-semibold text-slate-700">
                    {item.label}
                  </span>

                  <span className="text-sm font-bold text-slate-900">
                    {item.count}
                  </span>

                </div>

                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">

                  <div
                    className={`h-full rounded-full ${
                      item.type === "success"
                        ? "bg-green-500"
                        : item.type === "info"
                        ? "bg-blue-500"
                        : "bg-amber-500"
                    }`}
                    style={{
                      width: `${percentage}%`,
                    }}
                  />

                </div>

              </div>
            );
          })}

        </div>

      </Card>


      {/* CORRIDOR TIMELINE */}
      <Card className="lg:col-span-2">

        <div className="p-6 border-b border-slate-200">

          <h3 className="text-lg font-bold text-slate-900">
            Maintenance Window Timeline
          </h3>

          <p className="text-sm text-slate-500 mt-1">
            Available corridor windows for maintenance planning
          </p>

        </div>

        <div className="p-6 space-y-4">

          {corridors.slice(0, 6).map((corridor) => {

            const available =
              String(corridor.status).toUpperCase() ===
              "AVAILABLE";

            return (
              <div
                key={corridor.id}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50"
              >

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">

                  <div>

                    <div className="flex items-center gap-2">

                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          available
                            ? "bg-green-500"
                            : "bg-amber-500"
                        }`}
                      />

                      <span className="font-bold text-slate-900">
                        {corridor.corridor}
                      </span>

                    </div>

                    <p className="text-xs text-slate-500 mt-1">
                      {corridor.department} ·{" "}
                      {corridor.available_date}
                    </p>

                  </div>


                  <div className="text-left md:text-right">

                    <p className="font-semibold text-slate-800">
                      {corridor.start_time} –{" "}
                      {corridor.end_time}
                    </p>

                    <p className="text-xs text-slate-500 mt-1">
                      {corridor.available_minutes} minutes
                    </p>

                  </div>

                </div>


                <div className="mt-4 h-2 bg-slate-200 rounded-full overflow-hidden">

                  <div
                    className={`h-full rounded-full ${
                      available
                        ? "bg-green-500"
                        : "bg-amber-500"
                    }`}
                    style={{
                      width: `${Math.min(
                        Number(corridor.available_minutes || 0) / 4,
                        100
                      )}%`,
                    }}
                  />

                </div>

              </div>
            );
          })}

          {corridors.length === 0 && (
            <EmptyState text="No corridor availability data" />
          )}

        </div>

      </Card>

    </div>


    {/* MAIN TABLE */}
    <Card className="overflow-hidden">

      <div className="p-6 border-b border-slate-200">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">

          <div>

            <h3 className="text-lg font-bold text-slate-900">
              Corridor Availability Register
            </h3>

            <p className="text-sm text-slate-500 mt-1">
              Detailed maintenance windows available to the planning engine.
            </p>

          </div>

          <div className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold">
            {corridors.length} WINDOWS
          </div>

        </div>

      </div>


      <div className="overflow-x-auto">

        <table className="w-full text-sm">

          <thead className="bg-slate-950 text-white">

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
                Maintenance Window
              </th>

              <th className="text-left px-5 py-4">
                Capacity
              </th>

              <th className="text-left px-5 py-4">
                Status
              </th>

            </tr>

          </thead>


          <tbody>

            {corridors.map((corridor) => {

              const available =
                String(corridor.status).toUpperCase() ===
                "AVAILABLE";

              return (
                <tr
                  key={corridor.id}
                  className="border-t border-slate-100 hover:bg-slate-50 transition"
                >

                  <td className="px-5 py-4">

                    <div className="flex items-center gap-3">

                      <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 font-bold">
                        ↔
                      </div>

                      <div>

                        <p className="font-bold text-slate-900">
                          {corridor.corridor}
                        </p>

                        <p className="text-xs text-slate-400">
                          Corridor ID #{corridor.id}
                        </p>

                      </div>

                    </div>

                  </td>


                  <td className="px-5 py-4">

                    <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold">
                      {corridor.department}
                    </span>

                  </td>


                  <td className="px-5 py-4 font-medium text-slate-700">
                    {corridor.available_date}
                  </td>


                  <td className="px-5 py-4">

                    <div>

                      <p className="font-semibold text-slate-800">
                        {corridor.start_time} –{" "}
                        {corridor.end_time}
                      </p>

                      <p className="text-xs text-slate-400 mt-1">
                        Maintenance access window
                      </p>

                    </div>

                  </td>


                  <td className="px-5 py-4">

                    <div className="min-w-[130px]">

                      <div className="flex justify-between text-xs mb-1">

                        <span className="text-slate-500">
                          Capacity
                        </span>

                        <span className="font-semibold text-slate-700">
                          {corridor.available_minutes} min
                        </span>

                      </div>

                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">

                        <div
                          className={`h-full rounded-full ${
                            available
                              ? "bg-green-500"
                              : "bg-amber-500"
                          }`}
                          style={{
                            width: `${Math.min(
                              Number(corridor.available_minutes || 0) / 4,
                              100
                            )}%`,
                          }}
                        />

                      </div>

                    </div>

                  </td>


                  <td className="px-5 py-4">

                    <StatusBadge
                      type={
                        available
                          ? "success"
                          : "warning"
                      }
                    >
                      {corridor.status}
                    </StatusBadge>

                  </td>

                </tr>
              );
            })}

          </tbody>

        </table>


        {corridors.length === 0 && (
          <EmptyState text="No corridor availability data" />
        )}

      </div>

    </Card>


    {/* INFORMATION PANEL */}
    <div className="rounded-2xl border border-red-100 bg-red-50 p-5">

      <div className="flex gap-4">

        <div className="w-10 h-10 shrink-0 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold">
          !
        </div>

        <div>

          <h4 className="font-bold text-red-900">
            Why corridor availability matters
          </h4>

          <p className="text-sm text-red-800/80 mt-1 leading-6">
            A maintenance task can only be converted into a safe
            block plan when a suitable corridor window is available.
            Smart Rail combines this availability with maintenance
            priority and train movement information before generating
            the final block plan.
          </p>

        </div>

      </div>

    </div>

  </div>
)}
       {/* =====================================================
    PLANS — AI BLOCK PLANNING CONTROL CENTER
===================================================== */}

{page === "plans" && (
  <div className="space-y-6">

    {/* HERO */}
    <section className="relative overflow-hidden rounded-3xl bg-slate-950 text-white shadow-xl">

      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(7,18,38,0.98), rgba(7,18,38,0.55)), url('https://commons.wikimedia.org/wiki/Special:Redirect/file/Indian_Railways_Train_in_2025.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />

      <div className="relative p-7 md:p-10">

        <div className="flex flex-wrap items-center gap-3 mb-4">

          <span className="px-3 py-1 rounded-full bg-red-600/20 border border-red-400/30 text-red-300 text-xs font-semibold">
            SMART RAIL AI ENGINE
          </span>

          <span className="px-3 py-1 rounded-full bg-green-500/10 border border-green-400/20 text-green-300 text-xs font-semibold">
            BLOCK PLANNING ACTIVE
          </span>

        </div>

        <h2 className="text-3xl md:text-4xl font-bold leading-tight max-w-3xl">
          AI-Generated Block Plans
          <span className="block text-red-400">
            Railway Maintenance Intelligence
          </span>
        </h2>

        <p className="mt-4 max-w-2xl text-slate-300 text-sm md:text-base leading-7">
          Smart Rail combines maintenance priority, corridor
          availability and train movement constraints to generate
          safe and optimized maintenance block windows.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">

          <span className="px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-sm">
            Priority Analysis
          </span>

          <span className="px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-sm">
            Conflict Detection
          </span>

          <span className="px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-sm">
            Optimal Scheduling
          </span>

        </div>

        <div className="mt-8 flex items-center gap-3">

          <div className="h-1 w-16 bg-red-500 rounded-full" />

          <div className="h-1 flex-1 max-w-md bg-white/20 rounded-full" />

          <div className="h-3 w-3 rounded-full bg-green-400 shadow-lg shadow-green-400/50" />

        </div>

      </div>

    </section>


    {/* KPI CARDS */}
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

      <StatCard
        title="Generated Plans"
        value={plans.length}
        subtitle="AI-generated maintenance plans"
        accent="blue"
      />

      <StatCard
        title="High Priority"
        value={plans.filter(
          (p) => Number(p.priority_score || 0) >= 60
        ).length}
        subtitle="Priority score ≥ 60"
        accent="red"
      />

      <StatCard
        title="Safe Plans"
        value={plans.filter(
          (p) =>
            String(p.status).toUpperCase() === "PLANNED"
        ).length}
        subtitle="Validated maintenance windows"
        accent="green"
      />

      <StatCard
        title="Average Priority"
        value={
          plans.length
            ? Math.round(
                plans.reduce(
                  (sum, p) =>
                    sum + Number(p.priority_score || 0),
                  0
                ) / plans.length
              )
            : 0
        }
        subtitle="AI planning priority score"
        accent="amber"
      />

    </div>


    {/* AI DECISION PIPELINE */}
    <Card className="overflow-hidden">

      <div className="p-6 border-b border-slate-200">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">

          <div>

            <h3 className="text-lg font-bold text-slate-900">
              AI Planning Decision Pipeline
            </h3>

            <p className="text-sm text-slate-500 mt-1">
              How Smart Rail converts railway data into a maintenance block plan.
            </p>

          </div>

          <span className="px-3 py-1.5 rounded-full bg-green-50 text-green-700 text-xs font-semibold">
            OPTIMIZATION ENGINE
          </span>

        </div>

      </div>


      <div className="p-6">

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">

          {[
            {
              number: "01",
              title: "Maintenance",
              text: "Identify pending work",
              style: "bg-blue-50 text-blue-700",
            },
            {
              number: "02",
              title: "Priority",
              text: "Calculate urgency",
              style: "bg-red-50 text-red-700",
            },
            {
              number: "03",
              title: "Corridor",
              text: "Find available window",
              style: "bg-amber-50 text-amber-700",
            },
            {
              number: "04",
              title: "Conflict",
              text: "Check train movement",
              style: "bg-purple-50 text-purple-700",
            },
            {
              number: "05",
              title: "Block Plan",
              text: "Generate safe window",
              style: "bg-green-50 text-green-700",
            },
          ].map((step) => (

            <div
              key={step.number}
              className="p-4 rounded-2xl border border-slate-200 bg-slate-50"
            >

              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold ${step.style}`}
              >
                {step.number}
              </div>

              <h4 className="mt-3 font-bold text-slate-900">
                {step.title}
              </h4>

              <p className="text-xs text-slate-500 mt-1 leading-5">
                {step.text}
              </p>

            </div>

          ))}

        </div>

      </div>

    </Card>


    {/* PLAN OVERVIEW */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* PRIORITY DISTRIBUTION */}
      <Card>

        <div className="p-6 border-b border-slate-200">

          <h3 className="text-lg font-bold text-slate-900">
            Priority Distribution
          </h3>

          <p className="text-sm text-slate-500 mt-1">
            AI-assigned maintenance priority
          </p>

        </div>

        <div className="p-6 space-y-5">

          {[
            {
              label: "Critical",
              min: 80,
              max: 100,
              style: "bg-red-500",
            },
            {
              label: "High",
              min: 60,
              max: 79,
              style: "bg-orange-500",
            },
            {
              label: "Medium",
              min: 40,
              max: 59,
              style: "bg-amber-500",
            },
            {
              label: "Low",
              min: 0,
              max: 39,
              style: "bg-green-500",
            },
          ].map((level) => {

            const count = plans.filter((p) => {

              const score = Number(
                p.priority_score || 0
              );

              return score >= level.min && score <= level.max;

            }).length;

            const percentage =
              plans.length
                ? Math.round(
                    (count / plans.length) * 100
                  )
                : 0;

            return (
              <div key={level.label}>

                <div className="flex justify-between mb-2">

                  <span className="text-sm font-semibold text-slate-700">
                    {level.label}
                  </span>

                  <span className="text-sm font-bold text-slate-900">
                    {count}
                  </span>

                </div>

                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">

                  <div
                    className={`h-full rounded-full ${level.style}`}
                    style={{
                      width: `${percentage}%`,
                    }}
                  />

                </div>

              </div>
            );

          })}

        </div>

      </Card>


      {/* SAFE PLANNING STATUS */}
      <Card className="lg:col-span-2">

        <div className="p-6 border-b border-slate-200">

          <h3 className="text-lg font-bold text-slate-900">
            Planning Status
          </h3>

          <p className="text-sm text-slate-500 mt-1">
            Current AI planning output
          </p>

        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">

          <div className="rounded-2xl bg-green-50 border border-green-100 p-5">

            <div className="w-10 h-10 rounded-xl bg-green-100 text-green-700 flex items-center justify-center font-bold">
              ✓
            </div>

            <p className="mt-4 text-2xl font-bold text-green-800">
              {plans.filter(
                (p) =>
                  String(p.status).toUpperCase() ===
                  "PLANNED"
              ).length}
            </p>

            <p className="text-sm font-semibold text-green-900 mt-1">
              Safe Plans
            </p>

            <p className="text-xs text-green-700 mt-1">
              Successfully scheduled
            </p>

          </div>


          <div className="rounded-2xl bg-blue-50 border border-blue-100 p-5">

            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              AI
            </div>

            <p className="mt-4 text-2xl font-bold text-blue-800">
              {plans.length}
            </p>

            <p className="text-sm font-semibold text-blue-900 mt-1">
              Optimized
            </p>

            <p className="text-xs text-blue-700 mt-1">
              Plans generated by engine
            </p>

          </div>


          <div className="rounded-2xl bg-amber-50 border border-amber-100 p-5">

            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              !
            </div>

            <p className="mt-4 text-2xl font-bold text-amber-800">
              {plans.filter(
                (p) =>
                  Number(p.priority_score || 0) >= 80
              ).length}
            </p>

            <p className="text-sm font-semibold text-amber-900 mt-1">
              Critical Priority
            </p>

            <p className="text-xs text-amber-700 mt-1">
              Requires priority attention
            </p>

          </div>

        </div>

      </Card>

    </div>


    {/* BLOCK PLAN TIMELINE */}
    <Card className="overflow-hidden">

      <div className="p-6 border-b border-slate-200">

        <h3 className="text-lg font-bold text-slate-900">
          Planned Maintenance Windows
        </h3>

        <p className="text-sm text-slate-500 mt-1">
          AI-generated block windows across railway corridors
        </p>

      </div>


      <div className="p-6 space-y-4">

        {plans.slice(0, 6).map((plan) => {

          const score = Number(
            plan.priority_score || 0
          );

          return (
            <div
              key={plan.id}
              className="p-5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white hover:shadow-sm transition"
            >

              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

                <div className="flex items-start gap-4">

                  <div className="w-11 h-11 shrink-0 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
                    {plan.id}
                  </div>

                  <div>

                    <p className="font-bold text-slate-900">
                      {plan.task_code}
                    </p>

                    <p className="text-sm text-slate-500 mt-1">
                      {plan.corridor}
                    </p>

                  </div>

                </div>


                <div className="flex flex-wrap gap-3">

                  <div className="px-4 py-2 rounded-xl bg-white border border-slate-200">

                    <p className="text-[10px] uppercase tracking-wide text-slate-400">
                      Date
                    </p>

                    <p className="font-semibold text-slate-800">
                      {plan.planned_date}
                    </p>

                  </div>


                  <div className="px-4 py-2 rounded-xl bg-white border border-slate-200">

                    <p className="text-[10px] uppercase tracking-wide text-slate-400">
                      Window
                    </p>

                    <p className="font-semibold text-slate-800">
                      {plan.start_time} – {plan.end_time}
                    </p>

                  </div>


                  <div className="px-4 py-2 rounded-xl bg-white border border-slate-200">

                    <p className="text-[10px] uppercase tracking-wide text-slate-400">
                      Priority
                    </p>

                    <p className="font-semibold text-slate-800">
                      {score}
                    </p>

                  </div>

                </div>


                <StatusBadge
                  type={
                    String(plan.status).toUpperCase() ===
                    "PLANNED"
                      ? "success"
                      : "warning"
                  }
                >
                  {plan.status}
                </StatusBadge>

              </div>

            </div>
          );
        })}


        {plans.length === 0 && (
          <EmptyState text="No generated block plans" />
        )}

      </div>

    </Card>


    {/* MAIN REGISTER */}
    <Card className="overflow-hidden">

      <div className="p-6 border-b border-slate-200">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">

          <div>

            <h3 className="text-lg font-bold text-slate-900">
              Generated Block Plan Register
            </h3>

            <p className="text-sm text-slate-500 mt-1">
              Detailed output produced by the Smart Rail planning engine.
            </p>

          </div>

          <div className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold">
            {plans.length} PLANS
          </div>

        </div>

      </div>


      <div className="overflow-x-auto">

        <table className="w-full text-sm">

          <thead className="bg-slate-950 text-white">

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
                Block Window
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

            {plans.map((plan) => {

              const score = Number(
                plan.priority_score || 0
              );

              return (
                <tr
                  key={plan.id}
                  className="border-t border-slate-100 hover:bg-slate-50 transition"
                >

                  <td className="px-5 py-4">

                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-700">
                      #{plan.id}
                    </div>

                  </td>


                  <td className="px-5 py-4 font-semibold text-slate-800">
                    {plan.task_code}
                  </td>


                  <td className="px-5 py-4">

                    <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold">
                      {plan.corridor}
                    </span>

                  </td>


                  <td className="px-5 py-4 font-medium text-slate-700">
                    {plan.planned_date}
                  </td>


                  <td className="px-5 py-4">

                    <div>

                      <p className="font-semibold text-slate-800">
                        {plan.start_time} – {plan.end_time}
                      </p>

                      <p className="text-xs text-slate-400 mt-1">
                        Maintenance block window
                      </p>

                    </div>

                  </td>


                  <td className="px-5 py-4">

                    <StatusBadge
                      type={getPriorityType(score)}
                    >
                      {score} · {getPriorityLabel(score)}
                    </StatusBadge>

                  </td>


                  <td className="px-5 py-4">

                    <StatusBadge
                      type={
                        String(plan.status).toUpperCase() ===
                        "PLANNED"
                          ? "success"
                          : "warning"
                      }
                    >
                      {plan.status}
                    </StatusBadge>

                  </td>

                </tr>
              );
            })}

          </tbody>

        </table>


        {plans.length === 0 && (
          <EmptyState text="No generated block plans" />
        )}

      </div>

    </Card>


    {/* EXPLANATION */}
    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">

      <div className="flex gap-4">

        <div className="w-10 h-10 shrink-0 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
          AI
        </div>

        <div>

          <h4 className="font-bold text-blue-900">
            How Smart Rail generates a block plan
          </h4>

          <p className="text-sm text-blue-800/80 mt-1 leading-6">
            The planning engine first evaluates maintenance priority,
            then searches for suitable corridor availability and checks
            the selected window against train movements. Only a safe
            and feasible maintenance window is returned as a block plan.
          </p>

        </div>

      </div>

    </div>

  </div>
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
