# V3 catalog audit — 2026-10-24

Branch: `version/3.0`, continuing from released V3 commit `1f79b74`.
The user classified this as V3 maintenance, not a new major release.
The catalog is static JavaScript in `data.js`; this audit does not change the
Supabase database, collections, title ids, auth or application architecture.

## Coverage and score meaning

Reviewed ratings for all 60 released catalog entries; four upcoming entries stay
unrated. 40 entries have a changed or newly populated rating. Ratings are dated
snapshots, not a live service. Source mapping for all 64 permanent title ids:
[CATALOG-SOURCES.json](CATALOG-SOURCES.json).

- IMDb: weighted **movie or whole-series** user rating. Released season entries
  share their series rating. Never label an average of episode scores as an
  official IMDb season rating. Desktop/mobile score tooltips identify the scope.
- Rotten Tomatoes: critics' **Tomatometer**, specific season for TV, not
  Popcornmeter or a series average. The source's [own MCU guide](https://editorial.rottentomatoes.com/guide/marvel-movies-in-order/)
  supplied catalog-wide comparisons, with direct title/season checks for Phase 6.
- IMDb evidence is principally search-indexed primary IMDb title/ratings pages;
  direct fetches sometimes returned 403. Ms. Marvel's 6.2 was corroborated by
  IMDb filmography/list displays, rather than a directly fetched title page.
  Do not describe these snapshots as a fresh authenticated/API export.
