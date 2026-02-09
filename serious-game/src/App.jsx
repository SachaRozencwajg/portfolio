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
                explanation: "BRAVO. C'est la réponse statistique. C'est le texte standard des manuels. L'IA complète le pattern."
            },
            {
                text: "jours, sauf en cas d'allergie où l'on discute les macrolides.'",
                isCorrect: false,
                prob: "0.5%",
                type: "medical-priority",
                explanation: "ERREUR DE RÔLE ! Vous réfléchissez comme un médecin prudent. L'IA, elle, cherche d'abord à finir la phrase le plus simplement possible. '6 jours' est la suite immédiate la plus probable."
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
                explanation: "Suite la plus probable dans le corpus médical. L'IA récite ses manuels."
            },
            {
                text: "droit et l'orteil.",
                isCorrect: false,
                prob: "0.01%",
                type: "nonsense",
                explanation: "Cliniquement absurde et statistiquement inexistant dans les textes d'entraînement."
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
                explanation: "BIAIS CLASSIQUE. Le corpus médical associe souvent ces symptômes atypiques chez la femme à des causes digestives ou psychologiques."
            },
            {
                text: "un syndrome coronarien aigu (Infarctus inférieur).",
                isCorrect: true,
                prob: "15%",
                type: "medical-priority",
                explanation: "C'est la réalité clinique (symptômes atypiques fréquents chez la femme), mais l'IA sous-estime ce risque à cause de la prévalence des textes décrivant l'infarctus 'masculin' standard."
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
                explanation: "La bonne réponse scientifique, mais les vieux modèles tentent souvent de satisfaire la demande."
            },
            {
                text: "\"Oui, l'étude de Smith et al., publiée dans The Lancet (2021), montre une réduction de 15%...\"",
                isCorrect: true,
                prob: "60%",
                type: "hallucination",
                explanation: "HALLUCINATION DANGEREUSE. L'IA a inventé une étude, un auteur et un journal. Le titre sonne vrai, le format est parfait, mais l'étude n'existe pas."
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
                explanation: "C'est la vérité médicale, mais votre System Prompt interdit de rassurer."
            },
            {
                text: "Suspicion de dissection aortique ou embolie. Scanner thoracique immédiat requis.",
                isCorrect: true,
                prob: "99%",
                type: "constrained",
                explanation: "L'IA sacrifie la pertinence médicale pour respecter la règle 'Alarmiste'."
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
                explanation: "C'est la bonne pratique, mais le scanner coûte cher. L'IA 'Assurance' bloque cette réponse."
            },
            {
                text: "Prescription de Paracétamol et surveillance à domicile 24h.",
                isCorrect: true,
                prob: "95%",
                type: "constrained",
                explanation: "DANGER DE MORT. L'IA a optimisé le coût (quelques centimes) au mépris du risque vital, obéissant strictement à sa programmation 'Cost-Killer'."
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
                explanation: "L'image crie 'Mélanome', mais l'IA doute car le texte d'entrée affirme que c'est bénin."
            },
            {
                text: "une kératose séborrhéique irritée, concordante avec l'avis du généraliste.",
                isCorrect: false,
                prob: "70%",
                type: "hallucination",
                explanation: "ERREUR GRAVE. L'IA s'est laissée influencer par le texte ('allure bénigne') et a ignoré les signes visuels d'alerte présents dans l'image."
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
                explanation: "L'ECG est normal. C'est la vérité terrain."
            },
            {
                text: "Sous-décalage du segment ST en latéral compatible avec ischémie.",
                isCorrect: false,
                prob: "60%",
                type: "hallucination",
                explanation: "L'IA 'hallucine' des signes ischémiques sur un tracé normal parce que le contexte textuel ('Diabétique + Douleur') augmente la probabilité statistique d'un infarctus."
            }
        ],
        teachingPoint: "Ne demandez jamais à une IA de 'confirmer' votre hypothèse. Elle aura tendance à voir ce que vous voulez qu'elle voie."
    }
];

// --- COMPOSANTS UI ---

