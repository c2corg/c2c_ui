var fr = function (n, ord) {
  if (ord) return n == 1 ? 'one' : 'other';
  return n >= 0 && n < 2 ? 'one' : 'other';
};
var select = function (value, data) {
  return {}.hasOwnProperty.call(data, value) ? data[value] : data.other;
};
var number = function (value, name, offset) {
  if (!offset) return value;
  if (isNaN(value))
    throw new Error(
      "Can't apply offset:" +
        offset +
        ' to argument `' +
        name +
        '` with non-numerical value ' +
        JSON.stringify(value) +
        '.'
    );
  return value - offset;
};
var plural = function (value, offset, lcfunc, data, isOrdinal) {
  if ({}.hasOwnProperty.call(data, value)) return data[value];
  if (offset) value -= offset;
  var key = lcfunc(value, isOrdinal);
  return key in data ? data[key] : data.other;
};

export default {
  1: {
    paragliding_ratings: function (d) {
      return (
        select(d.GENDER, { male: 'He', female: 'She', other: 'They' }) +
        ' found ' +
        plural(d.RES, 0, fr, { 0: 'no results', one: '1 result', other: number(d.RES, 'RES') + ' results' }) +
        '.'
      );
    },
  },
  2: {
    paragliding_ratings: function (d) {
      return 'P2';
    },
  },
  3: {
    paragliding_ratings: function (d) {
      return 'P3';
    },
  },
  4: {
    paragliding_ratings: function (d) {
      return 'P4';
    },
  },
  '1 or 2 complications (steeper or narrow section...)': function (d) {
    return '1 ou 2 complications (plus pentu ou étroiture...)';
  },
  '1d_to_3d': {
    severities: function (d) {
      return 'de 1 à 3 jours';
    },
  },
  '1m_to_3m': {
    severities: function (d) {
      return 'de 1 à 3 mois';
    },
  },
  '3h+': {
    access_times: function (d) {
      return '> 3h';
    },
  },
  '4d_to_1m': {
    severities: function (d) {
      return 'de 4 jours à un mois';
    },
  },
  'Accident database': function (d) {
    return 'Incidents et accidents';
  },
  'Activity feed': function (d) {
    return "Fil d'activité";
  },
  Add: function (d) {
    return 'Ajouter';
  },
  'Add here maps not automatically referenced': function (d) {
    return 'Ajouter ici les cartes non ajoutées automatiquement';
  },
  'Add images': function (d) {
    return 'Ajouter des images';
  },
  'Add the first outing': function (d) {
    return 'Ajouter la première sortie';
  },
  'Additional information': function (d) {
    return 'Informations supplémentaires';
  },
  'Anonymity and confidentiality': function (d) {
    return 'Anonymat et confidentialité';
  },
  'Are you sure you want to delete this document?': function (d) {
    return 'Êtes-vous sûr(e) de vouloir supprimer ce document ? \nAttention, les photos associées ne seront pas supprimées et deviendront orphelines. \nSi vous souhaitez juste modifier le titre ou les documents associés (ex : déplacer une sortie vers un autre itinéraire), il suffit de modifier le document.\nSi ce document est un doublon comportant des photos, demandez @Modo_Topo_FR de fusionner les doublons pour déplacer les photos sur le document conservé.';
  },
  'Are you sure you want to delete this locale?': function (d) {
    return 'Êtes-vous sûr(e) de vouloir supprimer cette version linguistique ?';
  },
  'Are you sure you want to merge?': function (d) {
    return 'Êtes-vous sur de vouloir fusionner ?';
  },
  'Are you sure you want to revert to this version of the document?': function (d) {
    return 'Êtes-vous sûr de vouloir restaurer cette version du document ?';
  },
  'Articles, waypoints or routes to be linked.': function (d) {
    return 'Articles, points de passage et itinéraires attachés';
  },
  'Articles, waypoints, routes or books to be linked.': function (d) {
    return 'Articles, points de passage, itinéraires et ouvrages attachés';
  },
  'Associated outings': function (d) {
    return 'Sorties associées';
  },
  'Associated routes': function (d) {
    return 'Itinéraires associés';
  },
  'Associated routes cotations': function (d) {
    return 'Cotations des itinéraires associés au point de passage';
  },
  Association: function (d) {
    return 'Camptocamp Association';
  },
  'Associations history': function (d) {
    return 'Historique des associations';
  },
  'Attribution — You must give appropriate credit, provide a link to the license, and indicate if changes were made.': function (
    d
  ) {
    return "Attribution — Vous devez créditer l'Œuvre, intégrer un lien vers la licence et indiquer si des modifications ont été effectuées à l'Oeuvre. ";
  },
  'Average slope (degrees)': function (d) {
    return 'Pente moyenne (degrés)';
  },
  'Average slope in degree': function (d) {
    return 'Pente moyenne en degrés';
  },
  'Back to code': function (d) {
    return 'Retour au code';
  },
  'Back to edit mode': function (d) {
    return 'Retour en mode édition';
  },
  'Base layer': function (d) {
    return 'Fond de carte';
  },
  'Basemap (at)': {
    'Map layer': function (d) {
      return 'Autriche';
    },
  },
  'Basemap ortho (at)': {
    'Map layer': function (d) {
      return 'Autriche Sat';
    },
  },
  'Beware of case-sensitive login and password': function (d) {
    return 'Attention, identifiant et mot de passe sont sensibles à la casse (majuscule et minuscule).';
  },
  'Block account': function (d) {
    return 'Bloquer cet utilisateur';
  },
  'Book content': function (d) {
    return "Rapide description du contenu de l'ouvrage";
  },
  'Books and websites not already associated to this route': function (d) {
    return "Indiquez l'origine des informations de l'itinéraire parcouru. Un topo-livre ou un magazine doit être associé à l'itinéraire (ne pas le mentionner dans ce champ). Ce champ est prévu pour les liens vers des topos en ligne, des blogs, des sources non diffusées (cahier dans un refuge ou un bar), ou des infos complémentaires concernant les topo-livres (schéma faux, etc).";
  },
  'Both results and map': function (d) {
    return 'Résultats et carte';
  },
  'Briefly describe any injuries. Comments that do not fit into any other fields can be entered here.': function (d) {
    return "Décrivez brièvement les blessures éventuelles, et ce que vous feriez aujourd'hui avec du recul. Les commentaires qui n'entrent dans aucun autre champ peuvent être saisis ici.";
  },
  'Camptocamp.org aims to facilitate information sharing between mountain addicts and contribute to the safety of mountain activities.': function (
    d
  ) {
    return "Camptocamp.org a pour but de faciliter le partage d'informations entre les pratiquants de sports de montagne et de contribuer à la sécurité des activités montagne.";
  },
  Cancel: function (d) {
    return 'Annuler';
  },
  'Cards mode': function (d) {
    return 'Vue en cards';
  },
  'Change account parameters': function (d) {
    return 'Modifier les paramètres du compte';
  },
  'Change password': function (d) {
    return 'Modifier le mot de passe';
  },
  'Checking...': function (d) {
    return 'En cours de vérification ...';
  },
  Child: function (d) {
    return 'Enfant';
  },
  Clear: function (d) {
    return 'Effacer';
  },
  Close: function (d) {
    return 'Fermer';
  },
  Collapse: function (d) {
    return 'Replier';
  },
  Comments: function (d) {
    return 'Commentaires';
  },
  'Comments are disabled.': function (d) {
    return 'Les commentaires ne sont pas autorisés sur ce document.';
  },
  'Communication of the individual objectives and expectations, the thoughts and observations during the outing, discussions on new strategies, the way the group conducted itself and divided responsibilities, was the group used to working together, core aspirations, etc.': function (
    d
  ) {
    return 'Communication des objectifs et attentes de chacun, des craintes et observations en cours de sortie, briefing pour établir de nouvelles stratégies, éléments de conduite de groupe et de responsabilités, groupe habitué à fonctionner ensemble ou non, émulation, etc.';
  },
  'Compare selected versions': function (d) {
    return 'Comparer les versions sélectionnées';
  },
  'Conditions, summits, routes': function (d) {
    return 'Conditions, sommets, itinéraires';
  },
  Confirm: function (d) {
    return 'Confirmer';
  },
  'Contain invalid character(s)': {
    'API message': function (d) {
      return 'Contient un ou plusieurs caractères invalides';
    },
  },
  'Continue the discussion': function (d) {
    return 'Continuer la discussion';
  },
  'Contribute to common knowledge': function (d) {
    return "Participer à la construction d'un savoir collectif";
  },
  'Contribute to maintainance': function (d) {
    return 'Contribuer à la maintenance';
  },
  Contributor: function (d) {
    return 'Contributeur';
  },
  'Create a new report': function (d) {
    return 'Créer un nouveau compte-rendu';
  },
  'Created on': function (d) {
    return 'Crée le';
  },
  'Creation?': function (d) {
    return 'Création ?';
  },
  'Current password': function (d) {
    return 'Mot de passe actuel';
  },
  'Data like orientation, rock type, route type (such as return trip or loop) and route configuration type (such as ridge or gully).': function (
    d
  ) {
    return "Données techniques, comme l'orientation, le type de roche ou la configuration générale de l'itinéraire (arête, pilier...)";
  },
  'Delete this document': function (d) {
    return 'Supprimer ce document';
  },
  'Delete this locale': function (d) {
    return 'Supprimer cette version linguistique';
  },
  'Describe access': function (d) {
    return "Décrivez ici l'accès";
  },
  'Describe access period': function (d) {
    return "Précisez la période d'accès";
  },
  'Describe access restrictions': function (d) {
    return "Décrire les restrictions d'accès";
  },
  'Describe here the gear needed for this route': function (d) {
    return 'Précisez ici le matériel spécifique qu\'il faut emporter en plus de l\'équipement usuel. Seul le matériel "exotique" (en qualité ou quantité) doit être mentionné. Exemples de mentions inutiles : DVA, pelle, sonde, piolet, crampons, matériel de glacier (le champ "matériel de glacier" suffit), coinceurs et sangles sans plus de précision.';
  },
  'Describe here the waypoint': function (d) {
    return 'Organisez la description avec des sous titres : balises ## , ### , #### en début de ligne.';
  },
  'Describe here your issue': function (d) {
    return 'Décrire le problème ici';
  },
  'Describe historical information about the route (date, names..) here': function (d) {
    return "Précisez ici les informations historiques de l'itinéraire : ouverture du bas ou équipement (du haut), premières ascensions, premières descentes à ski/surf, rééquipements, éboulements, etc. Mentionnez la date, le nom des protagonistes, et le club ou organisme ayant financé le matériel laissé en place.";
  },
  'Describe opening hours': function (d) {
    return "Précisez les heures d'ouverture";
  },
  'Describe opening periods': function (d) {
    return "Précisez les périodes d'ouverture";
  },
  'Describe pedestrian access': {
    $$noContext: function (d) {
      return "Décrire l'accès pédestre";
    },
    hut: function (d) {
      return "Décrire l'accès";
    },
  },
  'Describe pt access': function (d) {
    return "Décrire l'accès au point de passage";
  },
  'Describe road access': function (d) {
    return "Décrire l'accès routier et les commodités (logement, restauration, etc.)";
  },
  'Describe the conditions you encountered during your outing': function (d) {
    return 'Décrivez les conditions que vous avez rencontrées lors de votre sortie';
  },
  'Describe the information gathered before the outing and how these evolved once on route: weather forecast, avalanche risk reports, amount of refreezing, condition of the snow/ice/rock, reports from the previous days, etc.': function (
    d
  ) {
    return "Décrivez les informations récoltées avant la sortie et le suivi de leur évolution sur le terrain. Cela concerne les prévisions météo, les bulletins d'évaluation du risque d'avalanche, la qualité du regel, la qualité de la neige/glace/rocher, les compte rendu des jours précédents, etc.";
  },
  'Detailed figures, like ratings, height differences, frequentation...': function (d) {
    return 'Données détaillées (cotations, dénivelés, fréquentation...)';
  },
  'Detailed information': function (d) {
    return 'Informations détaillées';
  },
  Details: function (d) {
    return 'Détails';
  },
  'Details of the actual outing and the incident. If you have already written up your outing, you only need to describe the incident, then link it to your outing report (after first uploading it)': function (
    d
  ) {
    return "Décrivez le déroulement de la sortie et de l'incident/accident. Si vous avez déjà saisi une sortie, vous pouvez décrire uniquement l'évènement, puis associez ce compte rendu à la sortie (après l'avoir enregistré).";
  },
  'Details on participants and event context': function (d) {
    return "Détails sur les participants et le contexte de l'évènement";
  },
  'Differences between versions': function (d) {
    return 'Différences entre les versions';
  },
  'Do you really want to leave? you have unsaved changes!': function (d) {
    return "Voulez-vous vraiment quitter cette page ? Des changements n'ont pas été sauvegardés !";
  },
  'Download outings': function (d) {
    return 'Télécharger les sorties';
  },
  'Drop images here or click to upload': function (d) {
    return "Faites glisser des images ici ou cliquez pour les sélectionner\nCes images seront diffusées sous licence <a href=\"https://www.camptocamp.org/articles/106728\">Creative Commons</a>.\nSi vous n'êtes pas l'auteur de l'image, vous ne pouvez pas la téléverser, à moins que l'auteur n'ait donné son accord pour qu'elle soit diffusée sous la licence Creative-Commons correspondante.\nLes images de plus de 2Mo sont redimensionnées par le navigateur avant d'être envoyées.";
  },
  Duration: function (d) {
    return 'Durée';
  },
  'Duration (hrs)': function (d) {
    return 'Durée (h)';
  },
  EULA: function (d) {
    return 'CGU';
  },
  Edit: function (d) {
    return 'Modifier';
  },
  'Edit a document': function (d) {
    return 'Modifier le document';
  },
  'Edit associations': function (d) {
    return 'Modifier les associations';
  },
  'Edit categories': function (d) {
    return 'Modifier les catégories';
  },
  'Edit titles': function (d) {
    return 'Modifier les titres';
  },
  Elevation: function (d) {
    return 'Altitude';
  },
  'Elevation (m)': function (d) {
    return 'Altitude (m)';
  },
  Email: function (d) {
    return 'Adresse email';
  },
  'Everything about ratings : difficulties, exposition...': function (d) {
    return "Rentrez ici la totalité des cotations de l'itinéraire (difficulté, exposition, qualité de l'équipement...)";
  },
  Expand: function (d) {
    return 'Déplier';
  },
  'Fauna protection areas': function (d) {
    return 'Faune';
  },
  'Fauna protection site:': function (d) {
    return 'Site de protection de la faune :';
  },
  'Filter on map extent': function (d) {
    return 'Limiter la recherche à la carte visible';
  },
  'Followed users': function (d) {
    return 'Contributeurs suivis';
  },
  'Forgot password?': function (d) {
    return 'Mot de passe oublié ?';
  },
  'Forum username': function (d) {
    return 'Pseudo forum';
  },
  Fullname: function (d) {
    return 'Nom';
  },
  'GPS Track': function (d) {
    return 'Trace GPS';
  },
  General: function (d) {
    return 'Général';
  },
  'General information': function (d) {
    return 'Informations générales';
  },
  Geolocation: function (d) {
    return 'Géolocalisation';
  },
  'Go to the previous page': function (d) {
    return 'Retourner à la page précédente';
  },
  'Had a timetable for the route been foreseen? Did you maintain the schedule? Was time a factor in causing the incident?': function (
    d
  ) {
    return "Un horaire avait-il été prévu ? A t-il été tenu ? La gestion du temps a t-elle eu une influence sur le déclenchement de l'événement ?";
  },
  'Has this experience changed your habits? Describe the lessons you have learned from this experience': function (d) {
    return 'Cet évènement a-t-il modifié vos habitudes ? Quels enseignements en avez-vous tiré ?';
  },
  'Have an account?': function (d) {
    return 'Déjà inscrit(e) ?';
  },
  'Have you (re)evaluated the risks at each change in the situation? What factors might have affected your awareness, such as tiredness, stress, relaxing having passed the main difficulties or on the descent, on a section reputed to be easy, presence of footprints or other people, complete confidence in the leader of the group, etc.': function (
    d
  ) {
    return "Avez-vous (ré)évalué les risques à chaque changement de situation ?\nConsidérez des facteurs qui ont pu influencer votre niveau d'attention tels que la fatigue, le stress, la baisse d'attention une fois les difficultés passées ou à la descente, un secteur connu ou réputé facile, la présence de traces ou d'autres personnes, une confiance totale dans le responsable du groupe, etc.";
  },
  Heading: function (d) {
    return 'Titre';
  },
  Help: function (d) {
    return 'Aide';
  },
  'Help research activities to define new prevention means': function (d) {
    return 'Aider la recherche scientifique à dégager des pistes de prévention';
  },
  'Here is the list of users you are following and whose activity you will see in your personal feed.': function (d) {
    return 'Voici la liste des contributeurs que vous suivez et dont vous verrez les activités dans votre fil personnel.';
  },
  'Here you may set activity and region filters that will apply to the homepage feed.': function (d) {
    return "Définissez ici les filtres d'activités et de régions qui seront appliqués dans le fil de la page d'accueil.";
  },
  History: function (d) {
    return 'Versions';
  },
  'History is missing, please provide it if you have information.': function (d) {
    return "L'historique est manquant, n'hésitez pas à partager toute information en votre possession.";
  },
  Home: function (d) {
    return 'Accueil';
  },
  'Home page feed parameters': function (d) {
    return "Paramètre du fil d'activité sur la page d'accueil";
  },
  'How is my testimony used ? How / why is it useful ?': function (d) {
    return 'À quoi sert mon témoignage ?';
  },
  'I have read and agree to the terms of use': function (d) {
    return "J'ai lu et approuvé les conditions d'utilisation";
  },
  IGN: {
    'Map slopes layer': function (d) {
      return 'France (IGN)';
    },
  },
  'IGN maps': {
    'Map layer': function (d) {
      return 'IGN Fr';
    },
  },
  'IGN ortho': {
    'Map layer': function (d) {
      return 'IGN Fr Sat';
    },
  },
  'IGN ortho (es)': {
    'Map layer': function (d) {
      return 'IGN Es Sat';
    },
  },
  'IGN raster (es)': {
    'Map layer': function (d) {
      return 'IGN Es';
    },
  },
  'Image could not be processed': function (d) {
    return "L'image n'a pas pu être traitée pour le téléversement";
  },
  'Improve our understanding of risks': function (d) {
    return 'Améliorer la connaissance des risques';
  },
  'Incidents and accidents': function (d) {
    return 'Incidents et accidents';
  },
  'Information about the terrain, like elevations, lengths...': function (d) {
    return 'Données relatives au terrain, comme les altitudes, la longueur, etc.';
  },
  'Information on the location of the incident. Mark the location on the map above, even if you cannot do very accurately, (in which case give more details here). After completing the report, you can associate it to a route, a climbing site or an outing.': function (
    d
  ) {
    return "Information sur la localisation de l'incident. Positionner la localisation sur la carte ci-dessus, même de manière peu précise (auquel cas vous pouvez ajouter plus de détails dans ce champ). Après avoir complété le rapport, vous pouvez associer un itinéraire, un point de passage ou une sortie.";
  },
  'Informations about the access': function (d) {
    return "Information à propos de l'accès routier/transport en commun";
  },
  Infos: function (d) {
    return 'Informations';
  },
  'Insert a link': function (d) {
    return 'Insérer un lien';
  },
  'Insert emoji': function (d) {
    return 'Insérer un émoji';
  },
  'Insert image': function (d) {
    return 'Insérer une image';
  },
  'Insert link': function (d) {
    return 'Insérer le lien';
  },
  'Invalid date': function (d) {
    return 'Date non valide';
  },
  'Invalid email address': {
    'API message': function (d) {
      return 'Adresse email invalide';
    },
  },
  'Issue report': function (d) {
    return "Signalement d'un problème";
  },
  'Know more about SERAC': function (d) {
    return 'En savoir plus sur SERAC';
  },
  'Last forum topics': function (d) {
    return 'Dernières discussions du forum';
  },
  'Last outings': function (d) {
    return 'Dernières sorties';
  },
  Layers: {
    'Map controls': function (d) {
      return 'Sélection des couches';
    },
  },
  'Leave fullscreen': function (d) {
    return 'Quitter le mode plein écran';
  },
  "Let's make our feedbacks valuable": function (d) {
    return 'Valorisons nos retours d’expérience';
  },
  Licenses: function (d) {
    return 'Licences';
  },
  Links: function (d) {
    return 'Liens';
  },
  'List mode': function (d) {
    return 'Vue en liste';
  },
  'List of versions for language:': function (d) {
    return 'Liste des versions pour la langue :';
  },
  'Load my preferences': function (d) {
    return 'Activer mes préférences';
  },
  'Location / elevation / orientation': function (d) {
    return 'Lieu / altitude / orientation';
  },
  'Log in to post a comment': function (d) {
    return 'Se connecter pour poster un commentaire';
  },
  Login: function (d) {
    return 'Se connecter';
  },
  'Login failed': {
    'API message': function (d) {
      return 'Identifiant ou mot de passe incorrects';
    },
  },
  Logout: function (d) {
    return 'Me déconnecter';
  },
  'Mail has been sent': function (d) {
    return 'Courriel envoyé';
  },
  'Main information about the route, such as title, activity, GPS, and waypoint (which mountain, place).': function (
    d
  ) {
    return "Principales informations sur l'itinéraire, comme le nom, les activités, la géo-localisation, et l'environnement proche.";
  },
  'Main informations about your outing': function (d) {
    return 'Données principales de votre sortie';
  },
  'Make profile page public': function (d) {
    return 'Rendre publique la page de profil';
  },
  'Map only': function (d) {
    return 'Uniquement la carte';
  },
  'Map, guidebook, known route, planning for a plan B, (re) evaluation of route during trip?': function (d) {
    return 'Carte, topos, connaissance de l’itinéraire, anticipation d’un plan B, réévaluation de l’itinéraire en cours de sortie ?';
  },
  'Mark this route as to do': function (d) {
    return 'Mettre cet itinéraire dans ses favoris';
  },
  'Merge documents': function (d) {
    return 'Fusionner des documents';
  },
  'Merge with other document': function (d) {
    return 'Fusionner avec un autre document';
  },
  'Merging a source document with a target document transfers all associations of the source document to the target document, and sets up a redirection from the source to the target document.': function (
    d
  ) {
    return 'Fusionner un document source avec un document cible transfère toutes les associations du document source au document cible, et définit une redirection du document source vers le document cible.';
  },
  'Misc data about the waypoint': function (d) {
    return 'Données diverses sur le point de passage';
  },
  Miscs: function (d) {
    return 'Divers';
  },
  'Missing captcha': {
    'API message': function (d) {
      return 'Captcha manquant';
    },
  },
  'Modified the': {
    'modification date': function (d) {
      return 'Modifié le';
    },
  },
  'More info': function (d) {
    return "Plus d'information";
  },
  'Multi-criteria search': function (d) {
    return 'Recherche multi-critère';
  },
  'My account': function (d) {
    return 'Mon compte';
  },
  'My bookmarks': function (d) {
    return 'Mes favoris';
  },
  'My changes': function (d) {
    return 'Mes contributions';
  },
  'My followed users': function (d) {
    return 'Mes amis';
  },
  'My outings': function (d) {
    return 'Mes sorties';
  },
  'My preferences': function (d) {
    return 'Mes préférences';
  },
  'My profile': function (d) {
    return 'Mon profil';
  },
  Narration: function (d) {
    return 'Description textuelle';
  },
  'Near-accidents = delicate situation not leading to physical injury but could have lead to a much more serious event.': function (
    d
  ) {
    return 'Situations « limites » qui aurait pu dégénérer en évènements plus graves';
  },
  'Near-accidents are valuable': function (d) {
    return 'Des incidents et quasi-accidents riches d’enseignements :';
  },
  'New outing': function (d) {
    return 'Nouvelle sortie';
  },
  'New password': function (d) {
    return 'Nouveau mot de passe';
  },
  'New route': function (d) {
    return 'Nouvel itinéraire';
  },
  'New waypoint': function (d) {
    return 'Nouveau point de passage';
  },
  'No account yet?': function (d) {
    return 'Pas encore de compte ?';
  },
  'No match?': function (d) {
    return 'Aucun résultat satisfaisant ?';
  },
  'No user with this email': {
    'API message': function (d) {
      return "Il n'existe pas d'utilisateur avec cet email";
    },
  },
  'NoDerivatives — If you remix, transform, or build upon the material, you may not distribute the modified material.': function (
    d
  ) {
    return "Pas de modifications — Dans le cas où vous effectuez un remix, que vous transformez, ou créez à partir du matériel composant l'Oeuvre originale, vous n'êtes pas autorisé à distribuer ou mettre à disposition l'Oeuvre modifiée. ";
  },
  'NonCommercial — You may not use the material for commercial purposes.': function (d) {
    return "Pas d’Utilisation Commerciale — Vous n'êtes pas autorisé à faire un usage commercial de cette Oeuvre, tout ou partie du matériel la composant. ";
  },
  'Note that comments have to be transferred manually in Discourse before merging.': function (d) {
    return 'Les commentaires doivent être transférés manuellement dans Discourse avant de fusionner les documents.';
  },
  Numbers: function (d) {
    return 'Données';
  },
  'Only document less than 24h old can be deleted': {
    'API message': function (d) {
      return 'Seuls les documents récents (24h) peuvent être supprimés. Contactez la modération pour supprimer ce document.';
    },
  },
  'Only status updates with the selected activities and in the selected areas are shown in your homepage feed. Status updates from followed users will always be shown.': function (
    d
  ) {
    return "Seuls les documents qui concernent les régions et les activités sélectionnées sont affichés dans le fil de la page d'accueil.\nLes documents des utilisateurs suivis sont toujours visibles.";
  },
  'Open fields to deeply explain the event circumstances.': function (d) {
    return "Champs libres pour raconter au mieux les circonstances de l'évènement.";
  },
  "Open fields to detail the picture's context": function (d) {
    return "Champs libre pour décrire le contexte de l'image";
  },
  'Ordered list': function (d) {
    return 'Liste triée';
  },
  'Oups! Something went wrong with forum. Here is the message :': function (d) {
    return 'Oups ! Il y a eu un souci avec le forum. Voici le message :';
  },
  'Oups! something went wrong...': function (d) {
    return 'Oups ! Il y a eu un problème...';
  },
  'Page not found': function (d) {
    return 'Page non trouvée';
  },
  'Paragliding outings': function (d) {
    return 'Sorties parapente';
  },
  'Parameters of the Digital Camera': function (d) {
    return "Détails sur l'appareil photo numérique";
  },
  'Participants and context': function (d) {
    return 'Participants et contexte';
  },
  Password: function (d) {
    return 'Mot de passe';
  },
  'Password too short': {
    'API message': function (d) {
      return 'Le mot de passe est trop court';
    },
  },
  'People who were with you, and your feelings about this outing': function (d) {
    return 'Les autres personnes qui étaient avec vous, ainsi que vos impressions sur la sortie';
  },
  'Period of protection': function (d) {
    return 'Période de protection';
  },
  'Personal data are confidential': function (d) {
    return 'Les informations personnelles sont confidentielles';
  },
  'Personal feed off': function (d) {
    return 'Fil personnel désactivé';
  },
  'Personal feed on': function (d) {
    return 'Fil personnel activé';
  },
  'Personal informations': function (d) {
    return 'Informations personnelles';
  },
  'Pitch description tag': function (d) {
    return 'Balise de description des longueurs';
  },
  'Please describe your technical and experience level related to the chosen goal, your level of fitness, prior tiredness accumulated, acclimatization if in altitude, etc.': function (
    d
  ) {
    return 'Décrivez votre niveau technique et expérience par rapport à l’objectif choisi, votre condition physique, la fatigue accumulée avant la sortie, l’acclimatation pour une sortie en altitude, etc.';
  },
  'Post the first comment': function (d) {
    return 'Publier le premier commentaire';
  },
  'Precise localisation of the shooting': function (d) {
    return 'Localisation précise de la prise de vue';
  },
  'Precise location of the event.': function (d) {
    return "Localisation précise de l'évènement";
  },
  'Press enter to select': function (d) {
    return 'Entrée pour selectionner';
  },
  Preview: function (d) {
    return 'Prévisualiser';
  },
  'Protect document': function (d) {
    return 'Protéger ce document';
  },
  'Protection area:': function (d) {
    return 'Zone de protection :';
  },
  'Protection areas': function (d) {
    return 'Zones de protection';
  },
  'Protection status': function (d) {
    return 'Status de la protection';
  },
  'Put it back': function (d) {
    return 'Remettre';
  },
  Quote: function (d) {
    return 'Citation';
  },
  'Recent changes': function (d) {
    return 'Changements récents';
  },
  'Recenter on your current position': function (d) {
    return 'Centrage sur votre position actuelle';
  },
  'Recenter on...': function (d) {
    return 'Recentrer sur...';
  },
  Register: function (d) {
    return "S'inscrire";
  },
  Remove: function (d) {
    return 'Retirer';
  },
  'Report an issue': function (d) {
    return 'Signaler un problème';
  },
  'Report title, activity, linked routes or outings.': function (d) {
    return 'Titre du rapport, activité, liens avec des itinéraires ou sorties.';
  },
  Required: {
    'API message': function (d) {
      return 'Requis';
    },
  },
  'Reset geometry': function (d) {
    return 'Réinitialiser';
  },
  'Reset password': function (d) {
    return 'Réinitialiser le mot de passe';
  },
  'Restore this version': function (d) {
    return 'Restaurer cette version';
  },
  'Results only': function (d) {
    return 'Uniquement les résultats';
  },
  Retry: function (d) {
    return 'Réessayer';
  },
  'SERAC is a worldwide incidents and accidents database aiming at increasing safety in rock climbing and mountain sports.': function (
    d
  ) {
    return "SERAC est une base de données mondiale sur les accidents et incidents en montagne. Sa vocation est d'améliorer la sécurité dans la pratique de l'escalade et des sports de montagne.";
  },
  'SERAC is built upon a kindness mindset. We thank you to improve it': function (d) {
    return 'SERAC est conçu dans un esprit de bienveillance et de partage, merci de l’encourager';
  },
  Save: function (d) {
    return 'Enregistrer';
  },
  'Search ...': function (d) {
    return 'Rechercher ...';
  },
  'Search a document to associate...': function (d) {
    return 'Rechercher un document à associer';
  },
  'See more results': function (d) {
    return 'Plus de résultats';
  },
  'See other documents nearby': function (d) {
    return 'À proximité de...';
  },
  'See profile based on:': function (d) {
    return "Profil d'altitude selon :";
  },
  'See the activity of this contributor in your feed': function (d) {
    return 'Voir les activités de ce contributeur dans votre fil';
  },
  'See the analysis of the submitted stories': function (d) {
    return 'Lire les analyses des récits déjà déposés';
  },
  'See the latest version': function (d) {
    return 'Voir la dernière version';
  },
  'Select option': function (d) {
    return 'Choisissez une option';
  },
  'Send reset email': function (d) {
    return "Envoyer l'email de réinitialisation";
  },
  'Sensitive area:': function (d) {
    return 'Zone sensible :';
  },
  'Sensitive areas': function (d) {
    return 'Zones sensibles';
  },
  Settings: function (d) {
    return 'Paramètres';
  },
  'Several days?': function (d) {
    return 'Plusieurs jours ?';
  },
  Share: function (d) {
    return 'Partager';
  },
  'Share with us!': function (d) {
    return 'Partagez avec nous!';
  },
  'ShareAlike — If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.': function (
    d
  ) {
    return "Partage dans les Mêmes Conditions — Dans le cas où vous effectuez un remix, que vous transformez, ou créez à partir du matériel composant l'Oeuvre originale, vous devez diffuser l'Oeuvre modifiée dans les même conditions, c'est à dire avec la même licence avec laquelle l'Oeuvre originale a été diffusée. ";
  },
  'Shorter than minimum length 1': {
    'API message': function (d) {
      return 'Champ obligatoire';
    },
  },
  'Shorter than minimum length 3': {
    'API message': function (d) {
      return 'Champ trop court (minimum 3 caractères)';
    },
  },
  'Show only updates from followed users in the homepage feed': function (d) {
    return "N'afficher dans le fil de la page d'accueil que les documents qui concernent les utilisateurs suivis.";
  },
  Skiability: function (d) {
    return 'Skiabilité';
  },
  Slopes: function (d) {
    return 'Cartes de pentes';
  },
  'Source:': function (d) {
    return 'Document à fusionner (source) :';
  },
  'Stop following this contributor': function (d) {
    return 'Ne plus suivre ce contributeur';
  },
  'Suggested rating': function (d) {
    return 'Cotation suggérée';
  },
  SwissTopo: {
    'Map slopes layer': function (d) {
      return 'Suisse (SwissTopo)';
    },
  },
  'Target:': function (d) {
    return 'Document à conserver (cible) :';
  },
  'The mountain sports community': function (d) {
    return 'La communauté des sports de montagne';
  },
  'The page you are looking for does not exist or is broken.': function (d) {
    return "La page que vous demandez n'existe pas ou est cassée.";
  },
  'The slope must be between 0 and 80 deg': function (d) {
    return 'La pente doit être comprise entre 0 et 80 deg';
  },
  'The slope must be between 50 and 3000m high': function (d) {
    return 'La hauteur de la pente doit être comprise entre 50 et 3000m';
  },
  'There are sensitive areas on this route. Please refer to the map.': function (d) {
    return 'Cet itinéraire traverse ou se situe près de zones sensibles. Merci de consulter la carte.';
  },
  'These are positive experiences that reveal usefull risk-management skills.': function (d) {
    return 'Expériences positives qui révèlent des compétences de gestion des risques';
  },
  'This book cover is the property of its editor and/or author': function (d) {
    return 'Cette couverture de livre est la propriété de son éditeur et/ou auteur';
  },
  'This content is licensed under Creative Commons BY-NC-ND 3.0': function (d) {
    return 'Ce contenu est sous licence Creative Commons BY-NC-ND 3.0';
  },
  'This content is licensed under Creative Commons BY-SA 3.0': function (d) {
    return 'Ce contenu est sous licence Creative Commons BY-SA 3.0';
  },
  'This field is too long': function (d) {
    return 'Texte trop long';
  },
  'This field is too short': function (d) {
    return 'Texte trop court';
  },
  'This field must be a valid ISBN.': {
    'API message': function (d) {
      return 'Ce champ doit être un ISBN valide.';
    },
  },
  'This is the first version': function (d) {
    return 'Ceci est la première version';
  },
  'This is the last version': function (d) {
    return 'Ceci est la dernière version';
  },
  "This is where you may describe the route extensively, maybe starting with a brief summary and then developing the description (including approach, descent, etc.). Don't forget to mention the route history if you know it.": function (
    d
  ) {
    return "Description complète de l'itinéraire (résumé, approche, descente, etc.) N'oubliez pas l'historique si vous le connaissez.";
  },
  'This picture depicts a book cover. It is the property of its editor and/or author. It is presented here only for illustration purposes.': function (
    d
  ) {
    return "Cette image montre une couverture de livre. Elle est la propriété de l'éditeur et/ou de l'auteur et n'est présentée ici qu'à des fins d'illustration.";
  },
  'This profile is only available to authenticated users.': function (d) {
    return 'Ce profil est accessible aux seuls utilisateurs authentifiés.';
  },
  'This tool estimates the technical difficulty of a ski route (ski rating).': function (d) {
    return "Cet outil permet d'estimer la difficulté technique d'un itinéraire à ski (cotation ski)";
  },
  Time: function (d) {
    return 'Heure';
  },
  'Title of the book, author, language and date of publication.': function (d) {
    return "Titre de l'ouvrage, auteur, langue et date.";
  },
  'Title, activity and characteristics of the picture': function (d) {
    return 'Titre, activités et caractéristiques de l"image';
  },
  'Toggle full-screen': {
    'Map Controls': function (d) {
      return 'Mode plein écran';
    },
  },
  'Toggle fullscreen': function (d) {
    return 'Basculer en plein écran';
  },
  'Too many results: please refine your search.': function (d) {
    return 'Trop de résultats : merci de préciser votre recherche. ';
  },
  'Translate into an other lang': function (d) {
    return 'Traduire dans une autre langue';
  },
  'Transport & road or PT access': function (d) {
    return 'Accès routier/TC';
  },
  'Types and styles': function (d) {
    return 'Types et styles';
  },
  'Types of belay and protection used, verifications between climbers, snowpack stability tests, testing of avalanche transceivers, etc.': function (
    d
  ) {
    return "Type d'assurage et de protection, vérifications entre grimpeurs, tests de stabilité du manteau neigeux, test des DVA, etc.";
  },
  'Unblock account': function (d) {
    return 'Débloquer cet utilisateur';
  },
  'Unformatted text': function (d) {
    return 'Texte brut';
  },
  'Unmark this route as to do': function (d) {
    return 'Enlever cet itinéraire de ses favoris';
  },
  'Unordered list': function (d) {
    return 'Liste non triée';
  },
  'Unprotect document': function (d) {
    return 'Déprotéger ce document';
  },
  'Upload a GPS track': function (d) {
    return 'Ajouter une trace GPS';
  },
  'Upload a new version': function (d) {
    return 'Télécharger une nouvelle version';
  },
  'User avatar': function (d) {
    return 'Avatar';
  },
  Username: function (d) {
    return 'Identifiant';
  },
  'Very complex (steps, narrow sections, ridges...)': function (d) {
    return 'Très complexe (marches, étroitures, barres,...)';
  },
  'View in other lang': function (d) {
    return 'Voir dans une autre langue';
  },
  'View next comments and continue the discussion': function (d) {
    return 'Voir les commentaires suivants et continuer la discussion';
  },
  'View xreports': function (d) {
    return 'Voir les compte-rendus';
  },
  'Warning: This action cannot be undone!': function (d) {
    return 'Attention : cette action est irréversible !';
  },
  "Waypoint's main properties": function (d) {
    return 'Principales données du point de passage';
  },
  "Waypoint's textual description": function (d) {
    return 'Descriptions textuelles du point de passage';
  },
  'We sent you an email, please click on the link to reset password.': function (d) {
    return "Vous allez bientôt recevoir un email. Veuillez cliquer sur le lien qu'il contient pour réinitialiser votre mot de passe.";
  },
  'Weather & conditions': function (d) {
    return 'Météo & conditions';
  },
  'Why did you choose this outing? When did you decide to engage. What influenced your decision (holiday time, long journey, hotel/hut bookings, time spent already in preparation, limited possibilities, etc.)?': function (
    d
  ) {
    return "Pourquoi avoir choisi cette sortie ? A quel point étiez-vous attaché à l'objectif fixé ? Considérez l'influence de possibles choix effectués en amont (jours de congés, long trajet, réservations de nuitées...), des efforts réalisés jusque-là, de la rareté de l'opportunité, etc.";
  },
  'Wide and constant': function (d) {
    return 'Large et régulière';
  },
  'Without c2c account': function (d) {
    return 'Participants sans compte c2c';
  },
  'You can choose to remain anonymous': function (d) {
    return 'Vous pouvez choisir de rester anonyme';
  },
  'You may add associated waypoints, books and articles': function (d) {
    return "Associez d'autres documents de camptocamp à ce point de passage";
  },
  'You may also drag, draw or edit the track on the map.': function (d) {
    return 'Vous pouvez dessiner, éditer ou faire glisser la trace GPS sur la carte.';
  },
  'Zoom in': {
    'Map controls': function (d) {
      return 'Zoomer';
    },
  },
  'Zoom out': {
    'Map controls': function (d) {
      return 'Dézoomer';
    },
  },
  access: {
    $$noContext: function (d) {
      return 'accès routier / transports en commun';
    },
    waypoint_types: function (d) {
      return 'accès routier / transports en commun';
    },
  },
  access_comment: function (d) {
    return "Commentaires sur l'accès routier / transports en commun";
  },
  access_condition: function (d) {
    return "Conditions de l'accès routier / transports en commun";
  },
  access_period: function (d) {
    return "Période de déneigement ou d'ouverture";
  },
  access_time: function (d) {
    return "Temps d'accès";
  },
  accessible_when_wardened: {
    custodianship_types: function (d) {
      return 'gardé, fermé hors gardiennage';
    },
  },
  accidental_avalanche: {
    avalanche_signs: function (d) {
      return 'avalanche déclenchée par une personne le jour de la sortie';
    },
  },
  activities: function (d) {
    return 'Activités';
  },
  activity: function (d) {
    return 'Activité';
  },
  activity_rate: function (d) {
    return "Fréquence de pratique dans l'activité";
  },
  activity_rate_m2: {
    activity_rates: function (d) {
      return '1 à 2 fois par mois';
    },
  },
  activity_rate_w1: {
    activity_rates: function (d) {
      return '1 fois par semaine et plus';
    },
  },
  activity_rate_y5: {
    activity_rates: function (d) {
      return 'moins de 5 fois par an';
    },
  },
  'add a book': function (d) {
    return 'ajouter un livre';
  },
  'add a map': function (d) {
    return 'ajouter une carte';
  },
  'add a route': function (d) {
    return 'ajouter un itinéraire';
  },
  'add a waypoint': function (d) {
    return 'ajouter un point de passage';
  },
  'add an area': function (d) {
    return 'ajouter une région';
  },
  'add an article': function (d) {
    return 'ajouter un article';
  },
  'add an image': function (d) {
    return 'ajouter une image';
  },
  'add an incident/accident report': function (d) {
    return "ajouter un rapport d'incident/accident";
  },
  'add an outing': function (d) {
    return 'ajouter une sortie';
  },
  admin_limits: {
    area_types: function (d) {
      return 'limite administrative';
    },
  },
  advertisement: function (d) {
    return 'publicité';
  },
  age: function (d) {
    return 'Âge';
  },
  aid_rating: function (d) {
    return 'Cotation artificielle';
  },
  alpine_climbing: {
    event_activities: function (d) {
      return 'Rocher montagne (TA)';
    },
  },
  'already used forum_username': {
    'API message': function (d) {
      return 'Pseudo forum déjà utilisé';
    },
  },
  'already used username': {
    'API message': function (d) {
      return 'Cet identifiant est déjà utilisé.';
    },
  },
  always_accessible: {
    custodianship_types: function (d) {
      return 'toujours ouvert';
    },
  },
  anonymous: function (d) {
    return 'Contribution anonyme';
  },
  apr: {
    months: function (d) {
      return 'avril';
    },
  },
  area: function (d) {
    return 'région';
  },
  area_type: function (d) {
    return 'Type de région';
  },
  areas: function (d) {
    return 'régions';
  },
  article_categories: function (d) {
    return "catégories d'articles";
  },
  article_type: function (d) {
    return "Type d'article";
  },
  artificial: {
    rock_types: function (d) {
      return 'artificiel';
    },
  },
  associations: function (d) {
    return 'Associations';
  },
  'at least one route required': {
    'API message': function (d) {
      return 'Sélectionnez au moins un itinéraire';
    },
  },
  'at least one user required': {
    'API message': function (d) {
      return 'Sélectionnez au moins un itinéraire';
    },
  },
  aug: {
    months: function (d) {
      return 'août';
    },
  },
  author: function (d) {
    return 'Auteur';
  },
  author_status: function (d) {
    return 'Implication dans la situation';
  },
  autonomous: {
    autonomies: function (d) {
      return 'autonome';
    },
  },
  autonomy: function (d) {
    return 'Niveau de pratique';
  },
  avalanche_forecaster: {
    user_categories: function (d) {
      return "prévision d'avalanche";
    },
  },
  avalanche_level: function (d) {
    return "Niveau de risque d'avalanche";
  },
  avalanche_signs: function (d) {
    return "Signes d'avalanche";
  },
  avalanche_slope: function (d) {
    return 'Pente de la zone de départ';
  },
  avalanches: function (d) {
    return 'Observations relatives aux avalanches';
  },
  average: {
    condition_ratings: function (d) {
      return 'moyennes';
    },
    snow_quality_ratings: function (d) {
      return 'moyenne';
    },
    snow_quantity_ratings: function (d) {
      return 'moyenne';
    },
  },
  awful: {
    condition_ratings: function (d) {
      return 'exécrables';
    },
    snow_quality_ratings: function (d) {
      return 'exécrable';
    },
    snow_quantity_ratings: function (d) {
      return 'exécrable';
    },
  },
  base_camp: {
    waypoint_types: function (d) {
      return 'camp de base';
    },
  },
  best_periods: function (d) {
    return 'Meilleures périodes';
  },
  biography: {
    book_types: function (d) {
      return 'biographie';
    },
  },
  bisse: {
    waypoint_types: function (d) {
      return 'bisse / béal';
    },
  },
  blanket_unstaffed: function (d) {
    return 'Couvertures hors gardiennage';
  },
  blocked_person: {
    event_types: function (d) {
      return 'personne bloquée';
    },
  },
  boat: {
    public_transportation_types: function (d) {
      return 'bateau';
    },
  },
  'bolted rock climbing gear': function (d) {
    return 'Escalade en grande voie sportive';
  },
  book: {
    $$noContext: function (d) {
      return 'livre';
    },
    image_categories: function (d) {
      return 'livre';
    },
  },
  book_types: function (d) {
    return 'Type de livre';
  },
  books: function (d) {
    return 'livres';
  },
  c2c_meetings: {
    article_categories: function (d) {
      return 'réunions c2c';
    },
  },
  ca: {
    langs: function (d) {
      return 'catalan';
    },
  },
  'camera settings': function (d) {
    return "Paramètres de l'APN";
  },
  camera_name: function (d) {
    return "Nom de l'APN";
  },
  camp_site: {
    waypoint_types: function (d) {
      return 'camping';
    },
  },
  capacity: {
    $$noContext: function (d) {
      return 'Nombre de places hors gardiennage';
    },
    bivouac: function (d) {
      return 'Nombre de places';
    },
  },
  capacity_staffed: function (d) {
    return 'Nombre de places en gardiennage';
  },
  categories: function (d) {
    return 'Catégories';
  },
  cave: {
    waypoint_types: function (d) {
      return 'grotte';
    },
  },
  children_proof: function (d) {
    return 'Enfants';
  },
  cleared: {
    access_conditions: function (d) {
      return 'déneigé';
    },
  },
  'climbing rating': function (d) {
    return 'cotation escalade';
  },
  climbing_indoor: {
    waypoint_types: function (d) {
      return 'SAE';
    },
  },
  climbing_indoor_types: function (d) {
    return 'Type de SAE';
  },
  climbing_instructor: {
    user_categories: function (d) {
      return "moniteur d'escalade";
    },
  },
  climbing_outdoor: {
    waypoint_types: function (d) {
      return "site d'escalade";
    },
  },
  climbing_outdoor_type: function (d) {
    return 'Type de voie';
  },
  climbing_outdoor_types: function (d) {
    return "Type de site d'escalade";
  },
  climbing_rating_max: function (d) {
    return 'Cotation maximale';
  },
  climbing_rating_median: function (d) {
    return 'Cotation médiane';
  },
  climbing_rating_min: function (d) {
    return 'Cotation minimale';
  },
  climbing_styles: function (d) {
    return "Styles d'escalade";
  },
  closed: {
    lift_status: function (d) {
      return 'fermées';
    },
  },
  closed_cleared: {
    access_conditions: function (d) {
      return 'fermé déneigé';
    },
  },
  closed_hut: {
    hut_status: function (d) {
      return 'refuge fermé';
    },
  },
  closed_in_winter: {
    snow_clearance_ratings: function (d) {
      return 'fermé en hiver';
    },
  },
  closed_snow: {
    access_conditions: function (d) {
      return 'fermé enneigé';
    },
  },
  collab: {
    $$noContext: function (d) {
      return 'collaboratif (CC by-sa)';
    },
    article_types: function (d) {
      return 'collaboratif (CC by-sa)';
    },
  },
  collaborative: {
    image_types: function (d) {
      return 'collaboratif (CC by-sa)';
    },
  },
  comment: function (d) {
    return 'Commentaire';
  },
  condition_rating: function (d) {
    return 'Évaluation des conditions';
  },
  conditions: function (d) {
    return 'Conditions';
  },
  conditions_levels: function (d) {
    return "Conditions d'enneigement par zones";
  },
  configuration: function (d) {
    return 'Configuration';
  },
  conglomerat: {
    rock_types: function (d) {
      return 'conglomérat';
    },
  },
  contact: function (d) {
    return 'Contact';
  },
  contributor: function (d) {
    return 'contributeur';
  },
  corridor: {
    route_configuration_types: function (d) {
      return 'couloir';
    },
  },
  country: {
    area_types: function (d) {
      return 'pays';
    },
  },
  crack_dihedral: {
    climbing_styles: function (d) {
      return 'fissure-dièdre';
    },
  },
  crampons_req: {
    glacier_gear_types: function (d) {
      return 'crampons indispensables';
    },
  },
  crampons_spring: {
    glacier_gear_types: function (d) {
      return 'crampons en début de saison';
    },
  },
  crevasse_fall: {
    event_types: function (d) {
      return 'chute en crevasse/bédière';
    },
  },
  critical_situation: {
    event_types: function (d) {
      return 'situation complexe sans accident';
    },
  },
  crowded: {
    frequentation_types: function (d) {
      return 'assez fréquenté';
    },
  },
  custodianship: function (d) {
    return 'Ouverture';
  },
  danger_sign: {
    avalanche_signs: function (d) {
      return "signaux d'alerte autres que des traces d'avalanche";
    },
  },
  dangerous: {
    children_proof_types: function (d) {
      return 'peu adapté';
    },
  },
  date: function (d) {
    return 'Date';
  },
  date_end: function (d) {
    return 'Date de fin';
  },
  date_start: function (d) {
    return 'Date de début';
  },
  date_time: function (d) {
    return 'date/heure';
  },
  'day(s)': function (d) {
    return 'jour(s)';
  },
  de: {
    langs: function (d) {
      return 'allemand';
    },
  },
  dec: {
    months: function (d) {
      return 'décembre';
    },
  },
  descent: {
    image_categories: function (d) {
      return 'descente';
    },
  },
  'describe conditions': function (d) {
    return 'Conditions de terrain, équipement et qualité du rocher rencontrés (approche, voie, et à proximité).\nSi vous rencontrez un équipement défectueux, informez les acteurs locaux (équipeurs, bureau des guides, office du tourisme ... ) et/ou renseignez-le sur https://sentinelles.sportsdenature.fr/';
  },
  'describe route_conditions': function (d) {
    return "Décrivez brièvement l'itinéraire que vous avez suivi dans les cas suivants : itinéraire différent de celui du topo, topo comportant des variantes, itinéraire en boucle, enchainement, point atteint lors d'un parcours partiel.\nATTENTION: ne téléchargez pas de photos copiées d'un topo ou d'un livre. Les modérateurs les suppriment illico, car c'est une pratique illégale et elle ne respecte pas les licences utilisées par le site.";
  },
  'describe timing': function (d) {
    return 'Heure de départ / horaire';
  },
  'describe weather': function (d) {
    return 'Conditions météorologiques rencontrées lors de la sortie : couverture nuageuse, précipitations, vent, température';
  },
  description: function (d) {
    return 'Description';
  },
  detail: {
    image_categories: function (d) {
      return 'détail';
    },
  },
  difficult: {
    glacier_ratings: function (d) {
      return 'ouvert - passage difficile';
    },
  },
  difficulties_height: function (d) {
    return 'Altitude du début des difficultés';
  },
  disable_comments: function (d) {
    return 'Désactiver les commentaires';
  },
  draft: {
    quality_types: function (d) {
      return 'ébauche';
    },
  },
  durations: function (d) {
    return 'Durée';
  },
  'durations (days)': function (d) {
    return 'durée (jours)';
  },
  easy: {
    glacier_ratings: function (d) {
      return 'bouché - passage sans problème';
    },
  },
  'easy mountain climbing gear': function (d) {
    return 'Alpinisme rocheux de F à AD';
  },
  'easy snow ice mixed gear': function (d) {
    return 'Alpinisme neige/glace/mixte de F à PD+';
  },
  edge: {
    route_configuration_types: function (d) {
      return 'arête';
    },
  },
  editor: function (d) {
    return 'Éditeur';
  },
  elevation: function (d) {
    return 'Altitude';
  },
  elevation_access: function (d) {
    return "Altitude de l'accès routier / TC";
  },
  elevation_down_snow: function (d) {
    return 'Altitude de déchaussage';
  },
  elevation_max: function (d) {
    return 'Altitude maximale';
  },
  elevation_min: function (d) {
    return 'Altitude minimale';
  },
  elevation_up_snow: function (d) {
    return 'Altitude de chaussage';
  },
  'emphasized text': function (d) {
    return 'texte en italiques';
  },
  empty: {
    quality_types: function (d) {
      return 'vide';
    },
  },
  'empty comment': function (d) {
    return 'commentaire vide';
  },
  en: {
    langs: function (d) {
      return 'anglais';
    },
  },
  engagement_rating: function (d) {
    return 'Engagement';
  },
  environment: {
    book_types: function (d) {
      return 'environnement';
    },
  },
  equipment: {
    image_categories: function (d) {
      return 'équipement';
    },
  },
  equipment_rating: function (d) {
    return "Qualité de l'équipement";
  },
  equipment_ratings: function (d) {
    return "Qualité de l'équipement en place";
  },
  es: {
    langs: function (d) {
      return 'espagnol';
    },
  },
  eu: {
    langs: function (d) {
      return 'basque';
    },
  },
  event_activity: function (d) {
    return 'Activité';
  },
  event_type: function (d) {
    return "Type d'évènement";
  },
  excellent: {
    condition_ratings: function (d) {
      return 'excellentes';
    },
    snow_quality_ratings: function (d) {
      return 'excellente';
    },
    snow_quantity_ratings: function (d) {
      return 'excellente';
    },
  },
  expedition: {
    route_types: function (d) {
      return 'expédition';
    },
  },
  expeditions: {
    article_categories: function (d) {
      return 'expéditions';
    },
  },
  exposed: {
    rain_proof_types: function (d) {
      return 'exposé à la pluie';
    },
  },
  exposition_rock_rating: function (d) {
    return 'Exposition rocher';
  },
  exposure_time: function (d) {
    return "Temps d'exposition";
  },
  external_resources: function (d) {
    return 'Ressources externes';
  },
  external_witness: {
    author_statuses: function (d) {
      return 'témoin extérieur';
    },
  },
  farm_sale: {
    product_types: function (d) {
      return 'vente directe';
    },
  },
  fauna: {
    image_categories: function (d) {
      return 'faune';
    },
  },
  feb: {
    months: function (d) {
      return 'février';
    },
  },
  federal_supervision: {
    supervision: function (d) {
      return 'fédéral';
    },
  },
  federal_supervisor: {
    qualification: function (d) {
      return 'initiateur fédéral';
    },
  },
  federal_trainer: {
    qualification: function (d) {
      return 'instructeur fédéral';
    },
  },
  female: {
    genders: function (d) {
      return 'femme';
    },
  },
  file_size: function (d) {
    return 'taille du fichier';
  },
  filename: function (d) {
    return 'nom du fichier';
  },
  fine: {
    quality_types: function (d) {
      return 'bon';
    },
  },
  flora: {
    image_categories: function (d) {
      return 'flore';
    },
  },
  fnumber: function (d) {
    return "Propriétés de l'image";
  },
  focal_length: function (d) {
    return 'Focale';
  },
  fr: {
    langs: function (d) {
      return 'français';
    },
  },
  frequentation: function (d) {
    return 'Fréquentation';
  },
  gas_unstaffed: function (d) {
    return 'Gaz hors gardiennage';
  },
  gear: {
    $$noContext: function (d) {
      return 'Matériel';
    },
    article_categories: function (d) {
      return 'Matériel';
    },
  },
  gender: function (d) {
    return 'Sexe';
  },
  'general informations': function (d) {
    return 'Informations générales';
  },
  geolocation: function (d) {
    return 'Géolocalisation';
  },
  geology: {
    image_categories: function (d) {
      return 'géologie';
    },
  },
  gite: {
    waypoint_types: function (d) {
      return 'gîte';
    },
  },
  glacier_crampons: {
    glacier_gear_types: function (d) {
      return 'crampons + matériel de sécurité sur glacier';
    },
  },
  glacier_gear: function (d) {
    return 'Matériel glacier';
  },
  glacier_rating: function (d) {
    return 'Etat du glacier';
  },
  glacier_safety_gear: {
    glacier_gear_types: function (d) {
      return 'matériel de sécurité sur glacier';
    },
  },
  global_rating: function (d) {
    return 'Cotation globale';
  },
  good: {
    condition_ratings: function (d) {
      return 'bonnes';
    },
    snow_quality_ratings: function (d) {
      return 'bonne';
    },
    snow_quantity_ratings: function (d) {
      return 'bonne';
    },
  },
  'good service': {
    public_transportation_ratings: function (d) {
      return 'service régulier';
    },
  },
  great: {
    quality_types: function (d) {
      return 'excellent';
    },
  },
  gres: {
    rock_types: function (d) {
      return 'grès';
    },
  },
  grocery: {
    product_types: function (d) {
      return 'épicerie';
    },
  },
  ground_types: function (d) {
    return 'Type de sol';
  },
  group_management: function (d) {
    return 'Gestion du groupe';
  },
  'has added images to area': function (d) {
    return 'a ajouté des images pour cette région';
  },
  'has added images to article': function (d) {
    return 'a ajouté des images pour cet article';
  },
  'has added images to book': function (d) {
    return 'a ajouté des images pour ce livre';
  },
  'has added images to outing': function (d) {
    return 'a ajouté des images pour cette sortie';
  },
  'has added images to route': function (d) {
    return 'a ajouté des images pour cet itinéraire';
  },
  'has added images to waypoint': function (d) {
    return 'a ajouté des images pour ce point de passage';
  },
  'has added images to xreport': function (d) {
    return "a ajouté des images pour ce rapport d'incident/accident";
  },
  'has created a new article': function (d) {
    return 'a rédigé un nouvel article';
  },
  'has created a new book': function (d) {
    return 'a ajouté un nouveau livre';
  },
  'has created a new image': function (d) {
    return 'a ajouté une nouvelle image';
  },
  'has created a new outing': function (d) {
    return 'a ajouté une nouvelle sortie';
  },
  'has created a new route': function (d) {
    return 'a ajouté un nouvel itinéraire';
  },
  'has created a new waypoint': function (d) {
    return 'a ajouté un nouveau point de passage';
  },
  'has created a new xreport': function (d) {
    return "a crée un nouveau rapport d'incident/accident";
  },
  'has updated the area': function (d) {
    return 'a mis à jour cette région';
  },
  'has updated the article': function (d) {
    return 'a mis à jour un article';
  },
  'has updated the book': function (d) {
    return 'a mis à jour ce livre';
  },
  'has updated the image': function (d) {
    return 'a mis à jour une image';
  },
  'has updated the outing': function (d) {
    return 'a mis à jour une sortie';
  },
  'has updated the route': function (d) {
    return 'a mis à jour un itinéraire';
  },
  'has updated the waypoint': function (d) {
    return 'a mis à jour un point de passage';
  },
  'has updated the xreport': function (d) {
    return "a mis à jour ce rapport d'incident/accident";
  },
  'heading text': function (d) {
    return 'texte du titre';
  },
  heating_unstaffed: function (d) {
    return 'Chauffage hors gardiennage';
  },
  height: function (d) {
    return 'Hauteur';
  },
  height_diff: function (d) {
    return 'Dénivelé';
  },
  height_diff_access: function (d) {
    return "Dénivelé de l'approche";
  },
  height_diff_difficulties: function (d) {
    return 'Dénivelé des difficultés';
  },
  height_diff_down: function (d) {
    return 'Dénivelé négatif';
  },
  height_diff_up: function (d) {
    return 'Dénivelé positif';
  },
  height_max: function (d) {
    return 'Hauteur maximale';
  },
  height_median: function (d) {
    return 'Hauteur moyenne';
  },
  height_min: function (d) {
    return 'Hauteur minimale';
  },
  help: {
    $$noContext: function (d) {
      return 'aide';
    },
    image_categories: function (d) {
      return 'aide';
    },
  },
  highline: {
    slackline_types: function (d) {
      return 'Highline';
    },
  },
  hiking: {
    activities: function (d) {
      return 'Randonnée / Trail';
    },
  },
  'hiking gear': function (d) {
    return 'Randonnée pédestre estivale';
  },
  hiking_mtb_exposition: function (d) {
    return 'Exposition randonnée, trail et VTT';
  },
  hiking_rating: function (d) {
    return 'Cotation randonnée / trail';
  },
  historical: {
    book_types: function (d) {
      return 'historique';
    },
  },
  humidity: {
    weather_station_types: function (d) {
      return 'humidité';
    },
  },
  hut: {
    image_categories: function (d) {
      return 'refuge/cabane';
    },
    waypoint_types: function (d) {
      return 'refuge/cabane';
    },
  },
  hut_comment: function (d) {
    return 'Commentaires sur le refuge';
  },
  hut_status: function (d) {
    return 'Refuge';
  },
  hut_warden: {
    user_categories: function (d) {
      return 'gardien de refuge';
    },
  },
  'ice and dry climbing gear': function (d) {
    return 'Cascade de glace et dry-tooling';
  },
  ice_climbing: {
    activities: function (d) {
      return 'Cascade de glace';
    },
    event_activities: function (d) {
      return 'Cascade de glace';
    },
  },
  ice_cornice_collapse: {
    event_types: function (d) {
      return 'effondrement cascade ou corniche';
    },
  },
  ice_rating: function (d) {
    return 'Cotation glace';
  },
  image_categories: function (d) {
    return 'Catégories';
  },
  image_type: function (d) {
    return "Type d'image (licence)";
  },
  impossible: {
    glacier_ratings: function (d) {
      return 'infranchissable - passage impossible';
    },
  },
  increase_impact: function (d) {
    return 'Éléments ayant aggravé les conséquences de l’événement';
  },
  injury_without_fall: {
    event_types: function (d) {
      return 'lésion sans chute';
    },
  },
  inside: {
    rain_proof_types: function (d) {
      return "à l'intérieur";
    },
  },
  insolation: {
    weather_station_types: function (d) {
      return 'ensoleillement';
    },
  },
  internal_witness: {
    author_statuses: function (d) {
      return 'témoin direct';
    },
  },
  isbn: function (d) {
    return 'ISBN';
  },
  iso_speed: function (d) {
    return 'Sensibilité';
  },
  it: {
    langs: function (d) {
      return 'italien';
    },
  },
  jan: {
    months: function (d) {
      return 'janvier';
    },
  },
  jul: {
    months: function (d) {
      return 'juillet';
    },
  },
  jun: {
    months: function (d) {
      return 'juin';
    },
  },
  key_needed: {
    custodianship_types: function (d) {
      return 'clé nécessaire pour ouvrir';
    },
  },
  kilometers: function (d) {
    return 'km';
  },
  labande_global_rating: function (d) {
    return 'Cotation globale ski';
  },
  labande_ski_rating: function (d) {
    return 'Cotation ponctuelle ski';
  },
  lake: {
    waypoint_types: function (d) {
      return 'lac';
    },
  },
  landscapes: {
    image_categories: function (d) {
      return 'paysages';
    },
  },
  lang: function (d) {
    return 'Langue';
  },
  langs: function (d) {
    return 'Langues';
  },
  length: function (d) {
    return 'Longueur';
  },
  length_total: function (d) {
    return 'Longueur totale';
  },
  level_1: {
    avalanche_levels: function (d) {
      return '1 - faible';
    },
  },
  level_2: {
    avalanche_levels: function (d) {
      return '2 - limité';
    },
  },
  level_3: {
    avalanche_levels: function (d) {
      return '3 - marqué';
    },
  },
  level_4: {
    avalanche_levels: function (d) {
      return '4 - fort';
    },
  },
  level_5: {
    avalanche_levels: function (d) {
      return '5 - très fort';
    },
  },
  level_na: {
    avalanche_levels: function (d) {
      return ' niveau non renseigné';
    },
  },
  lift_access: function (d) {
    return 'Remontées mécaniques';
  },
  lift_status: function (d) {
    return 'Remontées mécaniques';
  },
  link: function (d) {
    return 'lien';
  },
  loading: function (d) {
    return 'chargement en cours';
  },
  local_product: {
    waypoint_types: function (d) {
      return 'produits locaux';
    },
  },
  locality: {
    waypoint_types: function (d) {
      return 'lieu-dit';
    },
  },
  loop: {
    route_types: function (d) {
      return 'boucle (pied de la voie)';
    },
  },
  loop_hut: {
    route_types: function (d) {
      return 'boucle (approche ou refuge)';
    },
  },
  main_waypoint_id: function (d) {
    return 'ID du point de passage principal';
  },
  male: {
    genders: function (d) {
      return 'homme';
    },
  },
  map: function (d) {
    return 'carte';
  },
  maps: function (d) {
    return 'cartes';
  },
  maps_info: function (d) {
    return 'Cartes';
  },
  maps_references: function (d) {
    return 'Références cartographiques';
  },
  mar: {
    months: function (d) {
      return 'mars';
    },
  },
  matress_unstaffed: function (d) {
    return 'Matelas hors gardiennage';
  },
  may: {
    months: function (d) {
      return 'mai';
    },
  },
  medium: {
    quality_types: function (d) {
      return 'moyen';
    },
  },
  meters: function (d) {
    return 'm';
  },
  misc: {
    image_categories: function (d) {
      return 'divers';
    },
    waypoint_types: function (d) {
      return 'divers';
    },
  },
  mixed_rating: function (d) {
    return 'Cotation mixte';
  },
  modifications: function (d) {
    return 'Conséquences sur les pratiques';
  },
  mollasse_calcaire: {
    rock_types: function (d) {
      return 'molasse';
    },
  },
  more_than_3m: {
    severities: function (d) {
      return 'supérieur à 3 mois';
    },
  },
  motivations: function (d) {
    return 'Motivations';
  },
  mountain_biking: {
    activities: function (d) {
      return 'VTT';
    },
  },
  mountain_climbing: {
    activities: function (d) {
      return 'Rocher haute montagne';
    },
  },
  mountain_environment: {
    article_categories: function (d) {
      return 'environnement montagne';
    },
  },
  mountain_guide: {
    user_categories: function (d) {
      return 'guide de haute montagne';
    },
  },
  mountain_leader: {
    user_categories: function (d) {
      return 'ouvreur';
    },
  },
  mountainbike_instructor: {
    user_categories: function (d) {
      return 'moniteur de VTT';
    },
  },
  mtb_down_rating: function (d) {
    return 'Cotation VTT descente';
  },
  mtb_height_diff_portages: function (d) {
    return 'Portage VTT';
  },
  mtb_length_asphalt: function (d) {
    return 'Distance goudronnée';
  },
  mtb_length_trail: function (d) {
    return 'Distance sur sentier';
  },
  mtb_up_rating: function (d) {
    return 'Cotation VTT montée';
  },
  multi: {
    climbing_outdoor_types: function (d) {
      return 'grande voie';
    },
  },
  multipitch_climbing: {
    event_activities: function (d) {
      return 'Escalade grande voie';
    },
  },
  name: function (d) {
    return 'Nom';
  },
  natural_avalanche: {
    avalanche_signs: function (d) {
      return 'avalanche naturelle le jour de la sortie';
    },
  },
  naturally: {
    snow_clearance_ratings: function (d) {
      return 'déneigement naturel';
    },
  },
  nb_impacted: function (d) {
    return 'Nombre de personnes touchées';
  },
  nb_pages: function (d) {
    return 'Nombre de pages';
  },
  nb_participants: function (d) {
    return 'Nombre de participants';
  },
  'nearby service': {
    public_transportation_ratings: function (d) {
      return 'service à proximité';
    },
  },
  'next difference': function (d) {
    return 'différence suivante';
  },
  'next version': function (d) {
    return 'version suivante';
  },
  nivology: {
    image_categories: function (d) {
      return 'nivologie et avalanches';
    },
  },
  no: {
    $$noContext: function (d) {
      return 'non';
    },
    avalanche_signs: function (d) {
      return 'non';
    },
    glacier_gear_types: function (d) {
      return 'non';
    },
    parking_fee_types: function (d) {
      return 'non';
    },
    previous_injuries: function (d) {
      return 'non';
    },
  },
  'no info': function (d) {
    return "pas d'information";
  },
  'no service': {
    public_transportation_ratings: function (d) {
      return 'pas de service';
    },
  },
  no_supervision: {
    supervision: function (d) {
      return 'non encadré';
    },
  },
  no_warden: {
    custodianship_types: function (d) {
      return 'non gardé';
    },
  },
  non_applicable: {
    snow_clearance_ratings: function (d) {
      return 'non applicable';
    },
  },
  non_autonomous: {
    autonomies: function (d) {
      return 'non autonome';
    },
  },
  nov: {
    months: function (d) {
      return 'novembre';
    },
  },
  novel: {
    book_types: function (d) {
      return 'nouvelle';
    },
  },
  numbers: function (d) {
    return 'Caractéristiques';
  },
  oct: {
    months: function (d) {
      return 'octobre';
    },
  },
  of: {
    '1-30 of 200 results': function (d) {
      return 'sur';
    },
  },
  often: {
    snow_clearance_ratings: function (d) {
      return 'déneigement régulier';
    },
  },
  open: {
    lift_status: function (d) {
      return 'ouvertes';
    },
  },
  open_guarded: {
    hut_status: function (d) {
      return 'ouvert gardé';
    },
  },
  open_non_guarded: {
    hut_status: function (d) {
      return 'ouvert non gardé';
    },
  },
  opening_hours: function (d) {
    return "Heures d'ouverture";
  },
  opening_periods: function (d) {
    return 'Période de gardiennage';
  },
  'or try the following pages:': function (d) {
    return 'ou essayez les pages suivantes :';
  },
  orientations: function (d) {
    return 'Orientations';
  },
  other: {
    event_activities: function (d) {
      return 'Autre';
    },
    event_types: function (d) {
      return 'autre';
    },
  },
  other_comments: function (d) {
    return 'Conséquences physiques et autres commentaires';
  },
  outing: function (d) {
    return 'sortie';
  },
  outings: function (d) {
    return 'sorties';
  },
  overcrowded: {
    frequentation_types: function (d) {
      return 'très fréquenté';
    },
  },
  overhang: {
    climbing_styles: function (d) {
      return 'dévers-surplomb';
    },
  },
  paragliding: {
    activities: function (d) {
      return 'Parapente';
    },
  },
  paragliding_instructor: {
    user_categories: function (d) {
      return 'moniteur de parapente';
    },
  },
  paragliding_landing: {
    waypoint_types: function (d) {
      return 'atterrissage parapente';
    },
  },
  paragliding_rating: function (d) {
    return 'Cotation parapente';
  },
  paragliding_takeoff: {
    waypoint_types: function (d) {
      return 'décollage parapente';
    },
  },
  parking_fee: function (d) {
    return 'Parking ou route payant(e)';
  },
  partial_trip: function (d) {
    return 'Parcours partiel';
  },
  participant_count: function (d) {
    return 'Nombre de participants';
  },
  participants: function (d) {
    return 'Participants';
  },
  partly_protected: {
    rain_proof_types: function (d) {
      return 'partiellement protégé';
    },
  },
  pass: {
    waypoint_types: function (d) {
      return 'col';
    },
  },
  'pedestrian access': {
    $$noContext: function (d) {
      return 'Accès pédestre';
    },
    hut: function (d) {
      return 'Accès';
    },
  },
  people: {
    image_categories: function (d) {
      return 'personnages';
    },
  },
  'per page': {
    '30 per page': function (d) {
      return 'par page';
    },
  },
  person_fall: {
    event_types: function (d) {
      return 'déséquilibre ou chute';
    },
  },
  personal: {
    $$noContext: function (d) {
      return 'individuel (CC by-nc-nd)';
    },
    article_types: function (d) {
      return 'individuel (CC by-nc-nd)';
    },
    image_types: function (d) {
      return 'individuel (CC by-nc-nd)';
    },
  },
  'personal comments': function (d) {
    return 'Commentaires personnels';
  },
  phone: function (d) {
    return 'Téléphone';
  },
  phone_custodian: function (d) {
    return 'Téléphone gardien/gérant';
  },
  physical_failure: {
    event_types: function (d) {
      return 'défaillance physique';
    },
  },
  pillar: {
    route_configuration_types: function (d) {
      return 'pilier';
    },
  },
  pitch: {
    climbing_indoor_types: function (d) {
      return 'couenne';
    },
  },
  place: function (d) {
    return 'Lieu';
  },
  'please consult the server logs': {
    'API message': function (d) {
      return 'Erreur inattendue, merci de contacter dev@camptocamp.org';
    },
  },
  poor: {
    condition_ratings: function (d) {
      return 'mauvaises';
    },
    snow_quality_ratings: function (d) {
      return 'mauvaise';
    },
    snow_quantity_ratings: function (d) {
      return 'mauvaise';
    },
  },
  'poor service': {
    public_transportation_ratings: function (d) {
      return 'service réduit';
    },
  },
  possible: {
    glacier_ratings: function (d) {
      return 'délicat - passage possible';
    },
  },
  precipitation: {
    weather_station_types: function (d) {
      return 'précipitations (pluie uniquement)';
    },
  },
  precipitation_heater: {
    weather_station_types: function (d) {
      return 'précipitations (pluie ou neige)';
    },
  },
  pressure: {
    weather_station_types: function (d) {
      return 'pression';
    },
  },
  'previous difference': function (d) {
    return 'différence précédente';
  },
  'previous version': function (d) {
    return 'version précédente';
  },
  previous_injuries: function (d) {
    return 'Blessures antérieures';
  },
  previous_injuries_2: {
    previous_injuries: function (d) {
      return 'autres blessures';
    },
  },
  primary_impacted: {
    author_statuses: function (d) {
      return 'victime principale';
    },
  },
  product_types: function (d) {
    return 'Type de produits locaux';
  },
  professional_diploma: {
    qualification: function (d) {
      return 'diplôme professionel';
    },
  },
  professional_supervision: {
    supervision: function (d) {
      return 'professionel';
    },
  },
  profile: function (d) {
    return 'profil';
  },
  profiles: function (d) {
    return 'profils';
  },
  progressive: {
    snow_clearance_ratings: function (d) {
      return 'déneigement progressif';
    },
  },
  prominence: function (d) {
    return 'Proéminence';
  },
  protected: {
    $$noContext: function (d) {
      return 'protégé';
    },
    rain_proof_types: function (d) {
      return 'protégé de la pluie';
    },
  },
  'public transportation access': function (d) {
    return 'Accès en transports en commun';
  },
  public_transport: function (d) {
    return 'Sortie en mobilité douce';
  },
  public_transportation_rating: function (d) {
    return 'Accessibilité en transports en commun';
  },
  public_transportation_types: function (d) {
    return 'Type de transport en commun';
  },
  publication_date: function (d) {
    return 'Date de publication';
  },
  qualification: function (d) {
    return "Diplôme d'encadrement pour l'activité";
  },
  quality: function (d) {
    return 'Qualité du document';
  },
  quiet: {
    frequentation_types: function (d) {
      return 'non fréquenté';
    },
  },
  rain_proof: function (d) {
    return 'Pluie';
  },
  range: {
    area_types: function (d) {
      return 'massif';
    },
  },
  ratings: function (d) {
    return 'Cotations';
  },
  recent_avalanche: {
    avalanche_signs: function (d) {
      return "trace d'avalanche récente (après la dernière chute de neige, pluie, vent ou redoux)";
    },
  },
  reduce_impact: function (d) {
    return "Éléments ayant atténué les conséquences de l'événement";
  },
  remarks: function (d) {
    return 'Remarques';
  },
  'required field': function (d) {
    return 'champ obligatoire';
  },
  rescue: function (d) {
    return 'Intervention des services de secours';
  },
  resolution: function (d) {
    return 'résolution';
  },
  restricted_access: function (d) {
    return "Restrictions d'accès";
  },
  return_same_way: {
    route_types: function (d) {
      return 'aller-retour';
    },
  },
  rise: {
    image_categories: function (d) {
      return 'montée';
    },
  },
  risk: function (d) {
    return "Niveau de l'attention et évaluation des risques";
  },
  risk_rating: function (d) {
    return 'Risques objectifs';
  },
  'road access': function (d) {
    return 'Accès routier';
  },
  'road or pedestrian access': function (d) {
    return 'Accès routier ou pédestre';
  },
  rock_climbing: {
    activities: function (d) {
      return 'Escalade';
    },
  },
  rock_free_rating: function (d) {
    return 'Cotation libre';
  },
  rock_required_rating: function (d) {
    return 'Cotation obligatoire';
  },
  rock_types: function (d) {
    return 'Type de rocher';
  },
  roof: {
    climbing_styles: function (d) {
      return 'toit';
    },
  },
  route: function (d) {
    return 'itinéraire';
  },
  route_description: function (d) {
    return "Description de l'itinéraire";
  },
  route_history: function (d) {
    return "Historique de l'itinéraire";
  },
  route_length: function (d) {
    return "Longueur de l'itinéraire";
  },
  route_study: function (d) {
    return "Étude de l'itinéraire";
  },
  route_types: function (d) {
    return "Type d'itinéraire";
  },
  routes: function (d) {
    return 'itinéraires';
  },
  routes_quantity: function (d) {
    return 'Nombre de voies';
  },
  safe: {
    children_proof_types: function (d) {
      return 'adapté';
    },
  },
  safety: function (d) {
    return 'Mesures et techniques de sécurité mises en oeuvre';
  },
  safety_operation: {
    event_types: function (d) {
      return 'manœuvre de sécurité';
    },
  },
  scale: function (d) {
    return 'échelle';
  },
  scree: {
    ground_types: function (d) {
      return 'éboulis';
    },
  },
  seasonal: {
    parking_fee_types: function (d) {
      return 'saisonnier';
    },
  },
  'seasonal service': {
    public_transportation_ratings: function (d) {
      return 'service saisonnier';
    },
  },
  secondary_impacted: {
    author_statuses: function (d) {
      return 'victime secondaire';
    },
  },
  'see actual version': function (d) {
    return 'voir la version actuelle';
  },
  'sensitive_months:': function (d) {
    return 'Période de vigilance :';
  },
  sep: {
    months: function (d) {
      return 'septembre';
    },
  },
  service_on_demand: {
    public_transportation_types: function (d) {
      return 'service à la demande';
    },
  },
  severity: function (d) {
    return 'Gravité';
  },
  severity_no: {
    severities: function (d) {
      return 'pas de blessure';
    },
  },
  shelter: {
    waypoint_types: function (d) {
      return 'abri';
    },
  },
  'show all': function (d) {
    return 'Voir tous les résultats';
  },
  single: {
    climbing_outdoor_types: function (d) {
      return 'couenne';
    },
  },
  site_info: {
    article_categories: function (d) {
      return 'info site';
    },
  },
  ski_exposition: function (d) {
    return 'Exposition ski';
  },
  ski_instructor: {
    user_categories: function (d) {
      return 'moniteur de ski';
    },
  },
  ski_patroller: {
    user_categories: function (d) {
      return 'pisteur';
    },
  },
  ski_rating: function (d) {
    return 'Cotation ski';
  },
  skitouring: {
    activities: function (d) {
      return 'Ski, surf';
    },
    event_activities: function (d) {
      return 'Ski de randonnée';
    },
  },
  'skitouring gear': function (d) {
    return 'Ski, surf, raquette';
  },
  slab: {
    climbing_styles: function (d) {
      return 'dalle';
    },
  },
  slackline: {
    slackline_types: function (d) {
      return 'Slackline';
    },
  },
  slackline_anchor1: function (d) {
    return 'Ancrage 1';
  },
  slackline_anchor2: function (d) {
    return 'Ancrage 2';
  },
  slackline_height: function (d) {
    return 'hauteur de la slackline';
  },
  slackline_length: function (d) {
    return 'Longueur de la ligne';
  },
  slackline_length_max: function (d) {
    return 'Longueur de ligne maximale';
  },
  slackline_length_min: function (d) {
    return 'Longueur de ligne minimale';
  },
  slackline_spot: {
    waypoint_types: function (d) {
      return 'spot de slackline';
    },
  },
  slackline_type: function (d) {
    return 'Type de ligne';
  },
  slackline_types: function (d) {
    return 'Types de ligne';
  },
  slacklining: {
    activities: function (d) {
      return 'Slackline / Highline';
    },
  },
  slope: function (d) {
    return 'Pente';
  },
  slope_30_35: {
    avalanche_slopes: function (d) {
      return 'pente de 30 à 35°';
    },
  },
  slope_35_40: {
    avalanche_slopes: function (d) {
      return 'pente de 35 à 40°';
    },
  },
  slope_40_45: {
    avalanche_slopes: function (d) {
      return 'pente de 40 à 45°';
    },
  },
  slope_gt_45: {
    avalanche_slopes: function (d) {
      return 'pente supérieure à 45°';
    },
  },
  slope_lt_30: {
    avalanche_slopes: function (d) {
      return 'pente inférieure à 30°';
    },
  },
  small_pillar: {
    climbing_styles: function (d) {
      return 'colonnettes';
    },
  },
  snow: {
    ground_types: function (d) {
      return 'Neige';
    },
  },
  snow_clearance_rating: function (d) {
    return 'Déneigement';
  },
  snow_height: {
    weather_station_types: function (d) {
      return 'hauteur de neige';
    },
  },
  snow_ice_mixed: {
    activities: function (d) {
      return 'Neige, glace et mixte';
    },
    event_activities: function (d) {
      return 'Neige, glace et mixte';
    },
  },
  snow_quality: function (d) {
    return 'Qualité de la neige';
  },
  snow_quantity: function (d) {
    return 'Quantité de neige';
  },
  snowshoe_rating: function (d) {
    return 'Cotation raquette';
  },
  snowshoeing: {
    activities: function (d) {
      return 'Raquette';
    },
  },
  snowy: {
    access_conditions: function (d) {
      return 'enneigé';
    },
  },
  'soft snow': function (d) {
    return 'Neige meuble';
  },
  soft_mobility: {
    article_categories: function (d) {
      return 'mobilité douce';
    },
  },
  some: {
    frequentation_types: function (d) {
      return 'peu fréquenté';
    },
  },
  sometimes: {
    snow_clearance_ratings: function (d) {
      return 'déneigement occasionnel';
    },
  },
  sport_climbing: {
    event_activities: function (d) {
      return 'Escalade falaise';
    },
  },
  sport_shop: {
    product_types: function (d) {
      return 'magasin de sport';
    },
  },
  stone_ice_fall: {
    event_types: function (d) {
      return 'chute de pierre/glace/serac';
    },
  },
  stories: {
    article_categories: function (d) {
      return 'récits';
    },
  },
  'strong text': function (d) {
    return 'texte en gras';
  },
  summary: function (d) {
    return 'Résumé';
  },
  summit: {
    waypoint_types: function (d) {
      return 'sommet';
    },
  },
  supervision: function (d) {
    return 'Encadrement';
  },
  technical: {
    article_categories: function (d) {
      return 'technique';
    },
  },
  technics: {
    book_types: function (d) {
      return 'techniques';
    },
  },
  temperature: {
    weather_station_types: function (d) {
      return 'température';
    },
  },
  'text to display': function (d) {
    return 'texte à afficher';
  },
  time_management: function (d) {
    return "Gestion de l'horaire";
  },
  timing: function (d) {
    return 'Durée';
  },
  title: function (d) {
    return 'Titre';
  },
  topo: {
    book_types: function (d) {
      return 'topoguide';
    },
    image_categories: function (d) {
      return 'schéma / tracé';
    },
  },
  topoguide_supplements: {
    article_categories: function (d) {
      return 'suppléments du topoguide';
    },
  },
  'total snow': function (d) {
    return 'Epaisseur totale';
  },
  tourism: {
    book_types: function (d) {
      return 'tourisme';
    },
  },
  track: {
    image_categories: function (d) {
      return 'trace';
    },
  },
  training: function (d) {
    return 'Préparation physique et niveau technique';
  },
  traverse: {
    route_types: function (d) {
      return 'traversée';
    },
  },
  url: function (d) {
    return 'URL';
  },
  users: function (d) {
    return 'utilisateurs';
  },
  very_dangerous: {
    children_proof_types: function (d) {
      return 'dangereux';
    },
  },
  very_safe: {
    children_proof_types: function (d) {
      return 'bien adapté';
    },
  },
  via_ferrata: {
    activities: function (d) {
      return 'Via ferrata';
    },
  },
  via_ferrata_rating: function (d) {
    return 'Cotation via ferrata';
  },
  virtual: {
    waypoint_types: function (d) {
      return 'virtuel';
    },
  },
  waterfall: {
    waypoint_types: function (d) {
      return 'cascade';
    },
  },
  waterline: {
    slackline_types: function (d) {
      return 'Waterline';
    },
  },
  waterpoint: {
    waypoint_types: function (d) {
      return "point d'eau/source";
    },
  },
  waypoint: function (d) {
    return 'point de passage';
  },
  waypoint_children: function (d) {
    return 'sous-points de passage';
  },
  waypoint_slope: function (d) {
    return 'pente du terrain';
  },
  waypoint_type: function (d) {
    return 'Type de point de passage';
  },
  waypoints: function (d) {
    return 'points de passage';
  },
  weather: function (d) {
    return 'Météo';
  },
  weather_event: {
    event_types: function (d) {
      return 'événement météo';
    },
  },
  weather_station: {
    waypoint_types: function (d) {
      return 'station météo';
    },
  },
  weather_station_types: function (d) {
    return 'Variables mesurées par la station météo';
  },
  width: function (d) {
    return 'Largeur';
  },
  wind_direction: {
    weather_station_types: function (d) {
      return 'direction du vent';
    },
  },
  wind_speed: {
    weather_station_types: function (d) {
      return 'vitesse du vent';
    },
  },
  'write a summary': function (d) {
    return 'Indiquez ici un résumé';
  },
  'write your comments': function (d) {
    return 'Laissez vos commentaires';
  },
  xreport: function (d) {
    return 'incident / accident';
  },
  xreports: function (d) {
    return 'rapports incidents/accidents';
  },
  yes: {
    $$noContext: function (d) {
      return 'oui';
    },
    parking_fee_types: function (d) {
      return 'oui';
    },
  },
};
