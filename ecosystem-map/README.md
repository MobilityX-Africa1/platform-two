# MobilityX Ecosystem Map

A website that maps Africa's electric mobility sector: the companies building it, the
countries they work in, the investors funding them, and the deals between them.

This guide explains what the website does, where its information comes from, and how to
keep it up to date. You don't need any coding knowledge to follow it.

> **Moving the Notion data to the MobilityX workspace?** See [HANDOVER.md](HANDOVER.md).

---

## 1. What's on the website

Use the menu on the left to move between sections. On a phone, the menu opens from the
menu button.

| Section | What you'll find |
|---|---|
| **Dashboard** | The headline numbers at a glance: companies tracked, capital raised, deals, markets covered. Click any number to see the records behind it. |
| **Countries** | The 15 priority African markets, grouped by region. Each country page covers market size, EV policy, charging and battery-swap infrastructure, and the companies active there. |
| **Compare countries** | Put countries side by side. |
| **Companies** | Every company on the map, grouped into 8 sectors (vehicle makers, financing, logistics software, ride-hailing and more). Includes scores, funding stage, and a ranked "Top 50". |
| **Capital Allocators** | Investors active in African mobility: what kind of investor they are, typical deal size, and focus areas. |
| **Deals Tracked** | Funding totals across the sector. Only totals are shown, never the details of individual deals. |
| **Asset Economics** | For selected countries, the cost of owning an electric motorbike compared with a petrol one. |

Pages link to each other. For example, a company page links to its country, and a
country page lists its companies.

### The AI assistant

The chat button in the corner opens an assistant you can ask questions in plain English,
for example *"Which Kenyan companies raised money in 2025?"*. It looks up the answer in
the same information the website uses. If it can't find something, it should say so
rather than guess, but it's worth double-checking anything important.

---

## 2. Where the information comes from

**Everything on the website comes from Notion.** There's no separate database behind it.
Change something in Notion and the website shows the change.

The website reads six Notion databases:

- **Countries**
- **Companies Pipeline**
- **Capital Allocators**
- **Deal Tracker**
- **Assessment Records** (company scores)
- **Asset Economics** (electric vs petrol cost comparison)

These databases are **linked to each other**. Each company is linked to its country, each
deal to a company and an investor, and so on. The website uses these links to connect its
pages, so they need to stay in place.

---

## 3. Keeping the website up to date

### Adding or editing a record

1. Open the right database in Notion (for example *Companies Pipeline*).
2. Add a new row, or edit an existing one.
3. Fill in the **link to other databases** where there is one. For a company, that means
   picking its country from the list, not typing the country's name.
4. Tick **Publish** when the record is ready to appear on the website.

### When will I see the change?

The website checks Notion for changes **every 5 minutes**. To see a change straight
away, click the small **refresh icon** next to *"Live from Notion"* on the website.

### What the Publish tick does

Only companies, investors and countries with **Publish** ticked appear on the website.
Leave it unticked for anything that's unfinished, unchecked, or should stay private for
now.

### Information that's never shown publicly

Some columns in Notion are for internal use only, and the website is set up to **never
show them**, even if they're filled in. These include founder contact details, meeting
and deal notes, due-diligence analysis, investment memos, investor activity notes, and
some sensitive country figures (for example capital deployed and notable deals).

New columns added in Notion are **hidden from the website by default**. A developer has
to switch them on, which keeps anything private from appearing by accident.

---

## 4. Rules that keep the website working

The website reads Notion closely, so a few things need to stay consistent:

- **Don't rename columns.** The website finds each piece of information by its column
  name. Rename one and that information disappears from the website. If a rename is
  needed, ask a developer to update the website at the same time.
- **Don't change drop-down options** (sector, region, stage, investor type) The website groups and filters records by these exact values.
- **Use links, not typed names.** A company with "Kenya" typed in as text won't appear on
  the Kenya page. It must be linked to the Kenya record.
- **Don't create duplicates.** Two "Kenya" records split the companies between them, so
  each page shows only part of the list.
- **Money in millions.** Columns marked **($m)** are in millions of US dollars, so enter
  `2.5` for $2.5 million.
- **Company names and logos.** Some company logos are matched by the company's name. If a
  company is renamed, its logo may need updating too.

---

## 5. If something looks wrong

| What you see | Most likely cause | What to do |
|---|---|---|
| A new record isn't showing | **Publish** isn't ticked, or the website hasn't refreshed yet | Tick Publish, then click the refresh icon |
| A figure disappeared from every page | A column was renamed or deleted in Notion | Change the name back, or ask a developer |
| A country page is missing companies | Those companies aren't linked to the country (or are linked to a duplicate) | Link them to the right country in Notion |
| A company's funding total looks wrong | A deal isn't linked to the company, or an amount was entered in dollars instead of millions | Check the deals in the Deal Tracker |
| The whole site shows no data | The connection to Notion has stopped working, for example its access key was removed or changed | Contact a developer |
| The chat assistant isn't answering | The AI service's access key has expired or run out of credit | Contact a developer |

---

## 6. Behind the scenes (for reference)

You don't need to manage these day to day, but it's useful to know they exist. Each one
belongs to an account someone has to own and keep paid or active:

| Service | What it does |
|---|---|
| **Notion** | Stores all the information the website shows |
| **Vercel** | Hosts the website on the internet. Its settings hold the access keys below |
| **Notion integration key** | Lets the website read the Notion databases (read-only) |
| **Google Gemini key** | Powers the chat assistant |

Access keys are like passwords. Keep them private, never paste them into email or chat,
and only give them to the developer who's setting things up.

---

## 7. Getting help

For anything beyond editing data in Notion, such as adding new sections, showing a new
column, or changing how a page looks, give a developer this project.
