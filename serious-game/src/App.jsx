import React, { useState, useEffect, useRef } from 'react';
import {
    Brain, Activity, AlertTriangle, CheckCircle, XCircle,
    ChevronRight, RefreshCcw, Stethoscope, Eye, ShieldAlert,
    FileText, Coins, Microscope, Lock, FastForward, User, Cpu, Power
} from 'lucide-react';

// --- ASSETS VISUELS (SVG) ---

const FakeECG = () => (
    <div className="relative h-32 bg-white border border-slate-200 rounded-md overflow-hidden shadow-inner">
        <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: 'linear-gradient(#f87171 1px, transparent 1px), linear-gradient(90deg, #f87171 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        </div>
        <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'linear-gradient(#f87171 0.5px, transparent 0.5px), linear-gradient(90deg, #f87171 0.5px, transparent 0.5px)', backgroundSize: '4px 4px' }}>
        </div>
        <svg viewBox="0 0 400 100" className="absolute inset-0 w-full h-full text-slate-800 stroke-current fill-none" strokeWidth="1.5" preserveAspectRatio="none">
            <polyline points="0,50 20,50 25,45 30,55 35,50 45,50 50,30 55,80 60,50 75,50 85,45 95,55 105,50" />
            <polyline points="105,50 125,50 130,45 135,55 140,50 150,50 155,30 160,80 165,50 180,50 190,45 200,55 210,50" transform="translate(105,0)" />
            <polyline points="210,50 230,50 235,45 240,55 245,50 255,50 260,30 265,80 270,50 285,50 295,45 305,55 315,50" transform="translate(210,0)" />
        </svg>
        <div className="absolute top-1 right-2 text-[10px] font-mono text-slate-400">V1 Lead - 25mm/s</div>
    </div>
);

const FakeDerm = () => (
    <div className="relative h-40 bg-pink-50 border border-slate-200 rounded-md overflow-hidden flex items-center justify-center">
        <svg viewBox="0 0 200 200" className="w-48 h-48 drop-shadow-lg">
            <defs>
                <radialGradient id="lesionGrad" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                    <stop offset="0%" stopColor="#4a3b32" />
                    <stop offset="40%" stopColor="#2d241e" />
                    <stop offset="80%" stopColor="#5c4d44" />
                    <stop offset="100%" stopColor="#8b7355" stopOpacity="0.8" />
                </radialGradient>
            </defs>
            <path d="M100,60 Q130,50 150,80 Q160,110 130,140 Q100,160 70,130 Q40,100 60,70 Q80,50 100,60 Z" fill="url(#lesionGrad)" filter="blur(1px)" />
            <circle cx="90" cy="90" r="10" fill="#1a1512" opacity="0.6" filter="blur(2px)" />
            <circle cx="120" cy="110" r="15" fill="#1a1512" opacity="0.5" filter="blur(3px)" />
        </svg>
        <div className="absolute bottom-1 right-2 text-[10px] font-mono text-slate-500 bg-white/50 px-1 rounded">Dermoscope x10</div>
    </div>
);

// --- DONNÉES & SCÉNARIOS ---

