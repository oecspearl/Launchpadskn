import React, { useState } from 'react';
import { 
  ChevronDown, 
  BookOpen, 
  Target, 
  Lightbulb, 
  Users, 
  Globe, 
  CheckCircle2, 
  PlayCircle,
  GraduationCap,
  FileText,
  Sparkles,
  Landmark,
  Scale,
  Coins,
  Heart,
  TreePine,
  History,
  Map
} from 'lucide-react';
import './SKNSocialScienceCurriculum.css';

const curriculumData = {
  title: "Social Science Enhanced Curriculum",
  grade: "Form One (1)",
  institution: "Ministry of Education - St. Kitts and Nevis",
  vision: "Educated persons from St. Kitts and Nevis will reach their full potential academically, physically, socially, culturally, emotionally, and morally, applying these skills to think critically and creatively, live respectfully, communicate effectively, and contribute responsibly to sustainable national development.",
  purpose: "Social Science education prepares students to be informed, engaged citizens who understand the complex relationships between people, places, and systems. Through the study of history, geography, economics, and civic life, students develop critical thinking skills and an appreciation for their cultural heritage while becoming responsible participants in local and global communities.",
  competencies: [
    "Is an engaged, responsible, caring, tolerant participant in civil society",
    "Is creative, enterprising, and resilient",
    "Thinks critically, communicates effectively, and solves problems",
    "Leads a healthy and active life",
    "Demonstrates technological empowerment",
    "Uses literacy and numeracy to understand, appreciate and act in the world",
    "Demonstrates an appreciation for the culture of St. Kitts and Nevis"
  ],
  strands: [
    {
      id: "culture",
      title: "Our Culture: Interaction and Interdependence Across Time",
      icon: "History",
      color: "#0891b2",
      description: "Students will explore the rich cultural heritage of St. Kitts and Nevis, examining how historical interactions have shaped our identity and traditions across generations.",
      expectations: [
        {
          id: "gle-1-1",
          title: "GLE 1: Early Inhabitants & European Contact",
          description: "Students will investigate the early inhabitants of St. Kitts and Nevis and the impact of European colonization.",
          outcomes: [
            "Describe the way of life of the Amerindian peoples",
            "Explain the impact of European colonization on indigenous peoples",
            "Analyze the contributions of different groups to our national heritage",
            "Construct timelines showing key historical events",
            "Compare and contrast life before and after European contact"
          ],
          assessments: [
            "Timeline construction project",
            "Reflective journal entries",
            "Group presentations on cultural heritage",
            "Crossword puzzles on historical vocabulary",
            "Short answer quizzes on key events"
          ],
          strategies: [
            "Guided research using primary and secondary sources",
            "Think-Pair-Share discussions",
            "Cooperative learning (Jigsaw method)",
            "Analysis of historical images and artifacts",
            "Field trips to historical sites"
          ]
        },
        {
          id: "gle-1-2",
          title: "GLE 2: Cultural Heritage & Identity",
          description: "Students will examine how cultural practices and traditions have been preserved and transformed over time.",
          outcomes: [
            "Identify cultural practices inherited from different ancestral groups",
            "Explain how cultural traditions have evolved over time",
            "Recognize symbols of national identity",
            "Appreciate the diversity of cultural expressions",
            "Document family and community traditions"
          ],
          assessments: [
            "Cultural heritage portfolio",
            "Family history interview project",
            "Presentation on national symbols",
            "Creative expression through art or music"
          ],
          strategies: [
            "Community interviews and oral history collection",
            "Analysis of cultural artifacts",
            "Comparative studies of traditions",
            "Guest speakers from cultural organizations"
          ]
        },
        {
          id: "gle-1-3",
          title: "GLE 3: Slavery and Emancipation",
          description: "Students will understand the history of slavery, resistance, and the journey to emancipation.",
          outcomes: [
            "Describe the transatlantic slave trade and its impact",
            "Identify forms of resistance to slavery",
            "Explain the process of emancipation",
            "Analyze the lasting effects of slavery on Caribbean society",
            "Appreciate the resilience of enslaved peoples"
          ],
          assessments: [
            "Research reports on key figures",
            "Analysis of primary source documents",
            "Reflection essays on emancipation",
            "Timeline of resistance movements"
          ],
          strategies: [
            "Document-based instruction",
            "Role-play and simulations",
            "Music and art analysis (e.g., Redemption Song)",
            "Collaborative research projects"
          ]
        },
        {
          id: "gle-1-4",
          title: "GLE 4: Post-Emancipation Society",
          description: "Students will examine the social, economic, and political changes following emancipation.",
          outcomes: [
            "Describe the challenges faced by formerly enslaved peoples",
            "Explain the development of free villages",
            "Analyze changes in the plantation economy",
            "Identify the contributions of various groups to nation-building"
          ],
          assessments: [
            "Comparative analysis essays",
            "Community mapping projects",
            "Group discussions on social change"
          ],
          strategies: [
            "Case study analysis",
            "Oral history collection",
            "Economic data interpretation"
          ]
        },
        {
          id: "gle-1-5",
          title: "GLE 5: Road to Independence",
          description: "Students will trace the political journey from colonialism to independence.",
          outcomes: [
            "Describe the colonial administrative structure",
            "Explain the growth of the labor movement",
            "Trace the steps toward self-governance",
            "Identify key figures in the independence movement",
            "Appreciate the significance of national symbols"
          ],
          assessments: [
            "Biography projects on national heroes",
            "Analysis of independence documents",
            "Mock constitutional convention"
          ],
          strategies: [
            "Document analysis",
            "Guest speakers (community elders)",
            "Comparative studies with other Caribbean nations"
          ]
        }
      ],
      knowledge: [
        { term: "Amerindians", definition: "The indigenous peoples of the Caribbean, including the Kalinago and Taino" },
        { term: "Colonization", definition: "The process by which European powers established control over Caribbean territories" },
        { term: "Emancipation", definition: "The freeing of enslaved peoples, achieved in the British Caribbean in 1834" },
        { term: "Heritage", definition: "The traditions, achievements, and beliefs passed down through generations" },
        { term: "Independence", definition: "The state of self-governance achieved by St. Kitts and Nevis on September 19, 1983" }
      ]
    },
    {
      id: "environment",
      title: "Our Dynamic Relationship with the Environment",
      icon: "TreePine",
      color: "#059669",
      description: "Students will explore the physical geography of St. Kitts and Nevis and understand how humans interact with and impact the natural environment.",
      expectations: [
        {
          id: "gle-2-1",
          title: "GLE 1: Physical Geography",
          description: "Students will describe the physical features and climate of St. Kitts and Nevis.",
          outcomes: [
            "Identify major landforms and physical features",
            "Describe the climate and weather patterns",
            "Explain the formation of volcanic islands",
            "Use maps and globes to locate geographic features",
            "Compare the geography of St. Kitts and Nevis"
          ],
          assessments: [
            "Map skills assessments",
            "Physical feature identification quizzes",
            "Weather observation journals",
            "3D model construction of islands"
          ],
          strategies: [
            "Google Earth explorations",
            "Field trips to geographic features",
            "Weather data collection and analysis",
            "Comparative mapping activities"
          ]
        },
        {
          id: "gle-2-2",
          title: "GLE 2: Natural Resources",
          description: "Students will identify and evaluate the natural resources of St. Kitts and Nevis.",
          outcomes: [
            "Identify natural resources found in our islands",
            "Classify resources as renewable or non-renewable",
            "Explain the importance of resource conservation",
            "Analyze the economic value of natural resources"
          ],
          assessments: [
            "Resource classification activities",
            "Conservation plan projects",
            "Economic impact analysis"
          ],
          strategies: [
            "Field investigations",
            "Guest speakers from environmental agencies",
            "Case studies on resource management"
          ]
        },
        {
          id: "gle-2-3",
          title: "GLE 3: Environmental Challenges",
          description: "Students will investigate environmental challenges and sustainable practices.",
          outcomes: [
            "Identify major environmental challenges facing our islands",
            "Explain the causes of pollution and climate change",
            "Propose solutions for environmental problems",
            "Evaluate the effectiveness of conservation efforts",
            "Demonstrate commitment to environmental stewardship"
          ],
          assessments: [
            "Environmental audit projects",
            "Solution proposal presentations",
            "Community action plans",
            "Reflective journals on personal environmental impact"
          ],
          strategies: [
            "Problem-based learning scenarios",
            "Community service projects",
            "Data collection and analysis",
            "Debates on environmental policies"
          ]
        },
        {
          id: "gle-2-4",
          title: "GLE 4: Natural Hazards & Disaster Preparedness",
          description: "Students will understand natural hazards and develop disaster preparedness skills.",
          outcomes: [
            "Identify natural hazards affecting the Caribbean",
            "Explain the causes of hurricanes, earthquakes, and volcanic activity",
            "Describe appropriate responses to natural disasters",
            "Develop family and school emergency plans",
            "Analyze the economic impact of natural disasters"
          ],
          assessments: [
            "Emergency preparedness plans",
            "Hazard mapping exercises",
            "Disaster simulation participation",
            "Research reports on historical disasters"
          ],
          strategies: [
            "Emergency drills and simulations",
            "Guest speakers from NEMA",
            "Case studies of past disasters",
            "Family planning activities"
          ]
        }
      ],
      knowledge: [
        { term: "Climate", definition: "The average weather conditions of a place over a long period of time" },
        { term: "Natural Resources", definition: "Materials from nature that people use to meet their needs" },
        { term: "Renewable Resources", definition: "Resources that can be replaced naturally over time" },
        { term: "Conservation", definition: "The protection and preservation of natural resources" },
        { term: "Natural Hazard", definition: "A natural event that poses a threat to people and property" }
      ]
    },
    {
      id: "governance",
      title: "Decision Making: Freedom, Power & Authority",
      icon: "Landmark",
      color: "#7c3aed",
      description: "Students will understand the principles of democracy, governance, and civic responsibility in St. Kitts and Nevis.",
      expectations: [
        {
          id: "gle-3-1",
          title: "GLE 1: Government Structure",
          description: "Students will describe the structure and functions of government.",
          outcomes: [
            "Identify the three branches of government",
            "Explain the roles and responsibilities of each branch",
            "Describe the electoral process",
            "Recognize key government officials and their functions",
            "Understand the relationship between federal and local government"
          ],
          assessments: [
            "Government structure diagrams",
            "Mock elections",
            "Interview projects with government officials",
            "Civic knowledge quizzes"
          ],
          strategies: [
            "Virtual tours of government buildings",
            "Role-play activities",
            "Guest speakers (government officials)",
            "Analysis of government documents"
          ]
        },
        {
          id: "gle-3-2",
          title: "GLE 2: Rights and Responsibilities",
          description: "Students will understand their rights and responsibilities as citizens.",
          outcomes: [
            "Identify fundamental human rights",
            "Explain the rights guaranteed by the Constitution",
            "Describe the responsibilities of citizenship",
            "Analyze situations involving rights and responsibilities",
            "Demonstrate respect for the rights of others"
          ],
          assessments: [
            "Rights and responsibilities portfolio",
            "Case study analysis",
            "Citizenship projects",
            "Reflective essays"
          ],
          strategies: [
            "Document analysis (Constitution)",
            "Case study discussions",
            "Community service projects",
            "Debates on rights issues"
          ]
        },
        {
          id: "gle-3-3",
          title: "GLE 3: Law and Justice",
          description: "Students will understand the legal system and the importance of justice.",
          outcomes: [
            "Explain the purpose of laws in society",
            "Describe the court system structure",
            "Identify the consequences of breaking laws",
            "Analyze the concept of justice and fairness",
            "Demonstrate respect for law and order"
          ],
          assessments: [
            "Mock trial participation",
            "Legal system diagrams",
            "Case analysis reports",
            "Justice reflection essays"
          ],
          strategies: [
            "Court visits",
            "Guest speakers (legal professionals)",
            "Mock trials",
            "Analysis of age-appropriate legal cases"
          ]
        },
        {
          id: "gle-3-4",
          title: "GLE 4: Conflict Resolution",
          description: "Students will develop skills for peaceful conflict resolution.",
          outcomes: [
            "Identify sources of conflict in various settings",
            "Explain strategies for peaceful conflict resolution",
            "Apply conflict resolution skills in real situations",
            "Evaluate the effectiveness of different approaches",
            "Demonstrate mediation skills"
          ],
          assessments: [
            "Conflict resolution role-plays",
            "Peer mediation practice",
            "Reflection journals",
            "Strategy evaluation reports"
          ],
          strategies: [
            "Role-play scenarios",
            "Peer mediation training",
            "Case study analysis",
            "Collaborative problem-solving activities"
          ]
        },
        {
          id: "gle-3-5",
          title: "GLE 5: Active Citizenship",
          description: "Students will engage in active citizenship and community involvement.",
          outcomes: [
            "Identify ways citizens can participate in democracy",
            "Plan and implement community service projects",
            "Evaluate the impact of citizen action",
            "Demonstrate leadership in school and community",
            "Appreciate the importance of civic engagement"
          ],
          assessments: [
            "Community service projects",
            "Civic action plans",
            "Leadership portfolios",
            "Reflection on civic engagement"
          ],
          strategies: [
            "Service learning projects",
            "Student government participation",
            "Community partnership activities",
            "Civic action campaigns"
          ]
        }
      ],
      knowledge: [
        { term: "Democracy", definition: "A system of government where citizens participate in decision-making" },
        { term: "Constitution", definition: "The supreme law of a country that establishes its government structure" },
        { term: "Citizenship", definition: "The status of being a member of a country with associated rights and duties" },
        { term: "Legislature", definition: "The branch of government that makes laws (Parliament)" },
        { term: "Judiciary", definition: "The branch of government that interprets laws (Courts)" }
      ]
    },
    {
      id: "economics",
      title: "Our Economic Resources & Wealth",
      icon: "Coins",
      color: "#d97706",
      description: "Students will understand economic concepts and the factors that influence the economy of St. Kitts and Nevis.",
      expectations: [
        {
          id: "gle-4-1",
          title: "GLE 1: Basic Economic Concepts",
          description: "Students will understand fundamental economic concepts.",
          outcomes: [
            "Define key economic terms (wants, needs, scarcity)",
            "Explain the concept of supply and demand",
            "Distinguish between goods and services",
            "Understand the role of money in the economy",
            "Make informed decisions about resource allocation"
          ],
          assessments: [
            "Economic vocabulary assessments",
            "Supply and demand simulations",
            "Goods and services classification",
            "Personal budget projects"
          ],
          strategies: [
            "Market simulations",
            "Real-world economic scenarios",
            "Budgeting activities",
            "Guest speakers (business owners)"
          ]
        },
        {
          id: "gle-4-2",
          title: "GLE 2: Economic Activities",
          description: "Students will examine the main economic activities in St. Kitts and Nevis.",
          outcomes: [
            "Identify major economic sectors (tourism, agriculture, services)",
            "Explain the importance of each sector to the economy",
            "Analyze changes in economic activities over time",
            "Evaluate the impact of economic activities on communities",
            "Explore career opportunities in different sectors"
          ],
          assessments: [
            "Sector research projects",
            "Economic activity mapping",
            "Career exploration presentations",
            "Impact analysis reports"
          ],
          strategies: [
            "Field visits to businesses",
            "Industry guest speakers",
            "Case studies of local businesses",
            "Career interviews"
          ]
        },
        {
          id: "gle-4-3",
          title: "GLE 3: Trade and Global Connections",
          description: "Students will understand trade relationships and global economic connections.",
          outcomes: [
            "Explain the concept of international trade",
            "Identify major trading partners of St. Kitts and Nevis",
            "Describe imports and exports",
            "Analyze the impact of global events on the local economy",
            "Understand the role of regional organizations (CARICOM, OECS)"
          ],
          assessments: [
            "Trade mapping projects",
            "Import/export analysis",
            "Regional organization research",
            "Global impact case studies"
          ],
          strategies: [
            "Trade simulations",
            "Data analysis activities",
            "Comparative studies",
            "Current events discussions"
          ]
        },
        {
          id: "gle-4-4",
          title: "GLE 4: Financial Literacy",
          description: "Students will develop personal financial management skills.",
          outcomes: [
            "Understand the importance of saving and budgeting",
            "Explain the role of banks and financial institutions",
            "Make informed consumer decisions",
            "Plan for short-term and long-term financial goals",
            "Recognize the dangers of debt and financial mismanagement"
          ],
          assessments: [
            "Personal budget creation",
            "Savings plan projects",
            "Consumer decision analysis",
            "Financial goal planning"
          ],
          strategies: [
            "Budget simulations",
            "Bank visits or virtual tours",
            "Consumer education activities",
            "Financial planning exercises"
          ]
        }
      ],
      knowledge: [
        { term: "Economy", definition: "The system of production, distribution, and consumption of goods and services" },
        { term: "Scarcity", definition: "The limited availability of resources relative to unlimited wants" },
        { term: "Supply", definition: "The amount of a good or service that producers are willing to sell" },
        { term: "Demand", definition: "The desire and ability of consumers to purchase goods and services" },
        { term: "Trade", definition: "The buying and selling of goods and services between people or countries" }
      ]
    },
    {
      id: "global",
      title: "Global Citizenship",
      icon: "Globe",
      color: "#db2777",
      description: "Students will develop awareness of global issues and their responsibilities as members of the international community.",
      expectations: [
        {
          id: "gle-5-1",
          title: "GLE 1: Global Awareness",
          description: "Students will develop awareness of the wider world and its peoples.",
          outcomes: [
            "Identify major world regions and countries",
            "Describe diverse cultures and ways of life",
            "Explain global interconnections and dependencies",
            "Appreciate cultural diversity and similarities",
            "Use various media to learn about the world"
          ],
          assessments: [
            "World region projects",
            "Cultural comparison presentations",
            "Current events journals",
            "Virtual exchange participation"
          ],
          strategies: [
            "Virtual field trips",
            "Cultural exchange activities",
            "International news analysis",
            "Multicultural celebrations"
          ]
        },
        {
          id: "gle-5-2",
          title: "GLE 2: Global Issues",
          description: "Students will examine major global issues affecting humanity.",
          outcomes: [
            "Identify major global challenges (poverty, climate change, conflict)",
            "Explain the causes and effects of global issues",
            "Analyze how global issues affect local communities",
            "Evaluate solutions to global problems",
            "Demonstrate empathy for people facing global challenges"
          ],
          assessments: [
            "Global issue research projects",
            "Solution proposal presentations",
            "Cause-effect analysis",
            "Empathy reflection essays"
          ],
          strategies: [
            "Case study analysis",
            "Problem-based learning",
            "Documentary analysis",
            "Collaborative research"
          ]
        },
        {
          id: "gle-5-3",
          title: "GLE 3: International Organizations",
          description: "Students will understand the role of international organizations.",
          outcomes: [
            "Identify major international organizations (UN, CARICOM, OECS)",
            "Explain the purposes and functions of these organizations",
            "Describe St. Kitts and Nevis' role in international bodies",
            "Analyze the effectiveness of international cooperation",
            "Appreciate the importance of global collaboration"
          ],
          assessments: [
            "Organization research reports",
            "Model UN participation",
            "Effectiveness analysis projects",
            "Collaboration case studies"
          ],
          strategies: [
            "Model UN simulations",
            "Guest speakers from international agencies",
            "Research projects",
            "Collaborative learning activities"
          ]
        },
        {
          id: "gle-5-4",
          title: "GLE 4: Technology and Global Communication",
          description: "Students will examine the role of technology in connecting the world.",
          outcomes: [
            "Describe how technology has changed global communication",
            "Explain the benefits and risks of digital connectivity",
            "Demonstrate responsible use of technology",
            "Analyze the impact of social media on society",
            "Use technology to connect with global communities"
          ],
          assessments: [
            "Technology impact analysis",
            "Digital citizenship portfolio",
            "Social media case studies",
            "Global collaboration projects"
          ],
          strategies: [
            "Digital literacy instruction",
            "Online safety education",
            "Virtual collaboration projects",
            "Social media analysis"
          ]
        }
      ],
      knowledge: [
        { term: "Globalization", definition: "The increasing interconnection of the world's economies, cultures, and populations" },
        { term: "United Nations", definition: "An international organization promoting peace, security, and cooperation" },
        { term: "CARICOM", definition: "Caribbean Community - a regional organization promoting integration" },
        { term: "OECS", definition: "Organisation of Eastern Caribbean States - a regional grouping" },
        { term: "Digital Citizenship", definition: "The responsible and ethical use of technology and the internet" }
      ]
    }
  ],
  crossCurricular: [
    { subject: "Language Arts", connection: "Report writing, oral presentations, research skills, critical reading" },
    { subject: "Mathematics", connection: "Data analysis, graphing, statistical interpretation, economic calculations" },
    { subject: "Science", connection: "Environmental studies, climate change, natural hazards, geography" },
    { subject: "Visual Arts", connection: "Cultural expression, historical artifacts, poster design, mapping" },
    { subject: "Music", connection: "Cultural traditions, protest songs, national anthems, folk music analysis" }
  ],
  culturalElements: [
    "Exploring the Amerindian heritage visible in national symbols",
    "Documenting family histories and oral traditions",
    "Visiting historical sites: Brimstone Hill, Romney Manor, Petroglyphs",
    "Analyzing Caribbean music as historical documentation",
    "Celebrating national heroes and independence",
    "Understanding the significance of Carnival and other festivals"
  ]
};

