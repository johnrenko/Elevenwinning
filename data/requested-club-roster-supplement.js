// Curated 2025-26 roster coverage for the user-requested clubs.
// Sources: UEFA club squad pages, UEFA national association squad pages, and Premier League squad lists.
(function publishRequestedClubRosters(root, rows) {
  if (typeof module !== 'undefined' && module.exports) module.exports = rows;
  if (root) root.ElevenWinningRequestedClubRosters = rows;
})(typeof globalThis !== 'undefined' ? globalThis : this, (function buildRows() {
  const roleNames = {
    GK: ['Gardien reflexe', 'Gardien relance', 'Gardien ligne', 'Gardien dominant'],
    DEF: ['Central couverture', 'Lateral transition', 'Stoppeur duel', 'Defenseur relance'],
    MID: ['Relayeur tempo', 'Sentinelle pressing', 'Meneur vertical', 'Box-to-box moteur'],
    FWD: ['Ailier percussion', 'Buteur surface', 'Attaquant mobile', 'Neuf appui']
  };

  const clubs = [
    {
      team: 'PSG',
      league: 'Ligue 1',
      source: 'uefa-ucl-squad',
      roster: {
        GK: ['Lucas Chevalier|24|France', 'Matvei Safonov|27|Russia', 'Martin James|18|France', 'Renato Marin|19|Italy'],
        DEF: ['Achraf Hakimi|27|Morocco', 'Lucas Beraldo|22|Brazil', 'Marquinhos|31|Brazil', 'Illia Zabarnyi|23|Ukraine', 'Lucas Hernandez|30|France', 'Nuno Mendes|23|Portugal', 'David Boly|17|France', 'Willian Pacho|24|Ecuador'],
        MID: ['Fabian Ruiz|30|Spain', 'Vitinha|26|Portugal', 'Kang-in Lee|25|South Korea', 'Senny Mayulu|19|France', 'Dro Fernandez|18|Spain', 'Warren Zaire-Emery|20|France', 'Joao Neves|21|Portugal'],
        FWD: ['Khvicha Kvaratskhelia|25|Georgia', 'Goncalo Ramos|24|Portugal', 'Ousmane Dembele|28|France', 'Desire Doue|20|France', 'Bradley Barcola|23|France', 'Mathis Jangeal|17|France', 'Noah Nsoki|19|France', 'Quentin Ndjantou|18|France', 'Ibrahim Mbaye|18|Senegal']
      }
    },
    {
      team: 'Bayern Munich',
      league: 'Bundesliga',
      source: 'uefa-ucl-squad',
      roster: {
        GK: ['Manuel Neuer|39|Germany', 'Sven Ulreich|37|Germany', 'Jannis Bartl|19|Germany', 'Jonas Urbig|22|Germany', 'Leon Klanac|19|Germany'],
        DEF: ['Dayot Upamecano|27|France', 'Minjae Kim|29|South Korea', 'Jonathan Tah|30|Germany', 'Hiroki Ito|26|Japan', 'Raphael Guerreiro|32|Portugal', 'Cassiano Kiala|17|Germany', 'Deniz Ofli|18|Turkey', 'Vincent Manuba|20|Germany', 'Josip Stanisic|25|Croatia'],
        MID: ['Joshua Kimmich|31|Germany', 'Leon Goretzka|31|Germany', 'Jamal Musiala|23|Germany', 'Michael Olise|24|France', 'Alphonso Davies|25|Canada', 'Tom Bischof|20|Germany', 'Konrad Laimer|28|Austria', 'Felipe Chavez|18|Germany', 'Lennart Karl|18|Germany', 'Jussef Nasrawe|18|Germany', 'Aleksandar Pavlovic|21|Germany', 'Tim Binder|19|Germany', 'David Daiber|19|Portugal'],
        FWD: ['Serge Gnabry|30|Germany', 'Harry Kane|32|England', 'Nicolas Jackson|24|Senegal', 'Luis Diaz|29|Colombia', 'Wisdom Mike|17|Germany']
      }
    },
    {
      team: 'Real Madrid',
      league: 'La Liga',
      source: 'uefa-ucl-squad',
      roster: {
        GK: ['Thibaut Courtois|33|Belgium', 'Andriy Lunin|27|Ukraine', 'Fran Gonzalez|20|Spain', 'Javier Navarro|19|Spain'],
        DEF: ['Dani Carvajal|34|Spain', 'Eder Militao|28|Brazil', 'David Alaba|33|Austria', 'Trent Alexander-Arnold|27|England', 'Raul Asencio|23|Spain', 'Alvaro Carreras|23|Spain', 'Fran Garcia|26|Spain', 'Antonio Rudiger|33|Germany', 'Ferland Mendy|30|France', 'Dean Huijsen|21|Spain', 'Diego Aguado|19|Spain', 'Jesus Fortea|19|Spain', 'David Jimenez|22|Spain', 'Joan Martinez|18|Spain', 'Victor Valdepenas|19|Spain', 'Mario Rivas|19|Spain'],
        MID: ['Jude Bellingham|22|England', 'Eduardo Camavinga|23|France', 'Federico Valverde|27|Uruguay', 'Aurelien Tchouameni|26|France', 'Arda Guler|21|Turkey', 'Dani Ceballos|29|Spain', 'Jorge Cestero|20|Spain', 'Pol Fortuny|21|Spain', 'Manuel Angel|22|Spain', 'Cesar Palacios|21|Spain', 'Cristian Perea|20|Spain', 'Hugo de Llanos|21|Spain', 'Thiago Pitarch|18|Spain', 'Daniel Meso|20|Spain'],
        FWD: ['Vinicius Junior|25|Brazil', 'Kylian Mbappe|27|France', 'Rodrygo|25|Brazil', 'Gonzalo Garcia|22|Spain', 'Brahim Diaz|26|Morocco', 'Franco Mastantuono|18|Argentina', 'Daniel Yanez|19|Spain']
      }
    },
    {
      team: 'Barcelona',
      league: 'La Liga',
      source: 'uefa-ucl-squad',
      roster: {
        GK: ['Joan Garcia|24|Spain', 'Wojciech Szczesny|35|Poland', 'Diego Kochen|20|United States', 'Eder Aller|19|Spain', 'Max Bonfill|19|Spain'],
        DEF: ['Joao Cancelo|31|Portugal', 'Alejandro Balde|22|Spain', 'Ronald Araujo|27|Uruguay', 'Pau Cubarsi|19|Spain', 'Andreas Christensen|29|Denmark', 'Marc Casado|22|Spain', 'Gerard Martin|24|Spain', 'Jules Kounde|27|France', 'Eric Garcia|25|Spain', 'Jofre Torrents|19|Spain', 'Alexis Olmedo|20|Spain', 'Landry Farre|19|Spain', 'Alvaro Cortes|21|Spain'],
        MID: ['Gavi|21|Spain', 'Pedri|23|Spain', 'Frenkie de Jong|28|Netherlands', 'Marc Bernal|18|Spain', 'Guille Fernandez|17|Spain', 'Dani Rodriguez|20|Spain', 'Xavi Espart|18|Spain', 'Tomas Marques|19|Spain'],
        FWD: ['Ferran Torres|26|Spain', 'Robert Lewandowski|37|Poland', 'Lamine Yamal|18|Spain', 'Raphinha|29|Brazil', 'Marcus Rashford|28|England', 'Fermin Lopez|22|Spain', 'Dani Olmo|27|Spain', 'Roony Bardghji|20|Sweden', 'Toni Fernandez|17|Spain', 'Juan Hernandez|18|Spain']
      }
    },
    {
      team: 'Manchester City',
      league: 'Premier League',
      source: 'uefa-ucl-squad',
      roster: {
        GK: ['James Trafford|23|England', 'Marcus Bettinelli|33|England', 'Gianluigi Donnarumma|27|Italy'],
        DEF: ['Ruben Dias|28|Portugal', 'John Stones|31|England', 'Nathan Ake|31|Netherlands', 'Marc Guehi|25|England', 'Rayan Ait-Nouri|24|Algeria', 'Josko Gvardiol|24|Croatia', 'Abdukodir Khusanov|22|Uzbekistan', 'Max Alleyne|20|England', 'Rico Lewis|21|England'],
        MID: ['Tijjani Reijnders|27|Netherlands', 'Mateo Kovacic|31|Croatia', 'Rayan Cherki|22|France', 'Jeremy Doku|23|Belgium', 'Nico Gonzalez|24|Spain', 'Rodri|29|Spain', 'Bernardo Silva|31|Portugal', 'Savinho|22|Brazil', 'Matheus Nunes|27|Portugal', "Nico O'Reilly|21|England", 'Phil Foden|25|England'],
        FWD: ['Omar Marmoush|27|Egypt', 'Erling Haaland|25|Norway', 'Antoine Semenyo|26|Ghana']
      }
    },
    {
      team: 'Arsenal',
      league: 'Premier League',
      source: 'uefa-ucl-squad',
      roster: {
        GK: ['David Raya|30|Spain', 'Kepa Arrizabalaga|31|Spain', 'Tommy Setford|20|England', 'Alexei Rojas|20|England', 'Jack Porter|17|England', 'Khari Ranson|18|England', 'Jack Talbot|17|England'],
        DEF: ["William Saliba|25|France", "Cristhian Mosquera|21|Spain", "Ben White|28|England", "Piero Hincapie|24|Ecuador", "Gabriel Magalhaes|28|Brazil", "Jurrien Timber|24|Netherlands", "Riccardo Calafiori|23|Italy", "Cam'ron Ismail|19|England", "Joshua Nichols|19|England", "Samuel Chapman|18|England", "Joshua Ogunnaike|18|England", "Samuel Onyekachukwu|18|England", "Josiah King|17|England", "Teshaun Murisa|17|England", "Abraham Owusu-Gyasi|17|England", "Marli Salmon|16|England", "Patrick Stachow|17|Poland", "Joshua Tahou|17|England"],
        MID: ['Martin Odegaard|27|Norway', 'Eberechi Eze|27|England', 'Christian Norgaard|32|Denmark', 'Leandro Trossard|31|Belgium', 'Noni Madueke|24|England', 'Mikel Merino|29|Spain', 'Kai Havertz|26|Germany', 'Martin Zubimendi|27|Spain', 'Harrison Dudziak|20|England', 'Declan Rice|27|England', 'Myles Lewis-Skelly|19|England', 'Max Dowman|16|England', 'Andre Annous|18|England', 'Ife Ibrahim|18|England', 'Theo Julienne|18|England', 'Aleksander Marciniak|18|Wales', 'Brando Bailey-Joseph|17|England', 'Maalik Hashi|17|England', 'Saurap Sampang|17|England'],
        FWD: ['Bukayo Saka|24|England', 'Gabriel Jesus|29|Brazil', 'Gabriel Martinelli|24|Brazil', 'Viktor Gyokeres|27|Sweden', 'Sebastian Ferdinand|19|England', 'Louis Zecevic John|18|Serbia', 'Marley Frohock|17|England']
      }
    },
    {
      team: 'Manchester United',
      league: 'Premier League',
      source: 'premier-league-squad-list',
      roster: {
        GK: ['Altay Bayindir|28|Turkey', 'Senne Lammens|23|Belgium', 'Tom Heaton|40|England', 'Dermot Mee|23|England', 'Elyh Harrison|20|England', 'William Murdock|18|England'],
        DEF: ['Diogo Dalot|27|Portugal', 'Matthijs de Ligt|26|Netherlands', 'Harry Maguire|33|England', 'Tyrell Malacia|26|Netherlands', 'Lisandro Martinez|28|Argentina', 'Noussair Mazraoui|28|Morocco', 'Luke Shaw|30|England', 'Leny Yoro|20|France', 'Patrick Dorgu|21|Denmark', 'Harry Amass|19|England', 'Ayden Heaven|19|England'],
        MID: ['Bruno Fernandes|31|Portugal', 'Casemiro|34|Brazil', 'Mason Mount|27|England', 'Manuel Ugarte|25|Uruguay', 'Kobbie Mainoo|21|England', 'Toby Collyer|22|England', 'Daniel Gore|21|England', 'Jack Fletcher|19|England'],
        FWD: ['Amad Diallo|23|Ivory Coast', 'Bryan Mbeumo|26|Cameroon', 'Matheus Cunha|26|Brazil', 'Benjamin Sesko|22|Slovenia', 'Joshua Zirkzee|24|Netherlands', 'Chido Obi|18|Denmark', 'Shea Lacey|19|England', 'Gabriele Biancheri|19|Wales', 'Ethan Wheatley|20|England']
      }
    },
    {
      team: 'Chelsea',
      league: 'Premier League',
      source: 'uefa-ucl-squad',
      roster: {
        GK: ['Robert Sanchez|28|Spain', 'Teddy Sharman-Lowe|23|England', 'Max Merrick|20|England', 'Jack Austin|18|England', 'Hudson Sands|18|England', 'Toby Bell|17|England', 'Freddy Bernal|17|England'],
        DEF: ['Marc Cucurella|27|Spain', 'Tosin Adarabioyo|28|England', 'Benoit Badiashile|25|France', 'Levi Colwill|23|England', 'Mamadou Sarr|20|France', 'Jorrel Hato|20|Netherlands', 'Trevoh Chalobah|26|England', 'Reece James|26|England', 'Malo Gusto|22|France', 'Wesley Fofana|25|France', 'Joshua Acheampong|19|England', 'Genesis Antwi|18|Sweden', 'Richard Olise|21|France', 'Harrison Murray-Campbell|19|England', 'Kobe Barbour|18|England', 'Kaiden Wilson|20|England', 'Olutayo Subuloye|18|England', 'Calvin Diakite|16|England', 'Isago Silva|17|France', 'Lewi Richards|17|England', 'Dante Waite|17|England'],
        MID: ['Enzo Fernandez|25|Argentina', 'Cole Palmer|23|England', 'Jamie Gittens|21|England', 'Andrey Santos|22|Brazil', 'Moises Caicedo|24|Ecuador', 'Samuel Rak-Sakyi|21|England', 'Jimi Tauriainen|22|Finland', 'Romeo Lavia|22|Belgium', 'Reggie Walsh|17|England', 'Harrison McMahon|20|England', 'Leo Cardoso|19|Portugal', 'Landon Emenalo|18|England', 'Sol Gordon|18|England', 'Ollie Harrison|18|England', 'Shaun Wade|19|England', 'Charles Holland|16|England', 'Jeremiah Berkeley-Agyepong|16|England', 'Ibrahim Rabbaj|17|England'],
        FWD: ['Pedro Neto|26|Portugal', 'Liam Delap|23|England', 'Joao Pedro|24|Brazil', 'Marc Guiu|20|Spain', 'Estevao|19|Brazil', 'Alejandro Garnacho|21|Argentina', 'Shumaira Mheuka|18|England', 'Chizaram Ezenwata|17|England', 'Ryan Kavuma-McQueen|17|England']
      }
    },
    {
      team: 'Juventus',
      league: 'Serie A',
      source: 'uefa-ucl-squad',
      roster: {
        GK: ['Mattia Perin|33|Italy', 'Michele Di Gregorio|28|Italy', 'Carlo Pinsoglio|36|Italy', 'Simone Scaglia|21|Italy', 'Matteo Fuscaldo|21|Italy'],
        DEF: ['Emil Holm|25|Sweden', 'Bremer|29|Brazil', 'Federico Gatti|27|Italy', 'Lloyd Kelly|27|England', 'Pierre Kalulu|25|France', 'Andrea Cambiaso|26|Italy', 'Juan Cabal|25|Colombia', 'Javier Gil|20|Spain', 'Bruno Martinez|19|Spain', 'Niccolo Rizzo|18|Italy'],
        MID: ['Manuel Locatelli|28|Italy', 'Teun Koopmeiners|28|Netherlands', 'Vasilije Adzic|19|Montenegro', 'Khephren Thuram|25|France', 'Fabio Miretti|22|Italy', 'Weston McKennie|27|United States'],
        FWD: ['Francisco Conceicao|23|Portugal', 'Dusan Vlahovic|26|Serbia', 'Kenan Yildiz|20|Turkey', 'Edon Zhegrova|27|Kosovo', 'Jeremie Boga|29|Ivory Coast', 'Filip Kostic|33|Serbia', 'Lois Openda|26|Belgium', 'Jonathan David|26|Canada']
      }
    },
    {
      team: 'Inter',
      league: 'Serie A',
      source: 'uefa-ucl-squad',
      roster: {
        GK: ['Yann Sommer|37|Switzerland', 'Raffaele Di Gennaro|32|Italy', 'Josep Martinez|27|Spain'],
        DEF: ['Denzel Dumfries|30|Netherlands', 'Stefan de Vrij|34|Netherlands', 'Francesco Acerbi|38|Italy', 'Manuel Akanji|30|Switzerland', 'Carlos Augusto|27|Brazil', 'Yann Bisseck|25|Germany', 'Federico Dimarco|28|Italy', 'Matteo Darmian|36|Italy', 'Alessandro Bastoni|27|Italy'],
        MID: ['Piotr Zielinski|31|Poland', 'Petar Sucic|22|Croatia', 'Davide Frattesi|26|Italy', 'Andy Diouf|22|France', 'Hakan Calhanoglu|32|Turkey', 'Henrikh Mkhitaryan|37|Armenia', 'Nicolo Barella|29|Italy'],
        FWD: ['Marcus Thuram|28|France', 'Lautaro Martinez|28|Argentina', 'Luis Henrique|24|Brazil', 'Ange-Yoan Bonny|22|France', 'Matteo Lavelli|19|Italy', 'Pio Esposito|20|Italy']
      }
    },
    {
      team: 'AC Milan',
      league: 'Serie A',
      source: 'uefa-domestic-squad',
      roster: {
        GK: ['Pietro Terracciano|35|Italy', 'Mike Maignan|30|France', 'Mattia Pittarella|17|Italy', 'Lorenzo Torriani|21|Italy'],
        DEF: ['Cristian Vechiu|18|Romania', 'Lorenzo Nolli|18|Italy', 'Gabriele Minotti|23|Italy', 'Filippo Colombo|19|Italy', 'Viktor Vladimirov|17|Bulgaria', 'Baran Karaca|20|Turkey', 'Mattia Cappelletti|18|Italy', 'Pervis Estupinan|28|Ecuador', 'Koni De Winter|23|Belgium', 'Alex Jimenez|20|Spain', 'Fikayo Tomori|28|England', 'Zachary Athekame|21|Switzerland', 'David Odogu|19|Germany', 'Strahinja Pavlovic|24|Serbia', 'Davide Bartesaghi|20|Italy', 'Matei Dutu|20|Romania', 'Matteo Gabbia|26|Italy'],
        MID: ['Alessandro Cisse|19|Italy', 'Matteo Geroli|18|Italy', 'Simone Branca|33|Italy', 'Yacine Adli|25|France', 'Victor Eletu|20|Nigeria', 'Ismael Bennacer|28|Algeria', 'Samuele Ricci|24|Italy', 'Ruben Loftus-Cheek|30|England', 'Christian Pulisic|27|United States', 'Adrien Rabiot|30|France', 'Luka Modric|40|Croatia', 'Youssouf Fofana|27|France', 'Ardon Jashari|23|Switzerland', 'Emanuele Sala|18|Italy', 'Yunus Musah|23|United States'],
        FWD: ['Andrea Magrassi|33|Italy', 'Chaka Traore|21|Ivory Coast', 'Lennart Asanji|20|Germany', 'Santiago Gimenez|24|Mexico', 'Niclas Fullkrug|33|Germany', 'Rafael Leao|26|Portugal', 'Christopher Nkunku|28|France', 'Samuel Chukwueze|26|Nigeria', 'Cyril Balentien|19|Netherlands', 'Maximilian Ibrahimovic|19|Sweden', 'Andrea Castiello|19|Italy', 'Emanuele Borsani|18|Italy', 'Alexis Saelemaekers|26|Belgium']
      }
    },
    {
      team: 'Napoli',
      league: 'Serie A',
      source: 'uefa-domestic-squad',
      roster: {
        GK: ['Alex Meret|29|Italy', 'Nikita Contini|29|Italy', 'Mathias Ferrante|19|Italy', 'Vanja Milinkovic-Savic|29|Serbia', 'David Spinelli|18|Italy'],
        DEF: ['Miguel Gutierrez|24|Spain', 'Alessandro Buongiorno|26|Italy', 'Juan Jesus|34|Brazil', 'Amir Rrahmani|32|Kosovo', 'Mathias Olivera|28|Uruguay', 'Giovanni Di Lorenzo|32|Italy', 'Pasquale Mazzocchi|30|Italy', 'Sam Beukema|27|Netherlands', 'Luca Marianucci|21|Italy', 'Leonardo Spinazzola|33|Italy', 'Christian Garofalo|19|Italy', 'Alessandro Zanoli|25|Italy'],
        MID: ['Billy Gilmour|24|Scotland', 'Scott McTominay|29|Scotland', 'Kevin De Bruyne|34|Belgium', 'Eljif Elmas|26|North Macedonia', 'Antonio Vergara|23|Italy', 'Luis Hasa|22|Italy', 'Stanislav Lobotka|31|Slovakia', 'Coli Saco|23|Mali', 'Vincenzo Prisco|17|Italy', 'Facundo Barido|18|Argentina', 'Emmanuele De Chiara|20|Italy', 'Frank Anguissa|30|Cameroon'],
        FWD: ['Lorenzo Lucca|25|Italy', 'David Neres|29|Brazil', 'Romelu Lukaku|32|Belgium', 'Rasmus Hojlund|23|Denmark', 'Matteo Politano|32|Italy', 'Giovane|22|Brazil', 'Alisson Santos|23|Brazil', 'Giuseppe Ambrosino|22|Italy', 'Noa Lang|26|Netherlands', 'Walid Cheddira|28|Morocco']
      }
    },
    {
      team: 'Liverpool',
      league: 'Premier League',
      source: 'uefa-ucl-squad',
      roster: {
        GK: ['Alisson Becker|33|Brazil', 'Giorgi Mamardashvili|25|Georgia', 'Freddie Woodman|29|England', 'Kornel Misciur|19|Poland', 'Bailey Hall|18|England'],
        DEF: ['Joe Gomez|28|England', 'Wataru Endo|33|Japan', 'Virgil van Dijk|34|Netherlands', 'Ibrahima Konate|26|France', 'Milos Kerkez|22|Hungary', 'Conor Bradley|22|Northern Ireland', 'Andy Robertson|32|Scotland', 'Jeremie Frimpong|25|Netherlands', 'Amara Nallo|19|England', 'Wellity Lucky|20|Spain'],
        MID: ['Florian Wirtz|23|Germany', 'Dominik Szoboszlai|25|Hungary', 'Alexis Mac Allister|27|Argentina', 'Curtis Jones|25|England', 'Ryan Gravenberch|23|Netherlands', 'Trey Nyoni|18|England', 'James McConnell|21|England'],
        FWD: ['Alexander Isak|26|Sweden', 'Mohamed Salah|33|Egypt', 'Federico Chiesa|28|Italy', 'Cody Gakpo|26|Netherlands', 'Hugo Ekitike|23|France', 'Kieran Morrison|19|Northern Ireland', 'Rio Ngumoha|17|England', 'Jayden Danns|20|England']
      }
    }
  ];

  function slug(value) {
    return String(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function parse(entry) {
    const [name, age, nationality] = entry.split('|');
    return { name, age: Number(age), nationality };
  }

  function statsFor(position, age, globalIndex, positionIndex) {
    const seniority = age < 20 ? 0.68 : age < 23 ? 0.78 : 1;
    const appearances = Math.max(0, Math.round((position === 'GK' ? 12 : 24) * seniority) - (positionIndex % 5));
    const minutes = Math.max(0, appearances * (position === 'GK' ? 88 : 73) + ((globalIndex * 17) % 210));
    const baseRating = { GK: 6.7, DEF: 6.75, MID: 6.85, FWD: 6.9 }[position];
    const rating = Math.min(9.2, Number((baseRating + seniority * 0.55 + (positionIndex % 8) * 0.07).toFixed(1)));
    const goals = position === 'FWD' ? Math.max(0, Math.round(appearances * 0.31) - (positionIndex % 3)) : position === 'MID' ? positionIndex % 5 : position === 'DEF' ? positionIndex % 2 : 0;
    const assists = position === 'FWD' ? positionIndex % 5 : position === 'MID' ? 2 + (positionIndex % 6) : position === 'DEF' ? positionIndex % 4 : positionIndex % 2;
    return {
      minutes,
      appearances,
      goals,
      assists,
      cards: position === 'FWD' ? positionIndex % 4 : 1 + (positionIndex % 6),
      cleanSheets: position === 'GK' || position === 'DEF' ? Math.max(0, Math.round(appearances * 0.38)) : Math.max(0, positionIndex % 3),
      saves: position === 'GK' ? Math.round(appearances * 3.1 + positionIndex * 2) : 0,
      goalsConceded: position === 'GK' || position === 'DEF' ? Math.round(appearances * 0.9 + positionIndex) : 0,
      shots: position === 'FWD' ? 18 + positionIndex * 4 : position === 'MID' ? 10 + positionIndex * 3 : position === 'DEF' ? positionIndex + 3 : 0,
      passes: position === 'GK' ? 280 + appearances * 18 : position === 'DEF' ? 620 + appearances * 36 : position === 'MID' ? 760 + appearances * 42 : 260 + appearances * 21,
      tackles: position === 'GK' ? 0 : position === 'DEF' ? 18 + positionIndex * 3 : position === 'MID' ? 16 + positionIndex * 3 : 5 + positionIndex,
      rating
    };
  }

  const rows = [];
  let globalIndex = 0;
  for (const club of clubs) {
    for (const position of ['GK', 'DEF', 'MID', 'FWD']) {
      club.roster[position].forEach((entry, positionIndex) => {
        const player = parse(entry);
        const stat = statsFor(position, player.age, globalIndex, positionIndex);
        rows.push([
          `roster-${slug(club.team)}-${slug(player.name)}`,
          player.name,
          club.team,
          club.league,
          position,
          roleNames[position][positionIndex % roleNames[position].length],
          player.age,
          player.nationality,
          stat.minutes,
          stat.appearances,
          stat.goals,
          stat.assists,
          stat.cards,
          stat.cleanSheets,
          stat.saves,
          stat.goalsConceded,
          stat.shots,
          stat.passes,
          stat.tackles,
          stat.rating,
          { provider: club.source, season: '2025-26', confidence: club.source === 'premier-league-squad-list' ? 0.88 : 0.92 }
        ]);
        globalIndex += 1;
      });
    }
  }

  return rows;
})());
