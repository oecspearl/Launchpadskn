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
  Calculator,
  Scale,
  Hash,
  Shapes,
  BarChart3,
  Ruler,
  Globe
} from 'lucide-react';
import './SKNMathsCurriculumForm2.css';

const curriculumData = {
  title: "Mathematics Enhanced Curriculum",
  grade: "Form Two (2)",
  institution: "Ministry of Education - St. Kitts and Nevis",
  vision: "Educated persons from St. Kitts and Nevis will reach their full potential academically, physically, socially, culturally, emotionally, and morally; applying these skills to think critically and creatively, live respectfully, communicate effectively, and contribute responsibly to sustainable national development.",
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
      description: "Students will recognize, represent, and compare quantitative information and develop quantitative reasoning including additive and multiplicative thinking to make meaningful connections and solve problems.",
      topics: [
        {
          id: "integers",
          title: "Operations on Integers",
          outcomes: [
            "Perform the four basic operations on integers",
            "Apply rules for adding, subtracting, multiplying and dividing integers",
            "Use number lines to represent integer operations",
            "Solve real-world problems involving integers"
          ],
          assessments: [
            "Card game 'Dry de Well' for integer operations",
            "Card game of WAR for addition/subtraction/multiplication",
            "Number line dice activities",
            "Integer operation competitions"
          ],
          strategies: [
            "Cooperative learning: group work",
            "Coloured dice activities (positive/negative)",
            "Number line explorations",
            "Pattern recognition for rules"
          ]
        },
        {
          id: "decimals-sf",
          title: "Decimals & Standard Form",
          outcomes: [
            "Express a value to a given number of decimal places (up to 3 d.p.)",
            "Write a natural number in Scientific Notation (Standard Form)",
            "Convert between standard form and ordinary numbers",
            "Apply order of operations to rational numbers"
          ],
          assessments: [
            "Decimal place value exercises",
            "Standard form conversion practice",
            "Order of operations worksheets",
            "Real-world application problems"
          ],
          strategies: [
            "Inquiry-based learning for discovery",
            "Think, pair, share activities",
            "Differentiated worksheets by ability",
            "Technology-enhanced practice"
          ]
        },
        {
          id: "number-bases",
          title: "Number Bases (Binary)",
          outcomes: [
            "State the place value of a digit in base 2",
            "Convert a numeral given in base 2 to base 10",
            "Convert a numeral given in base 10 to base 2",
            "Solve problems involving concepts in number theory"
          ],
          assessments: [
            "Base conversion exercises",
            "Binary to decimal games",
            "Place value identification tasks",
            "Problem-solving challenges"
          ],
          strategies: [
            "Division method for conversions",
            "Repeated subtraction technique",
            "Place value chart approach",
            "Cooperative learning activities"
          ]
        },
        {
          id: "laws-properties",
          title: "Laws and Properties of Numbers",
          outcomes: [
            "Apply concepts of closure, identity elements and inverse operators",
            "Demonstrate understanding of commutative and associative properties",
            "Use properties to simplify calculations",
            "Identify when properties apply to different number sets"
          ],
          assessments: [
            "Property identification exercises",
            "True/false property statements",
            "Application in calculations",
            "Property matching activities"
          ],
          strategies: [
            "Direct instruction with examples",
            "Discovery learning activities",
            "Real-world applications",
            "Peer teaching sessions"
          ]
        }
      ],
      knowledge: [
        { term: "Integer", definition: "Whole numbers and their negatives (...-3, -2, -1, 0, 1, 2, 3...)" },
        { term: "Standard Form", definition: "A number written as a × 10ⁿ where 1 ≤ a < 10 and n is an integer" },
        { term: "Binary (Base 2)", definition: "A number system using only digits 0 and 1" },
        { term: "Place Value", definition: "The value of a digit based on its position in a number" },
        { term: "Closure Property", definition: "A set is closed under an operation if the result is always in the set" },
        { term: "Identity Element", definition: "A number that leaves other numbers unchanged (0 for addition, 1 for multiplication)" },
        { term: "Inverse", definition: "A number that combines with another to give the identity element" }
      ],
      quote: "Mathematics is not about numbers, equations, computations, or algorithms: it is about understanding."
    },
    {
      id: "ratio",
      title: "Ratio and Proportions",
      icon: "Scale",
      color: "#7c3aed",
      description: "Students will analyse proportional relationships and use them to solve real-world and mathematical problems.",
      topics: [
        {
          id: "ratio-division",
          title: "Ratio and Division",
          outcomes: [
            "Divide a quantity in a given ratio",
            "Express ratios in simplest form",
            "Compare quantities using ratios",
            "Solve problems involving sharing in a ratio"
          ],
          assessments: [
            "Ratio grouping with coloured cubes",
            "Classroom measurement and scaling activity",
            "Word problems on ratio division",
            "Real-world ratio applications"
          ],
          strategies: [
            "Real-world examples (recipes, mixing)",
            "Problem-solving techniques",
            "Cooperative learning and group work",
            "Visual representations"
          ]
        },
        {
          id: "direct-proportion",
          title: "Direct Proportion",
          outcomes: [
            "Solve problems involving ratio and direct proportion",
            "Recognize when quantities are directly proportional",
            "Set up and solve proportion equations",
            "Apply proportional reasoning to real situations"
          ],
          assessments: [
            "Proportion problem sets",
            "Scale drawing projects",
            "Concrete mixing ratio problems",
            "Comparison shopping activities"
          ],
          strategies: [
            "Cross-multiplication technique",
            "Unitary method approach",
            "Scale drawing activities",
            "Think pair share discussions"
          ]
        }
      ],
      knowledge: [
        { term: "Ratio", definition: "A comparison of two quantities expressed as a fraction (e.g., 3:2)" },
        { term: "Direct Proportion", definition: "When two quantities increase or decrease by the same ratio" },
        { term: "Scale", definition: "The ratio between measurements on a drawing and the actual measurements" },
        { term: "Equivalent Ratios", definition: "Ratios that represent the same comparison when simplified" }
      ],
      quote: "The essence of mathematics is not to make simple things complicated, but to make complicated things simple."
    },
    {
      id: "algebra",
      title: "Algebra",
      icon: "Hash",
      color: "#d97706",
      description: "Students will develop an understanding of the role of symbols and algebraic techniques in solving problems in Mathematics and demonstrate the ability to reason with abstract entities.",
      topics: [
        {
          id: "expressions",
          title: "Algebraic Expressions",
          outcomes: [
            "Translate between algebraic expressions and verbal/worded expressions",
            "Simplify algebraic expressions using the four basic operations with grouping",
            "Expand brackets including fractions and exponents",
            "Simplify algebraic terms including exponents no greater than 3"
          ],
          assessments: [
            "Matching verbal to algebraic expressions",
            "'Who wants to be a hundredaire?' game",
            "Expression simplification challenges",
            "Bracket expansion exercises"
          ],
          strategies: [
            "Scaffolding and peer tutoring",
            "Direct instruction with modelling",
            "Problem-solving techniques",
            "Step-by-step guided practice"
          ]
        },
        {
          id: "equations",
          title: "Linear Equations",
          outcomes: [
            "Solve multi-step linear equations in one variable",
            "Apply the distributive law when solving equations",
            "Model algebraic equations from word problems",
            "Verify solutions to equations"
          ],
          assessments: [
            "Equation solving competitions",
            "Word problem translations",
            "Multi-step equation practice",
            "Solution verification activities"
          ],
          strategies: [
            "Balance method demonstration",
            "Inverse operations practice",
            "Word-to-equation translations",
            "Collaborative problem-solving"
          ]
        },
        {
          id: "inequalities",
          title: "Inequalities",
          outcomes: [
            "Solve linear inequalities with variables on one side (positive coefficient)",
            "Graph the solution of an inequality on a number line with integers",
            "Interpret inequality solutions in context",
            "Write inequalities from word problems"
          ],
          assessments: [
            "Inequality solving exercises",
            "Number line graphing activities",
            "Real-world inequality problems",
            "Solution set identification"
          ],
          strategies: [
            "Number line visualization",
            "Comparison with equation solving",
            "Real-world context problems",
            "Interactive graphing activities"
          ]
        },
        {
          id: "transposition",
          title: "Transposition of Formulae",
          outcomes: [
            "Transpose a mathematical formula without roots and powers",
            "Change the subject of a formula involving no more than two steps",
            "Apply transposition to solve real-world problems",
            "Verify transposed formulae"
          ],
          assessments: [
            "Formula rearrangement practice",
            "Subject change exercises",
            "Science formula applications",
            "Verification activities"
          ],
          strategies: [
            "Step-by-step demonstrations",
            "Cross-curricular applications",
            "Pattern recognition",
            "Peer teaching"
          ]
        },
        {
          id: "sets",
          title: "Sets",
          outcomes: [
            "State the number of subsets of a given set using the formula 2ⁿ",
            "Determine elements in intersections and unions of not more than three sets",
            "Find the complement of a set",
            "Use Venn diagrams to represent relationships between sets"
          ],
          assessments: [
            "Subset counting exercises",
            "Three-set Venn diagram problems",
            "Set operation practice",
            "Real-world classification tasks"
          ],
          strategies: [
            "Venn diagram construction",
            "Sorting and classifying activities",
            "Interactive set operations",
            "Real-world set applications"
          ]
        }
      ],
      knowledge: [
        { term: "Variable", definition: "A symbol (usually a letter) representing an unknown quantity" },
        { term: "Linear Equation", definition: "An equation where the highest power of the variable is 1" },
        { term: "Inequality", definition: "A mathematical statement using <, >, ≤, or ≥" },
        { term: "Transposition", definition: "Rearranging a formula to make a different variable the subject" },
        { term: "Distributive Law", definition: "a(b + c) = ab + ac" },
        { term: "Subset", definition: "A set whose elements are all contained in another set" },
        { term: "Complement", definition: "Elements in the universal set but not in the given set" }
      ],
      quote: "Algebra is the intellectual instrument for rendering clear the quantitative aspects of the world."
    },
    {
      id: "geometry",
      title: "Geometry",
      icon: "Shapes",
      color: "#059669",
      description: "Students will demonstrate the ability to use geometrical concepts to model and solve real-world problems, including properties of transformation and trigonometry.",
      topics: [
        {
          id: "angles-polygons",
          title: "Angles in Polygons",
          outcomes: [
            "Calculate the size of an exterior angle given the size of the interior angle",
            "Apply the sum of interior angles formula for polygons",
            "Calculate individual angles in regular polygons",
            "Solve problems involving polygon angles"
          ],
          assessments: [
            "'I Have, Who Has' angle game",
            "Polygon angle calculations",
            "Interior/exterior angle relationships",
            "Real-world angle applications"
          ],
          strategies: [
            "Inquiry-based instruction",
            "Pattern discovery activities",
            "Direct instruction with examples",
            "Problem-solving techniques"
          ]
        },
        {
          id: "parallel-lines",
          title: "Parallel Lines & Transversals",
          outcomes: [
            "Calculate the size of angles formed by parallel lines and a transversal",
            "Identify vertically opposite, alternate, corresponding, and co-interior angles",
            "Apply angle relationships to solve problems",
            "Construct parallel lines using appropriate instruments"
          ],
          assessments: [
            "'Dance, Dance, Transversal' activity",
            "Angle identification exercises",
            "Problem-solving with angle relationships",
            "Construction accuracy assessments"
          ],
          strategies: [
            "Kinesthetic learning (body movements)",
            "Visual angle identification",
            "Construction practice",
            "Cooperative learning"
          ]
        },
        {
          id: "constructions",
          title: "Geometric Constructions",
          outcomes: [
            "Construct triangles accurately given three sides (SSS)",
            "Construct triangles given two sides and included angle (SAS: 30°, 60°, 90°, 120°)",
            "Construct triangles given two angles and one side (ASA)",
            "Construct perpendicular lines by bisecting a given line"
          ],
          assessments: [
            "Triangle construction projects",
            "Accuracy measurement assessments",
            "Step-by-step construction checks",
            "Peer evaluation of constructions"
          ],
          strategies: [
            "Demonstration and modelling",
            "Step-by-step guided practice",
            "Compass and protractor skills",
            "Construction verification methods"
          ]
        },
        {
          id: "transformations",
          title: "Transformations",
          outcomes: [
            "Represent translations in the plane using a given vector",
            "Determine and represent the image of an object under translation",
            "Reflect an object (point, line segment, triangle) in the x and y axes",
            "State the relationship between an object and its image"
          ],
          assessments: [
            "Translation vector exercises",
            "Reflection coordinate practice",
            "Transformation identification",
            "'Transmographer' interactive activities"
          ],
          strategies: [
            "Physical simulations using body movement",
            "Coordinate grid activities",
            "Interactive software exploration",
            "Pattern recognition"
          ]
        }
      ],
      knowledge: [
        { term: "Interior Angle", definition: "An angle formed inside a polygon by two adjacent sides" },
        { term: "Exterior Angle", definition: "An angle formed between a side and an extension of an adjacent side" },
        { term: "Transversal", definition: "A line that intersects two or more lines at different points" },
        { term: "Alternate Angles", definition: "Angles on opposite sides of a transversal between parallel lines (equal)" },
        { term: "Corresponding Angles", definition: "Angles in the same position at each intersection (equal when lines are parallel)" },
        { term: "Co-interior Angles", definition: "Angles on the same side of a transversal between parallel lines (sum to 180°)" },
        { term: "Translation", definition: "A transformation that moves every point the same distance in the same direction" },
        { term: "Reflection", definition: "A transformation that flips a figure over a line of reflection" }
      ],
      quote: "Geometry is the archetype of the beauty of the world."
    },
    {
      id: "data",
      title: "Data Analysis",
      icon: "BarChart3",
      color: "#db2777",
      description: "Students will demonstrate the ability to use concepts in statistics and probability to describe, model and solve real-world problems, and understand the levels of measurement that inform the collection of data.",
      topics: [
        {
          id: "statistical-diagrams",
          title: "Statistical Diagrams",
          outcomes: [
            "Construct frequency tables for ungrouped data",
            "Construct pie charts from given data",
            "Calculate sector angles for pie charts",
            "Choose appropriate diagrams for different data types"
          ],
          assessments: [
            "Pie chart construction activities",
            "Frequency table creation",
            "Data collection projects",
            "Diagram interpretation exercises"
          ],
          strategies: [
            "Real-world data collection",
            "Student investigations (shoe sizes, favourites)",
            "Direct instruction for pie charts",
            "Excel/technology integration"
          ]
        },
        {
          id: "statistics",
          title: "Measures of Central Tendency",
          outcomes: [
            "Interpret frequency tables and pie charts",
            "Determine the mean from a frequency table",
            "Determine the mode from a frequency table",
            "Determine the median from a frequency table"
          ],
          assessments: [
            "Math Average Card Game",
            "Statistical calculations from tables",
            "Data interpretation questions",
            "Comparative data analysis"
          ],
          strategies: [
            "Card game activities for practice",
            "Real-world data analysis",
            "Step-by-step calculation methods",
            "Cooperative learning groups"
          ]
        }
      ],
      knowledge: [
        { term: "Frequency Table", definition: "A table showing how often each value occurs in a data set" },
        { term: "Pie Chart", definition: "A circular graph divided into sectors representing proportions" },
        { term: "Sector Angle", definition: "The angle at the centre of a pie chart (total 360°)" },
        { term: "Mean", definition: "The sum of all values divided by the number of values" },
        { term: "Mode", definition: "The value that occurs most frequently in a data set" },
        { term: "Median", definition: "The middle value when data is arranged in order" },
        { term: "Ungrouped Data", definition: "Data that has not been organized into groups or classes" }
      ],
      quote: "Data is the new oil. It's valuable, but if unrefined it cannot really be used."
    },
    {
      id: "measurement",
      title: "Measurement",
      icon: "Ruler",
      color: "#4f46e5",
      description: "Students will demonstrate the ability to use concepts in measurement to model and solve real-world problems and develop computational and estimation competencies.",
      topics: [
        {
          id: "si-units",
          title: "SI Unit Conversions",
          outcomes: [
            "Convert SI units of area (mm² ↔ cm², cm² ↔ m², m² ↔ km²)",
            "Convert SI units of volume (mm³ ↔ cm³)",
            "Convert SI units of capacity (l ↔ cm³)",
            "Use the appropriate SI unit for area, volume, capacity, mass, temperature, and time"
          ],
          assessments: [
            "Conversion table creation",
            "Measurement exercises",
            "Unit selection activities",
            "Real-world application problems"
          ],
          strategies: [
            "Cooperative learning for measurements",
            "Direct and inquiry-based instruction",
            "Hands-on measuring activities",
            "Conversion pattern recognition"
          ]
        },
        {
          id: "perimeter-area",
          title: "Perimeter and Area",
          outcomes: [
            "Calculate the perimeter of trapeziums and compound plane shapes",
            "Derive the formula for circumference and area of a circle",
            "Calculate the circumference of a circle using the formula",
            "Calculate the area of a circle using the formula"
          ],
          assessments: [
            "Compound shape calculations",
            "Circle measurement activities",
            "Deriving Pi investigation",
            "Real-world area problems"
          ],
          strategies: [
            "Guided discovery for Pi derivation",
            "Sector arrangement for area formula",
            "Cylindrical object measurements",
            "Problem-solving applications"
          ]
        },
        {
          id: "volume",
          title: "Volume and Capacity",
          outcomes: [
            "Describe the properties of solids",
            "Calculate the volume of cylinders, cones, and pyramids",
            "Show the relationship between volume and capacity",
            "Solve problems involving volume and capacity"
          ],
          assessments: [
            "Building towers with base-10 cubes",
            "Volume calculation exercises",
            "Capacity measurement experiments",
            "Problem-solving challenges"
          ],
          strategies: [
            "Investigation with physical objects",
            "Formula derivation activities",
            "Water displacement experiments",
            "Cross-curricular science connections"
          ]
        },
        {
          id: "consumer-arithmetic",
          title: "Consumer Arithmetic",
          outcomes: [
            "Solve problems involving marked price and cost price",
            "Calculate percentage profit",
            "Calculate percentage loss",
            "Apply percentage change in real-world contexts"
          ],
          assessments: [
            "Profit/loss calculation exercises",
            "Shopping scenario problems",
            "Business simulation activities",
            "Percentage change applications"
          ],
          strategies: [
            "Real-world shopping scenarios",
            "Business simulation activities",
            "Step-by-step problem solving",
            "Entrepreneurship connections"
          ]
        }
      ],
      knowledge: [
        { term: "SI Units", definition: "International System of Units - standardized units of measurement" },
        { term: "Perimeter", definition: "The total distance around the boundary of a shape" },
        { term: "Circumference", definition: "The perimeter of a circle: C = 2πr or C = πd" },
        { term: "Area of Circle", definition: "The space inside a circle: A = πr²" },
        { term: "Volume", definition: "The amount of 3D space occupied by an object" },
        { term: "Capacity", definition: "The amount a container can hold (measured in litres)" },
        { term: "Cost Price", definition: "The amount paid to purchase goods" },
        { term: "Selling Price", definition: "The amount at which goods are sold" },
        { term: "Profit", definition: "Gain when selling price > cost price" },
        { term: "Loss", definition: "Deficit when selling price < cost price" },
        { term: "Percentage Profit", definition: "(Profit ÷ Cost Price) × 100%" }
      ],
      quote: "Measurement is the first step that leads to control and eventually to improvement."
    }
  ],
  crossCurricular: [
    { subject: "Science", connection: "SI units, measurement, data collection and analysis, volume experiments" },
    { subject: "Social Studies", connection: "Statistical data interpretation, pie charts for population data" },
    { subject: "Business Studies", connection: "Consumer arithmetic, profit and loss, percentages" },
    { subject: "Information Technology", connection: "Binary numbers, spreadsheet data analysis" },
    { subject: "Technical Drawing", connection: "Geometric constructions, transformations, scale drawings" }
  ],
  culturalElements: [
    "Using local construction examples for ratio problems",
    "Analyzing Caribbean trade data with statistics",
    "Calculating areas of local landmarks and buildings",
    "Exploring patterns in Caribbean art through geometry",
    "Consumer arithmetic with local currency and prices",
    "Environmental data from St. Kitts and Nevis"
  ]
};

