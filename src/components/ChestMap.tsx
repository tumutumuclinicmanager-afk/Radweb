import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { 
  Wind, 
  Heart, 
  RotateCw, 
  Play,
  Pause,
  Gauge,
  Info, 
  Sparkles, 
  ArrowRight, 
  Crosshair, 
  Eye, 
  Maximize2,
  Split,
  Search,
  Compass,
  Volume2,
  VolumeX,
  Activity,
  ZoomIn,
  Layers,
  CircleDot,
  Pointer
} from 'lucide-react';
import { MedicalCase } from '../types';

export interface ChestRegionInfo {
  id: string;
  category: 'respiratory' | 'cardiovascular' | 'mediastinum' | 'pleural';
  name: string;
  latinName: string;
  color: string;
  function: string;
  radiologicalRelevance: string;
  commonPathologies: string[];
  imagingAppearance: string;
  pinPosition: [number, number, number];
  cameraAngle: { x: number; y: number; z: number };
}

export interface HeartChamberInfo {
  id: string;
  name: string;
  type: 'Chamber' | 'Major Vessel';
  latinName: string;
  role: string;
  cardiacPhase: string;
}

export const HEART_CHAMBERS: Record<string, HeartChamberInfo> = {
  left_ventricle: {
    id: 'left_ventricle',
    name: 'Left Ventricle',
    type: 'Chamber',
    latinName: 'Ventriculus sinister',
    role: 'Pumps oxygenated blood into the aorta at high systemic pressure (~120 mmHg systolic).',
    cardiacPhase: 'Ventricular Systole (Twist & Squeeze)'
  },
  right_ventricle: {
    id: 'right_ventricle',
    name: 'Right Ventricle',
    type: 'Chamber',
    latinName: 'Ventriculus dexter',
    role: 'Pumps deoxygenated blood through the pulmonary valve into the pulmonary trunk and lungs.',
    cardiacPhase: 'Ventricular Systole'
  },
  left_atrium: {
    id: 'left_atrium',
    name: 'Left Atrium',
    type: 'Chamber',
    latinName: 'Atrium sinistrum',
    role: 'Receives oxygenated blood from the four pulmonary veins and passes it to the left ventricle.',
    cardiacPhase: 'Atrial Diastole / Ventricular Systole'
  },
  right_atrium: {
    id: 'right_atrium',
    name: 'Right Atrium',
    type: 'Chamber',
    latinName: 'Atrium dextrum',
    role: 'Receives deoxygenated systemic venous return from the superior and inferior vena cava.',
    cardiacPhase: 'Atrial Systole'
  },
  aorta: {
    id: 'aorta',
    name: 'Aorta & Arch',
    type: 'Major Vessel',
    latinName: 'Aorta et Arcus aortae',
    role: 'Main arterial trunk distributing oxygenated blood to all systemic organ circulations.',
    cardiacPhase: 'Ejection Phase'
  },
  pulmonary_artery: {
    id: 'pulmonary_artery',
    name: 'Pulmonary Trunk',
    type: 'Major Vessel',
    latinName: 'Truncus pulmonalis',
    role: 'Conveys deoxygenated blood from right ventricle to right and left pulmonary arteries.',
    cardiacPhase: 'Ventricular Ejection'
  }
};

export const CHEST_REGIONS: ChestRegionInfo[] = [
  {
    id: 'trachea_bronchi',
    category: 'respiratory',
    name: 'Trachea, Carina & Bronchial Tree',
    latinName: 'Trachea et Arbor bronchialis',
    color: '#38bdf8',
    function: 'Cartilaginous airway conduit conducting air to segmental bronchi with mucociliary clearance.',
    radiologicalRelevance: 'Evaluated for tracheal deviation in tension pneumothorax and endobronchial obstruction.',
    commonPathologies: ['Tracheal Deviation', 'Foreign Body Aspiration', 'Endobronchial Carcinoma', 'Tracheomalacia'],
    imagingAppearance: 'Central lucent tubular air column branching symmetrically at T4/T5 carina.',
    pinPosition: [0, 1.2, 0.1],
    cameraAngle: { x: 0, y: 0, z: 4.5 },
  },
  {
    id: 'right_lung_lobes',
    category: 'respiratory',
    name: 'Right Lung (Upper, Middle, Lower Lobes)',
    latinName: 'Pulmo dexter (Superior, Medius, Inferior)',
    color: '#f43f5e',
    function: 'Tri-lobed respiratory organ separated by horizontal and oblique fissures for gas exchange.',
    radiologicalRelevance: 'Frequent site for aspiration pneumonia due to wider, more vertical right main bronchus.',
    commonPathologies: ['Lobar Pneumonia', 'Right Upper Lobe Mass', 'Aspiration Pneumonitis', 'Pulmonary Contusion'],
    imagingAppearance: 'Consolidation with air bronchograms within anatomical lobe boundaries.',
    pinPosition: [1.3, 0.2, 0.2],
    cameraAngle: { x: 0.1, y: -0.6, z: 4.8 },
  },
  {
    id: 'left_lung_lobes',
    category: 'respiratory',
    name: 'Left Lung (Upper Lobe, Lingula & Lower Lobe)',
    latinName: 'Pulmo sinister (Superior cum Lingula et Inferior)',
    color: '#fb7185',
    function: 'Bi-lobed lung with lingula accommodating the cardiac notch.',
    radiologicalRelevance: 'Lingular infiltrates obscure left heart border on frontal chest X-ray (silhouette sign).',
    commonPathologies: ['Lingular Pneumonia', 'Left Lower Lobe Collapse', 'Primary Adenocarcinoma', 'Pulmonary Infarction'],
    imagingAppearance: 'Left retrocardiac density with silhouette sign on PA chest radiograph.',
    pinPosition: [-1.3, 0.2, 0.2],
    cameraAngle: { x: 0.1, y: 0.6, z: 4.8 },
  },
  {
    id: 'heart_myocardium',
    category: 'cardiovascular',
    name: 'Anatomical Heart (Two-Phase Cardiac Cycle & Apex Twist)',
    latinName: 'Cor (Atria et Ventriculi)',
    color: '#dc2626',
    function: 'Four-chambered muscular pump executing coordinated atrial systole and twisting ventricular systole.',
    radiologicalRelevance: 'Cardiothoracic ratio (CTR > 0.5) indicates cardiomegaly or heart failure.',
    commonPathologies: ['Congestive Heart Failure', 'Myocardial Infarction', 'Pericardial Effusion', 'Left Ventricular Hypertrophy'],
    imagingAppearance: 'Enlarged cardiac silhouette, cephalization of vessels, and Kerley B lines.',
    pinPosition: [-0.25, -0.3, 0.35],
    cameraAngle: { x: 0, y: -0.2, z: 4.5 },
  },
  {
    id: 'aorta_arch',
    category: 'cardiovascular',
    name: 'Aorta, Arch & Great Arterial Branches',
    latinName: 'Aorta ascendens, Arcus aortae et Truncus brachiocephalicus',
    color: '#ef4444',
    function: 'Main arterial trunk with brachiocephalic, left common carotid, and left subclavian branches.',
    radiologicalRelevance: 'Widened mediastinum on chest X-ray is a classic initial sign of aortic dissection.',
    commonPathologies: ['Aortic Aneurysm', 'Acute Aortic Dissection', 'Atherosclerotic Unfolding', 'Traumatic Rupture'],
    imagingAppearance: 'Widened mediastinal contour (>8cm) and intimal calcification on CT angiogram.',
    pinPosition: [0.1, 0.9, -0.1],
    cameraAngle: { x: -0.2, y: 0, z: 4.6 },
  },
  {
    id: 'pulmonary_artery',
    category: 'cardiovascular',
    name: 'Pulmonary Trunk & Main Arteries',
    latinName: 'Truncus pulmonalis et Arteriae pulmonales',
    color: '#3b82f6',
    function: 'Carries deoxygenated blood from right ventricle to pulmonary vascular bed.',
    radiologicalRelevance: 'Prominent pulmonary arteries indicate pulmonary hypertension; saddle embolus obstructs bifurcation.',
    commonPathologies: ['Acute Pulmonary Embolism', 'Pulmonary Arterial Hypertension', 'Hampton Hump Infarct'],
    imagingAppearance: 'CT pulmonary angiography (CTPA) demonstrates filling defects in main pulmonary branches.',
    pinPosition: [0, 0.5, 0.3],
    cameraAngle: { x: -0.1, y: 0, z: 4.5 },
  },
  {
    id: 'vena_cava',
    category: 'cardiovascular',
    name: 'Superior & Inferior Vena Cava',
    latinName: 'Vena cava superior et inferior',
    color: '#1d4ed8',
    function: 'Major systemic venous trunks returning deoxygenated blood to the right atrium.',
    radiologicalRelevance: 'SVC obstruction by bronchogenic carcinoma causes superior vena cava syndrome.',
    commonPathologies: ['Superior Vena Cava Syndrome', 'SVC Thrombus', 'Central Venous Catheter Malposition'],
    imagingAppearance: 'Mediastinal widening with collateral venous channels on contrast CT.',
    pinPosition: [0.5, 0.3, 0.0],
    cameraAngle: { x: 0, y: -0.4, z: 4.6 },
  },
  {
    id: 'pleural_space',
    category: 'pleural',
    name: 'Pleural Cavity & Costophrenic Angles',
    latinName: 'Cavitas pleuralis et Recensus costodiaphragmaticus',
    color: '#06b6d4',
    function: 'Serous double-layered membrane enclosing lungs with lubricating fluid.',
    radiologicalRelevance: 'Blunting of costophrenic angles on upright chest radiograph indicates pleural effusion.',
    commonPathologies: ['Pleural Effusion', 'Pneumothorax', 'Empyema', 'Mesothelioma'],
    imagingAppearance: 'Meniscus sign in pleural effusion; visceral pleural line in pneumothorax.',
    pinPosition: [1.6, -0.8, 0.1],
    cameraAngle: { x: 0.2, y: -0.7, z: 4.8 },
  }
];

