import React, { useState } from 'react';
import { 
  ChevronDown, 
  BookOpen, 
  Target, 
  Lightbulb, 
  Users, 
  CheckCircle2, 
  PlayCircle,
  GraduationCap,
  FileText,
  Sparkles,
  History,
  TreePine,
  Landmark,
  Coins,
  Globe,
  Scale,
  Leaf,
  Shield
} from 'lucide-react';
import './SKNSocialScienceCurriculumForm2.css';

const curriculumData = {
  title: "Social Science Enhanced Curriculum",
  grade: "Form Two (2)",
  institution: "Ministry of Education - St. Kitts and Nevis",
  vision: "Educated persons from St. Kitts and Nevis will reach their full potential academically, physically, socially, culturally, emotionally, and morally, applying these skills to think critically and creatively, live respectfully, communicate effectively, and contribute responsibly to sustainable national development.",
  purpose: "Social Studies develops the values and attitudes, knowledge and understanding, skills and processes students require to engage in active and responsible citizenship at a national, regional, and global level in an inclusive culturally diverse and interdependent world. Through students' engagement in critical and creative thinking, historical and geographical thinking, decision making and problem solving, communication and collaboration; they will develop an awareness that will enable them to effect positive change in their communities, societies, and the world.",
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
      description: "To analyze concepts of identity, culture, community, and the past in relation to individuals, societies, and nations.",
      expectations: [
        {
          id: "gle1-1",
          title: "Cultural Elements & Portfolio",
          guideline: "Create a portfolio of cultural elements people around the world have in common (belief systems, government, family structure, ways to self-express, forms of recreation and play)",
          outcomes: [
            "Create a portfolio showing common cultural elements of people around the world",
            "Define terms such as identity, culture, community, and heritage",
            "Identify examples of cultural elements (beliefs, traditions, customs)",
            "Compare and contrast cultural practices across different societies"
          ],
          assessments: [
            "Portfolio submission with research, interviews, and assessments",
            "E-portfolio or written portfolio creation",
            "Cultural element comparison charts",
            "Peer evaluation of portfolio presentations"
          ],
          strategies: [
            "Introduction to portfolio creation (E-portfolio and manual)",
            "Video resources on cultural elements",
            "Think-pair-share activities on cultural comparisons",
            "Creative organization and presentation techniques"
          ]
        },
        {
          id: "gle1-2",
          title: "Immigration Patterns to St. Kitts and Nevis",
          guideline: "Construct a timeline of the historical immigration patterns to St. Kitts and Nevis",
          outcomes: [
            "State the various cultural groups that migrated to the Caribbean",
            "Identify places of origin for each group of immigrants",
            "Locate places of origin on world maps",
            "Construct a timeline showing historical migratory patterns"
          ],
          assessments: [
            "Map activities showing migration routes and settlements",
            "Timeline construction with key migration events",
            "World map labeling of origins and destinations",
            "Caribbean settlement pattern illustrations"
          ],
          strategies: [
            "Review of Form 1 content on early inhabitants",
            "Video presentations on different migrant groups",
            "Creative games like 'Find Me!' for location identification",
            "Discussion of migration patterns (Amerindians, Maya, Europeans, Africans, East Indians)"
          ]
        },
        {
          id: "gle1-3",
          title: "Cultural Contributions & Heritage",
          guideline: "Analyze contributions of various groups to Caribbean culture",
          outcomes: [
            "Identify cultural contributions of different ethnic groups",
            "Explain the impact of migration on Caribbean cultural development",
            "Analyze the blending of cultures in St. Kitts and Nevis",
            "Appreciate the multicultural heritage of the Caribbean"
          ],
          assessments: [
            "Research presentations on cultural contributions",
            "Comparative analysis charts",
            "Cultural heritage exhibition projects",
            "Reflection journals on personal cultural identity"
          ],
          strategies: [
            "Group research on specific ethnic contributions",
            "Guest speakers from different cultural backgrounds",
            "Field trips to cultural sites and museums",
            "Creative arts integration (music, dance, visual arts)"
          ]
        },
        {
          id: "gle1-4",
          title: "Colonial Impact on Caribbean Society",
          guideline: "Examine the effects of colonialism on Caribbean peoples and societies",
          outcomes: [
            "Explain the impact of European colonization on indigenous peoples",
            "Analyze the effects of the plantation system on society",
            "Discuss the legacy of slavery and indentureship",
            "Evaluate the lasting impacts of colonial rule"
          ],
          assessments: [
            "Document analysis of primary sources",
            "Comparative essays on colonial impacts",
            "Timeline of colonial events and their effects",
            "Debate on colonial legacies"
          ],
          strategies: [
            "Primary source analysis activities",
            "Documentary viewings with guided questions",
            "Role-play activities exploring different perspectives",
            "Critical thinking discussions on historical injustices"
          ]
        },
        {
          id: "gle1-5",
          title: "Post-Independence Development",
          guideline: "Assess national development since independence",
          outcomes: [
            "Describe the path to independence for St. Kitts and Nevis",
            "Identify key national symbols and their significance",
            "Analyze social and economic development since independence",
            "Evaluate challenges and achievements of the nation"
          ],
          assessments: [
            "National symbol presentations",
            "Development indicator analysis",
            "Interview projects with community elders",
            "Vision for the future creative projects"
          ],
          strategies: [
            "Timeline construction of independence journey",
            "Analysis of national anthem, flag, and coat of arms",
            "Comparison of pre and post-independence conditions",
            "Community engagement activities"
          ]
        }
      ],
      knowledge: [
        { term: "Culture", definition: "The beliefs, customs, arts, and way of life of a particular group of people" },
        { term: "Heritage", definition: "Traditions, achievements, and beliefs passed down through generations" },
        { term: "Migration", definition: "The movement of people from one place to another to settle" },
        { term: "Colonialism", definition: "The practice of one country establishing control over another territory" },
        { term: "Indigenous", definition: "Originating or occurring naturally in a particular place; native" },
        { term: "Multicultural", definition: "Relating to or containing several cultural or ethnic groups" }
      ]
    },
    {
      id: "environment",
      title: "Our Dynamic Relationship with the Environment",
      icon: "TreePine",
      color: "#059669",
      description: "To investigate the dynamic relationships of people with land, environments, and ideas as they affected the past, shape the present and influence the future.",
      expectations: [
        {
          id: "gle2-1",
          title: "Land & National Identity",
          guideline: "Assess the impact of the land on the country's identity portrayed in literature, music, media, visual art, dance, sport, and recreation",
          outcomes: [
            "Differentiate between natural and man-made geographical features",
            "Identify examples of natural and man-made features from St. Kitts and Nevis",
            "Explain how the physical landscape influences national identity",
            "Analyze representations of land in local arts and culture"
          ],
          assessments: [
            "Table comparing natural and man-made environments",
            "Paragraph writing on natural landscape of SKN",
            "Analysis of local literature and music for land themes",
            "Creative projects connecting land to identity"
          ],
          strategies: [
            "Video presentations of SKN's physical landscape",
            "Discussion of natural vs. man-made features",
            "Analysis of national symbols connected to land",
            "Field observations of local geographical features"
          ]
        },
        {
          id: "gle2-2",
          title: "Natural Resources & Sustainability",
          guideline: "Evaluate the use and management of natural resources",
          outcomes: [
            "Identify the natural resources of St. Kitts and Nevis",
            "Explain the importance of natural resources to the economy",
            "Analyze sustainable and unsustainable resource practices",
            "Propose solutions for sustainable resource management"
          ],
          assessments: [
            "Resource inventory projects",
            "Sustainability case study analyses",
            "Proposal presentations for resource conservation",
            "Environmental impact assessment activities"
          ],
          strategies: [
            "Resource mapping activities",
            "Guest speakers on environmental management",
            "Field trips to resource sites",
            "Problem-based learning on sustainability challenges"
          ]
        },
        {
          id: "gle2-3",
          title: "Environmental Challenges",
          guideline: "Examine environmental challenges facing St. Kitts and Nevis and the Caribbean",
          outcomes: [
            "Identify major environmental challenges in the region",
            "Explain the causes and effects of climate change",
            "Analyze the impact of pollution on local ecosystems",
            "Evaluate human activities contributing to environmental degradation"
          ],
          assessments: [
            "Environmental challenge presentations",
            "Cause and effect diagrams",
            "Research reports on specific environmental issues",
            "Action plan development for environmental protection"
          ],
          strategies: [
            "Video documentaries on environmental issues",
            "Local environmental data analysis",
            "Community awareness campaign planning",
            "Collaborative problem-solving activities"
          ]
        },
        {
          id: "gle2-4",
          title: "Disaster Preparedness & Mitigation",
          guideline: "Assess disaster preparedness and mitigation strategies",
          outcomes: [
            "Identify natural hazards affecting St. Kitts and Nevis",
            "Explain the importance of disaster preparedness",
            "Analyze mitigation strategies for different natural hazards",
            "Develop personal and community disaster plans"
          ],
          assessments: [
            "Disaster preparedness checklist creation",
            "Emergency plan development projects",
            "Case study analysis of past disasters",
            "Community resilience evaluation reports"
          ],
          strategies: [
            "NEMA resource utilization",
            "Simulation exercises for disaster scenarios",
            "Guest speakers from emergency services",
            "Historical disaster analysis and lessons learned"
          ]
        }
      ],
      knowledge: [
        { term: "Natural Features", definition: "Geographical elements formed by nature (mountains, rivers, beaches)" },
        { term: "Man-made Features", definition: "Structures and modifications created by humans" },
        { term: "Sustainability", definition: "Meeting present needs without compromising future generations' ability to meet theirs" },
        { term: "Climate Change", definition: "Long-term changes in global temperature and weather patterns" },
        { term: "Natural Hazard", definition: "A natural phenomenon that may cause harm (hurricanes, earthquakes, floods)" },
        { term: "Mitigation", definition: "Actions taken to reduce the severity or impact of something" }
      ]
    },
    {
      id: "governance",
      title: "Decision Making: Freedom, Power & Authority",
      icon: "Landmark",
      color: "#7c3aed",
      description: "To analyze the processes, structures of power and authority, and their implications for individuals, relationships, communities, and nations as decisions are made.",
      expectations: [
        {
          id: "gle3-1",
          title: "Rights & Freedoms",
          guideline: "Examine the effects of 'Rights and Freedoms' on individuals and groups (freedom of speech/press, freedom of association, right to justice, civil protections)",
          outcomes: [
            "Define key terms: power, authority, rights, freedoms, constitution, citizens, responsibilities",
            "Identify the rights and freedoms of citizens of St. Kitts and Nevis",
            "Demonstrate an appreciation that with rights comes responsibilities",
            "Compare rights in the SKN Constitution with the UN Declaration of Human Rights"
          ],
          assessments: [
            "Crossword puzzles reinforcing definitions",
            "Rights identification from Constitution and UN Declaration",
            "Role-play scenarios showing rights and responsibilities",
            "Poster/video/PowerPoint presentations on specific rights"
          ],
          strategies: [
            "Paired sentence completion activities",
            "Constitution document analysis",
            "Group presentations on specific rights/freedoms",
            "Case study discussions on rights violations"
          ]
        },
        {
          id: "gle3-2",
          title: "Government Structure & Functions",
          guideline: "Analyze the structure and functions of government in St. Kitts and Nevis",
          outcomes: [
            "Describe the structure of government (Executive, Legislature, Judiciary)",
            "Explain the functions of each branch of government",
            "Identify key government officials and their roles",
            "Analyze the system of checks and balances"
          ],
          assessments: [
            "Government structure diagrams",
            "Function matching activities",
            "Research presentations on government branches",
            "Mock government proceedings"
          ],
          strategies: [
            "Graphic organizers for government structure",
            "Virtual tours of government buildings",
            "Guest speakers from government offices",
            "Comparative analysis with other governments"
          ]
        },
        {
          id: "gle3-3",
          title: "Electoral Process & Civic Participation",
          guideline: "Evaluate the electoral process and importance of civic participation",
          outcomes: [
            "Explain the electoral process in St. Kitts and Nevis",
            "Describe the role of political parties",
            "Analyze the importance of voting and civic engagement",
            "Evaluate ways citizens can participate in democracy"
          ],
          assessments: [
            "Electoral process flowcharts",
            "Mock elections and campaigns",
            "Civic participation project proposals",
            "Analysis of voter participation data"
          ],
          strategies: [
            "Election simulation activities",
            "Interview projects with local officials",
            "Analysis of campaign materials",
            "Debate on civic responsibilities"
          ]
        },
        {
          id: "gle3-4",
          title: "Law, Justice & Enforcement",
          guideline: "Examine the legal system and justice processes",
          outcomes: [
            "Describe the structure of the court system",
            "Explain the role of law enforcement agencies",
            "Analyze the justice process from arrest to trial",
            "Evaluate the importance of rule of law in society"
          ],
          assessments: [
            "Court system diagrams",
            "Case study analyses",
            "Mock trial simulations",
            "Justice system comparison projects"
          ],
          strategies: [
            "Court visit field trips",
            "Guest speakers (lawyers, police officers)",
            "Crime prevention awareness activities",
            "Analysis of legal rights and processes"
          ]
        },
        {
          id: "gle3-5",
          title: "Conflict Resolution & Peacebuilding",
          guideline: "Develop skills for conflict resolution and peacebuilding",
          outcomes: [
            "Identify types and causes of conflict",
            "Explain peaceful conflict resolution strategies",
            "Apply mediation and negotiation techniques",
            "Evaluate the role of organizations in peacebuilding"
          ],
          assessments: [
            "Conflict resolution role-plays",
            "Mediation scenario exercises",
            "Peace plan development projects",
            "Case study analysis of conflict resolution"
          ],
          strategies: [
            "Peer mediation training activities",
            "Analysis of local and international conflicts",
            "Guest speakers on conflict resolution",
            "Collaborative problem-solving exercises"
          ]
        }
      ],
      knowledge: [
        { term: "Constitution", definition: "The fundamental principles and laws that govern a country" },
        { term: "Rights", definition: "Legal, social, or ethical entitlements that individuals possess" },
        { term: "Responsibilities", definition: "Duties or obligations that come with having rights" },
        { term: "Democracy", definition: "A system of government where citizens exercise power through voting" },
        { term: "Legislature", definition: "The law-making body of government (Parliament)" },
        { term: "Judiciary", definition: "The branch of government responsible for interpreting laws and administering justice" },
        { term: "Rule of Law", definition: "The principle that all people and institutions are accountable to laws" }
      ]
    },
    {
      id: "economics",
      title: "Our Economic Resources & Wealth",
      icon: "Coins",
      color: "#d97706",
      description: "To analyze the distribution of resources and wealth in relation to individuals, communities, and nations.",
      expectations: [
        {
          id: "gle4-1",
          title: "Economic Systems & Concepts",
          guideline: "Explain the characteristics of a mixed economy including the roles of producer, consumer, and government",
          outcomes: [
            "Define terms: economy, needs, wants, services, goods, free market economy, planned/command economy, mixed economy, producer, consumer, private sector, public sector",
            "Differentiate among free market economy, command economy and mixed economy",
            "Assess the advantages and disadvantages of the mixed economy",
            "Assess the role of consumers and producers in the mixed economy"
          ],
          assessments: [
            "Concept map linking economic terms",
            "Crossword puzzles for terminology",
            "Economy comparison essays ('Living in a Mixed Economy')",
            "Economy tree visual display creation"
          ],
          strategies: [
            "Station rotation with videos and literature",
            "Role-play representing different economy types",
            "Debate on consumer-producer relationships",
            "Real-world economic examples analysis"
          ]
        },
        {
          id: "gle4-2",
          title: "Government's Economic Role",
          guideline: "Evaluate the role of government in the economy",
          outcomes: [
            "Explain the government's role in a mixed economy",
            "Identify public goods and services provided by government",
            "Analyze taxation and government spending",
            "Evaluate the impact of government policies on the economy"
          ],
          assessments: [
            "Government services mapping projects",
            "Budget analysis activities",
            "Policy impact case studies",
            "Presentation on government economic functions"
          ],
          strategies: [
            "Analysis of national budget allocations",
            "Guest speakers from government ministries",
            "Simulation of government economic decisions",
            "Comparative analysis of economic policies"
          ]
        },
        {
          id: "gle4-3",
          title: "Trade & Economic Partnerships",
          guideline: "Examine trade relationships and economic partnerships",
          outcomes: [
            "Explain the concept of international trade",
            "Identify St. Kitts and Nevis's major trading partners",
            "Analyze the benefits and challenges of trade agreements",
            "Evaluate regional economic organizations (CARICOM, OECS)"
          ],
          assessments: [
            "Trade map creation projects",
            "Trading partner research presentations",
            "Trade agreement analysis reports",
            "Regional organization comparison charts"
          ],
          strategies: [
            "Import/export data analysis",
            "Virtual tours of trade facilities",
            "Role-play of trade negotiations",
            "Case studies of regional economic cooperation"
          ]
        },
        {
          id: "gle4-4",
          title: "Financial Literacy & Personal Economics",
          guideline: "Develop financial literacy and personal economic skills",
          outcomes: [
            "Explain the importance of budgeting and saving",
            "Differentiate between needs and wants in spending decisions",
            "Analyze the role of banks and financial institutions",
            "Apply decision-making skills to personal finances"
          ],
          assessments: [
            "Personal budget creation projects",
            "Savings plan development",
            "Financial decision scenario analyses",
            "Entrepreneurship project proposals"
          ],
          strategies: [
            "Budget simulation activities",
            "Guest speakers from financial institutions",
            "Real-world financial scenario discussions",
            "Junior Achievement-style business projects"
          ]
        }
      ],
      knowledge: [
        { term: "Economy", definition: "The system of production, distribution, and consumption of goods and services" },
        { term: "Mixed Economy", definition: "An economic system combining elements of free market and government control" },
        { term: "Consumer", definition: "A person who purchases goods and services for personal use" },
        { term: "Producer", definition: "A person or business that creates goods or provides services" },
        { term: "Public Sector", definition: "The part of the economy controlled by the government" },
        { term: "Private Sector", definition: "The part of the economy owned and operated by individuals and businesses" },
        { term: "Trade", definition: "The buying and selling of goods and services between parties" }
      ]
    },
    {
      id: "global",
      title: "Global Citizenship",
      icon: "Globe",
      color: "#db2777",
      description: "To examine the global interdependence of ideas, people, societies, nations, and environments as they shape the present and influence the future.",
      expectations: [
        {
          id: "gle5-1",
          title: "Global Environmental Challenges",
          guideline: "Investigate the issues involved in finding solutions to environmental challenges (sharing water resources, deforestation, monocropping, global warming, flora and fauna extinction)",
          outcomes: [
            "Identify global environmental challenges",
            "Explain the impact of named environmental challenges on St. Kitts and Nevis",
            "Suggest solutions to named environmental challenges",
            "Discuss effectiveness of attempts to solve environmental challenges"
          ],
          assessments: [
            "Graphic organizer showing environmental challenges",
            "Environmental impact videos and observation notes",
            "Solution table development for challenges",
            "Journal entries on local environmental issues"
          ],
          strategies: [
            "Video presentations on global environmental issues",
            "Group brainstorming for solutions",
            "Infographic analysis of environmental actions",
            "Local examples discussion (flooding, hurricanes, coral ecosystems)"
          ]
        },
        {
          id: "gle5-2",
          title: "International Organizations",
          guideline: "Analyze the role of international organizations",
          outcomes: [
            "Identify major international organizations (UN, Commonwealth, CARICOM)",
            "Explain the purpose and functions of international organizations",
            "Analyze St. Kitts and Nevis's participation in international bodies",
            "Evaluate the impact of international cooperation"
          ],
          assessments: [
            "Organization research presentations",
            "Membership mapping activities",
            "Case study analysis of international initiatives",
            "Debate on international organization effectiveness"
          ],
          strategies: [
            "Virtual tours of UN and other organizations",
            "Analysis of international agreements",
            "Role-play of international meetings",
            "Guest speakers on international relations"
          ]
        },
        {
          id: "gle5-3",
          title: "Sustainable Development Goals",
          guideline: "Examine the Sustainable Development Goals and their relevance",
          outcomes: [
            "Identify the 17 Sustainable Development Goals",
            "Explain the relevance of SDGs to St. Kitts and Nevis",
            "Analyze progress toward achieving SDGs locally and globally",
            "Propose actions to support sustainable development"
          ],
          assessments: [
            "SDG poster creation projects",
            "Progress report analyses",
            "Action plan development for local SDG implementation",
            "Comparative studies of SDG achievement"
          ],
          strategies: [
            "SDG video and resource analysis",
            "Community audit against SDG targets",
            "Project-based learning for SDG action",
            "Collaboration with environmental groups"
          ]
        },
        {
          id: "gle5-4",
          title: "Technology & Global Communication",
          guideline: "Evaluate the impact of technology on global communication and citizenship",
          outcomes: [
            "Analyze the role of technology in connecting the global community",
            "Evaluate benefits and challenges of digital communication",
            "Discuss responsible digital citizenship",
            "Assess technology's impact on culture and society"
          ],
          assessments: [
            "Digital citizenship project presentations",
            "Technology impact analysis reports",
            "Social media case study evaluations",
            "Global communication campaign designs"
          ],
          strategies: [
            "Discussion of social media's global reach",
            "Analysis of digital divide issues",
            "Creation of digital citizenship guidelines",
            "Cross-cultural communication activities"
          ]
        }
      ],
      knowledge: [
        { term: "Global Citizenship", definition: "Awareness of the wider world and one's role as a world citizen" },
        { term: "Sustainable Development", definition: "Development that meets present needs without compromising future generations" },
        { term: "SDGs", definition: "17 Sustainable Development Goals adopted by UN member states in 2015" },
        { term: "International Organization", definition: "An entity established by multiple nations to work on issues of common interest" },
        { term: "Climate Change", definition: "Long-term shifts in global temperatures and weather patterns" },
        { term: "Digital Citizenship", definition: "Responsible and ethical use of technology and digital platforms" }
      ]
    }
  ],
  crossCurricular: [
    { subject: "Language Arts", connection: "Portfolio writing, research skills, persuasive writing, debate, oral presentations" },
    { subject: "Mathematics", connection: "Data analysis, statistical interpretation, budget calculations, economic graphs" },
    { subject: "Science", connection: "Environmental challenges, climate change, natural hazards, sustainability" },
    { subject: "Visual Arts", connection: "Poster creation, cultural expressions, infographics, creative displays" },
    { subject: "Information Technology", connection: "E-portfolios, digital research, Google Maps, multimedia presentations" }
  ],
  culturalElements: [
    "Analysis of St. Kitts and Nevis Constitution and national symbols",
    "Study of Caribbean immigration patterns and cultural contributions",
    "Examination of local environmental challenges and solutions",
    "Investigation of traditional practices and cultural heritage",
    "Connection to regional organizations (CARICOM, OECS)",
    "Local examples of civic participation and community development"
  ]
};

