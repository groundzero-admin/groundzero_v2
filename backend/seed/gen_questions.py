"""Generate grade-level math questions for the question bank."""

import json

# Each entry: (competency_id, grade_band, questions_list)
# Each question: (text, options[(label, text, is_correct)], correct_answer, difficulty, explanation)

QUESTIONS = []


def q(comp_id, grade_band, text, options, correct, difficulty, explanation):
    QUESTIONS.append({
        "competency_id": comp_id,
        "module_id": "math_v1",
        "text": text,
        "type": "mcq",
        "options": [
            {"label": chr(65 + i), "text": o[0], "is_correct": o[1]}
            for i, o in enumerate(options)
        ],
        "correct_answer": correct,
        "difficulty": difficulty,
        "grade_band": grade_band,
        "explanation": explanation,
    })


# ═══════════════════════════════════════════════════════════
# C4.14.4 — Number Sense Grade 4
# Large numbers, place value, estimation, basic operations
# ═══════════════════════════════════════════════════════════

q("C4.14.4", "4-5",
  "What is the place value of 5 in 3,567?",
  [("500", True), ("50", False), ("5", False), ("5,000", False)],
  "A", 0.2, "5 is in the hundreds place, so its place value is 500.")

q("C4.14.4", "4-5",
  "Round 4,678 to the nearest hundred.",
  [("4,600", False), ("4,700", True), ("4,680", False), ("5,000", False)],
  "B", 0.3, "4,678 rounded to nearest hundred: 78 >= 50, so round up to 4,700.")

q("C4.14.4", "4-5",
  "Which number is greater: 45,672 or 45,627?",
  [("45,672", True), ("45,627", False), ("They are equal", False), ("Cannot tell", False)],
  "A", 0.2, "Compare digit by digit: 45,6__ — 7 > 2 in the tens place.")

q("C4.14.4", "4-5",
  "Rina saved \u20b91,250 in January, \u20b9980 in February, and \u20b91,500 in March. How much did she save in total?",
  [("\u20b93,730", True), ("\u20b93,370", False), ("\u20b93,700", False), ("\u20b94,730", False)],
  "A", 0.35, "1,250 + 980 + 1,500 = 3,730.")

q("C4.14.4", "4-5",
  "What is 6,000 - 2,473?",
  [("3,527", True), ("3,473", False), ("4,527", False), ("3,537", False)],
  "A", 0.4, "6,000 - 2,473 = 3,527. Borrow from thousands.")

q("C4.14.4", "4-5",
  "A school has 1,245 students. If 389 are in primary section, how many are in secondary?",
  [("856", True), ("956", False), ("846", False), ("756", False)],
  "A", 0.4, "1,245 - 389 = 856.")

q("C4.14.4", "4-5",
  "Estimate 4,891 + 3,214 by rounding to the nearest thousand.",
  [("8,000", True), ("7,000", False), ("9,000", False), ("8,100", False)],
  "A", 0.5, "4,891 \u2248 5,000 and 3,214 \u2248 3,000. So 5,000 + 3,000 = 8,000.")

q("C4.14.4", "4-5",
  "Write the number fifty-six thousand, three hundred and eight in digits.",
  [("56,308", True), ("56,380", False), ("5,638", False), ("56,038", False)],
  "A", 0.3, "Fifty-six thousand = 56,000. Three hundred and eight = 308. Total = 56,308.")

q("C4.14.4", "4-5",
  "What is 345 \u00d7 12?",
  [("4,140", True), ("4,040", False), ("3,140", False), ("4,240", False)],
  "A", 0.6, "345 \u00d7 12 = 345 \u00d7 10 + 345 \u00d7 2 = 3,450 + 690 = 4,140.")

# ═══════════════════════════════════════════════════════════
# C4.14.5 — Number Sense Grade 5
# Numbers up to crores, HCF, LCM, prime & composite
# ═══════════════════════════════════════════════════════════

q("C4.14.5", "4-5",
  "Which of these is a prime number?",
  [("21", False), ("23", True), ("27", False), ("33", False)],
  "B", 0.2, "23 is only divisible by 1 and 23. The others have more factors.")

q("C4.14.5", "4-5",
  "What is the LCM of 4 and 6?",
  [("12", True), ("24", False), ("2", False), ("18", False)],
  "A", 0.3, "Multiples of 4: 4,8,12,16... Multiples of 6: 6,12,18... LCM = 12.")

q("C4.14.5", "4-5",
  "What is the HCF of 12 and 18?",
  [("6", True), ("3", False), ("12", False), ("36", False)],
  "A", 0.35, "Factors of 12: 1,2,3,4,6,12. Factors of 18: 1,2,3,6,9,18. HCF = 6.")

q("C4.14.5", "4-5",
  "The population of a town is 45,67,890. Write this in words (Indian system).",
  [("Forty-five lakh sixty-seven thousand eight hundred ninety", True),
   ("Four million five hundred sixty-seven thousand", False),
   ("Forty-five crore sixty-seven lakh", False),
   ("Four lakh fifty-six thousand seven hundred", False)],
  "A", 0.4, "45,67,890 = 45 lakh 67 thousand 8 hundred 90.")

q("C4.14.5", "4-5",
  "Which of these numbers is composite?",
  [("11", False), ("13", False), ("15", True), ("17", False)],
  "C", 0.2, "15 = 3 \u00d7 5, so it has factors other than 1 and itself.")

q("C4.14.5", "4-5",
  "Two bells ring every 8 minutes and 12 minutes. If they ring together at 9:00 AM, when will they ring together next?",
  [("9:24 AM", True), ("9:20 AM", False), ("9:16 AM", False), ("9:30 AM", False)],
  "A", 0.6, "LCM of 8 and 12 = 24. They ring together every 24 minutes.")

q("C4.14.5", "4-5",
  "Write 6,50,00,000 in words (Indian system).",
  [("Six crore fifty lakh", True), ("Sixty-five million", False),
   ("Six hundred fifty lakh", False), ("Six crore five lakh", False)],
  "A", 0.35, "6,50,00,000 = 6 crore 50 lakh.")

q("C4.14.5", "4-5",
  "Find the prime factorisation of 36.",
  [("2 \u00d7 2 \u00d7 3 \u00d7 3", True), ("4 \u00d7 9", False),
   ("6 \u00d7 6", False), ("2 \u00d7 3 \u00d7 6", False)],
  "A", 0.5, "36 = 4 \u00d7 9 = 2\u00b2 \u00d7 3\u00b2 = 2 \u00d7 2 \u00d7 3 \u00d7 3.")

q("C4.14.5", "4-5",
  "What is the LCM of 15 and 20?",
  [("60", True), ("30", False), ("300", False), ("5", False)],
  "A", 0.5, "15 = 3\u00d75, 20 = 4\u00d75. LCM = 3\u00d74\u00d75 = 60.")

# ═══════════════════════════════════════════════════════════
# C4.14.6 — Number Sense Grade 6
# Whole number properties, integers, negative numbers
# ═══════════════════════════════════════════════════════════

q("C4.14.6", "6-7",
  "What is (-3) + (-5)?",
  [("-8", True), ("8", False), ("-2", False), ("2", False)],
  "A", 0.2, "Adding two negatives: -3 + -5 = -8.")

q("C4.14.6", "6-7",
  "Arrange these integers in ascending order: 3, -7, 0, -2, 5",
  [("-7, -2, 0, 3, 5", True), ("5, 3, 0, -2, -7", False),
   ("-2, -7, 0, 3, 5", False), ("0, -2, -7, 3, 5", False)],
  "A", 0.3, "From smallest to largest: -7 < -2 < 0 < 3 < 5.")

q("C4.14.6", "6-7",
  "The temperature in Shimla was -3\u00b0C in the morning and rose by 8\u00b0C by afternoon. What was the afternoon temperature?",
  [("5\u00b0C", True), ("11\u00b0C", False), ("-11\u00b0C", False), ("-5\u00b0C", False)],
  "A", 0.35, "-3 + 8 = 5\u00b0C.")

q("C4.14.6", "6-7",
  "Which property is shown: 7 + 3 = 3 + 7?",
  [("Commutative property", True), ("Associative property", False),
   ("Distributive property", False), ("Identity property", False)],
  "A", 0.3, "Changing the order of addition doesn't change the result \u2014 commutative property.")

q("C4.14.6", "6-7",
  "What is (-12) \u00f7 (-4)?",
  [("3", True), ("-3", False), ("48", False), ("-48", False)],
  "A", 0.4, "Negative \u00f7 negative = positive. 12 \u00f7 4 = 3.")

q("C4.14.6", "6-7",
  "A submarine is at -200m. It rises 75m. What is its new depth?",
  [("-125m", True), ("-275m", False), ("125m", False), ("-135m", False)],
  "A", 0.5, "-200 + 75 = -125m. Still below sea level.")

q("C4.14.6", "6-7",
  "Evaluate: 15 - (-8) + (-3)",
  [("20", True), ("4", False), ("26", False), ("10", False)],
  "A", 0.55, "15 - (-8) = 15 + 8 = 23. Then 23 + (-3) = 20.")

# ═══════════════════════════════════════════════════════════
# C4.14.7 — Number Sense Grade 7
# Integer operations, multiplication & division of integers
# ═══════════════════════════════════════════════════════════

q("C4.14.7", "6-7",
  "What is (-6) \u00d7 (-7)?",
  [("42", True), ("-42", False), ("13", False), ("-13", False)],
  "A", 0.2, "Negative \u00d7 negative = positive. 6 \u00d7 7 = 42.")

