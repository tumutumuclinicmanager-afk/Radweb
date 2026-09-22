import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { 
  Brain, 
  RotateCw, 
  RotateCcw,
  Play,
  Pause,
  Gauge,
  ZoomIn, 
  ZoomOut, 
  Layers, 
  Info, 
  Sparkles, 
  ArrowRight, 
  Crosshair, 
  Sliders, 
  Eye, 
  Maximize2,
  ChevronRight,
  Activity,
  ShieldAlert,
  Compass,
  HeartPulse,
  GitBranch,
  Split,
  EyeOff,
  Search
} from 'lucide-react';
import { MedicalCase } from '../types';

interface BrainMapProps {
  cases?: MedicalCase[];
  onSelectCase?: (c: MedicalCase) => void;
  onExploreHeadCt?: () => void;
}

export interface BrainRegionInfo {
  id: string;
  category: 'cortex' | 'deep' | 'vascular' | 'posterior' | 'fluid';
  name: string;
  latinName: string;
  color: string;
  function: string;
  radiologicalRelevance: string;
  commonPathologies: string[];
  ctSliceLevel: string;
  pinPosition: [number, number, number];
  cameraAngle?: { x: number; y: number; z: number };
}

export const BRAIN_REGIONS: BrainRegionInfo[] = [
  {
    id: 'prefrontal',
    category: 'cortex',
    name: 'Prefrontal Cortex (Frontal Pole)',
    latinName: 'Cortex praefrontalis',
    color: '#3b82f6', // blue
    function: 'Executive planning, abstract reasoning, working memory, emotional regulation, personality expression.',
    radiologicalRelevance: 'Directly abuts the cribriform plate and orbital roof; primary site for traumatic brain contusions and olfactory groove meningiomas. Anterior Cerebral Artery (ACA) cortical territory.',
    commonPathologies: ['Bifrontal Contusions ("Coup/Contrecoup")', 'Olfactory Meningioma', 'Acute ACA Infarct', 'Subfrontal Subdural Hematoma'],
    ctSliceLevel: 'Orbitofrontal & Lower Convexity Level',
    pinPosition: [0, 0.5, 1.95],
    cameraAngle: { x: 0.1, y: 0, z: 4.8 },
  },
  {
    id: 'motor_strip',
    category: 'cortex',
    name: 'Precentral Gyrus (Motor Strip)',
    latinName: 'Gyrus praecentralis',
    color: '#2563eb', // royal blue
    function: 'Primary motor cortex (Brodmann area 4); executes voluntary motor movements arranged in somatotopic homunculus.',
    radiologicalRelevance: 'Separated from sensory cortex by the Central Sulcus. Occlusion of superior division MCA branches causes dense contralateral motor hemiplegia.',
    commonPathologies: ['Superior Division MCA Infarct', 'Parasagittal Meningioma', 'Motor Cortex Metastasis', 'Jacksonian Seizure Focus'],
    ctSliceLevel: 'Centrum Semiovale & High Convexity',
    pinPosition: [0.75, 1.35, 0.3],
    cameraAngle: { x: 0.35, y: -0.4, z: 4.8 },
  },
  {
    id: 'broca',
    category: 'cortex',
    name: "Broca's Expressive Speech Area",
    latinName: 'Area Broca (Gyrus frontalis inferior)',
    color: '#0284c7', // sky
    function: 'Motor speech programming, syntactic grammar articulation (dominant left hemisphere opercular/triangular pars).',
    radiologicalRelevance: 'Acute thromboembolic occlusion of the left anterior MCA branch results in expressive non-fluent aphasia with preserved comprehension.',
    commonPathologies: ['Acute Left MCA Ischemic Stroke', 'Frontal Opercular Glioma', 'Traumatic Contusion'],
    ctSliceLevel: 'Suprasellar / Lower Sylvian Level',
    pinPosition: [-1.45, 0.45, 0.95],
    cameraAngle: { x: 0.1, y: 0.7, z: 4.8 },
  },
  {
    id: 'sensory_strip',
    category: 'cortex',
    name: 'Postcentral Gyrus (Sensory Strip)',
    latinName: 'Gyrus postcentralis',
    color: '#8b5cf6', // purple
    function: 'Primary somatosensory cortex (Brodmann 3, 1, 2); tactile localization, proprioception, pain and temperature perception.',
    radiologicalRelevance: 'Located directly posterior to the Central Sulcus. Watershed territory ischemia (ACA-MCA borderzone) frequently compromises the parietal convexity.',
    commonPathologies: ['Watershed / Borderzone Infarct', 'Parietal Arteriovenous Malformation (AVM)', 'Cortical Subarachnoid Hemorrhage'],
    ctSliceLevel: 'High Convexity Parietal Cortex',
    pinPosition: [0.8, 1.35, -0.2],
    cameraAngle: { x: 0.35, y: -0.5, z: 4.8 },
  },
  {
    id: 'sylvian_fissure',
    category: 'cortex',
    name: 'Sylvian Fissure & Insular Ribbon',
    latinName: 'Sulcus lateralis & Cortex insularis',
    color: '#6366f1', // indigo
    function: 'Major anatomical cleavage separating temporal from frontal/parietal lobes; houses MCA M2 branches and deep insular cortex.',
    radiologicalRelevance: 'First site to demonstrate the "Hyperdense MCA Sign" and "Loss of Insular Ribbon" within 3 hours of hyperacute stroke. Most common location for aneurysmal SAH pooling.',
    commonPathologies: ['Loss of Insular Ribbon Sign (Acute MCA)', 'Hyperdense MCA Vessel Sign', 'Sylvian Subarachnoid Hemorrhage', 'Insular Glioma'],
    ctSliceLevel: 'Basal Ganglia & Monro Level',
    pinPosition: [1.6, 0.1, 0.4],
    cameraAngle: { x: 0.05, y: -0.85, z: 4.6 },
  },
  {
    id: 'wernicke',
    category: 'cortex',
    name: "Wernicke's Area & Superior Temporal Gyrus",
    latinName: 'Area Wernicke (Gyrus temporalis superior)',
    color: '#10b981', // emerald
    function: 'Receptive language comprehension and semantic decoding (posterior aspect of dominant left superior temporal gyrus).',
    radiologicalRelevance: 'Inferior division MCA infarction causes sensory fluent aphasia ("word salad" with impaired comprehension).',
    commonPathologies: ['Inferior MCA Division Stroke', 'Temporal Lobar Hemorrhage', 'Herpes Simplex Virus (HSV) Encephalitis'],
    ctSliceLevel: 'Middle Cranial Fossa / Suprasellar Level',
    pinPosition: [-1.75, 0.0, -0.3],
    cameraAngle: { x: 0.05, y: 0.85, z: 4.6 },
  },
  {
    id: 'temporal_pole',
    category: 'cortex',
    name: 'Temporal Pole & Uncus',
    latinName: 'Polus temporalis & Uncus gyri parahippocampalis',
    color: '#059669', // dark green
    function: 'Anteromedial temporal lobe; limbic memory circuits and amygdala emotional memory.',
    radiologicalRelevance: 'Critical for detecting early Uncal Transtentorial Herniation: expanding supratentorial mass displaces the uncus medially into the tentorial incisura, compressing Cranial Nerve III (causing ipsilateral blown pupil) and posterior cerebral artery (PCA stroke).',
    commonPathologies: ['Uncal Transtentorial Herniation', 'Ipsilateral Oculomotor Nerve Compression', 'Middle Meningeal Epidural Hematoma', 'Anterior Temporal Contusion'],
    ctSliceLevel: 'Suprasellar Cistern / Ambient Cistern Level',
    pinPosition: [1.35, -0.45, 0.95],
    cameraAngle: { x: -0.2, y: -0.65, z: 4.6 },
  },
  {
    id: 'occipital',
    category: 'cortex',
    name: 'Occipital Pole & Calcarine Cortex',
    latinName: 'Polus occipitalis & Sulcus calcarinus',
    color: '#f59e0b', // amber
    function: 'Primary visual cortex (Brodmann area 17); retinotopic mapping and conscious visual reception.',
    radiologicalRelevance: 'Supplied exclusively by Posterior Cerebral Artery (PCA) terminal branches. Acute PCA occlusion causes contralateral homonymous hemianopia with macular sparing.',
    commonPathologies: ['Acute PCA Territory Infarct', 'PRES (Posterior Reversible Encephalopathy)', 'Occipital Lobar Hemorrhage (Amyloid Angiopathy)'],
    ctSliceLevel: 'Tentorial Apex / Quadrigeminal Cistern Level',
    pinPosition: [0, 0.45, -2.05],
    cameraAngle: { x: 0.2, y: Math.PI, z: 4.8 },
  },
  {
    id: 'corpus_callosum',
    category: 'deep',
    name: 'Corpus Callosum (Genu & Splenium)',
    latinName: 'Corpus callosum',
    color: '#d97706', // warm amber
    function: 'Massive transverse white matter tract containing >200 million axonal fibers interconnecting both cerebral hemispheres.',
    radiologicalRelevance: 'Susceptible to shearing shear forces in high-speed Diffuse Axonal Injury (DAI, Grade III). Classic pathognomonic location for "Butterfly Glioblastoma" crossing midline.',
    commonPathologies: ['Diffuse Axonal Injury (DAI)', 'Butterfly Glioblastoma Multiforme', 'Marchiafava-Bignami Disease', 'Corpus Callosum Lipoma'],
    ctSliceLevel: 'Centrum Semiovale & Lateral Ventricles Body',
    pinPosition: [0, 0.7, 0.15],
    cameraAngle: { x: 0.4, y: 0.2, z: 4.5 },
  },
  {
    id: 'basal_ganglia',
    category: 'deep',
    name: 'Basal Ganglia & Internal Capsule',
    latinName: 'Nuclei basales & Capsula interna',
    color: '#e11d48', // rose
    function: 'Putamen, globus pallidus, caudate nucleus, and corticospinal fibers modulating involuntary motor gating and coordination.',
    radiologicalRelevance: 'Most frequent site of hypertensive intracerebral hemorrhage (Charcot-Bouchard microaneurysm rupture in lenticulostriate arteries). Pure motor stroke in internal capsule lacunar infarcts.',
    commonPathologies: ['Hypertensive Putaminal Hemorrhage', 'Lenticulostriate Lacunar Infarct', 'Carbon Monoxide Globus Pallidus Necrosis', 'Wilson Disease'],
    ctSliceLevel: 'Foramen of Monro / Basal Ganglia Plane',
    pinPosition: [0.65, 0.25, 0.2],
    cameraAngle: { x: 0.25, y: -0.35, z: 4.5 },
  },
  {
    id: 'thalamus',
    category: 'deep',
    name: 'Thalamus (Bilateral)',
    latinName: 'Thalamus dorsalis',
    color: '#db2777', // pink
    function: 'Central sensory relay station for all incoming sensory modalities (except olfaction) to cerebral cortex, arousal, and alertness.',
    radiologicalRelevance: 'Common site for hypertensive hemorrhage and Artery of Percheron occlusion (causing bilateral symmetrical paramedian thalamic infarcts and coma).',
    commonPathologies: ['Hypertensive Thalamic Hemorrhage', 'Artery of Percheron Infarction', 'Internal Cerebral Vein Thrombosis', 'Thalamic Glioma'],
    ctSliceLevel: 'Third Ventricle / Pineal Level',
    pinPosition: [-0.45, 0.2, -0.15],
    cameraAngle: { x: 0.3, y: 0.3, z: 4.5 },
  },
  {
    id: 'ventricles',
    category: 'fluid',
    name: 'Ventricular System & Foramen of Monro',
    latinName: 'Systema ventriculare & Foramen interventriculare',
    color: '#06b6d4', // cyan
    function: 'CSF production (choroid plexus ~500mL/day) and circulation through lateral, third, aqueduct, and fourth ventricles.',
    radiologicalRelevance: 'Evaluated on EVERY head CT for midline shift (>5mm indicates surgical emergency), ventricle effacement, intraventricular hemorrhage (Graeb score), and acute obstructive hydrocephalus.',
    commonPathologies: ['Acute Obstructive Hydrocephalus', 'Intraventricular Hemorrhage (IVH)', 'Subfalcine Herniation & Midline Shift', 'Colloid Cyst of Third Ventricle'],
    ctSliceLevel: 'Lateral Ventricles & Septum Pellucidum',
    pinPosition: [0, 0.35, 0.05],
    cameraAngle: { x: 0.45, y: 0, z: 4.5 },
  },
  {
    id: 'circle_of_willis',
    category: 'vascular',
    name: 'Circle of Willis (Arterial Stroke Network)',
    latinName: 'Circulus arteriosus cerebri',
    color: '#dc2626', // arterial red
    function: 'Polygonal anastomotic arterial ring at the skull base formed by bilateral ICAs, ACAs, ACom, PCAs, and PComs.',
    radiologicalRelevance: 'Primary site of saccular "Berry" aneurysm formation (85% at anterior communicating and ICA/PCom junctions). Rupture produces hyperdense star-shaped basal cistern Subarachnoid Hemorrhage (SAH).',
    commonPathologies: ['Aneurysmal Subarachnoid Hemorrhage (SAH)', 'Ruptured ACom / PCom Berry Aneurysm', 'Basilar Artery Tip Occlusion', 'Large Vessel Occlusion (LVO)'],
    ctSliceLevel: 'Sella Turcica / Suprasellar Star Cistern',
    pinPosition: [0, -0.75, 0.35],
    cameraAngle: { x: -0.65, y: 0, z: 4.5 },
  },
  {
    id: 'pons',
    category: 'posterior',
    name: 'Pons & Basilar Sulcus',
    latinName: 'Pons (Metencephalon)',
    color: '#0891b2', // teal
    function: 'Brainstem relay bridge; cranial nerve nuclei V, VI, VII, VIII, corticospinal tracts, pontine micturition center.',
    radiologicalRelevance: 'Basilar artery runs directly along the anterior median pontine sulcus. Massive hypertensive pontine hemorrhage causes sudden coma, pinpoint pupils, and decerebrate posturing.',
    commonPathologies: ['Catastrophic Pontine Hemorrhage', 'Basilar Artery Thrombosis ("Locked-in Syndrome")', 'Central Pontine Myelinolysis (ODS)', 'Duret Brainstem Hemorrhages'],
    ctSliceLevel: 'Prepontine Cistern & Internal Auditory Canal',
    pinPosition: [0, -1.05, 0.05],
    cameraAngle: { x: -0.2, y: 0, z: 4.6 },
  },
  {
    id: 'medulla',
    category: 'posterior',
    name: 'Medulla Oblongata & Pyramids',
    latinName: 'Medulla oblongata (Myelencephalon)',
    color: '#0e7490', // deep cyan
    function: 'Autonomic respiratory and cardiovascular reflex centers; decussation of pyramids; CN IX, X, XI, XII nuclei.',
    radiologicalRelevance: 'Directly vulnerable to downward Tonsillar Herniation through the Foramen Magnum (causes fatal medullary respiratory arrest). Site of PICA occlusion in Lateral Medullary (Wallenberg) Syndrome.',
    commonPathologies: ['Fatal Tonsillar Herniation ("Coneing")', 'Wallenberg Lateral Medullary Syndrome', 'Foramen Magnum Meningioma', 'Chiari I Malformation'],
    ctSliceLevel: 'Foramen Magnum & Odontoid Peg Level',
    pinPosition: [0, -1.6, -0.2],
    cameraAngle: { x: -0.3, y: 0, z: 4.6 },
  },
  {
    id: 'cerebellum',
    category: 'posterior',
    name: 'Cerebellar Hemispheres & Vermis',
    latinName: 'Cerebellum & Vermis cerebelli',
    color: '#ec4899', // pink
    function: 'Coordinates voluntary motor coordination, postural equilibrium, eye saccades, vestibular balance, gait stability.',
    radiologicalRelevance: 'Located in the rigid infratentorial posterior fossa. Cerebellar hematoma >3cm or ischemic swelling rapidly compresses the 4th ventricle, mandating emergent surgical decompression.',
    commonPathologies: ['Cerebellar Hemorrhage with 4th Ventricle Effacement', 'PICA / AICA Cerebellar Infarct', 'Medulloblastoma / Ependymoma', 'Tonsillar Ectopia'],
    ctSliceLevel: 'Posterior Cranial Fossa / 4th Ventricle',
    pinPosition: [0, -1.15, -1.35],
    cameraAngle: { x: -0.15, y: Math.PI, z: 4.8 },
  },
  {
    id: 'hippocampus_amygdala',
    category: 'deep',
    name: 'Hippocampus & Amygdala (Limbic Complex)',
    latinName: 'Hippocampus & Corpus amygdaloideum',
    color: '#f97316',
    function: 'Episodic memory consolidation, spatial navigation (hippocampus), and emotional threat appraisal and fear conditioning (amygdala).',
    radiologicalRelevance: 'Primary site of mesial temporal sclerosis in refractory epilepsy and early neuronal loss in Alzheimer disease.',
    commonPathologies: ['Mesial Temporal Sclerosis', 'Alzheimer Neurofibrillary Degeneration', 'HSV Encephalitis', 'Temporal Lobe Epilepsy Focus'],
    ctSliceLevel: 'Temporal Horn / Ambient Cistern Plane',
    pinPosition: [1.1, -0.3, -0.4],
    cameraAngle: { x: 0.1, y: -0.5, z: 4.5 },
  },
  {
    id: 'pituitary_gland',
    category: 'deep',
    name: 'Pituitary Gland & Sella Turcica',
    latinName: 'Glandula pituitaria (Hypophysis)',
    color: '#eab308',
    function: 'Master endocrine gland regulating HPA axis, thyroid function, growth hormone, and osmoregulation via portal blood system.',
    radiologicalRelevance: 'Enclosed in sella turcica; macroadenomas expand superiorly to compress the optic chiasm, producing bitemporal hemianopia.',
    commonPathologies: ['Pituitary Macroadenoma', 'Pituitary Apoplexy', "Rathke's Cleft Cyst", 'Empty Sella Syndrome'],
    ctSliceLevel: 'Sella Turcica / Sphenoid Sinus Level',
    pinPosition: [0, -0.9, 1.1],
    cameraAngle: { x: -0.4, y: 0, z: 4.5 },
  },
  {
    id: 'pineal_gland',
    category: 'deep',
    name: 'Pineal Gland',
    latinName: 'Corpus pineale (Epiphysis)',
    color: '#a855f7',
    function: 'Endocrine gland synthesizing melatonin to modulate circadian rhythms and seasonal sleep-wake cycles.',
    radiologicalRelevance: 'Frequently calcified on head CT as midline landmark; tumors (pinealoblastoma/germinoma) compress tectal plate causing Parinaud syndrome.',
    commonPathologies: ['Physiologic Pineal Calcification', 'Pineal Germinoma', 'Pinealoblastoma', 'Tectal Plate Compression'],
    ctSliceLevel: 'Quadrigeminal Cistern Level',
    pinPosition: [0, 0.2, -0.85],
    cameraAngle: { x: 0.3, y: 0, z: 4.5 },
  },
  {
    id: 'insular_cortex',
    category: 'cortex',
    name: 'Insular Cortex (Insula)',
    latinName: 'Cortex insularis',
    color: '#06b6d4',
    function: 'Visceral sensory processing, gustatory integration, self-awareness, and emotional pain appraisal.',
    radiologicalRelevance: 'Buried deep within the Sylvian fissure; "loss of insular ribbon" is a hallmark sign of hyperacute middle cerebral artery ischemia.',
    commonPathologies: ['Hyperacute MCA Stroke (Loss of Insular Ribbon)', 'Insular Low-Grade Glioma', 'Central Pain Syndrome'],
    ctSliceLevel: 'Basal Ganglia & Sylvian Plane',
    pinPosition: [1.3, 0.1, 0.2],
    cameraAngle: { x: 0.05, y: -0.7, z: 4.6 },
  },
  {
    id: 'ica_artery',
    category: 'vascular',
    name: 'Internal Carotid Artery (ICA)',
    latinName: 'Arteria carotis interna',
    color: '#ef4444',
    function: 'Primary arterial trunk supplying anterior circulation of cerebrum, orbits, and pituitary gland.',
    radiologicalRelevance: 'Saccular aneurysms frequently develop at the ICA terminus or origin of the posterior communicating artery.',
    commonPathologies: ['ICA Saccular Aneurysm', 'Carotid Siphon Atherosclerosis', 'Carotid Artery Dissection', 'Cavernous Sinus Fistula'],
    ctSliceLevel: 'Suprasellar & Middle Fossa Level',
    pinPosition: [0.7, -0.7, 0.5],
    cameraAngle: { x: -0.3, y: -0.4, z: 4.5 },
  },
  {
    id: 'aca_artery',
    category: 'vascular',
    name: 'Anterior Cerebral Artery (ACA)',
    latinName: 'Arteria cerebri anterior',
    color: '#f87171',
    function: 'Supplies medial frontal and parietal lobes, including motor and sensory representations for lower extremities.',
    radiologicalRelevance: 'Occlusion results in contralateral lower limb motor weakness and apraxia greater than upper limbs.',
    commonPathologies: ['ACA Territory Ischemic Infarct', 'Falx Meningioma', 'ACom Aneurysm Rupture'],
    ctSliceLevel: 'Interhemispheric Fissure & Vertex Level',
    pinPosition: [0.3, 0.6, 1.1],
    cameraAngle: { x: 0.1, y: 0, z: 4.6 },
  },
  {
    id: 'mca_artery',
    category: 'vascular',
    name: 'Middle Cerebral Artery (MCA)',
    latinName: 'Arteria cerebri media',
    color: '#dc2626',
    function: 'Supplies lateral hemispheric cortex, motor/sensory homunculus for face/hands, and dominant speech areas.',
    radiologicalRelevance: 'Most common vessel involved in acute ischemic stroke, causing contralateral hemiplegia and aphasia.',
    commonPathologies: ['M1/M2 Thromboembolic Occlusion', 'Hyperdense MCA Vessel Sign', 'MCA Bifurcation Aneurysm'],
    ctSliceLevel: 'Sylvian Fissure & Basal Ganglia Plane',
    pinPosition: [1.4, 0.2, 0.3],
    cameraAngle: { x: 0.05, y: -0.8, z: 4.6 },
  },
  {
    id: 'pca_artery',
    category: 'vascular',
    name: 'Posterior Cerebral Artery (PCA)',
    latinName: 'Arteria cerebri posterior',
    color: '#b91c1c',
    function: 'Supplies occipital lobes (primary visual cortex), thalamus, and inferior temporal lobes.',
    radiologicalRelevance: 'Occlusion causes contralateral homonymous hemianopia with characteristic macular sparing.',
    commonPathologies: ['PCA Territory Infarct', 'Thalamic Stroke Syndrome', 'Occipital Lobar Hemorrhage'],
    ctSliceLevel: 'Tentorial Apex & Quadrigeminal Level',
    pinPosition: [0.5, -0.4, -1.2],
    cameraAngle: { x: 0.2, y: Math.PI - 0.3, z: 4.7 },
  },
  {
    id: 'basilar_artery',
    category: 'vascular',
    name: 'Basilar Artery',
    latinName: 'Arteria basilaris',
    color: '#991b1b',
    function: 'Formed by vertebral artery union; supplies brainstem, cerebellum, and posterior cerebral circulation.',
    radiologicalRelevance: 'Thrombosis of the basilar trunk causes catastrophic brainstem ischemia and "Locked-in Syndrome".',
    commonPathologies: ['Basilar Artery Tip Occlusion', 'Pontine Ischemic Infarct', 'Basilar Dolichoectasia'],
    ctSliceLevel: 'Prepontine Cistern Level',
    pinPosition: [0, -1.0, -0.2],
    cameraAngle: { x: -0.2, y: 0, z: 4.6 },
  },
];