const iconComponents = {
  History, TreePine, Landmark, Coins, Globe, Map
};

// Collapsible Section Component
const CollapsibleSection = ({ title, icon: Icon, children, defaultOpen = false, accentColor }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="skn-ss-collapsible">
      <button 
        className="skn-ss-collapsible-header"
        onClick={() => setIsOpen(!isOpen)}
        style={{ '--accent': accentColor }}
      >
        <div className="skn-ss-collapsible-title">
          {Icon && <Icon size={18} style={{ color: accentColor }} />}
          <span>{title}</span>
        </div>
        <ChevronDown 
          size={18} 
          className={`skn-ss-chevron ${isOpen ? 'skn-ss-chevron-open' : ''}`}
        />
      </button>
      <div className={`skn-ss-collapsible-content ${isOpen ? 'skn-ss-collapsible-open' : ''}`}>
        {children}
      </div>
    </div>
  );
};

// Expectation Card Component
const ExpectationCard = ({ expectation, strandColor }) => {
  const [activeTab, setActiveTab] = useState('outcomes');
  
  const tabs = [
    { id: 'outcomes', label: 'Learning Outcomes', icon: Target, data: expectation.outcomes },
    { id: 'assessments', label: 'Assessments', icon: PlayCircle, data: expectation.assessments },
    { id: 'strategies', label: 'Strategies', icon: Lightbulb, data: expectation.strategies }
  ];
  
  return (
    <div className="skn-ss-expectation-card">
      <h4 className="skn-ss-expectation-title">{expectation.title}</h4>
      <p className="skn-ss-expectation-desc">{expectation.description}</p>
      
      <div className="skn-ss-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`skn-ss-tab ${activeTab === tab.id ? 'skn-ss-tab-active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            style={{ '--accent': strandColor }}
          >
            <tab.icon size={14} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
      
      <ul className="skn-ss-content-list">
        {tabs.find(t => t.id === activeTab)?.data.map((item, idx) => (
          <li key={idx} className="skn-ss-content-item">
            <CheckCircle2 size={14} style={{ color: strandColor, flexShrink: 0 }} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Knowledge Grid Component
const KnowledgeGrid = ({ items, color }) => (
  <div className="skn-ss-knowledge-grid">
    {items.map((item, idx) => (
      <div key={idx} className="skn-ss-knowledge-item">
        <dt style={{ color }}>{item.term}</dt>
        <dd>{item.definition}</dd>
      </div>
    ))}
  </div>
);

// Strand Section Component  
const StrandSection = ({ strand }) => {
  const IconComponent = iconComponents[strand.icon];
  
  return (
    <CollapsibleSection 
      title={strand.title} 
      icon={IconComponent}
      accentColor={strand.color}
    >
      <div className="skn-ss-strand-content">
        <p className="skn-ss-strand-description">{strand.description}</p>
        
        <div className="skn-ss-expectations-grid">
          {strand.expectations.map(expectation => (
            <ExpectationCard 
              key={expectation.id} 
              expectation={expectation} 
              strandColor={strand.color} 
            />
          ))}
        </div>
        
        {strand.knowledge && strand.knowledge.length > 0 && (
          <CollapsibleSection 
            title="Key Concepts & Definitions" 
            icon={BookOpen}
            accentColor={strand.color}
          >
            <KnowledgeGrid items={strand.knowledge} color={strand.color} />
          </CollapsibleSection>
        )}
      </div>
    </CollapsibleSection>
  );
};

// Main Component
export default function SKNSocialScienceCurriculum() {
  return (
    <div className="skn-ss-container">
      {/* Header */}
      <header className="skn-ss-header">
        <div className="skn-ss-header-badge">
          <span className="skn-ss-flag-stripe skn-ss-flag-green"></span>
          <span className="skn-ss-flag-stripe skn-ss-flag-yellow"></span>
          <span className="skn-ss-flag-stripe skn-ss-flag-black"></span>
        </div>
        <p className="skn-ss-header-institution">{curriculumData.institution}</p>
        
        <h1 className="skn-ss-main-title">
          <Globe size={32} />
          <span>Social Science Curriculum</span>
        </h1>
        
        <div className="skn-ss-header-meta">
          <span className="skn-ss-badge">
            <FileText size={14} />
            {curriculumData.title}
          </span>
          <span className="skn-ss-badge">
            <GraduationCap size={14} />
            {curriculumData.grade}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="skn-ss-main">
        {/* Vision & Purpose */}
        <section className="skn-ss-intro-section">
          <div className="skn-ss-intro-card skn-ss-vision">
            <div className="skn-ss-intro-header">
              <Target size={20} />
              <h2>Educational Vision</h2>
            </div>
            <p>{curriculumData.vision}</p>
          </div>
          
          <div className="skn-ss-intro-card skn-ss-purpose">
            <div className="skn-ss-intro-header">
              <Lightbulb size={20} />
              <h2>Purpose of Social Science</h2>
            </div>
            <p>{curriculumData.purpose}</p>
          </div>
        </section>

        {/* Competencies */}
        <section className="skn-ss-competencies-section">
          <h2 className="skn-ss-section-title">
            <Sparkles size={20} />
            Essential Educational Competencies
          </h2>
          <div className="skn-ss-competencies-grid">
            {curriculumData.competencies.map((comp, idx) => (
              <div key={idx} className="skn-ss-competency-item">
                <CheckCircle2 size={16} />
                <span>{comp}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Curriculum Strands */}
        <section className="skn-ss-strands-section">
          <h2 className="skn-ss-section-title">
            <BookOpen size={20} />
            Curriculum Strands
          </h2>
          
          <div className="skn-ss-strands-list">
            {curriculumData.strands.map(strand => (
              <StrandSection key={strand.id} strand={strand} />
            ))}
          </div>
        </section>

        {/* Cross-Curricular & Cultural */}
        <section className="skn-ss-connections-section">
          <div className="skn-ss-connections-grid">
            <div className="skn-ss-connection-card">
              <h3>
                <Users size={18} />
                Cross-Curricular Connections
              </h3>
              <div className="skn-ss-connection-list">
                {curriculumData.crossCurricular.map((item, idx) => (
                  <div key={idx} className="skn-ss-connection-item">
                    <strong>{item.subject}</strong>
                    <p>{item.connection}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="skn-ss-connection-card">
              <h3>
                <Heart size={18} />
                Local Culture & Heritage
              </h3>
              <ul className="skn-ss-culture-list">
                {curriculumData.culturalElements.map((element, idx) => (
                  <li key={idx}>
                    <CheckCircle2 size={14} />
                    <span>{element}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="skn-ss-footer">
        <div className="skn-ss-footer-divider">
          <span className="skn-ss-flag-stripe skn-ss-flag-green"></span>
          <span className="skn-ss-flag-stripe skn-ss-flag-yellow"></span>
          <span className="skn-ss-flag-stripe skn-ss-flag-black"></span>
        </div>
        <p className="skn-ss-footer-text">
          Curriculum Development Unit • Teacher Resource Center
        </p>
        <p className="skn-ss-footer-subtext">
          Enhanced Curriculum aligned with OECS Learning Standards and C3 Framework
        </p>
      </footer>
    </div>
  );
}
