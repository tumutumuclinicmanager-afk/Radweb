import { MedicalCase } from '../types';

export const DEFAULT_BASELINE_CASES: MedicalCase[] = [
  {
    id: 'baseline-cxr-normal',
    title: 'Normal PA and Lateral Chest Radiograph',
    modality: 'chest_xray',
    category: 'Normal',
    difficulty: 'Beginner',
    imageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=1200',
    imageAlt: 'Diagnostic PA chest radiograph demonstrating completely clear lung fields and normal cardiac silhouette',
    question: 'A 35-year-old female presents for a pre-employment screening. What is the correct interpretation of this chest radiograph?',
    diagnosis: 'Normal Chest Radiograph',
    keyFindings: [
      'Lungs are **completely clear** with no consolidations, effusions, or masses.',
      'Cardiomediastinal silhouette is **normal in size** and contour.',
      'Pleural spaces are clear; **costophrenic angles** are sharp.',
      'Osseous structures and soft tissues are **intact** and unremarkable.'
    ],
    clinicalSignificance: 'Establishing a baseline of normal anatomy is crucial to avoiding over-diagnosis of artifacts or normal variants.',
    differentialDiagnosis: ['Normal Chest Study', 'Early Interstitial Lung Disease', 'Poor Inspiratory Effort'],
    reportingTemplate: 'CHEST AP/PA PORTABLE:\n\nFINDINGS:\nLungs are clear without focal consolidation, pleural effusion, or pneumothorax.\nCardiomediastinal silhouette is within normal limits for size and contour.\nBony thorax and surrounding soft tissues are unremarkable.\n\nIMPRESSION:\nNo acute cardiopulmonary disease.',
    teachingPoints: [
      'Always count **8-10 posterior ribs** to ensure adequate inspiratory effort.',
      'Evaluate the **blind spots** on the PA view: behind the heart, apices, and below the diaphragms.',
      'The lateral view is essential to confirm or rule out retrocardiac pathology.'
    ],
    cmeTip: 'Look at the spine on the lateral view: it should get progressively darker (more lucent) as you go down.',
    orderIndex: 1,
    createdAt: 1700000000001,
    updatedAt: 1700000000001
  },
  {
    id: 'baseline-cxr-pneumothorax',
    title: 'Right Tension Pneumothorax with Mediastinal Shift',
    modality: 'chest_xray',
    category: 'Emergency Findings',
    difficulty: 'Intermediate',
    imageUrl: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&q=80&w=1200',
    imageAlt: 'Diagnostic PA chest radiograph showing large right-sided pleural air collection with mediastinal deviation',
    question: 'A 24-year-old male presents with sudden-onset severe right-sided chest pain and shortness of breath. On exam, he is hypotensive with absent breath sounds on the right. What is the immediate life-saving intervention?',
    diagnosis: 'Right Tension Pneumothorax',
    keyFindings: [
      'Large right-sided **pleural air lucency** with complete collapse of the right lung.',
      'Marked **contralateral mediastinal shift** of the heart and trachea to the left.',
      'Significant **depression of the right hemidiaphragm**.',
      'Deep sulcus sign visible at the right costophrenic angle.'
    ],
    clinicalSignificance: 'Tension pneumothorax is a clinical emergency where positive intrapleural pressure impairs venous return, leading to obstructive shock.',
    differentialDiagnosis: ['Right Tension Pneumothorax', 'Giant Bulla', 'Simple Pneumothorax', 'Skin Fold Artifact'],
    reportingTemplate: 'CHEST RADIOGRAPH (PA/AP):\n\nFINDINGS:\nThere is a very large right-sided pneumothorax with complete collapse of the right lung.\nThere is marked leftward deviation of the trachea and mediastinal structures.\nThe right hemidiaphragm is severely depressed.\n\nIMPRESSION:\nAcute right tension pneumothorax. Emergency decompression is indicated.',
    teachingPoints: [
      'Do not wait for a chest radiograph if a patient has classic clinical signs of tension pneumothorax.',
      'Perform **emergent needle decompression** in the 2nd intercostal space at the midclavicular line (or 5th intercostal space at the anterior axillary line).',
      'A **deep sulcus sign** on a supine radiograph is highly indicative of pneumothorax.'
    ],
    cmeTip: 'Remember that tension pneumothorax is a clinical diagnosis; treatment should not be delayed for imaging in unstable patients.',
    orderIndex: 2,
    createdAt: 1700000000002,
    updatedAt: 1700000000002
  },
  {
    id: 'baseline-cxr-pneumonia',
    title: 'Right Upper Lobar Pneumonia with Air Bronchograms',
    modality: 'chest_xray',
    category: 'Common Pathology',
    difficulty: 'Beginner',
    imageUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=1200',
    imageAlt: 'Chest radiograph showing dense alveolar consolidation limited to the right upper lobe with visible air bronchograms',
    question: 'A 62-year-old female presents with productive cough, high fever, and pleuritic chest pain. What is the primary diagnosis indicated by the dense consolidation in the upper right hemithorax?',
    diagnosis: 'Right Upper Lobe Pneumonia',
    keyFindings: [
      'Dense alveolar **consolidation** restricted to the right upper lobe.',
      'Prominent **air bronchograms** visible within the consolidation.',
      'The consolidation is bounded sharply inferiorly by the **horizontal fissure**.',
      'No pleural effusion or mediastinal shift is present.'
    ],
    clinicalSignificance: 'Classic presentation of bacterial lobar pneumonia, most commonly caused by Streptococcus pneumoniae.',
    differentialDiagnosis: ['Right Upper Lobe Pneumonia', 'Right Upper Lobe Atelectasis', 'Bronchogenic Carcinoma with Post-Obstructive Pneumonitis'],
    reportingTemplate: 'CHEST RADIOGRAPH (PA/AP AND LATERAL):\n\nFINDINGS:\nThere is a dense consolidation restricted to the right upper lobe.\nMultiple linear and branching air lucencies within the density represent air bronchograms.\nThe process is sharply demarcated inferiorly by the horizontal fissure.\nNo significant pleural effusion or pneumothorax is seen.\n\nIMPRESSION:\nRight upper lobe consolidation, highly representative of acute lobar pneumonia.',
    teachingPoints: [
      'Air bronchograms indicate **patent airways** surrounded by fluid-filled alveoli, confirming alveolar pathology.',
      'Lobar consolidation sharply demarcated by a fissure confirms lobar localization.',
      'Follow-up radiographs in 6-8 weeks are recommended in older adults to confirm complete clearance and rule out underlying malignancy.'
    ],
    cmeTip: 'Look for the silhouette sign to localize the lobe; right middle lobe consolidation will silhouette (obscure) the right heart border.',
    orderIndex: 3,
    createdAt: 1700000000003,
    updatedAt: 1700000000003
  },
  {
    id: 'baseline-ct-hemorrhage',
    title: 'Acute Epidural Hematoma with Mass Effect',
    modality: 'head_ct',
    category: 'Emergency Findings',
    difficulty: 'Intermediate',
    imageUrl: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&q=80&w=1200',
    imageAlt: 'Non-contrast Head CT scan demonstrating a large lentiform hyperdense extra-axial collection with midline shift',
    question: 'An 18-year-old male was struck by a baseball bat on the side of his head. He had a brief loss of consciousness, followed by a lucid interval, and now presents with a deteriorating GCS. What is the definitive diagnosis?',
    diagnosis: 'Acute Epidural Hematoma',
    keyFindings: [
      'Classic **hyperdense biconvex (lentiform)** extra-axial collection in the right temporoparietal region.',
      'The collection is sharply bounded by skull **sutures** and does not cross them.',
      'Significant **mass effect** with compression of the right lateral ventricle and 4mm midline shift.',
      'Underlying linear fracture of the temporal bone.'
    ],
    clinicalSignificance: 'Epidural hematoma is usually caused by laceration of the middle meningeal artery, representing a neurosurgical emergency.',
    differentialDiagnosis: ['Acute Epidural Hematoma', 'Acute Subdural Hematoma', 'Chronic Subdural Hematoma', 'Dural Metastasis'],
    reportingTemplate: 'HEAD CT WITHOUT CONTRAST:\n\nFINDINGS:\nThere is a large biconvex, lentiform hyperdense extra-axial fluid collection in the right temporoparietal region.\nThe collection measures up to 1.8 cm in depth and does not cross suture lines.\nSignificant mass effect is noted, with effacement of the right lateral ventricle and a 4 mm leftward midline shift.\nBone window settings demonstrate a linear fracture of the temporal bone crossing the groove of the middle meningeal artery.\n\nIMPRESSION:\nLarge acute right temporoparietal epidural hematoma with significant mass effect. Emergent neurosurgical consultation is advised.',
    teachingPoints: [
      'Lentiform shape arises because the **dura is tightly adherent** to the inner table of the skull and sutures.',
      'In contrast, subdural hematomas are crescentic and can cross suture lines.',
      'Prompt surgical evacuation via craniotomy is life-saving.'
    ],
    cmeTip: 'The classic clinical "lucid interval" is present in only 20-50% of cases, so do not rely on its absence to rule out epidural hematoma.',
    orderIndex: 4,
    createdAt: 1700000000004,
    updatedAt: 1700000000004
  },
  {
    id: 'baseline-ct-normal',
    title: 'Normal Unenhanced Head CT Scan',
    modality: 'head_ct',
    category: 'Normal',
    difficulty: 'Beginner',
    imageUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&q=80&w=1200',
    imageAlt: 'Non-contrast Head CT scan demonstrating normal brain parenchyma and ventricular symmetry',
    question: 'A 45-year-old female presents with an atypical tension-type headache. A non-contrast head CT is performed. What is the interpretation?',
    diagnosis: 'Normal Non-contrast Head CT',
    keyFindings: [
      'Symmetric brain parenchyma with **normal grey-white differentiation**.',
      'Ventricles, cisterns, and cortical sulci are **normal in size** and appearance.',
      'No **extra-axial fluid collections**, acute hemorrhages, or mass effect.',
      'Calvarium is intact; paranasal sinuses and mastoid air cells are clear.'
    ],
    clinicalSignificance: 'A normal non-contrast head CT rules out acute hemorrhage, major mass effect, and large infarctions, establishing a safe baseline.',
    differentialDiagnosis: ['Normal Head CT', 'Early Ischemic Stroke (<6 hours)', 'Subacute Ischemic Infarct', 'Diffuse Axonal Injury'],
    reportingTemplate: 'HEAD CT WITHOUT CONTRAST:\n\nFINDINGS:\nBrain parenchyma is symmetric with normal attenuation and preserved grey-white matter differentiation.\nThere is no evidence of acute hemorrhage, large territorial ischemia, or focal mass effect.\nVentricular system, basal cisterns, and cortical sulci are within normal limits for age.\nVisualized bony structures, paranasal sinuses, and mastoid air cells are unremarkable.\n\nIMPRESSION:\nNormal unenhanced head CT examination.',
    teachingPoints: [
      'Grey-white matter differentiation is the first hallmark of a healthy unenhanced scan.',
      'Be aware that acute ischemic stroke may appear completely normal on CT in the first few hours.',
      'Verify symmetry of the ventricular system and basal cisterns to rule out early herniation.'
    ],
    cmeTip: 'Always check the "scout" image and the bone windows for subtle calvarial fractures.',
    orderIndex: 5,
    createdAt: 1700000000005,
    updatedAt: 1700000000005
  }
];