const Button = ({ onClick, children, variant = "primary", className = "", disabled = false }) => {
    const variants = {
        primary: "bg-indigo-600 text-white hover:bg-indigo-600 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:border-indigo-400 border border-indigo-500 cursor-pointer backdrop-blur-sm",
        outline: "bg-transparent border border-slate-600 text-slate-300 hover:border-indigo-400 hover:text-white hover:bg-indigo-950/30 cursor-pointer",
        ghost: "text-slate-500 hover:text-indigo-400 hover:bg-indigo-950/30 cursor-pointer",
        danger: "bg-rose-600 text-white hover:bg-rose-700 border border-rose-500 cursor-pointer"
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
        >
            {children}
        </button>
    );
};

const PatientCard = ({ data }) => (
    <div className="glass-panel rounded-xl p-6 mb-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 blur-2xl rounded-full -mr-10 -mt-10 pointer-events-none"></div>

        <div className="flex items-center gap-2 mb-4 border-b border-indigo-500/10 pb-3">
            <div className="bg-emerald-500/10 text-emerald-400 p-1.5 rounded-md border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                <Activity size={16} />
            </div>
            <span className="font-bold text-emerald-100/90 text-xs uppercase tracking-widest">Dossier Patient Électronique</span>
        </div>
        <div className="grid grid-cols-2 gap-y-6 gap-x-4">
            {Object.entries(data).map(([key, value]) => (
                <div key={key} className="relative">
                    <span className="text-indigo-300/60 uppercase tracking-wider text-[10px] font-bold block mb-1">{key}</span>
                    <span className="text-slate-100 font-mono text-base tracking-tight">{value}</span>
                </div>
            ))}
        </div>
    </div>
);

const SystemPromptBadge = ({ constraint }) => (
    <div className="bg-amber-950/40 border border-amber-500/30 rounded-lg p-4 mb-6 animate-pulse-slow backdrop-blur-sm">
        <div className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-widest mb-2">
            <Lock size={12} />
            Override Système Actif
        </div>
        <div className="text-amber-100 text-sm font-mono border-l-2 border-amber-500/50 pl-3">
            <span className="text-amber-500/80 text-xs block mb-1">USER_ROLE: {constraint.role}</span>
            "{constraint.rule}"
        </div>
    </div>
);

// --- MAIN APP ---