const iconComponents = {
  History, TreePine, Landmark, Coins, Globe
};

// Collapsible Section Component
const CollapsibleSection = ({ title, icon: Icon, children, defaultOpen = false, accentColor }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="skn-ss2-collapsible">
      <button 
        className="skn-ss2-collapsible-header"
        onClick={() => setIsOpen(!isOpen)}
        style={{ '--accent': accentColor }}
      >
        <div className="skn-ss2-collapsible-title">
          {Icon && <Icon size={18} style={{ color: accentColor }} />}
          <span>{title}</span>
        </div>
        <ChevronDown 
          size={18} 
          className={`skn-ss2-chevron ${isOpen ? 'skn-ss2-chevron-open' : ''}`}
        />
      </button>
      <div className={`skn-ss2-collapsible-content ${isOpen ? 'skn-ss2-collapsible-open' : ''}`}>
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
    <div className="skn-ss2-expectation-card">
      <h4 className="skn-ss2-expectation-title">{expectation.title}</h4>
      <p className="skn-ss2-expectation-guideline">{expectation.guideline}</p>
      
      <div className="skn-ss2-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`skn-ss2-tab ${activeTab === tab.id ? 'skn-ss2-tab-active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            style={{ '--accent': strandColor }}
          >
            <tab.icon size={14} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
      
      <ul className="skn-ss2-content-list">
        {tabs.find(t => t.id === activeTab)?.data.map((item, idx) => (
          <li key={idx} className="skn-ss2-content-item">
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
  <div className="skn-ss2-knowledge-grid">
    {items.map((item, idx) => (
      <div key={idx} className="skn-ss2-knowledge-item">
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
      <div className="skn-ss2-strand-content">
        <p className="skn-ss2-strand-description">{strand.description}</p>
        
        <div className="skn-ss2-expectations-grid">
          {strand.expectations.map(expectation => (
            <ExpectationCard key={expectation.id} expectation={expectation} strandColor={strand.color} />
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
export default function SKNSocialScienceCurriculumForm2() {
  return (
    <div className="skn-ss2-container">
      {/* Header */}
      <header className="skn-ss2-header">
        <div className="skn-ss2-header-badge">
          <span className="skn-ss2-flag-stripe skn-ss2-flag-green"></span>
          <span className="skn-ss2-flag-stripe skn-ss2-flag-yellow"></span>
          <span className="skn-ss2-flag-stripe skn-ss2-flag-black"></span>
        </div>
        <p className="skn-ss2-header-institution">{curriculumData.institution}</p>
        
        <h1 className="skn-ss2-main-title">
          <GraduationCap size={32} />
          <span>Social Science Curriculum</span>
        </h1>
        
        <div className="skn-ss2-header-meta">
          <span className="skn-ss2-badge">
            <FileText size={14} />
            {curriculumData.title}
          </span>
          <span className="skn-ss2-badge skn-ss2-badge-highlight">
            <BookOpen size={14} />
            {curriculumData.grade}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="skn-ss2-main">
        {/* Vision & Purpose */}
        <section className="skn-ss2-intro-section">
          <div className="skn-ss2-intro-card skn-ss2-vision">
            <div className="skn-ss2-intro-header">
              <Target size={20} />
              <h2>Educational Vision</h2>
            </div>
            <p>{curriculumData.vision}</p>
          </div>
          
          <div className="skn-ss2-intro-card skn-ss2-purpose">
            <div className="skn-ss2-intro-header">
              <Lightbulb size={20} />
              <h2>Purpose of Social Studies</h2>
            </div>
            <p>{curriculumData.purpose}</p>
          </div>
        </section>

        {/* Competencies */}
        <section className="skn-ss2-competencies-section">
          <h2 className="skn-ss2-section-title">
            <Sparkles size={20} />
            Essential Educational Competencies
          </h2>
          <div className="skn-ss2-competencies-grid">
            {curriculumData.competencies.map((comp, idx) => (
              <div key={idx} className="skn-ss2-competency-item">
                <CheckCircle2 size={16} />
                <span>{comp}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Curriculum Strands */}
        <section className="skn-ss2-strands-section">
          <h2 className="skn-ss2-section-title">
            <BookOpen size={20} />
            Curriculum Strands
          </h2>
          
          <div className="skn-ss2-strands-list">
            {curriculumData.strands.map(strand => (
              <StrandSection key={strand.id} strand={strand} />
            ))}
          </div>
        </section>

        {/* Cross-Curricular & Cultural */}
        <section className="skn-ss2-connections-section">
          <div className="skn-ss2-connections-grid">
            <div className="skn-ss2-connection-card">
              <h3>
                <Users size={18} />
                Cross-Curricular Connections
              </h3>
              <div className="skn-ss2-connection-list">
                {curriculumData.crossCurricular.map((item, idx) => (
                  <div key={idx} className="skn-ss2-connection-item">
                    <strong>{item.subject}</strong>
                    <p>{item.connection}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="skn-ss2-connection-card">
              <h3>
                <Globe size={18} />
                Local Culture & Context
              </h3>
              <ul className="skn-ss2-culture-list">
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
      <footer className="skn-ss2-footer">
        <div className="skn-ss2-footer-divider">
          <span className="skn-ss2-flag-stripe skn-ss2-flag-green"></span>
          <span className="skn-ss2-flag-stripe skn-ss2-flag-yellow"></span>
          <span className="skn-ss2-flag-stripe skn-ss2-flag-black"></span>
        </div>
        <p className="skn-ss2-footer-text">
          Curriculum Development Unit • Teacher Resource Center
        </p>
        <p className="skn-ss2-footer-subtext">
          Enhanced Curriculum aligned with OECS Learning Standards and NCSS C3 Framework
        </p>
      </footer>
    </div>
  );
}
