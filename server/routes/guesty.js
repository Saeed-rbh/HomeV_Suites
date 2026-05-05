const express = require('express');
const router = express.Router();
const axios = require('axios'); // We need to install axios or use fetch

// We will use native fetch for simplicity (available in Node 18+)

// Proxy for getting properties/listings
router.get('/properties', async (req, res) => {
    try {
        // This is where we will call Guesty Open API
        // const response = await fetch('https://open-api.guesty.com/v1/listings', {
        //   headers: {
        //     Authorization: `Bearer ${process.env.GUESTY_BEARER_TOKEN}`
        //   }
        // });
        // const data = await response.json();

        // Mock response for now
        res.json({ success: true, message: 'Proxy route: Fetched properties from Guesty', properties: [] });
    } catch (error) {
        console.error('Error fetching properties from Guesty:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// Proxy for creating reservations
router.post('/reservations', async (req, res) => {
    try {
        const reservationData = req.body;

        // Call Guesty API
        // const response = await fetch('https://open-api.guesty.com/v1/reservations', {
        //   method: 'POST',
        //   headers: {
        //     'Content-Type': 'application/json',
        //     Authorization: `Bearer ${process.env.GUESTY_BEARER_TOKEN}`
        //   },
        //   body: JSON.stringify(reservationData)
        // });

        res.json({ success: true, message: 'Proxy route: Created reservation on Guesty' });
    } catch (error) {
        console.error('Error creating reservation on Guesty:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

module.exports = router;
