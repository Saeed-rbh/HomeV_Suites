async function check() {
  const res = await fetch("http://localhost:5000/api/properties/254188");
  const json = await res.json();
  console.log("FEES ARRAY:", JSON.stringify(json.data.fees, null, 2));
}
check();
