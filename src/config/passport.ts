// import { Request } from 'express'; // Import Request type
// import passport, { DoneCallback } from 'passport';
// import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
// import config from './config'; // Assuming config loader
// import prisma from './prisma';

// /**
//  * Google OAuth 2.0 Strategy Configuration
//  */

// // Define the verify callback function logic
// const verifyCallbackLogic = async (
//   req: Request,
//   accessToken: string,
//   refreshToken: string | undefined,
//   profile: Profile,
//   done: DoneCallback,
// ): Promise<void> => {
//   try {
//     if (!profile.emails || !profile.emails[0]) {
//       return done(new Error('Google profile did not return an email'), false);
//     }
//     const email = profile.emails[0].value;
//     const googleId = profile.id;
//     const name = profile.displayName;
//     // Potentially extract firstName/lastName if needed
//     // const firstName = profile.name?.givenName;
//     // const lastName = profile.name?.familyName;

//     // 1. Find user by Google ID
//     let user = await prisma.user.findUnique({
//       where: { googleId },
//     });

//     if (user) {
//       return done(null, user); // User found by googleId
//     }

//     // 2. If not found by googleId, find by email
//     user = await prisma.user.findUnique({
//       where: { email },
//     });

//     if (user) {
//       // User exists with this email but not linked to Google yet
//       // Link Google ID and update name if empty
//       user = await prisma.user.update({
//         where: { email },
//         data: {
//           googleId: googleId,
//           name: user.name ?? name, // Update name only if it was null
//           isVerified: true, // Mark as verified via Google
//         },
//       });
//       return done(null, user);
//     }

//     // 3. If not found by email either, create a new user
//     user = await prisma.user.create({
//       data: {
//         email: email,
//         googleId: googleId,
//         name: name,
//         isVerified: true, // Verified via Google
//         // passwordHash remains null
//       },
//     });
//     return done(null, user);
//   } catch (error) {
//     return done(error);
//   }
// };

// // Create the strategy instance
// const googleStrategy = new GoogleStrategy(
//   {
//     // Options
//     clientID: config.google.clientId,
//     clientSecret: config.google.clientSecret,
//     callbackURL: config.google.callbackUrl,
//     scope: ['profile', 'email'],
//     passReqToCallback: true,
//   },
//   // Use 'as any' to bypass the type signature mismatch
//   verifyCallbackLogic as any,
// );

// passport.use(googleStrategy);

// // Note: Serialization/deserialization are not strictly needed for stateless JWT
// // but are included here for completeness if using sessions elsewhere.
// passport.serializeUser((user: any, done: DoneCallback) => {
//   // Add type to done
//   done(null, user.id);
// });

// passport.deserializeUser(async (id: string, done: DoneCallback) => {
//   // Add type to done
//   try {
//     const user = await prisma.user.findUnique({ where: { id } });
//     done(null, user);
//   } catch (error) {
//     done(error);
//   }
// });

// export default passport;
