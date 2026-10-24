# LinguaSEA Privacy Policy

[อ่านฉบับภาษาไทย](privacy-th.md)

**Effective date:** [TBD: effective date]<br>
**Version:** 1.0

This policy explains what personal data the LinguaSEA app (iOS and Android), its web version and its online service collect, why, who receives it, how long we keep it, and the rights you have under Thailand's Personal Data Protection Act B.E. 2562 (2019) ("PDPA"). "LinguaSEA" is the app's current name and may change.

> **In short**
>
> - You can use LinguaSEA without giving us your name, email address or phone number: the app identifies itself to our server with a random account ID. Signing in with your email address is optional. It lets you use the same progress and subscription on several devices and on the web, and you need it to subscribe on the web.
> - We keep your learning progress and subscription status on our server so they can be synced and restored. Accounts that are not used for 24 months are deleted automatically.
> - If you subscribe on the web, the payment is processed by Stripe through RevenueCat. We never see your full card number.
> - Recordings for pronunciation scoring and spoken answers to the AI tutor are processed by Microsoft Azure and are not kept by us or by Microsoft.
> - If you use the AI tutor, your answers (with email addresses and phone numbers masked) are sent to Anthropic to write the tutor's replies. We don't store the conversation, and Anthropic does not use it to train its models.
> - No ads, no advertising or analytics SDKs, no tracking across other companies' apps and websites, and we don't sell personal data.
> - You can delete your data at any time in the app: **Settings → Delete my data**. If you signed in, this also deletes your email address.

## 1. Who we are

The data controller is [TBD: operator legal name], [TBD: operator address] ("we", "us").

- Privacy questions and requests: [TBD: contact email]
- Data Protection Officer: [TBD: DPO name and contact, or delete this line]

## 2. What this policy covers

This policy covers the LinguaSEA mobile apps, the web version of the app (at /app/ on our website), the server they connect to (together, the "Service") and these web pages. The App Store, Google Play and your device's operating system are run by Apple and Google under their own privacy policies, and your web browser is run by its provider under its own policy.

## 3. The personal data we process

### 3.1 Account ID, access tokens, email sign-in and last use

The first time the app needs to save your progress online, score your pronunciation or use the AI tutor, our server creates an anonymous account for the app on your device: a random account ID and a random access token. The app keeps both in your device's secure storage (iOS Keychain or Android Keystore); the web version keeps them in your browser's local storage for our website. Our server stores the account ID, the time the account was created, the day it was last used (updated at most once a day) and a one-way hash of the token — never the token itself. Unless you sign in with your email address (below), the account is not linked to your name, email address or phone number. If an account is not used for 24 months, we delete it automatically (section 7).

**Signing in with your email address (optional).** You can sign in with your email address to use the same account, with the same progress and subscription, on several devices and on the web. You must sign in before you can subscribe on the web (section 3.3).

- When you ask for a sign-in code, our server sends a 6-digit code to the address you entered through our email provider, Resend (section 5). Resend receives your email address and the message (the code and a short note saying how long it is valid).
- The code is valid for 10 minutes. Until it is used or expires, our server keeps the email address the code was sent to, a one-way hash of the code (never the code itself), when it expires and the number of wrong attempts. The code stops working once it has been used, after 5 wrong attempts or when you ask for a new one, and expired codes are deleted.
- When you enter the correct code, our server stores your email address with your account and issues a new access token for that device. Each device or browser you sign in on has its own token, and our server stores only a one-way hash of each one. Signing out on a device revokes only that device's token.
- If the email address already belongs to another LinguaSEA account and the device you sign in on has its own anonymous account, we merge the progress from that device into the signed-in account (section 3.2), keep the later subscription end date of the two (section 3.3), and delete the device's anonymous account.
- We use your email address only to sign you in, to identify your account (for example when you contact us about your data or a web subscription) and to send you messages you need about your account or web subscription (for example notice of a price change). We don't use it for marketing, and we don't send it to Anthropic or Microsoft.

### 3.2 Learning progress

To sync and back up your progress, the app sends it to our server: the lessons you finished and when you first finished them; the review schedule of each word or phrase you studied (when it is next due, when you last reviewed it, how many times you reviewed or forgot it, and the other values the spaced-repetition method uses); your XP; and your streak (days in a row and the last day you studied). We store it with your account ID. If you sign in, your progress belongs to your signed-in account and is synced to every device and browser where you are signed in.

### 3.3 Subscription status

If you subscribe in the iOS or Android app, you pay Apple or Google; we never see your payment card details. RevenueCat, the service that manages subscriptions for us, receives your account ID and the purchase details from the store (such as the plan, price, currency, store country, and transaction IDs and dates), together with basic technical information (such as device type, operating system, app version and IP address), to validate the purchase.

