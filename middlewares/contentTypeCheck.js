module.exports = (req, res, next) => {
  if ((req.method === 'POST' || req.method === 'PUT') &&
      req.headers['content-type'] !== 'application/json') {
    return res.status(415).json({ error: 'Chỉ chấp nhận application/json' });
  }
  next();
};
