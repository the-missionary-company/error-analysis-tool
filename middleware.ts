import { gateEvalDashboardRequest } from './src/lib/evalGate.js';

export const config = {
  matcher: ['/((?!_vercel).*)'],
};

export default async function middleware(request: Request): Promise<Response | undefined> {
  return gateEvalDashboardRequest(request, {
    EVAL_DASHBOARD_PASSWORD: process.env.EVAL_DASHBOARD_PASSWORD,
  });
}
