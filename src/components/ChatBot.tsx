import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Paperclip, X, Settings, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import chatbotConfig from "@/config/chatbot-config.json";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  attachment?: {
    type: string;
    data: string;
    name: string;
  };
}

interface ChatBotProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const ChatBot = ({ isOpen, onToggle }: ChatBotProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [tempApiKey, setTempApiKey] = useState("");
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Load API key from localStorage on mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem("gemini-api-key");
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  // Add welcome message when chatbot opens for the first time
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: "welcome",
        content: chatbotConfig.ui.welcomeMessage,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const saveApiKey = () => {
    if (!tempApiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid API key",
        variant: "destructive",
      });
      return;
    }
    
    setApiKey(tempApiKey);
    localStorage.setItem("gemini-api-key", tempApiKey);
    setIsApiKeyDialogOpen(false);
    setTempApiKey("");
    
    toast({
      title: "Success",
      description: "API key saved successfully!",
    });
  };

  const handleFileAttachment = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        setAttachment(file);
      } else {
        toast({
          title: "Error",
          description: "Only image files are supported",
          variant: "destructive",
        });
      }
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const generateResponse = async (userMessage: string, attachmentData?: { data: string; mime_type: string }) => {
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please set your Google AI API key first",
        variant: "destructive",
      });
      return;
    }

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${chatbotConfig.settings.model}:generateContent?key=${apiKey}`;
    
    // Create the request payload with tone and style instructions
    const systemInstruction = chatbotConfig.toneAndStyle.instructions;
    const userContent = `${systemInstruction}\n\nUser: ${userMessage}`;
    
    const requestBody: any = {
      contents: [
        {
          role: "user",
          parts: [
            { text: userContent },
            ...(attachmentData ? [{ inline_data: attachmentData }] : [])
          ],
        },
      ],
      generationConfig: {
        maxOutputTokens: chatbotConfig.settings.maxTokens,
        temperature: chatbotConfig.settings.temperature,
      },
    };

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to generate response");
      }

      const data = await response.json();
      const botResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't generate a response.";

      const botMessage: Message = {
        id: Date.now().toString() + "-bot",
        content: botResponse,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error: any) {
      console.error("Error generating response:", error);
      const errorMessage: Message = {
        id: Date.now().toString() + "-error",
        content: `Error: ${error.message}`,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && !attachment) return;

    const processMessage = (attachmentData?: { data: string; mime_type: string }) => {
      const userMessage: Message = {
        id: Date.now().toString() + "-user",
        content: inputMessage.trim(),
        isUser: true,
        timestamp: new Date(),
        attachment: attachment ? {
          type: attachment.type,
          data: URL.createObjectURL(attachment),
          name: attachment.name,
        } : undefined,
      };

      setMessages(prev => [...prev, userMessage]);
      setInputMessage("");
      setAttachment(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setIsTyping(true);

      // Generate bot response
      setTimeout(() => {
        generateResponse(userMessage.content, attachmentData);
      }, 500);
    };

    if (attachment) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = (reader.result as string).split(",")[1];
        const attachmentData = {
          data: base64String,
          mime_type: attachment.type,
        };
        processMessage(attachmentData);
      };
      reader.readAsDataURL(attachment);
    } else {
      processMessage();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chat Toggle Button */}
      <Button
        onClick={onToggle}
        size="lg"
        className={`rounded-full w-14 h-14 shadow-chatbot transition-all duration-300 ${
          isOpen ? "rotate-180 bg-destructive hover:bg-destructive/90" : "bg-gradient-primary"
        }`}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <Card className="absolute bottom-16 right-0 w-96 h-[500px] flex flex-col shadow-chatbot border-0 bg-gradient-surface">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-gradient-primary text-chatbot-primary-foreground rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">{chatbotConfig.ui.title}</h3>
                <p className="text-xs opacity-90">{chatbotConfig.ui.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={isApiKeyDialogOpen} onOpenChange={setIsApiKeyDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                    <Key className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Set Google AI API Key</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="apikey">API Key</Label>
                      <Input
                        id="apikey"
                        type="password"
                        placeholder="Enter your Google AI API key"
                        value={tempApiKey}
                        onChange={(e) => setTempApiKey(e.target.value)}
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Get your API key from Google AI Studio
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={saveApiKey} className="flex-1">
                        Save API Key
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsApiKeyDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              {apiKey && (
                <Badge variant="secondary" className="text-xs">
                  API Connected
                </Badge>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.isUser ? "justify-end" : "justify-start"}`}
              >
                {!message.isUser && (
                  <div className="w-8 h-8 rounded-full bg-chatbot-primary flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-chatbot-primary-foreground" />
                  </div>
                )}
                <div className={`max-w-[80%] ${message.isUser ? "order-first" : ""}`}>
                  {message.attachment && (
                    <div className="mb-2">
                      <img
                        src={message.attachment.data}
                        alt={message.attachment.name}
                        className="max-w-full h-auto rounded-lg shadow-message"
                      />
                    </div>
                  )}
                  <div
                    className={`p-3 rounded-lg shadow-message ${
                      message.isUser
                        ? "bg-chatbot-message-user text-chatbot-primary-foreground"
                        : "bg-chatbot-message-bot text-foreground"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
                {message.isUser && (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-chatbot-primary flex items-center justify-center">
                  <Bot className="h-4 w-4 text-chatbot-primary-foreground" />
                </div>
                <div className="bg-chatbot-message-bot p-3 rounded-lg">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-chatbot-thinking rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-chatbot-thinking rounded-full animate-pulse delay-150"></div>
                    <div className="w-2 h-2 bg-chatbot-thinking rounded-full animate-pulse delay-300"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t bg-white">
            {attachment && (
              <div className="mb-2 flex items-center gap-2 p-2 bg-muted rounded-lg">
                <div className="flex items-center gap-2 flex-1">
                  <Paperclip className="h-4 w-4" />
                  <span className="text-sm truncate">{attachment.name}</span>
                </div>
                <Button size="sm" variant="ghost" onClick={removeAttachment}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileAttachment}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={!apiKey}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={chatbotConfig.ui.placeholder}
                className="flex-1 min-h-0 resize-none"
                rows={1}
                disabled={!apiKey}
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={(!inputMessage.trim() && !attachment) || !apiKey}
                className="bg-chatbot-primary hover:bg-chatbot-primary/90"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            {!apiKey && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Please set your API key to start chatting
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};