q("C4.14.7", "6-7",
  "Simplify: (-2) \u00d7 3 \u00d7 (-5)",
  [("30", True), ("-30", False), ("10", False), ("-10", False)],
  "A", 0.35, "(-2) \u00d7 3 = -6. Then (-6) \u00d7 (-5) = 30.")

q("C4.14.7", "6-7",
  "A lift goes down 3 floors per trip. After 7 trips down from floor 2, what floor is it on?",
  [("-19", True), ("-21", False), ("-23", False), ("23", False)],
  "A", 0.4, "7 trips \u00d7 (-3) floors = -21. Starting at 2: 2 + (-21) = -19.")

q("C4.14.7", "6-7",
  "What is (-48) \u00f7 6?",
  [("-8", True), ("8", False), ("-6", False), ("6", False)],
  "A", 0.25, "Negative \u00f7 positive = negative. 48 \u00f7 6 = 8. Answer: -8.")

q("C4.14.7", "6-7",
  "Find the value of: (-3)\u00b3",
  [("-27", True), ("27", False), ("-9", False), ("9", False)],
  "A", 0.5, "(-3)\u00b3 = (-3) \u00d7 (-3) \u00d7 (-3) = 9 \u00d7 (-3) = -27.")

q("C4.14.7", "6-7",
  "A company's profit was \u20b9-5 lakh per month for 4 months. What was the total loss?",
  [("\u20b920 lakh", True), ("\u20b9-20 lakh", False), ("\u20b95 lakh", False), ("\u20b9-1 lakh", False)],
  "A", 0.45, "Total = 4 \u00d7 (-5) = -20 lakh. Total loss = \u20b920 lakh.")

q("C4.14.7", "6-7",
  "Which is true about the product of three negative integers?",
  [("Always negative", True), ("Always positive", False),
   ("Always zero", False), ("Could be positive or negative", False)],
  "A", 0.35, "Odd number of negatives: neg \u00d7 neg = pos, pos \u00d7 neg = neg.")

q("C4.14.7", "6-7",
  "Evaluate: 36 \u00f7 (-4) \u00f7 (-3)",
  [("3", True), ("-3", False), ("9", False), ("-9", False)],
  "A", 0.5, "36 \u00f7 (-4) = -9. Then (-9) \u00f7 (-3) = 3.")

q("C4.14.7", "6-7",
  "Simplify: (-8) + (-8) + (-8) + (-8) + (-8)",
  [("-40", True), ("40", False), ("-48", False), ("0", False)],
  "A", 0.2, "5 \u00d7 (-8) = -40.")

# ═══════════════════════════════════════════════════════════
# C4.14.8 — Number Sense Grade 8
# Rational numbers, properties, number line
# ═══════════════════════════════════════════════════════════

q("C4.14.8", "8-9",
  "Which of these is a rational number?",
  [("\u221a4", True), ("\u221a3", False), ("\u03c0", False), ("\u221a7", False)],
  "A", 0.2, "\u221a4 = 2, which can be written as 2/1. The others are irrational.")

q("C4.14.8", "8-9",
  "Find: 3/4 + (-1/2)",
  [("1/4", True), ("5/4", False), ("-1/4", False), ("1/2", False)],
  "A", 0.3, "3/4 + (-1/2) = 3/4 - 2/4 = 1/4.")

q("C4.14.8", "8-9",
  "Which rational number lies between 1/3 and 1/2?",
  [("5/12", True), ("1/4", False), ("2/3", False), ("1/6", False)],
  "A", 0.4, "1/3 = 4/12, 1/2 = 6/12. So 5/12 lies between them.")

q("C4.14.8", "8-9",
  "The additive inverse of -7/9 is:",
  [("7/9", True), ("-7/9", False), ("9/7", False), ("-9/7", False)],
  "A", 0.25, "Additive inverse means the number that adds to give 0. -7/9 + 7/9 = 0.")

q("C4.14.8", "8-9",
  "Find the multiplicative inverse of -3/5.",
  [("-5/3", True), ("5/3", False), ("3/5", False), ("-3/5", False)],
  "A", 0.35, "Multiplicative inverse: -3/5 \u00d7 x = 1. So x = -5/3.")

q("C4.14.8", "8-9",
  "Represent -3/4 on a number line. It lies between:",
  [("-1 and 0", True), ("0 and 1", False), ("-2 and -1", False), ("1 and 2", False)],
  "A", 0.2, "-3/4 = -0.75, which is between -1 and 0.")

q("C4.14.8", "8-9",
  "Simplify: (-2/3) \u00d7 (9/4) \u00d7 (-5/6)",
  [("5/4", True), ("-5/4", False), ("3/4", False), ("-3/4", False)],
  "A", 0.65, "(-2/3)\u00d7(9/4) = -18/12 = -3/2. Then (-3/2)\u00d7(-5/6) = 15/12 = 5/4.")

q("C4.14.8", "8-9",
  "Is 0 a rational number?",
  [("Yes, it can be written as 0/1", True), ("No, it's neither positive nor negative", False),
   ("No, it's not a fraction", False), ("Only sometimes", False)],
  "A", 0.15, "0 = 0/1, which is of the form p/q where q is not 0.")

q("C4.14.8", "8-9",
  "Find 5 rational numbers between -1 and 0 is possible because:",
  [("There are infinitely many rationals between any two rationals", True),
   ("There are only 5 rationals between them", False),
   ("Rational numbers are countable", False),
   ("Only integers lie between them", False)],
  "A", 0.4, "Between any two rational numbers, there are infinitely many rationals (density property).")

# ═══════════════════════════════════════════════════════════
# C4.14.9 — Number Sense Grade 9
# Real numbers, irrational numbers, rationalising
# ═══════════════════════════════════════════════════════════

q("C4.14.9", "8-9",
  "Which of these is irrational?",
  [("\u221a5", True), ("\u221a9", False), ("0.333...", False), ("22/7", False)],
  "A", 0.2, "\u221a5 cannot be expressed as p/q. \u221a9=3, 0.333...=1/3, 22/7 is rational.")

q("C4.14.9", "8-9",
  "Rationalise the denominator of 1/\u221a3.",
  [("\u221a3/3", True), ("3/\u221a3", False), ("1/3", False), ("\u221a3", False)],
  "A", 0.35, "Multiply top and bottom by \u221a3: 1/\u221a3 \u00d7 \u221a3/\u221a3 = \u221a3/3.")

q("C4.14.9", "8-9",
  "Simplify: \u221a12 + \u221a27",
  [("5\u221a3", True), ("\u221a39", False), ("3\u221a3", False), ("6\u221a3", False)],
  "A", 0.45, "\u221a12 = 2\u221a3, \u221a27 = 3\u221a3. Sum = 5\u221a3.")

q("C4.14.9", "8-9",
  "The decimal expansion of \u221a2 is:",
  [("Non-terminating, non-repeating", True), ("Terminating", False),
   ("Non-terminating, repeating", False), ("Cannot be determined", False)],
  "A", 0.3, "Irrational numbers have non-terminating, non-repeating decimal expansions.")

q("C4.14.9", "8-9",
  "If x = 3 + 2\u221a2, find x + 1/x.",
  [("6", True), ("3 + 2\u221a2", False), ("4\u221a2", False), ("3", False)],
  "A", 0.7, "1/x = 1/(3+2\u221a2) = (3-2\u221a2)/((3+2\u221a2)(3-2\u221a2)) = (3-2\u221a2)/(9-8) = 3-2\u221a2. So x + 1/x = 6.")

q("C4.14.9", "8-9",
  "Between which two consecutive integers does \u221a7 lie?",
  [("2 and 3", True), ("3 and 4", False), ("1 and 2", False), ("7 and 8", False)],
  "A", 0.25, "2\u00b2 = 4 and 3\u00b2 = 9. Since 4 < 7 < 9, \u221a7 lies between 2 and 3.")

q("C4.14.9", "8-9",
  "Simplify: (3 + \u221a5)(3 - \u221a5)",
  [("4", True), ("9 - 5", False), ("14", False), ("9 + 5", False)],
  "A", 0.4, "Using (a+b)(a-b) = a\u00b2 - b\u00b2: 9 - 5 = 4.")

q("C4.14.9", "8-9",
  "Express 0.4\u0305 (0.444...) as a fraction.",
  [("4/9", True), ("2/5", False), ("4/10", False), ("44/99", False)],
  "A", 0.45, "Let x = 0.444... Then 10x = 4.444... So 9x = 4, x = 4/9.")

q("C4.14.9", "8-9",
  "Which of these is true?",
  [("Every rational number is a real number", True),
   ("Every real number is rational", False),
   ("Every irrational number is an integer", False),
   ("\u03c0 is a rational number", False)],
  "A", 0.2, "Real numbers = rational + irrational. So every rational is real, but not vice versa.")

# ═══════════════════════════════════════════════════════════
# C4.15.4 — Fractions Grade 4
# Introduction, equivalent fractions, comparing
# ═══════════════════════════════════════════════════════════

q("C4.15.4", "4-5",
  "What fraction of a pizza is left if 3 out of 8 slices are eaten?",
  [("5/8", True), ("3/8", False), ("3/5", False), ("8/3", False)],
  "A", 0.2, "8 - 3 = 5 slices left. Fraction left = 5/8.")

q("C4.15.4", "4-5",
  "Which fraction is equivalent to 2/4?",
  [("1/2", True), ("2/3", False), ("3/4", False), ("4/2", False)],
  "A", 0.2, "2/4 simplified: divide both by 2 = 1/2.")

