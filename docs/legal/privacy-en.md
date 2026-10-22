# LinguaSEA Privacy Policy

[อ่านฉบับภาษาไทย](privacy-th.md)

**Effective date:** [TBD: effective date]<br>
**Version:** 1.0

This policy explains what personal data the LinguaSEA app (iOS and Android) and its online service collect, why, who receives it, how long we keep it, and the rights you have under Thailand's Personal Data Protection Act B.E. 2562 (2019) ("PDPA"). "LinguaSEA" is the app's current name and may change.

> **In short**
>
> - You don't need to give us your name, email address or phone number to use LinguaSEA. The app identifies itself to our server with a random account ID.
> - We keep your learning progress and subscription status on our server so they can be synced and restored.
> - Recordings for pronunciation scoring are sent to Microsoft Azure to be scored and are not kept by us or by Microsoft.
> - No ads, no advertising or analytics SDKs, no tracking across other companies' apps and websites, and we don't sell personal data.
> - You can delete your data at any time in the app: **Settings → Delete my data**.

## 1. Who we are

The data controller is [TBD: operator legal name], [TBD: operator address] ("we", "us").

- Privacy questions and requests: [TBD: contact email]
- Data Protection Officer: [TBD: DPO name and contact, or delete this line]

## 2. What this policy covers

This policy covers the LinguaSEA mobile apps, the server they connect to (together, the "Service") and these web pages. The App Store, Google Play and your device's operating system are run by Apple and Google under their own privacy policies.

## 3. The personal data we process

### 3.1 Account ID and access token

The first time the app needs to save your progress online or score your pronunciation, our server creates an anonymous account for the app on your device: a random account ID and a random access token. The app keeps both in your device's secure storage (iOS Keychain or Android Keystore). Our server stores the account ID, the time the account was created and a one-way hash of the token — never the token itself. The account is not linked to your name, email address or phone number.

### 3.2 Learning progress

To sync and back up your progress, the app sends it to our server: the lessons you finished and when you first finished them; the review schedule of each word or phrase you studied (when it is next due, when you last reviewed it, how many times you reviewed or forgot it, and the other values the spaced-repetition method uses); your XP; and your streak (days in a row and the last day you studied). We store it with your account ID.

### 3.3 Subscription status

If you subscribe, you pay Apple or Google; we never see your payment card details. RevenueCat, the service that manages subscriptions for us, receives your account ID and the purchase details from the store (such as the plan, price, currency, store country, and transaction IDs and dates), together with basic technical information (such as device type, operating system, app version and IP address), to validate the purchase. RevenueCat then tells our server whether your subscription is active and when it ends. We store that end date and the time of the latest subscription event with your account ID.

### 3.4 Recordings for pronunciation scoring

When you use pronunciation scoring, the app records your voice only while you record a speaking exercise (a few seconds at a time) and sends the recording to our server, together with the sentence you were asked to say and the language you are learning. Our server converts the recording to the audio format the scoring service needs and sends it to Microsoft Azure AI Speech, which returns scores (overall, accuracy, fluency, completeness and a score for each word) and the text it recognised. We send the result back to the app to show you.

- Our server does not keep the recording or the result. The recording is held in memory and in a temporary file only for the few seconds needed to score it, and is then deleted.
- We have not turned on Azure's optional audio logging. According to Microsoft's documentation, audio sent for real-time pronunciation assessment is then processed in memory and not stored.
- The app deletes the recording from your device once it has been scored.
- We do not use recordings to identify you or to create a voiceprint.

### 3.5 Daily usage counts

To apply the daily limits of the free and Premium plans, we count how many times each day your account uses features that have a limit (currently pronunciation scoring).

### 3.6 Technical data and server logs

Like any online service, our server receives your device's IP address and the time and address (URL) of each request — for example when the app syncs your progress or downloads lesson audio.

- We use the IP address to limit how many requests one address can make (rate limiting). These counters stay in memory for at most one hour.
- Our server keeps logs with the IP address, the time, the request method and URL, the response status and time, and error details (for some errors, the account ID concerned). The logs do not contain your recordings or your access token.
- We do not use IP addresses to work out where you are.

### 3.7 When you contact us

If you email us, we receive your email address, your message and anything you include. We use it only to answer you and to keep a record of the requests we have handled.

### 3.8 Data that stays on your device

Some data is stored only in the app on your device: a copy of your progress, the language you are learning, the app's interface language, your reminder settings and the subscription status the app last saw.

- The app reads your device's language setting to choose its interface language. This is not sent to us.
- Daily study reminders are scheduled on your device. We don't use a push notification service and receive no notification token.
- When there is no audio clip for a piece of text, the app reads lesson text aloud with your device's built-in text-to-speech voice. That text is lesson content, not information about you.

### 3.9 What we don't collect

We don't collect your name, email address (unless you email us), phone number, contacts, photos, location or advertising ID. The app contains no ads, no advertising SDKs and no analytics or crash-reporting SDKs, and we don't track you across other companies' apps and websites.

## 4. Why we use your data, and our legal bases

The PDPA lets us use personal data only when we have a legal basis:

- **To provide the Service** — creating your anonymous account, syncing and restoring your progress, unlocking Premium when you subscribe, scoring your pronunciation and applying daily limits. Legal basis: necessary to perform our contract with you, the [Terms of Service](terms-en.md) (section 24(3) PDPA).
- **To keep the Service secure and working** — rate limiting, detecting and preventing abuse and fraud, investigating errors and keeping backups. Legal basis: our legitimate interest in running a secure and reliable service (section 24(5)); where the law requires us to keep certain records, compliance with a legal obligation (section 24(6)).
- **To answer your messages and requests**, including requests to exercise your rights. Legal basis: legitimate interest (section 24(5)) and legal obligation (section 24(6)).
- **To comply with the law**, for example to respond to lawful requests from authorities. Legal basis: legal obligation (section 24(6)).

