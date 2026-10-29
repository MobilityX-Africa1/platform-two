# Handover: moving the platform's Notion data to the MobilityX workspace

**From:** Peter Kedogo
**For:** MobilityX
**Date:** October 2026

---

## In short

The ecosystem map website doesn't keep its own copy of the data. Every company, country,
investor, deal and cost model on the site is read live from Notion. Right now those Notion
databases live in **my personal Notion account**, not in the MobilityX workspace.

Before the platform can fully belong to MobilityX, the databases need to move into the
MobilityX workspace. I tried to do that move myself and couldn't find a clean way to do it
without breaking the links between the databases (explained below). It is also important to note that the actual database may hold information that mine doesn't.

So the plan is:

1. To move the data into the MobilityX Notion workspace (this guide explains how and
   what to watch out for).
2. Reconnect the website to mobilityX's workspace once the data is there. The website
   needs a few small settings changes, which I'm happy to make.

**The platform uses databases in my workspace until the switch is done.**
The live site reads from them until pointed to mobilityX's workspace.

---

## 1. What's in Notion today

The platform uses six Notion databases:

| Database | What it holds on the site |
|---|---|
| **Countries** | The 15 priority markets: market stats, EV policy, charging and swap infrastructure |
| **Companies Pipeline** | Every company on the map: vertical, stage, funding, scores, "Top 50" ranking |
| **Capital Allocators** | Investors: type, ticket size, instruments, focus areas |
| **Deal Tracker** | Funding rounds. The site only shows totals (amount raised, number of rounds), never individual deal records |
| **Assessment Records** | Company scoring and assessments |
| **Asset Economics** | The TCO model, EV vs petrol two-wheeler cost comparison per country |

The column names and structure in my databases match the MobilityX versions. What differs
is the **data**: some rows or fields may be filled in on one side and empty or missing on
the other.

---

## 2. Why the links between databases matter ( Main problem I face )

The databases are connected to each other with Notion **relations**

- each **company** is linked to its **country**
- each **deal** is linked to a **company** and to an **investor**
- each **investor** is linked to the **countries** it's active in
- each **Asset Economics** row is linked to its **country**

**The website is also built on this relations between databases.** It's how a
country page knows which companies to list, how a company page shows its funding total,
and how investor pages show their deals.

The site follows the Notion link itself, not the name written in a cell. So a company
whose country column just says *"Kenya"* as text, with no real link to the Kenya page,
won't show up under Kenya on the site.

**If the links are lost during the move, the site still loads, but:**

- country pages show no companies, and company counts drop to zero
- company pages lose their country and their funding totals
- investor pages lose their deals and markets
- dashboard totals (capital raised, number of deals, and so on) come out wrong or empty

**Keeping the links is the most important part of the migration.** Everything else is
easy to fix afterwards.

---

## 3. The problem I hit

I couldn't find a way to move the databases out of my account and into another workspace
while keeping everything intact. These are the things that get in the way:

- **Notion has no "transfer ownership" for a set of databases.** Moving content to another
  workspace makes a new copy, and every page in the copy gets a new identity.
- **Links only survive if the linked databases move together.** If Countries and Companies
  are copied separately, the companies in the new copy still point at the *old* country
  pages in my workspace, or at nothing at all.
- **CSV export and import breaks the links completely.** A relation exported to CSV turns
  into plain text (e.g. `Kenya (https://www.notion.so/...)`). On import it stays text, so
  every link has to be rebuilt.
- **Your workspace already has its own data.** This isn't a straight copy. Some
  information exists only in your databases and some only in mine, so whatever method is
  used, the two sides still need to be merged.

---

## 4. How I'd suggest doing the move

### Option A (recommended): move all six databases together, then fill the gaps

1. In my workspace, I'll put all six databases under **one parent page** (MobilityX Ecosystem Mapping) link to my notion workspace.

2. https://app.notion.com/p/MobilityX-Ecosystem-Mapping-3a0edb77398881e18783c211f13d5202?source=copy_link

3. Copy that **whole parent page** into the MobilityX workspace in one go, using the
   page's `•••` menu → **Move to**, or **Duplicate** and then move. Because all six
   databases travel together, the links between them should carry over to the new copies.