q("C4.15.4", "4-5",
  "Which is greater: 3/5 or 3/7?",
  [("3/5", True), ("3/7", False), ("They are equal", False), ("Cannot compare", False)],
  "A", 0.3, "Same numerator: smaller denominator means bigger fraction. 3/5 > 3/7.")

q("C4.15.4", "4-5",
  "A ribbon is 1 metre long. If Priya cuts off 1/4, how much is left?",
  [("3/4 metre", True), ("1/4 metre", False), ("1/2 metre", False), ("2/4 metre", False)],
  "A", 0.25, "1 - 1/4 = 3/4 metre.")

q("C4.15.4", "4-5",
  "Convert 3/4 to an equivalent fraction with denominator 12.",
  [("9/12", True), ("6/12", False), ("3/12", False), ("12/4", False)],
  "A", 0.35, "Multiply both by 3: 3\u00d73 / 4\u00d73 = 9/12.")

q("C4.15.4", "4-5",
  "Arrange in ascending order: 1/2, 1/4, 3/4",
  [("1/4, 1/2, 3/4", True), ("3/4, 1/2, 1/4", False),
   ("1/2, 1/4, 3/4", False), ("1/4, 3/4, 1/2", False)],
  "A", 0.3, "1/4 = 0.25, 1/2 = 0.50, 3/4 = 0.75.")

q("C4.15.4", "4-5",
  "What is 1/3 of 12 pencils?",
  [("4 pencils", True), ("3 pencils", False), ("6 pencils", False), ("9 pencils", False)],
  "A", 0.2, "12 \u00f7 3 = 4 pencils.")

q("C4.15.4", "4-5",
  "A cake is divided into 6 equal pieces. Ravi eats 2, Meena eats 1. What fraction is eaten?",
  [("3/6 or 1/2", True), ("2/6", False), ("1/6", False), ("4/6", False)],
  "A", 0.35, "2 + 1 = 3 pieces eaten out of 6 = 3/6 = 1/2.")

# ═══════════════════════════════════════════════════════════
# C4.15.5 — Fractions Grade 5
# Like & unlike fractions, addition & subtraction
# ═══════════════════════════════════════════════════════════

q("C4.15.5", "4-5",
  "Add: 2/5 + 1/5",
  [("3/5", True), ("3/10", False), ("1/5", False), ("2/10", False)],
  "A", 0.2, "Same denominator: 2/5 + 1/5 = 3/5.")

q("C4.15.5", "4-5",
  "Subtract: 3/4 - 1/2",
  [("1/4", True), ("2/2", False), ("1/2", False), ("2/4", False)],
  "A", 0.3, "Convert 1/2 = 2/4. Then 3/4 - 2/4 = 1/4.")

q("C4.15.5", "4-5",
  "Add: 1/3 + 1/4",
  [("7/12", True), ("2/7", False), ("1/7", False), ("2/12", False)],
  "A", 0.4, "LCM of 3 and 4 = 12. 4/12 + 3/12 = 7/12.")

q("C4.15.5", "4-5",
  "Anu drank 1/3 litre of milk in the morning and 1/4 litre in the evening. How much total?",
  [("7/12 litre", True), ("2/7 litre", False), ("1/2 litre", False), ("2/12 litre", False)],
  "A", 0.45, "1/3 + 1/4 = 4/12 + 3/12 = 7/12 litre.")

q("C4.15.5", "4-5",
  "Which is greater: 3/4 or 2/3?",
  [("3/4", True), ("2/3", False), ("They are equal", False), ("Cannot tell", False)],
  "A", 0.35, "3/4 = 9/12, 2/3 = 8/12. 9/12 > 8/12.")

q("C4.15.5", "4-5",
  "Subtract: 5/6 - 1/3",
  [("1/2", True), ("4/3", False), ("4/6", False), ("2/3", False)],
  "A", 0.35, "1/3 = 2/6. 5/6 - 2/6 = 3/6 = 1/2.")

q("C4.15.5", "4-5",
  "A rope is 5/8 metre. Another is 3/8 metre. Total length?",
  [("1 metre", True), ("8/8 metre", False), ("8/16 metre", False), ("2 metres", False)],
  "A", 0.2, "5/8 + 3/8 = 8/8 = 1 metre. Both A and B are correct, but A is simpler.")

q("C4.15.5", "4-5",
  "Add: 2\u00bd + 1\u00bc",
  [("3\u00be", True), ("3\u00bd", False), ("3\u00bc", False), ("4", False)],
  "A", 0.5, "2\u00bd + 1\u00bc = 5/2 + 5/4 = 10/4 + 5/4 = 15/4 = 3\u00be.")

q("C4.15.5", "4-5",
  "Simplify: 8/12 + 3/12 - 5/12",
  [("1/2", True), ("6/12", False), ("6/36", False), ("16/12", False)],
  "A", 0.3, "8/12 + 3/12 - 5/12 = 6/12 = 1/2.")

# ═══════════════════════════════════════════════════════════
# C4.15.6 — Fractions Grade 6
# Types of fractions, comparison, unlike denominators
# ═══════════════════════════════════════════════════════════

q("C4.15.6", "6-7",
  "Convert 7/3 to a mixed number.",
  [("2\u2153", True), ("3\u2154", False), ("1\u2154", False), ("2\u2154", False)],
  "A", 0.2, "7 \u00f7 3 = 2 remainder 1. So 7/3 = 2\u2153.")

q("C4.15.6", "6-7",
  "Add: 2/3 + 3/5",
  [("19/15", True), ("5/8", False), ("5/15", False), ("6/15", False)],
  "A", 0.35, "LCM of 3 and 5 = 15. 10/15 + 9/15 = 19/15.")

q("C4.15.6", "6-7",
  "Which is the largest: 2/3, 5/6, 3/4?",
  [("5/6", True), ("3/4", False), ("2/3", False), ("All equal", False)],
  "A", 0.3, "LCM=12: 8/12, 10/12, 9/12. Largest = 10/12 = 5/6.")

q("C4.15.6", "6-7",
  "Subtract: 4\u00bd - 2\u00be",
  [("1\u00be", True), ("2\u00be", False), ("2\u00bc", False), ("1\u00bc", False)],
  "A", 0.5, "4\u00bd = 9/2 = 18/4. 2\u00be = 11/4. 18/4 - 11/4 = 7/4 = 1\u00be.")

q("C4.15.6", "6-7",
  "Reduce 24/36 to simplest form.",
  [("2/3", True), ("4/6", False), ("12/18", False), ("6/9", False)],
  "A", 0.25, "GCD of 24 and 36 = 12. 24/12 = 2, 36/12 = 3. Simplest form = 2/3.")

q("C4.15.6", "6-7",
  "A recipe needs 2/3 cup sugar. If you make half the recipe, how much sugar?",
  [("1/3 cup", True), ("1/6 cup", False), ("2/6 cup", False), ("1/2 cup", False)],
  "A", 0.35, "Half of 2/3 = 2/3 \u00d7 1/2 = 2/6 = 1/3 cup.")

q("C4.15.6", "6-7",
  "Add: 5/8 + 1/6",
  [("19/24", True), ("6/14", False), ("3/7", False), ("6/48", False)],
  "A", 0.45, "LCM of 8 and 6 = 24. 15/24 + 4/24 = 19/24.")

q("C4.15.6", "6-7",
  "Identify the type: 5/3",
  [("Improper fraction", True), ("Proper fraction", False), ("Mixed number", False), ("Unit fraction", False)],
  "A", 0.15, "Numerator > denominator, so it's an improper fraction.")

# ═══════════════════════════════════════════════════════════
# C4.15.7 — Fractions Grade 7
# Multiplication & division of fractions and decimals
# ═══════════════════════════════════════════════════════════

q("C4.15.7", "6-7",
  "Multiply: 2/3 \u00d7 3/4",
  [("1/2", True), ("6/7", False), ("5/12", False), ("6/12", False)],
  "A", 0.2, "2/3 \u00d7 3/4 = 6/12 = 1/2.")

q("C4.15.7", "6-7",
  "Divide: 3/4 \u00f7 1/2",
  [("3/2 or 1\u00bd", True), ("3/8", False), ("1/4", False), ("6/4", False)],
  "A", 0.35, "3/4 \u00f7 1/2 = 3/4 \u00d7 2/1 = 6/4 = 3/2 = 1\u00bd.")

q("C4.15.7", "6-7",
  "A room is 5\u00bd metres long and 3\u00bc metres wide. What is its area?",
  [("17\u215e sq m", True), ("8\u00be sq m", False), ("15 sq m", False), ("16\u00bd sq m", False)],
  "A", 0.55, "5\u00bd \u00d7 3\u00bc = 11/2 \u00d7 13/4 = 143/8 = 17\u215e sq m.")

q("C4.15.7", "6-7",
  "If 3/5 of a number is 45, what is the number?",
  [("75", True), ("27", False), ("135", False), ("15", False)],
  "A", 0.4, "3/5 \u00d7 n = 45. n = 45 \u00d7 5/3 = 75.")

q("C4.15.7", "6-7",
  "Simplify: 2\u00bd \u00d7 1\u2153",
  [("3\u2153", True), ("2\u2159", False), ("3\u00bd", False), ("2\u00be", False)],
  "A", 0.45, "5/2 \u00d7 4/3 = 20/6 = 10/3 = 3\u2153.")

q("C4.15.7", "6-7",
  "How many pieces of 1/4 metre can be cut from a 3 metre rope?",
  [("12", True), ("4", False), ("3", False), ("7", False)],
  "A", 0.3, "3 \u00f7 1/4 = 3 \u00d7 4 = 12 pieces.")

