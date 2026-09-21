"use strict";

const { qAll, qRun } = require('../database');

const createTicket = (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }
    const info = qRun(
      'INSERT INTO support_tickets (name, email, subject, message) VALUES (?, ?, ?, ?)',
      [name.trim(), email.trim(), subject ? subject.trim() : 'General Inquiry', message.trim()]
    );
    res.json({
      ok: true,
      ticketId: info.lastInsertRowid,
      message: 'Thank you for reaching out! Your inquiry has been received. Our Pretty Picks concierge team will get back to you within 24 hours.'
    });
  } catch (e) {
    console.error('Support ticket error:', e);
    res.status(500).json({ error: e.message });
  }
};

const getTickets = (req, res) => {
  try {
    const tickets = qAll('SELECT * FROM support_tickets ORDER BY id DESC');
    res.json(tickets);
  } catch (e) {
    console.error('Get support tickets error:', e);
    res.status(500).json({ error: e.message });
  }
};

module.exports = {
  createTicket,
  getTickets
};
