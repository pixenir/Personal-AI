import { useState } from "react";
import { ChatBot } from "@/components/ChatBot";
import { Bot, Brain, MessageSquare, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Index = () => {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  const features = [
    {
      icon: <Brain className="h-8 w-8 text-chatbot-primary" />,
      title: "AI-Powered Conversations",
      description: "Advanced AI with customizable tone and style instructions for personalized interactions."
    },
    {
      icon: <MessageSquare className="h-8 w-8 text-chatbot-primary" />,
      title: "Smart Messaging",
      description: "Send text messages and images with intelligent responses powered by Google AI."
    },
    {
      icon: <Sparkles className="h-8 w-8 text-chatbot-primary" />,
      title: "Personalized Experience",
      description: "Configure your AI assistant's personality and response style through JSON settings."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-surface">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="p-4 bg-gradient-primary rounded-full shadow-chatbot">
                <Bot className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Your Personal
              <span className="block bg-gradient-primary bg-clip-text text-transparent">
                AI Assistant
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Experience intelligent conversations with our advanced AI chatbot. Customize its personality, 
              share images, and get personalized responses tailored to your needs.
            </p>
            <Button 
              size="lg" 
              onClick={() => setIsChatbotOpen(true)}
              className="bg-gradient-primary hover:opacity-90 text-chatbot-primary-foreground px-8 py-3 text-lg"
            >
              Start Chatting
              <Bot className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-4">Powerful Features</h2>
          <p className="text-lg text-muted-foreground">
            Everything you need for intelligent AI conversations
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-message bg-white/80 backdrop-blur">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 bg-chatbot-secondary rounded-full w-fit">
                  {feature.icon}
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-muted-foreground">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Configuration Section */}
      <div className="bg-chatbot-secondary/50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-6">Easy Configuration</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Simply add your Google AI API key and start chatting. Customize the AI's personality 
            through our JSON configuration file for a truly personalized experience.
          </p>
          <div className="bg-white rounded-lg p-6 shadow-message max-w-2xl mx-auto">
            <code className="text-sm text-left block">
              {`{
  "toneAndStyle": {
    "instructions": "You are a helpful, friendly AI assistant...",
    "personality": "Professional yet approachable"
  },
  "settings": {
    "model": "gemini-2.0-flash-exp",
    "temperature": 0.7
  }
}`}
            </code>
          </div>
        </div>
      </div>

      {/* Chatbot Component */}
      <ChatBot 
        isOpen={isChatbotOpen} 
        onToggle={() => setIsChatbotOpen(!isChatbotOpen)} 
      />
    </div>
  );
};

export default Index;
