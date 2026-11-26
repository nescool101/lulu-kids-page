# Donor codes and Play declarations (owner)

Not deployed (`.vercelignore`). This repo is public: never write a code or the salt here.

## Send a code (manual)

1. Mail arrives at nescool101@gmail.com with app version + receipt (or name/email).
2. Confirm the money in PayPal / Ko-fi (not only the screenshot).
3. In the **app** repo: `tools/gen_code.sh <version>` (version exactly as the donor's, e.g. `x.y.z`; same salt as the shipped build).
4. Reply privately with the `Code:` line only (the script also prints the salt).
5. Reinstall / new device: repeat for the current version.

One code per version, shared by all donors of that version. Not single-use.

Reply template:
> ES: ¡Gracias! Tu código: ______. En la app: Info → Código de donante → Quitar anuncios. Por favor no lo publiques.
> EN: Thank you! Your code: ______. In the app: Info → Donor code → Remove ads. Please do not post it.

## Play Console (App content), submit with the release that has ads

| Declaration | Answer |
| --- | --- |
| Privacy policy | https://lulu-kids-page.vercel.app/privacy.html |
| Ads | **Yes, contains ads** |
| Advertising ID | **No** (AD_ID permission removed) |
| In-app purchases | None. Create no products. |
| Target audience / Families | Children; ads from AdMob only, child-directed, rated G, non-personalized |
| App access | If review asks how to remove ads, give a code privately in the reviewer notes |

Data safety, from [Google's AdMob disclosure](https://developers.google.com/admob/android/privacy/play-data-disclosure)
(check it again when the SDK is updated). Collects or shares data: **Yes**. Encrypted in transit: **Yes**.

| Data type | Why it applies | Collected + shared | Purposes |
| --- | --- | --- | --- |
| Location > Approximate | IP address (our mapping: may estimate location) | Yes, required | Advertising, Analytics, Fraud prevention |
| App activity > App interactions | launches, taps, video views | same | same |
| App info and performance > Crash logs, Diagnostics | SDK diagnostics | same | same |
| Device or other IDs | app set ID etc. (no ad ID) | same | same |

Ephemeral processing: No. Deletion requests: your answer; the policy offers deletion of donor emails on request.

Store listing (live text says "no data collected"): remove that, any price and "full version". Do not mention
donations or codes in the listing. Suggested:
- ES: `Gratis, con anuncios aptos para niños solo entre juegos. Sin compras. Funciona sin conexión.`
- EN: `Free, with child-safe ads only between games. No purchases. Works offline.`

## Policy risk (read before release)

Google Play [Payments policy](https://support.google.com/googleplay/android-developer/answer/9858738): in-app
features normally must be sold through Play Billing, and apps may not steer users to other payment methods
(regional exceptions exist). Donate buttons + a code that removes ads is likely to be read that way:
rejection or removal risk. A parent gate does not change it.

## Automation (proposal, not built)

Worth it only if manual replies become a chore. Ko-fi webhook -> one Vercel function: check Ko-fi's
verification token, mail the current release code (Vercel env var set per release; no salt on the server, no
secret in the app) to the payer's email via the existing nodemailer setup. PayPal.me stays manual.
The `/api/redeem` + `/api/codes` draft is not used: shipped builds never call it, and it would need a
secret inside the APK.
