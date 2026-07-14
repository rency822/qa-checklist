# QA Checklist & Report Generator

A web-based, zero-install utility designed to streamline QA testing workflows. Generate standardized text reports instantly by selecting from a pre-loaded list of common issues or adding your own via the Custom Issue Manager.

**Access the tool here:** [https://rency822.github.io/qa-checklist](https://rency822.github.io/qa-checklist)

---

## 🚀 Key Features

*   **Zero Setup:** No installation or compilation required. Open the link and start testing immediately.
*   **Structured Hierarchical Output:** Automatically groups bugs by category (e.g., *SCENE*, *TRAILER*), sorts them by test date, and nests them under the targeted asset ID.
*   **Pre-loaded QA Checklist:** Quick-select common bugs and validation checks across functionality, UI/UX, and performance.
*   **Custom Issue Manager:** Effortlessly add, edit, or remove project-specific defects on the fly.
*   **One-Click Clean Copy:** Export your testing session into a perfectly formatted `.txt` report, ready to be pasted directly into Slack, Discord, or your ticketing system.

---

## 📖 How to Use

1.  **Visit the Site:** Navigate to [rency822.github.io/qa-checklist](https://rency822.github.io/qa-checklist).
2.  **Select Category & Asset:** Set up your current testing run (e.g., choosing *SCENE* or *TRAILER* and inputting the target asset name).
3.  **Check/Add Issues:** Browse the built-in checklist for common failures, or use the **Custom Issue Manager** to type in specific bugs with direct links.
4.  **Mark Passes:** Easily flag clean runs as "GOOD" to keep track of successful passes.
5.  **Export:** Click the **"Generate Report"** button to output your clean text format.

---

## 📋 Sample Output Report

The generator formats your work into an easily readable log structured like this:

```text
*SCENE*

07-02-2026
----------------
vrh0773_elizabethskylar_dannysteele_180
-Some thumbs are not appearing ([http://dev.ma.vrhush.com/scene/vrh0773_elizabethskylar_dannysteele_180/photos](http://dev.ma.vrhush.com/scene/vrh0773_elizabethskylar_dannysteele_180/photos))
-Intro / Outro not properly displaying ([http://dev.ma.vrhush.com/scene/vrh0773_elizabethskylar_dannysteele_180](http://dev.ma.vrhush.com/scene/vrh0773_elizabethskylar_dannysteele_180))

tby0038_leoalfano_andreasnilsen
-GOOD

================

07-03-2026
----------------
hgv9531_stacyfort_sherriost
-Broken Photo presentation ([http://dev.ma.homegrownvideo.com/scene/hgv9531_stacyfort_sherriost](http://dev.ma.homegrownvideo.com/scene/hgv9531_stacyfort_sherriost))
-Wrong date tag
-Missing duration tag
-Error downloading photoset zip
-Broken gallery ([http://dev.ma.homegrownvideo.com/scene/hgv9531_stacyfort_sherriost/photos](http://dev.ma.homegrownvideo.com/scene/hgv9531_stacyfort_sherriost/photos))

================


*TRAILER*

07-02-2026
----------------
vrh0773_elizabethskylar_dannysteele_180
-Broken sample images ([http://dev.vrhush.com/scenes/vrh0773_elizabethskylar_dannysteele_180?nats=gds](http://dev.vrhush.com/scenes/vrh0773_elizabethskylar_dannysteele_180?nats=gds))

tby0038_leoalfano_andreasnilsen
-GOOD

================
