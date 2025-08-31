import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import User, { IUserDocument } from '../models/User';
import { UserRole } from '../types';

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env['GOOGLE_CLIENT_ID'] || '',
  clientSecret: process.env['GOOGLE_CLIENT_SECRET'] || '',
  callbackURL: process.env['GOOGLE_CALLBACK_URL'] || '/api/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists with this Google ID
    let user = await User.findOne({ googleId: profile.id });
    
    if (user) {
      return done(null, user);
    }

    // Check if user exists with same email
    user = await User.findOne({ email: profile.emails?.[0]?.value });
    
    if (user) {
      // Link Google account to existing user
      user.googleId = profile.id;
      user.isEmailVerified = true;
      await user.save();
      return done(null, user);
    }

    // Create new user
    const newUser = new User({
      googleId: profile.id,
      email: profile.emails?.[0]?.value,
      firstName: profile.name?.givenName || 'Unknown',
      lastName: profile.name?.familyName || 'User',
      avatar: profile.photos?.[0]?.value,
      role: UserRole.STUDENT,
      isEmailVerified: true
    });

    await newUser.save();
    return done(null, newUser);

  } catch (error) {
    return done(error, undefined);
  }
}));

// JWT Strategy
passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env['JWT_SECRET'] || '',
}, async (payload, done) => {
  try {
    const user = await User.findById(payload.userId);
    if (user) {
      return done(null, {
        userId: user._id,
        email: user.email,
        role: user.role
      });
    }
    return done(null, false);
  } catch (error) {
    return done(error, false);
  }
}));

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