# ═══════════════════════════════════════════════════════════
# C4.16.5 — Decimals Grade 5
# Introduction to decimals, place value, comparison
# ═══════════════════════════════════════════════════════════

q("C4.16.5", "4-5",
  "Write 3/10 as a decimal.",
  [("0.3", True), ("3.0", False), ("0.03", False), ("0.33", False)],
  "A", 0.15, "3/10 = 3 tenths = 0.3.")

q("C4.16.5", "4-5",
  "Which is greater: 0.5 or 0.45?",
  [("0.5", True), ("0.45", False), ("They are equal", False), ("Cannot tell", False)],
  "A", 0.2, "0.5 = 0.50. Compare: 50 > 45, so 0.5 > 0.45.")

q("C4.16.5", "4-5",
  "What is the place value of 7 in 3.72?",
  [("7 tenths or 0.7", True), ("7 hundredths", False), ("7 ones", False), ("70", False)],
  "A", 0.25, "7 is in the tenths place, so its value is 0.7.")

q("C4.16.5", "4-5",
  "Convert 0.25 to a fraction.",
  [("1/4", True), ("1/5", False), ("25/10", False), ("2/5", False)],
  "A", 0.3, "0.25 = 25/100 = 1/4.")

q("C4.16.5", "4-5",
  "Arrange in ascending order: 0.6, 0.06, 0.66",
  [("0.06, 0.6, 0.66", True), ("0.6, 0.06, 0.66", False),
   ("0.66, 0.6, 0.06", False), ("0.06, 0.66, 0.6", False)],
  "A", 0.3, "0.06 = 6 hundredths, 0.6 = 60 hundredths, 0.66 = 66 hundredths.")

q("C4.16.5", "4-5",
  "Riya ran 2.5 km and Arjun ran 2.35 km. Who ran more and by how much?",
  [("Riya, by 0.15 km", True), ("Arjun, by 0.15 km", False),
   ("Riya, by 0.25 km", False), ("They ran the same", False)],
  "A", 0.4, "2.5 - 2.35 = 0.15 km more by Riya.")

q("C4.16.5", "4-5",
  "Write 7/4 as a decimal.",
  [("1.75", True), ("0.74", False), ("7.4", False), ("1.25", False)],
  "A", 0.35, "7/4 = 7 \u00f7 4 = 1.75.")

q("C4.16.5", "4-5",
  "What is 1.5 + 2.75?",
  [("4.25", True), ("3.25", False), ("4.75", False), ("4.15", False)],
  "A", 0.3, "1.50 + 2.75 = 4.25.")

q("C4.16.5", "4-5",
  "Round 3.67 to one decimal place.",
  [("3.7", True), ("3.6", False), ("4.0", False), ("3.70", False)],
  "A", 0.3, "Look at hundredths digit: 7 >= 5, so round up. 3.67 \u2248 3.7.")

# ═══════════════════════════════════════════════════════════
# C4.16.6 — Decimals Grade 6
# Addition & subtraction of decimals
# ═══════════════════════════════════════════════════════════

q("C4.16.6", "6-7",
  "Subtract: 5.03 - 2.7",
  [("2.33", True), ("2.97", False), ("3.33", False), ("2.23", False)],
  "A", 0.3, "5.03 - 2.70 = 2.33.")

q("C4.16.6", "6-7",
  "A notebook costs \u20b945.50 and a pen costs \u20b912.75. What is the total?",
  [("\u20b958.25", True), ("\u20b957.25", False), ("\u20b958.75", False), ("\u20b957.75", False)],
  "A", 0.2, "45.50 + 12.75 = 58.25.")

q("C4.16.6", "6-7",
  "Express 3.045 in expanded form.",
  [("3 + 0/10 + 4/100 + 5/1000", True), ("3 + 4/10 + 5/100", False),
   ("3 + 0.45", False), ("3 + 45/100", False)],
  "A", 0.4, "3.045 = 3 ones + 0 tenths + 4 hundredths + 5 thousandths.")

q("C4.16.6", "6-7",
  "Which is equivalent to 2.50?",
  [("2.5", True), ("25.0", False), ("0.25", False), ("2.05", False)],
  "A", 0.15, "Trailing zero after decimal doesn't change value: 2.50 = 2.5.")

q("C4.16.6", "6-7",
  "Add: 12.6 + 3.45 + 0.123",
  [("16.173", True), ("16.073", False), ("15.173", False), ("16.23", False)],
  "A", 0.45, "12.600 + 3.450 + 0.123 = 16.173. Align decimal points.")

# ═══════════════════════════════════════════════════════════
# C4.16.7 — Decimals Grade 7
# Multiplication & division of decimals, conversion
# ═══════════════════════════════════════════════════════════

q("C4.16.7", "6-7",
  "Multiply: 0.3 \u00d7 0.4",
  [("0.12", True), ("1.2", False), ("0.012", False), ("12", False)],
  "A", 0.2, "3 \u00d7 4 = 12. Two decimal places total: 0.12.")

q("C4.16.7", "6-7",
  "Divide: 4.5 \u00f7 0.5",
  [("9", True), ("0.9", False), ("90", False), ("2.25", False)],
  "A", 0.3, "4.5 \u00f7 0.5 = 45 \u00f7 5 = 9.")

q("C4.16.7", "6-7",
  "Convert 3/8 to a decimal.",
  [("0.375", True), ("0.38", False), ("0.35", False), ("3.8", False)],
  "A", 0.35, "3 \u00f7 8 = 0.375.")

q("C4.16.7", "6-7",
  "A cloth costs \u20b9125.50 per metre. What is the cost of 2.5 metres?",
  [("\u20b9313.75", True), ("\u20b9250.50", False), ("\u20b9312.50", False), ("\u20b9315.25", False)],
  "A", 0.45, "125.50 \u00d7 2.5 = 125.50 \u00d7 2 + 125.50 \u00d7 0.5 = 251 + 62.75 = 313.75.")

q("C4.16.7", "6-7",
  "Express 0.125 as a fraction in simplest form.",
  [("1/8", True), ("1/4", False), ("125/100", False), ("5/40", False)],
  "A", 0.35, "0.125 = 125/1000 = 1/8.")

q("C4.16.7", "6-7",
  "Simplify: 2.4 \u00d7 1.5 \u00f7 0.6",
  [("6", True), ("3.6", False), ("0.6", False), ("2.4", False)],
  "A", 0.55, "2.4 \u00d7 1.5 = 3.6. Then 3.6 \u00f7 0.6 = 6.")

q("C4.16.7", "6-7",
  "Which decimal is equivalent to 5/6?",
  [("0.833...", True), ("0.856", False), ("0.666...", False), ("0.56", False)],
  "A", 0.4, "5 \u00f7 6 = 0.8333... (repeating).")

q("C4.16.7", "6-7",
  "What is 12.6 \u00f7 0.03?",
  [("420", True), ("42", False), ("4.2", False), ("4200", False)],
  "A", 0.6, "12.6 \u00f7 0.03 = 1260 \u00f7 3 = 420.")

# ═══════════════════════════════════════════════════════════
# C4.17.6 — Ratios Grade 6
# Ratio, equivalent ratios, proportion, unitary method
# ═══════════════════════════════════════════════════════════

q("C4.17.6", "6-7",
  "Express the ratio 15:25 in simplest form.",
  [("3:5", True), ("5:3", False), ("1:5", False), ("15:25", False)],
  "A", 0.2, "Divide both by 5: 15/5 = 3, 25/5 = 5. Ratio = 3:5.")

q("C4.17.6", "6-7",
  "If the ratio of boys to girls in a class is 3:2, and there are 30 students, how many boys?",
  [("18", True), ("12", False), ("20", False), ("15", False)],
  "A", 0.35, "Total parts = 3+2 = 5. Boys = 3/5 \u00d7 30 = 18.")

q("C4.17.6", "6-7",
  "12 pens cost \u20b9180. How much do 8 pens cost?",
  [("\u20b9120", True), ("\u20b9150", False), ("\u20b996", False), ("\u20b9144", False)],
  "A", 0.3, "Cost of 1 pen = 180/12 = \u20b915. Cost of 8 = 15 \u00d7 8 = \u20b9120.")

q("C4.17.6", "6-7",
  "Are 4:6 and 6:9 equivalent ratios?",
  [("Yes", True), ("No", False), ("Only if simplified", False), ("Cannot compare", False)],
  "A", 0.25, "4:6 = 2:3 and 6:9 = 2:3. Same ratio, so equivalent.")

q("C4.17.6", "6-7",
  "A map has a scale of 1:50000. If two cities are 3 cm apart on the map, what is the actual distance?",
  [("1.5 km", True), ("15 km", False), ("150 m", False), ("150 km", False)],
  "A", 0.55, "3 \u00d7 50000 = 150000 cm = 1500 m = 1.5 km.")

# ═══════════════════════════════════════════════════════════
# C4.17.7 — Ratios Grade 7
# Percentages, profit/loss, simple interest
# ═══════════════════════════════════════════════════════════

q("C4.17.7", "6-7",
  "Convert 3/5 to a percentage.",
  [("60%", True), ("35%", False), ("53%", False), ("75%", False)],
  "A", 0.2, "3/5 \u00d7 100 = 60%.")

q("C4.17.7", "6-7",
  "A shopkeeper buys a shirt for \u20b9400 and sells for \u20b9500. What is the profit percentage?",
  [("25%", True), ("20%", False), ("100%", False), ("50%", False)],
  "A", 0.35, "Profit = 100. Profit% = 100/400 \u00d7 100 = 25%.")

