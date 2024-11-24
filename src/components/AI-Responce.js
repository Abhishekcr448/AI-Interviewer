// Function to call the Deepseek API
async function callDeepseek(model = "deepseek-chat", message, stream = false, max_tokens = 16, temperature = 0.7) {
    const deepSeekApiKey = process.env.REACT_APP_DEEPSEEK_API_KEY;

    return fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${deepSeekApiKey}`,
        },
        body: JSON.stringify({
            model: model,
            messages: message,
            stream: stream,
            max_tokens: max_tokens,
            temperature: temperature,
        }),
    });
}

// Function to stream responses from the Deepseek API
async function streamDeepseek(model = "deepseek-chat", message, onStreamUpdate, max_tokens = 30, temperature = 0.7, prevMessages, onLoadingUpdate) {
    try {
        // Call the Deepseek API with streaming enabled
        const response = await callDeepseek(model, message, true, max_tokens, temperature);
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }

        // Read the response stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let aiMessage = { role: 'assistant', content: '' };

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim() !== '');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const jsonLine = line.replace('data: ', '');
                    if (jsonLine !== '[DONE]') {
                        const parsed = JSON.parse(jsonLine);
                        if (parsed.choices[0].delta.content) {
                            aiMessage.content += parsed.choices[0].delta.content;
                            onStreamUpdate([...prevMessages, aiMessage]);
                        }
                    }
                }
            }
        }

        onLoadingUpdate(false);
    } catch (error) {
        console.error('Error:', error.message);
        const errorMessage = { role: 'assistant', content: 'Sorry, something went wrong: ' + error.message };
        onStreamUpdate([errorMessage]);
    }
}

// Function to get the summary of the conversation
const getSummary = async (messages, pastSummary, questionText, type) => {
    // Define the system prompt for the summary update
    let systemPrompt = {
        role: "system",
        content: "You are an SDE Expert. Your task is to update the existing summary based on the user's response to the assistant's question. Include any new information while focusing on updating the summary without re-summarizing the entire conversation. Avoid extraneous details."
    };

    // Get the last few messages for context
    let lastMessages = messages.slice(-4, -2);

    // Define the user prompt for the summary update
    let SummaryMessage = {
        role: "user",
        content: `Please update the summary of the conversation between the assistant and the user using the previous summary for the following question. ` +
            (type === "coding" ?
                `Analyze the current situation regarding the coding question, focusing on the approach, the coding itself, or the final output. ` :
                '') +
            `\n\nQuestion: ${questionText}\n\nPrevious Summary: ${pastSummary}\n\nLast Responses:\n${lastMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n')}\n\nProvide only the updated summary, ensuring it is concise, accurate, and does not exceed 30 words.`
    };

    // Combine system and user prompts into a message array
    let message = [systemPrompt, SummaryMessage];

    // Call the Deepseek API to get the updated summary
    const response = await callDeepseek("deepseek-chat", message, false, 50, 0.7);
    if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
    }

    // Parse and return the updated summary
    const data = await response.json();
    return data.choices[0].message.content;
}

// Function to describe questions to the candidate
export const describeQuestions = async (questionObject, questionIndex, onStreamUpdate, onLoadingUpdate) => {
    let prevMessages = [];

    // Define the system prompt for the interviewer
    let systemPrompt = {
        role: "system",
        content: "You are an Interviewer with an AI-related name, but you should only reveal your name if specifically asked. Start by warmly welcoming the candidate to the Software Development Engineer (SDE) interview and express that you hope they are prepared. Next, clearly and simply ask the following question. Make sure not to give any hints or solutions. Do not include anything else in your response."
    };

    // Define the user prompt for the question
    let QuestionMessage = {
        role: "user",
        content: questionIndex === 0
            ? `Welcome the candidate for the SDE Interview within 30 words and ask this Question: ${questionObject.question}`
            : questionObject.type === 'theory'
                ? `Welcome the candidate for the next question, by saying something similar to "Moving on to the next question" within 30 words and ask this Question: ${questionObject.question}`
                : `Welcome the candidate for the next question, by saying something similar to "Moving on to the next question" within 30 words and ask the approach to the user for the Question: ${questionObject.question}`
    };

    // Combine system and user prompts into a message array
    let message = [systemPrompt, QuestionMessage];
    let model = questionObject.type === "theory" ? "deepseek-chat" : "deepseek-coder";

    // Call the Deepseek API to stream the question to the candidate
    streamDeepseek(model, message, onStreamUpdate, 50, 0.7, prevMessages, onLoadingUpdate);
}

