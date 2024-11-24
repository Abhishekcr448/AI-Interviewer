import qs from 'qs';
import axios from 'axios';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Editor } from '@monaco-editor/react';
import { sendMessage, describeQuestions, getCompleteAnalysis, getImageSummary } from './AI-Responce';
import './Chat.css';
import DrawingComponent from './DrawingComponent'; // Import the DrawingComponent

// Language templates for different programming languages
const languageTemplates = {
  go: `package main
import "fmt"
func main() {
    // Write your code here
}`,

  py: `# Write your code here\n`,

  java: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        // Write your code here
    }
}`,

  cs: `using System;
class Program {
    static void Main(string[] args) {
        // Write your code here
    }
}`,

  c: `#include <stdio.h>
int main() {
    // Write your code here
    return 0;
}`,

  cpp: `#include <iostream>
using namespace std;
int main() {
    // Write your code here
    return 0;
}`,
};

// Prevent ResizeObserver loop limit exceeded error
if (window.ResizeObserver) {
  const resizeObserverErrorHandler = (e) => {
    e.preventDefault();
  };
  window.addEventListener('error', resizeObserverErrorHandler);
}


const Chat = () => {
  // State variables for chat messages, input, and dark mode
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [darkMode, setDarkMode] = useState(false);

  // State variables for code editor and layout dimensions
  const [code, setCode] = useState('');
  const chatWidth = 50;
  const [editorHeight, setEditorHeight] = useState(53);
  const [outputHeight, setOutputHeight] = useState(50);

  // Timer state variables
  const [timer, setTimer] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);

  // Voice recognition state variables
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);

  // State variables for language selection and question set
  const [selectedLanguage, setSelectedLanguage] = useState('py');
  const [questionSet, setQuestionSet] = useState([
    { type: 'theory', question: 'What is AI?' },
    { type: 'coding', question: 'Write a function to reverse a string', example: [{ 'Input': "hello", 'Output': "olleh" }], solutionText: "The solution is to use the reverse() function in Python. The reverse() function reverses the elements of a list in place. The reverse() function doesn't return any value. It only reverses the elements and updates the list. The reverse() function doesn't create a new list. It only changes the original list. The reverse() function is an inbuilt function in Python programming language that reverses the elements of a list. The syntax of the reverse() function is: list.reverse()", code: "print(input()[::-1])" },
    { type: 'drawing', question: 'Draw an architecture diagram of Linked List' },
  ]);

  // State variables for saved chats, codes, and current question index
  const [savedChats, setSavedChats] = useState([]);
  const [savedCodes, setSavedCodes] = useState([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [codingQuestion, setCodingQuestion] = useState('');
  const [loading, setLoading] = useState(false);

  // State variables for output and summary
  const [output, setOutput] = useState(Array(questionSet.length).fill(''));
  const [summary, setSummary] = useState(Array(questionSet.length).fill(''));
  const [currentDrawingData, setCurrentDrawingData] = useState(null);

  // Navigation and chat reference
  const navigate = useNavigate();
  const chatRef = useRef(null);

  // Save chat messages to local storage
  useEffect(() => {
    const updatedSavedChats = [...savedChats];
    updatedSavedChats[questionIndex] = messages;
    setSavedChats(updatedSavedChats);
    localStorage.setItem('savedChats', JSON.stringify(updatedSavedChats));
  }, [messages, questionIndex]);

  // Save chat messages to local storage
  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(messages));
  }, [messages]);

  // Set Monaco editor theme based on dark mode
  useEffect(() => {
    if (window.monaco) {
      window.monaco.editor.setTheme(darkMode ? 'vs-dark' : 'vs');
    }
  }, [darkMode]);

  // Describe questions on initial load
  useEffect(() => {
    if (messages.length === undefined || messages.length === 0) {
      setLoading(true);
      describeQuestions(questionSet[questionIndex], questionIndex, (newMessages) => setMessages(newMessages), (newLoading) => setLoading(newLoading));
    }
  }, [messages, questionIndex, questionSet]);

  // Initialize Speech Recognition API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US"; // Set the language to English
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        const speechToText = event.results[0][0].transcript;
        setInput(speechToText); // Set the voice input as message text
      };

      recognition.onspeechend = () => {
        recognition.stop();
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Function to handle sending messages
  const handleSendMessage = async () => {
    setLoading(true);
    let imageBase64 = drawingRef.current ? drawingRef.current.getCanvasImageBase64() : null;
    await sendMessage(
      messages,
      input,
      (newMessages) => setMessages(newMessages),
      questionSet[questionIndex],
      summary,
      (newSummary) => setSummary(newSummary),
      questionIndex,
      (newLoading) => setLoading(newLoading),
      savedCodes,
      languageTemplates[selectedLanguage],
      imageBase64
    );
    setInput('');
  };

  // Function to handle key press events
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  // Function to navigate back to the home page
  const handleBack = () => {
    navigate('/');
  };

  // Function to toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Function to run the code in the editor
  const handleRunCode = async () => {
    setLoading(true); // Start loading state

    const data = qs.stringify({
      code: code, // Use the current code from the editor
      language: selectedLanguage,
      input: questionSet[questionIndex]?.example?.[0]?.Input || '', // Use the custom test cases input
    });

    const config = {
      method: 'post',
      url: 'https://api.codex.jaagrav.in', // Replace with your API endpoint
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: data,
    };

    try {
      const response = await axios(config);
      const outputData = response.data.output;
      output[questionIndex] = outputData;
      setOutput(output);
    } catch (error) {
      setOutput(`Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false); // End loading state
      setEditorHeight(40);
      setOutputHeight(60);
    }
  };

  // Function to submit the code for complete analysis
  const handleSubmitCode = async () => {
    setLoading(true); // Show loading message
    console.log("started getCompleteAnalysis");

    let completeAnalysisReport = await getCompleteAnalysis(questionSet, savedChats, savedCodes);

    // Once the report is ready, navigate to the analysis page with the result
    setLoading(false); // Hide loading message
    navigate('/analysis', { state: { completeAnalysisReport } });
  };

  // Function to start a new chat
  const handleNewChat = () => {
    setMessages([]);
    localStorage.removeItem('chatMessages');
    let updatedSummary = [...summary];
    updatedSummary[questionIndex] = '';
    setSummary(updatedSummary);
  };

  // Function to handle voice input
  const handleVoiceInput = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start();
      setIsListening(true);
    } else if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  // Timer control functions
  const startTimer = () => {
    setIsTimerActive(true);
  };

  const stopTimer = () => {
    setIsTimerActive(false);
    setTimer(0); // Reset timer when stopped
  };

  const pauseTimer = () => {
    setIsTimerActive(false);
  };

  // Effect to handle timer updates
  useEffect(() => {
    let interval;
    if (isTimerActive) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer + 1);
      }, 1000);
    }
    return () => {
      clearInterval(interval);
    };
  }, [isTimerActive]);

  // Function to handle question change
  const handleQuestionChange = (index) => {
    setQuestionIndex(index);
    const selectedQuestion = questionSet[index];

    if (selectedQuestion.type === 'theory') {
      setCodingQuestion('');
    } else {
      setCodingQuestion(selectedQuestion.question);
      setCode(savedCodes[index] || languageTemplates[selectedLanguage]);
    }

    setMessages(savedChats[index] || []);
  };

  // Function to handle language change
  const handleLanguageChange = (e) => {
    const language = e.target.value;
    setSelectedLanguage(language);
    setCode(languageTemplates[language]);
  };

  // Function to scroll chat to top
  const scrollToTop = () => {
    if (chatRef.current) {
      chatRef.current.scrollTop = 0;
    }
  };

  // Effect to scroll chat to top on messages update
  useEffect(() => {
    scrollToTop();
  }, [messages]);

  // Effect to save code on update
  useEffect(() => {
    const updatedSavedCodes = [...savedCodes];
    updatedSavedCodes[questionIndex] = code;
    setSavedCodes(updatedSavedCodes);
  }, [code]);

  // Reference to the drawing component
  const drawingRef = useRef();

  // Function to fetch canvas image
  const fetchCanvasImage = async () => {
    const canvasImage = drawingRef.current.getCanvasImageBase64(); // Call the function from the DrawingComponent
    setCurrentDrawingData(canvasImage);
    let responseText = await getImageSummary(questionSet[questionIndex], canvasImage);
    console.log("responseText", responseText);
  };

  return (
    <div className={`chat-container ${darkMode ? 'dark' : ''}`}>
      {/* Header Section */}
      <div className={`chat-header ${darkMode ? 'dark' : ''}`}>
        <div className="header-buttons">
          <button onClick={handleBack} className={`back-button ${darkMode ? 'dark' : ''}`}>Back</button>
          <button onClick={handleNewChat} className={`new-chat-button ${darkMode ? 'dark' : ''}`}>New Chat</button>
          <button onClick={toggleDarkMode} className={`dark-mode-toggle ${darkMode ? 'dark' : ''}`}>
            {darkMode ? '🌞' : '🌙'}
          </button>
          <button onClick={handleSubmitCode} className={`submit-button ${darkMode ? 'dark' : ''}`} style={{ backgroundColor: 'green', color: 'white' }} disabled={loading}>Submit</button>
        </div>
        <div></div>
        <div className={`timer-container ${darkMode ? 'dark' : ''}`}>
          <div className={`timer-label ${darkMode ? 'dark' : ''}`}>Timer :</div>
          <div className="timer">
            {new Date(timer * 1000).toISOString().substring(11, 19)}
          </div>
          <div className="timer-controls">
            <button onClick={startTimer} aria-label="Start Timer">
              <i className="bi bi-play-fill"></i>
            </button>
            <button onClick={pauseTimer} aria-label="Pause Timer">
              <i className="bi bi-pause-fill"></i>
            </button>
            <button onClick={stopTimer} aria-label="Stop Timer">
              <i className="bi bi-stop-fill"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Question Tabs */}
      <div className={`question-tabs ${darkMode ? 'dark' : ''}`}>
        {questionSet.map((question, index) => (
          <button key={index} disabled={loading} onClick={() => handleQuestionChange(index)}>{index + 1}</button>
        ))}
      </div>

      {/* Split Screen Layout */}
      <div className="split-screen">
        {/* Chat Section */}
        <div className={`chat-section ${darkMode ? 'dark' : ''}`} ref={chatRef} style={{ flexBasis: `${chatWidth}%` }}>
          <div className={`question-section ${darkMode ? 'dark' : ''}`}>
            <div className="coding-question">
              <div>
                <p><strong>Question:</strong> {questionSet[questionIndex]?.question}</p>
                {questionSet[questionIndex]?.type === 'coding' && (
                  <div>
                    <strong>Example:</strong>
                    {questionSet[questionIndex]?.example?.map((example, index) => (
                      (index === 0) && (
                        <div key={index} className="input-output-container">
                          <p className="input-output"><strong>Input:</strong> {example.Input}</p>
                          <p className="input-output"><strong>Output:</strong> {example.Output}</p>
                        </div>
                      )
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Messages Section */}
          <div className="messages" ref={chatRef}>
            {Array.isArray(messages) && messages.map((message, index) => (
              <div key={index} className={`message ${message.role}`}>
                <div className="avatar">{message.role === 'user' ? '🧑' : '🤖'}</div>
                <div className="message-content">
                  <div className="message-text">{message.content}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Input Section */}
          <div className="input-container">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type a message..."
              className={`chat-input ${darkMode ? 'dark' : ''}`}
              disabled={loading}
              maxLength={800}
            />
            <button
              onClick={handleSendMessage}
              className={`send-button ${darkMode ? 'dark' : ''}`}
              disabled={loading}  // Disable button when loading is true
            >Send
            </button>
            <button
              onClick={handleVoiceInput}
              className={`voice-button ${darkMode ? "dark" : ""}`}
            >
              {isListening ? "🛑 Stop" : "🎤 Voice"}
            </button>
          </div>
        </div>

        {/* Coding Section */}
        {questionSet[questionIndex]?.type === 'coding' && (
          <div className={`editor-section ${darkMode ? 'dark' : ''}`} style={{ flexBasis: `${100 - chatWidth}%`, height: `${editorHeight}vh` }}>
            <select onChange={handleLanguageChange} className={`language-selector ${darkMode ? 'dark' : ''}`} value={selectedLanguage}>
              <option value="py">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
              <option value="c">C</option>
              <option value="cs">C#</option>
              <option value="go">GoLang</option>
            </select>

            <Editor
              height={`${editorHeight - 10}vh`} // adjust height to accommodate test case box
              language={selectedLanguage}
              value={code}
              onChange={(value) => setCode(value)}
              theme={darkMode ? 'vs-dark' : 'vs'}
            />
            <div className="predefined-text-container">
              <textarea
                value={questionSet[questionIndex]?.example?.[0]?.Input || ''}
                onChange={(e) => {
                  const updatedQuestionSet = [...questionSet];
                  updatedQuestionSet[questionIndex].example[0].Input = e.target.value;
                  setQuestionSet(updatedQuestionSet);
                }}
                className={`predefined-text ${darkMode ? 'dark' : ''}`}
              />
            </div>
            <div className="editor-controls">
              <button onClick={handleRunCode} className={`run-button ${darkMode ? 'dark' : ''}`}>Run</button>
            </div>
            <div className={`output ${darkMode ? 'dark' : ''}`} style={{ height: `${outputHeight}vh` }}>
              {"Output:  " + output[questionIndex]}
            </div>
          </div>
        )}

        {/* Drawing Section */}
        {questionSet[questionIndex]?.type === 'drawing' && (
          <div>
            <DrawingComponent ref={drawingRef} />
          </div>
        )}
      </div>
    </div>
  );
};


export default Chat;
