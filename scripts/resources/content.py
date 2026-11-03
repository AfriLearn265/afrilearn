# Original practice material written for AfriLearn. Correct option is always listed first
# in the data and shuffled into a fixed, deterministic position when the PDF is built.

JAMB_MATHS = [
    ("Simplify 8<super>2/3</super> × 4<super>−1/2</super>.", ["2", "4", "1/2", "8"], "8<super>2/3</super> = 4 and 4<super>−1/2</super> = 1/2, so 4 × 1/2 = 2."),
    ("Given that log<sub>10</sub> 2 = 0.3010, find log<sub>10</sub> 8.", ["0.9030", "0.6020", "2.4080", "0.0903"], "log 8 = 3 log 2 = 3 × 0.3010 = 0.9030."),
    ("Find the roots of x<super>2</super> − 7x + 12 = 0.", ["x = 3 or x = 4", "x = −3 or x = −4", "x = 2 or x = 6", "x = −2 or x = 6"], "(x − 3)(x − 4) = 0, so x = 3 or x = 4."),
    ("Convert 1011<sub>2</sub> to a base ten number.", ["11", "13", "9", "10"], "1×8 + 0×4 + 1×2 + 1×1 = 11."),
    ("Find the 10th term of the arithmetic progression 3, 7, 11, …", ["39", "43", "40", "36"], "a = 3, d = 4, so T<sub>10</sub> = 3 + 9 × 4 = 39."),
    ("Find the sum of the first four terms of the geometric progression 2, 6, 18, …", ["80", "54", "78", "162"], "2 + 6 + 18 + 54 = 80."),
    ("A bag contains 4 red balls and 6 blue balls. One ball is picked at random. What is the probability that it is red?", ["2/5", "3/5", "2/3", "1/4"], "4 of the 10 balls are red: 4/10 = 2/5."),
    ("Find the mean of 4, 7, 9, 10 and 15.", ["9", "10", "8", "7"], "The sum is 45 and there are 5 numbers, so the mean is 9."),
    ("Find the median of 3, 8, 5, 12, 7 and 10.", ["7.5", "7", "8", "6.5"], "In order: 3, 5, 7, 8, 10, 12. The median is (7 + 8) ÷ 2 = 7.5."),
    ("y varies directly as x, and y = 12 when x = 4. Find y when x = 7.", ["21", "28", "16", "3"], "y = kx gives k = 3, so y = 3 × 7 = 21."),
    ("Find the simple interest on ₦20,000 at 5% per annum for 3 years.", ["₦3,000", "₦1,000", "₦3,150", "₦30,000"], "I = PRT/100 = 20,000 × 5 × 3 ÷ 100 = ₦3,000."),
    ("What is the sum of the interior angles of a hexagon?", ["720°", "540°", "1080°", "360°"], "(n − 2) × 180° = 4 × 180° = 720°."),
    ("Find the area of a circle of radius 7 cm. (Take π = 22/7.)", ["154 cm²", "44 cm²", "22 cm²", "308 cm²"], "πr<super>2</super> = 22/7 × 49 = 154 cm²."),
    ("If sin θ = 3/5 and θ is acute, find cos θ.", ["4/5", "3/4", "5/4", "5/3"], "A 3-4-5 triangle gives an adjacent side of 4, so cos θ = 4/5."),
    ("Find dy/dx if y = 3x<super>2</super> − 5x + 2.", ["6x − 5", "3x − 5", "6x + 2", "6x<super>2</super> − 5"], "Differentiate term by term: 6x − 5."),
    ("n(A) = 12, n(B) = 9 and n(A ∩ B) = 4. Find n(A ∪ B).", ["17", "21", "25", "13"], "12 + 9 − 4 = 17."),
    ("Simplify 2/3 ÷ 4/9.", ["3/2", "8/27", "2/3", "6/7"], "2/3 × 9/4 = 18/12 = 3/2."),
    ("Solve the simultaneous equations 2x + 3y = 12 and x − y = 1. Find x.", ["3", "2", "1", "4"], "x = y + 1, so 5y + 2 = 12, y = 2 and x = 3."),
    ("Find the gradient of the line joining (2, 3) and (6, 11).", ["2", "1/2", "4", "8"], "(11 − 3) ÷ (6 − 2) = 8 ÷ 4 = 2."),
    ("A trader buys an item for ₦4,000 and sells it for ₦5,000. Find the percentage profit.", ["25%", "20%", "10%", "30%"], "Profit is ₦1,000 on a cost of ₦4,000: 1,000 ÷ 4,000 × 100 = 25%."),
]