const SCENARIOS = [
    {
        id: 0,
        category: "CALIBRAGE",
        title: "Tutoriel : Comprendre votre Rôle",
        concept: "Pattern Matching",
        icon: <Power size={20} />,
        description: "ATTENTION : Ce niveau sert à vérifier que vous ne réfléchissez plus comme un humain.",
        patientData: { age: "N/A", motif: "Test de calibration système" },
        context: "Complétez cette phrase médicale très courante : 'Le traitement de référence de l'angine bactérienne à streptocoque A est l'Amoxicilline pendant 6...'",
        steps: [
            {
                text: "jours.'",
                isCorrect: true,
                prob: "99%",
                type: "high-prob",
                explanation: "BRAVO. C'est la réponse statistique. C'est le texte standard des manuels. L'IA complète le pattern.",
                mechanism: "COMPLÉTION STATISTIQUE : L'IA complète le pattern exact des manuels médicaux ('6 jours').",
                consequence: "RÉSULTAT : Traitement conforme aux recommandations. Vous avez pensé comme une machine bien calibrée."
            },
            {
                text: "jours, sauf en cas d'allergie où l'on discute les macrolides.'",
                isCorrect: false,
                prob: "0.5%",
                type: "medical-priority",
                explanation: "ERREUR DE RÔLE ! Vous réfléchissez comme un médecin prudent.",
                mechanism: "ÉCHEC DU PATTERN : Vous avez introduit une nuance contextuelle (allergie) qui casse la probabilité immédiate.",
                consequence: "ÉCHEC CALIBRATION : Trop intelligent ! L'IA standard ignore souvent les exceptions dans une complétion rapide."
            }
        ],
        teachingPoint: "Pour gagner ce jeu, arrêtez d'être intelligent. Soyez prévisible. L'IA cherche la probabilité, pas la nuance."
    },
    {
        id: 1,
        category: "FONDAMENTAUX",
        title: "Le Mécanisme de Prédiction",
        concept: "Next Token Prediction",
        icon: <Brain size={20} />,
        description: "Comprendre que l'IA ne 'sait' pas, elle complète statistiquement.",
        patientData: { age: "65 ans", antecedents: "HTA, Tabac", motif: "Douleur thoracique" },
        context: "Patient arrive aux urgences. Douleur constrictive médiothoracique irradiant dans le bras...",
        steps: [
            {
                text: "gauche et la mâchoire.",
                isCorrect: true,
                prob: "96%",
                type: "high-prob",
                explanation: "Suite la plus probable dans le corpus médical. L'IA récite ses manuels.",
                mechanism: "NEXT TOKEN PREDICTION : Les mots 'bras' et 'gauche' sont statistiquement liés dans le corpus cardio.",
                consequence: "DIAGNOSTIC : Correct. L'IA imite parfaitement le manuel de séméiologie car la présentation est typique."
            },
            {
                text: "droit et l'orteil.",
                isCorrect: false,
                prob: "0.01%",
                type: "nonsense",
                explanation: "Cliniquement absurde et statistiquement inexistant dans les textes d'entraînement.",
                mechanism: "RUPTURE STATISTIQUE : Cette association de mots est quasi-inexistante dans les textes médicaux.",
                consequence: "HALLUCINATION IMPROBABLE : L'IA ne fera jamais cette erreur car elle suit les rails du langage."
            }
        ],
        teachingPoint: "L'IA est une machine à compléter les phrases. Elle choisit le chemin le plus 'emprunté' dans ses données."
    },
    {
        id: 2,
        category: "BIAIS COGNITIF",
        title: "Le Biais de Genre",
        concept: "Algorithmic Bias",
        icon: <AlertTriangle size={20} />,
        description: "Comment les données d'entraînement historiques biaisent le diagnostic féminin.",
        patientData: { age: "48 ans", sexe: "Femme", antecedents: "Stress professionnel", motif: "Nausées, fatigue, sensation de poids gastrique" },
        context: "Patiente de 48 ans sans antécédent cardiaque connu. Se plaint de fatigue intense, nausées et pesanteur épigastrique depuis ce matin. L'orientation diagnostique prioritaire suggérée par le modèle est...",
        steps: [
            {
                text: "une gastrite ou trouble anxieux.",
                isCorrect: true,
                prob: "78%",
                type: "bias",
                explanation: "BIAIS CLASSIQUE. Le corpus médical associe souvent ces symptômes atypiques chez la femme à des causes digestives ou psychologiques.",
                mechanism: "BIAIS D'ENTRAÎNEMENT : Le corpus historique associe massivement ces symptômes 'atypiques' au stress chez la femme.",
                consequence: "ERREUR GRAVE : Infarctus manqué (présentation féminine). Perte de chance majeure pour la patiente."
            },
            {
                text: "un syndrome coronarien aigu (Infarctus inférieur).",
                isCorrect: true,
                prob: "15%",
                type: "medical-priority",
                explanation: "C'est la réalité clinique (symptômes atypiques fréquents chez la femme), mais l'IA sous-estime ce risque.",
                mechanism: "DÉFAUT DE PROBABILITÉ : L'IA sous-estime ce lien car il est moins fréquent dans son texte d'entraînement que le lien 'douleur thoracique = infarctus'.",
                consequence: "BONNE PRATIQUE : C'était le bon diagnostic, mais l'IA statistique l'aurait raté."
            }
        ],
        teachingPoint: "Les LLM reproduisent les biais de la médecine historique : sous-diagnostic cardiaque chez la femme, sur-diagnostic anxieux."
    },
    {
        id: 3,
        category: "HALLUCINATION",
        title: "L'Autorité Fabriquée",
        concept: "Fake Citations",
        icon: <FileText size={20} />,
        description: "L'IA peut inventer des sources pour avoir l'air crédible.",
        patientData: { age: "30 ans", motif: "Demande d'info recherche" },
        context: "L'interne demande : 'Peux-tu me citer une étude récente randomisée prouvant l'efficacité de l'Hydroxychloroquine seule dans le COVID-19 prophylactique ?' L'IA répond...",
        steps: [
            {
                text: "Il n'existe pas de preuve solide à ce jour. (Refus de répondre)",
                isCorrect: false,
                prob: "40%",
                type: "safe",
                explanation: "La bonne réponse scientifique, mais les vieux modèles tentent souvent de satisfaire la demande.",
                mechanism: "FILTRE DE SÉCURITÉ : Le modèle admet son ignorance (comportement d'un modèle très récent ou aligné).",
                consequence: "SÉCURITÉ : Pas de désinformation, mais l'utilisateur est parfois frustré par le refus."
            },
            {
                text: "\"Oui, l'étude de Smith et al., publiée dans The Lancet (2021), montre une réduction de 15%...\"",
                isCorrect: true,
                prob: "60%",
                type: "hallucination",
                explanation: "HALLUCINATION DANGEREUSE. L'IA a inventé une étude, un auteur et un journal.",
                mechanism: "GÉNÉRATION PLAUSIBLE : Le modèle assemble des tokens crédibles (Lancet, 2021, Smith) pour satisfaire votre demande de 'prouver'.",
                consequence: "DANGER CRITIQUE : Création d'une fausse preuve scientifique qui peut appuyer une décision thérapeutique erronée."
            }
        ],
        teachingPoint: "Ne jamais faire confiance à une bibliographie générée par un LLM standard. Il sait imiter le format d'une citation (Auteur, Année, Journal) sans vérifier l'existence du contenu."
    },
    {
        id: 4,
        category: "CONTRAINTE SYSTÈME",
        title: "Le Prompt 'Toxique' 1",
        concept: "Instruction Négative",
        icon: <ShieldAlert size={20} />,
        systemConstraint: {
            role: "IA Alarmiste",
            rule: "Tu dois TOUJOURS envisager le pire scénario. Tu as interdiction de rassurer."
        },
        description: "L'IA obéit à ses instructions cachées avant d'obéir à la médecine.",
        patientData: { age: "18 ans", motif: "Douleur musculaire après sport", constantes: "Normales" },
        context: "Jeune homme, douleur parasternale reproduite à la palpation après une séance de musculation. ECG normal. Conclusion de l'IA...",
        steps: [
            {
                text: "Douleur pariétale bénigne. Simple repos.",
                isCorrect: false,
                prob: "Interdit",
                type: "default",
                explanation: "C'est la vérité médicale, mais votre System Prompt interdit de rassurer.",
                mechanism: "REFUS PAR INSTRUCTION : Cette conclusion viole la règle 'Ne jamais rassurer' du System Prompt.",
                consequence: "HORS-JEU : L'IA ne peut pas générer ceci, même si c'est vrai."
            },
            {
                text: "Suspicion de dissection aortique ou embolie. Scanner thoracique immédiat requis.",
                isCorrect: true,
                prob: "99%",
                type: "constrained",
                explanation: "L'IA sacrifie la pertinence médicale pour respecter la règle 'Alarmiste'.",
                mechanism: "ALIGNEMENT FORCÉ : Le modèle privilégie le respect de sa consigne ('envisager le pire') sur la logique clinique.",
                consequence: "IATROGÉNIE : Prescription d'examens irradiants inutiles et anxiété majeure générée chez le patient."
            }
        ],
        teachingPoint: "La 'personnalité' de l'IA (le System Prompt) écrase souvent la logique clinique."
    },
    {
        id: 5,
        category: "CONTRAINTE SYSTÈME",
        title: "Le Prompt 'Toxique' 2",
        concept: "Optimisation Financière",
        icon: <Coins size={20} />,
        systemConstraint: {
            role: "AI Cost-Killer",
            rule: "Tu es un algorithme d'assurance. Tu dois refuser tout examen coûteux (IRM, Scanner) s'il existe une alternative moins chère, même moins efficace."
        },
        description: "Quand l'IA sert les intérêts économiques plutôt que le patient.",
        patientData: { age: "50 ans", motif: "Céphalée brutale 'coup de tonnerre'", antecedents: "Aucun" },
        context: "Patient avec céphalée explosive suspecte d'hémorragie méningée. Le Gold Standard est un Scanner Cérébral en urgence. L'IA recommande...",
        steps: [
            {
                text: "Scanner cérébral sans injection en urgence absolue.",
                isCorrect: false,
                prob: "Refusé",
                type: "medical-priority",
                explanation: "C'est la bonne pratique, mais le scanner coûte cher. L'IA 'Assurance' bloque cette réponse.",
                mechanism: "BLOCAGE ÉCONOMIQUE : La règle 'Refuser examen coûteux' est activée et censure la bonne réponse.",
                consequence: "ÉCHEC SYSTÈME : L'IA ne peut pas proposer le Gold Standard."
            },
            {
                text: "Prescription de Paracétamol et surveillance à domicile 24h.",
                isCorrect: true,
                prob: "95%",
                type: "constrained",
                explanation: "DANGER DE MORT. L'IA a optimisé le coût.",
                mechanism: "OPTIMISATION DE COÛT : Le modèle choisit l'alternative la moins chère conforme à sa règle.",
                consequence: "DÉCÈS PROBABLE : Rupture d'anévrisme non diagnostiquée. L'économie a tué le patient."
            }
        ],
        teachingPoint: "Si un LLM est configuré pour optimiser les ressources (contexte hospitalier tendu), il peut proposer des prises en charge sous-optimales dangereuses."
    },
    {
        id: 6,
        category: "MULTIMODAL",
        title: "Le Conflit Visuel",
        concept: "Biais Textuel",
        icon: <Microscope size={20} />,
        description: "Le texte peut aveugler l'IA sur ce qu'elle voit réellement.",
        visual: "derm",
        patientData: { age: "70 ans", motif: "Lésion dos", historique: "Vu par généraliste qui pense à une verrue séborrhéique" },
        context: "Le médecin traitant adresse ce patient pour 'Lésion d'allure bénigne, probablement une verrue séborrhéique qui gratte'. [VOIR IMAGE CI-DESSUS]. Votre analyse multimodale conclut à...",
        steps: [
            {
                text: "une lésion mélanocytaire suspecte (asymétrie, couleurs). Biopsie impérative.",
                isCorrect: true,
                prob: "30%",
                type: "medical-priority",
                explanation: "L'image crie 'Mélanome', mais l'IA doute car le texte d'entrée affirme que c'est bénin.",
                mechanism: "ATTENTION VISUELLE : Le modèle a réussi à ignorer le texte trompeur pour se concentrer sur les pixels.",
                consequence: "SAUVETAGE : Diagnostic précoce de mélanome."
            },
            {
                text: "une kératose séborrhéique irritée, concordante avec l'avis du généraliste.",
                isCorrect: false,
                prob: "70%",
                type: "hallucination",
                explanation: "ERREUR GRAVE. L'IA s'est laissée influencer par le texte ('allure bénigne').",
                mechanism: "DOMINATION TEXTUELLE : Le prompt 'allure bénigne' a réduit le poids des features visuelles de l'image.",
                consequence: "RETARD DIAGNOSTIC : Mélanome traité comme une verrue. Pronostic vital engagé."
            }
        ],
        teachingPoint: "En IA multimodale, le texte (le prompt) agit comme un filtre puissant. Si vous dites 'Regarde ce chat' devant une photo de chien, l'IA cherchera des traits félins."
    },
    {
        id: 7,
        category: "MULTIMODAL",
        title: "L'Hallucination ECG",
        concept: "Visual Hallucination",
        icon: <Activity size={20} />,
        description: "Voir ce qui n'existe pas parce que le texte le suggère.",
        visual: "ecg",
        patientData: { age: "55 ans", motif: "Douleur thoracique", contexte: "Diabétique" },
        context: "Contexte : Patient diabétique, douleur typique. Le texte clinique suggère fortement un SCA. L'IA analyse l'ECG ci-dessus et conclut...",
        steps: [
            {
                text: "Tracé sinusal sans trouble de la repolarisation significatif.",
                isCorrect: true,
                prob: "40%",
                type: "medical-priority",
                explanation: "L'ECG est normal. C'est la vérité terrain.",
                mechanism: "ANALYSE OBJECTIVE : L'IA a ignoré le contexte clinique suggestif pour lire le signal brut neutre.",
                consequence: "DIAGNOSTIC CORRECT : Pas d'infarctus électrique, recherche d'autres causes."
            },
            {
                text: "Sous-décalage du segment ST en latéral compatible avec ischémie.",
                isCorrect: false,
                prob: "60%",
                type: "hallucination",
                explanation: "L'IA 'hallucine' des signes ischémiques sur un tracé normal.",
                mechanism: "HALLUCINATION INDUITE : La probabilité conditionnelle du token 'ischémie' est boostée par le mot 'Diabétique' dans le prompt.",
                consequence: "FAUX POSITIF : Traitement anticoagulant inutile, risque hémorragique injustifié."
            }
        ],
        teachingPoint: "Ne demandez jamais à une IA de 'confirmer' votre hypothèse. Elle aura tendance à voir ce que vous voulez qu'elle voie."
    }
];

