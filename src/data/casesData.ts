import { MedicalCase } from '../types';

export const MEDICAL_CASES: MedicalCase[] = [
  {
    id: 'case-cxr-001',
    title: 'Left Lower Lobe Pneumonia with Air Bronchograms',
    modality: 'chest_xray',
    category: 'Common Pathology',
    imageUrl: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Chest X-Ray showing left lower lobe opacity',
    question: 'A 45-year-old male presents with productive cough, fever (38.8°C), and pleuritic chest pain. What is the primary finding on this PA Chest X-Ray?',
    diagnosis: 'Left Lower Lobe Pneumonia (Community Acquired)',
    keyFindings: [
      'Dense airspace consolidation in the retrocardiac left lower zone',
      'Silhouette sign obscuring the left hemidiaphragm contour',
      'Air bronchograms visible within the consolidated lung parenchyma',
      'No associated large pleural effusion or pneumothorax'
    ],
    clinicalSignificance: 'Left lower lobe pneumonia is frequently obscured by the cardiac silhouette on PA views. Careful inspection of the retrocardiac space on lateral and PA projections is essential to avoid delayed diagnosis.',
    differentialDiagnosis: [
      'Atelectasis (left lower lobe collapse)',
      'Pulmonary infarction / Thromboembolism',
      'Primary or metastatic bronchogenic carcinoma',
      'Aspiration pneumonitis'
    ],
    reportingTemplate: 'FINDINGS:\n- Lungs: Dense consolidation in the left lower lobe behind the cardiac silhouette. Air bronchograms present.\n- Pleura: No pneumothorax or significant pleural effusion.\n- Cardiac & Mediastinum: Normal heart size and mediastinal contours.\n\nIMPRESSION:\nLeft lower lobe airspace opacity consistent with pneumonia. Recommend follow-up chest radiograph in 6 weeks to confirm complete resolution.',
    teachingPoints: [
      'Always inspect the retrocardiac region behind the heart on PA chest radiographs.',
      'Air bronchograms strongly favor infectious consolidation over atelectasis or mass.',
      'Clinical correlation with WBC count and sputum culture is recommended.'
    ],
    cmeTip: 'Review the silhouette sign rules for identifying lower lobe versus lingular/middle lobe consolidation.',
    difficulty: 'Beginner',
    galleryImages: [
      {
        url: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=1200&q=80',
        caption: 'PA Chest Radiograph - Retrocardiac Opacity'
      },
      {
        url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80',
        caption: 'Lateral View - Localizing Consolidation to LLL'
      }
    ]
  },
  {
    id: 'case-cxr-002',
    title: 'Tension Pneumothorax with Mediastinal Shift',
    modality: 'chest_xray',
    category: 'Emergency Findings',
    imageUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Chest X-Ray showing complete right pneumothorax',
    question: 'A 28-year-old trauma patient develops acute respiratory distress, tracheal deviation, and hypotension. What is the immediate life-threatening diagnosis?',
    diagnosis: 'Right-Sided Tension Pneumothorax',
    keyFindings: [
      'Complete collapse of the right lung with a sharp visceral pleural line',
      'Complete absence of pulmonary vascular markings peripheral to the pleural line',
      'Significant contralateral (leftward) shift of the trachea and mediastinum',
      'Deep sulcus sign and depression of the right hemidiaphragm'
    ],
    clinicalSignificance: 'Tension pneumothorax is a clinical emergency that causes cardiovascular collapse due to impaired venous return. Needle decompression or chest tube insertion must precede formal radiography when tension physiology is suspected clinically.',
    differentialDiagnosis: [
      'Large simple pneumothorax',
      'Severe bullous emphysema',
      'Diaphragmatic rupture with herniation',
      'Complete right mainstem bronchial intubation'
    ],
    reportingTemplate: 'FINDINGS:\n- Right Hemithorax: Large pneumothorax with complete collapse of the right lung and absence of peripheral lung markings.\n- Mediastinum: Marked shift of trachea and mediastinal structures to the left.\n- Contralateral Lung: Clear left lung field without focal consolidation.\n\nIMPRESSION:\nLarge right tension pneumothorax requiring urgent chest tube decompression.',
    teachingPoints: [
      'Tension pneumothorax is primarily a clinical diagnosis based on hypotension and tracheal shift.',
      'Radiographic signs include mediastinal shift and ipsilateral diaphragmatic depression.',
      'Delaying emergency decompression for a chest radiograph in unstable patients is contraindicated.'
    ],
    cmeTip: 'Recognize the deep sulcus sign on supine chest radiographs as an indicator of inferior pneumothorax extension.',
    difficulty: 'Intermediate',
    galleryImages: [
      {
        url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80',
        caption: 'Right Tension Pneumothorax with Mediastinal Shift'
      }
    ]
  },
  {
    id: 'case-head-001',
    title: 'Acute Epidural Hematoma with Biconvex Lens Shape',
    modality: 'head_ct',
    category: 'Emergency Findings',
    imageUrl: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Non-contrast Head CT showing acute epidural hematoma',
    question: 'A 22-year-old male is brought to the ED following a high-speed motor vehicle collision with temporary loss of consciousness followed by a lucid interval. What is the characteristic CT appearance?',
    diagnosis: 'Acute Epidural Hematoma (EDH) with Middle Meningeal Artery Injury',
    keyFindings: [
      'Hyperdense (bright white) biconvex (lentiform) extra-axial collection in the right temporoparietal region',
      'Underlying skull fracture crossing the middle meningeal artery groove',
      'Significant mass effect with effacement of the right lateral ventricle and midline shift',
      'Uncal herniation with compression of the right cerebral peduncle'
    ],
    clinicalSignificance: 'Epidural hematomas typically result from arterial laceration (most commonly middle meningeal artery). Prompt neurosurgical evacuation is critical to prevent fatal brain herniation.',
    differentialDiagnosis: [
      'Subdural hematoma (crescentic shape)',
      'Subarachnoid hemorrhage',
      'Contusion with localized edema',
      'Epidural abscess or empyema'
    ],
    reportingTemplate: 'FINDINGS:\n- Brain Parenchyma: Hyperdense biconvex extra-axial collection measuring 2.4 cm in maximal thickness over the right frontotemporoparietal convexity.\n- Mass Effect: 8 mm leftward midline shift with compression of the right lateral ventricle and basal cisterns.\n- Bone Window: Right temporal bone fracture crossing the middle meningeal groove.\n\nIMPRESSION:\nAcute epidural hematoma with significant mass effect and impending herniation. Urgent neurosurgical consultation required.',
    teachingPoints: [
      'EDHs are classically biconvex (lentiform) because they are bound by tightly adherent cranial sutures.',
      'Associated skull fracture is present in over 85% of adult cases.',
      'The classic "lucid interval" occurs in roughly 30% of patients before rapid deterioration.'
    ],
    cmeTip: 'Always check bone windows in head CT trauma evaluations to identify overlying linear skull fractures.',
    difficulty: 'Advanced',
    galleryImages: [
      {
        url: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=1200&q=80',
        caption: 'Axial Non-Contrast CT - Biconvex Hyperdensity'
      }
    ]
  },
  {
    id: 'case-cxr-003',
    title: 'Cardiomegaly with Acute Pulmonary Edema (Bat-Wing Opacities)',
    modality: 'chest_xray',
    category: 'Emergency Findings',
    imageUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Chest X-Ray showing bilateral perihilar pulmonary edema',
    question: 'A 68-year-old female with history of ischemic cardiomyopathy presents with severe dyspnea, orthopnea, and oxygen saturation of 82% on room air. What are the key radiographic features?',
    diagnosis: 'Acute Decompensated Heart Failure with Pulmonary Edema',
    keyFindings: [
      'Marked cardiomegaly (cardiothoracic ratio > 0.60)',
      'Bilateral symmetric perihilar alveolar infiltrates (classic "bat-wing" or "angel wing" distribution)',
      'Kerley B lines in the bilateral costophrenic angles (interstitial edema)',
      'Upper lobe pulmonary venous redirection (cephalization)'
    ],
    clinicalSignificance: 'Acute pulmonary edema is a medical emergency requiring rapid diuresis, preload/afterload reduction, and non-invasive positive pressure ventilation (CPAP/BiPAP).',
    differentialDiagnosis: [
      'Bilateral bacterial pneumonia / ARDS',
      'Pulmonary hemorrhage',
      'Uremic lung',
      'Aspiration pneumonitis'
    ],
    reportingTemplate: 'FINDINGS:\n- Cardiac: Cardiomegaly with LV configuration; cardiothoracic ratio approximately 0.62.\n- Lungs: Symmetric perihilar airspace opacities and prominent interstitial markings with Kerley B lines.\n- Pleura: Small bilateral pleural effusions.\n\nIMPRESSION:\nFindings characteristic of acute congestive heart failure with pulmonary interstitial and alveolar edema.',
    teachingPoints: [
      'Kerley B lines represent edematous interlobular septa perpendicular to the pleural surface at the lung bases.',
      'Cephalization of pulmonary vessels indicates elevated pulmonary capillary wedge pressure.',
      'Rapid clinical response can often be tracked radiographically within 24-48 hours of diuresis.'
    ],
    cmeTip: 'Differentiate hydrostatic pulmonary edema from ARDS by presence of cardiomegaly and vascular cephalization.',
    difficulty: 'Beginner',
    galleryImages: [
      {
        url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80',
        caption: 'PA Chest X-Ray - Bat-Wing Edema and Cardiomegaly'
      }
    ]
  },
  {
    id: 'case-head-002',
    title: 'Acute Subarachnoid Hemorrhage (Stellar Pattern)',
    modality: 'head_ct',
    category: 'Emergency Findings',
    imageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Non-contrast CT showing subarachnoid hemorrhage in basal cisterns',
    question: 'A 50-year-old female presents with sudden onset "thunderclap" headache described as the worst headache of her life. What is the diagnostic finding on non-contrast head CT?',
    diagnosis: 'Acute Aneurysmal Subarachnoid Hemorrhage (SAH)',
    keyFindings: [
      'High attenuation (hyperdense) blood filling the basal cisterns, sylvian fissures, and interhemispheric fissure',
      'High sensitivity (>95%) when performed within 6 hours of symptom onset',
      'Associated acute obstructive hydrocephalus with temporal horn dilation',
      'Possible underlying saccular aneurysm of the anterior communicating or middle cerebral artery'
    ],
    clinicalSignificance: 'Thunderclap headache mandates urgent neuroimaging. If non-contrast CT is negative but clinical suspicion remains high, lumbar puncture for xanthochromia is mandatory to rule out SAH.',
    differentialDiagnosis: [
      'Meningitis / Encephalitis',
      'Reversible cerebral vasoconstriction syndrome (RCVS)',
      'Pituitary apoplexy',
      'Cerebral venous sinus thrombosis'
    ],
    reportingTemplate: 'FINDINGS:\n- Subarachnoid Spaces: Extensive hyperdense blood products within the basal cisterns, ambient cisterns, and bilateral sylvian fissures.\n- Ventricular System: Mild acute dilation of the lateral and third ventricles consistent with early hydrocephalus.\n- Parenchyma: No acute territorial infarct or intraparenchymal hematoma.\n\nIMPRESSION:\nAcute aneurysmal subarachnoid hemorrhage with hydrocephalus. Urgent CTA and neurosurgical consultation recommended.',
    teachingPoints: [
      'The basal cisterns normally appear dark (CSF density); bright blood within them is diagnostic of acute SAH.',
      'CT angiography (CTA) should be performed urgently to evaluate for ruptured cerebral aneurysm.',
      'Complications include vasospasm, hydrocephalus, and rebleeding.'
    ],
    cmeTip: 'Sensitivity of non-contrast CT for SAH decreases after 72 hours as blood products begin to lyse and equilibrate with CSF density.',
    difficulty: 'Intermediate',
    galleryImages: [
      {
        url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80',
        caption: 'Axial CT - Hyperdense Blood in Basal Cisterns'
      }
    ]
  },
  {
    id: 'case-cxr-004',
    title: 'Normal Adult Chest Radiograph (Posteroanterior & Lateral)',
    modality: 'chest_xray',
    category: 'Normal',
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Normal PA and Lateral Chest Radiograph',
    question: 'A 30-year-old healthy adult undergoes routine pre-employment medical screening. What are the key normal anatomic landmarks to verify on this chest X-ray?',
    diagnosis: 'Normal Chest Radiograph',
    keyFindings: [
      'Normal cardiac silhouette with cardiothoracic ratio under 0.50',
      'Clear lung fields bilaterally without focal consolidation, nodule, or pneumothorax',
      'Sharp costophrenic and cardiophrenic angles bilaterally',
      'Normal mediastinal and hilar contours without lymphadenopathy'
    ],
    clinicalSignificance: 'Establishing baseline normality allows confident identification of subtle pathologies such as early nodules, subtle interstitial lung disease, or minimal effusions.',
    differentialDiagnosis: [
      'Early mild interstitial lung disease (can be subtle)',
      'Small apical blebs',
      'Normal anatomic variant (e.g., prominent azygos lobe)'
    ],
    reportingTemplate: 'FINDINGS:\n- Lungs & Airways: Clear lung fields bilaterally. No focal opacity, pneumothorax, or pleural effusion.\n- Cardiac & Mediastinum: Normal heart size and contour. Mediastinum and hila are within normal limits.\n- Bones & Soft Tissues: Intact visualized osseous structures without acute fracture or destructive lesion.\n\nIMPRESSION:\nNormal chest radiograph with no acute cardiopulmonary abnormality.',
    teachingPoints: [
      'Always systematically review PA and lateral chest X-rays using a structured ABCDE approach (Airways, Bones, Cardiac, Diaphragm, Everything else).',
      'Check rotation by ensuring spinous processes are equidistant from the medial ends of the clavicles.'
    ],
    cmeTip: 'Mastering the normal anatomy is the prerequisite for detecting subtle radiological abnormalities.',
    difficulty: 'Beginner',
    galleryImages: [
      {
        url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
        caption: 'Normal PA Chest Radiograph'
      }
    ]
  },
  {
    id: 'case-cxr-005',
    title: 'Right Middle Lobe Atelectasis',
    modality: 'chest_xray',
    category: 'Common Pathology',
    imageUrl: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'CXR showing right middle lobe opacity',
    question: 'A 60-year-old female presents with chronic cough. PA and lateral chest radiographs reveal loss of volume in the right middle lobe. What is the classic radiographic appearance?',
    diagnosis: 'Right Middle Lobe (RML) Atelectasis / Collapse',
    keyFindings: [
      'Triangular opacity bounded by the horizontal and oblique fissures on lateral view',
      'Loss of the right heart border on PA view (positive silhouette sign)',
      'Elevation of the right hemidiaphragm and crowding of bronchovascular markings'
    ],
    clinicalSignificance: 'RML syndrome is often caused by bronchial compression from lymphadenopathy or obstructing endobronchial lesions. Bronchoscopy is frequently indicated in adults.',
    differentialDiagnosis: ['RML pneumonia', 'Bronchogenic carcinoma', 'Mucus plugging'],
    reportingTemplate: 'FINDINGS:\n- Triangular density in the right mid-lung zone with depression of the horizontal fissure.\n- Silhouette sign obscures the right cardiac border.\n\nIMPRESSION:\nRight middle lobe volume loss / collapse. Recommend chest CT with contrast and pulmonology consultation.',
    teachingPoints: ['RML is anatomically susceptible to collapse due to narrow bronchial orifice and surrounding lymph nodes.'],
    cmeTip: 'Always inspect the lateral radiograph for wedge-shaped retrosternal opacities.',
    difficulty: 'Intermediate',
    galleryImages: [{ url: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=1200&q=80', caption: 'RML Collapse' }]
  },
  {
    id: 'case-cxr-006',
    title: 'Aortic Dissection (Widened Superior Mediastinum)',
    modality: 'chest_xray',
    category: 'Emergency Findings',
    imageUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Chest X-Ray with widened mediastinum',
    question: 'A 65-year-old male with uncontrolled hypertension presents with tearing interscapular chest pain radiating to the back. What is the key chest X-ray finding?',
    diagnosis: 'Stanford Type A Aortic Dissection',
    keyFindings: [
      'Significantly widened superior mediastinum (> 8 cm)',
      'Calcium sign (separation of intimal calcification from aortic wall by > 10 mm)',
      'Blunting of aortic knob and deviation of trachea/nasogastric tube to the right'
    ],
    clinicalSignificance: 'Acute aortic dissection is surgical emergency. CT angiography (CTA) or transesophageal echocardiography (TEE) is mandatory immediately.',
    differentialDiagnosis: ['Mediastinal lymphadenopathy', 'Mediastinal mass', 'Aortic aneurysm rupture'],
    reportingTemplate: 'FINDINGS:\n- Widened mediastinal contour exceeding 8 cm with prominent aortic knob contour abnormality.\n\nIMPRESSION:\nSuspicious for acute aortic dissection. Urgent CTA chest required.',
    teachingPoints: ['Normal chest radiograph does not rule out aortic dissection (up to 15-20% have normal mediastinum).'],
    cmeTip: 'Assess the calcium sign on plain films.',
    difficulty: 'Advanced',
    galleryImages: [{ url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80', caption: 'Mediastinal Widening' }]
  },
  {
    id: 'case-cxr-007',
    title: 'Pneumoperitoneum (Free Air under Diaphragm)',
    modality: 'chest_xray',
    category: 'Emergency Findings',
    imageUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Upright Chest X-Ray showing free air under diaphragms',
    question: 'A 55-year-old male presents with sudden excruciating generalized abdominal pain and rigid abdomen. What urgent finding is visible under the right hemidiaphragm?',
    diagnosis: 'Pneumoperitoneum Secondary to Peptic Ulcer Perforation',
    keyFindings: [
      'Crescentic lucency (free air) beneath the right hemidiaphragm on upright view',
      'Rigler sign (double wall sign) if abdominal radiograph was supine',
      'Loss of normal liver dullness on physical exam'
    ],
    clinicalSignificance: 'Pneumoperitoneum indicates hollow viscus perforation requiring immediate exploratory laparotomy.',
    differentialDiagnosis: ['Chilaiditi sign (colon interposition between liver and diaphragm)', 'Subdiaphragmatic abscess'],
    reportingTemplate: 'FINDINGS:\n- Free subdiaphragmatic air visualized bilaterally, most prominent beneath the right hemidiaphragm.\n\nIMPRESSION:\nPneumoperitoneum indicative of visceral perforation. Urgent surgical consultation.',
    teachingPoints: ['Always check the subdiaphragmatic regions on upright chest radiographs in acute abdominal pain.'],
    cmeTip: 'Distinguish Chilaiditi sign from pneumoperitoneum by identifying haustral folds within the interpositioned bowel.',
    difficulty: 'Intermediate',
    galleryImages: [{ url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80', caption: 'Free Air under Diaphragm' }]
  },
  {
    id: 'case-cxr-008',
    title: 'Bilateral Pleural Effusions in Heart Failure',
    modality: 'chest_xray',
    category: 'Common Pathology',
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'CXR with blunted costophrenic angles',
    question: 'A 70-year-old female presents with progressive dyspnea and bilateral ankle edema. What is demonstrated at both lung bases?',
    diagnosis: 'Bilateral Pleural Effusions (Right Greater Than Left)',
    keyFindings: [
      'Blunting of bilateral costophrenic angles',
      'Meniscus sign forming superior border of fluid collection',
      'Associated cardiomegaly and upper lobe pulmonary venous congestion'
    ],
    clinicalSignificance: 'Pleural effusions in heart failure are typically transudative and bilateral. Diagnostic thoracentesis is reserved for unilateral, asymmetric, or febrile presentations.',
    differentialDiagnosis: ['Parapneumonic effusion', 'Malignant pleural effusion', 'Pulmonary embolism'],
    reportingTemplate: 'FINDINGS:\n- Moderate bilateral pleural effusions with blunting of costophrenic angles and meniscus signs.\n- Cardiomegaly present.\n\nIMPRESSION:\nBilateral pleural effusions secondary to decompensated congestive heart failure.',
    teachingPoints: ['Approximately 175-200 mL of fluid is required to blunt the costophrenic angle on upright PA view.'],
    cmeTip: 'Decubitus views can confirm whether pleural fluid is free-flowing and loculated.',
    difficulty: 'Beginner',
    galleryImages: [{ url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80', caption: 'Bilateral Effusions' }]
  },
  {
    id: 'case-head-003',
    title: 'Acute Subdural Hematoma (Crescentic Shape)',
    modality: 'head_ct',
    category: 'Emergency Findings',
    imageUrl: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Non-contrast CT showing subdural hematoma',
    question: 'An 81-year-old male on warfarin presents with lethargy and confusion weeks after a minor fall. What is the classic CT morphology of this extra-axial collection?',
    diagnosis: 'Acute-on-Chronic Subdural Hematoma (SDH)',
    keyFindings: [
      'Crescentic hyperdense and isodense extra-axial collection conforming to the cerebral convexity',
      'Crosses cranial suture lines (unlike epidural hematoma)',
      'Significant midline shift and compression of cerebral sulci'
    ],
    clinicalSignificance: 'Subdural hematomas result from tearing of bridging veins spanning between the cerebral cortex and dural venous sinuses.',
    differentialDiagnosis: ['Epidural hematoma', 'Subarachnoid hemorrhage', 'Subdural hygroma'],
    reportingTemplate: 'FINDINGS:\n- Crescentic extra-axial collection along the left frontotemporoparietal convexity with mixed hyperdense and hypodense components.\n- Midline shift of 6 mm to the right.\n\nIMPRESSION:\nAcute on chronic subdural hematoma with mass effect.',
    teachingPoints: ['SDHs are crescent-shaped because they spread freely within the potential subdural space unrestricted by sutures.'],
    cmeTip: 'Isodense subdural hematomas can be missed if sulcal effacement is not carefully checked.',
    difficulty: 'Intermediate',
    galleryImages: [{ url: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=1200&q=80', caption: 'Crescentic SDH' }]
  },
  {
    id: 'case-head-004',
    title: 'Acute Middle Cerebral Artery (MCA) Infarction',
    modality: 'head_ct',
    category: 'Emergency Findings',
    imageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'CT showing early signs of MCA stroke',
    question: 'A 64-year-old male presents with sudden onset right-sided hemiparesis and global aphasia within 2 hours of symptom onset. What are the early CT signs of acute ischemia?',
    diagnosis: 'Acute Left MCA Territory Infarction',
    keyFindings: [
      'Hyperdense MCA sign (thrombus within proximal M1 segment)',
      'Loss of the normal insular ribbon and gray-white matter differentiation',
      'Effacement of cortical sulci in the left frontotemporoparietal region'
    ],
    clinicalSignificance: 'Prompt identification on non-contrast CT excludes hemorrhage prior to intravenous thrombolysis or mechanical thrombectomy evaluation.',
    differentialDiagnosis: ['Primary intracerebral hemorrhage', 'Todd paralysis / focal seizure', 'Brain tumor / glioma'],
    reportingTemplate: 'FINDINGS:\n- Hyperdense left MCA sign. Loss of gray-white differentiation in the left basal ganglia and insular cortex.\n- No acute intracranial hemorrhage.\n\nIMPRESSION:\nEarly ischemic changes in the left MCA territory (ASPECTS score 8).',
    teachingPoints: ['Non-contrast CT in hyperacute stroke is primarily performed to rule out hemorrhage before thrombolytic therapy.'],
    cmeTip: 'Use ASPECTS scoring system to quantify early ischemic changes in middle cerebral artery stroke.',
    difficulty: 'Advanced',
    galleryImages: [{ url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80', caption: 'Hyperdense MCA' }]
  },
  {
    id: 'case-head-005',
    title: 'Hypertensive Intracerebral Hemorrhage (Basal Ganglia)',
    modality: 'head_ct',
    category: 'Emergency Findings',
    imageUrl: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'CT showing basal ganglia hemorrhage',
    question: 'A 60-year-old hypertensive male presents with acute onset contralateral hemiplegia and decreased level of consciousness. What is the typical location and appearance?',
    diagnosis: 'Acute Hypertensive Basal Ganglia (Putaminal) Hemorrhage',
    keyFindings: [
      'Well-circumscribed hyperdense intraparenchymal hematoma in the right putamen / internal capsule',
      'Surrounding hypodense edema rim',
      'Ventricular extension with intraventricular hemorrhage and acute hydrocephalus'
    ],
    clinicalSignificance: 'Hypertensive hemorrhages commonly occur in the basal ganglia, thalamus, cerebellum, and pons due to rupture of small penetrating Charcot-Bouchard microaneurysms.',
    differentialDiagnosis: ['Amyloid angiopathy (lobar hemorrhage)', 'Arteriovenous malformation (AVM)', 'Tumor hemorrhage'],
    reportingTemplate: 'FINDINGS:\n- 4.5 cm hyperdense intraparenchymal hematoma centered in the right basal ganglia with surrounding vasogenic edema.\n- Intraventricular extension into the right lateral and third ventricles.\n\nIMPRESSION:\nAcute right basal ganglia hemorrhage with intraventricular extension.',
    teachingPoints: ['Strict blood pressure control and neurosurgical consultation are crucial in acute hypertensive hemorrhage.'],
    cmeTip: 'Differentiate hypertensive deep gray matter hemorrhage from lobar hemorrhage seen in cerebral amyloid angiopathy.',
    difficulty: 'Intermediate',
    galleryImages: [{ url: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=1200&q=80', caption: 'Basal Ganglia Hemorrhage' }]
  },
  {
    id: 'case-cxr-009',
    title: 'Rib Fracture Series with Pneumothorax',
    modality: 'chest_xray',
    category: 'Common Pathology',
    imageUrl: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Chest X-ray showing rib fractures',
    question: 'A 45-year-old male involved in a motor vehicle collision presents with localized chest wall pain and crepitus. What is the key finding on chest radiography?',
    diagnosis: 'Multiple Posterior Rib Fractures with Occult Pneumothorax',
    keyFindings: [
      'Displaced fractures of the 4th through 7th ribs posterolaterally',
      'Associated thin visceral pleural line indicating small apical pneumothorax',
      'No flail segment identified'
    ],
    clinicalSignificance: 'Rib fractures can cause significant pain leading to hypoventilation and atelectasis. Underlying pulmonary contusion or pneumothorax must be evaluated.',
    differentialDiagnosis: ['Pathologic fracture', 'Flail chest', 'Pulmonary contusion'],
    reportingTemplate: 'FINDINGS:\n- Fractures of ribs 4-7 on the right side without displacement of fragments.\n- Small apical pneumothorax measuring less than 10%.\n\nIMPRESSION:\nRight-sided rib fractures with small apical pneumothorax.',
    teachingPoints: ['Adequate pain control is essential in rib fractures to prevent pneumonia and atelectasis.'],
    cmeTip: 'Examine bony thorax with high contrast settings to detect subtle rib fractures.',
    difficulty: 'Beginner',
    galleryImages: [{ url: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=1200&q=80', caption: 'Rib Fractures' }]
  },
  {
    id: 'case-cxr-010',
    title: 'Pulmonary Thromboembolism (Westermark Sign)',
    modality: 'chest_xray',
    category: 'Emergency Findings',
    imageUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Chest X-Ray showing focal oligemia',
    question: 'A 52-year-old female presents with acute dyspnea and pleuritic chest pain following long-haul air travel. What is the subtle chest radiograph sign of pulmonary embolism?',
    diagnosis: 'Acute Pulmonary Embolism with Westermark Sign',
    keyFindings: [
      'Focal oligemia (Westermark sign) with decreased vascularity in the right lower lung zone',
      'Prominent right descending pulmonary artery (Hampton hump or Fleischner sign)',
      'Small pleural effusion'
    ],
    clinicalSignificance: 'Chest radiography in pulmonary embolism is frequently normal or non-diagnostic, but helps rule out alternative cardiopulmonary causes. CT Pulmonary Angiography (CTPA) is the diagnostic standard.',
    differentialDiagnosis: ['Pneumonia', 'Atelectasis', 'Aortic dissection'],
    reportingTemplate: 'FINDINGS:\n- Focal oligemia in the right lower lung field with pruning of pulmonary vessels.\n- Normal cardiac silhouette.\n\nIMPRESSION:\nRadiographic findings suspicious for pulmonary embolism. Recommend urgent CTPA.',
    teachingPoints: ['Westermark sign represents focal vascular collapse distal to a major pulmonary embolus.'],
    cmeTip: 'Do not rely solely on chest X-ray to exclude pulmonary embolism; clinical probability scores and CTPA are mandatory.',
    difficulty: 'Advanced',
    galleryImages: [{ url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80', caption: 'Westermark Sign' }]
  },
  {
    id: 'case-head-006',
    title: 'Normal Non-Contrast Head CT',
    modality: 'head_ct',
    category: 'Normal',
    imageUrl: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Normal axial head CT scan',
    question: 'A 35-year-old healthy adult evaluated for mild tension headache undergoes non-contrast head CT. What are the key normal intracranial structures to verify?',
    diagnosis: 'Normal Non-Contrast Head CT',
    keyFindings: [
      'Symmetric ventricles and basal cisterns without shift or effacement',
      'Normal gray-white matter differentiation throughout cerebral cortex and basal ganglia',
      'No evidence of acute intracranial hemorrhage, mass, or territorial infarct'
    ],
    clinicalSignificance: 'Establishing normal intracranial anatomy ensures accurate detection of subtle acute pathologies like early ischemia or microhemorrhages.',
    differentialDiagnosis: ['Early subtle cerebral edema', 'Mild small vessel ischemic change'],
    reportingTemplate: 'FINDINGS:\n- Brain Parenchyma: Normal gray-white matter differentiation. No acute hemorrhage, mass effect, or territorial infarction.\n- Ventricles & Cisterns: Normal in size and configuration. Midline structures are central.\n- Bone Windows: Intact calvarium without fracture.\n\nIMPRESSION:\nNormal non-contrast head CT.',
    teachingPoints: ['Systematically review head CT using blood, cisterns, brain, ventricles, and bone (B-C-B-V-B) mnemonic.'],
    cmeTip: 'Always evaluate basal cisterns as the most sensitive indicator of elevated intracranial pressure or subarachnoid blood.',
    difficulty: 'Beginner',
    galleryImages: [{ url: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=1200&q=80', caption: 'Normal Brain CT' }]
  },
  {
    id: 'case-head-007',
    title: 'Chronic Small Vessel Ischemic Changes (Leukoaraiosis)',
    modality: 'head_ct',
    category: 'Common Pathology',
    imageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'CT showing periventricular white matter hypodensity',
    question: 'A 74-year-old hypertensive patient undergoes head CT for cognitive slowing. What are the bilateral symmetric white matter changes?',
    diagnosis: 'Chronic Small Vessel Ischemic Disease (Fazekas Grade 2 White Matter Changes)',
    keyFindings: [
      'Patchy and confluent hypodensities in the periventricular white matter and centrum semiovale',
      'Associated mild age-related cerebral atrophy with prominent sulci and ventriculomegaly',
      'No acute territorial infarction or hemorrhage'
    ],
    clinicalSignificance: 'Small vessel ischemic disease is commonly associated with chronic hypertension, diabetes, and aging, predisposing patients to vascular cognitive impairment and stroke.',
    differentialDiagnosis: ['Normal pressure hydrocephalus', 'Demyelinating disease (MS)', 'Encephalitis'],
    reportingTemplate: 'FINDINGS:\n- Symmetric periventricular and subcortical white matter hypodensities consistent with chronic microvascular ischemic changes.\n- Mild cerebral volume loss appropriate for age.\n\nIMPRESSION:\nModerate chronic small vessel ischemic disease.',
    teachingPoints: ['Leukoaraiosis reflects chronic hypoperfusion and arteriosclerosis of small penetrating medullary arteries.'],
    cmeTip: 'Correlate white matter changes with Fazekas or age-related white matter changes scoring scales.',
    difficulty: 'Intermediate',
    galleryImages: [{ url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80', caption: 'White Matter Changes' }]
  },
  {
    id: 'case-cxr-011',
    title: 'Post-Operative Tracheostomy Tube Assessment',
    modality: 'chest_xray',
    category: 'Post-Procedural',
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Chest X-ray showing tracheostomy tube in place',
    question: 'A patient in the intensive care unit undergoes routine post-operative check following percutaneous tracheostomy. What are the key radiographic evaluation points?',
    diagnosis: 'Correctly Positioned Tracheostomy Cannula without Complication',
    keyFindings: [
      'Tracheostomy tube tip projects midway between the stoma and the carina (approx. 2-3 cm above carina)',
      'Inflated cuff is contained within the tracheal lumen without overdistention',
      'No subcutaneous emphysema, pneumomediastinum, or pneumothorax'
    ],
    clinicalSignificance: 'Ensuring correct tracheostomy position prevents endobronchial intubation of the right mainstem bronchus or accidental decannulation.',
    differentialDiagnosis: ['Right mainstem intubation', 'Tracheal wall erosion', 'Subcutaneous emphysema'],
    reportingTemplate: 'FINDINGS:\n- Tracheostomy tube is appropriately sited with its tip terminating approximately 3 cm above the carina.\n- Lungs are clear without pneumothorax or subcutaneous emphysema.\n\nIMPRESSION:\nUncomplicated correct placement of tracheostomy tube.',
    teachingPoints: ['The ideal tracheostomy tip position is halfway between the sternal notch and the carina on supine chest radiograph.'],
    cmeTip: 'Check immediately for subcutaneous air in the neck as a sign of paratracheal false passage.',
    difficulty: 'Beginner',
    galleryImages: [{ url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80', caption: 'Tracheostomy Placement' }]
  },
  {
    id: 'case-cxr-012',
    title: 'Central Venous Catheter Placement (Right Internal Jugular)',
    modality: 'chest_xray',
    category: 'Post-Procedural',
    imageUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Chest X-ray showing CVC line tip in cavoatrial junction',
    question: 'A critically ill patient has a triple-lumen central venous catheter placed via the right internal jugular vein. Where should the distal tip ideally lie?',
    diagnosis: 'Correctly Positioned Right Internal Jugular Central Venous Catheter',
    keyFindings: [
      'Catheter course descends via right brachiocephalic vein and superior vena cava',
      'Distal tip projects at the cavoatrial junction (lower third of SVC or right atrium border)',
      'No post-procedural pneumothorax or hemothorax'
    ],
    clinicalSignificance: 'Post-insertion chest radiograph is mandatory to confirm line tip position and rule out iatrogenic pneumothorax.',
    differentialDiagnosis: ['Misplacement in internal jugular or azygos vein', 'Pneumothorax', 'Arterial puncture'],
    reportingTemplate: 'FINDINGS:\n- Right internal jugular central venous catheter follows expected course through SVC with tip terminating at the cavoatrial junction.\n- Pleural spaces are clear without pneumothorax.\n\nIMPRESSION:\nCorrect placement of central venous catheter without acute complication.',
    teachingPoints: ['The cavoatrial junction lies approximately at the level of the right tracheobronchial angle or 2 cm below the carina.'],
    cmeTip: 'Always check bilateral pleural spaces on upright or supine chest X-ray after central line placement to rule out pneumothorax.',
    difficulty: 'Beginner',
    galleryImages: [{ url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80', caption: 'CVC Line Position' }]
  }
];