UOE_PASSAGE = (
    "Every evening, Bisi's grandmother sat on the veranda and told stories about the old market at the centre of "
    "their town. She described traders who arrived before dawn with baskets of yam and pepper, and the noise of "
    "bargaining that rose with the sun. Bisi had never seen that market; a modern shopping centre now stood in its "
    "place. Yet when she walked past its glass doors, she sometimes imagined the smell of roasted corn and the songs "
    "of the women who once sold it. Her grandmother's stories, she realised, had built a second market in her mind, "
    "one that no bulldozer could reach."
)

JAMB_ENGLISH_PASSAGE_QS = [
    ("Where did Bisi's grandmother tell her stories?", ["On the veranda", "At the market", "In the shopping centre", "In the kitchen"], "The first sentence says she sat on the veranda."),
    ("What now stands where the old market used to be?", ["A modern shopping centre", "A school", "A new market", "A bus park"], "The passage says a modern shopping centre now stood in its place."),
    ("The phrase 'one that no bulldozer could reach' suggests that Bisi's memories", ["cannot be destroyed", "are about building", "are frightening", "will soon fade"], "A bulldozer destroyed the real market, but it cannot touch what is in her mind."),
    ("The writer's attitude to the old market is best described as", ["nostalgic", "angry", "indifferent", "critical"], "The writer remembers the market fondly and with longing."),
]

JAMB_ENGLISH = [
    ("Choose the option nearest in meaning to the word in capitals: The principal was ADAMANT about the new rules.", ["firm", "unsure", "angry", "careless"], "Adamant means refusing to change your mind."),
    ("Choose the option opposite in meaning to the word in capitals: Her account of the event was VAGUE.", ["clear", "unclear", "long", "dull"], "Vague means unclear, so the opposite is clear."),
    ("Each of the students ___ a calculator.", ["has", "have", "are having", "were having"], "Each is singular and takes a singular verb."),
    ("Neither the coach nor the players ___ happy with the result.", ["were", "was", "is", "has been"], "With neither…nor, the verb agrees with the nearer subject, players."),
    ("The news ___ shocking.", ["was", "were", "are", "have been"], "News is uncountable and singular."),
    ("She is very good ___ mathematics.", ["at", "in", "on", "with"], "We say good at a subject or skill."),
    ("Choose the option nearest in meaning: The athlete gave a REMARKABLE performance.", ["outstanding", "ordinary", "poor", "average"], "Remarkable means unusually good."),
    ("Choose the option opposite in meaning: The trader was GENEROUS to his customers.", ["stingy", "kind", "polite", "wealthy"], "Generous means giving freely; the opposite is stingy."),
    ("By the time we arrived, the film ___.", ["had started", "has started", "starts", "was start"], "An action finished before another past action takes the past perfect."),
    ("You are coming to the party, ___?", ["aren't you", "isn't it", "are you", "don't you"], "A positive statement with are takes the tag aren't you."),
    ("To let the cat out of the bag means to", ["reveal a secret", "free an animal", "make a mistake", "cause trouble"], "The idiom means telling something that was meant to be secret."),
    ("Choose the option nearest in meaning: The manager's reply was PROMPT.", ["quick", "rude", "late", "careful"], "Prompt means done without delay."),
    ("Choose the option opposite in meaning: The hall was CROWDED.", ["empty", "noisy", "large", "full"], "Crowded means full of people; the opposite is empty."),
    ("Choose the correctly spelt word.", ["accommodation", "accomodation", "acommodation", "accommodasion"], "Accommodation has double c and double m."),
    ("The students, as well as their teacher, ___ present.", ["were", "was", "is", "has been"], "The verb agrees with the main subject, students, not with the phrase after as well as."),
    ("If I ___ you, I would apologise.", ["were", "was", "am", "will be"], "Imagined situations take were in formal English."),
]