If you subscribe on the web, you must first sign in with your email address (section 3.1). The checkout is provided by RevenueCat (RevenueCat Web Billing) and the payment is processed by Stripe. You enter your card or other payment details directly into the payment form provided by Stripe and RevenueCat: these details do not pass through our server, and we never see or store your full card number. To process the payment, prevent fraud, send you receipts and let you manage your subscription, RevenueCat and Stripe receive your account ID, your email address, your payment details (such as card number, expiry date, card type and billing country or postal code), the purchase details (such as the plan, price, currency, and transaction IDs and dates) and technical information from your browser (such as IP address, browser type and device information). In our RevenueCat and Stripe accounts we can see the purchase details, your email address and limited payment details, such as the card type and its last four digits, but not the full card number.

Whether you subscribe in an app or on the web, RevenueCat tells our server whether your subscription is active and when it ends. We store that end date and the time of the latest subscription event with your account ID.

### 3.4 Recordings: pronunciation scoring and spoken answers

When you use pronunciation scoring, or answer the AI tutor by voice, the app records your voice only while you are recording (a few seconds at a time) and sends the recording to our server, together with the language you are learning and, for pronunciation scoring, the sentence you were asked to say. Our server converts the recording to the audio format the speech service needs and sends it to Microsoft Azure AI Speech. For pronunciation scoring, Azure returns scores (overall, accuracy, fluency, completeness and a score for each word) and the text it recognised; for an answer to the AI tutor, it returns the text of what you said, which the app then uses as your answer (section 3.5). We send the result back to the app.

- Our server does not keep the recording or the result. The recording is held in memory and in a temporary file only for the few seconds needed to process it, and is then deleted.
- We have not turned on Azure's optional audio logging. According to Microsoft's documentation, audio sent for real-time speech recognition and pronunciation assessment is then processed in memory and not stored.
- The app deletes the recording from your device once it has been processed.
- We do not use recordings to identify you or to create a voiceprint.

### 3.5 AI tutor conversations

The AI tutor is a conversation partner that role-plays situations from the unit you are studying. Before your first conversation, the app explains what will be sent to Anthropic and asks you to agree.

- For each turn, the app sends our server the conversation so far in that session — your answers (typed, or converted from speech as described in section 3.4) and the tutor's earlier replies — together with the unit you are practising, the language you are learning and the app's interface language.
- Our server masks email addresses and phone numbers in your answers. It then sends the most recent lines of the conversation (up to 24), the unit's scenario (words and example dialogue from our lessons) and our instructions to Anthropic's Claude API, which writes the tutor's next turn: a reply with its reading and translation, and, where useful, feedback, a corrected sentence and a hint.
- Anthropic does not receive your account ID, your IP address or information about your device.
- Our server does not store the conversation. The app keeps it on your device only for that session.
- Under Anthropic's commercial terms, inputs and outputs sent through its API are not used to train its models, and Anthropic keeps them only for a limited period (for example, to detect and prevent misuse) before deleting them.
- The tutor is instructed not to ask for personal details and to remind you not to share them. Please don't type or say names, addresses, phone numbers, account details or other personal information: our masking cannot catch everything.
- If a reply is inappropriate, you can report it from the conversation screen. Reports come to us by email (section 3.8).

### 3.6 Daily usage counts

To apply the daily limits of the free and Premium plans, we count how many times each day your account uses features that have a limit (pronunciation scoring and AI tutor turns).

### 3.7 Technical data and server logs

Like any online service, our server receives your device's IP address and the time and address (URL) of each request — for example when the app syncs your progress or downloads lesson audio.

- We use the IP address to limit how many requests one address can make (rate limiting). We also limit how many sign-in codes can be requested for one email address. These counters are kept only in memory and cover at most the last hour.
- Our server keeps logs with the IP address, the time, the request method and URL, the response status and time, and error details (for some errors, the account ID concerned). The logs do not contain your recordings, your AI tutor conversations, sign-in codes or access tokens.
- We do not use IP addresses to work out where you are.

### 3.8 When you contact us

If you email us — including when you report an AI tutor reply — we receive your email address, your message and anything you include (a report includes the reply you are reporting and anything you add). We use it only to answer you, to review reported replies and keep the tutor safe, and to keep a record of the requests we have handled.

### 3.9 Data that stays on your device

