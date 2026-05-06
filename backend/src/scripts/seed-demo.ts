import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const DEMO_PORTFOLIO_BOOTSTRAP = [
    {
        organisation: "Organisation 1",
        name: "Danone",
        portfolio_uri: "objstore://demo/danone.parquet",
    },
    {
        organisation: "HLK IP",
        name: "Next",
        portfolio_uri: "objstore://demo/next.parquet",
    },
    {
        organisation: "HLK IP",
        name: "Steve Madden",
        portfolio_uri: "objstore://demo/steve_madden.parquet",
    },
];

export async function bootstrapDemoPortfolios() {
    if (!supabaseUrl || !supabaseServiceKey) {
        console.warn("[Seed] Missing Supabase credentials, skipping demo bootstrap.");
        return;
    }

    try {
        const { data: existing, error } = await supabase
            .from("saved_portfolios")
            .select("id")
            .limit(1);

        if (error) {
            console.error("[Seed] Error checking existing portfolios:", error);
            return;
        }

        if (existing && existing.length > 0) {
            console.log("[Seed] Portfolios already exist. Skipping bootstrap.");
            return;
        }

        console.log("[Seed] Bootstrapping demo portfolios...");
        
        for (const demo of DEMO_PORTFOLIO_BOOTSTRAP) {
            const { error: insertError } = await supabase
                .from("saved_portfolios")
                .insert(demo);
                
            if (insertError) {
                console.error(`[Seed] Error inserting ${demo.name}:`, insertError);
            } else {
                console.log(`[Seed] Inserted ${demo.name} portfolio.`);
            }
        }
    } catch (err) {
        console.error("[Seed] Bootstrap exception:", err);
    }
}
