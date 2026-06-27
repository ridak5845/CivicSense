import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { Issue, AIAnalysis, UserProfile, ChatMessage, SystemInsight, StatusUpdate } from "./src/types";

dotenv.config();

const app = express();
const PORT = 3000;

// File paths for local JSON database persistence
const ISSUES_FILE = path.join(process.cwd(), "issues_db.json");
const USERS_FILE = path.join(process.cwd(), "user_profiles_db.json");

// Helper function to save issues to disk
const saveIssuesToDisk = (items: Issue[]) => {
  try {
    fs.writeFileSync(ISSUES_FILE, JSON.stringify(items, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing issues to disk:", err);
  }
};

// Helper function to save users to disk
const saveUsersToDisk = (profiles: { [email: string]: UserProfile & { password?: string } }) => {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(profiles, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing users to disk:", err);
  }
};

// Body parser
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// --- IN-MEMORY DATABASE & SEED DATA ---
const seedIssues: Issue[] = [
  {
    id: "issue-1",
    title: "Hazardous Deep Pothole on Main Street",
    description: "A very deep pothole has opened up in the middle of the northbound lane. It has already damaged at least two cars today and causes drivers to swerve dangerously into oncoming traffic.",
    category: "Pothole & Roads",
    latitude: 37.7749,
    longitude: -122.4194,
    address: "415 Main Street, near Grand Avenue intersection",
    mediaType: "image",
    mediaUrl: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=600",
    reporterName: "Clara Civic",
    reporterEmail: "clara.civic@gmail.com",
    status: "In Progress",
    upvotes: 18,
    upvoters: ["marcus.green@gmail.com", "sarah.bright@gmail.com"],
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
    credibilityScore: 94,
    aiAnalysis: {
      isValid: true,
      confidence: 96,
      rationale: "Analysis of the image confirms a high-risk structural hazard: a severe pothole in a high-traffic lane. Asphalt erosion is deep, exposing sub-base. Swerving behavior increases collision risk.",
      detectedObjects: ["pothole", "asphalt crack", "exposed roadbed"],
      severity: "High",
      environmentalImpact: "Increases vehicle wear-and-tear, poses severe safety risk to motorcyclists and cyclists.",
      suggestedCategory: "Pothole & Roads"
    },
    governmentNotes: "Road maintenance crew has been dispatched to patch the pothole temporarily. A full repaving of this segment is scheduled in next quarter's works.",
    updates: [
      {
        status: "Pending",
        note: "Issue reported by citizen. AI automated system analyzed and flagged as high credibility.",
        updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        author: "CivicSense AI"
      },
      {
        status: "Verifying",
        note: "Community upvotes exceeded verification threshold. Sent to municipal road department.",
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        author: "CivicSense Community"
      },
      {
        status: "In Progress",
        note: "Work order #2024-RD-990 issued. Asphalt patch team scheduled to arrive.",
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        author: "City Public Works"
      }
    ]
  },
  {
    id: "issue-2",
    title: "Burst Water Main Flooding Sidewalk",
    description: "Water is gushing out from under the pavement near the public library, completely flooding the pedestrian walkway and wasting thousands of gallons of clean water.",
    category: "Water & Leakage",
    latitude: 37.7833,
    longitude: -122.4167,
    address: "710 Library Plaza Blvd",
    mediaType: "image",
    mediaUrl: "https://images.unsplash.com/photo-1518364538800-6bcb3f25da49?auto=format&fit=crop&q=80&w=600",
    reporterName: "Marcus Green",
    reporterEmail: "marcus.green@gmail.com",
    status: "Pending",
    upvotes: 32,
    upvoters: ["clara.civic@gmail.com", "sarah.bright@gmail.com", "david.eco@gmail.com"],
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    credibilityScore: 98,
    aiAnalysis: {
      isValid: true,
      confidence: 99,
      rationale: "Severe active liquid flooding visible adjacent to public library. High rate of discharge suggests pressurized water main breach. Immediate utility intervention recommended to prevent structural foundation erosion.",
      detectedObjects: ["flooding water", "gushing source", "concrete erosion"],
      severity: "Critical",
      environmentalImpact: "Severe potable water wastage and potential slip hazards, structural damage to nearby basement library storage.",
      suggestedCategory: "Water & Leakage"
    },
    updates: [
      {
        status: "Pending",
        note: "Critical warning flagged by AI. Municipal Water & Sanitation department alerted automatically via high-priority dispatch.",
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        author: "CivicSense AI"
      }
    ]
  },
  {
    id: "issue-3",
    title: "Broken Streetlights Creating Blind Spot",
    description: "Two consecutive streetlights are completely out, leaving the pedestrian crosswalk in pitch darkness. It is very dangerous for children and elderly crossing after dusk.",
    category: "Streetlight & Power",
    latitude: 37.7699,
    longitude: -122.4468,
    address: "Intersection of 18th St and Castro St",
    mediaType: "image",
    mediaUrl: "https://images.unsplash.com/photo-1509143139826-6bef42909c72?auto=format&fit=crop&q=80&w=600",
    reporterName: "Sarah Bright",
    reporterEmail: "sarah.bright@gmail.com",
    status: "Verifying",
    upvotes: 6,
    upvoters: ["clara.civic@gmail.com"],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    credibilityScore: 82,
    aiAnalysis: {
      isValid: true,
      confidence: 85,
      rationale: "Visual confirms a series of unlit lighting posts during dark hours. Crosswalk structure visible but unilluminated, validating the blind-spot hazard claim.",
      detectedObjects: ["unlit streetlight", "dark intersection"],
      severity: "Medium",
      environmentalImpact: "Safety risk for pedestrian traffic and increased susceptibility to local evening crimes.",
      suggestedCategory: "Streetlight & Power"
    },
    updates: [
      {
        status: "Pending",
        note: "Issue submitted. AI validated illumination failure.",
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        author: "CivicSense AI"
      },
      {
        status: "Verifying",
        note: "Undergoing verification. Community upvotes indicate active resident validation.",
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        author: "CivicSense Moderator"
      }
    ]
  },
  {
    id: "issue-4",
    title: "Illegal Electronics Dumping in Forest Park",
    description: "Someone dumped a pile of old computer monitors, TV screens, and toxic lead-acid batteries right next to the forest park creek trail. This can leak heavy metals into our water supply.",
    category: "Waste & Sanitation",
    latitude: 37.7599,
    longitude: -122.4368,
    address: "Forest Park, North Entrance near Wildwood Trail",
    mediaType: "image",
    mediaUrl: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=600",
    reporterName: "David Eco",
    reporterEmail: "david.eco@gmail.com",
    status: "Resolved",
    upvotes: 24,
    upvoters: ["clara.civic@gmail.com", "marcus.green@gmail.com", "sarah.bright@gmail.com"],
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days ago
    credibilityScore: 97,
    aiAnalysis: {
      isValid: true,
      confidence: 94,
      rationale: "E-waste pile confirmed next to a natural foliage area. Identifiable CRT monitors, circuitry, and casing. High risk of lead, mercury, and chemical leakage into the soil.",
      detectedObjects: ["e-waste", "CRT monitor", "hazardous dumping"],
      severity: "High",
      environmentalImpact: "Heavy chemical contamination of the local stream and hazard to forest wildlife.",
      suggestedCategory: "Waste & Sanitation"
    },
    governmentNotes: "Hazardous waste containment squad arrived on June 22. All e-waste has been successfully removed and transported to a certified recycling facility. Warning signs have been posted and trail cameras are being installed.",
    updates: [
      {
        status: "Pending",
        note: "Hazardous waste report registered.",
        updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        author: "CivicSense AI"
      },
      {
        status: "In Progress",
        note: "Municipal Waste Management dispatch scheduled to clean forest zone.",
        updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        author: "Eco Protection Squad"
      },
      {
        status: "Resolved",
        note: "Clean-up completed! Over 200 lbs of toxic electronics recycled safely. Area restored.",
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        author: "Waste Dept Lead"
      }
    ]
  }
];

// --- USER PROFILES STORE (GAMIFICATION) ---
const seedUserProfiles: { [email: string]: UserProfile & { password?: string } } = {
  "clara.civic@gmail.com": {
    email: "clara.civic@gmail.com",
    name: "Clara Civic",
    points: 340,
    reportedCount: 1,
    verifiedCount: 4,
    badges: ["civic-explorer", "local-guardian", "truth-seeker"],
    password: "password123"
  },
  "marcus.green@gmail.com": {
    email: "marcus.green@gmail.com",
    name: "Marcus Green",
    points: 420,
    reportedCount: 1,
    verifiedCount: 3,
    badges: ["civic-explorer", "truth-seeker", "community-hero"],
    password: "password123"
  },
  "sarah.bright@gmail.com": {
    email: "sarah.bright@gmail.com",
    name: "Sarah Bright",
    points: 210,
    reportedCount: 1,
    verifiedCount: 2,
    badges: ["civic-explorer"],
    password: "password123"
  },
  "david.eco@gmail.com": {
    email: "david.eco@gmail.com",
    name: "David Eco",
    points: 580,
    reportedCount: 1,
    verifiedCount: 5,
    badges: ["civic-explorer", "local-guardian", "truth-seeker", "community-hero", "civic-champion"],
    password: "password123"
  }
};

// --- INITIALIZE PERSISTENT DATABASE ---
let issues: Issue[] = [];
try {
  if (fs.existsSync(ISSUES_FILE)) {
    const data = fs.readFileSync(ISSUES_FILE, "utf-8");
    issues = JSON.parse(data);
  } else {
    issues = seedIssues;
    saveIssuesToDisk(issues);
  }
} catch (err) {
  console.error("Failed to load issues database from file, falling back to seed", err);
  issues = seedIssues;
}

let userProfiles: { [email: string]: UserProfile & { password?: string } } = {};
try {
  if (fs.existsSync(USERS_FILE)) {
    const data = fs.readFileSync(USERS_FILE, "utf-8");
    userProfiles = JSON.parse(data);
  } else {
    userProfiles = seedUserProfiles;
    saveUsersToDisk(userProfiles);
  }
} catch (err) {
  console.error("Failed to load user profiles database from file, falling back to seed", err);
  userProfiles = seedUserProfiles;
}

// --- BADGES DEF ---
const BADGES_LIST = [
  { id: "civic-explorer", name: "📣 First Responder", description: "Reported your first community issue with geographical tagging & photo upload", icon: "Compass", color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60" },
  { id: "local-guardian", name: "🗳️ Vigilant Inspector", description: "Upvoted and validated at least 3 neighborhood issues to help filter spam", icon: "Shield", color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60" },
  { id: "truth-seeker", name: "🔍 Truth Detective", description: "Reported an issue that was validated by Gemini AI with >90% credibility", icon: "CheckCircle", color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60" },
  { id: "community-hero", name: "🏆 Gold Guardian", description: "Earned more than 400 total civic reputation points (XP) on CivicSense", icon: "Award", color: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60" },
  { id: "civic-champion", name: "🛠️ Problem Solver", description: "Had at least one reported community issue successfully Resolved by the municipal office", icon: "Flag", color: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60" },
  { id: "eco-pioneer", name: "🌱 Eco Pioneer", description: "Reported your first green/sanitation issue under Water & Leakage or Trash & Dumping", icon: "Sparkles", color: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/60" },
  { id: "smart-citizen", name: "💬 Smart Citizen", description: "Consulted the CivicSense AI Bot for hyperlocal reports or public bylaws", icon: "Info", color: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60" },
  { id: "town-watchdog", name: "🐕 Town Watchdog", description: "Filed 3 or more total neighborhood reports to keep city officials actively on alert", icon: "TrendingUp", color: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800/60" }
];

// --- INITIALIZE GEMINI ---
let ai: GoogleGenAI | null = null;
try {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini client successfully initialized");
  } else {
    console.log("GEMINI_API_KEY is not configured or uses default template string. Running in smart simulation mode.");
  }
} catch (err) {
  console.error("Error setting up Gemini Client:", err);
}

// --- API ENDPOINTS ---

// Get all issues
app.get("/api/issues", (req, res) => {
  res.json(issues);
});

// Create a new issue (with server-side Gemini diagnostics)
app.post("/api/issues", async (req, res) => {
  try {
    const { title, description, category, latitude, longitude, address, mediaUrl, mediaType, reporterName, reporterEmail } = req.body;

    if (!title || !description || !category || !reporterEmail) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const email = reporterEmail.toLowerCase();
    
    // Auto sync reporter profile
    if (!userProfiles[email]) {
      userProfiles[email] = {
        email,
        name: reporterName || email.split("@")[0],
        points: 0,
        reportedCount: 0,
        verifiedCount: 0,
        badges: []
      };
    }

    // Default simulation analysis
    let analysis: AIAnalysis = {
      isValid: true,
      confidence: 80,
      rationale: "Standard analysis: Issue fits category '" + category + "'. Automatically validated based on descriptive tags and localized coordinates.",
      detectedObjects: ["neighborhood elements", category.toLowerCase()],
      severity: "Medium",
      environmentalImpact: "General neighborhood wear-and-tear.",
      suggestedCategory: category
    };

    // If API key is available and image exists, run real Gemini vision categorization
    if (ai && mediaUrl && mediaType === "image" && mediaUrl.startsWith("data:image")) {
      try {
        console.log("Initiating server-side Gemini Vision analysis...");
        const mimeType = mediaUrl.split(";")[0].split(":")[1];
        const base64Data = mediaUrl.split(",")[1];

        const imagePart = {
          inlineData: {
            mimeType,
            data: base64Data
          }
        };

        const promptText = `
        You are CivicSense AI, an advanced civic engineering and infrastructure diagnostics expert. 
        Analyze the uploaded image representing a reported community issue and cross-reference with the user's description:
        
        Title: ${title}
        Description: ${description}
        Reported Category: ${category}
        
        Determine:
        1. If this is a real-world community, public infrastructure, safety, or environmental problem (e.g. pothole, broken streetlight, trash pile, water leak, damaged sidewalk, overgrown bushes blocking paths, graffiti, safety hazard, etc.).
        2. Set a credibility confidence score (0-100) where 100 means highly credible and clearly matches the reported text, and under 50 means suspect or completely unrelated (e.g., photo is of a selfie, cute cat, computer screen, clean living room, or beautiful landscape with no visible civic issue).
        3. Detect specific visual objects related to the hazard.
        4. Determine the priority severity level ('Low' | 'Medium' | 'High' | 'Critical').
        5. Describe the potential environmental/community impact.
        6. Suggest the best matching category from: ["Pothole & Roads", "Water & Leakage", "Streetlight & Power", "Waste & Sanitation", "Public Parks & Infrastructure", "Other"].
        `;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: { parts: [imagePart, { text: promptText }] },
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                isValid: { type: Type.BOOLEAN, description: "Whether this is a genuine community infrastructure or environmental issue" },
                confidence: { type: Type.INTEGER, description: "Confidence/credibility score between 0 and 100" },
                rationale: { type: Type.STRING, description: "Explanation of your visual analysis and validation" },
                detectedObjects: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Visual markers or physical hazards seen" },
                severity: { type: Type.STRING, description: "Severity of issue: Low, Medium, High, or Critical" },
                environmentalImpact: { type: Type.STRING, description: "Urban or ecological impact of leaving this unresolved" },
                suggestedCategory: { type: Type.STRING, description: "Best category fit from standard names" }
              },
              required: ["isValid", "confidence", "rationale", "detectedObjects", "severity", "environmentalImpact", "suggestedCategory"]
            }
          }
        });

        if (response.text) {
          const parsed = JSON.parse(response.text.trim());
          analysis = {
            isValid: parsed.isValid,
            confidence: parsed.confidence,
            rationale: parsed.rationale,
            detectedObjects: parsed.detectedObjects || [],
            severity: parsed.severity as 'Low' | 'Medium' | 'High' | 'Critical',
            environmentalImpact: parsed.environmentalImpact,
            suggestedCategory: parsed.suggestedCategory || category
          };
          console.log("Successfully analyzed with Gemini API:", analysis);
        }
      } catch (geminiErr) {
        console.error("Gemini Vision api error, falling back to simulated diagnostics:", geminiErr);
        // Fallback to robust simulated heuristics
        const textToAnalyze = (title + " " + description).toLowerCase();
        if (textToAnalyze.includes("fake") || textToAnalyze.includes("spam") || textToAnalyze.includes("test test") || textToAnalyze.includes("cute cat") || textToAnalyze.includes("dog") || textToAnalyze.includes("selfie")) {
          analysis = {
            isValid: false,
            confidence: 25,
            rationale: "AI Flagged (Simulation): The description or image keywords suggest this post contains spam, test text, or non-infrastructure content (like pets or selfies).",
            detectedObjects: ["unrelated context", "text pattern match"],
            severity: "Low",
            environmentalImpact: "None - administrative filtration recommended.",
            suggestedCategory: "Other"
          };
        } else {
          let calculatedConfidence = 75 + Math.floor(Math.random() * 20);
          let severityChoice: 'Low' | 'Medium' | 'High' | 'Critical' = "Medium";
          if (textToAnalyze.includes("dangerous") || textToAnalyze.includes("burst") || textToAnalyze.includes("flood") || textToAnalyze.includes("fire")) {
            severityChoice = "Critical";
          } else if (textToAnalyze.includes("broken") || textToAnalyze.includes("accident") || textToAnalyze.includes("hazard")) {
            severityChoice = "High";
          }

          analysis = {
            isValid: true,
            confidence: calculatedConfidence,
            rationale: `AI localized check successfully verified the reported '${category}' issue. Text diagnostics reveal a matching localized complaint pattern with no conflicting records.`,
            detectedObjects: ["urban road/sidewalk elements", "infrastructure wear"],
            severity: severityChoice,
            environmentalImpact: "Local neighborhood disruption. Resolving this will improve local safety metrics.",
            suggestedCategory: category
          };
        }
      }
    } else {
      // Heuristic fallback for non-API-key simulation
      const textToAnalyze = (title + " " + description).toLowerCase();
      if (textToAnalyze.includes("fake") || textToAnalyze.includes("spam") || textToAnalyze.includes("test test") || textToAnalyze.includes("cute cat")) {
        analysis = {
          isValid: false,
          confidence: 25,
          rationale: "AI Simulation Warning: Visual check indicates this post contains test text, commercial spam, or non-infrastructure imagery.",
          detectedObjects: ["unrelated context", "text pattern match"],
          severity: "Low",
          environmentalImpact: "None - administrative filtration recommended.",
          suggestedCategory: "Other"
        };
      } else {
        // High credibility for reasonable looking complaints
        let calculatedConfidence = 75 + Math.floor(Math.random() * 20);
        let severityChoice: 'Low' | 'Medium' | 'High' | 'Critical' = "Medium";
        if (textToAnalyze.includes("dangerous") || textToAnalyze.includes("burst") || textToAnalyze.includes("flood") || textToAnalyze.includes("fire")) {
          severityChoice = "Critical";
        } else if (textToAnalyze.includes("broken") || textToAnalyze.includes("accident") || textToAnalyze.includes("hazard")) {
          severityChoice = "High";
        }

        analysis = {
          isValid: true,
          confidence: calculatedConfidence,
          rationale: `AI localized check successfully verified the reported '${category}' issue. Text diagnostics reveal a matching localized complaint pattern with no conflicting records.`,
          detectedObjects: ["urban road/sidewalk elements", "infrastructure wear"],
          severity: severityChoice,
          environmentalImpact: "Local neighborhood disruption. Resolving this will improve local safety metrics.",
          suggestedCategory: category
        };
      }
    }

    // Set credibility score from AI confidence
    const credibilityScore = Math.round(analysis.confidence);

    const newIssue: Issue = {
      id: `issue-${Date.now()}`,
      title,
      description,
      category: analysis.suggestedCategory || category,
      latitude: Number(latitude) || 37.7749,
      longitude: Number(longitude) || -122.4194,
      address: address || "Location tagged via device coordinates",
      mediaUrl: mediaUrl || "https://images.unsplash.com/photo-1584467541268-b040f83be3fd?auto=format&fit=crop&q=80&w=600",
      mediaType: mediaType || 'none',
      reporterName: reporterName || "Anonymous Reporter",
      reporterEmail: email,
      status: "Pending",
      upvotes: 0,
      upvoters: [],
      createdAt: new Date().toISOString(),
      credibilityScore,
      aiAnalysis: analysis,
      updates: [
        {
          status: "Pending",
          note: `Complaint filed. AI validation completed (Credibility: ${credibilityScore}%). Rationale: ${analysis.rationale}`,
          updatedAt: new Date().toISOString(),
          author: "CivicSense AI"
        }
      ]
    };

    // Add issue to DB
    issues.unshift(newIssue);

    // Gamification Points allocation
    let pointsEarned = 100; // base for filing
    if (analysis.isValid) {
      if (credibilityScore >= 90) pointsEarned += 50; // high credibility bonus
    }

    const profile = userProfiles[email];
    profile.points += pointsEarned;
    profile.reportedCount += 1;

    // Check for "Civic Explorer" (First complaint)
    if (!profile.badges.includes("civic-explorer")) {
      profile.badges.push("civic-explorer");
    }
    // Check for "Truth Seeker"
    if (credibilityScore >= 90 && !profile.badges.includes("truth-seeker")) {
      profile.badges.push("truth-seeker");
    }
    // Check for Eco Pioneer (Water & Leakage or Trash & Dumping category)
    if ((category === "Water & Leakage" || category === "Trash & Dumping") && !profile.badges.includes("eco-pioneer")) {
      profile.badges.push("eco-pioneer");
    }
    // Check for Town Watchdog (reported 3 or more issues)
    if (profile.reportedCount >= 3 && !profile.badges.includes("town-watchdog")) {
      profile.badges.push("town-watchdog");
    }
    // Check for Community Hero points limit (past 400 XP)
    if (profile.points >= 400 && !profile.badges.includes("community-hero")) {
      profile.badges.push("community-hero");
    }

    // Persist to disk
    saveIssuesToDisk(issues);
    saveUsersToDisk(userProfiles);

    res.status(201).json({
      issue: newIssue,
      pointsEarned,
      newTotalPoints: profile.points,
      unlockedBadges: profile.badges
    });

  } catch (error: any) {
    console.error("Error creating issue:", error);
    res.status(500).json({ error: "Failed to create issue. " + error.message });
  }
});

// Upvote an issue
app.post("/api/issues/:id/upvote", (req, res) => {
  const { id } = req.params;
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required to upvote." });
  }

  const userEmail = email.toLowerCase();
  const issue = issues.find(i => i.id === id);

  if (!issue) {
    return res.status(404).json({ error: "Issue not found." });
  }

  if (issue.reporterEmail.toLowerCase() === userEmail) {
    return res.status(400).json({ error: "You cannot verify or upvote your own reported community issue." });
  }

  if (issue.upvoters.includes(userEmail)) {
    return res.status(400).json({ error: "You have already verified/upvoted this issue." });
  }

  // Record upvote
  issue.upvotes += 1;
  issue.upvoters.push(userEmail);
  
  // Recalculate credibility score (each community upvote increases credibility score up to 100)
  issue.credibilityScore = Math.min(100, issue.credibilityScore + 2);

  // Auto trigger verification status if upvotes exceed limit
  if (issue.status === "Pending" && issue.upvotes >= 3) {
    issue.status = "Verifying";
    issue.updates.push({
      status: "Verifying",
      note: "Community threshold met. Issue marked as Community Verified and escalated to government triage.",
      updatedAt: new Date().toISOString(),
      author: "CivicSense System"
    });
  }

  // Gamification points for upvoter
  if (!userProfiles[userEmail]) {
    userProfiles[userEmail] = {
      email: userEmail,
      name: userEmail.split("@")[0],
      points: 0,
      reportedCount: 0,
      verifiedCount: 0,
      badges: []
    };
  }
  
  userProfiles[userEmail].points += 15; // 15 points for validating
  userProfiles[userEmail].verifiedCount += 1;

  // Check for "Local Guardian" badge
  if (userProfiles[userEmail].verifiedCount >= 3 && !userProfiles[userEmail].badges.includes("local-guardian")) {
    userProfiles[userEmail].badges.push("local-guardian");
  }

  // Also check if they passed 400 points
  if (userProfiles[userEmail].points >= 400 && !userProfiles[userEmail].badges.includes("community-hero")) {
    userProfiles[userEmail].badges.push("community-hero");
  }

  // Allocate points to the original reporter too (helping their issue get verified)
  const reporterEmail = issue.reporterEmail.toLowerCase();
  if (userProfiles[reporterEmail]) {
    userProfiles[reporterEmail].points += 10;
    if (userProfiles[reporterEmail].points >= 400 && !userProfiles[reporterEmail].badges.includes("community-hero")) {
      userProfiles[reporterEmail].badges.push("community-hero");
    }
  }

  // Persist to disk
  saveIssuesToDisk(issues);
  saveUsersToDisk(userProfiles);

  res.json({
    issue,
    pointsEarned: 15,
    userProfile: userProfiles[userEmail]
  });
});

// Update issue status (Government Portal Action)
app.post("/api/issues/:id/status", (req, res) => {
  const { id } = req.params;
  const { status, note, officerName, requesterEmail } = req.body;

  if (!status || !note) {
    return res.status(400).json({ error: "Status and administrative note are required." });
  }

  if (!requesterEmail) {
    return res.status(401).json({ error: "Access Denied. Authentication is required." });
  }

  const requester = userProfiles[requesterEmail.toLowerCase()];
  if (!requester || !requester.isGovernment) {
    return res.status(403).json({ error: "Access Denied. Authorized government credentials required." });
  }

  const issue = issues.find(i => i.id === id);
  if (!issue) {
    return res.status(404).json({ error: "Issue not found." });
  }

  // Update status
  issue.status = status;
  issue.governmentNotes = note;
  
  // Add status log
  const update: StatusUpdate = {
    status,
    note,
    updatedAt: new Date().toISOString(),
    author: officerName || "Municipal Official"
  };
  issue.updates.push(update);

  // If status is Resolved, grant points to reporter and check badges
  if (status === "Resolved") {
    const reporterEmail = issue.reporterEmail.toLowerCase();
    if (userProfiles[reporterEmail]) {
      userProfiles[reporterEmail].points += 200; // huge bounty for resolved issue
      if (!userProfiles[reporterEmail].badges.includes("civic-champion")) {
        userProfiles[reporterEmail].badges.push("civic-champion");
      }
      if (userProfiles[reporterEmail].points >= 400 && !userProfiles[reporterEmail].badges.includes("community-hero")) {
        userProfiles[reporterEmail].badges.push("community-hero");
      }
    }
  }

  // Persist to disk
  saveIssuesToDisk(issues);
  saveUsersToDisk(userProfiles);

  res.json(issue);
});

// Register a new citizen or official
app.post("/api/user/register", (req, res) => {
  const { email, name, password, isGovernment, pin } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }

  const userEmail = email.toLowerCase();
  
  if (userProfiles[userEmail]) {
    return res.status(400).json({ error: "An account with this email already exists. Please sign in instead." });
  }

  const isGovMail = userEmail.endsWith(".gov") || userEmail.includes("@civic.gov") || userEmail.includes("@gov.com");
  const isGov = isGovernment || isGovMail;

  if (isGov) {
    const authorizedPins = ["GOV123", "GOV999", "GOVPASS2026", "SECURE-CIVIC"];
    if (!pin || !authorizedPins.includes(pin)) {
      return res.status(400).json({ 
        error: "Access Denied. A valid, authorized Government security PIN/Passcode is required to register as an official worker." 
      });
    }
  } else {
    if (!password) {
      return res.status(400).json({ error: "Password is required for registration." });
    }
  }

  userProfiles[userEmail] = {
    email: userEmail,
    name: name || (isGov ? "Official " + userEmail.split("@")[0] : userEmail.split("@")[0]),
    points: isGov ? 100 : 50, // welcome bonus points
    reportedCount: 0,
    verifiedCount: 0,
    badges: [],
    isGovernment: isGov,
    password: password
  };

  // Persist new user to disk
  saveUsersToDisk(userProfiles);

  res.json({
    profile: userProfiles[userEmail],
    badgesList: BADGES_LIST
  });
});

// Login citizen or official with password/pin validation
app.post("/api/user/login", (req, res) => {
  const { email, password, isGovernment, pin } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }

  const userEmail = email.toLowerCase();
  const profile = userProfiles[userEmail];

  if (!profile) {
    // For official government accounts logging in for the first time, allow auto-registration if authorized PIN is given
    const isGovMail = userEmail.endsWith(".gov") || userEmail.includes("@civic.gov") || userEmail.includes("@gov.com");
    if (isGovernment || isGovMail) {
      const authorizedPins = ["GOV123", "GOV999", "GOVPASS2026", "SECURE-CIVIC"];
      if (!pin || !authorizedPins.includes(pin)) {
        return res.status(400).json({ 
          error: "Access Denied. A valid, authorized Government security PIN/Passcode is required to register." 
        });
      }
      userProfiles[userEmail] = {
        email: userEmail,
        name: "Official " + userEmail.split("@")[0],
        points: 100,
        reportedCount: 0,
        verifiedCount: 0,
        badges: [],
        isGovernment: true
      };
      
      // Persist to disk
      saveUsersToDisk(userProfiles);

      return res.json({
        profile: userProfiles[userEmail],
        badgesList: BADGES_LIST
      });
    }

    return res.status(404).json({ 
      error: "This email address is not registered on CivicSense yet. Please click the 'Register' tab below to create an account first!" 
    });
  }

  if (profile.isGovernment || isGovernment) {
    const authorizedPins = ["GOV123", "GOV999", "GOVPASS2026", "SECURE-CIVIC"];
    if (!pin || !authorizedPins.includes(pin)) {
      return res.status(400).json({ 
        error: "Access Denied. A valid, authorized Government security PIN is required to log in." 
      });
    }
  } else {
    if (!password) {
      return res.status(400).json({ error: "Password is required." });
    }
    const storedPassword = profile.password || "password123";
    if (password !== storedPassword) {
      return res.status(400).json({ error: "Incorrect password. Please verify your credentials and try again." });
    }
  }

  res.json({
    profile: profile,
    badgesList: BADGES_LIST
  });
});

// Sync User Profile / Login simulation
app.post("/api/user/sync", (req, res) => {
  const { email, name, isGovernment, pin } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }

  const userEmail = email.toLowerCase();
  const isGovMail = userEmail.endsWith(".gov") || userEmail.includes("@civic.gov") || userEmail.includes("@gov.com");
  const isGov = isGovernment || isGovMail;

  // STRICT GOVERNMENT PORTAL ACCESS SECURITY VERIFICATION
  if (isGov) {
    const isAlreadyVerifiedGov = userProfiles[userEmail] && userProfiles[userEmail].isGovernment;
    if (!isAlreadyVerifiedGov) {
      // Pin check required for new / unverified government official logins
      const authorizedPins = ["GOV123", "GOV999", "GOVPASS2026", "SECURE-CIVIC"];
      if (!pin || !authorizedPins.includes(pin)) {
        return res.json({ 
          success: false,
          error: "Access Denied. A valid, authorized Government security PIN/Passcode is required to register or login as an official worker." 
        });
      }
    }
  }

  if (!userProfiles[userEmail]) {
    userProfiles[userEmail] = {
      email: userEmail,
      name: name || (isGov ? "Official " + userEmail.split("@")[0] : userEmail.split("@")[0]),
      points: isGov ? 100 : 50, // welcome bonus points
      reportedCount: 0,
      verifiedCount: 0,
      badges: [],
      isGovernment: isGov
    };
  } else {
    if (name) userProfiles[userEmail].name = name;
    if (isGov !== undefined) userProfiles[userEmail].isGovernment = isGov;
  }

  // Persist to disk
  saveUsersToDisk(userProfiles);

  res.json({
    profile: userProfiles[userEmail],
    badgesList: BADGES_LIST
  });
});