Some data is stored only in the app on your device (in the web version, in your browser's local storage for our website): a copy of your progress, the language you are learning, the app's interface language, your reminder settings, the subscription status the app last saw, and your answer on the AI tutor's consent screen. The current AI tutor conversation is kept only for that session.

- The app reads your device's language setting to choose its interface language. This is not sent to us.
- Daily study reminders are scheduled on your device. We don't use a push notification service and receive no notification token. The web version has no reminders.
- The web version uses no cookies for advertising or analytics. When you open the web checkout, Stripe and RevenueCat may use cookies and similar technologies to process the payment and prevent fraud, under their own policies.
- When there is no audio clip for a piece of text, the app reads lesson text aloud with your device's built-in text-to-speech voice. That text is lesson content, not information about you.

### 3.10 What we don't collect

We don't collect your name, email address (unless you sign in with it or email us), phone number, contacts, photos, location or advertising ID, and we never receive your full card number. The app and its web version contain no ads, no advertising SDKs and no analytics or crash-reporting SDKs, and we don't track you across other companies' apps and websites.

## 4. Why we use your data, and our legal bases

The PDPA lets us use personal data only when we have a legal basis:

- **To provide the Service** — creating your anonymous account, signing you in with your email address and sending you sign-in codes, syncing and restoring your progress (including merging progress when you sign in), selling and managing web subscriptions and unlocking Premium when you subscribe, sending you messages you need about your account or web subscription, scoring your pronunciation, converting spoken answers to text, running AI tutor conversations and applying daily limits. Legal basis: necessary to perform our contract with you, the [Terms of Service](terms-en.md) (section 24(3) PDPA). You decide whether to use the AI tutor: the consent screen before your first conversation is there so you know what will be sent to Anthropic before anything is sent.
- **To keep the Service secure and working** — rate limiting (including limits on sign-in code requests), detecting and preventing abuse and fraud, investigating errors and keeping backups. Legal basis: our legitimate interest in running a secure and reliable service (section 24(5)); where the law requires us to keep certain records, compliance with a legal obligation (section 24(6)).
- **To answer your messages and requests**, including reports about AI tutor replies and requests to exercise your rights. Legal basis: legitimate interest (section 24(5)) and legal obligation (section 24(6)).
- **To comply with the law**, for example to keep the records of web payments that tax and accounting laws require, and to respond to lawful requests from authorities. Legal basis: legal obligation (section 24(6)).

We don't use your data for advertising, we don't sell it, and we don't make decisions about you based solely on automated processing that have legal or similarly significant effects. Pronunciation scores and AI tutor replies are produced automatically only to help you practise.

If the app cannot send this data to our server (for example, when you are offline), you can still study on your device, but syncing, pronunciation scoring and the AI tutor won't work.

## 5. Who receives your data

We share personal data only with service providers that process it for us under contract (data processors), and with the other recipients described here:

- **Cloud hosting and database provider** — [TBD: hosting and database provider], servers in Singapore. Runs our server, which handles the data described in section 3, and stores the data described in sections 3.1–3.3, 3.6 and 3.7.
- **Microsoft Azure AI Speech** (Microsoft Corporation), Southeast Asia region (Singapore). Scores pronunciation recordings and converts spoken answers to text (section 3.4). We also use Azure to generate lesson audio from lesson text, which involves no personal data.
- **Anthropic, PBC** (United States). Writes the AI tutor's replies from the conversation text (section 3.5).
- **RevenueCat, Inc.** (United States). Manages subscriptions, validates purchases and provides the web checkout (section 3.3).
- **Stripe** (Stripe, Inc. and its affiliates). Processes payments for web subscriptions (section 3.3). For some purposes, such as preventing fraud and meeting its own legal obligations, Stripe acts as an independent controller under its own privacy policy.
- **Resend** (Resend, Inc., United States). Sends the emails with sign-in codes (section 3.1).
- **The email provider for our contact address**, to receive and answer your emails and reports (section 3.8).

Apple (App Store) and Google (Google Play) process your purchases, payments and refunds as independent controllers, under their own terms and privacy policies.

We may disclose personal data when required by law, a court order or a competent authority, or to protect the rights, safety and security of our users, the public or us. If LinguaSEA is sold, merged or otherwise transferred, personal data may pass to the new operator; we will tell you in advance and make sure your data stays protected as described in this policy.

## 6. International transfers

Our server and Azure Speech run in Singapore, RevenueCat and Anthropic process data in the United States, and Resend and Stripe process data in the United States and other countries where they operate. Apple, Google and our providers may also process data in other countries where they or their sub-processors operate. We make these transfers because they are necessary to provide the Service you asked for (section 28 PDPA), and we rely on our providers' data protection terms, which include safeguards for international transfers such as standard contractual clauses (section 29). You can ask us for more information about these safeguards.

## 7. How long we keep data

- **Account (including your email address and the hashes of your devices' access tokens), progress, subscription status and daily usage counts:** until you delete your data (section 9) or until the account has not been used for 24 months, when we delete the account and all its data on our server automatically; and in any case when we stop providing the Service. If you delete the app without deleting your data first, the data stays on our server, linked only to the random account ID, until it is deleted after 24 months without use.
- **Sign-in codes:** only a one-way hash is kept, with the email address it was sent to; a code can be used for at most 10 minutes, a new request replaces it, and it is deleted once used, after 5 wrong attempts or after it expires.
- **Recordings:** not kept; deleted within seconds after processing.
- **AI tutor conversations:** not stored on our server; the app keeps them only for that session. Anthropic keeps what it receives only for a limited period under its commercial terms.
- **Rate-limiting counters:** in memory only, covering at most the last hour.
- **Server logs:** up to 90 days.
- **Backups:** deleted data disappears from our live database immediately and from our backups within 30 days.
- **Sign-in emails:** Resend keeps a record of the emails it sends for us (including the recipient address and the message) for a limited period under its own terms.
- **Emails, including reports of AI tutor replies:** up to 2 years after we finish handling them.
- **Data on your device:** until you delete your data in the app or delete the app.
- **RevenueCat** keeps purchase history for as long as we use its service, unless we ask it to delete it. Apple and Google keep their records under their own policies.
- **Web subscription and payment records** (such as your email address, the plan, amounts, dates and limited payment details) in our RevenueCat and Stripe accounts: for as long as we need them to provide and support your subscription and for as long as tax, accounting and other laws require, even after you delete your data in the app. Stripe also keeps payment data under its own policy.

## 8. Security

- All connections between the app (including its web version) and our server are encrypted with HTTPS (TLS).
- Access tokens are long random values, and our server stores only a one-way hash of them. The same applies to sign-in codes, which expire after 10 minutes and stop working after 5 wrong attempts; we also limit how many codes can be requested.
- Card details for web subscriptions are entered into payment forms provided by Stripe and RevenueCat and never reach our server.
- Secret keys (database, Azure, Anthropic, RevenueCat, Resend) are kept in our hosting environment, never in the app or in our source code.
- Before AI tutor answers leave our server, we mask email addresses and phone numbers, and we send Anthropic no account ID or device information.
- We choose providers that encrypt stored data, and we limit access to our systems to the people who need it.
- We collect as little data as we can, and we delete accounts that have not been used for 24 months.

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
- withdraw consent where we rely on consent (the processing on our server does not rely on consent; the AI tutor's consent screen lets you decide before your answers go to Anthropic, and you can stop using the tutor at any time; you can switch off microphone and notification permissions at any time in your device settings);
- complain to the Personal Data Protection Committee through the Office of the Personal Data Protection Committee (www.pdpc.or.th).

**How to exercise your rights**

- **Delete your data in the app:** Settings → Delete my data (in the app or its web version). This immediately deletes from our server your account (including your email address if you signed in, the access tokens of all your devices and any pending sign-in code), your progress, your subscription status record and your usage counts, and the app's data on that device or browser. If you are signed in, this deletes the account for all your devices and the web, not only the one you are using. It needs an internet connection. Deleting your data does not cancel a subscription: cancel it in your App Store or Google Play settings or, for a subscription bought on the web, with the link in your receipt email (see the [Terms of Service](terms-en.md)).
- **Any other request, or if you can't use the app:** email [TBD: contact email]. If you signed in with your email address, write to us from that address or tell us which address you used; we may ask you to confirm the request from that address. This is also how to ask us to correct the email address linked to your account. If you never signed in, we know you only by a random account ID, so we may ask for information that helps us find your data and confirm it is yours — for example the order number on your Apple or Google receipt if you subscribed. We reply within 30 days, free of charge. If we cannot do what you ask (for example, because the law requires us to keep the data), we will tell you why.
- Step-by-step instructions: [Delete your data](delete-account-en.md).

## 10. Children

LinguaSEA is meant for people aged 13 and over and is not directed to children under 13. We don't knowingly collect personal data from children under 13. If you are a parent or guardian and believe a child under 13 has used the app, the quickest way to delete the data is Settings → Delete my data in the child's app; you can also contact us and we will help. People under 20 are minors under Thai law — see the [Terms of Service](terms-en.md) on parental consent for purchases.

## 11. Changes to this policy

We will update this policy when the way we handle data changes, for example before we add a feature that uses personal data in a new way. We will change the effective date above and, for significant changes, tell you in the app (and by email if you have signed in) before they take effect. Where a change requires your consent under the PDPA, we will ask for it first.

## 12. Contact us

[TBD: operator legal name]<br>
[TBD: operator address]<br>
Email: [TBD: contact email]<br>
Data Protection Officer: [TBD: DPO name and contact, or delete this line]

This policy is available in Thai and English. If the two versions differ, the Thai version prevails.
