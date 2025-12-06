import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  BookOpen, 
  Target, 
  Lightbulb, 
  Users, 
  Calculator, 
  Compass, 
  BarChart3, 
  Shapes, 
  Scale, 
  Hash, 
  Globe, 
  CheckCircle2, 
  PlayCircle,
  GraduationCap,
  FileText,
  Sparkles
} from 'lucide-react';
import './SKNCurriculum.css';

const curriculumData = {
  title: "Mathematics Enhanced Curriculum",
  grade: "Form One (1)",
  institution: "Ministry of Education - St. Kitts and Nevis",
  vision: "Educated persons from St. Kitts and Nevis will reach their full potential academically, physically, socially, culturally, emotionally, and morally; applying these skills to think critically and creatively as they lead healthy and productive lives as engaged citizens.",
  purpose: "Mathematics is an activity that is critical for the development of individuals and societies. It is the study of the properties of numbers and its relationship to measurement, space, shape, statistics, and probability. The study of mathematics enables individuals to become creative and critical thinkers through the development of logical thinking, problem-solving, investigative, organizational, and argumentative skills.",
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
      id: "numbers",
      title: "Numbers and Operations",
      icon: "Calculator",
      color: "#0891b2",
      description: "Students will recognize, represent, and compare quantitative information using additive and multiplicative thinking.",
      topics: [
        {
          id: "whole-numbers",
          title: "Whole Numbers",
          outcomes: [
            "State the place value and value of each digit in a numeral up to 999,999,999",
            "Write numbers up to 999,999,999 in ascending or descending order",
            "Round numbers to the nearest tens, hundreds, thousands and up to millions"
          ],
          assessments: [
            "Place value game 'Who Wants to be a Hundredaire'",
            "Spin, expand, compare activity",
            "Rounding off bingo"
          ],
          strategies: [
            "Guided discovery using number lines for rounding",
            "Cooperative learning: Jigsaw method",
            "Think, Pair and Share activities"
          ]
        },
        {
          id: "number-types",
          title: "Number Types & Properties",
          outcomes: [
            "Distinguish among sets: natural, whole, integers, rational, and real numbers",
            "State divisibility rules for single digit numbers (2-10)",
            "Differentiate among types: odd, even, prime, composite, square, rectangular, triangular",
            "List factors and multiples of given whole numbers",
            "Find LCM and HCF of no more than 3 whole numbers",
            "Apply properties: Commutative, Distributive, Identity, and Closure",
            "Apply BODMAS/PEMDAS on whole numbers",
            "Evaluate squares and square roots"
          ],
          assessments: [
            "Card sort to distinguish number sets",
            "Divisibility dice game",
            "Properties matching activity"
          ],
          strategies: [
            "Differentiated instruction based on diagnostic assessment",
            "Direct instruction for BODMAS/PEMDAS",
            "Interactive videos for squares and square roots"
          ]
        },
        {
          id: "decimals",
          title: "Decimal Numbers",
          outcomes: [
            "State the place value and value of each digit up to tens of thousandth",
            "Round decimal numbers up to the nearest thousandth",
            "Order decimal numbers in ascending or descending order",
            "Multiply decimals by decimals up to thousandths",
            "Divide decimals by decimals up to hundredths",
            "Solve worded problems involving decimal numbers"
          ],
          assessments: [
            "Decimal ordering challenges",
            "Real-world problem solving tasks",
            "Calculation competitions"
          ],
          strategies: [
            "Visual models using place value charts",
            "Peer tutoring activities",
            "Technology-enhanced practice"
          ]
        },
        {
          id: "fractions",
          title: "Fractions",
          outcomes: [
            "Order a set of fractions in ascending or descending order",
            "Add and subtract all types of fractions using different strategies",
            "Multiply and divide all types of fractions using different strategies",
            "Solve worded problems involving all types of fractions"
          ],
          assessments: [
            "Fraction card matching games",
            "Word problem portfolios",
            "Peer assessment activities"
          ],
          strategies: [
            "Manipulatives: fraction tiles and circles",
            "Visual models and diagrams",
            "Real-world applications"
          ]
        },
        {
          id: "percentages",
          title: "Percentages",
          outcomes: [
            "Express percentages as a fraction with denominator of 100",
            "Convert percentages to fractions and decimals and vice versa",
            "Express one quantity as a fraction or percentage of another",
            "Calculate the percent of a given quantity",
            "Compare two or more quantities using percentages",
            "Solve worded problems involving percentage"
          ],
          assessments: [
            "Fraction-Decimal-Percent matching cards",
            "Real-world percentage problems",
            "Interactive online games"
          ],
          strategies: [
            "Guided discovery for conversion rules",
            "Shopping and discount scenarios",
            "Visual representations with charts"
          ]
        },
        {
          id: "integers",
          title: "Integers",
          outcomes: [
            "Define the term 'integers'",
            "Compare two integers using <, > signs (between -50 and 50)",
            "Perform operations on integers",
            "Understand positive and negative number relationships"
          ],
          assessments: [
            "Number line activities",
            "Integer comparison games",
            "Temperature and elevation problems"
          ],
          strategies: [
            "Real-world contexts (temperature, debt)",
            "Number line models",
            "Hands-on manipulatives"
          ]
        }
      ],
      knowledge: [
        { term: "Positive Numbers", definition: "Numbers that are more than zero (0)" },
        { term: "Negative Numbers", definition: "Numbers that are less than zero (0)" },
        { term: "Rational Numbers ℚ", definition: "Numbers that can be written as a fraction" },
        { term: "Irrational Numbers", definition: "Numbers that cannot be written as a fraction or terminating/recurring decimal" },
        { term: "Real Numbers ℝ", definition: "Include both rational and irrational numbers" },
        { term: "Prime Numbers", definition: "Numbers divisible only by 1 and itself (e.g., 2, 3, 5, 7, 11)" },
        { term: "Composite Numbers", definition: "Numbers divisible by numbers other than 1 and itself" },
        { term: "Square Numbers", definition: "Numbers arranged in the shape of a square (1, 4, 9, 16, 25...)" },
        { term: "HCF", definition: "Highest Common Factor - the largest common factor of two or more numbers" },
        { term: "LCM", definition: "Lowest Common Multiple - the lowest multiple of two or more numbers" },
        { term: "Closure Property", definition: "A set is closed under an operation if the result is always in the set" },
        { term: "Commutative Property", definition: "Order doesn't affect results: a+b=b+a, ab=ba" },
        { term: "Distributive Property", definition: "a(b+c) = ab + ac" },
        { term: "Additive Identity", definition: "Zero (0) - any number + 0 equals the number" },
        { term: "Multiplicative Identity", definition: "One (1) - any number × 1 equals the number" }
      ],
      quote: "You don't have to be a mathematician to have a feel for numbers. – John Forbes Nash, Jr."
    },
    {
      id: "ratio",
      title: "Ratio and Proportions",
      icon: "Scale",
      color: "#7c3aed",
      description: "Students will understand and apply concepts of ratio, proportion, and rates to solve real-world problems.",
      topics: [
        {
          id: "ratio",
          title: "Ratio",
          outcomes: [
            "Understand the concept of ratio",
            "Express ratios in simplest form",
            "Compare quantities using ratios",
            "Solve problems involving ratios"
          ],
          assessments: [
            "Ratio matching activities",
            "Real-world ratio problems",
            "Group problem-solving tasks"
          ],
          strategies: [
            "Visual ratio representations",
            "Cooking and recipe activities",
            "Hands-on mixing activities"
          ]
        },
        {
          id: "proportion",
          title: "Proportion",
          outcomes: [
            "Understand direct and inverse proportion",
            "Set up and solve proportions",
            "Apply proportional reasoning",
            "Solve real-world proportion problems"
          ],
          assessments: [
            "Proportion problem sets",
            "Scale drawing projects",
            "Map reading activities"
          ],
          strategies: [
            "Cross-multiplication techniques",
            "Scale models and drawings",
            "Real-world applications"
          ]
        },
        {
          id: "rates",
          title: "Rates",
          outcomes: [
            "Understand the concept of rate",
            "Calculate rates (speed, price per unit)",
            "Compare rates",
            "Solve problems involving rates"
          ],
          assessments: [
            "Rate calculation challenges",
            "Shopping comparison activities",
            "Speed and distance problems"
          ],
          strategies: [
            "Unit rate calculations",
            "Consumer math applications",
            "Motion problems"
          ]
        }
      ],
      knowledge: [
        { term: "Ratio", definition: "A comparison of two quantities using division" },
        { term: "Proportion", definition: "An equation stating two ratios are equal" },
        { term: "Rate", definition: "A ratio comparing two quantities with different units" },
        { term: "Unit Rate", definition: "A rate with denominator of 1" }
      ],
      quote: "Mathematics is not about numbers, equations, computations, or algorithms: it is about understanding."
    },
    {
      id: "measurement",
      title: "Measurement",
      icon: "Compass",
      color: "#059669",
      description: "Students will use measurement tools, units, and attributes to describe, compare, and solve authentic applied problems.",
      topics: [
        {
          id: "perimeter-area",
          title: "Perimeter and Area",
          outcomes: [
            "Calculate perimeter of various shapes",
            "Calculate area of rectangles, squares, triangles, circles",
            "Apply formulas to solve real-world problems",
            "Estimate and measure accurately"
          ],
          assessments: [
            "Shape measurement projects",
            "Garden design activities",
            "Floor plan calculations"
          ],
          strategies: [
            "Hands-on measuring activities",
            "Grid paper explorations",
            "Real-world applications"
          ]
        },
        {
          id: "mass-volume",
          title: "Mass, Weight, Volume and Capacity",
          outcomes: [
            "Understand relationships between mass and weight",
            "Calculate volume of solids",
            "Measure and compare capacity",
            "Convert between units"
          ],
          assessments: [
            "Volume displacement experiments",
            "Capacity comparison activities",
            "Conversion practice"
          ],
          strategies: [
            "Science integration experiments",
            "Hands-on measuring tools",
            "Estimation activities"
          ]
        },
        {
          id: "time-distance-speed",
          title: "Time, Distance and Speed",
          outcomes: [
            "Calculate time, distance, and speed",
            "Apply the speed formula",
            "Convert time units",
            "Solve travel problems"
          ],
          assessments: [
            "Journey planning projects",
            "Speed calculation challenges",
            "Map distance activities"
          ],
          strategies: [
            "Real journey calculations",
            "Sports timing activities",
            "Technology-aided tracking"
          ]
        },
        {
          id: "consumer-arithmetic",
          title: "Consumer Arithmetic",
          outcomes: [
            "Calculate profit and loss",
            "Understand discount and markup",
            "Calculate simple interest",
            "Apply percentage to financial problems"
          ],
          assessments: [
            "Shop simulation activities",
            "Budget planning projects",
            "Interest calculation tasks"
          ],
          strategies: [
            "Mock shopping experiences",
            "Real-world financial scenarios",
            "Entrepreneurship projects"
          ]
        }
      ],
      knowledge: [
        { term: "Perimeter", definition: "The total distance around a shape" },
        { term: "Area", definition: "The amount of space inside a 2D shape" },
        { term: "Volume", definition: "The amount of space a 3D object occupies" },
        { term: "Capacity", definition: "The amount a container can hold" },
        { term: "Speed", definition: "Distance traveled per unit of time (Speed = Distance ÷ Time)" }
      ],
      quote: "Measurement is the first step that leads to control and eventually to improvement."
    },
    {
      id: "algebra",
      title: "Algebra",
      icon: "Hash",
      color: "#d97706",
      description: "Students will use structure to represent, analyze, and generalize change or patterns using models and justification.",
      topics: [
        {
          id: "algebraic-expressions",
          title: "Algebraic Expressions",
          outcomes: [
            "Identify variables, constants, and coefficients",
            "Write and evaluate algebraic expressions",
            "Simplify expressions by combining like terms",
            "Translate word problems into algebraic expressions"
          ],
          assessments: [
            "Expression building activities",
            "Simplification challenges",
            "Word-to-algebra translations"
          ],
          strategies: [
            "Algebra tiles manipulatives",
            "Pattern recognition activities",
            "Step-by-step guided practice"
          ]
        },
        {
          id: "equations",
          title: "Algebraic Equations",
          outcomes: [
            "Understand what an equation represents",
            "Solve one-step equations",
            "Solve two-step equations",
            "Verify solutions"
          ],
          assessments: [
            "Equation solving competitions",
            "Balance model activities",
            "Real-world equation problems"
          ],
          strategies: [
            "Balance scale model",
            "Inverse operations practice",
            "Collaborative problem-solving"
          ]
        },
        {
          id: "sets",
          title: "Sets",
          outcomes: [
            "Define and describe sets using set notation",
            "Identify subsets, unions, and intersections",
            "Use Venn diagrams to represent sets",
            "Solve problems using set theory"
          ],
          assessments: [
            "Venn diagram projects",
            "Set notation practice",
            "Classification activities"
          ],
          strategies: [
            "Sorting and classifying objects",
            "Interactive Venn diagrams",
            "Real-world set applications"
          ]
        }
      ],
      knowledge: [
        { term: "Variable", definition: "An unknown quantity represented by a letter" },
        { term: "Constant", definition: "A number standing by itself (integers, fractions)" },
        { term: "Coefficient", definition: "The number in front of the variable (e.g., 3 in 3x)" },
        { term: "Algebraic Term", definition: "A combination of variables and coefficients (e.g., 3x)" },
        { term: "Algebraic Expression", definition: "Algebraic terms linked by + or - signs" },
        { term: "Like Terms", definition: "Expressions with the same variables and powers" },
        { term: "Equation", definition: "Two expressions separated by an equal sign" },
        { term: "Set", definition: "A well-defined collection of distinct objects" }
      ],
      quote: "Algebra is the intellectual instrument which has been created for rendering clear the quantitative aspects of the world."
    },
    {
      id: "data",
      title: "Data Analysis",
      icon: "BarChart3",
      color: "#db2777",
      description: "Students will gather, represent, and interpret data related to authentic applications.",
      topics: [
        {
          id: "data-collection",
          title: "Data Collection & Organization",
          outcomes: [
            "Formulate questions for data collection",
            "Gather and record data systematically",
            "Organize data using tally charts and frequency tables",
            "Identify data categories and variations"
          ],
          assessments: [
            "Survey design projects",
            "Data collection tasks",
            "Frequency table creation"
          ],
          strategies: [
            "Class surveys and polls",
            "Tally chart activities",
            "Data categorization exercises"
          ]
        },
        {
          id: "data-representation",
          title: "Data Representation",
          outcomes: [
            "Create bar graphs, pictographs, and line plots",
            "Use appropriate scales and keys",
            "Represent data with multiple categories",
            "Choose appropriate graph types"
          ],
          assessments: [
            "Graph creation projects",
            "Data visualization challenges",
            "Infographic design"
          ],
          strategies: [
            "Technology-aided graphing",
            "Hand-drawn graph practice",
            "Real data visualization"
          ]
        },
        {
          id: "statistics",
          title: "Basic Statistics",
          outcomes: [
            "Calculate mean, median, and mode",
            "Interpret measures of central tendency",
            "Compare and contrast data sets",
            "Draw conclusions from data"
          ],
          assessments: [
            "Statistics calculation practice",
            "Data analysis reports",
            "Comparative studies"
          ],
          strategies: [
            "Class data analysis",
            "Sports statistics projects",
            "Environmental data studies"
          ]
        }
      ],
      knowledge: [
        { term: "Tally Chart", definition: "A table used to collect data using tally marks" },
        { term: "Frequency", definition: "The number of times a particular data value occurs" },
        { term: "Mean", definition: "The sum of all values divided by the number of values" },
        { term: "Mode", definition: "The value that occurs most frequently" },
        { term: "Median", definition: "The middle value when data is arranged in order" }
      ],
      quote: "Data is the new currency, and it's the medium of exchange between consumers and marketers."
    },
    {
      id: "geometry",
      title: "Geometry",
      icon: "Shapes",
      color: "#4f46e5",
      description: "Students will analyze, describe, and construct geometric shapes and understand spatial relationships.",
      topics: [
        {
          id: "lines-angles",
          title: "Lines and Angles",
          outcomes: [
            "Identify and classify types of lines",
            "Measure and classify angles",
            "Understand parallel and perpendicular lines",
            "Calculate angle relationships"
          ],
          assessments: [
            "Angle measurement activities",
            "Line classification tasks",
            "Geometric construction projects"
          ],
          strategies: [
            "Protractor practice",
            "Angle hunting activities",
            "Construction with tools"
          ]
        },
        {
          id: "plane-shapes",
          title: "Plane Shapes",
          outcomes: [
            "Classify triangles by sides and angles",
            "Identify properties of quadrilaterals",
            "Understand circles and their parts",
            "Construct shapes using appropriate tools"
          ],
          assessments: [
            "Shape classification games",
            "Property identification tasks",
            "Construction challenges"
          ],
          strategies: [
            "Hands-on shape manipulation",
            "Geoboard activities",
            "Digital geometry tools"
          ]
        },
        {
          id: "solid-shapes",
          title: "Solid Shapes",
          outcomes: [
            "Identify and classify 3D shapes",
            "Understand faces, edges, and vertices",
            "Recognize nets of 3D shapes",
            "Calculate surface area and volume"
          ],
          assessments: [
            "3D model construction",
            "Net folding activities",
            "Real-world shape identification"
          ],
          strategies: [
            "Physical 3D models",
            "Net exploration activities",
            "Architecture connections"
          ]
        }
      ],
      knowledge: [
        { term: "Scalene Triangle", definition: "All three sides are of different lengths" },
        { term: "Isosceles Triangle", definition: "Two sides are congruent, one line of symmetry" },
        { term: "Equilateral Triangle", definition: "All three sides congruent, all angles 60°, three lines of symmetry" },
        { term: "Acute-angled Triangle", definition: "All interior angles less than 90° each" },
        { term: "Right-angled Triangle", definition: "One interior angle equals 90°" },
        { term: "Obtuse-angled Triangle", definition: "One interior angle greater than 90°" }
      ],
      quote: "Geometry is the archetype of the beauty of the world."
    }
  ],
  crossCurricular: [
    { subject: "Social Studies", connection: "Graphically illustrate population characteristics, use maps and scales" },
    { subject: "Science", connection: "Use instruments to record properties of matter: Length, Temperature, Mass, Volume" },
    { subject: "English", connection: "Use number as adjectives, write reports using mathematical vocabulary" }
  ],
  culturalElements: [
    "Comparing historical sites in St. Kitts and Nevis with other countries",
    "Examining cooking practices among different ethnic groups",
    "Using local environmental data for graphing and analysis",
    "Pattern recognition in Caribbean art and architecture"
  ]
};

