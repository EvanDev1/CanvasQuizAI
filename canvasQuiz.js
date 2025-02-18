const YOUR_API_KEY = "OpenAI API key yada yada"

async function getOpenAIResponse(prompt) {
  const apiKey = YOUR_API_KEY;
  // const model = "gpt-3.5-turbo-0125";
  const model = "gpt-4o";

  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      messages: [{ role: "user", content: prompt }],
    }),
  };

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", requestOptions);
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error:", error);
    return "An error occurred while fetching the response.";
  }
}

const getQuestionsData = (questions) => {
  let questionsData = [];

  questions.forEach((question) => {
    const questionText = question.querySelector(".question_text").innerHTML.trim();

    const answers = [];
    let answerDivs = question.querySelectorAll(".answer_label");
    for (let answer of answerDivs) {
      answers.push(answer.innerHTML.trim());
    }

    const questionObj = {
      question: questionText,
      answers: answers,
    };

    questionsData.push(questionObj);
  });

  return questionsData;
};

const createChatPrompt = (questionsData) => {
  let prompt = "";
  for (let question of questionsData) {
    prompt += `Question: "${question.question}"\n`;
    let answers_text = "Answers: ";
    for (let answer of question.answers) {
      answers_text += ` "${answer}",`;
    }
    prompt += answers_text;
    prompt += "\n";
  }
  return prompt;
};

const trueFalsePrompt =
  "Pretend you are a student taking a test in Utah. When you answer each question, do not respond with the question number, question, or incorrect answers. You should ONLY respond with the correct answer (which is chosen from the best answer of the answers provided for each question) on a new line for each question. Answer the following questions:";

const solveTrueFalseQuestions = async (questions) => {
  const questionsData = getQuestionsData(questions);
  let prompt = trueFalsePrompt + "\n" + createChatPrompt(questionsData);

  const response = await getOpenAIResponse(prompt);
  const chatAnswers = response.split("\n");
  questions.forEach((question, questionIndex) => {
    const answerDivs = question.querySelectorAll(".answer");
    const chatAnswer = chatAnswers[questionIndex];

    let correctAnswer;
    for (let answer of answerDivs) {
      const answerText = answer.querySelector(".answer_label").innerHTML.trim();
      if (answerText.toLowerCase() == chatAnswer.toLowerCase()) {
        correctAnswer = answer;
        break;
      }
    }

    if (correctAnswer) {
      const input = correctAnswer.querySelector(".question_input");
      input.checked = true;
    }
  });
};

const multipleChoicePrompt = `Pretend you are a student taking a test in Utah. You have to correctly answer the following questions with 100% accuracy to pass the test. Each question has multiple answers, and you must choose the answer that best answers the question. When providing an answer do not respond with the question number, question, incorrect answers, or other answers. ONLY provide the correct answer. Provide each answer on a new line for each question. There should be one answer for each question on the test, meaning if there are 3 questions you will provide 3 answers each on a new line, 5 questions and you will provide 5 answers each on a new line, etc.`;
const solveMultipleChoiceQuestions = async (questions) => {
  const questionsData = getQuestionsData(questions);
  const prompt = multipleChoicePrompt + "\n" + createChatPrompt(questionsData);

  const response = await getOpenAIResponse(prompt);

  const chatAnswers = response.split("\n");
  questions.forEach((question, questionIndex) => {
    const answerDivs = question.querySelectorAll(".answer");
    const chatAnswer = chatAnswers[questionIndex];

    let correctAnswer;
    for (let answer of answerDivs) {
      const answerText = answer.querySelector(".answer_label").innerHTML.trim();
      if (answerText.toLowerCase() == chatAnswer.toLowerCase()) {
        correctAnswer = answer;
        break;
      }
    }

    if (correctAnswer) {
      const input = correctAnswer.querySelector(".question_input");
      input.checked = true;
    } else {
      console.log("Couldn't find the answer for a question!");
    }
  });
};

const checkboxPrompt = `Pretend you are a student taking a test in Utah. You are on the checkbox part of the exam. You have to correctly answer the following questions with 100% accuracy to pass the test. Each question has multiple answers. Each question has multiple correct answers. You must select all answers that are correct. When providing a list of correct answers, do not respond with the question number, question, or incorrect answers. ONLY provide the correct answers. Provide each list of correct answers on a new line for each question. Separate each answer by a closing bracket and space like so: This is answer 1] this is the second answer] etc. Remember, not all of the answers provided are correct. As a student taking this test you must decide which of the answers provided are correct, and provide those as answers. You must not leave gaps/open lines between question answer lists.`;

