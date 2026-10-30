// Guides: short, curated paths through the catalogue for a reason ("Catch up
// before Avengers: Doomsday", "Spider-Man", ...). Each stop says why it is
// there and how much it matters (essential or optional). Loaded after data.js.
//
// DRAFT: the lists, order, weights and wording need Andre's approval before
// this ships (V3 Tasks, "Create curated watch guides"). The Doomsday guide
// follows the ticket's draft (2026-10-29); the other five are Claude's drafts.
//
// Fields: `group` places the guide in the Guides menu (coming, stories,
// characters, animation); `short` is the name on the pill and the meter;
// `color` tints its art; `done` is the line shown when every essential stop is
// seen; event guides name their unreleased `target`.
//
// Rules for editing:
//   - Ids are permanent: they are used in addresses (?guide=) and progress.
//   - Every stop has a reason a fan would agree with. Shared cast alone is not
//     a reason, so a cameo is optional at most.
//   - Reasons name what a title introduces or sets up, never how it ends.
//     Event guides say nothing about the unreleased target's plot.
//   - Both languages, written for this app (not studio or press copy).
//   - Stops are in viewing order (release order unless a guide says otherwise).
//   - `reviewed` is the date of the last editorial check; an event guide is
//     re-checked when its target is released.

// Where each title sits in the story: 'main' (the Sacred Timeline), 'alternate'
// (another reality: What If…?, Marvel Zombies, Earth-828, Earth-86445) or
// 'anthology' (stand-alone episodes in the main timeline's past). Anything not
// listed is 'main'. Used by guides now, and by "last seen" logic later, so an
// alternate reality is never taken for the main story's "previously on".
window.CONTINUITY = {
  'what-if': 'alternate',
  'what-if-s2': 'alternate',
  'what-if-s3': 'alternate',
  'marvel-zombies': 'alternate',
  'friendly-spidey': 'alternate',
  'friendly-spidey-s2': 'alternate',
  'fantastic-four': 'alternate',
  'eyes-of-wakanda': 'anthology',
};
(window.TITLES || []).forEach((t) => { t.continuity = window.CONTINUITY[t.id] || 'main'; });

