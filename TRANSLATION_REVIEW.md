# Translation review

Hindi (हिन्दी) and Kannada (ಕನ್ನಡ) were written by the build assistant as a **first pass**. They have **not** been reviewed by a native speaker. Nothing here should be treated as final copy until someone fluent signs it off.

928 strings. Generated from `lib/i18n/messages/*.json` by `npx tsx scripts/translation-review.ts`; edit the JSON files, not this table, then regenerate.

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
| `header.demoBanner` | DEMO MODE · fictional businesses · simulated payments | डेमो मोड · काल्पनिक व्यवसाय · नकली भुगतान | ಡೆಮೊ ಮೋಡ್ · ಕಾಲ್ಪನಿಕ ವ್ಯವಹಾರಗಳು · ನಕಲಿ ಪಾವತಿಗಳು | ☐ |
| `header.demoClock` | Demo clock: | डेमो घड़ी: | ಡೆಮೊ ಗಡಿಯಾರ: | ☐ |
| `header.home` | SAVE A PLATE home | SAVE A PLATE होम | SAVE A PLATE ಮುಖಪುಟ | ☐ |
| `header.main` | Main | मुख्य | ಮುಖ್ಯ | ☐ |
| `header.notif` | Notifications | सूचनाएँ | ಅಧಿಸೂಚನೆಗಳು | ☐ |
| `header.notifNone` | Nothing yet. | अभी कुछ नहीं। | ಇನ್ನೂ ಏನೂ ಇಲ್ಲ. | ☐ |
| `header.notifTitle` | Notifications (in-app) | सूचनाएँ (ऐप में) | ಅಧಿಸೂಚನೆಗಳು (ಆ್ಯಪ್‌ನಲ್ಲಿ) | ☐ |
| `header.notifUnread` | Notifications, {n} unread | सूचनाएँ, {n} अनपढ़ी | ಅಧಿಸೂಚನೆಗಳು, {n} ಓದದಿರುವುದು | ☐ |
| `header.plus15` | +15 min | +15 मिनट | +15 ನಿಮಿ | ☐ |
| `header.plus1h` | +1 h | +1 घंटा | +1 ಗಂ | ☐ |
| `header.realTime` | Real time | असली समय | ನಿಜವಾದ ಸಮಯ | ☐ |
| `header.resetConfirm` | Reset all demo data? | सारा डेमो डेटा रीसेट करें? | ಎಲ್ಲಾ ಡೆಮೊ ಡೇಟಾ ಮರುಹೊಂದಿಸಬೇಕೇ? | ☐ |
| `header.resetData` | Reset demo data | डेमो डेटा रीसेट करें | ಡೆಮೊ ಡೇಟಾ ಮರುಹೊಂದಿಸಿ | ☐ |
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