// Function to get the summary of the user's code compared to the expected solution
export const getCodeSummary = async (question, UserCode, expectedCode) => {
    // Define the system prompt for the code comparison
    let systemPrompt = {
        role: "system",
        content: "You are an SDE Expert. Your task is to compare the code provided by the user with the expected solution code for the question. Identify both similarities and differences, and provide specific, actionable feedback. If the programming languages of the user code and the expected solution differ, highlight potential translation issues and offer guidance on how to adapt the code accordingly. Avoid unnecessary details."
    };

    // Define the user prompt for the code comparison
    let SummaryMessage = {
        role: "user",
        content: `Compare the user code with the expected solution code and analyze how closely the user’s implementation aligns with the expected solution. If the user's solution output is correct, acknowledge it; otherwise, point out the weaknesses in the user's code. If the user's code is correct but has poor time complexity, specify that clearly.\n\nQuestion: ${question}\n\nUser Code: ${UserCode}\n\nExpected Solution Code: ${expectedCode}\n\nEnsure the analysis is concise, accurate, and does not exceed 30 words.`
    };

    // Combine system and user prompts into a message array
    let message = [systemPrompt, SummaryMessage];

    // Call the Deepseek API to get the code summary
    const response = await callDeepseek("deepseek-coder", message, false, 50, 0.7);
    if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
    }

    // Parse and return the code summary
    const data = await response.json();
    return data.choices[0].message.content;
}

// Function to call the OpenAI API
async function callOpenAI(model = "gpt-4o-mini", messages, max_tokens = 300) {
    const openAIKey = process.env.REACT_APP_CHATGPT_API_KEY;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openAIKey}`,
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                max_tokens: max_tokens,
            }),
        });

        if (!response.ok) {
            const errorDetails = await response.text();
            throw new Error(`Network response was not ok: ${response.statusText}, Details: ${errorDetails}`);
        }

        // Parse and return the response JSON
        return await response.json();
    } catch (error) {
        console.error('Error calling OpenAI API:', error);
        throw error;
    }
}

// Function to get the summary of an image
export const getImageSummary = async (question, imageData) => {
    // Determine the image format
    const imageFormat = 'png';

    // Prepare the message for the OpenAI API
    let messages = [
        {
            role: "user",
            content: [
                {
                    type: "text",
                    text: "Summarize the image in less than 50 words. Explain the key elements, context, and any relevant details. Also, inform whether the image is relevant to the question or not. Question: " + question
                },
                {
                    type: "image_url",
                    image_url: {
                        url: `data:image/${imageFormat};base64,${imageData}`,
                        detail: "low"
                    }
                }
            ]
        }
    ];

    // Call OpenAI API with the prepared message
    const response = await callOpenAI("gpt-4o-mini", messages, 300);

    // Return the summary text
    return response.choices[0].message.content;
};

// Function to send a message and handle the response
export const sendMessage = async (messages, input, onStreamUpdate, questionObject, summary, onSummaryUpdate, questionIndex, onLoadingUpdate, userCode, templateCode, drawingData) => {
    try {
        // Add the user's message to the conversation
        const userMessage = { role: 'user', content: input };
        let prevMessages = [...messages, userMessage];
        let codeSummary = '';
        let imageSummary = 'No Image Summary';
        onStreamUpdate(prevMessages);

        // Update the summary if there are enough messages
        if (prevMessages.length >= 4) {
            let updatedSummary = [...summary];
            let CurrentChatSummary = await getSummary(prevMessages, summary[questionIndex], questionObject.question, questionObject.type);
            updatedSummary[questionIndex] = CurrentChatSummary;
            onSummaryUpdate(updatedSummary);
            summary = updatedSummary;
        }

        // Get the code summary if the question is a coding question
        if (questionObject.type === "coding") {
            codeSummary = await getCodeSummary(questionObject.question, userCode, questionObject.code);
        }

        // Get the image summary if the question involves drawing and drawing data is provided
        if (questionObject.type === "drawing" && drawingData) {
            imageSummary = await getImageSummary(questionObject.question, drawingData);
        }

        // Define the system prompt for the AI response
        let systemPrompt = {
            role: "system",
            content: "As an SDE interviewer, stay polite and provide minimal hints. React to the candidate’s responses by appreciating good answers, asking clarifying questions if needed, and moving on if they struggle. Deny answers or solutions if requested. Address inappropriate behavior professionally. If the candidate performs well, ask for more detail. Consider the existing summary of all previous messages when crafting your response."
        };

        // Get the last few messages for context
        let lastMessages = prevMessages.slice(-2);

        // Define the user prompt for the AI response
        let userPromptBase = {
            role: "user",
            content: `Respond to the candidate's answer in under 50 words. Follow these guidelines: ` +
                `Appreciate good answers, ask clarifying questions if needed, and move on if they struggle. Deny answers or solutions if requested. Address inappropriate behavior professionally. If the candidate performs well, ask for more detail. Do not provide any answers to the question.\n\nInterviewer Question: ${questionObject.question}\n\nExisting Summary: ${summary[questionIndex]}\n\nLast Responses:\n${lastMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n')}`
        };

        // Add specific instructions for coding questions
        if (questionObject.type === "coding") {
            userPromptBase.content +=
                `\n\nAnalyze the code analysis and provide hints if needed to help the user reach the correct code. If the approach is already correct, ask them to implement the code in the console.\n\nCode Analysis: ${codeSummary}`;
        }

        // Add specific instructions for drawing questions
        if (questionObject.type === "drawing") {
            userPromptBase.content +=
                `\n\nAnalyze the image summary and provide hints if needed to help the user reach the correct answer. If the approach is already correct, ask them to continue to the next question or add some more details to the architecture.\n\nImage Summary: ${imageSummary}`;
        }

        let userPrompt = userPromptBase;

        // Combine system and user prompts into a message array
        let message = [systemPrompt, userPrompt];
        let model = "deepseek-chat";

        // Call the Deepseek API to stream the response
        streamDeepseek(model, message, onStreamUpdate, 100, 0.7, prevMessages, onLoadingUpdate);

    } catch (error) {
        console.error('Error:', error.message);
        const errorMessage = { role: 'assistant', content: 'Sorry, something went wrong. ' + error.message };
        onStreamUpdate([...messages, errorMessage]);
    }
};