type RenderMode = 'photoreal' | 'anatomic' | 'ct_window' | 'wireframe' | 'transparent_cortex';

export const BrainMap: React.FC<BrainMapProps> = ({ 
  cases = [], 
  onSelectCase, 
  onExploreHeadCt 
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const containerWrapperRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const brainGroupRef = useRef<THREE.Group | null>(null);
  const pinsGroupRef = useRef<THREE.Group | null>(null);
  const slicePlaneRef = useRef<THREE.Mesh | null>(null);
  const arteriesGroupRef = useRef<THREE.Group | null>(null);
  const ventriclesGroupRef = useRef<THREE.Group | null>(null);
  const deepNucleiGroupRef = useRef<THREE.Group | null>(null);
  const selectionBeaconRef = useRef<THREE.Group | null>(null);
  const leftHemGeoRef = useRef<THREE.BufferGeometry | null>(null);
  const rightHemGeoRef = useRef<THREE.BufferGeometry | null>(null);
  const leftBaseColorsRef = useRef<Float32Array | null>(null);
  const rightBaseColorsRef = useRef<Float32Array | null>(null);
  const pialVesselsRef = useRef<THREE.Group | null>(null);

  const [selectedRegionId, setSelectedRegionId] = useState<string>('sylvian_fissure');
  const [activeCategory, setActiveCategory] = useState<'all' | 'cortex' | 'deep' | 'vascular' | 'posterior' | 'fluid'>('all');
  const [renderMode, setRenderMode] = useState<RenderMode>('photoreal');
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [rotationSpeed, setRotationSpeed] = useState<number>(1.0);
  const [rotationDirection, setRotationDirection] = useState<1 | -1>(1);

  const autoRotateRef = useRef<boolean>(autoRotate);
  const rotationSpeedRef = useRef<number>(rotationSpeed);
  const rotationDirectionRef = useRef<1 | -1>(rotationDirection);

  // Dynamic Cortical Lobar Illumination: highlights localized vertices of the selected anatomical region
  const applyCorticalHighlight = (region: BrainRegionInfo | null) => {
    if (!leftHemGeoRef.current || !rightHemGeoRef.current || !leftBaseColorsRef.current || !rightBaseColorsRef.current) return;

    const geos = [
      { geo: leftHemGeoRef.current, base: leftBaseColorsRef.current },
      { geo: rightHemGeoRef.current, base: rightBaseColorsRef.current }
    ];

    const targetPos = region ? new THREE.Vector3(...region.pinPosition) : null;
    const isCortex = region && region.category === 'cortex';
    const highlightColor = region ? new THREE.Color(region.color) : null;

    geos.forEach(({ geo, base }) => {
      const pos = geo.attributes.position;
      const colAttr = geo.attributes.color;
      if (!pos || !colAttr) return;
      const v = new THREE.Vector3();

      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);
        const baseR = base[i * 3];
        const baseG = base[i * 3 + 1];
        const baseB = base[i * 3 + 2];

        if (isCortex && targetPos && highlightColor) {
          const dx = v.x - targetPos.x;
          const dy = v.y - targetPos.y;
          const dz = v.z - targetPos.z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          const radius = 1.35;

          if (dist < radius) {
            const factor = Math.cos((dist / radius) * (Math.PI / 2));
            const intensity = factor * factor * 0.90;
            const lum = (baseR + baseG + baseB) / 3.0;
            // Retain deep sulcal shadows while illuminating gyral crests
            colAttr.array[i * 3] = THREE.MathUtils.lerp(baseR, highlightColor.r * (0.45 + 0.65 * lum), intensity);
            colAttr.array[i * 3 + 1] = THREE.MathUtils.lerp(baseG, highlightColor.g * (0.45 + 0.65 * lum), intensity);
            colAttr.array[i * 3 + 2] = THREE.MathUtils.lerp(baseB, highlightColor.b * (0.45 + 0.65 * lum), intensity);
          } else {
            colAttr.array[i * 3] = baseR;
            colAttr.array[i * 3 + 1] = baseG;
            colAttr.array[i * 3 + 2] = baseB;
          }
        } else {
          colAttr.array[i * 3] = baseR;
          colAttr.array[i * 3 + 1] = baseG;
          colAttr.array[i * 3 + 2] = baseB;
        }
      }
      colAttr.needsUpdate = true;
    });
  };

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    rotationSpeedRef.current = rotationSpeed;
  }, [rotationSpeed]);

  useEffect(() => {
    rotationDirectionRef.current = rotationDirection;
  }, [rotationDirection]);

  const [showPins, setShowPins] = useState<boolean>(true);
  const [showSlicePlane, setShowSlicePlane] = useState<boolean>(false);
  const [showArteries, setShowArteries] = useState<boolean>(true);
  const [showVentricles, setShowVentricles] = useState<boolean>(true);
  const [slicePosition, setSlicePosition] = useState<number>(0.2);
  const [sliceAxis, setSliceAxis] = useState<'axial' | 'coronal' | 'sagittal'>('axial');
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [cortexOpacity, setCortexOpacity] = useState<number>(1.0);
  const [surfaceVsSliceFade, setSurfaceVsSliceFade] = useState<number>(0); // 0 = Surface View, 1 = Cross-Sectional Slice View
  const [showCanvasAnnotations, setShowCanvasAnnotations] = useState<boolean>(true);
  const [spatialMode, setSpatialMode] = useState<boolean>(false);
  const [vrMode, setVrMode] = useState<boolean>(false);
  const vrModeRef = useRef<boolean>(vrMode);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    vrModeRef.current = vrMode;
  }, [vrMode]);

  useEffect(() => {
    if (!spatialMode) return;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (!brainGroupRef.current) return;
      const gamma = event.gamma || 0;
      const beta = event.beta || 0;
      brainGroupRef.current.rotation.y = THREE.MathUtils.degToRad(gamma * 0.8);
      brainGroupRef.current.rotation.x = THREE.MathUtils.degToRad((beta - 45) * 0.8);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!brainGroupRef.current) return;
      const xNorm = (e.clientX / window.innerWidth) * 2 - 1;
      const yNorm = -(e.clientY / window.innerHeight) * 2 + 1;
      brainGroupRef.current.rotation.y = xNorm * 0.9;
      brainGroupRef.current.rotation.x = -yNorm * 0.9;
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('deviceorientation', handleOrientation);
      window.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('deviceorientation', handleOrientation);
        window.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [spatialMode]);

  // Floating callout showing the name of the clicked area
  const [clickCallout, setClickCallout] = useState<{
    name: string;
    latinName: string;
    color: string;
    category: string;
    ctSliceLevel: string;
    x: number;
    y: number;
  } | null>(null);

  const [hoveredRegion, setHoveredRegion] = useState<BrainRegionInfo | null>(null);

  const selectedRegion = useMemo(() => {
    return BRAIN_REGIONS.find(r => r.id === selectedRegionId) || BRAIN_REGIONS[0];
  }, [selectedRegionId]);

  const filteredRegions = useMemo(() => {
    let list = BRAIN_REGIONS;
    if (activeCategory !== 'all') {
      list = list.filter(r => r.category === activeCategory);
    }
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      list = list.filter(r => r.name.toLowerCase().includes(q) || r.latinName.toLowerCase().includes(q) || r.function.toLowerCase().includes(q));
    }
    return list;
  }, [activeCategory, searchTerm]);

  // Match head CT cases associated with current region
  const relatedCases = useMemo(() => {
    const term = selectedRegion.name.split(' ')[0].toLowerCase();
    return cases.filter(c => {
      if (c.modality !== 'head_ct') return false;
      const text = `${c.title} ${c.diagnosis} ${c.findings || ''} ${c.keyFindings.join(' ')}`.toLowerCase();
      return text.includes(term) || selectedRegion.commonPathologies.some(p => text.includes(p.toLowerCase().split(' ')[0]));
    }).slice(0, 3);
  }, [cases, selectedRegion]);

  // Three.js 3D Brain Construction and WebGL Rendering
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 460;
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 5.2);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Anatomical Studio Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.70);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xfff1f2, 0x0f172a, 0.65);
    scene.add(hemiLight);

    const mainKeyLight = new THREE.DirectionalLight(0xfffaed, 1.7);
    mainKeyLight.position.set(6, 10, 6);
    mainKeyLight.castShadow = true;
    scene.add(mainKeyLight);

    const rimBlueLight = new THREE.DirectionalLight(0x38bdf8, 1.35);
    rimBlueLight.position.set(-8, -2, -6);
    scene.add(rimBlueLight);

    const anatomicalUnderLight = new THREE.DirectionalLight(0xf43f5e, 0.45);
    anatomicalUnderLight.position.set(0, -8, 2);
    scene.add(anatomicalUnderLight);

    // Root Rotatable Group
    const brainGroup = new THREE.Group();
    scene.add(brainGroup);
    brainGroupRef.current = brainGroup;

    // =========================================================================
    // 1. HIGH-FIDELITY CEREBRAL HEMISPHERE WITH REALISTIC GYRI/SULCI CONVOLUTIONS
    // =========================================================================
    const createAnatomicalHemisphere = (isLeft: boolean) => {
      const geo = new THREE.SphereGeometry(1.68, 96, 96);
      const pos = geo.attributes.position;
      const vertexCount = pos.count;
      const v = new THREE.Vector3();

      // Per-vertex colors for organic cortical depth (sulcal shadows + gyral highlights)
      const colors = new Float32Array(vertexCount * 3);
      const sign = isLeft ? -1 : 1;

      for (let i = 0; i < vertexCount; i++) {
        v.fromBufferAttribute(pos, i);

        // A. Macroscopic Morphological Shaping
        // 1. Medial Wall & Longitudinal Fissure Cleavage
        if ((isLeft && v.x > 0) || (!isLeft && v.x < 0)) {
          v.x *= 0.12;
        }

        // 2. Antero-Posterior Elongation & Asymmetry
        v.z *= 1.32;

        // Frontal pole tapering & orbital roof flattening
        if (v.z > 0.4) {
          v.x *= 0.90;
          v.y *= 0.94;
          if (v.y < -0.15 && v.z > 0.8) {
            // Orbital surface concavity resting over anterior cranial fossa
            v.y *= 0.72;
          }
        }

        // Occipital pole tapering
        if (v.z < -0.3) {
          v.x *= 0.84;
          v.y *= 0.88;
        }

        // 3. Temporal Lobe Anterior Projection & Lateral Prominence
        if (v.y < 0.1 && v.z > -0.5 && v.z < 1.1) {
          const temporalBulge = Math.cos(Math.max(-Math.PI, Math.min(Math.PI, (v.z - 0.3) * 2.2))) * 0.28;
          if (temporalBulge > 0) {
            v.x += sign * temporalBulge;
            v.y -= 0.14;
          }
        }

        // Inferior skull base flattening
        if (v.y < -0.8) {
          v.y *= 0.76;
        }

        // B. Primary Anatomical Fissures & Sulci (Macro-Crevices)
        // 1. Sylvian Fissure (Lateral Sulcus): runs obliquely from anteroinferior to posterosuperior
        const sylvianLineY = -0.15 + (v.z - 0.2) * 0.42;
        const distToSylvian = Math.abs(v.y - sylvianLineY);
        let sylvianDepth = 0;
        if (Math.abs(v.x) > 0.5 && v.z > -0.6 && v.z < 1.2 && distToSylvian < 0.28) {
          sylvianDepth = Math.cos((distToSylvian / 0.28) * (Math.PI / 2)) * 0.26;
        }

        // 2. Central Sulcus of Rolando: runs downward and forward from top midline
        const centralLineZ = 0.1 + (v.y - 1.2) * 0.45;
        const distToCentral = Math.abs(v.z - centralLineZ);
        let centralDepth = 0;
        if (v.y > 0.1 && Math.abs(v.x) > 0.35 && distToCentral < 0.22) {
          centralDepth = Math.cos((distToCentral / 0.22) * (Math.PI / 2)) * 0.20;
        }

        // 3. Parieto-Occipital Sulcus: medial and posterosuperior notch
        const poLineZ = -0.92 + (v.y - 0.4) * 0.32;
        const distToPO = Math.abs(v.z - poLineZ);
        let parietoOccipitalDepth = 0;
        if (v.z < -0.35 && v.y > 0.05 && distToPO < 0.22) {
          parietoOccipitalDepth = Math.cos((distToPO / 0.22) * (Math.PI / 2)) * 0.16;
        }

        // 4. Calcarine Sulcus: medial occipital fissure
        let calcarineDepth = 0;
        if (Math.abs(v.x) < 0.55 && v.z < -0.75 && Math.abs(v.y + 0.15) < 0.18) {
          calcarineDepth = Math.cos((Math.abs(v.y + 0.15) / 0.18) * (Math.PI / 2)) * 0.15;
        }

        // C. Micro & Meso Gyri/Sulci Convolutions (Multi-Harmonic Directional Waves)
        // Frontal longitudinal gyri:
        const frontalGyrus = Math.sin(v.y * 11.0 + v.x * 4.0) * Math.cos(v.z * 6.5) * 0.058;
        // Rolandic vertical strip gyri:
        const rolandicGyrus = Math.sin(v.z * 16.0 + v.y * 4.0) * Math.cos(v.x * 7.0) * 0.052;
        // Temporal horizontal gyri:
        const temporalGyrus = Math.sin(v.y * 15.0) * Math.cos(v.z * 7.5 + v.x * 3.0) * 0.050;
        // Parietal lobule convolutes:
        const parietalGyrus = Math.sin(v.x * 14.0) * Math.cos(v.y * 12.0 + v.z * 5.0) * 0.042;
        // High frequency fine cortical convolutions (tertiary gyral ripples):
        const microSulci = (Math.sin(v.x * 19.0) * Math.cos(v.y * 19.0) * Math.sin(v.z * 19.0)) * 0.030;
        const fineGyri = (Math.sin(v.x * 26.0 + v.z * 14.0) * Math.cos(v.y * 22.0)) * 0.016;

        const totalDisplacement = (frontalGyrus + rolandicGyrus + temporalGyrus + parietalGyrus + microSulci + fineGyri) 
          - sylvianDepth - centralDepth - parietoOccipitalDepth - calcarineDepth;

        // Apply displacement along normal
        const normal = v.clone().normalize();
        v.addScaledVector(normal, totalDisplacement * (1.0 - Math.abs(v.x) * 0.15));

        // Lateral separation between hemispheres
        v.x += sign * 0.10;

        pos.setXYZ(i, v.x, v.y, v.z);

        // D. Organic Ambient Occlusion & Sulcal Shadowing (Vertex Color calculation)
        // Crevices (negative displacement) are shaded dark maroon/brown; crests are soft warm cortical cream/pink
        const sulcusShadow = Math.max(0, Math.min(1, (totalDisplacement + 0.20) / 0.36));
        
        // Base cortical flesh palette matching professional anatomical 3D rendering:
        // Sulcus crevice: warm brownish-tan shadow
        // Gyral crest: warm ivory / sand / beige cortex crown
        const cr = sulcusShadow < 0.45 
          ? THREE.MathUtils.lerp(0.50, 0.78, sulcusShadow / 0.45) 
          : THREE.MathUtils.lerp(0.78, 0.94, (sulcusShadow - 0.45) / 0.55);
        const cg = sulcusShadow < 0.45 
          ? THREE.MathUtils.lerp(0.40, 0.70, sulcusShadow / 0.45) 
          : THREE.MathUtils.lerp(0.70, 0.88, (sulcusShadow - 0.45) / 0.55);
        const cb = sulcusShadow < 0.45 
          ? THREE.MathUtils.lerp(0.32, 0.62, sulcusShadow / 0.45) 
          : THREE.MathUtils.lerp(0.62, 0.80, (sulcusShadow - 0.45) / 0.55);

        colors[i * 3] = cr;
        colors[i * 3 + 1] = cg;
        colors[i * 3 + 2] = cb;
      }

      // Save base colors for real-time anatomical highlight modulation
      if (isLeft) {
        leftBaseColorsRef.current = new Float32Array(colors);
      } else {
        rightBaseColorsRef.current = new Float32Array(colors);
      }

      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geo.computeVertexNormals();
      return geo;
    };

    // =========================================================================
    // 2. DETAILED CEREBELLUM WITH HORIZONTAL LAMINAR FOLIA & VERMIS
    // =========================================================================
    const createAnatomicalCerebellum = (isLeft: boolean) => {
      const geo = new THREE.SphereGeometry(0.78, 64, 64);
      const pos = geo.attributes.position;
      const vertexCount = pos.count;
      const v = new THREE.Vector3();
      const colors = new Float32Array(vertexCount * 3);
      const sign = isLeft ? -1 : 1;

      for (let i = 0; i < vertexCount; i++) {
        v.fromBufferAttribute(pos, i);

        // Posterior fossa morphology
        v.x *= 0.92;
        v.y *= 0.68;
        v.z *= 0.82;

        // Folia horizontal parallel striations (distinct cerebellar micro-stripes)
        const folia = Math.sin(v.y * 38.0) * 0.035 + Math.cos(v.x * 12.0) * 0.015;
        v.addScaledVector(v.clone().normalize(), folia);

        v.x += sign * 0.52;
        v.y -= 1.08;
        v.z -= 1.18;

        pos.setXYZ(i, v.x, v.y, v.z);

        const foliaShadow = (folia + 0.04) / 0.08;
        colors[i * 3] = THREE.MathUtils.lerp(0.55, 0.92, foliaShadow);
        colors[i * 3 + 1] = THREE.MathUtils.lerp(0.25, 0.65, foliaShadow);
        colors[i * 3 + 2] = THREE.MathUtils.lerp(0.38, 0.75, foliaShadow);
      }

      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geo.computeVertexNormals();
      return geo;
    };

    // Cerebellar Vermis (Midline structure)
    const createCerebellarVermis = () => {
      const geo = new THREE.SphereGeometry(0.48, 36, 36);
      const pos = geo.attributes.position;
      const v = new THREE.Vector3();
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);
        v.x *= 0.48;
        v.y *= 0.82;
        v.z *= 0.75;
        const folia = Math.sin(v.y * 36.0) * 0.025;
        v.addScaledVector(v.clone().normalize(), folia);
        v.y -= 1.05;
        v.z -= 1.30;
        pos.setXYZ(i, v.x, v.y, v.z);
      }
      geo.computeVertexNormals();
      return geo;
    };

    // =========================================================================
    // 3. BRAINSTEM (MIDBRAIN, BULBOUS PONS, & MEDULLA WITH PYRAMIDS)
    // =========================================================================
    const createBrainstemGroup = () => {
      const group = new THREE.Group();

      // A. Midbrain (Mesencephalon with cerebral peduncles)
      const midbrainGeo = new THREE.CylinderGeometry(0.38, 0.42, 0.55, 32);
      const midbrainMat = new THREE.MeshStandardMaterial({ color: 0x0891b2, roughness: 0.45 });
      const midbrainMesh = new THREE.Mesh(midbrainGeo, midbrainMat);
      midbrainMesh.position.set(0, -0.68, -0.15);
      group.add(midbrainMesh);

      // B. Pons (Anterior rounded bulbous protrusion with basilar artery groove)
      const ponsGeo = new THREE.SphereGeometry(0.52, 40, 36);
      const pPos = ponsGeo.attributes.position;
      const pv = new THREE.Vector3();
      for (let i = 0; i < pPos.count; i++) {
        pv.fromBufferAttribute(pPos, i);
        // Anterior expansion with central vertical basilar groove at x=0
        if (pv.z > 0) {
          pv.z *= 1.35;
          const basilarGroove = Math.abs(pv.x) < 0.12 ? 0.08 : 0;
          pv.z -= basilarGroove;
        }
        pv.y *= 0.85;
        pPos.setXYZ(i, pv.x, pv.y, pv.z);
      }
      ponsGeo.computeVertexNormals();
      const ponsMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.4 });
      const ponsMesh = new THREE.Mesh(ponsGeo, ponsMat);
      ponsMesh.position.set(0, -1.05, 0.05);
      group.add(ponsMesh);

      // C. Medulla Oblongata (Tapering cone with anterior median fissure & pyramids)
      const medullaGeo = new THREE.CylinderGeometry(0.32, 0.20, 0.75, 32);
      const medMat = new THREE.MeshStandardMaterial({ color: 0x0e7490, roughness: 0.5 });
      const medullaMesh = new THREE.Mesh(medullaGeo, medMat);
      medullaMesh.position.set(0, -1.55, -0.18);
      group.add(medullaMesh);

      return group;
    };

    // =========================================================================
    // 4. NEUROVASCULAR TREE: CIRCLE OF WILLIS & MAJOR ARTERIES
    // =========================================================================
    const createCircleOfWillisGroup = () => {
      const group = new THREE.Group();
      const arterialMat = new THREE.MeshStandardMaterial({
        color: 0xdc2626, // Crimson red
        emissive: 0x991b1b,
        emissiveIntensity: 0.55,
        roughness: 0.25,
        metalness: 0.35,
      });

      const createArteryTube = (points: THREE.Vector3[], radius = 0.038) => {
        const curve = new THREE.CatmullRomCurve3(points);
        const geo = new THREE.TubeGeometry(curve, 28, radius, 10, false);
        return new THREE.Mesh(geo, arterialMat);
      };

      // 1. Basilar Artery (Ascending the anterior median groove of the pons)
      const basilarArtery = createArteryTube([
        new THREE.Vector3(0, -1.45, -0.05),
        new THREE.Vector3(0, -1.15, 0.22),
        new THREE.Vector3(0, -0.85, 0.24),
        new THREE.Vector3(0, -0.68, 0.18),
      ], 0.046);
      group.add(basilarArtery);

      // Bilateral Vertebral Arteries converging into Basilar
      group.add(createArteryTube([
        new THREE.Vector3(-0.22, -1.8, -0.22),
        new THREE.Vector3(-0.10, -1.58, -0.12),
        new THREE.Vector3(0, -1.45, -0.05),
      ], 0.036));
      group.add(createArteryTube([
        new THREE.Vector3(0.22, -1.8, -0.22),
        new THREE.Vector3(0.10, -1.58, -0.12),
        new THREE.Vector3(0, -1.45, -0.05),
      ], 0.036));

      // 2. Posterior Cerebral Arteries (PCA) branching off Basilar Tip
      [-1, 1].forEach(s => {
        group.add(createArteryTube([
          new THREE.Vector3(0, -0.68, 0.18),
          new THREE.Vector3(s * 0.32, -0.62, 0.08),
          new THREE.Vector3(s * 0.65, -0.60, -0.25),
          new THREE.Vector3(s * 0.95, -0.55, -0.75),
          new THREE.Vector3(s * 0.85, -0.45, -1.35),
        ], 0.035));
      });

      // 3. Bilateral Internal Carotid Arteries (ICA) & Middle Cerebral Arteries (MCA)
      [-1, 1].forEach(s => {
        // ICA bifurcation
        const icaPt = new THREE.Vector3(s * 0.42, -0.65, 0.42);
        
        // MCA (M1 branch curving laterally into the Sylvian fissure, then M2 branches)
        group.add(createArteryTube([
          icaPt,
          new THREE.Vector3(s * 0.75, -0.55, 0.45),
          new THREE.Vector3(s * 1.25, -0.25, 0.48),
          new THREE.Vector3(s * 1.55, 0.05, 0.35),
          new THREE.Vector3(s * 1.45, 0.35, 0.15),
        ], 0.040));

        // ACA (A1 branch traveling anteromedially)
        group.add(createArteryTube([
          icaPt,
          new THREE.Vector3(s * 0.22, -0.55, 0.65),
          new THREE.Vector3(s * 0.08, -0.42, 0.85),
          new THREE.Vector3(s * 0.08, 0.15, 1.25),
          new THREE.Vector3(s * 0.12, 0.75, 0.85),
        ], 0.036));

        // PCom (Posterior Communicating Artery connecting ICA to PCA)
        group.add(createArteryTube([
          icaPt,
          new THREE.Vector3(s * 0.38, -0.62, 0.22),
          new THREE.Vector3(s * 0.32, -0.62, 0.08),
        ], 0.024));
      });

      // ACom (Anterior Communicating Artery connecting bilateral ACAs)
      group.add(createArteryTube([
        new THREE.Vector3(-0.08, -0.42, 0.85),
        new THREE.Vector3(0, -0.41, 0.86),
        new THREE.Vector3(0.08, -0.42, 0.85),
      ], 0.028));

      return group;
    };

    // =========================================================================
    // 5. VENTRICULAR SYSTEM & DEEP STRUCTURES (THALAMUS & CORPUS CALLOSUM)
    // =========================================================================
    const createVentriclesAndDeepNuclei = () => {
      const group = new THREE.Group();

      const csfMat = new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8, // Luminous blue/cyan
        emissive: 0x0284c7,
        emissiveIntensity: 0.6,
        roughness: 0.15,
        transmission: 0.75,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
      });

      // Bilateral C-shaped Lateral Ventricles (Anterior horn, body, occipital horn, temporal horn)
      [-1, 1].forEach(s => {
        const vCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(s * 0.25, 0.15, 0.85),   // Anterior frontal horn
          new THREE.Vector3(s * 0.35, 0.48, 0.35),   // Body of lateral ventricle
          new THREE.Vector3(s * 0.48, 0.38, -0.45),  // Atrium / Trigone
          new THREE.Vector3(s * 0.32, 0.28, -1.05),  // Occipital posterior horn
          new THREE.Vector3(s * 0.65, -0.15, -0.15), // Inferior temporal horn
          new THREE.Vector3(s * 0.75, -0.32, 0.45),  // Tip of temporal horn
        ]);
        const vGeo = new THREE.TubeGeometry(vCurve, 40, 0.085, 12, false);
        group.add(new THREE.Mesh(vGeo, csfMat));
      });

      // Third Ventricle (Medial thin vertical chamber)
      const thirdVentricleGeo = new THREE.BoxGeometry(0.09, 0.38, 0.62);
      const thirdMesh = new THREE.Mesh(thirdVentricleGeo, csfMat);
      thirdMesh.position.set(0, 0.18, 0.02);
      group.add(thirdMesh);

      // Fourth Ventricle (Diamond-shaped chamber posterior to pons)
      const fourthVentricleGeo = new THREE.ConeGeometry(0.18, 0.36, 4);
      const fourthMesh = new THREE.Mesh(fourthVentricleGeo, csfMat);
      fourthMesh.rotation.set(Math.PI, 0, Math.PI / 4);
      fourthMesh.position.set(0, -0.92, -0.45);
      group.add(fourthMesh);

      // Aqueduct of Sylvius (Narrow canal connecting 3rd and 4th ventricles)
      const aqueductGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.48, 8);
      const aqueductMesh = new THREE.Mesh(aqueductGeo, csfMat);
      aqueductMesh.rotation.x = -0.65;
      aqueductMesh.position.set(0, -0.45, -0.25);
      group.add(aqueductMesh);

      return group;
    };

    // Deep Nuclei: Thalamus and Corpus Callosum
    const createDeepNucleiGroup = () => {
      const group = new THREE.Group();

      // Thalamus (Bilateral ovoid nuclear masses flanking 3rd ventricle)
      const thalamusMat = new THREE.MeshStandardMaterial({
        color: 0xdb2777,
        roughness: 0.35,
        metalness: 0.2,
      });

      [-1, 1].forEach(s => {
        const thalGeo = new THREE.SphereGeometry(0.28, 24, 24);
        thalGeo.scale(0.8, 0.9, 1.3);
        const thalMesh = new THREE.Mesh(thalGeo, thalamusMat);
        thalMesh.position.set(s * 0.28, 0.22, -0.05);
        thalMesh.rotation.set(0.15, s * 0.2, 0);
        group.add(thalMesh);
      });

      // Corpus Callosum (C-shaped thick dense white matter arch)
      const ccCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0.15, 0.92),   // Rostrum
        new THREE.Vector3(0, 0.42, 0.88),   // Genu
        new THREE.Vector3(0, 0.68, 0.25),   // Body
        new THREE.Vector3(0, 0.65, -0.45),  // Body
        new THREE.Vector3(0, 0.45, -0.85),  // Splenium
      ]);
      const ccGeo = new THREE.TubeGeometry(ccCurve, 32, 0.11, 12, false);
      const ccMat = new THREE.MeshStandardMaterial({
        color: 0xd97706,
        roughness: 0.3,
        metalness: 0.1,
      });
      group.add(new THREE.Mesh(ccGeo, ccMat));

      return group;
    };

    // =========================================================================
    // ASSEMBLE 3D HIERARCHY
    // =========================================================================
    // 1. Cerebral Hemispheres
    const leftHemGeo = createAnatomicalHemisphere(true);
    const rightHemGeo = createAnatomicalHemisphere(false);
    leftHemGeoRef.current = leftHemGeo;
    rightHemGeoRef.current = rightHemGeo;
    
    // Lifelike Biological Cortical Material with Pia-Arachnoid Wet CSF Sheen
    const corticalMaterial = new THREE.MeshPhysicalMaterial({
      vertexColors: true,
      roughness: 0.28,
      metalness: 0.05,
      clearcoat: 0.82,
      clearcoatRoughness: 0.06,
      transmission: 0.08,
      thickness: 0.5,
      sheen: 0.85,
      sheenColor: new THREE.Color(0xfef3c7),
      reflectivity: 0.65,
    });

    const leftCerebrum = new THREE.Mesh(leftHemGeo, corticalMaterial.clone());
    leftCerebrum.name = 'left_cerebrum';
    brainGroup.add(leftCerebrum);

    const rightCerebrum = new THREE.Mesh(rightHemGeo, corticalMaterial.clone());
    rightCerebrum.name = 'right_cerebrum';
    brainGroup.add(rightCerebrum);

    // Superficial Pial Cortical Micro-Vessels (Veins of Trolard, Labbé & Sylvian Veins)
    const createSuperficialCorticalVessels = () => {
      const vGroup = new THREE.Group();
      vGroup.name = 'pial_vessels_group';

      const venousMat = new THREE.MeshStandardMaterial({
        color: 0x1e40af, // Cerebral cortical venous blue
        roughness: 0.3,
        metalness: 0.4,
      });

      const arterialMat = new THREE.MeshStandardMaterial({
        color: 0xef4444, // Pial cortical arteriole red
        roughness: 0.25,
        metalness: 0.3,
      });

      // Bilateral pial vascular networks
      [-1, 1].forEach(sign => {
        // 1. Superficial Middle Cerebral Vein (courses along the Sylvian fissure)
        const sylvianVeinCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(sign * 1.56, -0.22, 0.45),
          new THREE.Vector3(sign * 1.62, -0.05, 0.05),
          new THREE.Vector3(sign * 1.54, 0.12, -0.42),
          new THREE.Vector3(sign * 1.38, 0.08, -0.85),
        ]);
        const sylvianVeinGeo = new THREE.TubeGeometry(sylvianVeinCurve, 28, 0.024, 8, false);
        vGroup.add(new THREE.Mesh(sylvianVeinGeo, venousMat));

        // 2. Vein of Trolard (Superior anastomotic vein heading up to superior sagittal sinus)
        const trolardCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(sign * 1.60, 0.02, 0.15),
          new THREE.Vector3(sign * 1.48, 0.65, 0.08),
          new THREE.Vector3(sign * 1.15, 1.25, -0.05),
          new THREE.Vector3(sign * 0.45, 1.55, -0.15),
        ]);
        const trolardGeo = new THREE.TubeGeometry(trolardCurve, 24, 0.022, 8, false);
        vGroup.add(new THREE.Mesh(trolardGeo, venousMat));

        // 3. Vein of Labbé (Inferior anastomotic vein heading down to transverse sinus)
        const labbeCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(sign * 1.60, -0.05, -0.25),
          new THREE.Vector3(sign * 1.52, -0.55, -0.65),
          new THREE.Vector3(sign * 1.22, -0.92, -1.05),
        ]);
        const labbeGeo = new THREE.TubeGeometry(labbeCurve, 20, 0.020, 8, false);
        vGroup.add(new THREE.Mesh(labbeGeo, venousMat));

        // 4. Branching M3/M4 Arteriolar Arbors over Lateral Convexity
        const m3Curve1 = new THREE.CatmullRomCurve3([
          new THREE.Vector3(sign * 1.54, -0.15, 0.35),
          new THREE.Vector3(sign * 1.58, 0.35, 0.42),
          new THREE.Vector3(sign * 1.35, 0.85, 0.38),
        ]);
        vGroup.add(new THREE.Mesh(new THREE.TubeGeometry(m3Curve1, 18, 0.016, 6, false), arterialMat));

        const m3Curve2 = new THREE.CatmullRomCurve3([
          new THREE.Vector3(sign * 1.58, 0.05, -0.10),
          new THREE.Vector3(sign * 1.52, 0.52, -0.32),
          new THREE.Vector3(sign * 1.30, 0.95, -0.45),
        ]);
        vGroup.add(new THREE.Mesh(new THREE.TubeGeometry(m3Curve2, 18, 0.016, 6, false), arterialMat));
      });

      return vGroup;
    };

    const pialVessels = createSuperficialCorticalVessels();
    brainGroup.add(pialVessels);
    pialVesselsRef.current = pialVessels;

    // 2. Cerebellum & Vermis
    const leftCerebGeo = createAnatomicalCerebellum(true);
    const rightCerebGeo = createAnatomicalCerebellum(false);
    const vermisGeo = createCerebellarVermis();

    const leftCereb = new THREE.Mesh(leftCerebGeo, corticalMaterial.clone());
    leftCereb.name = 'left_cerebellum';
    brainGroup.add(leftCereb);

    const rightCereb = new THREE.Mesh(rightCerebGeo, corticalMaterial.clone());
    rightCereb.name = 'right_cerebellum';
    brainGroup.add(rightCereb);

    const vermisMesh = new THREE.Mesh(vermisGeo, new THREE.MeshStandardMaterial({ color: 0xbe185d, roughness: 0.45 }));
    vermisMesh.name = 'vermis';
    brainGroup.add(vermisMesh);

    // 3. Brainstem
    const brainstemGroup = createBrainstemGroup();
    brainstemGroup.name = 'brainstem_group';
    brainGroup.add(brainstemGroup);

    // 4. Circle of Willis & Arterial Tree
    const arteriesGroup = createCircleOfWillisGroup();
    arteriesGroup.name = 'arteries_group';
    brainGroup.add(arteriesGroup);
    arteriesGroupRef.current = arteriesGroup;

    // 5. Ventricular System
    const ventriclesGroup = createVentriclesAndDeepNuclei();
    ventriclesGroup.name = 'ventricles_group';
    brainGroup.add(ventriclesGroup);
    ventriclesGroupRef.current = ventriclesGroup;

    // 6. Deep Nuclei (Thalamus & Corpus Callosum)
    const deepNucleiGroup = createDeepNucleiGroup();
    deepNucleiGroup.name = 'deep_nuclei_group';
    brainGroup.add(deepNucleiGroup);
    deepNucleiGroupRef.current = deepNucleiGroup;

    // 7. Interactive 3D Hotspot Pins
    const pinsGroup = new THREE.Group();
    pinsGroupRef.current = pinsGroup;
    brainGroup.add(pinsGroup);

    BRAIN_REGIONS.forEach((region) => {
      const pinContainer = new THREE.Group();
      pinContainer.position.set(...region.pinPosition);
      pinContainer.name = `pin_${region.id}`;

      // Outer glowing ring
      const ringGeo = new THREE.RingGeometry(0.09, 0.12, 32);
      const ringMat = new THREE.MeshBasicMaterial({ 
        color: region.color, 
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.95
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);

      // Glowing core sphere
      const sphereGeo = new THREE.SphereGeometry(0.065, 16, 16);
      const sphereMat = new THREE.MeshStandardMaterial({ 
        color: region.color,
        emissive: region.color,
        emissiveIntensity: 0.85,
        roughness: 0.15
      });
      const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);

      pinContainer.add(ringMesh);
      pinContainer.add(sphereMesh);
      pinsGroup.add(pinContainer);
    });

    // 8. 3D Holographic Selection Beacon (Precision Targeting HUD for Selected Anatomical Structure)
    const selectionBeaconGroup = new THREE.Group();
    selectionBeaconGroup.name = 'selection_beacon_group';

    // Outer reticle targeting ring
    const beaconRingGeo = new THREE.RingGeometry(0.18, 0.22, 32);
    const beaconRingMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    const beaconRing = new THREE.Mesh(beaconRingGeo, beaconRingMat);
    beaconRing.name = 'beacon_ring';
    selectionBeaconGroup.add(beaconRing);

    // Dynamic radar pulse ripple ring
    const beaconRippleGeo = new THREE.RingGeometry(0.24, 0.28, 32);
    const beaconRippleMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65,
    });
    const beaconRipple = new THREE.Mesh(beaconRippleGeo, beaconRippleMat);
    beaconRipple.name = 'beacon_ripple';
    selectionBeaconGroup.add(beaconRipple);

    // Center focal pointer bead
    const beaconPointerGeo = new THREE.SphereGeometry(0.08, 16, 16);
    const beaconPointerMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.95,
    });
    const beaconPointer = new THREE.Mesh(beaconPointerGeo, beaconPointerMat);
    beaconPointer.name = 'beacon_pointer';
    selectionBeaconGroup.add(beaconPointer);

    brainGroup.add(selectionBeaconGroup);
    selectionBeaconRef.current = selectionBeaconGroup;

    // 9. CT Scan Slicing Laser Plane
    const planeGeo = new THREE.PlaneGeometry(4.2, 4.2);
    const planeMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const slicePlane = new THREE.Mesh(planeGeo, planeMat);
    slicePlane.rotation.x = -Math.PI / 2;
    slicePlane.name = 'slice_plane';
    
    // Glowing grid line border
    const gridEdges = new THREE.EdgesGeometry(planeGeo);
    const gridLine = new THREE.LineSegments(gridEdges, new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2 }));
    slicePlane.add(gridLine);

    brainGroup.add(slicePlane);
    slicePlaneRef.current = slicePlane;

    // =========================================================================
    // INTERACTION: DRAG TO ROTATE, WHEEL ZOOM, & AREA CLICK IDENTIFICATION
    // =========================================================================
    let isDragging = false;
    let dragDisplacement = 0;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      isDragging = true;
      dragDisplacement = 0;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      prevMouseX = clientX;
      prevMouseY = clientY;
    };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      if (isDragging && brainGroupRef.current) {
        const deltaX = clientX - prevMouseX;
        const deltaY = clientY - prevMouseY;
        dragDisplacement += Math.abs(deltaX) + Math.abs(deltaY);

        brainGroupRef.current.rotation.y += deltaX * 0.007;
        brainGroupRef.current.rotation.x += deltaY * 0.005;
        brainGroupRef.current.rotation.x = Math.max(-1.35, Math.min(1.35, brainGroupRef.current.rotation.x));

        prevMouseX = clientX;
        prevMouseY = clientY;
      }
    };

    const handlePointerUp = () => {
      isDragging = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);

    dom.addEventListener('touchstart', handlePointerDown, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });
    window.addEventListener('touchend', handlePointerUp);

    // Wheel to Zoom
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!cameraRef.current) return;
      const newPos = cameraRef.current.position.z + e.deltaY * 0.003;
      cameraRef.current.position.z = Math.max(2.8, Math.min(8.0, newPos));
      setZoomScale(Number((5.2 / cameraRef.current.position.z).toFixed(2)));
    };
    dom.addEventListener('wheel', handleWheel, { passive: false });

    // Raycaster for Area & Pin Clicks on the 3D Canvas
    const raycaster = new THREE.Raycaster();
    const mouseCoord = new THREE.Vector2();

    // Hover detection over 3D anatomical structures
    const handleCanvasMouseMove = (e: MouseEvent) => {
      if (isDragging || !cameraRef.current || !brainGroupRef.current) return;
      const rect = dom.getBoundingClientRect();
      mouseCoord.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseCoord.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouseCoord, cameraRef.current);
      
      // Check pins first
      let hoveredId: string | null = null;
      if (pinsGroupRef.current && pinsGroupRef.current.visible) {
        const pinHits = raycaster.intersectObjects(pinsGroupRef.current.children, true);
        if (pinHits.length > 0) {
          let p: THREE.Object3D | null = pinHits[0].object.parent;
          while (p && !p.name.startsWith('pin_') && p !== pinsGroupRef.current) {
            p = p.parent;
          }
          if (p && p.name.startsWith('pin_')) {
            hoveredId = p.name.replace('pin_', '');
          }
        }
      }

      // Check brain geometry if not on pin
      if (!hoveredId && brainGroupRef.current) {
        const hits = raycaster.intersectObjects(brainGroupRef.current.children, true);
        const validHits = hits.filter(h => h.object !== slicePlaneRef.current && (h.object as any).isMesh);
        if (validHits.length > 0) {
          const hitLocal = validHits[0].point.clone();
          brainGroupRef.current.worldToLocal(hitLocal);
          let minDist = Infinity;
          let closest = BRAIN_REGIONS[0];
          for (const reg of BRAIN_REGIONS) {
            const dx = hitLocal.x - reg.pinPosition[0];
            const dy = hitLocal.y - reg.pinPosition[1];
            const dz = hitLocal.z - reg.pinPosition[2];
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (dist < minDist) {
              minDist = dist;
              closest = reg;
            }
          }
          hoveredId = closest.id;
        }
      }

      if (hoveredId) {
        dom.style.cursor = 'pointer';
        const reg = BRAIN_REGIONS.find(r => r.id === hoveredId) || null;
        setHoveredRegion(reg);
      } else {
        dom.style.cursor = 'grab';
        setHoveredRegion(null);
      }
    };
    dom.addEventListener('mousemove', handleCanvasMouseMove);

    const handleCanvasClick = (e: MouseEvent) => {
      // Ignore clicks if user was actively dragging/rotating
      if (dragDisplacement > 8) return;
      if (!cameraRef.current || !brainGroupRef.current) return;

      const rect = dom.getBoundingClientRect();
      mouseCoord.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseCoord.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouseCoord, cameraRef.current);

      let targetRegionId: string | null = null;

      // 1. Raycast pins group
      if (pinsGroupRef.current && pinsGroupRef.current.visible) {
        const pinIntersects = raycaster.intersectObjects(pinsGroupRef.current.children, true);
        if (pinIntersects.length > 0) {
          let parent: THREE.Object3D | null = pinIntersects[0].object.parent;
          while (parent && !parent.name.startsWith('pin_') && parent !== pinsGroupRef.current) {
            parent = parent.parent;
          }
          if (parent && parent.name.startsWith('pin_')) {
            targetRegionId = parent.name.replace('pin_', '');
          }
        }
      }

      // 2. If no pin clicked directly, raycast the entire 3D brain mesh hierarchy
      if (!targetRegionId && brainGroupRef.current) {
        const meshIntersects = raycaster.intersectObjects(brainGroupRef.current.children, true);
        const validIntersects = meshIntersects.filter(
          item => item.object !== slicePlaneRef.current && (item.object as any).isMesh
        );

        if (validIntersects.length > 0) {
          const hitPoint = validIntersects[0].point.clone();
          brainGroupRef.current.worldToLocal(hitPoint);

          // Find the anatomically closest brain region
          let minDistance = Infinity;
          let closestRegion = BRAIN_REGIONS[0];
          for (const region of BRAIN_REGIONS) {
            const dx = hitPoint.x - region.pinPosition[0];
            const dy = hitPoint.y - region.pinPosition[1];
            const dz = hitPoint.z - region.pinPosition[2];
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (dist < minDistance) {
              minDistance = dist;
              closestRegion = region;
            }
          }
          targetRegionId = closestRegion.id;
        }
      }

      if (targetRegionId) {
        const matched = BRAIN_REGIONS.find(r => r.id === targetRegionId);
        if (matched) {
          setSelectedRegionId(matched.id);
          setAutoRotate(false);

          const calloutX = Math.max(90, Math.min(rect.width - 90, e.clientX - rect.left));
          const calloutY = Math.max(50, Math.min(rect.height - 50, e.clientY - rect.top));

          setClickCallout({
            name: matched.name,
            latinName: matched.latinName,
            color: matched.color,
            category: matched.category,
            ctSliceLevel: matched.ctSliceLevel,
            x: calloutX,
            y: calloutY,
          });
        }
      }
    };
    dom.addEventListener('click', handleCanvasClick);

    // Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries[0] || !rendererRef.current || !cameraRef.current) return;
      const newW = entries[0].contentRect.width;
      const newH = entries[0].contentRect.height;
      if (newW && newH) {
        cameraRef.current.aspect = newW / newH;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(newW, newH);
      }
    });
    resizeObserver.observe(container);

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      if (autoRotateRef.current && !isDragging && brainGroupRef.current) {
        brainGroupRef.current.rotation.y += delta * 0.35 * rotationSpeedRef.current * rotationDirectionRef.current;
      }

      // Keep pins facing the camera
      if (pinsGroupRef.current && cameraRef.current) {
        pinsGroupRef.current.children.forEach(pin => {
          pin.children[0]?.lookAt(cameraRef.current!.position);
        });
      }

      // Keep selection beacon oriented toward camera with dynamic radar ripple
      if (selectionBeaconRef.current && cameraRef.current) {
        const ring = selectionBeaconRef.current.getObjectByName('beacon_ring') as THREE.Mesh;
        const ripple = selectionBeaconRef.current.getObjectByName('beacon_ripple') as THREE.Mesh;
        if (ring) {
          ring.lookAt(cameraRef.current.position);
          ring.rotation.z += delta * 1.6;
        }
        if (ripple) {
          ripple.lookAt(cameraRef.current.position);
          const t = (clock.getElapsedTime() * 1.7) % 1;
          ripple.scale.setScalar(1 + t * 0.95);
          const rippleMat = ripple.material as THREE.MeshBasicMaterial;
          if (rippleMat) {
            rippleMat.opacity = (1 - t) * 0.7;
          }
        }
      }

      if (vrModeRef.current) {
        const width = container.clientWidth;
        const height = container.clientHeight;
        const halfW = width / 2;

        renderer.setScissorTest(true);

        // Left Eye
        renderer.setViewport(0, 0, halfW, height);
        renderer.setScissor(0, 0, halfW, height);
        camera.position.x = -0.032;
        renderer.render(scene, camera);

        // Right Eye
        renderer.setViewport(halfW, 0, halfW, height);
        renderer.setScissor(halfW, 0, halfW, height);
        camera.position.x = 0.032;
        renderer.render(scene, camera);

        renderer.setScissorTest(false);
        camera.position.x = 0;
      } else {
        renderer.setViewport(0, 0, container.clientWidth, container.clientHeight);
        renderer.render(scene, camera);
      }
    };
    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();

      dom.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);

      dom.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
      dom.removeEventListener('wheel', handleWheel);
      dom.removeEventListener('mousemove', handleCanvasMouseMove);
      dom.removeEventListener('click', handleCanvasClick);

      leftHemGeo.dispose();
      rightHemGeo.dispose();
      leftCerebGeo.dispose();
      rightCerebGeo.dispose();
      vermisGeo.dispose();
      planeGeo.dispose();
      corticalMaterial.dispose();
      renderer.dispose();
      if (container.contains(dom)) {
        container.removeChild(dom);
      }
    };
  }, []);

  // Update Materials and Synchronized Multi-Structure Highlighting based on Render Mode & Selected Region
  useEffect(() => {
    if (!brainGroupRef.current) return;
    const group = brainGroupRef.current;

    const leftCerebrum = group.getObjectByName('left_cerebrum') as THREE.Mesh;
    const rightCerebrum = group.getObjectByName('right_cerebrum') as THREE.Mesh;
    const leftCereb = group.getObjectByName('left_cerebellum') as THREE.Mesh;
    const rightCereb = group.getObjectByName('right_cerebellum') as THREE.Mesh;

    if (!leftCerebrum || !rightCerebrum) return;

    // 1. Dynamic Per-Vertex Cortical Lobar Highlight
    applyCorticalHighlight(selectedRegion);

    // 2. Translucent Reveal for Deep / Fluid / Vascular Structures or Cortical Peel Slider
    const isInternalStructure = selectedRegion.category === 'deep' || 
                                selectedRegion.category === 'fluid' || 
                                selectedRegion.category === 'vascular';

    const effectiveOpacity = cortexOpacity < 1.0 ? cortexOpacity : (isInternalStructure && renderMode === 'photoreal' ? 0.28 : 1.0);
    const isTranslucent = effectiveOpacity < 1.0;

    if (renderMode === 'photoreal') {
      // Natural Organic Brain Cortex with Deep Sulci Vertex Shadows & Pia Mater CSF Sheen
      const photorealMat = new THREE.MeshPhysicalMaterial({
        vertexColors: true,
        roughness: 0.28,
        metalness: 0.05,
        clearcoat: 0.82,
        clearcoatRoughness: 0.06,
        transmission: isTranslucent ? 0.85 : 0.08,
        thickness: 0.5,
        sheen: 0.85,
        sheenColor: new THREE.Color(0xfef3c7),
        reflectivity: 0.65,
        transparent: isTranslucent,
        opacity: effectiveOpacity,
        depthWrite: !isTranslucent,
      });
      leftCerebrum.material = photorealMat;
      rightCerebrum.material = photorealMat.clone();
      if (leftCereb && rightCereb) {
        leftCereb.material = photorealMat.clone();
        rightCereb.material = photorealMat.clone();
      }
    } else if (renderMode === 'anatomic') {
      // Functional Lobar Highlighting with active color
      const activeColor = new THREE.Color(selectedRegion.color);
      const anatomicMat = new THREE.MeshStandardMaterial({
        color: activeColor,
        roughness: 0.38,
        metalness: 0.15,
        emissive: activeColor,
        emissiveIntensity: 0.18,
        transparent: isTranslucent,
        opacity: effectiveOpacity,
        depthWrite: !isTranslucent,
      });
      leftCerebrum.material = anatomicMat;
      rightCerebrum.material = anatomicMat.clone();
      if (leftCereb && rightCereb) {
        const cerebColor = selectedRegionId === 'cerebellum' ? new THREE.Color('#ec4899') : new THREE.Color('#f472b6');
        const cerebMat = new THREE.MeshStandardMaterial({ color: cerebColor, roughness: 0.45, transparent: isTranslucent, opacity: effectiveOpacity });
        leftCereb.material = cerebMat;
        rightCereb.material = cerebMat.clone();
      }
    } else if (renderMode === 'ct_window') {
      // Diagnostic Head CT Soft Tissue Parenchymal Window (30-40 HU)
      const ctMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        roughness: 0.65,
        metalness: 0.05,
        transparent: isTranslucent,
        opacity: effectiveOpacity,
      });
      leftCerebrum.material = ctMat;
      rightCerebrum.material = ctMat.clone();
      if (leftCereb && rightCereb) {
        leftCereb.material = ctMat.clone();
        rightCereb.material = ctMat.clone();
      }
    } else if (renderMode === 'wireframe') {
      // 3D Neural Wireframe Mesh
      const wireMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        wireframe: true,
        roughness: 0.2,
        transparent: isTranslucent,
        opacity: effectiveOpacity,
      });
      leftCerebrum.material = wireMat;
      rightCerebrum.material = wireMat.clone();
      if (leftCereb && rightCereb) {
        leftCereb.material = wireMat.clone();
        rightCereb.material = wireMat.clone();
      }
    } else if (renderMode === 'transparent_cortex') {
      // Transparent Cortical Glass revealing internal Circle of Willis, Ventricles, & Thalamus
      const transMat = new THREE.MeshPhysicalMaterial({
        color: 0xe0f2fe,
        transparent: true,
        opacity: Math.min(effectiveOpacity, 0.25),
        transmission: 0.88,
        roughness: 0.12,
        depthWrite: false,
      });
      leftCerebrum.material = transMat;
      rightCerebrum.material = transMat.clone();
      if (leftCereb && rightCereb) {
        leftCereb.material = transMat.clone();
        rightCereb.material = transMat.clone();
      }
    }

    // 3. Highlight Ventricular System (CSF Glowing Resonance)
    if (ventriclesGroupRef.current) {
      const isVentricle = selectedRegion.id === 'ventricles' || selectedRegion.category === 'fluid';
      ventriclesGroupRef.current.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mat = (child as THREE.Mesh).material as THREE.MeshPhysicalMaterial;
          if (mat) {
            mat.emissive = new THREE.Color(isVentricle ? 0x00f5ff : 0x0284c7);
            mat.emissiveIntensity = isVentricle ? 2.0 : 0.65;
          }
        }
      });
    }

    // 4. Highlight Circle of Willis & Arteries
    if (arteriesGroupRef.current) {
      const isArtery = selectedRegion.id === 'circle_of_willis' || selectedRegion.category === 'vascular';
      arteriesGroupRef.current.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
          if (mat) {
            mat.emissive = new THREE.Color(isArtery ? 0xff2200 : 0x991b1b);
            mat.emissiveIntensity = isArtery ? 2.2 : 0.55;
          }
        }
      });
    }

    // 5. Highlight Deep Nuclei (Thalamus & Corpus Callosum)
    if (deepNucleiGroupRef.current) {
      const isThalamus = selectedRegion.id === 'thalamus';
      const isCC = selectedRegion.id === 'corpus_callosum';
      const isBG = selectedRegion.id === 'basal_ganglia';

      deepNucleiGroupRef.current.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const m = child as THREE.Mesh;
          const mat = m.material as THREE.MeshStandardMaterial;
          if (mat) {
            if (m.geometry.type === 'SphereGeometry') {
              // Thalamus bilateral masses
              mat.emissive = new THREE.Color(isThalamus || isBG ? 0xf43f5e : 0x831843);
              mat.emissiveIntensity = isThalamus || isBG ? 2.0 : 0.3;
            } else {
              // Corpus Callosum
              mat.emissive = new THREE.Color(isCC ? 0xf59e0b : 0x78350f);
              mat.emissiveIntensity = isCC ? 2.0 : 0.3;
            }
          }
        }
      });
    }

    // 6. Highlight Cerebellum & Posterior Fossa
    const isCereb = selectedRegion.id === 'cerebellum';
    if (leftCereb && rightCereb && isCereb) {
      const cerebMat = new THREE.MeshStandardMaterial({
        color: 0xec4899,
        emissive: 0xbe185d,
        emissiveIntensity: 1.4,
        roughness: 0.32,
      });
      leftCereb.material = cerebMat;
      rightCereb.material = cerebMat.clone();
    }

    // 7. Highlight Brainstem (Pons & Medulla)
    const brainstemGroup = group.getObjectByName('brainstem_group') as THREE.Group;
    const isBrainstem = selectedRegion.id === 'pons' || selectedRegion.id === 'medulla';
    if (brainstemGroup) {
      brainstemGroup.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
          if (mat) {
            mat.emissive = new THREE.Color(isBrainstem ? 0x06b6d4 : 0x000000);
            mat.emissiveIntensity = isBrainstem ? 1.8 : 0;
          }
        }
      });
    }

    // 8. Synchronize 3D Holographic Selection Beacon
    if (selectionBeaconRef.current) {
      selectionBeaconRef.current.position.set(...selectedRegion.pinPosition);
      const ring = selectionBeaconRef.current.getObjectByName('beacon_ring') as THREE.Mesh;
      const ripple = selectionBeaconRef.current.getObjectByName('beacon_ripple') as THREE.Mesh;
      const pointer = selectionBeaconRef.current.getObjectByName('beacon_pointer') as THREE.Mesh;
      if (ring) {
        (ring.material as THREE.MeshBasicMaterial).color.set(selectedRegion.color);
      }
      if (ripple) {
        (ripple.material as THREE.MeshBasicMaterial).color.set(selectedRegion.color);
      }
      if (pointer) {
        (pointer.material as THREE.MeshBasicMaterial).color.set(selectedRegion.color);
      }
    }
  }, [renderMode, selectedRegionId, selectedRegion]);

  // Toggle Visibility of Arteries, Ventricles, Slice Plane, and Pins
  useEffect(() => {
    if (arteriesGroupRef.current) {
      arteriesGroupRef.current.visible = showArteries;
    }
  }, [showArteries]);

  useEffect(() => {
    if (ventriclesGroupRef.current) {
      ventriclesGroupRef.current.visible = showVentricles;
    }
    if (deepNucleiGroupRef.current) {
      deepNucleiGroupRef.current.visible = showVentricles || renderMode === 'transparent_cortex';
    }
  }, [showVentricles, renderMode]);

  useEffect(() => {
    if (pinsGroupRef.current) {
      pinsGroupRef.current.visible = showPins;
    }
  }, [showPins]);

  useEffect(() => {
    if (!slicePlaneRef.current) return;
    const plane = slicePlaneRef.current;
    plane.visible = showSlicePlane;

    if (sliceAxis === 'axial') {
      plane.rotation.set(-Math.PI / 2, 0, 0);
      plane.position.set(0, slicePosition, 0);
    } else if (sliceAxis === 'coronal') {
      plane.rotation.set(0, 0, 0);
      plane.position.set(0, 0, slicePosition);
    } else {
      // sagittal
      plane.rotation.set(0, Math.PI / 2, 0);
      plane.position.set(slicePosition, 0, 0);
    }
  }, [showSlicePlane, slicePosition, sliceAxis]);

  // Preset Camera Angles
  const handleSetPresetView = (view: 'lateral_left' | 'lateral_right' | 'anterior' | 'superior' | 'inferior_skull_base' | 'axial_ct') => {
    if (!brainGroupRef.current || !cameraRef.current) return;
    setAutoRotate(false);

    cameraRef.current.position.set(0, 1.2, 5.2);
    setZoomScale(1);

    if (view === 'lateral_left') {
      brainGroupRef.current.rotation.set(0, Math.PI / 2, 0);
    } else if (view === 'lateral_right') {
      brainGroupRef.current.rotation.set(0, -Math.PI / 2, 0);
    } else if (view === 'anterior') {
      brainGroupRef.current.rotation.set(0, 0, 0);
    } else if (view === 'superior') {
      brainGroupRef.current.rotation.set(Math.PI / 2.2, 0, 0);
    } else if (view === 'inferior_skull_base') {
      brainGroupRef.current.rotation.set(-Math.PI / 2.1, 0, 0);
    } else if (view === 'axial_ct') {
      brainGroupRef.current.rotation.set(Math.PI / 2.05, 0, 0);
      setShowSlicePlane(true);
    }
  };

  const handleSelectCategory = (cat: 'all' | 'cortex' | 'deep' | 'vascular' | 'posterior' | 'fluid') => {
    setActiveCategory(cat);

    // If active selected region is not part of this compartment, switch to first item in this compartment
    if (cat !== 'all') {
      const matching = BRAIN_REGIONS.filter(r => r.category === cat);
      if (matching.length > 0 && selectedRegion.category !== cat) {
        handleSelectRegion(matching[0].id);
      }
    }

    // Orient 3D camera and enable layers corresponding to this anatomical compartment
    if (cat === 'cortex') {
      setRenderMode('photoreal');
    } else if (cat === 'deep' || cat === 'fluid') {
      setShowVentricles(true);
      if (brainGroupRef.current) {
        brainGroupRef.current.rotation.set(0.35, 0.25, 0);
      }
    } else if (cat === 'vascular') {
      setShowArteries(true);
      if (brainGroupRef.current) {
        brainGroupRef.current.rotation.set(-0.65, 0, 0);
      }
    } else if (cat === 'posterior') {
      if (brainGroupRef.current) {
        brainGroupRef.current.rotation.set(-0.15, Math.PI, 0);
      }
    }
  };

  const handleSelectRegion = (id: string) => {
    setSelectedRegionId(id);
    setAutoRotate(false);

    const reg = BRAIN_REGIONS.find(r => r.id === id);
    if (reg) {
      // Auto-enable structural visibility if selecting deep/fluid/vascular structure
      if (reg.category === 'fluid' || reg.id === 'ventricles') {
        setShowVentricles(true);
      }
      if (reg.category === 'vascular' || reg.id === 'circle_of_willis') {
        setShowArteries(true);
      }

      if (brainGroupRef.current) {
        if (reg.cameraAngle) {
          brainGroupRef.current.rotation.x = reg.cameraAngle.x;
          brainGroupRef.current.rotation.y = reg.cameraAngle.y;
        } else {
          const [px, py, pz] = reg.pinPosition;
          const targetY = Math.atan2(px, pz);
          brainGroupRef.current.rotation.y = -targetY;
          brainGroupRef.current.rotation.x = -py * 0.25;
        }
      }
    }
  };

  const handleZoom = (delta: number) => {
    if (!cameraRef.current) return;
    const newZ = cameraRef.current.position.z + delta;
    cameraRef.current.position.z = Math.max(2.8, Math.min(7.5, newZ));
    setZoomScale(Number((5.2 / cameraRef.current.position.z).toFixed(2)));
  };

  return (
    <div ref={containerWrapperRef} className={`w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl text-white ${isFullscreen ? 'fixed inset-0 z-50 rounded-none overflow-y-auto' : ''}`}>
      {/* Top Banner Header */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0 border border-indigo-500/30 shadow-inner">
            <Brain className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Continuous Neuroanatomy & CT Bridge
              </span>
              <span className="text-xs text-emerald-400 font-semibold hidden sm:inline flex items-center gap-1">
                • 16 Anatomical Structures & Circle of Willis
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Brain Map
              <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                High-Fidelity 3D Model
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
              Anatomically sculpted cerebral hemispheres with realistic gyri/sulci convolutions, the Sylvian fissure, Circle of Willis arterial tree, ventricular system, and brainstem. Click any region to inspect clinical Head CT correlations.
            </p>
          </div>
        </div>

        {/* Global Action Bar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
              autoRotate 
                ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/40' 
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
            title="Toggle 360° Auto-Rotation"
          >
            <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
            <span>{autoRotate ? 'Rotating' : 'Paused'}</span>
          </button>

          <button
            onClick={() => handleSetPresetView('anterior')}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Reset Camera to Anterior"
          >
            <Compass className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              if (!containerWrapperRef.current) return;
              if (!document.fullscreenElement) {
                containerWrapperRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(console.error);
              } else {
                document.exitFullscreen().then(() => setIsFullscreen(false)).catch(console.error);
              }
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors text-xs font-semibold flex items-center gap-1.5"
            title="Toggle Fullscreen View"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
          </button>

          <div className="h-6 w-px bg-slate-800 hidden sm:block"></div>

          {onExploreHeadCt && (
            <button
              onClick={onExploreHeadCt}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5"
            >
              <span>Jump to Head CTs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Layer Toggles & Preset Orientation Toolbar */}
      <div className="px-5 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-3 overflow-x-auto scrollbar-none text-xs">
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Anatomical Views:
          </span>
          <button
            onClick={() => handleSetPresetView('anterior')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Anterior
          </button>
          <button
            onClick={() => handleSetPresetView('lateral_left')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Left Lateral
          </button>
          <button
            onClick={() => handleSetPresetView('lateral_right')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Right Lateral
          </button>
          <button
            onClick={() => handleSetPresetView('superior')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Superior (Vertex)
          </button>
          <button
            onClick={() => handleSetPresetView('inferior_skull_base')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 transition-colors"
          >
            Skull Base / Arteries
          </button>
          <button
            onClick={() => handleSetPresetView('axial_ct')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-500/30 transition-colors"
          >
            CT Axial Plane
          </button>
        </div>

        {/* Anatomical Layer Visibility Toggles */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setShowArteries(!showArteries)}
            className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 border transition-all ${
              showArteries
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-slate-800 text-slate-500 border-slate-700'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
            <span>Circle of Willis</span>
          </button>

          <button
            onClick={() => setShowVentricles(!showVentricles)}
            className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 border transition-all ${
              showVentricles
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-800 text-slate-500 border-slate-700'
            }`}
          >
            <Split className="w-3.5 h-3.5 text-cyan-400" />
            <span>Ventricles & Thalamus</span>
          </button>
        </div>

        {/* 360° Rotation Speed & Pause Controls */}
        <div className="flex items-center gap-2 flex-shrink-0 pl-3 border-l border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            360° Rotation:
          </span>
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 border transition-all ${
              autoRotate
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
            }`}
            title={autoRotate ? "Stop 360° rotation" : "Resume 360° rotation"}
          >
            {autoRotate ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                <span>Stop</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-emerald-300 text-emerald-300" />
                <span>Rotate</span>
              </>
            )}
          </button>

          {/* Speed Slider */}
          <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
            <Gauge className="w-3 h-3 text-slate-400" />
            <span className="text-[10px] text-slate-400 font-mono">Speed:</span>
            <input
              type="range"
              min="0.2"
              max="3.0"
              step="0.1"
              value={rotationSpeed}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setRotationSpeed(val);
                if (!autoRotate) setAutoRotate(true);
              }}
              className="w-16 sm:w-20 accent-blue-500 h-1 bg-slate-800 rounded cursor-pointer"
              title={`Speed: ${rotationSpeed.toFixed(1)}x`}
            />
            <span className="text-[10px] text-blue-400 font-mono font-bold w-7 text-right">
              {rotationSpeed.toFixed(1)}x
            </span>
          </div>

          {/* Direction Toggle */}
          <button
            onClick={() => setRotationDirection(prev => prev === 1 ? -1 : 1)}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title={`Reverse direction (${rotationDirection === 1 ? 'Clockwise' : 'Counter-Clockwise'})`}
          >
            {rotationDirection === 1 ? (
              <RotateCw className="w-3.5 h-3.5" />
            ) : (
              <RotateCcw className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Main 3D Canvas & Anatomy Sidebar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        
        {/* Left / Center 3D Interactive Viewport */}
        <div className="lg:col-span-7 xl:col-span-8 relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 min-h-[480px] flex items-center justify-center select-none overflow-hidden group">
          
          {/* 3D WebGL Canvas Mount */}
          <div ref={mountRef} className="w-full h-[500px] cursor-grab active:cursor-grabbing" />

          {/* Floating Canvas Top Overlay: Rendering Mode Selector */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
            <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800 pointer-events-auto shadow-2xl">
              {(['photoreal', 'anatomic', 'transparent_cortex', 'ct_window', 'wireframe'] as RenderMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setRenderMode(mode)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all ${
                    renderMode === mode
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {mode === 'photoreal' && 'Realistic Cortex'}
                  {mode === 'anatomic' && 'Lobar Regions'}
                  {mode === 'transparent_cortex' && 'Deep Vessels/Ventricles'}
                  {mode === 'ct_window' && 'CT Parenchyma'}
                  {mode === 'wireframe' && 'Neural Mesh'}
                </button>
              ))}
            </div>

            {/* Quick Controls: Rotation Speed & Zoom */}
            <div className="flex items-center gap-2 pointer-events-auto">
              {/* Rotation Stop/Play & Speed Pod */}
              <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-2xl border border-slate-800 shadow-xl">
                {/* Stop / Rotate Toggle */}
                <button
                  onClick={() => setAutoRotate(!autoRotate)}
                  className={`px-2 py-1 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                    autoRotate
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                  }`}
                  title={autoRotate ? "Stop 360° Rotation" : "Start 360° Rotation"}
                >
                  {autoRotate ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                      <span className="hidden sm:inline">Stop</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-emerald-300 text-emerald-300" />
                      <span className="hidden sm:inline">Rotate</span>
                    </>
                  )}
                </button>

                {/* Speed Presets */}
                <div className="flex items-center gap-0.5 px-0.5">
                  {[0.5, 1.0, 2.0].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => {
                        setRotationSpeed(spd);
                        if (!autoRotate) setAutoRotate(true);
                      }}
                      className={`px-1.5 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                        autoRotate && rotationSpeed === spd
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                      title={`Set speed to ${spd}x`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>

                {/* Direction Flip */}
                <button
                  onClick={() => setRotationDirection(prev => prev === 1 ? -1 : 1)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                  title={`Direction: ${rotationDirection === 1 ? 'Clockwise' : 'Counter-Clockwise'}`}
                >
                  {rotationDirection === 1 ? (
                    <RotateCw className="w-3.5 h-3.5" />
                  ) : (
                    <RotateCcw className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Quick Zoom In / Out Buttons */}
              <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-2xl border border-slate-800 shadow-xl">
                <button
                  onClick={() => handleZoom(-0.6)}
                  className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <span className="text-[10px] text-slate-400 font-mono px-1">
                  {Math.round(zoomScale * 100)}%
                </span>
                <button
                  onClick={() => handleZoom(0.6)}
                  className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Floating Canvas Bottom Overlay: CT Slice Plane Simulator & Cortical Peel */}
          <div className="absolute bottom-4 left-4 right-4 bg-slate-900/95 backdrop-blur-md p-3 rounded-2xl border border-slate-800 pointer-events-auto z-10 flex flex-col gap-2.5 shadow-2xl">
            {/* Top row: CT Slice plane and Toggles */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold">
                  <Layers className="w-4 h-4 text-sky-400" />
                  <span>CT Slicing Plane:</span>
                </div>
                <button
                  onClick={() => setShowSlicePlane(!showSlicePlane)}
                  className={`text-[10px] px-2 py-0.5 rounded-lg font-bold border transition-all ${
                    showSlicePlane
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                      : 'bg-slate-800 text-slate-500 border-slate-700'
                  }`}
                >
                  {showSlicePlane ? 'Visible' : 'Hidden'}
                </button>
              </div>

              {showSlicePlane && (
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="flex items-center gap-1">
                    {(['axial', 'coronal', 'sagittal'] as const).map(axis => (
                      <button
                        key={axis}
                        onClick={() => setSliceAxis(axis)}
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-lg transition-all ${
                          sliceAxis === axis
                            ? 'bg-sky-600 text-white'
                            : 'text-slate-400 hover:text-slate-200 bg-slate-800'
                        }`}
                      >
                        {axis}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 flex-1 sm:w-36">
                    <span className="text-[10px] text-slate-400 font-mono">-1.5</span>
                    <input
                      type="range"
                      min="-1.5"
                      max="1.5"
                      step="0.05"
                      value={slicePosition}
                      onChange={(e) => setSlicePosition(parseFloat(e.target.value))}
                      className="w-full accent-sky-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-400 font-mono">+1.5</span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPins(!showPins)}
                  className={`text-[10px] px-2 py-1 rounded-lg font-semibold flex items-center gap-1 border transition-all ${
                    showPins 
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' 
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  <Crosshair className="w-3 h-3" />
                  <span>{showPins ? 'Pins On' : 'Pins Off'}</span>
                </button>

                <button
                  onClick={() => setShowCanvasAnnotations(!showCanvasAnnotations)}
                  className={`text-[10px] px-2 py-1 rounded-lg font-semibold flex items-center gap-1 border transition-all ${
                    showCanvasAnnotations 
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/30' 
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                  title="Toggle 3D textual annotations over major brain structures"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{showCanvasAnnotations ? 'Labels On' : 'Labels Off'}</span>
                </button>

                <button
                  onClick={async () => {
                    if (!spatialMode) {
                      if (typeof (DeviceOrientationEvent as any)?.requestPermission === 'function') {
                        try {
                          const res = await (DeviceOrientationEvent as any).requestPermission();
                          if (res === 'granted') {
                            setSpatialMode(true);
                            setAutoRotate(false);
                          }
                        } catch (err) {
                          console.error(err);
                        }
                      } else {
                        setSpatialMode(true);
                        setAutoRotate(false);
                      }
                    } else {
                      setSpatialMode(false);
                      setVrMode(false);
                    }
                  }}
                  className={`text-[10px] px-2 py-1 rounded-lg font-semibold flex items-center gap-1 border transition-all ${
                    spatialMode 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                  title="Use device gyroscope or mouse movement to inspect the model in spatial mode"
                >
                  <Compass className="w-3 h-3" />
                  <span>{spatialMode ? 'Spatial: On' : 'Spatial Mode'}</span>
                </button>

                <button
                  onClick={() => {
                    const next = !vrMode;
                    setVrMode(next);
                    if (next) setSpatialMode(true);
                  }}
                  className={`text-[10px] px-2 py-1 rounded-lg font-semibold flex items-center gap-1 border transition-all ${
                    vrMode 
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' 
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                  title="Toggle Google Cardboard stereoscopic side-by-side VR view"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>{vrMode ? 'VR: On' : 'Cardboard VR'}</span>
                </button>
              </div>
            </div>

            {/* Bottom row: Cortical Peel / Transparency Dissection Slider */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-300 font-medium">
                <Eye className="w-3.5 h-3.5 text-pink-400" />
                <span className="text-[11px]">Cortical Peel / Dissection Transparency:</span>
              </div>
              <div className="flex items-center gap-2 w-44 sm:w-56">
                <span className="text-[10px] text-slate-400 font-mono">Opaque</span>
                <input
                  type="range"
                  min="0.15"
                  max="1.0"
                  step="0.05"
                  value={cortexOpacity}
                  onChange={(e) => setCortexOpacity(parseFloat(e.target.value))}
                  className="w-full accent-pink-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  title="Peel away cortex to reveal deep ventricles and Circle of Willis"
                />
                <span className="text-[10px] text-pink-400 font-mono font-bold w-9 text-right">
                  {Math.round(cortexOpacity * 100)}%
                </span>
              </div>
            </div>

            {/* Cross-Sectional Slice Fade & Circle of Willis Quick Label */}
            <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-300 font-medium">
                <Sliders className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-[11px]">Surface ⇄ Cross-Sectional Slice:</span>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="flex items-center gap-2 w-44 sm:w-56">
                  <span className="text-[10px] text-slate-400 font-mono">Surface</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={surfaceVsSliceFade}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setSurfaceVsSliceFade(val);
                      if (val > 0.1) {
                        setShowSlicePlane(true);
                        setSlicePosition(THREE.MathUtils.lerp(0.2, -0.8, val));
                      } else {
                        setShowSlicePlane(false);
                      }
                    }}
                    className="w-full accent-sky-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    title="Fade between 3D surface view and cross-sectional slice view"
                  />
                  <span className="text-[10px] text-sky-400 font-mono font-bold w-9 text-right">
                    {Math.round(surfaceVsSliceFade * 100)}%
                  </span>
                </div>

                <button
                  onClick={() => {
                    setSelectedRegionId('circle_of_willis');
                    setSurfaceVsSliceFade(0.65);
                    setShowSlicePlane(true);
                    setSlicePosition(-0.35);
                  }}
                  className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 rounded-xl font-bold text-[10px] flex items-center gap-1.5 transition-all shadow-md"
                  title="Instantly label and inspect the Circle of Willis"
                >
                  <HeartPulse className="w-3 h-3 text-red-400 animate-pulse" />
                  <span>Label Circle of Willis</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3D Canvas Textual Annotations Overlay for Learning */}
          {showCanvasAnnotations && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
              {/* Frontal Lobe Annotation */}
              <div className="absolute top-[28%] left-[58%] transform -translate-x-1/2 pointer-events-auto cursor-pointer" onClick={() => setSelectedRegionId('prefrontal')}>
                <div className="bg-slate-900/85 backdrop-blur-md text-white px-2.5 py-1.5 rounded-lg border border-blue-500/50 shadow-xl flex items-center gap-1.5 hover:scale-105 transition-transform">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-[11px] font-bold">Frontal Lobe (Prefrontal)</span>
                </div>
              </div>

              {/* Cerebellum Annotation */}
              <div className="absolute bottom-[32%] right-[22%] pointer-events-auto cursor-pointer" onClick={() => setSelectedRegionId('cerebellum')}>
                <div className="bg-slate-900/85 backdrop-blur-md text-white px-2.5 py-1.5 rounded-lg border border-pink-500/50 shadow-xl flex items-center gap-1.5 hover:scale-105 transition-transform">
                  <span className="w-2 h-2 rounded-full bg-pink-500" />
                  <span className="text-[11px] font-bold">Cerebellum</span>
                </div>
              </div>

              {/* Brainstem / Pons Annotation */}
              <div className="absolute bottom-[22%] left-[48%] transform -translate-x-1/2 pointer-events-auto cursor-pointer" onClick={() => setSelectedRegionId('pons')}>
                <div className="bg-slate-900/85 backdrop-blur-md text-white px-2.5 py-1.5 rounded-lg border border-teal-500/50 shadow-xl flex items-center gap-1.5 hover:scale-105 transition-transform">
                  <span className="w-2 h-2 rounded-full bg-teal-400" />
                  <span className="text-[11px] font-bold">Brainstem (Pons)</span>
                </div>
              </div>

              {/* Circle of Willis Annotation */}
              <div className="absolute bottom-[40%] left-[38%] pointer-events-auto cursor-pointer" onClick={() => setSelectedRegionId('circle_of_willis')}>
                <div className="bg-slate-900/85 backdrop-blur-md text-white px-2.5 py-1.5 rounded-lg border border-red-500/60 shadow-xl flex items-center gap-1.5 hover:scale-105 transition-transform">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <span className="text-[11px] font-bold text-red-300">Circle of Willis (Arteries)</span>
                </div>
              </div>

              {/* Occipital Lobe Annotation */}
              <div className="absolute top-[42%] left-[22%] pointer-events-auto cursor-pointer" onClick={() => setSelectedRegionId('occipital')}>
                <div className="bg-slate-900/85 backdrop-blur-md text-white px-2.5 py-1.5 rounded-lg border border-amber-500/50 shadow-xl flex items-center gap-1.5 hover:scale-105 transition-transform">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-[11px] font-bold">Occipital Lobe</span>
                </div>
              </div>

              {/* Hippocampus Annotation */}
              <div className="absolute top-[52%] right-[32%] pointer-events-auto cursor-pointer" onClick={() => setSelectedRegionId('hippocampus_amygdala')}>
                <div className="bg-slate-900/85 backdrop-blur-md text-white px-2.5 py-1.5 rounded-lg border border-orange-500/50 shadow-xl flex items-center gap-1.5 hover:scale-105 transition-transform">
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  <span className="text-[11px] font-bold">Hippocampus & Amygdala</span>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Hint Indicator */}
          <div className="absolute bottom-18 left-1/2 -translate-x-1/2 pointer-events-none transition-all">
            <span className="text-[10px] bg-slate-950/85 px-3.5 py-1 rounded-full text-slate-300 border border-slate-800 backdrop-blur-sm flex items-center gap-1.5 shadow-lg">
              {autoRotate ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>360° Rotation ({rotationSpeed.toFixed(1)}x) • Click Stop to freeze or drag manually</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>Rotation paused • Drag to rotate 360° or click Rotate to resume</span>
                </>
              )}
            </span>
          </div>

          {/* Active Selected Anatomical Area HUD Badge: Always displays the name of the area */}
          <div className="absolute top-16 left-4 z-20 pointer-events-none max-w-[280px] sm:max-w-xs transition-all">
            <div className="bg-slate-900/90 backdrop-blur-md p-3 sm:p-3.5 rounded-2xl border border-slate-700/80 shadow-2xl pointer-events-auto flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span 
                      className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                      style={{ backgroundColor: selectedRegion.color }}
                    />
                    <span 
                      className="relative inline-flex rounded-full h-2.5 w-2.5"
                      style={{ backgroundColor: selectedRegion.color }}
                    />
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                    Selected Area
                  </span>
                </div>
                <span 
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded capitalize"
                  style={{ 
                    backgroundColor: `${selectedRegion.color}20`, 
                    color: selectedRegion.color,
                    border: `1px solid ${selectedRegion.color}40`
                  }}
                >
                  {selectedRegion.category}
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-extrabold text-white leading-tight">
                {selectedRegion.name}
              </h4>
              <p className="text-[11px] italic text-indigo-300 font-medium">
                {selectedRegion.latinName}
              </p>
              <div className="text-[10px] text-slate-400 flex items-center gap-1 pt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                <span className="truncate">{selectedRegion.ctSliceLevel}</span>
              </div>
            </div>
          </div>

          {/* Floating On-Canvas Click Pin Tooltip Badge directly over clicked point */}
          {clickCallout && (
            <div 
              className="absolute z-30 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3.5 transition-all duration-200"
              style={{ left: `${clickCallout.x}px`, top: `${clickCallout.y}px` }}
            >
              <div className="bg-slate-900/95 backdrop-blur-md text-white px-3.5 py-2 rounded-xl border border-indigo-500/80 shadow-2xl flex items-center gap-2 whitespace-nowrap animate-in zoom-in-95">
                <span 
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0 animate-ping" 
                  style={{ backgroundColor: clickCallout.color }} 
                />
                <div className="text-left">
                  <p className="text-xs font-bold text-white">{clickCallout.name}</p>
                  <p className="text-[10px] text-indigo-300 italic">{clickCallout.latinName}</p>
                </div>
                {/* Arrow pointing down to clicked spot */}
                <div 
                  className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-900 absolute left-1/2 -translate-x-1/2 -bottom-1.5" 
                />
              </div>
            </div>
          )}

          {/* Hover Status Indicator */}
          {hoveredRegion && hoveredRegion.id !== selectedRegionId && (
            <div className="absolute top-16 right-4 z-20 pointer-events-none bg-slate-900/90 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-slate-700 text-xs text-slate-200 shadow-xl flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: hoveredRegion.color }} />
              <span className="text-[11px]">Hovering: <strong className="text-white">{hoveredRegion.name}</strong></span>
            </div>
          )}
        </div>

        {/* Right Anatomical Diagnostic Panel */}
        <div className="lg:col-span-5 xl:col-span-4 p-5 sm:p-6 bg-slate-900 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-800 max-h-[640px] overflow-y-auto">
          <div className="space-y-4">
            
            {/* Search Input Bar (Neurotorium style) */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4 text-sky-400" />
              </span>
              <input
                type="text"
                placeholder="Find area in the brain..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all shadow-inner"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-sky-400" />
                  Anatomical Compartments
                </span>
                <span className="text-[10px] text-indigo-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {filteredRegions.length} Structures
                </span>
              </div>

              {/* Compartment Tabs with Live Counts */}
              <div className="grid grid-cols-3 gap-1.5 mb-2.5">
                {[
                  { id: 'all', label: 'All', count: BRAIN_REGIONS.length, icon: Layers, color: '#38bdf8' },
                  { id: 'cortex', label: 'Cortex', count: BRAIN_REGIONS.filter(r => r.category === 'cortex').length, icon: Brain, color: '#818cf8' },
                  { id: 'deep', label: 'Deep Nuclei', count: BRAIN_REGIONS.filter(r => r.category === 'deep').length, icon: Sparkles, color: '#f43f5e' },
                  { id: 'vascular', label: 'Vascular', count: BRAIN_REGIONS.filter(r => r.category === 'vascular').length, icon: HeartPulse, color: '#ef4444' },
                  { id: 'posterior', label: 'Posterior', count: BRAIN_REGIONS.filter(r => r.category === 'posterior').length, icon: Compass, color: '#06b6d4' },
                  { id: 'fluid', label: 'Ventricles', count: BRAIN_REGIONS.filter(r => r.category === 'fluid').length, icon: Activity, color: '#38bdf8' },
                ].map(cat => {
                  const Icon = cat.icon;
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleSelectCategory(cat.id as any)}
                      className={`text-[11px] px-2 py-1.5 rounded-xl font-semibold flex items-center justify-between transition-all border ${
                        isActive
                          ? 'bg-indigo-600/30 text-white border-indigo-400 shadow-md shadow-indigo-500/20'
                          : 'bg-slate-950/70 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <Icon className="w-3 h-3 flex-shrink-0" style={{ color: cat.color }} />
                        <span className="truncate">{cat.label}</span>
                      </div>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${
                        isActive ? 'bg-indigo-500/40 text-indigo-200' : 'bg-slate-800 text-slate-500'
                      }`}>
                        {cat.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Region Selector Pills with Prominent 3D Active Feedback */}
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
                {filteredRegions.map((region) => {
                  const isSelected = region.id === selectedRegionId;
                  return (
                    <button
                      key={region.id}
                      onClick={() => handleSelectRegion(region.id)}
                      className={`w-full p-2 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer border text-left ${
                        isSelected
                          ? 'bg-slate-800/95 text-white shadow-lg'
                          : 'bg-slate-950/50 text-slate-400 border-slate-800/80 hover:text-white hover:bg-slate-800/40 hover:border-slate-700'
                      }`}
                      style={{
                        borderColor: isSelected ? region.color : undefined,
                        boxShadow: isSelected ? `0 0 16px ${region.color}35` : undefined,
                      }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span 
                          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isSelected ? 'animate-pulse ring-2 ring-white/30' : ''}`} 
                          style={{ backgroundColor: region.color }} 
                        />
                        <div className="truncate">
                          <p className={`font-semibold truncate ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                            {region.name}
                          </p>
                          <p className="text-[10px] text-slate-500 italic truncate">
                            {region.latinName}
                          </p>
                        </div>
                      </div>

                      {isSelected ? (
                        <span 
                          className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0"
                          style={{ 
                            backgroundColor: `${region.color}25`, 
                            color: region.color,
                            border: `1px solid ${region.color}50` 
                          }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: region.color }} />
                          3D Active
                        </span>
                      ) : (
                        <span className="text-[9px] text-slate-500 font-mono hidden sm:inline flex-shrink-0">
                          {region.category}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Region Clinical Diagnostic Card */}
            <div 
              className="p-4 rounded-2xl bg-slate-950/90 border space-y-3 shadow-2xl transition-all"
              style={{
                borderColor: `${selectedRegion.color}40`,
                boxShadow: `0 8px 32px ${selectedRegion.color}15`,
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span 
                      className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md"
                      style={{ 
                        backgroundColor: `${selectedRegion.color}20`,
                        color: selectedRegion.color,
                        border: `1px solid ${selectedRegion.color}40`
                      }}
                    >
                      {selectedRegion.latinName}
                    </span>
                    <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      Highlighted in 3D
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white leading-tight">
                    {selectedRegion.name}
                  </h3>
                </div>
                <button
                  onClick={() => handleSelectRegion(selectedRegion.id)}
                  className="p-2 rounded-xl border border-slate-700 hover:border-slate-500 transition-colors flex items-center gap-1 text-[11px] font-semibold text-slate-300 hover:text-white"
                  style={{ backgroundColor: `${selectedRegion.color}20` }}
                  title="Re-focus 3D Camera on this Structure"
                >
                  <Crosshair className="w-4 h-4" style={{ color: selectedRegion.color }} />
                  <span className="hidden sm:inline">Focus</span>
                </button>
              </div>

              {/* Functional Role */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  Neurophysiological Role
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedRegion.function}
                </p>
              </div>

              {/* CT Radiological Significance */}
              <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-900/40">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                  <Crosshair className="w-3 h-3" /> Head CT Diagnostic Correlation
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedRegion.radiologicalRelevance}
                </p>
                <div className="mt-2 text-[11px] text-sky-300 font-mono flex items-center gap-1.5">
                  <span className="text-slate-400">Slice plane:</span>
                  <span className="font-semibold">{selectedRegion.ctSliceLevel}</span>
                </div>
              </div>

              {/* Common Acute Pathologies */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  High-Yield Pathologies on Non-Contrast Head CT
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedRegion.commonPathologies.map((patho, idx) => (
                    <span 
                      key={idx}
                      className="text-[11px] px-2 py-0.5 rounded-lg bg-slate-800 text-slate-200 border border-slate-700/80"
                    >
                      {patho}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Related Head CT Cases in the Library */}
            {relatedCases.length > 0 && (
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Related Head CT Cases in Library ({relatedCases.length})
                </span>
                <div className="space-y-2">
                  {relatedCases.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => onSelectCase && onSelectCase(c)}
                      className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-blue-500/50 transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-semibold uppercase">
                            {c.category}
                          </span>
                          <span className="text-[10px] text-slate-400">{c.difficulty}</span>
                        </div>
                        <h4 className="text-xs font-semibold text-white truncate mt-0.5 group-hover:text-blue-400 transition-colors">
                          {c.diagnosis}
                        </h4>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-transform group-hover:translate-x-0.5 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Action Footer */}
          <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Correlated with <strong className="text-slate-200">Head CT Library</strong> below
            </span>
            {onExploreHeadCt && (
              <button
                onClick={onExploreHeadCt}
                className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span>View CT Library</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