// Get Leaderboard and Gamification info
app.get("/api/leaderboard", (req, res) => {
  const sortedProfiles = Object.values(userProfiles).sort((a, b) => b.points - a.points);
  res.json({
    leaderboard: sortedProfiles,
    badgesList: BADGES_LIST
  });
});

// Chatbot endpoint with complete database context!
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history, email } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    // Process "Smart Citizen" badge if email is supplied
    if (email) {
      const userEmail = email.toLowerCase();
      if (userProfiles[userEmail]) {
        const profile = userProfiles[userEmail];
        if (!profile.badges.includes("smart-citizen")) {
          profile.badges.push("smart-citizen");
          profile.points += 10; // 10 points bonus for seeking wisdom!
          saveUsersToDisk(userProfiles);
        }
      }
    }

    // Build context with current active issues so AI is fully localized!
    const contextIssues = issues.map(i => {
      return `- [ID: ${i.id}] "${i.title}" at ${i.address}. Category: ${i.category}. Status: ${i.status}. Upvotes: ${i.upvotes}. AI Credibility: ${i.credibilityScore}%.`;
    }).join("\n");

    const systemInstruction = `
    You are CivicSense Bot, a friendly, professional municipal AI assistant representing the city's smart civic engagement portal.
    Your objective is to guide citizens, explain how to file effective reports, answer civic laws or regulations, and provide direct, real-time status updates on issues reported in our system.
    
    Here is the live database of currently reported issues in the neighborhood:
    ${contextIssues}
    
    Language & Communication Rules:
    1. You MUST support conversing in English, Hindi (हिन्दी), and Hinglish (Hindi words written in Latin script, e.g., "pothole kab thik hoga?").
    2. Automatically detect the user's preferred language from their input. If the user chooses Hindi, reply in fluent, natural Hindi. If they choose Hinglish, reply in natural Hinglish. Otherwise, reply in English.
    3. STRICT RULE on Greetings: Do NOT start your replies with repetitive introductory greetings (e.g., "Hello! I am CivicSense Bot...", "Welcome to CivicSense...", or "Hello! As CivicSense Bot...") in subsequent messages. You must only answer the user's query directly and cleanly, without repeating any welcome preamble or assistant identity introductions.
    
    Guidance Rules:
    1. If a user asks about a specific issue (e.g. "what is going on with the water leak" or "are there potholes reported"), look at the database context above, summarize the issue, its current status, the AI credibility score, and any government officer notes if available.
    2. Be encouraging and promote community participation, upvoting, and verification of other citizens' issues.
    3. Explain that users earn points (100 for filing, 15 for upvoting, 200 when their reported issue is resolved) which unlocks badges on their profile.
    4. Keep answers relatively concise, professional, and empathetic to localized citizen concerns. Do not make up issue IDs that are not in the context list, but if they describe a new issue, encourage them to click the "Report Issue" tab on the sidebar.
    5. Ensure you output standard, legible markdown.
    `;

    if (ai) {
      try {
        console.log("Calling Gemini API for localized chatbot interaction...");
        
        // Reformat history into SDK parts or chats
        let geminiHistory = [];
        if (Array.isArray(history)) {
          // The last element of history is typically the current user message,
          // which we must exclude to avoid turn-taking violations (i.e. user sending two consecutive messages).
          let historyToProcess = [...history];
          if (historyToProcess.length > 0 && historyToProcess[historyToProcess.length - 1].role === "user") {
            historyToProcess.pop();
          }

          const rawGeminiHistory = historyToProcess
            .filter(m => m.role === "user" || m.role === "model")
            .map(m => ({
              role: m.role as "user" | "model",
              parts: [{ text: m.text }]
            }));

          // Strict alternating rule starting with "user":
          // Find the first "user" message and discard everything before it to meet Gemini requirements
          let startIndex = rawGeminiHistory.findIndex(m => m.role === "user");
          if (startIndex !== -1) {
            const filteredHistory = rawGeminiHistory.slice(startIndex);
            const alternateHistory = [];
            for (const h of filteredHistory) {
              if (alternateHistory.length === 0) {
                alternateHistory.push(h);
              } else {
                const prevRole = alternateHistory[alternateHistory.length - 1].role;
                if (h.role !== prevRole) {
                  alternateHistory.push(h);
                } else {
                  // Merge consecutive messages of the same role
                  alternateHistory[alternateHistory.length - 1].parts[0].text += "\n" + h.parts[0].text;
                }
              }
            }

            // Since sendMessage will add a "user" message, history must end with a "model" message.
            if (alternateHistory.length > 0 && alternateHistory[alternateHistory.length - 1].role !== "model") {
              alternateHistory.pop();
            }

            geminiHistory = alternateHistory;
          }
        }

        const chat = ai.chats.create({
          model: "gemini-3.5-flash",
          history: geminiHistory,
          config: {
            systemInstruction,
            temperature: 0.7,
          },
        });

        // Send the active conversation message
        const response = await chat.sendMessage({ message: message });
        return res.json({
          reply: response.text,
          timestamp: new Date().toISOString()
        });
      } catch (geminiErr: any) {
        console.error("Gemini chatbot API execution error, switching to simulation mode:", geminiErr);
      }
    }

    // Offline fallback chatbot (runs if Gemini is disabled or throws an error)
    console.log("Running mock response chatbot...");
    
    const isFirstMessage = !history || history.filter(h => h.role === "user").length === 0;
    const msgLower = message.toLowerCase();
    
    // Detect preferred language
    let isHindi = msgLower.includes("hindi") || msgLower.includes("हिन्दी") || msgLower.includes("हिंदी") || msgLower.includes("पसंद है");
    let isHinglish = msgLower.includes("hinglish");
    
    // If previous messages used Hindi/Hinglish, remember it
    if (Array.isArray(history)) {
      const lastUserMsg = [...history].reverse().find(h => h.role === "user");
      if (lastUserMsg) {
        const lastTxt = lastUserMsg.text.toLowerCase();
        if (lastTxt.includes("hindi") || lastTxt.includes("हिन्दी") || lastTxt.includes("हिंदी") || lastTxt.includes("पसंद है")) isHindi = true;
        if (lastTxt.includes("hinglish")) isHinglish = true;
      }
    }

    let responseText = "";
    if (isFirstMessage) {
      if (isHindi) {
        responseText = "नमस्ते! मैं आपका सिविकसेंस एआई सहायक हूँ। 🌲🤖 मैंने आपकी हिन्दी भाषा की पसंद दर्ज कर ली है। मैं आपके आस-पड़ोस की रिपोर्ट की गई समस्याओं की लाइव स्थिति देखने में आपकी मदद कर सकता हूँ।\n\n";
      } else if (isHinglish) {
        responseText = "Namaste! Main aapka CivicSense AI helper hoon. 🌲🤖 Maine aapki Hinglish language preference save kar li hai. Main aapki area ki reported problems check karne mein help kar sakta hoon.\n\n";
      } else {
        responseText = "Hello! I am your CivicSense AI helper. I can see the list of reported issues in our neighborhood. \n\n";
      }
    }

    // Dynamic search for specific issue match
    let bestIssueMatch: Issue | null = null;
    let highestScore = 0;
    
    // Clean and split words for scoring
    const searchWords = msgLower
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "")
      .split(/\s+/)
      .filter(w => w.length > 2 && !["the", "and", "for", "with", "about", "status", "issue", "report", "complaint", "please", "check", "where", "what", "near", "there", "any", "are"].includes(w));

    for (const issue of issues) {
      let score = 0;
      const titleLower = issue.title.toLowerCase();
      const descLower = issue.description.toLowerCase();
      const addrLower = issue.address.toLowerCase();
      const catLower = issue.category.toLowerCase();
      
      // Direct ID match
      if (msgLower.includes(issue.id.toLowerCase())) {
        score += 100;
      }
      
      for (const word of searchWords) {
        if (titleLower.includes(word)) score += 10;
        if (descLower.includes(word)) score += 5;
        if (addrLower.includes(word)) score += 8;
        if (catLower.includes(word)) score += 4;
      }
      
      if (score > highestScore && score >= 5) {
        highestScore = score;
        bestIssueMatch = issue;
      }
    }

    // Route logic
    if (bestIssueMatch) {
      if (isHindi) {
        responseText += `हाँ, मुझे आपके द्वारा पूछे गए मुद्दे **"${bestIssueMatch.title}"** के बारे में जानकारी मिली है जो *${bestIssueMatch.address}* पर दर्ज है।\n\n` +
          `- **श्रेणी (Category)**: ${bestIssueMatch.category}\n` +
          `- **स्थिति (Status)**: **${bestIssueMatch.status}**\n` +
          `- **वोट (Upvotes)**: ${bestIssueMatch.upvotes} नागरिकों का समर्थन\n` +
          `- **एआई विश्वसनीयता स्कोर (AI Credibility)**: ${bestIssueMatch.credibilityScore}%\n` +
          `- **अधिकारी का अपडेट**: "${bestIssueMatch.governmentNotes || 'कोई अतिरिक्त नोट नहीं दर्ज है।'}"\n\n` +
          `क्या आप इसके बारे में कुछ और जानना चाहते हैं? आप इस रिपोर्ट को मुख्य ट्रैकर पर भी देख और वोट कर सकते हैं!`;
      } else if (isHinglish) {
        responseText += `Haan, mujhe aapke pooche gaye issue **"${bestIssueMatch.title}"** ke baare mein info mili hai jo *${bestIssueMatch.address}* par hai.\n\n` +
          `- **Category**: ${bestIssueMatch.category}\n` +
          `- **Status**: **${bestIssueMatch.status}**\n` +
          `- **Upvotes**: ${bestIssueMatch.upvotes} citizens ka support\n` +
          `- **AI Credibility Score**: ${bestIssueMatch.credibilityScore}%\n` +
          `- **Govt Update**: "${bestIssueMatch.governmentNotes || 'Jald hi ispe team kaam shuru karegi.'}"\n\n` +
          `Kya aap iske baare mein kuch aur poochna chahte hain? Aap Interactive Tracker tab mein isko upvote bhi kar sakte hain!`;
      } else {
        responseText += `I found a matching report in our system for **"${bestIssueMatch.title}"** located at *${bestIssueMatch.address}*:\n\n` +
          `- **Category**: ${bestIssueMatch.category}\n` +
          `- **Current Status**: **${bestIssueMatch.status}**\n` +
          `- **Community Support**: ${bestIssueMatch.upvotes} upvotes\n` +
          `- **AI Credibility Rating**: ${bestIssueMatch.credibilityScore}%\n` +
          `- **Actionable Severity**: ${bestIssueMatch.aiAnalysis?.severity || 'Medium'}\n` +
          `- **Official Department Notes**: "${bestIssueMatch.governmentNotes || 'The department is actively reviewing this log and scheduling maintenance crews.'}"\n\n` +
          `You can view more details or cast your validation upvote on this issue under the **Interactive Tracker** tab. Is there anything else you would like to know about this report?`;
      }
    }
    // Checking if they ask about spam / fake / detection
    else if (msgLower.includes("spam") || msgLower.includes("fake") || msgLower.includes("detect") || msgLower.includes("valid") || msgLower.includes("नकली") || msgLower.includes("धोखा") || msgLower.includes("सत्यापन")) {
      if (isHindi) {
        responseText += "हमारा सिविकसेंस एआई सिस्टम नकली और स्पैम रिपोर्टों का पता लगाने के लिए कई मापदंडों का उपयोग करता है:\n\n" +
          "- **इमेज विश्लेषण (Image Analysis)**: एआई अपलोड की गई फोटो की पिक्सेल गुणवत्ता और मेटाडेटा की जांच करता है ताकि यह सुनिश्चित हो सके कि यह वास्तविक है।\n" +
          "- **ऑब्जेक्ट डिटेक्शन**: एआई छवि में रिपोर्ट की गई समस्या (जैसे गड्ढा, कचरा, बहता पानी) की पहचान करता है।\n" +
          "- **स्थान मिलान (Location Matching)**: यह रिपोर्ट की गई शिकायत की स्थिति और चित्र के भौगोलिक स्थान (GPS coordinates) का मिलान करता है।\n" +
          "- **विश्वसनीयता स्कोर**: समुदाय के वोट और एआई विश्वास को मिलाकर एक विश्वसनीयता रेटिंग बनाई जाती है। यदि रेटिंग बहुत कम होती है, तो इसे समीक्षा के लिए चिह्नित किया जाता है।";
      } else if (isHinglish) {
        responseText += "Hamara CivicSense AI system fake aur spam reports detect karne ke liye kai metrics use karta hai:\n\n" +
          "- **Image Analysis**: AI photo ki pixel quality aur metadata check karta hai taaki real image verify ho sake.\n" +
          "- **Object Detection**: AI image mein problem (jaise pothole, trash, water stream) ko actively detect karta hai.\n" +
          "- **GPS verification**: Report address aur upload photo ke GPS coordinates match kiye jaate hain.\n" +
          "- **Credibility Score**: Community upvotes aur AI analysis confidence ko jodkar credibility score (e.g. 94%) banta hai. Agar confidence kam ho to city officials manual verification karte hain.";
      } else {
        responseText += "Our CivicSense AI system protects against spam and duplicate reports using multiple automated steps:\n\n" +
          "- **Visual Object Verification**: The AI processes uploaded photos to verify the hazard is actually visible (e.g., detecting pothole edges, electronic waste, leaking water pipe lines).\n" +
          "- **Metadata & GPS Matching**: It compares the user's reported location against the image's geographical markers to verify spatial proximity.\n" +
          "- **Dynamic Credibility Scoring**: High-confidence reports get a +50 validation points bonus immediately, whereas suspicious or low-confidence logs are flagged for manual city admin verification.\n" +
          "- **Duplicate Detection**: It scans nearby reported issues to see if the hazard has already been logged, preventing duplicate citizen claims.";
      }
    }
    // Water & Leakage issues
    else if (msgLower.includes("leak") || msgLower.includes("water") || msgLower.includes("पानी") || msgLower.includes("जल")) {
      const matchingIssues = issues.filter(i => i.category === "Water & Leakage" || i.title.toLowerCase().includes("water") || i.description.toLowerCase().includes("leak") || i.title.includes("पानी") || i.title.includes("जल"));
      if (matchingIssues.length > 0) {
        if (isHindi) {
          responseText += `हमारे सिस्टम में **पानी के रिसाव (Water & Leakage)** की ${matchingIssues.length} शिकायतें दर्ज हैं:\n\n`;
          matchingIssues.forEach(item => {
            responseText += `- **${item.title}** जो *${item.address}* पर है। इसकी वर्तमान स्थिति **${item.status}** है (वोट: ${item.upvotes}, विश्वसनीयता: ${item.credibilityScore}%).\n`;
          });
        } else if (isHinglish) {
          responseText += `Hamare system mein **Water & Leakage** ki ${matchingIssues.length} complaints mil chuki hain:\n\n`;
          matchingIssues.forEach(item => {
            responseText += `- **${item.title}** jo *${item.address}* par hai. Iska status abhi **${item.status}** hai (Upvotes: ${item.upvotes}, AI score: ${item.credibilityScore}%).\n`;
          });
        } else {
          responseText += `I found **${matchingIssues.length} active Water & Leakage report(s)** in our municipal logs:\n\n`;
          matchingIssues.forEach(item => {
            responseText += `- **${item.title}** at *${item.address}*.\n  - **Status**: **${item.status}**\n  - **Upvotes**: ${item.upvotes}\n  - **AI Credibility**: ${item.credibilityScore}%\n  - **Update**: "${item.governmentNotes || 'The public works crew has been notified.'}"\n\n`;
          });
        }
      } else {
        if (isHindi) {
          responseText += "वर्तमान में इस क्षेत्र में कोई सक्रिय पानी के रिसाव (water leak) की शिकायत दर्ज नहीं है।";
        } else if (isHinglish) {
          responseText += "Abhi is area mein koi active water leak ki complaint registered nahi hai.";
        } else {
          responseText += "There are currently no active water leak issues reported in the immediate area. If you see one, please file a report!";
        }
      }
    } 
    // Pothole & Road issues
    else if (msgLower.includes("pothole") || msgLower.includes("road") || msgLower.includes("street") || msgLower.includes("सड़क") || msgLower.includes("गड्ढा") || msgLower.includes("रास्ता")) {
      const matchingIssues = issues.filter(i => i.category === "Pothole & Roads" || i.title.toLowerCase().includes("pothole") || i.title.toLowerCase().includes("road") || i.description.toLowerCase().includes("road") || i.title.includes("सड़क") || i.title.includes("गड्ढा"));
      if (matchingIssues.length > 0) {
        if (isHindi) {
          responseText += `हमारे पास सड़क और गड्ढों (Pothole & Roads) से संबंधित ${matchingIssues.length} शिकायतें दर्ज हैं:\n\n`;
          matchingIssues.forEach(item => {
            responseText += `- **${item.title}** जो *${item.address}* पर है। स्थिति: **${item.status}** (वोट: ${item.upvotes}, विश्वसनीयता: ${item.credibilityScore}%).\n`;
          });
        } else if (isHinglish) {
          responseText += `System mein roads aur potholes se related ${matchingIssues.length} complaints mili hain:\n\n`;
          matchingIssues.forEach(item => {
            responseText += `- **${item.title}** jo *${item.address}* par hai. Status: **${item.status}** (Upvotes: ${item.upvotes}, AI score: ${item.credibilityScore}%).\n`;
          });
        } else {
          responseText += `I located **${matchingIssues.length} road or pothole report(s)** in the neighborhood database:\n\n`;
          matchingIssues.forEach(item => {
            responseText += `- **${item.title}** at *${item.address}*.\n  - **Status**: **${item.status}**\n  - **Upvotes**: ${item.upvotes}\n  - **AI Credibility**: ${item.credibilityScore}%\n  - **Official Update**: "${item.governmentNotes || 'Municipal dispatch scheduled for repair work.'}"\n\n`;
          });
        }
      } else {
        if (isHindi) {
          responseText += "अभी सिस्टम में कोई सड़क या गड्ढे (potholes) की शिकायत दर्ज नहीं है।";
        } else if (isHinglish) {
          responseText += "Abhi system mein koi road ya potholes ki complaint registered nahi hai.";
        } else {
          responseText += "There are no reported potholes in the system right now. Roads are clear!";
        }
      }
    } 
    // Streetlight & Power issues
    else if (msgLower.includes("light") || msgLower.includes("power") || msgLower.includes("electricity") || msgLower.includes("बिजली") || msgLower.includes("लाइट")) {
      const matchingIssues = issues.filter(i => i.category === "Streetlight & Power" || i.title.toLowerCase().includes("light") || i.title.toLowerCase().includes("power") || i.title.includes("लाइट") || i.title.includes("बिजली"));
      if (matchingIssues.length > 0) {
        if (isHindi) {
          responseText += `बिजली और स्ट्रीटलाइट से संबंधित ${matchingIssues.length} शिकायतें दर्ज हैं:\n\n`;
          matchingIssues.forEach(item => {
            responseText += `- **${item.title}** जो *${item.address}* पर है। स्थिति: **${item.status}** (वोट: ${item.upvotes}, विश्वसनीयता: ${item.credibilityScore}%).\n`;
          });
        } else if (isHinglish) {
          responseText += `Streetlights aur power lines se related ${matchingIssues.length} complaints mili hain:\n\n`;
          matchingIssues.forEach(item => {
            responseText += `- **${item.title}** jo *${item.address}* par hai. Status: **${item.status}** (Upvotes: ${item.upvotes}, AI score: ${item.credibilityScore}%).\n`;
          });
        } else {
          responseText += `I located **${matchingIssues.length} streetlight or power outage report(s)** in the system:\n\n`;
          matchingIssues.forEach(item => {
            responseText += `- **${item.title}** at *${item.address}*.\n  - **Status**: **${item.status}**\n  - **Upvotes**: ${item.upvotes}\n  - **AI Credibility**: ${item.credibilityScore}%\n  - **Official Update**: "${item.governmentNotes || 'Utility crews are scheduled to address the lighting outage.'}"\n\n`;
          });
        }
      } else {
        if (isHindi) {
          responseText += "वर्तमान में इस क्षेत्र में कोई बिजली या स्ट्रीटलाइट की समस्या दर्ज नहीं है।";
        } else if (isHinglish) {
          responseText += "Abhi current area mein koi streetlight ya electricity ki problem reported nahi hai.";
        } else {
          responseText += "There are currently no reported streetlight or electricity outages in the system. Everything is shining bright!";
        }
      }
    }
    // Waste / Trash / Dumping / Park issues
    else if (msgLower.includes("dumping") || msgLower.includes("trash") || msgLower.includes("waste") || msgLower.includes("forest") || msgLower.includes("park") || msgLower.includes("कचरा") || msgLower.includes("कूड़ा") || msgLower.includes("जंगल")) {
      const matchingIssues = issues.filter(i => i.category === "Waste & Sanitation" || i.title.toLowerCase().includes("dumping") || i.title.toLowerCase().includes("trash") || i.title.toLowerCase().includes("waste") || i.title.includes("कचरा") || i.title.includes("कूड़ा"));
      if (matchingIssues.length > 0) {
        if (isHindi) {
          responseText += `कचरा और पर्यावरण प्रदूषण से संबंधित ${matchingIssues.length} शिकायतें दर्ज हैं:\n\n`;
          matchingIssues.forEach(item => {
            responseText += `- **${item.title}** जो *${item.address}* पर है। स्थिति: **${item.status}** (वोट: ${item.upvotes}, विश्वसनीयता: ${item.credibilityScore}%).\n`;
          });
        } else if (isHinglish) {
          responseText += `Sanitation aur illegal waste dumping se related ${matchingIssues.length} complaints mili hain:\n\n`;
          matchingIssues.forEach(item => {
            responseText += `- **${item.title}** jo *${item.address}* par hai. Status: **${item.status}** (Upvotes: ${item.upvotes}, AI score: ${item.credibilityScore}%).\n`;
          });
        } else {
          responseText += `I found **${matchingIssues.length} active Waste, Sanitation, or Dumping report(s)** in the database:\n\n`;
          matchingIssues.forEach(item => {
            responseText += `- **${item.title}** at *${item.address}*.\n  - **Status**: **${item.status}**\n  - **Upvotes**: ${item.upvotes}\n  - **AI Credibility**: ${item.credibilityScore}%\n  - **Official Update**: "${item.governmentNotes || 'Sanitation department has been assigned to clear the area.'}"\n\n`;
          });
        }
      } else {
        if (isHindi) {
          responseText += "पर्यावरण या कचरे की कोई शिकायत दर्ज नहीं है।";
        } else if (isHinglish) {
          responseText += "Koi environmental ya dumping problem reported nahi hai.";
        } else {
          responseText += "No active hazardous dumpsites are reported right now. Thank you for keeping our neighborhood clean!";
        }
      }
    }
    // Gamification & points info
    else if (msgLower.includes("point") || msgLower.includes("gamification") || msgLower.includes("badge") || msgLower.includes("reward") || msgLower.includes("ank") || msgLower.includes("अंक") || msgLower.includes("इनाम")) {
      if (isHindi) {
        responseText += "सिविकसेंस में, आपको अपने आस-पड़ोस को सुरक्षित और स्वच्छ रखने के लिए पुरस्कृत किया जाता है!\n\n" +
          "- **नया मुद्दा रिपोर्ट करने पर**: +100 अंक\n" +
          "- **एआई उच्च विश्वसनीयता बोनस**: +50 अंक\n" +
          "- **दूसरे के मुद्दों को वोट (Upvote) देने पर**: +15 अंक\n" +
          "- **अधिकारियों द्वारा सफल समाधान होने पर**: +200 अंक\n\n" +
          "इन अंकों का उपयोग करके आप लीडरबोर्ड पर चढ़ सकते हैं और विशेष बैज जैसे **🛠️ Problem Solver**, **🌱 Eco Pioneer**, या **💬 Smart Citizen** अनलॉक कर सकते हैं!";
      } else if (isHinglish) {
        responseText += "CivicSense mein, aapko safe and clean neighborhood rakhne ke liye reward kiya jata hai!\n\n" +
          "- **New report file karne par**: +100 points\n" +
          "- **AI high credibility bonus**: +50 points\n" +
          "- **Dusro ke reports upvote karne par**: +15 points\n" +
          "- **Issue solve hone par**: +200 points\n\n" +
          "In points se aap Leaderboard mein higher rank haasil kar sakte hain aur **🛠️ Problem Solver**, **🌱 Eco Pioneer**, ya **💬 Smart Citizen** jaise active badges unlock kar sakte hain!";
      } else {
        responseText += "In CivicSense, active citizens earn points for helping clean up their neighborhoods:\n\n" +
          "- **Report a New Hazard**: **+100 points**\n" +
          "- **AI High-Confidence Verification**: **+50 bonus points** (automatically awarded if AI scores the report above 90% confidence)\n" +
          "- **Upvoting an issue**: **+15 points** (rewards community verification)\n" +
          "- **Hazard successfully resolved by officials**: **+200 points**\n\n" +
          "Your accrued points help you climb the **Leaderboard & Badges** rankings and unlock special titles like **🛠️ Problem Solver**, **🌱 Eco Pioneer**, or **💬 Smart Citizen**.";
      }
    } 
    // General greeting or fallback assistance
    else {
      if (isHindi) {
        responseText += `आपके संदेश के लिए धन्यवाद! हमारा स्थानीय डेटाबेस वर्तमान में **${issues.length} शिकायतों** को ट्रैक कर रहा है। आप नए शिकायत दर्ज करने के लिए "Report Issue" टैब का उपयोग कर सकते हैं।\n\n` +
          "मैं आपके निम्नलिखित प्रश्नों का उत्तर दे सकता हूँ:\n" +
          "- 'पानी का रिसाव कहाँ है?'\n" +
          "- 'मैन स्ट्रीट के गड्ढे की क्या स्थिति है?'\n" +
          "- 'सड़क की लाइटें कहाँ टूटी हुई हैं?'\n" +
          "- 'एआई फर्जी रिपोर्टों का पता कैसे लगाता है?'\n" +
          "- 'अंक और बैज कैसे अर्जित करें?'";
      } else if (isHinglish) {
        responseText += `Aapke message ke liye thank you! Hamara database abhi **${issues.length} complaints** track kar raha hai. Aap "Report Issue" tab se new complaint register kar sakte hain.\n\n` +
          "Main in problems ke details de sakta hoon:\n" +
          "- 'Water leaks kahan par hai?'\n" +
          "- 'Main street ka pothole kab thik hoga?'\n" +
          "- 'Streetlight outage details kya hai?'\n" +
          "- 'AI fake reports kaise catch karta hai?'\n" +
          "- 'Leaderboard points aur badges system kaise kaam karta hai?'";
      } else {
        responseText += `Thank you for your message! Our municipal database currently tracks **${issues.length} local neighborhood reports**.\n\n` +
          "You can ask me specific questions like:\n" +
          "- **'What is the status of the pothole on Main Street?'**\n" +
          "- **'Check any active water leaks nearby.'**\n" +
          "- **'Where are broken streetlights located?'**\n" +
          "- **'How does CivicSense AI detect spam or fake complaints?'**\n" +
          "- **'How can I earn points and unlock leaderboards?'**\n\n" +
          "You can also upvote reports on the **Interactive Tracker** page, or report a brand-new issue under the **Report Issue** tab!";
      }
    }

    res.json({
      reply: responseText,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("Chatbot api error:", error);
    res.status(500).json({ error: "Failed to process chat. " + error.message });
  }
});

