module.exports = function requireLogin(req, res, next) {
  const sessionId =
    req.headers["x-session-id"] ||
    req.query.sessionId ||
    req.body.sessionId;

  if (!sessionId || !sessions[sessionId]) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized",
    });
  }

  // update last access
  sessions[sessionId].lastAccess = new Date();
  req.user = sessions[sessionId];

  next();
};
