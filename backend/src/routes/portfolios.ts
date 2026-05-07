import { Router } from "express";
import { createClient } from "@supabase/supabase-js";

export const portfoliosRouter = Router();

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://localhost:8000";

// Fetch all saved portfolios
portfoliosRouter.get("/", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("saved_portfolios")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            return res.status(500).json({ error: error.message });
        }
        res.json(data);
    } catch (err) {
        console.error("Error fetching portfolios:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Analyze a specific portfolio via the Python engine
portfoliosRouter.post("/:id/analyze", async (req, res) => {
    const { id } = req.params;
    const { scenario_parameters = {} } = req.body;

    try {
        // 1. Fetch portfolio details
        const { data: portfolio, error: fetchError } = await supabase
            .from("saved_portfolios")
            .select("*")
            .eq("id", id)
            .single();

        if (fetchError || !portfolio) {
            return res.status(404).json({ error: "Portfolio not found" });
        }

        // 2. Call Python FastAPI Analytics Engine
        const pythonRes = await fetch(`${PYTHON_BACKEND_URL}/analyze`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                portfolio_uri: portfolio.portfolio_uri,
                scenario_parameters
            })
        });

        if (!pythonRes.ok) {
            const errText = await pythonRes.text();
            throw new Error(`Python analytics engine failed: ${errText}`);
        }

        const metrics = await pythonRes.json();

        // 3. Save the results back to Supabase in brand_scenarios
        const scenarioName = `Analysis Run - ${new Date().toISOString()}`;
        const { error: insertError } = await supabase
            .from("brand_scenarios")
            .insert({
                portfolio_id: id,
                scenario_name: scenarioName,
                metrics
            });

        if (insertError) {
            console.error("Failed to save brand scenario:", insertError);
        }

        // Return the analytics result to the frontend
        res.json({
            status: "success",
            scenario_name: scenarioName,
            metrics
        });

    } catch (err: any) {
        console.error("Error analyzing portfolio:", err);
        res.status(500).json({ error: err.message || "Internal server error" });
    }
});