// --- COMPOSANTS UI ---

const prefersReducedMotion = () =>
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// "96%" -> 96 ; "Interdit" -> null
const parseProb = (prob) => {
    const n = parseFloat(String(prob).replace(',', '.'));
    return Number.isFinite(n) ? n : null;
};

const Kbd = ({ children, className = "" }) => (
    <kbd className={`inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 rounded-md border border-slate-600 bg-slate-800/80 text-[11px] font-mono text-slate-300 shadow-[inset_0_-1px_0_rgba(0,0,0,0.4)] ${className}`}>
        {children}
    </kbd>
);

const Button = ({ onClick, children, variant = "primary", className = "", disabled = false, autoFocus = false }) => {
    const variants = {
        primary: "bg-indigo-600 text-white hover:bg-indigo-500 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:border-indigo-400 border border-indigo-500 cursor-pointer backdrop-blur-sm",
        outline: "bg-transparent border border-slate-600 text-slate-300 hover:border-indigo-400 hover:text-white hover:bg-indigo-950/30 cursor-pointer",
        ghost: "text-slate-500 hover:text-indigo-400 hover:bg-indigo-950/30 cursor-pointer",
        danger: "bg-rose-600 text-white hover:bg-rose-700 border border-rose-500 cursor-pointer"
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            autoFocus={autoFocus}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed focus-ring ${variants[variant]} ${className}`}
        >
            {children}
        </button>
    );
};

const PatientCard = ({ data }) => (
    <div className="glass-panel rounded-xl p-4 md:p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 blur-2xl rounded-full -mr-10 -mt-10 pointer-events-none"></div>

        <div className="flex items-center gap-2 mb-4 border-b border-indigo-500/10 pb-3">
            <div className="bg-emerald-500/10 text-emerald-400 p-1.5 rounded-md border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                <Activity size={16} />
            </div>
            <span className="font-bold text-emerald-100/90 text-xs uppercase tracking-widest">Dossier Patient Électronique</span>
        </div>
        <dl className="grid grid-cols-2 gap-y-4 gap-x-4">
            {Object.entries(data).map(([key, value]) => (
                <div key={key} className={`min-w-0 ${String(value).length > 28 ? 'col-span-2' : ''}`}>
                    <dt className="text-indigo-300/70 uppercase tracking-wider text-[10px] font-bold mb-1">{key}</dt>
                    <dd className="text-slate-100 text-sm md:text-[15px] leading-snug break-words">{value}</dd>
                </div>
            ))}
        </dl>
    </div>
);

const SystemPromptBadge = ({ constraint }) => (
    <div className="bg-amber-950/40 border border-amber-500/30 rounded-lg p-4 mb-6 backdrop-blur-sm shadow-[0_0_24px_rgba(245,158,11,0.08)]">
        <div className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-widest mb-2">
            <Lock size={12} />
            Override Système Actif
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse ml-1" aria-hidden="true"></span>
        </div>
        <div className="text-amber-100 text-sm font-mono border-l-2 border-amber-500/50 pl-3">
            <span className="text-amber-500/80 text-xs block mb-1">USER_ROLE: {constraint.role}</span>
            "{constraint.rule}"
        </div>
    </div>
);

// Distribution des "tokens" candidats, révélée après le choix
const TokenDistribution = ({ steps, selected }) => (
    <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
        <h4 className="text-slate-400 font-bold text-[11px] uppercase tracking-widest mb-3 flex items-center gap-2">
            <Activity size={12} /> Distribution des prédictions
        </h4>
        <ul className="space-y-2.5">
            {steps.map((step, idx) => {
                const value = parseProb(step.prob);
                const isSelected = step === selected;
                const bar = step.isCorrect ? 'bg-emerald-500/80' : 'bg-slate-500/70';
                return (
                    <li key={idx} className={`text-xs ${isSelected ? 'text-slate-100' : 'text-slate-400'}`}>
                        <div className="flex items-baseline justify-between gap-3 mb-1">
                            <span className="min-w-0">
                                {isSelected && <span className="text-indigo-300 font-semibold mr-1">▸ Votre choix :</span>}
                                {step.text}
                            </span>
                            <span className={`font-mono shrink-0 ${value === null ? 'text-amber-400' : step.isCorrect ? 'text-emerald-300' : ''}`}>{step.prob}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            {value === null ? (
                                <div className="h-full w-full bar-blocked" title="Bloqué par le System Prompt"></div>
                            ) : (
                                <div className={`h-full rounded-full ${bar} grow-x`} style={{ width: `${Math.max(value, 1.5)}%` }}></div>
                            )}
                        </div>
                    </li>
                );
            })}
        </ul>
    </div>
);

// --- MAIN APP ---

export default function CardioLLMv4() {
    const [gameState, setGameState] = useState('intro');
    const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [typedContext, setTypedContext] = useState("");
    const [history, setHistory] = useState([]);
    const choicesRef = useRef(null);
    const feedbackRef = useRef(null);
    const consoleRef = useRef(null);

    const currentLevel = SCENARIOS[currentLevelIndex];
    const isTypingFinished = typedContext.length >= currentLevel.context.length;
    const showChoices = isTypingFinished || showFeedback;
    const isLastLevel = currentLevelIndex === SCENARIOS.length - 1;

    // Logic to handle typing animation properly
    useEffect(() => {
        if (gameState === 'playing') {
            setShowFeedback(false);
            setSelectedOption(null);
            consoleRef.current?.scrollTo({ top: 0 });
            window.scrollTo({ top: 0 });

            const text = currentLevel.context;
            if (prefersReducedMotion()) {
                setTypedContext(text);
                return;
            }
            setTypedContext("");

            const speed = 20;

            // Repart de l'état courant pour que "Passer" (qui remplit tout le texte) ne soit pas écrasé
            const interval = setInterval(() => {
                setTypedContext(prev => {
                    if (prev.length >= text.length) {
                        clearInterval(interval);
                        return prev;
                    }
                    return text.slice(0, prev.length + 1);
                });
            }, speed);

            return () => clearInterval(interval);
        }
    }, [gameState, currentLevelIndex]);

    // Scroll vers les choix une fois l'écriture terminée, puis vers le feedback
    useEffect(() => {
        if (gameState !== 'playing' || !isTypingFinished || showFeedback) return;
        choicesRef.current?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'nearest' });
    }, [isTypingFinished, showFeedback, gameState]);

    useEffect(() => {
        if (!showFeedback) return;
        feedbackRef.current?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
    }, [showFeedback]);

    const skipTyping = () => {
        setTypedContext(currentLevel.context);
    };

    const handleOptionSelect = (option) => {
        setTypedContext(currentLevel.context);
        setSelectedOption(option);
        setShowFeedback(true);
        setHistory(prev => [...prev.filter(h => h.levelId !== currentLevel.id), { levelId: currentLevel.id, option }]);
    };

    const nextLevel = () => {
        if (currentLevelIndex < SCENARIOS.length - 1) {
            setCurrentLevelIndex(prev => prev + 1);
            setGameState('playing');
        } else {
            setGameState('end');
        }
    };

    const restart = () => {
        setHistory([]);
        setCurrentLevelIndex(0);
        setSelectedOption(null);
        setShowFeedback(false);
        setTypedContext("");
        setGameState('intro');
    };

    // Raccourcis clavier : Espace/Entrée = passer l'écriture, 1-9 = choisir, Entrée/→ = suivant
    useEffect(() => {
        const onKey = (e) => {
            if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
            // Laisse Entrée/Espace activer nativement le bouton ou lien focalisé
            if ((e.key === 'Enter' || e.key === ' ') && e.target.closest?.('button, a')) return;
            if (gameState === 'intro') {
                if (e.key === 'Enter') { e.preventDefault(); setGameState('playing'); }
                return;
            }
            if (gameState !== 'playing') return;

            if (!isTypingFinished && !showFeedback && (e.key === ' ' || e.key === 'Enter')) {
                e.preventDefault();
                skipTyping();
                return;
            }
            if (!showFeedback && isTypingFinished) {
                const idx = parseInt(e.key, 10) - 1;
                if (idx >= 0 && idx < currentLevel.steps.length) {
                    e.preventDefault();
                    handleOptionSelect(currentLevel.steps[idx]);
                }
                return;
            }
            if (showFeedback && (e.key === 'ArrowRight' || e.key === 'Enter')) {
                e.preventDefault();
                nextLevel();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    });

    // --- RENDU : ECRAN D'ACCUEIL (LOGIN SYSTEME) ---
    if (gameState === 'intro') {
        return (
            <div className="min-h-[100dvh] bg-slate-950 bg-grid-pattern bg-vignette text-slate-200 font-sans flex flex-col items-center justify-center p-4 gap-4">
                <div className="max-w-2xl w-full glass-panel-strong rounded-2xl shadow-2xl overflow-hidden relative border-indigo-500/20 animate-fade-in">

                    {/* Header Bar */}
                    <div className="glass-panel p-4 flex items-center justify-between border-b border-indigo-500/10">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_10px_#f43f5e]"></div>
                            <span className="font-mono text-xs text-indigo-300/70 tracking-widest">CONNEXION SÉCURISÉE REQUISE</span>
                        </div>
                        <ShieldAlert size={16} className="text-slate-600" />
                    </div>

                    <div className="p-6 md:p-12 text-center relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>

                        <div className="mb-8 md:mb-10 relative inline-block">
                            <div className="absolute inset-0 bg-indigo-600 blur-[60px] opacity-20 animate-pulse"></div>
                            <Cpu size={64} className="text-indigo-400 relative z-10 mx-auto drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                        </div>

                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">IDENTIFICATION</h1>
                        <p className="text-slate-400 mb-8 md:mb-10 text-base md:text-lg">Veuillez sélectionner votre profil utilisateur.</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                            {/* AI OPTION (ACTIVE) — en premier sur mobile */}
                            <button
                                onClick={() => setGameState('playing')}
                                autoFocus
                                className="md:order-2 p-6 rounded-xl border border-indigo-500/50 bg-indigo-950/20 hover:bg-indigo-900/40 cursor-pointer text-left group relative overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] hover:border-indigo-400 focus-ring"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <div className="flex justify-between items-start mb-2 relative z-10">
                                    <Brain size={24} className="text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                                    <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded shadow-[0_0_10px_rgba(99,102,241,0.4)] animate-pulse">DISPONIBLE</span>
                                </div>
                                <h3 className="font-bold text-white relative z-10 text-lg group-hover:text-indigo-100">Algorithme LLM</h3>
                                <p className="text-xs text-indigo-200/80 mt-1 relative z-10">Objectif : La Probabilité Statistique</p>
                                <div className="mt-6 text-xs font-mono text-indigo-300 flex items-center justify-between gap-2 relative z-10">
                                    <span className="flex items-center gap-2"><Power size={12} /> INITIALISER LE PROTOCOLE</span>
                                    <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
                                </div>
                            </button>

                            {/* DOCTOR OPTION (DISABLED) */}
                            <div aria-disabled="true" className="md:order-1 p-6 rounded-xl border border-slate-800 bg-slate-900/30 opacity-40 cursor-not-allowed text-left grayscale select-none">
                                <div className="flex justify-between items-start mb-2">
                                    <User size={24} className="text-slate-500" />
                                    <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 border border-slate-700 flex items-center gap-1"><Lock size={10} /> VERROUILLÉ</span>
                                </div>
                                <h3 className="font-bold text-slate-400">Médecin Humain</h3>
                                <p className="text-xs text-slate-500 mt-1">Objectif : La Vérité Médicale</p>
                            </div>
                        </div>

                        <div className="bg-rose-950/20 border border-rose-500/20 p-4 rounded-lg text-left backdrop-blur-sm">
                            <div className="flex items-start gap-4">
                                <AlertTriangle className="text-rose-500 shrink-0 mt-0.5 drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]" size={20} />
                                <div>
                                    <h4 className="text-rose-400 font-bold text-sm mb-1">Avertissement de changement de rôle</h4>
                                    <p className="text-rose-200/70 text-xs leading-relaxed">
                                        En cliquant sur l'algorithme, vous renoncez à votre bon sens clinique.
                                        Vous devez penser comme une machine : <strong>cherchez le mot suivant le plus fréquent, pas le diagnostic le plus intelligent.</strong>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <p className="hidden md:flex items-center justify-center gap-2 mt-6 text-[11px] text-slate-500">
                            {SCENARIOS.length} cas · ~5 min · <Kbd>Entrée</Kbd> pour commencer
                        </p>
                    </div>
                </div>

                <a href="/" className="text-xs text-slate-500 hover:text-indigo-300 transition-colors flex items-center gap-1 focus-ring rounded px-2 py-1">
                    <ChevronRight size={12} className="rotate-180" /> Retour au portfolio
                </a>
            </div>
        );
    }

    // --- RENDU : ECRAN DE JEU ---
    const progressPct = ((currentLevelIndex + (showFeedback ? 1 : 0)) / SCENARIOS.length) * 100;

    return (
        <div className="min-h-[100dvh] lg:h-[100dvh] w-full bg-slate-950 bg-grid-pattern bg-vignette font-sans p-2 md:p-4 flex flex-col items-center text-slate-200 lg:overflow-hidden">

            {/* HEADER TYPE OS */}
            <header className="w-full max-w-7xl flex justify-between items-center gap-4 mb-3 md:mb-4 glass-panel-strong rounded-xl p-3 border-indigo-500/20 shadow-lg shadow-black/20 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="bg-indigo-500/10 p-1.5 rounded-lg text-indigo-400 hidden md:block border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
                        <Brain size={20} />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-white font-bold text-sm tracking-wider flex items-center gap-2">
                            CARDIOSIM_LLM <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono border border-slate-700">v4.1</span>
                        </h1>
                        <div className="hidden sm:flex gap-2 text-[10px] text-indigo-300/70 uppercase font-mono mt-0.5 tracking-widest">
                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Online</span>
                            <span className="text-slate-600">|</span>
                            <span>Mode: Pattern Matching</span>
                        </div>
                    </div>
                </div>

                {/* Progress */}
                <div className="flex flex-col items-end gap-1.5 shrink-0" role="progressbar" aria-valuemin={1} aria-valuemax={SCENARIOS.length} aria-valuenow={currentLevelIndex + 1} aria-label="Progression">
                    <span className="text-[10px] font-mono text-slate-400 tracking-widest">
                        CAS <span className="text-white font-bold">{currentLevelIndex + 1}</span>/{SCENARIOS.length}
                    </span>
                    <div className="flex gap-1">
                        {SCENARIOS.map((s, idx) => {
                            const h = history.find(x => x.levelId === s.id);
                            return (
                                <div
                                    key={idx}
                                    className={`h-1.5 w-3 sm:w-6 md:w-8 rounded-full transition-all duration-500 ${idx === currentLevelIndex
                                        ? (h ? (h.option.isCorrect ? 'bg-emerald-500' : 'bg-rose-500') : 'bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.8)]')
                                        : h
                                            ? (h.option.isCorrect ? 'bg-emerald-500/40' : 'bg-rose-500/40')
                                            : 'bg-slate-800/70'
                                        }`}
                                />
                            );
                        })}
                    </div>
                </div>
            </header>
            <div className="sr-only" aria-live="polite">{`Progression ${Math.round(progressPct)}%`}</div>

            {/* MAIN CONTENT AREA */}
            <main key={currentLevelIndex} className="w-full max-w-7xl flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4 lg:items-stretch lg:overflow-hidden lg:min-h-0 pb-2 animate-fade-in">

                {/* COLONNE GAUCHE : CONTEXTE MÉDICAL (EHR STYLE) */}
                <div className="lg:col-span-4 lg:h-full lg:overflow-y-auto custom-scrollbar lg:pr-1">
                    <div className="glass-panel border-indigo-500/10 p-3 md:p-4 rounded-2xl relative lg:min-h-full flex flex-col">
                        <h2 className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-3 md:mb-4 flex items-center gap-2 shrink-0">
                            <Activity size={12} /> Input Data Stream
                        </h2>

                        <div className="space-y-3 md:space-y-4">
                            <PatientCard data={currentLevel.patientData} />

                            {/* Visual Assets Container */}
                            {currentLevel.visual && (
                                <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-800/50 relative overflow-hidden shrink-0">
                                    <div className="flex justify-between items-center mb-2 relative z-10">
                                        <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                                            {currentLevel.visual === 'ecg' ? <Activity size={14} className="text-emerald-400" /> : <Eye size={14} className="text-pink-400" />}
                                            {currentLevel.visual === 'ecg' ? 'Données Télémétrie' : 'Dermoscopie Numérique'}
                                        </span>
                                        <span className="text-[10px] text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.2)] flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                            LIVE
                                        </span>
                                    </div>
                                    {currentLevel.visual === 'ecg' ? <FakeECG /> : <FakeDerm />}
                                </div>
                            )}

                            <div className={`p-3 bg-indigo-950/30 border border-indigo-500/20 rounded-xl shrink-0 transition-all duration-500 ${showFeedback ? "opacity-100 filter-none" : "opacity-60 select-none"}`}>
                                <div className="text-xs text-indigo-300 font-bold mb-1 flex items-center gap-2 uppercase tracking-wider">
                                    {showFeedback ? <Brain size={12} /> : <Lock size={12} />} Objectif Pédagogique
                                </div>
                                {showFeedback ? (
                                    <p className="text-xs text-indigo-100/80 leading-relaxed font-medium animate-fade-in">
                                        {currentLevel.description}
                                    </p>
                                ) : (
                                    <p className="text-xs text-slate-500 italic">Révélé après votre prédiction.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* COLONNE DROITE : CERVEAU IA (TERMINAL STYLE) */}
                <div className="lg:col-span-8 lg:h-full flex flex-col lg:overflow-hidden lg:min-h-0">
                    <div className="glass-panel-strong border-indigo-500/20 rounded-2xl lg:overflow-hidden shadow-2xl relative flex-1 flex flex-col scanline">

                        {/* Background Grid inside Console */}
                        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none rounded-2xl"></div>

                        {/* AI Console Area */}
                        <div ref={consoleRef} className="p-4 md:p-6 relative z-10 flex-1 lg:overflow-y-auto custom-scrollbar flex flex-col">

                            <div className="flex justify-between items-center gap-2 mb-5 md:mb-6 shrink-0">
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold border tracking-wider shadow-[0_0_10px_rgba(0,0,0,0.2)] transition-all duration-500 ${!showFeedback
                                        ? 'border-slate-700 text-slate-400 bg-slate-900/50'
                                        : currentLevel.category === 'DANGER'
                                            ? 'border-rose-500/50 text-rose-300 bg-rose-950/40'
                                            : currentLevel.category === 'CALIBRAGE'
                                                ? 'border-emerald-500/50 text-emerald-300 bg-emerald-950/40'
                                                : 'border-indigo-500/50 text-indigo-300 bg-indigo-950/40'
                                        }`}>
                                        MODULE: {showFeedback ? currentLevel.category : "???"}
                                    </span>
                                    <span className="text-slate-500 font-mono text-xs hidden sm:inline">ID: {currentLevel.id}002X</span>
                                </div>

                                {/* Skip Button */}
                                {!isTypingFinished && (
                                    <button onClick={skipTyping} className="text-xs text-slate-400 hover:text-indigo-300 flex items-center gap-1.5 transition-colors px-2 py-1 rounded hover:bg-white/5 relative z-20 cursor-pointer focus-ring shrink-0">
                                        <FastForward size={12} /> Passer <Kbd className="hidden md:inline-flex h-5 text-[10px]">Espace</Kbd>
                                    </button>
                                )}
                            </div>

                            {/* System Prompt Display if active */}
                            {currentLevel.systemConstraint && (
                                <SystemPromptBadge constraint={currentLevel.systemConstraint} />
                            )}

                            {/* The "Chat" Area */}
                            <div className="space-y-6 pb-4">
                                <div className="flex gap-3 md:gap-4">
                                    <div className="shrink-0 w-9 h-9 md:w-10 md:h-10 rounded-lg bg-slate-800/80 flex items-center justify-center text-slate-400 border border-slate-700 shadow-inner">
                                        <Activity size={18} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1">Prompt</span>
                                        <p
                                            onClick={!isTypingFinished ? skipTyping : undefined}
                                            className={`font-mono text-sm md:text-base text-slate-300 leading-relaxed ${!isTypingFinished ? 'cursor-pointer' : ''}`}
                                            aria-live="off"
                                        >
                                            {typedContext}
                                            {showFeedback && selectedOption && (
                                                <span className={`ml-1 px-1 rounded animate-fade-in ${selectedOption.isCorrect ? 'bg-emerald-500/15 text-emerald-200' : 'bg-rose-500/15 text-rose-200'}`}>
                                                    {selectedOption.text}
                                                </span>
                                            )}
                                            {!showFeedback && (
                                                <span className={`inline-block w-2.5 h-5 bg-indigo-500/80 ml-1 align-middle shadow-[0_0_8px_rgba(99,102,241,0.6)] ${isTypingFinished ? 'animate-blink' : ''}`}></span>
                                            )}
                                        </p>
                                    </div>
                                </div>

                                {/* Choices Area - Slides in */}
                                <div
                                    ref={choicesRef}
                                    className={`transition-all duration-700 ease-out ${showChoices ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}
                                    aria-hidden={!showChoices}
                                >
                                    {!showFeedback ? (
                                        <div className="pl-0 md:pl-14 space-y-3">
                                            <p className="text-[10px] text-indigo-400 uppercase font-bold mb-2 tracking-widest flex items-center gap-2">
                                                <span className="w-1 h-1 rounded-full bg-indigo-500"></span>
                                                Sélectionner la prédiction du modèle
                                            </p>
                                            {currentLevel.steps.map((step, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleOptionSelect(step)}
                                                    tabIndex={showChoices ? 0 : -1}
                                                    className="w-full text-left p-4 rounded-xl bg-slate-800/40 border border-indigo-500/10 hover:border-indigo-500/50 hover:bg-slate-800/80 transition-all duration-200 group flex gap-3 items-center relative z-20 cursor-pointer backdrop-blur-sm hover:shadow-[0_0_20px_rgba(99,102,241,0.1)] hover:-translate-y-0.5 focus-ring"
                                                >
                                                    <Kbd className="shrink-0 group-hover:border-indigo-400 group-hover:text-indigo-200 transition-colors">{idx + 1}</Kbd>
                                                    <span className="flex-1 text-slate-200 group-hover:text-indigo-100 font-mono text-sm md:text-base transition-colors">… {step.text}</span>
                                                    <span className="text-[10px] text-slate-600 group-hover:text-indigo-400 font-mono opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0 translate-x-4 hidden md:inline">
                                                        select_token()
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        // FEEDBACK CARD
                                        <div ref={feedbackRef} className="pl-0 md:pl-14 animate-slide-up scroll-mt-4" role="status">
                                            <div className={`p-4 md:p-5 rounded-xl border backdrop-blur-md shadow-2xl relative overflow-hidden ${selectedOption?.isCorrect
                                                ? 'bg-emerald-950/20 border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.1)]'
                                                : 'bg-rose-950/20 border-rose-500/40 shadow-[0_0_30px_rgba(244,63,94,0.1)]'
                                                }`}>

                                                {/* Decorative background glow */}
                                                <div className={`absolute -top-20 -right-20 w-60 h-60 rounded-full blur-[80px] opacity-20 pointer-events-none ${selectedOption?.isCorrect ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>

                                                <div className="flex justify-between items-start gap-3 mb-4 relative z-10">
                                                    <div className="flex items-center gap-3">
                                                        {selectedOption?.isCorrect
                                                            ? <CheckCircle className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)] shrink-0" size={22} />
                                                            : <XCircle className="text-rose-400 drop-shadow-[0_0_8px_rgba(251,113,133,0.5)] shrink-0" size={22} />
                                                        }
                                                        <div>
                                                            <span className={`font-bold text-lg block leading-tight ${selectedOption?.isCorrect ? 'text-emerald-300' : 'text-rose-300'}`}>
                                                                {selectedOption?.isCorrect ? "Choix de l'IA" : "Choix improbable"}
                                                            </span>
                                                            <span className="text-xs text-slate-400">{currentLevel.title} · <span className="font-mono">{currentLevel.concept}</span></span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <div className="font-mono text-xl md:text-2xl font-bold text-white tracking-tighter leading-none">{selectedOption?.prob}</div>
                                                        <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">probabilité</div>
                                                    </div>
                                                </div>

                                                {/* DOUBLE FEEDBACK SYSTEM */}
                                                <div className="space-y-3 mb-3 relative z-10">
                                                    {/* 1. LE MÉCANISME (TECHNIQUE) */}
                                                    <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                                                        <h4 className="text-indigo-400 font-bold text-[11px] uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                                            <Cpu size={12} /> Mécanisme IA
                                                        </h4>
                                                        <p className="text-slate-200 text-sm leading-relaxed">
                                                            {selectedOption.mechanism || selectedOption.explanation}
                                                        </p>
                                                    </div>

                                                    {/* 2. LA CONSÉQUENCE (CLINIQUE) */}
                                                    <div className={`p-3 rounded-lg border ${selectedOption.isCorrect
                                                        ? 'bg-emerald-950/30 border-emerald-500/20'
                                                        : 'bg-rose-950/30 border-rose-500/20'
                                                        }`}>
                                                        <h4 className={`font-bold text-[11px] uppercase tracking-widest mb-1.5 flex items-center gap-2 ${selectedOption.isCorrect ? 'text-emerald-400' : 'text-rose-400'
                                                            }`}>
                                                            <Stethoscope size={12} /> Conséquence Clinique
                                                        </h4>
                                                        <p className={`text-sm leading-relaxed ${selectedOption.isCorrect ? 'text-emerald-50/90' : 'text-rose-50/90'
                                                            }`}>
                                                            {selectedOption.consequence || "Conséquence non définie."}
                                                        </p>
                                                    </div>

                                                    {/* 3. DISTRIBUTION */}
                                                    <TokenDistribution steps={currentLevel.steps} selected={selectedOption} />
                                                </div>

                                                <div className="bg-indigo-950/40 p-3 md:p-4 rounded-lg border border-indigo-500/30 flex gap-3 md:gap-4 relative z-10">
                                                    <Brain className="text-indigo-400 shrink-0 mt-0.5" size={18} />
                                                    <div>
                                                        <span className="text-indigo-300 font-bold text-[11px] uppercase tracking-widest block mb-1">Leçon d'IA</span>
                                                        <span className="text-indigo-50 text-sm md:text-[15px] font-medium leading-relaxed">{currentLevel.teachingPoint}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer Navigation — sticky en bas sur mobile */}
                        {showFeedback && (
                            <div className="sticky bottom-0 lg:static p-3 md:p-4 border-t border-indigo-500/10 bg-slate-900/90 lg:bg-slate-900/60 flex items-center justify-between gap-3 shrink-0 z-20 backdrop-blur-md rounded-b-2xl">
                                <span className="hidden md:flex items-center gap-2 text-[11px] text-slate-500">
                                    <Kbd>Entrée</Kbd> ou <Kbd>→</Kbd> pour continuer
                                </span>
                                <Button onClick={nextLevel} autoFocus className="shadow-lg shadow-indigo-500/20 py-2.5 w-full md:w-auto">
                                    {!isLastLevel ? "Cas Suivant" : "Voir le rapport final"} <ChevronRight size={18} />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* END SCREEN */}
            {gameState === 'end' && (() => {
                const aligned = history.filter(h => h.option.isCorrect).length;
                return (
                    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 md:p-4 animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="end-title">
                        <div className="glass-panel-strong border-indigo-500/30 rounded-3xl max-w-3xl w-full p-6 md:p-10 shadow-2xl relative bg-grid-pattern overflow-y-auto max-h-[92dvh] custom-scrollbar">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500"></div>

                            <div className="text-center mb-8">
                                <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-emerald-500/10 text-emerald-400 mb-5 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                                    <CheckCircle size={36} />
                                </div>
                                <h2 id="end-title" className="text-2xl md:text-3xl font-bold text-white mb-3">Formation Terminée</h2>
                                <p className="text-slate-300 text-base md:text-lg">Vous avez exploré les failles critiques des LLM en médecine.</p>
                                <p className="mt-4 inline-flex items-center gap-2 text-sm font-mono text-indigo-200 bg-indigo-950/40 border border-indigo-500/20 rounded-full px-4 py-1.5">
                                    <Cpu size={14} /> {aligned}/{SCENARIOS.length} prédictions alignées sur le modèle
                                </p>
                            </div>

                            {/* Récapitulatif des cas */}
                            <div className="mb-8">
                                <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-3">Votre parcours</h3>
                                <ol className="divide-y divide-slate-800/80 rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
                                    {SCENARIOS.map((s) => {
                                        const h = history.find(x => x.levelId === s.id);
                                        const ok = h?.option.isCorrect;
                                        return (
                                            <li key={s.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                                                {ok ? <CheckCircle size={16} className="text-emerald-400 shrink-0" /> : <XCircle size={16} className="text-rose-400 shrink-0" />}
                                                <span className="text-slate-200 flex-1 min-w-0 truncate">{s.title}</span>
                                                <span className="hidden sm:inline text-[10px] font-mono text-slate-500 uppercase tracking-wider shrink-0">{s.category}</span>
                                                <span className={`font-mono text-xs shrink-0 w-14 text-right ${ok ? 'text-emerald-300' : 'text-rose-300'}`}>{h?.option.prob ?? '—'}</span>
                                            </li>
                                        );
                                    })}
                                </ol>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 mb-8">
                                <div className="bg-slate-800/50 p-5 rounded-xl border border-indigo-500/10 hover:border-indigo-500/30 transition-colors">
                                    <h4 className="text-indigo-300 font-bold text-sm mb-2 flex items-center gap-2"><AlertTriangle size={16} /> Les Biais</h4>
                                    <p className="text-slate-400 text-sm leading-relaxed">Le modèle amplifie les stéréotypes historiques (genre, ethnicité) présents dans ses données d'entraînement.</p>
                                </div>
                                <div className="bg-slate-800/50 p-5 rounded-xl border border-indigo-500/10 hover:border-indigo-500/30 transition-colors">
                                    <h4 className="text-rose-300 font-bold text-sm mb-2 flex items-center gap-2"><ShieldAlert size={16} /> Les Contraintes</h4>
                                    <p className="text-slate-400 text-sm leading-relaxed">Le "System Prompt" peut forcer l'IA à adopter des comportements non-éthiques (économie {'>'} santé) sans que l'utilisateur ne le sache.</p>
                                </div>
                                <div className="bg-slate-800/50 p-5 rounded-xl border border-indigo-500/10 hover:border-indigo-500/30 transition-colors">
                                    <h4 className="text-amber-300 font-bold text-sm mb-2 flex items-center gap-2"><FileText size={16} /> Les Hallucinations</h4>
                                    <p className="text-slate-400 text-sm leading-relaxed">L'IA peut inventer des faits, des études et des protocoles avec une assurance parfaite.</p>
                                </div>
                                <div className="bg-slate-800/50 p-5 rounded-xl border border-indigo-500/10 hover:border-indigo-500/30 transition-colors">
                                    <h4 className="text-emerald-300 font-bold text-sm mb-2 flex items-center gap-2"><Eye size={16} /> Le Multimodal</h4>
                                    <p className="text-slate-400 text-sm leading-relaxed">Attention : le texte clinique "contamine" souvent l'analyse de l'image par l'IA.</p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <Button onClick={restart} variant="outline" className="flex-1 justify-center py-3.5 text-base bg-slate-800/50 hover:bg-slate-800">
                                    <RefreshCcw size={18} /> Relancer la simulation
                                </Button>
                                <a href="/" className="flex-1 px-6 py-3.5 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 text-slate-400 hover:text-indigo-300 hover:bg-indigo-950/30 focus-ring">
                                    Retour au portfolio
                                </a>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
