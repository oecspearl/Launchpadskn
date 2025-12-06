import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, BookOpen, Target, Lightbulb, Users, Calculator, Compass, BarChart3, Shapes, Scale, Percent, Hash, Globe, Sparkles, CheckCircle2, PlayCircle } from 'lucide-react';

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
      color: "#0EA5E9",
      gradient: "from-sky-500 to-cyan-400",
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
      color: "#8B5CF6",
      gradient: "from-violet-500 to-purple-400",
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
      color: "#10B981",
      gradient: "from-emerald-500 to-teal-400",
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
      color: "#F59E0B",
      gradient: "from-amber-500 to-orange-400",
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
      color: "#EC4899",
      gradient: "from-pink-500 to-rose-400",
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
      quote: "Data is the new currency, and it's the medium of exchange between consumers and marketers. – Lisa Utzschneider"
    },
    {
      id: "geometry",
      title: "Geometry",
      icon: "Shapes",
      color: "#6366F1",
      gradient: "from-indigo-500 to-blue-400",
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
  Calculator, Compass, BarChart3, Shapes, Scale, Percent, Hash
};

export default function SKNCurriculum() {
  const [activeStrand, setActiveStrand] = useState(null);
  const [activeTopic, setActiveTopic] = useState(null);
  const [activeTab, setActiveTab] = useState('outcomes');
  const [showVision, setShowVision] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => setShowVision(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const IconComponent = ({ name, className }) => {
    const Icon = iconComponents[name];
    return Icon ? <Icon className={className} /> : null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white font-sans">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-amber-500/5 rounded-full blur-2xl"></div>
        {/* Caribbean-inspired pattern overlay */}
        <svg className="absolute inset-0 w-full h-full opacity-5" viewBox="0 0 100 100" preserveAspectRatio="none">
          <pattern id="waves" patternUnits="userSpaceOnUse" width="20" height="20">
            <path d="M0 10 Q5 5, 10 10 T20 10" stroke="white" fill="none" strokeWidth="0.5"/>
          </pattern>
          <rect width="100" height="100" fill="url(#waves)"/>
        </svg>
      </div>

      {/* Header Section */}
      <header className={`relative z-10 pt-8 pb-16 px-6 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
        <div className="max-w-6xl mx-auto">
          {/* National Banner */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="h-1 w-16 bg-gradient-to-r from-green-500 via-yellow-400 to-green-500 rounded-full"></div>
            <span className="text-sm tracking-widest text-slate-400 uppercase">Federation of St. Kitts and Nevis</span>
            <div className="h-1 w-16 bg-gradient-to-r from-green-500 via-yellow-400 to-green-500 rounded-full"></div>
          </div>

          {/* Main Title */}
          <div className="text-center space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-sky-400 bg-clip-text text-transparent">
                Mathematics
              </span>
            </h1>
            <p className="text-2xl text-slate-300 font-light">{curriculumData.title}</p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300">{curriculumData.grade}</span>
            </div>
            <p className="text-sm text-slate-500">{curriculumData.institution}</p>
          </div>
        </div>
      </header>

      {/* Vision & Purpose Section */}
      <section className={`relative z-10 px-6 pb-12 transition-all duration-1000 delay-300 ${showVision ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-500/20 rounded-xl shrink-0">
                <Target className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-emerald-400 mb-3">Educational Vision</h2>
                <p className="text-slate-300 leading-relaxed">{curriculumData.vision}</p>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-sky-500/20 rounded-xl shrink-0">
                  <Lightbulb className="w-6 h-6 text-sky-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-sky-400 mb-3">Purpose of Mathematics</h2>
                  <p className="text-slate-300 leading-relaxed">{curriculumData.purpose}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Competencies Grid */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-center text-slate-300 mb-6">Essential Educational Competencies</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {curriculumData.competencies.map((comp, idx) => (
                <div 
                  key={idx}
                  className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 hover:border-emerald-500/30 transition-all duration-300 hover:bg-white/10"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-sm text-slate-300">{comp}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Strands Navigation */}
      <section className="relative z-10 px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">
            <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              Curriculum Strands
            </span>
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {curriculumData.strands.map((strand) => (
              <button
                key={strand.id}
                onClick={() => {
                  setActiveStrand(activeStrand === strand.id ? null : strand.id);
                  setActiveTopic(null);
                }}
                className={`group relative p-6 rounded-2xl border transition-all duration-500 hover:scale-105 ${
                  activeStrand === strand.id 
                    ? `bg-gradient-to-br ${strand.gradient} border-transparent shadow-lg shadow-${strand.color}/20` 
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <div className={`flex flex-col items-center gap-3 ${activeStrand === strand.id ? 'text-white' : 'text-slate-300'}`}>
                  <IconComponent 
                    name={strand.icon} 
                    className={`w-8 h-8 transition-transform duration-300 group-hover:scale-110 ${
                      activeStrand === strand.id ? 'text-white' : ''
                    }`} 
                    style={{ color: activeStrand !== strand.id ? strand.color : undefined }}
                  />
                  <span className="text-sm font-medium text-center leading-tight">{strand.title}</span>
                </div>
                {activeStrand === strand.id && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white/20"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Active Strand Content */}
      {activeStrand && (
        <section className="relative z-10 px-6 pb-16 animate-fade-in">
          <div className="max-w-6xl mx-auto">
            {curriculumData.strands.filter(s => s.id === activeStrand).map(strand => (
              <div key={strand.id} className="space-y-8">
                {/* Strand Header */}
                <div className={`bg-gradient-to-r ${strand.gradient} rounded-2xl p-8 shadow-xl`}>
                  <div className="flex items-start gap-6">
                    <div className="p-4 bg-white/20 rounded-xl backdrop-blur-sm">
                      <IconComponent name={strand.icon} className="w-10 h-10 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-3xl font-bold text-white mb-3">{strand.title}</h3>
                      <p className="text-white/90 text-lg">{strand.description}</p>
                      {strand.quote && (
                        <blockquote className="mt-4 text-white/70 italic border-l-2 border-white/30 pl-4">
                          "{strand.quote}"
                        </blockquote>
                      )}
                    </div>
                  </div>
                </div>

                {/* Topics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {strand.topics.map((topic, idx) => (
                    <button
                      key={topic.id}
                      onClick={() => setActiveTopic(activeTopic === topic.id ? null : topic.id)}
                      className={`group p-6 rounded-xl text-left transition-all duration-300 ${
                        activeTopic === topic.id 
                          ? 'bg-white/15 border-2 border-white/30 shadow-lg' 
                          : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20'
                      }`}
                      style={{ animationDelay: `${idx * 100}ms` }}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-slate-200">{topic.title}</h4>
                        <div className={`transition-transform duration-300 ${activeTopic === topic.id ? 'rotate-90' : ''}`}>
                          <ChevronRight className="w-5 h-5 text-slate-400" />
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-slate-400">
                        {topic.outcomes.length} Learning Outcomes
                      </p>
                    </button>
                  ))}
                </div>

                {/* Active Topic Details */}
                {activeTopic && strand.topics.filter(t => t.id === activeTopic).map(topic => (
                  <div key={topic.id} className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
                    {/* Topic Header */}
                    <div className="p-6 border-b border-white/10">
                      <h4 className="text-2xl font-bold text-white">{topic.title}</h4>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex border-b border-white/10">
                      {[
                        { id: 'outcomes', label: 'Learning Outcomes', icon: Target },
                        { id: 'assessments', label: 'Assessments', icon: CheckCircle2 },
                        { id: 'strategies', label: 'Strategies', icon: Lightbulb }
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex-1 flex items-center justify-center gap-2 py-4 transition-all duration-300 ${
                            activeTab === tab.id 
                              ? `bg-gradient-to-r ${strand.gradient} text-white` 
                              : 'text-slate-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <tab.icon className="w-4 h-4" />
                          <span className="text-sm font-medium hidden md:inline">{tab.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                      {activeTab === 'outcomes' && (
                        <ul className="space-y-3">
                          {topic.outcomes.map((outcome, idx) => (
                            <li key={idx} className="flex items-start gap-3 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                              <div className="p-1.5 bg-emerald-500/20 rounded-lg shrink-0 mt-0.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              </div>
                              <span className="text-slate-300">{outcome}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {activeTab === 'assessments' && (
                        <ul className="space-y-3">
                          {topic.assessments.map((assessment, idx) => (
                            <li key={idx} className="flex items-start gap-3 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                              <div className="p-1.5 bg-sky-500/20 rounded-lg shrink-0 mt-0.5">
                                <PlayCircle className="w-4 h-4 text-sky-400" />
                              </div>
                              <span className="text-slate-300">{assessment}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {activeTab === 'strategies' && (
                        <ul className="space-y-3">
                          {topic.strategies.map((strategy, idx) => (
                            <li key={idx} className="flex items-start gap-3 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                              <div className="p-1.5 bg-amber-500/20 rounded-lg shrink-0 mt-0.5">
                                <Sparkles className="w-4 h-4 text-amber-400" />
                              </div>
                              <span className="text-slate-300">{strategy}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}

                {/* Knowledge Section */}
                {strand.knowledge && strand.knowledge.length > 0 && (
                  <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-violet-500/20 rounded-lg">
                        <BookOpen className="w-5 h-5 text-violet-400" />
                      </div>
                      <h4 className="text-xl font-semibold text-white">Key Concepts & Definitions</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {strand.knowledge.map((item, idx) => (
                        <div 
                          key={idx} 
                          className="p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors border border-white/5"
                        >
                          <h5 className="font-semibold text-emerald-400 mb-2">{item.term}</h5>
                          <p className="text-sm text-slate-400">{item.definition}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Cross-Curricular & Cultural Integration */}
      <section className="relative z-10 px-6 py-16 bg-gradient-to-b from-transparent via-white/5 to-transparent">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Cross-Curricular Connections */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-500/20 rounded-lg">
                  <Users className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Cross-Curricular Connections</h3>
              </div>
              <div className="space-y-4">
                {curriculumData.crossCurricular.map((item, idx) => (
                  <div key={idx} className="p-4 bg-white/5 rounded-xl">
                    <h4 className="font-semibold text-indigo-400 mb-2">{item.subject}</h4>
                    <p className="text-sm text-slate-400">{item.connection}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Cultural Integration */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-rose-500/20 rounded-lg">
                  <Globe className="w-5 h-5 text-rose-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Local Culture & Environment</h3>
              </div>
              <div className="space-y-3">
                {curriculumData.culturalElements.map((element, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                    <div className="p-1 bg-rose-500/20 rounded-lg shrink-0 mt-0.5">
                      <Sparkles className="w-3 h-3 text-rose-400" />
                    </div>
                    <p className="text-sm text-slate-300">{element}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-12 border-t border-white/10">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-0.5 w-12 bg-gradient-to-r from-green-500 to-yellow-400 rounded-full"></div>
            <span className="text-slate-500 text-sm">Curriculum Development Unit</span>
            <div className="h-0.5 w-12 bg-gradient-to-r from-yellow-400 to-green-500 rounded-full"></div>
          </div>
          <p className="text-slate-600 text-sm">
            Teacher Resource Center • Ministry of Education • St. Kitts and Nevis
          </p>
          <p className="text-slate-700 text-xs mt-4">
            Enhanced Curriculum aligned with OECS Learning Standards and International Best Practices
          </p>
        </div>
      </footer>

      {/* Custom Styles */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600&display=swap');
        
        body {
          font-family: 'Inter', sans-serif;
        }
        
        h1, h2, h3, h4, h5, h6 {
          font-family: 'Space Grotesk', sans-serif;
        }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
        
        /* Scrollbar styling */
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
}

