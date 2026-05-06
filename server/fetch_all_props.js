require('dotenv').config();
const { fetchGlobalData } = require('./services/uplistingService');

async function run() {
  try {
    const res = await fetchGlobalData('/properties');
    const props = res.data.data || res.data;
    console.log(JSON.stringify(props.map(p => ({ id: p.id, title: p.attributes.title, nickname: p.attributes.nickname })), null, 2));
  } catch (e) {
    console.error("Failed to fetch props");
  }
}
run();
