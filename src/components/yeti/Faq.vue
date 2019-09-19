<template>
<!-- eslint-disable -->
  <div class="yeti-text">
    <p>L’application Yéti fournit une aide à la décision au pratiquant de sports de neige lors de la préparation d’une course.</p>
    <p>Cet article répond aux questions les plus fréquentes sur l’utilisation, l’intérêt et les limites de cette application.</p>

    <div class="question">
      <h3 class="title">Comment fonctionne l’application Yéti ?</h3>
      <p>L’application s’appuie sur des méthodes de réduction du risque et une interface cartographique. En analysant des variables clés (inclinaison de la pente, orientation…) Yéti permet de visualiser les principales pentes à risque en fonction du niveau de danger annoncé par le bulletin d’avalanche.</p>
      <p>Les méthodes de réduction utilisées dans l’application sont suivant le choix de l’utilisateur :</p>
      <ul>
        <li>la méthode de réduction débutant (MRD)</li>
        <li>la méthode de réduction élémentaire (MRE)</li>
        <li>la méthode de réduction professionnelle (MRP)</li>
      </ul>
      <p>Lire infra : Comment choisir une méthode de réduction adaptée à sa pratique ?</p>
      <p>Pour en savoir plus sur les méthodes de réduction du risque d’avalanche : </p>
      <ul>
        <li>P. Descamps et O. Moret, Avalanche, comment réduire le risque, éd. Paulsen, 2016</li>
        <li>W. Munter, 3X3 avalanches, la gestion du risque dans les sports d’hiver, éd. du Club alpin suisse, 2006</li>
        <li>S.Harvey, H.Rhyner et J.Schweizer, Avalanches, mieux les comprendre, éd. du Club alpin suisse, SLF, 2013</li>
        <li>White risk: <a href="http://www.whiterisk.ch/fr">www.whiterisk.ch</a></li>
      </ul>
    </div>

    <div class="question">
      <h3 class="title">Sur quels territoires l’application Yéti peut-elle être utilisée ?</h3>
      <p>Yéti fonctionne sur tous les massifs français.</p>
    </div>

    <div class="question">
      <h3 class="title">Faut-il être connecté pour utiliser l’application Yéti ?</h3>
      <p>Yéti interroge plusieurs sources de données dont le Référentiel grande échelle de l’IGN (modèle numérique de terrain, grille régulière de points connus en altitude) par l’intermédiaire du Géoportail <a href="http://geoportail.gouv.fr">geoportail.gouv.fr</a>. L’accès à ces données nécessite d’être connecté à Internet. Yéti ne fonctionne pas encore hors connexion.</p>
      <p>En outre, au moins pendant la phase de test, l’utilisateur devra impérativement être connecté sur son compte Camptocamp.org lorsqu’il effectuera une requête.</p>
    </div>

    <div class="question">
      <h3 class="title">À qui s’adresse l’application Yéti ?</h3>
      <p>Yeti s’adresse à toutes les personnes soucieuses de gérer le risque d’avalanche au lieu de le subir. Pour tirer le meilleur parti de Yéti, il faut accepter de mettre en doute ses intuitions et raisonner à partir de données objectives.</p>
      <p>Une connaissance minimum de l’utilisation de la grille d’analyse 3X3 et des méthodes de réduction est conseillée pour apprécier l’intérêt et mesurer les limites de Yéti.</p>
      <p>Son usage nécessite un temps de préparation de course à la maison ou au refuge de 15 minutes à 1 heure.</p>
      <p>Pour en savoir plus sur l’analyse de risque avec la grille 3X3, se reporter aux ouvrages cités dans la question 1.</p>
      <p class="image"><img alt="Méthode 3x3" src="@/assets/img/yeti/methode_3x3.png"></p>
    </div>

    <div class="question">
      <h3 class="title">L’application Yéti est elle suffisante pour préparer une course ?</h3>
      <p>L’application Yéti doit être utilisée en complément d’une analyse de risque menée à l’aide de la grille d’analyse 3X3. Cette grille d’analyse permet d’analyser les 3 principaux facteurs de risque (conditions, terrain et groupe) à trois moment clés du déroulement d’une course : pendant la préparation à la maison, pendant l’approche et au pied des passages clés.</p>
      <p>En outre, Yéti est actuellement en phase de test. Il est possible que des bugs ou des biais soient mis à jour au cours du test.</p>
      <p>On conservera toujours un œil critique sur les informations données par l’application (lire infra : Quelles sont les limites de Yéti ?).</p>
    </div>

    <div class="question">
      <h3 class="title">Quel est l’intérêt de Yéti ?</h3>
      <p>L’art de l’alpinisme et du ski de montagne est de parcourir un milieu potentiellement dangereux en réduisant les risques.</p>
      <p>Lors de la préparation à la maison, Yéti permet de distinguer d’un coup d’œil les pentes les plus risquées et d’identifier facilement les passages clés d’un itinéraire. Valider un choix de course et imaginer des options de repli sont facilités grâce à la vision d’ensemble qu’offre l’interface cartographique.</p>
      <p>Avec Yéti, la préparation de course consiste à se faufiler dans les espaces de moindre risque, à privilégier les pentes dont les probabilités de déclenchement sont les plus faibles (mais jamais nulles) ou, pour les plus téméraires, à prendre des risques en connaissance de cause.</p>
      <p>Yéti ne délivre pas un feu vert ou un feu rouge. Yéti donne une information sur la plus ou moins grande probabilité de déclenchement des pentes afin d’orienter ses choix de course en fonction des conditions nivologiques prévues.</p>
    </div>

    <div class="question">
      <h3 class="title">L’application Yéti peut-elle être utilisée sur le terrain ?</h3>
      <p>Yéti est un outil d’aide à la décision pour préparer une course à la maison.</p>
      <p>Sur le terrain, le pratiquant dispose d’informations nouvelles et concrètes sur les conditions, le terrain et le groupe. Au fur et à mesure de la progression, l’analyse des données réelles confirme, nuance ou modifie les hypothèses émises à la maison à l’aide de Yéti. Des outils comme le 3X3, la quantité critique de neige fraîche, les signaux d’alarme, les bâtons pour mesurer la pente sont alors plus utiles que l’application Yéti pour prendre une décision.</p>
      <p>Sur le terrain, les bonnes questions à se poser sont notamment :</p>
      <ul>
        <li>y a-t-il des signaux d’alarme ?</li>
        <li>la quantité critique de neige fraîche est-elle dépassée ?</li>
        <li>la visibilité permet-elle de conduire une analyse de risque perspicace ?</li>
        <li>la configuration du terrain est-elle favorable ou défavorable ?</li>
        <li>est-il possible de faire une trace sûre ?</li>
        <li>les participants sont-ils motivés et au niveau pour la course ?</li>
        <li>etc</li>
      </ul>
      <p>Des réponses lucides à ces questions sont nécessaires pour prendre une bonne décision à l’approche et dans les passages clés. Cela demande une formation solide et quelques années de pratique.</p>
    </div>

    <div class="question">
      <h3 class="title">Quelles sont les limites de Yéti ?</h3>
      <p>Les limites connues de Yéti sont liées à trois facteurs :</p>
      <ul>
        <li>la précision des données analysées par l’application : cartes des pentes et bulletin d’avalanche,</li>
        <li>l’utilisation de méthodes probabilistes : MRD, MRE et MRP,</li>
        <li>les limites de l’algorithme utilisé.</li>
      </ul>
      <p>Les limites de la carte des pentes : la réalisation de la carte des pentes s’appuie sur les données de la base RGEAlti de l’IGN. Cette base de données est issue d’un assemblage de différents modèles numérique de terrain (MNT) dont la résolution est comprise entre 1 et 25 mètres. Toutes les pentes à plus de 30 degrés dont la taille est supérieure à 25 mètres sur le terrain figurent sur la carte. Cette précision est la plupart du temps suffisante pour évaluer l’inclinaison des passages clés d’un itinéraire à skis ou à raquettes. Toutefois, dans certaines circonstances, des pentes réduites de moins de 25 mètres peuvent déjà être dangereuses. Il convient de rester vigilant sur le terrain en conservant un esprit critique par rapport aux informations données par Yéti. En outre, quelques aberrations visuelles peuvent survenir au niveau des frontières. Elles sont liées à la qualité du découpage du MNT dans les zones frontalières.</p>
      <p class="image"><img alt="Aberration frontalière" src="@/assets/img/yeti/artefact_vallorcine.png"></p>
      <p>Pour en savoir plus : <a href="https://www.petzl.com/fondation/projets/carte-pente-risque-avalanches?language=fr#.Wi5q1lSdVE4">Les pentes à plus de 30 degrés sur le Géoportail de l’IGN, Utilisation, intérêts et limites pour les amateurs de sport de neige</a></p>
      <p>Les limites du bulletin d’avalanche : le bulletin d’avalanche dresse un état des lieux du danger d’avalanche à l’échelle d’un massif en dehors des pistes balisées. Les conditions d’une vallée (et encore moins celle d’une pente) ne sont pas évaluées par le bulletin d’avalanche.
      L’indice de danger de 1 à 5 est le résumé d’une situation plus complexe décrite dans le texte qui accompagne le bulletin. La lecture de ce texte est l’un des piliers de l’analyse de risque avec la grille 3X3, laquelle doit systématiquement précéder l’usage de Yéti. La saisie de l’indice de danger dans le formulaire de Yéti suppose que le pratiquant a bien pris connaissance de l’ensemble du bulletin : texte, rose des vents, quantité récente de neige fraîche…
      Enfin, le bulletin n’est diffusé en France que du 15 décembre au 30 avril alors que l’exposition au danger peut avoir lieu toute l’année notamment en haute montagne.
      Il existe des outils pour affiner et, au besoin, corriger les informations du bulletin d’avalanche. Se reporter aux ouvrages cités dans la question 1.</p>
      <p>Les limites des méthodes de réduction : les méthodes de réduction s’appuient sur de nombreuses expériences sédimentées à travers l’accidentologie dont on peut tirer quelques enseignements par le biais des probabilités. Cette somme d’expériences sera toujours plus étendue que l’expérience d’une seule personne, fût-elle chevronnée. Toutefois, il demeure possible de provoquer ou de subir une avalanche y compris dans une pente non identifiée comme «à risque» par une méthode de réduction. Le pratiquant de la montagne enneigée doit faire un usage raisonné et critique de Yéti et des outils mis à sa disposition pour évaluer le risque. Il reste responsable des analyses conduites à la maison, des décisions prises sur le terrain, de ses actes et de leurs conséquences.
      Les auteurs et institutions partenaires du projet ne sauraient être tenus responsables des accidents survenant lors de la pratique après utilisation de l’application Yéti.</p>
      <p>Les limites de l’algorithme utilisé par Yéti : en l’état actuel du développement, seules les pentes considérées comme «à risque» par les méthodes de réduction (MRD, MRE ou MRP) sont affichées avec un estompage coloré. Or, à partir du danger 3, il convient de prendre en compte les pentes raides qui dominent l’itinéraire envisagé car elles sont susceptibles d’être déclenchées à distance.
      À partir du danger 3, l’absence d’estompage ne signifie pas que l’itinéraire est sûr. Vérifier les pentes dominant l’itinéraire et s’assurer qu’elles ne menacent pas directement la trace.</p>
      <p class="image"><img alt="Prise en compte des pentes amont" src="@/assets/img/yeti/pentes_amont.png"></p>
      <p>Dans l’exemple ci-dessous, par risque 3, si on remonte le vallon en direction du lac, on est en permanence dominé par des pentes considérées comme à risque (bleue foncée rive droite, bleue clair rive gauche). Un départ d’avalanche à partir du danger 3 peut s’écouler en terrain moins raide sur lequel il n’y a pas d’estompage de couleur.</p>
    </div>

    <div class="question">
      <h3 class="title">Comment choisir une méthode de réduction adaptée à sa pratique ?</h3>
      <h4 class="title is-4">La méthode de réduction débutant (MRD)</h4>
      <p>La méthode de réduction débutant (MRD) s’adresse aux pratiquants possédant peu d’expérience de la neige en dehors des pistes balisées. Un encadrant expérimenté préparant une sortie pour des débutants aura intérêt à utiliser cette méthode afin de se ménager une marge de sécurité adaptée à un public qui progresse plus lentement avec des chutes fréquentes (sollicitation du manteau neigeux). Les zones considérées comme à risque sont figurées en bleu clair.</p>
      <p class="image"><img alt="MRD" src="@/assets/img/yeti/mrd.png"></p>
      <h4 class="title is-4">La méthode de réduction élémentaire (MRE)</h4>
      <p>La méthode de réduction élémentaire (MRE) convient aux pratiquants expérimentés soucieux de conserver une marge de sécurité confortable. Avec la MRE, on peut combler une belle vie de skieur en profitant de la poudreuse en hiver et des meilleures neiges de printemps. Elle a été adoptée par des guides expérimentés qui l’estiment suffisante pour se faire plaisir en exerçant leur profession de manière plus détendue.</p>
      <p>Les zones considérées comme à risque sont figurées par deux tons de bleu :</p>
      <ul>
        <li>bleu foncé pour les pentes à risque dans les orientations cochées sur la rose des vents.</li>
        <li>bleu clair pour les autres pentes à risque</li>
      </ul>
      <p class="image"><img alt="MRE" src="@/assets/img/yeti/mre.png"></p>
      <h4 class="title is-4">La méthode de réduction professionnelle (MRP)</h4>
      <p>la méthode de réduction professionnelle (MRP) offre un choix de course plus important sur le terrain notamment en pente raide, mais réduit la marge de sécurité. Elle nécessite une compréhension plus fine du manteau neigeux et fait intervenir des paramètres comme l’orientation de la pente, la fréquentation de l’itinéraire et les mesures de précaution envisagée pendant la course. Elle s’adresse aux pratiquants expérimentés qui se sentent trop limités par la MRE.</p>
      <p>Les pentes à risque sont figurées par trois couleurs :</p>
      <ul>
        <li>risque résiduel inférieur à 1 : pas d’estompage de couleur</li>
        <li>risque résiduel compris entre 1 et 1.3 : bleu clair</li>
        <li>risque résiduel compris entre 1.3 et 1.5 : bleu foncé</li>
        <li>risque résiduel > 1.5 : violet</li>
      </ul>
      <p class="image"><img alt="MRP" src="@/assets/img/yeti/mre.png"></p>
    </div>

    <div class="question">
      <h3 class="title">Comment utiliser Yéti avec la MRD ?</h3>
      <p>Sélectionner la méthode de réduction débutant (MRD) dans le formulaire.
      Saisir le niveau de danger annoncé par le bulletin d’avalanche, de 1 à 3. Le degré 4 ne peut être saisi dans la MRD. Le cas échéant, mentionner la limite d’altitude à partir de laquelle le danger évolue. Zoomer sur le massif, la vallée ou la pente concernée. Activez la carte IGN en cliquant sur l’icône bleue en bas à gauche de la carte.
      Soumettre la requête. L’application affiche les pentes à risque avec un code couleur sur une interface cartographique. La légende est accessible en cliquant sur l’icône « point d’interrogation » en haut à droite de la carte.</p>
      <p>Pas d’estompage de couleur : le projet est valable. Rester vigilant sur le terrain si les conditions ou la taille du groupe évoluent. Attention aux pentes qui dominent l’itinéraire à partir du danger 3 (risque de déclenchement à distance).
      Couleur bleu clair : pentes à risque</p>
      <p class="image"><img alt="MRD" src="@/assets/img/yeti/mrd_carte.png"></p>
    </div>

    <div class="question">
      <h3 class=title>Comment utiliser Yéti avec la MRE ?</h3>
      <p>Sélectionner la méthode de réduction élémentaire (MRE) dans le formulaire.
      Saisir le niveau de danger annoncé par le bulletin d’avalanche, de 1 à 4. Le cas échéant, mentionner la limite d’altitude à partir de laquelle le danger évolue. Signaler les orientations critiques données dans la rose des vents du bulletin.
      Zoomer sur le massif, la vallée ou la pente concernée. Activez la carte IGN en cliquant sur l’icône bleue en bas à gauche de la carte.
      Soumettre la requête. L’application affiche les pentes à risque avec un code couleur sur une interface cartographique. La légende est accessible en cliquant sur l’icône « point d’interrogation » en haut à droite de la carte.</p>
      <p>Pas d’estompage de couleur : le projet est valable. Rester vigilant sur le terrain si les conditions ou la taille du groupe évoluent. Attention aux pentes qui dominent l’itinéraire à partir du danger 3 (risque de déclenchement à distance).</p>
      <ul>
        <li>Couleur bleu clair : pentes à risque</li>
        <li>Couleur bleu foncé : risque accru du fait de l’orientation</li>
      </ul>
      <p class="image"><img alt="MRE" src="@/assets/img/yeti/mre_carte.png"></p>
    </div>

    <div class="question">
      <h3 class="title">Comment utiliser Yéti avec la MRP ?</h3>
      <p>Sélectionner la méthode de réduction professionnelle (MRP) dans le formulaire.
      Saisir le potentiel de danger de 1 à 12. Préciser au besoin les orientations critiques de la rose des vents du bulletin.
      Si vous estimez que le manteau neigeux sera mouillé, cochez la case «neige mouillée» (pluie, soleil et chaleur notamment au printemps)
      Préciser la taille du groupe et les mesures de précaution envisagée.
      Zoomer sur le massif, la vallée ou la pente concernée. Activez la carte IGN en cliquant sur l’icône bleue en bas à gauche de la carte.
      Soumettre la requête. L’application affiche les pentes à risque avec un code couleur sur une interface cartographique. La légende est accessible en cliquant sur l’icône « point d’interrogation » en haut à droite de la carte.</p>
      <p>Pas d’estompage de couleur : risque résiduel < inférieur à 1, le projet est valable. Rester vigilant sur le terrain si les conditions ou la taille du groupe évoluent. Attention aux pentes qui dominent à partir du danger 3 (risque de déclenchement à distance).</p>
      <ul>
        <li>Couleur bleue claire : risque résiduel entre 1 et 1.3, prise de risque accrue. Adopter une technique de ski défensive. Prendre des mesures de précaution (distances de sécurité et de délestage).</li>
        <li>Couleur bleue foncée : risque résiduel entre 1.3 et 1.5, la marge de sécurité est réduite. Une grande expérience est requise pour faire une trace sûre. Les mesures de précaution doivent être appliquées scrupuleusement. Le renoncement doit être sérieusement envisagé.</li>
        <li>Couleur violette : risque résiduel supérieur à 1.5, il n’est plus possible de gérer le risque même avec des mesures de précaution appropriées ou une trace optimisée. Il faut compter sur sa bonne étoile… ou plus sérieusement changer d’itinéraire.</li>
      </ul>
      <p class="image"><img alt="MRP" src="@/assets/img/yeti/mrp_carte.png"></p>
    </div>

    <div class="question">
      <h3 class="title">Qui sont les concepteurs et partenaires de l’application Yéti ?</h3>
      <p>L’application a d’abord été développée sous forme d’un démonstrateur sous le logiciel Qgis. Elle est en cours de migration vers un service web. Le déploiement de Yéti sur un serveur de l’ENSG-Géomatique avec une page web sur Camptocamp.org va démarrer prochainement. Le développement a été assuré par des élèves ingénieurs et des enseignants-chercheurs de l’<a href="http://www.ensg.eu">ENSG-Géomatique</a> ainsi que par des développeurs du Géoportail de l’IGN.</p>
      <p>La <a href="https://www.petzl.com/fondation/fondation-petzl?language=fr">Fondation Petzl</a> accompagne et soutient le projet.</p>
      <p>Le site web <a href="https://www.camptocamp.org/">Camptocamp.org</a> accueille et facilite la mise en ligne de l’application.</p>
    </div>

    <div class="question">
      <h3 class="title">Données personnelles</h3>
      <p>Aucune donnée n’est conservée sur le serveur. A la fin de chaque requête, toutes les données temporaires sont détruites. L’adresse IP du requérant n’est pas conservée.</p>
    </div>

    <div class="question">
      <h3 class="title">Une question, une remarque, une demande de précision, qui contacter ?</h3>
      <p>Pour plus d’informations, vous pouvez contacter <a href="mailto:jacques.beilin@ensg.eu">Jacques Beilin</a> ou <a href="mailto:omoret@fondation-petzl.org">Olivier Moret</a></p>
    </div>
  </div>
</template>

<style scoped>
h3 {
  margin-top: 2em;
}
p {
  margin: 1em 0;
}
ul {
  margin: .5em 0;
  padding-left: 40px;
  list-style-type: disc;
}
.image {
  text-align: center;
}
.image img {
  display: inline-block;
  width: auto;
  height: auto;
  max-width: 90%;
  max-height: 500px;
}
</style>
