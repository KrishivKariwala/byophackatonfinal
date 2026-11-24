# Translation review

Hindi (हिन्दी) and Kannada (ಕನ್ನಡ) were written by the build assistant as a **first pass**. They have **not** been reviewed by a native speaker. Nothing here should be treated as final copy until someone fluent signs it off.

1440 strings. Generated from `lib/i18n/messages/*.json` by `npx tsx scripts/translation-review.ts`; edit the JSON files, not this table, then regenerate.

## How to review
1. Read each row in context if you can (the screen is named by the key prefix; `docs/P2_DEMO.md` says how to reach it).
2. Mark the **OK?** column or write the corrected text into the JSON file. Keep `{placeholders}` exactly as they are.
3. Run `npm run i18n:check` (it fails on a missing key or a changed placeholder) and `npm test`.

## Things to look at first
- **Register and tone.** The app speaks to ordinary people in Bengaluru: simple, polite, no jargon. Is it too formal or too casual?
- **Words left in English on purpose:** OTP, QR, UPI, FSSAI, NGO, 80G, ETA-style acronyms and the brand SAVE A PLATE. Would your audience say these in Hindi / Kannada, or is there a better everyday word?
- **Legal-ish sentences** (credit is not cash, estimated value is not a tax document, 80G wording, the food-safety lines). These were translated closely but a person who knows the legal context should check the meaning is preserved.
- **Plurals.** Hindi and Kannada keys with `_one` / `_other` suffixes use two forms; check the counts read naturally.
- **Fonts.** Devanagari and Kannada fall back to Noto Sans in headings (the brand display font has no glyphs for them). Check the headings look acceptable.

## Known limits
- Notification texts, API error messages and PDFs (certificates, receipts) are generated on the server and stay in English.
- Landing page animation words (EAT / LIST / FEED) are brand artwork and are not translated.

## adm

| Key | English | हिन्दी | ಕನ್ನಡ | OK? |
|---|---|---|---|---|
| `adm.f.address` | Address | पता | ವಿಳಾಸ | ☐ |
| `adm.f.capacity` | Capacity | क्षमता | ಸಾಮರ್ಥ್ಯ | ☐ |
| `adm.f.contact` | Contact | संपर्क | ಸಂಪರ್ಕ | ☐ |
| `adm.f.eightyG` | 80G | 80G | 80G | ☐ |
| `adm.f.fssai` | FSSAI | FSSAI | FSSAI | ☐ |
| `adm.f.handling` | Handling | संभालने की व्यवस्था | ನಿರ್ವಹಣೆ | ☐ |
| `adm.f.hours` | Hours | समय | ಸಮಯ | ☐ |
| `adm.f.payoutUpi` | Payout UPI | भुगतान UPI | ಪಾವತಿ UPI | ☐ |
| `adm.f.registration` | Registration no. | पंजीकरण नं. | ನೋಂದಣಿ ಸಂ. | ☐ |
| `adm.f.serviceArea` | Service area | सेवा क्षेत्र | ಸೇವಾ ಪ್ರದೇಶ | ☐ |
| `adm.flag.lowRating` | Rating {avg} from {count} ratings (below {min}) | {count} रेटिंग से औसत {avg} ({min} से नीचे) | {count} ರೇಟಿಂಗ್‌ಗಳಿಂದ ಸರಾಸರಿ {avg} ({min} ಕ್ಕಿಂತ ಕಡಿಮೆ) | ☐ |
| `adm.flag.openReports` | {count} open reports | {count} खुली रिपोर्ट | {count} ತೆರೆದ ವರದಿಗಳು | ☐ |
| `adm.log.report_created` | report_created | रिपोर्ट बनी | ವರದಿ ರಚಿಸಲಾಗಿದೆ | ☐ |
| `adm.log.report_dismiss` | report_dismiss | खारिज किया | ವಜಾಗೊಳಿಸಲಾಗಿದೆ | ☐ |
| `adm.log.report_hide_listing` | report_hide_listing | लिस्टिंग छिपाई | ಲಿಸ್ಟಿಂಗ್ ಮರೆಮಾಡಲಾಗಿದೆ | ☐ |
| `adm.log.report_refund_order` | report_refund_order | ऑर्डर रिफ़ंड किया | ಆರ್ಡರ್ ರಿಫಂಡ್ ಮಾಡಲಾಗಿದೆ | ☐ |
| `adm.log.report_suspend_account` | report_suspend_account | खाता निलंबित किया | ಖಾತೆ ಅಮಾನತು ಮಾಡಲಾಗಿದೆ | ☐ |
| `adm.log.report_warn` | report_warn | चेतावनी दी | ಎಚ್ಚರಿಕೆ ನೀಡಲಾಗಿದೆ | ☐ |
| `adm.res.dismiss` | dismiss | खारिज किया | ವಜಾಗೊಳಿಸಲಾಗಿದೆ | ☐ |
| `adm.res.hide_listing` | hide_listing | लिस्टिंग छिपाई | ಲಿಸ್ಟಿಂಗ್ ಮರೆಮಾಡಲಾಗಿದೆ | ☐ |
| `adm.res.refund_order` | refund_order | ऑर्डर रिफ़ंड किया | ಆರ್ಡರ್ ರಿಫಂಡ್ ಮಾಡಲಾಗಿದೆ | ☐ |
| `adm.res.suspend_account` | suspend_account | खाता निलंबित किया | ಖಾತೆ ಅಮಾನತು ಮಾಡಲಾಗಿದೆ | ☐ |
| `adm.res.warn` | warn | चेतावनी दी | ಎಚ್ಚರಿಕೆ ನೀಡಲಾಗಿದೆ | ☐ |
| `adm.v.capacity` | {count} meals/day | {count} खाने/दिन | ದಿನಕ್ಕೆ {count} ಊಟ | ☐ |
| `adm.v.eightyG` | {number} (valid until {until}), verify before approving | {number} ({until} तक मान्य), स्वीकृत करने से पहले जाँच लें | {number} ({until} ವರೆಗೆ ಮಾನ್ಯ), ಅನುಮೋದಿಸುವ ಮೊದಲು ಪರಿಶೀಲಿಸಿ | ☐ |
| `adm.v.km` | {count} km | {count} किमी | {count} ಕಿ.ಮೀ | ☐ |
| `adm.v.none` | none | कोई नहीं | ಯಾವುದೂ ಇಲ್ಲ | ☐ |

## admin

| Key | English | हिन्दी | ಕನ್ನಡ | OK? |
|---|---|---|---|---|
| `admin.act.dismiss` | Dismiss | खारिज करें | ವಜಾಗೊಳಿಸಿ | ☐ |
| `admin.act.hide_listing` | Hide listing | लिस्टिंग छिपाएँ | ಲಿಸ್ಟಿಂಗ್ ಮರೆಮಾಡಿ | ☐ |
| `admin.act.refund_order` | Refund order | ऑर्डर रिफ़ंड करें | ಆರ್ಡರ್ ಮರುಪಾವತಿಸಿ | ☐ |
| `admin.act.suspend_account` | Suspend account | खाता निलंबित करें | ಖಾತೆ ಅಮಾನತುಗೊಳಿಸಿ | ☐ |
| `admin.act.warn` | Warn vendor | विक्रेता को चेतावनी दें | ಮಾರಾಟಗಾರರಿಗೆ ಎಚ್ಚರಿಕೆ ನೀಡಿ | ☐ |
| `admin.actConfirm` | {action}? This is logged with your name. | {action}? यह आपके नाम के साथ दर्ज किया जाएगा। | {action}? ಇದನ್ನು ನಿಮ್ಮ ಹೆಸರಿನೊಂದಿಗೆ ದಾಖಲಿಸಲಾಗುತ್ತದೆ. | ☐ |
| `admin.actionLog` | Action log | कार्रवाई लॉग | ಕ್ರಮ ಲಾಗ್ | ☐ |
| `admin.applications` | Applications | आवेदन | ಅರ್ಜಿಗಳು | ☐ |
| `admin.approvalsHelp` | Pending vendors and NGOs stay blocked from publishing and claiming until approved. Rejections need a reason, and the applicant is notified. | लंबित विक्रेता और NGO स्वीकृति मिलने तक लिस्टिंग डालने और दावा करने से रुके रहते हैं। अस्वीकृति का कारण देना ज़रूरी है, और आवेदक को सूचित किया जाता है। | ಬಾಕಿ ಇರುವ ಮಾರಾಟಗಾರರು ಮತ್ತು NGO ಗಳು ಅನುಮೋದನೆ ಸಿಗುವವರೆಗೆ ಪ್ರಕಟಿಸುವುದು ಮತ್ತು ಕ್ಲೈಮ್ ಮಾಡುವುದರಿಂದ ತಡೆಯಲ್ಪಡುತ್ತಾರೆ. ತಿರಸ್ಕಾರಕ್ಕೆ ಕಾರಣ ಬೇಕು, ಮತ್ತು ಅರ್ಜಿದಾರರಿಗೆ ತಿಳಿಸಲಾಗುತ್ತದೆ. | ☐ |
| `admin.approvalsTitle` | APPROVALS | स्वीकृतियाँ | ಅನುಮೋದನೆಗಳು | ☐ |
| `admin.approve` | Approve | स्वीकार करें | ಅನುಮೋದಿಸಿ | ☐ |
| `admin.appsHelp` | Approve or reject vendors and NGOs. Every decision is audit-logged. Demo approvals are not regulatory approvals. | विक्रेताओं और NGO को स्वीकार या अस्वीकार करें। हर फ़ैसला ऑडिट लॉग में दर्ज होता है। डेमो स्वीकृति सरकारी मंज़ूरी नहीं है। | ಮಾರಾಟಗಾರರು ಮತ್ತು NGO ಗಳನ್ನು ಅನುಮೋದಿಸಿ ಅಥವಾ ತಿರಸ್ಕರಿಸಿ. ಪ್ರತಿ ನಿರ್ಧಾರವನ್ನು ಆಡಿಟ್ ಲಾಗ್‌ನಲ್ಲಿ ದಾಖಲಿಸಲಾಗುತ್ತದೆ. ಡೆಮೊ ಅನುಮೋದನೆಗಳು ಸರ್ಕಾರಿ ಅನುಮೋದನೆಗಳಲ್ಲ. | ☐ |
| `admin.by` | by {reporter} | {reporter} द्वारा | {reporter} ಅವರಿಂದ | ☐ |
| `admin.byHood` | Rescued units by neighbourhood | इलाक़े के हिसाब से बचाई गई यूनिट | ಪ್ರದೇಶವಾರು ಉಳಿಸಿದ ಯೂನಿಟ್‌ಗಳು | ☐ |
| `admin.confirmReject` | Confirm rejection | अस्वीकृति की पुष्टि करें | ತಿರಸ್ಕಾರ ದೃಢೀಕರಿಸಿ | ☐ |
| `admin.counters` | Impact counters | असर के काउंटर | ಪರಿಣಾಮ ಕೌಂಟರ್‌ಗಳು | ☐ |
| `admin.customers` | Customers | ग्राहक | ಗ್ರಾಹಕರು | ☐ |
| `admin.demoChip` | Demo data · 1 listed unit = 1 meal · counted at handover only | डेमो डेटा · 1 लिस्ट की गई यूनिट = 1 भोजन · सिर्फ़ हस्तांतरण पर गिना जाता है | ಡೆಮೊ ಡೇಟಾ · 1 ಪಟ್ಟಿ ಮಾಡಿದ ಯೂನಿಟ್ = 1 ಊಟ · ಹಸ್ತಾಂತರದಲ್ಲಿ ಮಾತ್ರ ಎಣಿಸಲಾಗುತ್ತದೆ | ☐ |
| `admin.demoRecord` | Demo record: file name only | डेमो रिकॉर्ड: सिर्फ़ फ़ाइल का नाम | ಡೆಮೊ ದಾಖಲೆ: ಫೈಲ್ ಹೆಸರು ಮಾತ್ರ | ☐ |
| `admin.docAlt` | Uploaded document | अपलोड किया गया दस्तावेज़ | ಅಪ್‌ಲೋಡ್ ಮಾಡಿದ ದಾಖಲೆ | ☐ |
| `admin.docN` | Document {n} | दस्तावेज़ {n} | ದಾಖಲೆ {n} | ☐ |
| `admin.docPdf` | Document {n} (PDF) | दस्तावेज़ {n} (PDF) | ದಾಖಲೆ {n} (PDF) | ☐ |
| `admin.docPreview` | Document preview | दस्तावेज़ का पूर्वावलोकन | ದಾಖಲೆ ಮುನ್ನೋಟ | ☐ |
| `admin.eyebrow` | Bengaluru · admin | बेंगलुरु · एडमिन | ಬೆಂಗಳೂರು · ನಿರ್ವಾಹಕ | ☐ |
| `admin.flagCustomersHelp` | Repeated no-shows (2+ in 30 days) or currently suspended. Three no-shows in 30 days suspend reservations for 7 days automatically. | बार-बार न आना (30 दिन में 2+) या अभी निलंबित। 30 दिन में तीन बार न आने पर आरक्षण अपने आप 7 दिन के लिए रुक जाते हैं। | ಪದೇ ಪದೇ ಬರದಿರುವುದು (30 ದಿನಗಳಲ್ಲಿ 2+) ಅಥವಾ ಪ್ರಸ್ತುತ ಅಮಾನತುಗೊಂಡಿರುವುದು. 30 ದಿನಗಳಲ್ಲಿ ಮೂರು ಬಾರಿ ಬರದಿದ್ದರೆ ಕಾಯ್ದಿರಿಸುವಿಕೆ ತಾನಾಗಿ 7 ದಿನ ನಿಲ್ಲುತ್ತದೆ. | ☐ |
| `admin.flagVendorsHelp` | Average rating below 3.0 with at least 20 ratings, or repeated open reports. | कम से कम 20 रेटिंग के साथ औसत रेटिंग 3.0 से कम, या बार-बार खुली रिपोर्ट। | ಕನಿಷ್ಠ 20 ರೇಟಿಂಗ್‌ಗಳೊಂದಿಗೆ ಸರಾಸರಿ ರೇಟಿಂಗ್ 3.0 ಕ್ಕಿಂತ ಕಡಿಮೆ, ಅಥವಾ ಪದೇ ಪದೇ ತೆರೆದ ವರದಿಗಳು. | ☐ |
| `admin.flaggedTitle` | FLAGGED | चिह्नित | ಗುರುತಿಸಲಾದವು | ☐ |
| `admin.headline` | EVERY PLATE, COUNTED. | हर प्लेट, गिनी हुई। | ಪ್ರತಿ ಪ್ಲೇಟ್, ಲೆಕ್ಕದಲ್ಲಿ. | ☐ |
| `admin.kind.ngo` | ngo | NGO | NGO | ☐ |
| `admin.kind.vendor` | vendor | विक्रेता | ಮಾರಾಟಗಾರ | ☐ |
| `admin.newApps` | New applications show up here. | नए आवेदन यहाँ दिखेंगे। | ಹೊಸ ಅರ್ಜಿಗಳು ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತವೆ. | ☐ |
| `admin.noCustomersFlagged` | No customers flagged. | कोई ग्राहक चिह्नित नहीं। | ಯಾವುದೇ ಗ್ರಾಹಕರನ್ನು ಗುರುತಿಸಿಲ್ಲ. | ☐ |
| `admin.noDocs` | no documents | कोई दस्तावेज़ नहीं | ಯಾವುದೇ ದಾಖಲೆಗಳಿಲ್ಲ | ☐ |
| `admin.noDocsAttached` | No documents attached. | कोई दस्तावेज़ नहीं जुड़ा। | ಯಾವುದೇ ದಾಖಲೆಗಳನ್ನು ಲಗತ್ತಿಸಿಲ್ಲ. | ☐ |
| `admin.noReports` | No reports | कोई रिपोर्ट नहीं | ಯಾವುದೇ ವರದಿಗಳಿಲ್ಲ | ☐ |
| `admin.noReportsBody` | Customer reports appear here. | ग्राहकों की रिपोर्ट यहाँ दिखती हैं। | ಗ್ರಾಹಕರ ವರದಿಗಳು ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತವೆ. | ☐ |
| `admin.noShows_one` | {n} no-show in 30 days | 30 दिन में {n} बार नहीं आए | 30 ದಿನಗಳಲ್ಲಿ {n} ಬಾರಿ ಬರಲಿಲ್ಲ | ☐ |
| `admin.noShows_other` | {n} no-shows in 30 days | 30 दिन में {n} बार नहीं आए | 30 ದಿನಗಳಲ್ಲಿ {n} ಬಾರಿ ಬರಲಿಲ್ಲ | ☐ |
| `admin.noVendorsFlagged` | No vendors flagged. | कोई विक्रेता चिह्नित नहीं। | ಯಾವುದೇ ಮಾರಾಟಗಾರರನ್ನು ಗುರುತಿಸಿಲ್ಲ. | ☐ |
| `admin.noteLabel` | Note (optional, goes in the log and to the vendor/reporter) | टिप्पणी (वैकल्पिक, लॉग में और विक्रेता/रिपोर्ट करने वाले को जाएगी) | ಟಿಪ್ಪಣಿ (ಐಚ್ಛಿಕ, ಲಾಗ್‌ಗೆ ಮತ್ತು ಮಾರಾಟಗಾರ/ವರದಿದಾರರಿಗೆ ಹೋಗುತ್ತದೆ) | ☐ |
| `admin.queueEmpty` | Queue is empty. | कतार खाली है। | ಸರತಿ ಖಾಲಿಯಾಗಿದೆ. | ☐ |
| `admin.queueEmptyTitle` | Queue is empty | कतार खाली है | ಸರತಿ ಖಾಲಿಯಾಗಿದೆ | ☐ |
| `admin.queueNgo` | Capacity {n} meals · {docs} | क्षमता {n} भोजन · {docs} | ಸಾಮರ್ಥ್ಯ {n} ಊಟಗಳು · {docs} | ☐ |
| `admin.queueVendor` | FSSAI {fssai} · {docs} | FSSAI {fssai} · {docs} | FSSAI {fssai} · {docs} | ☐ |
| `admin.recent` | Recent activity | हाल की गतिविधि | ಇತ್ತೀಚಿನ ಚಟುವಟಿಕೆ | ☐ |
| `admin.recentCustomer` | Customer pickup at {vendor} · {units} units | {vendor} पर ग्राहक पिकअप · {units} यूनिट | {vendor} ನಲ್ಲಿ ಗ್ರಾಹಕ ಪಿಕಪ್ · {units} ಯೂನಿಟ್‌ಗಳು | ☐ |
| `admin.recentNgo` | {ngo} collected from {vendor} · {units} units | {ngo} ने {vendor} से लिया · {units} यूनिट | {ngo} {vendor} ನಿಂದ ಸಂಗ್ರಹಿಸಿದೆ · {units} ಯೂನಿಟ್‌ಗಳು | ☐ |
| `admin.reject` | Reject | अस्वीकार करें | ತಿರಸ್ಕರಿಸಿ | ☐ |
| `admin.rejectEllipsis` | Reject… | अस्वीकार करें… | ತಿರಸ್ಕರಿಸಿ… | ☐ |
| `admin.rejectPrompt` | Rejection reason (shown to the applicant) | अस्वीकार करने का कारण (आवेदक को दिखेगा) | ತಿರಸ್ಕರಿಸಲು ಕಾರಣ (ಅರ್ಜಿದಾರರಿಗೆ ಕಾಣಿಸುತ್ತದೆ) | ☐ |
| `admin.rejectReason` | Rejection reason (required, shown to the applicant) | अस्वीकार करने का कारण (ज़रूरी, आवेदक को दिखेगा) | ತಿರಸ್ಕರಿಸಲು ಕಾರಣ (ಕಡ್ಡಾಯ, ಅರ್ಜಿದಾರರಿಗೆ ಕಾಣಿಸುತ್ತದೆ) | ☐ |
| `admin.rejected` | Rejected: {reason} | अस्वीकृत: {reason} | ತಿರಸ್ಕರಿಸಲಾಗಿದೆ: {reason} | ☐ |
| `admin.reportPhoto` | Photo attached to the report | रिपोर्ट के साथ लगी फ़ोटो | ವರದಿಯೊಂದಿಗೆ ಲಗತ್ತಿಸಿದ ಫೋಟೋ | ☐ |
| `admin.reportsHelp` | Every action is logged with who did it and when. | हर कार्रवाई दर्ज होती है कि किसने की और कब। | ಪ್ರತಿ ಕ್ರಮವನ್ನು ಯಾರು ಮಾಡಿದರು ಮತ್ತು ಯಾವಾಗ ಎಂದು ದಾಖಲಿಸಲಾಗುತ್ತದೆ. | ☐ |
| `admin.reportsTitle` | REPORTS & DISPUTES | रिपोर्ट और विवाद | ವರದಿಗಳು ಮತ್ತು ವಿವಾದಗಳು | ☐ |
| `admin.resolved` | Resolved: {resolution} | हल किया गया: {resolution} | ಪರಿಹರಿಸಲಾಗಿದೆ: {resolution} | ☐ |
| `admin.submitted` | Submitted: | भेजा गया: | ಸಲ್ಲಿಸಿದ್ದು: | ☐ |
| `admin.suspendedUntil` | Suspended until {when} | {when} तक निलंबित | {when} ವರೆಗೆ ಅಮಾನತುಗೊಂಡಿದೆ | ☐ |
| `admin.target.listing` | listing | लिस्टिंग | ಲಿಸ್ಟಿಂಗ್ | ☐ |
| `admin.target.reservation` | reservation | आरक्षण | ಕಾಯ್ದಿರಿಸುವಿಕೆ | ☐ |
| `admin.target.vendor` | vendor | विक्रेता | ಮಾರಾಟಗಾರ | ☐ |
| `admin.tile.activeListings` | Active listings | चालू लिस्टिंग | ಸಕ್ರಿಯ ಲಿಸ್ಟಿಂಗ್‌ಗಳು | ☐ |
| `admin.tile.approvedNgos` | Approved NGOs | स्वीकृत NGO | ಅನುಮೋದಿತ NGO ಗಳು | ☐ |
| `admin.tile.approvedVendors` | Approved vendors | स्वीकृत विक्रेता | ಅನುಮೋದಿತ ಮಾರಾಟಗಾರರು | ☐ |
| `admin.tile.co2` | kg CO₂e avoided (est.) | किलो CO₂e बचाव (अनुमान) | ಕೆಜಿ CO₂e ತಪ್ಪಿಸಲಾಗಿದೆ (ಅಂದಾಜು) | ☐ |
| `admin.tile.completedCollections` | Completed NGO collections | पूरे हुए NGO कलेक्शन | ಪೂರ್ಣಗೊಂಡ NGO ಸಂಗ್ರಹಗಳು | ☐ |
| `admin.tile.completedPickups` | Completed customer pickups | पूरे हुए ग्राहक पिकअप | ಪೂರ್ಣಗೊಂಡ ಗ್ರಾಹಕ ಪಿಕಪ್‌ಗಳು | ☐ |
| `admin.tile.customerUnits` | Customer pickup units | ग्राहक पिकअप यूनिट | ಗ್ರಾಹಕ ಪಿಕಪ್ ಯೂನಿಟ್‌ಗಳು | ☐ |
| `admin.tile.kg` | kg food rescued (est.) | किलो खाना बचाया (अनुमान) | ಕೆಜಿ ಆಹಾರ ಉಳಿಸಲಾಗಿದೆ (ಅಂದಾಜು) | ☐ |
| `admin.tile.ngoUnits` | NGO collection units | NGO कलेक्शन यूनिट | NGO ಸಂಗ್ರಹ ಯೂನಿಟ್‌ಗಳು | ☐ |
| `admin.tile.wasted` | Units expired unsold | बिना बिके खत्म हुई यूनिट | ಮಾರಾಟವಾಗದೆ ಅವಧಿ ಮುಗಿದ ಯೂನಿಟ್‌ಗಳು | ☐ |
| `admin.totalNote` | Customer pickups + NGO collections that completed a verified handover. Reservations and listings are never counted. | ग्राहक पिकअप + NGO कलेक्शन जिनका सत्यापित हस्तांतरण पूरा हुआ। आरक्षण और लिस्टिंग कभी नहीं गिने जाते। | ಪರಿಶೀಲಿತ ಹಸ್ತಾಂತರ ಪೂರ್ಣಗೊಂಡ ಗ್ರಾಹಕ ಪಿಕಪ್‌ಗಳು + NGO ಸಂಗ್ರಹಗಳು. ಕಾಯ್ದಿರಿಸುವಿಕೆ ಮತ್ತು ಲಿಸ್ಟಿಂಗ್‌ಗಳನ್ನು ಎಂದಿಗೂ ಎಣಿಸುವುದಿಲ್ಲ. | ☐ |
| `admin.totalRescued` | Total meals rescued | कुल बचाए गए भोजन | ಒಟ್ಟು ಉಳಿಸಿದ ಊಟಗಳು | ☐ |
| `admin.vendors` | Vendors | विक्रेता | ಮಾರಾಟಗಾರರು | ☐ |
| `admin.watch` | Watch | निगरानी में | ನಿಗಾದಲ್ಲಿ | ☐ |

## allergen

| Key | English | हिन्दी | ಕನ್ನಡ | OK? |
|---|---|---|---|---|
| `allergen.Egg` | Egg | अंडा | ಮೊಟ್ಟೆ | ☐ |
| `allergen.Fish` | Fish | मछली | ಮೀನು | ☐ |
| `allergen.Gluten` | Gluten | ग्लूटेन | ಗ್ಲುಟೆನ್ | ☐ |
| `allergen.Milk` | Milk | दूध | ಹಾಲು | ☐ |
| `allergen.Nuts` | Nuts | मेवे | ಬೀಜಗಳು | ☐ |
| `allergen.Peanuts` | Peanuts | मूँगफली | ಕಡಲೆಕಾಯಿ | ☐ |
| `allergen.Sesame` | Sesame | तिल | ಎಳ್ಳು | ☐ |
| `allergen.Shellfish` | Shellfish | शंख-सीप (शेलफ़िश) | ಚಿಪ್ಪುಮೀನು | ☐ |
| `allergen.Soy` | Soy | सोया | ಸೋಯಾ | ☐ |

## bits

| Key | English | हिन्दी | ಕನ್ನಡ | OK? |
|---|---|---|---|---|
| `bits.demo` | Demo | डेमो | ಡೆಮೊ | ☐ |
| `bits.off` | {pct}% off | {pct}% छूट | {pct}% ರಿಯಾಯಿತಿ | ☐ |
| `bits.photo` | Representative image | प्रतिनिधि तस्वीर | ಪ್ರಾತಿನಿಧಿಕ ಚಿತ್ರ | ☐ |
| `bits.photoAlt` | Representative image for {title} | {title} की प्रतिनिधि तस्वीर | {title} ಗಾಗಿ ಪ್ರಾತಿನಿಧಿಕ ಚಿತ್ರ | ☐ |
| `bits.photoSurprise` | Representative · contents vary | प्रतिनिधि · सामग्री अलग हो सकती है | ಪ್ರಾತಿನಿಧಿಕ · ವಿಷಯ ಬದಲಾಗಬಹುದು | ☐ |

## cancel

| Key | English | हिन्दी | ಕನ್ನಡ | OK? |
|---|---|---|---|---|
| `cancel.ariaFree` | Cancel order (free) | ऑर्डर रद्द करें (मुफ़्त) | ಆರ್ಡರ್ ರದ್ದುಮಾಡಿ (ಉಚಿತ) | ☐ |
| `cancel.ariaLate` | Cancel order (not refunded) | ऑर्डर रद्द करें (रिफ़ंड नहीं) | ಆರ್ಡರ್ ರದ್ದುಮಾಡಿ (ಮರುಪಾವತಿ ಇಲ್ಲ) | ☐ |
| `cancel.button` | Cancel order | ऑर्डर रद्द करें | ಆರ್ಡರ್ ರದ್ದುಮಾಡಿ | ☐ |
| `cancel.cancelling` | Cancelling… | रद्द हो रहा है… | ರದ್ದುಮಾಡಲಾಗುತ್ತಿದೆ… | ☐ |
| `cancel.confirmFreeNone` | Cancel this order? Nothing was charged. | यह ऑर्डर रद्द करें? कुछ भी चार्ज नहीं हुआ है। | ಈ ಆರ್ಡರ್ ರದ್ದುಮಾಡಬೇಕೇ? ಯಾವುದೇ ಶುಲ್ಕ ವಿಧಿಸಲಾಗಿಲ್ಲ. | ☐ |
| `cancel.confirmFreeRefund` | Cancel this order? ₹{amount} will be refunded (test mode). | यह ऑर्डर रद्द करें? ₹{amount} वापस किए जाएँगे (टेस्ट मोड)। | ಈ ಆರ್ಡರ್ ರದ್ದುಮಾಡಬೇಕೇ? ₹{amount} ಮರುಪಾವತಿಯಾಗುತ್ತದೆ (ಪರೀಕ್ಷಾ ಮೋಡ್). | ☐ |
| `cancel.confirmLate` | Cancel anyway? This is within {minutes} minutes of pickup, so it will NOT be refunded. | फिर भी रद्द करें? यह पिकअप के {minutes} मिनट के भीतर है, इसलिए रिफ़ंड नहीं मिलेगा। | ಹಾಗಿದ್ದರೂ ರದ್ದುಮಾಡಬೇಕೇ? ಇದು ಪಿಕಪ್‌ನ {minutes} ನಿಮಿಷಗಳ ಒಳಗಿದೆ, ಆದ್ದರಿಂದ ಮರುಪಾವತಿ ಸಿಗುವುದಿಲ್ಲ. | ☐ |
| `cancel.freeUntil` | Free cancellation until {time} | {time} तक मुफ़्त रद्दीकरण | {time} ವರೆಗೆ ಉಚಿತ ರದ್ದತಿ | ☐ |
| `cancel.late` | Free cancellation has ended. Cancelling now is not refunded. | मुफ़्त रद्दीकरण का समय खत्म हो गया है। अब रद्द करने पर रिफ़ंड नहीं मिलेगा। | ಉಚಿತ ರದ್ದತಿಯ ಸಮಯ ಮುಗಿದಿದೆ. ಈಗ ರದ್ದುಮಾಡಿದರೆ ಮರುಪಾವತಿ ಇಲ್ಲ. | ☐ |
| `cancel.policy` | Cancel for free until {minutes} minutes before pickup starts and any online payment is refunded in full. After that, cancelling is not refunded. If the vendor cancels, you always get a full refund. | पिकअप शुरू होने से {minutes} मिनट पहले तक मुफ़्त रद्द करें, और ऑनलाइन भुगतान पूरा वापस मिलेगा। उसके बाद रद्द करने पर रिफ़ंड नहीं मिलेगा। अगर विक्रेता रद्द करता है, तो आपको हमेशा पूरा रिफ़ंड मिलेगा। | ಪಿಕಪ್ ಆರಂಭವಾಗುವ {minutes} ನಿಮಿಷ ಮೊದಲವರೆಗೆ ಉಚಿತವಾಗಿ ರದ್ದುಮಾಡಬಹುದು ಮತ್ತು ಆನ್‌ಲೈನ್ ಪಾವತಿ ಪೂರ್ತಿ ಮರುಪಾವತಿಯಾಗುತ್ತದೆ. ಅದರ ನಂತರ ರದ್ದುಮಾಡಿದರೆ ಮರುಪಾವತಿ ಇಲ್ಲ. ಮಾರಾಟಗಾರರು ರದ್ದುಮಾಡಿದರೆ ನಿಮಗೆ ಯಾವಾಗಲೂ ಪೂರ್ಣ ಮರುಪಾವತಿ ಸಿಗುತ್ತದೆ. | ☐ |

## cancelr

| Key | English | हिन्दी | ಕನ್ನಡ | OK? |
|---|---|---|---|---|
| `cancelr.admin` | Refunded by an administrator | एडमिन द्वारा रिफ़ंड किया गया | ನಿರ್ವಾಹಕರಿಂದ ರಿಫಂಡ್ ಮಾಡಲಾಗಿದೆ | ☐ |
| `cancelr.customer` | Cancelled by customer | ग्राहक ने रद्द किया | ಗ್ರಾಹಕರು ರದ್ದು ಮಾಡಿದ್ದಾರೆ | ☐ |
| `cancelr.customerLate` | Late cancellation by customer (no refund) | ग्राहक ने देर से रद्द किया (रिफ़ंड नहीं) | ಗ್ರಾಹಕರು ತಡವಾಗಿ ರದ್ದು ಮಾಡಿದ್ದಾರೆ (ರಿಫಂಡ್ ಇಲ್ಲ) | ☐ |
| `cancelr.vendor` | Vendor cancelled listing: {reason} | विक्रेता ने लिस्टिंग रद्द की: {reason} | ಮಾರಾಟಗಾರರು ಲಿಸ್ಟಿಂಗ್ ರದ್ದು ಮಾಡಿದ್ದಾರೆ: {reason} | ☐ |

## category

| Key | English | हिन्दी | ಕನ್ನಡ | OK? |
|---|---|---|---|---|
| `category.Bakery` | Bakery | बेकरी | ಬೇಕರಿ | ☐ |
| `category.Desserts` | Desserts | मिठाई और डेज़र्ट | ಸಿಹಿ ತಿನಿಸುಗಳು | ☐ |
| `category.Meals` | Meals | भोजन | ಊಟ | ☐ |
| `category.Snacks` | Snacks | नाश्ता | ತಿಂಡಿ | ☐ |

## cert

| Key | English | हिन्दी | ಕನ್ನಡ | OK? |
|---|---|---|---|---|
| `cert.charities` | Charities served | सेवा की गई संस्थाएँ | ಸೇವೆ ಪಡೆದ ಸಂಸ್ಥೆಗಳು | ☐ |
| `cert.co2` | CO2e avoided (kg, est.) | बचाया गया CO2e (किग्रा, अनुमानित) | ತಪ್ಪಿಸಿದ CO2e (ಕೆಜಿ, ಅಂದಾಜು) | ☐ |
| `cert.disclaimer` | Estimates: one listed unit counts as one meal; only completed handovers are counted. This is a statement of impact, not a financial or tax document. | अनुमान: एक लिस्ट की गई इकाई एक भोजन मानी जाती है; केवल पूरे हुए हैंडओवर गिने जाते हैं। यह प्रभाव का विवरण है, वित्तीय या कर दस्तावेज़ नहीं। | ಅಂದಾಜುಗಳು: ಪಟ್ಟಿ ಮಾಡಿದ ಒಂದು ಘಟಕ ಒಂದು ಊಟ; ಪೂರ್ಣಗೊಂಡ ಹಸ್ತಾಂತರಗಳನ್ನು ಮಾತ್ರ ಎಣಿಸಲಾಗುತ್ತದೆ. ಇದು ಪರಿಣಾಮದ ಹೇಳಿಕೆ, ಹಣಕಾಸು ಅಥವಾ ತೆರಿಗೆ ದಾಖಲೆಯಲ್ಲ. | ☐ |
| `cert.donated` | Donated | दान किए गए | ದಾನ ಮಾಡಿದವು | ☐ |
| `cert.download` | Download PDF | PDF डाउनलोड करें | PDF ಡೌನ್‌ಲೋಡ್ | ☐ |
| `cert.generate` | Generate | बनाएँ | ರಚಿಸಿ | ☐ |
| `cert.generated` | Certificate ready. | प्रमाणपत्र तैयार है। | ಪ್ರಮಾಣಪತ್ರ ಸಿದ್ಧವಾಗಿದೆ. | ☐ |
| `cert.help` | A monthly record of the meals you rescued, with a public verification page. | आपके बचाए गए भोजन का मासिक रिकॉर्ड, सार्वजनिक सत्यापन पेज के साथ। | ನೀವು ಉಳಿಸಿದ ಊಟಗಳ ಮಾಸಿಕ ದಾಖಲೆ, ಸಾರ್ವಜನಿಕ ಪರಿಶೀಲನಾ ಪುಟದೊಂದಿಗೆ. | ☐ |
| `cert.issued` | Issued {date} · ID {id} | जारी {date} · आईडी {id} | ನೀಡಿದ ದಿನಾಂಕ {date} · ಐಡಿ {id} | ☐ |
| `cert.kg` | Food rescued (kg, est.) | बचाया गया खाना (किग्रा, अनुमानित) | ಉಳಿಸಿದ ಆಹಾರ (ಕೆಜಿ, ಅಂದಾಜು) | ☐ |
| `cert.meals` | Meals rescued | बचाए गए भोजन | ಉಳಿಸಿದ ಊಟಗಳು | ☐ |
| `cert.month` | Month | महीना | ತಿಂಗಳು | ☐ |
| `cert.monthToDate` | Month to date | महीने की अब तक की स्थिति | ತಿಂಗಳ ಇದುವರೆಗಿನ ಸ್ಥಿತಿ | ☐ |
| `cert.none` | No certificates yet. They are created on the 1st for the month before, or generate one now. | अभी कोई प्रमाणपत्र नहीं। ये हर महीने की 1 तारीख को पिछले महीने के लिए बनते हैं, या अभी बनाएँ। | ಇನ್ನೂ ಪ್ರಮಾಣಪತ್ರಗಳಿಲ್ಲ. ಇವು ಪ್ರತಿ ತಿಂಗಳ 1ರಂದು ಹಿಂದಿನ ತಿಂಗಳಿಗೆ ರಚಿತವಾಗುತ್ತವೆ, ಅಥವಾ ಈಗಲೇ ರಚಿಸಿ. | ☐ |
| `cert.notFound` | Certificate not found | प्रमाणपत्र नहीं मिला | ಪ್ರಮಾಣಪತ್ರ ಸಿಗಲಿಲ್ಲ | ☐ |
| `cert.notFoundHelp` | Check the verification ID printed on the certificate. IDs look like SAP-XXXX-XXXX-XXXX. | प्रमाणपत्र पर छपी सत्यापन आईडी जाँचें। आईडी ऐसी दिखती है: SAP-XXXX-XXXX-XXXX। | ಪ್ರಮಾಣಪತ್ರದಲ್ಲಿ ಮುದ್ರಿತ ಪರಿಶೀಲನಾ ಐಡಿಯನ್ನು ಪರಿಶೀಲಿಸಿ. ಐಡಿ ಹೀಗಿರುತ್ತದೆ: SAP-XXXX-XXXX-XXXX. | ☐ |
| `cert.partial` | month to date, not final | महीने की अब तक की स्थिति, अंतिम नहीं | ತಿಂಗಳ ಇದುವರೆಗಿನ ಸ್ಥಿತಿ, ಅಂತಿಮವಲ್ಲ | ☐ |
| `cert.people` | People reached | पहुँचे लोग | ತಲುಪಿದ ಜನರು | ☐ |
| `cert.revenue` | Revenue recovered | वसूली गई आय | ಮರುಪಡೆದ ಆದಾಯ | ☐ |
| `cert.sold` | Sold at a discount | छूट पर बिके | ರಿಯಾಯಿತಿಯಲ್ಲಿ ಮಾರಾಟ | ☐ |
| `cert.title` | Impact certificates | प्रभाव प्रमाणपत्र | ಪರಿಣಾಮ ಪ್ರಮಾಣಪತ್ರಗಳು | ☐ |
| `cert.valid` | Verified by SAVE A PLATE | SAVE A PLATE द्वारा सत्यापित | SAVE A PLATE ಮೂಲಕ ಪರಿಶೀಲಿಸಲಾಗಿದೆ | ☐ |
| `cert.verifyLink` | Public page | सार्वजनिक पेज | ಸಾರ್ವಜನಿಕ ಪುಟ | ☐ |

## checkout

| Key | English | हिन्दी | ಕನ್ನಡ | OK? |
|---|---|---|---|---|
| `checkout.creditUsed` | Referral credit used | इस्तेमाल किया गया रेफ़रल क्रेडिट | ಬಳಸಿದ ರೆಫರಲ್ ಕ್ರೆಡಿಟ್ | ☐ |
| `checkout.ended` | This checkout is {status}. The units were released back to the listing. You have not been charged; any late payment is refunded in full. | यह चेकआउट {status} है। यूनिट वापस लिस्टिंग में छोड़ दी गईं। आपसे कुछ नहीं लिया गया; देर से हुआ कोई भी भुगतान पूरा वापस किया जाएगा। | ಈ ಚೆಕ್‌ಔಟ್ {status} ಆಗಿದೆ. ಯೂನಿಟ್‌ಗಳನ್ನು ಮತ್ತೆ ಲಿಸ್ಟಿಂಗ್‌ಗೆ ಬಿಡಲಾಗಿದೆ. ನಿಮಗೆ ಯಾವುದೇ ಶುಲ್ಕ ವಿಧಿಸಿಲ್ಲ; ತಡವಾಗಿ ಆದ ಯಾವುದೇ ಪಾವತಿ ಪೂರ್ತಿ ಮರುಪಾವತಿಯಾಗುತ್ತದೆ. | ☐ |
| `checkout.failed` | Payment failed. The units were released. | भुगतान विफल रहा। यूनिट छोड़ दी गईं। | ಪಾವತಿ ವಿಫಲವಾಯಿತು. ಯೂನಿಟ್‌ಗಳನ್ನು ಬಿಡುಗಡೆ ಮಾಡಲಾಗಿದೆ. | ☐ |
| `checkout.held` | Units held for you: | आपके लिए रोकी गई यूनिट: | ನಿಮಗಾಗಿ ಹಿಡಿದಿಟ್ಟ ಯೂನಿಟ್‌ಗಳು: | ☐ |
| `checkout.holdExpired` | hold expired — refresh | होल्ड खत्म — पेज रीफ़्रेश करें | ಹೋಲ್ಡ್ ಮುಗಿದಿದೆ — ರಿಫ್ರೆಶ್ ಮಾಡಿ | ☐ |
| `checkout.lateRefund` | Payment arrived after your hold expired. A full test-mode refund was initiated; no order was created. | आपका होल्ड खत्म होने के बाद भुगतान आया। पूरा टेस्ट-मोड रिफ़ंड शुरू कर दिया गया है; कोई ऑर्डर नहीं बना। | ನಿಮ್ಮ ಹೋಲ್ಡ್ ಮುಗಿದ ನಂತರ ಪಾವತಿ ಬಂದಿತು. ಪೂರ್ಣ ಪರೀಕ್ಷಾ-ಮೋಡ್ ಮರುಪಾವತಿ ಆರಂಭಿಸಲಾಗಿದೆ; ಯಾವುದೇ ಆರ್ಡರ್ ರಚಿಸಲಿಲ್ಲ. | ☐ |
| `checkout.leftToPay` | left to pay | भुगतान के लिए बचा | ಪಾವತಿಗೆ ಉಳಿದಿದೆ | ☐ |
| `checkout.payWith` | Pay ₹{amount} with UPI / card | UPI / कार्ड से ₹{amount} चुकाएँ | UPI / ಕಾರ್ಡ್‌ನಿಂದ ₹{amount} ಪಾವತಿಸಿ | ☐ |
| `checkout.rzpLoadFail` | Could not load Razorpay Checkout | Razorpay चेकआउट लोड नहीं हो सका | Razorpay ಚೆಕ್‌ಔಟ್ ಲೋಡ್ ಆಗಲಿಲ್ಲ | ☐ |
| `checkout.rzpNote` | Razorpay TEST MODE — no real money moves. | Razorpay टेस्ट मोड — असली पैसे नहीं कटते। | Razorpay ಪರೀಕ್ಷಾ ಮೋಡ್ — ನಿಜವಾದ ಹಣ ಹೋಗುವುದಿಲ್ಲ. | ☐ |
| `checkout.simFail` | Simulate failed payment | विफल भुगतान का नमूना | ವಿಫಲ ಪಾವತಿ ಅನುಕರಿಸಿ | ☐ |
| `checkout.simNote` | SIMULATED PAYMENT · Razorpay test keys are not configured, so this demo adapter stands in. No money moves. | नकली भुगतान · Razorpay टेस्ट कुंजियाँ सेट नहीं हैं, इसलिए यह डेमो अडैप्टर काम कर रहा है। कोई पैसा नहीं कटता। | ಅನುಕರಣೆ ಪಾವತಿ · Razorpay ಪರೀಕ್ಷಾ ಕೀಗಳನ್ನು ಹೊಂದಿಸಿಲ್ಲ, ಆದ್ದರಿಂದ ಈ ಡೆಮೊ ಅಡಾಪ್ಟರ್ ಬಳಸಲಾಗುತ್ತಿದೆ. ಯಾವುದೇ ಹಣ ಹೋಗುವುದಿಲ್ಲ. | ☐ |
| `checkout.simOk` | Simulate successful payment · ₹{amount} | सफल भुगतान का नमूना · ₹{amount} | ಯಶಸ್ವಿ ಪಾವತಿ ಅನುಕರಿಸಿ · ₹{amount} | ☐ |
| `checkout.status` | Payment status: {pay} · Hold status: {hold} | भुगतान की स्थिति: {pay} · होल्ड की स्थिति: {hold} | ಪಾವತಿ ಸ್ಥಿತಿ: {pay} · ಹೋಲ್ಡ್ ಸ್ಥಿತಿ: {hold} | ☐ |
| `checkout.title` | CHECKOUT | चेकआउट | ಚೆಕ್‌ಔಟ್ | ☐ |

## common

| Key | English | हिन्दी | ಕನ್ನಡ | OK? |
|---|---|---|---|---|
| `common.add` | Add | जोड़ें | ಸೇರಿಸಿ | ☐ |
| `common.apply` | Apply | लागू करें | ಅನ್ವಯಿಸಿ | ☐ |
| `common.back` | Back | वापस | ಹಿಂದೆ | ☐ |
| `common.cancel` | Cancel | रद्द करें | ರದ್ದುಮಾಡಿ | ☐ |
| `common.close` | Close | बंद करें | ಮುಚ್ಚಿ | ☐ |
| `common.confirm` | Confirm | पुष्टि करें | ದೃಢೀಕರಿಸಿ | ☐ |
| `common.connecting` | Connecting… | जुड़ रहा है… | ಸಂಪರ್ಕಿಸುತ್ತಿದೆ… | ☐ |
| `common.copied` | Copied | कॉपी हो गया | ನಕಲಿಸಲಾಗಿದೆ | ☐ |
| `common.copy` | Copy | कॉपी करें | ನಕಲಿಸಿ | ☐ |
| `common.download` | Download | डाउनलोड करें | ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ | ☐ |
| `common.edit` | Edit | बदलें | ಬದಲಿಸಿ | ☐ |
| `common.empty` | Nothing here yet. | यहाँ अभी कुछ नहीं है। | ಇಲ್ಲಿ ಇನ್ನೂ ಏನೂ ಇಲ್ಲ. | ☐ |
| `common.ended` | Ended | समाप्त | ಮುಗಿದಿದೆ | ☐ |
| `common.error` | Something went wrong. Please try again. | कुछ गड़बड़ हो गई। कृपया फिर कोशिश करें। | ಏನೋ ತಪ್ಪಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ. | ☐ |
| `common.findFood` | Find food nearby | पास में खाना खोजें | ಹತ್ತಿರದ ಆಹಾರ ಹುಡುಕಿ | ☐ |
| `common.hoursMinutes` | {h} h {m} min | {h} घंटे {m} मिनट | {h} ಗಂ {m} ನಿಮಿ | ☐ |
| `common.left` | left | बाकी | ಉಳಿದಿದೆ | ☐ |
| `common.loading` | Loading… | लोड हो रहा है… | ಲೋಡ್ ಆಗುತ್ತಿದೆ… | ☐ |
| `common.no` | No | नहीं | ಇಲ್ಲ | ☐ |
| `common.off` | Off | बंद | ಆಫ್ | ☐ |
| `common.on` | On | चालू | ಆನ್ | ☐ |
| `common.optional` | optional | वैकल्पिक | ಐಚ್ಛಿಕ | ☐ |
| `common.remove` | Remove | हटाएँ | ತೆಗೆದುಹಾಕಿ | ☐ |
| `common.retry` | Try again | फिर कोशिश करें | ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ | ☐ |
| `common.save` | Save | सहेजें | ಉಳಿಸಿ | ☐ |
| `common.saved` | Saved. | सहेज लिया गया। | ಉಳಿಸಲಾಗಿದೆ. | ☐ |
| `common.saving` | Saving… | सहेजा जा रहा है… | ಉಳಿಸಲಾಗುತ್ತಿದೆ… | ☐ |
| `common.search` | Search | खोजें | ಹುಡುಕಿ | ☐ |
| `common.sending` | Sending… | भेजा जा रहा है… | ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ… | ☐ |
| `common.soldOut` | Sold out | खत्म | ಮುಗಿದಿದೆ | ☐ |
| `common.total` | Total | कुल | ಒಟ್ಟು | ☐ |
| `common.view` | View | देखें | ವೀಕ್ಷಿಸಿ | ☐ |
| `common.working` | Working… | हो रहा है… | ಆಗುತ್ತಿದೆ… | ☐ |
| `common.yes` | Yes | हाँ | ಹೌದು | ☐ |

## credit

| Key | English | हिन्दी | ಕನ್ನಡ | OK? |
|---|---|---|---|---|
| `credit.balance` | Credit balance | क्रेडिट बैलेंस | ಕ್ರೆಡಿಟ್ ಬ್ಯಾಲೆನ್ಸ್ | ☐ |
| `credit.expires` | {amount} expires {date} | {amount} की अवधि {date} को समाप्त | {amount} {date} ರಂದು ಮುಗಿಯುತ್ತದೆ | ☐ |
| `credit.line` | Referral credit | रेफ़रल क्रेडिट | ರೆಫರಲ್ ಕ್ರೆಡಿಟ್ | ☐ |
| `credit.noCredit` | No credit yet | अभी कोई क्रेडिट नहीं | ಇನ್ನೂ ಕ್ರೆಡಿಟ್ ಇಲ್ಲ | ☐ |
| `credit.notCash` | Credit is not cash: it can't be withdrawn, and it pays up to {pct}% of an order. | क्रेडिट नकद नहीं है: इसे निकाला नहीं जा सकता, और इससे ऑर्डर का अधिकतम {pct}% चुकाया जा सकता है। | ಕ್ರೆಡಿಟ್ ನಗದು ಅಲ್ಲ: ಅದನ್ನು ಹಿಂಪಡೆಯಲಾಗದು, ಮತ್ತು ಅದು ಆರ್ಡರ್‌ನ ಗರಿಷ್ಠ {pct}% ಪಾವತಿಸುತ್ತದೆ. | ☐ |
| `credit.title` | Credit and referrals | क्रेडिट और रेफ़रल | ಕ್ರೆಡಿಟ್ ಮತ್ತು ರೆಫರಲ್‌ಗಳು | ☐ |
| `credit.toPay` | To pay | चुकाने के लिए | ಪಾವತಿಸಬೇಕಾದದ್ದು | ☐ |
| `credit.use` | Use {amount} credit | {amount} क्रेडिट इस्तेमाल करें | {amount} ಕ್ರೆಡಿಟ್ ಬಳಸಿ | ☐ |
| `credit.useHelp` | Balance {balance}. Credit can pay up to {pct}% of an order. | बैलेंस {balance}। क्रेडिट से ऑर्डर का अधिकतम {pct}% चुकाया जा सकता है। | ಬ್ಯಾಲೆನ್ಸ್ {balance}. ಕ್ರೆಡಿಟ್‌ನಿಂದ ಆರ್ಡರ್‌ನ ಗರಿಷ್ಠ {pct}% ಪಾವತಿಸಬಹುದು. | ☐ |

## deliv

| Key | English | हिन्दी | ಕನ್ನಡ | OK? |
|---|---|---|---|---|
| `deliv.cancel` | Cancel delivery | डिलीवरी रद्द करें | ಡೆಲಿವರಿ ರದ್ದುಮಾಡಿ | ☐ |
| `deliv.fee` | About {fee} via {provider} | {provider} से लगभग {fee} | {provider} ಮೂಲಕ ಸುಮಾರು {fee} | ☐ |
| `deliv.note` | A rider collects it from the vendor with your collection code. The food counts as collected only when the vendor verifies that code. | राइडर आपके संग्रह कोड के साथ वेंडर से इसे लेता है। खाना तभी लिया गया माना जाएगा जब वेंडर वह कोड सत्यापित करे। | ರೈಡರ್ ನಿಮ್ಮ ಸಂಗ್ರಹ ಕೋಡ್‌ನೊಂದಿಗೆ ವೆಂಡರ್‌ನಿಂದ ಅದನ್ನು ತೆಗೆದುಕೊಳ್ಳುತ್ತಾರೆ. ವೆಂಡರ್ ಆ ಕೋಡ್ ಪರಿಶೀಲಿಸಿದಾಗ ಮಾತ್ರ ಆಹಾರ ಸಂಗ್ರಹಿಸಲಾಗಿದೆ ಎಂದು ಪರಿಗಣಿಸಲಾಗುತ್ತದೆ. | ☐ |
| `deliv.request` | Request a rider | राइडर बुलाएँ | ರೈಡರ್ ಕರೆಯಿರಿ | ☐ |
| `deliv.retry` | Try again | फिर कोशिश करें | ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ | ☐ |
| `deliv.status.Cancelled` | Cancelled | रद्द | ರದ್ದಾಗಿದೆ | ☐ |
| `deliv.status.Delivered` | Delivered | पहुँचा दिया गया | ತಲುಪಿಸಲಾಗಿದೆ | ☐ |
| `deliv.status.Failed` | Delivery failed | डिलीवरी विफल | ಡೆಲಿವರಿ ವಿಫಲ | ☐ |
| `deliv.status.No rider found` | No rider found | कोई राइडर नहीं मिला | ರೈಡರ್ ಸಿಗಲಿಲ್ಲ | ☐ |
| `deliv.status.Picked up` | Picked up | उठा लिया गया | ತೆಗೆದುಕೊಳ್ಳಲಾಗಿದೆ | ☐ |
| `deliv.status.Requested` | Looking for a rider | राइडर ढूँढा जा रहा है | ರೈಡರ್ ಹುಡುಕಲಾಗುತ್ತಿದೆ | ☐ |
| `deliv.status.Rider assigned` | Rider on the way | राइडर रास्ते में | ರೈಡರ್ ದಾರಿಯಲ್ಲಿ | ☐ |
| `deliv.title` | Delivery | डिलीवरी | ಡೆಲಿವರಿ | ☐ |

## diet

| Key | English | हिन्दी | ಕನ್ನಡ | OK? |
|---|---|---|---|---|
| `diet.Non-vegetarian` | Non-vegetarian | मांसाहारी | ಮಾಂಸಾಹಾರ | ☐ |
| `diet.Vegetarian` | Vegetarian | शाकाहारी | ಸಸ್ಯಾಹಾರ | ☐ |
| `diet.nonVeg` | NON-VEG | मांसाहारी | ಮಾಂಸಾಹಾರ | ☐ |
| `diet.veg` | VEG | शाकाहारी | ಸಸ್ಯಾಹಾರ | ☐ |

## disc

| Key | English | हिन्दी | ಕನ್ನಡ | OK? |
|---|---|---|---|---|
| `disc.active` | active | चालू | ಸಕ್ರಿಯ | ☐ |
| `disc.after` | Pickup open after | इसके बाद पिकअप खुला | ಇದರ ನಂತರ ಪಿಕಪ್ ತೆರೆದಿರುವುದು | ☐ |
| `disc.all` | All | सभी | ಎಲ್ಲಾ | ☐ |
| `disc.any` | Any | कोई भी | ಯಾವುದಾದರೂ | ☐ |
| `disc.by` | Pickup starts by | पिकअप शुरू होने का समय (तक) | ಪಿಕಪ್ ಆರಂಭವಾಗುವ ಸಮಯ (ಒಳಗೆ) | ☐ |
| `disc.category` | Category | श्रेणी | ವರ್ಗ | ☐ |
| `disc.clear` | Clear filters | फ़िल्टर हटाएँ | ಫಿಲ್ಟರ್‌ಗಳನ್ನು ತೆರವುಗೊಳಿಸಿ | ☐ |
| `disc.count_one` | {n} listing within {km} km | {km} किमी के भीतर {n} लिस्टिंग | {km} ಕಿಮೀ ಒಳಗೆ {n} ಲಿಸ್ಟಿಂಗ್ | ☐ |
| `disc.count_other` | {n} listings within {km} km | {km} किमी के भीतर {n} लिस्टिंग | {km} ಕಿಮೀ ಒಳಗೆ {n} ಲಿಸ್ಟಿಂಗ್‌ಗಳು | ☐ |
| `disc.diet` | Diet | खान-पान | ಆಹಾರ ಪದ್ಧತಿ | ☐ |
| `disc.dietAll` | Veg + non-veg | शाकाहारी + मांसाहारी | ಸಸ್ಯಾಹಾರ + ಮಾಂಸಾಹಾರ | ☐ |
| `disc.dietNonVeg` | Non-vegetarian only | सिर्फ़ मांसाहारी | ಮಾಂಸಾಹಾರ ಮಾತ್ರ | ☐ |
| `disc.dietVeg` | Vegetarian only | सिर्फ़ शाकाहारी | ಸಸ್ಯಾಹಾರ ಮಾತ್ರ | ☐ |
| `disc.distance` | Distance: {km} km | दूरी: {km} किमी | ದೂರ: {km} ಕಿಮೀ | ☐ |
| `disc.emptyBody` | Widen the distance, clear filters, or check back closer to closing time. | दूरी बढ़ाएँ, फ़िल्टर हटाएँ, या बंद होने के समय के करीब दोबारा देखें। | ದೂರ ಹೆಚ್ಚಿಸಿ, ಫಿಲ್ಟರ್ ತೆರವುಗೊಳಿಸಿ, ಅಥವಾ ಮುಚ್ಚುವ ಸಮಯದ ಹತ್ತಿರ ಮತ್ತೆ ನೋಡಿ. | ☐ |
| `disc.emptyTitle` | Nothing nearby matches right now | अभी पास में कुछ नहीं मिला | ಈಗ ಹತ್ತಿರದಲ್ಲಿ ಹೊಂದಿಕೆಯಾಗುವುದು ಏನೂ ಇಲ್ಲ | ☐ |
| `disc.eyebrow` | Near you | आपके पास | ನಿಮ್ಮ ಹತ್ತಿರ | ☐ |
| `disc.filters` | Filters | फ़िल्टर | ಫಿಲ್ಟರ್‌ಗಳು | ☐ |
| `disc.gpsDenied` | Location permission denied. Choose a neighbourhood instead. | स्थान की अनुमति नहीं मिली। इसकी जगह कोई इलाक़ा चुनें। | ಸ್ಥಳದ ಅನುಮತಿ ನಿರಾಕರಿಸಲಾಗಿದೆ. ಬದಲಿಗೆ ಒಂದು ಪ್ರದೇಶ ಆಯ್ಕೆಮಾಡಿ. | ☐ |
| `disc.gpsOk` | Using your current location. | आपका मौजूदा स्थान इस्तेमाल हो रहा है। | ನಿಮ್ಮ ಪ್ರಸ್ತುತ ಸ್ಥಳ ಬಳಸಲಾಗುತ್ತಿದೆ. | ☐ |
| `disc.gpsUnavailable` | Location is not available in this browser. Choose a neighbourhood. | इस ब्राउज़र में स्थान उपलब्ध नहीं है। कोई इलाक़ा चुनें। | ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಸ್ಥಳ ಲಭ್ಯವಿಲ್ಲ. ಒಂದು ಪ್ರದೇಶ ಆಯ್ಕೆಮಾಡಿ. | ☐ |
| `disc.heading` | RESCUE SOMETHING TASTY | कुछ स्वादिष्ट बचाइए | ರುಚಿಕರವಾದದ್ದನ್ನು ಉಳಿಸಿ | ☐ |
| `disc.hideFilters` | Hide filters | फ़िल्टर छिपाएँ | ಫಿಲ್ಟರ್ ಮರೆಮಾಡಿ | ☐ |
| `disc.list` | List | सूची | ಪಟ್ಟಿ | ☐ |
| `disc.location` | Location | स्थान | ಸ್ಥಳ | ☐ |
| `disc.map` | Map | नक्शा | ನಕ್ಷೆ | ☐ |
| `disc.maxPrice` | Max price | अधिकतम कीमत | ಗರಿಷ್ಠ ಬೆಲೆ | ☐ |
| `disc.myLocation` | My location | मेरा स्थान | ನನ್ನ ಸ್ಥಳ | ☐ |
| `disc.pickup` | Pickup {window} · {category} | पिकअप {window} · {category} | ಪಿಕಪ್ {window} · {category} | ☐ |
| `disc.searchPh` | Food, category or restaurant | खाना, श्रेणी या रेस्तरां | ಆಹಾರ, ವರ್ಗ ಅಥವಾ ರೆಸ್ಟೋರೆಂಟ್ | ☐ |
| `disc.showFilters` | Search & filters | खोजें और फ़िल्टर | ಹುಡುಕಾಟ ಮತ್ತು ಫಿಲ್ಟರ್‌ಗಳು | ☐ |
| `disc.upTo` | Up to {amount} | {amount} तक | {amount} ವರೆಗೆ | ☐ |
| `disc.updating` | Updating… | अपडेट हो रहा है… | ಅಪ್‌ಡೇಟ್ ಆಗುತ್ತಿದೆ… | ☐ |
| `disc.useMyLocation` | Use my current location | मेरा मौजूदा स्थान इस्तेमाल करें | ನನ್ನ ಪ್ರಸ್ತುತ ಸ್ಥಳ ಬಳಸಿ | ☐ |
| `disc.view` | View | दृश्य | ನೋಟ | ☐ |

## dist

| Key | English | हिन्दी | ಕನ್ನಡ | OK? |
|---|---|---|---|---|
| `dist.add` | Log distribution | वितरण दर्ज करें | ವಿತರಣೆ ದಾಖಲಿಸಿ | ☐ |
| `dist.attached` | {n} photo(s) attached. | {n} तस्वीर जुड़ी। | {n} ಫೋಟೋ ಸೇರಿಸಲಾಗಿದೆ. | ☐ |
| `dist.centre` | Centre or place served | केंद्र या स्थान जहाँ परोसा गया | ಬಡಿಸಿದ ಕೇಂದ್ರ ಅಥವಾ ಸ್ಥಳ | ☐ |
| `dist.logged` | Distribution logged | वितरण दर्ज हो गया | ವಿತರಣೆ ದಾಖಲಾಗಿದೆ | ☐ |
| `dist.noFaces` | Please don't photograph people's faces. Photos of the food, the setting or the serving table are enough. | कृपया लोगों के चेहरों की तस्वीर न लें। खाने, जगह या परोसने की मेज़ की तस्वीरें काफ़ी हैं। | ದಯವಿಟ್ಟು ಜನರ ಮುಖಗಳ ಫೋಟೋ ತೆಗೆಯಬೇಡಿ. ಆಹಾರ, ಸ್ಥಳ ಅಥವಾ ಬಡಿಸುವ ಮೇಜಿನ ಫೋಟೋ ಸಾಕು. | ☐ |
| `dist.none` | No distribution logs yet. | अभी कोई वितरण लॉग नहीं। | ಇನ್ನೂ ವಿತರಣಾ ಲಾಗ್‌ಗಳಿಲ್ಲ. | ☐ |
| `dist.notes` | Notes | टिप्पणी | ಟಿಪ್ಪಣಿಗಳು | ☐ |
| `dist.people` | People reached | पहुँचे लोग | ತಲುಪಿದ ಜನರು | ☐ |
| `dist.photos` | Photos | तस्वीरें | ಫೋಟೋಗಳು | ☐ |
| `dist.save` | Save log | लॉग सहेजें | ಲಾಗ್ ಉಳಿಸಿ | ☐ |
| `dist.servings` | Servings distributed | बाँटे गए भोजन | ಹಂಚಿದ ಊಟಗಳು | ☐ |
| `dist.summary` | {servings} servings · {people} people · {centre} | {servings} भोजन · {people} लोग · {centre} | {servings} ಊಟ · {people} ಜನರು · {centre} | ☐ |
| `dist.title` | How was this food used? | यह खाना कैसे इस्तेमाल हुआ? | ಈ ಆಹಾರ ಹೇಗೆ ಬಳಕೆಯಾಯಿತು? | ☐ |
| `dist.vendorTitle` | Where your donations went | आपके दान कहाँ गए | ನಿಮ್ಮ ದಾನಗಳು ಎಲ್ಲಿಗೆ ಹೋದವು | ☐ |

## err

| Key | English | हिन्दी | ಕನ್ನಡ | OK? |
|---|---|---|---|---|
| `err.goHome` | Go home | होम पर जाएँ | ಮುಖಪುಟಕ್ಕೆ ಹೋಗಿ | ☐ |
| `err.notFoundBody` | This page or item doesn't exist, or you don't have access to it. | यह पेज या चीज़ मौजूद नहीं है, या आपके पास इसकी पहुँच नहीं है। | ಈ ಪುಟ ಅಥವಾ ವಸ್ತು ಅಸ್ತಿತ್ವದಲ್ಲಿಲ್ಲ, ಅಥವಾ ನಿಮಗೆ ಪ್ರವೇಶವಿಲ್ಲ. | ☐ |
| `err.notFoundTitle` | NOT FOUND | नहीं मिला | ಸಿಗಲಿಲ್ಲ | ☐ |

## eta

| Key | English | हिन्दी | ಕನ್ನಡ | OK? |
|---|---|---|---|---|
| `eta.arriving` | Arriving now | अभी पहुँच रहे हैं | ಈಗ ತಲುಪುತ್ತಿದ್ದಾರೆ | ☐ |
| `eta.denied` | Location is off, so choose the minutes yourself. | लोकेशन बंद है, इसलिए मिनट खुद चुनें। | ಸ್ಥಳ ಆಫ್ ಆಗಿದೆ, ಆದ್ದರಿಂದ ನಿಮಿಷಗಳನ್ನು ನೀವೇ ಆರಿಸಿ. | ☐ |
| `eta.help` | Tell the vendor roughly when you'll arrive. We only send the number of minutes, never your location. | वेंडर को मोटा-मोटा बताएँ कि आप कब पहुँचेंगे। हम केवल मिनटों की संख्या भेजते हैं, आपकी लोकेशन कभी नहीं। | ನೀವು ಯಾವಾಗ ತಲುಪುತ್ತೀರಿ ಎಂದು ವೆಂಡರ್‌ಗೆ ಅಂದಾಜಿಸಿ ಹೇಳಿ. ನಾವು ಕೇವಲ ನಿಮಿಷಗಳ ಸಂಖ್ಯೆಯನ್ನು ಕಳುಹಿಸುತ್ತೇವೆ, ನಿಮ್ಮ ಸ್ಥಳವನ್ನು ಎಂದಿಗೂ ಅಲ್ಲ. | ☐ |
| `eta.manual` | Or choose minutes | या मिनट खुद चुनें | ಅಥವಾ ನಿಮಿಷಗಳನ್ನು ಆರಿಸಿ | ☐ |
| `eta.minutes` | {n} min | {n} मिनट | {n} ನಿಮಿಷ | ☐ |
| `eta.notYet` | Available from 90 minutes before pickup opens. | पिकअप शुरू होने से 90 मिनट पहले से उपलब्ध। | ಪಿಕಪ್ ಆರಂಭಕ್ಕೆ 90 ನಿಮಿಷ ಮೊದಲಿನಿಂದ ಲಭ್ಯ. | ☐ |
| `eta.privacy` | Your phone works out the time and shares only minutes, while this page is open. Your location is not sent or stored. | आपका फ़ोन समय निकालता है और इस पेज के खुले रहने तक केवल मिनट साझा करता है। आपकी लोकेशन न भेजी जाती है, न सहेजी जाती है। | ನಿಮ್ಮ ಫೋನ್ ಸಮಯವನ್ನು ಲೆಕ್ಕ ಹಾಕಿ, ಈ ಪುಟ ತೆರೆದಿರುವಾಗ ಮಾತ್ರ ನಿಮಿಷಗಳನ್ನು ಹಂಚುತ್ತದೆ. ನಿಮ್ಮ ಸ್ಥಳವನ್ನು ಕಳುಹಿಸುವುದೂ ಇಲ್ಲ, ಉಳಿಸುವುದೂ ಇಲ್ಲ. | ☐ |
| `eta.sharing` | Sharing: about {n} min | साझा हो रहा है: लगभग {n} मिनट | ಹಂಚಿಕೆ: ಸುಮಾರು {n} ನಿಮಿಷ | ☐ |
| `eta.stop` | Stop sharing | साझा करना बंद करें | ಹಂಚಿಕೆ ನಿಲ್ಲಿಸಿ | ☐ |
| `eta.title` | I'm on my way | मैं आ रहा/रही हूँ | ನಾನು ಬರುತ್ತಿದ್ದೇನೆ | ☐ |
| `eta.updated` | Updated {s}s ago | {s} सेकंड पहले अपडेट हुआ | {s} ಸೆಕೆಂಡ್ ಹಿಂದೆ ನವೀಕರಿಸಲಾಗಿದೆ | ☐ |
| `eta.useLocation` | Estimate from my location | मेरी लोकेशन से अनुमान लगाएँ | ನನ್ನ ಸ್ಥಳದಿಂದ ಅಂದಾಜಿಸಿ | ☐ |
| `eta.vendor` | On the way · ~{n} min | रास्ते में · ~{n} मिनट | ದಾರಿಯಲ್ಲಿ · ~{n} ನಿಮಿಷ | ☐ |
| `eta.vendorStale` | On the way · ~{n} min (last updated {m} min ago) | रास्ते में · ~{n} मिनट (आख़िरी अपडेट {m} मिनट पहले) | ದಾರಿಯಲ್ಲಿ · ~{n} ನಿಮಿಷ (ಕೊನೆಯ ನವೀಕರಣ {m} ನಿಮಿಷ ಹಿಂದೆ) | ☐ |

## follow

| Key | English | हिन्दी | ಕನ್ನಡ | OK? |
|---|---|---|---|---|
| `follow.emptyBody` | Follow restaurants from a listing page and we'll tell you when they post. | लिस्टिंग पेज से रेस्तरां को फ़ॉलो करें, जब वे कुछ डालेंगे तो हम आपको बताएँगे। | ಲಿಸ್ಟಿಂಗ್ ಪುಟದಿಂದ ರೆಸ್ಟೋರೆಂಟ್‌ಗಳನ್ನು ಫಾಲೋ ಮಾಡಿ, ಅವರು ಹೊಸದಾಗಿ ಹಾಕಿದಾಗ ನಾವು ತಿಳಿಸುತ್ತೇವೆ. | ☐ |
| `follow.emptyTitle` | You aren't following anyone yet | आप अभी किसी को फ़ॉलो नहीं कर रहे | ನೀವು ಇನ್ನೂ ಯಾರನ್ನೂ ಫಾಲೋ ಮಾಡುತ್ತಿಲ್ಲ | ☐ |
| `follow.follow` | Follow | फ़ॉलो करें | ಫಾಲೋ ಮಾಡಿ | ☐ |
| `follow.followAria` | Follow this restaurant | इस रेस्तरां को फ़ॉलो करें | ಈ ರೆಸ್ಟೋರೆಂಟ್ ಅನ್ನು ಫಾಲೋ ಮಾಡಿ | ☐ |
| `follow.following` | Following | फ़ॉलो कर रहे हैं | ಫಾಲೋ ಮಾಡುತ್ತಿದ್ದೀರಿ | ☐ |
| `follow.hint` | Get an alert when this restaurant lists food within 10 km. | यह रेस्तरां 10 किमी के भीतर खाना लिस्ट करे तो आपको सूचना मिलेगी। | ಈ ರೆಸ್ಟೋರೆಂಟ್ 10 ಕಿಮೀ ಒಳಗೆ ಆಹಾರ ಪಟ್ಟಿ ಮಾಡಿದಾಗ ನಿಮಗೆ ಅಲರ್ಟ್ ಸಿಗುತ್ತದೆ. | ☐ |
| `follow.live` | {n} live now | {n} अभी चालू | {n} ಈಗ ಲೈವ್ ಆಗಿವೆ | ☐ |
| `follow.none` | nothing live right now | अभी कुछ चालू नहीं | ಈಗ ಯಾವುದೂ ಲೈವ್ ಇಲ್ಲ | ☐ |
| `follow.title` | FOLLOWING | फ़ॉलो किए हुए | ಫಾಲೋ ಮಾಡಿದವರು | ☐ |
| `follow.unfollow` | Unfollow | फ़ॉलो हटाएँ | ಅನ್‌ಫಾಲೋ ಮಾಡಿ | ☐ |
| `follow.unfollowAria` | Unfollow this restaurant | इस रेस्तरां को फ़ॉलो करना बंद करें | ಈ ರೆಸ್ಟೋರೆಂಟ್ ಅನ್‌ಫಾಲೋ ಮಾಡಿ | ☐ |

## footer

| Key | English | हिन्दी | ಕನ್ನಡ | OK? |
|---|---|---|---|---|
| `footer.demoNote` | Demo build: all restaurants, NGOs, ratings and approvals are fictional; payments are simulated or Razorpay TEST mode. Impact counts treat one listed unit as one meal and count only completed handovers. | डेमो संस्करण: सभी रेस्तराँ, एनजीओ, रेटिंग और अनुमोदन काल्पनिक हैं; भुगतान नकली हैं या Razorpay TEST मोड में। प्रभाव की गिनती में एक लिस्ट की गई इकाई को एक भोजन माना जाता है और केवल पूरे हुए हैंडओवर गिने जाते हैं। | ಡೆಮೊ ಆವೃತ್ತಿ: ಎಲ್ಲಾ ರೆಸ್ಟೋರೆಂಟ್‌ಗಳು, ಎನ್‌ಜಿಒಗಳು, ರೇಟಿಂಗ್‌ಗಳು ಮತ್ತು ಅನುಮೋದನೆಗಳು ಕಾಲ್ಪನಿಕ; ಪಾವತಿಗಳು ನಕಲಿ ಅಥವಾ Razorpay TEST ಮೋಡ್‌ನಲ್ಲಿವೆ. ಪರಿಣಾಮದ ಲೆಕ್ಕದಲ್ಲಿ ಪಟ್ಟಿ ಮಾಡಿದ ಒಂದು ಘಟಕವನ್ನು ಒಂದು ಊಟವೆಂದು ಪರಿಗಣಿಸಲಾಗುತ್ತದೆ ಮತ್ತು ಪೂರ್ಣಗೊಂಡ ಹಸ್ತಾಂತರಗಳನ್ನು ಮಾತ್ರ ಎಣಿಸಲಾಗುತ್ತದೆ. | ☐ |
| `footer.tagline` | RESCUING GOOD FOOD, REDUCING WASTE, AND MAKING EVERY MEAL COUNT. · EST. 2026 | अच्छा खाना बचाएँ, बर्बादी घटाएँ, हर निवाले को सार्थक बनाएँ। · स्थापना 2026 | ಒಳ್ಳೆಯ ಆಹಾರ ಉಳಿಸಿ, ವ್ಯರ್ಥ ಕಡಿಮೆ ಮಾಡಿ, ಪ್ರತಿ ಊಟಕ್ಕೂ ಅರ್ಥ ತನ್ನಿ. · ಸ್ಥಾಪನೆ 2026 | ☐ |

## header

| Key | English | हिन्दी | ಕನ್ನಡ | OK? |
|---|---|---|---|---|
| `header.account` | Account | खाता | ಖಾತೆ | ☐ |
| `header.demoBanner` | DEMO MODE · fictional businesses · simulated payments | डेमो मोड · काल्पनिक व्यवसाय · नकली भुगतान | ಡೆಮೊ ಮೋಡ್ · ಕಾಲ್ಪನಿಕ ವ್ಯವಹಾರಗಳು · ನಕಲಿ ಪಾವತಿಗಳು | ☐ |
| `header.demoClock` | Demo clock: | डेमो घड़ी: | ಡೆಮೊ ಗಡಿಯಾರ: | ☐ |
| `header.demoTools` | Demo tools | डेमो टूल | ಡೆಮೊ ಸಾಧನಗಳು | ☐ |
| `header.home` | SAVE A PLATE home | SAVE A PLATE होम | SAVE A PLATE ಮುಖಪುಟ | ☐ |
| `header.main` | Main | मुख्य | ಮುಖ್ಯ | ☐ |
| `header.menu` | Menu | मेन्यू | ಮೆನು | ☐ |
| `header.notif` | Notifications | सूचनाएँ | ಅಧಿಸೂಚನೆಗಳು | ☐ |
| `header.notifNone` | Nothing yet. | अभी कुछ नहीं। | ಇನ್ನೂ ಏನೂ ಇಲ್ಲ. | ☐ |
| `header.notifTitle` | Notifications (in-app) | सूचनाएँ (ऐप में) | ಅಧಿಸೂಚನೆಗಳು (ಆ್ಯಪ್‌ನಲ್ಲಿ) | ☐ |
| `header.notifUnread` | Notifications, {n} unread | सूचनाएँ, {n} अनपढ़ी | ಅಧಿಸೂಚನೆಗಳು, {n} ಓದದಿರುವುದು | ☐ |
| `header.plus15` | +15 min | +15 मिनट | +15 ನಿಮಿ | ☐ |
| `header.plus1h` | +1 h | +1 घंटा | +1 ಗಂ | ☐ |
| `header.realTime` | Real time | असली समय | ನಿಜವಾದ ಸಮಯ | ☐ |
| `header.resetConfirm` | Reset all demo data? | सारा डेमो डेटा रीसेट करें? | ಎಲ್ಲಾ ಡೆಮೊ ಡೇಟಾ ಮರುಹೊಂದಿಸಬೇಕೇ? | ☐ |
| `header.resetData` | Reset demo data | डेमो डेटा रीसेट करें | ಡೆಮೊ ಡೇಟಾ ಮರುಹೊಂದಿಸಿ | ☐ |
| `header.role.admin` | Admin | एडमिन | ಅಡ್ಮಿನ್ | ☐ |
| `header.role.customer` | Customer | ग्राहक | ಗ್ರಾಹಕ | ☐ |
| `header.role.ngo` | Charity | संस्था | ಸಂಸ್ಥೆ | ☐ |
| `header.role.vendor` | Vendor | वेंडर | ವೆಂಡರ್ | ☐ |
| `header.serverTime` | Server time {time} IST | सर्वर समय {time} IST | ಸರ್ವರ್ ಸಮಯ {time} IST | ☐ |
| `header.signIn` | Sign in | साइन इन | ಸೈನ್ ಇನ್ | ☐ |
| `header.switchRole` | Switch role | भूमिका बदलें | ಪಾತ್ರ ಬದಲಿಸಿ | ☐ |

## impact

| Key | English | हिन्दी | ಕನ್ನಡ | OK? |
|---|---|---|---|---|
| `impact.badge.first_rescue.hint` | Pick up your first order | अपना पहला ऑर्डर लें | ನಿಮ್ಮ ಮೊದಲ ಆರ್ಡರ್ ತೆಗೆದುಕೊಳ್ಳಿ | ☐ |
| `impact.badge.first_rescue.label` | First rescue | पहला बचाव | ಮೊದಲ ಉಳಿತಾಯ | ☐ |
| `impact.badge.five_rescues.hint` | 5 rescues | 5 बचाव | 5 ಉಳಿತಾಯಗಳು | ☐ |
| `impact.badge.five_rescues.label` | Plate Saver | प्लेट सेवर | ಪ್ಲೇಟ್ ಸೇವರ್ | ☐ |
| `impact.badge.saved_500.hint` | Save ₹500 vs. original prices | असली कीमत के मुकाबले ₹500 बचाएँ | ಮೂಲ ಬೆಲೆಗಳಿಗೆ ಹೋಲಿಸಿದರೆ ₹500 ಉಳಿಸಿ | ☐ |
| `impact.badge.saved_500.label` | ₹500 saved | ₹500 बचाए | ₹500 ಉಳಿತಾಯ | ☐ |
| `impact.badge.streak_2.hint` | Rescue in 2 weeks in a row | लगातार 2 हफ़्ते खाना बचाएँ | ಸತತ 2 ವಾರ ಆಹಾರ ಉಳಿಸಿ | ☐ |
| `impact.badge.streak_2.label` | On a roll | लगातार जारी | ಸತತವಾಗಿ ಮುಂದುವರಿದಿದೆ | ☐ |
| `impact.badge.ten_rescues.hint` | 10 rescues | 10 बचाव | 10 ಉಳಿತಾಯಗಳು | ☐ |
| `impact.badge.ten_rescues.label` | Food Hero | फ़ूड हीरो | ಫುಡ್ ಹೀರೋ | ☐ |
| `impact.badges` | Badges | बैज | ಬ್ಯಾಡ್ಜ್‌ಗಳು | ☐ |
| `impact.best_one` | Best: {n} week | सबसे अच्छा: {n} हफ़्ता | ಅತ್ಯುತ್ತಮ: {n} ವಾರ | ☐ |
| `impact.best_other` | Best: {n} weeks | सबसे अच्छा: {n} हफ़्ते | ಅತ್ಯುತ್ತಮ: {n} ವಾರಗಳು | ☐ |
| `impact.co2` | kg CO₂e avoided | किलो CO₂e उत्सर्जन से बचाव | ಕೆಜಿ CO₂e ತಪ್ಪಿಸಲಾಗಿದೆ | ☐ |
| `impact.earned` | Earned | मिल गया | ಗಳಿಸಿದ್ದು | ☐ |
| `impact.emptyBody` | Pick up your first order and your impact shows up here. | अपना पहला ऑर्डर ले लें, फिर आपका असर यहाँ दिखेगा। | ನಿಮ್ಮ ಮೊದಲ ಆರ್ಡರ್ ತೆಗೆದುಕೊಳ್ಳಿ, ನಿಮ್ಮ ಪರಿಣಾಮ ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತದೆ. | ☐ |
| `impact.emptyTitle` | No rescues yet | अभी तक कुछ नहीं बचाया | ಇನ್ನೂ ಏನನ್ನೂ ಉಳಿಸಿಲ್ಲ | ☐ |
| `impact.kg` | kg food rescued | किलो खाना बचाया | ಕೆಜಿ ಆಹಾರ ಉಳಿಸಲಾಗಿದೆ | ☐ |
| `impact.meals` | meals rescued | बचाए गए भोजन | ಉಳಿಸಿದ ಊಟಗಳು | ☐ |
| `impact.method` | Estimate: 1 meal ≈ {kg} kg of food; 1 kg of food ≈ {co2} kg CO₂e. | अनुमान: 1 भोजन ≈ {kg} किलो खाना; 1 किलो खाना ≈ {co2} किलो CO₂e। | ಅಂದಾಜು: 1 ಊಟ ≈ {kg} ಕೆಜಿ ಆಹಾರ; 1 ಕೆಜಿ ಆಹಾರ ≈ {co2} ಕೆಜಿ CO₂e. | ☐ |
| `impact.noStreak` | No streak yet | अभी कोई लगातार कड़ी नहीं | ಇನ್ನೂ ಸತತ ಸರಣಿ ಇಲ್ಲ | ☐ |
| `impact.saved` | saved vs. original price | असली कीमत के मुकाबले बचत | ಮೂಲ ಬೆಲೆಗೆ ಹೋಲಿಸಿದರೆ ಉಳಿತಾಯ | ☐ |
| `impact.streak` | {n}-week streak | {n} हफ़्तों की लगातार कड़ी | {n} ವಾರಗಳ ಸತತ ಸರಣಿ | ☐ |
| `impact.title` | Your impact | आपका असर | ನಿಮ್ಮ ಪರಿಣಾಮ | ☐ |

## land

| Key | English | हिन्दी | ಕನ್ನಡ | OK? |
|---|---|---|---|---|
| `land.continueAs` | Continue as {name} | {name} के रूप में जारी रखें | {name} ಆಗಿ ಮುಂದುವರಿಸಿ | ☐ |
| `land.eyebrow` | Bengaluru pilot · surplus food marketplace | बेंगलुरु पायलट · बचे खाने का बाज़ार | ಬೆಂಗಳೂರು ಪೈಲಟ್ · ಉಳಿದ ಆಹಾರದ ಮಾರುಕಟ್ಟೆ | ☐ |
| `land.headline` | TONIGHT'S SURPLUS, SOMEONE'S DINNER. | आज रात का बचा खाना, किसी का डिनर। | ಇಂದು ರಾತ್ರಿಯ ಉಳಿದ ಆಹಾರ, ಯಾರದೋ ಊಟ. | ☐ |
| `land.headlineAria` | Tonight's surplus, someone's dinner. | आज रात का बचा खाना, किसी का डिनर। | ಇಂದು ರಾತ್ರಿಯ ಉಳಿದ ಆಹಾರ, ಯಾರದೋ ಊಟ. | ☐ |
| `land.hint` | Hover or tap a slice to choose how you want to save a plate. | थाली का कोई हिस्सा छुएँ और चुनें कि आप कैसे खाना बचाना चाहते हैं। | ತಟ್ಟೆಯ ಒಂದು ಭಾಗವನ್ನು ಮುಟ್ಟಿ, ನೀವು ಹೇಗೆ ಆಹಾರ ಉಳಿಸಲು ಬಯಸುತ್ತೀರಿ ಎಂದು ಆರಿಸಿ. | ☐ |
| `land.hubPick` | PICK | चुनें | ಆರಿಸಿ | ☐ |
| `land.hubSide` | YOUR SIDE | अपना पक्ष | ನಿಮ್ಮ ಕಡೆ | ☐ |
| `land.hubSignIn` | → SIGN IN | → साइन इन | → ಸೈನ್ ಇನ್ | ☐ |
| `land.loading` | Loading Save a Plate | SAVE A PLATE लोड हो रहा है | SAVE A PLATE ಲೋಡ್ ಆಗುತ್ತಿದೆ | ☐ |
| `land.orSwitch` | Or switch sides | या दूसरा पक्ष चुनें | ಅಥವಾ ಬೇರೆ ಕಡೆ ಆರಿಸಿ | ☐ |
| `land.pickSide` | Pick your side of the plate | थाली का अपना पक्ष चुनें | ತಟ್ಟೆಯ ನಿಮ್ಮ ಕಡೆ ಆರಿಸಿ | ☐ |
| `land.plateAria` | Pick your side of the plate | थाली का अपना पक्ष चुनें | ತಟ್ಟೆಯ ನಿಮ್ಮ ಕಡೆ ಆರಿಸಿ | ☐ |
| `land.plating` | Plating up | थाली सज रही है | ತಟ್ಟೆ ಸಿದ್ಧವಾಗುತ್ತಿದೆ | ☐ |
| `land.s.customer.aria` | Find food near me. Sign in as a customer | पास में खाना खोजें। ग्राहक के रूप में साइन इन करें | ಹತ್ತಿರದಲ್ಲಿ ಆಹಾರ ಹುಡುಕಿ. ಗ್ರಾಹಕರಾಗಿ ಸೈನ್ ಇನ್ ಮಾಡಿ | ☐ |
| `land.s.customer.l1` | FIND FOOD | पास में | ಹತ್ತಿರದಲ್ಲಿ | ☐ |
| `land.s.customer.l2` | NEAR ME | खाना खोजें | ಆಹಾರ ಹುಡುಕಿ | ☐ |
| `land.s.customer.sub` | Grab discounted surplus from kitchens near you tonight. | आज रात अपने पास के किचन से छूट पर बचा खाना पाएँ। | ಇಂದು ರಾತ್ರಿ ನಿಮ್ಮ ಹತ್ತಿರದ ಅಡುಗೆಮನೆಗಳಿಂದ ರಿಯಾಯಿತಿಯಲ್ಲಿ ಉಳಿದ ಆಹಾರ ಪಡೆಯಿರಿ. | ☐ |
| `land.s.customer.word` | EAT | खाएँ | ತಿನ್ನಿ | ☐ |
| `land.s.ngo.aria` | Collect as an NGO. Sign in as an NGO | संस्था के रूप में खाना लें। संस्था के रूप में साइन इन करें | ಸಂಸ್ಥೆಯಾಗಿ ಆಹಾರ ಪಡೆಯಿರಿ. ಸಂಸ್ಥೆಯಾಗಿ ಸೈನ್ ಇನ್ ಮಾಡಿ | ☐ |
| `land.s.ngo.l1` | COLLECT AS | संस्था बनकर | ಸಂಸ್ಥೆಯಾಗಿ | ☐ |
| `land.s.ngo.l2` | AN NGO | खाना लें | ಆಹಾರ ಪಡೆಯಿರಿ | ☐ |
| `land.s.ngo.sub` | Claim free leftovers and get them to people who need them. | मुफ़्त बचा खाना लें और ज़रूरतमंद लोगों तक पहुँचाएँ। | ಉಚಿತ ಉಳಿದ ಆಹಾರ ಪಡೆದು ಅಗತ್ಯವಿರುವವರಿಗೆ ತಲುಪಿಸಿ. | ☐ |
| `land.s.ngo.word` | FEED | खिलाएँ | ಉಣಿಸಿ | ☐ |
| `land.s.vendor.aria` | List surplus as a vendor. Sign in as a vendor | वेंडर के रूप में बचा खाना लिस्ट करें। वेंडर के रूप में साइन इन करें | ವೆಂಡರ್ ಆಗಿ ಉಳಿದ ಆಹಾರ ಪಟ್ಟಿ ಮಾಡಿ. ವೆಂಡರ್ ಆಗಿ ಸೈನ್ ಇನ್ ಮಾಡಿ | ☐ |
| `land.s.vendor.l1` | LIST SURPLUS | बचा खाना | ಉಳಿದ ಆಹಾರ | ☐ |
| `land.s.vendor.l2` | AS A VENDOR | वेंडर बनकर बेचें | ವೆಂಡರ್ ಆಗಿ ಪಟ್ಟಿ ಮಾಡಿ | ☐ |
| `land.s.vendor.sub` | Turn today's extra into rescued meals in under a minute. | आज का बचा हुआ खाना एक मिनट से कम में बचाए गए भोजन में बदलें। | ಇಂದಿನ ಹೆಚ್ಚುವರಿ ಆಹಾರವನ್ನು ಒಂದು ನಿಮಿಷದೊಳಗೆ ಉಳಿಸಿದ ಊಟಗಳಾಗಿ ಬದಲಿಸಿ. | ☐ |
| `land.s.vendor.word` | LIST | बेचें | ಮಾರಿ | ☐ |
| `land.skip` | Skip | छोड़ें | ಬಿಟ್ಟುಬಿಡಿ | ☐ |
| `land.skipAria` | Skip welcome animation | स्वागत एनिमेशन छोड़ें | ಸ್ವಾಗತ ಅನಿಮೇಶನ್ ಬಿಟ್ಟುಬಿಡಿ | ☐ |
| `land.tagline` | RESCUING GOOD FOOD, REDUCING WASTE, AND MAKING EVERY MEAL COUNT. | अच्छा खाना बचाएँ, बर्बादी घटाएँ, हर निवाले को सार्थक बनाएँ। | ಒಳ್ಳೆಯ ಆಹಾರ ಉಳಿಸಿ, ವ್ಯರ್ಥ ಕಡಿಮೆ ಮಾಡಿ, ಪ್ರತಿ ಊಟಕ್ಕೂ ಅರ್ಥ ತನ್ನಿ. | ☐ |

## lang

| Key | English | हिन्दी | ಕನ್ನಡ | OK? |
|---|---|---|---|---|
| `lang.label` | Language | भाषा | ಭಾಷೆ | ☐ |

## listing

| Key | English | हिन्दी | ಕನ್ನಡ | OK? |
|---|---|---|---|---|
| `listing.allergens` | Allergens (vendor-supplied) | एलर्जी वाली चीज़ें (विक्रेता द्वारा दी गई) | ಅಲರ್ಜಿಕಾರಕಗಳು (ಮಾರಾಟಗಾರರು ನೀಡಿದ್ದು) | ☐ |
| `listing.available` | Available | उपलब्ध | ಲಭ್ಯವಿದೆ | ☐ |
| `listing.back` | Back to discover | खोज पर वापस जाएँ | ಹುಡುಕಾಟಕ್ಕೆ ಹಿಂತಿರುಗಿ | ☐ |
| `listing.cancelPolicy` | Cancellation policy. | रद्दीकरण नीति। | ರದ್ದತಿ ನೀತಿ. | ☐ |
| `listing.convenience` | Convenience fee | सुविधा शुल्क | ಅನುಕೂಲ ಶುಲ್ಕ | ☐ |
| `listing.convenienceVal` | ₹0 (pilot) | ₹0 (पायलट) | ₹0 (ಪೈಲಟ್) | ☐ |
| `listing.decrease` | Decrease quantity | मात्रा घटाएँ | ಪ್ರಮಾಣ ಕಡಿಮೆ ಮಾಡಿ | ☐ |
| `listing.directions` | Directions in Google Maps | Google Maps में रास्ता | Google Maps ನಲ್ಲಿ ದಾರಿ | ☐ |
| `listing.eatBy` | Eat by (vendor-supplied) | इससे पहले खाएँ (विक्रेता द्वारा दिया गया) | ಇದರೊಳಗೆ ತಿನ್ನಿ (ಮಾರಾಟಗಾರರು ನೀಡಿದ್ದು) | ☐ |
| `listing.foodSafetyBody` | signed by the vendor for this listing on {date}. | इस लिस्टिंग के लिए विक्रेता ने {date} को हस्ताक्षर किए। | ಈ ಲಿಸ್ಟಿಂಗ್‌ಗಾಗಿ ಮಾರಾಟಗಾರರು {date} ರಂದು ಸಹಿ ಮಾಡಿದ್ದಾರೆ. | ☐ |
| `listing.foodSafetyTitle` | Food-safety declaration | खाद्य-सुरक्षा घोषणा | ಆಹಾರ ಸುರಕ್ಷತಾ ಘೋಷಣೆ | ☐ |
| `listing.increase` | Increase quantity | मात्रा बढ़ाएँ | ಪ್ರಮಾಣ ಹೆಚ್ಚಿಸಿ | ☐ |
| `listing.limits` | Max {max} units per order · up to {active} active reservations · you have {have}. | प्रति ऑर्डर अधिकतम {max} यूनिट · {active} तक सक्रिय आरक्षण · आपके पास {have} हैं। | ಪ್ರತಿ ಆರ್ಡರ್‌ಗೆ ಗರಿಷ್ಠ {max} ಯೂನಿಟ್ · {active} ವರೆಗೆ ಸಕ್ರಿಯ ಕಾಯ್ದಿರಿಸುವಿಕೆ · ನಿಮ್ಮಲ್ಲಿ {have} ಇವೆ. | ☐ |
| `listing.maxActive` | You already have {max} active reservations. Collect or cancel one first. | आपके पास पहले से {max} सक्रिय आरक्षण हैं। पहले एक ले लें या रद्द करें। | ನಿಮ್ಮಲ್ಲಿ ಈಗಾಗಲೇ {max} ಸಕ್ರಿಯ ಕಾಯ್ದಿರಿಸುವಿಕೆಗಳಿವೆ. ಮೊದಲು ಒಂದನ್ನು ತೆಗೆದುಕೊಳ್ಳಿ ಅಥವಾ ರದ್ದುಮಾಡಿ. | ☐ |
| `listing.noneDeclared` | None declared | कोई नहीं बताई गई | ಯಾವುದನ್ನೂ ತಿಳಿಸಿಲ್ಲ | ☐ |
| `listing.of` | of {total} | {total} में से | {total} ರಲ್ಲಿ | ☐ |
| `listing.payAtPickup` | Pay at pickup | पिकअप पर भुगतान | ಪಿಕಪ್‌ನಲ್ಲಿ ಪಾವತಿ | ☐ |
| `listing.payAtPickupOk` | reserved instantly, pay the vendor at handover. | तुरंत आरक्षित, सामान लेते समय विक्रेता को भुगतान करें। | ತಕ್ಷಣ ಕಾಯ್ದಿರಿಸಲಾಗುತ್ತದೆ, ಹಸ್ತಾಂತರದ ಸಮಯದಲ್ಲಿ ಮಾರಾಟಗಾರರಿಗೆ ಪಾವತಿಸಿ. | ☐ |
| `listing.payLocked` | Pay at pickup unlocks after {need} completed pickups (you have {done}). | पिकअप पर भुगतान {need} पिकअप पूरे होने के बाद खुलता है (आपके {done} हुए हैं)। | ಪಿಕಪ್‌ನಲ್ಲಿ ಪಾವತಿ {need} ಪಿಕಪ್ ಪೂರ್ಣಗೊಂಡ ನಂತರ ತೆರೆಯುತ್ತದೆ (ನಿಮ್ಮದು {done}). | ☐ |
| `listing.payNow` | Pay now | अभी भुगतान करें | ಈಗಲೇ ಪಾವತಿಸಿ | ☐ |
| `listing.payNowBody` | UPI / card (test mode). Units held {minutes} minutes while you pay. | UPI / कार्ड (टेस्ट मोड)। भुगतान करते समय यूनिट {minutes} मिनट रोके जाते हैं। | UPI / ಕಾರ್ಡ್ (ಪರೀಕ್ಷಾ ಮೋಡ್). ನೀವು ಪಾವತಿಸುವಾಗ ಯೂನಿಟ್‌ಗಳನ್ನು {minutes} ನಿಮಿಷ ಹಿಡಿದಿಡಲಾಗುತ್ತದೆ. | ☐ |
| `listing.payOff` | Not offered by this vendor. | यह विक्रेता यह विकल्प नहीं देता। | ಈ ಮಾರಾಟಗಾರರು ಇದನ್ನು ನೀಡುವುದಿಲ್ಲ. | ☐ |
| `listing.payment` | Payment | भुगतान | ಪಾವತಿ | ☐ |
| `listing.pickupWindow` | Pickup window | पिकअप का समय | ಪಿಕಪ್ ಸಮಯ | ☐ |
| `listing.prepared` | Prepared | तैयार किया गया | ತಯಾರಿಸಿದ್ದು | ☐ |
| `listing.quantity` | Quantity | मात्रा | ಪ್ರಮಾಣ | ☐ |
| `listing.recentRatings` | Recent ratings | हाल की रेटिंग | ಇತ್ತೀಚಿನ ರೇಟಿಂಗ್‌ಗಳು | ☐ |
| `listing.reservePay` | Reserve & pay ₹{pay} | आरक्षित करें और ₹{pay} चुकाएँ | ಕಾಯ್ದಿರಿಸಿ ಮತ್ತು ₹{pay} ಪಾವತಿಸಿ | ☐ |
| `listing.reservePickup` | Reserve {qty} · pay at pickup | {qty} आरक्षित करें · पिकअप पर भुगतान | {qty} ಕಾಯ್ದಿರಿಸಿ · ಪಿಕಪ್‌ನಲ್ಲಿ ಪಾವತಿ | ☐ |
| `listing.reservePickupAmt` | Reserve {qty} · pay at pickup (₹{pay}) | {qty} आरक्षित करें · पिकअप पर भुगतान (₹{pay}) | {qty} ಕಾಯ್ದಿರಿಸಿ · ಪಿಕಪ್‌ನಲ್ಲಿ ಪಾವತಿ (₹{pay}) | ☐ |
| `listing.reserving` | Reserving… | आरक्षित हो रहा है… | ಕಾಯ್ದಿರಿಸಲಾಗುತ್ತಿದೆ… | ☐ |
| `listing.restaurant` | Restaurant | रेस्तरां | ರೆಸ್ಟೋರೆಂಟ್ | ☐ |
| `listing.storage` | Storage: {note} | रखने का तरीका: {note} | ಸಂಗ್ರಹಣೆ: {note} | ☐ |
| `listing.suspended` | Reservations are paused until {date} after repeated no-shows. You can still browse. | बार-बार न आने के कारण {date} तक आरक्षण रोके गए हैं। आप फिर भी देख सकते हैं। | ಪದೇ ಪದೇ ಬರದ ಕಾರಣ {date} ವರೆಗೆ ಕಾಯ್ದಿರಿಸುವಿಕೆ ನಿಲ್ಲಿಸಲಾಗಿದೆ. ನೀವು ಇನ್ನೂ ನೋಡಬಹುದು. | ☐ |
| `listing.unavailable` | This listing is no longer available to reserve ({status}). | यह लिस्टिंग अब आरक्षित करने के लिए उपलब्ध नहीं है ({status})। | ಈ ಲಿಸ್ಟಿಂಗ್ ಇನ್ನು ಕಾಯ್ದಿರಿಸಲು ಲಭ್ಯವಿಲ್ಲ ({status}). | ☐ |
| `listing.whatSay` | What customers say | ग्राहक क्या कहते हैं | ಗ್ರಾಹಕರು ಏನು ಹೇಳುತ್ತಾರೆ | ☐ |
| `listing.worthFor` | Worth ₹{worth} for ₹{price}. | ₹{worth} का सामान ₹{price} में। | ₹{worth} ಮೌಲ್ಯದ್ದು ₹{price} ಕ್ಕೆ. | ☐ |

## map

| Key | English | हिन्दी | ಕನ್ನಡ | OK? |
|---|---|---|---|---|
| `map.aria` | Demo map with {n} listings | {n} लिस्टिंग वाला डेमो नक्शा | {n} ಲಿಸ್ಟಿಂಗ್‌ಗಳಿರುವ ಡೆಮೊ ನಕ್ಷೆ | ☐ |
| `map.demo` | Demo map · no live map API key configured · positions are fictional demo outlets | डेमो नक्शा · कोई लाइव मैप API कुंजी सेट नहीं · स्थान काल्पनिक डेमो आउटलेट के हैं | ಡೆಮೊ ನಕ್ಷೆ · ಲೈವ್ ನಕ್ಷೆ API ಕೀ ಹೊಂದಿಸಿಲ್ಲ · ಸ್ಥಾನಗಳು ಕಾಲ್ಪನಿಕ ಡೆಮೊ ಔಟ್‌ಲೆಟ್‌ಗಳದ್ದು | ☐ |
| `map.keyDetected` | Map key detected — wire your provider in components/DemoMap.tsx | मैप कुंजी मिली — अपना प्रदाता components/DemoMap.tsx में जोड़ें | ನಕ್ಷೆ ಕೀ ಪತ್ತೆಯಾಗಿದೆ — ನಿಮ್ಮ ಪೂರೈಕೆದಾರರನ್ನು components/DemoMap.tsx ನಲ್ಲಿ ಸೇರಿಸಿ | ☐ |
| `map.marker` | {title}, {vendor}, ₹{price}, {qty} left | {title}, {vendor}, ₹{price}, {qty} बाकी | {title}, {vendor}, ₹{price}, {qty} ಉಳಿದಿವೆ | ☐ |
| `map.markerTitle` | {title} · {vendor} · ₹{price} · {qty} left | {title} · {vendor} · ₹{price} · {qty} बाकी | {title} · {vendor} · ₹{price} · {qty} ಉಳಿದಿವೆ | ☐ |
| `map.markers` | {n} markers · same results as the list | {n} मार्कर · सूची जैसे ही नतीजे | {n} ಮಾರ್ಕರ್‌ಗಳು · ಪಟ್ಟಿಯಂತೆಯೇ ಫಲಿತಾಂಶ | ☐ |

## markdown

| Key | English | हिन्दी | ಕನ್ನಡ | OK? |
|---|---|---|---|---|
| `markdown.addStep` | Add step | चरण जोड़ें | ಹಂತ ಸೇರಿಸಿ | ☐ |
| `markdown.applied` | {n} step(s) already ran. | {n} चरण पहले ही चल चुके हैं। | {n} ಹಂತ(ಗಳು) ಈಗಾಗಲೇ ನಡೆದಿವೆ. | ☐ |
| `markdown.help` | Lower the price automatically as pickup end nears. Up to 3 steps, 30–{max}% off the original price, each deeper than the last. A price only ever goes down. | पिकअप खत्म होने के करीब आने पर कीमत अपने-आप घटाएँ। अधिकतम 3 चरण, मूल कीमत पर 30–{max}% छूट, हर चरण पिछले से गहरा। कीमत केवल घटती है। | ಪಿಕಪ್ ಅಂತ್ಯ ಹತ್ತಿರವಾದಂತೆ ಬೆಲೆಯನ್ನು ತಾನಾಗಿಯೇ ಇಳಿಸಿ. ಗರಿಷ್ಠ 3 ಹಂತಗಳು, ಮೂಲ ಬೆಲೆಯ ಮೇಲೆ 30–{max}% ರಿಯಾಯಿತಿ, ಪ್ರತಿ ಹಂತ ಹಿಂದಿನದಕ್ಕಿಂತ ಹೆಚ್ಚು. ಬೆಲೆ ಕೇವಲ ಇಳಿಯುತ್ತದೆ. | ☐ |
| `markdown.noSuggestion` | No further markdown is suggested for this window and price. | इस समय-सीमा और कीमत के लिए आगे कोई मार्कडाउन नहीं सुझाया गया। | ಈ ಅವಧಿ ಮತ್ತು ಬೆಲೆಗೆ ಹೆಚ್ಚಿನ ಇಳಿಕೆ ಸೂಚಿಸಲಾಗಿಲ್ಲ. | ☐ |
| `markdown.pctOff` | % off | % छूट | % ರಿಯಾಯಿತಿ | ☐ |
| `markdown.removeStep` | Remove step {n} | चरण {n} हटाएँ | ಹಂತ {n} ತೆಗೆದುಹಾಕಿ | ☐ |
| `markdown.stepAt` | Step {n} at | चरण {n} का समय | ಹಂತ {n} ಸಮಯ | ☐ |
| `markdown.stepPrice` | Price becomes {price} | कीमत होगी {price} | ಬೆಲೆ {price} ಆಗುತ್ತದೆ | ☐ |
| `markdown.stepRange` | Enter 30–80 | 30–80 दर्ज करें | 30–80 ನಮೂದಿಸಿ | ☐ |
| `markdown.title` | Auto-markdown schedule (optional) | ऑटो-मार्कडाउन शेड्यूल (वैकल्पिक) | ಸ್ವಯಂ ಬೆಲೆ ಇಳಿಕೆ ವೇಳಾಪಟ್ಟಿ (ಐಚ್ಛಿಕ) | ☐ |
| `markdown.useSuggested` | Use suggested schedule | सुझाया गया शेड्यूल लगाएँ | ಸೂಚಿತ ವೇಳಾಪಟ್ಟಿ ಬಳಸಿ | ☐ |

## mod

| Key | English | हिन्दी | ಕನ್ನಡ | OK? |
|---|---|---|---|---|
| `mod.dismiss` | Dismiss | खारिज करें | ವಜಾಗೊಳಿಸಿ | ☐ |
| `mod.edit` | Save edit | बदलाव सहेजें | ಬದಲಾವಣೆ ಉಳಿಸಿ | ☐ |
| `mod.empty` | Nothing to moderate | मॉडरेट करने को कुछ नहीं | ಮಾಡರೇಟ್ ಮಾಡಲು ಏನೂ ಇಲ್ಲ | ☐ |
| `mod.emptyHelp` | Flagged items appear here. | चिह्नित आइटम यहाँ दिखेंगे। | ಗುರುತಿಸಲಾದ ಐಟಂಗಳು ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತವೆ. | ☐ |
| `mod.help` | Listings, reviews and vendors flagged by keyword or by 3 or more reports. Every action needs a reason and is recorded. | कीवर्ड या 3 या अधिक रिपोर्ट से चिह्नित लिस्टिंग, समीक्षाएँ और वेंडर। हर कार्रवाई के लिए कारण ज़रूरी है और दर्ज होता है। | ಕೀವರ್ಡ್ ಅಥವಾ 3 ಅಥವಾ ಹೆಚ್ಚು ವರದಿಗಳಿಂದ ಗುರುತಿಸಲಾದ ಲಿಸ್ಟಿಂಗ್‌ಗಳು, ವಿಮರ್ಶೆಗಳು ಮತ್ತು ವೆಂಡರ್‌ಗಳು. ಪ್ರತಿ ಕ್ರಿಯೆಗೂ ಕಾರಣ ಬೇಕು ಮತ್ತು ದಾಖಲಾಗುತ್ತದೆ. | ☐ |
| `mod.hide` | Hide now | अभी छिपाएँ | ಈಗ ಮರೆಮಾಡಿ | ☐ |
| `mod.history` | Decision history | निर्णय इतिहास | ನಿರ್ಧಾರ ಇತಿಹಾಸ | ☐ |
| `mod.newDescription` | Corrected description | सही विवरण | ಸರಿಪಡಿಸಿದ ವಿವರಣೆ | ☐ |
| `mod.newText` | Replacement text | बदला हुआ पाठ | ಬದಲಿ ಪಠ್ಯ | ☐ |
| `mod.newTitle` | Corrected title | सही शीर्षक | ಸರಿಪಡಿಸಿದ ಶೀರ್ಷಿಕೆ | ☐ |
| `mod.openCount` | {n} need review. | {n} की समीक्षा बाकी। | {n} ಪರಿಶೀಲನೆ ಬಾಕಿ. | ☐ |
| `mod.reason` | Reason (shown to the person affected) | कारण (प्रभावित व्यक्ति को दिखेगा) | ಕಾರಣ (ಪ್ರಭಾವಿತ ವ್ಯಕ್ತಿಗೆ ಕಾಣುತ್ತದೆ) | ☐ |
| `mod.restore` | Restore | बहाल करें | ಮರುಸ್ಥಾಪಿಸಿ | ☐ |
| `mod.review` | Review | समीक्षा करें | ಪರಿಶೀಲಿಸಿ | ☐ |
| `mod.state.hidden` | Hidden | छिपाया गया | ಮರೆಮಾಡಲಾಗಿದೆ | ☐ |
| `mod.state.open` | Needs review | समीक्षा चाहिए | ಪರಿಶೀಲನೆ ಬೇಕು | ☐ |
| `mod.state.resolved` | Reviewed | समीक्षित | ಪರಿಶೀಲಿಸಲಾಗಿದೆ | ☐ |
| `mod.suspend` | Suspend account | खाता निलंबित करें | ಖಾತೆ ಅಮಾನತು ಮಾಡಿ | ☐ |
| `mod.suspendDays` | Suspend for (days) | निलंबन (दिन) | ಅಮಾನತು (ದಿನಗಳು) | ☐ |
| `mod.title` | Moderation | मॉडरेशन | ಮಾಡರೇಶನ್ | ☐ |
| `mod.type.listing` | Listing | लिस्टिंग | ಲಿಸ್ಟಿಂಗ್ | ☐ |
| `mod.type.review` | Review | समीक्षा | ವಿಮರ್ಶೆ | ☐ |
| `mod.type.vendor` | Vendor | वेंडर | ವೆಂಡರ್ | ☐ |
| `mod.warn` | Warn | चेतावनी | ಎಚ್ಚರಿಕೆ | ☐ |

## nav

| Key | English | हिन्दी | ಕನ್ನಡ | OK? |
|---|---|---|---|---|
| `nav.analytics` | Analytics | विश्लेषण | ವಿಶ್ಲೇಷಣೆ | ☐ |
| `nav.approvals` | Approvals | अनुमोदन | ಅನುಮೋದನೆಗಳು | ☐ |
| `nav.cityImpact` | City impact | शहर पर प्रभाव | ನಗರದ ಪರಿಣಾಮ | ☐ |
| `nav.discover` | Discover | खोजें | ಹುಡುಕಿ | ☐ |
| `nav.donationFeed` | Donation feed | दान फ़ीड | ದಾನ ಫೀಡ್ | ☐ |
| `nav.flagged` | Flagged | चिह्नित | ಗುರುತಿಸಲಾದವು | ☐ |
| `nav.following` | Following | फ़ॉलो किए गए | ಅನುಸರಿಸುತ್ತಿರುವವರು | ☐ |
| `nav.moderation` | Moderation | मॉडरेशन | ಮಾಡರೇಶನ್ | ☐ |
| `nav.myImpact` | My impact | मेरा प्रभाव | ನನ್ನ ಪರಿಣಾಮ | ☐ |
| `nav.myOrders` | My orders | मेरे ऑर्डर | ನನ್ನ ಆರ್ಡರ್‌ಗಳು | ☐ |
| `nav.outletProfile` | Outlet profile | आउटलेट प्रोफ़ाइल | ಔಟ್‌ಲೆಟ್ ಪ್ರೊಫೈಲ್ | ☐ |
| `nav.payouts` | Payouts | भुगतान | ಪಾವತಿಗಳು | ☐ |
| `nav.quickList` | Quick list | तुरंत लिस्ट करें | ತ್ವರಿತ ಪಟ್ಟಿ | ☐ |
| `nav.receipts` | Receipts | रसीदें | ರಸೀದಿಗಳು | ☐ |
| `nav.referrals` | Credit and referrals | क्रेडिट और रेफ़रल | ಕ್ರೆಡಿಟ್ ಮತ್ತು ರೆಫರಲ್‌ಗಳು | ☐ |
| `nav.reports` | Reports | रिपोर्ट | ವರದಿಗಳು | ☐ |
| `nav.scan` | Scan & hand over | स्कैन करें और सौंपें | ಸ್ಕ್ಯಾನ್ ಮಾಡಿ ಹಸ್ತಾಂತರಿಸಿ | ☐ |
| `nav.settings` | Settings | सेटिंग्स | ಸೆಟ್ಟಿಂಗ್‌ಗಳು | ☐ |
| `nav.team` | Team | टीम | ತಂಡ | ☐ |
| `nav.today` | Today | आज | ಇಂದು | ☐ |
| `nav.verification` | Verification | सत्यापन | ಪರಿಶೀಲನೆ | ☐ |

## navd

| Key | English | हिन्दी | ಕನ್ನಡ | OK? |
|---|---|---|---|---|
| `navd.analytics` | Sales, best hours and certificates | बिक्री, सबसे अच्छे घंटे और प्रमाणपत्र | ಮಾರಾಟ, ಉತ್ತಮ ಸಮಯಗಳು ಮತ್ತು ಪ್ರಮಾಣಪತ್ರಗಳು | ☐ |
| `navd.approvals` | Review vendor and charity applications | वेंडर और संस्था के आवेदन देखें | ವೆಂಡರ್ ಮತ್ತು ಸಂಸ್ಥೆ ಅರ್ಜಿಗಳನ್ನು ಪರಿಶೀಲಿಸಿ | ☐ |
| `navd.cityImpact` | Meals rescued across the city | पूरे शहर में बचाए गए भोजन | ನಗರದಾದ್ಯಂತ ಉಳಿಸಿದ ಊಟಗಳು | ☐ |
| `navd.discover` | Find surplus food near you | अपने पास बचा हुआ खाना खोजें | ನಿಮ್ಮ ಹತ್ತಿರದ ಉಳಿದ ಆಹಾರ ಹುಡುಕಿ | ☐ |
| `navd.donationFeed` | Free food you can claim | मुफ़्त खाना जिसे आप ले सकते हैं | ನೀವು ಪಡೆಯಬಹುದಾದ ಉಚಿತ ಆಹಾರ | ☐ |
| `navd.flagged` | Low-rated vendors and repeat no-shows | कम रेटिंग वाले वेंडर और बार-बार न आने वाले | ಕಡಿಮೆ ರೇಟಿಂಗ್ ವೆಂಡರ್‌ಗಳು ಮತ್ತು ಪದೇ ಪದೇ ಬಾರದವರು | ☐ |
| `navd.following` | Restaurants you follow | जिन रेस्तराँ को आप फ़ॉलो करते हैं | ನೀವು ಅನುಸರಿಸುವ ರೆಸ್ಟೋರೆಂಟ್‌ಗಳು | ☐ |
| `navd.moderation` | Review flagged listings and reviews | चिह्नित लिस्टिंग और समीक्षाएँ देखें | ಗುರುತಿಸಿದ ಲಿಸ್ಟಿಂಗ್ ಮತ್ತು ವಿಮರ್ಶೆಗಳನ್ನು ನೋಡಿ | ☐ |
| `navd.myImpact` | Meals you've saved, money and CO2 | आपके बचाए भोजन, पैसे और CO2 | ನೀವು ಉಳಿಸಿದ ಊಟ, ಹಣ ಮತ್ತು CO2 | ☐ |
| `navd.myOrders` | Your reservations and pickup passes | आपके आरक्षण और पिकअप पास | ನಿಮ್ಮ ಕಾಯ್ದಿರಿಸುವಿಕೆ ಮತ್ತು ಪಿಕಪ್ ಪಾಸ್‌ಗಳು | ☐ |
| `navd.outletProfile` | Your business details | आपके व्यवसाय का विवरण | ನಿಮ್ಮ ವ್ಯವಹಾರದ ವಿವರಗಳು | ☐ |
| `navd.payouts` | What you earn after the platform fee | प्लैटफ़ॉर्म शुल्क के बाद आपकी कमाई | ವೇದಿಕೆ ಶುಲ್ಕದ ನಂತರ ನಿಮ್ಮ ಗಳಿಕೆ | ☐ |
| `navd.quickList` | Put surplus food on sale in a minute | बचा खाना एक मिनट में बिक्री पर डालें | ಉಳಿದ ಆಹಾರವನ್ನು ಒಂದೇ ನಿಮಿಷದಲ್ಲಿ ಮಾರಾಟಕ್ಕೆ ಹಾಕಿ | ☐ |
| `navd.receipts` | Donation receipts to download | डाउनलोड करने के लिए दान रसीदें | ಡೌನ್‌ಲೋಡ್ ಮಾಡಲು ದಾನ ರಸೀದಿಗಳು | ☐ |
| `navd.referrals` | Invite friends and use your credit | दोस्तों को बुलाएँ और क्रेडिट इस्तेमाल करें | ಸ್ನೇಹಿತರನ್ನು ಆಹ್ವಾನಿಸಿ, ಕ್ರೆಡಿಟ್ ಬಳಸಿ | ☐ |
| `navd.reports` | Customer reports to review | देखने के लिए ग्राहक रिपोर्ट | ಪರಿಶೀಲಿಸಬೇಕಾದ ಗ್ರಾಹಕ ವರದಿಗಳು | ☐ |
| `navd.scan` | Hand over an order with its code | कोड से ऑर्डर सौंपें | ಕೋಡ್‌ನಿಂದ ಆರ್ಡರ್ ಹಸ್ತಾಂತರಿಸಿ | ☐ |
| `navd.settings` | Rules, limits and feature switches | नियम, सीमाएँ और फ़ीचर स्विच | ನಿಯಮಗಳು, ಮಿತಿಗಳು ಮತ್ತು ವೈಶಿಷ್ಟ್ಯ ಸ್ವಿಚ್‌ಗಳು | ☐ |
| `navd.team` | Outlets, staff and invites | आउटलेट, स्टाफ़ और आमंत्रण | ಔಟ್‌ಲೆಟ್‌ಗಳು, ಸಿಬ್ಬಂದಿ ಮತ್ತು ಆಹ್ವಾನಗಳು | ☐ |
| `navd.today` | Today's orders and listings | आज के ऑर्डर और लिस्टिंग | ಇಂದಿನ ಆರ್ಡರ್‌ಗಳು ಮತ್ತು ಲಿಸ್ಟಿಂಗ್‌ಗಳು | ☐ |
| `navd.verification` | Your charity's verification | आपकी संस्था का सत्यापन | ನಿಮ್ಮ ಸಂಸ್ಥೆಯ ಪರಿಶೀಲನೆ | ☐ |

## ngo

| Key | English | हिन्दी | ಕನ್ನಡ | OK? |
|---|---|---|---|---|
| `ngo.allergensLine` | Allergens (vendor-supplied): {list} | एलर्जी वाली चीज़ें (विक्रेता द्वारा दी गई): {list} | ಅಲರ್ಜಿಕಾರಕಗಳು (ಮಾರಾಟಗಾರರು ನೀಡಿದ್ದು): {list} | ☐ |
| `ngo.approvalTitle` | Approval required | स्वीकृति ज़रूरी है | ಅನುಮೋದನೆ ಅಗತ್ಯ | ☐ |
| `ngo.available` | Available now ({n}) | अभी उपलब्ध ({n}) | ಈಗ ಲಭ್ಯವಿದೆ ({n}) | ☐ |
| `ngo.claimAll` | Claim all {qty} · free | सभी {qty} लें · मुफ़्त | ಎಲ್ಲಾ {qty} ಕ್ಲೈಮ್ ಮಾಡಿ · ಉಚಿತ | ☐ |
| `ngo.claimNeedApproval` | Claim (approval required) | दावा करें (स्वीकृति ज़रूरी) | ಕ್ಲೈಮ್ (ಅನುಮೋದನೆ ಅಗತ್ಯ) | ☐ |
| `ngo.claimedMsg` | Claimed — see your collection code below. | दावा हो गया — नीचे अपना कलेक्शन कोड देखें। | ಕ್ಲೈಮ್ ಆಗಿದೆ — ಕೆಳಗೆ ನಿಮ್ಮ ಸಂಗ್ರಹ ಕೋಡ್ ನೋಡಿ. | ☐ |
| `ngo.collectBy` | Collect by {time} | {time} तक लें | {time} ರೊಳಗೆ ಪಡೆಯಿರಿ | ☐ |
| `ngo.collected` | Collected {when} | {when} को लिया गया | {when} ರಂದು ಸಂಗ್ರಹಿಸಲಾಗಿದೆ | ☐ |
| `ngo.directions` | Directions | रास्ता | ದಾರಿ | ☐ |
| `ngo.directionsVendor` | Directions to vendor | विक्रेता तक रास्ता | ಮಾರಾಟಗಾರರ ಬಳಿಗೆ ದಾರಿ | ☐ |
| `ngo.freeBatches` | Free batches within {km} km. Claims are all-or-nothing: the whole batch locks to the first approved NGO. | {km} किमी के भीतर मुफ़्त बैच। दावा पूरे बैच का ही होता है: पूरा बैच पहले स्वीकृत NGO के नाम हो जाता है। | {km} ಕಿಮೀ ಒಳಗಿನ ಉಚಿತ ಬ್ಯಾಚ್‌ಗಳು. ಕ್ಲೈಮ್ ಪೂರ್ಣವಾಗಿಯೇ: ಇಡೀ ಬ್ಯಾಚ್ ಮೊದಲ ಅನುಮೋದಿತ NGO ಗೆ ಲಾಕ್ ಆಗುತ್ತದೆ. | ☐ |
| `ngo.myClaims` | My claims | मेरे दावे | ನನ್ನ ಕ್ಲೈಮ್‌ಗಳು | ☐ |
| `ngo.noClaims` | No claims yet. | अभी कोई दावा नहीं। | ಇನ್ನೂ ಕ್ಲೈಮ್‌ಗಳಿಲ್ಲ. | ☐ |
| `ngo.noOpen` | No open batches nearby. Batches appear when a vendor's pickup window ends with unreserved food. | पास में कोई खुला बैच नहीं। जब विक्रेता के पिकअप का समय बिना आरक्षित खाने के साथ खत्म होता है, तब बैच दिखते हैं। | ಹತ್ತಿರದಲ್ಲಿ ತೆರೆದ ಬ್ಯಾಚ್‌ಗಳಿಲ್ಲ. ಮಾರಾಟಗಾರರ ಪಿಕಪ್ ಸಮಯ ಕಾಯ್ದಿರಿಸದ ಆಹಾರದೊಂದಿಗೆ ಮುಗಿದಾಗ ಬ್ಯಾಚ್‌ಗಳು ಕಾಣಿಸುತ್ತವೆ. | ☐ |
| `ngo.noneDeclared` | none declared | कोई नहीं बताई गई | ಯಾವುದನ್ನೂ ತಿಳಿಸಿಲ್ಲ | ☐ |
| `ngo.prepared` | Prepared {when} | तैयार किया गया {when} | ತಯಾರಿಸಿದ್ದು {when} | ☐ |
| `ngo.release` | Release claim | दावा छोड़ें | ಕ್ಲೈಮ್ ಬಿಡುಗಡೆ ಮಾಡಿ | ☐ |
| `ngo.releaseConfirm` | Release this batch so another NGO can collect it? | यह बैच छोड़ दें ताकि कोई दूसरा NGO इसे ले सके? | ಬೇರೊಂದು NGO ಸಂಗ್ರಹಿಸಲು ಈ ಬ್ಯಾಚ್ ಅನ್ನು ಬಿಡುಗಡೆ ಮಾಡಬೇಕೇ? | ☐ |
| `ngo.showCode` | Show this collection code to the vendor: | यह कलेक्शन कोड विक्रेता को दिखाएँ: | ಈ ಸಂಗ್ರಹ ಕೋಡ್ ಅನ್ನು ಮಾರಾಟಗಾರರಿಗೆ ತೋರಿಸಿ: | ☐ |
| `ngo.start` | Start NGO verification | NGO सत्यापन शुरू करें | NGO ಪರಿಶೀಲನೆ ಆರಂಭಿಸಿ | ☐ |
| `ngo.title` | DONATION FEED | दान फ़ीड | ದೇಣಿಗೆ ಫೀಡ್ | ☐ |
| `ngo.verification` | Verification {status}. | सत्यापन {status}। | ಪರಿಶೀಲನೆ {status}. | ☐ |
| `ngo.verifiedNgo` | Verified NGO | सत्यापित NGO | ಪರಿಶೀಲಿತ NGO | ☐ |
| `ngo.viewOnly` | You can view the feed, but only approved NGOs can claim. | आप फ़ीड देख सकते हैं, पर सिर्फ़ स्वीकृत NGO ही दावा कर सकते हैं। | ನೀವು ಫೀಡ್ ನೋಡಬಹುದು, ಆದರೆ ಅನುಮೋದಿತ NGO ಗಳು ಮಾತ್ರ ಕ್ಲೈಮ್ ಮಾಡಬಹುದು. | ☐ |
| `ngo.viewVerification` | View verification | सत्यापन देखें | ಪರಿಶೀಲನೆ ನೋಡಿ | ☐ |

## notif

| Key | English | हिन्दी | ಕನ್ನಡ | OK? |
|---|---|---|---|---|
| `notif.accessRemoved` | Your access to {org} was removed. | {org} तक आपकी पहुँच हटा दी गई। | {org} ಗೆ ನಿಮ್ಮ ಪ್ರವೇಶವನ್ನು ತೆಗೆದುಹಾಕಲಾಗಿದೆ. | ☐ |
| `notif.approvalDecision` | Your {kind} application was {status} (demo approval, not a regulatory approval). | आपका {kind} आवेदन {status} हुआ (डेमो स्वीकृति, कोई सरकारी मंज़ूरी नहीं)। | ನಿಮ್ಮ {kind} ಅರ್ಜಿ {status} ಆಗಿದೆ (ಡೆಮೊ ಅನುಮೋದನೆ, ನಿಯಂತ್ರಕ ಅನುಮೋದನೆಯಲ್ಲ). | ☐ |
| `notif.approvalRejected` | Your {kind} application was {status}: {reason} (demo approval, not a regulatory approval). | आपका {kind} आवेदन {status} हुआ: {reason} (डेमो स्वीकृति, कोई सरकारी मंज़ूरी नहीं)। | ನಿಮ್ಮ {kind} ಅರ್ಜಿ {status} ಆಗಿದೆ: {reason} (ಡೆಮೊ ಅನುಮೋದನೆ, ನಿಯಂತ್ರಕ ಅನುಮೋದನೆಯಲ್ಲ). | ☐ |
| `notif.batchClaimed` | {org} claimed {ref} ({qty} × {title}). | {org} ने {ref} क्लेम किया ({qty} × {title})। | {org} {ref} ಅನ್ನು ಕ್ಲೈಮ್ ಮಾಡಿದೆ ({qty} × {title}). | ☐ |
| `notif.cancelledByCustomer` | {ref} was cancelled by the customer. | {ref} ग्राहक ने रद्द कर दिया। | {ref} ಅನ್ನು ಗ್ರಾಹಕರು ರದ್ದು ಮಾಡಿದ್ದಾರೆ. | ☐ |
| `notif.cancelledFree` | {ref} cancelled. | {ref} रद्द हो गया। | {ref} ರದ್ದಾಗಿದೆ. | ☐ |
| `notif.cancelledFreeCredit` | {ref} cancelled. ₹{credit} credit returned. | {ref} रद्द हो गया। ₹{credit} का क्रेडिट लौटा दिया गया। | {ref} ರದ್ದಾಗಿದೆ. ₹{credit} ಕ್ರೆಡಿಟ್ ಹಿಂತಿರುಗಿಸಲಾಗಿದೆ. | ☐ |
| `notif.cancelledFreeRefund` | {ref} cancelled. Refund of ₹{refund} issued. | {ref} रद्द हो गया। ₹{refund} का रिफ़ंड जारी किया गया। | {ref} ರದ್ದಾಗಿದೆ. ₹{refund} ರಿಫಂಡ್ ನೀಡಲಾಗಿದೆ. | ☐ |
| `notif.cancelledFreeRefundCredit` | {ref} cancelled. Refund of ₹{refund} issued. ₹{credit} credit returned. | {ref} रद्द हो गया। ₹{refund} का रिफ़ंड जारी किया गया। ₹{credit} का क्रेडिट लौटा दिया गया। | {ref} ರದ್ದಾಗಿದೆ. ₹{refund} ರಿಫಂಡ್ ನೀಡಲಾಗಿದೆ. ₹{credit} ಕ್ರೆಡಿಟ್ ಹಿಂತಿರುಗಿಸಲಾಗಿದೆ. | ☐ |
| `notif.cancelledLate` | {ref} cancelled. It was within 30 minutes of pickup, so it isn't refunded. | {ref} रद्द हो गया। यह पिकअप से 30 मिनट के भीतर था, इसलिए रिफ़ंड नहीं होगा। | {ref} ರದ್ದಾಗಿದೆ. ಇದು ಪಿಕಪ್‌ಗೆ 30 ನಿಮಿಷಗಳ ಒಳಗೆ ಇತ್ತು, ಆದ್ದರಿಂದ ರಿಫಂಡ್ ಆಗುವುದಿಲ್ಲ. | ☐ |
| `notif.certificateReady` | Your impact certificate for {month} is ready: {meals} meals rescued. Download it from Analytics. | {month} का आपका इम्पैक्ट सर्टिफ़िकेट तैयार है: {meals} खाने बचाए गए। इसे एनालिटिक्स से डाउनलोड करें। | {month} ರ ನಿಮ್ಮ ಪರಿಣಾಮ ಪ್ರಮಾಣಪತ್ರ ಸಿದ್ಧವಾಗಿದೆ: {meals} ಊಟ ಉಳಿಸಲಾಗಿದೆ. ಅನಲಿಟಿಕ್ಸ್‌ನಿಂದ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ. | ☐ |
| `notif.checkoutCancelledByVendor` | Your checkout for {title} was cancelled by the vendor. | {title} का आपका चेकआउट विक्रेता ने रद्द कर दिया। | {title} ಗಾಗಿ ನಿಮ್ಮ ಚೆಕ್‌ಔಟ್ ಅನ್ನು ಮಾರಾಟಗಾರರು ರದ್ದು ಮಾಡಿದ್ದಾರೆ. | ☐ |
| `notif.creditFirstRescue` | You earned ₹{amount} credit for your first rescue. Use it on your next order. | आपको पहली बार खाना बचाने पर ₹{amount} का क्रेडिट मिला। इसे अपने अगले ऑर्डर में इस्तेमाल करें। | ನಿಮ್ಮ ಮೊದಲ ಆಹಾರ ರಕ್ಷಣೆಗೆ ನೀವು ₹{amount} ಕ್ರೆಡಿಟ್ ಗಳಿಸಿದ್ದೀರಿ. ಅದನ್ನು ನಿಮ್ಮ ಮುಂದಿನ ಆರ್ಡರ್‌ನಲ್ಲಿ ಬಳಸಿ. | ☐ |
| `notif.creditNote.holdExpired` | checkout hold expired | चेकआउट का होल्ड खत्म हो गया | ಚೆಕ್‌ಔಟ್ ಹೋಲ್ಡ್ ಮುಗಿದಿದೆ | ☐ |
| `notif.creditNote.notCompleted` | checkout was not completed | चेकआउट पूरा नहीं हुआ | ಚೆಕ್‌ಔಟ್ ಪೂರ್ಣಗೊಂಡಿಲ್ಲ | ☐ |
| `notif.creditNote.orderCancelled` | order cancelled | ऑर्डर रद्द हुआ | ಆರ್ಡರ್ ರದ್ದಾಗಿದೆ | ☐ |
| `notif.creditNote.refundedByAdmin` | refunded by an administrator | एडमिन द्वारा रिफ़ंड | ನಿರ್ವಾಹಕರಿಂದ ರಿಫಂಡ್ | ☐ |
| `notif.creditNote.vendorCancelled` | vendor cancelled the listing | विक्रेता ने लिस्टिंग रद्द कर दी | ಮಾರಾಟಗಾರರು ಲಿಸ್ಟಿಂಗ್ ರದ್ದು ಮಾಡಿದ್ದಾರೆ | ☐ |
| `notif.creditReferrerReward` | {name} collected their first order. ₹{amount} credit is in your balance. | {name} ने अपना पहला ऑर्डर ले लिया। ₹{amount} का क्रेडिट आपके बैलेंस में है। | {name} ತಮ್ಮ ಮೊದಲ ಆರ್ಡರ್ ತೆಗೆದುಕೊಂಡರು. ₹{amount} ಕ್ರೆಡಿಟ್ ನಿಮ್ಮ ಬ್ಯಾಲೆನ್ಸ್‌ನಲ್ಲಿದೆ. | ☐ |
| `notif.creditReturned` | ₹{amount} credit was returned to your balance ({note}). | ₹{amount} का क्रेडिट आपके बैलेंस में लौटा दिया गया ({note})। | ₹{amount} ಕ್ರೆಡಿಟ್ ನಿಮ್ಮ ಬ್ಯಾಲೆನ್ಸ್‌ಗೆ ಹಿಂತಿರುಗಿಸಲಾಗಿದೆ ({note}). | ☐ |
| `notif.deliveryAssigned` | A rider{rider} is on the way to collect {ref}. | एक राइडर{rider} {ref} लेने के लिए रास्ते में है। | ಒಬ್ಬ ರೈಡರ್{rider} {ref} ತೆಗೆದುಕೊಳ್ಳಲು ದಾರಿಯಲ್ಲಿದ್ದಾರೆ. | ☐ |
| `notif.deliveryAssignedVendor` | A rider{rider} is on the way to collect {ref}. Check the collection code before handing over. | एक राइडर{rider} {ref} लेने के लिए रास्ते में है। सौंपने से पहले संग्रह कोड जाँच लें। | ಒಬ್ಬ ರೈಡರ್{rider} {ref} ತೆಗೆದುಕೊಳ್ಳಲು ದಾರಿಯಲ್ಲಿದ್ದಾರೆ. ಹಸ್ತಾಂತರಿಸುವ ಮೊದಲು ಸಂಗ್ರಹ ಕೋಡ್ ಪರಿಶೀಲಿಸಿ. | ☐ |
| `notif.deliveryDelivered` | {ref} was delivered. | {ref} पहुँचा दिया गया। | {ref} ತಲುಪಿಸಲಾಗಿದೆ. | ☐ |
| `notif.deliveryFailed` | The delivery for {ref} failed. You still hold the claim. | {ref} की डिलीवरी विफल हो गई। क्लेम अब भी आपके पास है। | {ref} ಗಾಗಿ ಡೆಲಿವರಿ ವಿಫಲವಾಯಿತು. ಕ್ಲೈಮ್ ಈಗಲೂ ನಿಮ್ಮ ಬಳಿ ಇದೆ. | ☐ |
| `notif.deliveryNoRider` | We couldn't book a rider for {ref}: {error} You still hold the claim: try again or collect it yourself before the deadline. | हम {ref} के लिए राइडर बुक नहीं कर सके: {error} क्लेम अब भी आपके पास है: फिर कोशिश करें या समय-सीमा से पहले खुद ले लें। | {ref} ಗಾಗಿ ರೈಡರ್ ಬುಕ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ: {error} ಕ್ಲೈಮ್ ಈಗಲೂ ನಿಮ್ಮ ಬಳಿ ಇದೆ: ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ ಅಥವಾ ಕೊನೆಯ ಸಮಯದ ಮೊದಲು ನೀವೇ ತೆಗೆದುಕೊಳ್ಳಿ. | ☐ |
| `notif.deliveryNoRiderFound` | No rider accepted {ref}. You still hold the claim: try again or collect it yourself before the deadline. | किसी राइडर ने {ref} स्वीकार नहीं किया। क्लेम अब भी आपके पास है: फिर कोशिश करें या समय-सीमा से पहले खुद ले लें। | ಯಾವ ರೈಡರ್ ಕೂಡ {ref} ಅನ್ನು ಒಪ್ಪಿಕೊಳ್ಳಲಿಲ್ಲ. ಕ್ಲೈಮ್ ಈಗಲೂ ನಿಮ್ಮ ಬಳಿ ಇದೆ: ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ ಅಥವಾ ಕೊನೆಯ ಸಮಯದ ಮೊದಲು ನೀವೇ ತೆಗೆದುಕೊಳ್ಳಿ. | ☐ |
| `notif.deliveryPickedUp` | The rider{rider} has picked up {ref}. | राइडर{rider} ने {ref} उठा लिया है। | ರೈಡರ್{rider} {ref} ಅನ್ನು ತೆಗೆದುಕೊಂಡಿದ್ದಾರೆ. | ☐ |
| `notif.deliveryPickedUpVendor` | The rider{rider} has picked up {ref}. Check the collection code before handing over. | राइडर{rider} ने {ref} उठा लिया है। सौंपने से पहले संग्रह कोड जाँच लें। | ರೈಡರ್{rider} {ref} ಅನ್ನು ತೆಗೆದುಕೊಂಡಿದ್ದಾರೆ. ಹಸ್ತಾಂತರಿಸುವ ಮೊದಲು ಸಂಗ್ರಹ ಕೋಡ್ ಪರಿಶೀಲಿಸಿ. | ☐ |
| `notif.deliveryRequested` | Delivery requested for {ref} ({provider}, about ₹{fee}). We'll update you as the rider moves. | {ref} के लिए डिलीवरी माँगी गई ({provider}, लगभग ₹{fee})। राइडर के आगे बढ़ने पर हम आपको बताते रहेंगे। | {ref} ಗಾಗಿ ಡೆಲಿವರಿ ವಿನಂತಿಸಲಾಗಿದೆ ({provider}, ಸುಮಾರು ₹{fee}). ರೈಡರ್ ಚಲಿಸಿದಂತೆ ನಾವು ನಿಮಗೆ ತಿಳಿಸುತ್ತೇವೆ. | ☐ |
| `notif.donationCollected` | {ref} collected: {qty} × {title}. Donation recorded. | {ref} ले लिया गया: {qty} × {title}। दान दर्ज हो गया। | {ref} ಸಂಗ್ರಹಿಸಲಾಗಿದೆ: {qty} × {title}. ದಾನ ದಾಖಲಾಗಿದೆ. | ☐ |
| `notif.donationEscalation` | Still unclaimed: {qty} × {title} at {vendor}. Collect by {by}. | अभी तक किसी ने नहीं लिया: {vendor} पर {qty} × {title}। {by} तक ले लें। | ಇನ್ನೂ ಯಾರೂ ಕ್ಲೈಮ್ ಮಾಡಿಲ್ಲ: {vendor} ನಲ್ಲಿ {qty} × {title}. {by} ರೊಳಗೆ ತೆಗೆದುಕೊಳ್ಳಿ. | ☐ |
| `notif.etaAlmostThere` | {name} is almost there for {ref}. | {name} {ref} के लिए लगभग पहुँच गए हैं। | {name} {ref} ಗಾಗಿ ಬಹುತೇಕ ತಲುಪಿದ್ದಾರೆ. | ☐ |
| `notif.etaOnTheWay` | {name} is on the way to collect {ref} (about {minutes} min). | {name} {ref} लेने के लिए रास्ते में हैं (लगभग {minutes} मिनट)। | {name} {ref} ತೆಗೆದುಕೊಳ್ಳಲು ದಾರಿಯಲ್ಲಿದ್ದಾರೆ (ಸುಮಾರು {minutes} ನಿಮಿಷ). | ☐ |
| `notif.inviteAccepted` | {name} joined {org} as {role}. | {name} {org} में {role} के रूप में जुड़ गए। | {name} {org} ಗೆ {role} ಆಗಿ ಸೇರಿದ್ದಾರೆ. | ☐ |
| `notif.inviteReceived` | {org} invited you to join as {role}. Open /join/{token} to accept. | {org} ने आपको {role} के रूप में जुड़ने के लिए आमंत्रित किया है। स्वीकार करने के लिए /join/{token} खोलें। | {org} ನಿಮ್ಮನ್ನು {role} ಆಗಿ ಸೇರಲು ಆಹ್ವಾನಿಸಿದೆ. ಒಪ್ಪಿಕೊಳ್ಳಲು /join/{token} ತೆರೆಯಿರಿ. | ☐ |
| `notif.latePaymentRefund` | Your payment arrived after the 5-minute hold expired. A full test-mode refund of ₹{amount} has been initiated. | आपका भुगतान 5 मिनट का होल्ड खत्म होने के बाद आया। ₹{amount} का पूरा टेस्ट-मोड रिफ़ंड शुरू कर दिया गया है। | ನಿಮ್ಮ ಪಾವತಿ 5 ನಿಮಿಷಗಳ ಹೋಲ್ಡ್ ಮುಗಿದ ನಂತರ ಬಂದಿದೆ. ₹{amount} ರ ಪೂರ್ಣ ಟೆಸ್ಟ್-ಮೋಡ್ ರಿಫಂಡ್ ಆರಂಭಿಸಲಾಗಿದೆ. | ☐ |
| `notif.listingHidden` | Your listing "{title}" was hidden after a report. | एक रिपोर्ट के बाद आपकी लिस्टिंग "{title}" छिपा दी गई। | ವರದಿಯ ನಂತರ ನಿಮ್ಮ ಲಿಸ್ಟಿಂಗ್ "{title}" ಅನ್ನು ಮರೆಮಾಡಲಾಗಿದೆ. | ☐ |
| `notif.listingHiddenNote` | Your listing "{title}" was hidden after a report. {note} | एक रिपोर्ट के बाद आपकी लिस्टिंग "{title}" छिपा दी गई। {note} | ವರದಿಯ ನಂತರ ನಿಮ್ಮ ಲಿಸ್ಟಿಂಗ್ "{title}" ಅನ್ನು ಮರೆಮಾಡಲಾಗಿದೆ. {note} | ☐ |
| `notif.modEdit` | Save a Plate edited {what}: {reason} | {what} को Save a Plate ने बदला है: {reason} | {what} ಅನ್ನು Save a Plate ಸಂಪಾದಿಸಿದೆ: {reason} | ☐ |
| `notif.modHid` | Save a Plate hid {what}: {reason} | {what} को Save a Plate ने छिपा दिया है: {reason} | {what} ಅನ್ನು Save a Plate ಮರೆಮಾಡಿದೆ: {reason} | ☐ |
| `notif.modRestore` | Save a Plate restored {what}. {reason} | {what} को Save a Plate ने फिर से दिखा दिया है। {reason} | {what} ಅನ್ನು Save a Plate ಮರುಸ್ಥಾಪಿಸಿದೆ. {reason} | ☐ |
| `notif.modRestoreResume` | Save a Plate restored {what}. You can resume the listing from your dashboard. {reason} | {what} को Save a Plate ने फिर से दिखा दिया है। आप अपने डैशबोर्ड से लिस्टिंग फिर शुरू कर सकते हैं। {reason} | {what} ಅನ್ನು Save a Plate ಮರುಸ್ಥಾಪಿಸಿದೆ. ನೀವು ನಿಮ್ಮ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ನಿಂದ ಲಿಸ್ಟಿಂಗ್ ಅನ್ನು ಮತ್ತೆ ಆರಂಭಿಸಬಹುದು. {reason} | ☐ |
| `notif.modWarn` | Warning from Save a Plate about {what}: {reason} | {what} के बारे में Save a Plate की चेतावनी: {reason} | {what} ಬಗ್ಗೆ Save a Plate ಯಿಂದ ಎಚ್ಚರಿಕೆ: {reason} | ☐ |
| `notif.newDonation` | {qty} × {title} free at {vendor}. Collect by {by}. | {vendor} पर {qty} × {title} मुफ़्त है। {by} तक ले लें। | {vendor} ನಲ್ಲಿ {qty} × {title} ಉಚಿತ. {by} ರೊಳಗೆ ತೆಗೆದುಕೊಳ್ಳಿ. | ☐ |
| `notif.newListingFollowed` | {vendor} just listed {title} (₹{price}). | {vendor} ने अभी {title} लिस्ट किया है (₹{price})। | {vendor} ಈಗಷ್ಟೇ {title} ಅನ್ನು ಲಿಸ್ಟ್ ಮಾಡಿದ್ದಾರೆ (₹{price}). | ☐ |
| `notif.newOrderPaid` | New order {ref}: {qty} × {title} (paid, test mode). | नया ऑर्डर {ref}: {qty} × {title} (भुगतान हो गया, टेस्ट मोड)। | ಹೊಸ ಆರ್ಡರ್ {ref}: {qty} × {title} (ಪಾವತಿಯಾಗಿದೆ, ಟೆಸ್ಟ್ ಮೋಡ್). | ☐ |
| `notif.newOrderPayAtPickup` | New order {ref}: {qty} × {title} (pay at pickup). | नया ऑर्डर {ref}: {qty} × {title} (पिकअप पर भुगतान)। | ಹೊಸ ಆರ್ಡರ್ {ref}: {qty} × {title} (ಪಿಕಪ್‌ನಲ್ಲಿ ಪಾವತಿ). | ☐ |
| `notif.newRating` | New {rating}★ rating for {ref}. | {ref} के लिए नई {rating}★ रेटिंग। | {ref} ಗೆ ಹೊಸ {rating}★ ರೇಟಿಂಗ್. | ☐ |
| `notif.newReport` | New report ({reason}) awaiting review. | नई रिपोर्ट ({reason}) जाँच के इंतज़ार में है। | ಹೊಸ ವರದಿ ({reason}) ಪರಿಶೀಲನೆಗಾಗಿ ಕಾಯುತ್ತಿದೆ. | ☐ |
| `notif.noShow` | {ref} was marked a no-show because it wasn't collected. Three no-shows in 30 days pause new reservations for 7 days. | {ref} नहीं लिया गया, इसलिए इसे नहीं आए के रूप में दर्ज किया गया। 30 दिन में तीन बार न आने पर 7 दिन तक नए आरक्षण रुक जाते हैं। | {ref} ತೆಗೆದುಕೊಳ್ಳದ ಕಾರಣ ಅದನ್ನು ಬರದಿರುವುದು ಎಂದು ಗುರುತಿಸಲಾಗಿದೆ. 30 ದಿನಗಳಲ್ಲಿ ಮೂರು ಬಾರಿ ಬರದಿದ್ದರೆ 7 ದಿನಗಳವರೆಗೆ ಹೊಸ ಕಾಯ್ದಿರಿಸುವಿಕೆಗಳು ನಿಲ್ಲುತ್ತವೆ. | ☐ |
| `notif.noShowVendor` | {ref} was not collected (no-show). | {ref} नहीं लिया गया (ग्राहक नहीं आए)। | {ref} ತೆಗೆದುಕೊಳ್ಳಲಾಗಿಲ್ಲ (ಗ್ರಾಹಕರು ಬರಲಿಲ್ಲ). | ☐ |
| `notif.orderCancelledByVendor` | {ref} was cancelled by the vendor ({reason}). | {ref} विक्रेता ने रद्द कर दिया ({reason})। | {ref} ಅನ್ನು ಮಾರಾಟಗಾರರು ರದ್ದು ಮಾಡಿದ್ದಾರೆ ({reason}). | ☐ |
| `notif.orderCancelledByVendorRefund` | {ref} was cancelled by the vendor ({reason}). A full test-mode refund was issued. | {ref} विक्रेता ने रद्द कर दिया ({reason})। पूरा टेस्ट-मोड रिफ़ंड जारी किया गया। | {ref} ಅನ್ನು ಮಾರಾಟಗಾರರು ರದ್ದು ಮಾಡಿದ್ದಾರೆ ({reason}). ಪೂರ್ಣ ಟೆಸ್ಟ್-ಮೋಡ್ ರಿಫಂಡ್ ನೀಡಲಾಗಿದೆ. | ☐ |
| `notif.orderConfirmed` | Order {ref} confirmed: {qty} × {title}. Collect between {start} and {end}. | ऑर्डर {ref} पक्का हो गया: {qty} × {title}। {start} और {end} के बीच ले लें। | ಆರ್ಡರ್ {ref} ಖಚಿತವಾಗಿದೆ: {qty} × {title}. {start} ಮತ್ತು {end} ನಡುವೆ ತೆಗೆದುಕೊಳ್ಳಿ. | ☐ |
| `notif.orderConfirmedPayAtPickup` | Order {ref} confirmed: {qty} × {title}. Pay at pickup. | ऑर्डर {ref} पक्का हो गया: {qty} × {title}। पिकअप पर भुगतान करें। | ಆರ್ಡರ್ {ref} ಖಚಿತವಾಗಿದೆ: {qty} × {title}. ಪಿಕಪ್‌ನಲ್ಲಿ ಪಾವತಿಸಿ. | ☐ |
| `notif.orderReady` | {ref} is ready for pickup. | {ref} पिकअप के लिए तैयार है। | {ref} ಪಿಕಪ್‌ಗೆ ಸಿದ್ಧವಾಗಿದೆ. | ☐ |
| `notif.pickedUp` | {ref} picked up. Thanks for saving a plate! You can rate your order for 48 hours. | {ref} ले लिया गया। एक प्लेट बचाने के लिए धन्यवाद! आप 48 घंटे तक अपने ऑर्डर को रेटिंग दे सकते हैं। | {ref} ತೆಗೆದುಕೊಳ್ಳಲಾಗಿದೆ. ಒಂದು ಪ್ಲೇಟ್ ಉಳಿಸಿದ್ದಕ್ಕೆ ಧನ್ಯವಾದಗಳು! ನೀವು 48 ಗಂಟೆಗಳವರೆಗೆ ನಿಮ್ಮ ಆರ್ಡರ್‌ಗೆ ರೇಟಿಂಗ್ ನೀಡಬಹುದು. | ☐ |
| `notif.pickupReminder` | {min} minutes left to collect {ref} ({title}). | {ref} ({title}) लेने के लिए {min} मिनट बचे हैं। | {ref} ({title}) ತೆಗೆದುಕೊಳ್ಳಲು {min} ನಿಮಿಷಗಳು ಉಳಿದಿವೆ. | ☐ |
| `notif.priceDrop` | Price drop: {title} at {vendor} is now ₹{price} (was ₹{was}, {pct}% off). | कीमत घटी: {vendor} पर {title} अब ₹{price} का है (पहले ₹{was}, {pct}% छूट)। | ಬೆಲೆ ಇಳಿಕೆ: {vendor} ನಲ್ಲಿ {title} ಈಗ ₹{price} (ಮೊದಲು ₹{was}, {pct}% ರಿಯಾಯಿತಿ). | ☐ |
| `notif.priorityOffer` | Priority offer: {qty} × {title} at {vendor}, free for charities for the next {minutes} min. Claim it in your feed. | प्राथमिकता ऑफ़र: {vendor} पर {qty} × {title}, अगले {minutes} मिनट संस्थाओं के लिए मुफ़्त। अपनी फ़ीड में इसे लें। | ಆದ್ಯತಾ ಆಫರ್: {vendor} ನಲ್ಲಿ {qty} × {title}, ಮುಂದಿನ {minutes} ನಿಮಿಷ ದಾನ ಸಂಸ್ಥೆಗಳಿಗೆ ಉಚಿತ. ನಿಮ್ಮ ಫೀಡ್‌ನಲ್ಲಿ ಕ್ಲೈಮ್ ಮಾಡಿ. | ☐ |
| `notif.referralCapReached` | {name} collected their first order, but you've reached the limit of {max} rewarded referrals this month. | {name} ने अपना पहला ऑर्डर ले लिया, लेकिन इस महीने आप इनाम वाले {max} रेफ़रल की सीमा तक पहुँच चुके हैं। | {name} ತಮ್ಮ ಮೊದಲ ಆರ್ಡರ್ ತೆಗೆದುಕೊಂಡರು, ಆದರೆ ಈ ತಿಂಗಳು ನೀವು ಬಹುಮಾನ ಸಿಗುವ {max} ರೆಫರಲ್‌ಗಳ ಮಿತಿ ತಲುಪಿದ್ದೀರಿ. | ☐ |
| `notif.refundIssued` | Refund of ₹{amount} issued for {ref}. | {ref} के लिए ₹{amount} का रिफ़ंड जारी किया गया। | {ref} ಗಾಗಿ ₹{amount} ರಿಫಂಡ್ ನೀಡಲಾಗಿದೆ. | ☐ |
| `notif.reportActioned` | We reviewed your report and took action. Thank you. | हमने आपकी रिपोर्ट देखी और कार्रवाई की। धन्यवाद। | ನಾವು ನಿಮ್ಮ ವರದಿಯನ್ನು ಪರಿಶೀಲಿಸಿ ಕ್ರಮ ತೆಗೆದುಕೊಂಡಿದ್ದೇವೆ. ಧನ್ಯವಾದಗಳು. | ☐ |
| `notif.reportDismissed` | We reviewed your report and didn't find a violation. Thanks for flagging it. | हमने आपकी रिपोर्ट देखी और कोई उल्लंघन नहीं पाया। बताने के लिए धन्यवाद। | ನಾವು ನಿಮ್ಮ ವರದಿಯನ್ನು ಪರಿಶೀಲಿಸಿದೆವು, ಯಾವುದೇ ಉಲ್ಲಂಘನೆ ಕಂಡುಬಂದಿಲ್ಲ. ತಿಳಿಸಿದ್ದಕ್ಕೆ ಧನ್ಯವಾದಗಳು. | ☐ |
| `notif.reportWarning` | Warning from Save a Plate: a customer reported an issue ({reason}). | Save a Plate की ओर से चेतावनी: एक ग्राहक ने समस्या बताई है ({reason})। | Save a Plate ಯಿಂದ ಎಚ್ಚರಿಕೆ: ಒಬ್ಬ ಗ್ರಾಹಕರು ಸಮಸ್ಯೆಯನ್ನು ವರದಿ ಮಾಡಿದ್ದಾರೆ ({reason}). | ☐ |
| `notif.reportWarningNote` | Warning from Save a Plate: a customer reported an issue ({reason}). {note} | Save a Plate की ओर से चेतावनी: एक ग्राहक ने समस्या बताई है ({reason})। {note} | Save a Plate ಯಿಂದ ಎಚ್ಚರಿಕೆ: ಒಬ್ಬ ಗ್ರಾಹಕರು ಸಮಸ್ಯೆಯನ್ನು ವರದಿ ಮಾಡಿದ್ದಾರೆ ({reason}). {note} | ☐ |
| `notif.seedPriorityOffer` | Priority offer: {qty} × {title}, free for charities for the next {minutes} min. Claim it in your feed. | प्राथमिकता ऑफ़र: {qty} × {title}, अगले {minutes} मिनट संस्थाओं के लिए मुफ़्त। अपनी फ़ीड में इसे लें। | ಆದ್ಯತಾ ಆಫರ್: {qty} × {title}, ಮುಂದಿನ {minutes} ನಿಮಿಷ ದಾನ ಸಂಸ್ಥೆಗಳಿಗೆ ಉಚಿತ. ನಿಮ್ಮ ಫೀಡ್‌ನಲ್ಲಿ ಕ್ಲೈಮ್ ಮಾಡಿ. | ☐ |
| `notif.seedReadyAt` | {ref} is ready for pickup at {place}. | {ref} {place} पर पिकअप के लिए तैयार है। | {ref} {place} ನಲ್ಲಿ ಪಿಕಪ್‌ಗೆ ಸಿದ್ಧವಾಗಿದೆ. | ☐ |
| `notif.servedFrom` | {org} served {servings} servings from {ref} at {centre}. | {org} ने {ref} से {centre} में {servings} हिस्से परोसे। | {org} {ref} ನಿಂದ {centre} ನಲ್ಲಿ {servings} ಭಾಗಗಳನ್ನು ಬಡಿಸಿದೆ. | ☐ |
| `notif.servedFromPeople` | {org} served {servings} servings from {ref} to {people} people at {centre}. | {org} ने {ref} से {centre} में {people} लोगों को {servings} हिस्से परोसे। | {org} {ref} ನಿಂದ {centre} ನಲ್ಲಿ {people} ಜನರಿಗೆ {servings} ಭಾಗಗಳನ್ನು ಬಡಿಸಿದೆ. | ☐ |
| `notif.suspendedModeration` | Suspended by an administrator until {date}: {reason} | एडमिन ने {date} तक निलंबित किया: {reason} | ನಿರ್ವಾಹಕರು {date} ವರೆಗೆ ಅಮಾನತು ಮಾಡಿದ್ದಾರೆ: {reason} | ☐ |
| `notif.suspendedNoShows` | Reservations paused until {date} after {count} no-shows in {days} days. | {days} दिन में {count} बार न आने के कारण {date} तक आरक्षण रुके हुए हैं। | {days} ದಿನಗಳಲ್ಲಿ {count} ಬಾರಿ ಬರದ ಕಾರಣ {date} ವರೆಗೆ ಕಾಯ್ದಿರಿಸುವಿಕೆಗಳನ್ನು ನಿಲ್ಲಿಸಲಾಗಿದೆ. | ☐ |
| `notif.suspendedReport` | Suspended by an administrator after a report. | एक रिपोर्ट के बाद एडमिन ने खाता निलंबित कर दिया। | ವರದಿಯ ನಂತರ ನಿರ್ವಾಹಕರು ಖಾತೆಯನ್ನು ಅಮಾನತು ಮಾಡಿದ್ದಾರೆ. | ☐ |
| `notif.suspendedReportNote` | Suspended by an administrator after a report. {note} | एक रिपोर्ट के बाद एडमिन ने खाता निलंबित कर दिया। {note} | ವರದಿಯ ನಂತರ ನಿರ್ವಾಹಕರು ಖಾತೆಯನ್ನು ಅಮಾನತು ಮಾಡಿದ್ದಾರೆ. {note} | ☐ |
| `notif.volunteerSending` | {org} is sending {name} for {ref} at {time}. | {org} {ref} के लिए {time} पर {name} को भेज रहा है। | {org} {ref} ಗಾಗಿ {time} ಕ್ಕೆ {name} ಅವರನ್ನು ಕಳುಹಿಸುತ್ತಿದೆ. | ☐ |
| `notif.what.listing` | your listing "{title}" | आपकी लिस्टिंग "{title}" | ನಿಮ್ಮ ಲಿಸ್ಟಿಂಗ್ "{title}" | ☐ |
| `notif.what.review` | your review | आपकी समीक्षा | ನಿಮ್ಮ ವಿಮರ್ಶೆ | ☐ |
| `notif.what.vendor` | your business | आपका व्यवसाय | ನಿಮ್ಮ ವ್ಯಾಪಾರ | ☐ |

## onb

| Key | English | हिन्दी | ಕನ್ನಡ | OK? |
|---|---|---|---|---|
| `onb.acceptPap` | Accept pay-at-pickup orders | पिकअप पर भुगतान वाले ऑर्डर स्वीकार करें | ಪಿಕಪ್‌ನಲ್ಲಿ ಪಾವತಿ ಆರ್ಡರ್‌ಗಳನ್ನು ಸ್ವೀಕರಿಸಿ | ☐ |
| `onb.appStatus` | Application status: | आवेदन की स्थिति: | ಅರ್ಜಿ ಸ್ಥಿತಿ: | ☐ |
| `onb.attached` | {n} attached. | {n} जुड़ी हैं। | {n} ಲಗತ್ತಿಸಲಾಗಿದೆ. | ☐ |
| `onb.docsNgo` | Registration documents (12A/80G, trust deed) * | पंजीकरण दस्तावेज़ (12A/80G, ट्रस्ट डीड) * | ನೋಂದಣಿ ದಾಖಲೆಗಳು (12A/80G, ಟ್ರಸ್ಟ್ ಡೀಡ್) * | ☐ |
| `onb.docsNote` | Files are stored privately in the demo (data/uploads) and shown to the admin reviewer. | डेमो में फ़ाइलें निजी तौर पर (data/uploads) रखी जाती हैं और एडमिन समीक्षक को दिखाई जाती हैं। | ಡೆಮೊದಲ್ಲಿ ಫೈಲ್‌ಗಳನ್ನು ಖಾಸಗಿಯಾಗಿ (data/uploads) ಸಂಗ್ರಹಿಸಲಾಗುತ್ತದೆ ಮತ್ತು ನಿರ್ವಾಹಕ ಪರಿಶೀಲಕರಿಗೆ ತೋರಿಸಲಾಗುತ್ತದೆ. | ☐ |
| `onb.docsVendor` | Supporting documents (FSSAI certificate, ID) | सहायक दस्तावेज़ (FSSAI प्रमाणपत्र, पहचान पत्र) | ಬೆಂಬಲ ದಾಖಲೆಗಳು (FSSAI ಪ್ರಮಾಣಪತ್ರ, ಗುರುತಿನ ಚೀಟಿ) | ☐ |
| `onb.eightyGHelp` | An administrator checks this. Receipts mention 80G only while it is valid. | एडमिन इसकी जाँच करता है। रसीदों में 80G तभी लिखा जाता है जब तक यह मान्य हो। | ನಿರ್ವಾಹಕರು ಇದನ್ನು ಪರಿಶೀಲಿಸುತ್ತಾರೆ. ಮಾನ್ಯವಾಗಿರುವವರೆಗೆ ಮಾತ್ರ ರಸೀದಿಗಳಲ್ಲಿ 80G ಉಲ್ಲೇಖಿಸಲಾಗುತ್ತದೆ. | ☐ |
| `onb.eightyGUntil` | 80G valid until | 80G इस तारीख़ तक मान्य | 80G ಮಾನ್ಯತೆ ಇದುವರೆಗೆ | ☐ |
| `onb.f.businessName` | Business name * | व्यवसाय का नाम * | ವ್ಯವಹಾರದ ಹೆಸರು * | ☐ |
| `onb.f.capacityMeals` | Collection capacity (meals per day) * | लेने की क्षमता (रोज़ के भोजन) * | ಸಂಗ್ರಹ ಸಾಮರ್ಥ್ಯ (ದಿನಕ್ಕೆ ಊಟಗಳು) * | ☐ |
| `onb.f.collectionAddress` | Collection address * | खाना लेने का पता * | ಆಹಾರ ಸಂಗ್ರಹ ವಿಳಾಸ * | ☐ |
| `onb.f.contactName` | Contact name * | संपर्क व्यक्ति का नाम * | ಸಂಪರ್ಕ ವ್ಯಕ್ತಿಯ ಹೆಸರು * | ☐ |
| `onb.f.contactPerson` | Contact person * | संपर्क व्यक्ति * | ಸಂಪರ್ಕ ವ್ಯಕ್ತಿ * | ☐ |
| `onb.f.eightyGNumber` | 80G registration number (if you have one) | 80G पंजीकरण संख्या (अगर आपके पास है) | 80G ನೋಂದಣಿ ಸಂಖ್ಯೆ (ಇದ್ದರೆ) | ☐ |
| `onb.f.email` | Email | ईमेल | ಇಮೇಲ್ | ☐ |
| `onb.f.fssaiInfo` | FSSAI registration (if applicable) | FSSAI पंजीकरण (अगर लागू हो) | FSSAI ನೋಂದಣಿ (ಅನ್ವಯಿಸಿದರೆ) | ☐ |
| `onb.f.fssaiNumber` | FSSAI licence / registration number * | FSSAI लाइसेंस / पंजीकरण संख्या * | FSSAI ಪರವಾನಗಿ / ನೋಂದಣಿ ಸಂಖ್ಯೆ * | ☐ |
| `onb.f.handling` | Food handling, storage and transport * | खाने को संभालना, रखना और ले जाना * | ಆಹಾರ ನಿರ್ವಹಣೆ, ಸಂಗ್ರಹಣೆ ಮತ್ತು ಸಾಗಾಟ * | ☐ |
| `onb.f.operatingHours` | Operating hours * | खुलने का समय * | ಕಾರ್ಯನಿರ್ವಹಣೆ ಸಮಯ * | ☐ |
| `onb.f.orgName` | Organisation name * | संस्था का नाम * | ಸಂಸ್ಥೆಯ ಹೆಸರು * | ☐ |
| `onb.f.outletAddress` | Outlet address * | आउटलेट का पता * | ಔಟ್‌ಲೆಟ್ ವಿಳಾಸ * | ☐ |
| `onb.f.payoutUpi` | Payout UPI ID * | भुगतान पाने की UPI ID * | ಪಾವತಿ ಪಡೆಯುವ UPI ID * | ☐ |
| `onb.f.phone` | Phone * | फ़ोन * | ಫೋನ್ * | ☐ |
| `onb.f.registrationNumber` | Charity registration number (shown on donation receipts) | चैरिटी पंजीकरण संख्या (दान रसीदों पर दिखेगी) | ದತ್ತಿ ನೋಂದಣಿ ಸಂಖ್ಯೆ (ದೇಣಿಗೆ ರಸೀದಿಗಳಲ್ಲಿ ತೋರಿಸಲಾಗುತ್ತದೆ) | ☐ |
| `onb.f.serviceAreaKm` | Service area (km) | सेवा क्षेत्र (किमी) | ಸೇವಾ ವ್ಯಾಪ್ತಿ (ಕಿಮೀ) | ☐ |
| `onb.lat` | Pin latitude | पिन का अक्षांश | ಪಿನ್ ಅಕ್ಷಾಂಶ | ☐ |
| `onb.lng` | Pin longitude | पिन का देशांतर | ಪಿನ್ ರೇಖಾಂಶ | ☐ |
| `onb.locked` | Approved. Contact the platform team to change verified details. | स्वीकृत। सत्यापित जानकारी बदलने के लिए प्लैटफ़ॉर्म टीम से संपर्क करें। | ಅನುಮೋದಿಸಲಾಗಿದೆ. ಪರಿಶೀಲಿತ ವಿವರಗಳನ್ನು ಬದಲಾಯಿಸಲು ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ತಂಡವನ್ನು ಸಂಪರ್ಕಿಸಿ. | ☐ |
| `onb.logo` | Logo (JPG, PNG or WebP, under 3 MB) | लोगो (JPG, PNG या WebP, 3 MB से कम) | ಲೋಗೋ (JPG, PNG ಅಥವಾ WebP, 3 MB ಗಿಂತ ಕಡಿಮೆ) | ☐ |
| `onb.logoOptional` | Part of a complete profile; optional to submit. | पूरी प्रोफ़ाइल का हिस्सा; भेजने के लिए ज़रूरी नहीं। | ಪೂರ್ಣ ಪ್ರೊಫೈಲ್‌ನ ಭಾಗ; ಸಲ್ಲಿಸಲು ಐಚ್ಛಿಕ. | ☐ |
| `onb.logoUploaded` | Logo uploaded. | लोगो अपलोड हो गया। | ಲೋಗೋ ಅಪ್‌ಲೋಡ್ ಆಗಿದೆ. | ☐ |
| `onb.mapPin` | Map pin — neighbourhood | नक्शे का पिन — इलाक़ा | ನಕ್ಷೆ ಪಿನ್ — ಪ್ರದೇಶ | ☐ |
| `onb.ngoNote` | Only approved NGOs can claim donation batches. A demo approval is not a real regulatory approval. | सिर्फ़ स्वीकृत NGO ही दान बैच ले सकते हैं। डेमो स्वीकृति असली सरकारी मंज़ूरी नहीं है। | ಅನುಮೋದಿತ NGO ಗಳು ಮಾತ್ರ ದೇಣಿಗೆ ಬ್ಯಾಚ್‌ಗಳನ್ನು ಕ್ಲೈಮ್ ಮಾಡಬಹುದು. ಡೆಮೊ ಅನುಮೋದನೆ ನಿಜವಾದ ಸರ್ಕಾರಿ ಅನುಮೋದನೆ ಅಲ್ಲ. | ☐ |
| `onb.ngoTitle` | NGO VERIFICATION | NGO सत्यापन | NGO ಪರಿಶೀಲನೆ | ☐ |
| `onb.outletProfile` | OUTLET PROFILE | आउटलेट प्रोफ़ाइल | ಔಟ್‌ಲೆಟ್ ಪ್ರೊಫೈಲ್ | ☐ |
| `onb.ownerOnly` | Only the owner can edit the business profile ({business}). | सिर्फ़ मालिक ही व्यवसाय की प्रोफ़ाइल बदल सकते हैं ({business})। | ಮಾಲೀಕರು ಮಾತ್ರ ವ್ಯವಹಾರ ಪ್ರೊಫೈಲ್ ಸಂಪಾದಿಸಬಹುದು ({business}). | ☐ |
| `onb.reason` | Reason: {reason} | कारण: {reason} | ಕಾರಣ: {reason} | ☐ |
| `onb.reviewNote` | An administrator reviews every application. Demo approvals are not real FSSAI or regulatory approvals. | हर आवेदन की जाँच एक एडमिन करता है। डेमो स्वीकृति असली FSSAI या सरकारी मंज़ूरी नहीं है। | ಪ್ರತಿ ಅರ್ಜಿಯನ್ನು ನಿರ್ವಾಹಕರು ಪರಿಶೀಲಿಸುತ್ತಾರೆ. ಡೆಮೊ ಅನುಮೋದನೆಗಳು ನಿಜವಾದ FSSAI ಅಥವಾ ಸರ್ಕಾರಿ ಅನುಮೋದನೆಗಳಲ್ಲ. | ☐ |
| `onb.status` | Status: | स्थिति: | ಸ್ಥಿತಿ: | ☐ |
| `onb.submit` | Submit for review | समीक्षा के लिए भेजें | ಪರಿಶೀಲನೆಗೆ ಸಲ್ಲಿಸಿ | ☐ |
| `onb.submitted` | Submitted. Status: Pending until an administrator reviews it. | भेज दिया गया। स्थिति: एडमिन की जाँच तक लंबित। | ಸಲ್ಲಿಸಲಾಗಿದೆ. ಸ್ಥಿತಿ: ನಿರ್ವಾಹಕರು ಪರಿಶೀಲಿಸುವವರೆಗೆ ಬಾಕಿ. | ☐ |
| `onb.submitting` | Submitting… | भेजा जा रहा है… | ಸಲ್ಲಿಸಲಾಗುತ್ತಿದೆ… | ☐ |
| `onb.uploadFailed` | Upload failed | अपलोड नहीं हो सका | ಅಪ್‌ಲೋಡ್ ವಿಫಲವಾಯಿತು | ☐ |
| `onb.vendorTitle` | VENDOR ONBOARDING | विक्रेता ऑनबोर्डिंग | ಮಾರಾಟಗಾರ ಆನ್‌ಬೋರ್ಡಿಂಗ್ | ☐ |

## order

| Key | English | हिन्दी | ಕನ್ನಡ | OK? |
|---|---|---|---|---|
| `order.collected` | Collected {when}. Code is now invalid. | {when} को लिया गया। कोड अब मान्य नहीं है। | {when} ರಂದು ಸಂಗ್ರಹಿಸಲಾಗಿದೆ. ಕೋಡ್ ಈಗ ಅಮಾನ್ಯ. | ☐ |
| `order.directions` | Get directions | रास्ता देखें | ದಾರಿ ನೋಡಿ | ☐ |
| `order.directionsNote` | Directions start from Koramangala (demo default location). | रास्ता कोरमंगला से शुरू होता है (डेमो का डिफ़ॉल्ट स्थान)। | ದಾರಿ ಕೋರಮಂಗಲದಿಂದ ಆರಂಭವಾಗುತ್ತದೆ (ಡೆಮೊ ಡೀಫಾಲ್ಟ್ ಸ್ಥಳ). | ☐ |
| `order.fallbackAria` | Fallback code {code} | वैकल्पिक कोड {code} | ಪರ್ಯಾಯ ಕೋಡ್ {code} | ☐ |
| `order.history` | Order history | ऑर्डर का इतिहास | ಆರ್ಡರ್ ಇತಿಹಾಸ | ☐ |
| `order.isStatus` | This order is {status}. | यह ऑर्डर {status} है। | ಈ ಆರ್ಡರ್ {status} ಆಗಿದೆ. | ☐ |
| `order.methodOnline` | online, test mode | ऑनलाइन, टेस्ट मोड | ಆನ್‌ಲೈನ್, ಪರೀಕ್ಷಾ ಮೋಡ್ | ☐ |
| `order.methodPickup` | pay at pickup | पिकअप पर भुगतान | ಪಿಕಪ್‌ನಲ್ಲಿ ಪಾವತಿ | ☐ |
| `order.noHistory` | No history recorded. | कोई इतिहास दर्ज नहीं। | ಯಾವುದೇ ಇತಿಹಾಸ ದಾಖಲಾಗಿಲ್ಲ. | ☐ |
| `order.noShow` | Marked a no-show: not collected within 15 minutes of pickup end. | 'नहीं आए' दर्ज: पिकअप खत्म होने के 15 मिनट के भीतर नहीं लिया गया। | ಬರಲಿಲ್ಲ ಎಂದು ಗುರುತಿಸಲಾಗಿದೆ: ಪಿಕಪ್ ಮುಗಿದ 15 ನಿಮಿಷಗಳ ಒಳಗೆ ತೆಗೆದುಕೊಳ್ಳಲಿಲ್ಲ. | ☐ |
| `order.once` | Works once, only at {vendor}, only during the pickup window. | सिर्फ़ एक बार चलता है, सिर्फ़ {vendor} पर, और सिर्फ़ पिकअप के समय में। | ಒಮ್ಮೆ ಮಾತ್ರ ಕೆಲಸ ಮಾಡುತ್ತದೆ, {vendor} ನಲ್ಲಿ ಮಾತ್ರ, ಪಿಕಪ್ ಸಮಯದಲ್ಲಿ ಮಾತ್ರ. | ☐ |
| `order.orTell` | Or tell the counter | या काउंटर पर बताएँ | ಅಥವಾ ಕೌಂಟರ್‌ನಲ್ಲಿ ಹೇಳಿ | ☐ |
| `order.paidWithCredit` | (₹{amount} paid with credit) | (₹{amount} क्रेडिट से चुकाए) | (₹{amount} ಕ್ರೆಡಿಟ್‌ನಿಂದ ಪಾವತಿ) | ☐ |
| `order.pass` | Pickup pass · {ref} | पिकअप पास · {ref} | ಪಿಕಪ್ ಪಾಸ್ · {ref} | ☐ |
| `order.payment` | Payment: {status} ({method}) | भुगतान: {status} ({method}) | ಪಾವತಿ: {status} ({method}) | ☐ |
| `order.pickupOpen` | Pickup is open | पिकअप खुला है | ಪಿಕಪ್ ತೆರೆದಿದೆ | ☐ |
| `order.progress` | Order progress | ऑर्डर की प्रगति | ಆರ್ಡರ್ ಪ್ರಗತಿ | ☐ |
| `order.qrAlt` | Pickup QR code for {ref} | {ref} के लिए पिकअप QR कोड | {ref} ಗಾಗಿ ಪಿಕಪ್ QR ಕೋಡ್ | ☐ |
| `order.readyForYou` | READY FOR YOU | आपके लिए तैयार | ನಿಮಗಾಗಿ ಸಿದ್ಧ | ☐ |
| `order.reserved` | RESERVED | आरक्षित | ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ | ☐ |
| `order.surprise` | Your Surprise Bag: | आपका सरप्राइज़ बैग: | ನಿಮ್ಮ ಸರ್ಪ್ರೈಸ್ ಬ್ಯಾಗ್: | ☐ |
| `order.surpriseVaried` | contents varied with what was left today. | सामान आज जो बचा था उसके हिसाब से अलग-अलग था। | ಇಂದು ಉಳಿದಿದ್ದಕ್ಕೆ ತಕ್ಕಂತೆ ವಿಷಯ ಬದಲಾಗಿತ್ತು. | ☐ |
| `order.untilClose` | until the window closes | समय खत्म होने तक | ಸಮಯ ಮುಗಿಯುವವರೆಗೆ | ☐ |
| `order.untilOpen` | until pickup opens | पिकअप खुलने तक | ಪಿಕಪ್ ತೆರೆಯುವವರೆಗೆ | ☐ |
| `order.window` | Pickup window {window} | पिकअप का समय {window} | ಪಿಕಪ್ ಸಮಯ {window} | ☐ |
| `order.windowClosed` | Window closed | समय खत्म | ಸಮಯ ಮುಗಿದಿದೆ | ☐ |
| `order.youRated` | You rated this order | आपने इस ऑर्डर को रेट किया | ನೀವು ಈ ಆರ್ಡರ್‌ಗೆ ರೇಟಿಂಗ್ ನೀಡಿದ್ದೀರಿ | ☐ |

## orders

| Key | English | हिन्दी | ಕನ್ನಡ | OK? |
|---|---|---|---|---|
| `orders.active` | Active ({n}/{max}) | चालू ({n}/{max}) | ಸಕ್ರಿಯ ({n}/{max}) | ☐ |
| `orders.noActive` | No active reservations. | कोई चालू आरक्षण नहीं। | ಯಾವುದೇ ಸಕ್ರಿಯ ಕಾಯ್ದಿರಿಸುವಿಕೆ ಇಲ್ಲ. | ☐ |
| `orders.nothingYet` | Nothing yet. | अभी कुछ नहीं। | ಇನ್ನೂ ಏನೂ ಇಲ್ಲ. | ☐ |
| `orders.past` | Past orders | पिछले ऑर्डर | ಹಿಂದಿನ ಆರ್ಡರ್‌ಗಳು | ☐ |
| `orders.placed` | Placed {when} · ₹{amount} · {pay} | {when} को दिया · ₹{amount} · {pay} | {when} ರಂದು ಇಟ್ಟಿದ್ದು · ₹{amount} · {pay} | ☐ |
| `orders.row` | {ref} · {vendor} · pickup {window} | {ref} · {vendor} · पिकअप {window} | {ref} · {vendor} · ಪಿಕಪ್ {window} | ☐ |
| `orders.title` | MY ORDERS | मेरे ऑर्डर | ನನ್ನ ಆರ್ಡರ್‌ಗಳು | ☐ |

## org

| Key | English | हिन्दी | ಕನ್ನಡ | OK? |
|---|---|---|---|---|
| `org.addOutlet` | Add outlet | आउटलेट जोड़ें | ಔಟ್‌ಲೆಟ್ ಸೇರಿಸಿ | ☐ |
| `org.allOutlets` | All outlets | सभी आउटलेट | ಎಲ್ಲಾ ಔಟ್‌ಲೆಟ್‌ಗಳು | ☐ |
| `org.analyticsByOutlet` | By outlet | आउटलेट के अनुसार | ಔಟ್‌ಲೆಟ್ ಪ್ರಕಾರ | ☐ |
| `org.cancelInvite` | Cancel invite | आमंत्रण रद्द करें | ಆಹ್ವಾನ ರದ್ದುಮಾಡಿ | ☐ |
| `org.contact` | Mobile number or email | मोबाइल नंबर या ईमेल | ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಅಥವಾ ಇಮೇಲ್ | ☐ |
| `org.expired` | Expired | समाप्त | ಅವಧಿ ಮುಗಿದಿದೆ | ☐ |
| `org.expires` | Expires {date} | {date} को समाप्त | {date} ರಂದು ಮುಗಿಯುತ್ತದೆ | ☐ |
| `org.flagOff` | Multiple outlets are switched off by the platform. | प्लैटफ़ॉर्म ने एक से अधिक आउटलेट बंद किए हैं। | ವೇದಿಕೆಯು ಹಲವು ಔಟ್‌ಲೆಟ್‌ಗಳನ್ನು ಆಫ್ ಮಾಡಿದೆ. | ☐ |
| `org.inviteHelp` | Send them the link. Staff work at one outlet and can only handle orders; managers run listings and orders. | उन्हें लिंक भेजें। स्टाफ़ एक आउटलेट पर काम करता है और केवल ऑर्डर संभालता है; मैनेजर लिस्टिंग और ऑर्डर चलाते हैं। | ಅವರಿಗೆ ಲಿಂಕ್ ಕಳುಹಿಸಿ. ಸಿಬ್ಬಂದಿ ಒಂದು ಔಟ್‌ಲೆಟ್‌ನಲ್ಲಿ ಕೆಲಸ ಮಾಡಿ ಆರ್ಡರ್‌ಗಳನ್ನು ಮಾತ್ರ ನಿರ್ವಹಿಸುತ್ತಾರೆ; ಮ್ಯಾನೇಜರ್‌ಗಳು ಲಿಸ್ಟಿಂಗ್ ಮತ್ತು ಆರ್ಡರ್‌ಗಳನ್ನು ನಡೆಸುತ್ತಾರೆ. | ☐ |
| `org.inviteReady` | Invite link (valid 7 days): | आमंत्रण लिंक (7 दिन मान्य): | ಆಹ್ವಾನ ಲಿಂಕ್ (7 ದಿನ ಮಾನ್ಯ): | ☐ |
| `org.inviteTitle` | Invite someone | किसी को आमंत्रित करें | ಯಾರನ್ನಾದರೂ ಆಹ್ವಾನಿಸಿ | ☐ |
| `org.joinAccept` | Join {business} | {business} से जुड़ें | {business} ಗೆ ಸೇರಿ | ☐ |
| `org.joinAs` | You've been invited as {role}{outlet}. | आपको {role}{outlet} के रूप में आमंत्रित किया गया है। | ನಿಮ್ಮನ್ನು {role}{outlet} ಆಗಿ ಆಹ್ವಾನಿಸಲಾಗಿದೆ. | ☐ |
| `org.joinInvalid` | This invite link isn't valid. | यह आमंत्रण लिंक मान्य नहीं है। | ಈ ಆಹ್ವಾನ ಲಿಂಕ್ ಮಾನ್ಯವಲ್ಲ. | ☐ |
| `org.joinNeedVendor` | You're signed in as a different kind of account. Sign in with the vendor account for the invited number. | आप दूसरे प्रकार के खाते से साइन इन हैं। आमंत्रित नंबर वाले वेंडर खाते से साइन इन करें। | ನೀವು ಬೇರೆ ರೀತಿಯ ಖಾತೆಯಿಂದ ಸೈನ್ ಇನ್ ಆಗಿದ್ದೀರಿ. ಆಹ್ವಾನಿತ ಸಂಖ್ಯೆಯ ವೆಂಡರ್ ಖಾತೆಯಿಂದ ಸೈನ್ ಇನ್ ಮಾಡಿ. | ☐ |
| `org.joinSignIn` | Sign in to accept | स्वीकार करने के लिए साइन इन करें | ಸ್ವೀಕರಿಸಲು ಸೈನ್ ಇನ್ ಮಾಡಿ | ☐ |
| `org.joinState.expired` | This invite has expired. Ask for a new one. | यह आमंत्रण समाप्त हो गया है। नया माँगें। | ಈ ಆಹ್ವಾನದ ಅವಧಿ ಮುಗಿದಿದೆ. ಹೊಸದನ್ನು ಕೇಳಿ. | ☐ |
| `org.joinState.revoked` | This invite was cancelled. | यह आमंत्रण रद्द कर दिया गया था। | ಈ ಆಹ್ವಾನವನ್ನು ರದ್ದುಮಾಡಲಾಗಿದೆ. | ☐ |
| `org.joinState.used` | This invite was already used. | यह आमंत्रण पहले ही इस्तेमाल हो चुका है। | ಈ ಆಹ್ವಾನವನ್ನು ಈಗಾಗಲೇ ಬಳಸಲಾಗಿದೆ. | ☐ |
| `org.joinTitle` | Join {business} | {business} से जुड़ें | {business} ಗೆ ಸೇರಿ | ☐ |
| `org.lat` | Latitude | अक्षांश | ಅಕ್ಷಾಂಶ | ☐ |
| `org.lng` | Longitude | देशांतर | ರೇಖಾಂಶ | ☐ |
| `org.members` | Team members | टीम के सदस्य | ತಂಡದ ಸದಸ್ಯರು | ☐ |
| `org.neighbourhood` | Neighbourhood | इलाका | ಬಡಾವಣೆ | ☐ |
| `org.noAccess` | You don't have access to this page. | आपको इस पेज की अनुमति नहीं है। | ಈ ಪುಟಕ್ಕೆ ನಿಮಗೆ ಪ್ರವೇಶವಿಲ್ಲ. | ☐ |
| `org.noPending` | No pending invites. | कोई लंबित आमंत्रण नहीं। | ಬಾಕಿ ಆಹ್ವಾನಗಳಿಲ್ಲ. | ☐ |
| `org.outlet` | Outlet | आउटलेट | ಔಟ್‌ಲೆಟ್ | ☐ |
| `org.outletAddress` | Address | पता | ವಿಳಾಸ | ☐ |
| `org.outletHours` | Opening hours | खुलने का समय | ತೆರೆಯುವ ಸಮಯ | ☐ |
| `org.outletName` | Outlet name | आउटलेट का नाम | ಔಟ್‌ಲೆಟ್ ಹೆಸರು | ☐ |
| `org.outlets` | Outlets | आउटलेट | ಔಟ್‌ಲೆಟ್‌ಗಳು | ☐ |
| `org.pending` | Pending invites | लंबित आमंत्रण | ಬಾಕಿ ಇರುವ ಆಹ್ವಾನಗಳು | ☐ |
| `org.remove` | Remove | हटाएँ | ತೆಗೆದುಹಾಕಿ | ☐ |
| `org.removeConfirm` | Remove {name}? They lose access immediately. | {name} को हटाएँ? उनकी पहुँच तुरंत बंद हो जाएगी। | {name} ಅವರನ್ನು ತೆಗೆದುಹಾಕಬೇಕೆ? ಅವರ ಪ್ರವೇಶ ತಕ್ಷಣ ಕೊನೆಗೊಳ್ಳುತ್ತದೆ. | ☐ |
| `org.role` | Role | भूमिका | ಪಾತ್ರ | ☐ |
| `org.role.manager` | Manager | मैनेजर | ಮ್ಯಾನೇಜರ್ | ☐ |
| `org.role.owner` | Owner | मालिक | ಮಾಲೀಕ | ☐ |
| `org.role.staff` | Staff | स्टाफ़ | ಸಿಬ್ಬಂದಿ | ☐ |
| `org.sendInvite` | Create invite link | आमंत्रण लिंक बनाएँ | ಆಹ್ವಾನ ಲಿಂಕ್ ರಚಿಸಿ | ☐ |
| `org.staffNote` | You are signed in as staff at {outlet}. You can see and hand over this outlet's orders. | आप {outlet} में स्टाफ़ के रूप में साइन इन हैं। आप इस आउटलेट के ऑर्डर देख और सौंप सकते हैं। | ನೀವು {outlet} ನಲ್ಲಿ ಸಿಬ್ಬಂದಿಯಾಗಿ ಸೈನ್ ಇನ್ ಆಗಿದ್ದೀರಿ. ಈ ಔಟ್‌ಲೆಟ್‌ನ ಆರ್ಡರ್‌ಗಳನ್ನು ನೋಡಬಹುದು ಮತ್ತು ಹಸ್ತಾಂತರಿಸಬಹುದು. | ☐ |
| `org.team` | Team and outlets | टीम और आउटलेट | ತಂಡ ಮತ್ತು ಔಟ್‌ಲೆಟ್‌ಗಳು | ☐ |
| `org.total` | All outlets | सभी आउटलेट | ಎಲ್ಲಾ ಔಟ್‌ಲೆಟ್‌ಗಳು | ☐ |
| `org.you` | You | आप | ನೀವು | ☐ |

## p1

| Key | English | हिन्दी | ಕನ್ನಡ | OK? |
|---|---|---|---|---|
| `p1.allowPap` | Allow pay at pickup | पिकअप पर भुगतान की अनुमति दें | ಪಿಕಪ್‌ನಲ್ಲಿ ಪಾವತಿಗೆ ಅನುಮತಿಸಿ | ☐ |
| `p1.allowPapHelp` | Offered only to customers with 3+ completed pickups. | सिर्फ़ उन ग्राहकों को मिलेगा जिनके 3 या ज़्यादा पिकअप पूरे हो चुके हैं। | 3 ಅಥವಾ ಹೆಚ್ಚು ಪಿಕಪ್ ಪೂರ್ಣಗೊಳಿಸಿದ ಗ್ರಾಹಕರಿಗೆ ಮಾತ್ರ ನೀಡಲಾಗುತ್ತದೆ. | ☐ |
| `p1.live` | Live! | चालू हो गया! | ಲೈವ್ ಆಯಿತು! | ☐ |
| `p1.maxUnits` | Max units per order (default {def}) | प्रति ऑर्डर अधिकतम यूनिट (डिफ़ॉल्ट {def}) | ಪ್ರತಿ ಆರ್ಡರ್‌ಗೆ ಗರಿಷ್ಠ ಯೂನಿಟ್‌ಗಳು (ಡೀಫಾಲ್ಟ್ {def}) | ☐ |
| `p1.pickupTime` | Pickup time | पिकअप का समय | ಪಿಕಪ್ ಸಮಯ | ☐ |
| `p1.pickupVolunteer` | Pickup & volunteer | पिकअप और स्वयंसेवक | ಪಿಕಪ್ ಮತ್ತು ಸ್ವಯಂಸೇವಕ | ☐ |
| `p1.posting` | Posting… | डाला जा रहा है… | ಹಾಕಲಾಗುತ್ತಿದೆ… | ☐ |
| `p1.rated_one` | Rated {avg} out of 5 from {n} rating | {n} रेटिंग से 5 में से {avg} रेटिंग | {n} ರೇಟಿಂಗ್‌ನಿಂದ 5 ರಲ್ಲಿ {avg} ರೇಟಿಂಗ್ | ☐ |
| `p1.rated_other` | Rated {avg} out of 5 from {n} ratings | {n} रेटिंग से 5 में से {avg} रेटिंग | {n} ರೇಟಿಂಗ್‌ಗಳಿಂದ 5 ರಲ್ಲಿ {avg} ರೇಟಿಂಗ್ | ☐ |
| `p1.ratingNone` | No ratings yet | अभी कोई रेटिंग नहीं | ಇನ್ನೂ ರೇಟಿಂಗ್ ಇಲ್ಲ | ☐ |
| `p1.repost` | Repost | दोबारा डालें | ಮತ್ತೆ ಹಾಕಿ | ☐ |
| `p1.repostAria` | Repost {title} with fresh pickup times | {title} को नए पिकअप समय के साथ दोबारा डालें | {title} ಅನ್ನು ಹೊಸ ಪಿಕಪ್ ಸಮಯಗಳೊಂದಿಗೆ ಮತ್ತೆ ಹಾಕಿ | ☐ |
| `p1.repostConfirm` | Repost "{title}" with fresh pickup times?  By continuing you confirm the food-safety declaration: this food was prepared and stored hygienically and is fit to eat within the stated time. | "{title}" को नए पिकअप समय के साथ दोबारा डालें?  आगे बढ़कर आप खाद्य-सुरक्षा घोषणा की पुष्टि करते हैं: यह खाना साफ़-सफ़ाई से बनाया और रखा गया है और बताए गए समय तक खाने लायक है। | "{title}" ಅನ್ನು ಹೊಸ ಪಿಕಪ್ ಸಮಯಗಳೊಂದಿಗೆ ಮತ್ತೆ ಹಾಕಬೇಕೇ?  ಮುಂದುವರಿಯುವ ಮೂಲಕ ನೀವು ಆಹಾರ ಸುರಕ್ಷತಾ ಘೋಷಣೆಯನ್ನು ದೃಢೀಕರಿಸುತ್ತೀರಿ: ಈ ಆಹಾರವನ್ನು ಶುಚಿಯಾಗಿ ತಯಾರಿಸಿ ಸಂಗ್ರಹಿಸಲಾಗಿದೆ ಮತ್ತು ತಿಳಿಸಿದ ಸಮಯದೊಳಗೆ ತಿನ್ನಲು ಯೋಗ್ಯವಾಗಿದೆ. | ☐ |
| `p1.saveSettings` | Save settings | सेटिंग्स सहेजें | ಸೆಟ್ಟಿಂಗ್‌ಗಳನ್ನು ಉಳಿಸಿ | ☐ |
| `p1.schedulePickup` | Schedule pickup | पिकअप तय करें | ಪಿಕಪ್ ನಿಗದಿಪಡಿಸಿ | ☐ |
| `p1.scheduled` | Pickup scheduled. Share the volunteer link below. | पिकअप तय हो गया। नीचे दिया स्वयंसेवक लिंक साझा करें। | ಪಿಕಪ್ ನಿಗದಿಯಾಗಿದೆ. ಕೆಳಗಿನ ಸ್ವಯಂಸೇವಕ ಲಿಂಕ್ ಹಂಚಿಕೊಳ್ಳಿ. | ☐ |
| `p1.surprise.badge` | Surprise Bag | सरप्राइज़ बैग | ಸರ್ಪ್ರೈಸ್ ಬ್ಯಾಗ್ | ☐ |
| `p1.surprise.note` | Surprise Bag · fixed price · contents revealed at pickup | सरप्राइज़ बैग · तय कीमत · सामान पिकअप पर पता चलेगा | ಸರ್ಪ್ರೈಸ್ ಬ್ಯಾಗ್ · ನಿಗದಿತ ಬೆಲೆ · ಪಿಕಪ್‌ನಲ್ಲಿ ವಿಷಯ ತಿಳಿಯುತ್ತದೆ | ☐ |
| `p1.surprise.worth` | Worth ₹{amount} | ₹{amount} का | ₹{amount} ಮೌಲ್ಯದ | ☐ |
| `p1.updatePickup` | Update pickup | पिकअप अपडेट करें | ಪಿಕಪ್ ಅಪ್‌ಡೇಟ್ ಮಾಡಿ | ☐ |
| `p1.verified` | Verified | सत्यापित | ಪರಿಶೀಲಿತ | ☐ |
| `p1.verifiedTip` | Approved by Save a Plate (demo approval, not a regulatory approval). | Save a Plate द्वारा स्वीकृत (डेमो स्वीकृति, कोई सरकारी मंज़ूरी नहीं)। | Save a Plate ಅನುಮೋದಿಸಿದೆ (ಡೆಮೊ ಅನುಮೋದನೆ, ಸರ್ಕಾರಿ ಅನುಮೋದನೆ ಅಲ್ಲ). | ☐ |
| `p1.volLink` | Volunteer link (no login, expires at the deadline) | स्वयंसेवक लिंक (लॉगिन नहीं चाहिए, समय सीमा पर खत्म हो जाएगा) | ಸ್ವಯಂಸೇವಕ ಲಿಂಕ್ (ಲಾಗಿನ್ ಬೇಡ, ಗಡುವಿಗೆ ಮುಕ್ತಾಯವಾಗುತ್ತದೆ) | ☐ |
| `p1.volName` | Volunteer name | स्वयंसेवक का नाम | ಸ್ವಯಂಸೇವಕರ ಹೆಸರು | ☐ |
| `p1.volPhone` | Volunteer phone | स्वयंसेवक का फ़ोन | ಸ್ವಯಂಸೇವಕರ ಫೋನ್ | ☐ |

## payouts

| Key | English | हिन्दी | ಕನ್ನಡ | OK? |
|---|---|---|---|---|
| `payouts.caption` | Daily settlements | रोज़ के निपटान | ದೈನಂದಿನ ಇತ್ಯರ್ಥಗಳು | ☐ |
| `payouts.cash` | Cash at pickup | पिकअप पर नकद | ಪಿಕಪ್‌ನಲ್ಲಿ ನಗದು | ☐ |
| `payouts.cashNote` | Cash collected at pickup goes straight to you and is not part of the platform settlement. | पिकअप पर मिला नकद सीधे आपका होता है और प्लैटफ़ॉर्म के निपटान का हिस्सा नहीं है। | ಪಿಕಪ್‌ನಲ್ಲಿ ಪಡೆದ ನಗದು ನೇರವಾಗಿ ನಿಮ್ಮದಾಗುತ್ತದೆ ಮತ್ತು ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಇತ್ಯರ್ಥದ ಭಾಗವಲ್ಲ. | ☐ |
| `payouts.date` | Date | तारीख़ | ದಿನಾಂಕ | ☐ |
| `payouts.emptyBody` | Online orders show up here the day they are collected. | ऑनलाइन ऑर्डर जिस दिन लिए जाते हैं उसी दिन यहाँ दिखते हैं। | ಆನ್‌ಲೈನ್ ಆರ್ಡರ್‌ಗಳು ಸಂಗ್ರಹಿಸಿದ ದಿನವೇ ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತವೆ. | ☐ |
| `payouts.emptyTitle` | No settlements yet | अभी कोई निपटान नहीं | ಇನ್ನೂ ಇತ್ಯರ್ಥಗಳಿಲ್ಲ | ☐ |
| `payouts.fee` | Fee ({pct}%) | शुल्क ({pct}%) | ಶುಲ್ಕ ({pct}%) | ☐ |
| `payouts.gross` | Gross | कुल (ग्रॉस) | ಒಟ್ಟು (ಗ್ರಾಸ್) | ☐ |
| `payouts.intro` | Daily settlement of online (test-mode) payments for collected orders. Platform fee {pct}% of order value. Demo figures, no real money moves. | ली गई ऑर्डर के ऑनलाइन (टेस्ट-मोड) भुगतानों का रोज़ का हिसाब। प्लैटफ़ॉर्म शुल्क ऑर्डर मूल्य का {pct}%। डेमो आँकड़े, कोई असली पैसा नहीं चलता। | ಸಂಗ್ರಹಿಸಿದ ಆರ್ಡರ್‌ಗಳ ಆನ್‌ಲೈನ್ (ಪರೀಕ್ಷಾ-ಮೋಡ್) ಪಾವತಿಗಳ ದೈನಂದಿನ ಇತ್ಯರ್ಥ. ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಶುಲ್ಕ ಆರ್ಡರ್ ಮೌಲ್ಯದ {pct}%. ಡೆಮೊ ಅಂಕಿಅಂಶಗಳು, ನಿಜವಾದ ಹಣ ಚಲಿಸುವುದಿಲ್ಲ. | ☐ |
| `payouts.net` | Net | शुद्ध (नेट) | ನಿವ್ವಳ | ☐ |
| `payouts.orders` | Orders | ऑर्डर | ಆರ್ಡರ್‌ಗಳು | ☐ |
| `payouts.title` | PAYOUTS | भुगतान (पेआउट) | ಪಾವತಿಗಳು | ☐ |
| `payouts.whyOnboard` | Complete vendor onboarding first. | पहले विक्रेता ऑनबोर्डिंग पूरी करें। | ಮೊದಲು ಮಾರಾಟಗಾರ ಆನ್‌ಬೋರ್ಡಿಂಗ್ ಪೂರ್ಣಗೊಳಿಸಿ. | ☐ |
| `payouts.whyOwner` | Payouts are visible to the owner only. | पेआउट सिर्फ़ मालिक को दिखते हैं। | ಪಾವತಿಗಳು ಮಾಲೀಕರಿಗೆ ಮಾತ್ರ ಕಾಣಿಸುತ್ತವೆ. | ☐ |

## prio

| Key | English | हिन्दी | ಕನ್ನಡ | OK? |
|---|---|---|---|---|
| `prio.badge` | Charity priority until {time} | {time} तक संस्थाओं को प्राथमिकता | {time} ವರೆಗೆ ಸಂಸ್ಥೆಗಳಿಗೆ ಆದ್ಯತೆ | ☐ |
| `prio.claim` | Claim all {n} · free | सभी {n} लें · मुफ़्त | ಎಲ್ಲಾ {n} ಪಡೆಯಿರಿ · ಉಚಿತ | ☐ |
| `prio.claimed` | Claimed. See your collection code below. | ले लिया। नीचे अपना संग्रह कोड देखें। | ಪಡೆಯಲಾಗಿದೆ. ಕೆಳಗೆ ನಿಮ್ಮ ಸಂಗ್ರಹ ಕೋಡ್ ನೋಡಿ. | ☐ |
| `prio.field` | Offer to charities first | पहले संस्थाओं को पेश करें | ಮೊದಲು ಸಂಸ್ಥೆಗಳಿಗೆ ನೀಡಿ | ☐ |
| `prio.help` | Customers can't see these yet. Claim one now and it is yours, free, and never goes public. | ग्राहक इन्हें अभी नहीं देख सकते। अभी लें तो यह मुफ़्त आपका है और कभी सार्वजनिक नहीं होगा। | ಗ್ರಾಹಕರಿಗೆ ಇವು ಇನ್ನೂ ಕಾಣುವುದಿಲ್ಲ. ಈಗ ಪಡೆದರೆ ಇದು ಉಚಿತವಾಗಿ ನಿಮ್ಮದು, ಎಂದಿಗೂ ಸಾರ್ವಜನಿಕವಾಗುವುದಿಲ್ಲ. | ☐ |
| `prio.help.vendor` | Nearby verified charities see it first and are notified. If one claims it, the food is donated, not sold. If nobody does, it opens to customers when the window ends. | आस-पास की सत्यापित संस्थाएँ इसे पहले देखती हैं और उन्हें सूचना मिलती है। कोई ले ले तो खाना दान होता है, बिकता नहीं। कोई न ले तो समय खत्म होने पर यह ग्राहकों के लिए खुल जाता है। | ಹತ್ತಿರದ ಪರಿಶೀಲಿತ ಸಂಸ್ಥೆಗಳಿಗೆ ಮೊದಲು ಕಾಣುತ್ತದೆ ಮತ್ತು ಅವರಿಗೆ ಸೂಚನೆ ಹೋಗುತ್ತದೆ. ಯಾರಾದರೂ ಪಡೆದರೆ ಆಹಾರ ದಾನವಾಗುತ್ತದೆ, ಮಾರಾಟವಾಗುವುದಿಲ್ಲ. ಯಾರೂ ಪಡೆಯದಿದ್ದರೆ ಅವಧಿ ಮುಗಿದಾಗ ಗ್ರಾಹಕರಿಗೆ ತೆರೆಯುತ್ತದೆ. | ☐ |
| `prio.minutes` | {n} minutes | {n} मिनट | {n} ನಿಮಿಷ | ☐ |
| `prio.none` | No priority offers nearby right now. | अभी आस-पास कोई प्राथमिकता ऑफ़र नहीं। | ಈಗ ಹತ್ತಿರದಲ್ಲಿ ಆದ್ಯತೆಯ ಕೊಡುಗೆಗಳಿಲ್ಲ. | ☐ |
| `prio.none.option` | No, list for everyone | नहीं, सबके लिए लिस्ट करें | ಇಲ್ಲ, ಎಲ್ಲರಿಗೂ ಪಟ್ಟಿ ಮಾಡಿ | ☐ |
| `prio.title` | Priority offers (charities first) | प्राथमिकता वाले ऑफ़र (पहले संस्थाओं को) | ಆದ್ಯತೆಯ ಕೊಡುಗೆಗಳು (ಮೊದಲು ಸಂಸ್ಥೆಗಳಿಗೆ) | ☐ |
| `prio.until` | Open to charities until {time} | {time} तक संस्थाओं के लिए खुला | {time} ವರೆಗೆ ಸಂಸ್ಥೆಗಳಿಗೆ ಮುಕ್ತ | ☐ |

## rcpt

| Key | English | हिन्दी | ಕನ್ನಡ | OK? |
|---|---|---|---|---|
| `rcpt.apply` | Apply | लागू करें | ಅನ್ವಯಿಸಿ | ☐ |
| `rcpt.date` | Collected | लिया गया | ಪಡೆದ ದಿನ | ☐ |
| `rcpt.filter` | Filter receipts by date | तारीख़ से रसीदें छाँटें | ದಿನಾಂಕದ ಪ್ರಕಾರ ರಸೀದಿಗಳನ್ನು ಸೋಸಿ | ☐ |
| `rcpt.from` | From | से | ಇಂದ | ☐ |
| `rcpt.item` | Item | वस्तु | ವಸ್ತು | ☐ |
| `rcpt.none` | No receipts in this range | इस अवधि में कोई रसीद नहीं | ಈ ಅವಧಿಯಲ್ಲಿ ರಸೀದಿಗಳಿಲ್ಲ | ☐ |
| `rcpt.noneHelp` | A receipt is created for every donation once the charity has collected it. | संस्था के दान लेने के बाद हर दान की रसीद बनती है। | ಸಂಸ್ಥೆ ದಾನವನ್ನು ಪಡೆದ ನಂತರ ಪ್ರತಿ ದಾನಕ್ಕೂ ರಸೀದಿ ರಚಿತವಾಗುತ್ತದೆ. | ☐ |
| `rcpt.note` | Values are estimates (quantity × original menu price). A receipt is not a tax document unless it names a valid 80G registration, and even then the charity's own 80G receipt applies. | मूल्य अनुमान हैं (मात्रा × मूल मेनू कीमत)। रसीद कर दस्तावेज़ नहीं है जब तक उसमें वैध 80G पंजीकरण का नाम न हो, और तब भी संस्था की अपनी 80G रसीद मान्य होगी। | ಮೌಲ್ಯಗಳು ಅಂದಾಜುಗಳು (ಪ್ರಮಾಣ × ಮೂಲ ಮೆನು ಬೆಲೆ). ಮಾನ್ಯ 80G ನೋಂದಣಿಯನ್ನು ಉಲ್ಲೇಖಿಸದ ಹೊರತು ರಸೀದಿ ತೆರಿಗೆ ದಾಖಲೆಯಲ್ಲ, ಉಲ್ಲೇಖಿಸಿದರೂ ಸಂಸ್ಥೆಯ ಸ್ವಂತ 80G ರಸೀದಿ ಅನ್ವಯಿಸುತ್ತದೆ. | ☐ |
| `rcpt.number` | Receipt no. | रसीद संख्या | ರಸೀದಿ ಸಂಖ್ಯೆ | ☐ |
| `rcpt.title` | Donation receipts | दान रसीदें | ದಾನ ರಸೀದಿಗಳು | ☐ |
| `rcpt.to` | To | तक | ವರೆಗೆ | ☐ |
| `rcpt.value` | Estimated value | अनुमानित मूल्य | ಅಂದಾಜು ಮೌಲ್ಯ | ☐ |
| `rcpt.with` | Donor → Charity | दाता → संस्था | ದಾನಿ → ಸಂಸ್ಥೆ | ☐ |
| `rcpt.zip` | Download all ({n}) as zip | सभी ({n}) ज़िप में डाउनलोड करें | ಎಲ್ಲಾ ({n}) ಜಿಪ್‌ನಲ್ಲಿ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ | ☐ |

## ref

| Key | English | हिन्दी | ಕನ್ನಡ | OK? |
|---|---|---|---|---|
| `ref.applied` | Code applied. You'll earn {amount} after your first pickup. | कोड लग गया। पहले पिकअप के बाद आपको {amount} मिलेंगे। | ಕೋಡ್ ಅನ್ವಯಿಸಲಾಗಿದೆ. ಮೊದಲ ಪಿಕಪ್ ನಂತರ ನಿಮಗೆ {amount} ಸಿಗುತ್ತದೆ. | ☐ |
| `ref.apply` | Apply code | कोड लगाएँ | ಕೋಡ್ ಅನ್ವಯಿಸಿ | ☐ |
| `ref.codeOptional` | Referral code (optional) | रेफ़रल कोड (वैकल्पिक) | ರೆಫರಲ್ ಕೋಡ್ (ಐಚ್ಛಿಕ) | ☐ |
| `ref.copyLink` | Copy link | लिंक कॉपी करें | ಲಿಂಕ್ ನಕಲಿಸಿ | ☐ |
| `ref.enter` | Enter code | कोड दर्ज करें | ಕೋಡ್ ನಮೂದಿಸಿ | ☐ |
| `ref.friends` | Your referrals | आपके रेफ़रल | ನಿಮ್ಮ ರೆಫರಲ್‌ಗಳು | ☐ |
| `ref.haveCode` | Have a friend's code? | किसी दोस्त का कोड है? | ಸ್ನೇಹಿತರ ಕೋಡ್ ಇದೆಯೇ? | ☐ |
| `ref.how` | Friends who sign up with your code and collect their first order each earn {amount}, and so do you. Up to {cap} rewarded referrals a month. | जो दोस्त आपके कोड से जुड़कर अपना पहला ऑर्डर लेते हैं, उन्हें {amount} मिलते हैं, और आपको भी। हर महीने अधिकतम {cap} रेफ़रल पर इनाम। | ನಿಮ್ಮ ಕೋಡ್‌ನೊಂದಿಗೆ ಸೇರಿ ಮೊದಲ ಆರ್ಡರ್ ಪಡೆದ ಸ್ನೇಹಿತರಿಗೆ {amount} ಸಿಗುತ್ತದೆ, ನಿಮಗೂ ಸಿಗುತ್ತದೆ. ತಿಂಗಳಿಗೆ ಗರಿಷ್ಠ {cap} ರೆಫರಲ್‌ಗಳಿಗೆ ಬಹುಮಾನ. | ☐ |
| `ref.ledger` | Credit history | क्रेडिट इतिहास | ಕ್ರೆಡಿಟ್ ಇತಿಹಾಸ | ☐ |
| `ref.ledger.earned` | Earned | कमाया | ಗಳಿಸಿದ್ದು | ☐ |
| `ref.ledger.expired` | Expired | समाप्त | ಅವಧಿ ಮುಗಿದದ್ದು | ☐ |
| `ref.ledger.spent` | Used | इस्तेमाल किया | ಬಳಸಿದ್ದು | ☐ |
| `ref.none` | No referrals yet. Share your link to get started. | अभी कोई रेफ़रल नहीं। शुरू करने के लिए अपना लिंक साझा करें। | ಇನ್ನೂ ರೆಫರಲ್‌ಗಳಿಲ್ಲ. ಪ್ರಾರಂಭಿಸಲು ನಿಮ್ಮ ಲಿಂಕ್ ಹಂಚಿಕೊಳ್ಳಿ. | ☐ |
| `ref.referredBy` | You joined with a friend's code. | आप किसी दोस्त के कोड से जुड़े हैं। | ನೀವು ಸ್ನೇಹಿತರ ಕೋಡ್‌ನೊಂದಿಗೆ ಸೇರಿದ್ದೀರಿ. | ☐ |
| `ref.share` | Share this link | यह लिंक साझा करें | ಈ ಲಿಂಕ್ ಹಂಚಿಕೊಳ್ಳಿ | ☐ |
| `ref.status.pending` | Waiting for their first pickup | उनके पहले पिकअप का इंतज़ार | ಅವರ ಮೊದಲ ಪಿಕಪ್‌ಗಾಗಿ ಕಾಯಲಾಗುತ್ತಿದೆ | ☐ |
| `ref.status.rejected` | Not eligible | पात्र नहीं | ಅರ್ಹವಲ್ಲ | ☐ |
| `ref.status.rewarded` | Rewarded | इनाम मिल गया | ಬಹುಮಾನ ನೀಡಲಾಗಿದೆ | ☐ |
| `ref.thisMonth` | {n} of {cap} rewarded this month | इस महीने {cap} में से {n} पर इनाम | ಈ ತಿಂಗಳು {cap} ರಲ್ಲಿ {n} ಕ್ಕೆ ಬಹುಮಾನ | ☐ |
| `ref.yourCode` | Your referral code | आपका रेफ़रल कोड | ನಿಮ್ಮ ರೆಫರಲ್ ಕೋಡ್ | ☐ |

## report

| Key | English | हिन्दी | ಕನ್ನಡ | OK? |
|---|---|---|---|---|
| `report.button` | Report a problem | समस्या बताएँ | ಸಮಸ್ಯೆ ವರದಿ ಮಾಡಿ | ☐ |
| `report.details` | What happened? (optional) | क्या हुआ? (वैकल्पिक) | ಏನಾಯಿತು? (ಐಚ್ಛಿಕ) | ☐ |
| `report.photo` | Add a photo (optional, JPG/PNG/WebP, under 3 MB) | फ़ोटो जोड़ें (वैकल्पिक, JPG/PNG/WebP, 3 MB से कम) | ಫೋಟೋ ಸೇರಿಸಿ (ಐಚ್ಛಿಕ, JPG/PNG/WebP, 3 MB ಗಿಂತ ಕಡಿಮೆ) | ☐ |
| `report.reason` | Reason | कारण | ಕಾರಣ | ☐ |
| `report.reason.food_safety` | Food safety | खाने की सुरक्षा | ಆಹಾರ ಸುರಕ್ಷತೆ | ☐ |
| `report.reason.other` | Other | अन्य | ಇತರೆ | ☐ |
| `report.reason.rude_behaviour` | Rude behaviour | बदतमीज़ी | ಅಸಭ್ಯ ವರ್ತನೆ | ☐ |
| `report.reason.wrong_item` | Wrong item | गलत सामान | ತಪ್ಪು ವಸ್ತು | ☐ |
| `report.sent` | Report sent. Our team will review it. | रिपोर्ट भेज दी गई। हमारी टीम इसे देखेगी। | ವರದಿ ಕಳುಹಿಸಲಾಗಿದೆ. ನಮ್ಮ ತಂಡ ಪರಿಶೀಲಿಸುತ್ತದೆ. | ☐ |
| `report.submit` | Send report | रिपोर्ट भेजें | ವರದಿ ಕಳುಹಿಸಿ | ☐ |
| `report.title` | Report a problem | समस्या बताएँ | ಸಮಸ್ಯೆ ವರದಿ ಮಾಡಿ | ☐ |

## rerr

| Key | English | हिन्दी | ಕನ್ನಡ | OK? |
|---|---|---|---|---|
| `rerr.account_suspended` | Your account is suspended. | आपका खाता निलंबित है। | ನಿಮ್ಮ ಖಾತೆಯನ್ನು ಅಮಾನತು ಮಾಡಲಾಗಿದೆ. | ☐ |
| `rerr.action_invalid` | Unknown action. | यह कार्रवाई पहचानी नहीं गई। | ಈ ಕ್ರಿಯೆ ಗುರುತಿಸಲಾಗಲಿಲ್ಲ. | ☐ |
| `rerr.active_cap` | You can have at most {max} active reservations. | आपके अधिकतम {max} सक्रिय आरक्षण हो सकते हैं। | ನೀವು ಗರಿಷ್ಠ {max} ಸಕ್ರಿಯ ಕಾಯ್ದಿರಿಸುವಿಕೆಗಳನ್ನು ಹೊಂದಬಹುದು. | ☐ |
| `rerr.already_approved` | Already approved. | पहले ही स्वीकृत हो चुका है। | ಈಗಾಗಲೇ ಅನುಮೋದನೆಯಾಗಿದೆ. | ☐ |
| `rerr.already_logged` | A distribution log was already filed for this donation. | इस दान के लिए वितरण का रिकॉर्ड पहले ही दर्ज हो चुका है। | ಈ ದಾನಕ್ಕೆ ವಿತರಣೆಯ ದಾಖಲೆ ಈಗಾಗಲೇ ಸಲ್ಲಿಸಲಾಗಿದೆ. | ☐ |
| `rerr.already_member` | This account already belongs to a vendor organization. | यह खाता पहले से ही किसी विक्रेता संगठन का हिस्सा है। | ಈ ಖಾತೆ ಈಗಾಗಲೇ ಒಂದು ವ್ಯಾಪಾರಿ ಸಂಸ್ಥೆಯ ಭಾಗವಾಗಿದೆ. | ☐ |
| `rerr.already_referred` | You've already used a referral code. | आप पहले ही एक रेफ़रल कोड इस्तेमाल कर चुके हैं। | ನೀವು ಈಗಾಗಲೇ ಒಂದು ರೆಫರಲ್ ಕೋಡ್ ಬಳಸಿದ್ದೀರಿ. | ☐ |
| `rerr.already_reported` | You've already reported this; we're looking into it. | आप यह पहले ही रिपोर्ट कर चुके हैं; हम इसे देख रहे हैं। | ನೀವು ಇದನ್ನು ಈಗಾಗಲೇ ವರದಿ ಮಾಡಿದ್ದೀರಿ; ನಾವು ಪರಿಶೀಲಿಸುತ್ತಿದ್ದೇವೆ. | ☐ |
| `rerr.already_resolved` | This report was already {status}. | यह रिपोर्ट पहले ही {status} हो चुकी है। | ಈ ವರದಿ ಈಗಾಗಲೇ {status} ಆಗಿದೆ. | ☐ |
| `rerr.already_reviewed` | You've already rated this order. | आप इस ऑर्डर को पहले ही रेटिंग दे चुके हैं। | ನೀವು ಈ ಆರ್ಡರ್‌ಗೆ ಈಗಾಗಲೇ ರೇಟಿಂಗ್ ನೀಡಿದ್ದೀರಿ. | ☐ |
| `rerr.approval_required` | Your NGO verification is {status}. Only approved NGOs can claim. | आपका NGO सत्यापन {status} है। केवल स्वीकृत NGO ही क्लेम कर सकते हैं। | ನಿಮ್ಮ NGO ಪರಿಶೀಲನೆ {status} ಆಗಿದೆ. ಅನುಮೋದಿತ NGO ಗಳು ಮಾತ್ರ ಕ್ಲೈಮ್ ಮಾಡಬಹುದು. | ☐ |
| `rerr.approval_required_vendor` | Your vendor application is {status}. Only approved vendors can do this. | आपका विक्रेता आवेदन {status} है। यह केवल स्वीकृत विक्रेता कर सकते हैं। | ನಿಮ್ಮ ಮಾರಾಟಗಾರ ಅರ್ಜಿ {status} ಆಗಿದೆ. ಅನುಮೋದಿತ ಮಾರಾಟಗಾರರು ಮಾತ್ರ ಇದನ್ನು ಮಾಡಬಹುದು. | ☐ |
| `rerr.bad_event` | Missing delivery id. | डिलीवरी आईडी नहीं मिली। | ಡೆಲಿವರಿ ಐಡಿ ಇಲ್ಲ. | ☐ |
| `rerr.bad_event_unknown_delivery_status` | Unknown delivery status. | डिलीवरी की स्थिति पहचानी नहीं गई। | ಡೆಲಿವರಿ ಸ್ಥಿತಿ ಗುರುತಿಸಲಾಗಲಿಲ್ಲ. | ☐ |
| `rerr.bad_json` | Invalid request body. | अनुरोध का रूप सही नहीं है। | ವಿನಂತಿಯ ರೂಪ ಸರಿಯಾಗಿಲ್ಲ. | ☐ |
| `rerr.bad_signature` | Payment signature could not be verified. | भुगतान के हस्ताक्षर की जाँच नहीं हो सकी। | ಪಾವತಿಯ ಸಹಿಯನ್ನು ಪರಿಶೀಲಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. | ☐ |
| `rerr.bad_transition` | This delivery is already finished. | यह डिलीवरी पहले ही पूरी हो चुकी है। | ಈ ಡೆಲಿವರಿ ಈಗಾಗಲೇ ಮುಗಿದಿದೆ. | ☐ |
| `rerr.bad_transition_batch_schedule` | Batch is {status}; only claimed batches can be scheduled. | बैच {status} है; केवल क्लेम किए गए बैच का समय तय किया जा सकता है। | ಬ್ಯಾಚ್ {status} ಆಗಿದೆ; ಕ್ಲೈಮ್ ಮಾಡಿದ ಬ್ಯಾಚ್‌ಗಳಿಗೆ ಮಾತ್ರ ಸಮಯ ನಿಗದಿ ಮಾಡಬಹುದು. | ☐ |
| `rerr.bad_transition_batch_status` | Batch is {status}. | बैच {status} है। | ಬ್ಯಾಚ್ {status} ಆಗಿದೆ. | ☐ |
| `rerr.bad_transition_cancel_listing` | A {status} listing cannot be cancelled. | {status} लिस्टिंग को रद्द नहीं किया जा सकता। | {status} ಲಿಸ್ಟಿಂಗ್ ಅನ್ನು ರದ್ದು ಮಾಡಲು ಸಾಧ್ಯವಿಲ್ಲ. | ☐ |
| `rerr.bad_transition_donation_delivery` | This donation is {status}; delivery can be requested while it is claimed. | यह दान {status} है; डिलीवरी तभी माँगी जा सकती है जब यह क्लेम किया हुआ हो। | ಈ ದಾನ {status} ಆಗಿದೆ; ಕ್ಲೈಮ್ ಆಗಿರುವಾಗ ಮಾತ್ರ ಡೆಲಿವರಿ ವಿನಂತಿಸಬಹುದು. | ☐ |
| `rerr.bad_transition_listing_not_paused` | Listing is not paused. | लिस्टिंग रुकी हुई नहीं है। | ಲಿಸ್ಟಿಂಗ್ ತಾತ್ಕಾಲಿಕವಾಗಿ ನಿಲ್ಲಿಸಿಲ್ಲ. | ☐ |
| `rerr.bad_transition_mark_ready` | Order is {status}; only Reserved orders can be marked Ready. | ऑर्डर {status} है; केवल आरक्षित ऑर्डर को तैयार चिह्नित किया जा सकता है। | ಆರ್ಡರ್ {status} ಆಗಿದೆ; ಕಾಯ್ದಿರಿಸಿದ ಆರ್ಡರ್‌ಗಳನ್ನು ಮಾತ್ರ ಸಿದ್ಧ ಎಂದು ಗುರುತಿಸಬಹುದು. | ☐ |
| `rerr.bad_transition_order_cancel` | This order is {status} and can't be cancelled. | यह ऑर्डर {status} है और रद्द नहीं किया जा सकता। | ಈ ಆರ್ಡರ್ {status} ಆಗಿದೆ ಮತ್ತು ರದ್ದು ಮಾಡಲು ಸಾಧ್ಯವಿಲ್ಲ. | ☐ |
| `rerr.bad_transition_order_no_longer` | This order is no longer waiting for pickup. | यह ऑर्डर अब पिकअप के इंतज़ार में नहीं है। | ಈ ಆರ್ಡರ್ ಇನ್ನು ಪಿಕಪ್‌ಗಾಗಿ ಕಾಯುತ್ತಿಲ್ಲ. | ☐ |
| `rerr.bad_transition_pause` | Cannot pause a {status} listing. | {status} लिस्टिंग को रोका नहीं जा सकता। | {status} ಲಿಸ್ಟಿಂಗ್ ಅನ್ನು ನಿಲ್ಲಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ. | ☐ |
| `rerr.bad_transition_rider_already_has` | The rider already has the food; it can't be cancelled now. | राइडर के पास खाना पहुँच चुका है; अब इसे रद्द नहीं किया जा सकता। | ರೈಡರ್ ಬಳಿ ಆಹಾರ ಈಗಾಗಲೇ ಇದೆ; ಈಗ ರದ್ದು ಮಾಡಲು ಸಾಧ್ಯವಿಲ್ಲ. | ☐ |
| `rerr.cap_invalid` | Choose a whole number from {min} to 50. | {min} से 50 के बीच की पूरी संख्या चुनें। | {min} ರಿಂದ 50 ನಡುವಿನ ಪೂರ್ಣ ಸಂಖ್ಯೆಯನ್ನು ಆರಿಸಿ. | ☐ |
| `rerr.capacity_required` | Enter collection capacity. | संग्रह की क्षमता लिखें। | ಸಂಗ್ರಹ ಸಾಮರ್ಥ್ಯವನ್ನು ನಮೂದಿಸಿ. | ☐ |
| `rerr.category_invalid` | Choose a category. | एक श्रेणी चुनें। | ಒಂದು ವರ್ಗವನ್ನು ಆರಿಸಿ. | ☐ |
| `rerr.centre_invalid` | Enter the name of the centre or place where food was served. | उस केंद्र या जगह का नाम लिखें जहाँ खाना परोसा गया। | ಆಹಾರ ಬಡಿಸಿದ ಕೇಂದ್ರ ಅಥವಾ ಸ್ಥಳದ ಹೆಸರನ್ನು ನಮೂದಿಸಿ. | ☐ |
| `rerr.code_exhausted` | Could not allocate a pickup code. Try again. | पिकअप कोड नहीं बन सका। फिर से कोशिश करें। | ಪಿಕಪ್ ಕೋಡ್ ಸಿಗಲಿಲ್ಲ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ. | ☐ |
| `rerr.code_format` | Enter the 4-digit code. | 4 अंकों का कोड लिखें। | 4 ಅಂಕಿಗಳ ಕೋಡ್ ನಮೂದಿಸಿ. | ☐ |
| `rerr.code_invalid` | Enter the referral code your friend shared. | आपके दोस्त का दिया रेफ़रल कोड लिखें। | ನಿಮ್ಮ ಸ್ನೇಹಿತ ಹಂಚಿಕೊಂಡ ರೆಫರಲ್ ಕೋಡ್ ನಮೂದಿಸಿ. | ☐ |
| `rerr.code_mismatch` | Collection code does not match this batch. | संग्रह कोड इस बैच से मेल नहीं खाता। | ಸಂಗ್ರಹ ಕೋಡ್ ಈ ಬ್ಯಾಚ್‌ಗೆ ಹೊಂದುತ್ತಿಲ್ಲ. | ☐ |
| `rerr.code_not_found` | No order with this code at your outlet. | आपके आउटलेट पर इस कोड वाला कोई ऑर्डर नहीं है। | ನಿಮ್ಮ ಔಟ್‌ಲೆಟ್‌ನಲ್ಲಿ ಈ ಕೋಡ್‌ನ ಯಾವುದೇ ಆರ್ಡರ್ ಇಲ್ಲ. | ☐ |
| `rerr.code_required` | Scan the QR or enter the 4-digit code. | QR स्कैन करें या 4 अंकों का कोड लिखें। | QR ಸ್ಕ್ಯಾನ್ ಮಾಡಿ ಅಥವಾ 4 ಅಂಕಿಗಳ ಕೋಡ್ ನಮೂದಿಸಿ. | ☐ |
| `rerr.code_unknown` | That referral code doesn't exist. Check it and try again. | यह रेफ़रल कोड मौजूद नहीं है। जाँचकर फिर कोशिश करें। | ಈ ರೆಫರಲ್ ಕೋಡ್ ಅಸ್ತಿತ್ವದಲ್ಲಿಲ್ಲ. ಪರಿಶೀಲಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ. | ☐ |
| `rerr.code_unknown_referral_code_doesn` | That referral code doesn't exist. | यह रेफ़रल कोड मौजूद नहीं है। | ಈ ರೆಫರಲ್ ಕೋಡ್ ಅಸ್ತಿತ್ವದಲ್ಲಿಲ್ಲ. | ☐ |
| `rerr.code_used` | {ref} was already collected; codes work once. | {ref} पहले ही ले लिया गया है; कोड केवल एक बार काम करता है। | {ref} ಈಗಾಗಲೇ ತೆಗೆದುಕೊಳ್ಳಲಾಗಿದೆ; ಕೋಡ್ ಒಮ್ಮೆ ಮಾತ್ರ ಕೆಲಸ ಮಾಡುತ್ತದೆ. | ☐ |
| `rerr.contact_invalid` | Enter a 10-digit mobile number or an email address. | 10 अंकों का मोबाइल नंबर या ईमेल पता लिखें। | 10 ಅಂಕಿಗಳ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಅಥವಾ ಇಮೇಲ್ ವಿಳಾಸ ನಮೂದಿಸಿ. | ☐ |
| `rerr.credit_insufficient` | Not enough credit. | क्रेडिट पर्याप्त नहीं है। | ಕ್ರೆಡಿಟ್ ಸಾಕಾಗುತ್ತಿಲ್ಲ. | ☐ |
| `rerr.date_invalid` | Choose a valid start date. | सही शुरुआत की तारीख चुनें। | ಸರಿಯಾದ ಆರಂಭ ದಿನಾಂಕವನ್ನು ಆರಿಸಿ. | ☐ |
| `rerr.date_invalid_choose_valid_end` | Choose a valid end date. | सही अंतिम तारीख चुनें। | ಸರಿಯಾದ ಕೊನೆಯ ದಿನಾಂಕವನ್ನು ಆರಿಸಿ. | ☐ |
| `rerr.days_invalid` | Choose between 1 and 365 days. | 1 से 365 दिन के बीच चुनें। | 1 ರಿಂದ 365 ದಿನಗಳ ನಡುವೆ ಆರಿಸಿ. | ☐ |
| `rerr.declaration_required` | Confirm the food-safety declaration to publish. | प्रकाशित करने के लिए खाद्य सुरक्षा घोषणा की पुष्टि करें। | ಪ್ರಕಟಿಸಲು ಆಹಾರ ಸುರಕ್ಷತಾ ಘೋಷಣೆಯನ್ನು ದೃಢೀಕರಿಸಿ. | ☐ |
| `rerr.declaration_required_re_confirm_food` | Re-confirm the food-safety declaration to save changes. | बदलाव सहेजने के लिए खाद्य सुरक्षा घोषणा की फिर से पुष्टि करें। | ಬದಲಾವಣೆಗಳನ್ನು ಉಳಿಸಲು ಆಹಾರ ಸುರಕ್ಷತಾ ಘೋಷಣೆಯನ್ನು ಮತ್ತೆ ದೃಢೀಕರಿಸಿ. | ☐ |
| `rerr.delivery_active` | A delivery is already in progress for this donation. | इस दान की डिलीवरी पहले से चल रही है। | ಈ ದಾನಕ್ಕೆ ಡೆಲಿವರಿ ಈಗಾಗಲೇ ಪ್ರಗತಿಯಲ್ಲಿದೆ. | ☐ |
| `rerr.device_required` | Device id required. | डिवाइस आईडी ज़रूरी है। | ಸಾಧನ ಐಡಿ ಅಗತ್ಯ. | ☐ |
| `rerr.device_used` | This device has already redeemed a referral. | इस डिवाइस से रेफ़रल पहले ही इस्तेमाल हो चुका है। | ಈ ಸಾಧನದಿಂದ ರೆಫರಲ್ ಈಗಾಗಲೇ ಬಳಕೆಯಾಗಿದೆ. | ☐ |
| `rerr.diet_required` | Choose Vegetarian or Non-vegetarian. | शाकाहारी या मांसाहारी चुनें। | ಸಸ್ಯಾಹಾರಿ ಅಥವಾ ಮಾಂಸಾಹಾರಿ ಆರಿಸಿ. | ☐ |
| `rerr.discount_too_large` | The platform caps discounts at {pct}% off (minimum ₹{min} for ₹{original}). | प्लेटफ़ॉर्म छूट को {pct}% तक सीमित रखता है (₹{original} के लिए कम से कम ₹{min})। | ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ರಿಯಾಯಿತಿಯನ್ನು {pct}% ಗೆ ಮಿತಿಗೊಳಿಸುತ್ತದೆ (₹{original} ಗೆ ಕನಿಷ್ಠ ₹{min}). | ☐ |
| `rerr.discount_too_small` | Rescue price must be at least 30% below the original (max ₹{max} for ₹{original}). | बचाव की कीमत मूल कीमत से कम से कम 30% कम होनी चाहिए (₹{original} के लिए अधिकतम ₹{max})। | ರಕ್ಷಣಾ ಬೆಲೆ ಮೂಲ ಬೆಲೆಗಿಂತ ಕನಿಷ್ಠ 30% ಕಡಿಮೆ ಇರಬೇಕು (₹{original} ಗೆ ಗರಿಷ್ಠ ₹{max}). | ☐ |
| `rerr.docs_required` | Upload your registration document. | अपना पंजीकरण दस्तावेज़ अपलोड करें। | ನಿಮ್ಮ ನೋಂದಣಿ ದಾಖಲೆಯನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ. | ☐ |
| `rerr.edit_empty` | Give the replacement text. | बदलने के लिए नया पाठ लिखें। | ಬದಲಿಸಲು ಹೊಸ ಪಠ್ಯವನ್ನು ನೀಡಿ. | ☐ |
| `rerr.edit_unsupported` | A business profile can't be edited from here; warn or suspend instead. | व्यवसाय की प्रोफ़ाइल यहाँ से नहीं बदली जा सकती; इसके बजाय चेतावनी दें या खाता निलंबित करें। | ವ್ಯಾಪಾರ ಪ್ರೊಫೈಲ್ ಅನ್ನು ಇಲ್ಲಿಂದ ಬದಲಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ; ಬದಲಿಗೆ ಎಚ್ಚರಿಕೆ ನೀಡಿ ಅಥವಾ ಅಮಾನತು ಮಾಡಿ. | ☐ |
| `rerr.eightyg_incomplete` | Enter both the 80G number and the date it is valid until, or leave both empty. | 80G नंबर और उसकी वैधता की तारीख दोनों लिखें, या दोनों खाली छोड़ दें। | 80G ಸಂಖ್ಯೆ ಮತ್ತು ಅದು ಮಾನ್ಯವಾಗಿರುವ ದಿನಾಂಕ ಎರಡನ್ನೂ ನಮೂದಿಸಿ, ಅಥವಾ ಎರಡನ್ನೂ ಖಾಲಿ ಬಿಡಿ. | ☐ |
| `rerr.eightyg_invalid` | Enter a valid 80G number and a valid-until date. | सही 80G नंबर और सही वैधता की तारीख लिखें। | ಸರಿಯಾದ 80G ಸಂಖ್ಯೆ ಮತ್ತು ಸರಿಯಾದ ಮಾನ್ಯತೆಯ ದಿನಾಂಕ ನಮೂದಿಸಿ. | ☐ |
| `rerr.eta_invalid` | Choose between 0 and {max} minutes. | 0 से {max} मिनट के बीच चुनें। | 0 ರಿಂದ {max} ನಿಮಿಷಗಳ ನಡುವೆ ಆರಿಸಿ. | ☐ |
| `rerr.expired` | The collection deadline has passed. | संग्रह की समय-सीमा निकल चुकी है। | ಸಂಗ್ರಹದ ಕೊನೆಯ ಸಮಯ ಮುಗಿದಿದೆ. | ☐ |
| `rerr.expired_collection_deadline_has` | Collection deadline has passed. | संग्रह की समय-सीमा निकल चुकी है। | ಸಂಗ್ರಹದ ಕೊನೆಯ ಸಮಯ ಮುಗಿದಿದೆ. | ☐ |
| `rerr.f.address` | Address | पता | ವಿಳಾಸ | ☐ |
| `rerr.f.businessName` | Business name | व्यवसाय का नाम | ವ್ಯಾಪಾರದ ಹೆಸರು | ☐ |
| `rerr.f.contactName` | Contact name | संपर्क व्यक्ति का नाम | ಸಂಪರ್ಕ ವ್ಯಕ್ತಿಯ ಹೆಸರು | ☐ |
| `rerr.f.contactPerson` | Contact person | संपर्क व्यक्ति | ಸಂಪರ್ಕ ವ್ಯಕ್ತಿ | ☐ |
| `rerr.f.fssaiNumber` | FSSAI number | FSSAI नंबर | FSSAI ಸಂಖ್ಯೆ | ☐ |
| `rerr.f.handlingArrangements` | Food handling arrangements | खाना संभालने की व्यवस्था | ಆಹಾರ ನಿರ್ವಹಣೆಯ ವ್ಯವಸ್ಥೆ | ☐ |
| `rerr.f.hours` | Hours | समय | ಸಮಯ | ☐ |
| `rerr.f.name` | Name | नाम | ಹೆಸರು | ☐ |
| `rerr.f.neighbourhood` | Neighbourhood | इलाका | ಪ್ರದೇಶ | ☐ |
| `rerr.f.operatingHours` | Operating hours | काम के घंटे | ಕಾರ್ಯನಿರ್ವಹಣೆಯ ಸಮಯ | ☐ |
| `rerr.f.orgName` | Organisation name | संस्था का नाम | ಸಂಸ್ಥೆಯ ಹೆಸರು | ☐ |
| `rerr.f.payoutUpi` | Payout UPI | भुगतान के लिए UPI | ಪಾವತಿಗಾಗಿ UPI | ☐ |
| `rerr.f.phone` | Phone | फ़ोन | ಫೋನ್ | ☐ |
| `rerr.feature_off` | Referrals are switched off. | रेफ़रल अभी बंद हैं। | ರೆಫರಲ್‌ಗಳನ್ನು ಸದ್ಯ ಆಫ್ ಮಾಡಲಾಗಿದೆ. | ☐ |
| `rerr.feature_off_auto_markdown_switched` | Auto-markdown is switched off by the platform. | ऑटो-मार्कडाउन को प्लेटफ़ॉर्म ने बंद किया हुआ है। | ಆಟೋ-ಮಾರ್ಕ್‌ಡೌನ್ ಅನ್ನು ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಆಫ್ ಮಾಡಿದೆ. | ☐ |
| `rerr.feature_off_charity_priority_window` | The charity priority window is switched off. | संस्थाओं के लिए प्राथमिकता वाली अवधि अभी बंद है। | ದಾನ ಸಂಸ್ಥೆಗಳ ಆದ್ಯತಾ ಅವಧಿಯನ್ನು ಸದ್ಯ ಆಫ್ ಮಾಡಲಾಗಿದೆ. | ☐ |
| `rerr.feature_off_delivery_hand_off` | Delivery hand-off is switched off. | डिलीवरी हैंड-ऑफ़ अभी बंद है। | ಡೆಲಿವರಿ ಹಸ್ತಾಂತರವನ್ನು ಸದ್ಯ ಆಫ್ ಮಾಡಲಾಗಿದೆ. | ☐ |
| `rerr.feature_off_distribution_logs_are` | Distribution logs are switched off. | वितरण लॉग अभी बंद हैं। | ವಿತರಣಾ ಲಾಗ್‌ಗಳನ್ನು ಸದ್ಯ ಆಫ್ ಮಾಡಲಾಗಿದೆ. | ☐ |
| `rerr.feature_off_donation_receipts_are` | Donation receipts are switched off. | दान की रसीदें अभी बंद हैं। | ದಾನದ ರಸೀದಿಗಳನ್ನು ಸದ್ಯ ಆಫ್ ಮಾಡಲಾಗಿದೆ. | ☐ |
| `rerr.feature_off_impact_certificates_are` | Impact certificates are switched off. | इम्पैक्ट सर्टिफ़िकेट अभी बंद हैं। | ಪರಿಣಾಮ ಪ್ರಮಾಣಪತ್ರಗಳನ್ನು ಸದ್ಯ ಆಫ್ ಮಾಡಲಾಗಿದೆ. | ☐ |
| `rerr.feature_off_live_eta_switched` | Live ETA is switched off. | लाइव ETA अभी बंद है। | ಲೈವ್ ETA ಅನ್ನು ಸದ್ಯ ಆಫ್ ಮಾಡಲಾಗಿದೆ. | ☐ |
| `rerr.feature_off_moderation_switched_off` | Moderation is switched off. | मॉडरेशन अभी बंद है। | ಮಾಡರೇಶನ್ ಅನ್ನು ಸದ್ಯ ಆಫ್ ಮಾಡಲಾಗಿದೆ. | ☐ |
| `rerr.feature_off_multiple_outlets_staff` | Multiple outlets and staff accounts are switched off. | एक से ज़्यादा आउटलेट और स्टाफ़ खाते अभी बंद हैं। | ಹಲವು ಔಟ್‌ಲೆಟ್‌ಗಳು ಮತ್ತು ಸಿಬ್ಬಂದಿ ಖಾತೆಗಳನ್ನು ಸದ್ಯ ಆಫ್ ಮಾಡಲಾಗಿದೆ. | ☐ |
| `rerr.feature_off_platform_settings_screen` | The platform settings screen is switched off. | प्लेटफ़ॉर्म सेटिंग्स की स्क्रीन अभी बंद है। | ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಸೆಟ್ಟಿಂಗ್ಸ್ ಪರದೆಯನ್ನು ಸದ್ಯ ಆಫ್ ಮಾಡಲಾಗಿದೆ. | ☐ |
| `rerr.field_long` | {label} is too long (max {max}). | {label} बहुत लंबा है (अधिकतम {max})। | {label} ತುಂಬಾ ಉದ್ದವಾಗಿದೆ (ಗರಿಷ್ಠ {max}). | ☐ |
| `rerr.field_required` | {label} is required. | {label} ज़रूरी है। | {label} ಅಗತ್ಯ. | ☐ |
| `rerr.file_required` | Choose a file. | एक फ़ाइल चुनें। | ಒಂದು ಫೈಲ್ ಆರಿಸಿ. | ☐ |
| `rerr.file_too_large` | Files must be under 3 MB. | फ़ाइलें 3 MB से छोटी होनी चाहिए। | ಫೈಲ್‌ಗಳು 3 MB ಗಿಂತ ಚಿಕ್ಕದಾಗಿರಬೇಕು. | ☐ |
| `rerr.file_type` | Upload a JPG, PNG, WebP or PDF file. | JPG, PNG, WebP या PDF फ़ाइल अपलोड करें। | JPG, PNG, WebP ಅಥವಾ PDF ಫೈಲ್ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ. | ☐ |
| `rerr.forbidden` | Admins only. | केवल एडमिन के लिए। | ನಿರ್ವಾಹಕರಿಗೆ ಮಾತ್ರ. | ☐ |
| `rerr.forbidden_account_cannot_do` | Your account cannot do this. | आपका खाता यह नहीं कर सकता। | ನಿಮ್ಮ ಖಾತೆಯಿಂದ ಇದನ್ನು ಮಾಡಲು ಸಾಧ್ಯವಿಲ್ಲ. | ☐ |
| `rerr.forbidden_admin_access_provisioned` | Admin access is provisioned, not self-selected. | एडमिन पहुँच अलग से दी जाती है, खुद नहीं चुनी जा सकती। | ನಿರ್ವಾಹಕ ಪ್ರವೇಶವನ್ನು ಪ್ರತ್ಯೇಕವಾಗಿ ನೀಡಲಾಗುತ್ತದೆ; ನೀವೇ ಆರಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ. | ☐ |
| `rerr.forbidden_customers_only` | Customers only. | केवल ग्राहकों के लिए। | ಗ್ರಾಹಕರಿಗೆ ಮಾತ್ರ. | ☐ |
| `rerr.forbidden_demo_controls_are` | Demo controls are disabled. | डेमो कंट्रोल बंद हैं। | ಡೆಮೊ ನಿಯಂತ್ರಣಗಳು ಆಫ್ ಆಗಿವೆ. | ☐ |
| `rerr.forbidden_demo_sign_disabled` | Demo sign-in is disabled. | डेमो साइन-इन बंद है। | ಡೆಮೊ ಸೈನ್-ಇನ್ ಆಫ್ ಆಗಿದೆ. | ☐ |
| `rerr.forbidden_not_checkout` | Not your checkout. | यह आपका चेकआउट नहीं है। | ಇದು ನಿಮ್ಮ ಚೆಕ್‌ಔಟ್ ಅಲ್ಲ. | ☐ |
| `rerr.forbidden_not_listing` | Not your listing. | यह आपकी लिस्टिंग नहीं है। | ಇದು ನಿಮ್ಮ ಲಿಸ್ಟಿಂಗ್ ಅಲ್ಲ. | ☐ |
| `rerr.forbidden_only_available_demo` | Only available in demo mode. | यह केवल डेमो मोड में उपलब्ध है। | ಇದು ಡೆಮೊ ಮೋಡ್‌ನಲ್ಲಿ ಮಾತ್ರ ಲಭ್ಯ. | ☐ |
| `rerr.forbidden_only_demo_admin` | Only the demo admin can reset data. | केवल डेमो एडमिन डेटा रीसेट कर सकता है। | ಡೆಮೊ ನಿರ್ವಾಹಕರು ಮಾತ್ರ ಡೇಟಾ ಮರುಹೊಂದಿಸಬಹುದು. | ☐ |
| `rerr.forbidden_role` | Receipts are visible to the owner and managers. | रसीदें केवल मालिक और मैनेजर देख सकते हैं। | ರಸೀದಿಗಳನ್ನು ಮಾಲೀಕರು ಮತ್ತು ಮ್ಯಾನೇಜರ್‌ಗಳು ಮಾತ್ರ ನೋಡಬಹುದು. | ☐ |
| `rerr.forbidden_role_ask_manager` | Your {role} role can't do this. Ask the owner or a manager. | आपकी {role} भूमिका यह नहीं कर सकती। मालिक या मैनेजर से कहें। | ನಿಮ್ಮ {role} ಪಾತ್ರದಿಂದ ಇದನ್ನು ಮಾಡಲು ಸಾಧ್ಯವಿಲ್ಲ. ಮಾಲೀಕರನ್ನು ಅಥವಾ ಮ್ಯಾನೇಜರ್ ಅವರನ್ನು ಕೇಳಿ. | ☐ |
| `rerr.forbidden_role_ask_owner` | Your {role} role can't do this. Ask the owner. | आपकी {role} भूमिका यह नहीं कर सकती। मालिक से कहें। | ನಿಮ್ಮ {role} ಪಾತ್ರದಿಂದ ಇದನ್ನು ಮಾಡಲು ಸಾಧ್ಯವಿಲ್ಲ. ಮಾಲೀಕರನ್ನು ಕೇಳಿ. | ☐ |
| `rerr.forbidden_role_managers_only_remove` | Managers can only remove staff. | मैनेजर केवल स्टाफ़ को हटा सकते हैं। | ಮ್ಯಾನೇಜರ್‌ಗಳು ಸಿಬ್ಬಂದಿಯನ್ನು ಮಾತ್ರ ತೆಗೆದುಹಾಕಬಹುದು. | ☐ |
| `rerr.forbidden_role_only_owner_invite` | Only the owner can invite a manager. | मैनेजर को केवल मालिक ही आमंत्रित कर सकता है। | ಮ್ಯಾನೇಜರ್ ಅವರನ್ನು ಮಾಲೀಕರು ಮಾತ್ರ ಆಹ್ವಾನಿಸಬಹುದು. | ☐ |
| `rerr.forbidden_role_owner_s_role` | The owner's role can't be changed. | मालिक की भूमिका बदली नहीं जा सकती। | ಮಾಲೀಕರ ಪಾತ್ರವನ್ನು ಬದಲಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ. | ☐ |
| `rerr.forbidden_role_owner_t_removed` | The owner can't be removed. | मालिक को हटाया नहीं जा सकता। | ಮಾಲೀಕರನ್ನು ತೆಗೆದುಹಾಕಲು ಸಾಧ್ಯವಿಲ್ಲ. | ☐ |
| `rerr.forbidden_skip_only_available` | Skip is only available in demo mode. | स्किप केवल डेमो मोड में उपलब्ध है। | ಸ್ಕಿಪ್ ಡೆಮೊ ಮೋಡ್‌ನಲ್ಲಿ ಮಾತ್ರ ಲಭ್ಯ. | ☐ |
| `rerr.hidden_by_admin` | This listing was hidden by an administrator and can't be resumed. | इस लिस्टिंग को एडमिन ने छिपा दिया है, इसे फिर से शुरू नहीं किया जा सकता। | ಈ ಲಿಸ್ಟಿಂಗ್ ಅನ್ನು ನಿರ್ವಾಹಕರು ಮರೆಮಾಡಿದ್ದಾರೆ; ಇದನ್ನು ಮತ್ತೆ ಆರಂಭಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ. | ☐ |
| `rerr.hold_open` | Internal: hold still open at window end. | आंतरिक त्रुटि: समय खत्म होने पर भी होल्ड खुला है। | ಆಂತರಿಕ ದೋಷ: ಸಮಯ ಮುಗಿದರೂ ಹೋಲ್ಡ್ ತೆರೆದಿದೆ. | ☐ |
| `rerr.hours_required` | Set the pickup end time first. | पहले पिकअप का अंतिम समय तय करें। | ಮೊದಲು ಪಿಕಪ್ ಕೊನೆಯ ಸಮಯವನ್ನು ಹೊಂದಿಸಿ. | ☐ |
| `rerr.hours_required_set_pickup_times` | Set the pickup times first. | पहले पिकअप का समय तय करें। | ಮೊದಲು ಪಿಕಪ್ ಸಮಯಗಳನ್ನು ಹೊಂದಿಸಿ. | ☐ |
| `rerr.image_invalid` | Image must be an https URL. | तस्वीर https लिंक होनी चाहिए। | ಚಿತ್ರವು https ಲಿಂಕ್ ಆಗಿರಬೇಕು. | ☐ |
| `rerr.insufficient_stock` | Not enough units left. | पर्याप्त यूनिट नहीं बची हैं। | ಸಾಕಷ್ಟು ಯೂನಿಟ್‌ಗಳು ಉಳಿದಿಲ್ಲ. | ☐ |
| `rerr.insufficient_stock_left` | Only {left} left. | केवल {left} बचे हैं। | ಕೇವಲ {left} ಉಳಿದಿವೆ. | ☐ |
| `rerr.insufficient_stock_sold_out` | Sold out. | खत्म हो गया। | ಮುಗಿದಿದೆ. | ☐ |
| `rerr.invite_expired` | This invite has expired. Ask for a new one. | यह आमंत्रण समाप्त हो चुका है। नया माँगें। | ಈ ಆಹ್ವಾನದ ಅವಧಿ ಮುಗಿದಿದೆ. ಹೊಸದನ್ನು ಕೇಳಿ. | ☐ |
| `rerr.invite_invalid` | This invite link isn't valid. | यह आमंत्रण लिंक सही नहीं है। | ಈ ಆಹ್ವಾನ ಲಿಂಕ್ ಸರಿಯಾಗಿಲ್ಲ. | ☐ |
| `rerr.invite_revoked` | This invite was cancelled. | यह आमंत्रण रद्द कर दिया गया था। | ಈ ಆಹ್ವಾನವನ್ನು ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ. | ☐ |
| `rerr.invite_used` | This invite was already used. | यह आमंत्रण पहले ही इस्तेमाल हो चुका है। | ಈ ಆಹ್ವಾನ ಈಗಾಗಲೇ ಬಳಕೆಯಾಗಿದೆ. | ☐ |
| `rerr.invite_used_already_accepted_remove` | Already accepted; remove the member instead. | पहले ही स्वीकार हो चुका है; इसके बजाय सदस्य को हटाएँ। | ಈಗಾಗಲೇ ಸ್ವೀಕರಿಸಲಾಗಿದೆ; ಬದಲಿಗೆ ಸದಸ್ಯರನ್ನು ತೆಗೆದುಹಾಕಿ. | ☐ |
| `rerr.invite_wrong_number` | This invite was sent to a different mobile number. Sign in with that number. | यह आमंत्रण किसी दूसरे मोबाइल नंबर पर भेजा गया था। उसी नंबर से साइन इन करें। | ಈ ಆಹ್ವಾನವನ್ನು ಬೇರೆ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಗೆ ಕಳುಹಿಸಲಾಗಿತ್ತು. ಆ ಸಂಖ್ಯೆಯಿಂದ ಸೈನ್ ಇನ್ ಮಾಡಿ. | ☐ |
| `rerr.location_not_accepted` | Only the number of minutes is accepted. Your location is never sent to us. | केवल मिनटों की संख्या ली जाती है। आपकी लोकेशन हमें कभी नहीं भेजी जाती। | ನಿಮಿಷಗಳ ಸಂಖ್ಯೆಯನ್ನು ಮಾತ್ರ ಸ್ವೀಕರಿಸಲಾಗುತ್ತದೆ. ನಿಮ್ಮ ಸ್ಥಳ ನಮಗೆ ಎಂದಿಗೂ ಕಳುಹಿಸಲಾಗುವುದಿಲ್ಲ. | ☐ |
| `rerr.logo_invalid` | Upload the logo as an image file. | लोगो को तस्वीर की फ़ाइल के रूप में अपलोड करें। | ಲೋಗೋವನ್ನು ಚಿತ್ರ ಫೈಲ್ ಆಗಿ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ. | ☐ |
| `rerr.method_invalid` | Choose a payment method. | भुगतान का तरीका चुनें। | ಪಾವತಿ ವಿಧಾನವನ್ನು ಆರಿಸಿ. | ☐ |
| `rerr.month_future` | That month hasn't started yet. | वह महीना अभी शुरू नहीं हुआ है। | ಆ ತಿಂಗಳು ಇನ್ನೂ ಆರಂಭವಾಗಿಲ್ಲ. | ☐ |
| `rerr.month_invalid` | Choose a month like 2026-03. | 2026-03 जैसा कोई महीना चुनें। | 2026-03 ರಂತೆ ಒಂದು ತಿಂಗಳನ್ನು ಆರಿಸಿ. | ☐ |
| `rerr.name_required` | First time here? Enter your name to create your account. | पहली बार आए हैं? खाता बनाने के लिए अपना नाम लिखें। | ಮೊದಲ ಬಾರಿಯೇ? ಖಾತೆ ರಚಿಸಲು ನಿಮ್ಮ ಹೆಸರನ್ನು ನಮೂದಿಸಿ. | ☐ |
| `rerr.name_required_enter_name` | Enter your name. | अपना नाम लिखें। | ನಿಮ್ಮ ಹೆಸರನ್ನು ನಮೂದಿಸಿ. | ☐ |
| `rerr.no_activity` | No meals were rescued in that month, so there is nothing to certify. | उस महीने कोई खाना नहीं बचाया गया, इसलिए प्रमाणित करने के लिए कुछ नहीं है। | ಆ ತಿಂಗಳಲ್ಲಿ ಯಾವುದೇ ಊಟ ಉಳಿಸಲಾಗಿಲ್ಲ, ಆದ್ದರಿಂದ ಪ್ರಮಾಣೀಕರಿಸಲು ಏನೂ ಇಲ್ಲ. | ☐ |
| `rerr.no_ngo` | Complete NGO verification first. | पहले NGO सत्यापन पूरा करें। | ಮೊದಲು NGO ಪರಿಶೀಲನೆಯನ್ನು ಪೂರ್ಣಗೊಳಿಸಿ. | ☐ |
| `rerr.no_outlet` | Add your outlet address first. | पहले अपने आउटलेट का पता जोड़ें। | ಮೊದಲು ನಿಮ್ಮ ಔಟ್‌ಲೆಟ್ ವಿಳಾಸವನ್ನು ಸೇರಿಸಿ. | ☐ |
| `rerr.no_receipts` | No receipts in that date range. | उस तारीख-सीमा में कोई रसीद नहीं है। | ಆ ದಿನಾಂಕ ವ್ಯಾಪ್ತಿಯಲ್ಲಿ ಯಾವುದೇ ರಸೀದಿ ಇಲ್ಲ. | ☐ |
| `rerr.no_target` | No vendor to warn. | चेतावनी देने के लिए कोई विक्रेता नहीं है। | ಎಚ್ಚರಿಕೆ ನೀಡಲು ಯಾವುದೇ ಮಾರಾಟಗಾರ ಇಲ್ಲ. | ☐ |
| `rerr.no_target_no_account_suspend` | No account to suspend. | निलंबित करने के लिए कोई खाता नहीं है। | ಅಮಾನತು ಮಾಡಲು ಯಾವುದೇ ಖಾತೆ ಇಲ್ಲ. | ☐ |
| `rerr.no_target_no_listing_hide` | No listing to hide. | छिपाने के लिए कोई लिस्टिंग नहीं है। | ಮರೆಮಾಡಲು ಯಾವುದೇ ಲಿಸ್ಟಿಂಗ್ ಇಲ್ಲ. | ☐ |
| `rerr.no_target_refunds_need_order` | Refunds need an order. Open the report on an order. | रिफ़ंड के लिए ऑर्डर चाहिए। रिपोर्ट को किसी ऑर्डर पर खोलें। | ರಿಫಂಡ್‌ಗೆ ಆರ್ಡರ್ ಬೇಕು. ವರದಿಯನ್ನು ಒಂದು ಆರ್ಡರ್‌ನಲ್ಲಿ ತೆರೆಯಿರಿ. | ☐ |
| `rerr.no_target_there_no_account` | There is no account to suspend. | निलंबित करने के लिए कोई खाता नहीं है। | ಅಮಾನತು ಮಾಡಲು ಯಾವುದೇ ಖಾತೆ ಇಲ್ಲ. | ☐ |
| `rerr.no_vendor` | Complete vendor onboarding first, or ask your manager for an invite. | पहले विक्रेता ऑनबोर्डिंग पूरी करें, या अपने मैनेजर से आमंत्रण माँगें। | ಮೊದಲು ಮಾರಾಟಗಾರ ಆನ್‌ಬೋರ್ಡಿಂಗ್ ಪೂರ್ಣಗೊಳಿಸಿ, ಅಥವಾ ನಿಮ್ಮ ಮ್ಯಾನೇಜರ್‌ರಿಂದ ಆಹ್ವಾನ ಕೇಳಿ. | ☐ |
| `rerr.no_vendor_complete_vendor_onboarding` | Complete vendor onboarding first. | पहले विक्रेता ऑनबोर्डिंग पूरी करें। | ಮೊದಲು ಮಾರಾಟಗಾರ ಆನ್‌ಬೋರ್ಡಿಂಗ್ ಪೂರ್ಣಗೊಳಿಸಿ. | ☐ |
| `rerr.not_available` | This listing is no longer available. | यह लिस्टिंग अब उपलब्ध नहीं है। | ಈ ಲಿಸ್ಟಿಂಗ್ ಇನ್ನು ಲಭ್ಯವಿಲ್ಲ. | ☐ |
| `rerr.not_available_food_past_its` | This food is past its safe-to-eat time. | यह खाना खाने के सुरक्षित समय से आगे निकल चुका है। | ಈ ಆಹಾರ ತಿನ್ನಲು ಸುರಕ್ಷಿತ ಸಮಯವನ್ನು ಮೀರಿದೆ. | ☐ |
| `rerr.not_available_listing_not_available` | This listing is not available. | यह लिस्टिंग उपलब्ध नहीं है। | ಈ ಲಿಸ್ಟಿಂಗ್ ಲಭ್ಯವಿಲ್ಲ. | ☐ |
| `rerr.not_available_status` | This listing is {status}. | यह लिस्टिंग {status} है। | ಈ ಲಿಸ್ಟಿಂಗ್ {status} ಆಗಿದೆ. | ☐ |
| `rerr.not_collected` | You can log distribution once the donation has been collected. | दान लेने के बाद ही आप वितरण दर्ज कर सकते हैं। | ದಾನ ಸಂಗ್ರಹವಾದ ನಂತರ ಮಾತ್ರ ನೀವು ವಿತರಣೆಯನ್ನು ದಾಖಲಿಸಬಹುದು. | ☐ |
| `rerr.not_editable` | A {status} listing cannot be edited. | {status} लिस्टिंग में बदलाव नहीं किया जा सकता। | {status} ಲಿಸ್ಟಿಂಗ್ ಅನ್ನು ಸಂಪಾದಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ. | ☐ |
| `rerr.not_found` | Outlet not found. | आउटलेट नहीं मिला। | ಔಟ್‌ಲೆಟ್ ಸಿಗಲಿಲ್ಲ. | ☐ |
| `rerr.not_found_application_not_found` | Application not found. | आवेदन नहीं मिला। | ಅರ್ಜಿ ಸಿಗಲಿಲ್ಲ. | ☐ |
| `rerr.not_found_batch_not_found` | Batch not found. | बैच नहीं मिला। | ಬ್ಯಾಚ್ ಸಿಗಲಿಲ್ಲ. | ☐ |
| `rerr.not_found_certificate_not_found` | Certificate not found. | सर्टिफ़िकेट नहीं मिला। | ಪ್ರಮಾಣಪತ್ರ ಸಿಗಲಿಲ್ಲ. | ☐ |
| `rerr.not_found_checkout_not_found` | Checkout not found. | चेकआउट नहीं मिला। | ಚೆಕ್‌ಔಟ್ ಸಿಗಲಿಲ್ಲ. | ☐ |
| `rerr.not_found_delivery_not_found` | Delivery not found. | डिलीवरी नहीं मिली। | ಡೆಲಿವರಿ ಸಿಗಲಿಲ್ಲ. | ☐ |
| `rerr.not_found_demo_account_side` | The demo account for this side is missing. Run npm run seed. | इस पक्ष का डेमो खाता मौजूद नहीं है। npm run seed चलाएँ। | ಈ ಬದಿಯ ಡೆಮೊ ಖಾತೆ ಇಲ್ಲ. npm run seed ಚಲಾಯಿಸಿ. | ☐ |
| `rerr.not_found_demo_user_not` | Demo user not found. | डेमो उपयोगकर्ता नहीं मिला। | ಡೆಮೊ ಬಳಕೆದಾರ ಸಿಗಲಿಲ್ಲ. | ☐ |
| `rerr.not_found_donation_batch_not` | Donation batch not found for this outlet. | इस आउटलेट के लिए दान बैच नहीं मिला। | ಈ ಔಟ್‌ಲೆಟ್‌ಗೆ ದಾನ ಬ್ಯಾಚ್ ಸಿಗಲಿಲ್ಲ. | ☐ |
| `rerr.not_found_donation_not_found` | Donation not found. | दान नहीं मिला। | ದಾನ ಸಿಗಲಿಲ್ಲ. | ☐ |
| `rerr.not_found_invite_not_found` | Invite not found. | आमंत्रण नहीं मिला। | ಆಹ್ವಾನ ಸಿಗಲಿಲ್ಲ. | ☐ |
| `rerr.not_found_item_not_found` | Item not found. | आइटम नहीं मिला। | ವಸ್ತು ಸಿಗಲಿಲ್ಲ. | ☐ |
| `rerr.not_found_listing_not_found` | Listing not found. | लिस्टिंग नहीं मिली। | ಲಿಸ್ಟಿಂಗ್ ಸಿಗಲಿಲ್ಲ. | ☐ |
| `rerr.not_found_listing_outlet` | Listing not found for your outlet. | आपके आउटलेट के लिए लिस्टिंग नहीं मिली। | ನಿಮ್ಮ ಔಟ್‌ಲೆಟ್‌ಗೆ ಲಿಸ್ಟಿಂಗ್ ಸಿಗಲಿಲ್ಲ. | ☐ |
| `rerr.not_found_no_active_claim` | No active claim to release. | छोड़ने के लिए कोई चालू क्लेम नहीं है। | ಬಿಡುಗಡೆ ಮಾಡಲು ಯಾವುದೇ ಸಕ್ರಿಯ ಕ್ಲೈಮ್ ಇಲ್ಲ. | ☐ |
| `rerr.not_found_no_claimed_batch` | No claimed batch found. | कोई क्लेम किया हुआ बैच नहीं मिला। | ಕ್ಲೈಮ್ ಮಾಡಿದ ಯಾವುದೇ ಬ್ಯಾಚ್ ಸಿಗಲಿಲ್ಲ. | ☐ |
| `rerr.not_found_order_not_found` | Order not found on this listing. | इस लिस्टिंग पर ऑर्डर नहीं मिला। | ಈ ಲಿಸ್ಟಿಂಗ್‌ನಲ್ಲಿ ಆರ್ಡರ್ ಸಿಗಲಿಲ್ಲ. | ☐ |
| `rerr.not_found_order_not_found2` | Order not found. | ऑर्डर नहीं मिला। | ಆರ್ಡರ್ ಸಿಗಲಿಲ್ಲ. | ☐ |
| `rerr.not_found_order_not_found_outlet` | Order not found for this outlet. | इस आउटलेट के लिए ऑर्डर नहीं मिला। | ಈ ಔಟ್‌ಲೆಟ್‌ಗೆ ಆರ್ಡರ್ ಸಿಗಲಿಲ್ಲ. | ☐ |
| `rerr.not_found_organization_no_longer` | That organization no longer exists. | वह संगठन अब मौजूद नहीं है। | ಆ ಸಂಸ್ಥೆ ಈಗ ಅಸ್ತಿತ್ವದಲ್ಲಿಲ್ಲ. | ☐ |
| `rerr.not_found_outlet_isn_t` | That outlet isn't part of your account. | वह आउटलेट आपके खाते का हिस्सा नहीं है। | ಆ ಔಟ್‌ಲೆಟ್ ನಿಮ್ಮ ಖಾತೆಯ ಭಾಗವಲ್ಲ. | ☐ |
| `rerr.not_found_outlet_scope` | Not found for your outlet. | आपके आउटलेट के लिए नहीं मिला। | ನಿಮ್ಮ ಔಟ್‌ಲೆಟ್‌ಗೆ ಸಿಗಲಿಲ್ಲ. | ☐ |
| `rerr.not_found_receipt_not_found` | Receipt not found. | रसीद नहीं मिली। | ರಸೀದಿ ಸಿಗಲಿಲ್ಲ. | ☐ |
| `rerr.not_found_report_not_found` | Report not found. | रिपोर्ट नहीं मिली। | ವರದಿ ಸಿಗಲಿಲ್ಲ. | ☐ |
| `rerr.not_found_team_member_not` | Team member not found. | टीम सदस्य नहीं मिला। | ತಂಡದ ಸದಸ್ಯ ಸಿಗಲಿಲ್ಲ. | ☐ |
| `rerr.not_found_template_not_found` | Template not found. | टेम्पलेट नहीं मिला। | ಟೆಂಪ್ಲೇಟ್ ಸಿಗಲಿಲ್ಲ. | ☐ |
| `rerr.not_found_vendor_not_found` | Vendor not found. | विक्रेता नहीं मिला। | ಮಾರಾಟಗಾರ ಸಿಗಲಿಲ್ಲ. | ☐ |
| `rerr.not_found_we_couldn_t` | We couldn't find what you're reporting. | आप जिसकी रिपोर्ट कर रहे हैं, वह हमें नहीं मिला। | ನೀವು ವರದಿ ಮಾಡುತ್ತಿರುವುದು ನಮಗೆ ಸಿಗಲಿಲ್ಲ. | ☐ |
| `rerr.not_new` | Referral codes are for new customers, before their first order. | रेफ़रल कोड नए ग्राहकों के लिए हैं, उनके पहले ऑर्डर से पहले। | ರೆಫರಲ್ ಕೋಡ್‌ಗಳು ಹೊಸ ಗ್ರಾಹಕರಿಗಾಗಿ, ಅವರ ಮೊದಲ ಆರ್ಡರ್‌ಗೆ ಮೊದಲು. | ☐ |
| `rerr.not_picked_up` | You can rate an order after you've picked it up. | ऑर्डर लेने के बाद ही आप उसे रेटिंग दे सकते हैं। | ಆರ್ಡರ್ ತೆಗೆದುಕೊಂಡ ನಂತರ ನೀವು ರೇಟಿಂಗ್ ನೀಡಬಹುದು. | ☐ |
| `rerr.not_refundable` | This order has no captured online payment to refund. | इस ऑर्डर का कोई ऑनलाइन भुगतान नहीं मिला जिसे रिफ़ंड किया जा सके। | ಈ ಆರ್ಡರ್‌ಗೆ ರಿಫಂಡ್ ಮಾಡಬಹುದಾದ ಯಾವುದೇ ಆನ್‌ಲೈನ್ ಪಾವತಿ ಇಲ್ಲ. | ☐ |
| `rerr.notes_long` | Keep notes under 1000 characters. | नोट 1000 अक्षरों से कम रखें। | ಟಿಪ್ಪಣಿಗಳನ್ನು 1000 ಅಕ್ಷರಗಳಿಗಿಂತ ಕಡಿಮೆ ಇಡಿ. | ☐ |
| `rerr.order_inactive` | {ref} is {status}. | {ref} {status} है। | {ref} {status} ಆಗಿದೆ. | ☐ |
| `rerr.order_mismatch` | Payment does not match this checkout. | भुगतान इस चेकआउट से मेल नहीं खाता। | ಪಾವತಿ ಈ ಚೆಕ್‌ಔಟ್‌ಗೆ ಹೊಂದುತ್ತಿಲ್ಲ. | ☐ |
| `rerr.otp_invalid` | Incorrect code. In demo mode the code is 123456. | कोड सही नहीं है। डेमो मोड में कोड 123456 है। | ಕೋಡ್ ಸರಿಯಾಗಿಲ್ಲ. ಡೆಮೊ ಮೋಡ್‌ನಲ್ಲಿ ಕೋಡ್ 123456. | ☐ |
| `rerr.out_of_area` | This vendor is outside your service area. | यह विक्रेता आपके सेवा क्षेत्र से बाहर है। | ಈ ಮಾರಾಟಗಾರ ನಿಮ್ಮ ಸೇವಾ ಪ್ರದೇಶದ ಹೊರಗಿದ್ದಾರೆ. | ☐ |
| `rerr.outlet_limit` | An organization can have at most {max} outlets. | एक संगठन के अधिकतम {max} आउटलेट हो सकते हैं। | ಒಂದು ಸಂಸ್ಥೆಗೆ ಗರಿಷ್ಠ {max} ಔಟ್‌ಲೆಟ್‌ಗಳು ಇರಬಹುದು. | ☐ |
| `rerr.outlet_required` | Choose which outlet this staff member works at. | चुनें कि यह स्टाफ़ सदस्य किस आउटलेट पर काम करता है। | ಈ ಸಿಬ್ಬಂದಿ ಯಾವ ಔಟ್‌ಲೆಟ್‌ನಲ್ಲಿ ಕೆಲಸ ಮಾಡುತ್ತಾರೆ ಎಂಬುದನ್ನು ಆರಿಸಿ. | ☐ |
| `rerr.outlet_required_staff_work_one` | Staff work at one outlet: choose which. | स्टाफ़ एक ही आउटलेट पर काम करता है: चुनें कौन-सा। | ಸಿಬ್ಬಂದಿ ಒಂದೇ ಔಟ್‌ಲೆಟ್‌ನಲ್ಲಿ ಕೆಲಸ ಮಾಡುತ್ತಾರೆ: ಯಾವುದು ಎಂದು ಆರಿಸಿ. | ☐ |
| `rerr.pay_at_pickup_locked` | Pay at pickup unlocks after {count} completed pickups. Pay online for now. | पिकअप पर भुगतान {count} पिकअप पूरे होने के बाद खुलता है। अभी ऑनलाइन भुगतान करें। | ಪಿಕಪ್‌ನಲ್ಲಿ ಪಾವತಿ {count} ಪಿಕಪ್‌ಗಳು ಪೂರ್ಣಗೊಂಡ ನಂತರ ತೆರೆಯುತ್ತದೆ. ಸದ್ಯಕ್ಕೆ ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ಪಾವತಿಸಿ. | ☐ |
| `rerr.pay_at_pickup_off` | This vendor only accepts online payment. | यह विक्रेता केवल ऑनलाइन भुगतान लेता है। | ಈ ಮಾರಾಟಗಾರ ಆನ್‌ಲೈನ್ ಪಾವತಿಯನ್ನು ಮಾತ್ರ ಸ್ವೀಕರಿಸುತ್ತಾರೆ. | ☐ |
| `rerr.pdf_failed` | Could not create the PDF. | PDF नहीं बन सकी। | PDF ರಚಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. | ☐ |
| `rerr.people_invalid` | Enter how many people were reached (a whole number, 0 or more). | बताएँ कितने लोगों तक खाना पहुँचा (पूरी संख्या, 0 या ज़्यादा)। | ಎಷ್ಟು ಜನರನ್ನು ತಲುಪಲಾಯಿತು ಎಂದು ನಮೂದಿಸಿ (ಪೂರ್ಣ ಸಂಖ್ಯೆ, 0 ಅಥವಾ ಹೆಚ್ಚು). | ☐ |
| `rerr.phone_invalid` | Enter a valid phone number. | सही फ़ोन नंबर लिखें। | ಸರಿಯಾದ ಫೋನ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ. | ☐ |
| `rerr.phone_invalid_enter_valid_10` | Enter a valid 10-digit mobile number. | 10 अंकों का सही मोबाइल नंबर लिखें। | 10 ಅಂಕಿಗಳ ಸರಿಯಾದ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ. | ☐ |
| `rerr.phone_used` | This phone number has already redeemed a referral. | इस फ़ोन नंबर से रेफ़रल पहले ही इस्तेमाल हो चुका है। | ಈ ಫೋನ್ ಸಂಖ್ಯೆಯಿಂದ ರೆಫರಲ್ ಈಗಾಗಲೇ ಬಳಕೆಯಾಗಿದೆ. | ☐ |
| `rerr.photo_invalid` | Invalid photo. | फ़ोटो सही नहीं है। | ಫೋಟೋ ಸರಿಯಾಗಿಲ್ಲ. | ☐ |
| `rerr.photo_invalid_only_attach_photos` | You can only attach photos you uploaded. | आप केवल अपनी अपलोड की हुई फ़ोटो ही जोड़ सकते हैं। | ನೀವು ಅಪ್‌ಲೋಡ್ ಮಾಡಿದ ಫೋಟೋಗಳನ್ನು ಮಾತ್ರ ಸೇರಿಸಬಹುದು. | ☐ |
| `rerr.photo_invalid_photos_must_jpg` | Photos must be JPG, PNG or WebP files uploaded here. | फ़ोटो यहीं अपलोड की गई JPG, PNG या WebP फ़ाइलें होनी चाहिए। | ಫೋಟೋಗಳು ಇಲ್ಲಿ ಅಪ್‌ಲೋಡ್ ಮಾಡಿದ JPG, PNG ಅಥವಾ WebP ಫೈಲ್‌ಗಳಾಗಿರಬೇಕು. | ☐ |
| `rerr.photos_many` | At most {max} photos. | अधिकतम {max} फ़ोटो। | ಗರಿಷ್ಠ {max} ಫೋಟೋಗಳು. | ☐ |
| `rerr.pin_required` | Drop a valid map pin. | नक्शे पर सही पिन लगाएँ। | ನಕ್ಷೆಯಲ್ಲಿ ಸರಿಯಾದ ಪಿನ್ ಹಾಕಿ. | ☐ |
| `rerr.pin_required_drop_map_pin` | Drop a map pin. | नक्शे पर पिन लगाएँ। | ನಕ್ಷೆಯಲ್ಲಿ ಪಿನ್ ಹಾಕಿ. | ☐ |
| `rerr.platform_invalid` | Unknown platform. | प्लेटफ़ॉर्म पहचाना नहीं गया। | ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಗುರುತಿಸಲಾಗಲಿಲ್ಲ. | ☐ |
| `rerr.prepared_invalid` | Preparation time must be now or earlier. | तैयार करने का समय अभी या उससे पहले का होना चाहिए। | ತಯಾರಿಸಿದ ಸಮಯ ಈಗ ಅಥವಾ ಅದಕ್ಕೂ ಮೊದಲು ಆಗಿರಬೇಕು. | ☐ |
| `rerr.price_invalid` | Original price must be a positive whole number of rupees. | मूल कीमत रुपये में एक धनात्मक पूरी संख्या होनी चाहिए। | ಮೂಲ ಬೆಲೆ ರೂಪಾಯಿಗಳಲ್ಲಿ ಧನಾತ್ಮಕ ಪೂರ್ಣ ಸಂಖ್ಯೆಯಾಗಿರಬೇಕು. | ☐ |
| `rerr.price_invalid_enter_both_prices` | Enter both prices first. | पहले दोनों कीमतें लिखें। | ಮೊದಲು ಎರಡೂ ಬೆಲೆಗಳನ್ನು ನಮೂದಿಸಿ. | ☐ |
| `rerr.price_invalid_enter_original_price` | Enter the original price first. | पहले मूल कीमत लिखें। | ಮೊದಲು ಮೂಲ ಬೆಲೆಯನ್ನು ನಮೂದಿಸಿ. | ☐ |
| `rerr.price_invalid_rescue` | Rescue price must be a positive whole number of rupees. | बचाव की कीमत रुपये में एक धनात्मक पूरी संख्या होनी चाहिए। | ರಕ್ಷಣಾ ಬೆಲೆ ರೂಪಾಯಿಗಳಲ್ಲಿ ಧನಾತ್ಮಕ ಪೂರ್ಣ ಸಂಖ್ಯೆಯಾಗಿರಬೇಕು. | ☐ |
| `rerr.priority_closed` | The priority window for this listing has ended. | इस लिस्टिंग की प्राथमिकता अवधि खत्म हो चुकी है। | ಈ ಲಿಸ್ಟಿಂಗ್‌ನ ಆದ್ಯತಾ ಅವಧಿ ಮುಗಿದಿದೆ. | ☐ |
| `rerr.priority_donation` | Donation-only listings are already for charities. | सिर्फ़ दान वाली लिस्टिंग पहले से ही संस्थाओं के लिए हैं। | ದಾನ-ಮಾತ್ರ ಲಿಸ್ಟಿಂಗ್‌ಗಳು ಈಗಾಗಲೇ ದಾನ ಸಂಸ್ಥೆಗಳಿಗಾಗಿವೆ. | ☐ |
| `rerr.priority_invalid` | Choose {options} minutes. | {options} मिनट में से चुनें। | {options} ನಿಮಿಷಗಳಲ್ಲಿ ಆರಿಸಿ. | ☐ |
| `rerr.priority_too_long` | The priority window must end at least 10 minutes before pickup closes, or customers would never get a chance. | प्राथमिकता अवधि पिकअप बंद होने से कम से कम 10 मिनट पहले खत्म होनी चाहिए, वरना ग्राहकों को मौका ही नहीं मिलेगा। | ಆದ್ಯತಾ ಅವಧಿ ಪಿಕಪ್ ಮುಗಿಯುವ ಕನಿಷ್ಠ 10 ನಿಮಿಷ ಮೊದಲು ಕೊನೆಗೊಳ್ಳಬೇಕು, ಇಲ್ಲದಿದ್ದರೆ ಗ್ರಾಹಕರಿಗೆ ಅವಕಾಶವೇ ಸಿಗುವುದಿಲ್ಲ. | ☐ |
| `rerr.qty_below_allocated` | {count} units are already reserved or held; quantity cannot go below that. | {count} यूनिट पहले से आरक्षित या होल्ड पर हैं; मात्रा इससे कम नहीं हो सकती। | {count} ಯೂನಿಟ್‌ಗಳು ಈಗಾಗಲೇ ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ ಅಥವಾ ಹೋಲ್ಡ್‌ನಲ್ಲಿವೆ; ಪ್ರಮಾಣ ಅದಕ್ಕಿಂತ ಕಡಿಮೆ ಆಗಲು ಸಾಧ್ಯವಿಲ್ಲ. | ☐ |
| `rerr.qty_cap` | Maximum {max} units per order. | हर ऑर्डर में अधिकतम {max} यूनिट। | ಪ್ರತಿ ಆರ್ಡರ್‌ಗೆ ಗರಿಷ್ಠ {max} ಯೂನಿಟ್‌ಗಳು. | ☐ |
| `rerr.qty_invalid` | Choose at least 1 unit. | कम से कम 1 यूनिट चुनें। | ಕನಿಷ್ಠ 1 ಯೂನಿಟ್ ಆರಿಸಿ. | ☐ |
| `rerr.qty_invalid_listing` | Quantity must be 1–{max}. | मात्रा 1 से {max} के बीच होनी चाहिए। | ಪ್ರಮಾಣ 1 ರಿಂದ {max} ನಡುವೆ ಇರಬೇಕು. | ☐ |
| `rerr.range_too_large` | That is more than 500 receipts. Choose a shorter date range. | यह 500 से ज़्यादा रसीदें हैं। छोटी तारीख-सीमा चुनें। | ಇದು 500 ಕ್ಕಿಂತ ಹೆಚ್ಚು ರಸೀದಿಗಳು. ಚಿಕ್ಕ ದಿನಾಂಕ ವ್ಯಾಪ್ತಿಯನ್ನು ಆರಿಸಿ. | ☐ |
| `rerr.rate_limited` | Too many attempts. Please wait a moment and try again. | बहुत ज़्यादा कोशिशें हो गईं। थोड़ा रुककर फिर कोशिश करें। | ತುಂಬಾ ಪ್ರಯತ್ನಗಳಾದವು. ಸ್ವಲ್ಪ ಕಾದು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ. | ☐ |
| `rerr.rating_invalid` | Choose 1 to 5 stars. | 1 से 5 सितारे चुनें। | 1 ರಿಂದ 5 ಸ್ಟಾರ್ ಆರಿಸಿ. | ☐ |
| `rerr.reason_invalid` | Choose a reason. | एक कारण चुनें। | ಒಂದು ಕಾರಣವನ್ನು ಆರಿಸಿ. | ☐ |
| `rerr.reason_long` | Keep the reason under 500 characters. | कारण 500 अक्षरों से कम रखें। | ಕಾರಣವನ್ನು 500 ಅಕ್ಷರಗಳಿಗಿಂತ ಕಡಿಮೆ ಇಡಿ. | ☐ |
| `rerr.reason_required` | Give a reason. It is recorded and shown to the person affected. | कारण लिखें। यह दर्ज होता है और प्रभावित व्यक्ति को दिखता है। | ಕಾರಣ ನೀಡಿ. ಇದನ್ನು ದಾಖಲಿಸಲಾಗುತ್ತದೆ ಮತ್ತು ಪರಿಣಾಮಕ್ಕೊಳಗಾದ ವ್ಯಕ್ತಿಗೆ ತೋರಿಸಲಾಗುತ್ತದೆ. | ☐ |
| `rerr.reason_required_give_rejection_reason` | Give a rejection reason. | अस्वीकार करने का कारण लिखें। | ತಿರಸ್ಕರಿಸುವ ಕಾರಣವನ್ನು ನೀಡಿ. | ☐ |
| `rerr.reason_required_give_short_cancellation` | Give a short cancellation reason. | रद्द करने का छोटा कारण लिखें। | ರದ್ದುಪಡಿಸುವ ಚಿಕ್ಕ ಕಾರಣವನ್ನು ನೀಡಿ. | ☐ |
| `rerr.registration_long` | The registration number is too long. | पंजीकरण नंबर बहुत लंबा है। | ನೋಂದಣಿ ಸಂಖ್ಯೆ ತುಂಬಾ ಉದ್ದವಾಗಿದೆ. | ☐ |
| `rerr.review_window_closed` | The 48-hour rating window has closed. | 48 घंटे की रेटिंग अवधि खत्म हो चुकी है। | 48 ಗಂಟೆಗಳ ರೇಟಿಂಗ್ ಅವಧಿ ಮುಗಿದಿದೆ. | ☐ |
| `rerr.risk_invalid` | Unknown food risk tag. | खाने के जोखिम का टैग पहचाना नहीं गया। | ಆಹಾರ ಅಪಾಯದ ಟ್ಯಾಗ್ ಗುರುತಿಸಲಾಗಲಿಲ್ಲ. | ☐ |
| `rerr.risk_window` | Raw, seafood and dairy-dessert items can have a pickup window of at most 2 hours. | कच्चे, समुद्री और डेयरी-मिठाई वाले सामान की पिकअप अवधि अधिकतम 2 घंटे हो सकती है। | ಹಸಿ, ಸಮುದ್ರಾಹಾರ ಮತ್ತು ಡೈರಿ-ಸಿಹಿ ಪದಾರ್ಥಗಳ ಪಿಕಪ್ ಅವಧಿ ಗರಿಷ್ಠ 2 ಗಂಟೆ ಇರಬಹುದು. | ☐ |
| `rerr.role_invalid` | Choose Customer, Vendor or NGO. | ग्राहक, विक्रेता या NGO चुनें। | ಗ್ರಾಹಕ, ಮಾರಾಟಗಾರ ಅಥವಾ NGO ಆರಿಸಿ. | ☐ |
| `rerr.role_invalid_choose_manager_staff` | Choose manager or staff. | मैनेजर या स्टाफ़ चुनें। | ಮ್ಯಾನೇಜರ್ ಅಥವಾ ಸಿಬ್ಬಂದಿ ಆರಿಸಿ. | ☐ |
| `rerr.role_invalid_invite_someone_as` | Invite someone as a manager or as staff. | किसी को मैनेजर या स्टाफ़ के रूप में आमंत्रित करें। | ಯಾರನ್ನಾದರೂ ಮ್ಯಾನೇಜರ್ ಅಥವಾ ಸಿಬ್ಬಂದಿಯಾಗಿ ಆಹ್ವಾನಿಸಿ. | ☐ |
| `rerr.role_mismatch` | This number is registered as a {role}. Pick that side, or use a different number. | यह नंबर {role} के रूप में पंजीकृत है। वही पक्ष चुनें, या कोई दूसरा नंबर इस्तेमाल करें। | ಈ ಸಂಖ್ಯೆ {role} ಆಗಿ ನೋಂದಣಿಯಾಗಿದೆ. ಆ ಬದಿಯನ್ನು ಆರಿಸಿ, ಅಥವಾ ಬೇರೆ ಸಂಖ್ಯೆ ಬಳಸಿ. | ☐ |
| `rerr.safe_until_invalid` | Safe-to-eat deadline must be after the pickup end. | खाने के सुरक्षित रहने का समय पिकअप खत्म होने के बाद का होना चाहिए। | ತಿನ್ನಲು ಸುರಕ್ಷಿತವಾಗಿರುವ ಕೊನೆಯ ಸಮಯ ಪಿಕಪ್ ಮುಗಿದ ನಂತರ ಇರಬೇಕು. | ☐ |
| `rerr.same_device` | A code can't be used on the same device it was shared from. | जिस डिवाइस से कोड शेयर किया गया, उसी पर वह इस्तेमाल नहीं हो सकता। | ಕೋಡ್ ಹಂಚಿಕೊಂಡ ಅದೇ ಸಾಧನದಲ್ಲಿ ಅದನ್ನು ಬಳಸಲು ಸಾಧ್ಯವಿಲ್ಲ. | ☐ |
| `rerr.self_referral` | You can't use your own referral code. | आप अपना खुद का रेफ़रल कोड इस्तेमाल नहीं कर सकते। | ನಿಮ್ಮದೇ ರೆಫರಲ್ ಕೋಡ್ ಅನ್ನು ನೀವು ಬಳಸಲು ಸಾಧ್ಯವಿಲ್ಲ. | ☐ |
| `rerr.self_referral_t_use_code` | You can't use a code from your own phone number. | आप अपने ही फ़ोन नंबर का कोड इस्तेमाल नहीं कर सकते। | ನಿಮ್ಮದೇ ಫೋನ್ ಸಂಖ್ಯೆಯ ಕೋಡ್ ಅನ್ನು ನೀವು ಬಳಸಲು ಸಾಧ್ಯವಿಲ್ಲ. | ☐ |
| `rerr.self_revoke` | You can't remove yourself. | आप खुद को नहीं हटा सकते। | ನಿಮ್ಮನ್ನು ನೀವೇ ತೆಗೆದುಹಾಕಲು ಸಾಧ್ಯವಿಲ್ಲ. | ☐ |
| `rerr.server_error` | Something went wrong. Please try again. | कुछ गड़बड़ हो गई। कृपया फिर से कोशिश करें। | ಏನೋ ತಪ್ಪಾಯಿತು. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ. | ☐ |
| `rerr.servings_invalid` | Enter how many servings were distributed (a whole number, 1 or more). | बताएँ कितने हिस्से बाँटे गए (पूरी संख्या, 1 या ज़्यादा)। | ಎಷ್ಟು ಭಾಗಗಳನ್ನು ವಿತರಿಸಲಾಯಿತು ಎಂದು ನಮೂದಿಸಿ (ಪೂರ್ಣ ಸಂಖ್ಯೆ, 1 ಅಥವಾ ಹೆಚ್ಚು). | ☐ |
| `rerr.setting_range` | Priority-window options must be a non-empty subset of 15, 30 and 45 minutes. | प्राथमिकता अवधि के विकल्प 15, 30 और 45 मिनट का खाली न होने वाला हिस्सा होने चाहिए। | ಆದ್ಯತಾ ಅವಧಿಯ ಆಯ್ಕೆಗಳು 15, 30 ಮತ್ತು 45 ನಿಮಿಷಗಳ ಖಾಲಿಯಲ್ಲದ ಉಪಗುಂಪಾಗಿರಬೇಕು. | ☐ |
| `rerr.setting_range_moderation_keyword_most` | A moderation keyword can be at most 40 characters. | मॉडरेशन कीवर्ड अधिकतम 40 अक्षरों का हो सकता है। | ಮಾಡರೇಶನ್ ಕೀವರ್ಡ್ ಗರಿಷ್ಠ 40 ಅಕ್ಷರಗಳದ್ದಾಗಿರಬಹುದು. | ☐ |
| `rerr.setting_range_spec` | {label} must be a whole number from {min} to {max} ({unit}). | {label} {min} से {max} के बीच की पूरी संख्या होनी चाहिए ({unit})। | {label} {min} ರಿಂದ {max} ನಡುವಿನ ಪೂರ್ಣ ಸಂಖ್ಯೆಯಾಗಿರಬೇಕು ({unit}). | ☐ |
| `rerr.slot_invalid` | Choose a pickup time. | पिकअप का समय चुनें। | ಪಿಕಪ್ ಸಮಯವನ್ನು ಆರಿಸಿ. | ☐ |
| `rerr.slot_late` | The pickup time must be before the collect-by deadline. | पिकअप का समय संग्रह की अंतिम समय-सीमा से पहले होना चाहिए। | ಪಿಕಪ್ ಸಮಯ ಸಂಗ್ರಹದ ಕೊನೆಯ ಸಮಯಕ್ಕಿಂತ ಮೊದಲು ಇರಬೇಕು. | ☐ |
| `rerr.slot_past` | Pick a time that hasn't passed. | ऐसा समय चुनें जो बीत न चुका हो। | ಕಳೆದುಹೋಗದ ಸಮಯವನ್ನು ಆರಿಸಿ. | ☐ |
| `rerr.step_discount_cap` | Step {step}: the platform caps discounts at {cap}%. | चरण {step}: प्लेटफ़ॉर्म छूट को {cap}% तक सीमित रखता है। | ಹಂತ {step}: ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ರಿಯಾಯಿತಿಯನ್ನು {cap}% ಗೆ ಮಿತಿಗೊಳಿಸುತ್ತದೆ. | ☐ |
| `rerr.step_discount_range` | Step {step}: the discount must be a whole number from {min}% to {max}%. | चरण {step}: छूट {min}% से {max}% के बीच की पूरी संख्या होनी चाहिए। | ಹಂತ {step}: ರಿಯಾಯಿತಿ {min}% ರಿಂದ {max}% ನಡುವಿನ ಪೂರ್ಣ ಸಂಖ್ಯೆಯಾಗಿರಬೇಕು. | ☐ |
| `rerr.step_price_up` | Step {step}: each step must lower the price (it is ₹{price} now). A price only ever goes down. | चरण {step}: हर चरण में कीमत घटनी चाहिए (अभी यह ₹{price} है)। कीमत हमेशा केवल घटती है। | ಹಂತ {step}: ಪ್ರತಿ ಹಂತದಲ್ಲಿ ಬೆಲೆ ಇಳಿಯಬೇಕು (ಈಗ ಅದು ₹{price}). ಬೆಲೆ ಯಾವಾಗಲೂ ಇಳಿಯುತ್ತಲೇ ಹೋಗುತ್ತದೆ. | ☐ |
| `rerr.step_time_first` | Step {step}: the time must be in the future. | चरण {step}: समय भविष्य में होना चाहिए। | ಹಂತ {step}: ಸಮಯ ಭವಿಷ್ಯದಲ್ಲಿರಬೇಕು. | ☐ |
| `rerr.step_time_invalid` | Step {step}: choose a valid time. | चरण {step}: सही समय चुनें। | ಹಂತ {step}: ಸರಿಯಾದ ಸಮಯವನ್ನು ಆರಿಸಿ. | ☐ |
| `rerr.step_time_late` | Step {step}: must be at least 5 minutes before the pickup window ends. | चरण {step}: पिकअप का समय खत्म होने से कम से कम 5 मिनट पहले होना चाहिए। | ಹಂತ {step}: ಪಿಕಪ್ ಸಮಯ ಮುಗಿಯುವ ಕನಿಷ್ಠ 5 ನಿಮಿಷ ಮೊದಲು ಇರಬೇಕು. | ☐ |
| `rerr.step_time_order` | Step {step}: steps must be in time order, after step {prev}. | चरण {step}: चरण समय के क्रम में होने चाहिए, चरण {prev} के बाद। | ಹಂತ {step}: ಹಂತಗಳು ಸಮಯದ ಕ್ರಮದಲ್ಲಿರಬೇಕು, ಹಂತ {prev} ರ ನಂತರ. | ☐ |
| `rerr.steps_donation` | Donation-only listings have no price to mark down. | सिर्फ़ दान वाली लिस्टिंग की कोई कीमत नहीं होती जिसे घटाया जाए। | ದಾನ-ಮಾತ್ರ ಲಿಸ್ಟಿಂಗ್‌ಗಳಿಗೆ ಇಳಿಸಲು ಯಾವುದೇ ಬೆಲೆ ಇಲ್ಲ. | ☐ |
| `rerr.steps_invalid` | Price steps must be a list. | कीमत के चरण एक सूची के रूप में होने चाहिए। | ಬೆಲೆ ಹಂತಗಳು ಪಟ್ಟಿಯ ರೂಪದಲ್ಲಿರಬೇಕು. | ☐ |
| `rerr.steps_too_many` | At most {max} price steps. | कीमत के अधिकतम {max} चरण। | ಗರಿಷ್ಠ {max} ಬೆಲೆ ಹಂತಗಳು. | ☐ |
| `rerr.suspended` | Reservations are paused until {date}. | {date} तक आरक्षण रुके हुए हैं। | {date} ವರೆಗೆ ಕಾಯ್ದಿರಿಸುವಿಕೆಗಳನ್ನು ನಿಲ್ಲಿಸಲಾಗಿದೆ. | ☐ |
| `rerr.target_invalid` | Unknown report target. | रिपोर्ट का विषय पहचाना नहीं गया। | ವರದಿಯ ವಿಷಯ ಗುರುತಿಸಲಾಗಲಿಲ್ಲ. | ☐ |
| `rerr.target_invalid_unknown_item_type` | Unknown item type. | आइटम का प्रकार पहचाना नहीं गया। | ವಸ್ತುವಿನ ಪ್ರಕಾರ ಗುರುತಿಸಲಾಗಲಿಲ್ಲ. | ☐ |
| `rerr.template_exists` | A template like this already exists. | ऐसा टेम्पलेट पहले से मौजूद है। | ಇಂತಹ ಟೆಂಪ್ಲೇಟ್ ಈಗಾಗಲೇ ಇದೆ. | ☐ |
| `rerr.text_too_long` | Keep your review under 1000 characters. | अपनी समीक्षा 1000 अक्षरों से कम रखें। | ನಿಮ್ಮ ವಿಮರ್ಶೆಯನ್ನು 1000 ಅಕ್ಷರಗಳಿಗಿಂತ ಕಡಿಮೆ ಇಡಿ. | ☐ |
| `rerr.text_too_long_keep_details_under` | Keep the details under 2000 characters. | विवरण 2000 अक्षरों से कम रखें। | ವಿವರಗಳನ್ನು 2000 ಅಕ್ಷರಗಳಿಗಿಂತ ಕಡಿಮೆ ಇಡಿ. | ☐ |
| `rerr.title_invalid` | Title must be 3–80 characters. | शीर्षक 3 से 80 अक्षरों का होना चाहिए। | ಶೀರ್ಷಿಕೆ 3 ರಿಂದ 80 ಅಕ್ಷರಗಳದ್ದಾಗಿರಬೇಕು. | ☐ |
| `rerr.token_invalid` | Invalid push token. | पुश टोकन सही नहीं है। | ಪುಶ್ ಟೋಕನ್ ಸರಿಯಾಗಿಲ್ಲ. | ☐ |
| `rerr.token_invalid_not_expo_push` | Not an Expo push token. | यह Expo पुश टोकन नहीं है। | ಇದು Expo ಪುಶ್ ಟೋಕನ್ ಅಲ್ಲ. | ☐ |
| `rerr.too_early` | You can share an ETA up to 90 minutes before pickup opens. | आप पिकअप खुलने से 90 मिनट पहले तक ही ETA बता सकते हैं। | ಪಿಕಪ್ ತೆರೆಯುವ 90 ನಿಮಿಷ ಮೊದಲು ಮಾತ್ರ ನೀವು ETA ಹಂಚಿಕೊಳ್ಳಬಹುದು. | ☐ |
| `rerr.too_early_opens` | Pickup window opens at {time}. | पिकअप का समय {time} पर खुलता है। | ಪಿಕಪ್ ಸಮಯ {time} ಕ್ಕೆ ತೆರೆಯುತ್ತದೆ. | ☐ |
| `rerr.too_late` | The pickup window has ended. | पिकअप का समय खत्म हो चुका है। | ಪಿಕಪ್ ಸಮಯ ಮುಗಿದಿದೆ. | ☐ |
| `rerr.unauthenticated` | Please sign in. | कृपया साइन इन करें। | ದಯವಿಟ್ಟು ಸೈನ್ ಇನ್ ಮಾಡಿ. | ☐ |
| `rerr.unauthenticated_please_sign_as` | Please sign in as a customer. | कृपया ग्राहक के रूप में साइन इन करें। | ದಯವಿಟ್ಟು ಗ್ರಾಹಕರಾಗಿ ಸೈನ್ ಇನ್ ಮಾಡಿ. | ☐ |
| `rerr.upi_invalid` | Enter a valid UPI ID, e.g. name@bank. | सही UPI ID लिखें, जैसे name@bank। | ಸರಿಯಾದ UPI ID ನಮೂದಿಸಿ, ಉದಾ. name@bank. | ☐ |
| `rerr.use_gateway` | Razorpay test mode is configured; use the real checkout. | Razorpay टेस्ट मोड चालू है; असली चेकआउट का इस्तेमाल करें। | Razorpay ಟೆಸ್ಟ್ ಮೋಡ್ ಹೊಂದಿಸಲಾಗಿದೆ; ನಿಜವಾದ ಚೆಕ್‌ಔಟ್ ಬಳಸಿ. | ☐ |
| `rerr.vendor_unavailable` | This vendor is not accepting orders. | यह विक्रेता अभी ऑर्डर नहीं ले रहा है। | ಈ ಮಾರಾಟಗಾರ ಈಗ ಆರ್ಡರ್ ಸ್ವೀಕರಿಸುತ್ತಿಲ್ಲ. | ☐ |
| `rerr.volunteer_name` | Enter the volunteer's name. | स्वयंसेवक का नाम लिखें। | ಸ್ವಯಂಸೇವಕರ ಹೆಸರನ್ನು ನಮೂದಿಸಿ. | ☐ |
| `rerr.volunteer_phone` | Enter a valid phone number for the volunteer. | स्वयंसेवक का सही फ़ोन नंबर लिखें। | ಸ್ವಯಂಸೇವಕರ ಸರಿಯಾದ ಫೋನ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ. | ☐ |
| `rerr.window_closed` | The pickup window has ended. | पिकअप का समय खत्म हो चुका है। | ಪಿಕಪ್ ಸಮಯ ಮುಗಿದಿದೆ. | ☐ |
| `rerr.window_closed_pickup_window_has` | The pickup window has ended for this listing. | इस लिस्टिंग के लिए पिकअप का समय खत्म हो चुका है। | ಈ ಲಿಸ್ಟಿಂಗ್‌ನ ಪಿಕಪ್ ಸಮಯ ಮುಗಿದಿದೆ. | ☐ |
| `rerr.window_invalid` | Pickup start and end are required. | पिकअप का शुरू और अंत का समय ज़रूरी है। | ಪಿಕಪ್ ಆರಂಭ ಮತ್ತು ಕೊನೆಯ ಸಮಯ ಅಗತ್ಯ. | ☐ |
| `rerr.window_order` | Pickup end must be after pickup start. | पिकअप का अंत समय शुरू समय के बाद का होना चाहिए। | ಪಿಕಪ್ ಕೊನೆಯ ಸಮಯ ಆರಂಭದ ನಂತರ ಇರಬೇಕು. | ☐ |
| `rerr.window_past` | Pickup start must be in the future. | पिकअप का शुरू समय भविष्य में होना चाहिए। | ಪಿಕಪ್ ಆರಂಭ ಸಮಯ ಭವಿಷ್ಯದಲ್ಲಿರಬೇಕು. | ☐ |
| `rerr.window_too_far` | Pickup must start within 12 hours of creating the listing. | पिकअप लिस्टिंग बनाने के 12 घंटे के भीतर शुरू होना चाहिए। | ಪಿಕಪ್ ಲಿಸ್ಟಿಂಗ್ ರಚಿಸಿದ 12 ಗಂಟೆಗಳ ಒಳಗೆ ಆರಂಭವಾಗಬೇಕು. | ☐ |
| `rerr.wrong_outlet` | This pickup pass is for a different outlet. | यह पिकअप पास किसी दूसरे आउटलेट का है। | ಈ ಪಿಕಪ್ ಪಾಸ್ ಬೇರೆ ಔಟ್‌ಲೆಟ್‌ಗೆ ಸೇರಿದ್ದು. | ☐ |
| `rerr.wrong_vendor` | This pickup pass belongs to a different vendor. | यह पिकअप पास किसी दूसरे विक्रेता का है। | ಈ ಪಿಕಪ್ ಪಾಸ್ ಬೇರೆ ಮಾರಾಟಗಾರರಿಗೆ ಸೇರಿದ್ದು. | ☐ |
| `rerr.zip_failed` | Could not create the zip. | ज़िप फ़ाइल नहीं बन सकी। | ಜಿಪ್ ಫೈಲ್ ರಚಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. | ☐ |

## review

| Key | English | हिन्दी | ಕನ್ನಡ | OK? |
|---|---|---|---|---|
| `review.hint` | You can rate once, within 48 hours of pickup. | आप पिकअप के 48 घंटे के भीतर एक बार रेट कर सकते हैं। | ಪಿಕಪ್ ಆದ 48 ಗಂಟೆಗಳ ಒಳಗೆ ಒಮ್ಮೆ ಮಾತ್ರ ರೇಟಿಂಗ್ ನೀಡಬಹುದು. | ☐ |
| `review.rating` | Rating | रेटिंग | ರೇಟಿಂಗ್ | ☐ |
| `review.stars_one` | {n} star | {n} स्टार | {n} ಸ್ಟಾರ್ | ☐ |
| `review.stars_other` | {n} stars | {n} स्टार | {n} ಸ್ಟಾರ್‌ಗಳು | ☐ |
| `review.submit` | Submit rating | रेटिंग भेजें | ರೇಟಿಂಗ್ ಸಲ್ಲಿಸಿ | ☐ |
| `review.textLabel` | Anything to add? (optional) | कुछ और जोड़ना है? (वैकल्पिक) | ಇನ್ನೇನಾದರೂ ಸೇರಿಸಬೇಕೇ? (ಐಚ್ಛಿಕ) | ☐ |
| `review.thanks` | Thanks for rating! Your feedback helps other customers. | रेटिंग के लिए धन्यवाद! आपकी राय दूसरे ग्राहकों के काम आती है। | ರೇಟಿಂಗ್‌ಗೆ ಧನ್ಯವಾದ! ನಿಮ್ಮ ಅಭಿಪ್ರಾಯ ಇತರ ಗ್ರಾಹಕರಿಗೆ ಸಹಾಯ ಮಾಡುತ್ತದೆ. | ☐ |
| `review.title` | Rate your order | अपने ऑर्डर को रेट करें | ನಿಮ್ಮ ಆರ್ಡರ್‌ಗೆ ರೇಟಿಂಗ್ ನೀಡಿ | ☐ |

## rs

| Key | English | हिन्दी | ಕನ್ನಡ | OK? |
|---|---|---|---|---|
| `rs.checking` | Checking… | जाँच हो रही है… | ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ… | ☐ |
| `rs.code` | Verification code | सत्यापन कोड | ಪರಿಶೀಲನಾ ಕೋಡ್ | ☐ |
| `rs.demoCode1` | Demo: no SMS is sent. Enter the code | डेमो: कोई SMS नहीं भेजा जाता। यह कोड दर्ज करें | ಡೆಮೊ: ಯಾವುದೇ SMS ಕಳುಹಿಸಲಾಗುವುದಿಲ್ಲ. ಈ ಕೋಡ್ ನಮೂದಿಸಿ | ☐ |
| `rs.demoCode2` | . | । | . | ☐ |
| `rs.enterCode` | Enter the 6-digit code for {phone}. | {phone} के लिए 6 अंकों का कोड दर्ज करें। | {phone} ಗಾಗಿ 6 ಅಂಕಿಯ ಕೋಡ್ ನಮೂದಿಸಿ. | ☐ |
| `rs.enterPhone` | Enter your mobile number. We'll send a code. | अपना मोबाइल नंबर दर्ज करें। हम एक कोड भेजेंगे। | ನಿಮ್ಮ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ. ನಾವು ಕೋಡ್ ಕಳುಹಿಸುತ್ತೇವೆ. | ☐ |
| `rs.firstTime` | (first time only) | (केवल पहली बार) | (ಮೊದಲ ಬಾರಿ ಮಾತ್ರ) | ☐ |
| `rs.label.customer` | customer | ग्राहक | ಗ್ರಾಹಕ | ☐ |
| `rs.label.ngo` | NGO | संस्था | ಸಂಸ್ಥೆ | ☐ |
| `rs.label.vendor` | vendor | वेंडर | ವೆಂಡರ್ | ☐ |
| `rs.mobile` | Mobile number | मोबाइल नंबर | ಮೊಬೈಲ್ ಸಂಖ್ಯೆ | ☐ |
| `rs.moreAccounts` | More demo accounts | और डेमो खाते | ಇನ್ನಷ್ಟು ಡೆಮೊ ಖಾತೆಗಳು | ☐ |
| `rs.name` | Your name | आपका नाम | ನಿಮ್ಮ ಹೆಸರು | ☐ |
| `rs.optionalFirst` | (optional, first time only) | (वैकल्पिक, केवल पहली बार) | (ಐಚ್ಛಿಕ, ಮೊದಲ ಬಾರಿ ಮಾತ್ರ) | ☐ |
| `rs.or` | or | या | ಅಥವಾ | ☐ |
| `rs.otherNumber` | Use a different number | दूसरा नंबर इस्तेमाल करें | ಬೇರೆ ಸಂಖ್ಯೆ ಬಳಸಿ | ☐ |
| `rs.pickOther` | Pick a different side | दूसरा पक्ष चुनें | ಬೇರೆ ಕಡೆ ಆರಿಸಿ | ☐ |
| `rs.referral` | Referral code | रेफ़रल कोड | ರೆಫರಲ್ ಕೋಡ್ | ☐ |
| `rs.sendCode` | Send code | कोड भेजें | ಕೋಡ್ ಕಳುಹಿಸಿ | ☐ |
| `rs.side` | {role} side | {role} पक्ष | {role} ಕಡೆ | ☐ |
| `rs.signInAs` | Sign in as a {role} | {role} के रूप में साइन इन करें | {role} ಆಗಿ ಸೈನ್ ಇನ್ ಮಾಡಿ | ☐ |
| `rs.skip` | Skip, use demo {role} | छोड़ें, डेमो {role} इस्तेमाल करें | ಬಿಟ್ಟು, ಡೆಮೊ {role} ಬಳಸಿ | ☐ |
| `rs.skipAria` | Skip sign-in and use the demo {role} account | साइन-इन छोड़ें और डेमो {role} खाता इस्तेमाल करें | ಸೈನ್ ಇನ್ ಬಿಟ್ಟು ಡೆಮೊ {role} ಖಾತೆ ಬಳಸಿ | ☐ |
| `rs.skipNote` | Demo only: signs you in as {name}. | केवल डेमो: आपको {name} के रूप में साइन इन करता है। | ಡೆಮೊ ಮಾತ್ರ: ನಿಮ್ಮನ್ನು {name} ಆಗಿ ಸೈನ್ ಇನ್ ಮಾಡುತ್ತದೆ. | ☐ |
| `rs.sub.customer` | Grab discounted surplus from kitchens near you tonight. | आज रात अपने पास के किचन से छूट पर बचा खाना पाएँ। | ಇಂದು ರಾತ್ರಿ ನಿಮ್ಮ ಹತ್ತಿರದ ಅಡುಗೆಮನೆಗಳಿಂದ ರಿಯಾಯಿತಿಯಲ್ಲಿ ಉಳಿದ ಆಹಾರ ಪಡೆಯಿರಿ. | ☐ |
| `rs.sub.ngo` | Claim free leftovers and get them to people who need them. | मुफ़्त बचा खाना लें और ज़रूरतमंद लोगों तक पहुँचाएँ। | ಉಚಿತ ಉಳಿದ ಆಹಾರ ಪಡೆದು ಅಗತ್ಯವಿರುವವರಿಗೆ ತಲುಪಿಸಿ. | ☐ |
| `rs.sub.vendor` | Turn today's extra into rescued meals in under a minute. | आज का बचा हुआ खाना एक मिनट से कम में बचाए गए भोजन में बदलें। | ಇಂದಿನ ಹೆಚ್ಚುವರಿ ಆಹಾರವನ್ನು ಒಂದು ನಿಮಿಷದೊಳಗೆ ಉಳಿಸಿದ ಊಟಗಳಾಗಿ ಬದಲಿಸಿ. | ☐ |
| `rs.switching` | You're signed in as {name} ({from}). Continuing here switches you to a {to} account. | आप {name} ({from}) के रूप में साइन इन हैं। यहाँ आगे बढ़ने पर आप {to} खाते में बदल जाएँगे। | ನೀವು {name} ({from}) ಆಗಿ ಸೈನ್ ಇನ್ ಆಗಿದ್ದೀರಿ. ಇಲ್ಲಿ ಮುಂದುವರಿದರೆ ನೀವು {to} ಖಾತೆಗೆ ಬದಲಾಗುತ್ತೀರಿ. | ☐ |
| `rs.title.customer` | FIND FOOD NEAR ME | पास में खाना खोजें | ಹತ್ತಿರದಲ್ಲಿ ಆಹಾರ ಹುಡುಕಿ | ☐ |
| `rs.title.ngo` | COLLECT AS AN NGO | संस्था बनकर खाना लें | ಸಂಸ್ಥೆಯಾಗಿ ಆಹಾರ ಪಡೆಯಿರಿ | ☐ |
| `rs.title.vendor` | LIST SURPLUS AS A VENDOR | वेंडर बनकर बचा खाना बेचें | ವೆಂಡರ್ ಆಗಿ ಉಳಿದ ಆಹಾರ ಮಾರಿ | ☐ |
| `rs.verify` | Verify and continue | सत्यापित करें और आगे बढ़ें | ಪರಿಶೀಲಿಸಿ ಮುಂದುವರಿಸಿ | ☐ |
| `rs.word.customer` | EAT | खाएँ | ತಿನ್ನಿ | ☐ |
| `rs.word.ngo` | FEED | खिलाएँ | ಉಣಿಸಿ | ☐ |
| `rs.word.vendor` | LIST | बेचें | ಮಾರಿ | ☐ |

## scan

| Key | English | हिन्दी | ಕನ್ನಡ | OK? |
|---|---|---|---|---|
| `scan.camUnavailable` | Camera unavailable ({reason}). Use the 4-digit code. | कैमरा उपलब्ध नहीं ({reason})। 4 अंकों का कोड इस्तेमाल करें। | ಕ್ಯಾಮೆರಾ ಲಭ್ಯವಿಲ್ಲ ({reason}). 4 ಅಂಕಿಯ ಕೋಡ್ ಬಳಸಿ. | ☐ |
| `scan.checking` | Checking… | जाँच हो रही है… | ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ… | ☐ |
| `scan.codeAria` | 4-digit pickup code | 4 अंकों का पिकअप कोड | 4 ಅಂಕಿಯ ಪಿಕಪ್ ಕೋಡ್ | ☐ |
| `scan.collect` | Collect ₹{amount} now (pay at pickup) — recorded as Paid at Pickup. | अभी ₹{amount} लें (पिकअप पर भुगतान) — 'पिकअप पर भुगतान किया' दर्ज होगा। | ಈಗ ₹{amount} ಪಡೆಯಿರಿ (ಪಿಕಪ್‌ನಲ್ಲಿ ಪಾವತಿ) — 'ಪಿಕಪ್‌ನಲ್ಲಿ ಪಾವತಿಸಲಾಗಿದೆ' ಎಂದು ದಾಖಲಾಗುತ್ತದೆ. | ☐ |
| `scan.enterCode` | Or enter the 4-digit code | या 4 अंकों का कोड डालें | ಅಥವಾ 4 ಅಂಕಿಯ ಕೋಡ್ ನಮೂದಿಸಿ | ☐ |
| `scan.handOver` | Hand over {qty} × {title}. Marked Picked up; code is now invalid. | {qty} × {title} सौंपें। 'ले लिया गया' दर्ज हो गया; कोड अब मान्य नहीं है। | {qty} × {title} ಹಸ್ತಾಂತರಿಸಿ. 'ತೆಗೆದುಕೊಳ್ಳಲಾಗಿದೆ' ಎಂದು ಗುರುತಿಸಲಾಗಿದೆ; ಕೋಡ್ ಈಗ ಅಮಾನ್ಯ. | ☐ |
| `scan.notAccepted` | NOT ACCEPTED | स्वीकार नहीं किया गया | ಸ್ವೀಕರಿಸಲಾಗಿಲ್ಲ | ☐ |
| `scan.onboarding` | Onboarding | ऑनबोर्डिंग | ಆನ್‌ಬೋರ್ಡಿಂಗ್ | ☐ |
| `scan.onlyApproved` | Only approved vendors can hand over orders. | सिर्फ़ स्वीकृत विक्रेता ही ऑर्डर सौंप सकते हैं। | ಅನುಮೋದಿತ ಮಾರಾಟಗಾರರು ಮಾತ್ರ ಆರ್ಡರ್ ಹಸ್ತಾಂತರಿಸಬಹುದು. | ☐ |
| `scan.permDenied` | permission denied | अनुमति नहीं मिली | ಅನುಮತಿ ನಿರಾಕರಿಸಲಾಗಿದೆ | ☐ |
| `scan.scanQr` | Scan pickup QR | पिकअप QR स्कैन करें | ಪಿಕಪ್ QR ಸ್ಕ್ಯಾನ್ ಮಾಡಿ | ☐ |
| `scan.startCam` | Start camera | कैमरा चालू करें | ಕ್ಯಾಮೆರಾ ಆರಂಭಿಸಿ | ☐ |
| `scan.stopCam` | Stop camera | कैमरा बंद करें | ಕ್ಯಾಮೆರಾ ನಿಲ್ಲಿಸಿ | ☐ |
| `scan.title` | SCAN & HAND OVER | स्कैन करें और सौंपें | ಸ್ಕ್ಯಾನ್ ಮಾಡಿ ಮತ್ತು ಹಸ್ತಾಂತರಿಸಿ | ☐ |
| `scan.verified` | VERIFIED · {ref} | सत्यापित · {ref} | ಪರಿಶೀಲಿಸಲಾಗಿದೆ · {ref} | ☐ |
| `scan.verify` | Verify & hand over | सत्यापित करें और सौंपें | ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಹಸ್ತಾಂತರಿಸಿ | ☐ |

## set

| Key | English | हिन्दी | ಕನ್ನಡ | OK? |
|---|---|---|---|---|
| `set.applyAnyway` | Apply anyway | फिर भी लागू करें | ಆದರೂ ಅನ್ವಯಿಸಿ | ☐ |
| `set.audit` | Change history | बदलाव इतिहास | ಬದಲಾವಣೆ ಇತಿಹಾಸ | ☐ |
| `set.flag.autoMarkdown` | Auto-markdown schedule | अपने आप कीमत घटाने का शेड्यूल | ತಾನಾಗಿ ಬೆಲೆ ಇಳಿಸುವ ವೇಳಾಪಟ್ಟಿ | ☐ |
| `set.flag.delivery` | Delivery hand-off | डिलीवरी हस्तांतरण | ಡೆಲಿವರಿ ಹಸ್ತಾಂತರ | ☐ |
| `set.flag.distributionLog` | Distribution log | वितरण लॉग | ವಿತರಣೆ ಲಾಗ್ | ☐ |
| `set.flag.donationReceipts` | Donation receipts | दान रसीदें | ದೇಣಿಗೆ ರಸೀದಿಗಳು | ☐ |
| `set.flag.i18n` | Language switcher | भाषा बदलने का विकल्प | ಭಾಷೆ ಬದಲಾಯಿಸುವ ಆಯ್ಕೆ | ☐ |
| `set.flag.impactCertificate` | Impact certificate | असर प्रमाणपत्र | ಪರಿಣಾಮ ಪ್ರಮಾಣಪತ್ರ | ☐ |
| `set.flag.liveEta` | Live ETA | लाइव पहुँचने का समय | ಲೈವ್ ತಲುಪುವ ಸಮಯ | ☐ |
| `set.flag.moderation` | Content moderation | सामग्री की निगरानी | ವಿಷಯ ಮಾಡರೇಶನ್ | ☐ |
| `set.flag.multiOutlet` | Multi-outlet and staff | कई आउटलेट और स्टाफ़ | ಬಹು ಔಟ್‌ಲೆಟ್ ಮತ್ತು ಸಿಬ್ಬಂದಿ | ☐ |
| `set.flag.platformSettings` | Platform settings screen | प्लैटफ़ॉर्म सेटिंग्स स्क्रीन | ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಸೆಟ್ಟಿಂಗ್ಸ್ ಪರದೆ | ☐ |
| `set.flag.priorityWindow` | Charity priority window | चैरिटी के लिए प्राथमिकता का समय | ದತ್ತಿ ಸಂಸ್ಥೆಗಳ ಆದ್ಯತಾ ಸಮಯ | ☐ |
| `set.flag.referrals` | Referral credits | रेफ़रल क्रेडिट | ರೆಫರಲ್ ಕ್ರೆಡಿಟ್‌ಗಳು | ☐ |
| `set.flags` | Feature flags | फ़ीचर फ़्लैग | ವೈಶಿಷ್ಟ್ಯ ಫ್ಲ್ಯಾಗ್‌ಗಳು | ☐ |
| `set.help` | Changes apply to new activity straight away (settings are cached for at most 60 seconds). Every change is recorded below. | बदलाव नई गतिविधि पर तुरंत लागू होते हैं (सेटिंग्स अधिकतम 60 सेकंड कैश होती हैं)। हर बदलाव नीचे दर्ज होता है। | ಬದಲಾವಣೆಗಳು ಹೊಸ ಚಟುವಟಿಕೆಗೆ ತಕ್ಷಣ ಅನ್ವಯಿಸುತ್ತವೆ (ಸೆಟ್ಟಿಂಗ್‌ಗಳು ಗರಿಷ್ಠ 60 ಸೆಕೆಂಡ್ ಕ್ಯಾಶ್ ಆಗುತ್ತವೆ). ಪ್ರತಿ ಬದಲಾವಣೆ ಕೆಳಗೆ ದಾಖಲಾಗುತ್ತದೆ. | ☐ |
| `set.keywords` | Moderation keywords | मॉडरेशन कीवर्ड | ಮಾಡರೇಶನ್ ಕೀವರ್ಡ್‌ಗಳು | ☐ |
| `set.keywordsHelp` | Comma-separated. A whole-word match sends an item to the moderation queue. | अल्पविराम से अलग करें। पूरे शब्द का मेल आइटम को मॉडरेशन कतार में भेजता है। | ಅಲ್ಪವಿರಾಮದಿಂದ ಬೇರ್ಪಡಿಸಿ. ಪೂರ್ಣ ಪದದ ಹೊಂದಾಣಿಕೆ ಐಟಂ ಅನ್ನು ಮಾಡರೇಶನ್ ಸರದಿಗೆ ಕಳುಹಿಸುತ್ತದೆ. | ☐ |
| `set.noAudit` | No changes yet. | अभी कोई बदलाव नहीं। | ಇನ್ನೂ ಬದಲಾವಣೆಗಳಿಲ್ಲ. | ☐ |
| `set.nothing` | Nothing has changed. | कुछ नहीं बदला। | ಏನೂ ಬದಲಾಗಿಲ್ಲ. | ☐ |
| `set.priority` | Charity priority-window options | संस्था प्राथमिकता-अवधि के विकल्प | ಸಂಸ್ಥೆಗಳ ಆದ್ಯತೆಯ ಅವಧಿ ಆಯ್ಕೆಗಳು | ☐ |
| `set.range` | Allowed {min} to {max} | मान्य {min} से {max} | ಅನುಮತಿ {min} ರಿಂದ {max} | ☐ |
| `set.saved` | Saved {n} change(s). | {n} बदलाव सहेजे गए। | {n} ಬದಲಾವಣೆ(ಗಳು) ಉಳಿಸಲಾಗಿದೆ. | ☐ |
| `set.spec.creditMaxPct.label` | Credit usable per order | प्रति ऑर्डर इस्तेमाल हो सकने वाला क्रेडिट | ಪ್ರತಿ ಆರ್ಡರ್‌ಗೆ ಬಳಸಬಹುದಾದ ಕ್ರೆಡಿಟ್ | ☐ |
| `set.spec.creditMaxPct.unit` | % of order value | ऑर्डर मूल्य का % | ಆರ್ಡರ್ ಮೌಲ್ಯದ % | ☐ |
| `set.spec.defaultRadiusKm.label` | Default search radius | डिफ़ॉल्ट खोज दायरा | ಡೀಫಾಲ್ಟ್ ಹುಡುಕಾಟ ವ್ಯಾಪ್ತಿ | ☐ |
| `set.spec.defaultRadiusKm.unit` | km | किमी | ಕಿಮೀ | ☐ |
| `set.spec.freeCancelMinutes.label` | Free cancellation window | मुफ़्त रद्दीकरण की अवधि | ಉಚಿತ ರದ್ದತಿ ಅವಧಿ | ☐ |
| `set.spec.freeCancelMinutes.unit` | minutes before pickup starts | पिकअप शुरू होने से कितने मिनट पहले | ಪಿಕಪ್ ಆರಂಭವಾಗುವ ಎಷ್ಟು ನಿಮಿಷ ಮೊದಲು | ☐ |
| `set.spec.holdMinutes.label` | Checkout hold time | चेकआउट होल्ड का समय | ಚೆಕ್‌ಔಟ್ ಹೋಲ್ಡ್ ಸಮಯ | ☐ |
| `set.spec.holdMinutes.unit` | minutes | मिनट | ನಿಮಿಷಗಳು | ☐ |
| `set.spec.maxActiveReservations.label` | Max active reservations per customer | प्रति ग्राहक अधिकतम सक्रिय आरक्षण | ಪ್ರತಿ ಗ್ರಾಹಕರಿಗೆ ಗರಿಷ್ಠ ಸಕ್ರಿಯ ಕಾಯ್ದಿರಿಸುವಿಕೆಗಳು | ☐ |
| `set.spec.maxActiveReservations.unit` | reservations | आरक्षण | ಕಾಯ್ದಿರಿಸುವಿಕೆಗಳು | ☐ |
| `set.spec.maxDiscountPct.label` | Maximum discount cap | अधिकतम छूट की सीमा | ಗರಿಷ್ಠ ರಿಯಾಯಿತಿ ಮಿತಿ | ☐ |
| `set.spec.maxDiscountPct.unit` | % off the original price | असली कीमत पर % छूट | ಮೂಲ ಬೆಲೆಯ ಮೇಲೆ % ರಿಯಾಯಿತಿ | ☐ |
| `set.spec.platformFeeBps.label` | Platform fee | प्लैटफ़ॉर्म शुल्क | ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಶುಲ್ಕ | ☐ |
| `set.spec.platformFeeBps.unit` | basis points (100 = 1%) | बेसिस पॉइंट (100 = 1%) | ಬೇಸಿಸ್ ಪಾಯಿಂಟ್‌ಗಳು (100 = 1%) | ☐ |
| `set.spec.referralCreditInr.label` | Referral credit | रेफ़रल क्रेडिट | ರೆಫರಲ್ ಕ್ರೆಡಿಟ್ | ☐ |
| `set.spec.referralCreditInr.unit` | ₹ each | ₹ प्रत्येक | ₹ ತಲಾ | ☐ |
| `set.title` | Platform settings | प्लैटफ़ॉर्म सेटिंग्स | ವೇದಿಕೆ ಸೆಟ್ಟಿಂಗ್‌ಗಳು | ☐ |
| `set.values` | Rules and limits | नियम और सीमाएँ | ನಿಯಮಗಳು ಮತ್ತು ಮಿತಿಗಳು | ☐ |
| `set.warnTitle` | This change affects things that are live right now: | यह बदलाव उन चीज़ों पर असर डालता है जो अभी चालू हैं: | ಈ ಬದಲಾವಣೆ ಈಗ ಚಾಲ್ತಿಯಲ್ಲಿರುವ ವಿಷಯಗಳ ಮೇಲೆ ಪರಿಣಾಮ ಬೀರುತ್ತದೆ: | ☐ |

## signin

| Key | English | हिन्दी | ಕನ್ನಡ | OK? |
|---|---|---|---|---|
| `signin.adminNote` | Admin access is provisioned by the platform and cannot be selected here. | एडमिन पहुँच प्लैटफ़ॉर्म देता है, इसे यहाँ चुना नहीं जा सकता। | ನಿರ್ವಾಹಕ ಪ್ರವೇಶವನ್ನು ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ನೀಡುತ್ತದೆ, ಇಲ್ಲಿ ಆಯ್ಕೆ ಮಾಡಲಾಗದು. | ☐ |
| `signin.demoHelp` | One click to switch roles. Fictional people and businesses. | एक क्लिक में भूमिका बदलें। काल्पनिक लोग और व्यवसाय। | ಒಂದೇ ಕ್ಲಿಕ್‌ನಲ್ಲಿ ಪಾತ್ರ ಬದಲಿಸಿ. ಕಾಲ್ಪನಿಕ ವ್ಯಕ್ತಿಗಳು ಮತ್ತು ವ್ಯವಹಾರಗಳು. | ☐ |
| `signin.demoTitle` | Demo accounts | डेमो खाते | ಡೆಮೊ ಖಾತೆಗಳು | ☐ |
| `signin.google` | Continue with Google | Google से जारी रखें | Google ಮೂಲಕ ಮುಂದುವರಿಯಿರಿ | ☐ |
| `signin.googleNote` | Google sign-in needs Supabase Auth credentials (see README → Outstanding dependencies). Not connected in this demo. | Google साइन इन के लिए Supabase Auth क्रेडेंशियल चाहिए (README → Outstanding dependencies देखें)। इस डेमो में जुड़ा नहीं है। | Google ಸೈನ್ ಇನ್‌ಗೆ Supabase Auth ಕ್ರೆಡೆನ್ಷಿಯಲ್‌ಗಳು ಬೇಕು (README → Outstanding dependencies ನೋಡಿ). ಈ ಡೆಮೊದಲ್ಲಿ ಸಂಪರ್ಕಿಸಿಲ್ಲ. | ☐ |
| `signin.iAm` | I am a | मैं हूँ | ನಾನು | ☐ |
| `signin.intro1` | Phone OTP or Google sign-in. In this demo build, SMS and Google are not connected: the OTP is simulated (use | फ़ोन OTP या Google से साइन इन। इस डेमो में SMS और Google जुड़े नहीं हैं: OTP नकली है (इस्तेमाल करें | ಫೋನ್ OTP ಅಥವಾ Google ಸೈನ್ ಇನ್. ಈ ಡೆಮೊ ಆವೃತ್ತಿಯಲ್ಲಿ SMS ಮತ್ತು Google ಸಂಪರ್ಕಿಸಿಲ್ಲ: OTP ಅನುಕರಣೆ (ಬಳಸಿ | ☐ |
| `signin.intro2` | ) and the Google button explains the missing credentials rather than pretending to work. | ), और Google बटन काम करने का दिखावा करने के बजाय बताता है कि क्रेडेंशियल नहीं हैं। | ), ಮತ್ತು Google ಬಟನ್ ಕೆಲಸ ಮಾಡುವಂತೆ ನಟಿಸದೆ ಕ್ರೆಡೆನ್ಷಿಯಲ್‌ಗಳು ಇಲ್ಲ ಎಂದು ವಿವರಿಸುತ್ತದೆ. | ☐ |
| `signin.name` | Name | नाम | ಹೆಸರು | ☐ |
| `signin.newTitle` | New account | नया खाता | ಹೊಸ ಖಾತೆ | ☐ |
| `signin.otp` | OTP | OTP | OTP | ☐ |
| `signin.otpNote` | Demo: no SMS was sent. Enter the simulated OTP | डेमो: कोई SMS नहीं भेजा गया। नकली OTP डालें | ಡೆಮೊ: ಯಾವುದೇ SMS ಕಳುಹಿಸಲಾಗಿಲ್ಲ. ಅನುಕರಣೆ OTP ನಮೂದಿಸಿ | ☐ |
| `signin.phone` | Phone | फ़ोन | ಫೋನ್ | ☐ |
| `signin.role.admin` | Admin | एडमिन | ನಿರ್ವಾಹಕ | ☐ |
| `signin.role.customer` | Customer | ग्राहक | ಗ್ರಾಹಕ | ☐ |
| `signin.role.ngo` | NGO | NGO | NGO | ☐ |
| `signin.role.vendor` | Vendor | विक्रेता | ಮಾರಾಟಗಾರ | ☐ |
| `signin.sendOtp` | Send OTP | OTP भेजें | OTP ಕಳುಹಿಸಿ | ☐ |
| `signin.title` | SIGN IN | साइन इन | ಸೈನ್ ಇನ್ | ☐ |
| `signin.verify` | Verify and continue | सत्यापित करें और आगे बढ़ें | ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಮುಂದುವರಿಯಿರಿ | ☐ |

## status

| Key | English | हिन्दी | ಕನ್ನಡ | OK? |
|---|---|---|---|---|
| `status.Actioned` | Actioned | कार्रवाई हुई | ಕ್ರಮ ಕೈಗೊಳ್ಳಲಾಗಿದೆ | ☐ |
| `status.Active` | Active | सक्रिय | ಸಕ್ರಿಯ | ☐ |
| `status.Approved` | Approved | स्वीकृत | ಅನುಮೋದಿಸಲಾಗಿದೆ | ☐ |
| `status.Cancelled` | Cancelled | रद्द | ರದ್ದಾಗಿದೆ | ☐ |
| `status.Claimed` | Claimed | दावा किया गया | ಕ್ಲೈಮ್ ಮಾಡಲಾಗಿದೆ | ☐ |
| `status.Collected` | Collected | ले लिया गया | ಸಂಗ್ರಹಿಸಲಾಗಿದೆ | ☐ |
| `status.Converted` | Converted | पूरा हुआ | ಪೂರ್ಣಗೊಂಡಿದೆ | ☐ |
| `status.Dismissed` | Dismissed | खारिज | ವಜಾಗೊಳಿಸಲಾಗಿದೆ | ☐ |
| `status.Draft` | Draft | ड्राफ़्ट | ಕರಡು | ☐ |
| `status.Expired` | Expired | समय समाप्त | ಅವಧಿ ಮುಗಿದಿದೆ | ☐ |
| `status.Failed` | Failed | विफल | ವಿಫಲವಾಗಿದೆ | ☐ |
| `status.Hold` | Hold | होल्ड पर | ತಡೆಹಿಡಿಯಲಾಗಿದೆ | ☐ |
| `status.Live` | Live | चालू | ಲೈವ್ | ☐ |
| `status.No-show` | No-show | नहीं आए | ಬರಲಿಲ್ಲ | ☐ |
| `status.Open` | Open | खुला | ತೆರೆದಿದೆ | ☐ |
| `status.Paid at Pickup` | Paid at Pickup | पिकअप पर भुगतान किया | ಪಿಕಪ್‌ನಲ್ಲಿ ಪಾವತಿಸಲಾಗಿದೆ | ☐ |
| `status.Paused` | Paused | रुका हुआ | ತಾತ್ಕಾಲಿಕವಾಗಿ ನಿಲ್ಲಿಸಲಾಗಿದೆ | ☐ |
| `status.Pending` | Pending | लंबित | ಬಾಕಿ ಇದೆ | ☐ |
| `status.Picked up` | Picked up | ले लिया गया | ತೆಗೆದುಕೊಳ್ಳಲಾಗಿದೆ | ☐ |
| `status.Ready` | Ready | तैयार | ಸಿದ್ಧ | ☐ |
| `status.Refund Pending` | Refund Pending | रिफ़ंड लंबित | ಮರುಪಾವತಿ ಬಾಕಿ ಇದೆ | ☐ |
| `status.Refunded` | Refunded | रिफ़ंड हो गया | ಮರುಪಾವತಿಸಲಾಗಿದೆ | ☐ |
| `status.Rejected` | Rejected | अस्वीकृत | ತಿರಸ್ಕರಿಸಲಾಗಿದೆ | ☐ |
| `status.Released` | Released | छोड़ दिया गया | ಬಿಡುಗಡೆ ಮಾಡಲಾಗಿದೆ | ☐ |
| `status.Reserved` | Reserved | आरक्षित | ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ | ☐ |
| `status.Sold Out` | Sold Out | खत्म | ಮುಗಿದಿದೆ | ☐ |
| `status.Test Payment Successful` | Test Payment Successful | टेस्ट भुगतान सफल | ಪರೀಕ್ಷಾ ಪಾವತಿ ಯಶಸ್ವಿ | ☐ |

## title

| Key | English | हिन्दी | ಕನ್ನಡ | OK? |
|---|---|---|---|---|
| `title.adminApprovals` | Admin · Approvals | एडमिन · स्वीकृतियाँ | ನಿರ್ವಾಹಕ · ಅನುಮೋದನೆಗಳು | ☐ |
| `title.adminFlagged` | Admin · Flagged | एडमिन · चिह्नित | ನಿರ್ವಾಹಕ · ಗುರುತಿಸಲಾದವು | ☐ |
| `title.adminHome` | City impact | शहर पर असर | ನಗರದ ಪರಿಣಾಮ | ☐ |
| `title.adminModeration` | Admin · Moderation | एडमिन · मॉडरेशन | ನಿರ್ವಾಹಕ · ಮಾಡರೇಶನ್ | ☐ |
| `title.adminReports` | Admin · Reports | एडमिन · रिपोर्ट | ನಿರ್ವಾಹಕ · ವರದಿಗಳು | ☐ |
| `title.adminSettings` | Admin · Platform settings | एडमिन · प्लेटफ़ॉर्म सेटिंग्स | ನಿರ್ವಾಹಕ · ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಸೆಟ್ಟಿಂಗ್ಸ್ | ☐ |
| `title.analytics` | Vendor · Analytics | विक्रेता · एनालिटिक्स | ಮಾರಾಟಗಾರ · ಅನಲಿಟಿಕ್ಸ್ | ☐ |
| `title.checkout` | Checkout | चेकआउट | ಚೆಕ್‌ಔಟ್ | ☐ |
| `title.default` | SAVE A PLATE — rescue surplus food in Bengaluru | SAVE A PLATE — बेंगलुरु में बचा हुआ खाना बचाएँ | SAVE A PLATE — ಬೆಂಗಳೂರಿನಲ್ಲಿ ಉಳಿದ ಆಹಾರವನ್ನು ಉಳಿಸಿ | ☐ |
| `title.description` | Rescuing good food, reducing waste, and making every meal count. | अच्छा खाना बचाना, बर्बादी घटाना, और हर खाने को काम का बनाना। | ಒಳ್ಳೆಯ ಆಹಾರವನ್ನು ಉಳಿಸುವುದು, ವ್ಯರ್ಥ ಕಡಿಮೆ ಮಾಡುವುದು, ಪ್ರತಿ ಊಟವನ್ನು ಅರ್ಥಪೂರ್ಣಗೊಳಿಸುವುದು. | ☐ |
| `title.discover` | Discover | खोजें | ಹುಡುಕಿ | ☐ |
| `title.donationFeed` | Donation feed | दान फ़ीड | ದಾನ ಫೀಡ್ | ☐ |
| `title.editListing` | Edit listing | लिस्टिंग बदलें | ಲಿಸ್ಟಿಂಗ್ ಸಂಪಾದಿಸಿ | ☐ |
| `title.following` | Following | फ़ॉलो कर रहे हैं | ಅನುಸರಿಸುತ್ತಿರುವವು | ☐ |
| `title.impact` | My impact | मेरा असर | ನನ್ನ ಪರಿಣಾಮ | ☐ |
| `title.join` | Join a team | टीम से जुड़ें | ತಂಡಕ್ಕೆ ಸೇರಿ | ☐ |
| `title.ngoOnboarding` | NGO verification | NGO सत्यापन | NGO ಪರಿಶೀಲನೆ | ☐ |
| `title.orders` | My orders | मेरे ऑर्डर | ನನ್ನ ಆರ್ಡರ್‌ಗಳು | ☐ |
| `title.payouts` | Vendor · Payouts | विक्रेता · भुगतान | ಮಾರಾಟಗಾರ · ಪಾವತಿಗಳು | ☐ |
| `title.pickupPass` | Pickup pass | पिकअप पास | ಪಿಕಪ್ ಪಾಸ್ | ☐ |
| `title.quickList` | Quick list | तुरंत लिस्ट करें | ತ್ವರಿತ ಲಿಸ್ಟ್ | ☐ |
| `title.receipts` | Donation receipts | दान की रसीदें | ದಾನದ ರಸೀದಿಗಳು | ☐ |
| `title.referrals` | Credit and referrals | क्रेडिट और रेफ़रल | ಕ್ರೆಡಿಟ್ ಮತ್ತು ರೆಫರಲ್‌ಗಳು | ☐ |
| `title.scan` | Scan & hand over | स्कैन करें और सौंपें | ಸ್ಕ್ಯಾನ್ ಮಾಡಿ ಹಸ್ತಾಂತರಿಸಿ | ☐ |
| `title.signin` | Sign in | साइन इन | ಸೈನ್ ಇನ್ | ☐ |
| `title.team` | Team and outlets | टीम और आउटलेट | ತಂಡ ಮತ್ತು ಔಟ್‌ಲೆಟ್‌ಗಳು | ☐ |
| `title.vendorOnboarding` | Vendor onboarding | विक्रेता ऑनबोर्डिंग | ಮಾರಾಟಗಾರ ಆನ್‌ಬೋರ್ಡಿಂಗ್ | ☐ |
| `title.vendorToday` | Vendor · Today | विक्रेता · आज | ಮಾರಾಟಗಾರ · ಇಂದು | ☐ |
| `title.verify` | Verify certificate | सर्टिफ़िकेट जाँचें | ಪ್ರಮಾಣಪತ್ರ ಪರಿಶೀಲಿಸಿ | ☐ |
| `title.volunteer` | Volunteer pickup | स्वयंसेवक पिकअप | ಸ್ವಯಂಸೇವಕ ಪಿಕಪ್ | ☐ |

## vanalytics

| Key | English | हिन्दी | ಕನ್ನಡ | OK? |
|---|---|---|---|---|
| `vanalytics.avgRating` | Average rating | औसत रेटिंग | ಸರಾಸರಿ ರೇಟಿಂಗ್ | ☐ |
| `vanalytics.bestHours` | Best-selling hours | सबसे ज़्यादा बिक्री के घंटे | ಅತ್ಯಧಿಕ ಮಾರಾಟದ ಗಂಟೆಗಳು | ☐ |
| `vanalytics.dateRange` | Date range | तारीख़ की सीमा | ದಿನಾಂಕ ವ್ಯಾಪ್ತಿ | ☐ |
| `vanalytics.days` | {n} days | {n} दिन | {n} ದಿನಗಳು | ☐ |
| `vanalytics.hourChart` | Units collected by hour of day | दिन के हर घंटे में ली गई यूनिट | ದಿನದ ಪ್ರತಿ ಗಂಟೆಯಲ್ಲಿ ಸಂಗ್ರಹಿಸಿದ ಯೂನಿಟ್‌ಗಳು | ☐ |
| `vanalytics.istNote` | IST, units collected | IST, ली गई यूनिट | IST, ಸಂಗ್ರಹಿಸಿದ ಯೂನಿಟ್‌ಗಳು | ☐ |
| `vanalytics.noActivity` | No activity in the last {n} days | पिछले {n} दिनों में कोई गतिविधि नहीं | ಕಳೆದ {n} ದಿನಗಳಲ್ಲಿ ಯಾವುದೇ ಚಟುವಟಿಕೆ ಇಲ್ಲ | ☐ |
| `vanalytics.noActivityBody` | Publish a listing and complete a handover to see numbers here. | लिस्टिंग डालें और एक हस्तांतरण पूरा करें, फिर आँकड़े यहाँ दिखेंगे। | ಲಿಸ್ಟಿಂಗ್ ಪ್ರಕಟಿಸಿ ಮತ್ತು ಒಂದು ಹಸ್ತಾಂತರ ಪೂರ್ಣಗೊಳಿಸಿ, ಸಂಖ್ಯೆಗಳು ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತವೆ. | ☐ |
| `vanalytics.noSales` | No sales yet. | अभी कोई बिक्री नहीं। | ಇನ್ನೂ ಮಾರಾಟ ಇಲ್ಲ. | ☐ |
| `vanalytics.outletCaption` | Results per outlet, last {n} days | हर आउटलेट के नतीजे, पिछले {n} दिन | ಪ್ರತಿ ಔಟ್‌ಲೆಟ್‌ನ ಫಲಿತಾಂಶ, ಕಳೆದ {n} ದಿನಗಳು | ☐ |
| `vanalytics.perDay` | ₹ recovered per day | हर दिन वसूले गए ₹ | ದಿನಕ್ಕೆ ವಸೂಲಾದ ₹ | ☐ |
| `vanalytics.perDayChart` | Rupees recovered per day, last {n} days | हर दिन वसूले गए रुपये, पिछले {n} दिन | ದಿನಕ್ಕೆ ವಸೂಲಾದ ರೂಪಾಯಿಗಳು, ಕಳೆದ {n} ದಿನಗಳು | ☐ |
| `vanalytics.recovered` | ₹ recovered | वसूले गए ₹ | ವಸೂಲಾದ ₹ | ☐ |
| `vanalytics.sellThrough` | Sell-through | बिक्री दर | ಮಾರಾಟ ಪ್ರಮಾಣ | ☐ |
| `vanalytics.sold` | Sold | बिकी | ಮಾರಾಟ | ☐ |
| `vanalytics.summary` | Summary | सारांश | ಸಾರಾಂಶ | ☐ |
| `vanalytics.title` | ANALYTICS | विश्लेषण | ವಿಶ್ಲೇಷಣೆ | ☐ |
| `vanalytics.top` | Top: {list} | सबसे ऊपर: {list} | ಅಗ್ರ: {list} | ☐ |
| `vanalytics.unitsSold` | Units sold | बिकी यूनिट | ಮಾರಾಟವಾದ ಯೂನಿಟ್‌ಗಳು | ☐ |
| `vanalytics.whyOnboard` | Complete vendor onboarding to see analytics. | विश्लेषण देखने के लिए विक्रेता ऑनबोर्डिंग पूरी करें। | ವಿಶ್ಲೇಷಣೆ ನೋಡಲು ಮಾರಾಟಗಾರ ಆನ್‌ಬೋರ್ಡಿಂಗ್ ಪೂರ್ಣಗೊಳಿಸಿ. | ☐ |
| `vanalytics.whyRole` | Analytics are visible to owners and managers. | विश्लेषण सिर्फ़ मालिक और मैनेजर देख सकते हैं। | ವಿಶ್ಲೇಷಣೆ ಮಾಲೀಕರಿಗೆ ಮತ್ತು ಮ್ಯಾನೇಜರ್‌ಗಳಿಗೆ ಮಾತ್ರ ಕಾಣಿಸುತ್ತದೆ. | ☐ |

## vdash

| Key | English | हिन्दी | ಕನ್ನಡ | OK? |
|---|---|---|---|---|
| `vdash.appStatus` | Application {status}. | आवेदन {status}। | ಅರ್ಜಿ {status}. | ☐ |
| `vdash.cancelPrompt` | Reason for cancelling? Customers will see it. Outstanding orders are cancelled and online payments refunded (test mode). | रद्द करने का कारण? ग्राहक इसे देखेंगे। बाकी ऑर्डर रद्द होंगे और ऑनलाइन भुगतान वापस होंगे (टेस्ट मोड)। | ರದ್ದುಮಾಡಲು ಕಾರಣ? ಗ್ರಾಹಕರಿಗೆ ಕಾಣಿಸುತ್ತದೆ. ಬಾಕಿ ಆರ್ಡರ್‌ಗಳು ರದ್ದಾಗುತ್ತವೆ ಮತ್ತು ಆನ್‌ಲೈನ್ ಪಾವತಿಗಳು ಮರುಪಾವತಿಯಾಗುತ್ತವೆ (ಪರೀಕ್ಷಾ ಮೋಡ್). | ☐ |
| `vdash.cancelled` | Cancelled. {n} refund(s) issued. | रद्द किया गया। {n} रिफ़ंड जारी किए गए। | ರದ್ದುಮಾಡಲಾಗಿದೆ. {n} ಮರುಪಾವತಿ(ಗಳು) ನೀಡಲಾಗಿದೆ. | ☐ |
| `vdash.checkCode` | check the collection code | कलेक्शन कोड जाँचें | ಸಂಗ್ರಹ ಕೋಡ್ ಪರಿಶೀಲಿಸಿ | ☐ |
| `vdash.claimedBy` | Claimed by | इन्होंने लिया: | ಇವರು ಕ್ಲೈಮ್ ಮಾಡಿದ್ದಾರೆ: | ☐ |
| `vdash.col.actions` | Actions | कार्रवाई | ಕ್ರಮಗಳು | ☐ |
| `vdash.col.donateRest` | Donate rest | बाकी दान | ಉಳಿದದ್ದು ದಾನ | ☐ |
| `vdash.col.left` | Left | बाकी | ಉಳಿದಿದೆ | ☐ |
| `vdash.col.listing` | Listing | लिस्टिंग | ಲಿಸ್ಟಿಂಗ್ | ☐ |
| `vdash.col.price` | Price | कीमत | ಬೆಲೆ | ☐ |
| `vdash.col.status` | Status | स्थिति | ಸ್ಥಿತಿ | ☐ |
| `vdash.col.window` | Window | समय | ಸಮಯ | ☐ |
| `vdash.collect` | collect ₹{amount} | ₹{amount} लें | ₹{amount} ಪಡೆಯಿರಿ | ☐ |
| `vdash.collectBy` | Collect by {time} · from listing {id} | {time} तक लें · लिस्टिंग {id} से | {time} ರೊಳಗೆ ಪಡೆಯಿರಿ · ಲಿಸ್ಟಿಂಗ್ {id} ನಿಂದ | ☐ |
| `vdash.collectedToday` | Collected today (demo ₹) | आज वसूला गया (डेमो ₹) | ಇಂದು ಸಂಗ್ರಹಿಸಿದ್ದು (ಡೆಮೊ ₹) | ☐ |
| `vdash.completeOnb` | Complete onboarding to start listing surplus food. | बचा हुआ खाना लिस्ट करना शुरू करने के लिए ऑनबोर्डिंग पूरी करें। | ಉಳಿದ ಆಹಾರವನ್ನು ಪಟ್ಟಿ ಮಾಡಲು ಆನ್‌ಬೋರ್ಡಿಂಗ್ ಪೂರ್ಣಗೊಳಿಸಿ. | ☐ |
| `vdash.completeProfile` | Complete your profile | अपनी प्रोफ़ाइल पूरी करें | ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಪೂರ್ಣಗೊಳಿಸಿ | ☐ |
| `vdash.donations` | Donations | दान | ದೇಣಿಗೆಗಳು | ☐ |
| `vdash.duplicate` | Duplicate | प्रतिलिपि बनाएँ | ನಕಲು ಮಾಡಿ | ☐ |
| `vdash.fromNoShow` | From no-show orders | न आने वाले ऑर्डर से | ಬರದ ಆರ್ಡರ್‌ಗಳಿಂದ | ☐ |
| `vdash.glance` | Today at a glance | आज एक नज़र में | ಇಂದು ಒಂದು ನೋಟದಲ್ಲಿ | ☐ |
| `vdash.handedOver` | Handed over {time} | {time} पर सौंपा गया | {time} ಕ್ಕೆ ಹಸ್ತಾಂತರಿಸಲಾಗಿದೆ | ☐ |
| `vdash.handoverOk` | Handover verified. Donation recorded. | हस्तांतरण सत्यापित। दान दर्ज हो गया। | ಹಸ್ತಾಂತರ ಪರಿಶೀಲಿಸಲಾಗಿದೆ. ದೇಣಿಗೆ ದಾಖಲಾಗಿದೆ. | ☐ |
| `vdash.handoverVerified` | Handover verified {time} · Donation recorded | {time} पर हस्तांतरण सत्यापित · दान दर्ज हो गया | {time} ಕ್ಕೆ ಹಸ್ತಾಂತರ ಪರಿಶೀಲಿಸಲಾಗಿದೆ · ದೇಣಿಗೆ ದಾಖಲಾಗಿದೆ | ☐ |
| `vdash.listings` | Listings | लिस्टिंग | ಲಿಸ್ಟಿಂಗ್‌ಗಳು | ☐ |
| `vdash.liveListings` | Live listings | चालू लिस्टिंग | ಲೈವ್ ಲಿಸ್ಟಿಂಗ್‌ಗಳು | ☐ |
| `vdash.liveOrders` | Live orders | चालू ऑर्डर | ಲೈವ್ ಆರ್ಡರ್‌ಗಳು | ☐ |
| `vdash.markReady` | Mark ready | तैयार दर्ज करें | ಸಿದ್ಧ ಎಂದು ಗುರುತಿಸಿ | ☐ |
| `vdash.miss.address` | Address | पता | ವಿಳಾಸ | ☐ |
| `vdash.miss.fssai` | FSSAI number | FSSAI नंबर | FSSAI ಸಂಖ್ಯೆ | ☐ |
| `vdash.miss.hours` | Operating hours | खुलने का समय | ಕಾರ್ಯನಿರ್ವಹಣೆ ಸಮಯ | ☐ |
| `vdash.miss.logo` | Logo | लोगो | ಲೋಗೋ | ☐ |
| `vdash.miss.map` | Map location (lat/lng) | नक्शे पर स्थान (अक्षांश/देशांतर) | ನಕ್ಷೆ ಸ್ಥಳ (ಅಕ್ಷಾಂಶ/ರೇಖಾಂಶ) | ☐ |
| `vdash.miss.upi` | Payout UPI | भुगतान पाने की UPI | ಪಾವತಿ ಪಡೆಯುವ UPI | ☐ |
| `vdash.missing` | Missing: {list}. | बाकी: {list}। | ಬಾಕಿ ಇರುವುದು: {list}. | ☐ |
| `vdash.ngoCode` | NGO collection code | NGO का कलेक्शन कोड | NGO ಸಂಗ್ರಹ ಕೋಡ್ | ☐ |
| `vdash.noBatches` | No donation batches yet. Turn on “Donate the rest at window end” when listing. | अभी कोई दान बैच नहीं। लिस्टिंग करते समय “समय खत्म होने पर बाकी दान करें” चालू करें। | ಇನ್ನೂ ದೇಣಿಗೆ ಬ್ಯಾಚ್‌ಗಳಿಲ್ಲ. ಲಿಸ್ಟಿಂಗ್ ಮಾಡುವಾಗ “ಸಮಯ ಮುಗಿದಾಗ ಉಳಿದದ್ದನ್ನು ದಾನ ಮಾಡಿ” ಆನ್ ಮಾಡಿ. | ☐ |
| `vdash.noTemplates` | No templates yet. Use “Save as template” on any listing below, then repost it in one tap. | अभी कोई टेम्पलेट नहीं। नीचे किसी भी लिस्टिंग पर “टेम्पलेट के रूप में सहेजें” दबाएँ, फिर एक टैप में दोबारा डालें। | ಇನ್ನೂ ಟೆಂಪ್ಲೇಟ್‌ಗಳಿಲ್ಲ. ಕೆಳಗಿನ ಯಾವುದೇ ಲಿಸ್ಟಿಂಗ್‌ನಲ್ಲಿ “ಟೆಂಪ್ಲೇಟ್ ಆಗಿ ಉಳಿಸಿ” ಬಳಸಿ, ನಂತರ ಒಂದೇ ಟ್ಯಾಪ್‌ನಲ್ಲಿ ಮತ್ತೆ ಹಾಕಿ. | ☐ |
| `vdash.none` | None | कोई नहीं | ಯಾವುದೂ ಇಲ್ಲ | ☐ |
| `vdash.online` | Online | ऑनलाइन | ಆನ್‌ಲೈನ್ | ☐ |
| `vdash.onlyApproved` | Only approved vendors can publish listings or accept reservations. | सिर्फ़ स्वीकृत विक्रेता ही लिस्टिंग डाल सकते हैं या आरक्षण ले सकते हैं। | ಅನುಮೋದಿತ ಮಾರಾಟಗಾರರು ಮಾತ್ರ ಲಿಸ್ಟಿಂಗ್ ಪ್ರಕಟಿಸಬಹುದು ಅಥವಾ ಕಾಯ್ದಿರಿಸುವಿಕೆ ಸ್ವೀಕರಿಸಬಹುದು. | ☐ |
| `vdash.pause` | Pause | रोकें | ನಿಲ್ಲಿಸಿ | ☐ |
| `vdash.photo` | photo | फ़ोटो | ಫೋಟೋ | ☐ |
| `vdash.pickup` | Pickup {window} | पिकअप {window} | ಪಿಕಪ್ {window} | ☐ |
| `vdash.pickups30` | Pickups in next 30 min | अगले 30 मिनट में पिकअप | ಮುಂದಿನ 30 ನಿಮಿಷದಲ್ಲಿ ಪಿಕಪ್‌ಗಳು | ☐ |
| `vdash.profile` | Profile {pct}% complete. | प्रोफ़ाइल {pct}% पूरी। | ಪ್ರೊಫೈಲ್ {pct}% ಪೂರ್ಣ. | ☐ |
| `vdash.reason` | Reason: {reason}. | कारण: {reason}। | ಕಾರಣ: {reason}. | ☐ |
| `vdash.resume` | Resume | फिर शुरू करें | ಮುಂದುವರಿಸಿ | ☐ |
| `vdash.saveTemplate` | Save as template | टेम्पलेट के रूप में सहेजें | ಟೆಂಪ್ಲೇಟ್ ಆಗಿ ಉಳಿಸಿ | ☐ |
| `vdash.scanOrEnter` | Scan or enter code | स्कैन करें या कोड डालें | ಸ್ಕ್ಯಾನ್ ಮಾಡಿ ಅಥವಾ ಕೋಡ್ ನಮೂದಿಸಿ | ☐ |
| `vdash.settings` | Settings | सेटिंग्स | ಸೆಟ್ಟಿಂಗ್‌ಗಳು | ☐ |
| `vdash.startOnb` | Start vendor onboarding | विक्रेता ऑनबोर्डिंग शुरू करें | ಮಾರಾಟಗಾರ ಆನ್‌ಬೋರ್ಡಿಂಗ್ ಆರಂಭಿಸಿ | ☐ |
| `vdash.templates` | Templates | टेम्पलेट | ಟೆಂಪ್ಲೇಟ್‌ಗಳು | ☐ |
| `vdash.today` | TODAY | आज | ಇಂದು | ☐ |
| `vdash.tplLine` | ₹{price} · {qty} units · {min} min window | ₹{price} · {qty} यूनिट · {min} मिनट का समय | ₹{price} · {qty} ಯೂನಿಟ್ · {min} ನಿಮಿಷದ ಸಮಯ | ☐ |
| `vdash.unitsLeft` | Units left | बची हुई यूनिट | ಉಳಿದ ಯೂನಿಟ್‌ಗಳು | ☐ |
| `vdash.updateResubmit` | Update and resubmit | अपडेट करके दोबारा भेजें | ಅಪ್‌ಡೇಟ್ ಮಾಡಿ ಮತ್ತೆ ಸಲ್ಲಿಸಿ | ☐ |
| `vdash.verifyHandover` | Verify handover | हस्तांतरण सत्यापित करें | ಹಸ್ತಾಂತರ ಪರಿಶೀಲಿಸಿ | ☐ |
| `vdash.viewApp` | View application | आवेदन देखें | ಅರ್ಜಿ ನೋಡಿ | ☐ |
| `vdash.volunteerComing` | Volunteer coming: | स्वयंसेवक आ रहे हैं: | ಸ್ವಯಂಸೇವಕರು ಬರುತ್ತಿದ್ದಾರೆ: | ☐ |
| `vdash.waitingNgo` | Waiting for an approved NGO to claim. | किसी स्वीकृत NGO के लेने का इंतज़ार है। | ಅನುಮೋದಿತ NGO ಕ್ಲೈಮ್ ಮಾಡುವುದನ್ನು ಕಾಯಲಾಗುತ್ತಿದೆ. | ☐ |
| `vdash.welcome` | WELCOME | स्वागत है | ಸ್ವಾಗತ | ☐ |

## vform

| Key | English | हिन्दी | ಕನ್ನಡ | OK? |
|---|---|---|---|---|
| `vform.allergens` | Allergens (optional — only what you know) | एलर्जी वाली चीज़ें (वैकल्पिक — सिर्फ़ जो आपको पता हो) | ಅಲರ್ಜಿಕಾರಕಗಳು (ಐಚ್ಛಿಕ — ನಿಮಗೆ ತಿಳಿದಿರುವುದು ಮಾತ್ರ) | ☐ |
| `vform.applySuggested` | Apply suggested price ₹{price} | सुझाई गई कीमत ₹{price} लगाएँ | ಸಲಹೆ ನೀಡಿದ ಬೆಲೆ ₹{price} ಅನ್ವಯಿಸಿ | ☐ |
| `vform.backToday` | Back to today | आज पर वापस जाएँ | ಇಂದಿಗೆ ಹಿಂತಿರುಗಿ | ☐ |
| `vform.category` | Category * | श्रेणी * | ವರ್ಗ * | ☐ |
| `vform.choose` | — Choose — | — चुनें — | — ಆಯ್ಕೆಮಾಡಿ — | ☐ |
| `vform.declaration` | Food-safety declaration * | खाद्य-सुरक्षा घोषणा * | ಆಹಾರ ಸುರಕ್ಷತಾ ಘೋಷಣೆ * | ☐ |
| `vform.declarationBody` | — I confirm this food was prepared and stored hygienically, the details above are accurate, and it is fit to eat within the stated time. | — पुष्टि की जाती है कि यह खाना साफ़-सफ़ाई से बनाया और रखा गया है, ऊपर दी गई जानकारी सही है, और यह बताए गए समय तक खाने योग्य है। | — ಈ ಆಹಾರವನ್ನು ಶುಚಿಯಾಗಿ ತಯಾರಿಸಿ ಸಂಗ್ರಹಿಸಲಾಗಿದೆ, ಮೇಲಿನ ವಿವರಗಳು ಸರಿಯಾಗಿವೆ ಮತ್ತು ತಿಳಿಸಿದ ಸಮಯದೊಳಗೆ ತಿನ್ನಲು ಯೋಗ್ಯವಾಗಿದೆ ಎಂದು ನಾನು ದೃಢೀಕರಿಸುತ್ತೇನೆ. | ☐ |
| `vform.decrease` | Decrease | घटाएँ | ಕಡಿಮೆ ಮಾಡಿ | ☐ |
| `vform.description` | Description | विवरण | ವಿವರಣೆ | ☐ |
| `vform.diet` | Diet * (exactly one) | खान-पान * (सिर्फ़ एक) | ಆಹಾರ ಪದ್ಧತಿ * (ಒಂದೇ ಆಯ್ಕೆ) | ☐ |
| `vform.donateRest` | Donate the rest at window end | समय खत्म होने पर बाकी दान करें | ಸಮಯ ಮುಗಿದಾಗ ಉಳಿದದ್ದನ್ನು ದಾನ ಮಾಡಿ | ☐ |
| `vform.donateRestHelp` | Unreserved units become one free batch for verified NGOs, if still safe. | जो यूनिट आरक्षित नहीं हुईं, वे सत्यापित NGO के लिए एक मुफ़्त बैच बन जाती हैं, अगर अब भी सुरक्षित हों। | ಕಾಯ್ದಿರಿಸದ ಯೂನಿಟ್‌ಗಳು, ಇನ್ನೂ ಸುರಕ್ಷಿತವಾಗಿದ್ದರೆ, ಪರಿಶೀಲಿತ NGO ಗಳಿಗೆ ಒಂದು ಉಚಿತ ಬ್ಯಾಚ್ ಆಗುತ್ತವೆ. | ☐ |
| `vform.donationOnly` | Donation-only | सिर्फ़ दान | ದೇಣಿಗೆ ಮಾತ್ರ | ☐ |
| `vform.donationOnlyHelp` | Never sold. Goes straight to verified NGOs. | कभी बेचा नहीं जाता। सीधे सत्यापित NGO को जाता है। | ಎಂದಿಗೂ ಮಾರಾಟವಾಗುವುದಿಲ್ಲ. ನೇರವಾಗಿ ಪರಿಶೀಲಿತ NGO ಗಳಿಗೆ ಹೋಗುತ್ತದೆ. | ☐ |
| `vform.donationOnlyNote` | Donation-only: no price. Charities can claim it free until the pickup window ends. | सिर्फ़ दान: कोई कीमत नहीं। पिकअप का समय खत्म होने तक चैरिटी इसे मुफ़्त ले सकती हैं। | ದೇಣಿಗೆ ಮಾತ್ರ: ಬೆಲೆ ಇಲ್ಲ. ಪಿಕಪ್ ಸಮಯ ಮುಗಿಯುವವರೆಗೆ ದತ್ತಿ ಸಂಸ್ಥೆಗಳು ಉಚಿತವಾಗಿ ಪಡೆಯಬಹುದು. | ☐ |
| `vform.editNote` | {n} unit(s) already reserved or held — total quantity cannot go below that. Price changes do not affect existing orders. | {n} यूनिट पहले से आरक्षित या होल्ड पर हैं — कुल मात्रा इससे कम नहीं हो सकती। कीमत बदलने से मौजूदा ऑर्डर पर असर नहीं पड़ता। | {n} ಯೂನಿಟ್(ಗಳು) ಈಗಾಗಲೇ ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ ಅಥವಾ ಹೋಲ್ಡ್‌ನಲ್ಲಿವೆ — ಒಟ್ಟು ಪ್ರಮಾಣ ಅದಕ್ಕಿಂತ ಕಡಿಮೆ ಆಗುವಂತಿಲ್ಲ. ಬೆಲೆ ಬದಲಾವಣೆ ಈಗಿರುವ ಆರ್ಡರ್‌ಗಳ ಮೇಲೆ ಪರಿಣಾಮ ಬೀರುವುದಿಲ್ಲ. | ☐ |
| `vform.editTitle` | EDIT LISTING | लिस्टिंग बदलें | ಲಿಸ್ಟಿಂಗ್ ಸಂಪಾದಿಸಿ | ☐ |
| `vform.foodTitle` | Food title * | खाने का नाम * | ಆಹಾರದ ಹೆಸರು * | ☐ |
| `vform.goOnboarding` | Go to onboarding | ऑनबोर्डिंग पर जाएँ | ಆನ್‌ಬೋರ್ಡಿಂಗ್‌ಗೆ ಹೋಗಿ | ☐ |
| `vform.historyUsed` | based on your last 7 days | आपके पिछले 7 दिनों के आधार पर | ನಿಮ್ಮ ಕಳೆದ 7 ದಿನಗಳ ಆಧಾರದ ಮೇಲೆ | ☐ |
| `vform.increase` | Increase | बढ़ाएँ | ಹೆಚ್ಚಿಸಿ | ☐ |
| `vform.noHistory` | no history yet | अभी कोई इतिहास नहीं | ಇನ್ನೂ ಇತಿಹಾಸ ಇಲ್ಲ | ☐ |
| `vform.notRoleBody` | Your {role} role can handle orders but not create listings. Ask the owner or a manager. | आपकी {role} भूमिका ऑर्डर संभाल सकती है, लिस्टिंग नहीं बना सकती। मालिक या मैनेजर से कहें। | ನಿಮ್ಮ {role} ಪಾತ್ರ ಆರ್ಡರ್‌ಗಳನ್ನು ನಿರ್ವಹಿಸಬಹುದು, ಆದರೆ ಲಿಸ್ಟಿಂಗ್ ರಚಿಸಲಾಗದು. ಮಾಲೀಕರನ್ನು ಅಥವಾ ಮ್ಯಾನೇಜರ್ ಅನ್ನು ಕೇಳಿ. | ☐ |
| `vform.notRoleTitle` | NOT FOR YOUR ROLE | आपकी भूमिका के लिए नहीं | ನಿಮ್ಮ ಪಾತ್ರಕ್ಕೆ ಅಲ್ಲ | ☐ |
| `vform.notStarted` | not started | शुरू नहीं हुआ | ಆರಂಭವಾಗಿಲ್ಲ | ☐ |
| `vform.notYetBody` | Only approved vendors can publish listings. Your application is {status}. | सिर्फ़ स्वीकृत विक्रेता ही लिस्टिंग डाल सकते हैं। आपका आवेदन {status} है। | ಅನುಮೋದಿತ ಮಾರಾಟಗಾರರು ಮಾತ್ರ ಲಿಸ್ಟಿಂಗ್ ಪ್ರಕಟಿಸಬಹುದು. ನಿಮ್ಮ ಅರ್ಜಿ {status} ಆಗಿದೆ. | ☐ |
| `vform.notYetTitle` | NOT YET | अभी नहीं | ಇನ್ನೂ ಇಲ್ಲ | ☐ |
| `vform.origPrice` | Original price ₹ * | असली कीमत ₹ * | ಮೂಲ ಬೆಲೆ ₹ * | ☐ |
| `vform.outlet` | Outlet * | आउटलेट * | ಔಟ್‌ಲೆಟ್ * | ☐ |
| `vform.pctBad` | {pct}% off · must be at least 30% off | {pct}% छूट · कम से कम 30% छूट ज़रूरी है | {pct}% ರಿಯಾಯಿತಿ · ಕನಿಷ್ಠ 30% ರಿಯಾಯಿತಿ ಬೇಕು | ☐ |
| `vform.pctOk` | {pct}% off · meets the 30% minimum | {pct}% छूट · 30% की न्यूनतम सीमा पूरी | {pct}% ರಿಯಾಯಿತಿ · ಕನಿಷ್ಠ 30% ಮಿತಿ ಪೂರೈಸಿದೆ | ☐ |
| `vform.pickupFrom` | Pickup from * | पिकअप शुरू * | ಪಿಕಪ್ ಆರಂಭ * | ☐ |
| `vform.prepared` | Prepared at * | तैयार किया गया * | ತಯಾರಿಸಿದ ಸಮಯ * | ☐ |
| `vform.publish` | Publish now | अभी प्रकाशित करें | ಈಗ ಪ್ರಕಟಿಸಿ | ☐ |
| `vform.quantity` | Quantity * | मात्रा * | ಪ್ರಮಾಣ * | ☐ |
| `vform.quantityAria` | Quantity | मात्रा | ಪ್ರಮಾಣ | ☐ |
| `vform.quickList` | QUICK LIST | क्विक लिस्ट | ತ್ವರಿತ ಪಟ್ಟಿ | ☐ |
| `vform.quickListDup` | QUICK LIST · DUPLICATE | क्विक लिस्ट · प्रतिलिपि | ತ್ವರಿತ ಪಟ್ಟಿ · ನಕಲು | ☐ |
| `vform.rescuePrice` | Rescue price ₹ * | बचाव कीमत ₹ * | ರಕ್ಷಣಾ ಬೆಲೆ ₹ * | ☐ |
| `vform.risk.dairy_dessert` | Dairy dessert | डेयरी मिठाई | ಡೈರಿ ಸಿಹಿ | ☐ |
| `vform.risk.raw` | Raw | कच्चा | ಹಸಿ | ☐ |
| `vform.risk.seafood` | Seafood | समुद्री भोजन | ಸಮುದ್ರಾಹಾರ | ☐ |
| `vform.riskNone` | None | कोई नहीं | ಯಾವುದೂ ಇಲ್ಲ | ☐ |
| `vform.riskNote` | High-risk items: pickup window max 2 hours. | ज़्यादा जोखिम वाली चीज़ें: पिकअप का समय अधिकतम 2 घंटे। | ಹೆಚ್ಚು ಅಪಾಯದ ಪದಾರ್ಥಗಳು: ಪಿಕಪ್ ಸಮಯ ಗರಿಷ್ಠ 2 ಗಂಟೆ. | ☐ |
| `vform.riskTag` | Food risk tag | खाने के जोखिम का टैग | ಆಹಾರ ಅಪಾಯ ಟ್ಯಾಗ್ | ☐ |
| `vform.safeUntil` | Safe to eat until | इस समय तक खाना सुरक्षित | ಇದುವರೆಗೆ ತಿನ್ನಲು ಸುರಕ್ಷಿತ | ☐ |
| `vform.saveChanges` | Save changes | बदलाव सहेजें | ಬದಲಾವಣೆಗಳನ್ನು ಉಳಿಸಿ | ☐ |
| `vform.storage` | Storage / handling note | रखने / संभालने की जानकारी | ಸಂಗ್ರಹಣೆ / ನಿರ್ವಹಣೆ ಟಿಪ್ಪಣಿ | ☐ |
| `vform.storagePh` | e.g. Keep refrigerated; reheat thoroughly | जैसे: फ़्रिज में रखें; अच्छी तरह गर्म करें | ಉದಾ: ಫ್ರಿಜ್‌ನಲ್ಲಿಡಿ; ಚೆನ್ನಾಗಿ ಬಿಸಿ ಮಾಡಿ | ☐ |
| `vform.suggested` | Suggested ₹{price} | सुझाव ₹{price} | ಸಲಹೆ ₹{price} | ☐ |
| `vform.suggestedRest` | ({pct}% off) · {hours} h left | ({pct}% छूट) · {hours} घंटे बाकी | ({pct}% ರಿಯಾಯಿತಿ) · {hours} ಗಂಟೆ ಉಳಿದಿದೆ | ☐ |
| `vform.surprise` | Surprise Bag (fixed price, contents hidden until pickup) | सरप्राइज़ बैग (तय कीमत, सामान पिकअप तक छिपा) | ಸರ್ಪ್ರೈಸ್ ಬ್ಯಾಗ್ (ನಿಗದಿತ ಬೆಲೆ, ಪಿಕಪ್‌ವರೆಗೆ ವಿಷಯ ಮರೆಮಾಡಲಾಗಿದೆ) | ☐ |
| `vform.template` | Start from a template | टेम्पलेट से शुरू करें | ಟೆಂಪ್ಲೇಟ್‌ನಿಂದ ಆರಂಭಿಸಿ | ☐ |
| `vform.timeToList` | Time to list: {s}s | लिस्ट करने में समय: {s} सेकंड | ಲಿಸ್ಟ್ ಮಾಡಲು ಸಮಯ: {s} ಸೆಕೆಂಡ್ | ☐ |
| `vform.until` | Until * | तक * | ವರೆಗೆ * | ☐ |
| `vform.useHalf` | Use 50% off (₹{price}) | 50% छूट लगाएँ (₹{price}) | 50% ರಿಯಾಯಿತಿ ಬಳಸಿ (₹{price}) | ☐ |
| `vform.windowNote` | Pickup must start in the future and within 12 hours of creating the listing. | पिकअप भविष्य में और लिस्टिंग बनाने के 12 घंटे के भीतर शुरू होना चाहिए। | ಪಿಕಪ್ ಭವಿಷ್ಯದಲ್ಲಿ ಮತ್ತು ಲಿಸ್ಟಿಂಗ್ ರಚಿಸಿದ 12 ಗಂಟೆಗಳ ಒಳಗೆ ಆರಂಭವಾಗಬೇಕು. | ☐ |

## volunteer

| Key | English | हिन्दी | ಕನ್ನಡ | OK? |
|---|---|---|---|---|
| `volunteer.allDone` | All done | सब पूरा हुआ | ಎಲ್ಲಾ ಮುಗಿದಿದೆ | ☐ |
| `volunteer.call` | Call the vendor: {phone} | विक्रेता को फ़ोन करें: {phone} | ಮಾರಾಟಗಾರರಿಗೆ ಕರೆ ಮಾಡಿ: {phone} | ☐ |
| `volunteer.codeAria` | Pickup code {code} | पिकअप कोड {code} | ಪಿಕಪ್ ಕೋಡ್ {code} | ☐ |
| `volunteer.collectBy` | collect by | आखिरी समय | ಕೊನೆಯ ಸಮಯ | ☐ |
| `volunteer.collectedMsg` | This pickup has already been collected. Thank you! | यह पिकअप पहले ही लिया जा चुका है। धन्यवाद! | ಈ ಪಿಕಪ್ ಈಗಾಗಲೇ ಸಂಗ್ರಹಿಸಲಾಗಿದೆ. ಧನ್ಯವಾದ! | ☐ |
| `volunteer.expired` | Link expired | लिंक की समय सीमा खत्म | ಲಿಂಕ್ ಅವಧಿ ಮುಗಿದಿದೆ | ☐ |
| `volunteer.expiredMsg` | The pickup deadline has passed, so this link no longer works. | पिकअप की समय सीमा बीत चुकी है, इसलिए यह लिंक अब काम नहीं करता। | ಪಿಕಪ್ ಗಡುವು ಮುಗಿದಿದೆ, ಆದ್ದರಿಂದ ಈ ಲಿಂಕ್ ಇನ್ನು ಕೆಲಸ ಮಾಡುವುದಿಲ್ಲ. | ☐ |
| `volunteer.footer` | No login needed. This link stops working after the pickup deadline. Demo data, fictional vendor. | लॉगिन की ज़रूरत नहीं। पिकअप की समय सीमा के बाद यह लिंक काम नहीं करेगा। डेमो डेटा, काल्पनिक विक्रेता। | ಲಾಗಿನ್ ಬೇಡ. ಪಿಕಪ್ ಗಡುವಿನ ನಂತರ ಈ ಲಿಂಕ್ ಕೆಲಸ ಮಾಡುವುದಿಲ್ಲ. ಡೆಮೊ ಡೇಟಾ, ಕಾಲ್ಪನಿಕ ಮಾರಾಟಗಾರ. | ☐ |
| `volunteer.for` | For {name} | {name} के लिए | {name} ಅವರಿಗಾಗಿ | ☐ |
| `volunteer.notFound` | Not found | नहीं मिला | ಸಿಗಲಿಲ್ಲ | ☐ |
| `volunteer.notFoundMsg` | We couldn't find this pickup link. Check it with your organisation. | हमें यह पिकअप लिंक नहीं मिला। अपनी संस्था से इसकी जाँच करें। | ಈ ಪಿಕಪ್ ಲಿಂಕ್ ನಮಗೆ ಸಿಗಲಿಲ್ಲ. ನಿಮ್ಮ ಸಂಸ್ಥೆಯೊಂದಿಗೆ ಪರಿಶೀಲಿಸಿ. | ☐ |
| `volunteer.pass` | Volunteer pickup · {ref} | स्वयंसेवक पिकअप · {ref} | ಸ್ವಯಂಸೇವಕ ಪಿಕಪ್ · {ref} | ☐ |
| `volunteer.pickupTime` | Pickup time | पिकअप का समय | ಪಿಕಪ್ ಸಮಯ | ☐ |
| `volunteer.showCode` | Show this code to the vendor | यह कोड विक्रेता को दिखाएँ | ಈ ಕೋಡ್ ಅನ್ನು ಮಾರಾಟಗಾರರಿಗೆ ತೋರಿಸಿ | ☐ |