const iconComponents = {
  Calculator, Scale, Hash, Shapes, BarChart3, Ruler
};

// Collapsible Section Component
const CollapsibleSection = ({ title, icon: Icon, children, defaultOpen = false, accentColor }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="skn-f2-collapsible">
      <button 
        className="skn-f2-collapsible-header"
        onClick={() => setIsOpen(!isOpen)}
        style={{ '--accent': accentColor }}
      >
        <div className="skn-f2-collapsible-title">
          {Icon && <Icon size={18} style={{ color: accentColor }} />}
          <span>{title}</span>
        </div>
        <ChevronDown 
          size={18} 
          className={`skn-f2-chevron ${isOpen ? 'skn-f2-chevron-open' : ''}`}
        />
      </button>
      <div className={`skn-f2-collapsible-content ${isOpen ? 'skn-f2-collapsible-open' : ''}`}>
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
    <div className="skn-f2-topic-card">
      <h4 className="skn-f2-topic-title">{topic.title}</h4>
      
      <div className="skn-f2-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`skn-f2-tab ${activeTab === tab.id ? 'skn-f2-tab-active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            style={{ '--accent': strandColor }}
          >
            <tab.icon size={14} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
      
      <ul className="skn-f2-content-list">
        {tabs.find(t => t.id === activeTab)?.data.map((item, idx) => (
          <li key={idx} className="skn-f2-content-item">
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
  <div className="skn-f2-knowledge-grid">
    {items.map((item, idx) => (
      <div key={idx} className="skn-f2-knowledge-item">
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
      <div className="skn-f2-strand-content">
        <p className="skn-f2-strand-description">{strand.description}</p>
        
        {strand.quote && (
          <blockquote className="skn-f2-quote">
            "{strand.quote}"
          </blockquote>
        )}
        
        <div className="skn-f2-topics-grid">
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
export default function SKNMathsCurriculumForm2() {
  return (
    <div className="skn-f2-container">
      {/* Header */}
      <header className="skn-f2-header">
        <div className="skn-f2-header-badge">
          <span className="skn-f2-flag-stripe skn-f2-flag-green"></span>
          <span className="skn-f2-flag-stripe skn-f2-flag-yellow"></span>
          <span className="skn-f2-flag-stripe skn-f2-flag-black"></span>
        </div>
        <p className="skn-f2-header-institution">{curriculumData.institution}</p>
        
        <h1 className="skn-f2-main-title">
          <GraduationCap size={32} />
          <span>Mathematics Curriculum</span>
        </h1>
        
        <div className="skn-f2-header-meta">
          <span className="skn-f2-badge">
            <FileText size={14} />
            {curriculumData.title}
          </span>
          <span className="skn-f2-badge skn-f2-badge-highlight">
            <BookOpen size={14} />
            {curriculumData.grade}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="skn-f2-main">
        {/* Vision & Purpose */}
        <section className="skn-f2-intro-section">
          <div className="skn-f2-intro-card skn-f2-vision">
            <div className="skn-f2-intro-header">
              <Target size={20} />
              <h2>Educational Vision</h2>
            </div>
            <p>{curriculumData.vision}</p>
          </div>
          
          <div className="skn-f2-intro-card skn-f2-purpose">
            <div className="skn-f2-intro-header">
              <Lightbulb size={20} />
              <h2>Purpose of Mathematics</h2>
            </div>
            <p>{curriculumData.purpose}</p>
          </div>
        </section>

        {/* Competencies */}
        <section className="skn-f2-competencies-section">
          <h2 className="skn-f2-section-title">
            <Sparkles size={20} />
            Essential Educational Competencies
          </h2>
          <div className="skn-f2-competencies-grid">
            {curriculumData.competencies.map((comp, idx) => (
              <div key={idx} className="skn-f2-competency-item">
                <CheckCircle2 size={16} />
                <span>{comp}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Curriculum Strands */}
        <section className="skn-f2-strands-section">
          <h2 className="skn-f2-section-title">
            <BookOpen size={20} />
            Curriculum Strands
          </h2>
          
          <div className="skn-f2-strands-list">
            {curriculumData.strands.map(strand => (
              <StrandSection key={strand.id} strand={strand} />
            ))}
          </div>
        </section>

        {/* Cross-Curricular & Cultural */}
        <section className="skn-f2-connections-section">
          <div className="skn-f2-connections-grid">
            <div className="skn-f2-connection-card">
              <h3>
                <Users size={18} />
                Cross-Curricular Connections
              </h3>
              <div className="skn-f2-connection-list">
                {curriculumData.crossCurricular.map((item, idx) => (
                  <div key={idx} className="skn-f2-connection-item">
                    <strong>{item.subject}</strong>
                    <p>{item.connection}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="skn-f2-connection-card">
              <h3>
                <Globe size={18} />
                Local Culture & Environment
              </h3>
              <ul className="skn-f2-culture-list">
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
      <footer className="skn-f2-footer">
        <div className="skn-f2-footer-divider">
          <span className="skn-f2-flag-stripe skn-f2-flag-green"></span>
          <span className="skn-f2-flag-stripe skn-f2-flag-yellow"></span>
          <span className="skn-f2-flag-stripe skn-f2-flag-black"></span>
        </div>
        <p className="skn-f2-footer-text">
          Curriculum Development Unit • Teacher Resource Center
        </p>
        <p className="skn-f2-footer-subtext">
          Enhanced Curriculum aligned with OECS Learning Standards and NCTM Principles
        </p>
      </footer>
    </div>
  );
}
