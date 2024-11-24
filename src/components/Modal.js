import React from 'react';
import './Modal.css';

// List of question topics with corresponding emojis
const QuestionTopics = [
    ["Data Structures and Algorithms", "🧩"], ["Web Development", "🌐"], ["Machine Learning", "🤖"], 
    ["Python Programming", "🐍"], ["Software Engineering", "🛠️"], ["Operating Systems", "💻"], 
    ["Databases", "🗃️"], ["Networking", "🔗"], ["Cybersecurity", "🛡️"], ["Cloud Computing", "☁️"], 
    ["DevOps", "⚙️"], ["Programming Languages", "📄"], ["Front-end Development", "🎨"], 
    ["Back-end Development", "🔧"], ["Mobile Development", "📱"], ["Game Development", "🎮"], 
    ["Artificial Intelligence", "🧠"], ["Blockchain", "🔗"], ["Quantum Computing", "🔬"], 
    ["Internet of Things", "📶"], ["Augmented Reality", "🕶️"], ["Virtual Reality", "🌈"], 
    ["Robotics", "🤖"], ["Computer Vision", "👁️"], ["Natural Language Processing", "🗣️"], 
    ["Data Science", "📊"], ["Big Data", "💽"], ["Cloud Storage", "💾"], ["Computer Networks", "🖧"], 
    ["Software Development", "📦"], ["Mobile Applications", "📲"], ["Web Applications", "🌍"]
];

const Modal = ({ isOpen, onClose, onSubmit, formData, setFormData }) => {
    // If the modal is not open, return null
    if (!isOpen) return null;

    // Handle changes in the topic selection
    const handleTopicChange = (event, type) => {
        const value = event.target.value;
        const checked = event.target.checked;

        setFormData(prevData => {
            const updatedTopics = checked
                ? [...prevData[type], value]
                : prevData[type].filter(topic => topic !== value);

            return { ...prevData, [type]: updatedTopics };
        });
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="modal-close" onClick={onClose}>X</button>
                <h2>Interview Configuration</h2>

                {/* Number of Theoretical Questions */}
                <label>
                    Number of Theoretical Questions:
                    <input
                        type="range"
                        min="2"
                        max="8"
                        value={formData.theoreticalQuestions}
                        onChange={(e) => setFormData({ ...formData, theoreticalQuestions: e.target.value })}
                    />
                    {formData.theoreticalQuestions}
                </label>

                {/* Favoured Topics (Theoretical) */}
                <label>
                    Favoured Topics (Theoretical):
                    <div className="scrollable-list">
                        {QuestionTopics.map(topic => (
                            <label key={topic[0]}>
                                <input
                                    type="checkbox"
                                    value={topic[0]}
                                    checked={formData.theoreticalTopics.includes(topic[0])}
                                    onChange={(e) => handleTopicChange(e, 'theoreticalTopics')}
                                />
                                {topic[0]} {topic[1]}
                            </label>
                        ))}
                    </div>
                </label>

                {/* Number of Diagram-Based Questions */}
                <label>
                    Number of Diagram-Based Questions:
                    <input
                        type="range"
                        min="0"
                        max="3"
                        value={formData.diagramQuestions}
                        onChange={(e) => setFormData({ ...formData, diagramQuestions: e.target.value })}
                    />
                    {formData.diagramQuestions}
                </label>

                {/* Favoured Topics (Diagram-Based) */}
                <label>
                    Favoured Topics (Diagram-Based):
                    <div className="scrollable-list">
                        {QuestionTopics.map(topic => (
                            <label key={topic[0]}>
                                <input
                                    type="checkbox"
                                    value={topic[0]}
                                    checked={formData.diagramTopics.includes(topic[0])}
                                    onChange={(e) => handleTopicChange(e, 'diagramTopics')}
                                />
                                {topic[0]} {topic[1]}
                            </label>
                        ))}
                    </div>
                </label>

                {/* Number of Coding-Based Questions */}
                <label>
                    Number of Coding-Based Questions:
                    <input
                        type="range"
                        min="0"
                        max="2"
                        value={formData.codingQuestions}
                        onChange={(e) => setFormData({ ...formData, codingQuestions: e.target.value })}
                    />
                    {formData.codingQuestions}
                </label>

                {/* Difficulty Level */}
                <label>
                    Difficulty Level:
                    <select
                        value={formData.difficulty}
                        onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                    </select>
                </label>

                {/* Submit Button */}
                <button onClick={() => onSubmit(formData)}>Start Interview</button>
            </div>
        </div>
    );
};

export default Modal;