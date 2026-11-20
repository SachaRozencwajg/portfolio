/* Contenu de la salle de CEC : les vues, les éléments cliquables et leurs fiches.
   Coordonnées en mètres. La machine cœur-poumon est posée en (0,9 ; 0 ; 0,35) : h() part de son repère. */
(function () {
    'use strict';

    const ref = (text, url, label) => `<p class="ref">${text} <a href="${url}" target="_blank" rel="noopener">${label || 'DOI'}</a></p>`;

    const c = (x, y, z) => [x, y, z];                  // la salle
    const h = (x, y, z) => [0.9 + x, y, 0.35 + z];     // la machine cœur-poumon

    // Vues proposées : cible, distance, azimut (0 = côté perfusionniste), angle depuis la verticale
    const VIEWS = {
        ensemble: { target: [0.1, 0.95, -0.3], r: 6.6, az: 0.32, pol: 1.1 },
        perfusion: { target: [0.72, 0.95, 0.35], r: 3.3, az: 0.12, pol: 1.2 },
        chirurgie: { target: [-0.2, 0.9, -0.35], r: 5.4, az: 2.62, pol: 1.05 }
    };

    const HOTSPOTS = [
        {
            id: 'champ', label: 'Le champ opératoire', anchor: c(-2.02, 1.36, -1.3), view: { r: 2.7, az: -0.25, pol: 1.0 },
            kicker: 'Le patient', title: 'Le champ opératoire',
            html: `<p class="lede">Tout part d'ici et tout y revient&nbsp;: le sang quitte l'oreillette droite et retourne dans l'aorte.</p>
<h4>Le déroulement</h4>
<ol><li>Héparine, puis contrôle de l'ACT.</li><li>Canulation de l'aorte, puis de l'oreillette droite.</li><li>Départ en CEC&nbsp;: le débit monte, la ventilation s'arrête.</li><li>Clampage de l'aorte et cardioplégie&nbsp;: le cœur s'arrête.</li><li>Geste chirurgical.</li><li>Déclampage&nbsp;: le cœur est reperfusé et repart.</li><li>Réchauffement, reprise de la ventilation, sevrage.</li><li>Protamine, une fois la CEC arrêtée.</li></ol>
<h4>Côté anesthésie</h4>
<p>La protamine s'annonce à voix haute&nbsp;: les aspirations de cardiotomie sont arrêtées dès qu'elle commence.</p>
<h4>Côté perfusion</h4>
<p>Chaque étape s'annonce et se confirme à voix haute&nbsp;: «&nbsp;en CEC&nbsp;», «&nbsp;plein débit&nbsp;», «&nbsp;clampé&nbsp;», «&nbsp;déclampé&nbsp;», «&nbsp;CEC arrêtée&nbsp;».</p>`
        },
        {
            id: 'veineuse', label: 'Ligne veineuse', anchor: c(-1.25, 1.02, -0.42), view: { r: 2.5, az: -0.1, pol: 1.05 },
            kicker: 'Du patient à la machine', title: 'La ligne veineuse',
            html: `<p class="lede">Le sang descend vers la machine par simple gravité&nbsp;: c'est un siphon.</p>
<h4>Comment ça marche</h4>
<p>Le réservoir est placé plus bas que le patient. Le drainage dépend de cette différence de hauteur, du calibre de la canule et de la volémie.</p>
<h4>Ce qui peut le gêner</h4>
<ul><li>Une canule mal placée ou coudée.</li><li>Une hypovolémie.</li><li>De l'air dans la ligne, qui désamorce le siphon.</li></ul>
<p>Un drainage assisté par une dépression contrôlée est possible.</p>
<h4>Côté anesthésie</h4>
<p>Un mauvais drainage se voit des deux côtés&nbsp;: le réservoir baisse, le cœur se remplit et la pression veineuse centrale monte.</p>
<h4>Côté perfusion</h4>
<p>Le clamp veineux règle le retour. Le fermer en partie retient du sang chez le patient et remplit le cœur&nbsp;: c'est le geste du sevrage.</p>`
        },
        {
            id: 'reservoir', label: 'Réservoir veineux', anchor: h(-0.84, 0.62, 0.13), view: { r: 1.7, az: -0.55, pol: 1.2 },
            kicker: 'La réserve du circuit', title: 'Le réservoir veineux',
            html: `<p class="lede">La réserve de sang du circuit, et sa première sécurité.</p>
<h4>Comment ça marche</h4>
<p>Il reçoit le retour veineux et le sang des aspirations, qu'il filtre et débulle.</p>
<h4>La règle</h4>
<p>Il ne doit jamais se vider&nbsp;: un réservoir vide envoie de l'air dans la pompe, puis dans l'aorte. Un détecteur de niveau ralentit ou arrête la pompe artérielle.</p>
<h4>Côté anesthésie</h4>
<p>Quand le niveau baisse, le perfusionniste réduit le débit ou demande un remplissage. C'est le moment de parler volémie et vasoplégie.</p>
<h4>Côté perfusion</h4>
<p>Le niveau minimal de sécurité se fixe avant le départ. Le capteur de niveau est posé à cette hauteur et testé à la check-list.</p>`
        },
        {
            id: 'pompe', label: 'Pompe artérielle', anchor: h(-0.5, 0.72, 0.16), view: { r: 1.6, az: 0.25, pol: 1.2 },
            kicker: 'Le cœur de la machine', title: 'La pompe artérielle',
            html: `<p class="lede">Elle remplace le ventricule gauche et fixe le débit de perfusion.</p>
<h4>Comment ça marche</h4>
<ul><li><b>Pompe à galets</b>&nbsp;: occlusive. Le débit ne dépend que de la vitesse de rotation et du calibre du tuyau, quelle que soit la résistance en aval.</li><li><b>Pompe centrifuge</b>&nbsp;: non occlusive. Le débit dépend de la précharge et de la postcharge&nbsp;: il faut un débitmètre, et un clamp à l'arrêt pour éviter le reflux.</li></ul>
<p>Ici, la pompe est montée sur un mât, tout près de l'oxygénateur&nbsp;: des tuyaux plus courts, donc moins de volume d'amorçage et moins d'hémodilution.</p>
<h4>Repères</h4>
<ul><li>Débit&nbsp;: fixé avant le départ, selon la surface corporelle et la température prévue. L'essai sur la pression, plus bas, l'a fixé à 2,4 L/min/m².</li><li>Pression artérielle moyenne&nbsp;: aucune cible unique n'a fait la preuve de sa supériorité (voir plus bas).</li><li>Apport en oxygène (DO₂)&nbsp;: 280 mL/min/m² ou plus, dans l'essai cité plus bas.</li></ul>
<div class="calc">
<p class="calc__title">Essayez&nbsp;: la DO₂ dépend du débit et de l'hémoglobine</p>
<label for="doQ">Débit indexé <output id="doQo" for="doQ">2,4</output> L/min/m²</label>
<input type="range" id="doQ" min="1.6" max="3" step="0.1" value="2.4">
<label for="doHb">Hémoglobine <output id="doHbo" for="doHb">8,0</output> g/dL</label>
<input type="range" id="doHb" min="5" max="13" step="0.5" value="8">
<p class="calc__out" id="doOut" role="status"></p>
<p class="calc__note">Valeur calculée&nbsp;: débit × 10 × (1,34 × Hb × SaO₂ + 0,003 × PaO₂), avec SaO₂ à 100&nbsp;% et PaO₂ à 200 mmHg.</p>
</div>
<h4>Ce que disent les études</h4>
<p><b>Pression.</b> 197 patients, débit fixé à 2,4 L/min/m², pression moyenne de 70 à 80 mmHg contre 40 à 50 mmHg. De nouvelles lésions ischémiques cérébrales à l'IRM chez 55,7&nbsp;% contre 52,8&nbsp;% des patients&nbsp;: ni leur volume ni leur nombre ne différaient.</p>
${ref('Vedel AG, et al. Circulation 2018;137:1770-1780.', 'https://doi.org/10.1161/CIRCULATIONAHA.117.030308')}
<p><b>Apport en oxygène.</b> 326 patients analysés dans 9 centres. Maintenir la DO₂ à 280 mL/min/m² ou plus a réduit l'insuffisance rénale aiguë de stade 1 (risque relatif 0,45&nbsp;; IC 95&nbsp;% 0,25 à 0,83), sans différence pour les stades 2 et 3.</p>
${ref('Ranucci M, et al. J Thorac Cardiovasc Surg 2018;156:1918-1927.', 'https://doi.org/10.1016/j.jtcvs.2018.04.045')}
<p>Pour aller plus loin&nbsp;:</p>
${ref('Recommandations EACTS/EACTA/EBCP 2019 sur la CEC chez l\'adulte. Interact Cardiovasc Thorac Surg 2020;30:161-202.', 'https://doi.org/10.1093/icvts/ivz251')}
<h4>Côté anesthésie</h4>
<p>La pression se règle après le débit&nbsp;: on vérifie le débit et la profondeur d'anesthésie, puis on recourt au vasoconstricteur ou au vasodilatateur.</p>
<h4>Côté perfusion</h4>
<ul><li>L'occlusion des galets se règle avant chaque cas&nbsp;: trop serrée, elle hémolyse&nbsp;; pas assez, le débit réel est inférieur au débit affiché.</li><li>Le calibre du tuyau saisi dans la machine doit être celui du tuyau monté.</li></ul>`
        },
        {
            id: 'oxy', label: 'Oxygénateur', anchor: h(-0.84, 0.28, 0.12), view: { r: 1.7, az: -0.5, pol: 1.3 },
            kicker: 'Le poumon de la machine', title: "L'oxygénateur et l'échangeur thermique",
            html: `<p class="lede">Le poumon du circuit, et son radiateur.</p>
<h4>Comment ça marche</h4>
<p>Des milliers de fibres creuses&nbsp;: le gaz circule dans les fibres, le sang autour, sans contact direct.</p>
<h4>Les deux réglages</h4>
<ul><li>La FiO₂ du mélangeur règle la PaO₂.</li><li>Le débit de gaz, appelé balayage, règle la PaCO₂.</li></ul>
<h4>La température</h4>
<ul><li>La température du sang à la sortie de l'oxygénateur sert de reflet de la température cérébrale, qu'elle sous-estime au réchauffement.</li><li>Sortie artérielle sous 37&nbsp;°C.</li><li>Pas plus de 10&nbsp;°C d'écart entre l'entrée veineuse et la sortie artérielle, au refroidissement comme au réchauffement.</li><li>Au-dessus de 30&nbsp;°C&nbsp;: écart de 4&nbsp;°C au plus, et 0,5&nbsp;°C par minute au plus.</li></ul>
${ref('Engelman R, et al. J Cardiothorac Vasc Anesth 2015;29:1104-1113.', 'https://doi.org/10.1053/j.jvca.2015.07.011')}
<h4>Côté anesthésie</h4>
<p>Un sang artériel qui fonce fait vérifier, dans l'ordre&nbsp;: l'arrivée de gaz, la FiO₂, puis l'oxygénateur lui-même.</p>
<h4>Côté perfusion</h4>
<ul><li>La pression se mesure avant et après l'oxygénateur&nbsp;: un écart qui monte fait suspecter une membrane qui se bouche.</li><li>La sortie de gaz reste libre&nbsp;: la pression côté gaz ne doit jamais dépasser celle du sang.</li></ul>`
        },
        {
            id: 'filtre', label: 'Filtre artériel', anchor: h(-1.02, 0.58, 0.09), view: { r: 1.5, az: -0.9, pol: 1.2 },
            kicker: 'Avant le retour au patient', title: 'Le filtre artériel et les sécurités',
            html: `<p class="lede">Le dernier rempart avant le patient.</p>
<h4>Comment ça marche</h4>
<p>Il retient les bulles et les particules. Une purge renvoie l'air piégé vers le réservoir.</p>
<h4>Autour de lui</h4>
<ul><li>Un détecteur de bulles, qui arrête la pompe.</li><li>Un capteur de pression de ligne, qui signale une canule coudée ou mal placée.</li></ul>
<h4>Côté anesthésie</h4>
<p>Une pression de ligne qui monte au départ en CEC, avec une pression artérielle basse, doit faire évoquer une canule mal placée ou une dissection.</p>
<h4>Côté perfusion</h4>
<p>Le détecteur de bulles se pose sur la ligne artérielle et se teste à la check-list. La purge du filtre reste ouverte vers le réservoir.</p>`
        },
        {
            id: 'cardio', label: 'Cardioplégie', anchor: h(-0.52, 1.45, -0.16), view: { r: 1.9, az: -0.15, pol: 1.2 },
            kicker: 'La poche, la seringue et la pompe', title: 'La cardioplégie',
            html: `<p class="lede">Une solution riche en potassium, perfusée dans les coronaires, arrête le cœur en diastole.</p>
<h4>Les familles</h4>
<ul class="rows">
<li><b>Cristalloïde extracellulaire</b><span>Type St Thomas&nbsp;: riche en potassium.</span></li>
<li><b>Cristalloïde intracellulaire</b><span>Type Bretschneider (HTK)&nbsp;: pauvre en sodium, en dose unique.</span></li>
<li><b>Sanguine</b><span>Type Buckberg&nbsp;: quatre volumes de sang pour un de cristalloïde, répétée.</span></li>
<li><b>del Nido</b><span>Un volume de sang pour quatre de cristalloïde, avec de la lidocaïne, en dose unique.</span></li>
<li><b>Microplégie</b><span>Le sang du patient, avec le potassium ajouté au pousse-seringue&nbsp;: peu d'hémodilution.</span></li>
</ul>
<h4>Les voies</h4>
<ul><li>Antérograde&nbsp;: dans la racine de l'aorte ou les ostia coronaires.</li><li>Rétrograde&nbsp;: par le sinus coronaire.</li></ul>
<h4>Ce que disent les études</h4>
<p><b>Sanguine ou cristalloïde.</b> Méta-analyse de 34 essais&nbsp;: moins de bas débit cardiaque avec la cardioplégie sanguine (odds ratio 0,54&nbsp;; IC 95&nbsp;% 0,34 à 0,84). Infarctus et décès comparables.</p>
${ref('Guru V, et al. Circulation 2006;114(1 Suppl):I331-338.', 'https://doi.org/10.1161/CIRCULATIONAHA.105.001644')}
<p><b>del Nido chez l'adulte.</b> Essai randomisé, 48 patients contre 41 sous cardioplégie sanguine&nbsp;: des résultats cliniques comparables, sans différence significative au seuil fixé.</p>
${ref('Ad N, et al. J Thorac Cardiovasc Surg 2018;155:1011-1018.', 'https://doi.org/10.1016/j.jtcvs.2017.09.146')}
<h4>Côté anesthésie</h4>
<p>Surveiller la kaliémie, et signaler à l'ETO un ventricule gauche qui se distend.</p>
<h4>Côté perfusion</h4>
<ul><li>L'heure de chaque dose se note&nbsp;: le délai avant la suivante dépend de la solution.</li><li>La pression de perfusion se surveille, surtout par voie rétrograde&nbsp;: trop haute, elle lèse le sinus coronaire.</li></ul>`
        },
        {
            id: 'aspi', label: 'Aspirations et décharge', anchor: h(0.045, 0.96, 0), view: { r: 1.7, az: 0.15, pol: 0.95 },
            kicker: 'Les deux pompes de droite', title: 'Les aspirations et la décharge',
            html: `<p class="lede">Elles gardent le champ sec et le cœur vide.</p>
<h4>Les aspirations de cardiotomie</h4>
<p>Elles ramènent le sang du champ vers le réservoir. Ce sang a touché l'air et les tissus&nbsp;: il est activé et hémolysé. On s'en sert le moins possible.</p>
<h4>La décharge</h4>
<p>Elle vide le ventricule gauche&nbsp;: un cœur arrêté qui se distend souffre.</p>
<h4>Côté anesthésie</h4>
<p>À l'ETO, un ventricule gauche qui se dilate pendant le clampage est une information à donner tout de suite.</p>
<h4>Côté perfusion</h4>
<ul><li>L'aspiration tourne au plus bas débit utile&nbsp;: trop forte, elle hémolyse et fait entrer de l'air.</li><li>La décharge ne doit jamais tourner à l'envers&nbsp;: son sens se vérifie avant de la brancher.</li></ul>`
        },
        {
            id: 'gaz', label: 'Mélangeur de gaz', anchor: h(-0.28, 1.12, -0.16), view: { r: 1.7, az: -0.1, pol: 1.2 },
            kicker: "L'air, l'oxygène et l'halogéné", title: 'Le mélangeur de gaz',
            html: `<p class="lede">Deux réglages&nbsp;: la FiO₂ et le débit de balayage.</p>
<h4>Comment ça marche</h4>
<p>Il mélange l'air et l'oxygène, puis envoie le gaz dans les fibres de l'oxygénateur.</p>
<h4>L'halogéné</h4>
<p>Un évaporateur peut être branché sur cette ligne&nbsp;: l'halogéné passe alors dans le sang par l'oxygénateur. La sortie de gaz de l'oxygénateur est reliée à une évacuation.</p>
<h4>Côté anesthésie</h4>
<p>Pendant la CEC, les poumons ne délivrent plus l'anesthésie&nbsp;: elle passe par ici, ou par voie intraveineuse.</p>
<h4>Côté perfusion</h4>
<p>Le gaz s'ouvre et se vérifie avant le départ en CEC. Le balayage s'ajuste ensuite sur les gaz du sang.</p>`
        },
        {
            id: 'cockpit', label: 'Cockpit', anchor: h(-0.68, 1.1, 0.3), view: { r: 1.5, az: -0.3, pol: 1.1 },
            kicker: 'La commande centrale', title: 'Le cockpit',
            html: `<p class="lede">Un seul écran pour piloter la machine et lire les paramètres de perfusion.</p>
<h4>Comment ça marche</h4>
<ul><li>Sur la machine représentée ici, chaque pompe se commande séparément&nbsp;: un bouton pour une pompe.</li><li>Chaque pompe porte aussi sa propre unité de commande, avec son écran et son bouton.</li><li>Dans la base, derrière une trappe, quatre unités de commande aux couleurs des boutons du cockpit.</li><li>Le cockpit et le moniteur patient sont reliés, mais fonctionnent séparément.</li></ul>
<h4>Côté anesthésie</h4>
<p>Le débit affiché ici est celui que l'on rapproche de la pression artérielle et de la SvO₂ avant de toucher aux vasopresseurs.</p>
<h4>Côté perfusion</h4>
<p>Les seuils d'alarme suivent le protocole de l'équipe. Les capteurs de niveau, de bulles et de pression se testent avant chaque départ en CEC.</p>`
        },
        {
            id: 'moniteur', label: 'Moniteur patient', anchor: h(0.02, 1.47, -0.1), view: { r: 1.9, az: 0.1, pol: 1.25 },
            kicker: "L'écran du haut et le capteur en ligne", title: 'Le moniteur patient et la surveillance',
            html: `<p class="lede">Il enregistre en continu les données et les événements de la CEC.</p>
<h4>Ce que le perfusionniste surveille</h4>
<ul><li>Le débit et la pression de ligne.</li><li>Le niveau du réservoir.</li><li>Les températures.</li><li>La SvO₂, reflet de l'équilibre entre l'apport et la consommation d'oxygène.</li></ul>
<h4>Le capteur en ligne</h4>
<p>Un capteur posé sur le circuit mesure les paramètres du sang sans prélèvement. Le moniteur en tire des indicateurs, dont l'apport en oxygène, pour une perfusion guidée par objectifs.</p>
<h4>L'anticoagulation</h4>
<p>Héparine avant la canulation, contrôlée par l'ACT, puis répétée pendant la CEC. Le seuil d'ACT exigé avant le départ suit le protocole de l'équipe.</p>
${ref('Shore-Lesserson L, et al. Recommandations STS/SCA/AmSECT. J Extra Corpor Technol 2018;50:5-18.', 'https://pubmed.ncbi.nlm.nih.gov/29559750/', 'PubMed')}
<h4>Côté anesthésie</h4>
<p>Les gaz du sang restent la référence&nbsp;: le capteur en ligne donne la tendance entre deux prélèvements.</p>`
        },
        {
            id: 'secours', label: 'Alimentation et secours', anchor: h(0.4, 1.25, 0.2), view: { r: 2.3, az: 0.55, pol: 1.15 },
            kicker: 'La colonne de droite', title: "L'alimentation et les secours",
            html: `<p class="lede">Une machine cœur-poumon doit continuer à tourner sans courant.</p>
<h4>Comment ça marche</h4>
<p>La machine comprend un bloc d'alimentation et une armoire électronique. Sur une machine cœur-poumon, une batterie prend le relais si le secteur est coupé. Son autonomie dépend du modèle et de l'état de la batterie&nbsp;: elle figure dans la notice.</p>
<h4>Si tout s'arrête</h4>
<p>Une pompe à galets se tourne à la main, avec une manivelle. Le geste s'apprend avant d'en avoir besoin&nbsp;: le sens de rotation, la cadence, qui clampe.</p>
<h4>Côté anesthésie</h4>
<p>Une panne de CEC se gère à deux&nbsp;: le perfusionniste rétablit le débit, l'anesthésiste annonce le temps écoulé et se tient prêt à reprendre la ventilation.</p>
<h4>Côté perfusion</h4>
<p>La check-list d'avant CEC vérifie la charge de la batterie et la présence de la manivelle.</p>`
        },
        {
            id: 'thermo', label: 'Générateur thermique', anchor: c(3.95, 1.05, -0.9), view: { r: 2.6, az: -0.75, pol: 1.1 },
            kicker: "Le circuit d'eau", title: 'Le générateur thermique',
            html: `<p class="lede">Il réchauffe et refroidit le sang, sans jamais le toucher.</p>
<h4>Comment ça marche</h4>
<p>Il fait circuler de l'eau dans l'échangeur de l'oxygénateur et dans celui de la cardioplégie.</p>
<h4>Ce que disent les études</h4>
<p>À Zurich, six patients ont développé une infection à Mycobacterium chimaera, révélée 1,5 à 3,6 ans après la chirurgie. La même souche a été retrouvée dans l'eau des générateurs thermiques et dans l'air de la salle quand ils fonctionnaient&nbsp;: la transmission se faisait par aérosol.</p>
${ref('Sax H, et al. Clin Infect Dis 2015;61:67-75.', 'https://doi.org/10.1093/cid/civ198')}
<h4>Côté perfusion</h4>
<p>L'eau et la désinfection suivent les consignes du fabricant. L'appareil se place loin du champ, sa sortie d'air tournée vers le mur, comme ici.</p>`
        },
        {
            id: 'anesth', label: 'Côté anesthésie', anchor: c(-3.6, 1.86, -2.76), view: { target: [-3.4, 1.2, -1.9], r: 3.6, az: 0.42, pol: 1.08 },
            kicker: 'À la tête du patient', title: 'Côté anesthésie',
            html: `<p class="lede">Pendant la CEC, le perfusionniste a la circulation. L'anesthésiste garde tout le reste.</p>
<ul><li>Ventilation arrêtée ou très réduite, reprise avant le sevrage.</li><li>Anesthésie entretenue par l'oxygénateur ou par voie veineuse.</li><li>Pression artérielle&nbsp;: après le débit, les vasoconstricteurs.</li><li>Glycémie, kaliémie, diurèse, température.</li><li>ETO&nbsp;: purge des cavités, fonction ventriculaire et valves au sevrage.</li></ul>
<h4>Avant de sortir de CEC</h4>
<p>Température, rythme, ventilation, ionogramme, inotropes prêts&nbsp;: une liste dite à voix haute.</p>`
        }
    ];

    // Le trajet du sang, dans l'ordre
    const TOUR = [
        { id: 'veineuse', step: "Le sang quitte l'oreillette droite et descend vers la machine." },
        { id: 'reservoir', step: 'Il arrive dans le réservoir, qui le filtre et le débulle.' },
        { id: 'pompe', step: 'La pompe artérielle le met en mouvement.' },
        { id: 'oxy', step: "Il traverse l'oxygénateur : oxygène, CO₂ et température." },
        { id: 'filtre', step: 'Le filtre retient les dernières bulles.' },
        { id: 'champ', step: 'Il revient au patient par la canule aortique.' }
    ];

    const QUIZ = [
        { q: 'Où règle-t-on la PaCO₂ du patient ?', a: 'gaz', ok: 'Oui : par le débit de balayage du mélangeur.', near: { oxy: "Presque : le CO₂ s'élimine bien ici, mais le réglage se fait ailleurs." } },
        { q: 'Quel élément ne doit jamais se vider ?', a: 'reservoir', ok: "Oui : vide, il enverrait de l'air dans la pompe puis dans l'aorte." },
        { q: "Quel appareil a été la source d'infections à Mycobacterium chimaera ?", a: 'thermo', ok: "Oui : par l'aérosol de son circuit d'eau." },
        { q: 'Où lit-on la température qui reflète celle du cerveau ?', a: 'oxy', ok: "Oui : à la sortie artérielle de l'oxygénateur, à garder sous 37 °C." },
        { q: 'Qu’est-ce qui fixe le débit de perfusion ?', a: 'pompe', ok: 'Oui : la pompe artérielle, réglée selon la surface corporelle du patient.', near: { cockpit: "Presque : on la commande d'ici, mais quel élément fait le débit ?" } },
        { q: 'En microplégie, où ajoute-t-on le potassium ?', a: 'cardio', ok: 'Oui : au pousse-seringue, sur la ligne de cardioplégie.', near: { aspi: "Pas loin : c'est une autre des pompes du plateau." } },
        { q: 'Où suit-on la SvO₂ en continu ?', a: 'moniteur', ok: 'Oui : sur le moniteur patient, grâce au capteur en ligne.', near: { cockpit: "Presque : c'est l'autre écran." } },
        { q: 'Le courant est coupé. Où est le relais ?', a: 'secours', ok: 'Oui : la batterie, puis la manivelle si tout s\'arrête.' }
    ];

    window.SALLE = { VIEWS, HOTSPOTS, TOUR, QUIZ };
})();