// Function to get a complete analysis of the interview
export const getCompleteAnalysis = async (questionSet, allChats, allCodes) => {
    let completeAnalysis = {
        overall: "",
        "overall-communication-skills": "",
        "overall-theory-skills": "",
        "overall-coding-skills": "",
        questionSet: []
    };

    for (let i = 0; i < questionSet.length; i++) {
        const question = questionSet[i];
        const chatData = allChats[i];
        const questionType = question.type;

        // Initialize question analysis object
        const questionAnalysis = {
            overall: "",
            "overall-communication-skills": "",
            "overall-theory-skills": "",
            "overall-coding-skills": "",
            question: question.question,
            type: questionType,
            conversation: [],
            userCode: questionType === "coding" ? allCodes[i] : undefined,
            expectedCode: questionType === "coding" ? question.code : undefined,
            Solution: questionType === "coding" ? question.solutionText : undefined
        };

        // Process conversations in pairs
        if (chatData) {
            for (let j = 0; j < chatData.length; j += 2) {
                if (j + 1 < chatData.length) {
                    const assistant = chatData[j];
                    const user = chatData[j + 1];

                    const systemPrompt = {
                        role: "system",
                        content: "You are a master-level SDE. Analyze the conversation and provide the expected response."
                    };

                    const QuestionMessage = {
                        role: "user",
                        content: `Analyze the conversation based on the question posed. Provide the expected output that the user should have given in less than 20 words. Do not print anything else other than the expected response for the user.\n\nPrimary Question: ${question.question}\n\nAssistant: ${assistant.content}\n\nUser: ${user.content}`
                    };

                    const message = [systemPrompt, QuestionMessage];
                    const expectedResponse = await callDeepseek("deepseek-chat", message, false, 50, 0.7);

                    if (!expectedResponse.ok) {
                        throw new Error(`Network response was not ok: ${expectedResponse.statusText}`);
                    }

                    const data = await expectedResponse.json();
                    questionAnalysis.conversation.push({ assistant: assistant.content, user: user.content, expectedOutput: data.choices[0].message.content });
                }
            }
        }

        // Get code analysis if applicable
        let codeAnalysis = '';
        if (questionType === "coding") {
            codeAnalysis = await getCodeSummary(question.question, allCodes[i], question.code);
        }

        // Summary of the user's performance
        const summarySystemPrompt = {
            role: "system",
            content: "You are a master-level SDE. Provide a comprehensive summary of all interactions."
        };

        const summaryMessage = {
            role: "user",
            content: `Analyze the conversation and summarize the user's performance in less than 20 words.${questionType === "coding" ? ` Analyze the code: ${codeAnalysis}` : ''}\n\nPrimary Question: ${question.question}\n\nInterview Conversation:\n${questionAnalysis.conversation.map(conv => `Assistant: ${conv.assistant}\nUser: ${conv.user}\nExpected Output: ${conv.expectedOutput}`).join('\n\n')}`
        };

        const summaryResponse = await callDeepseek("deepseek-chat", [summarySystemPrompt, summaryMessage], false, 50, 0.7);
        if (!summaryResponse.ok) {
            throw new Error(`Network response was not ok: ${summaryResponse.statusText}`);
        }

        const performanceSummary = await summaryResponse.json();
        questionAnalysis.overall = performanceSummary.choices[0].message.content;

        // Rating the user's skills
        const ratingSystemPrompt = {
            role: "system",
            content: "You are a master-level SDE. Rate the user's skills from 1 to 10."
        };

        const ratingMessage = {
            role: "user",
            content: `Rate the user's communication skills, theoretical skills, and coding skills on a scale from 1 to 10. Expected Output Format: 8 9 7. Do not print anything else.\n\nPrimary Question: ${question.question}\n\nInterview Conversation:\n${questionAnalysis.conversation.map(conv => `Assistant: ${conv.assistant}\nUser: ${conv.user}\nExpected Output: ${conv.expectedOutput}`).join('\n\n')}`
        };

        const ratingResponse = await callDeepseek("deepseek-chat", [ratingSystemPrompt, ratingMessage], false, 50, 0.7);
        if (!ratingResponse.ok) {
            throw new Error(`Network response was not ok: ${ratingResponse.statusText}`);
        }
        const ratingData = await ratingResponse.json();
        let ratings = ratingData.choices[0].message.content.split(' ').map(Number);
        Object.assign(questionAnalysis, {
            "overall-communication-skills": ratings[0],
            "overall-theory-skills": ratings[1],
            "overall-coding-skills": ratings[2]
        });

        completeAnalysis.questionSet.push(questionAnalysis);
    }

    // Final overall performance summary
    const finalSystemPrompt = {
        role: "system",
        content: "You are a master-level SDE. Summarize the overall performance of the user."
    };

    const finalMessage = {
        role: "user",
        content: `Analyze the entire interview conversation and summarize the user's overall performance in less than 20 words. Do not print anything else other than the overall performance text.\n\nInterview Questions:\n${questionSet.map(q => q.question).join('\n')}`
    };

    const finalResponse = await callDeepseek("deepseek-chat", [finalSystemPrompt, finalMessage], false, 50, 0.7);
    if (!finalResponse.ok) {
        throw new Error(`Network response was not ok: ${finalResponse.statusText}`);
    }

    completeAnalysis.overall = (await finalResponse.json()).choices[0].message.content;

    // Calculate averages
    const skillTotals = completeAnalysis.questionSet.reduce((totals, question) => {
        totals.communication += parseInt(question["overall-communication-skills"], 10);
        totals.theory += parseInt(question["overall-theory-skills"], 10);
        totals.coding += parseInt(question["overall-coding-skills"], 10);
        return totals;
    }, { communication: 0, theory: 0, coding: 0 });

    const questionCount = questionSet.length;
    completeAnalysis["overall-communication-skills"] = Math.round(skillTotals.communication / questionCount);
    completeAnalysis["overall-theory-skills"] = Math.round(skillTotals.theory / questionCount);
    completeAnalysis["overall-coding-skills"] = Math.round(skillTotals.coding / questionCount);

    return completeAnalysis;
};