q("C4.17.7", "6-7",
  "Find the simple interest on \u20b95,000 at 8% per annum for 2 years.",
  [("\u20b9800", True), ("\u20b9400", False), ("\u20b91,000", False), ("\u20b9600", False)],
  "A", 0.4, "SI = P\u00d7R\u00d7T/100 = 5000\u00d78\u00d72/100 = 800.")

q("C4.17.7", "6-7",
  "A TV's price is \u20b920,000. After 10% discount, what do you pay?",
  [("\u20b918,000", True), ("\u20b919,000", False), ("\u20b917,000", False), ("\u20b922,000", False)],
  "A", 0.3, "Discount = 10% of 20,000 = 2,000. Pay = 20,000 - 2,000 = 18,000.")

q("C4.17.7", "6-7",
  "In a test of 80 questions, Riya got 60 correct. What percentage did she score?",
  [("75%", True), ("60%", False), ("80%", False), ("70%", False)],
  "A", 0.25, "60/80 \u00d7 100 = 75%.")

q("C4.17.7", "6-7",
  "A fruit seller bought mangoes for \u20b9600 and sold them for \u20b9540. Find the loss percentage.",
  [("10%", True), ("60%", False), ("6%", False), ("15%", False)],
  "A", 0.4, "Loss = 60. Loss% = 60/600 \u00d7 100 = 10%.")

q("C4.17.7", "6-7",
  "What is 15% of 240?",
  [("36", True), ("24", False), ("30", False), ("48", False)],
  "A", 0.25, "15/100 \u00d7 240 = 36.")

# ═══════════════════════════════════════════════════════════
# C4.17.8 — Ratios Grade 8
# Compound interest, discount, tax, increase/decrease %
# ═══════════════════════════════════════════════════════════

q("C4.17.8", "8-9",
  "Find the compound interest on \u20b910,000 at 10% for 2 years.",
  [("\u20b92,100", True), ("\u20b92,000", False), ("\u20b91,000", False), ("\u20b92,500", False)],
  "A", 0.4, "A = 10000(1+0.1)\u00b2 = 10000\u00d71.21 = 12100. CI = 12100-10000 = 2100.")

q("C4.17.8", "8-9",
  "A shirt marked \u20b91,200 is sold at 20% discount. GST of 5% is then applied. Final price?",
  [("\u20b91,008", True), ("\u20b9960", False), ("\u20b91,020", False), ("\u20b91,140", False)],
  "A", 0.55, "After 20% discount: 1200 \u00d7 0.8 = 960. With 5% GST: 960 \u00d7 1.05 = 1008.")

q("C4.17.8", "8-9",
  "A population of 50,000 grows at 5% per year. What will it be after 2 years?",
  [("55,125", True), ("55,000", False), ("52,500", False), ("60,000", False)],
  "A", 0.5, "50000 \u00d7 1.05\u00b2 = 50000 \u00d7 1.1025 = 55,125.")

q("C4.17.8", "8-9",
  "The value of a car depreciates by 15% each year. If it costs \u20b96,00,000 now, what after 1 year?",
  [("\u20b95,10,000", True), ("\u20b95,40,000", False), ("\u20b94,85,000", False), ("\u20b95,25,000", False)],
  "A", 0.35, "600000 \u00d7 (1-0.15) = 600000 \u00d7 0.85 = 510000.")

q("C4.17.8", "8-9",
  "What is the difference between CI and SI on \u20b95,000 at 10% for 2 years?",
  [("\u20b950", True), ("\u20b9100", False), ("\u20b9500", False), ("\u20b925", False)],
  "A", 0.5, "SI = 5000\u00d710\u00d72/100 = 1000. CI = 5000(1.1\u00b2-1) = 1050. Diff = 50.")

q("C4.17.8", "8-9",
  "If a product's price increases by 20% then decreases by 20%, what is the net change?",
  [("4% decrease", True), ("No change", False), ("4% increase", False), ("2% decrease", False)],
  "A", 0.55, "100 \u00d7 1.2 = 120. 120 \u00d7 0.8 = 96. Net = 4% decrease.")

q("C4.17.8", "8-9",
  "Find the amount when \u20b98,000 is invested at 5% compounded annually for 3 years.",
  [("\u20b99,261", True), ("\u20b99,200", False), ("\u20b99,000", False), ("\u20b99,300", False)],
  "A", 0.6, "8000 \u00d7 1.05\u00b3 = 8000 \u00d7 1.157625 = 9261.")

# ═══════════════════════════════════════════════════════════
# C4.18.5 — Algebra Grade 5
# Number patterns, growing patterns, sequences
# ═══════════════════════════════════════════════════════════

q("C4.18.5", "4-5",
  "What comes next in the pattern: 2, 5, 8, 11, __?",
  [("14", True), ("13", False), ("12", False), ("15", False)],
  "A", 0.2, "Pattern: add 3 each time. 11 + 3 = 14.")

q("C4.18.5", "4-5",
  "Find the rule: 1, 4, 9, 16, 25, __",
  [("36", True), ("30", False), ("34", False), ("49", False)],
  "A", 0.3, "These are perfect squares: 1\u00b2, 2\u00b2, 3\u00b2, 4\u00b2, 5\u00b2. Next: 6\u00b2 = 36.")

q("C4.18.5", "4-5",
  "If a pattern grows by adding 5 each time starting from 3, what is the 6th term?",
  [("28", True), ("33", False), ("23", False), ("30", False)],
  "A", 0.35, "3, 8, 13, 18, 23, 28. The 6th term is 28.")

q("C4.18.5", "4-5",
  "What is the pattern rule for: 100, 90, 80, 70, ...?",
  [("Subtract 10", True), ("Divide by 10", False), ("Add 10", False), ("Subtract 20", False)],
  "A", 0.15, "Each term is 10 less than the previous: subtract 10.")

q("C4.18.5", "4-5",
  "A staircase pattern uses 3 blocks for step 1, 6 for step 2, 9 for step 3. How many for step 7?",
  [("21", True), ("18", False), ("24", False), ("27", False)],
  "A", 0.35, "Pattern: 3n. Step 7 = 3 \u00d7 7 = 21.")

q("C4.18.5", "4-5",
  "Find the missing number: 2, 6, __, 54, 162",
  [("18", True), ("12", False), ("24", False), ("36", False)],
  "A", 0.4, "Pattern: multiply by 3. 2, 6, 18, 54, 162.")

q("C4.18.5", "4-5",
  "In a number machine, input \u00d72 then +3. If input is 5, what is the output?",
  [("13", True), ("10", False), ("16", False), ("15", False)],
  "A", 0.25, "5 \u00d7 2 = 10. Then 10 + 3 = 13.")

q("C4.18.5", "4-5",
  "How many dots in the 5th figure if pattern is: 1, 3, 6, 10, __?",
  [("15", True), ("14", False), ("16", False), ("20", False)],
  "A", 0.4, "Triangular numbers: 1, 1+2, 1+2+3, 1+2+3+4, 1+2+3+4+5 = 15.")

q("C4.18.5", "4-5",
  "The rule is 'double and subtract 1'. Starting from 3, what is the 4th term?",
  [("17", True), ("15", False), ("19", False), ("21", False)],
  "A", 0.45, "3 -> 5 -> 9 -> 17. Each: \u00d72-1.")

q("C4.18.5", "4-5",
  "What comes next: 1, 1, 2, 3, 5, 8, __?",
  [("13", True), ("11", False), ("10", False), ("16", False)],
  "A", 0.5, "Fibonacci: each number is the sum of the two before it. 5+8=13.")

# ═══════════════════════════════════════════════════════════
# C4.18.6 — Algebra Grade 6
# Variables, expressions, simple equations
# ═══════════════════════════════════════════════════════════

q("C4.18.6", "6-7",
  "If x = 3, find the value of 2x + 5.",
  [("11", True), ("8", False), ("10", False), ("13", False)],
  "A", 0.2, "2(3) + 5 = 6 + 5 = 11.")

q("C4.18.6", "6-7",
  "Solve: x + 7 = 12",
  [("x = 5", True), ("x = 19", False), ("x = 7", False), ("x = 12", False)],
  "A", 0.2, "x = 12 - 7 = 5.")

q("C4.18.6", "6-7",
  "Write an algebraic expression: 'a number multiplied by 5 and then 3 added to it'",
  [("5x + 3", True), ("5 + 3x", False), ("x + 5 + 3", False), ("5(x + 3)", False)],
  "A", 0.3, "Number \u00d7 5 = 5x. Then add 3 = 5x + 3.")

q("C4.18.6", "6-7",
  "Solve: 3x = 18",
  [("x = 6", True), ("x = 15", False), ("x = 54", False), ("x = 3", False)],
  "A", 0.25, "x = 18 \u00f7 3 = 6.")

q("C4.18.6", "6-7",
  "A rectangle's perimeter is 2(l + b). If l = 8 cm and b = 5 cm, find the perimeter.",
  [("26 cm", True), ("40 cm", False), ("13 cm", False), ("52 cm", False)],
  "A", 0.3, "2(8 + 5) = 2 \u00d7 13 = 26 cm.")

q("C4.18.6", "6-7",
  "Simplify: 4x + 3x - 2x",
  [("5x", True), ("9x", False), ("x", False), ("5", False)],
  "A", 0.25, "4x + 3x = 7x. 7x - 2x = 5x.")

# ═══════════════════════════════════════════════════════════
# C4.18.7 — Algebra Grade 7
# Equations in one variable, expressions, like terms
# ═══════════════════════════════════════════════════════════

