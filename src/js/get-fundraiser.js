const mapping = {
  // France
  // 14274: { // FFME - Rockclimber
  //   url: ' https://www.helloasso.com/associations/rockclimber/formulaires/1/widget'
  // },

  // Greenspit
  947587: {
    // Mollans
    url: 'https://greenspits.com/topo/mollans-sur-ouveze/',
  },
  1150854: {
    // Ramirole
    url: 'https://greenspits.com/topo/la-ramirole-2/',
  },
  820728: {
    // Maupas
    url: 'https://greenspits.com/topo/la-carriere-du-maupas/',
  },

  // VTNO : Site et secteurs de Presles
  107049: {
    // Presles
    url: 'https://www.vtno.fr/adh%C3%A9sion/',
  },
  318456: {
    // Presles - Dalarhum
    url: 'https://www.vtno.fr/adh%C3%A9sion/',
  },
  276273: {
    // Presles - École d'artif
    url: 'https://www.vtno.fr/adh%C3%A9sion/',
  },
  177942: {
    // Presles - Triangle de Choranche
    url: 'https://www.vtno.fr/adh%C3%A9sion/',
  },
  176860: {
    // Presles - Daladom
    url: 'https://www.vtno.fr/adh%C3%A9sion/',
  },
  103555: {
    // Presles - Rocher de Nugues, Tina dalle
    url: 'https://www.vtno.fr/adh%C3%A9sion/',
  },
  103083: {
    // Presles - Balme étrange
    url: 'https://www.vtno.fr/adh%C3%A9sion/',
  },
  103082: {
    // Presles - Pierrot beach
    url: 'https://www.vtno.fr/adh%C3%A9sion/',
  },
  43267: {
    // Presles - Rocher des Nugues
    url: 'https://www.vtno.fr/adh%C3%A9sion/',
  },
  42469: {
    // Presles - Dalles de Télébus
    url: 'https://www.vtno.fr/adh%C3%A9sion/',
  },
  42426: {
    // Presles - Pas du Ranc
    url: 'https://www.vtno.fr/adh%C3%A9sion/',
  },
  42425: {
    // Presles - Grottes de Choranche
    url: 'https://www.vtno.fr/adh%C3%A9sion/',
  },
  42253: {
    // Presles - Paroi Rouge
    url: 'https://www.vtno.fr/adh%C3%A9sion/',
  },
  41298: {
    // Presles - Fond du cirque
    url: 'https://www.vtno.fr/adh%C3%A9sion/',
  },
  40768: {
    // Presles - Chrysanthèmes
    url: 'https://www.vtno.fr/adh%C3%A9sion/',
  },
  40767: {
    // Presles - Fhara Kiri
    url: 'https://www.vtno.fr/adh%C3%A9sion/',
  },
  40766: {
    // Presles - Eliane
    url: 'https://www.vtno.fr/adh%C3%A9sion/',
  },
  40756: {
    // Presles - Buis
    url: 'https://www.vtno.fr/adh%C3%A9sion/',
  },
  549732: {
    // Presles - Festival
    url: 'https://www.vtno.fr/adh%C3%A9sion/',
  },

  // America
  14080: {
    // Access Fund USA
    url: 'https://www.accessfund.org/join-or-give',
  },
  252272: {
    // British Columbia
    url: 'https://access-society.ca/Donate',
  },

  // UK Boltfund
  1203403: {
    // Peak District
    url: 'http://thepeakboltfund.blogspot.com/',
  },
  1203390: {
    // Lake District
    url: 'https://www.cumbriaboltfund.co.uk/bolting',
  },
  1264698: {
    // Cheshire
    url: 'https://www.paypal.com/donate/?cmd=_s-xclick&hosted_button_id=XQ4S2XU3WH5F6',
  },

  14474: {
    // Scotland
    url: 'https://www.7amax.co.uk/',
  },

  // Australie
  1274261: {
    //Tasmanie
    url: 'http://www.thesarvo.com/confluence/display/cctpublic/Home',
  },
  
  // Others
  14151: {
    // Malta
    url: 'https://maltaclimbingclub.org/bolt-fund/',
  },

  14125: {
    // Philippines
    url: 'http://www.climbphilippines.com/boltfund.html',
  },
    
  14154: {
    // Malaisie
    url: 'https://www.malaysianboltingfund.com/',
  },
  
  14137:{
    //Nouvelle-Zélande
    url: 'https://alpineclub.org.nz/product/bolting-fund/',
  },
  
};

const intersection = function (array1, array2) {
  if (!array1 || !array2) {
    return [];
  }

  return array1.filter((value) => array2.includes(value));
};

export default function (document) {
  // Only areas, waypoints, routes
  if (!['r', 'w', 'a'].includes(document.type)) {
    return null;
  }

  if (document.type === 'r') {
    // routes
    // only mountain_climbing and rock_climbing activity
    if (!intersection(document.activities, ['mountain_climbing', 'rock_climbing']).length) {
      return null;
    }

    // only P1 and P1+ routes
    if (!['P1', 'P1+'].includes(document.equipment_rating)) {
      return null;
    }
  } else if (document.type === 'w') {
    // waypoints
    // only climbing outdoor sites
    if (document.waypoint_type !== 'climbing_outdoor') {
      return null;
    }

    // only waypoints with P1 and P1+ routes
    if (!intersection(document.equipment_ratings, ['P1', 'P1+']).length) {
      return null;
    }
  }

  // this array will contains list of document to look for associated fundraiser
  // the logic is to look for the more precise entities before
  // 1. route itself for routes
  // 2. waypoint itself for waypoints
  // 2. or main waypoint for routes
  // to do : check for parents of main waypoint
  // 3. then areas of type range
  // 4. then areas of type admin_limits
  // 5. then areas of type country
  const documents = [];

  documents.push(document);

  if (document.type === 'r') {
    const mainWaypoint = document.associations.waypoints.find((w) => w.document_id === document.main_waypoint_id);

    if (mainWaypoint) {
      documents.push(mainWaypoint);
    }
  }

  if (document.areas) {
    documents.push(...document.areas.filter((area) => area.area_type === 'range'));
    documents.push(...document.areas.filter((area) => area.area_type === 'admin_limits'));
    documents.push(...document.areas.filter((area) => area.area_type === 'country'));
  }

  for (const document of documents) {
    if (mapping[document.document_id]) {
      return mapping[document.document_id];
    }
  }

  return null;
}
