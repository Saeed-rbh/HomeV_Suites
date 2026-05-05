const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const axios = require('axios');

const API_KEY = process.env.UPLISTING_API_KEY;
if (!API_KEY) {
  console.error("Error: UPLISTING_API_KEY is not defined in .env");
  process.exit(1);
}

const authHeader = `Basic ${Buffer.from(API_KEY).toString('base64')}`;

const headers = {
  'Authorization': authHeader,
  'Content-Type': 'application/json'
};

const BASE_URL = 'https://connect.uplisting.io/hooks';
const EVENTS = [
  'property_created',
  'property_updated',
  'property_removed',
  'booking_created',
  'booking_updated',
  'booking_removed'
];

async function listWebhooks() {
  try {
    const response = await axios.get(BASE_URL, { headers });
    console.log("Current Registered Webhooks:");
    const webhooks = response.data.data || response.data;
    if (webhooks.length === 0) {
      console.log("  None.");
    } else {
      webhooks.forEach(hook => {
        const id = hook.id || hook.uuid || "unknown_id";
        const target = hook.attributes?.target_url || hook.target_url || "unknown_url";
        const event = hook.attributes?.event || hook.event || "unknown_event";
        console.log(`  - [${id}] Event: ${event} -> ${target}`);
      });
    }
    return webhooks;
  } catch (error) {
    console.error("Failed to list webhooks:", error.response?.data || error.message);
    return [];
  }
}

async function registerWebhooks(targetUrl) {
  if (!targetUrl) {
    console.error("Error: Please provide a target URL.");
    console.log("Usage: node manage_webhooks.js register <YOUR_PUBLIC_URL>");
    process.exit(1);
  }

  console.log(`Registering webhooks for target: ${targetUrl}`);
  
  for (const event of EVENTS) {
    try {
      const payload = { target_url: targetUrl, event };
      const response = await axios.post(BASE_URL, payload, { headers });
      console.log(`✅ Registered ${event}`);
    } catch (error) {
      console.error(`❌ Failed to register ${event}:`, error.response?.data || error.message);
    }
  }
}

async function deleteWebhook(id) {
  try {
    await axios.delete(`${BASE_URL}/${id}`, { headers });
    console.log(`✅ Deleted webhook ${id}`);
  } catch (error) {
    console.error(`❌ Failed to delete webhook ${id}:`, error.response?.data || error.message);
  }
}

async function main() {
  const command = process.argv[2];

  if (command === 'list') {
    await listWebhooks();
  } else if (command === 'register') {
    const targetUrl = process.argv[3];
    await registerWebhooks(targetUrl);
  } else if (command === 'delete') {
    const id = process.argv[3];
    if (!id) {
      console.error("Error: Please provide a webhook ID to delete.");
      console.log("Usage: node manage_webhooks.js delete <WEBHOOK_ID>");
      process.exit(1);
    }
    await deleteWebhook(id);
  } else {
    console.log("Uplisting Webhook Manager");
    console.log("Usage:");
    console.log("  node manage_webhooks.js list");
    console.log("  node manage_webhooks.js register <YOUR_PUBLIC_URL>");
    console.log("  node manage_webhooks.js delete <WEBHOOK_ID>");
  }
}

main();
