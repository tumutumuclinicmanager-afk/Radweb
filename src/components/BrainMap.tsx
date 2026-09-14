import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { 
  Brain, 
  RotateCw, 
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
  Compass
} from 'lucide-react';
import { MedicalCase } from '../types';

interface BrainMapProps {
  cases?: MedicalCase[];
  onSelectCase?: (c: MedicalCase) => void;
  onExploreHeadCt?: () => void;
}

export interface BrainRegionInfo {
  id: string;
  name: string;
  latinName: string;
  color: string;
  hemisphere: 'both' | 'left' | 'right';
  function: string;
  radiologicalRelevance: string;
  commonPathologies: string[];
  ctSliceLevel: string;
  pinPosition: [number, number, number];
}

export const BRAIN_REGIONS: BrainRegionInfo[] = [
  {
    id: 'frontal',
    name: 'Frontal Lobe',
    latinName: 'Lobus frontalis',
    color: '#3b82f6', // blue
    hemisphere: 'both',
    function: 'Executive cognition, motor planning, expressive speech (Broca area), behavioral inhibition.',
    radiologicalRelevance: 'Frequent site for traumatic brain contusions, subfrontal meningiomas, and anterior cerebral artery (ACA) infarctions.',
    commonPathologies: ['Cerebral Contusion', 'Bifrontal Subdural Hematoma', 'Acute ACA Infarct', 'Glioblastoma Multiforme'],
    ctSliceLevel: 'High Convexity & Centrum Semiovale',
    pinPosition: [0, 0.9, 1.4],
  },
  {
    id: 'parietal',
    name: 'Parietal Lobe',
    latinName: 'Lobus parietalis',
    color: '#8b5cf6', // purple
    hemisphere: 'both',
    function: 'Primary somatosensory cortex, visuospatial integration, sensory perception.',
    radiologicalRelevance: 'Middle cerebral artery (MCA) cortical territory; site of acute ischemic stroke, watershed infarcts, and hypertensive microbleeds.',
    commonPathologies: ['MCA Territory Stroke', 'Parieto-occipital Hematoma', 'Watershed Ischemia'],
    ctSliceLevel: 'High Convexity / Parietal Cortex',
    pinPosition: [0, 1.4, -0.4],
  },
  {
    id: 'temporal',
    name: 'Temporal Lobe',
    latinName: 'Lobus temporalis',
    color: '#10b981', // emerald
    hemisphere: 'both',
    function: 'Auditory processing, language comprehension (Wernicke area), declarative memory (hippocampus).',
    radiologicalRelevance: 'Anterior temporal tips prone to coup/contrecoup contusions. Uncus vulnerable to transtentorial herniation causing CN III compression.',
    commonPathologies: ['Temporal Lobe Contusion', 'Uncal Herniation', 'Epidural Hematoma (Middle Meningeal)', 'Herpes Simplex Encephalitis'],
    ctSliceLevel: 'Suprasellar Cistern / Mid-Cranial Fossa',
    pinPosition: [1.7, -0.3, 0.3],
  },
  {
    id: 'occipital',
    name: 'Occipital Lobe',
    latinName: 'Lobus occipitalis',
    color: '#f59e0b', // amber
    hemisphere: 'both',
    function: 'Primary visual cortex (calcarine fissure) and visual perception processing.',
    radiologicalRelevance: 'Supplied by Posterior Cerebral Artery (PCA). Bilateral PCA infarcts or hypoperfusion cause cortical blindness / Anton syndrome.',
    commonPathologies: ['Acute PCA Infarction', 'Occipital Arteriovenous Malformation (AVM)', 'PRES (Posterior Reversible Encephalopathy)'],
    ctSliceLevel: 'Quadrigeminal Cistern Level',
    pinPosition: [0, 0.3, -1.9],
  },
  {
    id: 'cerebellum',
    name: 'Cerebellum',
    latinName: 'Cerebellum',
    color: '#ec4899', // pink
    hemisphere: 'both',
    function: 'Fine motor coordination, balance maintenance, ocular saccades, muscle tone.',
    radiologicalRelevance: 'Infratentorial posterior fossa compartment. Edema or hematoma risks acute fourth ventricle compression and obstructive hydrocephalus.',
    commonPathologies: ['Cerebellar Hematoma', 'PICA / AICA Stroke', 'Tonsillar Herniation', 'Medulloblastoma'],
    ctSliceLevel: 'Posterior Fossa / Foramen Magnum Level',
    pinPosition: [0, -1.1, -1.4],
  },
  {
    id: 'brainstem',
    name: 'Brainstem (Pons & Medulla)',
    latinName: 'Truncus encephali',
    color: '#06b6d4', // cyan
    hemisphere: 'both',
    function: 'Vital autonomic regulatory centers (respiration, cardiac rhythm, blood pressure), cranial nerve nuclei III-XII, corticospinal tract conduit.',
    radiologicalRelevance: 'Critical for basilar artery evaluation, pontine hypertensive hemorrhage, and Duret hemorrhages from central herniation.',
    commonPathologies: ['Basilar Artery Occlusion', 'Pontine Hemorrhage', 'Wallenberg Syndrome', 'Central Pontine Myelinolysis'],
    ctSliceLevel: 'Prepontine & CP Angle Cistern',
    pinPosition: [0, -1.5, -0.2],
  },
  {
    id: 'ventricles',
    name: 'Ventricular System',
    latinName: 'Systema ventriculare',
    color: '#6366f1', // indigo
    hemisphere: 'both',
    function: 'Cerebrospinal fluid (CSF) production (choroid plexus) and mechanical cushioning circulation.',
    radiologicalRelevance: 'Assessing midline shift, ventricle effacement, intraventricular hemorrhage (Graeb score), and acute obstructive hydrocephalus.',
    commonPathologies: ['Intraventricular Hemorrhage (IVH)', 'Acute Hydrocephalus', 'Subependymal Giant Cell Astrocytoma', 'Colloid Cyst'],
    ctSliceLevel: 'Monro Foramen & Third Ventricle Level',
    pinPosition: [0, 0.2, 0.1],
  },
];

