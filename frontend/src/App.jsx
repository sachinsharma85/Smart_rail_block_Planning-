import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import {
  blocks,
  priorityData,
  departmentData,
  priorityColors,
} from "./data/mockData";

function App() {
  const [department, setDepartment] = useState("All");
  const [corridor, setCorridor] = useState("All");
  const [view, setView] = useState("Weekly");

  // FILTER BLOCKS
  const filteredBlocks = blocks.filter((block) => {
    const departmentMatch =
      department === "All" || block.department === department;

    const corridorMatch =
      corridor === "All" || block.corridor === corridor;

    return departmentMatch && corridorMatch;
  });
  const filteredPriorityData = [
    {
      name: "Critical",
      value: filteredBlocks.filter((b) => b.priority === "Critical").length,
    },
    {
      name: "High",
      value: filteredBlocks.filter((b) => b.priority === "High").length,
    },
    {
      name: "Medium",
      value: filteredBlocks.filter((b) => b.priority === "Medium").length,
    },
    {
      name: "Low",
      value: filteredBlocks.filter((b) => b.priority === "Low").length,
    },
  ];
  const filteredDepartmentData = [
    {
      name: "Engineering",
      blocks: filteredBlocks.filter((b) => b.department === "Engineering").length,
    },
    {
      name: "TD",
      blocks: filteredBlocks.filter((b) => b.department === "TD").length,
    },
    {
      name: "S&T",
      blocks: filteredBlocks.filter((b) => b.department === "S&T").length,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex">

      {/* SIDEBAR */}
      <aside className="w-64 shrink-0 bg-slate-950 text-white min-h-screen p-6 hidden md:block">

        <div className="mb-10">
          <h1 className="text-2xl font-bold tracking-wide">
            SMART RAIL
          </h1>

          <p className="text-xs text-slate-400 mt-2">
            AI-Powered Block Planning
          </p>
        </div>

        <nav className="space-y-2">

          <button
            onClick={() => setView("Weekly")}
            className="w-full text-left px-4 py-3 rounded-lg bg-blue-600"
          >
            Dashboard
          </button>

          <button
            onClick={() => setView("Weekly")}
            className={`w-full text-left px-4 py-3 rounded-lg ${
              view === "Weekly"
                ? "bg-slate-800"
                : "hover:bg-slate-800"
            }`}
          >
            Weekly Plan
          </button>

          <button
            onClick={() => setView("Monthly")}
            className={`w-full text-left px-4 py-3 rounded-lg ${
              view === "Monthly"
                ? "bg-slate-800"
                : "hover:bg-slate-800"
            }`}
          >
            Monthly Plan
          </button>

          <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-slate-800">
            Reports
          </button>

        </nav>

        <div className="border-t border-slate-800 mt-10 pt-6">

          <p className="text-xs text-slate-500">
            Indian Railways
          </p>

          <p className="text-xs text-slate-500 mt-1">
            Smart India Hackathon
          </p>

        </div>

      </aside>


      {/* MAIN CONTENT */}
      <main className="flex-1 p-4 md:p-8 overflow-auto min-w-0">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">

          <div>

            <h2 className="text-3xl font-bold text-slate-900">
              Control Room Dashboard
            </h2>

            <p className="text-slate-500 mt-1">
              Automatic Block Planning & Asset Management
            </p>

          </div>

          <div className="bg-white px-4 py-3 rounded-lg shadow-sm">

            <p className="text-xs text-slate-500">
              System Status
            </p>

            <p className="text-sm font-semibold text-green-600">
              ● Operational
            </p>

          </div>

        </div>


        {/* KPI CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">

          <KpiCard
            title="Asset Availability"
            value="94.8%"
            subtitle="+2.4% this month"
          />

          <KpiCard
            title="Downtime Saved"
            value="126 hrs"
            subtitle="This month"
          />

          <KpiCard
            title="Total Blocks"
            value="48"
            subtitle="Planned blocks"
          />

          <KpiCard
            title="Critical Blocks"
            value="7"
            subtitle="Needs attention"
          />

        </div>


        {/* FILTERS */}
        <div className="bg-white rounded-xl shadow-sm p-5 mb-8">

        <div className="flex flex-col md:flex-row md:items-end gap-5">

            {/* Department */}
            <div>

              <label className="block text-sm font-medium text-slate-600 mb-2">
                Department
              </label>

              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="border border-slate-300 rounded-lg px-4 py-2.5 min-w-48 outline-none focus:ring-2 focus:ring-blue-500"
              >

                <option value="All">
                  All Departments
                </option>

                <option value="Engineering">
                  Engineering
                </option>

                <option value="TD">
                  TD
                </option>

                <option value="S&T">
                  S&T
                </option>

              </select>

            </div>


            {/* Corridor */}
            <div>

              <label className="block text-sm font-medium text-slate-600 mb-2">
                Corridor
              </label>

              <select
                value={corridor}
                onChange={(e) => setCorridor(e.target.value)}
                className="border border-slate-300 rounded-lg px-4 py-2.5 min-w-52 outline-none focus:ring-2 focus:ring-blue-500"
              >

                <option value="All">
                  All Corridors
                </option>

                <option value="Delhi-Ghaziabad">
                  Delhi-Ghaziabad
                </option>

                <option value="Ghaziabad-Meerut">
                  Ghaziabad-Meerut
                </option>

                <option value="Delhi-Meerut">
                  Delhi-Meerut
                </option>

              </select>

            </div>


            {/* View Buttons */}
            <div className="ml-auto flex gap-2">

              <button
                onClick={() => setView("Weekly")}
                className={`px-5 py-2.5 rounded-lg font-medium ${
                  view === "Weekly"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                Weekly
              </button>

              <button
                onClick={() => setView("Monthly")}
                className={`px-5 py-2.5 rounded-lg font-medium ${
                  view === "Monthly"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                Monthly
              </button>

            </div>

          </div>

        </div>


        {/* WEEKLY BLOCK PLAN */}
        {view === "Weekly" && (

          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">

            <div className="flex items-center justify-between mb-6">

              <div>

                <h2 className="text-xl font-bold text-slate-800">
                  Weekly Block Plan
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  AI-optimized maintenance blocks for railway assets
                </p>

              </div>

              <div className="text-sm text-slate-500">
                07 Sep - 13 Sep 2026
              </div>

            </div>


            {/* DAYS HEADER */}
            <div className="grid grid-cols-8 border-b border-slate-200">

              <div className="p-3 font-semibold text-slate-600">
                Department
              </div>

              {[
                "Mon 7",
                "Tue 8",
                "Wed 9",
                "Thu 10",
                "Fri 11",
                "Sat 12",
                "Sun 13",
              ].map((day) => (

                <div
                  key={day}
                  className="p-3 text-center font-semibold text-slate-600 border-l border-slate-200"
                >
                  {day}
                </div>

              ))}

            </div>


            {/* DEPARTMENTS */}
            {["Engineering", "TD", "S&T"].map((dept) => (

              <div
                key={dept}
                className="grid grid-cols-8 min-h-[110px] border-b border-slate-200"
              >

                {/* Department Name */}
                <div className="p-4 flex items-center font-semibold text-slate-700">
                  {dept}
                </div>


                {/* DAYS */}
                {[
                  "2026-09-07",
                  "2026-09-08",
                  "2026-09-09",
                  "2026-09-10",
                  "2026-09-11",
                  "2026-09-12",
                  "2026-09-13",
                ].map((date) => {

                  const dayBlocks = filteredBlocks.filter(
                    (block) =>
                      block.department === dept &&
                      block.date === date
                  );

                  return (

                    <div
                      key={date}
                      className="border-l border-slate-200 p-2"
                    >

                      {dayBlocks.map((block) => (

                        /* BLOCK CARD */
                        <div
                          key={block.id}
                          className={`bg-white border-l-4 rounded-xl p-3 mb-2 shadow-sm hover:shadow-md transition ${
                            block.priority === "Critical"
                              ? "border-red-500"
                              : block.priority === "High"
                              ? "border-orange-500"
                              : block.priority === "Medium"
                              ? "border-yellow-500"
                              : "border-green-500"
                          }`}
                        >

                          {/* Corridor */}
                          <p className="text-xs font-semibold text-slate-500">
                            {block.corridor}
                          </p>

                          {/* Work */}
                          <p className="text-sm font-bold text-slate-800 mt-1">
                            {block.work}
                          </p>

                          {/* Asset */}
                          <p className="text-xs text-slate-500 mt-1">
                            Asset: {block.asset}
                          </p>

                          {/* Time */}
                          <p className="text-xs font-semibold text-slate-700 mt-2">
                            Time: {block.start} - {block.end}
                          </p>

                          {/* Priority */}
                          <div className="mt-2">
                            <PriorityBadge
                              priority={block.priority}
                            />
                          </div>

                        </div>

                      ))}

                    </div>

                  );

                })}

              </div>

            ))}

          </section>

        )}


        {/* MONTHLY PLAN */}
        {view === "Monthly" && (

          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">

            <div className="flex items-center justify-between mb-6">

              <div>

                <h2 className="text-xl font-bold text-slate-800">
                  Monthly Block Plan
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  September 2026 maintenance overview
                </p>

              </div>

              <div className="text-sm text-slate-500">
                September 2026
              </div>

            </div>


            {/* CALENDAR HEADER */}
            <div className="grid grid-cols-7 border-t border-l border-slate-200">

              {[
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday",
              ].map((day) => (

                <div
                  key={day}
                  className="p-3 text-center font-semibold text-slate-600 border-r border-b border-slate-200"
                >
                  {day}
                </div>

              ))}

            </div>


            {/* CALENDAR */}
            <div className="grid grid-cols-7 border-l border-slate-200">

              {Array.from({ length: 30 }, (_, index) => {

                const day = index + 1;

                const date =
                  `2026-09-${String(day).padStart(2, "0")}`;

                const dateBlocks =
                  filteredBlocks.filter(
                    (block) => block.date === date
                  );

                return (

                  <div
                    key={day}
                    className="min-h-[130px] border-r border-b border-slate-200 p-2"
                  >

                    <div className="text-sm font-bold text-slate-700 mb-2">
                      {day}
                    </div>

                    {dateBlocks.map((block) => (

                      <div
                        key={block.id}
                        className="bg-slate-50 border border-slate-200 rounded-lg p-2 mb-2"
                      >

                        <p className="text-xs font-semibold text-slate-700">
                          {block.department}
                        </p>

                        <p className="text-xs text-slate-500 mt-1">
                          {block.corridor}
                        </p>

                        <p className="text-xs font-semibold text-slate-800 mt-1">
                          {block.start} - {block.end}
                        </p>

                        <div className="mt-1">
                          <PriorityBadge
                            priority={block.priority}
                          />
                        </div>

                      </div>

                    ))}

                  </div>

                );

              })}

            </div>

          </section>

        )}


        {/* CHARTS */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">

          {/* PRIORITY CHART */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">

            <h2 className="text-lg font-bold text-slate-800">
              Priority Distribution
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Distribution of planned blocks by priority
            </p>

            <div className="h-72 mt-4">

              <ResponsiveContainer width="100%" height="100%">

                <PieChart>

                  <Pie
                    data={filteredPriorityData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    label
                  >

                    {priorityData.map((entry, index) => (

                      <Cell
                        key={`cell-${index}`}
                        fill={priorityColors[index]}
                      />

                    ))}

                  </Pie>

                  <Tooltip />

                  <Legend />

                </PieChart>

              </ResponsiveContainer>

            </div>

          </section>


          {/* DEPARTMENT CHART */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">

            <h2 className="text-lg font-bold text-slate-800">
              Department-wise Blocks
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Number of planned blocks by department
            </p>

            <div className="h-72 mt-4">

              <ResponsiveContainer width="100%" height="100%">

                <BarChart data={filteredDepartmentData}>

                  <XAxis dataKey="name" />

                  <YAxis />

                  <Tooltip />

                  <Bar
                    dataKey="blocks"
                    fill="#2563eb"
                    radius={[6, 6, 0, 0]}
                  />

                </BarChart>

              </ResponsiveContainer>

            </div>

          </section>

        </div>

      </main>

    </div>
  );
}


// =====================================
// KPI CARD
// =====================================

function KpiCard({
  title,
  value,
  subtitle,
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <h3 className="text-3xl font-bold text-slate-900 mt-2">
            {value}
          </h3>

        </div>

        <div className="text-2xl">

          {title === "Asset Availability" && "🛠️"}

          {title === "Downtime Saved" && "⏱️"}

          {title === "Total Blocks" && "📋"}

          {title === "Critical Blocks" && "⚠️"}

        </div>

      </div>

      <div className="mt-4 pt-3 border-t border-slate-100">

        <p className="text-xs text-slate-500">
          {subtitle}
        </p>

      </div>

    </div>
  );
}


// =====================================
// PRIORITY BADGE
// =====================================

function PriorityBadge({ priority }) {

  const styles = {
    Critical:
      "bg-red-100 text-red-700 border-red-200",

    High:
      "bg-orange-100 text-orange-700 border-orange-200",

    Medium:
      "bg-yellow-100 text-yellow-700 border-yellow-200",

    Low:
      "bg-green-100 text-green-700 border-green-200",
  };

  return (

    <span
      className={`inline-block text-xs font-semibold px-2 py-1 rounded-md border ${
        styles[priority]
      }`}
    >
      {priority}
    </span>

  );
}


export default App;