We don't use your data for advertising, we don't sell it, and we don't make decisions about you based solely on automated processing that have legal or similarly significant effects. Pronunciation scores are produced automatically only to give you feedback.

If the app cannot send this data to our server (for example, when you are offline), you can still study on your device, but syncing and pronunciation scoring won't work.

## 5. Who receives your data

We share personal data only with service providers that process it for us under contract (data processors), and with the other recipients described here:

- **Cloud hosting and database provider** — [TBD: hosting and database provider], servers in Singapore. Runs our server and stores the data described in sections 3.1–3.6.
- **Microsoft Azure AI Speech** (Microsoft Corporation), Southeast Asia region (Singapore). Scores pronunciation recordings (section 3.4). We also use Azure to generate lesson audio from lesson text, which involves no personal data.
- **RevenueCat, Inc.** (United States). Manages subscriptions and validates purchases (section 3.3).
- **Our email provider**, to receive and answer your emails (section 3.7).

Apple (App Store) and Google (Google Play) process your purchases, payments and refunds as independent controllers, under their own terms and privacy policies.

We may disclose personal data when required by law, a court order or a competent authority, or to protect the rights, safety and security of our users, the public or us. If LinguaSEA is sold, merged or otherwise transferred, personal data may pass to the new operator; we will tell you in advance and make sure your data stays protected as described in this policy.

## 6. International transfers

Our server and Azure Speech run in Singapore, and RevenueCat processes data in the United States. Apple, Google and our providers may also process data in other countries where they or their sub-processors operate. We make these transfers because they are necessary to provide the Service you asked for (section 28 PDPA), and we rely on our providers' data protection terms, which include safeguards for international transfers such as standard contractual clauses (section 29). You can ask us for more information about these safeguards.

## 7. How long we keep data

- **Account, progress, subscription status and daily usage counts:** until you delete your data (section 9) or we stop providing the Service. If you delete the app without deleting your data first, the data stays on our server, linked only to the random account ID.
- **Recordings:** not kept; deleted within seconds after scoring.
- **Rate-limiting counters:** in memory for at most one hour.
- **Server logs:** up to 90 days.
- **Backups:** deleted data disappears from our live database immediately and from our backups within 30 days.
- **Emails:** up to 2 years after we finish handling your request.
- **Data on your device:** until you delete your data in the app or delete the app.
- **RevenueCat** keeps purchase history for as long as we use its service, unless we ask it to delete it. Apple and Google keep their records under their own policies.

## 8. Security

- All connections between the app and our server are encrypted with HTTPS (TLS).
- Access tokens are long random values, and our server stores only a one-way hash of them.
- Secret keys (database, Azure, RevenueCat) are kept in our hosting environment, never in the app or in our source code.
- We choose providers that encrypt stored data, and we limit access to our systems to the people who need it.
- We collect as little data as we can.

If a personal data breach is likely to put your rights and freedoms at risk, we will notify the Office of the Personal Data Protection Committee within 72 hours of becoming aware of it and, if the risk is high, tell you without undue delay, as the PDPA requires.

## 9. Your rights

Under the PDPA you have the right to:

- be informed about how we use your data (this policy);
- access your personal data and get a copy of it;
- receive your data in a commonly used, machine-readable format, and have it sent to another controller where technically possible;
- object to processing based on our legitimate interests;
- have your data deleted, destroyed or made anonymous;
- have the use of your data restricted;
- have inaccurate data corrected;
- withdraw consent where we rely on consent (we currently don't rely on consent for the processing on our server; you can switch off microphone and notification permissions at any time in your device settings);
- complain to the Personal Data Protection Committee through the Office of the Personal Data Protection Committee (www.pdpc.or.th).

**How to exercise your rights**

- **Delete your data in the app:** Settings → Delete my data. This immediately deletes your account, progress, subscription status record and usage counts from our server, and the app's data on that device. It needs an internet connection. Deleting your data does not cancel a subscription; cancel it in your App Store or Google Play settings (see the [Terms of Service](terms-en.md)).
- **Any other request, or if you can't use the app:** email [TBD: contact email]. Because the app has no sign-in, we know you only by a random account ID, so we may ask for information that helps us find your data and confirm it is yours — for example the order number on your Apple or Google receipt if you subscribed. We reply within 30 days, free of charge. If we cannot do what you ask (for example, because the law requires us to keep the data), we will tell you why.
- Step-by-step instructions: [Delete your data](delete-account-en.md).

## 10. Children

LinguaSEA is meant for people aged 13 and over and is not directed to children under 13. We don't knowingly collect personal data from children under 13. If you are a parent or guardian and believe a child under 13 has used the app, the quickest way to delete the data is Settings → Delete my data in the child's app; you can also contact us and we will help. People under 20 are minors under Thai law — see the [Terms of Service](terms-en.md) on parental consent for purchases.

## 11. Changes to this policy

We will update this policy when the way we handle data changes, for example before we add a feature that uses personal data in a new way. We will change the effective date above and, for significant changes, tell you in the app before they take effect. Where a change requires your consent under the PDPA, we will ask for it first.

## 12. Contact us

[TBD: operator legal name]<br>
[TBD: operator address]<br>
Email: [TBD: contact email]<br>
Data Protection Officer: [TBD: DPO name and contact, or delete this line]

This policy is available in Thai and English. If the two versions differ, the Thai version prevails.