type RenderMode = 'anatomic' | 'ct_window' | 'wireframe' | 'xray';

export const BrainMap: React.FC<BrainMapProps> = ({ 
  cases = [], 
  onSelectCase, 
  onExploreHeadCt 
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const brainGroupRef = useRef<THREE.Group | null>(null);
  const pinsGroupRef = useRef<THREE.Group | null>(null);
  const slicePlaneRef = useRef<THREE.Mesh | null>(null);

  const [selectedRegionId, setSelectedRegionId] = useState<string>('frontal');
  const [renderMode, setRenderMode] = useState<RenderMode>('anatomic');
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [showPins, setShowPins] = useState<boolean>(true);
  const [showSlicePlane, setShowSlicePlane] = useState<boolean>(true);
  const [slicePosition, setSlicePosition] = useState<number>(0);
  const [sliceAxis, setSliceAxis] = useState<'axial' | 'coronal' | 'sagittal'>('axial');
  const [zoomScale, setZoomScale] = useState<number>(1);

  const selectedRegion = useMemo(() => {
    return BRAIN_REGIONS.find(r => r.id === selectedRegionId) || BRAIN_REGIONS[0];
  }, [selectedRegionId]);

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
    const height = container.clientHeight || 420;
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
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

    // Ambient & Directional Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.4);
    mainLight.position.set(5, 8, 5);
    scene.add(mainLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.9);
    rimLight.position.set(-6, -2, -5);
    scene.add(rimLight);

    const topFill = new THREE.DirectionalLight(0x818cf8, 0.6);
    topFill.position.set(0, 6, 0);
    scene.add(topFill);

    // Root Group
    const brainGroup = new THREE.Group();
    scene.add(brainGroup);
    brainGroupRef.current = brainGroup;

    // Helper: Deform geometry into anatomical cerebral hemisphere with gyri/sulci convolutions
    const createHemisphereGeometry = (isLeft: boolean) => {
      const geo = new THREE.SphereGeometry(1.6, 64, 64);
      const pos = geo.attributes.position;
      const v = new THREE.Vector3();

      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);

        // 1. Anatomical shaping: Elongate AP (Z), flatten bottom (Y < 0), medial flattening (X)
        const sign = isLeft ? -1 : 1;
        
        // Medial gap between hemispheres (longitudinal fissure)
        if ((isLeft && v.x > 0) || (!isLeft && v.x < 0)) {
          v.x *= 0.15;
        }

        // Antero-posterior elongation and frontal/occipital tapering
        v.z *= 1.28;
        if (v.z > 0.4) {
          // Frontal pole tapering
          v.x *= 0.88;
          v.y *= 0.92;
        } else if (v.z < -0.3) {
          // Occipital pole tapering
          v.x *= 0.82;
          v.y *= 0.86;
        }

        // Temporal lobe lateral inferior bulge
        if (v.y < 0 && v.z > -0.4 && v.z < 0.8) {
          v.x += sign * 0.22 * Math.cos(v.z * 2);
          v.y -= 0.12;
        }

        // Inferior flattening for skull base
        if (v.y < -0.7) {
          v.y *= 0.78;
        }

        // 2. Gyri & Sulci surface displacement convolutions (harmonic procedural noise)
        const gyrusFreq1 = 7.5;
        const gyrusFreq2 = 12.0;
        const conv1 = Math.sin(v.x * gyrusFreq1) * Math.cos(v.y * gyrusFreq1) * Math.sin(v.z * gyrusFreq1);
        const conv2 = Math.cos(v.x * gyrusFreq2 + v.y * gyrusFreq2) * Math.sin(v.z * gyrusFreq2);
        const displacement = (conv1 * 0.065 + conv2 * 0.035) * (1 - Math.abs(v.x) * 0.2);

        // Displace along normal
        const normal = v.clone().normalize();
        v.addScaledVector(normal, displacement);

        // Lateral separation
        v.x += sign * 0.08;

        pos.setXYZ(i, v.x, v.y, v.z);
      }

      geo.computeVertexNormals();
      return geo;
    };

    // Helper: Create Cerebellum Geometry
    const createCerebellumGeometry = (isLeft: boolean) => {
      const geo = new THREE.SphereGeometry(0.72, 48, 48);
      const pos = geo.attributes.position;
      const v = new THREE.Vector3();
      const sign = isLeft ? -1 : 1;

      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);
        v.x *= 0.88;
        v.y *= 0.65;
        v.z *= 0.78;

        // Folia horizontal striations
        const folia = Math.sin(v.y * 32.0) * 0.022;
        v.addScaledVector(v.clone().normalize(), folia);

        v.x += sign * 0.48;
        v.y -= 1.05;
        v.z -= 1.15;

        pos.setXYZ(i, v.x, v.y, v.z);
      }
      geo.computeVertexNormals();
      return geo;
    };

    // Helper: Create Brainstem Geometry (Pons & Medulla)
    const createBrainstemGeometry = () => {
      const geo = new THREE.CylinderGeometry(0.32, 0.22, 1.25, 32, 24);
      const pos = geo.attributes.position;
      const v = new THREE.Vector3();

      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);
        // Anterior pontine bulge
        if (v.y > 0 && v.z > 0) {
          v.z += Math.cos(v.y * 2.5) * 0.18;
          v.x *= 1.15;
        }
        v.y -= 1.35;
        v.z -= 0.18;
        pos.setXYZ(i, v.x, v.y, v.z);
      }
      geo.computeVertexNormals();
      return geo;
    };

    // Helper: Create Ventricles Geometry (Deep Internal System)
    const createVentriclesGeometry = () => {
      const group = new THREE.Group();
      // Left and right lateral ventricle horns (torus curves)
      const hornGeoL = new THREE.TorusGeometry(0.58, 0.09, 16, 32, Math.PI * 1.2);
      const hornGeoR = hornGeoL.clone();
      
      const mat = new THREE.MeshStandardMaterial({
        color: 0x818cf8,
        emissive: 0x4f46e5,
        emissiveIntensity: 0.4,
        roughness: 0.2,
        metalness: 0.3,
        transparent: true,
        opacity: 0.85
      });

      const meshL = new THREE.Mesh(hornGeoL, mat);
      meshL.rotation.set(0.2, 0.3, 0.4);
      meshL.position.set(-0.25, 0.2, 0.1);

      const meshR = new THREE.Mesh(hornGeoR, mat);
      meshR.rotation.set(0.2, -0.3, -0.4);
      meshR.position.set(0.25, 0.2, 0.1);

      group.add(meshL);
      group.add(meshR);
      return group;
    };

    // Build Meshes
    const leftHemGeo = createHemisphereGeometry(true);
    const rightHemGeo = createHemisphereGeometry(false);
    const leftCerebGeo = createCerebellumGeometry(true);
    const rightCerebGeo = createCerebellumGeometry(false);
    const brainstemGeo = createBrainstemGeometry();

    // Default Material
    const defaultMaterial = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.45,
      metalness: 0.12,
    });

    const leftCerebrumMesh = new THREE.Mesh(leftHemGeo, defaultMaterial.clone());
    leftCerebrumMesh.name = 'left_cerebrum';
    brainGroup.add(leftCerebrumMesh);

    const rightCerebrumMesh = new THREE.Mesh(rightHemGeo, defaultMaterial.clone());
    rightCerebrumMesh.name = 'right_cerebrum';
    brainGroup.add(rightCerebrumMesh);

    const leftCerebMesh = new THREE.Mesh(leftCerebGeo, defaultMaterial.clone());
    leftCerebMesh.name = 'left_cerebellum';
    brainGroup.add(leftCerebMesh);

    const rightCerebMesh = new THREE.Mesh(rightCerebGeo, defaultMaterial.clone());
    rightCerebMesh.name = 'right_cerebellum';
    brainGroup.add(rightCerebMesh);

    const brainstemMesh = new THREE.Mesh(brainstemGeo, defaultMaterial.clone());
    brainstemMesh.name = 'brainstem';
    brainGroup.add(brainstemMesh);

    const ventriclesMesh = createVentriclesGeometry();
    ventriclesMesh.name = 'ventricles';
    brainGroup.add(ventriclesMesh);

    // Interactive 3D Pins / Landmark Markers Group
    const pinsGroup = new THREE.Group();
    pinsGroupRef.current = pinsGroup;
    brainGroup.add(pinsGroup);

    BRAIN_REGIONS.forEach((region) => {
      const pinContainer = new THREE.Group();
      pinContainer.position.set(...region.pinPosition);
      pinContainer.name = `pin_${region.id}`;

      // Outer glowing sphere ring
      const ringGeo = new THREE.RingGeometry(0.11, 0.14, 32);
      const ringMat = new THREE.MeshBasicMaterial({ 
        color: region.color, 
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.95
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.lookAt(camera.position);

      // Core sphere
      const sphereGeo = new THREE.SphereGeometry(0.08, 16, 16);
      const sphereMat = new THREE.MeshStandardMaterial({ 
        color: region.color,
        emissive: region.color,
        emissiveIntensity: 0.7,
        roughness: 0.2
      });
      const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);

      pinContainer.add(ringMesh);
      pinContainer.add(sphereMesh);
      pinsGroup.add(pinContainer);
    });

    // CT Scan Slicing Laser Plane
    const planeGeo = new THREE.PlaneGeometry(3.6, 3.6);
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
    
    // Add glowing grid line border to slice plane
    const gridEdges = new THREE.EdgesGeometry(planeGeo);
    const gridLine = new THREE.LineSegments(gridEdges, new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2 }));
    slicePlane.add(gridLine);

    brainGroup.add(slicePlane);
    slicePlaneRef.current = slicePlane;

    // Interactive Drag to Rotate Logic
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      isDragging = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      prevMouseX = clientX;
      prevMouseY = clientY;
    };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !brainGroupRef.current) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const deltaX = clientX - prevMouseX;
      const deltaY = clientY - prevMouseY;

      brainGroupRef.current.rotation.y += deltaX * 0.008;
      brainGroupRef.current.rotation.x += deltaY * 0.006;
      brainGroupRef.current.rotation.x = Math.max(-1.1, Math.min(1.1, brainGroupRef.current.rotation.x));

      prevMouseX = clientX;
      prevMouseY = clientY;
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

    // Animation Render Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      if (autoRotate && !isDragging && brainGroupRef.current) {
        brainGroupRef.current.rotation.y += delta * 0.45;
      }

      // Keep pins facing the camera
      if (pinsGroupRef.current && cameraRef.current) {
        pinsGroupRef.current.children.forEach(pin => {
          pin.children[0]?.lookAt(cameraRef.current!.position);
        });
      }

      renderer.render(scene, camera);
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

      leftHemGeo.dispose();
      rightHemGeo.dispose();
      leftCerebGeo.dispose();
      rightCerebGeo.dispose();
      brainstemGeo.dispose();
      planeGeo.dispose();
      defaultMaterial.dispose();
      renderer.dispose();
      if (container.contains(dom)) {
        container.removeChild(dom);
      }
    };
  }, []);

  // Update Materials based on renderMode & selectedRegion
  useEffect(() => {
    if (!brainGroupRef.current) return;
    const group = brainGroupRef.current;

    const leftCerebrum = group.getObjectByName('left_cerebrum') as THREE.Mesh;
    const rightCerebrum = group.getObjectByName('right_cerebrum') as THREE.Mesh;
    const leftCereb = group.getObjectByName('left_cerebellum') as THREE.Mesh;
    const rightCereb = group.getObjectByName('right_cerebellum') as THREE.Mesh;
    const brainstem = group.getObjectByName('brainstem') as THREE.Mesh;
    const ventricles = group.getObjectByName('ventricles') as THREE.Group;

    if (!leftCerebrum || !rightCerebrum) return;

    let baseMat: THREE.Material;

    if (renderMode === 'ct_window') {
      // Monochromatic Head CT Soft Tissue Window (Gray scale / brain parenchymal density 30-40 HU)
      baseMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        roughness: 0.65,
        metalness: 0.1,
        wireframe: false,
      });
    } else if (renderMode === 'wireframe') {
      // 3D Neural Mesh
      baseMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        wireframe: true,
        roughness: 0.2,
      });
    } else if (renderMode === 'xray') {
      // Semi-transparent X-ray / CT bone window
      baseMat = new THREE.MeshPhysicalMaterial({
        color: 0xe0f2fe,
        transparent: true,
        opacity: 0.35,
        transmission: 0.85,
        roughness: 0.1,
        depthWrite: false,
      });
    } else {
      // Anatomical Mode with highlight for selected region
      const activeColor = new THREE.Color(selectedRegion.color);
      baseMat = new THREE.MeshStandardMaterial({
        color: selectedRegionId === 'ventricles' ? 0x94a3b8 : activeColor,
        roughness: 0.42,
        metalness: 0.15,
      });
    }

    [leftCerebrum, rightCerebrum].forEach(m => {
      if (m) m.material = baseMat.clone();
    });

    if (leftCereb && rightCereb) {
      if (renderMode === 'anatomic' || selectedRegionId === 'cerebellum') {
        const cerebColor = selectedRegionId === 'cerebellum' ? new THREE.Color('#ec4899') : new THREE.Color('#f472b6');
        const cerebMat = new THREE.MeshStandardMaterial({ color: cerebColor, roughness: 0.5 });
        leftCereb.material = cerebMat;
        rightCereb.material = cerebMat;
      } else {
        leftCereb.material = baseMat.clone();
        rightCereb.material = baseMat.clone();
      }
    }

    if (brainstem) {
      if (renderMode === 'anatomic' || selectedRegionId === 'brainstem') {
        const stemColor = selectedRegionId === 'brainstem' ? new THREE.Color('#06b6d4') : new THREE.Color('#22d3ee');
        brainstem.material = new THREE.MeshStandardMaterial({ color: stemColor, roughness: 0.5 });
      } else {
        brainstem.material = baseMat.clone();
      }
    }

    if (ventricles) {
      ventricles.visible = renderMode === 'xray' || selectedRegionId === 'ventricles' || renderMode === 'wireframe';
    }
  }, [renderMode, selectedRegionId, selectedRegion]);

  // Update Slice Plane Position & Visibility
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

  // Toggle Pins Visibility
  useEffect(() => {
    if (pinsGroupRef.current) {
      pinsGroupRef.current.visible = showPins;
    }
  }, [showPins]);

  // Reset Camera View
  const handleResetCamera = () => {
    if (cameraRef.current && brainGroupRef.current) {
      cameraRef.current.position.set(0, 1.2, 5.2);
      brainGroupRef.current.rotation.set(0, 0, 0);
      setZoomScale(1);
    }
  };

  const handleZoom = (delta: number) => {
    if (!cameraRef.current) return;
    const newZ = cameraRef.current.position.z + delta;
    cameraRef.current.position.z = Math.max(2.8, Math.min(7.5, newZ));
    setZoomScale(Number((5.2 / cameraRef.current.position.z).toFixed(2)));
  };

  const handleSelectRegion = (id: string) => {
    setSelectedRegionId(id);
    setAutoRotate(false);

    // Gently rotate model toward the pin position for optimal visibility
    const reg = BRAIN_REGIONS.find(r => r.id === id);
    if (reg && brainGroupRef.current) {
      const [px, py, pz] = reg.pinPosition;
      const targetY = Math.atan2(px, pz);
      brainGroupRef.current.rotation.y = -targetY;
      brainGroupRef.current.rotation.x = -py * 0.25;
    }
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl text-white">
      {/* Top Banner Header */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0 border border-indigo-500/30 shadow-inner">
            <Brain className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Interactive 3D Neuroanatomy
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">• WebGL High-Precision Model</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Brain Map
              <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                CXR to CT Bridge
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 max-w-xl">
              Rotate, slice, and interact with the 3D cerebrum, cerebellum, and brainstem. Click any anatomical lobe to review cross-sectional Head CT correlations and acute emergency findings.
            </p>
          </div>
        </div>

        {/* View Controls & CT CTA */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
              autoRotate 
                ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/40' 
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
            title="Toggle Auto Rotation"
          >
            <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
            <span>{autoRotate ? 'Rotating' : 'Paused'}</span>
          </button>

          <button
            onClick={handleResetCamera}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Reset Camera Orientation"
          >
            <Compass className="w-4 h-4" />
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

      {/* Main 3D Canvas & Anatomy Sidebar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        
        {/* Left / Center 3D Interactive Viewport */}
        <div className="lg:col-span-7 xl:col-span-8 relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 min-h-[440px] flex items-center justify-center select-none overflow-hidden group">
          
          {/* 3D WebGL Canvas Mount */}
          <div ref={mountRef} className="w-full h-[460px] cursor-grab active:cursor-grabbing" />

          {/* Floating Canvas Top Overlay: Rendering Mode Selector */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
            <div className="flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-md p-1 rounded-2xl border border-slate-800 pointer-events-auto shadow-xl">
              {(['anatomic', 'ct_window', 'wireframe', 'xray'] as RenderMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setRenderMode(mode)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all ${
                    renderMode === mode
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {mode === 'anatomic' && 'Anatomy'}
                  {mode === 'ct_window' && 'CT Window'}
                  {mode === 'wireframe' && 'Neural Mesh'}
                  {mode === 'xray' && 'Deep Ventricles'}
                </button>
              ))}
            </div>

            {/* Quick Zoom In / Out Buttons */}
            <div className="flex items-center gap-1 bg-slate-900/85 backdrop-blur-md p-1 rounded-2xl border border-slate-800 pointer-events-auto shadow-xl">
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

          {/* Floating Canvas Bottom Overlay: CT Slice Plane Simulator */}
          <div className="absolute bottom-4 left-4 right-4 bg-slate-900/85 backdrop-blur-md p-3 rounded-2xl border border-slate-800 pointer-events-auto z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl">
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
            </div>
          </div>

          {/* Interactive Hint Indicator */}
          <div className="absolute bottom-18 left-1/2 -translate-x-1/2 pointer-events-none opacity-40 group-hover:opacity-0 transition-opacity">
            <span className="text-[10px] bg-slate-950/80 px-3 py-1 rounded-full text-slate-400 border border-slate-800 backdrop-blur-sm">
              🖱️ Drag to rotate 360° • Scroll to zoom
            </span>
          </div>
        </div>

        {/* Right Anatomical Diagnostic Panel */}
        <div className="lg:col-span-5 xl:col-span-4 p-5 sm:p-6 bg-slate-900 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-800">
          <div className="space-y-4">
            
            {/* Region Selector Pills */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Select Anatomical Region / Lobe
              </span>
              <div className="flex flex-wrap gap-1.5">
                {BRAIN_REGIONS.map((region) => {
                  const isSelected = region.id === selectedRegionId;
                  return (
                    <button
                      key={region.id}
                      onClick={() => handleSelectRegion(region.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-slate-800 text-white shadow-md'
                          : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800/50'
                      }`}
                      style={{
                        borderColor: isSelected ? region.color : undefined,
                        boxShadow: isSelected ? `0 0 12px ${region.color}33` : undefined,
                      }}
                    >
                      <span 
                        className="w-2 h-2 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: region.color }} 
                      />
                      <span>{region.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Region Clinical Diagnostic Card */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3 shadow-inner">
              <div className="flex items-start justify-between gap-2">
                <div>
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
                  <h3 className="text-lg font-bold text-white mt-1">
                    {selectedRegion.name}
                  </h3>
                </div>
                <div 
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${selectedRegion.color}25`, color: selectedRegion.color }}
                >
                  <Activity className="w-4 h-4" />
                </div>
              </div>

              {/* Functional Role */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  Primary Function
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedRegion.function}
                </p>
              </div>

              {/* CT Radiological Significance */}
              <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-900/40">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                  <Crosshair className="w-3 h-3" /> Head CT Correlation
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedRegion.radiologicalRelevance}
                </p>
                <div className="mt-2 text-[11px] text-sky-300 font-mono flex items-center gap-1.5">
                  <span className="text-slate-400">Slice level:</span>
                  <span className="font-semibold">{selectedRegion.ctSliceLevel}</span>
                </div>
              </div>

              {/* Common Acute Pathologies */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  High-Yield Pathologies on Head CT
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