WAEC_BIOLOGY = [
    ("Which organelle releases energy from food in a cell?", ["Mitochondrion", "Ribosome", "Nucleus", "Vacuole"], "Aerobic respiration takes place in the mitochondria."),
    ("Which structure is found in plant cells but NOT in animal cells?", ["Cell wall", "Cell membrane", "Cytoplasm", "Nucleus"], "Only plant cells have a cellulose cell wall."),
    ("The green pigment that traps light energy in leaves is", ["chlorophyll", "haemoglobin", "melanin", "keratin"], "Chlorophyll absorbs light for photosynthesis."),
    ("Which gas is given off during photosynthesis?", ["Oxygen", "Carbon dioxide", "Nitrogen", "Hydrogen"], "Plants release oxygen as a by-product."),
    ("During vigorous exercise, anaerobic respiration in human muscle produces", ["lactic acid", "ethanol", "glucose", "oxygen"], "Yeast, not muscle, produces ethanol."),
    ("An organism that makes its own food from simple substances is called a", ["producer", "consumer", "decomposer", "parasite"], "Green plants are producers."),
    ("In the food chain grass → grasshopper → lizard → hawk, the lizard is a", ["secondary consumer", "primary consumer", "producer", "tertiary consumer"], "The lizard eats the primary consumer."),
    ("The basic unit of heredity is the", ["gene", "cell", "ribosome", "enzyme"], "Genes are sections of DNA that carry hereditary information."),
    ("Tallness (T) is dominant over shortness (t). What is the ratio of tall to short offspring from a cross between Tt and Tt?", ["3 : 1", "1 : 1", "1 : 2 : 1", "9 : 3 : 3 : 1"], "TT, Tt, Tt and tt: three tall to one short."),
    ("Which blood vessel carries blood away from the heart?", ["Artery", "Vein", "Capillary", "Venule"], "Arteries carry blood away from the heart."),
    ("The functional unit of the kidney is the", ["nephron", "neuron", "alveolus", "villus"], "Each kidney has about a million nephrons."),
    ("Which enzyme in saliva begins the digestion of starch?", ["Salivary amylase", "Pepsin", "Lipase", "Trypsin"], "Salivary amylase breaks starch into maltose."),
    ("Bats are classified as mammals because they", ["have fur and feed their young with milk", "can fly", "are active at night", "eat insects"], "Fur and milk are features of mammals; flying is not."),
    ("The part of a flower that develops into the fruit is the", ["ovary", "petal", "anther", "sepal"], "After fertilisation the ovary becomes the fruit."),
    ("The vector of the malaria parasite is the", ["female Anopheles mosquito", "housefly", "tsetse fly", "male Culex mosquito"], "Only the female Anopheles mosquito transmits the malaria parasite."),
]

WAEC_ECONOMICS = [
    ("The basic economic problem exists because", ["resources are scarce relative to human wants", "prices are high", "there is unemployment", "governments impose taxes"], "Wants are unlimited but resources are limited."),
    ("Opportunity cost is best described as", ["the next best alternative forgone", "the money paid for a good", "the total cost of production", "the market price of a good"], "It is the value of the option you give up."),
    ("Other things being equal, when the price of a good rises, the quantity demanded", ["falls", "rises", "stays the same", "doubles"], "This is the law of demand."),
    ("The reward for land as a factor of production is", ["rent", "wages", "interest", "profit"], "Land earns rent, labour earns wages, capital earns interest."),
    ("Which factor of production bears the risk of a business?", ["Entrepreneur", "Labour", "Land", "Capital"], "The entrepreneur bears the risk and earns profit."),
    ("A 10% rise in price causes a 20% fall in quantity demanded. The price elasticity of demand is", ["2", "0.5", "20", "10"], "20 ÷ 10 = 2, so demand is elastic."),
    ("Which of these is NOT a function of money?", ["Factor of production", "Medium of exchange", "Store of value", "Unit of account"], "Money is not a factor of production."),
    ("Which institution issues the naira in Nigeria?", ["Central Bank of Nigeria", "Bank of Industry", "Nigerian Exchange", "Federal Ministry of Finance"], "The Central Bank issues currency."),
    ("The movement of people from villages to cities is called", ["rural-urban migration", "emigration", "immigration", "seasonal migration"], "People move from rural to urban areas."),
    ("A market in which there is only one seller is called", ["monopoly", "oligopoly", "perfect competition", "duopoly"], "Mono means one."),
    ("A tax charged on goods brought into a country is", ["import duty", "income tax", "company tax", "poll tax"], "Import duties are charged on imports."),
    ("Gross Domestic Product (GDP) measures", ["the value of final goods and services produced in a country in a year", "the money in circulation", "government revenue", "the value of exports"], "GDP counts final output produced within the country."),
    ("Inflation is best described as", ["a persistent rise in the general price level", "a fall in prices", "an increase in output", "a rise in the price of one good"], "Inflation is a general and continuing rise in prices."),
    ("Division of labour usually leads to", ["more output per worker", "lower quality goods", "higher costs of production", "fewer goods produced"], "Specialisation makes workers more efficient."),
    ("The money a firm receives from selling its output is called", ["total revenue", "total cost", "profit", "wages"], "Revenue is price times quantity sold."),
]

