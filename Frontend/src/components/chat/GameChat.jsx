import React, { useEffect, useRef, useState } from "react";
import "./GameChat.css";

export default function GameChat({ messages, onSend, currentUserId }) {
    const [inputText, setInputText] = useState("");
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        onSend(inputText.trim());
        setInputText("");
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <div className="game-chat-container">
            <div className="game-chat-messages">
                {messages.map((msg, index) => {
                    const isMe = (msg.userId ?? msg.UserId) === currentUserId;
                    return (
                        <div
                            key={index}
                            className={`chat-message ${isMe ? "my-message" : "other-message"}`}
                        >
                            <div className="chat-bubble">
                                {!isMe && (
                                    <div className="chat-sender-name">
                                        {msg.playerName ?? msg.PlayerName}
                                    </div>
                                )}
                                <div className="chat-text">{msg.message ?? msg.Message}</div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <form className="game-chat-input-area" onSubmit={handleSubmit}>
                <div className="chat-input-wrapper">
                    <input
                        type="text"
                        className="chat-input"
                        placeholder="Type a message..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <button type="submit" className="chat-send-btn" disabled={!inputText.trim()}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                    </button>
                </div>
            </form>
        </div>
    );
}
