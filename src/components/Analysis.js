import React from 'react';
import { jsPDF } from 'jspdf';
import { useLocation } from 'react-router-dom';
import './Analysis.css';

const InterviewAnalysis = () => {
  const location = useLocation();
  const analysisData = location.state?.completeAnalysisReport;
  console.log(analysisData);

  const downloadPDF = () => {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(20);
    doc.text("Overall Interview Summary", 10, 10);
    doc.setFontSize(12);

    // Add overall summary
    doc.text(analysisData.overall, 10, 20);
    doc.text(`Communication Skills: ${analysisData['overall-communication-skills']} / 10`, 10, 30);
    doc.text(`Theory Skills: ${analysisData['overall-theory-skills']} / 10`, 10, 40);
    doc.text(`Coding Skills: ${analysisData['overall-coding-skills']} / 10`, 10, 50);

    // Add a page for question details
    doc.addPage();
    doc.setFontSize(20);
    doc.text("Detailed Question Breakdown", 10, 10);

    let y = 20; // Initial vertical position

    // Iterate through each question in the question set
    analysisData.questionSet.forEach((question, index) => {
      doc.setFontSize(16);
      doc.text(`Question ${index + 1}: ${question.question}`, 10, y);
      doc.setFontSize(12);
      y += 10; // Increment Y position
      doc.text(`Type: ${question.type}`, 10, y);
      y += 5;
      doc.text(question.overall, 10, y);
      y += 5;
      doc.text(`Communication Skills: ${question['overall-communication-skills']} / 10`, 10, y);
      y += 5;
      doc.text(`Theory Skills: ${question['overall-theory-skills']} / 10`, 10, y);
      y += 5;

      if (question.type === 'coding') {
        doc.text("Submitted Code:", 10, y);
        y += 5;

        // Split long code into multiple lines
        const userCodeLines = doc.splitTextToSize(question.userCode, 180);
        userCodeLines.forEach((line) => {
          doc.text(line, 10, y);
          y += 5;
          // Check for page overflow
          if (y > 270) {
            doc.addPage();
            y = 10;
          }
        });

        doc.text("Expected Solution:", 10, y);
        y += 5;
        const expectedCodeLines = doc.splitTextToSize(question.expectedCode, 180);
        expectedCodeLines.forEach((line) => {
          doc.text(line, 10, y);
          y += 5;
          if (y > 270) {
            doc.addPage();
            y = 10;
          }
        });

        doc.text("Solution Explanation:", 10, y);
        y += 5;
        const solutionLines = doc.splitTextToSize(question.Solution, 180);
        solutionLines.forEach((line) => {
          doc.text(line, 10, y);
          y += 5;
          if (y > 270) {
            doc.addPage();
            y = 10;
          }
        });
      }

      doc.text("Conversation:", 10, y);
      y += 5;
      question.conversation.forEach((conv, convIndex) => {
        const convText = `Assistant: ${conv.assistant} \nUser: ${conv.user} \nExpected Output: ${conv.expectedOutput}`;
        const conversationLines = doc.splitTextToSize(convText, 180); // Split long lines
        conversationLines.forEach((line) => {
          doc.text(line, 10, y);
          y += 5;
          if (y > 270) {
            doc.addPage();
            y = 10;
          }
        });
      });

      // Ensure new page is added before content overflows
      if (y > 270) {
        doc.addPage();
        y = 10; // Reset Y position for new page
      }
    });

    doc.save('interview_summary.pdf');
  };

  return (
    <div className="analysis-container">
      <section className="overall-summary">
        <h2>Overall Interview Summary</h2>
        <p>{analysisData.overall}</p>
        <div className="skills-summary">
          <div className="skill">
            <h4>Communication Skills</h4>
            <p>{analysisData['overall-communication-skills']} / 10</p>
          </div>
          <div className="skill">
            <h4>Theory Skills</h4>
            <p>{analysisData['overall-theory-skills']} / 10</p>
          </div>
          <div className="skill">
            <h4>Coding Skills</h4>
            <p>{analysisData['overall-coding-skills']} / 10</p>
          </div>
        </div>
      </section>

      <section className="question-set">
        <h2>Detailed Question Breakdown</h2>
        {analysisData.questionSet.map((question, index) => (
          <div key={index} className="question-block">
            <h3>Question {index + 1}: {question.question}</h3>
            <p><strong>Type:</strong> {question.type}</p>
            <p>{question.overall}</p>
            <div className="skills-breakdown">
              <div className="skill">
                <h4>Communication Skills</h4>
                <p>{question['overall-communication-skills']} / 10</p>
              </div>
              <div className="skill">
                <h4>Theory Skills</h4>
                <p>{question['overall-theory-skills']} / 10</p>
              </div>
              {question.type === 'coding' && (
                <div className="skill">
                  <h4>Coding Skills</h4>
                  <p>{question['overall-coding-skills']} / 10</p>
                </div>
              )}
            </div>

            {question.type === 'coding' && (
              <div className="coding-solution">
                <h4>Submitted Code:</h4>
                <pre className="code-box">{question.userCode}</pre>
                <h4>Expected Solution:</h4>
                <pre className="code-box">{question.expectedCode}</pre>
                <h4>Solution Explanation:</h4>
                <p>{question.Solution}</p>
              </div>
            )}

            <div className="conversation">
              <h4>Conversation</h4>
              {question.conversation.map((conv, convIndex) => (
                <div key={convIndex} className="conversation-block">
                  <p><strong>Assistant:</strong> {conv.assistant}</p>
                  <p><strong>User:</strong> {conv.user}</p>
                  <p><strong>Expected Output:</strong> {conv.expectedOutput}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
        <button onClick={downloadPDF} className="download-pdf-button">
          Download Full Page PDF of Interview Analysis
        </button>
      </section>
    </div>
  );
};

export default InterviewAnalysis;