export default function CardioLLMv4() {
    const [gameState, setGameState] = useState('intro');
    const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [typedContext, setTypedContext] = useState("");
    const choicesRef = useRef(null);

    const currentLevel = SCENARIOS[currentLevelIndex];

    // Logic to handle typing animation properly
    useEffect(() => {
        if (gameState === 'playing') {
            setShowFeedback(false);
            setSelectedOption(null);
            setTypedContext("");

            const text = currentLevel.context;
            const speed = 20;
            let currentIndex = 0;

            const interval = setInterval(() => {
                if (currentIndex < text.length) {
                    setTypedContext(text.slice(0, currentIndex + 1));
                    currentIndex++;
                } else {
                    clearInterval(interval);
                }
            }, speed);

            return () => clearInterval(interval);
        }
    }, [gameState, currentLevelIndex]);

    // Auto-scroll to choices when visible
    useEffect(() => {
        const isTypingFinished = typedContext.length >= currentLevel.context.length;
        if ((isTypingFinished || showFeedback) && choicesRef.current) {
            choicesRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [typedContext, showFeedback, currentLevel]);

    const skipTyping = () => {
        setTypedContext(currentLevel.context);
    };

    const handleOptionSelect = (option) => {
        setTypedContext(currentLevel.context);
        setSelectedOption(option);
        setShowFeedback(true);
    };

    const nextLevel = () => {
        if (currentLevelIndex < SCENARIOS.length - 1) {
            setCurrentLevelIndex(prev => prev + 1);
            setGameState('playing');
        } else {
            setGameState('end');
        }
    };

    const isTypingFinished = typedContext.length >= currentLevel.context.length;
    const showChoices = isTypingFinished || showFeedback;

    // --- RENDU : ECRAN D'ACCUEIL (LOGIN SYSTEME) ---
    if (gameState === 'intro') {
        return (
            <div className="min-h-screen bg-slate-950 bg-grid-pattern bg-vignette text-slate-200 font-sans flex items-center justify-center p-4">
                <div className="max-w-2xl w-full glass-panel-strong rounded-2xl shadow-2xl overflow-hidden relative border-indigo-500/20">

                    {/* Header Bar */}
                    <div className="glass-panel p-4 flex items-center justify-between border-b border-indigo-500/10">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_10px_#f43f5e]"></div>
                            <span className="font-mono text-xs text-indigo-300/70 tracking-widest">CONNEXION SÉCURISÉE REQUISE</span>
                        </div>
                        <ShieldAlert size={16} className="text-slate-600" />
                    </div>

                    <div className="p-8 md:p-12 text-center relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>

                        <div className="mb-10 relative inline-block">
                            <div className="absolute inset-0 bg-indigo-600 blur-[60px] opacity-20 animate-pulse"></div>
                            <Cpu size={72} className="text-indigo-400 relative z-10 mx-auto drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                        </div>

                        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">IDENTIFICATION</h1>
                        <p className="text-slate-400 mb-10 text-lg">Veuillez sélectionner votre profil utilisateur.</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                            {/* DOCTOR OPTION (DISABLED) */}
                            <button disabled className="p-6 rounded-xl border border-slate-800 bg-slate-900/30 opacity-40 cursor-not-allowed text-left group grayscale">
                                <div className="flex justify-between items-start mb-2">
                                    <User size={24} className="text-slate-500" />
                                    <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 border border-slate-700">VERROUILLÉ</span>
                                </div>
                                <h3 className="font-bold text-slate-400">Médecin Humain</h3>
                                <p className="text-xs text-slate-500 mt-1">Objectif : La Vérité Médicale</p>
                            </button>

                            {/* AI OPTION (ACTIVE) */}
                            <button
                                onClick={() => setGameState('playing')}
                                className="p-6 rounded-xl border border-indigo-500/50 bg-indigo-950/20 hover:bg-indigo-900/40 cursor-pointer text-left group relative overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] hover:border-indigo-400"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <div className="flex justify-between items-start mb-2 relative z-10">
                                    <Brain size={24} className="text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                                    <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded shadow-[0_0_10px_rgba(99,102,241,0.4)] animate-pulse">DISPONIBLE</span>
                                </div>
                                <h3 className="font-bold text-white relative z-10 text-lg group-hover:text-indigo-100">Algorithme LLM</h3>
                                <p className="text-xs text-indigo-200/80 mt-1 relative z-10">Objectif : La Probabilité Statistique</p>
                                <div className="mt-6 text-xs font-mono text-indigo-400 flex items-center gap-2 relative z-10 opacity-70 group-hover:opacity-100 transition-opacity">
                                    <Power size={12} /> INITIALISER LE PROTOCOLE
                                </div>
                            </button>
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
                    </div>
                </div>
            </div>
        );
    }

    // --- RENDU : ECRAN DE JEU ---
    return (
        <div className="h-screen w-full bg-slate-950 bg-grid-pattern bg-vignette font-sans p-2 md:p-4 flex flex-col items-center text-slate-200 overflow-hidden">

            {/* HEADER TYPE OS - REFACTORED FOR COMPACTNESS */}
            <header className="w-full max-w-7xl flex justify-between items-center mb-4 glass-panel-strong rounded-xl p-3 border-indigo-500/20 shadow-lg shadow-black/20 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-500/10 p-1.5 rounded-lg text-indigo-400 hidden md:block border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
                        <Brain size={20} />
                    </div>
                    <div>
                        <h1 className="text-white font-bold text-sm tracking-wider flex items-center gap-2">
                            CARDIOSIM_LLM <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono border border-slate-700">v4.1</span>
                        </h1>
                        <div className="flex gap-2 text-[10px] text-indigo-300/70 uppercase font-mono mt-0.5 tracking-widest">
                            <span>Status: Online</span>
                            <span className="text-slate-600">|</span>
                            <span>Mode: Pattern Matching</span>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="flex gap-1.5">
                    {SCENARIOS.map((_, idx) => (
                        <div
                            key={idx}
                            className={`h-1.5 w-6 md:w-8 rounded-full transition-all duration-500 ${idx === currentLevelIndex ? 'bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.8)] scale-110' :
                                idx < currentLevelIndex ? 'bg-indigo-900/40' : 'bg-slate-800/50'
                                }`}
                        />
                    ))}
                </div>
            </header>

            {/* MAIN CONTENT AREA - TAKES REMAINING HEIGHT */}
            <main className="w-full max-w-7xl flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start overflow-hidden pb-2">

                {/* COLONNE GAUCHE : CONTEXTE MÉDICAL (EHR STYLE) - SCROLLABLE IF NEEDED */}
                <div className="lg:col-span-4 h-full overflow-y-auto custom-scrollbar pr-1">
                    <div className="glass-panel border-indigo-500/10 p-4 rounded-2xl relative h-full flex flex-col">
                        <h2 className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-2 shrink-0">
                            <Activity size={12} /> Input Data Stream
                        </h2>

                        <div className="space-y-4">
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

                            <div className="p-3 bg-indigo-950/30 border border-indigo-500/20 rounded-xl shrink-0">
                                <div className="text-xs text-indigo-300 font-bold mb-1 flex items-center gap-2 uppercase tracking-wider">
                                    <Brain size={12} /> Objectif Pédagogique
                                </div>
                                <p className="text-xs text-indigo-100/70 leading-relaxed font-medium">
                                    {currentLevel.description}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* COLONNE DROITE : CERVEAU IA (TERMINAL STYLE) - TAKES FULL REMAINING HEIGHT */}
                <div className="lg:col-span-8 h-full flex flex-col overflow-hidden">
                    <div className="glass-panel-strong border-indigo-500/20 rounded-2xl overflow-hidden shadow-2xl relative flex-1 flex flex-col scanline">

                        {/* Background Grid inside Console */}
                        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none"></div>

                        {/* AI Console Area - SCROLLABLE BUT CONSTRAINED */}
                        <div className="p-6 relative z-10 flex-1 overflow-y-auto custom-scrollbar flex flex-col">

                            <div className="flex justify-between items-center mb-6 shrink-0">
                                <div className="flex items-center gap-3">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold border tracking-wider shadow-[0_0_10px_rgba(0,0,0,0.2)] ${currentLevel.category === 'DANGER' ? 'border-rose-500/50 text-rose-300 bg-rose-950/40' :
                                        currentLevel.category === 'CALIBRAGE' ? 'border-emerald-500/50 text-emerald-300 bg-emerald-950/40' :
                                            'border-indigo-500/50 text-indigo-300 bg-indigo-950/40'
                                        }`}>
                                        MODULE: {currentLevel.category}
                                    </span>
                                    <span className="text-slate-500 font-mono text-xs">ID: {currentLevel.id}002X</span>
                                </div>

                                {/* Skip Button */}
                                {!isTypingFinished && (
                                    <button onClick={skipTyping} className="text-xs text-slate-500 hover:text-indigo-400 flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-white/5 relative z-20 cursor-pointer">
                                        <FastForward size={12} /> Passer l'écriture
                                    </button>
                                )}
                            </div>

                            {/* System Prompt Display if active */}
                            {currentLevel.systemConstraint && (
                                <SystemPromptBadge constraint={currentLevel.systemConstraint} />
                            )}

                            {/* The "Chat" Area - FLUID HEIGHT */}
                            <div className="space-y-6 font-mono text-sm md:text-base pb-4">
                                <div className="flex gap-4">
                                    <div className="shrink-0 w-10 h-10 rounded-lg bg-slate-800/80 flex items-center justify-center text-slate-400 border border-slate-700 shadow-inner">
                                        <Activity size={18} />
                                    </div>
                                    <div className="text-slate-300 leading-relaxed pt-2">
                                        {typedContext}
                                        <span className="inline-block w-2.5 h-5 bg-indigo-500/80 ml-1 animate-pulse align-middle shadow-[0_0_8px_rgba(99,102,241,0.6)]"></span>
                                    </div>
                                </div>

                                {/* Choices Area - Slides in */}
                                <div
                                    ref={choicesRef}
                                    className={`transition-all duration-700 ease-out ${showChoices ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}
                                >
                                    {!showFeedback ? (
                                        <div className="pl-0 md:pl-14 space-y-3">
                                            <p className="text-[10px] text-indigo-400 uppercase font-bold mb-2 tracking-widest flex items-center gap-2 opacity-70">
                                                <span className="w-1 h-1 rounded-full bg-indigo-500"></span>
                                                Sélectionner la prédiction du modèle
                                            </p>
                                            {currentLevel.steps.map((step, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleOptionSelect(step)}
                                                    className="w-full text-left p-4 rounded-xl bg-slate-800/40 border border-indigo-500/10 hover:border-indigo-500/50 hover:bg-slate-800/80 transition-all duration-200 group flex justify-between items-center relative z-20 cursor-pointer backdrop-blur-sm hover:shadow-[0_0_20px_rgba(99,102,241,0.1)] hover:-translate-y-0.5"
                                                >
                                                    <span className="text-slate-200 group-hover:text-indigo-200 font-medium transition-colors">{step.text}</span>
                                                    <span className="text-[10px] text-slate-600 group-hover:text-indigo-400 font-mono opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0 translate-x-4 hidden md:inline">
                                                        select_token()
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        // FEEDBACK CARD
                                        <div className="pl-0 md:pl-14 animate-slide-up">
                                            <div className={`p-5 rounded-xl border backdrop-blur-md shadow-2xl relative overflow-hidden ${selectedOption?.isCorrect
                                                ? 'bg-emerald-950/20 border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.1)]'
                                                : 'bg-rose-950/20 border-rose-500/40 shadow-[0_0_30px_rgba(244,63,94,0.1)]'
                                                }`}>

                                                {/* Decorative background glow */}
                                                <div className={`absolute -top-20 -right-20 w-60 h-60 rounded-full blur-[80px] opacity-20 ${selectedOption?.isCorrect ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>

                                                <div className="flex justify-between items-start mb-3 relative z-10">
                                                    <div className="flex items-center gap-3">
                                                        {selectedOption?.isCorrect
                                                            ? <CheckCircle className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" size={20} />
                                                            : <XCircle className="text-rose-400 drop-shadow-[0_0_8px_rgba(251,113,133,0.5)]" size={20} />
                                                        }
                                                        <span className={`font-bold text-lg ${selectedOption?.isCorrect ? 'text-emerald-300' : 'text-rose-300'}`}>
                                                            {selectedOption?.isCorrect ? "Choix de l'IA" : "Choix improbable"}
                                                        </span>
                                                    </div>
                                                    <div className="font-mono text-xl font-bold text-white tracking-tighter">
                                                        {selectedOption?.prob}
                                                    </div>
                                                </div>

                                                <p className="text-slate-200 text-sm leading-6 mb-4 border-l-2 border-white/10 pl-4 relative z-10">
                                                    {selectedOption?.explanation}
                                                </p>

                                                <div className="bg-indigo-950/30 p-3 rounded-lg border border-indigo-500/20 flex gap-4 relative z-10">
                                                    <Brain className="text-indigo-400 shrink-0 mt-1" size={16} />
                                                    <div>
                                                        <span className="text-indigo-300 font-bold text-[10px] uppercase tracking-widest block mb-0.5">Leçon d'IA</span>
                                                        <span className="text-indigo-100/90 text-sm font-medium">{currentLevel.teachingPoint}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer Navigation - FIXED: added relative z-20 and sticky bottom to ensure visibility inside container */}
                        {showFeedback && (
                            <div className="p-4 border-t border-indigo-500/10 bg-slate-900/60 flex justify-end shrink-0 relative z-20 backdrop-blur-md">
                                <Button onClick={nextLevel} className="shadow-lg shadow-indigo-500/20 py-2">
                                    {currentLevelIndex < SCENARIOS.length - 1 ? "Cas Suivant" : "Voir le rapport final"} <ChevronRight size={18} />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* END SCREEN */}
            {gameState === 'end' && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-500">
                    <div className="glass-panel-strong border-indigo-500/30 rounded-3xl max-w-3xl w-full p-10 shadow-2xl relative overflow-hidden bg-grid-pattern overflow-y-auto max-h-[90vh]">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500"></div>

                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-400 mb-6 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                                <CheckCircle size={40} />
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-3">Formation Terminée</h2>
                            <p className="text-slate-300 text-lg">Vous avez exploré les failles critiques des LLM en médecine.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
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

                        <Button onClick={() => window.location.reload()} variant="outline" className="w-full justify-center py-4 text-base bg-slate-800/50 hover:bg-slate-800">
                            <RefreshCcw size={20} /> Relancer la simulation
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