q("C4.18.7", "6-7",
  "Solve: 2x + 3 = 11",
  [("x = 4", True), ("x = 7", False), ("x = 5.5", False), ("x = 3", False)],
  "A", 0.25, "2x = 11 - 3 = 8. x = 4.")

q("C4.18.7", "6-7",
  "Simplify: 3(x + 4) - 2x",
  [("x + 12", True), ("5x + 4", False), ("x + 4", False), ("3x + 12", False)],
  "A", 0.35, "3x + 12 - 2x = x + 12.")

q("C4.18.7", "6-7",
  "The sum of three consecutive numbers is 42. Find the numbers.",
  [("13, 14, 15", True), ("12, 13, 14", False), ("14, 15, 16", False), ("10, 14, 18", False)],
  "A", 0.4, "Let numbers be x, x+1, x+2. 3x+3=42, x=13. Numbers: 13,14,15.")

q("C4.18.7", "6-7",
  "Solve: 5x - 3 = 3x + 7",
  [("x = 5", True), ("x = 2", False), ("x = 10", False), ("x = -5", False)],
  "A", 0.45, "5x - 3x = 7 + 3. 2x = 10. x = 5.")

q("C4.18.7", "6-7",
  "What are like terms in: 4xy + 3x + 2xy - 5y + x?",
  [("4xy and 2xy; 3x and x", True), ("4xy and 3x", False),
   ("All are like terms", False), ("3x and -5y", False)],
  "A", 0.3, "Like terms have the same variables: 4xy & 2xy are like; 3x & x are like.")

q("C4.18.7", "6-7",
  "A father is 30 years older than his son. In 5 years, the father will be 3 times the son's age. Find son's current age.",
  [("10", True), ("15", False), ("12", False), ("8", False)],
  "A", 0.6, "Son=x. Father=x+30. In 5 years: x+35 = 3(x+5). x+35=3x+15. 20=2x. x=10.")

q("C4.18.7", "6-7",
  "Solve: x/3 + 2 = 5",
  [("x = 9", True), ("x = 21", False), ("x = 1", False), ("x = 3", False)],
  "A", 0.35, "x/3 = 5 - 2 = 3. x = 9.")

# ═══════════════════════════════════════════════════════════
# C4.18.8 — Algebra Grade 8
# Linear equations, identities, factorisation
# ═══════════════════════════════════════════════════════════

q("C4.18.8", "8-9",
  "Expand: (x + 3)\u00b2",
  [("x\u00b2 + 6x + 9", True), ("x\u00b2 + 9", False), ("x\u00b2 + 3x + 9", False), ("2x + 6", False)],
  "A", 0.3, "Using (a+b)\u00b2 = a\u00b2 + 2ab + b\u00b2: x\u00b2 + 6x + 9.")

q("C4.18.8", "8-9",
  "Factorise: x\u00b2 - 9",
  [("(x+3)(x-3)", True), ("(x-3)\u00b2", False), ("(x+9)(x-1)", False), ("x(x-9)", False)],
  "A", 0.35, "Using a\u00b2 - b\u00b2 = (a+b)(a-b): x\u00b2-9 = (x+3)(x-3).")

q("C4.18.8", "8-9",
  "Solve: 3(x - 2) = 2(x + 1)",
  [("x = 8", True), ("x = -8", False), ("x = 4", False), ("x = 2", False)],
  "A", 0.4, "3x - 6 = 2x + 2. x = 8.")

q("C4.18.8", "8-9",
  "Factorise: 6x\u00b2 + 11x + 3",
  [("(2x + 3)(3x + 1)", True), ("(6x + 1)(x + 3)", False),
   ("(3x + 3)(2x + 1)", False), ("(2x + 1)(3x + 3)", False)],
  "A", 0.6, "Find two numbers: 9 and 2 (product=18, sum=11). Split: 6x\u00b2+9x+2x+3 = 3x(2x+3)+1(2x+3).")

q("C4.18.8", "8-9",
  "Evaluate 105\u00b2 using an identity.",
  [("11,025", True), ("10,025", False), ("11,025", True), ("10,525", False)],
  "A", 0.45, "(100+5)\u00b2 = 10000 + 1000 + 25 = 11025.")

q("C4.18.8", "8-9",
  "Expand: (2x - 5)(2x + 5)",
  [("4x\u00b2 - 25", True), ("4x\u00b2 + 25", False), ("4x\u00b2 - 10x - 25", False), ("2x\u00b2 - 25", False)],
  "A", 0.35, "Using (a-b)(a+b) = a\u00b2-b\u00b2: (2x)\u00b2 - 5\u00b2 = 4x\u00b2 - 25.")

q("C4.18.8", "8-9",
  "Solve for x: (x+4)/3 = (x-2)/2",
  [("x = 14", False), ("x = 16", True), ("x = 10", False), ("x = 12", False)],
  "B", 0.5, "Cross multiply: 2(x+4) = 3(x-2). 2x+8 = 3x-6. x = 14. Wait: 2(x+4)=3(x-2) -> 2x+8=3x-6 -> 14=x. Actually x=14.")

q("C4.18.8", "8-9",
  "Factorise: x\u00b2 + 5x + 6",
  [("(x+2)(x+3)", True), ("(x+1)(x+6)", False), ("(x+5)(x+1)", False), ("(x-2)(x-3)", False)],
  "A", 0.35, "Find two numbers with product 6 and sum 5: 2 and 3. So (x+2)(x+3).")

q("C4.18.8", "8-9",
  "Using identity, find 998 \u00d7 1002.",
  [("999,996", True), ("1,000,000", False), ("998,000", False), ("999,000", False)],
  "A", 0.5, "(1000-2)(1000+2) = 1000\u00b2 - 4 = 999,996.")

# ═══════════════════════════════════════════════════════════
# C4.18.9 — Algebra Grade 9
# Polynomials, factor theorem, linear equations in 2 vars
# ═══════════════════════════════════════════════════════════

q("C4.18.9", "8-9",
  "Find the value of polynomial p(x) = x\u00b3 - 3x\u00b2 + 2x - 1 at x = 1.",
  [("-1", True), ("1", False), ("0", False), ("-3", False)],
  "A", 0.3, "p(1) = 1 - 3 + 2 - 1 = -1.")

q("C4.18.9", "8-9",
  "Is (x - 2) a factor of x\u00b3 - 4x\u00b2 + x + 6?",
  [("Yes, because p(2) = 0", True), ("No, because p(2) = 4", False),
   ("Yes, because p(0) = 6", False), ("Cannot determine", False)],
  "A", 0.4, "p(2) = 8 - 16 + 2 + 6 = 0. Since p(2)=0, (x-2) is a factor.")

q("C4.18.9", "8-9",
  "Factorise: x\u00b3 + 3x\u00b2 + 3x + 1",
  [("(x+1)\u00b3", True), ("(x+1)(x\u00b2+1)", False), ("(x+1)(x+2)(x+3)", False), ("Cannot be factorised", False)],
  "A", 0.5, "This is the expansion of (a+b)\u00b3 with a=x, b=1.")

q("C4.18.9", "8-9",
  "Solve the system: x + y = 7, x - y = 3",
  [("x=5, y=2", True), ("x=3, y=4", False), ("x=7, y=0", False), ("x=4, y=3", False)],
  "A", 0.35, "Add equations: 2x = 10, x = 5. Substitute: y = 2.")

q("C4.18.9", "8-9",
  "Find the remainder when x\u00b3 + 1 is divided by x + 1.",
  [("0", True), ("1", False), ("2", False), ("-1", False)],
  "A", 0.4, "By remainder theorem: p(-1) = (-1)\u00b3 + 1 = -1 + 1 = 0.")

q("C4.18.9", "8-9",
  "The degree of polynomial 4x\u00b3 - 7x + 2 is:",
  [("3", True), ("4", False), ("2", False), ("1", False)],
  "A", 0.2, "Highest power of x is 3.")

q("C4.18.9", "8-9",
  "If x + y = 10 and xy = 24, find x\u00b2 + y\u00b2.",
  [("52", True), ("76", False), ("100", False), ("48", False)],
  "A", 0.55, "(x+y)\u00b2 = x\u00b2 + 2xy + y\u00b2. So x\u00b2+y\u00b2 = 100 - 48 = 52.")

q("C4.18.9", "8-9",
  "Graph of 2x + 3y = 6 passes through which point?",
  [("(3, 0)", True), ("(0, 3)", False), ("(1, 1)", False), ("(2, 2)", False)],
  "A", 0.35, "Put y=0: 2x=6, x=3. So (3,0) is on the line.")

q("C4.18.9", "8-9",
  "Divide x\u00b3 + 2x\u00b2 - x - 2 by (x - 1). What is the quotient?",
  [("x\u00b2 + 3x + 2", True), ("x\u00b2 + x - 2", False), ("x\u00b2 + 2x + 1", False), ("x\u00b2 - x + 2", False)],
  "A", 0.6, "Long division or synthetic: x\u00b3+2x\u00b2-x-2 = (x-1)(x\u00b2+3x+2).")

# ═══════════════════════════════════════════════════════════
# C4.19.4 — Geometry Grade 4
# 2D shapes, symmetry, tessellations
# ═══════════════════════════════════════════════════════════

q("C4.19.4", "4-5",
  "How many lines of symmetry does a square have?",
  [("4", True), ("2", False), ("1", False), ("8", False)],
  "A", 0.2, "A square has 4 lines of symmetry: 2 diagonal + 2 through midpoints.")

