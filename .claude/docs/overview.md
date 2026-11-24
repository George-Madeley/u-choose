# u-choose: Project Overview & Roadmap

Living document. Update the status checkboxes and the "Open decisions" section as things change.

## 1. Product summary

Group restaurant picker. A host creates a **session** and invites others with a link or QR code. Each participant swipes through restaurant cards near the session location: right = like, left = dislike, up = favourite. The session ends after a time limit or when everyone has finished. Restaurants are then ranked by votes.

## 2. Key decisions & recommendations

### 2.1 Restaurant data API

| Option                      | Verdict                                                                                                                                                                                                                                                                    |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Google Places API (New)** | **Recommended.** Best global coverage. Has photos, rating, price level, cuisine types, opening hours and up to 5 reviews. Billing is pay-per-request per SKU with a free monthly allowance per SKU. Cost is controlled by _field masks_: request only the fields you need. |
| Foursquare Places           | Possible fallback or cost-saver. Has a free tier, but photos and tips cost extra and coverage outside cities is weaker.                                                                                                                                                    |
| Tripadvisor Content API     | Limited (about 5 reviews and 5 photos per place) and has strict display rules.                                                                                                                                                                                             |
| Yelp Fusion                 | No longer free for commercial use. Strict display and caching rules.                                                                                                                                                                                                       |
| OpenTable                   | No public API. Partner-only, and it is for bookings, not discovery. Could be a later "Book a table" integration.                                                                                                                                                           |
| Yellow Pages / OSM          | No usable commercial API (Yellow Pages). OSM is free but has no photos or ratings.                                                                                                                                                                                         |

Rules to design around (check the current Google Maps Platform terms):

- **Never call Places from the client with an unrestricted key.** Make the calls from a backend (Cloud Functions) so the key stays secret and you can rate-limit and cache.
- Caching: you may store `place_id` indefinitely. Other Places content is restricted, so refetch it rather than storing it long-term.
- Show the required Google attribution, and credit review authors.
- **Fetch one candidate pool per session, not per user.** All participants swipe the same pool, which divides API cost by the group size. Nearby Search returns at most 20 results per call, so you may need to combine calls (for example several cuisine types, or Text Search with pagination).
- Photos are a separate, comparatively expensive SKU. Load them lazily, only for the card currently shown and the next one or two.
- Set budget alerts and per-day quota caps in Google Cloud from day one.

### 2.2 Platform architecture

- **Frontend:** the existing React Router (SPA) + MUI app, shared by web and mobile. Tauri is only a shell (Android/iOS/desktop). Design mobile-first. The current Toolpad `DashboardLayout` probably does not suit a swipe UI, so replace it for session screens.
- **Web hosting:** Firebase Hosting. This also serves the deep-link verification files (2.4).
- **Backend:** Firebase. Auth, the Realtime Database for live session state, and **Cloud Functions** for:
  - the Places proxy
  - session creation and short join codes
  - ending sessions (on a timer or when all users are done) and computing the ranking
  - deleting accounts
    Cloud Functions require the Blaze (pay-as-you-go) plan.
- **Firebase App Check:** protects the Functions and database from abuse by anyone who copies your config.
- **Location:** browser Geolocation on web. On mobile, the Tauri geolocation plugin, plus a manual address/postcode fallback (geocoded on the backend).

### 2.3 Auth

- **Guest:** Firebase Anonymous Auth. Later, upgrade to a full account with `linkWithCredential` so the guest's favourites and history carry over.
- **Google + Facebook OAuth.** Mobile catch: Google blocks OAuth inside embedded webviews, and `signInWithPopup` does not work in Tauri. On mobile, use the system browser (or native sign-in), receive a deep link back into the app, then call `signInWithCredential`. Budget real time for this.
- **⚠ Apple rule (App Store guideline 4.8):** an app that offers Google/Facebook login must also offer an equivalent privacy-focused option, in practice **Sign in with Apple**. Plan to add it at least on iOS.
- **Facebook Login** needs a Meta developer app, a privacy policy URL, a data-deletion callback/URL and app review.
- Replace the template credentials sign-in (`app/routes/auth.signin.tsx` has demo defaults).

### 2.4 Sharing: links & QR codes

- Own a domain (for example `uchoose.app`). Use session links like `https://<domain>/s/<code>`.
- **iOS Universal Links** (`apple-app-site-association`) and **Android App Links** (`assetlinks.json`), served from the domain. If the app is installed the link opens it; otherwise it opens the website. The QR code just encodes the same URL.
- Firebase Dynamic Links has been shut down. Do not use it.
- Use short human-friendly join codes (for example 6 characters) mapped to session IDs. The current 20-character push keys are not typeable.
- In Tauri, use the deep-link plugin to receive these links.

### 2.5 Ads / monetisation

