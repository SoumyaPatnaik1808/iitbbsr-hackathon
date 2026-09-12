const jwt = require('jsonwebtoken');

// Verify Supabase JWT
const verifyAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];
  const jwtSecret = process.env.SUPABASE_JWT_SECRET;

  if (!jwtSecret) {
    console.error("SUPABASE_JWT_SECRET is not defined in env");
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    // Supabase signs JWTs with HS256 and the project JWT secret
    const decoded = jwt.verify(token, jwtSecret);
    
    // Attach the decoded user information to the request
    // Supabase JWTs contain the user ID in the 'sub' claim
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };
    
    next();
  } catch (error) {
    console.error("JWT Verification failed:", error.message);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

module.exports = { verifyAuth };