4. **Check the links straight away** (see the checklist in §6) before doing anything else.
5. **Fill in the gaps.** Where your existing MobilityX databases have information mine
   don't (extra companies, newer figures, filled-in fields), add it into the newly moved
   databases. Then the moved set becomes the single master copy.

### Option B: keep your existing databases and pull my data into them

Your databases are much more complete than mine.

1. Export my databases to CSV.
2. Import or paste the missing rows and fields into your databases.
3. **Rebuild the links.** Wherever a linked column came across as text, it has to be
   turned back into a real relation. Notion can sometimes match text to page names when
   you change a column's type to *Relation*, so try it on a test copy first. Any row it
   can't match needs linking by hand.

Option B means more manual work and more chance of a missed link, which is why I'd go
with A.

### Important Notes

- **Keep column names exactly as they are.** The site finds each piece of information by
  its column name. If *"Total Funding Raised ($m)"* is renamed, even slightly, that
  figure quietly disappears from the site. If you want to rename something, tell me and
  I'll update the site to match.
- **Keep the `Publish` checkbox and use it.** Only rows with `Publish` ticked appear on the
  site, which is how unfinished or private records stay hidden. Check this is still
  ticked on the right rows after the move.
- **Keep the drop-down values the same** (Vertical, Region, Stage, Type of investor, and
  so on). The site groups and filters by these exact values.
- **Keep money in millions** where the column says `($m)`. For example, `2.5` means
  $2.5 million.
- **Keep company names consistent.** Company logos on the site are matched by company
  name, so a renamed company may lose its logo until I update it.
- **Don't create duplicate countries.** If "Kenya" exists twice, companies get split
  between the two and the country page shows only half of them.

---

## 5. What changes on the website (my part)

If the links and column names survive the move, the website change is small. I'd need to:

1. **Connect the site to your workspace.** In Notion, under *Settings → Connections →
   Develop or manage integrations*, create a new internal integration for the MobilityX
   workspace with **read-only** access. Then share it with the six databases (on each
   database: `•••` → *Connections* → add it). Send me its secret key privately, not by
   email or chat, or add it to the hosting settings yourself.
2. **Point the site at the new databases.** Each Notion database has an ID, and the site
   keeps a list of the six IDs in one settings file. I swap the old IDs for the new ones.
3. **Update the key on the hosting service** (Vercel), redeploy, and check every page.

On a clean move this takes a few hours, including checking the site page by page.

**Important:** share the integration **only with the six platform databases**, not the
whole workspace. The site's AI assistant can search anything the integration can see, so
if it can see internal pages (notes, memos, contacts), it could quote them to visitors.

### How much it affects the website if the links are lost

The site's code doesn't need rewriting either way. But it **can't recreate links that
don't exist in Notion**. If the links are lost:

- **Best fix: repair them in Notion.** The data stays correct in one place, and anything
  you add later works automatically.
- **Middle ground: a one-off relinking script.** I can write a small script that reads,
  for example, the text "Kenya" in a company row and links it to the Kenya country page.
  It runs once against your workspace and then gets thrown away. Anything it can't match
  confidently (spelling differences, accents like *Côte d'Ivoire*, duplicates) goes on a
  list for someone to fix by hand.
- **Not recommended: changing the site to match on names instead of links.** It's
  possible, but fragile. A single typo or renamed company silently breaks a page, and you
  end up maintaining the data in two ways.

---

## 6. Checklist after the move

Before telling me it's ready, please spot-check these in the **new** workspace:

- [ ] All six databases are there and have roughly the number of rows you expect
- [ ] Open a few **companies**: the country column shows a clickable link, not plain text
- [ ] Open a **country** (e.g. Kenya): it lists its companies
- [ ] Open a few **deals**: each links to a company and an investor
- [ ] Open an **Asset Economics** row: it links to its country
- [ ] Column names haven't changed (compare a couple of databases side by side with mine)
- [ ] `Publish` is ticked on the rows that should be public and unticked on the rest
- [ ] Information that existed only in your old MobilityX databases has been added in

Then send me:

- [ ] the integration secret key (sent securely), or confirmation that you've added it to
      Vercel yourself
- [ ] a link to each of the six new databases
- [ ] a note of anything you renamed, added or removed, so I can match it on the site


— Peter
