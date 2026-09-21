"use strict";

async function reverseGeocode(lat, lon) {
  let data = null;

  // Attempt 1: Nominatim OpenStreetMap
  try {
    const resp = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'JPStore-Ecommerce/1.0 (contact@jpstore.com)'
        },
        signal: AbortSignal.timeout(5000)
      }
    );
    if (resp.ok) {
      data = await resp.json();
    }
  } catch (err) {
    console.warn('[Geocode] Nominatim reverse geocode error:', err.message);
  }

  // Attempt 2: BigDataCloud client API fallback
  if (!data || !data.address) {
    try {
      const resp2 = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&localityLanguage=en`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (resp2.ok) {
        const bdc = await resp2.json();
        return {
          pincode: bdc.postcode || '',
          city: bdc.city || bdc.locality || '',
          state: bdc.principalSubdivision || '',
          area: bdc.locality || '',
          flat: '',
          formatted: [bdc.locality, bdc.city, bdc.principalSubdivision, bdc.postcode].filter(Boolean).join(', ')
        };
      }
    } catch (err2) {
      console.warn('[Geocode] BigDataCloud fallback error:', err2.message);
    }
  }

  if (!data || !data.address) {
    return null;
  }

  const addr = data.address || {};
  const city = addr.city || addr.town || addr.city_district || addr.county || '';
  const state = addr.state || addr.state_district || '';
  const pincode = addr.postcode || '';
  const area = [addr.suburb, addr.neighbourhood, addr.quarter, addr.road].filter(Boolean).slice(0, 2).join(', ');
  const flat = [addr.house_number, addr.building, addr.amenity].filter(Boolean).join(' ') || '';

  return {
    pincode,
    city,
    state,
    area,
    flat,
    formatted: data.display_name || [area, city, state, pincode].filter(Boolean).join(', ')
  };
}

async function lookupPincode(cleanPin) {
  const resp = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`, {
    signal: AbortSignal.timeout(5000)
  });
  if (!resp.ok) {
    throw new Error('Postal API unavailable');
  }
  const data = await resp.json();
  if (!Array.isArray(data) || data[0]?.Status !== 'Success' || !data[0]?.PostOffice?.length) {
    return null;
  }

  const po = data[0].PostOffice[0];
  return {
    valid: true,
    pincode: cleanPin,
    city: po.District || po.Division || po.Circle || '',
    state: po.State || '',
    district: po.District || '',
    country: 'India',
    areas: data[0].PostOffice.map(p => p.Name)
  };
}

module.exports = {
  reverseGeocode,
  lookupPincode
};