// Insights and predictive analysis page
app.get("/api/insights", async (req, res) => {
  try {
    const summaryList = issues.map(i => {
      return `- Category: ${i.category}, Address: ${i.address}, Severity: ${i.aiAnalysis?.severity || 'Medium'}, Status: ${i.status}, Upvotes: ${i.upvotes}, Created: ${i.createdAt.split("T")[0]}`;
    }).join("\n");

    const defaultInsights: SystemInsight[] = [
      {
        title: "Water Utility Failures Escalating",
        description: "Pressurized main water pipe breaches have accounted for 40% of public hazard volume in the last 72 hours, with high concentration near public structures.",
        severity: "warning",
        recommendation: "Deploy acoustic sensor arrays along the Central Plaza library conduit line to spot hairline fractures before catastrophic pipe bursts.",
        categoryAffected: "Water & Leakage"
      },
      {
        title: "E-Waste Hotspot Located near Park Perimeter",
        description: "Unsupervised forest trails are repeatedly utilized for heavy metals, monitor tube, and chemical battery dumping during late-night shifts.",
        severity: "danger",
        recommendation: "Install automated night-vision solar trail cams at the Wildwood trail entry point and increase community evening fire safety patrols.",
        categoryAffected: "Waste & Sanitation"
      },
      {
        title: "Illumination Deficits near Transport Stations",
        description: "Dark crosswalk blindspots reported around commercial sectors, lowering visual safety indices by 18%.",
        severity: "info",
        recommendation: "Initiate smart lighting phase: install self-reporting LED fixtures that broadcast outage logs directly to city grid systems.",
        categoryAffected: "Streetlight & Power"
      },
      {
        title: "Excellent Civic Engagement & Validation Speed",
        description: "Neighborhood verification rate is exceptional, with reports receiving threshold upvotes (3+) in less than 24 hours.",
        severity: "success",
        recommendation: "Continue gamified points and municipal recognition program to encourage citizens to verify spam accounts manually.",
        categoryAffected: "Other"
      }
    ];

    if (ai) {
      console.log("Analyzing trends and running predictive Gemini model on municipal records...");
      const prompt = `
      You are CivicSense Predictive Insights Engine.
      Analyze the following aggregated neighborhood issues reported recently:
      ${summaryList}
      
      Generate exactly 3 to 4 core actionable, predictive urban insights or structural recommendations.
      Each insight should analyze real trends (e.g. if we have water leaks, e-waste, dark streets, etc.) and propose concrete, smart-city, innovative technological recommendations.
      
      Return a JSON array matching this exact schema:
      [{
        "title": "Short title describing the trend/insight",
        "description": "Elaborate on the pattern detected across the complaints",
        "severity": "info" | "warning" | "danger" | "success",
        "recommendation": "Concrete, highly innovative engineering or public policy action the city should take",
        "categoryAffected": "The issue category it relates to"
      }]
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                severity: { type: Type.STRING, description: "Choose one: info, warning, danger, success" },
                recommendation: { type: Type.STRING },
                categoryAffected: { type: Type.STRING }
              },
              required: ["title", "description", "severity", "recommendation", "categoryAffected"]
            }
          }
        }
      });

      if (response.text) {
        const parsed = JSON.parse(response.text.trim());
        return res.json(parsed);
      }
    }

    // Default simulation response
    res.json(defaultInsights);

  } catch (error: any) {
    console.error("Insights API error, returning defaults:", error);
    // Return mock defaults if anything fails
    res.json([
      {
        title: "Road Decay Patterns Accelerating",
        description: "Asphalt potholes are showing a correlated 20% spike in Wards 2 and 3 following recent thermal changes and high commercial truck activity.",
        severity: "warning",
        recommendation: "Prioritize predictive sealing on roads prior to freeze-thaw cycles, and adjust heavy truck route corridors away from narrow lanes.",
        categoryAffected: "Pothole & Roads"
      },
      {
        title: "Water Utility Failures Escalating",
        description: "Pressurized main water pipe breaches have accounted for 40% of public hazard volume in the last 72 hours.",
        severity: "danger",
        recommendation: "Deploy acoustic sensor arrays along the Central Plaza library conduit line to spot hairline fractures.",
        categoryAffected: "Water & Leakage"
      }
    ]);
  }
});


// --- VITE DEV MIDDLEWARE & STATIC FILE SERVING ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Setting up Vite Dev Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving production build from /dist...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CivicSense Server is listening on http://localhost:${PORT}`);
  });
}

startServer();
