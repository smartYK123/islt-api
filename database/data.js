const questions = [
  {
    id: 1,
    question:
      "1. Mystery Quiz Part 1- Select the answer to the hint given in the video on Notifications",
    options: ["DO RAY ME", "BETA", "CTA", "DR."],
    correctIndex: 2,
  },
  {
    id: 2,
    question:
      "2. Mystery Quiz Part 2: What is the original source material for creation?",
    options: ["Sand", "Water", "Sound", "Wind"],
    correctIndex: 2,
  },
  {
    id: 3,
    question:
      "3.	What color is transmission fluid typically when it’s in good condition?",
    options: ["Clear", "Black", "Red", "Brown"],
    correctIndex: 2,
  },
  {
    id: 4,
    question: "4. Pick the odd one out.",
    options: ["Administration", "Strategizing", "Coordinating", "Presenting"],
    correctIndex: 3,
  },
  {
    id: 5,
    question: "5. Which statement is correct?",
    options: [
      "Rhema is man's word spoken by God",
      "Health and finances is not a reward for serving God faithfully",
      "Rhema is God’s word spoken by Him",
      "Health and finances are a reward for serving God faithfully",
    ],
    correctIndex: 1,
  },
  {
    id: 6,
    question:
      "6. Which of these countries has more lakes than the rest of the world combined?",
    options: ["Antarctica", "Iceland", "Himalayas", "Canada"],
    correctIndex: 3,
  },
  {
    id: 7,
    question: "7. Pick the odd one out.",
    options: ["Courses", "Varieties", "Custom", "Events"],
    correctIndex: 3,
  },
  {
    id: 8,
    question: "8. According to Romans 16:17, who is to be marked and avoided?",
    options: [
      "Those who sin openly",
      "Those who lack zeal",
      "Those who cause divisions and offences contrary to doctrine",
      "Those who are spiritually immature",
    ],
    correctIndex: 2,
  },
  {
    id: 9,
    question:
      "9. Which of the following is correct about the first resurrection?",
    options: [
      "The first resurrection has only one rapture",
      "The first resurrection is for those not found in the Book of Life",
      "The first resurrection has series of raptures",
      "A time, times and half a time separates the first and second resurrection",
    ],
    correctIndex: 2,
  },
  {
    id: 10,
    question:
      "10. Adam gave Ben some oranges. Then he gave twice that number to Clara. He ate one, lost two , and now has only 1 orange left. How many oranges did he give to Ben?",
    options: ["1", "2", "3", "4"],
    correctIndex: 1,
  },
  {
    id: 11,
    question:
      "11. With reference to the image of Nebuchadnezzar's dream, what do the legs of iron represent?",
    options: ["Rome", "Europe", "Lion", "The Babylon Empire"],
    correctIndex: 0,
  },
  {
    id: 12,
    question:
      "12. How will the armies who were deceived by the devil after the millennial reign of Christ be destroyed?",
    options: ["Flood", "Fire from heaven", "Thunderstorm", "Earthquake"],
    correctIndex: 1,
  },
  {
    id: 13,
    question:
      "13. What Hebrew word is used in the Old Testament to describe the grace or kindness of God?",
    options: ["Shalom", "Torah", "Chesed", "Elohim"],
    correctIndex: 2,
  },
  {
    id: 14,
    question:
      "14. How many demons did it take to assemble the whole world to Armageddon?",
    options: ["1", "2", "3", "4"],
    correctIndex: 2,
  },
  {
    id: 15,
    question: "15. What does God want when you are productive?",
    options: [
      "To produce even more",
      "To maintain associations",
      "To focus on distractions",
      "None of the above",
    ],
    correctIndex: 0,
  },
  {
    id: 16,
    question: "16. From the book of Daniel, 70 weeks refers to _______",
    options: ["70 years", "49 years", "700 years", "490 years"],
    correctIndex: 3,
  },
  {
    id: 17,
    question:
      "17. When referencing the garments of the priests and Levites, what point was the host of Day 3 illustrating?",
    options: [
      "The need for cultural expression",
      "God’s deep interest in design and detail",
      "The evolution of ancient fashion",
      "The functionality of priestly garments",
    ],
    correctIndex: 1,
  },
  {
    id: 18,
    question: "18. According to Psalm 90:12, what are we being taught to do?",
    options: [
      "Work harder than others",
      "Number our days to apply our hearts unto wisdom",
      "Prepare for the coming of the Lord",
      "Pray without ceasing",
    ],
    correctIndex: 1,
  },
  {
    id: 19,
    question: "19. Which of these is a red flag when visiting a website?",
    options: [
      "It loads quickly and looks colorful",
      "The URL is slightly misspelled",
      "It shows pop-ups offering subscription discounts",
      "It uses cookies to track usage",
    ],
    correctIndex: 1,
  },
  {
    id: 20,
    question:
      "20. Which of the following can contribute to the development of fungal infections?",
    options: [
      "Cold temperatures and loose clothing",
      "Tight clothing and humidity",
      "Dry skin and sunscreen use",
      "Frequent showering and air conditioning",
    ],
    correctIndex: 1,
  },
];


const answers = questions.map((q) => q.correctIndex);

const convertToLetters = (answers) => {
  const letters = ["A", "B", "C", "D"];
  return answers.map((num) => letters[num]);
};
const title = "STAFF WEEK";
module.exports = {
  questions,
  answers,
  convertToLetters,
  title
};
