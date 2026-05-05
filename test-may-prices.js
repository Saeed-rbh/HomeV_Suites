async function check() {
  const res = await fetch("http://localhost:5000/api/properties/254188");
  const json = await res.json();
  const calendarRates = json.data.calendarRates || {};
  
  console.log("Daily Prices for May 2026:");
  Object.keys(calendarRates).sort().forEach(date => {
    if (date.startsWith("2026-05")) {
      console.log(`${date}: $${calendarRates[date]}`);
    }
  });
}
check();
