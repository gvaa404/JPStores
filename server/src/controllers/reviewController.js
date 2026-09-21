"use strict";

const getReviews = (req, res) => {
  res.json([]);
};

const addReview = (req, res) => {
  try {
    const { rating, comment } = req.body;
    res.json({ ok: true, message: 'Review submitted successfully!' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

module.exports = {
  getReviews,
  addReview
};