COMMON_ENTRANCE = [
    ("345 + 278 =", ["623", "613", "523", "633"], "345 + 278 = 623."),
    ("1,000 − 457 =", ["543", "553", "643", "457"], "1,000 − 457 = 543."),
    ("24 × 15 =", ["360", "340", "380", "240"], "24 × 15 = 360."),
    ("144 ÷ 12 =", ["12", "14", "11", "13"], "12 × 12 = 144."),
    ("What is 3/4 of 80?", ["60", "40", "20", "75"], "80 ÷ 4 = 20, and 20 × 3 = 60."),
    ("Round 4,768 to the nearest hundred.", ["4,800", "4,700", "5,000", "4,770"], "4,768 is closer to 4,800 than to 4,700."),
    ("A rectangle is 8 cm long and 5 cm wide. What is its perimeter?", ["26 cm", "40 cm", "13 cm", "30 cm"], "2 × (8 + 5) = 26 cm."),
    ("What comes next? 2, 5, 8, 11, …", ["14", "13", "15", "12"], "Add 3 each time."),
    ("Which number is the largest?", ["0.7", "0.65", "0.07", "0.605"], "0.7 is the same as 0.700, which is larger than the others."),
    ("How many minutes are there in two and a half hours?", ["150", "120", "125", "250"], "2 × 60 + 30 = 150 minutes."),
    ("Choose the word opposite in meaning to ANCIENT.", ["modern", "old", "early", "large"], "Ancient means very old."),
    ("What is the plural of child?", ["children", "childs", "childes", "childrens"], "Child has an irregular plural: children."),
    ("She ___ to school every day.", ["walks", "walk", "walking", "are walking"], "A singular subject takes walks in the simple present."),
    ("Lagos is to Nigeria as Accra is to ___.", ["Ghana", "Togo", "Kenya", "Benin"], "Accra is the capital of Ghana."),
    ("Which of these words is a noun?", ["happiness", "quickly", "beautiful", "run"], "Happiness names a feeling, so it is a noun."),
]

QUADRATICS_NOTES = [
    ("What makes an equation quadratic", [
        "A quadratic equation has the unknown raised to the power 2 as its highest power. We write it in standard form: <b>ax<super>2</super> + bx + c = 0</b>, where a is not 0.",
        "Examples: x<super>2</super> − 5x + 6 = 0 (a = 1, b = −5, c = 6); 2x<super>2</super> + 3x = 9 becomes 2x<super>2</super> + 3x − 9 = 0; x<super>2</super> = 49 becomes x<super>2</super> − 49 = 0.",
        "Every quadratic has at most two solutions, called its <b>roots</b>.",
    ], None),
    ("Solving by factorisation", [
        "If two numbers multiply to give zero, at least one of them is zero. This is the <b>zero product rule</b>.",
        "For x<super>2</super> + bx + c = 0, find two numbers that multiply to c and add to b, write the equation as (x + p)(x + q) = 0, then set each bracket to zero.",
    ], "Solve x<super>2</super> − 5x + 6 = 0. The numbers −2 and −3 multiply to 6 and add to −5. So (x − 2)(x − 3) = 0, giving <b>x = 2 or x = 3</b>."),
    ("Completing the square", [
        "Use this method when the quadratic does not factorise neatly. Move c to the right, add (b ÷ 2)<super>2</super> to both sides, write the left side as a perfect square and take square roots (remember ±).",
    ], "Solve x<super>2</super> + 6x − 7 = 0. x<super>2</super> + 6x = 7; add 9 to both sides: (x + 3)<super>2</super> = 16; x + 3 = ±4, so <b>x = 1 or x = −7</b>."),
    ("The quadratic formula", [
        "For ax<super>2</super> + bx + c = 0: <b>x = (−b ± √(b<super>2</super> − 4ac)) ÷ 2a</b>.",
        "The <b>discriminant</b> b<super>2</super> − 4ac tells you what to expect: positive gives two real roots, zero gives one repeated root, negative gives no real roots.",
    ], "Solve 2x<super>2</super> − 4x − 3 = 0. Here a = 2, b = −4, c = −3, so b<super>2</super> − 4ac = 16 + 24 = 40 and x = (4 ± √40) ÷ 4, giving <b>x ≈ 2.58 or x ≈ −0.58</b>."),
    ("Word problems", [
        "Let the unknown be x, write an equation from the story, solve it, then reject answers that make no sense, such as negative lengths, ages or prices.",
    ], "A garden is 3 m longer than it is wide and its area is 40 m². x(x + 3) = 40 gives x<super>2</super> + 3x − 40 = 0, so (x + 8)(x − 5) = 0. The width is <b>5 m</b> and the length is 8 m."),
]
QUADRATICS_EXERCISES = [
    ("Write 3x<super>2</super> = 7x − 2 in standard form and state a, b and c.", "3x<super>2</super> − 7x + 2 = 0; a = 3, b = −7, c = 2."),
    ("Solve x<super>2</super> − 9x + 20 = 0 by factorisation.", "(x − 4)(x − 5) = 0, so x = 4 or x = 5."),
    ("Solve 2x<super>2</super> + 7x + 3 = 0.", "(2x + 1)(x + 3) = 0, so x = −1/2 or x = −3."),
    ("Solve x<super>2</super> + 4x − 5 = 0 by completing the square.", "(x + 2)<super>2</super> = 9, so x = 1 or x = −5."),
    ("Find the discriminant of x<super>2</super> + 2x + 5 = 0 and say what it tells you.", "4 − 20 = −16, which is negative, so there are no real roots."),
    ("Two consecutive whole numbers multiply to 156. Find them.", "x(x + 1) = 156 gives x = 12, so the numbers are 12 and 13."),
]

