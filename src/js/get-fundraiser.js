const mapping = {
  // 14274: { // France FFME
  //   url: ' https://www.helloasso.com/associations/rockclimber/formulaires/1/widget'
  // },
  
  //Greenspit
  // 947587: { //Mollans
  // url: 'https://greenspits.com/topo/mollans-sur-ouveze/'
  // },
  // 1150854: { //Ramirole
  // url: 'https://greenspits.com/topo/la-ramirole-2/'
  // },
  // 820728: { //Maupas
  // url: 'https://greenspits.com/topo/la-carriere-du-maupas/'
  // },
  
  // 14080: { // Access Fund USA
  // url: 'https://www.accessfund.org/join-or-give'
  // },

  // UK Boltfund
  // 1203403: { //Peak District
  // url : 'http://thepeakboltfund.blogspot.com/'
  // },
  // 1203390: { //Lake District
  // url : 'https://www.cumbriaboltfund.co.uk/bolting'
  // },
  // 1264698: { //Cheshire
  // url: 'https://www.paypal.com/donate/?cmd=_s-xclick&hosted_button_id=XQ4S2XU3WH5F6'
  // },
  

  14474: {
    // Scotland
    url: 'https://www.7amax.co.uk/',
  },

  14151: {
    // Malta
    url: 'https://maltaclimbingclub.org/bolt-fund/',
  },

  14125: {
    // Philippines
    url: 'http://www.climbphilippines.com/boltfund.html',
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
