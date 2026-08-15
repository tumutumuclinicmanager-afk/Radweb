import { MedicalCase } from '../types';

export const MEDICAL_CASES: MedicalCase[] = [
  // --- CHEST X-RAY CASES (10 cases) ---
  {
    id: 'cxr-1',
    title: 'Normal Adult Chest X-Ray (PA & Lateral)',
    modality: 'chest_xray',
    category: 'Normal',
    imageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Normal PA Chest X-ray showing clear lung fields and normal cardiac silhouette',
    question: 'What anatomical landmarks verify adequate inspiration and positioning on this PA chest radiograph?',
    diagnosis: 'Normal Chest Radiograph',
    keyFindings: [
      'Trachea is midline and patent.',
      'Cardiothoracic ratio is normal (< 0.5).',
      'Both lung fields are clear without focal consolidation, pneumothorax, or pleural effusion.',
      'Costophrenic angles are sharp and well-defined.',
      'Osseous structures and soft tissues are unremarkable.'
    ],
    clinicalSignificance: 'Establishing baseline normal variants prevents misinterpretation of artifact (e.g., skin folds, nipples, scapulae overlap) as pathology.',
    differentialDiagnosis: ['Normal variant', 'Early interstitial process (if subtle)', 'Over-penetrated or under-penetrated film'],
    reportingTemplate: 'CHEST, PA AND LATERAL:\nLungs are clear bilaterally without focal airspace disease, pneumothorax, or large pleural effusion. Cardiac and mediastinal contours are normal in size and configuration. Osseous structures are intact.',
    teachingPoints: [
      'Always check the ABCDEs: Airway, Bones, Cardiac silhouette, Diaphragm/Effusions, Everything else (soft tissue/lines).',
      'Inspiration is adequate if 9 to 10 posterior ribs are visible above the diaphragm on the PA view.'
    ],
    cmeTip: 'A common pitfall is mistaking skin folds or breast shadows for pneumothorax margins. Always trace vessels past any suspected pleural line.',
    difficulty: 'Beginner',
    galleryImages: [
      { url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80', caption: 'Posteroanterior (PA) View - Standard Inspiration' },
      { url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80', caption: 'Lateral View - Retrosternal and Retrocardiac Spaces' },
      { url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80', caption: 'Apical View Highlighting Clavicles & First Ribs' }
    ]
  },
  {
    id: 'cxr-2',
    title: 'Tension Pneumothorax (Right Lung Collapse)',
    modality: 'chest_xray',
    category: 'Emergency Findings',
    imageUrl: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Chest X-ray showing complete collapse of right lung with mediastinal shift',
    question: 'What is the immediate life-threatening radiographic sign that distinguishes tension pneumothorax from simple pneumothorax?',
    diagnosis: 'Large Right-Sided Tension Pneumothorax',
    keyFindings: [
      'Complete collapse of the right lung toward the hilum with absent lung markings peripheral to the visceral pleural line.',
      'Significant contralateral shift of the trachea and mediastinum to the left.',
      'Deep sulcus sign and depression of the right hemidiaphragm.',
      'Increased intercostal spaces on the affected side.'
    ],
    clinicalSignificance: 'Tension pneumothorax causes elevated intrathoracic pressure leading to venous return obstruction, cardiovascular collapse, and cardiac arrest. It is a clinical diagnosis requiring immediate needle decompression prior to chest tube insertion.',
    differentialDiagnosis: ['Simple pneumothorax', 'Large congenital pulmonary cyst', 'Diaphragmatic rupture with herniation'],
    reportingTemplate: 'CHEST, PORTABLE:\nLarge right-sided pneumothorax with complete collapse of the right lung. Marked contralateral shift of the mediastinum and trachea to the left, highly concerning for tension physiology. Urgent needle decompression or chest tube placement recommended.',
    teachingPoints: [
      'Never wait for radiology confirmation if a patient is hemodynamically unstable with clinical signs of tension pneumothorax (absent breath sounds, tracheal deviation, hypotension).',
      'Examine the visceral pleural line carefully; lack of lung markings beyond this line is diagnostic.'
    ],
    cmeTip: 'In supine trauma patients, a pneumothorax often accumulates anteriorly and inferiorly, producing the characteristic "deep sulcus sign".',
    difficulty: 'Advanced',
    galleryImages: [
      { url: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=1200&q=80', caption: 'Upright PA View Showing Visceral Pleural Line' },
      { url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80', caption: 'Supine Trauma View with Deep Sulcus Sign' },
      { url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80', caption: 'Post-Chest Tube Re-expansion View' }
    ]
  },
  {
    id: 'cxr-3',
    title: 'Lobar Pneumonia (Right Middle Lobe)',
    modality: 'chest_xray',
    category: 'Common Pathology',
    imageUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Chest X-ray showing dense opacification in the right middle lobe',
    question: 'Which anatomical fissure borders the superior margin of the right middle lobe consolidation?',
    diagnosis: 'Right Middle Lobe Bacterial Pneumonia',
    keyFindings: [
      'Dense focal airspace opacification in the right mid-lung zone.',
      'Air bronchograms visible within the opacified region, confirming alveolar filling process.',
      'Obliteration of the right heart border (silhouette sign).',
      'Minor (horizontal) fissure is well demarcated superiorly.'
    ],
    clinicalSignificance: 'Bacterial pneumonia typically presents with fever, productive cough, and pleuritic chest pain. The silhouette sign helps localize consolidation to specific segments (e.g., right middle lobe borders the right atrium).',
    differentialDiagnosis: ['Atelectasis', 'Aspiration pneumonitis', 'Pulmonary infarction', 'Bronchoalveolar carcinoma'],
    reportingTemplate: 'CHEST, PA AND LATERAL:\nConsolidation within the right middle lobe with associated air bronchograms. The right heart border is silhouetted. No pleural effusion or pneumothorax. Left lung is clear.',
    teachingPoints: [
      'The "silhouette sign" occurs when two structures of similar radiographic density are in contact, erasing their distinct border.',
      'Right middle lobe syndrome is recurrent atelectasis or infection often caused by extrinsic bronchial compression from lymphadenopathy.'
    ],
    cmeTip: 'Always obtain a lateral view to accurately localize whether an infiltrate is in the middle lobe or lower lobe.',
    difficulty: 'Beginner',
    galleryImages: [
      { url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80', caption: 'PA View Highlighting Right Heart Border Silhouette Sign' },
      { url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80', caption: 'Lateral View Demonstrating Wedge Infiltrate' }
    ]
  },
  {
    id: 'cxr-4',
    title: 'Moderate Bilateral Pleural Effusion',
    modality: 'chest_xray',
    category: 'Common Pathology',
    imageUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Chest X-ray showing blunting of bilateral costophrenic angles with meniscus sign',
    question: 'How much free pleural fluid is typically required to blunt the costophrenic angle on a lateral decubitus vs PA chest radiograph?',
    diagnosis: 'Bilateral Pleural Effusions (Congestive Heart Failure)',
    keyFindings: [
      'Blunting of bilateral posterior and lateral costophrenic angles (meniscus sign).',
      'Cardiomegaly with cephalization of pulmonary vessels (upper lobe pulmonary venous congestion).',
      'Kerley B lines (thin horizontal lines at lung bases representing interstitial edema).',
      'Fluid tracking into the major and minor fissures.'
    ],
    clinicalSignificance: 'Pleural effusions can stem from hydrostatic pressure increases (CHF, fluid overload), decreased oncotic pressure (cirrhosis, nephrotic syndrome), or increased capillary permeability (pneumonia, malignancy, pulmonary embolism).',
    differentialDiagnosis: ['Pleural thickening', 'Fat pads', 'Subpulenic effusion', 'Loculated pleural fluid'],
    reportingTemplate: 'CHEST, PA AND LATERAL:\nModerate bilateral pleural effusions with blunting of the costophrenic angles. Cardiomegaly and prominent interstitial markings compatible with pulmonary edema. No focal consolidation.',
    teachingPoints: [
      'An upright PA chest x-ray can detect as little as 175-200 mL of fluid in the pleural space, while a lateral view can detect as little as 50 mL.',
      'Look for upward curving meniscus at the lateral chest wall.'
    ],
    cmeTip: 'When pleural effusions are asymmetric or accompanied by fever/pleuritic pain, diagnostic thoracentesis should be considered.',
    difficulty: 'Intermediate',
    galleryImages: [
      { url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80', caption: 'Upright PA View with Meniscus Sign' },
      { url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80', caption: 'Lateral Decubitus View' }
    ]
  },
  {
    id: 'cxr-5',
    title: 'Severe Cardiomegaly with Pulmonary Edema (Bat-Wing Opacities)',
    modality: 'chest_xray',
    category: 'Emergency Findings',
    imageUrl: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Chest X-ray with enlarged heart and perihilar bat-wing alveolar edema',
    question: 'What is the classic term used to describe symmetrical perihilar alveolar edema spreading outward from the hila?',
    diagnosis: 'Acute Decompensated Heart Failure with Pulmonary Edema',
    keyFindings: [
      'Marked cardiomegaly (cardiothoracic ratio > 0.6).',
      'Prominent perihilar "bat-wing" or "angel-wing" alveolar opacities.',
      'Prominent upper lobe pulmonary venous dilatation (cephalization).',
      'Bilateral pleural effusions and thickening of interlobular septa (Kerley B lines).'
    ],
    clinicalSignificance: 'Represents acute left ventricular failure with elevated pulmonary capillary wedge pressure resulting in fluid transudation into the alveolar spaces. Requires urgent diuresis and afterload reduction.',
    differentialDiagnosis: ['Non-cardiogenic pulmonary edema (ARDS)', 'Diffuse alveolar hemorrhage', 'Bilateral pneumonia', 'Aspiration pneumonitis'],
    reportingTemplate: 'CHEST, PORTABLE:\nMarked cardiomegaly. Diffuse bilateral perihilar airspace opacities in a bat-wing distribution, consistent with acute pulmonary edema. Bilateral pleural effusions present.',
    teachingPoints: [
      'Cardiothoracic ratio greater than 0.5 on an adequate PA film defines cardiomegaly.',
      'In acute pulmonary edema, clinical improvement often lags behind radiographic clearing by 24 to 48 hours.'
    ],
    cmeTip: 'Check for vascular pedicle widening (> 58mm) as an early quantitative indicator of intravascular volume overload on portable chest X-rays.',
    difficulty: 'Intermediate',
    galleryImages: [
      { url: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=1200&q=80', caption: 'Portable AP View Demonstrating Bat-Wing Opacities' },
      { url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80', caption: 'Post-Diuresis Follow-up View' }
    ]
  },
  {
    id: 'cxr-6',
    title: 'Left Upper Lobe Atelectasis (Collapsed Lobe)',
    modality: 'chest_xray',
    category: 'Common Pathology',
    imageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Chest radiograph demonstrating volume loss and veil opacity in the left upper hemithorax',
    question: 'What happens to the left hilum and trachea in chronic left upper lobe collapse?',
    diagnosis: 'Left Upper Lobe Atelectasis',
    keyFindings: [
      'Hazy or veil-like increased density throughout the left upper hemithorax.',
      'Superior and anterior displacement of the left hilum and major fissure.',
      'Tracheal deviation to the left due to volume loss.',
      'Compensatory hyperinflation of the left lower lobe.'
    ],
    clinicalSignificance: 'Atelectasis (volume loss) can be caused by endobronchial obstruction (mucus plug, foreign body, primary bronchogenic carcinoma) or extrinsic compression. Bronchoscopy is often indicated if obstruction is suspected.',
    differentialDiagnosis: ['Obstructing bronchogenic carcinoma', 'Severe mucous plugging', 'Pleural fibrosis', 'Pulmonary scar'],
    reportingTemplate: 'CHEST, PA AND LATERAL:\nVolume loss in the left upper lobe with upward retraction of the left hilum and mediastinal structures shifted to the left. No acute focal consolidation.',
    teachingPoints: [
      'Direct signs of volume loss include displacement of fissures, crowding of pulmonary vessels, and elevation of the ipsilateral hemidiaphragm.',
      'Indirect signs include mediastinal shift, compensatory hyperinflation, and approximation of ribs.'
    ],
    cmeTip: 'Always rule out an obstructing endobronchial mass in adult patients presenting with unexplained lobar collapse.',
    difficulty: 'Advanced',
    galleryImages: [
      { url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80', caption: 'PA View Highlighting Veil Opacity' },
      { url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80', caption: 'Lateral View Highlighting Fissure Displacement' }
    ]
  },
  {
    id: 'cxr-7',
    title: 'Left Lower Lobe Pneumonia (Retrocardiac Infiltrate)',
    modality: 'chest_xray',
    category: 'Common Pathology',
    imageUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Chest X-ray showing retrocardiac airspace density obscured on PA view',
    question: 'Why is the lateral chest radiograph critical when evaluating left lower lobe pathology?',
    diagnosis: 'Left Lower Lobe Pneumonia',
    keyFindings: [
      'Subtle retrocardiac opacity obscuring the descending aorta contour on PA view.',
      'Clear triangular retrocardiac density in the lower posterior zone on the lateral view.',
      'Blunting of the posterior costophrenic sulcus.',
      'Normal cardiac size.'
    ],
    clinicalSignificance: 'Lower lobe infiltrates can easily be hidden behind the cardiac silhouette on PA chest X-rays. A lateral radiograph reveals retrocardiac opacification.',
    differentialDiagnosis: ['Left lower lobe atelectasis', 'Pulmonary infarction', 'Intrapulmonary hemorrhage', 'Aspiration'],
    reportingTemplate: 'CHEST, PA AND LATERAL:\nRetrocardiac airspace opacity projected behind the heart, best appreciated on the lateral view, compatible with left lower lobe pneumonia. Left costophrenic angle is clear.',
    teachingPoints: [
      'The "spine sign" on a lateral chest X-ray (lower thoracic spine appears whiter and denser due to overlying infiltrate) is a hallmark of lower lobe pathology.',
      'Always inspect the retrocardiac space systematically.'
    ],
    cmeTip: 'Failing to check the lateral view is a frequent cause of missed lower lobe pneumonias in emergency departments.',
    difficulty: 'Intermediate',
    galleryImages: [
      { url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80', caption: 'PA View with Retrocardiac Density' },
      { url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80', caption: 'Lateral View Highlighting Spine Sign' }
    ]
  },
  {
    id: 'cxr-8',
    title: 'Subdiaphragmatic Free Air (Pneumoperitoneum)',
    modality: 'chest_xray',
    category: 'Emergency Findings',
    imageUrl: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Upright chest X-ray showing crescentic free air under the right hemidiaphragm',
    question: 'What is the most common cause of pneumoperitoneum seen on acute abdominal and chest radiographs?',
    diagnosis: 'Pneumoperitoneum secondary to Viscous Perforation',
    keyFindings: [
      'Crescentic lucency (free air) beneath the right hemidiaphragm on upright view.',
      'Rigler’s sign (visualization of both sides of the bowel wall when free air is present in peritoneal cavity on supine view).',
      'Falciform ligament sign (air outlining the falciform ligament).',
      'Loss of normal liver dullness on physical examination.'
    ],
    clinicalSignificance: 'Pneumoperitoneum is a surgical emergency indicating hollow viscus perforation (e.g., perforated peptic ulcer, diverticulitis, appendiceal perforation) requiring emergent surgical consultation.',
    differentialDiagnosis: ['Chilaiditi syndrome (colon interposition between liver and diaphragm)', 'Subphrenic abscess with gas-producing organisms', 'Diaphragmatic eventration'],
    reportingTemplate: 'CHEST, UPRIGHT:\nFree intraperitoneal air visualized as a crescentic lucency beneath the right hemidiaphragm. No acute pulmonary parenchymal consolidation.',
    teachingPoints: [
      'An upright chest X-ray is more sensitive for detecting free intraperitoneal air than a supine abdominal radiograph.',
      'Even small amounts of free air (as little as 1 mL) can be detected under the right hemidiaphragm because the liver acts as an acoustic/radiographic window.'
    ],
    cmeTip: 'If a patient cannot stand upright, obtain a left lateral decubitus abdominal radiograph where free air accumulates over the liver edge.',
    difficulty: 'Advanced',
    galleryImages: [
      { url: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=1200&q=80', caption: 'Upright View Showing Subdiaphragmatic Air' },
      { url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80', caption: 'Supine View with Rigler Sign' }
    ]
  },
  {
    id: 'cxr-9',
    title: 'Normal Pediatric Chest X-ray (Thymic Sail Sign)',
    modality: 'chest_xray',
    category: 'Normal',
    imageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Pediatric chest X-ray showing normal prominent superior mediastinum with thymic sail sign',
    question: 'What benign pediatric mediastinal structure can mimic cardiomegaly or a widened mediastinum in infants?',
    diagnosis: 'Normal Thymus with Thymic Sail Sign in Infant',
    keyFindings: [
      'Prominent superior mediastinal shadow with sharp, wave-like or angular lateral borders ("thymic sail" or "wave sign").',
      'Lungs are clear and well-expanded.',
      'Normal rib cage and airway alignment.'
    ],
    clinicalSignificance: 'Recognizing normal pediatric thymic anatomy prevents unnecessary diagnostic workups, antibiotic courses, or CT scans for suspected mediastinal masses.',
    differentialDiagnosis: ['Mediastinal mass / lymphoma', 'Lymphadenopathy', 'Pericardial effusion', 'Aspiration'],
    reportingTemplate: 'CHEST, AP (PEDIATRIC):\nClear lung fields bilaterally. Prominent superior mediastinal soft tissue contour representing normal thymic tissue, demonstrating the classic wave/sail configuration. Heart size is normal.',
    teachingPoints: [
      'The thymus naturally decreases in size during periods of severe stress or illness ("stress involution") and rapidly rebounds upon recovery.',
      'The wave sign is created by anterior rib impressions on the normal thymic lobes.'
    ],
    cmeTip: 'Do not mistake normal thymic tissue in infants for pneumonia, widened mediastinum, or cardiomegaly.',
    difficulty: 'Beginner',
    galleryImages: [
      { url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80', caption: 'Pediatric AP View with Thymic Sail Sign' }
    ]
  },
  {
    id: 'cxr-10',
    title: 'Pulmonary Embolism Sign (Westermark Sign & Hampton Hump)',
    modality: 'chest_xray',
    category: 'Emergency Findings',
    imageUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Chest X-ray showing focal oligemia and peripheral wedge opacity',
    question: 'What classic chest X-ray sign describes focal oligemia or decreased vascular markings distal to an occluded pulmonary artery?',
    diagnosis: 'Pulmonary Embolism with Westermark Sign',
    keyFindings: [
      'Westermark sign: focal area of oligemia / hyperlucency distal to a pulmonary embolus.',
      'Hampton’s hump: peripheral wedge-shaped opacity abutting the pleural surface representing pulmonary infarction.',
      'Elevated hemidiaphragm and small ipsilateral pleural effusion.',
      'Often the chest X-ray is completely normal in acute PE (normal CXR does not rule out PE).'
    ],
    clinicalSignificance: 'Chest X-rays in pulmonary embolism are frequently normal or non-specific; their main utility is ruling out alternative diagnoses (pneumonia, pneumothorax, rib fracture). CTA chest or V/Q scan is the definitive diagnostic modality.',
    differentialDiagnosis: ['Pneumonia', 'Atelectasis', 'Primary lung cancer', 'Rib fracture'],
    reportingTemplate: 'CHEST, PA AND LATERAL:\nNo focal consolidation or pneumothorax. Subtle wedge-shaped peripheral opacity in the right lower zone (Hampton hump) with localized oligemia, raising clinical suspicion for pulmonary embolus. CT pulmonary angiogram recommended if clinically indicated.',
    teachingPoints: [
      'A normal chest radiograph in a dyspneic patient with tachycardia strongly increases the post-test probability of pulmonary embolism.',
      'Hampton hump base is always against the pleural surface with its apex pointing toward the hilum.'
    ],
    cmeTip: 'Always correlate suspected PE findings with Wells Score or Geneva criteria and D-dimer testing.',
    difficulty: 'Advanced',
    galleryImages: [
      { url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80', caption: 'PA View Highlighting Hampton Hump' },
      { url: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=1200&q=80', caption: 'CTA Pulmonary Angiogram Correlative View' }
    ]
  },

  // --- HEAD CT CASES (10 cases) ---
  {
    id: 'ct-1',
    title: 'Normal Non-Contrast Brain CT',
    modality: 'head_ct',
    category: 'Normal',
    imageUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Normal non-contrast head CT showing symmetric ventricles and sulci',
    question: 'What is the standard Hounsfield Unit (HU) of acute blood vs cerebrospinal fluid (CSF) on a non-contrast head CT?',
    diagnosis: 'Normal Non-Contrast Head CT',
    keyFindings: [
      'Symmetric gray-white matter differentiation throughout cerebral hemispheres.',
      'Normal basal cisterns, sylvian fissures, and cortical sulci without effacement.',
      'Ventricles (lateral, third, and fourth) are normal in size and midline.',
      'No evidence of acute hemorrhage, mass effect, or midline shift.'
    ],
    clinicalSignificance: 'Establishing normal CT anatomy allows rapid identification of subtle effacements, midline shifts, and hyperdensities in trauma or acute stroke settings.',
    differentialDiagnosis: ['Normal variant', 'Early subtle cerebral edema', 'Mild age-related atrophy'],
    reportingTemplate: 'CT HEAD WITHOUT CONTRAST:\nThere is no intracranial hemorrhage, acute territorial infarction, mass, or mass effect. Gray-white matter differentiation is preserved. Ventricles and basal cisterns are normal in caliber and configuration. Midline structures are in normal alignment.',
    teachingPoints: [
      'Blood is hyperdense (bright white, ~60-90 HU) in the acute phase.',
      'CSF is hypodense (dark black, ~0-15 HU) matching water density.'
    ],
    cmeTip: 'Always check the basal cisterns first in acute trauma. Effacement of the suprasellar and prepontine cisterns indicates life-threatening elevated intracranial pressure.',
    difficulty: 'Beginner',
    galleryImages: [
      { url: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=1200&q=80', caption: 'Axial Brain Window at Ventricular Level' },
      { url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80', caption: 'Axial Bone Window Showing Calvarium' }
    ]
  },
  {
    id: 'ct-2',
    title: 'Acute Epidural Hematoma (Lens-Shaped Biconvex Collection)',
    modality: 'head_ct',
    category: 'Emergency Findings',
    imageUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Non-contrast head CT showing biconvex hyperdense extra-axial collection with mass effect',
    question: 'Which meningeal vessel is most commonly lacerated in acute epidural hematoma, leading to arterial bleeding?',
    diagnosis: 'Acute Epidural Hematoma (EDH) with Middle Meningeal Artery Injury',
    keyFindings: [
      'Biconvex (lens-shaped) hyperdense extra-axial collection typically located in the temporal or temporoparietal region.',
      'Does not cross cranial suture lines because dura is tightly bound to bone at sutures.',
      'Associated overlying linear skull fracture in 85-90% of adult cases.',
      'Mass effect with compression of adjacent brain parenchyma, effacement of the ipsilateral lateral ventricle, and midline shift.'
    ],
    clinicalSignificance: 'Often associated with the classic "lucid interval" followed by rapid neurological deterioration due to arterial bleeding (middle meningeal artery). Neurosurgical emergency requiring urgent craniotomy/burr hole evacuation.',
    differentialDiagnosis: ['Subdural hematoma', 'Subarachnoid hemorrhage', 'Epidural abscess'],
    reportingTemplate: 'CT HEAD WITHOUT CONTRAST:\nBiconvex hyperdense extra-axial collection measuring approx. 2.2 cm in maximal thickness centered over the right temporal region, consistent with acute epidural hematoma. Associated temporal bone fracture. Marked mass effect with 7 mm right-to-left midline shift and uncal herniation.',
    teachingPoints: [
      'Epidural hematomas are bounded by suture lines where the dura adheres tightly to the skull.',
      'Rapid arterial pressure can cause uncal herniation, brainstem compression, and death if untreated.'
    ],
    cmeTip: 'Never delay neurosurgical consultation when an epidural hematoma is identified, even if the patient is currently awake and stable.',
    difficulty: 'Advanced',
    galleryImages: [
      { url: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=1200&q=80', caption: 'Brain Window Showing Biconvex Hyperdensity' },
      { url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80', caption: 'Bone Window Showing Temporal Skull Fracture' }
    ]
  },
  {
    id: 'ct-3',
    title: 'Acute Subdural Hematoma (Crescent-Shaped Collection)',
    modality: 'head_ct',
    category: 'Emergency Findings',
    imageUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Non-contrast head CT showing crescent-shaped hyperdense extra-axial collection',
    question: 'What vascular structure is typically torn to cause an acute subdural hematoma?',
    diagnosis: 'Acute Subdural Hematoma (SDH) from Bridging Vein Rupture',
    keyFindings: [
      'Crescent-shaped (concavoconvex) hyperdense extra-axial collection conforming to the contour of the cerebral hemisphere.',
      'Crosses cranial suture lines freely (unlike epidural hematomas).',
      'Associated mass effect, sulcal effacement, and potential midline shift.',
      'May mix with subarachnoid hemorrhage or underlying contusions.'
    ],
    clinicalSignificance: 'Caused by high-speed acceleration/deceleration trauma tearing bridging veins between the cerebral cortex and dural venous sinuses. Frequently seen in elderly patients and chronic alcohol users after minor falls.',
    differentialDiagnosis: ['Epidural hematoma', 'Subdural hygroma', 'Subarachnoid hemorrhage', 'Dural thickening'],
    reportingTemplate: 'CT HEAD WITHOUT CONTRAST:\nCrescent-shaped hyperdense extra-axial collection along the left cerebral convexity measuring up to 1.5 cm in width, consistent with acute subdural hematoma. It crosses suture lines. Subfalcine herniation to the right of 5 mm.',
    teachingPoints: [
      'Subdural hematomas evolve in density over time: acute is hyperdense (bright white), subacute is isodense (gray), and chronic is hypodense (dark gray/black).',
      'Because they cross suture lines, subdural collections can spread over the entire cerebral hemisphere.'
    ],
    cmeTip: 'An isodense subacute subdural hematoma (approx. 1-3 weeks old) can be easily missed. Always check for sulcal effacement and inward displacement of the gray-white matter junction.',
    difficulty: 'Intermediate',
    galleryImages: [
      { url: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=1200&q=80', caption: 'Axial View Demonstrating Crescentic Hyperdensity' },
      { url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80', caption: 'Coronal Reconstruction View' }
    ]
  },
  {
    id: 'ct-4',
    title: 'Acute Middle Cerebral Artery (MCA) Infarct',
    modality: 'head_ct',
    category: 'Emergency Findings',
    imageUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Non-contrast head CT showing loss of insular ribbon and MCA dot sign',
    question: 'What early CT sign indicates acute thrombus within the horizontal segment of the middle cerebral artery?',
    diagnosis: 'Acute Right MCA Territory Ischemic Stroke',
    keyFindings: [
      'Hyperdense MCA sign (acute thrombus within the vessel lumen).',
      'Loss of the normal sharp gray-white matter differentiation in the basal ganglia (lentiform nucleus obscuration).',
      'Effacement of the insular ribbon (loss of cortical distinction in the insula).',
      'Hypodensity and swelling of the right MCA territory in established infarcts.'
    ],
    clinicalSignificance: 'Non-contrast CT is primarily used in acute stroke to rule out intracranial hemorrhage before administering IV thrombolysis (tPA) or performing mechanical thrombectomy.',
    differentialDiagnosis: ['Low-grade glioma', 'Encephalitis', 'Post-ictal changes (Todd’s paresis)', 'Demyelinating plaque'],
    reportingTemplate: 'CT HEAD WITHOUT CONTRAST:\nEarly ischemic changes in the right MCA territory including loss of the insular ribbon, obscuration of the lentiform nucleus, and focal hypodensity involving the right temporal and parietal lobes. No acute intracranial hemorrhage.',
    teachingPoints: [
      'The Alberta Stroke Program Early CT Score (ASPECTS) is used to quantify early ischemic changes in the MCA territory out of 10 points.',
      'Hyperacute ischemia (< 3 hours) may appear completely normal on non-contrast CT.'
    ],
    cmeTip: 'Time is brain. Rapid non-contrast CT is mandatory within 20 minutes of arrival for acute stroke protocol patients.',
    difficulty: 'Advanced',
    galleryImages: [
      { url: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=1200&q=80', caption: 'Axial CT Showing Loss of Insular Ribbon' },
      { url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80', caption: 'Follow-up CT at 48 Hours with Established Hypodensity' }
    ]
  },
  {
    id: 'ct-5',
    title: 'Aneurysmal Subarachnoid Hemorrhage (Starfish Sign)',
    modality: 'head_ct',
    category: 'Emergency Findings',
    imageUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Non-contrast head CT showing high-density blood filling basal cisterns and sylvian fissures',
    question: 'What grading scale is commonly used clinically to classify the severity of subarachnoid hemorrhage based on initial CT appearance?',
    diagnosis: 'Acute Subarachnoid Hemorrhage (SAH) from Ruptured Berry Aneurysm',
    keyFindings: [
      'High-attenuation (bright white) blood filling the basal cisterns, sylvian fissures, and interhemispheric fissure (the "starfish" or "fluent" sign).',
      'Blood within the ventricular system (intraventricular extension) indicating severe rupture.',
      'Associated hydrocephalus due to arachnoid granulation obstruction by blood products.'
    ],
    clinicalSignificance: 'Patients present with sudden onset "thunderclap headache" (worst headache of their life). Most commonly caused by rupture of a saccular (berry) aneurysm of the Circle of Willis. Urgent CTA or catheter angiography required.',
    differentialDiagnosis: ['Meningitis', 'Pituitary apoplexy', 'Venous sinus thrombosis with high-density clot', 'Artifact'],
    reportingTemplate: 'CT HEAD WITHOUT CONTRAST:\nDiffuse hyperdensity within the basal cisterns, sylvian fissures, and bilateral sulci, consistent with acute subarachnoid hemorrhage. Intraventricular extension into the occipital horns. Mild acute obstructive hydrocephalus. CTA head recommended to evaluate for intracranial aneurysm.',
    teachingPoints: [
      'Non-contrast CT sensitivity for SAH approaches 95-98% within the first 6 hours of symptom onset, declining rapidly after 24-48 hours.',
      'If CT is negative but clinical suspicion remains high, lumbar puncture is mandatory to evaluate for xanthochromia.'
    ],
    cmeTip: 'Never discharge a patient with thunderclap headache based solely on a non-contrast CT without ruling out SAH definitively.',
    difficulty: 'Advanced',
    galleryImages: [
      { url: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=1200&q=80', caption: 'Axial CT Showing Basal Cistern Blood (Starfish Sign)' },
      { url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80', caption: 'CTA Circle of Willis Aneurysm Reconstruction' }
    ]
  },
  {
    id: 'ct-6',
    title: 'Hypertensive Intracerebral Hemorrhage (Basal Ganglia)',
    modality: 'head_ct',
    category: 'Emergency Findings',
    imageUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Non-contrast head CT showing dense focal hematoma in the left basal ganglia',
    question: 'What are the four most common hypertensive target locations for spontaneous intracerebral hemorrhage?',
    diagnosis: 'Spontaneous Hypertensive Intracerebral Hemorrhage (Putamen)',
    keyFindings: [
      'Well-circumscribed homogeneous hyperdense hematoma located in the basal ganglia (putamen/internal capsule).',
      'Surrounding hypodense rim representing vasogenic edema ("halo sign").',
      'Significant mass effect with compression of the adjacent lateral ventricle and midline shift.',
      'Potential intraventricular rupture.'
    ],
    clinicalSignificance: 'Chronic poorly controlled hypertension causes microaneurysms (Charcot-Bouchard microaneurysms) of small penetrating lenticulostriate arteries that rupture under high pressure.',
    differentialDiagnosis: ['Amyloid angiopathy (typically lobar hemorrhage)', 'Arteriovenous malformation (AVM)', 'Tumor hemorrhage', 'Coagulopathy'],
    reportingTemplate: 'CT HEAD WITHOUT CONTRAST:\nLarge acute hyperdense intracerebral hematoma centered in the left basal ganglia measuring 4.5 x 3.2 cm, surrounded by significant vasogenic edema. There is 6 mm of rightward midline shift and compression of the left lateral ventricle. Intraventricular extension noted.',
    teachingPoints: [
      'The four classic hypertensive hemorrhage sites are: Putamen/basal ganglia (most common), Thalamus, Pons, and Cerebellum.',
      'Strict blood pressure control and reversal of coagulopathy are paramount in management.'
    ],
    cmeTip: 'Lobar hemorrhages in elderly patients are more frequently secondary to cerebral amyloid angiopathy rather than chronic hypertension.',
    difficulty: 'Intermediate',
    galleryImages: [
      { url: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=1200&q=80', caption: 'Axial CT View of Basal Ganglia Hemorrhage' },
      { url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80', caption: 'Coronal View Highlighting Midline Shift' }
    ]
  },
  {
    id: 'ct-7',
    title: 'Chronic Subdural Hematoma (Hypodense Crescent)',
    modality: 'head_ct',
    category: 'Common Pathology',
    imageUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Non-contrast head CT showing bilateral chronic hypodense subdural collections',
    question: 'Why do chronic subdural hematomas appear dark (hypodense) on non-contrast head CT?',
    diagnosis: 'Bilateral Chronic Subdural Hematomas',
    keyFindings: [
      'Crescent-shaped extra-axial collection that is hypodense (dark gray or water density) relative to brain parenchyma.',
      'May show internal septations or acute-on-chronic hyperdense layering components if rebleeding occurs.',
      'Gradual cerebral atrophy compensation; sulci may be masked or compressed.',
      'Often bilateral in elderly patients.'
    ],
    clinicalSignificance: 'Occurs weeks to months after trivial head trauma. As blood breakdown products degrade and protein osmotic pressure draws in CSF, the clot liquefies and becomes hypodense. Common in elderly patients presenting with progressive confusion, gait instability, or dementia symptoms.',
    differentialDiagnosis: ['Subdural hygroma', 'Benign enlargement of subarachnoid space in infancy', 'Arachnoid cyst'],
    reportingTemplate: 'CT HEAD WITHOUT CONTRAST:\nBilateral crescent-shaped extra-axial hypodense collections along the cerebral convexities, consistent with chronic subdural hematomas. Mild mass effect on underlying sulci without significant midline shift.',
    teachingPoints: [
      'Chronic SDHs are enclosed in a neomembrane containing fragile microvessels prone to recurrent minor micro-hemorrhages.',
      'Surgical burr hole drainage or twist drill craniostomy is performed if symptomatic.'
    ],
    cmeTip: 'Always check elderly patients presenting with unexplained cognitive decline or falls for chronic subdural hematoma.',
    difficulty: 'Beginner',
    galleryImages: [
      { url: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=1200&q=80', caption: 'Axial View Showing Hypodense Crescent' },
      { url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80', caption: 'Post-Burr Hole Evacuation View' }
    ]
  },
  {
    id: 'ct-8',
    title: 'Obstructive Hydrocephalus with Ventriculomegaly',
    modality: 'head_ct',
    category: 'Common Pathology',
    imageUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Non-contrast head CT showing prominent enlargement of lateral and third ventricles',
    question: 'What is the radiographic sign of transependymal CSF migration (interstitial edema) seen around the ventricles in acute obstructive hydrocephalus?',
    diagnosis: 'Obstructive Hydrocephalus with Periventricular Edema',
    keyFindings: [
      'Marked symmetrical enlargement of the lateral and third ventricles (fourth ventricle may be normal or enlarged depending on site of obstruction).',
      'Periventricular low attenuation (interstitial edema) capping the frontal horns.',
      'Rounding of the frontal horns of the lateral ventricles.',
      'Ballooning of the third ventricle floor.'
    ],
    clinicalSignificance: 'Impaired CSF circulation or absorption leads to elevated intracranial pressure. Patients present with the classic triad of gait ataxia, cognitive impairment, and urinary incontinence (normal pressure hydrocephalus) or acute headache, nausea, and papilledema.',
    differentialDiagnosis: ['Ex-vacuo ventriculomegaly (due to cerebral atrophy)', 'Normal pressure hydrocephalus', 'Aqueductal stenosis'],
    reportingTemplate: 'CT HEAD WITHOUT CONTRAST:\nMarked ventriculomegaly involving the lateral and third ventricles with relatively normal fourth ventricle, suggestive of obstruction at the level of the cerebral aqueduct. Periventricular hypodensity indicating transependymal CSF flow. Sulci are effaced over the high convexities.',
    teachingPoints: [
      'In ex-vacuo ventriculomegaly (atrophy), ventricles enlarge symmetrically to replace lost brain tissue, but cortical sulci are also prominently widened (unlike obstructive hydrocephalus where sulci are effaced).',
      'Urgent neurosurgical consultation for ventriculostomy or shunt placement is indicated if acute.'
    ],
    cmeTip: 'Rounding of the frontal horns of the lateral ventricles (an acute angle becoming obtuse) is a reliable indicator of increased intraventricular pressure.',
    difficulty: 'Intermediate',
    galleryImages: [
      { url: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=1200&q=80', caption: 'Axial View Demonstrating Ventriculomegaly' },
      { url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80', caption: 'Post-Shunt Placement View' }
    ]
  },
  {
    id: 'ct-9',
    title: 'Skull Fracture (Linear Parietal Fracture)',
    modality: 'head_ct',
    category: 'Emergency Findings',
    imageUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Bone window head CT showing linear radiolucent fracture line through parietal bone',
    question: 'How do you differentiate a vascular groove (e.g., middle meningeal artery branch) from a acute skull fracture on bone window head CT?',
    diagnosis: 'Acute Linear Parietal Skull Fracture',
    keyFindings: [
      'Sharply demarcated radiolucent (dark) line traversing the inner and outer tables of the cranium on bone window.',
      'Fracture lines often have non-branching jagged edges, whereas vascular grooves are smoother, corticated, and branch arborescently.',
      'May be associated with adjacent scalp hematoma (cephalohematoma) or underlying intracranial hemorrhage.'
    ],
    clinicalSignificance: 'Skull fractures signify high-impact head trauma and increase the relative risk of intracranial hematoma, though the fracture itself does not require direct surgical repair unless depressed or open.',
    differentialDiagnosis: ['Vascular groove / emissary vein channel', 'Suture line (lambdoid, coronal, sagittal)', 'Wormian bones'],
    reportingTemplate: 'CT HEAD (BONE WINDOW):\nLinear non-depressed fracture through the right parietal bone extending toward the squamous temporal bone. No acute intracranial hemorrhage or extra-axial fluid collection.',
    teachingPoints: [
      'Always switch CT viewing presets to "Bone Window" (wide window width and level) when evaluating trauma patients for fractures.',
      'Basilar skull fractures may present clinically with "raccoon eyes" (periorbital ecchymosis), Battle sign (mastoid ecchymosis), hemotympanum, or CSF otorrhea/rhinorrhea.'
    ],
    cmeTip: 'A normal skull X-ray does not rule out intracranial injury. Non-contrast head CT is the gold standard imaging modality for acute head trauma.',
    difficulty: 'Beginner',
    galleryImages: [
      { url: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=1200&q=80', caption: 'Bone Window View of Parietal Fracture' },
      { url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80', caption: '3D Volume Rendered Cranial Reconstruction' }
    ]
  },
  {
    id: 'ct-10',
    title: 'Cerebral Pneumocephalus (Mount Fuji Sign)',
    modality: 'head_ct',
    category: 'Emergency Findings',
    imageUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Non-contrast head CT showing intracranial air bubbles compressing frontal lobes',
    question: 'What is the classic CT appearance describing bilateral frontal extra-axial air compressing the tips of the frontal lobes in tension pneumocephalus?',
    diagnosis: 'Tension Pneumocephalus (Mount Fuji Sign)',
    keyFindings: [
      'Air pockets within the intracranial cavity (very dark, ~ -1000 HU).',
      'Mount Fuji sign: bilateral frontal subdural air collections compressing the frontal lobes and separating them, resembling the silhouette of Mt. Fuji.',
      'Air-fluid levels in the sphenoid or ethmoid sinuses indicating basilar skull fracture.'
    ],
    clinicalSignificance: 'Pneumocephalus occurs after trauma with skull base fracture, neurosurgery, or lumbar puncture. Tension pneumocephalus occurs when intracranial air acts under pressure, causing neurological deterioration and requiring emergent decompression.',
    differentialDiagnosis: ['Lipoma', 'Fat graft post-surgery', 'Artifact'],
    reportingTemplate: 'CT HEAD WITHOUT CONTRAST:\nExtensive intracranial air in the suprasellar and bilateral frontal extra-axial spaces with compression of the frontal lobes (Mount Fuji sign), consistent with tension pneumocephalus. Complicated by anterior skull base fracture.',
    teachingPoints: [
      'Air density on CT is extremely low (~ -1000 Hounsfield Units, jet black).',
      'Never administer nitrous oxide anesthesia to patients with suspected or confirmed pneumocephalus, as nitrous oxide expands gas-filled spaces rapidly and can precipitate lethal tension pneumocephalus.'
    ],
    cmeTip: 'Tension pneumocephalus is a neurosurgical emergency that can mimic postoperative or traumatic shock.',
    difficulty: 'Advanced',
    galleryImages: [
      { url: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=1200&q=80', caption: 'Axial View Showing Mount Fuji Sign' },
      { url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80', caption: 'Coronal View Highlighting Subdural Air' }
    ]
  }
];