- **⚠ Policy risk:** ad networks (AdMob/AdSense) forbid encouraging or accidental clicks. Making "swipe right" open the ad is likely to be treated as an invalid click. Native ads must also be clearly labelled "Ad" and show an AdChoices badge. Read the AdMob native ad policies before building this.
- AdMob has no official Tauri plugin, so it would need a custom native (Kotlin/Swift) plugin. Ads rendered inside a webview have their own rules (Google's WebView API for Ads / AdSense).
- **Recommended path:**
  1. Launch with **sponsored restaurant cards** (restaurants pay to appear, clearly marked "Sponsored"). Swiping right on a sponsored card is then a real vote, and tapping can open their page. This avoids ad-network policy and fits the product.
  2. Then add a standard ad network in policy-safe placements (for example a banner on the results or lobby screen, or a native card that opens only on an explicit tap of its call-to-action button).
  3. Optional: a paid "no ads / premium" tier.
- Ads in the UK/EEA need a certified consent tool (Google's UMP). iOS needs an App Tracking Transparency prompt if you track.

### 2.6 Session lifecycle & data model (sketch)

`lobby → swiping → finished`

    sessions/{id}: { code, hostUid, location, radius, status, createdAt, endsAt,
                     candidatePlaceIds[], participants/{uid}: { done, filters } }
    votes/{sessionId}/{uid}/{placeId}: like | dislike | favourite
    results/{sessionId}: ranked [{ placeId, likes, favourites, score }]
    users/{uid}: { profile, preferences (default filters) }
    favourites/{uid}/{placeId}: true

- **Filters** (radius, minimum stars, price range, cuisine): the host's filters build the shared pool. Each user's filters only hide cards from their own deck. Decide whether a hidden card counts as a dislike or as an abstention.
- **Favourites:** swiping up stores the `place_id` against the user. In future sessions, if a favourite is in the pool and passes the user's filters, it is automatically counted as a like and skipped in their deck.
- **Ranking:** score = likes (+ a bonus for favourites). Tie-break on rating, then distance. Compute it in a Cloud Function so clients can't tamper with it.
- **Security rules:** the current `database.rules.json` is open to everyone and its expiry date has already passed. Write real rules: participants read their own session, write only their own votes, and only Functions write results.

## 3. Roadmap

Each phase should end with something usable.

### Phase 0: Foundations

- [ ] Secure the database rules and set up the Firebase emulators for local development
- [ ] Upgrade to the Blaze plan with budget alerts. Set up the Cloud Functions project (TypeScript)
- [ ] Buy a domain and connect it to Firebase Hosting
- [ ] Set up a Google Cloud project with the Places API (New) and a restricted, server-only key

### Phase 1: Core MVP (web only)

- [ ] Anonymous/guest auth
- [ ] Create a session (location + host filters) and join it by code or link
- [ ] Places proxy Function: build the candidate pool, store place IDs
- [ ] Card deck with swipe left/right/up gestures (a library such as `react-tinder-card` or a custom implementation)
- [ ] Card content: photo carousel, name, rating, price, address, reviews, attribution
- [ ] Session end (timer or everyone finished) and a results screen with the ranking
- [ ] Lobby showing participants in real time

### Phase 2: Accounts & personalisation

- [ ] Google + Facebook OAuth on web; link a guest account to a full account
- [ ] Profile and saved default filters
- [ ] Favourites list and automatic likes in later sessions
- [ ] Session history
- [ ] Account deletion (in-app, plus a public web page; both stores require this)

### Phase 3: Sharing & polish

- [ ] QR code generation, share sheet
- [ ] Universal Links / App Links files hosted
- [ ] Empty, error and offline states; loading skeletons
- [ ] Analytics (Firebase Analytics) and crash reporting

### Phase 4: Mobile (Tauri Android/iOS)

- [ ] `tauri android init` / `tauri ios init`. iOS needs a Mac with Xcode, or a macOS CI runner
- [ ] Deep-link plugin, geolocation plugin, OAuth via the system browser, Sign in with Apple
- [ ] App icons, splash screen, safe-area handling
- [ ] Add mobile builds to the CI release workflow

### Phase 5: Monetisation

- [ ] Sponsored listings: data model, "Sponsored" label, how the cards are mixed into the deck
- [ ] Consent tool (UMP) and ad network integration in policy-safe placements
- [ ] Optional premium tier (in-app purchases go through the stores)

### Phase 6: Legal & compliance (start early, finish before launch)

- [ ] Privacy policy and terms of service, hosted on the domain
- [ ] UK GDPR: lawful basis, data retention (delete old sessions automatically), user rights. ICO data protection fee registration
- [ ] Decide on a business structure (sole trader vs Ltd) for liability and ad/store payouts
- [ ] Compliance with the Google Maps Platform terms and the attribution audit
- [ ] Cookie/ads consent (UK/EEA), App Tracking Transparency (iOS)
- [ ] Age rating; minimum age in the terms

### Phase 7: Release

- [ ] **Google Play:** developer account (one-off fee). New personal accounts must run a **closed test with at least 12 testers for 14 days** before they can publish to production. Fill in the Data safety form
- [ ] **Apple App Store:** Developer Program (annual fee). TestFlight beta, App Privacy labels, review. Organisation accounts need a D-U-N-S number
- [ ] Store listings: screenshots, description, privacy URL, support URL
- [ ] Web launch on the domain

### Phase 8: Post-launch

- [ ] Monitor API cost per session and tune field masks and caching
- [ ] Gather feedback; possible "book a table" integration (OpenTable partner programme or similar)

## 4. Open decisions

- Is Sign in with Apple acceptable (needed for iOS approval)?
- Sponsored listings vs ad network first?
- Does a card hidden by a user's own filters count as a dislike or an abstention?
- Default session length and maximum group size?
- Domain name?

## 5. Risks

- **API cost growth.** Mitigate with one shared pool per session, field masks, lazy photo loading and quota caps.
- **OAuth inside Tauri mobile** is the hardest technical piece. Build a proof of concept early in Phase 4.
- **Ad policy violations** can get the ad account banned. Prefer sponsored listings.
- **Store rejection.** Common causes: no Sign in with Apple, no account deletion, missing privacy info.