type BreathSoundMode = 'off' | 'vesicular' | 'crackles' | 'wheezes' | 'bronchial';
type ViewScaleMode = 'macro' | 'alveolar';

interface ChestMapProps {
  cases?: MedicalCase[];
  onSelectCase?: (c: MedicalCase) => void;
  onExploreChestXray?: () => void;
}

export const ChestMap: React.FC<ChestMapProps> = ({ 
  cases = [], 
  onSelectCase, 
  onExploreChestXray 
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const containerWrapperRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const thoraxGroupRef = useRef<THREE.Group | null>(null);
  const heartGroupRef = useRef<THREE.Group | null>(null);
  const rightLungMeshRef = useRef<THREE.Mesh | null>(null);
  const leftLungMeshRef = useRef<THREE.Mesh | null>(null);
  const pinsGroupRef = useRef<THREE.Group | null>(null);
  const alveolarGroupRef = useRef<THREE.Group | null>(null);
  const conductionGroupRef = useRef<THREE.Group | null>(null);
  const conductionMatRef = useRef<THREE.MeshStandardMaterial | null>(null);

  const [selectedRegionId, setSelectedRegionId] = useState<string>('right_lung_lobes');
  const [activeTab, setActiveTab] = useState<'all' | 'respiratory' | 'cardiovascular' | 'pleural'>('all');
  const [viewScaleMode, setViewScaleMode] = useState<ViewScaleMode>('macro');
  const [ecgData, setEcgData] = useState<{ time: number; voltage: number }[]>([]);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const autoRotateRef = useRef<boolean>(autoRotate);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [rotationSpeed, setRotationSpeed] = useState<number>(1.0);
  const [showPins, setShowPins] = useState<boolean>(true);
  const [showCanvasAnnotations, setShowCanvasAnnotations] = useState<boolean>(true);
  const [spatialMode, setSpatialMode] = useState<boolean>(false);
  const [vrMode, setVrMode] = useState<boolean>(false);
  const vrModeRef = useRef<boolean>(vrMode);
  const [lungOpacity, setLungOpacity] = useState<number>(0.82);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Interactive Heart Callout Mode State
  const [heartCalloutMode, setHeartCalloutMode] = useState<boolean>(false);
  const [hoveredHeartPart, setHoveredHeartPart] = useState<string | null>('left_ventricle');

  // Real-time Partial Pressure Chart Data for O2 and CO2
  const [chartData, setChartData] = useState<{ time: number; PO2: number; PCO2: number }[]>([]);

  // Hear the Breath Audio State
  const [breathSoundMode, setBreathSoundMode] = useState<BreathSoundMode>('off');
  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseNodeRef = useRef<AudioNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);
  const oscNodeRef = useRef<OscillatorNode | null>(null);

  useEffect(() => {
    vrModeRef.current = vrMode;
  }, [vrMode]);

  // Web Audio Auscultation Synthesis Management
  useEffect(() => {
    if (breathSoundMode === 'off') {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;
      noiseNodeRef.current = whiteNoise;

      const filter = ctx.createBiquadFilter();
      filter.type = breathSoundMode === 'bronchial' ? 'bandpass' : 'lowpass';
      filter.frequency.value = breathSoundMode === 'bronchial' ? 600 : 350;
      filter.Q.value = breathSoundMode === 'bronchial' ? 3.0 : 1.0;
      filterNodeRef.current = filter;

      const gain = ctx.createGain();
      gain.gain.value = 0.12;
      gainNodeRef.current = gain;

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      whiteNoise.start();

      if (breathSoundMode === 'wheezes') {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 540;
        const oscGain = ctx.createGain();
        oscGain.gain.value = 0.05;
        osc.connect(oscGain);
        oscGain.connect(ctx.destination);
        osc.start();
        oscNodeRef.current = osc;
      }

    } catch (e) {
      console.error('Web Audio initialization error:', e);
    }

    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, [breathSoundMode]);

  // Spatial Mode & Mouse Parallax
  useEffect(() => {
    if (!spatialMode) return;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (!thoraxGroupRef.current) return;
      const gamma = event.gamma || 0;
      const beta = event.beta || 0;
      thoraxGroupRef.current.rotation.y = THREE.MathUtils.degToRad(gamma * 0.8);
      thoraxGroupRef.current.rotation.x = THREE.MathUtils.degToRad((beta - 45) * 0.8);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!thoraxGroupRef.current) return;
      const xNorm = (e.clientX / window.innerWidth) * 2 - 1;
      const yNorm = -(e.clientY / window.innerHeight) * 2 + 1;
      thoraxGroupRef.current.rotation.y = xNorm * 0.9;
      thoraxGroupRef.current.rotation.x = -yNorm * 0.9;
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

  const selectedRegion = useMemo(() => {
    return CHEST_REGIONS.find(r => r.id === selectedRegionId) || CHEST_REGIONS[0];
  }, [selectedRegionId]);

  const filteredRegions = useMemo(() => {
    let list = CHEST_REGIONS;
    if (activeTab !== 'all') {
      list = list.filter(r => r.category === activeTab);
    }
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      list = list.filter(r => r.name.toLowerCase().includes(q) || r.latinName.toLowerCase().includes(q) || r.function.toLowerCase().includes(q));
    }
    return list;
  }, [activeTab, searchTerm]);

  // Three.js Scene Setup (Macro Thorax & Micro Alveolar Gaseous Exchange)
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x04060c);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0, 4.8);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 1.8);
    dirLight1.position.set(6, 8, 6);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xf43f5e, 1.6);
    dirLight2.position.set(-6, -5, 5);
    scene.add(dirLight2);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.3);
    keyLight.position.set(0, 6, 5);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x60a5fa, 1.1);
    rimLight.position.set(0, 3, -6);
    scene.add(rimLight);

    // --- MACRO THORAX SCENE GROUP ---
    const thoraxGroup = new THREE.Group();
    scene.add(thoraxGroup);
    thoraxGroupRef.current = thoraxGroup;

    // Trachea & Bronchi
    const tracheaGroup = new THREE.Group();
    const cartilageMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3, metalness: 0.1 });
    for (let i = 0; i < 11; i++) {
      const ringGeo = new THREE.TorusGeometry(0.12 - i * 0.0015, 0.02, 16, 32);
      const ring = new THREE.Mesh(ringGeo, cartilageMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0, 0.65 + i * 0.1, 0.1);
      tracheaGroup.add(ring);
    }
    thoraxGroup.add(tracheaGroup);

    const rightMainBronchus = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.048, 0.55, 16), cartilageMat);
    rightMainBronchus.rotation.z = -Math.PI / 3.5;
    rightMainBronchus.position.set(0.22, 0.62, 0.1);
    thoraxGroup.add(rightMainBronchus);

    const leftMainBronchus = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.042, 0.65, 16), cartilageMat);
    leftMainBronchus.rotation.z = Math.PI / 3.0;
    leftMainBronchus.position.set(-0.25, 0.58, 0.1);
    thoraxGroup.add(leftMainBronchus);

    // Lungs
    const createAnatomicalLung = (isRight: boolean, colorHex: number) => {
      const geo = new THREE.SphereGeometry(0.95, 48, 48);
      const pos = geo.attributes.position;
      const v = new THREE.Vector3();
      const basePositions = new Float32Array(pos.count * 3);

      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);
        const nx = v.x;
        const ny = v.y;
        const nz = v.z;

        if (ny > 0.45) {
          v.x *= 0.68;
          v.z *= 0.82;
        }
        if (ny < -0.4) {
          v.y += 0.14 * Math.cos(nx * Math.PI);
        }

        if (isRight) {
          if (nx < 0) v.x *= 0.42;
          if (ny > 0.1 && ny < 0.25 && nx > 0.1) v.x *= 0.93;
          if (ny > -0.2 && ny < 0.0 && nx > 0.15) v.x *= 0.91;
        } else {
          if (nx > 0) v.x *= 0.32;
          if (ny > -0.15 && ny < 0.1 && nx < -0.1) v.x *= 0.91;
        }

        const microNoise = Math.sin(nx * 18) * Math.cos(ny * 18) * Math.sin(nz * 18) * 0.03;
        v.addScaledVector(v.clone().normalize(), microNoise);

        basePositions[i * 3] = v.x;
        basePositions[i * 3 + 1] = v.y;
        basePositions[i * 3 + 2] = v.z;
        pos.setXYZ(i, v.x, v.y, v.z);
      }
      geo.computeVertexNormals();
      geo.userData = { basePositions };

      const mat = new THREE.MeshPhysicalMaterial({
        color: colorHex,
        roughness: 0.35,
        metalness: 0.05,
        transmission: 0.28,
        thickness: 0.9,
        transparent: true,
        opacity: lungOpacity,
        side: THREE.DoubleSide,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.scale.set(isRight ? 1.22 : 1.12, 1.72, 0.96);
      mesh.position.set(isRight ? 1.32 : -1.32, -0.12, 0.15);
      return mesh;
    };

    const rightLung = createAnatomicalLung(true, 0xf43f5e);
    const leftLung = createAnatomicalLung(false, 0xfb7185);
    thoraxGroup.add(rightLung);
    thoraxGroup.add(leftLung);
    rightLungMeshRef.current = rightLung;
    leftLungMeshRef.current = leftLung;

    // --- ANATOMICALLY REALISTIC HEART MODEL (Interactive Sub-Components for Callouts) ---
    const heartGroup = new THREE.Group();
    const myocardiumMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.28, metalness: 0.2 });

    // Left Ventricle Mesh
    const lvGeo = new THREE.SphereGeometry(0.42, 32, 32);
    lvGeo.scale(0.9, 1.3, 1.0);
    const lvMesh = new THREE.Mesh(lvGeo, myocardiumMat.clone());
    lvMesh.position.set(-0.15, -0.2, 0.1);
    lvMesh.userData = { chamberId: 'left_ventricle' };
    heartGroup.add(lvMesh);

    // Right Ventricle Mesh
    const rvGeo = new THREE.SphereGeometry(0.38, 32, 32);
    rvGeo.scale(1.0, 1.1, 0.9);
    const rvMesh = new THREE.Mesh(rvGeo, myocardiumMat.clone());
    rvMesh.position.set(0.18, -0.15, 0.22);
    rvMesh.userData = { chamberId: 'right_ventricle' };
    heartGroup.add(rvMesh);

    // Left Atrium Mesh
    const laGeo = new THREE.SphereGeometry(0.3, 24, 24);
    const laMesh = new THREE.Mesh(laGeo, myocardiumMat.clone());
    laMesh.position.set(-0.22, 0.25, -0.05);
    laMesh.userData = { chamberId: 'left_atrium' };
    heartGroup.add(laMesh);

    // Right Atrium Mesh
    const raGeo = new THREE.SphereGeometry(0.32, 24, 24);
    const raMesh = new THREE.Mesh(raGeo, myocardiumMat.clone());
    raMesh.position.set(0.28, 0.25, -0.02);
    raMesh.userData = { chamberId: 'right_atrium' };
    heartGroup.add(raMesh);

    // Aorta & Arch Mesh
    const aortaMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.2, metalness: 0.3 });
    const aortaCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-0.05, 0.35, 0.1),
      new THREE.Vector3(-0.02, 0.85, -0.05),
      new THREE.Vector3(0.15, 0.55, -0.25)
    );
    const aortaTube = new THREE.Mesh(new THREE.TubeGeometry(aortaCurve, 24, 0.07, 16, false), aortaMat);
    aortaTube.userData = { chamberId: 'aorta' };
    heartGroup.add(aortaTube);

    // Pulmonary Artery Mesh
    const paMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.25 });
    const paCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0.1, 0.3, 0.2),
      new THREE.Vector3(0.2, 0.6, 0.15),
      new THREE.Vector3(0.35, 0.45, -0.05)
    );
    const paTube = new THREE.Mesh(new THREE.TubeGeometry(paCurve, 20, 0.06, 16, false), paMat);
    paTube.userData = { chamberId: 'pulmonary_artery' };
    heartGroup.add(paTube);

    // --- ELECTRICAL CONDUCTION PATHWAY (SA Node, AV Node, Bundle of His, Purkinje Fibers) ---
    const conductionGroup = new THREE.Group();
    const conductionMat = new THREE.MeshStandardMaterial({
      color: 0x22d3ee,
      emissive: 0x06b6d4,
      emissiveIntensity: 1.4,
      roughness: 0.1,
      metalness: 0.2
    });
    conductionMatRef.current = conductionMat;

    // SA Node (Sinoatrial node at superior right atrium)
    const saNodeMesh = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 16), conductionMat);
    saNodeMesh.position.set(0.32, 0.45, 0.05);
    conductionGroup.add(saNodeMesh);

    // AV Node (Atrioventricular node)
    const avNodeMesh = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 16), conductionMat);
    avNodeMesh.position.set(0.12, 0.12, 0.08);
    conductionGroup.add(avNodeMesh);

    // SA to AV Pathway
    const saAvCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.32, 0.45, 0.05),
      new THREE.Vector3(0.22, 0.3, 0.08),
      new THREE.Vector3(0.12, 0.12, 0.08)
    ]);
    const saAvTube = new THREE.Mesh(new THREE.TubeGeometry(saAvCurve, 16, 0.012, 8, false), conductionMat);
    conductionGroup.add(saAvTube);

    // Bundle of His & Bundle Branches down Interventricular Septum
    const hisCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.12, 0.12, 0.08),
      new THREE.Vector3(0.0, -0.05, 0.1),
      new THREE.Vector3(-0.1, -0.3, 0.05),
      new THREE.Vector3(-0.25, -0.5, 0.0)
    ]);
    const hisTube = new THREE.Mesh(new THREE.TubeGeometry(hisCurve, 20, 0.012, 8, false), conductionMat);
    conductionGroup.add(hisTube);

    // Purkinje Fiber Network Branches over Ventricles
    for (let i = 0; i < 7; i++) {
      const angle = (i / 7) * Math.PI;
      const branchCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.1, -0.3, 0.05),
        new THREE.Vector3(Math.cos(angle) * 0.28, -0.38 + (i % 2) * 0.12, Math.sin(angle) * 0.22)
      ]);
      const branchTube = new THREE.Mesh(new THREE.TubeGeometry(branchCurve, 12, 0.008, 8, false), conductionMat);
      conductionGroup.add(branchTube);
    }

    conductionGroup.visible = false;
    heartGroup.add(conductionGroup);
    conductionGroupRef.current = conductionGroup;

    heartGroup.position.set(-0.22, -0.28, 0.35);
    thoraxGroup.add(heartGroup);
    heartGroupRef.current = heartGroup;

    // Pins
    const pinsGroup = new THREE.Group();
    thoraxGroup.add(pinsGroup);
    pinsGroupRef.current = pinsGroup;
    CHEST_REGIONS.forEach((reg) => {
      const pinGeo = new THREE.SphereGeometry(0.05, 16, 16);
      const pinMat = new THREE.MeshBasicMaterial({ color: reg.color });
      const pin = new THREE.Mesh(pinGeo, pinMat);
      pin.position.set(...reg.pinPosition);
      pin.userData = { regionId: reg.id };
      pinsGroup.add(pin);
    });

    // --- MICRO ALVEOLAR SCENE GROUP ---
    const alveolarGroup = new THREE.Group();
    scene.add(alveolarGroup);
    alveolarGroupRef.current = alveolarGroup;
    alveolarGroup.visible = false;

    const bronchioleMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
    const bronchiole = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, 1.8, 24), bronchioleMat);
    bronchiole.position.set(0, 1.2, 0);
    alveolarGroup.add(bronchiole);

    const alveoliMat = new THREE.MeshPhysicalMaterial({
      color: 0xfda4af,
      roughness: 0.4,
      transmission: 0.5,
      thickness: 0.6,
      transparent: true,
      opacity: 0.85
    });

    const alveolarClusters: THREE.Mesh[] = [];
    for (let i = 0; i < 9; i++) {
      const angle = (i / 9) * Math.PI * 2;
      const radius = 0.8 + (i % 2) * 0.3;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = -0.2 + (i % 3) * 0.4;

      const sacGeo = new THREE.SphereGeometry(0.55, 24, 24);
      const sac = new THREE.Mesh(sacGeo, alveoliMat);
      sac.position.set(x, y, z);
      alveolarGroup.add(sac);
      alveolarClusters.push(sac);
    }

    const capillaryMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3, emissive: 0x7f1d1d, emissiveIntensity: 0.3 });
    const deoxCapillaryMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.3, emissive: 0x1e3a8a, emissiveIntensity: 0.3 });

    for (let i = 0; i < 12; i++) {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(Math.sin(i) * 0.9, -0.8 + (i * 0.1), Math.cos(i) * 0.9),
        new THREE.Vector3(Math.sin(i + 1) * 1.1, 0.0 + (i * 0.08), Math.cos(i + 1) * 1.1),
        new THREE.Vector3(Math.sin(i + 2) * 0.9, 0.8, Math.cos(i + 2) * 0.9),
      ]);
      const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.06, 12, false);
      const cap = new THREE.Mesh(tubeGeo, i % 2 === 0 ? capillaryMat : deoxCapillaryMat);
      alveolarGroup.add(cap);
    }

    const o2Geo = new THREE.SphereGeometry(0.04, 12, 12);
    const o2Mat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const co2Mat = new THREE.MeshBasicMaterial({ color: 0xf97316 });

    const o2Particles: { mesh: THREE.Mesh; progress: number; speed: number }[] = [];
    for (let i = 0; i < 40; i++) {
      const mesh = new THREE.Mesh(o2Geo, i < 25 ? o2Mat : co2Mat);
      alveolarGroup.add(mesh);
      o2Particles.push({
        mesh,
        progress: Math.random(),
        speed: 0.4 + Math.random() * 0.4
      });
    }

    // Raycaster
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleCanvasClick = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      if (viewScaleMode === 'macro') {
        // Check heart sub-components first if click is near heart
        const heartIntersects = raycaster.intersectObjects(heartGroup.children);
        if (heartIntersects.length > 0) {
          const chamberId = heartIntersects[0].object.userData.chamberId;
          if (chamberId) {
            setHoveredHeartPart(chamberId);
            setHeartCalloutMode(true);
            return;
          }
        }

        const intersects = raycaster.intersectObjects(pinsGroup.children);
        if (intersects.length > 0) {
          const hitId = intersects[0].object.userData.regionId;
          if (hitId) setSelectedRegionId(hitId);
        }
      }
    };

    const handleCanvasMouseMove = (event: MouseEvent) => {
      if (viewScaleMode !== 'macro') return;
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const heartIntersects = raycaster.intersectObjects(heartGroup.children);
      if (heartIntersects.length > 0) {
        const chamberId = heartIntersects[0].object.userData.chamberId;
        if (chamberId) {
          setHoveredHeartPart(chamberId);
        }
      }
    };

    const domElem = renderer.domElement;
    domElem.addEventListener('click', handleCanvasClick);
    domElem.addEventListener('mousemove', handleCanvasMouseMove);

    // Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();
    let accumulatedTime = 0;
    let chartTimer = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      if (isPlaying) {
        accumulatedTime += delta;
        chartTimer += delta;
      }
      const t = accumulatedTime;

      if (autoRotateRef.current && thoraxGroupRef.current && viewScaleMode === 'macro' && !spatialMode) {
        thoraxGroupRef.current.rotation.y += delta * 0.35 * rotationSpeed;
      }

      if (autoRotateRef.current && alveolarGroupRef.current && viewScaleMode === 'alveolar' && !spatialMode) {
        alveolarGroupRef.current.rotation.y += delta * 0.4 * rotationSpeed;
      }

      // Macro Heart Animations
      if (heartGroupRef.current && viewScaleMode === 'macro') {
        const heartCycle = (t * 4.4) % (Math.PI * 2);
        const ventSystole = Math.max(0, Math.sin(heartCycle)) ** 3 * 0.11;
        const scaleFactor = 1 + ventSystole;
        heartGroupRef.current.scale.set(1.1 * scaleFactor, 1.2 * scaleFactor, 1.05 * (1 + ventSystole * 0.9));
        heartGroupRef.current.rotation.y = 0.25 + (ventSystole * 0.3);
        heartGroupRef.current.rotation.z = -0.28 - (ventSystole * 0.1);
      }

      if (conductionGroupRef.current && conductionMatRef.current) {
        conductionGroupRef.current.visible = heartCalloutMode && viewScaleMode === 'macro';
        if (conductionGroupRef.current.visible) {
          const heartCycle = (t * 4.4) % (Math.PI * 2);
          const pulse = 0.5 + Math.sin(heartCycle * 3) * 0.5;
          conductionMatRef.current.emissiveIntensity = 0.4 + pulse * 2.2;
        }
      }

      const respCycle = (t * 1.45) % (Math.PI * 2);
      const breathInhalation = (Math.sin(respCycle) + 1) / 2;

      if (chartTimer > 0.12) {
        chartTimer = 0;
        if (heartCalloutMode && viewScaleMode === 'macro') {
          const heartCycle = (t * 4.4) % (Math.PI * 2);
          let ecgVal = 0.05 * Math.sin(heartCycle);
          const qrsDist = Math.abs((heartCycle % Math.PI) - 0.5);
          if (qrsDist < 0.25) {
            ecgVal += 1.9 * Math.cos(qrsDist * Math.PI * 2);
          }
          const tWaveDist = Math.abs(heartCycle - 4.5);
          if (tWaveDist < 0.4) {
            ecgVal += 0.35 * Math.cos(tWaveDist * Math.PI * 1.25);
          }
          ecgVal += (Math.random() - 0.5) * 0.06;

          setEcgData(prev => {
            const next = [...prev, { time: Math.round(t * 10) / 10, voltage: Number(ecgVal.toFixed(2)) }];
            if (next.length > 35) next.shift();
            return next;
          });
        }

        if (viewScaleMode === 'alveolar') {
          const po2Val = Math.round(40 + breathInhalation * 60);
          const pco2Val = Math.round(46 - breathInhalation * 6);
          setChartData(prev => {
            const next = [...prev, { time: Math.round(t * 10) / 10, PO2: po2Val, PCO2: pco2Val }];
            if (next.length > 25) next.shift();
            return next;
          });
        }
      }

      if (gainNodeRef.current && audioCtxRef.current && audioCtxRef.current.state === 'running') {
        const breathMod = 0.04 + breathInhalation * 0.12;
        gainNodeRef.current.gain.setTargetAtTime(breathMod, audioCtxRef.current.currentTime, 0.1);
      }

      if (viewScaleMode === 'macro') {
        const updateLungGeometry = (lungMesh: THREE.Mesh | null) => {
          if (!lungMesh) return;
          const geo = lungMesh.geometry as THREE.BufferGeometry;
          const pos = geo.attributes.position;
          const basePos = geo.userData.basePositions;
          if (!basePos) return;

          for (let i = 0; i < pos.count; i++) {
            const bx = basePos[i * 3];
            const by = basePos[i * 3 + 1];
            const bz = basePos[i * 3 + 2];
            const heightFactor = Math.max(0.2, (by + 1.0) / 1.8);
            const expansionWeight = 1 + (breathInhalation * 0.18 * heightFactor);

            pos.setXYZ(i, bx * expansionWeight, by * (1 + breathInhalation * 0.08), bz * expansionWeight);
          }
          geo.attributes.position.needsUpdate = true;
          geo.computeVertexNormals();
        };
        updateLungGeometry(rightLungMeshRef.current);
        updateLungGeometry(leftLungMeshRef.current);
      }

      if (viewScaleMode === 'alveolar') {
        const sacScale = 1 + breathInhalation * 0.12;
        alveolarClusters.forEach((sac) => {
          sac.scale.set(sacScale, sacScale, sacScale);
        });

        o2Particles.forEach((p) => {
          p.progress = (p.progress + delta * p.speed * 0.4) % 1.0;
          const angle = p.progress * Math.PI * 2;
          const radius = 0.75 + Math.sin(p.progress * Math.PI * 4) * 0.15;
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;
          const y = Math.sin(p.progress * Math.PI * 2) * 0.5;
          p.mesh.position.set(x, y, z);
        });
      }

      const rendererInst = rendererRef.current;
      const sceneInst = sceneRef.current;
      const cameraInst = cameraRef.current;
      const containerInst = mountRef.current;

      const targetZ = viewScaleMode === 'macro' ? 4.8 : 3.2;
      camera.position.z += (targetZ - camera.position.z) * 0.08;

      if (!rendererInst || !sceneInst || !cameraInst || !containerInst) return;

      if (vrModeRef.current) {
        const width = containerInst.clientWidth;
        const height = containerInst.clientHeight;
        const halfW = width / 2;

        rendererInst.setScissorTest(true);
        rendererInst.setViewport(0, 0, halfW, height);
        rendererInst.setScissor(0, 0, halfW, height);
        cameraInst.position.x = -0.032;
        rendererInst.render(sceneInst, cameraInst);

        rendererInst.setViewport(halfW, 0, halfW, height);
        rendererInst.setScissor(halfW, 0, halfW, height);
        cameraInst.position.x = 0.032;
        rendererInst.render(sceneInst, cameraInst);

        rendererInst.setScissorTest(false);
        cameraInst.position.x = 0;
      } else {
        rendererInst.setViewport(0, 0, containerInst.clientWidth, containerInst.clientHeight);
        rendererInst.render(sceneInst, cameraInst);
      }
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current || !renderer || !camera) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      domElem.removeEventListener('click', handleCanvasClick);
      domElem.removeEventListener('mousemove', handleCanvasMouseMove);
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    if (!thoraxGroupRef.current || !alveolarGroupRef.current || !cameraRef.current) return;
    const thorax = thoraxGroupRef.current;
    const alveolar = alveolarGroupRef.current;

    if (viewScaleMode === 'macro') {
      thorax.visible = true;
      alveolar.visible = false;
    } else {
      thorax.visible = false;
      alveolar.visible = true;
    }
  }, [viewScaleMode]);

  const activeHeartCallout = hoveredHeartPart ? HEART_CHAMBERS[hoveredHeartPart] : HEART_CHAMBERS['left_ventricle'];

  return (
    <div ref={containerWrapperRef} className={`w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl text-white ${isFullscreen ? 'fixed inset-0 z-50 rounded-none overflow-y-auto' : ''}`}>
      {/* Top Banner Header */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-teal-950 via-slate-900 to-slate-900 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center flex-shrink-0 border border-teal-500/30 shadow-inner">
            <Wind className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300 border border-teal-500/30">
                Advanced Clinical Simulation
              </span>
              <span className="text-xs text-emerald-400 font-semibold hidden sm:inline flex items-center gap-1">
                • Macro Thorax & Micro Alveolar Gaseous Exchange
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Chest & Thoracic 3D Map
              <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                {viewScaleMode === 'macro' ? 'Macro Thoracic View' : 'Micro Alveolar View'}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
              Switch between macro thoracic anatomy and the microscopic alveolar-capillary membrane to visualize oxygen diffusion and carbon dioxide elimination.
            </p>
          </div>
        </div>

        {/* Global Action Bar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setViewScaleMode(viewScaleMode === 'macro' ? 'alveolar' : 'macro')}
            className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-md shadow-teal-600/20 flex items-center gap-1.5"
          >
            {viewScaleMode === 'macro' ? <ZoomIn className="w-3.5 h-3.5" /> : <Layers className="w-3.5 h-3.5" />}
            <span>{viewScaleMode === 'macro' ? 'Zoom to Alveoli' : 'Return to Macro Thorax'}</span>
          </button>

          <button
            onClick={() => setHeartCalloutMode(!heartCalloutMode)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
              heartCalloutMode 
                ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/30' 
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
            title="Toggle Interactive Heart Anatomy Callout Mode"
          >
            <Pointer className="w-3.5 h-3.5" />
            <span>{heartCalloutMode ? 'Heart Callout: ON' : 'Heart Callout'}</span>
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
              isPlaying 
                ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/40' 
                : 'bg-amber-600/30 text-amber-300 border-amber-500/40'
            }`}
            title="Play / Pause Simulation"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause' : 'Resume'}</span>
          </button>

          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
              autoRotate 
                ? 'bg-teal-600/30 text-teal-300 border-teal-500/40' 
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
            title="Toggle 360° Auto-Rotation"
          >
            <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
            <span>{autoRotate ? 'Rotation On' : 'Rotation Off'}</span>
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
            <span>{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
          </button>

          <div className="h-6 w-px bg-slate-800 hidden sm:block"></div>

          {onExploreChestXray && (
            <button
              onClick={onExploreChestXray}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-md shadow-teal-600/20 flex items-center gap-1.5"
            >
              <span>Jump to Chest X-Rays</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Hear the Breath Audio Control Bar */}
      <div className="px-5 py-3 bg-teal-950/60 border-b border-teal-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-teal-300 font-bold mr-2">
            <Volume2 className="w-4 h-4 text-teal-400 animate-pulse" />
            <span>Hear the Breath (Auscultation):</span>
          </div>

          <button
            onClick={() => setBreathSoundMode('off')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all ${
              breathSoundMode === 'off' 
                ? 'bg-slate-800 text-slate-400 border border-slate-700' 
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            Muted
          </button>

          <button
            onClick={() => setBreathSoundMode('vesicular')}
            className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all ${
              breathSoundMode === 'vesicular' 
                ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30' 
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Activity className="w-3.5 h-3.5" /> Normal Vesicular
          </button>

          <button
            onClick={() => setBreathSoundMode('crackles')}
            className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all ${
              breathSoundMode === 'crackles' 
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30' 
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <span>Crackles / Rales</span>
          </button>

          <button
            onClick={() => setBreathSoundMode('wheezes')}
            className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all ${
              breathSoundMode === 'wheezes' 
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30' 
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <span>Expiratory Wheezes</span>
          </button>

          <button
            onClick={() => setBreathSoundMode('bronchial')}
            className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all ${
              breathSoundMode === 'bronchial' 
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' 
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <span>Bronchial Sounds</span>
          </button>
        </div>

        <div className="text-[11px] text-teal-300 font-mono flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
          <span>{breathSoundMode !== 'off' ? `Active: ${breathSoundMode.toUpperCase()}` : 'Audio Ready'}</span>
        </div>
      </div>

      {/* Mode Tabs & Toolbar (Only shown in Macro mode) */}
      {viewScaleMode === 'macro' && (
        <div className="px-5 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-3 overflow-x-auto scrollbar-none text-xs">
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              System Views:
            </span>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                activeTab === 'all' ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              All Structures
            </button>
            <button
              onClick={() => setActiveTab('respiratory')}
              className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'respiratory' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Wind className="w-3.5 h-3.5" /> Respiratory
            </button>
            <button
              onClick={() => setActiveTab('cardiovascular')}
              className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'cardiovascular' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Heart className="w-3.5 h-3.5" /> Cardiovascular
            </button>
            <button
              onClick={() => setActiveTab('pleural')}
              className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'pleural' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Split className="w-3.5 h-3.5" /> Pleura
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPins(!showPins)}
              className={`text-[10px] px-2 py-1 rounded-lg font-semibold flex items-center gap-1 border transition-all ${
                showPins 
                  ? 'bg-teal-500/20 text-teal-300 border-teal-500/30' 
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
            >
              <Sparkles className="w-3 h-3" />
              <span>{showCanvasAnnotations ? 'Labels On' : 'Labels Off'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: 3D Canvas + Details Panel / Real-Time Chart / Heart Callout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[520px]">
        {/* Left Column: 3D Thorax / Alveolar Viewport */}
        <div className="lg:col-span-7 relative bg-slate-950 flex flex-col items-center justify-center overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800">
          <div ref={mountRef} className="w-full h-[460px] sm:h-[520px] cursor-grab active:cursor-grabbing" />

          {/* Heart Callout Mode Anatomy Labels Overlay */}
          {heartCalloutMode && viewScaleMode === 'macro' && (
            <div className="absolute inset-0 pointer-events-none z-20">
              {/* Aorta Label */}
              <div 
                className="absolute top-[28%] left-[43%] pointer-events-auto cursor-pointer"
                onClick={() => setHoveredHeartPart('aorta')}
                onMouseEnter={() => setHoveredHeartPart('aorta')}
              >
                <div className={`px-2.5 py-1 rounded-xl text-xs font-bold backdrop-blur-md border shadow-2xl transition-all flex items-center gap-1.5 ${hoveredHeartPart === 'aorta' ? 'bg-red-600 text-white border-red-400 scale-110 shadow-red-600/50' : 'bg-slate-900/90 text-red-300 border-red-500/50 hover:bg-slate-800'}`}>
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                  <span>Aorta & Arch</span>
                </div>
              </div>

              {/* Pulmonary Trunk Label */}
              <div 
                className="absolute top-[36%] left-[51%] pointer-events-auto cursor-pointer"
                onClick={() => setHoveredHeartPart('pulmonary_artery')}
                onMouseEnter={() => setHoveredHeartPart('pulmonary_artery')}
              >
                <div className={`px-2.5 py-1 rounded-xl text-xs font-bold backdrop-blur-md border shadow-2xl transition-all flex items-center gap-1.5 ${hoveredHeartPart === 'pulmonary_artery' ? 'bg-blue-600 text-white border-blue-400 scale-110 shadow-blue-600/50' : 'bg-slate-900/90 text-blue-300 border-blue-500/50 hover:bg-slate-800'}`}>
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  <span>Pulmonary Trunk</span>
                </div>
              </div>

              {/* Right Atrium Label */}
              <div 
                className="absolute top-[42%] left-[56%] pointer-events-auto cursor-pointer"
                onClick={() => setHoveredHeartPart('right_atrium')}
                onMouseEnter={() => setHoveredHeartPart('right_atrium')}
              >
                <div className={`px-2.5 py-1 rounded-xl text-xs font-bold backdrop-blur-md border shadow-2xl transition-all flex items-center gap-1.5 ${hoveredHeartPart === 'right_atrium' ? 'bg-rose-600 text-white border-rose-400 scale-110 shadow-rose-600/50' : 'bg-slate-900/90 text-rose-300 border-rose-500/50 hover:bg-slate-800'}`}>
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  <span>Right Atrium</span>
                </div>
              </div>

              {/* Left Atrium Label */}
              <div 
                className="absolute top-[42%] left-[36%] pointer-events-auto cursor-pointer"
                onClick={() => setHoveredHeartPart('left_atrium')}
                onMouseEnter={() => setHoveredHeartPart('left_atrium')}
              >
                <div className={`px-2.5 py-1 rounded-xl text-xs font-bold backdrop-blur-md border shadow-2xl transition-all flex items-center gap-1.5 ${hoveredHeartPart === 'left_atrium' ? 'bg-rose-600 text-white border-rose-400 scale-110 shadow-rose-600/50' : 'bg-slate-900/90 text-rose-300 border-rose-500/50 hover:bg-slate-800'}`}>
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  <span>Left Atrium</span>
                </div>
              </div>

              {/* Right Ventricle Label */}
              <div 
                className="absolute top-[56%] left-[50%] pointer-events-auto cursor-pointer"
                onClick={() => setHoveredHeartPart('right_ventricle')}
                onMouseEnter={() => setHoveredHeartPart('right_ventricle')}
              >
                <div className={`px-2.5 py-1 rounded-xl text-xs font-bold backdrop-blur-md border shadow-2xl transition-all flex items-center gap-1.5 ${hoveredHeartPart === 'right_ventricle' ? 'bg-red-600 text-white border-red-400 scale-110 shadow-red-600/50' : 'bg-slate-900/90 text-red-300 border-red-500/50 hover:bg-slate-800'}`}>
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span>Right Ventricle</span>
                </div>
              </div>

              {/* Left Ventricle Label */}
              <div 
                className="absolute top-[58%] left-[38%] pointer-events-auto cursor-pointer"
                onClick={() => setHoveredHeartPart('left_ventricle')}
                onMouseEnter={() => setHoveredHeartPart('left_ventricle')}
              >
                <div className={`px-2.5 py-1 rounded-xl text-xs font-bold backdrop-blur-md border shadow-2xl transition-all flex items-center gap-1.5 ${hoveredHeartPart === 'left_ventricle' ? 'bg-red-600 text-white border-red-400 scale-110 shadow-red-600/50' : 'bg-slate-900/90 text-red-300 border-red-500/50 hover:bg-slate-800'}`}>
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span>Left Ventricle</span>
                </div>
              </div>
            </div>
          )}

          {/* Heart Callout Mode HUD Badge */}
          {heartCalloutMode && viewScaleMode === 'macro' && (
            <div className="absolute top-4 left-4 bg-rose-950/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-rose-500/50 flex items-center gap-2 text-xs z-20 shadow-xl">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span className="text-rose-200 font-bold">Heart Anatomy Callout Mode Active: Hover over heart chambers</span>
            </div>
          )}

          {/* Micro Alveolar Overlay Legend */}
          {viewScaleMode === 'alveolar' && (
            <div className="absolute top-4 left-4 right-4 bg-slate-900/90 backdrop-blur-md p-3 rounded-2xl border border-teal-500/40 flex items-center justify-between gap-3 text-xs z-20 shadow-xl">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-cyan-200 font-semibold">O₂ Diffusion (Inward)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-orange-500 animate-pulse" />
                <span className="text-orange-200 font-semibold">CO₂ Elimination (Outward)</span>
              </div>
              <button
                onClick={() => setViewScaleMode('macro')}
                className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold"
              >
                Back to Macro
              </button>
            </div>
          )}

          {/* 3D Canvas Annotations Overlay (Macro mode only) */}
          {showCanvasAnnotations && viewScaleMode === 'macro' && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
              <div className="absolute top-[18%] left-[50%] transform -translate-x-1/2 pointer-events-auto cursor-pointer" onClick={() => setSelectedRegionId('trachea_bronchi')}>
                <div className="bg-slate-900/85 backdrop-blur-md text-white px-2.5 py-1.5 rounded-lg border border-sky-500/50 shadow-xl flex items-center gap-1.5 hover:scale-105 transition-transform">
                  <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                  <span className="text-[11px] font-bold">Trachea & Bronchi</span>
                </div>
              </div>

              <div className="absolute top-[42%] right-[22%] pointer-events-auto cursor-pointer" onClick={() => setSelectedRegionId('right_lung_lobes')}>
                <div className="bg-slate-900/85 backdrop-blur-md text-white px-2.5 py-1.5 rounded-lg border border-rose-500/50 shadow-xl flex items-center gap-1.5 hover:scale-105 transition-transform">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="text-[11px] font-bold">Right Lung</span>
                </div>
              </div>

              <div className="absolute top-[42%] left-[22%] pointer-events-auto cursor-pointer" onClick={() => setSelectedRegionId('left_lung_lobes')}>
                <div className="bg-slate-900/85 backdrop-blur-md text-white px-2.5 py-1.5 rounded-lg border border-rose-400/50 shadow-xl flex items-center gap-1.5 hover:scale-105 transition-transform">
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  <span className="text-[11px] font-bold">Left Lung</span>
                </div>
              </div>

              <div className="absolute bottom-[38%] left-[44%] transform -translate-x-1/2 pointer-events-auto cursor-pointer" onClick={() => setSelectedRegionId('heart_myocardium')}>
                <div className="bg-slate-900/85 backdrop-blur-md text-white px-2.5 py-1.5 rounded-lg border border-red-500/60 shadow-xl flex items-center gap-1.5 hover:scale-105 transition-transform">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                  <span className="text-[11px] font-bold text-red-300">Anatomical Heart</span>
                </div>
              </div>
            </div>
          )}

          {/* Lung Transparency Slider */}
          <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-md p-3 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 text-xs z-20">
            <div className="flex items-center gap-2 text-slate-300 font-medium">
              <Eye className="w-3.5 h-3.5 text-teal-400" />
              <span className="text-[11px]">Lung Parenchyma Opacity:</span>
            </div>
            <div className="flex items-center gap-2 w-40 sm:w-48">
              <input
                type="range"
                min="0.2"
                max="1.0"
                step="0.05"
                value={lungOpacity}
                onChange={(e) => setLungOpacity(parseFloat(e.target.value))}
                className="w-full accent-teal-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <span className="text-[10px] text-teal-400 font-mono font-bold w-9 text-right">
                {Math.round(lungOpacity * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Anatomical Index / Real-Time Chart / Heart Callout Card */}
        <div className="lg:col-span-5 p-5 sm:p-6 flex flex-col justify-between bg-slate-900/50">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Info className="w-4 h-4 text-teal-400" />
                <span>
                  {viewScaleMode === 'alveolar' 
                    ? 'Partial Pressures (O₂ & CO₂)' 
                    : heartCalloutMode 
                      ? 'Heart Anatomy Callout' 
                      : 'Thoracic Anatomy & Pathology'}
                </span>
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-teal-500/20 text-teal-300 border border-teal-500/30 font-mono">
                {viewScaleMode === 'alveolar' ? 'D3 / RECHARTS' : heartCalloutMode ? 'INTERACTIVE HOVER' : selectedRegion.category.toUpperCase()}
              </span>
            </div>

            {viewScaleMode === 'alveolar' ? (
              /* Real-Time Partial Pressure Line Chart */
              <div className="bg-slate-950/90 p-4 rounded-2xl border border-teal-500/30 space-y-3 mb-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-teal-300 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
                    <span>Partial Pressure Dynamics (mmHg)</span>
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">Synchronized with Resp Cycle</span>
                </div>

                <div className="h-48 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} domain={[30, 110]} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                      <Line type="monotone" dataKey="PO2" name="PO₂ (Oxygen)" stroke="#38bdf8" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                      <Line type="monotone" dataKey="PCO2" name="PCO₂ (Carbon Dioxide)" stroke="#f97316" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed">
                  As the alveolus ventilates, <span className="text-cyan-300 font-bold">PO₂</span> rises toward ~100 mmHg while <span className="text-orange-400 font-bold">PCO₂</span> drops to ~40 mmHg across the alveolar-capillary membrane.
                </p>
              </div>
            ) : heartCalloutMode ? (
              <>
                {/* Heart Anatomy Callout Card */}
                <div className="bg-slate-950/90 p-5 rounded-2xl border border-rose-500/40 space-y-4 mb-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {activeHeartCallout.type}
                      </span>
                      <h4 className="text-lg font-bold text-white mt-1 flex items-center gap-2">
                        {activeHeartCallout.name}
                      </h4>
                      <p className="text-xs italic text-slate-400">{activeHeartCallout.latinName}</p>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <span className="font-semibold text-rose-400 block mb-1">Functional Role:</span>
                      <p className="text-slate-300 leading-relaxed">{activeHeartCallout.role}</p>
                    </div>

                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <span className="font-semibold text-teal-400 block mb-1">Cardiac Cycle Phase:</span>
                      <p className="text-slate-200 font-medium">{activeHeartCallout.cardiacPhase}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 pt-2">
                    {Object.values(HEART_CHAMBERS).map(part => (
                      <button
                        key={part.id}
                        onClick={() => setHoveredHeartPart(part.id)}
                        className={`px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all border truncate ${
                          hoveredHeartPart === part.id 
                            ? 'bg-rose-600 text-white border-rose-500 shadow' 
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        {part.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Real-Time Scrolling ECG Waveform Visualization */}
                <div className="bg-slate-950/90 p-4 rounded-2xl border border-emerald-500/40 space-y-3 mb-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                      <span>Live ECG Telemetry (Lead II)</span>
                    </h4>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">72 BPM • Synced</span>
                  </div>

                  <div className="h-40 w-full pt-1 bg-black/40 rounded-xl p-2 border border-emerald-500/20">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={ecgData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="2 2" stroke="#064e3b" />
                        <XAxis dataKey="time" stroke="#059669" fontSize={9} tickLine={false} />
                        <YAxis stroke="#059669" fontSize={9} domain={[-1, 2.5]} tickLine={false} />
                        <Line type="monotone" dataKey="voltage" stroke="#34d399" strokeWidth={2} dot={false} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    R-wave spikes synchronize precisely with ventricular systole and electrical depolarization across the conduction pathway.
                  </p>
                </div>
              </>
            ) : (
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3 mb-4 shadow-inner">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-base font-bold text-white flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: selectedRegion.color }} />
                      {selectedRegion.name}
                    </h4>
                    <p className="text-xs italic text-slate-400">{selectedRegion.latinName}</p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedRegion.function}
                </p>

                <div className="pt-2 border-t border-slate-800/80 space-y-2 text-xs">
                  <div>
                    <span className="font-semibold text-teal-400">Radiological Relevance:</span>
                    <p className="text-slate-300 mt-0.5">{selectedRegion.radiologicalRelevance}</p>
                  </div>

                  <div>
                    <span className="font-semibold text-cyan-400">Imaging Appearance:</span>
                    <p className="text-slate-300 mt-0.5">{selectedRegion.imagingAppearance}</p>
                  </div>

                  <div>
                    <span className="font-semibold text-rose-400">Common Pathologies:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {selectedRegion.commonPathologies.map((path, idx) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/80 font-medium">
                          {path}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Selector List (Only in Macro mode & when heart callout is off) */}
          {viewScaleMode === 'macro' && !heartCalloutMode && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400">Select Thoracic Structure ({filteredRegions.length}):</span>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search anatomy..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 pr-3 py-1 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 w-36 sm:w-44"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-1 scrollbar-thin">
                {filteredRegions.map((reg) => (
                  <button
                    key={reg.id}
                    onClick={() => setSelectedRegionId(reg.id)}
                    className={`text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between border ${
                      selectedRegionId === reg.id
                        ? 'bg-teal-600/30 text-teal-200 border-teal-500/50 shadow'
                        : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <span className="truncate">{reg.name}</span>
                    <span className="w-2 h-2 rounded-full flex-shrink-0 ml-1.5" style={{ backgroundColor: reg.color }} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