q("C4.19.4", "4-5",
  "Which shape has 3 sides and 3 corners?",
  [("Triangle", True), ("Square", False), ("Pentagon", False), ("Circle", False)],
  "A", 0.1, "A triangle has 3 sides and 3 vertices (corners).")

q("C4.19.4", "4-5",
  "Which letter has a vertical line of symmetry: A, B, F, G?",
  [("A", True), ("B", False), ("F", False), ("G", False)],
  "A", 0.25, "A has a vertical line of symmetry. B has horizontal.")

q("C4.19.4", "4-5",
  "A floor is tiled with squares. This is an example of:",
  [("Tessellation", True), ("Symmetry", False), ("Rotation", False), ("Reflection", False)],
  "A", 0.3, "Tessellation = covering a surface with repeated shapes without gaps.")

q("C4.19.4", "4-5",
  "How many sides does a hexagon have?",
  [("6", True), ("5", False), ("7", False), ("8", False)],
  "A", 0.15, "Hexa = 6. A hexagon has 6 sides.")

q("C4.19.4", "4-5",
  "Which of these shapes can tessellate (tile a floor without gaps)?",
  [("Equilateral triangle", True), ("Circle", False), ("Regular pentagon", False), ("Oval", False)],
  "A", 0.4, "Equilateral triangles can tile a plane. Circles and pentagons cannot.")

q("C4.19.4", "4-5",
  "A rectangle has ____ lines of symmetry.",
  [("2", True), ("4", False), ("1", False), ("0", False)],
  "A", 0.25, "A rectangle has 2 lines of symmetry (horizontal and vertical through center).")

q("C4.19.4", "4-5",
  "Which shape has no straight sides?",
  [("Circle", True), ("Triangle", False), ("Rectangle", False), ("Rhombus", False)],
  "A", 0.1, "A circle has no straight sides — it's a curved shape.")

# ═══════════════════════════════════════════════════════════
# C4.19.5 — Geometry Grade 5
# Angles, triangles, area & perimeter
# ═══════════════════════════════════════════════════════════

q("C4.19.5", "4-5",
  "What is the sum of angles in a triangle?",
  [("180\u00b0", True), ("360\u00b0", False), ("90\u00b0", False), ("270\u00b0", False)],
  "A", 0.15, "The angle sum property: all triangles have angles adding to 180\u00b0.")

q("C4.19.5", "4-5",
  "Find the perimeter of a rectangle with length 8 cm and width 5 cm.",
  [("26 cm", True), ("40 cm", False), ("13 cm", False), ("30 cm", False)],
  "A", 0.2, "Perimeter = 2(l+w) = 2(8+5) = 26 cm.")

q("C4.19.5", "4-5",
  "What type of angle is 120\u00b0?",
  [("Obtuse", True), ("Acute", False), ("Right", False), ("Reflex", False)],
  "A", 0.2, "90\u00b0 < 120\u00b0 < 180\u00b0, so it's obtuse.")

q("C4.19.5", "4-5",
  "Find the area of a rectangle with length 12 cm and width 7 cm.",
  [("84 sq cm", True), ("38 sq cm", False), ("19 sq cm", False), ("96 sq cm", False)],
  "A", 0.25, "Area = length \u00d7 width = 12 \u00d7 7 = 84 sq cm.")

q("C4.19.5", "4-5",
  "A triangle has angles 60\u00b0 and 80\u00b0. What is the third angle?",
  [("40\u00b0", True), ("60\u00b0", False), ("80\u00b0", False), ("20\u00b0", False)],
  "A", 0.25, "180\u00b0 - 60\u00b0 - 80\u00b0 = 40\u00b0.")

q("C4.19.5", "4-5",
  "What is the circumference of a circle with radius 7 cm? (Use \u03c0 = 22/7)",
  [("44 cm", True), ("22 cm", False), ("154 cm", False), ("88 cm", False)],
  "A", 0.4, "C = 2\u03c0r = 2 \u00d7 22/7 \u00d7 7 = 44 cm.")

q("C4.19.5", "4-5",
  "Which 3D shape has 6 rectangular faces?",
  [("Cuboid", True), ("Cylinder", False), ("Cone", False), ("Sphere", False)],
  "A", 0.2, "A cuboid (rectangular box) has 6 rectangular faces.")

q("C4.19.5", "4-5",
  "The net of a cube has how many squares?",
  [("6", True), ("4", False), ("8", False), ("12", False)],
  "A", 0.25, "A cube has 6 faces, so its net has 6 squares.")

# ═══════════════════════════════════════════════════════════
# C4.19.6 — Geometry Grade 6
# Points, lines, angles, triangles, quadrilaterals
# ═══════════════════════════════════════════════════════════

q("C4.19.6", "6-7",
  "Two angles are complementary. If one is 35\u00b0, what is the other?",
  [("55\u00b0", True), ("145\u00b0", False), ("35\u00b0", False), ("90\u00b0", False)],
  "A", 0.2, "Complementary angles add to 90\u00b0. 90 - 35 = 55\u00b0.")

q("C4.19.6", "6-7",
  "Two angles are supplementary. If one is 110\u00b0, what is the other?",
  [("70\u00b0", True), ("250\u00b0", False), ("110\u00b0", False), ("90\u00b0", False)],
  "A", 0.2, "Supplementary angles add to 180\u00b0. 180 - 110 = 70\u00b0.")

q("C4.19.6", "6-7",
  "In a quadrilateral, three angles are 90\u00b0, 80\u00b0, and 100\u00b0. Find the fourth.",
  [("90\u00b0", True), ("80\u00b0", False), ("100\u00b0", False), ("110\u00b0", False)],
  "A", 0.3, "Sum of angles in a quadrilateral = 360\u00b0. 360 - 90 - 80 - 100 = 90\u00b0.")

q("C4.19.6", "6-7",
  "Two lines intersect. One angle formed is 65\u00b0. What is the vertically opposite angle?",
  [("65\u00b0", True), ("115\u00b0", False), ("25\u00b0", False), ("90\u00b0", False)],
  "A", 0.25, "Vertically opposite angles are equal.")

q("C4.19.6", "6-7",
  "An isosceles triangle has two equal sides of 5 cm and a base of 6 cm. What is its perimeter?",
  [("16 cm", True), ("11 cm", False), ("15 cm", False), ("30 cm", False)],
  "A", 0.2, "5 + 5 + 6 = 16 cm.")

q("C4.19.6", "6-7",
  "What is a ray?",
  [("A line that starts at a point and goes on forever in one direction", True),
   ("A line segment with two endpoints", False),
   ("A line that goes forever in both directions", False),
   ("A curved path", False)],
  "A", 0.15, "A ray has one endpoint and extends infinitely in one direction.")

q("C4.19.6", "6-7",
  "A triangle has all three sides different. It is called:",
  [("Scalene", True), ("Isosceles", False), ("Equilateral", False), ("Right", False)],
  "A", 0.2, "Scalene triangle: all three sides are of different lengths.")

q("C4.19.6", "6-7",
  "The exterior angle of a triangle is equal to:",
  [("Sum of the two non-adjacent interior angles", True),
   ("Sum of all three interior angles", False),
   ("The adjacent interior angle", False),
   ("180\u00b0", False)],
  "A", 0.4, "Exterior angle theorem: exterior angle = sum of remote interior angles.")

q("C4.19.6", "6-7",
  "A parallelogram has one angle of 60\u00b0. What are the other three angles?",
  [("120\u00b0, 60\u00b0, 120\u00b0", True), ("60\u00b0, 60\u00b0, 60\u00b0", False),
   ("90\u00b0, 60\u00b0, 150\u00b0", False), ("120\u00b0, 120\u00b0, 60\u00b0", False)],
  "A", 0.35, "Opposite angles equal, adjacent supplementary: 60, 120, 60, 120.")

# ═══════════════════════════════════════════════════════════
# C4.19.7 — Geometry Grade 7
# Congruence, parallel lines, area
# ═══════════════════════════════════════════════════════════

q("C4.19.7", "6-7",
  "Find the area of a triangle with base 10 cm and height 6 cm.",
  [("30 sq cm", True), ("60 sq cm", False), ("16 sq cm", False), ("20 sq cm", False)],
  "A", 0.2, "Area = 1/2 \u00d7 base \u00d7 height = 1/2 \u00d7 10 \u00d7 6 = 30 sq cm.")

q("C4.19.7", "6-7",
  "If two parallel lines are cut by a transversal, alternate interior angles are:",
  [("Equal", True), ("Supplementary", False), ("Complementary", False), ("Unrelated", False)],
  "A", 0.25, "When a transversal cuts parallel lines, alternate interior angles are equal.")

q("C4.19.7", "6-7",
  "Find the area of a circle with radius 7 cm. (Use \u03c0 = 22/7)",
  [("154 sq cm", True), ("44 sq cm", False), ("308 sq cm", False), ("22 sq cm", False)],
  "A", 0.35, "Area = \u03c0r\u00b2 = 22/7 \u00d7 49 = 154 sq cm.")

q("C4.19.7", "6-7",
  "Two triangles are congruent by SAS if:",
  [("Two sides and the included angle are equal", True),
   ("All three sides are equal", False),
   ("Two angles and one side are equal", False),
   ("The areas are equal", False)],
  "A", 0.3, "SAS: Side-Angle-Side. The angle must be between the two sides.")

q("C4.19.7", "6-7",
  "A parallelogram has base 12 cm and height 8 cm. Its area is:",
  [("96 sq cm", True), ("40 sq cm", False), ("20 sq cm", False), ("48 sq cm", False)],
  "A", 0.25, "Area of parallelogram = base \u00d7 height = 12 \u00d7 8 = 96.")

