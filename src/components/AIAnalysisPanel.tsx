import { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Define types for the component props
interface AIAnalysisPanelProps {
  documentText: string;
  highlightedTexts: string[];
  isDarkMode: boolean;
}

const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = ({
  documentText,
  highlightedTexts,
  isDarkMode
}) => {
  const [insights, setInsights] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [analysisMethod, setAnalysisMethod] = useState<"gemini" | "vertex">("gemini");

  const analyzeWithGemini = async () => {
    setIsLoading(true);
    try {
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const prompt = `Analyze this employment agreement based on CUAD dataset. The user has highlighted these clauses: ${highlightedTexts.join(", ")}. 
      Document content: ${documentText.substring(0, 30000)}... 
      Provide recommendations on: 
      1. Missing important clauses
      2. Potential legal risks
      3. Suggested optimizations
      4. Compliance checks`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      setInsights(response.text());
    } catch (error) {
      setInsights("Error generating insights. Please try again.");
    }
    setIsLoading(false);
  };

  const analyzeWithVertexAI = async () => {
    setIsLoading(true);
    try {
      // Use the provided API key for Vertex AI
      const vertexApiKey = "AIzaSyDWDCGtTYZc1atR91aUJq5OMFYrFyzIEpE";
      const genAI = new GoogleGenerativeAI(vertexApiKey);

      // Use a model that supports supervised fine-tuning according to Google Cloud docs
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-001",
        generationConfig: {
          temperature: 1,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
      });

      const prompt = `You are a legal AI assistant powered by Vertex AI.
      
      Analyze this employment agreement based on CUAD dataset. The user has highlighted these clauses: ${highlightedTexts.join(", ")}. 
      Document content: ${documentText.substring(0, 30000)}... 
      
      Provide detailed recommendations on: 
      1. Missing important clauses that should be included
      2. Potential legal risks and vulnerabilities in the agreement
      3. Suggested optimizations to strengthen the contract
      4. Compliance checks against relevant employment laws
      5. Potential negotiation points for both parties`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      setInsights(response.text());
    } catch (error) {
      console.error("Error in Vertex AI simulation:", error);
      setInsights("Error generating insights with Vertex AI. Please try again.");
    }
    setIsLoading(false);
  };

  const handleAnalyze = async () => {
    if (analysisMethod === "gemini") {
      await analyzeWithGemini();
    } else {
      await analyzeWithVertexAI();
    }
  };

  return (
    <div className={`mt-8 p-6 rounded-3xl shadow-xl border ${isDarkMode ? "bg-gray-800/90 border-gray-700" : "bg-white/90 border-teal-100"
      }`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-xl font-semibold ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`}>
          🧠 AI Contract Analysis
        </h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center">
            <select
              value={analysisMethod}
              onChange={(e) => setAnalysisMethod(e.target.value as "gemini" | "vertex")}
              className={`px-3 py-1 rounded-lg mr-2 ${isDarkMode
                ? "bg-gray-700 text-white border-gray-600"
                : "bg-white text-gray-800 border-gray-200"
                } border`}
            >
              <option value="gemini">Gemini AI</option>
              <option value="vertex">Vertex AI (Advanced)</option>
            </select>
            <button
              onClick={handleAnalyze}
              disabled={isLoading}
              className={`px-4 py-2 rounded-full ${isDarkMode
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-emerald-100 hover:bg-emerald-200 text-emerald-800"
                } transition-all`}
            >
              {isLoading ? "Analyzing..." : "Run AI Scan"}
            </button>
          </div>
        </div>
      </div>
      {insights && (
        <div className={`p-4 rounded-xl ${isDarkMode ? "bg-gray-700/50" : "bg-gray-100/50"
          } whitespace-pre-line`}>
          {insights}
        </div>
      )}
    </div>
  );
};

export default AIAnalysisPanel;
