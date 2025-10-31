export interface DayActivity {
  day: string;
  title: string;
  activities: string[];
}

export interface Destination {
  name: string;
  image: string;
  description: string;
  itinerary: DayActivity[];
  highlights: string[];
}

export interface DestinationsData {
  [key: string]: Destination;
}

export const destinations: DestinationsData = {
  seville: {
    name: "Siviglia, Spagna",
    image: "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=800&h=600&fit=crop&crop=center",
    description: "Il cuore dell'Andalusia tra flamenco e architettura moresca. Siviglia incanta con i suoi vicoli medievali, i palazzi arabi e l'atmosfera calda e accogliente.",
    itinerary: [
      {
        day: "Venerdì 6 Dicembre",
        title: "Arrivo e primo sguardo su Siviglia",
        activities: [
          "Arrivo all'aeroporto di Siviglia",
          "Trasferimento in centro",
          "Check-in in hotel nel centro storico",
          "Pranzo con tapas tradizionali",
          "Visita alla Cattedrale di Siviglia",
          "Passeggiata nel Barrio de Santa Cruz",
          "Cena con spettacolo di flamenco"
        ]
      },
      {
        day: "Sabato 7 Dicembre",
        title: "I tesori di Siviglia",
        activities: [
          "Colazione andalusa",
          "Visita all'Alcázar di Siviglia",
          "Passeggiata a Plaza de España",
          "Pranzo tradizionale",
          "Visita alla Torre del Oro",
          "Shopping nel centro storico",
          "Cena in ristorante tipico"
        ]
      },
      {
        day: "Domenica 8 Dicembre",
        title: "Ultimo giorno e partenza",
        activities: [
          "Colazione in hotel",
          "Visita al Metropol Parasol",
          "Passeggiata finale per la città",
          "Pranzo di arrivederci",
          "Shopping per souvenir",
          "Trasferimento all'aeroporto",
          "Partenza per Roma"
        ]
      }
    ],
    highlights: [
      "Architettura moresca e gotica",
      "Flamenco e cultura andalusa",
      "Tapas e cucina tradizionale",
      "Vicoli medievali e atmosfera",
      "Clima mite e accoglienza"
    ]
  },
  london: {
    name: "Londra, Regno Unito",
    image: "https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=800&h=600&fit=crop&crop=center",
    description: "La capitale britannica tra storia, cultura e modernità. Un weekend perfetto per immergersi nell'atmosfera londinese tra monumenti iconici, mercati tradizionali e la vivace vita notturna.",
    itinerary: [
      {
        day: "Venerdì 6 Dicembre",
        title: "Arrivo e primo impatto con Londra",
        activities: [
          "Arrivo all'aeroporto di Heathrow/Luton",
          "Trasferimento in centro con metropolitana",
          "Check-in in hotel nel centro",
          "Pranzo in un pub tradizionale",
          "Visita al Big Ben e Houses of Parliament",
          "Passeggiata lungo il Tamigi",
          "Cena a Covent Garden"
        ]
      },
      {
        day: "Sabato 7 Dicembre",
        title: "I tesori di Londra",
        activities: [
          "Colazione all'inglese",
          "Visita al British Museum",
          "Shopping a Oxford Street",
          "Pranzo a Borough Market",
          "Visita alla Tower of London",
          "Passeggiata a Camden Market",
          "Cena e spettacolo a West End"
        ]
      },
      {
        day: "Domenica 8 Dicembre",
        title: "Ultimo giorno e partenza",
        activities: [
          "Colazione in hotel",
          "Visita al Buckingham Palace",
          "Passeggiata a Hyde Park",
          "Pranzo a Notting Hill",
          "Shopping finale a Portobello Road",
          "Trasferimento all'aeroporto",
          "Partenza per Roma"
        ]
      }
    ],
    highlights: [
      "Monumenti iconici e storia millenaria",
      "Mercati tradizionali e shopping",
      "Teatro e cultura britannica",
      "Cucina internazionale e pub",
      "Trasporti efficienti e moderni"
    ]
  },
  birmingham: {
    name: "Birmingham, Regno Unito",
    image: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&h=600&fit=crop&crop=center",
    description: "Il cuore industriale dell'Inghilterra con un'anima creativa. Birmingham offre una miscela unica di storia industriale, cultura contemporanea e una scena culinaria in crescita.",
    itinerary: [
      {
        day: "Venerdì 6 Dicembre",
        title: "Arrivo e scoperta del centro",
        activities: [
          "Arrivo all'aeroporto di Birmingham",
          "Trasferimento in centro",
          "Check-in in hotel",
          "Pranzo in un ristorante locale",
          "Visita al Birmingham Museum & Art Gallery",
          "Passeggiata a Victoria Square",
          "Cena nel quartiere di Digbeth"
        ]
      },
      {
        day: "Sabato 7 Dicembre",
        title: "Storia e cultura di Birmingham",
        activities: [
          "Colazione tradizionale",
          "Visita al Thinktank Science Museum",
          "Passeggiata lungo i canali",
          "Pranzo a Jewellery Quarter",
          "Visita alla Cattedrale di Birmingham",
          "Shopping a Bullring & Grand Central",
          "Cena e musica dal vivo"
        ]
      },
      {
        day: "Domenica 8 Dicembre",
        title: "Ultimo giorno e partenza",
        activities: [
          "Colazione in hotel",
          "Visita al Cadbury World",
          "Passeggiata a Cannon Hill Park",
          "Pranzo tradizionale",
          "Shopping finale",
          "Trasferimento all'aeroporto",
          "Partenza per Roma"
        ]
      }
    ],
    highlights: [
      "Storia industriale e innovazione",
      "Musei e gallerie d'arte",
      "Cucina multiculturale",
      "Musica e vita notturna",
      "Parchi e spazi verdi"
    ]
  },
  geneva: {
    name: "Ginevra, Svizzera",
    image: "https://images.unsplash.com/photo-1528722828814-77b9b83aafb2?w=800&h=600&fit=crop&crop=center",
    description: "Elegante città svizzera tra lago e montagne. Ginevra offre un mix perfetto di natura, cultura e lusso, con il Lago di Ginevra e le Alpi come sfondo mozzafiato.",
    itinerary: [
      {
        day: "Venerdì 6 Dicembre",
        title: "Arrivo e primo sguardo su Ginevra",
        activities: [
          "Arrivo all'aeroporto di Ginevra",
          "Trasferimento in centro",
          "Check-in in hotel sul lago",
          "Pranzo in ristorante con vista lago",
          "Passeggiata lungo il Quai du Mont-Blanc",
          "Visita al Jet d'Eau",
          "Cena in ristorante gourmet"
        ]
      },
      {
        day: "Sabato 7 Dicembre",
        title: "Cultura e natura a Ginevra",
        activities: [
          "Colazione svizzera",
          "Visita al Museo d'Arte e Storia",
          "Passeggiata nella Vieille Ville",
          "Pranzo tradizionale svizzero",
          "Escursione in montagna (se tempo permettendo)",
          "Shopping di lusso",
          "Cena con vista sulle Alpi"
        ]
      },
      {
        day: "Domenica 8 Dicembre",
        title: "Ultimo giorno e partenza",
        activities: [
          "Colazione in hotel",
          "Visita al Palazzo delle Nazioni",
          "Passeggiata nei giardini botanici",
          "Pranzo al lago",
          "Relax finale",
          "Trasferimento all'aeroporto",
          "Partenza per Roma"
        ]
      }
    ],
    highlights: [
      "Lago di Ginevra e paesaggi alpini",
      "Cultura internazionale e diplomazia",
      "Lusso e orologi svizzeri",
      "Cucina raffinata e cioccolato",
      "Natura incontaminata e relax"
    ]
  }
};


