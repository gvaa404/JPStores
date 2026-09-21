"use strict";

const { reverseGeocode, lookupPincode } = require('../services/geocodeService');

const reverseGeocodeEndpoint = async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ error: 'Latitude and Longitude are required' });
    }

    const result = await reverseGeocode(lat, lon);
    if (!result) {
      return res.status(404).json({ error: 'Could not resolve address from coordinates' });
    }

    res.json(result);
  } catch (e) {
    console.error('Reverse geocode error:', e);
    res.status(500).json({ error: e.message });
  }
};

const lookupPincodeEndpoint = async (req, res) => {
  try {
    const { pincode } = req.params;
    const cleanPin = String(pincode || '').replace(/\D/g, '');
    if (cleanPin.length !== 6) {
      return res.status(400).json({ error: 'PIN code must be 6 digits' });
    }

    const result = await lookupPincode(cleanPin);
    if (!result) {
      return res.status(404).json({ error: 'Unrecognized PIN code' });
    }

    res.json(result);
  } catch (e) {
    console.error('Pincode lookup error:', e);
    const status = e.message === 'Postal API unavailable' ? 502 : 500;
    res.status(status).json({ error: e.message });
  }
};

module.exports = {
  reverseGeocode: reverseGeocodeEndpoint,
  lookupPincode: lookupPincodeEndpoint
};
