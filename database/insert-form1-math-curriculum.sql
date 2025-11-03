-- LaunchPad SKN - Insert Form 1 Mathematics Enhanced Curriculum
-- This script inserts structured curriculum data for Form 1 Mathematics
-- 
-- IMPORTANT: Before running this script:
-- 1. Run: database/add-structured-curriculum-support.sql (to add JSONB columns)
-- 2. Find your Form 1 Mathematics offering_id by running:
--    SELECT offering_id, s.subject_name, f.form_name 
--    FROM subject_form_offerings sfo
--    JOIN subjects s ON sfo.subject_id = s.subject_id
--    JOIN forms f ON sfo.form_id = f.form_id
--    WHERE s.subject_name ILIKE '%mathematics%math%' 
--      AND f.form_number = 1;
-- 3. Replace {OFFERING_ID_HERE} below with the actual offering_id

-- ============================================
-- Form 1 Mathematics — Enhanced Curriculum (SKN)
-- Full structure with units + activities
-- ============================================

DO $$
DECLARE
  v_offering_id BIGINT := {OFFERING_ID_HERE};  -- <<< REPLACE THIS with actual offering_id
  v_json JSONB;
  v_found BOOLEAN := false;
BEGIN
  -- Check if offering exists
  SELECT EXISTS(SELECT 1 FROM subject_form_offerings WHERE offering_id = v_offering_id) INTO v_found;
  
  IF NOT v_found THEN
    RAISE EXCEPTION 'Offering ID % does not exist in subject_form_offerings table. Please check the offering_id.', v_offering_id;
  END IF;

  -- Build the JSONB curriculum structure
  v_json := '{
    "frontMatter": {
      "coverPage": {
        "title": "Mathematics — Form One (1)",
        "jurisdiction": "St. Kitts & Nevis",
        "series": "Enhanced Curriculum Guide",
        "copyright": "© 2023 Ministry of Education, St. Kitts & Nevis"
      },
      "tableOfContents": [
        "Topic 1: Number and Operations",
        "Topic 2: Ratio and Proportions",
        "Topic 3: Measurement",
        "Topic 4: Algebra",
        "Topic 5: Data",
        "Topic 6: Geometry"
      ],
      "introduction": "This curriculum aligns Essential Educational Competencies with structured topics, Specific Curriculum Outcomes (SCOs), inclusive learning and assessment strategies, and culturally relevant examples. It emphasizes backward design, Universal Design for Learning, and technology integration."
    },
    "topics": [
      {
        "topicNumber": 1,
        "title": "Number and Operations",
        "overview": {
          "strandIdentification": "Number & Operations",
          "essentialLearningOutcomes": [
            "Recognize, represent, compare and compute with whole numbers, decimals, fractions, percentages and integers to solve routine and non-routine problems."
          ],
          "gradeLevelGuidelines": [
            "Comparing/ordering, rounding; place value (to 9 digits).",
            "Properties and order of operations (divisibility rules, HCF/LCM; BODMAS/PEMDAS).",
            "Decimals to thousandths: operations and problem solving.",
            "Fractions: operations and applications.",
            "Percentages: conversions and applications.",
            "Integers: compare/order; addition/subtraction with number lines."
          ]
        },
        "instructionalUnits": [
          {
            "unitNumber": 1,
            "scoNumber": "N1.1",
            "specificCurriculumOutcomes": "Place value to 999,999,999; compare, order, and round whole numbers.",
            "inclusiveAssessmentStrategies": "Quick checks, exit tickets, mini-whiteboards.",
            "inclusiveLearningStrategies": "Number-line reasoning; card/dice comparisons.",
            "activities": [
              {
                "title": "Place-Value Relay",
                "description": "Teams convert numerals ↔ word/expanded form; relay with checkpoints."
              }
            ]
          },
          {
            "unitNumber": 2,
            "scoNumber": "N1.2",
            "specificCurriculumOutcomes": "Apply divisibility tests; find HCF/LCM; use properties (commutative, associative, distributive); evaluate with order of operations.",
            "inclusiveAssessmentStrategies": "Error analysis; jigsaw; think-pair-share.",
            "inclusiveLearningStrategies": "Direct instruction for PEMDAS/BODMAS, then guided practice.",
            "activities": [
              {
                "title": "Order-of-Operations Clinics",
                "description": "Short teacher demo → group triads solve mixed expressions with reflections."
              },
              {
                "title": "Divisibility Sort",
                "description": "Card sort of integers by applicable rules, with justifications."
              }
            ]
          },
          {
            "unitNumber": 3,
            "scoNumber": "N1.3",
            "specificCurriculumOutcomes": "Decimals: place value, rounding, ordering; four operations; problem solving.",
            "inclusiveAssessmentStrategies": "Flipped checks; targeted conferencing.",
            "inclusiveLearningStrategies": "Student modelling; guided discovery.",
            "activities": [
              {
                "title": "Flipped Lesson: Rounding & Place Value",
                "description": "Students preview short content at home; in class they solve teacher-curated sets with feedback loops."
              },
              {
                "title": "Peer Modelling",
                "description": "Proficient students demonstrate rounding strategies; peers practice then reflect."
              }
            ]
          },
          {
            "unitNumber": 4,
            "scoNumber": "N1.4",
            "specificCurriculumOutcomes": "Add, subtract, multiply and divide fractions; compare/order; word problems.",
            "inclusiveAssessmentStrategies": "Commit-and-toss probes; games.",
            "inclusiveLearningStrategies": "Concrete → pictorial → abstract; differentiated products.",
            "activities": [
              {
                "title": "Fractions ''Tug of War''",
                "description": "Two-player accuracy game practicing fraction↔percentage equivalences and operations."
              }
            ]
          },
          {
            "unitNumber": 5,
            "scoNumber": "N1.5",
            "specificCurriculumOutcomes": "Convert fraction–decimal–percent; find percent of quantities; compare by percent; applications.",
            "inclusiveAssessmentStrategies": "Scenario-based tasks (shopping, discounts).",
            "inclusiveLearningStrategies": "Interactive quizzes/simulations.",
            "activities": [
              {
                "title": "Discounts & Tax Mini-Market",
                "description": "Simulated purchases requiring discount and sales-tax calculations; students justify methods."
              }
            ]
          },
          {
            "unitNumber": 6,
            "scoNumber": "N1.Int",
            "specificCurriculumOutcomes": "Integers: compare/order; add/subtract using number lines.",
            "inclusiveAssessmentStrategies": "Observation with rubrics; quick response cards.",
            "inclusiveLearningStrategies": "Cooperative groups; manipulatives; technology-aided practice.",
            "activities": [
              {
                "title": "Integer Maze",
                "description": "Solve successive integer sums/differences to navigate a maze path."
              },
              {
                "title": "Integer Card Game",
                "description": "Use red = negative / black = positive; form combinations to match a target total."
              },
              {
                "title": "Life-Size Number Line",
                "description": "Kinesthetic walk-through for integer operations and comparisons."
              },
              {
                "title": "Number-Climb (Online)",
                "description": "Self-paced ordering task with immediate feedback."
              }
            ]
          }
        ],
        "usefulContentKnowledge": "Factors/multiples; order of operations; number-line models; equivalences among fractions/decimals/percentages.",
        "closingFramework": {
          "essentialEducationCompetencies": [
            "Critical thinking and problem solving",
            "Communication of mathematical reasoning",
            "Numeracy for real-world decision-making"
          ],
          "crossCurricularConnections": {
            "socialStudies": "",
            "science": "",
            "english": ""
          },
          "localCultureIntegration": "Use SKN pricing, population, and sport statistics.",
          "technologyIntegration": "Short videos, interactive games, digital practice.",
          "itemsOfInspiration": []
        },
        "resources": {
          "webLinks": [],
          "videos": [],
          "games": [],
          "worksheets": []
        }
      },
      {
        "topicNumber": 2,
        "title": "Ratio and Proportions",
        "overview": {
          "strandIdentification": "Ratio & Proportional Reasoning",
          "essentialLearningOutcomes": [
            "Analyze and represent ratios/rates; solve proportions; apply proportional reasoning in real contexts."
          ],
          "gradeLevelGuidelines": [
            "Concepts of ratio and writing equivalent/simplified forms.",
            "Rates and unit rates; comparisons and ''best buy''.",
            "Direct proportion; time–distance–speed applications."
          ]
        },
        "instructionalUnits": [
          {
            "unitNumber": 1,
            "scoNumber": "R1.Ratio",
            "specificCurriculumOutcomes": "Define and represent ratios; simplify; divide quantities in a ratio.",
            "inclusiveAssessmentStrategies": "Card sorts; short constructed responses.",
            "inclusiveLearningStrategies": "Recipe/mixture simulations; strategy share.",
            "activities": [
              {
                "title": "Ratio Recipe Scale-Up",
                "description": "Convert family-size recipes to class-size using whole-number ratios."
              }
            ]
          },
          {
            "unitNumber": 2,
            "scoNumber": "R1.Rate",
            "specificCurriculumOutcomes": "Write rates as fractions; compute unit rates; compare options to determine better buy.",
            "inclusiveAssessmentStrategies": "Leveled problem sets; clued corrections.",
            "inclusiveLearningStrategies": "Guided discovery for unit rate; inquiry with everyday ads.",
            "activities": [
              {
                "title": "Store-Shelf Investigation",
                "description": "Compare two package sizes/prices to determine unit price/better buy."
              },
              {
                "title": "Concept Cartoon: Rate",
                "description": "Students critique different ''per minute'' claims and justify the correct unit rate."
              }
            ]
          },
          {
            "unitNumber": 3,
            "scoNumber": "R1.Prop",
            "specificCurriculumOutcomes": "Solve proportions; represent and reason with proportional relationships.",
            "inclusiveAssessmentStrategies": "Mini-whiteboard checks; application problems.",
            "inclusiveLearningStrategies": "Cooperative problem solving; cross-multiplication routines.",
            "activities": [
              {
                "title": "Water-Cooler / Pump Rates",
                "description": "Translate word contexts to proportions; compute missing values and interpret units."
              }
            ]
          }
        ],
        "usefulContentKnowledge": "",
        "closingFramework": {
          "essentialEducationCompetencies": [],
          "crossCurricularConnections": {
            "socialStudies": "",
            "science": "",
            "english": ""
          },
          "localCultureIntegration": "",
          "technologyIntegration": "",
          "itemsOfInspiration": []
        },
        "resources": {
          "webLinks": [],
          "videos": [],
          "games": [],
          "worksheets": []
        }
      },
      {
        "topicNumber": 3,
        "title": "Measurement",
        "overview": {
          "strandIdentification": "Measurement",
          "essentialLearningOutcomes": [
            "Use metric units, conversions, and formulas (perimeter, area, volume) and time/speed relations to model real-world situations."
          ],
          "gradeLevelGuidelines": [
            "Metric prefixes; length measurement & instruments.",
            "Perimeter and area (including parallelogram, trapezium; composite figures).",
            "Mass & capacity; volume of right solids (A_base × h).",
            "Time conversions; distance–speed–time.",
            "Consumer arithmetic (profit/loss, discount, sales tax)."
          ]
        },
        "instructionalUnits": [
          {
            "unitNumber": 1,
            "scoNumber": "M1.1",
            "specificCurriculumOutcomes": "Differentiate SI/customary units; convert length; choose instruments.",
            "inclusiveAssessmentStrategies": "Scavenger checks; practical stations.",
            "inclusiveLearningStrategies": "Guided discovery; measurement labs.",
            "activities": [
              {
                "title": "Object–Unit–Instrument Log",
                "description": "Students record object, appropriate unit, and instrument in a class table."
              }
            ]
          },
          {
            "unitNumber": 2,
            "scoNumber": "M1.2",
            "specificCurriculumOutcomes": "Perimeter & area: triangles, rectangles, parallelograms, trapezia; composite shapes.",
            "inclusiveAssessmentStrategies": "Geoboard rubrics; grid-to-formula transitions.",
            "inclusiveLearningStrategies": "Student-led modelling; think-pair-share.",
            "activities": [
              {
                "title": "Geoboard Shapes",
                "description": "Create polygons and compute P & A; justify with decompositions."
              }
            ]
          },
          {
            "unitNumber": 3,
            "scoNumber": "M1.3",
            "specificCurriculumOutcomes": "Mass/capacity conversions; volume of right solids.",
            "inclusiveAssessmentStrategies": "Create-a-problem; quick checks.",
            "inclusiveLearningStrategies": "Hands-on with scales and jugs.",
            "activities": [
              {
                "title": "Capacity Stations",
                "description": "Estimate then measure volumes; compare estimates and actuals."
              }
            ]
          },
          {
            "unitNumber": 4,
            "scoNumber": "M1.4",
            "specificCurriculumOutcomes": "Convert time; apply speed = distance ÷ time.",
            "inclusiveAssessmentStrategies": "Guided discovery with multiple solution paths.",
            "inclusiveLearningStrategies": "Small-group tasks; anchor charts.",
            "activities": [
              {
                "title": "Travel Planner",
                "description": "Compute travel times or speeds given two variables; reflect on units."
              }
            ]
          },
          {
            "unitNumber": 5,
            "scoNumber": "M1.5",
            "specificCurriculumOutcomes": "Consumer arithmetic: profit/loss, discount, sales tax.",
            "inclusiveAssessmentStrategies": "Scenario scoring guides.",
            "inclusiveLearningStrategies": "Simulations; video mini-lessons.",
            "activities": [
              {
                "title": "Mini-Market (SKN context)",
                "description": "Price lists with discount/tax; students compare receipts and justify decisions."
              }
            ]
          }
        ],
        "usefulContentKnowledge": "",
        "closingFramework": {
          "essentialEducationCompetencies": [],
          "crossCurricularConnections": {
            "socialStudies": "",
            "science": "",
            "english": ""
          },
          "localCultureIntegration": "",
          "technologyIntegration": "",
          "itemsOfInspiration": []
        },
        "resources": {
          "webLinks": [],
          "videos": [],
          "games": [],
          "worksheets": []
        }
      },
      {
        "topicNumber": 4,
        "title": "Algebra",
        "overview": {
          "strandIdentification": "Algebra",
          "essentialLearningOutcomes": [
            "Understand symbolic representations; manipulate expressions; solve simple linear equations; classify sets."
          ],
          "gradeLevelGuidelines": [
            "Algebra: terms (variables, coefficients, constants), translating verbal ↔ algebraic.",
            "Simplify expressions (use distributive law).",
            "Substitute values; simple factorization; solve 1-step linear equations.",
            "Model simple statements as equations.",
            "Sets: notation, membership, subsets; Venn representations (intro)."
          ]
        },
        "instructionalUnits": [
          {
            "unitNumber": 1,
            "scoNumber": "A1.1–A1.2",
            "specificCurriculumOutcomes": "Define algebraic terms; translate expressions; simplify (incl. distributive law).",
            "inclusiveAssessmentStrategies": "Worked-example fade; exit tickets.",
            "inclusiveLearningStrategies": "Paired practice; sentence frames.",
            "activities": [
              {
                "title": "From Words to Symbols",
                "description": "Convert SKN context statements (mangoes, fares) to expressions and simplify."
              }
            ]
          },
          {
            "unitNumber": 2,
            "scoNumber": "A1.3–A1.5",
            "specificCurriculumOutcomes": "Substitute; simple factorization; solve 1-step linear equations; model word statements.",
            "inclusiveAssessmentStrategies": "Mini-boards; error analysis.",
            "inclusiveLearningStrategies": "Concrete-representational-abstract.",
            "activities": [
              {
                "title": "Equation Match-Ups",
                "description": "Match scenarios to equations; solve and interpret solutions in context."
              }
            ]
          },
          {
            "unitNumber": 3,
            "scoNumber": "A1.Sets",
            "specificCurriculumOutcomes": "Identify/represent sets and subsets; basic set language and simple operations (intro).",
            "inclusiveAssessmentStrategies": "Venn sorting tasks; quick checks.",
            "inclusiveLearningStrategies": "Manipulative sorting; gallery walk.",
            "activities": [
              {
                "title": "Venn-It!",
                "description": "Classify items into overlapping categories and discuss intersections."
              }
            ]
          }
        ],
        "usefulContentKnowledge": "",
        "closingFramework": {
          "essentialEducationCompetencies": [],
          "crossCurricularConnections": {
            "socialStudies": "",
            "science": "",
            "english": ""
          },
          "localCultureIntegration": "",
          "technologyIntegration": "",
          "itemsOfInspiration": []
        },
        "resources": {
          "webLinks": [],
          "videos": [],
          "games": [],
          "worksheets": []
        }
      },
      {
        "topicNumber": 5,
        "title": "Data",
        "overview": {
          "strandIdentification": "Data",
          "essentialLearningOutcomes": [
            "Collect, organize, represent, and interpret data using appropriate graphs and measures in familiar contexts."
          ],
          "gradeLevelGuidelines": [
            "Class surveys; frequency tables.",
            "Bar/line/pictographs; reading and drawing graphs.",
            "Mean/median/mode of small datasets; context interpretation."
          ]
        },
        "instructionalUnits": [
          {
            "unitNumber": 1,
            "scoNumber": "D1.1",
            "specificCurriculumOutcomes": "Plan and conduct a simple survey; construct frequency tables.",
            "inclusiveAssessmentStrategies": "Checklists; short reflections.",
            "inclusiveLearningStrategies": "Collaborative data collection.",
            "activities": [
              {
                "title": "Class Poll",
                "description": "Students design a short questionnaire and tabulate results."
              }
            ]
          },
          {
            "unitNumber": 2,
            "scoNumber": "D1.2",
            "specificCurriculumOutcomes": "Represent data with bar/line/pictographs; interpret trends.",
            "inclusiveAssessmentStrategies": "Annotated graphs; quick orals.",
            "inclusiveLearningStrategies": "Tech-assisted plotting.",
            "activities": [
              {
                "title": "Graph-a-Day",
                "description": "Create and critique a class graph from real or teacher-provided data."
              }
            ]
          },
          {
            "unitNumber": 3,
            "scoNumber": "D1.3",
            "specificCurriculumOutcomes": "Compute mean/median/mode; interpret in context and discuss limitations.",
            "inclusiveAssessmentStrategies": "Short constructed responses.",
            "inclusiveLearningStrategies": "Small-group computation with role rotation.",
            "activities": [
              {
                "title": "Stats in Sports",
                "description": "Use a small SKN sports dataset to compute and compare measures of center."
              }
            ]
          }
        ],
        "usefulContentKnowledge": "",
        "closingFramework": {
          "essentialEducationCompetencies": [],
          "crossCurricularConnections": {
            "socialStudies": "",
            "science": "",
            "english": ""
          },
          "localCultureIntegration": "",
          "technologyIntegration": "",
          "itemsOfInspiration": []
        },
        "resources": {
          "webLinks": [],
          "videos": [],
          "games": [],
          "worksheets": []
        }
      },
      {
        "topicNumber": 6,
        "title": "Geometry",
        "overview": {
          "strandIdentification": "Geometry",
          "essentialLearningOutcomes": [
            "Identify and describe lines/angles/shapes; relate 2D nets to 3D solids; use basic angle facts."
          ],
          "gradeLevelGuidelines": [
            "Lines and angles (basic types, angle sum on a line, at a point).",
            "Plane figures and 3D solids; nets and properties.",
            "Intro to angle relationships (complementary/supplementary); simple right-triangle ratio awareness."
          ]
        },
        "instructionalUnits": [
          {
            "unitNumber": 1,
            "scoNumber": "G1.Lines",
            "specificCurriculumOutcomes": "Identify parallel, perpendicular, intersecting lines; recognize angle types.",
            "inclusiveAssessmentStrategies": "Matching tasks; quick sketches.",
            "inclusiveLearningStrategies": "Manipulative straws/strings; walk-the-lines.",
            "activities": [
              {
                "title": "Line Hunt",
                "description": "Photograph classroom examples of line types; annotate findings."
              }
            ]
          },
          {
            "unitNumber": 2,
            "scoNumber": "G1.Shapes",
            "specificCurriculumOutcomes": "Describe properties of common 2D shapes and 3D solids; match nets to solids.",
            "inclusiveAssessmentStrategies": "Property checklists; gallery walk.",
            "inclusiveLearningStrategies": "Net folding; model-building.",
            "activities": [
              {
                "title": "Net-to-Solid Build",
                "description": "Assemble nets into solids and record properties (faces/edges/vertices)."
              }
            ]
          },
          {
            "unitNumber": 3,
            "scoNumber": "G1.Angles",
            "specificCurriculumOutcomes": "Use angle facts (straight angle, at a point) to find unknown angles; complementary/supplementary.",
            "inclusiveAssessmentStrategies": "Short tasks with reasoning lines.",
            "inclusiveLearningStrategies": "Worked examples → practice; protractors.",
            "activities": [
              {
                "title": "Angle-Chase Stations",
                "description": "Rotations through problems requiring angle sums and simple relationships."
              }
            ]
          }
        ],
        "usefulContentKnowledge": "",
        "closingFramework": {
          "essentialEducationCompetencies": [],
          "crossCurricularConnections": {
            "socialStudies": "",
            "science": "",
            "english": ""
          },
          "localCultureIntegration": "",
          "technologyIntegration": "",
          "itemsOfInspiration": []
        },
        "resources": {
          "webLinks": [],
          "videos": [],
          "games": [],
          "worksheets": []
        }
      }
    ]
  }'::jsonb;

  -- Update the existing offering
  UPDATE subject_form_offerings
  SET curriculum_structure = v_json,
      curriculum_version = 'Form 1 Mathematics — Enhanced Curriculum v2 (SKN, 2023)',
      curriculum_updated_at = NOW(),
      updated_at = NOW()
  WHERE offering_id = v_offering_id;

  -- Verify the update
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Failed to update offering_id %. The offering may not exist.', v_offering_id;
  END IF;

  RAISE NOTICE 'Successfully updated Form 1 Mathematics curriculum for offering_id: %', v_offering_id;
  RAISE NOTICE 'Curriculum version: Form 1 Mathematics — Enhanced Curriculum v2 (SKN, 2023)';
  RAISE NOTICE 'Number of topics: %', jsonb_array_length(v_json->'topics');

END $$;

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Run this after the script to verify the data was inserted:

-- SELECT 
--   offering_id,
--   curriculum_version,
--   curriculum_updated_at,
--   (curriculum_structure->'frontMatter'->>'introduction') AS intro_preview,
--   jsonb_array_length(curriculum_structure->'topics') AS topic_count,
--   jsonb_array_elements(curriculum_structure->'topics')->>'title' AS topics
-- FROM subject_form_offerings
-- WHERE offering_id = {OFFERING_ID_HERE};  -- Replace with your offering_id