PARTS_OF_SPEECH = [
    ("Noun", "names a person, place, thing or idea.", "Zainab, Kano, pencil, honesty"),
    ("Pronoun", "takes the place of a noun so we do not repeat it.", "he, she, it, they, them, ours"),
    ("Verb", "shows an action or a state.", "run, write, sing, is, seem"),
    ("Adjective", "describes a noun or pronoun.", "tall, three, blue, careful"),
    ("Adverb", "tells us how, when or where an action happens.", "quickly, yesterday, here, very"),
    ("Preposition", "shows position or relationship.", "on, under, beside, between, after"),
    ("Conjunction", "joins words, phrases or ideas.", "and, but, or, because, although"),
    ("Interjection", "shows sudden feeling.", "Wow! Oh no! Ah! Hurray!"),
]
PARTS_EXERCISES = [
    ("Emeka lost <b>his</b> bag.", "pronoun"),
    ("The pupils <b>sang</b> the anthem.", "verb"),
    ("They sang <b>proudly</b>.", "adverb"),
    ("The book is <b>on</b> the table.", "preposition"),
    ("I wanted to play, <b>but</b> it was raining.", "conjunction"),
    ("A <b>tall</b> palm tree stood by the gate.", "adjective"),
    ("<b>Abuja</b> is the capital of Nigeria.", "noun (a proper noun)"),
    ("<b>Wow!</b> That was a great goal.", "interjection"),
    ("Honesty is the best <b>policy</b>.", "noun"),
    ("She <b>seems</b> tired today.", "verb (it shows a state)"),
]

FRACTIONS_WORKSHEET = [
    ("Write two fractions equivalent to 1/2.", "For example 2/4 and 4/8."),
    ("Write 12/18 in its simplest form.", "2/3"),
    ("Which is bigger, 3/5 or 2/3?", "2/3 (10/15 is bigger than 9/15)."),
    ("1/4 + 2/4 =", "3/4"),
    ("1/3 + 1/6 =", "1/2"),
    ("5/6 − 1/3 =", "1/2"),
    ("What is 1/5 of 35 oranges?", "7 oranges"),
    ("Mama Nkechi cuts a cake into 8 equal slices. Tunde eats 3 slices. What fraction of the cake is left?", "5/8"),
    ("Change 3/4 to a decimal.", "0.75"),
    ("Change 0.6 to a fraction in its simplest form.", "3/5"),
    ("Arrange from smallest to biggest: 1/2, 1/4, 3/4.", "1/4, 1/2, 3/4"),
    ("Bola has ₦200 and spends 2/5 of it on bread. How much does she spend?", "₦80"),
]

SCHEME_OF_WORK = [
    (1, "Number bases", "Convert between base ten and bases two to nine; add and subtract in other bases."),
    (2, "Modular arithmetic", "Work with clock (modulo) arithmetic and simple applications."),
    (3, "Indices", "Apply the laws of indices, including zero, negative and fractional indices."),
    (4, "Logarithms", "Use the laws of logarithms and logarithm tables to simplify and calculate."),
    (5, "Sets", "Use set notation, Venn diagrams and solve two-set problems."),
    (6, "Simple equations and variation", "Solve linear equations; direct, inverse and joint variation."),
    (7, "Mid-term test and review", "Continuous assessment on weeks 1 to 6."),
    (8, "Quadratic equations (1)", "Standard form; solving by factorisation."),
    (9, "Quadratic equations (2)", "Completing the square and the quadratic formula."),
    (10, "Quadratic equations (3)", "Word problems that lead to quadratic equations."),
    (11, "Revision", "Mixed practice in WAEC and NECO style."),
    (12, "Examination", "End of term examination."),
]
