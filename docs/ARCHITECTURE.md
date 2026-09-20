# Architecture & platform decision

## Web app first, native wrapper later

**v1 plan: mobile-first web app (React PWA), wrapped into an Android/iOS
app with Capacitor once the core experience is proven.**

### Why not build native (React Native / Kotlin / Swift) from day one?

The two hardest, most novel parts of this product are:

1. Real-time pitch detection from the mic (Practice screen)
2. A conversational agent that can reason about ragas/technique (Coach screen)

Neither of those benefits from being native. The Web Audio API
(`getUserMedia` + `AudioContext` + `AnalyserNode`) gives solid real-time
mic access and pitch analysis in any modern mobile browser, with no
native audio module to write, build, and debug per platform. That lets
the team spend its effort on the pitch-detection *algorithm* (Rohit,
Sarath) instead of on native audio plumbing (AVAudioEngine on iOS,
AudioRecord/Oboe on Android). It also means everyone — frontend, backend,
and the audio work — is in one language (JS), which matters more for a
small team than for a large one.

A web app is also just faster to get in front of real students/testers:
no App Store review, no TestFlight/Play internal-testing setup, share a
link and get feedback the same day. (The reference build in the planning
doc — a singing-practice web app built in ~2 days — is evidence this
stack is workable for exactly this problem.)

### Trade-offs to go in with eyes open

- **Background audio**: mobile browsers throttle/suspend audio when the
  screen locks or the tab backgrounds. This matters for a tanpura drone
  running under a riyaaz session. Mitigate with the Page Visibility API,
  `navigator.wakeLock`, and the Media Session API; it won't be as
  seamless as a native background-audio session until we wrap natively.
- **Discoverability**: Indian users searching "Virtual Guru" would expect
  a Play Store listing. A PWA can be "Added to Home Screen" as a stopgap,
  but a store listing needs the native wrapper step below.
- **Mic latency**: native audio APIs have marginally lower latency than
  Web Audio, but it's not large enough to block a pitch-tracking tuner-
  style feature — plenty of shipped web-based tuners prove this out.

### Path to Android/iOS: Capacitor

Once Practice + Coach are solid on the web, wrap the same codebase with
**[Capacitor](https://capacitorjs.com/)** (from the Ionic team, the
modern successor to Cordova/PhoneGap):

- Takes the built web app almost unchanged and produces a real Android
  Studio / Xcode project you can ship to the Play Store / App Store.
- Gives access to native plugins where the web falls short — background
  audio, push notifications, haptics, filesystem — added incrementally,
  only where needed.
- Doesn't require a rewrite or a second UI codebase.

**Immediate, zero-effort stopgap**: because the frontend is already a
PWA (`frontend/public/manifest.webmanifest`), users can "Add to Home
Screen" today on Android or iOS and get an app-like icon/launch
experience with no store listing needed, while Capacitor packaging
happens in parallel.

### Alternative considered: React Native (Expo)

Would give closer-to-native performance and background audio out of the
box, at the cost of the mic/pitch-detection pipeline needing a native
audio module (e.g. a custom native module or a library such as
`react-native-audio-api`) instead of the browser's built-in APIs — more
upfront setup for the exact piece of the product that's already the
hardest part. Worth revisiting if background riyaaz sessions and native
feel turn out to matter more than we expect once we have real users —
but not the recommended v1 starting point.