q("C4.19.7", "6-7",
  "In the figure, l || m and a transversal makes an angle of 70\u00b0 with l. The co-interior angle with m is:",
  [("110\u00b0", True), ("70\u00b0", False), ("90\u00b0", False), ("180\u00b0", False)],
  "A", 0.4, "Co-interior angles are supplementary when lines are parallel. 180 - 70 = 110\u00b0.")

q("C4.19.7", "6-7",
  "Which congruence rule does NOT exist?",
  [("AAA", True), ("SSS", False), ("SAS", False), ("ASA", False)],
  "A", 0.35, "AAA (angle-angle-angle) proves similarity, not congruence.")

q("C4.19.7", "6-7",
  "The circumference of a circle is 44 cm. Find its radius. (\u03c0 = 22/7)",
  [("7 cm", True), ("14 cm", False), ("22 cm", False), ("11 cm", False)],
  "A", 0.35, "C = 2\u03c0r. 44 = 2 \u00d7 22/7 \u00d7 r. r = 44 \u00d7 7/44 = 7 cm.")

q("C4.19.7", "6-7",
  "A trapezium has parallel sides 8 cm and 12 cm, height 5 cm. Find its area.",
  [("50 sq cm", True), ("60 sq cm", False), ("40 sq cm", False), ("100 sq cm", False)],
  "A", 0.45, "Area = 1/2 \u00d7 (a+b) \u00d7 h = 1/2 \u00d7 20 \u00d7 5 = 50 sq cm.")

# ═══════════════════════════════════════════════════════════
# C4.19.8 — Geometry Grade 8
# Quadrilaterals, Pythagoras, surface area & volume
# ═══════════════════════════════════════════════════════════

q("C4.19.8", "8-9",
  "A right triangle has legs 3 cm and 4 cm. Find the hypotenuse.",
  [("5 cm", True), ("7 cm", False), ("6 cm", False), ("12 cm", False)],
  "A", 0.2, "Pythagoras: 3\u00b2 + 4\u00b2 = 9 + 16 = 25. \u221a25 = 5 cm.")

q("C4.19.8", "8-9",
  "Find the volume of a cuboid with dimensions 5 cm \u00d7 4 cm \u00d7 3 cm.",
  [("60 cu cm", True), ("12 cu cm", False), ("94 cu cm", False), ("47 cu cm", False)],
  "A", 0.2, "Volume = l \u00d7 w \u00d7 h = 5 \u00d7 4 \u00d7 3 = 60 cu cm.")

q("C4.19.8", "8-9",
  "The diagonals of a rhombus are 10 cm and 24 cm. Find its area.",
  [("120 sq cm", True), ("240 sq cm", False), ("34 sq cm", False), ("60 sq cm", False)],
  "A", 0.35, "Area = 1/2 \u00d7 d\u2081 \u00d7 d\u2082 = 1/2 \u00d7 10 \u00d7 24 = 120.")

q("C4.19.8", "8-9",
  "Find the surface area of a cube with side 6 cm.",
  [("216 sq cm", True), ("36 sq cm", False), ("72 sq cm", False), ("144 sq cm", False)],
  "A", 0.3, "SA = 6a\u00b2 = 6 \u00d7 36 = 216 sq cm.")

q("C4.19.8", "8-9",
  "A ladder 10 m long leans against a wall. Its foot is 6 m from the wall. How high does it reach?",
  [("8 m", True), ("4 m", False), ("16 m", False), ("12 m", False)],
  "A", 0.35, "h\u00b2 + 6\u00b2 = 10\u00b2. h\u00b2 = 100-36 = 64. h = 8 m.")

q("C4.19.8", "8-9",
  "Find the volume of a cylinder with radius 7 cm and height 10 cm. (\u03c0 = 22/7)",
  [("1540 cu cm", True), ("440 cu cm", False), ("770 cu cm", False), ("3080 cu cm", False)],
  "A", 0.4, "V = \u03c0r\u00b2h = 22/7 \u00d7 49 \u00d7 10 = 1540 cu cm.")

q("C4.19.8", "8-9",
  "In a quadrilateral ABCD, if AB || CD, it is definitely a:",
  [("Trapezium", True), ("Parallelogram", False), ("Rectangle", False), ("Rhombus", False)],
  "A", 0.3, "One pair of parallel sides = trapezium. Need both pairs for parallelogram.")

q("C4.19.8", "8-9",
  "The total surface area of a cylinder with r=3 cm and h=7 cm is: (\u03c0 = 22/7)",
  [("188.57 sq cm", False), ("132 sq cm", False), ("60\u03c0 sq cm", True), ("42\u03c0 sq cm", False)],
  "C", 0.55, "TSA = 2\u03c0r(r+h) = 2\u03c0\u00d73\u00d710 = 60\u03c0 sq cm.")

# ═══════════════════════════════════════════════════════════
# C4.19.9 — Geometry Grade 9
# Euclid, triangle proofs, circles, constructions, Heron's
# ═══════════════════════════════════════════════════════════

q("C4.19.9", "8-9",
  "Using Heron's formula, find the area of a triangle with sides 5, 6, 7 cm. (s=9)",
  [("6\u221a6 sq cm", True), ("21 sq cm", False), ("15 sq cm", False), ("18 sq cm", False)],
  "A", 0.5, "s=9. Area = \u221a(9\u00d74\u00d73\u00d72) = \u221a216 = 6\u221a6.")

q("C4.19.9", "8-9",
  "The angle subtended by a diameter at any point on the circle is:",
  [("90\u00b0", True), ("180\u00b0", False), ("60\u00b0", False), ("45\u00b0", False)],
  "A", 0.25, "Angle in a semicircle is always 90\u00b0 (Thales' theorem).")

q("C4.19.9", "8-9",
  "To construct a 60\u00b0 angle, you need:",
  [("Compass and straightedge only", True), ("Protractor only", False),
   ("Set square only", False), ("Calculator", False)],
  "A", 0.2, "Draw an arc from vertex, then same radius from intersection point. Connect for 60\u00b0.")

q("C4.19.9", "8-9",
  "In a circle, equal chords are:",
  [("Equidistant from the centre", True), ("Parallel to each other", False),
   ("Perpendicular to each other", False), ("Of different lengths", False)],
  "A", 0.3, "Equal chords of a circle are equidistant from the centre.")

q("C4.19.9", "8-9",
  "Euclid's 5th postulate is about:",
  [("Parallel lines", True), ("Right angles", False), ("Circle properties", False), ("Triangles", False)],
  "A", 0.3, "The 5th postulate (parallel postulate) deals with the uniqueness of parallel lines.")

q("C4.19.9", "8-9",
  "The angle subtended by an arc at the centre is ____ the angle at any point on the remaining circle.",
  [("Double", True), ("Half", False), ("Equal to", False), ("Triple", False)],
  "A", 0.35, "Central angle = 2 \u00d7 inscribed angle (for the same arc).")

q("C4.19.9", "8-9",
  "In triangle ABC, if AB = AC and angle A = 40\u00b0, find angle B.",
  [("70\u00b0", True), ("40\u00b0", False), ("80\u00b0", False), ("100\u00b0", False)],
  "A", 0.3, "Isosceles: B = C. A + B + C = 180. 40 + 2B = 180. B = 70\u00b0.")

q("C4.19.9", "8-9",
  "A triangle has sides 8 cm, 15 cm, 17 cm. Is it a right triangle?",
  [("Yes, because 8\u00b2 + 15\u00b2 = 17\u00b2", True),
   ("No, the sides are too different", False),
   ("Yes, because 8 + 15 > 17", False),
   ("Cannot determine", False)],
  "A", 0.35, "64 + 225 = 289 = 17\u00b2. Satisfies Pythagoras, so it's a right triangle.")

q("C4.19.9", "8-9",
  "Using Heron's formula, find the area of an equilateral triangle with side 10 cm.",
  [("25\u221a3 sq cm", True), ("50 sq cm", False), ("100 sq cm", False), ("50\u221a3 sq cm", False)],
  "A", 0.5, "s=15. Area = \u221a(15\u00d75\u00d75\u00d75) = 25\u221a3.")


# ═══════════════════════════════════════════════════════════
# Fix C4.18.8 duplicate correct answer
# ═══════════════════════════════════════════════════════════

# Fix the (x+4)/3 = (x-2)/2 question
for q_item in QUESTIONS:
    if q_item["text"] == "Solve for x: (x+4)/3 = (x-2)/2":
        q_item["options"] = [
            {"label": "A", "text": "x = 14", "is_correct": True},
            {"label": "B", "text": "x = 16", "is_correct": False},
            {"label": "C", "text": "x = 10", "is_correct": False},
            {"label": "D", "text": "x = 12", "is_correct": False},
        ]
        q_item["correct_answer"] = "A"
        q_item["explanation"] = "Cross multiply: 2(x+4) = 3(x-2). 2x+8 = 3x-6. 14 = x."


if __name__ == "__main__":
    # Count per competency
    from collections import Counter
    counts = Counter(q["competency_id"] for q in QUESTIONS)
    total = len(QUESTIONS)
    print(f"Generated {total} questions across {len(counts)} competencies:\n")
    for cid, count in sorted(counts.items()):
        print(f"  {cid:12s} {count}")

    # Write to file
    with open("seed/questions_math_new.json", "w") as f:
        json.dump(QUESTIONS, f, indent=2, ensure_ascii=False)
    print(f"\nWritten to seed/questions_math_new.json")