const solveCheckboxQuestions = async (questions) => {
  const questionsData = getQuestionsData(questions);
  const prompt = checkboxPrompt + "\n" + createChatPrompt(questionsData);

  const response = await getOpenAIResponse(prompt);
  const chatAnswers = response.split("\n");
  questions.forEach((question, questionIndex) => {
    const answerDivs = question.querySelectorAll(".answer");
    const chatAnswer = chatAnswers[questionIndex];

    const correctAnswers = chatAnswer.split(`]`);
    answerDivs.forEach((answer, answerIndex) => {
      const answerText = answer.querySelector(".answer_label").innerHTML.trim();
      let match = false;
      for (let ans of correctAnswers) {
        if (ans.trim().toLowerCase() == answerText.toLowerCase()) {
          match = true;
        }
      }

      const input = answer.querySelector(".question_input");
      if (input) {
        if (match == true) {
          input.checked = true;
        } else {
          input.checked = false;
        }
      } else {
        console.log("Couldnt finish question");
      }
    });
  });
};

const solveMatchingQuestions = async (questions) => {
  questions.forEach(async (question) => {
    const selectTag = question.querySelector("select");
    const optionTags = selectTag.querySelectorAll("option");
    answers = [];
    optionTags.forEach((option, optionIndex) => {
      if (optionIndex > 0) {
        answers.push(option.innerHTML.trim());
      }
    });

    const labelTags = question.querySelectorAll("label");
    let questionsText = [];
    labelTags.forEach((label) => {
      questionsText.push(label.innerHTML.trim());
    });

    let prompt =
      "Pretend you are a genius student taking a test in Utah. You must get 100% on the test to pass. This part of the exam is a matching exam, you match each question with the correct answer from the list of answers provided. For each question, match it with the correct answer. There is only one correct answer per question, choose the answer that best matches the question. When providing a list of answers, do not respond with the question number, question, or incorrect answers. ONLY provide the correct answer. Provide the correct answer EXACTLY how it was given to you, if there was no punctuation in the correct answer, do not add punctuation, it should be character for character, letter for letter, the EXACT same as it was given to you. Provide each correct answer on a new line.";
    prompt += "\nAnswers:\n";
    answers.forEach((ans) => {
      prompt += `${ans}\n`;
    });

    questionsText.forEach((q) => {
      prompt += `Question: ${q}\n`;
    });

    const response = await getOpenAIResponse(prompt);
    const chatAnswers = response.split("\n");
    const selectMenus = question.querySelectorAll("select");
    selectMenus.forEach((select, index) => {
      const correctAns = chatAnswers[index].toLowerCase().trim();

      // loop through each option to find the right one
      select.querySelectorAll("option").forEach((option, i) => {
        if (i > 0) {
          if (correctAns == option.innerHTML.trim().toLowerCase()) {
            select.value = option.value;
          }
        }
      });
    });
  });
};

const solveQuestions = async () => {
  const questionDivs = document.querySelectorAll("#questions .question_holder .question");

  let trueFalseQuestions = [];
  let multipleChoiceQuestions = [];
  let checkboxQuestions = [];
  let matchingQuestions = [];

  questionDivs.forEach(function (question) {
    if (question.classList.contains("true_false_question")) {
      trueFalseQuestions.push(question);
    } else if (question.classList.contains("multiple_choice_question")) {
      multipleChoiceQuestions.push(question);
    } else if (question.classList.contains("multiple_answers_question")) {
      checkboxQuestions.push(question);
    } else if (question.classList.contains("matching_question")) {
      matchingQuestions.push(question);
    } else {
      console.log("Unknown question type");
    }
  });

  await solveTrueFalseQuestions(trueFalseQuestions);
  await solveMultipleChoiceQuestions(multipleChoiceQuestions);
  await solveCheckboxQuestions(checkboxQuestions);
  await solveMatchingQuestions(matchingQuestions);
  console.log("Automatically filled out the correct answers for each question!!");
};

(async () => {
  await solveQuestions();
})();