const iconComponents = {
  Calculator, Compass, BarChart3, Shapes, Scale, Hash
};

// Collapsible Section Component
const CollapsibleSection = ({ title, icon: Icon, children, defaultOpen = false, accentColor }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="skn-collapsible">
      <button 
        className="skn-collapsible-header"
        onClick={() => setIsOpen(!isOpen)}
        style={{ '--accent': accentColor }}
      >
        <div className="skn-collapsible-title">
          {Icon && <Icon size={18} style={{ color: accentColor }} />}
          <span>{title}</span>
        </div>
        <ChevronDown 
          size={18} 
          className={`skn-chevron ${isOpen ? 'skn-chevron-open' : ''}`}
        />
      </button>
      <div className={`skn-collapsible-content ${isOpen ? 'skn-collapsible-open' : ''}`}>
        {children}
      </div>
    </div>
  );
};

// Topic Card Component
const TopicCard = ({ topic, strandColor }) => {
  const [activeTab, setActiveTab] = useState('outcomes');
  
  const tabs = [
    { id: 'outcomes', label: 'Learning Outcomes', icon: Target, data: topic.outcomes },
    { id: 'assessments', label: 'Assessments', icon: PlayCircle, data: topic.assessments },
    { id: 'strategies', label: 'Strategies', icon: Lightbulb, data: topic.strategies }
  ];
  
  return (
    <div className="skn-topic-card">
      <h4 className="skn-topic-title">{topic.title}</h4>
      
      <div className="skn-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`skn-tab ${activeTab === tab.id ? 'skn-tab-active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            style={{ '--accent': strandColor }}
          >
            <tab.icon size={14} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
      
      <ul className="skn-content-list">
        {tabs.find(t => t.id === activeTab)?.data.map((item, idx) => (
          <li key={idx} className="skn-content-item">
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
  <div className="skn-knowledge-grid">
    {items.map((item, idx) => (
      <div key={idx} className="skn-knowledge-item">
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
      <div className="skn-strand-content">
        <p className="skn-strand-description">{strand.description}</p>
        
        {strand.quote && (
          <blockquote className="skn-quote">
            "{strand.quote}"
          </blockquote>
        )}
        
        <div className="skn-topics-grid">
          {strand.topics.map(topic => (
            <TopicCard key={topic.id} topic={topic} strandColor={strand.color} />
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
export default function SKNCurriculum() {
  return (
    <div className="skn-container">
      {/* Header */}
      <header className="skn-header">
        <div className="skn-header-badge">
          <span className="skn-flag-stripe skn-flag-green"></span>
          <span className="skn-flag-stripe skn-flag-yellow"></span>
          <span className="skn-flag-stripe skn-flag-black"></span>
        </div>
        <p className="skn-header-institution">{curriculumData.institution}</p>
        
        <h1 className="skn-main-title">
          <GraduationCap size={32} />
          <span>Mathematics Curriculum</span>
        </h1>
        
        <div className="skn-header-meta">
          <span className="skn-badge">
            <FileText size={14} />
            {curriculumData.title}
          </span>
          <span className="skn-badge">
            <BookOpen size={14} />
            {curriculumData.grade}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="skn-main">
        {/* Vision & Purpose */}
        <section className="skn-intro-section">
          <div className="skn-intro-card skn-vision">
            <div className="skn-intro-header">
              <Target size={20} />
              <h2>Educational Vision</h2>
            </div>
            <p>{curriculumData.vision}</p>
          </div>
          
          <div className="skn-intro-card skn-purpose">
            <div className="skn-intro-header">
              <Lightbulb size={20} />
              <h2>Purpose of Mathematics</h2>
            </div>
            <p>{curriculumData.purpose}</p>
          </div>
        </section>

        {/* Competencies */}
        <section className="skn-competencies-section">
          <h2 className="skn-section-title">
            <Sparkles size={20} />
            Essential Educational Competencies
          </h2>
          <div className="skn-competencies-grid">
            {curriculumData.competencies.map((comp, idx) => (
              <div key={idx} className="skn-competency-item">
                <CheckCircle2 size={16} />
                <span>{comp}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Curriculum Strands */}
        <section className="skn-strands-section">
          <h2 className="skn-section-title">
            <BookOpen size={20} />
            Curriculum Strands
          </h2>
          
          <div className="skn-strands-list">
            {curriculumData.strands.map(strand => (
              <StrandSection key={strand.id} strand={strand} />
            ))}
          </div>
        </section>

        {/* Cross-Curricular & Cultural */}
        <section className="skn-connections-section">
          <div className="skn-connections-grid">
            <div className="skn-connection-card">
              <h3>
                <Users size={18} />
                Cross-Curricular Connections
              </h3>
              <div className="skn-connection-list">
                {curriculumData.crossCurricular.map((item, idx) => (
                  <div key={idx} className="skn-connection-item">
                    <strong>{item.subject}</strong>
                    <p>{item.connection}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="skn-connection-card">
              <h3>
                <Globe size={18} />
                Local Culture & Environment
              </h3>
              <ul className="skn-culture-list">
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
      <footer className="skn-footer">
        <div className="skn-footer-divider">
          <span className="skn-flag-stripe skn-flag-green"></span>
          <span className="skn-flag-stripe skn-flag-yellow"></span>
          <span className="skn-flag-stripe skn-flag-black"></span>
        </div>
        <p className="skn-footer-text">
          Curriculum Development Unit • Teacher Resource Center
        </p>
        <p className="skn-footer-subtext">
          Enhanced Curriculum aligned with OECS Learning Standards
        </p>
      </footer>
    </div>
  );
}