- A cached VisionQuest series landing page said 79%; the current
  [season page](https://www.rottentomatoes.com/tv/visionquest/s01) said 90%.
  The specific season page takes precedence.
- Existing earlier budgets and complete historical cast lists were not fully
  re-audited. This is a full ratings pass plus focused Phase 6 metadata corrections,
  not a claim that every historical production credit was independently checked.

IMDb [explains its separate series and episode ratings here](https://help.imdb.com/article/imdb/track-movies-tv/faq-for-imdb-ratings/G67Y87TFYYP6TWAV).

## Phase 6 corrections and confirmations

- Spider-Man: Brand New Day: IMDb 8.0, RT 90%; July 31, 2026 remains correct.
  Added Frank Castle/Jon Bernthal, confirmed by [Sony](https://www.sonypictures.com/movies/spidermanbrandnewday).
  Retained Yelena because IMDb lists the credit; absence from a shorter studio
  marketing cast list is not proof a performer is absent. Added the IMDb budget
  **estimate** of $225m; it is not an audited production-cost figure.
- VisionQuest: IMDb 8.0, season RT 90%; first US availability corrected to
  **October 13**, per [Disney's launch article](https://thewaltdisneycompany.com/news/marvel-television-visionquest-disney-plus/).
  Some international listings remain October 14. Added Tommy Shepherd/Ruaridh
  Mollica using episode credits and the actor interview linked in the source map.
- Eyes of Wakanda: filled IMDb 6.2; retained RT 92%.
- Marvel Zombies: filled IMDb 7.0; RT 62 → 66%.
- Wonder Man: filled IMDb 7.4; retained RT 91%.
- Daredevil: Born Again season 2: filled whole-series IMDb 8.1; season RT
  95 → 87%. Season 1 also uses the current whole-series 8.1. Frank Castle was
  added to season 1's cast from [Marvel's credits](https://www.marvel.com/tv-shows/daredevil-born-again/1);
  that season 1 credit was not assumed to prove an appearance in season 2.
- Fantastic Four: retained IMDb 6.8 / RT 86%; added Shalla-Bal/Julia Garner from
  [Disney's film interview](https://thewaltdisneycompany.com/news/kevin-feige-fantastic-four/).
  Approximate chronological placement now reflects its 1960s alternate-Earth
  setting, between The First Avenger and Captain Marvel rather than after
  Thunderbolts. This is a cross-universe ordering convention, not a claim that
  the film takes place on the main MCU Earth.
- Friendly Neighborhood Spider-Man season 2: moved from the unsupported
  December 1, 2026 date to **January 13, 2027**, following
  [NYCC reporting](https://www.laughingplace.com/disney-entertainment/your-friendly-neighborhood-spider-man-season-2-date/),
  also [reported by GamesRadar](https://www.gamesradar.com/entertainment/marvel-tv-shows/marvel-fans-may-not-have-to-wait-two-more-years-for-the-next-season-of-your-friendly-neighborhood-spider-man-as-seasons-3-and-4-are-already-being-worked-on/).
  It remains unrated; do not copy season 1's score into it.
- Daredevil season 3: replaced the invented March 1 day with a March 2027 window
  (`release: '2027-03'`). [Current reporting](https://www.techradar.com/streaming/disney-plus/marvel-has-canceled-daredevil-born-again-after-three-seasons-and-ive-been-afraid-this-would-happen-to-the-disney-show-for-many-many-months)
  supports the window. No confirmed exact day was verified.
- [Doomsday](https://www.rottentomatoes.com/m/avengers_doomsday) December 18, 2026
  and [Secret Wars](https://www.rottentomatoes.com/m/avengers_secret_wars)
  December 17, 2027 reconfirmed; both remain unrated.

Month-only windows retain lexical release ordering, but `isReleased()` requires
a full day before including a title in completion. When a window passes without
a confirmed day, the weekly checker must flag it for review rather than silently
assuming a premiere. The actual denominator remains computed at runtime.

The graph models characters with one default actor label, including animation and
recast roles; per-appearance cast fidelity is a separate model limitation. New
characters use the existing initials fallback when no portrait is mapped. Future
cast lists remain provisional; this pass does not certify every rumored cameo.

## Rating changes

IMDb values are out of 10; RT values are critics' percentages. A dash means there
was no score. Unchanged reviewed entries remain in the source mapping.

| Permanent id | IMDb before → after | RT before → after | IMDb source |
|---|---|---|---|
| `incredible-hulk` | 6.6 → 6.6 | 67 → 68 | [IMDb](https://www.imdb.com/title/tt0800080/) |
| `iron-man-2` | 6.9 → 6.9 | 71 → 72 | [IMDb](https://www.imdb.com/title/tt1228705/) |
| `thor-dark-world` | 6.8 → 6.7 | 66 → 67 | [IMDb](https://www.imdb.com/title/tt1981115/) |
| `gotg` | 8 → 8 | 92 → 91 | [IMDb](https://www.imdb.com/title/tt2015381/) |
| `aou` | 7.3 → 7.3 | 76 → 75 | [IMDb](https://www.imdb.com/title/tt2395427/) |
| `ant-man` | 7.3 → 7.2 | 83 → 83 | [IMDb](https://www.imdb.com/title/tt0478970/) |
| `captain-marvel` | 6.8 → 6.7 | 79 → 79 | [IMDb](https://www.imdb.com/title/tt4154664/) |
| `far-from-home` | 7.3 → 7.3 | 90 → 91 | [IMDb](https://www.imdb.com/title/tt6320628/) |
| `wandavision` | 7.9 → 7.9 | 91 → 92 | [IMDb](https://www.imdb.com/title/tt9140560/) |
| `falcon-winter` | 7.2 → 7.1 | 84 → 85 | [IMDb](https://www.imdb.com/title/tt9208876/) |
| `black-widow` | 6.7 → 6.6 | 79 → 79 | [IMDb](https://www.imdb.com/title/tt3480822/) |
| `what-if` | 7.4 → 7.3 | 91 → 89 | [IMDb](https://www.imdb.com/title/tt10168312/) |
| `shang-chi` | 7.4 → 7.3 | 91 → 92 | [IMDb](https://www.imdb.com/title/tt9376612/) |
| `eternals` | 6.3 → 6.2 | 47 → 48 | [IMDb](https://www.imdb.com/title/tt9032400/) |
| `hawkeye` | 7.6 → 7.4 | 92 → 92 | [IMDb](https://www.imdb.com/title/tt10160804/) |
| `no-way-home` | 8.2 → 8.1 | 93 → 93 | [IMDb](https://www.imdb.com/title/tt10872600/) |
| `ms-marvel` | 6.5 → 6.2 | 82 → 98 | [IMDb](https://www.imdb.com/title/tt10857164/) |
| `multiverse-madness` | 6.9 → 6.8 | 74 → 73 | [IMDb](https://www.imdb.com/title/tt9419884/) |
| `thor-love` | 6.2 → 6.1 | 63 → 64 | [IMDb](https://www.imdb.com/title/tt10648342/) |
| `moon-knight` | 7.4 → 7.3 | 86 → 86 | [IMDb](https://www.imdb.com/title/tt10234724/) |
| `she-hulk` | 5.6 → 5.2 | 78 → 77 | [IMDb](https://www.imdb.com/title/tt10857160/) |
| `wakanda-forever` | 6.7 → 6.6 | 84 → 84 | [IMDb](https://www.imdb.com/title/tt9114286/) |
| `quantumania` | 6.1 → 6 | 46 → 46 | [IMDb](https://www.imdb.com/title/tt10954600/) |
| `secret-invasion` | 5.7 → 5.8 | 53 → 53 | [IMDb](https://www.imdb.com/title/tt13157618/) |
| `loki-s2` | 8.5 → 8.2 | 82 → 82 | [IMDb](https://www.imdb.com/title/tt9140554/) |
| `marvels` | 5.6 → 5.4 | 62 → 63 | [IMDb](https://www.imdb.com/title/tt10676048/) |
| `what-if-s2` | — → 7.3 | 88 → 88 | [IMDb](https://www.imdb.com/title/tt10168312/) |
| `echo` | 6.5 → 5.9 | 72 → 71 | [IMDb](https://www.imdb.com/title/tt13966962/) |
| `deadpool-3` | 7.6 → 7.5 | 78 → 77 | [IMDb](https://www.imdb.com/title/tt6263850/) |
| `agatha` | 7 → 7.2 | 84 → 84 | [IMDb](https://www.imdb.com/title/tt15571732/) |
| `what-if-s3` | — → 7.3 | 80 → 80 | [IMDb](https://www.imdb.com/title/tt10168312/) |
| `friendly-spidey` | — → 7.5 | 97 → 97 | [IMDb](https://www.imdb.com/title/tt16027074/) |
| `daredevil-born-again` | 8 → 8.1 | 87 → 87 | [IMDb](https://www.imdb.com/title/tt18923754/) |
| `ironheart` | 4.5 → 4.5 | 71 → 76 | [IMDb](https://www.imdb.com/title/tt13623126/) |
| `eyes-of-wakanda` | — → 6.2 | 92 → 92 | [IMDb](https://www.imdb.com/title/tt13968252/) |
| `marvel-zombies` | — → 7 | 62 → 66 | [IMDb](https://www.imdb.com/title/tt16027014/) |
| `wonder-man` | — → 7.4 | 91 → 91 | [IMDb](https://www.imdb.com/title/tt21066182/) |
| `daredevil-born-again-s2` | — → 8.1 | 95 → 87 | [IMDb](https://www.imdb.com/title/tt18923754/) |
| `brand-new-day` | — → 8 | — → 90 | [IMDb](https://www.imdb.com/title/tt22084616/) |
| `visionquest` | — → 8 | — → 90 | [IMDb](https://www.imdb.com/title/tt23112594/) |

## Weekly review

Configured in Codex as **Review MCU catalog updates**, Mondays at **9am Eastern**,
starting October 26, 2026. It continues this chat and prepares a sourced patch/diff
for review when meaningful changes are found. It does not apply files, commit,
push, merge or publish. The user corrected their initial report-only selection
to prepared updates for review. Nothing is deployed automatically by this job.

This is a Codex scheduled research/review task, not a Vercel cron endpoint, GitHub
Action or live browser-side fetch. It needs access to this checkout and current
sources at run time; inaccessible sources/conflicts are reported, not guessed.
For a future fully programmatic importer, IMDb supplies
[daily non-commercial datasets](https://data.imdb.com/non-commercial-datasets/);
Rotten Tomatoes directs API/feed requests through its
[licensing process](https://www.rottentomatoes.com/help_desk/licensing).
No API credentials or new runtime dependencies are added by this audit.

## Verification

- Actual `data.js` evaluated with Node's built-in VM: 64 unchanged permanent ids,
  83 defined characters, valid cast references, score ranges, valid date shapes,
  60 released entries with both scores and four upcoming entries with neither.
- Actual `isReleased()` helper: checked Oct 12/13 and Oct 24, Dec 17/18,
  Jan 12/13, and March 31; month-only March remains uncounted even in April.
  These are source-level date-input probes, not a changed browser/system clock.
- Actual sorting helper: all six sorts in both directions retain all 64 entries;
  rating order/unknown placement and Fantastic Four chronology passed.
- Browser: desktop VisionQuest scores/cast and IMDb/RT sort controls; emulated
  390×844 mobile Grid/List/detail sheet scores and Tommy's initials fallback.
  Guest mark survived reload; Account showed 1 of 60; removed the test mark.
  Browser console error log was empty. Temporary viewport override was reset.
- No fresh Google/cross-device or physical-phone tests were performed for this
  catalog-only change. Those existing V3 checks are in V3-VERIFICATION.md.
- Local doc links and `git diff --check` checked before commit. No packages,
  bundler, runtime dependency or schema change. Source mapping is not loaded by
  the browser and adds no catalog network request.

The catalog maintenance is included in the V3 maintenance release approved for
main on 2026-10-24. The research dates and limitations above are historical;
this release does not represent a fresh ratings audit.

## In-story timeframes — 2026-10-24

Added `story` (and `storyNote` for alternate realities) to the 60 released
titles in `data.js`, and renumbered `chronOrder` (1–64) so the Chronological
sort follows these timeframes, as the user approved.

- Primary source: Marvel Studios' 2023 book *The Marvel Cinematic Universe: An
  Official Timeline*, as summarized with citations in Wikipedia's
  [Marvel Cinematic Universe timeline](https://en.wikipedia.org/wiki/Marvel_Cinematic_Universe_timeline)
  article. Later titles the book does not cover use that article's in-film and
  creator-statement evidence. Checked 2026-10-24.
- Where sources disagree, the book wins: Iron Man is 2008 (some fan and earlier
  timelines say 2010); Iron Man 2, The Incredible Hulk and Thor are 2010; Iron Man
  3 is December 2013–early 2014; Spider-Man: Homecoming is 2016 despite its
  "eight years later" card; Wakanda Forever is 2025.
- Ranges cover stories that span years (The First Avenger 1943–1945, Endgame
  2018–2023, Daredevil: Born Again 2025–2027). `c.` marks approximate years the
  sources only infer (Secret Invasion, VisionQuest, Your Friendly Neighborhood
  Spider-Man).
- Loki seasons read "Outside time" and What If…? seasons "Multiverse"; the
  sources give them no place in the Sacred Timeline. Alternate-reality titles
  (The Fantastic Four: First Steps, Marvel Zombies, Your Friendly Neighborhood
  Spider-Man, Deadpool & Wolverine) keep a year plus a note naming the reality.
- Unreleased titles (Avengers: Doomsday, Avengers: Secret Wars, Daredevil: Born
  Again Season 3, Your Friendly Neighborhood Spider-Man Season 2) have no value
  yet; add one after release from on-screen evidence.
- Chronological order: the previous `chronOrder` disagreed with these years in
  about 17 places (e.g. Guardians of the Galaxy Vol. 2, set in 2014, sorted after
  Civil War; Ant-Man and the Wasp, set in 2018, before Black Widow; Echo,
  Ironheart and Daredevil: Born Again Season 2 after later-set titles). It now
  moves forward by timeframe. Within a year it follows the book's seasons (e.g.
  Thor: The Dark World, fall 2013, before Iron Man 3, Christmas 2013; Shang-Chi
  before The Falcon and the Winter Soldier). Dated alternate realities sit at
  their year (Marvel Zombies after WandaVision, Deadpool & Wolverine at the end of
  2024); She-Hulk, which runs from fall 2024 into 2025, closes 2024; undated
  Loki and What If…? seasons keep their previous neighbours (What If…? seasons 2
  and 3 together); unreleased titles sit at the end. The mobile Chrono list groups by timeframe.

## Brazilian Portuguese titles — 2026-10-25

`locales/pt-BR.js` maps all 64 title ids to their official Brazilian release
titles (cinema or Disney+ Brasil). Checked 2026-10-25.

- Films through The Marvels: consistent across Brazilian watch-order guides
  ([Canaltech](https://canaltech.com.br/cinema/marvel-qual-a-ordem-certa-dos-filmes-para-assistir-no-disney/),
  [AdoroCinema](https://www.adorocinema.com/noticias/filmes/noticia-158775/)),
  e.g. Os Vingadores, Capitão América 2: O Soldado Invernal, Vingadores: Ultimato.
- Later films and series: [Universo Marvel 616](https://www.marvel616.com/),
  [Omelete](https://www.omelete.com.br/), [Rolling Stone Brasil](https://rollingstone.com.br/)
  and [JustWatch Brasil](https://www.justwatch.com/br) (which mirrors the
  Disney+ catalog): Capitão América: Admirável Mundo Novo, Quarteto Fantástico:
  Primeiros Passos, Homem-Aranha: Um Novo Dia, Vingadores: Doomsday, Vingadores:
  Guerras Secretas, Coração de Ferro, Olhos de Wakanda, Demolidor: Renascido.
- Judgment calls: Agatha All Along uses the Disney+ catalog title "Foi Sempre a
  Agatha"; the pre-release "Agatha Desde Sempre" is kept as a search alias.
  Wonder Man is "Magnum" in Brazil. Your Friendly Neighborhood Spider-Man is
  "Seu Amigão da Vizinhança: Homem-Aranha" ("Seu Amigável Vizinho Homem-Aranha"
  kept as an alias). Untranslated originals stay as released (WandaVision,
  Loki, What If…?, Ms. Marvel, Echo, Thunderbolts*, Marvel Zombies, VisionQuest).
  Seasons read "– Temporada N".
- Character names change only where Brazil uses a different name (Visão,
  Nebulosa, Valquíria, Aquele Que Permanece, Kang, o Conquistador, Capitã
  Carter, Surfista Prateada); personal names stay as in `data.js`.


## Weekly maintenance — 2026-10-26

- VisionQuest: add Paladin / Todd Stashwick, explicitly identified in
  [Disney's launch article](https://thewaltdisneycompany.com/news/marvel-television-visionquest-disney-plus/),
  retrieved October 26. Adds the permanent character id `paladin`; all 64 title
  ids and existing character ids remain unchanged. Uses the existing initials
  portrait and untranslated-name fallback in both languages; no verified
  Brazilian localized name was found.
- Spider-Man: Brand New Day: IMDb 8.0 → 7.9, from the newer search-indexed
  [IMDb ratings page](https://www.imdb.com/de/title/tt22084616/ratings/)
  (363,885 votes), rechecked October 26. The older main-title index still shows
  8.0 / 305K votes. Direct retrieval returned 403; this is an indexed primary
  snapshot, not live verification or a personal/episode rating.
- RT scores, release dates/windows and upcoming unrated entries are unchanged.
  Source-map per-entry checked dates distinguish these updates from the
  historical catalog-wide audit; its global checkedAt stays October 24.

Verification for this local update: Node VM checks confirm 64 stable title ids,
84 characters, valid cast references, IMDb 7.9 for Brand New Day, unchanged RT
and release values, and upcoming entries still unrated. Desktop and 390px
mobile cast displays show Paladin / Todd Stashwick. Mobile Brand New Day shows
7.9 / 90 in English and Portuguese; Portuguese character search returns
VisionQuest for Paladin. Cached entry HTML initially omitted language scripts;
a fresh query parameter loaded the current entry page and resolved rendering
without a code change. No fresh physical-phone, auth, cloud-write or production
checks. Changes remain local pending commit/push approval.

## Per-title performer credits — 2026-10-28

Characters carried a single `actor`, used wherever a performer was shown. That
leaked the current performer into every title: Iron Man credited Don Cheadle as
Rhodes, and The Incredible Hulk credited Mark Ruffalo as Banner and Harrison
Ford as Ross.

Titles may now carry `credits`, a map of character id to the performer actually
credited in that production. The character keeps one identity — one colour, one
portrait, one connection thread — and `CHARACTERS[id].actor` is only the
default, used when a title says nothing.

### Corrections applied

| Title | Character | Was (default) | Now |
|---|---|---|---|
| Iron Man | James Rhodes | Don Cheadle | **Terrence Howard** |
| The Incredible Hulk | Bruce Banner | Mark Ruffalo | **Edward Norton** |
| The Incredible Hulk | Thaddeus Ross | Harrison Ford | **William Hurt** |
| Captain America: Civil War | Thaddeus Ross | Harrison Ford | **William Hurt** |
| Avengers: Infinity War | Thaddeus Ross | Harrison Ford | **William Hurt** |
| Avengers: Endgame | Thaddeus Ross | Harrison Ford | **William Hurt** |
| Black Widow | Thaddeus Ross | Harrison Ford | **William Hurt** |

Captain America: Brave New World keeps Harrison Ford, which is the default and
correct. Resulting search counts: Terrence Howard 1, Don Cheadle 10 (was 11),
Edward Norton 1, Mark Ruffalo 11 (was 12), William Hurt 5, Harrison Ford 3
(was 8).

### The two animated credits, since sourced

Both were left on the default at first and have since been corrected, with
sources supplied by the maintainer:

| Title | Character | Now | Source |
|---|---|---|---|
| What If…? | Thaddeus Ross | **Mike McGill** | MCU Fandom, Entertainment Weekly voice-cast guide, Behind The Voice Actors — McGill replaced William Hurt; Ross appears in episodes 3 and 6 |
| Your Friendly Neighborhood Spider-Man | Thaddeus Ross | **Travis Willingham** | IMDb, ScreenRant character guide |

Both suspicions were right: the default Harrison Ford was wrong in each case.
Thaddeus Ross now has four distinct performers across his eight titles —
William Hurt 5, and one each for Harrison Ford, Mike McGill and Travis
Willingham. Harrison Ford is credited in Brave New World alone.

Worth noting for the recast sweep: a voice recast in an animated title counts
exactly like a live-action one here, and animated series are where most of the
remaining uncorrected cases are likely to be.

No other recasts were audited. The catalogue holds several characters who have
been recast or voiced by more than one performer elsewhere in the MCU; only the
cases named in the ticket, plus the rest of William Hurt's run, were corrected.
A full sweep is a separate piece of work.

### Portraits — since fixed

This section first recorded a limit: `MEDIA.actors` is keyed by character, so a
recast row showed the **default** performer's photo beside the corrected name.
That is now resolved.

`MEDIA.performers` maps a performer name to a TMDB profile path, alongside the
character-keyed `MEDIA.actors`. A row uses the character's portrait when the
credited performer is the default, the performer map when it is not, and no
photo at all otherwise — never a different performer's face.

Four profile paths were looked up on TMDB and each verified against that
person's own credits before use (Iron Man for Howard, The Incredible Hulk for
Norton, Civil War for Hurt, Your Friendly Neighborhood Spider-Man for
Willingham), then checked to return HTTP 200:

| Performer | TMDB person | Profile path |
|---|---|---|
| Terrence Howard | 18288 | `/wXWt2NSY23v7DHe2yZQ1C8TikBp.jpg` |
| Edward Norton | 819 | `/8nytsqL59SFJTVYVrN72k6qkGgJ.jpg` |
| William Hurt | 227 | `/j3mjmuHLBW4XQSw53C8Sh0Lh3ZQ.jpg` |
| Travis Willingham | 1221888 | `/clvP30k6cUMf4hukRQqZD3k9z4S.jpg` |

**Mike McGill is deliberately absent.** The only TMDB person of that name has
no profile photo and no *What If…?* credit, so it is a different Mike McGill.
What If…? therefore shows initials for Ross rather than a face — correct, and
better than borrowing one. If a profile is found later, adding the name to
`MEDIA.performers` is the whole change.

## Credit-scene cast audit — 2026-10-28

**Rule, set by the user:** a character counts for a title only if they appear in
the **main feature**. A character whose sole appearance in that title is a mid-
or post-credit scene comes out of its `cast`, which also removes the connection
line it drew. There is no new field: membership in `cast` is the whole
mechanism, so nothing in the app had to learn a new concept.

Primary source for the scene inventory:
[Mid-credits and post-credits scenes in the MCU](https://en.wikipedia.org/wiki/Mid-credits_and_post-credits_scenes_in_the_Marvel_Cinematic_Universe),
with per-case corroboration recorded in
[CATALOG-SOURCES.json](CATALOG-SOURCES.json) under `creditSceneAudit`.

### Removed — 19 cast entries across 13 titles

| Title | Removed | Scene |
|---|---|---|
| Iron Man | Nick Fury | post-credits |
| Thor | Nick Fury | post-credits |
| Iron Man 3 | Bruce Banner | post-credits |
| Captain America: The Winter Soldier | Wanda Maximoff | mid-credits |
| Ant-Man | Steve Rogers, Bucky Barnes | post-credits |
| Doctor Strange | Thor | mid-credits |
| Black Panther | Bucky Barnes | post-credits |
| Avengers: Infinity War | Nick Fury, Carol Danvers | post-credits |
| Captain Marvel | Steve Rogers, Natasha Romanoff, Bruce Banner, James Rhodes | mid-credits |
| Shang-Chi | Bruce Banner, Carol Danvers | mid-credits |
| Ms. Marvel | Carol Danvers | post-credits |
| Spider-Man: Homecoming | Steve Rogers | PSA videos + post-credits |
| Deadpool & Wolverine | Scott Lang | **absent entirely** |

Two of those are not really credit-scene cases:

- **Carol Danvers in Infinity War** never appears on screen at all. Only her
  insignia shows on Fury's pager. She is removed as absent.
- **Scott Lang in Deadpool & Wolverine** likewise does not appear. The film
  shows a giant Ant-Man *corpse* used as Cassandra Nova's lair, and Paul Rudd
  is not in the picture.

Resulting count drops: Nick Fury 14 → 11, Carol Danvers 7 → 4, Bruce Banner
12 → 9, Steve Rogers 12 → 9, Bucky Barnes 12 → 10, Natasha 10 → 9, Rhodes
11 → 10, Thor 12 → 11, Wanda 9 → 8, Scott 10 → 9. No character was left with
zero titles.

### Checked and deliberately kept

The ticket named Steve Rogers, Sam Wilson and Bucky Barnes as Ant-Man
connections that should go. **Sam Wilson stays:** Falcon fights Scott Lang at
the New Avengers facility in the main feature, which is where Scott takes the
signal decoy. Only Rogers and Barnes are credits-only there.

| Title | Kept | Why |
|---|---|---|
| The Incredible Hulk | Tony Stark | The bar scene with Ross plays **before** the credits. It is the last scene of the main feature, not a post-credits scene, though it is almost always described as one. |
| Ant-Man | Sam Wilson | Falcon fights Ant-Man in the main feature. |
| Deadpool & Wolverine | Happy Hogan | Happy interviews Wade for the Avengers early in the main feature. |
| Shang-Chi | Wong | Wong fights Abomination in the cage-fight sequence. |
| Captain America: The Winter Soldier | Bucky Barnes | He is the title character; the Smithsonian scene is an extra credits scene. |

### Two judgement calls, decided by the user on 2026-10-28

Both were raised rather than settled quietly. The user decided each, and the
two answers together sharpen the rule: **what counts is a physical, in-story
appearance by the performer — not whether the character is referred to, and
not whether the person on screen turns out to be someone else.**

- **Nick Fury in Spider-Man: Far From Home — kept.** The Fury on screen
  through the main feature is Talos impersonating him, which the post-credits
  scene reveals. He is kept because Samuel L. Jackson does appear in the film:
  the later reveal changes who the character was, not whether the performance
  is in the main feature.
- **Steve Rogers in Spider-Man: Homecoming — removed.** He appears only
  through a series of low-budget in-universe educational videos and a
  post-credits gag, never as a physical live-action presence in the story.
  Being shown on a screen inside the film is not being in it.

That removal is the audit's **19th**, and takes Rogers from 10 titles to 9. It
is in a separate commit from the first eighteen.

### Not audited

The unreleased titles (Avengers: Doomsday, Secret Wars, Spider-Man: Brand New
Day, VisionQuest, Your Friendly Neighborhood Spider-Man S2, Daredevil: Born
Again S2 and S3, Wonder Man) have provisional casts and no scene inventory to
check against. Marvel Zombies was not checked scene by scene.

## Sparse-series character pass — 2026-10-28

The review counted 11 series with two or fewer featured characters. Five
characters were added, each verified per production and each chosen because
it joins titles that were already in the catalog. Sources and the per-title
reasoning are in [CATALOG-SOURCES.json](CATALOG-SOURCES.json) under
`sparseSeriesAudit`.

| Character | Performer | Titles |
|---|---|---|
| Maria Hill | Cobie Smulders | The Avengers, The Winter Soldier, Age of Ultron, Endgame, Far From Home, Secret Invasion |
| Talos | Ben Mendelsohn | Captain Marvel, Secret Invasion |
| Monica Rambeau | Teyonah Parris | Captain Marvel, WandaVision, The Marvels |
| Mobius M. Mobius | Owen Wilson | Loki, Loki: Season 2 |
| Sylvie | Sophia Di Martino | Loki, Loki: Season 2 |

Sparse titles: **13 → 9**. Captain Marvel and Secret Invasion are no longer
sparse, and Secret Invasion gains threads to five earlier titles through Hill
and to Captain Marvel through Talos.

### The credit-scene rule decided three of these

The rule set earlier the same day — a character counts for a title only if the
performer appears in the **main feature** — is what kept this pass honest:

- **Maria Hill is not added to Infinity War.** Her only appearance there is the
  post-credits scene, the same one Nick Fury was removed from.
- **Talos is not added to Far From Home.** Ben Mendelsohn appears only in the
  post-credits reveal; through the main feature he is disguised as Fury, so the
  performer on screen is Samuel L. Jackson.
- **Maria Hill *is* added to Far From Home**, which looks like the opposite call
  but follows the same rule. The Hill on screen is Soren in disguise, yet Cobie
  Smulders plays her throughout the main feature — the same reading that keeps
  Fury in that title.

### Two corrections worth recording

- **Maria Hill is not in Captain America: Civil War.** A Deadline piece lists
  her there; Wikipedia and CinemaBlend both have her absent, and that same
  Deadline list also mislabels Winter Soldier. The claim does not survive.
- **Mobius is not added to Deadpool & Wolverine.** A pre-release cast guide
  predicted it, but the post-release cameo round-ups name only Happy Hogan and
  Thor. A prediction is not a credit.

### Monica Rambeau is a recast

Akira Akbar plays the 1990s Monica in Captain Marvel and Teyonah Parris plays
her everywhere else, so Captain Marvel carries `credits: { monica: 'Akira
Akbar' }` and the batch 5 credit machinery handles the rest. She is not her
mother Maria Rambeau (Lashana Lynch), who is not in the catalog.

### Sylvie threads onto Loki

She is a Loki variant, so she carries `prime: 'loki'` — the same treatment He
Who Remains and Victor Timely get for Kang, keeping the arc continuous.

### Left sparse on purpose

**Eyes of Wakanda stays at zero.** It is an anthology set centuries before the
modern MCU; its characters are genuine one-offs, not a missing appearance, and
the ticket asks for that distinction rather than for the map to be filled in.
Doctor Strange and Ms. Marvel are sparse because the credit-scene audit removed
Thor and Carol respectively — that is the audit working, not a gap. The
unreleased titles keep provisional casts; nothing was added to a title that has
not aired.