window.GUIDES = [
  {
    id: 'before-doomsday',
    kind: 'event',
    group: 'coming',
    target: 'doomsday',
    color: '#8a4a4a',
    reviewed: '2026-10-29',
    name: { en: 'Catch up before Avengers: Doomsday', 'pt-BR': 'Prepare-se para Vingadores: Doomsday' },
    short: { en: 'Before Doomsday', 'pt-BR': 'Antes de Doomsday' },
    blurb: {
      en: "Five films and series that set up December's team-up. Nothing about Doomsday itself.",
      'pt-BR': 'Cinco filmes e séries que preparam o encontro de dezembro. Nada sobre Doomsday em si.',
    },
    done: { en: "Ready for Doomsday.", 'pt-BR': 'Pronto para Doomsday.' },
    stops: [
      { id: 'endgame', weight: 'essential', why: { en: 'The last time the original Avengers stood together.', 'pt-BR': 'A última vez que os Vingadores originais estiveram juntos.' } },
      { id: 'shang-chi', weight: 'optional', why: { en: 'Introduces Shang-Chi.', 'pt-BR': 'Apresenta Shang-Chi.' } },
      { id: 'wakanda-forever', weight: 'optional', why: { en: "Shuri and M'Baku lead Wakanda's next chapter.", 'pt-BR': 'Shuri e M’Baku conduzem o novo capítulo de Wakanda.' } },
      { id: 'quantumania', weight: 'optional', why: { en: "Scott Lang's most recent adventure.", 'pt-BR': 'A aventura mais recente de Scott Lang.' } },
      { id: 'loki-s2', weight: 'essential', why: { en: "Loki's latest chapter with the TVA.", 'pt-BR': 'O capítulo mais recente de Loki com a AVT.' } },
      { id: 'cap-brave', weight: 'essential', why: { en: "Sam Wilson's first film as Captain America.", 'pt-BR': 'O primeiro filme de Sam Wilson como Capitão América.' } },
      { id: 'thunderbolts', weight: 'essential', why: { en: 'Introduces a new team, with Yelena and Bucky.', 'pt-BR': 'Apresenta uma nova equipe, com Yelena e Bucky.' } },
      { id: 'fantastic-four', weight: 'essential', why: { en: 'Meet the Fantastic Four, on their own Earth.', 'pt-BR': 'Conheça o Quarteto Fantástico, na sua própria Terra.' } },
    ],
  },
  {
    id: 'infinity-saga',
    group: 'stories',
    color: '#7a4060',
    short: { en: 'Infinity Saga', 'pt-BR': 'Saga do Infinito' },
    kind: 'arc',
    reviewed: '2026-10-29',
    name: { en: 'The Infinity Saga essentials', 'pt-BR': 'O essencial da Saga do Infinito' },
    blurb: {
      en: 'The ten films that carry the story from Iron Man to Endgame.',
      'pt-BR': 'Os dez filmes que levam a história de Homem de Ferro a Ultimato.',
    },
    stops: [
      { id: 'iron-man', weight: 'essential', why: { en: 'Where it all starts: Tony Stark builds the suit.', 'pt-BR': 'Onde tudo começa: Tony Stark constrói a armadura.' } },
      { id: 'cap-first-avenger', weight: 'essential', why: { en: 'Steve Rogers becomes Captain America, and the Tesseract appears.', 'pt-BR': 'Steve Rogers vira o Capitão América, e o Tesseract aparece.' } },
      { id: 'avengers', weight: 'essential', why: { en: 'The team assembles for the first time.', 'pt-BR': 'A equipe se reúne pela primeira vez.' } },
      { id: 'cap-winter-soldier', weight: 'essential', why: { en: 'S.H.I.E.L.D. is shaken, and Bucky returns.', 'pt-BR': 'A S.H.I.E.L.D. é abalada, e Bucky volta.' } },
      { id: 'gotg', weight: 'essential', why: { en: 'Introduces the Guardians and the wider cosmos.', 'pt-BR': 'Apresenta os Guardiões e o lado cósmico do universo.' } },
      { id: 'aou', weight: 'optional', why: { en: 'Introduces Wanda and Vision.', 'pt-BR': 'Apresenta Wanda e Visão.' } },
      { id: 'civil-war', weight: 'essential', why: { en: 'The Avengers split over who should oversee them.', 'pt-BR': 'Os Vingadores se dividem sobre quem deve supervisioná-los.' } },
      { id: 'doctor-strange', weight: 'optional', why: { en: 'Introduces Stephen Strange and the mystic arts.', 'pt-BR': 'Apresenta Stephen Strange e as artes místicas.' } },
      { id: 'thor-ragnarok', weight: 'essential', why: { en: "Thor and Loki's road to Infinity War begins here.", 'pt-BR': 'O caminho de Thor e Loki até Guerra Infinita começa aqui.' } },
      { id: 'black-panther', weight: 'essential', why: { en: "Introduces T'Challa's Wakanda.", 'pt-BR': 'Apresenta a Wakanda de T’Challa.' } },
      { id: 'infinity-war', weight: 'essential', why: { en: 'Thanos comes for the Infinity Stones.', 'pt-BR': 'Thanos vem atrás das Joias do Infinito.' } },
      { id: 'endgame', weight: 'essential', why: { en: 'The end of the Infinity Saga.', 'pt-BR': 'O fim da Saga do Infinito.' } },
    ],
  },
  {
    id: 'spider-man',
    group: 'characters',
    color: '#a23a3a',
    short: { en: 'Spider-Man', 'pt-BR': 'Homem-Aranha' },
    kind: 'character',
    character: 'peter',
    reviewed: '2026-10-29',
    name: { en: 'Spider-Man', 'pt-BR': 'Homem-Aranha' },
    blurb: {
      en: "Tom Holland's Peter Parker, from his first suit to today.",
      'pt-BR': 'O Peter Parker de Tom Holland, do primeiro uniforme até hoje.',
    },
    stops: [
      { id: 'civil-war', weight: 'essential', why: { en: "Peter's first outing as Spider-Man.", 'pt-BR': 'A primeira aparição de Peter como Homem-Aranha.' } },
      { id: 'homecoming', weight: 'essential', why: { en: 'His first film of his own, in high school.', 'pt-BR': 'O primeiro filme solo dele, no colégio.' } },
      { id: 'infinity-war', weight: 'essential', why: { en: 'Peter joins the fight against Thanos.', 'pt-BR': 'Peter entra na luta contra Thanos.' } },
      { id: 'endgame', weight: 'essential', why: { en: "Peter's part in the Infinity Saga's ending.", 'pt-BR': 'O papel de Peter no fim da Saga do Infinito.' } },
      { id: 'far-from-home', weight: 'essential', why: { en: 'A school trip to Europe, and a new threat.', 'pt-BR': 'Uma viagem escolar à Europa, e uma nova ameaça.' } },
      { id: 'what-if', weight: 'optional', why: { en: 'Alternate-reality episodes with other versions of Peter.', 'pt-BR': 'Episódios de realidades alternativas com outras versões de Peter.' } },
      { id: 'no-way-home', weight: 'essential', why: { en: 'The multiverse comes to Peter.', 'pt-BR': 'O multiverso chega até Peter.' } },
      { id: 'friendly-spidey', weight: 'optional', why: { en: 'An animated retelling on another Earth.', 'pt-BR': 'Uma releitura animada em outra Terra.' } },
      { id: 'marvel-zombies', weight: 'optional', why: { en: "Another reality's Peter, in a zombie outbreak.", 'pt-BR': 'O Peter de outra realidade, em um surto zumbi.' } },
      { id: 'brand-new-day', weight: 'essential', why: { en: "Peter's latest film.", 'pt-BR': 'O filme mais recente de Peter.' } },
    ],
  },
  {
    id: 'avengers',
    group: 'stories',
    color: '#4a6da3',
    short: { en: 'The Avengers', 'pt-BR': 'Os Vingadores' },
    kind: 'arc',
    reviewed: '2026-10-29',
    name: { en: 'The Avengers', 'pt-BR': 'Os Vingadores' },
    blurb: {
      en: 'The team films, from the first assembly to Endgame.',
      'pt-BR': 'Os filmes da equipe, da primeira reunião a Ultimato.',
    },
    stops: [
      { id: 'avengers', weight: 'essential', why: { en: 'The team assembles for the first time.', 'pt-BR': 'A equipe se reúne pela primeira vez.' } },
      { id: 'aou', weight: 'essential', why: { en: 'Tony builds a peacekeeper, and it goes wrong.', 'pt-BR': 'Tony cria um pacificador, e tudo dá errado.' } },
      { id: 'civil-war', weight: 'optional', why: { en: 'The team splits: an Avengers story in a Captain America film.', 'pt-BR': 'A equipe se divide: uma história dos Vingadores num filme do Capitão América.' } },
      { id: 'infinity-war', weight: 'essential', why: { en: 'Thanos comes for the Infinity Stones.', 'pt-BR': 'Thanos vem atrás das Joias do Infinito.' } },
      { id: 'endgame', weight: 'essential', why: { en: 'The last time the original Avengers assembled.', 'pt-BR': 'A última vez que os Vingadores originais se reuniram.' } },
    ],
  },
  {
    id: 'multiverse-saga',
    group: 'stories',
    color: '#603a80',
    short: { en: 'Multiverse Saga', 'pt-BR': 'Saga do Multiverso' },
    kind: 'arc',
    reviewed: '2026-10-29',
    name: { en: 'The Multiverse Saga', 'pt-BR': 'A Saga do Multiverso' },
    blurb: {
      en: 'How the multiverse opened up, on the way to Doomsday and Secret Wars.',
      'pt-BR': 'Como o multiverso se abriu, a caminho de Doomsday e Guerras Secretas.',
    },
    stops: [
      { id: 'loki-s1', weight: 'essential', why: { en: 'Introduces the TVA and the Sacred Timeline.', 'pt-BR': 'Apresenta a AVT e a Linha do Tempo Sagrada.' } },
      { id: 'what-if', weight: 'optional', why: { en: 'A tour of other realities.', 'pt-BR': 'Um passeio por outras realidades.' } },
      { id: 'no-way-home', weight: 'essential', why: { en: 'Visitors from other universes reach Peter Parker.', 'pt-BR': 'Visitantes de outros universos chegam até Peter Parker.' } },
      { id: 'multiverse-madness', weight: 'essential', why: { en: 'Doctor Strange travels between universes.', 'pt-BR': 'Doutor Estranho viaja entre universos.' } },
      { id: 'quantumania', weight: 'essential', why: { en: 'Introduces Kang the Conqueror.', 'pt-BR': 'Apresenta Kang, o Conquistador.' } },
      { id: 'loki-s2', weight: 'essential', why: { en: 'The TVA tries to hold the timelines together.', 'pt-BR': 'A AVT tenta manter as linhas do tempo unidas.' } },
      { id: 'deadpool-3', weight: 'essential', why: { en: 'Deadpool and Wolverine collide with the TVA.', 'pt-BR': 'Deadpool e Wolverine se chocam com a AVT.' } },
    ],
  },
  {
    id: 'animated',
    group: 'animation',
    color: '#a06030',
    short: { en: 'Animated series', 'pt-BR': 'Séries animadas' },
    kind: 'arc',
    reviewed: '2026-10-29',
    name: { en: 'The animated series', 'pt-BR': 'As séries animadas' },
    blurb: {
      en: "Marvel Studios' animated stories, mostly from other realities.",
      'pt-BR': 'As histórias animadas da Marvel Studios, quase todas de outras realidades.',
    },
    stops: [
      { id: 'what-if', weight: 'essential', why: { en: 'What if key moments had gone another way?', 'pt-BR': 'E se momentos-chave tivessem sido diferentes?' } },
      { id: 'what-if-s2', weight: 'essential', why: { en: 'More realities, and the Watcher steps in.', 'pt-BR': 'Mais realidades, e o Vigia entra em cena.' } },
      { id: 'what-if-s3', weight: 'essential', why: { en: 'The final season of What If…?', 'pt-BR': 'A última temporada de What If…?' } },
      { id: 'friendly-spidey', weight: 'essential', why: { en: "Peter Parker's first year, on another Earth.", 'pt-BR': 'O primeiro ano de Peter Parker, em outra Terra.' } },
      { id: 'eyes-of-wakanda', weight: 'essential', why: { en: "Wakanda's warriors across history.", 'pt-BR': 'Os guerreiros de Wakanda ao longo da história.' } },
      { id: 'marvel-zombies', weight: 'essential', why: { en: 'A What If…? reality overrun by zombies.', 'pt-BR': 'Uma realidade de What If…? tomada por zumbis.' } },
    ],
  },
];
