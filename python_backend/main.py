from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from analytics_engine import calculate_metrics

app = FastAPI(title="IP Analytics Engine")

class AnalyticsRequest(BaseModel):
    portfolio_uri: str
    scenario_parameters: dict

class AnalyticsResponse(BaseModel):
    competitor_overlap: float
    fto_risk: float
    tech_coverage: float
    market_alignment: float
    status: str

@app.post("/analyze", response_model=AnalyticsResponse)
async def analyze_portfolio(request: AnalyticsRequest):
    try:
        # In a full implementation, we'd load the file from objstore:// using portfolio_uri
        metrics = calculate_metrics(request.scenario_parameters)
        return AnalyticsResponse(
            competitor_overlap=metrics["competitor_overlap"],
            fto_risk=metrics["fto_risk"],
            tech_coverage=metrics["tech_coverage"],
            market_alignment=metrics["market_alignment"],
            status="success"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    return {"status": "healthy"}
