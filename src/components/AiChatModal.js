import React, { useState, useRef, useEffect } from "react";
import OpenAI from "openai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "../styles/AiChatModal.css";
import {
  FEEDBACK_SYSTEM_PROMPT,
  INITIAL_CHAT_SYSTEM_PROMPT,
  REGULAR_CHAT_SYSTEM_PROMPT,
  CHAT_MODEL,
  getContextMessage,
  getFeedbackMessage,
  getInitialChatMessage,
} from "../utils/prompts";
import { OPENAI_API_KEY } from "../utils/apiConfig";

const AiChatModal = ({
  isOpen,
  onClose,
  currentQuestion,
  userAnswer,
  isInFeedbackMode,
  sessionId,
}) => {
  // Save messages to localStorage with the correct mode key and session ID
  const saveMessagesToStorage = (
    questionId,
    messages,
    mode,
    sessionIdValue
  ) => {
    const storageKey = `chat_messages_${questionId}_${mode}_${sessionIdValue}`;
    localStorage.setItem(storageKey, JSON.stringify(messages));
  };

  // Use localStorage to persist conversations between modal toggles within the same session
  const [allMessages, setAllMessages] = useState(() => {
    // Try to get persisted messages when component mounts
    const questionId = currentQuestion?.id || "default";
    // Include sessionId in the storage key to separate different study sessions
    const storageKey = `chat_messages_${questionId}_${
      isInFeedbackMode ? "feedback" : "chat"
    }_${sessionId}`;
    const storedMessages = localStorage.getItem(storageKey);
    return storedMessages ? JSON.parse(storedMessages) : [];
  });

  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null); // Ref for the text input
  const pendingRequestRef = useRef(false);

  // Store the current question ID, mode, and session ID for state management
  const questionIdRef = useRef(currentQuestion?.id || "default");
  const modeRef = useRef(isInFeedbackMode ? "feedback" : "chat");
  const sessionIdRef = useRef(sessionId);

  // Track if we've already initialized a conversation for this question, mode, and session
  const hasInitializedConversation = useRef(!!allMessages.length);

  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
  });

  // Generate feedback on user's answer
  const generateFeedbackResponse = async () => {
    if (pendingRequestRef.current) return;
    pendingRequestRef.current = true;
    setIsTyping(true);

    try {
      const systemMessage = {
        role: "system",
        content: FEEDBACK_SYSTEM_PROMPT,
      };

      let correctAnswer =
        currentQuestion.type === "freeResponse"
          ? currentQuestion.answer
          : currentQuestion.correctAnswer;

      const userMessage = getFeedbackMessage(
        currentQuestion?.question,
        userAnswer,
        correctAnswer
      );

      // Add a placeholder assistant message that will be updated with streaming content
      const messageId = Date.now();
      setAllMessages([
        {
          role: "assistant",
          content: "",
          isStreaming: true,
          id: messageId,
        },
      ]);

      // Log OpenAI API call initiation
      console.log(
        `[OpenAI API] Initiating feedback completion at ${new Date().toISOString()}`
      );
      console.log(
        `[OpenAI API] Question context: "${currentQuestion?.question}"`
      );
      console.log(`[OpenAI API] User answer: "${userAnswer}"`);
      console.log(
        `[OpenAI API] Using model: ${CHAT_MODEL} with streaming enabled`
      );

      const startTime = performance.now();

      const stream = await openai.chat.completions.create({
        model: CHAT_MODEL,
        messages: [systemMessage, userMessage],
        stream: true,
      });

      console.log(
        `[OpenAI API] Stream connection established after ${Math.round(
          performance.now() - startTime
        )}ms`
      );

      let responseText = "";
      let updateCounter = 0;
      const UPDATE_FREQUENCY = 3; // Only update state every X chunks
      let chunkCounter = 0;

      for await (const chunk of stream) {
        chunkCounter++;
        const content = chunk.choices[0]?.delta?.content || "";
        responseText += content;

        // Only update React state occasionally to reduce render load
        updateCounter++;
        if (updateCounter % UPDATE_FREQUENCY === 0) {
          setAllMessages((prev) => {
            const updated = [...prev];
            if (updated.length > 0 && updated[0].isStreaming) {
              updated[0].content = responseText;
            }
            return updated;
          });
        }
      }

      const totalTime = Math.round(performance.now() - startTime);
      console.log(`[OpenAI API] Response completed in ${totalTime}ms`);
      console.log(
        `[OpenAI API] Received ${chunkCounter} chunks, ${responseText.length} characters total`
      );

      // Final update to ensure the complete message is stored in state
      setAllMessages((prev) => {
        const updated = [...prev];
        if (updated.length > 0 && updated[0].id === messageId) {
          updated[0].content = responseText;
          updated[0].isStreaming = false;
        }
        return updated;
      });

      // Save completed message to localStorage
      const questionId = currentQuestion?.id || "default";
      const updatedMessages = [...allMessages];
      if (updatedMessages.length > 0 && updatedMessages[0].id === messageId) {
        updatedMessages[0].content = responseText;
        updatedMessages[0].isStreaming = false;
        saveMessagesToStorage(
          questionId,
          updatedMessages,
          "feedback",
          sessionId
        );
      }
    } catch (error) {
      console.error("[OpenAI API] Error generating feedback response:", error);
      setAllMessages((prevMessages) => {
        // If there are already messages, append the error message
        if (prevMessages.length > 0 && prevMessages[0].isStreaming) {
          const updatedMessages = [...prevMessages];
          updatedMessages[0] = {
            role: "assistant",
            content:
              "I'm having trouble analyzing your answer. Please try asking for feedback again.",
            id: Date.now(),
          };

          // Save to localStorage with the correct mode and session
          const questionId = currentQuestion?.id || "default";
          saveMessagesToStorage(
            questionId,
            updatedMessages,
            "feedback",
            sessionId
          );

          return updatedMessages;
        } else {
          // If no messages exist yet, create a new one
          const newMessages = [
            {
              role: "assistant",
              content:
                "I'm having trouble analyzing your answer. Please try asking for feedback again.",
              id: Date.now(),
            },
          ];

          // Save to localStorage with the correct mode and session
          const questionId = currentQuestion?.id || "default";
          saveMessagesToStorage(questionId, newMessages, "feedback", sessionId);

          return newMessages;
        }
      });
    } finally {
      setIsTyping(false);
      pendingRequestRef.current = false;

      // Focus the input field after the response is complete
      setTimeout(() => {
        focusInput();
      }, 100);
    }
  };

  // Generate initial response when the modal first opens
  const generateInitialResponse = async () => {
    if (pendingRequestRef.current) return;
    pendingRequestRef.current = true;
    setIsTyping(true);

    try {
      const systemMessage = {
        role: "system",
        content: INITIAL_CHAT_SYSTEM_PROMPT,
      };

      const userMessage = getInitialChatMessage(currentQuestion?.question);

      // Add a placeholder assistant message that will be updated with streaming content
      const messageId = Date.now();
      setAllMessages([
        {
          role: "assistant",
          content: "",
          isStreaming: true,
          id: messageId,
        },
      ]);

      // Log OpenAI API call initiation
      console.log(
        `[OpenAI API] Initiating initial chat completion at ${new Date().toISOString()}`
      );
      console.log(
        `[OpenAI API] Question context: "${currentQuestion?.question}"`
      );
      console.log(
        `[OpenAI API] Using model: ${CHAT_MODEL} with streaming enabled`
      );

      const startTime = performance.now();

      const stream = await openai.chat.completions.create({
        model: CHAT_MODEL,
        messages: [systemMessage, userMessage],
        stream: true,
      });

      console.log(
        `[OpenAI API] Stream connection established after ${Math.round(
          performance.now() - startTime
        )}ms`
      );

      let responseText = "";
      let updateCounter = 0;
      const UPDATE_FREQUENCY = 3; // Only update state every X chunks
      let chunkCounter = 0;

      for await (const chunk of stream) {
        chunkCounter++;
        const content = chunk.choices[0]?.delta?.content || "";
        responseText += content;

        // Only update React state occasionally to reduce render load
        updateCounter++;
        if (updateCounter % UPDATE_FREQUENCY === 0) {
          setAllMessages((prev) => {
            const updated = [...prev];
            if (updated.length > 0 && updated[0].isStreaming) {
              updated[0].content = responseText;
            }
            return updated;
          });
        }
      }

      const totalTime = Math.round(performance.now() - startTime);
      console.log(`[OpenAI API] Response completed in ${totalTime}ms`);
      console.log(
        `[OpenAI API] Received ${chunkCounter} chunks, ${responseText.length} characters total`
      );

      // Final update to ensure the complete message is stored in state
      setAllMessages((prev) => {
        const updated = [...prev];
        if (updated.length > 0 && updated[0].id === messageId) {
          updated[0].content = responseText;
          updated[0].isStreaming = false;
        }
        return updated;
      });

      // Save completed message to localStorage
      const questionId = currentQuestion?.id || "default";
      const updatedMessages = [...allMessages];
      if (updatedMessages.length > 0 && updatedMessages[0].id === messageId) {
        updatedMessages[0].content = responseText;
        updatedMessages[0].isStreaming = false;
        saveMessagesToStorage(questionId, updatedMessages, "chat", sessionId);
      }
    } catch (error) {
      console.error("[OpenAI API] Error generating initial response:", error);
      setAllMessages((prevMessages) => {
        // If there are already messages, append the error message
        if (prevMessages.length > 0 && prevMessages[0].isStreaming) {
          const updatedMessages = [...prevMessages];
          updatedMessages[0] = {
            role: "assistant",
            content:
              "I'm having trouble connecting. Please try asking your question again.",
            id: Date.now(),
          };

          // Save to localStorage with the correct mode and session
          const questionId = currentQuestion?.id || "default";
          saveMessagesToStorage(questionId, updatedMessages, "chat", sessionId);

          return updatedMessages;
        } else {
          // If no messages exist yet, create a new one
          const newMessages = [
            {
              role: "assistant",
              content:
                "I'm having trouble connecting. Please try asking your question again.",
              id: Date.now(),
            },
          ];

          // Save to localStorage with the correct mode and session
          const questionId = currentQuestion?.id || "default";
          saveMessagesToStorage(questionId, newMessages, "chat", sessionId);

          return newMessages;
        }
      });
    } finally {
      setIsTyping(false);
      pendingRequestRef.current = false;

      // Focus the input field after the response is complete
      setTimeout(() => {
        focusInput();
      }, 100);
    }
  };

  // Scroll to bottom of messages when messages change
  useEffect(() => {
    scrollToBottom();

    // Save messages to localStorage whenever they change
    if (allMessages.length > 0) {
      const questionId = currentQuestion?.id || "default";
      const mode = isInFeedbackMode ? "feedback" : "chat";

      // Debounce the localStorage updates to avoid performance issues
      // Only save when there are actual messages (not just streaming placeholders)
      const hasCompletedMessages = allMessages.some((msg) => !msg.isStreaming);

      if (hasCompletedMessages) {
        saveMessagesToStorage(questionId, allMessages, mode, sessionId);
      }
    }
  }, [allMessages, currentQuestion?.id, isInFeedbackMode, sessionId]);

  // Reset conversation when the question, mode, or session changes
  useEffect(() => {
    const currentQuestionId = currentQuestion?.id || "default";
    const currentMode = isInFeedbackMode ? "feedback" : "chat";

    // If the question, mode, or session has changed, load the appropriate conversation or start a new one
    if (
      currentQuestionId !== questionIdRef.current ||
      currentMode !== modeRef.current ||
      sessionId !== sessionIdRef.current
    ) {
      questionIdRef.current = currentQuestionId;
      modeRef.current = currentMode;
      sessionIdRef.current = sessionId;

      // Try to load existing conversation for this question, mode, and session
      const storageKey = `chat_messages_${currentQuestionId}_${currentMode}_${sessionId}`;
      const storedMessages = localStorage.getItem(storageKey);

      if (storedMessages) {
        // If we have a stored conversation, load it
        setAllMessages(JSON.parse(storedMessages));
        hasInitializedConversation.current = true;
      } else {
        // If no existing conversation, reset to start a new one
        setAllMessages([]);
        hasInitializedConversation.current = false;
      }
    }

    // Reset typing state when modal opens or closes
    if (!isOpen) {
      setIsTyping(false);
      pendingRequestRef.current = false;
    }
  }, [isOpen, currentQuestion, isInFeedbackMode, sessionId]);

  // When modal opens, ensure we have the latest messages loaded
  useEffect(() => {
    if (isOpen) {
      const currentQuestionId = currentQuestion?.id || "default";
      const currentMode = isInFeedbackMode ? "feedback" : "chat";
      const storageKey = `chat_messages_${currentQuestionId}_${currentMode}_${sessionId}`;
      const storedMessages = localStorage.getItem(storageKey);

      if (storedMessages) {
        const parsedMessages = JSON.parse(storedMessages);
        // Only update if the messages are different to avoid unnecessary renders
        if (JSON.stringify(parsedMessages) !== JSON.stringify(allMessages)) {
          setAllMessages(parsedMessages);
          hasInitializedConversation.current = true;
        }
      }
    }
  }, [isOpen, allMessages, isInFeedbackMode, sessionId]);

  // Initialize conversation when needed
  useEffect(() => {
    if (
      isOpen &&
      !hasInitializedConversation.current &&
      !pendingRequestRef.current &&
      allMessages.length === 0
    ) {
      if (isInFeedbackMode) {
        generateFeedbackResponse();
      } else {
        generateInitialResponse();
      }
      hasInitializedConversation.current = true;
    }
  }, [
    isOpen,
    allMessages.length,
    isInFeedbackMode,
    generateFeedbackResponse,
    generateInitialResponse,
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Handle user message and AI response
  const handleSendMessage = async () => {
    if (!inputText.trim() || pendingRequestRef.current) return;

    // Create both messages before updating state
    const newUserMessage = {
      role: "user",
      content: inputText,
      id: Date.now(),
    };

    const newAssistantMessage = {
      role: "assistant",
      content: "",
      isStreaming: true,
      id: Date.now() + 1,
    };

    // Combine them into one new conversation array
    const updatedMessages = [
      ...allMessages,
      newUserMessage,
      newAssistantMessage,
    ];

    // Update state with the new conversation
    setAllMessages(updatedMessages);

    // Also immediately save to localStorage to ensure persistence
    const questionId = currentQuestion?.id || "default";
    const mode = isInFeedbackMode ? "feedback" : "chat";
    saveMessagesToStorage(questionId, updatedMessages, mode, sessionId);

    // Clear the input field
    setInputText("");

    // Pass the fully updated conversation to generateResponse
    await generateResponse(newUserMessage, updatedMessages);
  };

  // Generate response from OpenAI
  const generateResponse = async (userMessage, conversation) => {
    if (pendingRequestRef.current) return;
    pendingRequestRef.current = true;
    setIsTyping(true);

    try {
      const systemMessage = {
        role: "system",
        content: REGULAR_CHAT_SYSTEM_PROMPT,
      };

      const contextMessage = getContextMessage(currentQuestion?.question);

      // Build messages for the API from our conversation history
      const apiMessages = [
        systemMessage,
        contextMessage,
        ...conversation
          .filter((m) => !m.isStreaming) // Filter out any streaming messages
          .map((m) => ({ role: m.role, content: m.content })), // Strip out our custom fields
      ];

      // Log OpenAI API call initiation
      console.log(
        `[OpenAI API] Initiating chat completion at ${new Date().toISOString()}`
      );
      console.log(`[OpenAI API] User message: "${userMessage.content}"`);
      console.log(
        `[OpenAI API] Using model: ${CHAT_MODEL} with streaming enabled`
      );
      console.log(
        `[OpenAI API] Conversation length: ${apiMessages.length} messages`
      );

      const startTime = performance.now();

      const stream = await openai.chat.completions.create({
        model: CHAT_MODEL,
        messages: apiMessages,
        stream: true,
      });

      console.log(
        `[OpenAI API] Stream connection established after ${Math.round(
          performance.now() - startTime
        )}ms`
      );

      let responseText = "";
      let updateCounter = 0;
      const UPDATE_FREQUENCY = 3; // Only update state every X chunks
      let chunkCounter = 0;

      // Get the placeholder message's ID
      const streamingMessageId = conversation[conversation.length - 1].id;

      for await (const chunk of stream) {
        chunkCounter++;
        const content = chunk.choices[0]?.delta?.content || "";
        responseText += content;

        // Only update React state occasionally to reduce render load
        updateCounter++;
        if (updateCounter % UPDATE_FREQUENCY === 0) {
          setAllMessages((prev) => {
            const updated = [...prev];
            const lastMessageIndex = updated.length - 1;
            if (
              lastMessageIndex >= 0 &&
              updated[lastMessageIndex].isStreaming
            ) {
              updated[lastMessageIndex].content = responseText;
            }
            return updated;
          });
        }
      }

      const totalTime = Math.round(performance.now() - startTime);
      console.log(`[OpenAI API] Response completed in ${totalTime}ms`);
      console.log(
        `[OpenAI API] Received ${chunkCounter} chunks, ${responseText.length} characters total`
      );

      // Final update to ensure the complete message is stored in state
      setAllMessages((prev) => {
        const updated = [...prev];
        const lastMessageIndex = updated.length - 1;
        if (
          lastMessageIndex >= 0 &&
          updated[lastMessageIndex].id === streamingMessageId
        ) {
          updated[lastMessageIndex].content = responseText;
          updated[lastMessageIndex].isStreaming = false;
        }
        return updated;
      });

      // Save completed message to localStorage
      const questionId = currentQuestion?.id || "default";
      const mode = isInFeedbackMode ? "feedback" : "chat";
      const updatedMessages = [...allMessages];
      const lastMessageIndex = updatedMessages.length - 1;
      if (
        lastMessageIndex >= 0 &&
        updatedMessages[lastMessageIndex].id === streamingMessageId
      ) {
        updatedMessages[lastMessageIndex].content = responseText;
        updatedMessages[lastMessageIndex].isStreaming = false;
        saveMessagesToStorage(questionId, updatedMessages, mode, sessionId);
      }
    } catch (error) {
      console.error("[OpenAI API] Error generating response:", error);

      // Replace the streaming message with an error message
      setAllMessages((prev) => {
        const updated = [...prev];
        const lastMessageIndex = updated.length - 1;
        if (lastMessageIndex >= 0 && updated[lastMessageIndex].isStreaming) {
          updated[lastMessageIndex] = {
            role: "assistant",
            content:
              "I'm having trouble connecting. Please try asking your question again.",
            id: Date.now(),
          };

          // Save error message to localStorage
          const questionId = currentQuestion?.id || "default";
          const mode = isInFeedbackMode ? "feedback" : "chat";
          saveMessagesToStorage(questionId, updated, mode, sessionId);
        }
        return updated;
      });
    } finally {
      setIsTyping(false);
      pendingRequestRef.current = false;

      // Focus the input field after the response is complete
      setTimeout(() => {
        focusInput();
      }, 100);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Function to focus the input field
  const focusInput = () => {
    if (inputRef.current && !isTyping) {
      inputRef.current.focus();
    }
  };

  // Focus input when modal opens or typing finishes
  useEffect(() => {
    if (isOpen && !isTyping) {
      // Small delay to ensure the modal is fully rendered
      setTimeout(() => {
        focusInput();
      }, 100);
    }
  }, [isOpen, isTyping]);

  // Fix unsafe loop references by creating a new variable for each iteration
  const handleStreamingResponse = (responseText, messageId) => {
    setAllMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg.id === messageId
          ? { ...msg, content: responseText, isStreaming: true }
          : msg
      )
    );
  };

  // Add missing dependency to useEffect
  useEffect(() => {
    if (isOpen) {
      focusInput();
    }
  }, [isOpen, focusInput]);

  if (!isOpen) return null;

  return (
    <div className="ai-chat-modal-overlay">
      <div className="ai-chat-modal">
        <div className="ai-chat-header">
          <h3>Studdy Buddy {isInFeedbackMode ? "Feedback" : ""}</h3>
          <button className="close-button" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="ai-chat-messages">
          {/* All messages - streaming and completed */}
          {allMessages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.role} ${
                message.isStreaming ? "streaming-message" : ""
              }`}
            >
              {message.role === "user" ? (
                // User messages are displayed as plain text
                <div className="message-content">{message.content || " "}</div>
              ) : (
                // AI messages are rendered as markdown
                <div className="message-content markdown-content">
                  {message.isStreaming ? (
                    // For streaming messages, show plain text during stream
                    message.content || " "
                  ) : (
                    // For completed messages, render with markdown
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content || " "}
                    </ReactMarkdown>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator when no content is available */}
          {isTyping && !allMessages.some((m) => m.isStreaming) && (
            <div className="message assistant typing-container">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="ai-chat-input">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isInFeedbackMode
                ? "Ask about your answer..."
                : "Ask a question about this topic..."
            }
            disabled={isTyping}
            ref={inputRef}
          />
          <button
            className="send-button"
            onClick={handleSendMessage}
            disabled={isTyping || !inputText.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiChatModal;
