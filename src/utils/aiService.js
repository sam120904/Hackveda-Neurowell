// Mock AI for fallback (when backend is offline)
const generateMockInsight = (vitals) => {
    const { hr, stress, spo2, hrv } = vitals;

    let risk = "Low";
    let insight = "Vitals are within normal range.";
    let recommendation = "Maintain current activity levels.";

    if (stress > 7 || hr > 100) {
        risk = "High";
        insight = "Elevated stress and heart rate detected.";
        recommendation = "Recommend immediate breathing exercises and rest.";
    } else if (stress > 4 || hr > 85) {
        risk = "Medium";
        insight = "Moderate physiological arousal observed.";
        recommendation = "Suggest a short break or mindfulness session.";
    }

    if (spo2 < 95) {
        insight += " SpO2 levels are slightly low.";
        recommendation += " Check sensor placement or take deep breaths.";
    }

    // Simulate network delay
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({
                insight,
                recommendation,
                risk
            });
        }, 1500);
    });
};

export const analyzeVitals = async (vitals) => {
    const API_URL = import.meta.env.VITE_API_GATEWAY_URL;

    // Use mock if no URL configured
    if (!API_URL) {
        console.warn("AWS API Gateway URL not configured. Using Mock AI.");
        return await generateMockInsight(vitals);
    }

    console.log("[AI Service] Sending request to:", API_URL);

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

        const response = await fetch(API_URL, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(vitals),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`AWS API Error: ${response.statusText}`);
        }

        const data = await response.json();
        return data;

    } catch (error) {
        console.warn("AI Analysis API failed or unreachable. Falling back to Mock AI.", error);
        // Fallback to mock data on error
        return await generateMockInsight(vitals);
    }
};
