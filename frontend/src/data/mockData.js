export const blocks = [
    {
      id: 1,
      department: "Engineering",
      corridor: "Delhi-Ghaziabad",
      date: "2026-09-07",
      start: "10:00",
      end: "14:00",
      priority: "Critical",
      asset: "Rail Track",
      work: "Track Maintenance",
    },
    {
      id: 2,
      department: "TD",
      corridor: "Ghaziabad-Meerut",
      date: "2026-09-08",
      start: "09:00",
      end: "12:00",
      priority: "High",
      asset: "OHE",
      work: "OHE Inspection",
    },
    {
      id: 3,
      department: "S&T",
      corridor: "Delhi-Ghaziabad",
      date: "2026-09-09",
      start: "13:00",
      end: "16:00",
      priority: "Medium",
      asset: "Signal System",
      work: "Signal Maintenance",
    },
    {
      id: 4,
      department: "Engineering",
      corridor: "Delhi-Meerut",
      date: "2026-09-10",
      start: "08:00",
      end: "11:00",
      priority: "High",
      asset: "Rail Track",
      work: "Rail Grinding",
    },
    {
      id: 5,
      department: "TD",
      corridor: "Delhi-Meerut",
      date: "2026-09-11",
      start: "11:00",
      end: "15:00",
      priority: "Critical",
      asset: "Traction Equipment",
      work: "Equipment Repair",
    },
  ];
  
  export const priorityData = [
    {
      name: "Critical",
      value: 7,
    },
    {
      name: "High",
      value: 15,
    },
    {
      name: "Medium",
      value: 18,
    },
    {
      name: "Low",
      value: 8,
    },
  ];
  
  export const departmentData = [
    {
      name: "Engineering",
      blocks: 20,
    },
    {
      name: "TD",
      blocks: 16,
    },
    {
      name: "S&T",
      blocks: 12,
    },
  ];
  
  export const priorityColors = [
    "#dc2626",
    "#f97316",
    "#eab308",
    "#22c55e",
  ];